const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'select-port-'));
const output = path.join(directory, 'select.cjs');
buildSync({ entryPoints: [path.join(__dirname, '../../src/behavior/select.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: output });
const port = require(output);
process.on('exit', () => fs.rmSync(directory, { recursive: true, force: true }));
const flags = { rootDisabled: false, readOnly: false, itemDisabled: false };
function item(disabled = false) {
  return { hasAttribute: () => false, getAttribute: () => disabled ? 'true' : null,
    isConnected: true, ownerDocument: { defaultView: { getComputedStyle: () => ({ visibility: 'visible' }) } },
    checkVisibility: () => true, matches: () => false };
}
test('Select canceled value still requests close with independent details', () => {
  let first;
  const calls = [];
  port.runSelectItemSelection(flags, 'Bravo', new Event('click'), {
    requestValue(value, details) { first = details; details.cancel(); calls.push(value); },
    requestOpen(value, details) { assert.notEqual(details, first); assert.equal(details.isCanceled, false); calls.push(value); },
  });
  assert.deepEqual(calls, ['Bravo', false]);
});
test('Select value callback can cancel assignment', () => {
  let assigned = false;
  port.runSelectItemSelection(flags, 'Bravo', new Event('click'), {
    requestValue(value, details) { port.requestSelectValue(value, details, { onValueChange(_v, d) { d.cancel(); }, assignValue() { assigned = true; } }); },
    requestOpen() {},
  });
  assert.equal(assigned, false);
});
test('readonly/rootdisabled/itemdisabled prevent activation', () => {
  for (const key of Object.keys(flags)) {
    port.runSelectItemSelection({ ...flags, [key]: true }, 'Bravo', new Event('click'), {
      requestValue() { assert.fail('must not select'); }, requestOpen() { assert.fail('must not close'); },
    });
  }
});
test('keyboard opening restores selected index before directional endpoint policy', () => {
  const items = [item(), item(true), item(), item()];
  assert.equal(port.getSelectOpeningIndex(items, 2, 'ArrowDown'), 2);
  assert.equal(port.getSelectOpeningIndex(items, 2, 'ArrowUp'), 2);
  assert.equal(port.getSelectOpeningIndex(items, null, 'ArrowUp'), 3);
});
test('Space during typeahead marks active item and prevents button activation', () => {
  const calls = [];
  port.runSelectItemKey(2, { key: ' ', preventDefault() { calls.push('prevent'); } }, true, i => calls.push(i));
  assert.deepEqual(calls, [2, 'prevent']);
});
function setup(overrides = {}) {
  const state = { labels: ['Alpha', 'Beta', 'Bravo', 'Charlie'], values: ['a', 'b', 'br', 'c'],
    elements: [item(), item(true), item(), item()], activeIndex: null, selectedIndex: 0,
    open: false, disabled: false, readOnly: false, ...overrides };
  const calls = []; let delay;
  const engine = port.createSelectTypeahead({ getState: () => state,
    setActiveIndex(i) { state.activeIndex = i; calls.push(['highlight', i]); },
    requestValue(v, d) { calls.push(['value', v, d.reason]); }, timer: { start(ms) { delay = ms; }, clear() {} } });
  return { state, calls, delay: () => delay, key(key) { engine.onKeyDown({ key, ctrlKey: false, metaKey: false, altKey: false, preventDefault() {}, stopPropagation() {} }); } };
}
test('closed typeahead skips aria-disabled then commits without opening', () => {
  const t = setup(); t.key('b'); assert.deepEqual(t.calls, [['value', 'br', 'none']]); assert.equal(t.state.open, false); assert.equal(t.delay(), 750);
});
test('open typeahead highlights enabled match and never commits', () => {
  const t = setup({ open: true }); t.key('b'); assert.deepEqual(t.calls, [['highlight', 2]]);
});
test('readOnly closed typing is inert but open typing can browse', () => {
  const closed = setup({ readOnly: true }); closed.key('b'); assert.deepEqual(closed.calls, []);
  const open = setup({ readOnly: true, open: true }); open.key('b'); assert.deepEqual(open.calls, [['highlight', 2]]);
});
test('hidden force-mounted items remain available to closed typeahead', () => {
  const hidden = item(); hidden.checkVisibility = () => false;
  const t = setup({ elements: [item(), item(true), hidden, item()] }); t.key('b');
  assert.deepEqual(t.calls, [['value', 'br', 'none']]);
});
test('missing element is disabled for Select typeahead', () => {
  const t = setup({ elements: [item(), item(true), null, item()] }); t.key('b'); assert.deepEqual(t.calls, []);
});
