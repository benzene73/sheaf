const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tabs-port-')), output = path.join(directory, 'tabs.cjs');
buildSync({ entryPoints: [path.join(__dirname, '../../src/behavior/tabs.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: output });
const port = require(output);
process.on('exit', () => fs.rmSync(directory, { recursive: true, force: true }));
const item = () => ({ isConnected: true, matches: () => false, hasAttribute: () => false, getAttribute: () => 'true',
  ownerDocument: { defaultView: { getComputedStyle: () => ({ visibility: 'visible' }) } }, checkVisibility: () => true });
test('horizontal tabs reach aria-disabled tab, End and loop; unrelated/modifier arrows ignored', () => {
  const state = { elements: [item(), item(), item()], highlightedIndex: 0 }, seen = [];
  const run = (key, shiftKey = false) => port.runTabsNavigation({ key, shiftKey, stopPropagation() {}, preventDefault() {} }, state,
    { highlight(index) { state.highlightedIndex = index; }, queueFocus(index) { seen.push(index); } });
  run('ArrowRight'); run('End'); run('ArrowRight'); run('ArrowDown'); run('ArrowRight', true);
  assert.deepEqual(seen, [1, 2, 0]);
});
test('manual focus does not select, click does; disabled cannot activate', () => {
  const state = { value: 'reviews', active: false, disabled: false, activateOnFocus: false }, seen = [];
  const controller = port.createTabActivation(() => state, value => seen.push(value));
  controller.focus(new Event('focus')); controller.click(new Event('click'));
  state.disabled = true; controller.click(new Event('click'));
  assert.deepEqual(seen, ['reviews']);
});
test('automatic focus ignores secondary press then recovers on pointer end', () => {
  let calls = 0;
  const controller = port.createTabActivation(() => ({ value: 1, active: false, disabled: false, activateOnFocus: true }), () => calls++);
  controller.pointerDown({ button: 2 }); controller.focus(new Event('focus'));
  controller.pointerEnd(); controller.focus(new Event('focus'));
  assert.equal(calls, 1);
});
test('value callback receives activation direction and can cancel assignment', () => {
  const details = { isCanceled: false, activationDirection: 'none' };
  let assigned = false;
  port.requestTabValue('reviews', details, { computeDirection: () => 'right',
    onValueChange(_value, event) { assert.equal(event.activationDirection, 'right'); event.isCanceled = true; }, assignValue() { assigned = true; } });
  assert.equal(assigned, false);
});
