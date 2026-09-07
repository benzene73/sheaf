const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dialog-port-'));
const bundle = file => {
  const output = path.join(directory, file + '.cjs');
  buildSync({ entryPoints: [path.join(__dirname, '../../src/behavior/' + file + '.ts')], nodePaths: require.resolve.paths('@floating-ui/utils'), bundle: true, platform: 'node', format: 'cjs', outfile: output });
  return require(output);
};
const port = bundle('dialog');
const { createChangeEventDetails } = bundle('combobox-input');
process.on('exit', () => fs.rmSync(directory, { recursive: true, force: true }));

test('Dialog default modality and pointer dismissal do not disable Escape', () => {
  assert.deepEqual(port.getDialogConfiguration(true), { trapFocus: true, lockScroll: true, closeOnFocusOut: true, escapeKey: true });
  assert.deepEqual(port.getDialogConfiguration(true, 'trap-focus', true, 1), { trapFocus: true, lockScroll: false, closeOnFocusOut: false, escapeKey: false });
  assert.equal(port.getDialogConfiguration(true, true, true).escapeKey, true);
});
test('own backdrop forces intentional dismissal even for touch', () => {
  assert.equal(port.getDialogOutsidePressMode(true, true), 'intentional');
  assert.deepEqual(port.getDialogOutsidePressMode(false, false), { mouse: 'intentional', touch: 'sloppy' });
});
test('outside dismissal rejects secondary buttons and partial multi-touch endings', () => {
  const state = { outsidePressEnabled: true, topmost: true, disablePointerDismissal: false, modal: false, internalBackdrop: null, backdrop: null, popup: null };
  assert.equal(port.acceptsDialogOutsidePress({ button: 2 }, state), false);
  assert.equal(port.acceptsDialogOutsidePress({ type: 'touchend', touches: [1], changedTouches: [1] }, state), false);
  assert.equal(port.acceptsDialogOutsidePress({ type: 'touchend', touches: [], changedTouches: [1], target: null }, state), true);
  assert.equal(port.acceptsDialogOutsidePress({ button: 0, target: null }, { ...state, disablePointerDismissal: true }), false);
});
test('sibling modal backdrops cannot dismiss this dialog', () => {
  const own = {}, other = { contains: () => false };
  const state = { outsidePressEnabled: true, topmost: true, disablePointerDismissal: false, modal: true, internalBackdrop: own, backdrop: null, popup: null };
  assert.equal(port.acceptsDialogOutsidePress({ button: 0, target: own }, state), true);
  assert.equal(port.acceptsDialogOutsidePress({ button: 0, target: other }, state), false);
});
test('close callback sees retained trigger; cancellation stops dispatch and update', () => {
  const trigger = {}, calls = [];
  const details = createChangeEventDetails('escape-key', new Event('keydown'));
  port.requestDialogOpen(false, details, { activeTriggerId: 'trigger', activeTriggerElement: trigger }, {
    preventUnmount() { calls.push('prevent-unmount'); },
    onOpenChange(open, event) { assert.equal(event.trigger, trigger); event.preventUnmountOnClose(); event.cancel(); },
    dispatchOpenChange() { calls.push('dispatch'); }, updateOpen() { calls.push('update'); },
  });
  assert.deepEqual(calls, ['prevent-unmount']);
});
test('accepted callback precedes dispatch and update observes trigger mutation', () => {
  const trigger = {}, replacement = {}, calls = [];
  const details = createChangeEventDetails('trigger-press', new Event('click'), trigger);
  port.requestDialogOpen(true, details, { activeTriggerId: null, activeTriggerElement: null }, {
    preventUnmount() {}, onOpenChange(_open, event) { calls.push('callback'); event.trigger = replacement; },
    dispatchOpenChange() { calls.push('dispatch'); }, updateOpen(_open, element) { assert.equal(element, replacement); calls.push('update'); },
  });
  assert.deepEqual(calls, ['callback', 'dispatch', 'update']);
});
test('canceled Escape still stops propagation unless explicitly allowed', () => {
  const state = { open: true, enabled: true, escapeKey: true, composing: false, bubbles: false, blockingChild: false };
  let prevented = false, stopped = false;
  const event = { key: 'Escape', preventDefault() { prevented = true; }, stopPropagation() { stopped = true; } };
  port.runDialogEscapeKey(event, state, details => details.cancel());
  assert.equal(prevented, false); assert.equal(stopped, true);
  prevented = false; stopped = false;
  port.runDialogEscapeKey(event, state, details => details.allowPropagation());
  assert.equal(prevented, true); assert.equal(stopped, false);
  port.runDialogEscapeKey(event, { ...state, composing: true }, () => { throw Error('IME must not close'); });
});
