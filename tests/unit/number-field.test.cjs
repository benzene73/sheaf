const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'number-port-'));
const load = name => {
  const output = path.join(directory, name + '.cjs');
  buildSync({ entryPoints: [path.join(__dirname, '../../src/behavior/' + name + '.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: output });
  return require(output);
};
const port = load('number-field'), parse = load('number-parse'), format = load('number-format');
const input = load('number-input');
const { createChangeEventDetails } = load('combobox-input');
process.on('exit', () => fs.rmSync(directory, { recursive: true, force: true }));
function setup(overrides = {}, sync = true) {
  const state = { value: 1, initialValue: 1, locale: 'en-US', ...overrides }, calls = [];
  const effects = { getAllowInputSync: () => sync, assignValue(value) { state.value = value; calls.push(['value', value]); },
    setDirty(value) { calls.push(['dirty', value]); }, markPendingCommit() {}, setLastChangedValue(value) { calls.push(['last', value]); },
    setInputValue(value) { calls.push(['input', value]); }, forceRender() {} };
  const request = (value, details) => port.requestNumberValue(value, details, state, effects);
  return { state, effects, calls, request };
}
test('locale parsing handles decimal/grouping and empty; display formats null as empty', () => {
  assert.equal(parse.parseNumber('1,234.5', 'en-US'), 1234.5);
  assert.equal(parse.parseNumber('1.234,5', 'de-DE'), 1234.5);
  assert.equal(parse.parseNumber('', 'en-US'), null);
  assert.equal(format.formatNumber(null, 'en-US'), '');
  assert.equal(format.formatNumber(1234.5, 'en-US'), '1,234.5');
});
test('decimal stepping cleans binary arithmetic and clamps at boundaries', () => {
  const model = setup({ value: 0.2, step: 0.1, max: 0.3 });
  port.incrementNumberValue(0.1, { direction: 1, storedValue: model.state.value, reason: 'increment-press' }, model.request);
  assert.equal(model.state.value, 0.3);
  assert.equal(port.incrementNumberValue(0.1, { direction: 1, storedValue: 0.3, reason: 'increment-press' }, model.request), false);
});
test('empty step seeds nearest in-range zero without applying a step', () => {
  const model = setup({ value: null, min: 5 });
  port.incrementNumberValue(1, { direction: 1, storedValue: null, reason: 'increment-press' }, model.request);
  assert.equal(model.state.value, 5);
});
test('direct text callback clamps canonical number while preserving manual text', () => {
  const model = setup({ max: 10 }, false);
  model.request(20, createChangeEventDetails('input-change'));
  assert.equal(model.state.value, 10);
  assert.equal(model.calls.some(call => call[0] === 'input'), false);
});
test('canceled numeric change produces no assignment or commit effects', () => {
  const model = setup();
  model.effects.onValueChange = (_value, details) => details.cancel();
  assert.equal(model.request(4, createChangeEventDetails('input-change')), false);
  assert.deepEqual(model.calls, []);
});
test('out-of-range option affects direct entry but never step interactions', () => {
  const model = setup({ allowOutOfRange: true, max: 5 });
  model.request(10, createChangeEventDetails('input-change'));
  assert.equal(model.state.value, 10);
  port.incrementNumberValue(1, { direction: 1, storedValue: 10, reason: 'increment-press' }, model.request);
  assert.equal(model.state.value, 5);
});
test('input keeps partial minus text and rejects invalid alphabetic text', () => {
  const seen = [];
  const effects = { setAllowInputSync() {}, setInputValue(text) { seen.push(text); }, requestValue() { throw Error('partial is not numeric'); } };
  input.runNumberInputChange('-', new Event('input'), { value: null, initialValue: null }, effects);
  input.runNumberInputChange('abc', new Event('input'), { value: null, initialValue: null }, effects);
  assert.deepEqual(seen, ['-']);
});
test('untouched formatted text never truncates authoritative precision on blur', () => {
  const value = 1.23456789, seen = [];
  input.runNumberInputBlur('1.235', new Event('blur'), { value, initialValue: value, disabled: false, readOnly: false, validationOnBlur: true, locale: 'en-US' }, {
    setTouched() {}, setFocused() {}, getAllowInputSync: () => true, setAllowInputSync() {}, getPendingCommit: () => false,
    requestValue() { throw Error('must preserve canonical'); }, getLastChangedValue: () => value, setBlockRevalidation() {},
    validateCommit(v) { seen.push(v); }, onValueCommitted() { throw Error('untouched must not commit'); }, setInputValue() {},
  });
  assert.deepEqual(seen, [value]);
});
test('manual blur commits last clamped value and normalizes display', () => {
  const seen = [];
  input.runNumberInputBlur('25', new Event('blur'), { value: 2, initialValue: 2, disabled: false, readOnly: false, validationOnBlur: false, locale: 'en-US' }, {
    setTouched() {}, setFocused() {}, getAllowInputSync: () => false, setAllowInputSync() {}, getPendingCommit: () => false,
    requestValue(v) { assert.equal(v, 25); return true; }, getLastChangedValue: () => 10, setBlockRevalidation() {},
    validateCommit() {}, onValueCommitted(v) { seen.push(v); }, setInputValue(v) { seen.push(v); },
  });
  assert.deepEqual(seen, [10, '10']);
});
