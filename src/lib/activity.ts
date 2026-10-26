/** Date-only activity statistics. Never pass content entries to the browser. */
export const DEFAULT_ACTIVITY_TIME_ZONE = 'Asia/Shanghai';
// 约半年作为目标，实际范围向左右扩展到完整周，不截断首尾格子。
export const ACTIVITY_DAYS = 180;
const DAY_MS = 86_400_000;

export type ActivityDate = Date | string | number;
export interface ActivityCount {
  date: string;
  works: number;
  moments: number;
}
export interface ActivityDay extends ActivityCount {
  total: number;
  level: number;
  inRange: boolean;
  week: number;
  weekday: number;
}
export interface ActivityCalendar {
  timeZone: string;
  startDate: string;
  endDate: string;
  days: ActivityDay[];
  weeks: ActivityDay[][];
  months: { label: string; column: number }[];
  totals: { works: number; moments: number; total: number; activeDays: number };
}

/** Invalid IANA zones fall back consistently on the server and in the browser. */
export function resolveActivityTimeZone(timeZone = DEFAULT_ACTIVITY_TIME_ZONE): string {
  try {
    return new Intl.DateTimeFormat('en', { timeZone }).resolvedOptions().timeZone;
  } catch {
    return DEFAULT_ACTIVITY_TIME_ZONE;
  }
}

function dateFormatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: resolveActivityTimeZone(timeZone),
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

function formatDate(value: ActivityDate, formatter: Intl.DateTimeFormat): string | null {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = formatter.formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

/** Treat inputs as instants, matching the content schema's z.coerce.date(). */
export function toActivityDate(
  value: ActivityDate,
  timeZone = DEFAULT_ACTIVITY_TIME_ZONE,
): string | null {
  return formatDate(value, dateFormatter(timeZone));
}

/** Serialize only day keys and counts, including known build-time future entries.
 * The calendar filters future days and dates outside its current rolling window.
 */
export function aggregateActivityDates(
  works: readonly ActivityDate[],
  moments: readonly ActivityDate[],
  timeZone = DEFAULT_ACTIVITY_TIME_ZONE,
): ActivityCount[] {
  const formatter = dateFormatter(timeZone);
  const counts = new Map<string, ActivityCount>();
  const add = (values: readonly ActivityDate[], kind: 'works' | 'moments') => {
    for (const value of values) {
      const date = formatDate(value, formatter);
      if (!date) continue;
      const item = counts.get(date) ?? { date, works: 0, moments: 0 };
      item[kind] += 1;
      counts.set(date, item);
    }
  };
  add(works, 'works');
  add(moments, 'moments');
  return [...counts.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Neutral empty cells plus three active intensities: 1, 2, 3+ posts. */
export function activityLevel(total: number): number {
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.min(3, Math.floor(total));
}

function dayNumber(date: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const timestamp = Date.parse(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date) return null;
  return timestamp / DAY_MS;
}

function dayKey(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/** Approximately six months, expanded to complete Sunday–Saturday columns.
 * Earlier days in the first week are real dates and count normally; future cells
 * in the final week stay neutral and never count as published activity.
 * UTC arithmetic on date keys prevents skipped days during DST transitions.
 */
export function buildActivityCalendar(
  counts: readonly ActivityCount[],
  options: { now?: ActivityDate; timeZone?: string } = {},
): ActivityCalendar {
  const timeZone = resolveActivityTimeZone(options.timeZone);
  const endDate = toActivityDate(options.now ?? new Date(), timeZone);
  const end = endDate === null ? null : dayNumber(endDate);
  if (end === null || endDate === null) throw new RangeError('Activity calendar requires a valid current date');
  const targetStart = end - ACTIVITY_DAYS + 1;
  const first = targetStart - new Date(targetStart * DAY_MS).getUTCDay();
  const start = first;
  const startDate = dayKey(start);
  const weekCount = Math.ceil((end - first + 1) / 7);
  const byDate = new Map<string, ActivityCount>();
  const safeCount = (n: number) => Number.isSafeInteger(n) && n > 0 ? n : 0;
  for (const item of counts) {
    const number = dayNumber(item.date);
    if (number === null || number < start || number > end) continue;
    const previous = byDate.get(item.date) ?? { date: item.date, works: 0, moments: 0 };
    previous.works += safeCount(item.works);
    previous.moments += safeCount(item.moments);
    byDate.set(item.date, previous);
  }
  const totals = { works: 0, moments: 0, total: 0, activeDays: 0 };
  const months: ActivityCalendar['months'] = [];
  const days: ActivityDay[] = [];
  for (let index = 0; index < weekCount * 7; index += 1) {
    const number = first + index;
    const date = dayKey(number);
    const inRange = number >= start && number <= end;
    const count = inRange ? byDate.get(date) : undefined;
    const works = count?.works ?? 0;
    const moments = count?.moments ?? 0;
    const total = works + moments;
    const week = Math.floor(index / 7);
    days.push({ date, works, moments, total, level: activityLevel(total), inRange, week, weekday: index % 7 });
    if (inRange) {
      totals.works += works;
      totals.moments += moments;
      totals.total += total;
      if (total > 0) totals.activeDays += 1;
      if (number === start || date.endsWith('-01')) {
        // A very short first month would otherwise overlap the next label.
        if (months.length && week - months[months.length - 1].column < 2) months.pop();
        months.push({ label: `${Number(date.slice(5, 7))}月`, column: week });
      }
    }
  }
  return {
    timeZone, startDate, endDate, days,
    weeks: Array.from({ length: weekCount }, (_, index) => days.slice(index * 7, index * 7 + 7)),
    months, totals,
  };
}

export function describeActivityDay(day: ActivityCount): string {
  return `${day.date}：文章 ${day.works} 篇，动态 ${day.moments} 条，合计 ${day.works + day.moments}`;
}
