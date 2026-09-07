const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'popover-focus-'));
const output = path.join(directory, 'focus.cjs');
buildSync({ entryPoints: [path.join(__dirname, '../../src/behavior/popover-focus.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: output });
const port = require(output);
process.on('exit', () => fs.rmSync(directory, { recursive: true, force: true }));
const element = (nodeName = 'BUTTON') => ({ nodeName, isConnected: true });
const popup = element('DIV'), trigger = element(), prior = element(), first = element(), body = element('BODY');
const initial = { popup, interactionType: 'keyboard', previouslyFocused: trigger, contains: () => false, getTabbableContent: () => [first] };
const final = { reference: trigger, previouslyFocused: prior, closeType: 'keyboard', openInteractionType: 'mouse', getPreviousFocus: () => null };

test('default mouse/keyboard initial focus chooses first tabbable; touch chooses popup', () => {
  assert.equal(port.resolvePopoverInitialFocus(initial), first);
  assert.equal(port.resolvePopoverInitialFocus({ ...initial, interactionType: 'touch' }), popup);
  assert.equal(port.resolvePopoverInitialFocus({ ...initial, getTabbableContent: () => [] }), popup);
});
test('initial false and callback void suppress; null and empty ref fall back', () => {
  for (const policy of [false, () => undefined]) assert.equal(port.resolvePopoverInitialFocus({ ...initial, policy }), null);
  for (const policy of [() => null, { current: null }]) assert.equal(port.resolvePopoverInitialFocus({ ...initial, policy }), first);
  assert.equal(port.resolvePopoverInitialFocus({ ...initial, policy: () => prior }), prior);
});
test('existing popup focus is respected even with explicit initial target', () => {
  assert.equal(port.resolvePopoverInitialFocus({ ...initial, contains: () => true, policy: () => prior }), null);
});
test('queued initial focus aborts after close or focus moved into another popup child', () => {
  const state = { open: true, hadFocusInside: false, currentActive: prior, target: first, focusCurrentlyInside: true };
  assert.equal(port.shouldRunInitialFocus(state), false);
  assert.equal(port.shouldRunInitialFocus({ ...state, hadFocusInside: true }), true);
  assert.equal(port.shouldRunInitialFocus({ ...state, open: false, hadFocusInside: true }), false);
  assert.equal(port.shouldRunInitialFocus({ ...state, currentActive: first }), true);
});
test('return uses trigger for interactive opens, previous focus only for explicit null programmatic type', () => {
  assert.equal(port.resolvePopoverReturnFocus(final), trigger);
  assert.equal(port.resolvePopoverReturnFocus({ ...final, openInteractionType: '' }), trigger);
  assert.equal(port.resolvePopoverReturnFocus({ ...final, openInteractionType: null }), prior);
});
test('disconnected reference and body previous focus fall back to history', () => {
  assert.equal(port.resolvePopoverReturnFocus({ ...final, reference: { ...trigger, isConnected: false } }), prior);
  assert.equal(port.resolvePopoverReturnFocus({ ...final, reference: null, previouslyFocused: body, getPreviousFocus: () => first }), first);
});
test('return callback receives close method and preserves null/void distinction', () => {
  assert.equal(port.resolvePopoverReturnFocus({ ...final, policy: type => { assert.equal(type, 'keyboard'); return null; } }), trigger);
  assert.equal(port.resolvePopoverReturnFocus({ ...final, policy: () => undefined }), null);
  assert.equal(port.resolvePopoverReturnFocus({ ...final, policy: { current: null } }), trigger);
});
test('default return never steals focus from an outside button; explicit return can override', () => {
  const state = { target: trigger, prevented: false, activeElement: prior, body, focusInsideTree: false };
  assert.equal(port.shouldReturnPopoverFocus(state), false);
  assert.equal(port.shouldReturnPopoverFocus({ ...state, policy: () => trigger }), true);
  assert.equal(port.shouldReturnPopoverFocus({ ...state, activeElement: body }), true);
  assert.equal(port.shouldReturnPopoverFocus({ ...state, focusInsideTree: true }), true);
  assert.equal(port.shouldReturnPopoverFocus({ ...state, prevented: true, policy: () => trigger }), false);
});
test('outside pointer return depends on preventScroll support; virtual/nested events bypass probe', () => {
  const event = { reason: 'outside-press', nativeEventType: 'pointerdown', nested: false, virtualEvent: false, supportsPreventScroll: () => false };
  assert.equal(port.updatePreventReturnFocus(false, event), true);
  assert.equal(port.updatePreventReturnFocus(true, { ...event, supportsPreventScroll: () => true }), false);
  assert.equal(port.updatePreventReturnFocus(true, { ...event, nested: true, supportsPreventScroll: () => { throw Error('must not probe'); } }), false);
  assert.equal(port.updatePreventReturnFocus(false, { ...event, reason: 'trigger-hover', nativeEventType: 'mouseleave' }), true);
});
test('Popover focus trap requires a Close part and hover disables manager', () => {
  assert.deepEqual(port.getPopoverFocusConfiguration(true, false, true, 'trigger-press'), { modal: false, disabled: false });
  assert.deepEqual(port.getPopoverFocusConfiguration('trap-focus', true, true, 'trigger-hover'), { modal: true, disabled: true });
});
