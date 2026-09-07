const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tooltip-port-')), output = path.join(directory, 'tooltip.cjs');
buildSync({ entryPoints: [path.join(__dirname, '../../src/behavior/tooltip.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: output });
const port = require(output);
process.on('exit', () => fs.rmSync(directory, { recursive: true, force: true }));
function timer() { return { callback: null, duration: 0, start(ms, fn) { this.duration = ms; this.callback = fn; }, clear() { this.callback = null; }, fire() { this.callback?.(); } }; }
test('default hover rests600ms; explicit/provider precedence and active group immediate', () => {
  assert.equal(port.getTooltipOpenDelay(), 600);
  assert.equal(port.getTooltipOpenDelay(100, 200), 100);
  assert.equal(port.getTooltipOpenDelay(undefined, 200), 200);
  assert.equal(port.getTooltipOpenDelay(100, 200, true), 0);
});
test('focus opens immediately, Escape blocks same refocus, blur resets and closes', () => {
  const clock = timer(), calls = [], reference = {};
  const controller = port.createTooltipFocus({ timer: clock, requestOpen(open) { calls.push(open); } });
  controller.focus(new Event('focus'), reference, true);
  controller.openChanged('escape-key', reference);
  controller.focus(new Event('focus'), reference, true);
  controller.blur(new Event('blur'), () => ({ relatedTargetMissing: false, activeIsReference: false, activeInsideFloating: false, activeInsideReference: false, movedToFocusGuard: false, nextInsideEnabledTrigger: false }));
  clock.fire(); controller.focus(new Event('focus'), reference, true);
  assert.deepEqual(calls, [true, false, true]);
});
test('rest hover delays and rechecks click-like opening before firing', () => {
  const clock = timer(), state = { open: false, pointerType: 'mouse', restMs: 600, clickLikeOpen: false, blockMouseMove: false, shouldOpen: true };
  let calls = 0;
  const controller = port.createTooltipHoverRest({ getState: () => state, timer: clock, requestOpen() { calls++; } });
  controller.move({ movementX: 2, movementY: 0 }, {}); assert.equal(clock.duration, 600);
  state.clickLikeOpen = true; clock.fire(); assert.equal(calls, 0);
  state.clickLikeOpen = false; controller.move({ movementX: 2, movementY: 0 }, {}); clock.fire();
  assert.equal(calls, 1);
});
