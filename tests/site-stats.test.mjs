import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateSiteStats,
  classifySiteWork,
  describeSiteStat,
  formatSiteStatPercent,
  siteStatArcPath,
} from '../src/lib/site-stats.ts';

const byKey = (stats, key) => stats.categories.find((category) => category.key === key);
const near = (actual, expected, epsilon = 1e-9) => assert.ok(Math.abs(actual - expected) < epsilon, `${actual} ≈ ${expected}`);
const arcCommands = (path) => [...path.matchAll(/A ([\d.e+-]+) ([\d.e+-]+) 0 ([01]) ([01]) ([\d.e+-]+) ([\d.e+-]+)/g)].map((match) => match.slice(1).map(Number));

test('work classification is mutually exclusive and follows rendering fallbacks', () => {
  assert.equal(classifySiteWork({ type: 'video', images: ['cover'] }), 'video');
  assert.equal(classifySiteWork({ type: 'photo', images: ['one'] }), 'gallery');
  assert.equal(classifySiteWork({ type: 'photo', images: [] }), 'article');
  assert.equal(classifySiteWork({ type: 'photo' }), 'article');
  assert.equal(classifySiteWork({ type: 'article', images: ['inline'] }), 'article');
});

test('moments containing videos or images count only once as moments', () => {
  const stats = aggregateSiteStats([{ type: 'video' }], [
    { video: '/clip.mp4' }, { images: ['photo'], video: '/another.mp4' }, {},
  ]);
  assert.equal(stats.total, 4);
  assert.equal(byKey(stats, 'moment').count, 3);
  assert.equal(byKey(stats, 'video').count, 1);
  assert.equal(byKey(stats, 'article').count, 0);
  assert.equal(byKey(stats, 'gallery').count, 0);
});

test('all collection entries count regardless of date or encryption, but only aggregates are returned', () => {
  const stats = aggregateSiteStats([
    { type: 'article', date: '2001-01-01', password: 'SECRET_PASSWORD', title: 'PRIVATE_TITLE' },
    { type: 'photo', images: ['SECRET_IMAGE'], date: '2099-01-01', body: 'PRIVATE_BODY' },
  ], [{ date: '2099-01-01', body: 'PRIVATE_MOMENT' }]);
  assert.equal(stats.total, 3);
  assert.deepEqual(stats.categories.map(({ key, count }) => ({ key, count })), [
    { key: 'moment', count: 1 }, { key: 'video', count: 0 }, { key: 'article', count: 1 }, { key: 'gallery', count: 1 },
  ]);
  assert.ok(!/SECRET|PRIVATE|password|images|body|title|date/.test(JSON.stringify(stats)));
});

test('category percentages share the whole-site denominator and cover one complete turn', () => {
  const stats = aggregateSiteStats([
    { type: 'video' }, { type: 'article' }, { type: 'photo', images: [] }, { type: 'photo', images: ['one'] },
  ], [{}, {}, {}, {}]);
  assert.equal(stats.total, 8);
  assert.deepEqual(stats.categories.map((category) => category.count), [4, 1, 2, 1]);
  assert.deepEqual(stats.categories.map((category) => category.percent), [50, 12.5, 25, 12.5]);
  assert.deepEqual(stats.categories.map(({ startAngle, endAngle }) => [startAngle, endAngle]), [[0, 180], [180, 225], [225, 315], [315, 360]]);
  assert.equal(stats.categories.reduce((sum, category) => sum + category.count, 0), stats.total);
  near(stats.categories.reduce((sum, category) => sum + category.percent, 0), 100);
});

test('empty input retains four zero-value legends and produces no segment paths', () => {
  const stats = aggregateSiteStats([], []);
  assert.equal(stats.total, 0);
  assert.deepEqual(stats.categories.map((category) => category.key), ['moment', 'video', 'article', 'gallery']);
  assert.deepEqual(stats.categories.map((category) => category.label), ['动态', '视频', '图文', '图集']);
  for (const category of stats.categories) {
    assert.equal(category.count, 0);
    assert.equal(category.percent, 0);
    assert.equal(category.startAngle, 0);
    assert.equal(category.endAngle, 0);
    assert.equal(siteStatArcPath(category.startAngle, category.endAngle), '');
    assert.match(describeSiteStat(category), /0 条，占 0%$/);
  }
  assert.ok(!/NaN|Infinity/.test(JSON.stringify(stats)));
});

test('each possible single-category population yields an entire true hollow ring', () => {
  const examples = [
    ['moment', [], [{}]],
    ['video', [{ type: 'video' }], []],
    ['article', [{ type: 'article' }], []],
    ['gallery', [{ type: 'photo', images: ['one'] }], []],
  ];
  for (const [key, works, moments] of examples) {
    const stats = aggregateSiteStats(works, moments);
    const category = byKey(stats, key);
    assert.equal(category.percent, 100);
    assert.equal(category.startAngle, 0);
    assert.equal(category.endAngle, 360);
    const path = siteStatArcPath(category.startAngle, category.endAngle);
    const arcs = arcCommands(path);
    assert.equal(arcs.length, 4, 'full circle uses two outer and two reversed inner arcs');
    assert.deepEqual(arcs.map((arc) => [arc[0], arc[1], arc[3]]), [[54, 54, 1], [54, 54, 1], [35, 35, 0], [35, 35, 0]]);
    assert.match(path, /^M 64 10 /);
    assert.match(path, / L 64 29 A /, 'joins to inner boundary, never the center');
    assert.match(path, / Z$/);
    assert.equal(stats.categories.filter((item) => siteStatArcPath(item.startAngle, item.endAngle)).length, 1);
  }
});

test('quarter sectors have separate outer and inner boundaries and opposite sweep flags', () => {
  const path = siteStatArcPath(0, 90);
  assert.match(path, /^M 64 10 /);
  const arcs = arcCommands(path);
  assert.equal(arcs.length, 2);
  assert.deepEqual(arcs.map((arc) => arc.slice(0, 4)), [[54, 54, 0, 1], [35, 35, 0, 0]]);
  near(arcs[0][4], 118);
  near(arcs[0][5], 64);
  near(arcs[1][4], 64);
  near(arcs[1][5], 29);
  assert.match(path, / L 99 64 A /);
});

test('sectors over half a turn use large-arc flags and zero sectors never render', () => {
  assert.deepEqual(arcCommands(siteStatArcPath(30, 300)).map((arc) => arc[2]), [1, 1]);
  assert.deepEqual(arcCommands(siteStatArcPath(0, 180)).map((arc) => arc[2]), [0, 0]);
  for (const [start, end] of [[0, 0], [10, 0], [NaN, 1], [0, Infinity], [-Infinity, 1]]) {
    assert.equal(siteStatArcPath(start, end), '');
  }
});

test('segment boundaries touch without overlap or hidden full-circle hit regions', () => {
  const stats = aggregateSiteStats([{ type: 'video' }, { type: 'article' }, { type: 'photo', images: ['one'] }], [{}]);
  for (let index = 0; index < stats.categories.length; index++) {
    const category = stats.categories[index];
    assert.equal(category.endAngle - category.startAngle, 90);
    if (index) assert.equal(category.startAngle, stats.categories[index - 1].endAngle);
    const path = siteStatArcPath(category.startAngle, category.endAngle);
    assert.equal(arcCommands(path).length, 2, 'each segment describes only its own annular sector');
  }
  assert.equal(stats.categories.at(-1).endAngle, 360);
});

test('tiny positive populations keep a nonzero sector and readable small-percentage label', () => {
  const stats = aggregateSiteStats([{ type: 'video' }], Array.from({ length: 10_000 }, () => null));
  const video = byKey(stats, 'video');
  assert.equal(video.count, 1);
  assert.ok(video.percent > 0 && video.percent < 0.1);
  assert.ok(video.endAngle > video.startAngle);
  assert.equal(formatSiteStatPercent(video.percent), '<0.1%');
  const path = siteStatArcPath(video.startAngle, video.endAngle);
  assert.ok(path.length > 0 && !/NaN|Infinity/.test(path));
  assert.equal(arcCommands(path).length, 2);
  const tiny = siteStatArcPath(0, 0.0000001);
  const endpoint = arcCommands(tiny)[0];
  assert.notEqual(endpoint[4], 64, 'positive tiny span is not rounded to zero');
});

test('custom ring geometry scales radii while invalid geometry is rejected', () => {
  const arcs = arcCommands(siteStatArcPath(0, 90, { center: 100, outerRadius: 80, innerRadius: 50 }));
  assert.deepEqual(arcs.map((arc) => arc[0]), [80, 50]);
  near(arcs[0][4], 180);
  near(arcs[0][5], 100);
  for (const options of [{ outerRadius: 10, innerRadius: 20 }, { innerRadius: 0 }, { innerRadius: -1 }, { center: NaN }, { outerRadius: Infinity }]) {
    assert.equal(siteStatArcPath(0, 90, options), '');
  }
});

test('percentage text is concise, finite and preserves tiny nonzero values', () => {
  assert.deepEqual([0, 25, 33.333333, 100, 0.01, NaN, Infinity, -1].map(formatSiteStatPercent),
    ['0%', '25%', '33.3%', '100%', '<0.1%', '0%', '0%', '0%']);
  assert.equal(describeSiteStat({ label: '图文', count: 7, percent: 35 }), '图文：7 条，占 35%');
});

test('aggregation does not mutate works, image arrays or moment objects', () => {
  const works = Object.freeze([
    Object.freeze({ type: 'photo', images: Object.freeze(['one', 'two']) }),
    Object.freeze({ type: 'video', images: Object.freeze([]) }),
  ]);
  const moments = Object.freeze([Object.freeze({ video: 'clip' })]);
  const before = structuredClone({ works, moments });
  const stats = aggregateSiteStats(works, moments);
  assert.equal(stats.total, 3);
  assert.deepEqual({ works, moments }, before);
});
