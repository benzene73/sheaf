const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'list-navigation-'));
const output = path.join(directory, 'navigation.cjs');
buildSync({ entryPoints: [path.join(__dirname, '../../src/behavior/list-navigation.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: output });
const nav = require(output);
process.on('exit', () => fs.rmSync(directory, { recursive: true, force: true }));

// Algorithm tests use minimal element doubles; browser visibility is covered separately.
function element({ native = false, aria = false, visible = true, visibility = 'visible', display = 'block', fallback = false } = {}) {
  const styles = { visibility, display };
  return {
    isConnected: true,
    ownerDocument: { defaultView: { getComputedStyle: () => styles } },
    ...(fallback ? {} : { checkVisibility: () => visible }),
    matches: () => native,
    hasAttribute: () => native,
    getAttribute: () => aria ? 'true' : null,
  };
}
const list = () => [element(), element({ aria: true }), element()];

test('opening skips disabled endpoints and ArrowUp starts at last even without looping', () => {
  assert.equal(nav.getOpeningListIndex(list(), 'ArrowDown'), 0);
  assert.equal(nav.getOpeningListIndex(list(), 'ArrowUp'), 2);
  assert.equal(nav.getOpeningListIndex([element({ aria: true }), element()], 'ArrowDown'), 1);
});
test('default combobox loop cycles through input in both directions', () => {
  const items = list();
  const step = (currentIndex, key) => nav.navigateList({ list: items, currentIndex, key, allowEscape: true });
  assert.equal(step(0, 'ArrowDown'), 2);
  assert.equal(step(2, 'ArrowDown'), -1);
  assert.equal(step(-1, 'ArrowDown'), 0);
  assert.equal(step(0, 'ArrowUp'), -1);
  assert.equal(step(-1, 'ArrowUp'), 2);
  assert.equal(step(2, 'ArrowUp'), 0);
});
test('no loop clamps both endpoints', () => {
  assert.equal(nav.navigateList({ list: list(), currentIndex: 2, key: 'ArrowDown', loopFocus: false }), 2);
  assert.equal(nav.navigateList({ list: list(), currentIndex: 0, key: 'ArrowUp', loopFocus: false }), 0);
});
test('non-escaping list loops directly to opposite endpoint', () => {
  assert.equal(nav.navigateList({ list: list(), currentIndex: 2, key: 'ArrowDown' }), 0);
  assert.equal(nav.navigateList({ list: list(), currentIndex: 0, key: 'ArrowUp' }), 2);
});
test('Home End are untouched for editable input and used for non-typeable list', () => {
  for (const key of ['Home', 'End']) {
    assert.equal(nav.navigateList({ list: list(), currentIndex: 2, key }), null);
  }
  assert.equal(nav.navigateList({ list: list(), currentIndex: 2, key: 'Home', typeable: false }), 0);
  assert.equal(nav.navigateList({ list: list(), currentIndex: 0, key: 'End', typeable: false }), 2);
});
test('native disabled always skipped; explicit indices allow aria-disabled focus', () => {
  const items = [element({ native: true }), element({ aria: true })];
  assert.equal(nav.isListIndexDisabled(items, 0, []), true);
  assert.equal(nav.isListIndexDisabled(items, 1, []), false);
  assert.equal(nav.isListIndexDisabled(items, 0, () => false), true);
  assert.equal(nav.isListIndexDisabled(items, 1, () => false), false);
  assert.equal(nav.isListIndexDisabled(items, 1), true);
});
test('visibility fallback preserves exact upstream behavior', () => {
  for (const visibility of ['hidden', 'collapse']) assert.equal(nav.isElementVisible(element({ visibility })), false);
  for (const display of ['none', 'contents']) assert.equal(nav.isElementVisible(element({ display, fallback: true })), false);
  assert.equal(nav.isElementVisible(element({ fallback: true })), true);
  assert.equal(nav.isElementVisible(element({ visible: false })), false);
});
test('empty or all-disabled arrow navigation produces no active descendant', () => {
  for (const items of [[], [element({ native: true })]]) {
    for (const key of ['ArrowDown', 'ArrowUp']) {
      assert.equal(nav.navigateList({ list: items, currentIndex: -1, key }), -1);
    }
  }
});
