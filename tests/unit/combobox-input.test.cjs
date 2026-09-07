const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'combobox-input-'));
const output = path.join(directory, 'input.cjs');
execFileSync(process.env.ESBUILD_BINARY || 'D:/kaguya/assets/node_modules/@esbuild/win32-x64/esbuild.exe',
  [path.join(__dirname, '../../src/behavior/combobox-input.ts'), '--platform=node', '--format=cjs', `--outfile=${output}`]);
const port = require(output);
process.on('exit', () => fs.rmSync(directory, { recursive: true, force: true }));

function setup(key, overrides = {}, effectsOverrides = {}) {
  const calls = [];
  const state = { disabled: false, readOnly: false, open: true, mounted: true,
    activeIndex: 0, selectedValue: 'Apple', direction: 'ltr', gecko: false,
    inputValue: 'Apple', inputScrollWidth: 150, inputClientWidth: 100, ...overrides };
  const event = { key, ctrlKey: false, shiftKey: false, altKey: false, metaKey: false, which: 0,
    nativeEvent: new Event('keydown'), preventDefault: () => calls.push('prevent'),
    stopPropagation: () => calls.push('stop') };
  const effects = Object.fromEntries(['markKeyboard', 'setCaret', 'setScrollLeft', 'requestInput', 'requestValue', 'requestOpen', 'clickActive']
    .map(name => [name, (...args) => calls.push([name, ...args]) ]));
  Object.assign(effects, effectsOverrides);
  return { calls, state, event, effects, run: () => port.runSingleInputKey(state, event, effects) };
}
test('Enter highlighted cancels form event before clicking active item', () => {
  const t = setup('Enter'); t.run();
  assert.deepEqual(t.calls.map(c => Array.isArray(c) ? c[0] : c), ['markKeyboard', 'prevent', 'stop', 'clickActive']);
  assert.equal(t.calls[3][1], 0);
});
test('Enter with no highlight closes while preserving native form submission', () => {
  const t = setup('Enter', { activeIndex: null }); t.run();
  assert.deepEqual(t.calls.map(c => c[0]), ['markKeyboard', 'requestOpen']);
  assert.equal(t.calls[1][1], false);
  assert.equal(t.calls[1][2].reason, 'none');
});
test('readOnly Enter highlighted prevents submit without clicking', () => {
  const t = setup('Enter', { readOnly: true }); t.run();
  assert.deepEqual(t.calls, [['markKeyboard'], 'prevent', 'stop']);
});
test('modifiers and composing Enter do not select', () => {
  const t = setup('Enter'); t.event.ctrlKey = true; assert.equal(t.run(), false); assert.deepEqual(t.calls, []);
  const ime = setup('Enter'); ime.event.which = 229; ime.run(); assert.deepEqual(ime.calls, [['markKeyboard']]);
});
test('closed Escape shares mutable details across input and value callbacks', () => {
  let inputDetails;
  const t = setup('Escape', { open: false, mounted: false }, {
    requestInput(value, details) { inputDetails = details; details.cancel(); },
    requestValue(value, details) { assert.equal(details, inputDetails); assert.equal(details.isCanceled, true); },
  }); t.run();
  assert.equal(inputDetails.reason, 'escape-key');
  assert.deepEqual(t.calls, [['markKeyboard'], 'stop']);
});
test('closed Escape bubbles if already clear or propagation explicitly allowed', () => {
  const t = setup('Escape', { open: false, mounted: false, selectedValue: null }); t.run();
  assert.equal(t.calls.includes('stop'), false);
  const allowed = setup('Escape', { open: false, mounted: false }, {
    requestValue(_value, details) { details.allowPropagation(); },
  }); allowed.run(); assert.equal(allowed.calls.includes('stop'), false);
});
test('open Escape remains owned by dismissal layer', () => {
  const t = setup('Escape'); assert.equal(t.run(), false); assert.deepEqual(t.calls, [['markKeyboard']]);
});
test('Home End preserve Gecko RTL cursor and scroll branch', () => {
  const home = setup('Home', { direction: 'rtl', gecko: true }); home.run();
  assert.deepEqual(home.calls.slice(-2), [['setCaret', 5], ['setScrollLeft', 0]]);
  const end = setup('End', { direction: 'rtl', gecko: true }); end.run();
  assert.deepEqual(end.calls.slice(-2), [['setCaret', 0], ['setScrollLeft', -50]]);
});
test('selection canceled before assignment never assigns input or requests close', () => {
  const calls = [];
  const details = port.createChangeEventDetails('item-press');
  port.runSingleSelection('Cherry', details, {
    requestSelectedValue(value, d) {
      port.requestSingleSelectedValue(value, d, {
        onValueChange(_value, e) { calls.push('request'); e.cancel(); },
        assignValue() { calls.push('assign'); },
        stringifyValueLabel: String, requestInput() { calls.push('input'); },
      });
    },
    requestOpen() { calls.push('close'); },
  });
  assert.deepEqual(calls, ['request']);
});
test('selection assignment and new input details precede independently cancellable close', () => {
  const calls = [];
  const details = port.createChangeEventDetails('item-press');
  port.runSingleSelection('Cherry', details, {
    requestSelectedValue(value, d) {
      port.requestSingleSelectedValue(value, d, {
        onValueChange() { calls.push('request'); },
        assignValue() { calls.push('assign'); },
        stringifyValueLabel: String,
        requestInput(_value, fresh) { assert.notEqual(fresh, details); fresh.cancel(); calls.push('input'); },
      });
    },
    requestOpen(_value, original) { assert.equal(original, details); calls.push('close'); original.cancel(); },
  });
  assert.deepEqual(calls, ['request', 'assign', 'input', 'close']);
});
test('close completion clears transient state before restoring accepted label', () => {
  const calls = [];
  port.completeSingleClose({ selectedLabel: 'Apple' }, {
    setMounted: () => calls.push('mounted'), onOpenChangeComplete: () => calls.push('complete'),
    setQueryChanged: () => calls.push('query'), setCloseQuery: () => calls.push('closeQuery'),
    clearActiveIndex: () => calls.push('active'), getInputValue: () => 'Applexyz', requestInput(value, details) { calls.push([value, details.reason]); },
  });
  assert.deepEqual(calls, ['mounted', 'complete', 'query', 'closeQuery', 'active', ['Apple', 'none']]);
});
test('completion skips missing/equal input and marks empty restoration as input-clear', () => {
  const values = [];
  let inputValue = null;
  const effects = { setMounted() {}, setQueryChanged() {}, setCloseQuery() {}, clearActiveIndex() {},
    getInputValue: () => inputValue, requestInput(value, details) { values.push([value, details.reason]); } };
  port.completeSingleClose({ selectedLabel: 'Apple' }, effects);
  inputValue = 'Apple';
  port.completeSingleClose({ selectedLabel: 'Apple' }, effects);
  inputValue = 'xyz';
  port.completeSingleClose({ selectedLabel: '' }, effects);
  assert.deepEqual(values, [['', 'input-clear']]);
});
test('completion reads input after callback effects rather than stale snapshot', () => {
  let inputValue = 'old query';
  const resets = [];
  port.completeSingleClose({ selectedLabel: 'Apple' }, {
    setMounted() {}, onOpenChangeComplete() { inputValue = 'Apple'; },
    setQueryChanged() {}, setCloseQuery() {}, clearActiveIndex() {},
    getInputValue: () => inputValue, requestInput(value) { resets.push(value); },
  });
  assert.deepEqual(resets, []);
});
