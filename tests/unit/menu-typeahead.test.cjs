const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'menu-typeahead-'));
const output = path.join(directory, 'typeahead.cjs');
buildSync({ entryPoints: [path.join(__dirname, '../../src/behavior/menu-typeahead.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: output });
const { createMenuTypeahead } = require(output);
process.on('exit', () => fs.rmSync(directory, { recursive: true, force: true }));
function setup(overrides = {}) {
  const state = { labels: ['Alpha', 'Beta', 'Bravo', 'Charlie'], activeIndex: 0, open: true, ...overrides };
  let callback;
  let delay;
  const matches = [];
  const activity = [];
  const engine = createMenuTypeahead({ getState: () => state, onMatch: i => { matches.push(i); state.activeIndex = i; }, onTyping: x => activity.push(x),
    timer: { start(ms, fn) { delay = ms; callback = fn; }, clear() { callback = undefined; } } });
  return { state, matches, activity, engine, expire() { const fn = callback; callback = undefined; fn?.(); }, delay: () => delay,
    key(key, modifiers = {}) { const event = { key, ctrlKey: false, metaKey: false, altKey: false, prevented: false, stopped: false,
      preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; }, ...modifiers }; engine.onKeyDown(event); return event; } };
}
test('repeated first letter cycles from current focus and wraps', () => {
  const t = setup(); t.key('b'); t.key('b'); t.key('b');
  assert.deepEqual(t.matches, [1, 2, 1]); assert.equal(t.delay(), 500);
});
test('multi-character prefix preserves the same session start', () => {
  const t = setup(); t.key('b'); t.key('r'); assert.deepEqual(t.matches, [1, 2]);
});
test('timeout starts the next search after fresh current index', () => {
  const t = setup(); t.key('b'); t.expire(); t.state.activeIndex = 2; t.key('b');
  assert.deepEqual(t.matches, [1, 1]); assert.equal(t.activity.includes(false), true);
});
test('unavailable double-letter label does not suppress rapid cycling', () => {
  const t = setup({ labels: ['Alpha', 'Aaron', 'Apricot'], activeIndex: -1, disabledIndices: [1] });
  t.key('a'); t.key('a'); assert.deepEqual(t.matches, [0, 2]);
});
test('available double-letter prefix is matched rather than cycled', () => {
  const t = setup({ labels: ['Alpha', 'Aaron', 'Apricot'], activeIndex: -1 });
  t.key('a'); t.key('a'); assert.deepEqual(t.matches, [0, 1]);
});
test('multi-word prefix consumes space only after typing starts', () => {
  const t = setup({ labels: ['New York', 'New Jersey'], activeIndex: -1 });
  assert.equal(t.key(' ').prevented, false); t.expire();
  for (const key of 'new') t.key(key);
  assert.equal(t.key(' ').prevented, true);
  t.key('j'); assert.equal(t.matches.at(-1), 1);
});
test('blur within composite retains prefix; leaving ends it', () => {
  const t = setup(); t.key('b'); t.engine.onBlur(true); t.key('r'); assert.equal(t.matches.at(-1), 2);
  t.engine.onBlur(false); t.key('c'); assert.equal(t.matches.at(-1), 3);
});
test('open change resets prefix, disabled engine ignores keys', () => {
  const t = setup(); t.key('b'); t.state.open = false; t.engine.sync(); t.state.open = true; t.engine.sync();
  t.key('c'); assert.equal(t.matches.at(-1), 3);
  t.state.enabled = false; t.key('b'); assert.equal(t.matches.at(-1), 3);
});
test('modifier and noncharacter keys do not create matches', () => {
  const t = setup(); t.key('b', { ctrlKey: true }); t.key('ArrowDown'); assert.deepEqual(t.matches, []);
});
test('case-insensitive match does not depend on locale lowercasing', () => {
  const t = setup(); t.key('B'); assert.equal(t.matches[0], 1);
});
test('destroy clears timer and prevents further matches', () => {
  const t = setup(); t.key('b'); t.engine.destroy(); t.expire(); t.key('c'); assert.deepEqual(t.matches, [1]);
});
test('menu matches aria-disabled but skips native-disabled and hidden elements', () => {
  const element = (native = false, visible = true) => ({ isConnected: true,
    ownerDocument: { defaultView: { getComputedStyle: () => ({ visibility: 'visible' }) } },
    checkVisibility: () => visible, matches: () => native,
    getAttribute: () => 'true' });
  const t = setup({ elements: [element(), element(), element(true), element(false, false)] });
  t.key('b'); t.key('b'); assert.deepEqual(t.matches, [1, 1]);
  t.expire(); t.key('c'); assert.deepEqual(t.matches, [1, 1]);
});
