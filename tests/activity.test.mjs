import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIVITY_DAYS,
  DEFAULT_ACTIVITY_TIME_ZONE,
  activityLevel,
  aggregateActivityDates,
  buildActivityCalendar,
  describeActivityDay,
  resolveActivityTimeZone,
  toActivityDate,
} from '../src/lib/activity.ts';

const calendarAt = (now, counts = [], timeZone = 'Asia/Shanghai') =>
  buildActivityCalendar(counts, { now, timeZone });
const visible = (calendar) => calendar.days.filter((day) => day.inRange);
const DAY_MS = 86_400_000;
const dayOffset = (date, offset) => new Date(Date.parse(`${date}T00:00:00Z`) + offset * DAY_MS).toISOString().slice(0, 10);

function assertContinuousDates(days) {
  assert.equal(new Set(days.map((day) => day.date)).size, days.length, 'each civil day occurs once');
  for (let index = 1; index < days.length; index++) {
    assert.equal(Date.parse(days[index].date) - Date.parse(days[index - 1].date), DAY_MS);
  }
}

function assertCompleteWeeks(calendar) {
  assert.ok(calendar.weeks.length === 26 || calendar.weeks.length === 27);
  assert.equal(calendar.days.length, calendar.weeks.length * 7);
  assert.equal(calendar.days[0].date, calendar.startDate);
  assert.equal(calendar.days[0].weekday, 0);
  assert.equal(calendar.days.at(-1).weekday, 6);
  assert.ok(calendar.days[0].inRange, 'first-week extension is a real historical date, not a blank');
  assert.deepEqual(calendar.weeks.flat(), calendar.days);
  assertContinuousDates(calendar.days);
  for (const [weekIndex, week] of calendar.weeks.entries()) {
    assert.equal(week.length, 7);
    for (const [weekday, day] of week.entries()) {
      assert.equal(day.week, weekIndex);
      assert.equal(day.weekday, weekday);
      assert.equal(new Date(`${day.date}T00:00:00Z`).getUTCDay(), weekday);
      assert.equal(day.inRange, day.date <= calendar.endDate);
    }
  }
  const history = visible(calendar);
  assert.ok(history.length >= 180 && history.length <= 186);
  assert.equal(history.at(-1).date, calendar.endDate);
  const future = calendar.days.filter((day) => !day.inRange);
  assert.ok(future.length <= 6);
  assert.ok(future.every((day) => day.date > calendar.endDate && day.works === 0 && day.moments === 0 && day.total === 0 && day.level === 0));
}

test('empty half-year calendar expands to a full Sunday–Saturday rectangle', () => {
  const calendar = calendarAt('2026-10-25T12:00:00Z');
  assert.equal(ACTIVITY_DAYS, 180);
  assert.equal(calendar.startDate, '2026-04-26');
  assert.equal(calendar.endDate, '2026-10-25');
  assert.equal(calendar.days.length, 189);
  assert.equal(calendar.weeks.length, 27);
  assert.equal(visible(calendar).length, 183);
  assert.equal(calendar.days.filter((day) => !day.inRange).length, 6);
  assert.deepEqual(calendar.totals, { works: 0, moments: 0, total: 0, activeDays: 0 });
  assert.ok(calendar.days.every((day) => day.total === 0 && day.level === 0));
  assertCompleteWeeks(calendar);
});

test('all seven target-start weekdays have complete columns and count all historical extension days', () => {
  const columnCounts = new Set();
  const targetWeekdays = new Set();
  const extensionCounts = new Set();
  for (let date = 1; date <= 7; date++) {
    const now = `2026-11-0${date}T12:00:00Z`;
    const today = `2026-11-0${date}`;
    const targetStart = dayOffset(today, -179);
    const weekday = new Date(`${targetStart}T00:00:00Z`).getUTCDay();
    const first = dayOffset(targetStart, -weekday);
    // Include posts on every historical and future displayed day; only history counts.
    const counts = Array.from({ length: 189 }, (_, index) => ({ date: dayOffset(first, index), works: 1, moments: 0 }));
    const calendar = calendarAt(now, counts);
    targetWeekdays.add(weekday);
    extensionCounts.add(visible(calendar).length - 180);
    columnCounts.add(calendar.weeks.length);
    assert.equal(calendar.startDate, first);
    assert.equal(visible(calendar).length, 180 + weekday);
    assert.equal(calendar.totals.works, 180 + weekday);
    assert.equal(calendar.totals.total, visible(calendar).length);
    assert.equal(calendar.totals.activeDays, visible(calendar).length);
    assert.ok(visible(calendar).every((day) => day.works === 1 && day.total === 1 && day.level === 1));
    assertCompleteWeeks(calendar);
  }
  assert.deepEqual([...columnCounts].sort(), [26, 27]);
  assert.deepEqual([...targetWeekdays].sort(), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual([...extensionCounts].sort(), [0, 1, 2, 3, 4, 5, 6]);
});

test('articles and moments on the same civil day combine without exposing metadata', () => {
  const counts = aggregateActivityDates([
    new Date('2026-01-01T15:59:59Z'), '2026-01-01T16:00:00Z',
    '2026-01-02T02:00:00Z', new Date('invalid'),
  ], ['2026-01-01T19:00:00Z', 'not a date']);
  assert.deepEqual(counts, [
    { date: '2026-01-01', works: 1, moments: 0 },
    { date: '2026-01-02', works: 2, moments: 1 },
  ]);
  assert.ok(counts.every((count) => Object.keys(count).sort().join() === 'date,moments,works'));
  const calendar = calendarAt('2026-01-02T04:00:00Z', counts);
  assert.deepEqual(calendar.totals, { works: 3, moments: 1, total: 4, activeDays: 2 });
  assert.equal(calendar.days.find((day) => day.date === '2026-01-02').level, 3);
});

test('today and posting dates use the selected timezone, not host timezone', () => {
  const instant = '2026-01-01T16:30:00Z';
  assert.equal(toActivityDate(instant), '2026-01-02');
  assert.equal(toActivityDate(instant, 'America/Los_Angeles'), '2026-01-01');
  assert.equal(toActivityDate('2026-01-01T18:30:00Z', 'Asia/Kathmandu'), '2026-01-02');
  assert.equal(calendarAt(instant).endDate, '2026-01-02');
  assert.equal(calendarAt(instant, [], 'America/Los_Angeles').endDate, '2026-01-01');
  assert.deepEqual(aggregateActivityDates([instant], [], 'America/Los_Angeles'), [
    { date: '2026-01-01', works: 1, moments: 0 },
  ]);
});

test('week-aligned window includes both endpoints and excludes dates outside the rectangle or in the future', () => {
  const calendar = calendarAt('2026-01-01T04:00:00Z', [
    { date: '2025-07-05', works: 100, moments: 100 },
    { date: '2025-07-06', works: 2, moments: 1 },
    { date: '2026-01-01', works: 3, moments: 4 },
    { date: '2026-01-02', works: 100, moments: 100 },
    { date: '2026-01-03', works: 100, moments: 100 },
    { date: '2026-12-31', works: 100, moments: 100 },
  ]);
  assert.equal(calendar.startDate, '2025-07-06');
  assert.equal(calendar.endDate, '2026-01-01');
  assert.equal(calendar.days.at(-1).date, '2026-01-03');
  assert.deepEqual(calendar.totals, { works: 5, moments: 5, total: 10, activeDays: 2 });
  assertCompleteWeeks(calendar);
});

test('left extension days before the nominal 180-day start contribute actual counts', () => {
  const calendar = calendarAt('2026-10-25T04:00:00Z', [
    { date: '2026-04-25', works: 100, moments: 100 },
    { date: '2026-04-26', works: 2, moments: 1 },
    { date: '2026-04-27', works: 1, moments: 0 },
    { date: '2026-04-28', works: 0, moments: 2 },
    { date: '2026-04-29', works: 3, moments: 0 },
    { date: '2026-10-25', works: 1, moments: 1 },
    ...Array.from({ length: 6 }, (_, index) => ({ date: dayOffset('2026-10-26', index), works: 100, moments: 100 })),
    { date: '2026-11-01', works: 100, moments: 100 },
  ]);
  assert.equal(dayOffset(calendar.endDate, -179), '2026-04-29');
  assert.equal(calendar.startDate, '2026-04-26');
  assert.deepEqual(calendar.totals, { works: 7, moments: 4, total: 11, activeDays: 5 });
  assert.deepEqual(calendar.days.slice(0, 4).map((day) => [day.date, day.total, day.inRange]), [
    ['2026-04-26', 3, true], ['2026-04-27', 1, true], ['2026-04-28', 2, true], ['2026-04-29', 3, true],
  ]);
  assert.equal(calendar.days.at(-1).date, '2026-10-31');
  assertCompleteWeeks(calendar);
});

test('leap years retain the leap day once while expanding the target to complete weeks', () => {
  const leap = calendarAt('2024-03-01T04:00:00Z');
  assert.equal(leap.startDate, '2023-09-03');
  assert.equal(visible(leap).length, 181);
  assert.equal(visible(leap).filter((day) => day.date === '2024-02-29').length, 1);
  const regular = calendarAt('2025-03-01T04:00:00Z');
  assert.equal(regular.startDate, '2024-09-01');
  assert.equal(visible(regular).length, 182);
  assertCompleteWeeks(leap);
  assertCompleteWeeks(regular);
});

test('DST transitions do not skip or duplicate civil dates in historical or future cells', () => {
  for (const now of ['2026-03-09T04:30:00Z', '2026-11-02T05:30:00Z']) {
    const calendar = calendarAt(now, [], 'America/New_York');
    assertContinuousDates(visible(calendar));
    assertCompleteWeeks(calendar);
    const transitionDate = now.startsWith('2026-03') ? '2026-03-08' : '2026-11-01';
    assert.equal(visible(calendar).filter((day) => day.date === transitionDate).length, 1);
  }
});

test('rolling to a new day admits known content even when the week-aligned start stays unchanged', () => {
  const counts = aggregateActivityDates(['2026-12-31T18:00:00Z'], []);
  const before = calendarAt('2026-12-31T12:00:00Z', counts);
  const after = calendarAt('2026-12-31T18:00:00Z', counts);
  assert.equal(before.endDate, '2026-12-31');
  assert.equal(before.totals.total, 0);
  assert.equal(before.days.find((day) => day.date === '2027-01-01').inRange, false);
  assert.equal(after.endDate, '2027-01-01');
  assert.equal(after.totals.total, 1);
  assert.equal(after.days.find((day) => day.date === '2027-01-01').inRange, true);
  assert.equal(before.startDate, '2026-07-05');
  assert.equal(after.startDate, before.startDate);
  assert.equal(visible(after).length, visible(before).length + 1);
  assertCompleteWeeks(before);
  assertCompleteWeeks(after);
});

test('rolling past a target-week boundary advances the start by seven days and drops old-week counts', () => {
  const counts = [{ date: '2026-07-05', works: 2, moments: 1 }];
  const before = calendarAt('2027-01-06T04:00:00Z', counts);
  const after = calendarAt('2027-01-07T04:00:00Z', counts);
  assert.equal(before.startDate, '2026-07-05');
  assert.equal(after.startDate, '2026-07-12');
  assert.equal(before.totals.total, 3);
  assert.equal(after.totals.total, 0);
  assert.ok(!after.days.some((day) => day.date === '2026-07-05'));
  assertCompleteWeeks(before);
  assertCompleteWeeks(after);
});

test('invalid timezone falls back consistently and invalid current date fails explicitly', () => {
  assert.equal(resolveActivityTimeZone('not/a-zone'), DEFAULT_ACTIVITY_TIME_ZONE);
  assert.equal(toActivityDate('invalid'), null);
  assert.equal(toActivityDate('2026-01-01T16:00:00Z', 'not/a-zone'), '2026-01-02');
  assert.equal(calendarAt('2026-01-01T16:00:00Z', [], 'not/a-zone').timeZone, DEFAULT_ACTIVITY_TIME_ZONE);
  assert.throws(() => calendarAt('invalid'), RangeError);
});

test('only valid dates and integer counts contribute; duplicate days combine without mutation', () => {
  const counts = [
    { date: '2026-02-30', works: 20, moments: 20 },
    { date: '2026-2-03', works: 20, moments: 20 },
    { date: '2026-02-03', works: 2, moments: -1 },
    { date: '2026-02-03', works: 1, moments: 2 },
    { date: '2026-02-04', works: NaN, moments: 0.5 },
    { date: '2026-02-05', works: Infinity, moments: Number.MAX_SAFE_INTEGER + 1 },
  ];
  const snapshot = structuredClone(counts);
  const calendar = calendarAt('2026-03-01T04:00:00Z', counts);
  assert.deepEqual(calendar.totals, { works: 3, moments: 2, total: 5, activeDays: 1 });
  assert.equal(calendar.days.filter((day) => day.date === '2026-02-03').length, 1);
  assert.deepEqual(counts, snapshot);
});

test('daily levels use individual day totals, with three active bins rather than weekly sums', () => {
  const calendar = calendarAt('2026-01-10T04:00:00Z', [
    { date: '2026-01-04', works: 1, moments: 0 },
    { date: '2026-01-05', works: 1, moments: 1 },
    { date: '2026-01-06', works: 2, moments: 1 },
    { date: '2026-01-07', works: 3, moments: 1 },
  ]);
  assert.deepEqual(calendar.days.filter((day) => day.date >= '2026-01-04' && day.date <= '2026-01-08').map((day) => day.level), [1, 2, 3, 3, 0]);
});

test('intensity bins are 0, 1, 2, 3+ and invalid or nonpositive totals are neutral', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 50].map(activityLevel), [0, 1, 2, 3, 3, 3]);
  assert.deepEqual([NaN, Infinity, -Infinity, -10, -1, -0].map(activityLevel), [0, 0, 0, 0, 0, 0]);
  assert.equal(describeActivityDay({ date: '2026-10-25', works: 4, moments: 2 }), '2026-10-25：文章 4 篇，动态 2 条，合计 6');
});

test('necessary month marks remain inside the shorter calendar without overlapping', () => {
  const calendar = calendarAt('2026-02-01T04:00:00Z');
  assert.ok(calendar.months.length >= 6 && calendar.months.length <= 7);
  for (const [index, month] of calendar.months.entries()) {
    assert.match(month.label, /^(?:[1-9]|1[0-2])月$/);
    assert.ok(month.column >= 0 && month.column < calendar.weeks.length);
    if (index) assert.ok(month.column - calendar.months[index - 1].column >= 2);
  }
});
