import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { site } from '../src/config/site.ts';
import {
  resolveSiteIdentity,
  formatPageTitle,
  absoluteAssetUrl,
  buildSiteInfo,
} from '../src/lib/site-identity.ts';

const config = (overrides = {}) => ({
  name: '光影手记',
  logo: '/images/logo.png',
  user: { name: '小光', avatar: '/images/portrait.jpg' },
  description: '记录光与影的对白',
  ...overrides,
});

test('site configuration has one identity source and no legacy aliases', () => {
  assert.equal(typeof site.name, 'string');
  assert.equal(typeof site.logo, 'string');
  assert.deepEqual(Object.keys(site.user).sort(), ['avatar', 'name']);
  assert.ok(!('title' in site) && !('brand' in site));
  assert.ok(!('name' in site.profile) && !('avatar' in site.profile));
  assert.ok(!('siteInfo' in site.friendsInfo));
  assert.ok(Array.isArray(site.friendsInfo.extraInfo));
});

test('view code cannot reintroduce legacy identity fields or a hard-coded default avatar', () => {
  const files = ['layouts/BaseLayout.astro', 'pages/about.astro', 'pages/friends.astro', 'pages/index.astro',
    'pages/archive.astro', 'pages/categories.astro', 'pages/moments.astro', 'pages/works/[...slug].astro'];
  for (const file of files) {
    const source = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /site\.(?:title|brand)\b|site\.profile\.(?:name|avatar)\b|friendsInfo\.siteInfo/, file);
    assert.ok(!source.includes('/avatar.svg'), `${file} must read configured image paths`);
    assert.doesNotMatch(source, /<link[^>]*rel="icon"[^>]*type="image\/svg\+xml"/, file);
  }
});

test('explicit user identity wins without replacing the independent site identity', () => {
  assert.deepEqual(resolveSiteIdentity(config()), {
    name: '光影手记', logo: '/images/logo.png',
    user: { name: '小光', avatar: '/images/portrait.jpg' },
  });
});

test('empty user name and avatar fall back to the site name and logo', () => {
  assert.deepEqual(resolveSiteIdentity(config({ user: { name: '', avatar: '' } })), {
    name: '光影手记', logo: '/images/logo.png',
    user: { name: '光影手记', avatar: '/images/logo.png' },
  });
});

test('name and avatar fallbacks operate independently', () => {
  const named = resolveSiteIdentity(config({ user: { name: '摄影师', avatar: '' } }));
  assert.deepEqual(named.user, { name: '摄影师', avatar: '/images/logo.png' });
  const pictured = resolveSiteIdentity(config({ user: { name: '', avatar: '/custom.webp' } }));
  assert.deepEqual(pictured.user, { name: '光影手记', avatar: '/custom.webp' });
  assert.equal(resolveSiteIdentity(config({ logo: '' })).user.avatar, '/images/portrait.jpg');
});

test('two empty images stay empty so views can use the final display-name initial', () => {
  const named = resolveSiteIdentity(config({ logo: '', user: { name: '小光', avatar: '' } }));
  assert.equal(named.logo, '');
  assert.equal(named.user.avatar, '');
  assert.equal(named.user.name, '小光');
  assert.equal(named.user.name.slice(0, 1), '小');
  const fallback = resolveSiteIdentity(config({ logo: '', user: { name: '', avatar: '' } }));
  assert.equal(fallback.user.avatar, '');
  assert.equal(fallback.user.name, '光影手记');
  assert.equal(fallback.user.name.slice(0, 1), '光');
});

test('all four identity values are trimmed before priority and empty-value checks', () => {
  const identity = resolveSiteIdentity(config({
    name: '  光影手记\n', logo: ' /logo.svg  ',
    user: { name: '\t小光 ', avatar: ' https://cdn.example.com/avatar.png \n' },
  }));
  assert.deepEqual(identity, {
    name: '光影手记', logo: '/logo.svg',
    user: { name: '小光', avatar: 'https://cdn.example.com/avatar.png' },
  });
  const blanks = resolveSiteIdentity(config({
    name: '  光影手记 ', logo: ' /logo.png ', user: { name: ' \t\n', avatar: ' \n ' },
  }));
  assert.deepEqual(blanks.user, { name: '光影手记', avatar: '/logo.png' });
  assert.equal(resolveSiteIdentity(config({ logo: '\n ', user: { name: ' 小光 ', avatar: '\t' } })).user.avatar, '');
});

test('a blank site name fails even when an explicit user name exists', () => {
  for (const name of ['', ' ', '\n\t']) {
    assert.throws(() => resolveSiteIdentity(config({ name })), /site\.name 不能为空/);
    assert.throws(() => buildSiteInfo(config({ name }), 'https://example.com/'), /site\.name 不能为空/);
  }
});

test('page titles default to the site name and append it exactly once', () => {
  const name = resolveSiteIdentity(config()).name;
  for (const title of [undefined, '', ' \n\t ', name, ` ${name} `]) {
    assert.equal(formatPageTitle(title, name), name);
  }
  assert.equal(formatPageTitle('关于', name), '关于 · 光影手记');
  assert.equal(formatPageTitle('  动态 \n', name), '动态 · 光影手记');
  assert.equal(formatPageTitle(' 关于 · 光影手记 ', name), '关于 · 光影手记');
  const once = formatPageTitle('归档', name);
  assert.equal(formatPageTitle(once, name), once);
  assert.equal(formatPageTitle('光影手记的故事', name), '光影手记的故事 · 光影手记');
  assert.equal(formatPageTitle('光影手记 · 关于', name), '光影手记 · 关于 · 光影手记');
});

test('site names containing the separator still produce idempotent page titles', () => {
  const name = '光影 · 手记';
  const title = formatPageTitle('文章', name);
  assert.equal(title, '文章 · 光影 · 手记');
  assert.equal(formatPageTitle(title, name), title);
  assert.equal(formatPageTitle(name, name), name);
});

test('asset URLs handle root-relative, path-relative, external and non-SVG assets', () => {
  assert.equal(absoluteAssetUrl('/images/logo.png', 'https://example.com/blog/'), 'https://example.com/images/logo.png');
  assert.equal(absoluteAssetUrl('images/logo.jpg', 'https://example.com/blog/'), 'https://example.com/blog/images/logo.jpg');
  assert.equal(absoluteAssetUrl(' /logo.svg ', ' https://example.com/ '), 'https://example.com/logo.svg');
  assert.equal(absoluteAssetUrl('https://cdn.example.com/logo.webp', 'https://example.com/'), 'https://cdn.example.com/logo.webp');
  assert.equal(absoluteAssetUrl('//cdn.example.com/logo.png', 'https://example.com/'), 'https://cdn.example.com/logo.png');
  assert.equal(absoluteAssetUrl('https://cdn.example.com/logo.png'), 'https://cdn.example.com/logo.png');
});

test('empty assets never resolve to the site URL, and absent or invalid bases preserve trimmed paths', () => {
  for (const asset of ['', ' ', '\n\t']) {
    assert.equal(absoluteAssetUrl(asset, 'https://example.com/'), '');
    assert.equal(absoluteAssetUrl(asset), '');
  }
  assert.equal(absoluteAssetUrl(' /logo.png '), '/logo.png');
  assert.equal(absoluteAssetUrl(' images/logo.png ', '   '), 'images/logo.png');
  assert.equal(absoluteAssetUrl('/logo.png', 'not a valid URL'), '/logo.png');
});

test('friend exchange rows derive from the site identity, description and canonical URL', () => {
  const rows = buildSiteInfo(config({
    name: ' 光影手记 ', logo: ' /logo.png ', user: { name: '作者而非站名', avatar: '/author.jpg' },
  }), ' https://example.com/ ');
  assert.deepEqual(rows, [
    { label: '名称', value: '光影手记' },
    { label: '网址', value: 'https://example.com' },
    { label: 'Logo', value: 'https://example.com/logo.png' },
    { label: '描述', value: '记录光与影的对白' },
  ]);
  assert.equal(buildSiteInfo(config({ logo: 'logos/site.svg' }), 'https://example.com/blog/')[2].value, 'https://example.com/blog/logos/site.svg');
});

test('friend exchange empty logo and canonical URL remain empty without avatar substitution', () => {
  const rows = buildSiteInfo(config({ logo: ' ', description: '' }), '  ');
  assert.deepEqual(rows, [
    { label: '名称', value: '光影手记' },
    { label: '网址', value: '' },
    { label: 'Logo', value: '' },
    { label: '描述', value: '' },
  ]);
  assert.equal(buildSiteInfo(config({ logo: '' }), 'https://example.com/')[2].value, '');
  assert.equal(buildSiteInfo(config({ logo: 'https://cdn.example.com/icon.png' }), 'https://example.com/')[2].value, 'https://cdn.example.com/icon.png');
});

test('extra friend rows append in order, never replace the four built-in rows', () => {
  const extra = [
    { label: '联系', value: 'hello@example.com' },
    { label: '名称', value: '这只是附加行' },
  ];
  const rows = buildSiteInfo(config(), 'https://example.com/', extra);
  assert.equal(rows.length, 6);
  assert.deepEqual(rows.slice(0, 4).map((row) => row.label), ['名称', '网址', 'Logo', '描述']);
  assert.equal(rows[0].value, '光影手记');
  assert.deepEqual(rows.slice(4), extra);
  assert.notEqual(rows[4], extra[0]);
  assert.notEqual(rows[5], extra[1]);
});

test('identity and friend-row generation do not mutate frozen configuration or extra rows', () => {
  const input = Object.freeze(config({ user: Object.freeze({ name: ' 小光 ', avatar: '' }) }));
  const extra = Object.freeze([Object.freeze({ label: '联系', value: 'hello@example.com' })]);
  const before = structuredClone({ input, extra });
  const identity = resolveSiteIdentity(input);
  const rows = buildSiteInfo(input, 'https://example.com/', extra);
  assert.notEqual(identity.user, input.user);
  identity.user.name = 'changed';
  rows[4].value = 'changed';
  assert.deepEqual({ input, extra }, before);
  assert.equal(resolveSiteIdentity(input).user.name, '小光');
  assert.equal(buildSiteInfo(input, 'https://example.com/', extra)[4].value, 'hello@example.com');
});
