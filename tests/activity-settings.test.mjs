import test from 'node:test';
import assert from 'node:assert/strict';
import { initActivitySettings } from '../src/scripts/activity-settings.js';

const KEY = 'lightaria-activity';

function fixture({ enabled = true, preference, calendars = 1, storageError = false } = {}) {
  const data = new Map(preference === undefined ? [] : [[KEY, preference]]);
  const listeners = new Map();
  const emitted = [];
  const storage = {
    getItem(key) { return data.get(key) ?? null; },
    setItem(key, value) { data.set(key, value); },
  };
  const buttons = ['on', 'off'].map((value) => {
    const classes = new Set();
    const handlers = new Map();
    return {
      dataset: { activity: value },
      attributes: {},
      classList: { toggle(name, active) { active ? classes.add(name) : classes.delete(name); } },
      setAttribute(name, state) { this.attributes[name] = state; },
      addEventListener(type, listener) { handlers.set(type, listener); },
      click() { handlers.get('click')(); },
      isActive() { return classes.has('layout-opt--active'); },
    };
  });
  const heatmaps = Array.from({ length: calendars }, () => ({ hidden: !enabled }));
  const doc = {
    body: { dataset: { defaultActivity: String(enabled) } },
    documentElement: { dataset: {} },
    querySelectorAll(selector) {
      if (selector === 'button[data-activity]') return buttons;
      if (selector === '[data-activity-heatmap]') return heatmaps;
      throw new Error(`Unexpected selector: ${selector}`);
    },
  };
  const win = {
    get localStorage() { if (storageError) throw new Error('Storage disabled'); return storage; },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    addEventListener(type, listener) { listeners.set(type, listener); },
    dispatchEvent(event) { emitted.push(event); },
  };
  initActivitySettings(doc, win);
  return { doc, win, buttons, heatmaps, data, emitted, storage,
    storageEvent(event) { listeners.get('storage')(event); } };
}

function assertEnabled(f, enabled) {
  assert.equal(f.doc.documentElement.dataset.activity, enabled ? 'on' : 'off');
  f.heatmaps.forEach((heatmap) => assert.equal(heatmap.hidden, !enabled));
  assert.equal(f.buttons[0].attributes['aria-pressed'], String(enabled));
  assert.equal(f.buttons[1].attributes['aria-pressed'], String(!enabled));
  assert.equal(f.buttons[0].isActive(), enabled);
  assert.equal(f.buttons[1].isActive(), !enabled);
  assert.equal(f.emitted.at(-1).type, 'lightaria:activity');
  assert.equal(f.emitted.at(-1).detail, enabled);
}

test('uses enabled site default without writing storage during initialization', () => {
  const f = fixture();
  assertEnabled(f, true);
  assert.equal(f.data.has(KEY), false);
});

test('uses disabled site default and lets saved on preference override it', () => {
  assertEnabled(fixture({ enabled: false }), false);
  assertEnabled(fixture({ enabled: false, preference: 'on' }), true);
});

test('restores saved off preference for every heatmap', () => {
  assertEnabled(fixture({ preference: 'off', calendars: 2 }), false);
});

test('clicks update visibility, accessible button state and persisted preference', () => {
  const f = fixture();
  f.buttons[1].click();
  assertEnabled(f, false);
  assert.equal(f.data.get(KEY), 'off');
  assertEnabled(fixture({ preference: f.data.get(KEY) }), false);
  f.buttons[0].click();
  assertEnabled(f, true);
  assert.equal(f.data.get(KEY), 'on');
});

test('invalid preference falls back to site default', () => {
  assertEnabled(fixture({ enabled: false, preference: 'not-a-valid-value' }), false);
});

test('storage access denied still allows toggling in the current page', () => {
  const f = fixture({ storageError: true });
  assertEnabled(f, true);
  assert.doesNotThrow(() => f.buttons[1].click());
  assertEnabled(f, false);
  assert.doesNotThrow(() => f.buttons[0].click());
  assertEnabled(f, true);
});

test('setting can be saved on a page that has no heatmap', () => {
  const f = fixture({ calendars: 0 });
  f.buttons[1].click();
  assertEnabled(f, false);
  assert.equal(f.data.get(KEY), 'off');
});

test('cross-tab localStorage changes and clear restore the current preference', () => {
  const f = fixture();
  f.data.set(KEY, 'off');
  f.storageEvent({ key: KEY, storageArea: f.storage });
  assertEnabled(f, false);
  f.data.clear();
  f.storageEvent({ key: null, storageArea: f.storage });
  assertEnabled(f, true);
});

test('unrelated storage keys and sessionStorage events are ignored', () => {
  const f = fixture();
  f.data.set(KEY, 'off');
  f.storageEvent({ key: 'another-key', storageArea: f.storage });
  assertEnabled(f, true);
  f.storageEvent({ key: KEY, storageArea: {} });
  assertEnabled(f, true);
});

test('storage event cannot throw when localStorage is unavailable', () => {
  const f = fixture({ storageError: true });
  assert.doesNotThrow(() => f.storageEvent({ key: KEY, storageArea: {} }));
  assertEnabled(f, true);
});
