import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');

function declarations(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]+)\\}`));
  assert.ok(rule, `Missing rule: ${selector}`);
  return rule[1];
}

for (const selector of ['.tag-panel', '.settings-panel']) {
  test(`${selector} uses global glass blur for standard and WebKit properties`, () => {
    const rule = declarations(selector);
    for (const property of ['-webkit-backdrop-filter', 'backdrop-filter']) {
      const value = rule.match(new RegExp(`(?:^|\\n)\\s*${property}\\s*:\\s*([^;]+);`))?.[1];
      assert.equal(value, 'blur(var(--lg-blur)) saturate(160%)');
    }
    assert.doesNotMatch(rule, /blur\(\d+px\)/, 'Popup blur must never be pinned to a fixed pixel value');
  });
}
