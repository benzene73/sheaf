const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'combobox-change-'));
const output = path.join(directory, 'change.cjs');
execFileSync(process.env.ESBUILD_BINARY || 'D:/kaguya/assets/node_modules/@esbuild/win32-x64/esbuild.exe',
  [path.join(__dirname, '../../src/behavior/combobox-change.ts'), '--bundle', '--platform=node', '--format=cjs', `--outfile=${output}`]);
const { createComboboxChangeController } = require(output);
process.on('exit', () => fs.rmSync(directory, { recursive: true, force: true }));
function event(value, inputType = 'insertText', type = 'input') {
  const nativeEvent = new Event(type);
  if (inputType !== undefined) Object.defineProperty(nativeEvent, 'inputType', { value: inputType });
  return { currentTarget: { value }, nativeEvent };
}
function setup(overrides = {}, custom = {}) {
  const state = { disabled: false, readOnly: false, open: false, openOnInputClick: true,
    activeIndex: null, autoHighlightEnabled: false, ...overrides };
  const calls = [];
  const controller = createComboboxChangeController({ getState: () => state, android: false,
    setComposingValue: value => calls.push(['composing', value]),
    requestInput: (value, d) => calls.push(['input', value, d.reason]),
    requestValue: (value, d) => calls.push(['value', value, d.reason]),
    requestOpen: (value, d) => calls.push(['open', value, d.reason]),
    clearHighlight() { calls.push(['clear']); state.activeIndex = null; }, ...custom });
  return { state, calls, controller };
}
test('ordinary typing requests value then opens and clears highlight', () => {
  const t = setup(); t.controller.onChange(event('ch'));
  assert.deepEqual(t.calls, [['input', 'ch', 'input-change'], ['open', true, 'input-change'], ['clear']]);
});
test('autofill-like input updates query without requesting open', () => {
  for (const inputType of ['', 'insertReplacementText']) {
    const t = setup(); t.controller.onChange(event('ch', inputType)); assert.deepEqual(t.calls, [['input', 'ch', 'input-change']]);
  }
});
test('IME composition defers canonical query until composition end', () => {
  const t = setup(); t.controller.onCompositionStart(event(''));
  t.controller.onChange(event('に', 'insertCompositionText'));
  assert.equal(t.calls.some(c => c[0] === 'input'), false);
  assert.equal(t.calls.some(c => c[0] === 'open'), true);
  t.controller.onCompositionEnd(event('日本', '', 'compositionend'));
  assert.deepEqual(t.calls.slice(-2), [['composing', null], ['input', '日本', 'input-change']]);
});
test('Android composition-start bypass retains normal input updates', () => {
  const t = setup({}, { android: true }); t.controller.onCompositionStart(event(''));
  t.controller.onChange(event('に', 'insertCompositionText'));
  assert.equal(t.calls[0][0], 'input'); assert.equal(t.calls.some(c => c[0] === 'composing'), false);
});
test('canceled query stops value clear, open and highlight changes', () => {
  const t = setup({ openOnInputClick: false }, { requestInput(_v, d) { d.cancel(); } });
  t.controller.onChange(event('', 'deleteContentBackward')); assert.deepEqual(t.calls, []);
});
test('empty query clears selected value but stays open with default openOnInputClick', () => {
  const t = setup({ open: true }); t.controller.onChange(event('', 'deleteContentBackward'));
  assert.deepEqual(t.calls, [['input', '', 'input-change'], ['value', null, 'input-clear']]);
});
test('empty query shares clear details with close when click-open disabled', () => {
  let clearDetails;
  const t = setup({ openOnInputClick: false }, {
    requestValue(_v, d) { clearDetails = d; d.cancel(); },
    requestOpen(value, d) { assert.equal(value, false); assert.equal(d, clearDetails); assert.equal(d.isCanceled, true); },
  }); t.controller.onChange(event('', 'deleteContentBackward')); assert.ok(clearDetails);
});
test('readonly synthetic change cannot open popup', () => {
  const t = setup({ readOnly: true }); t.controller.onChange(event('x'));
  assert.deepEqual(t.calls, [['input', 'x', 'input-change']]);
});
test('autoHighlight preserves highlight branch instead of clearing it', () => {
  const t = setup({ open: true, activeIndex: 1, autoHighlightEnabled: true }); t.controller.onChange(event('ch'));
  assert.equal(t.calls.some(c => c[0] === 'clear'), false);
});
test('change rereads current DOM value after input callback', () => {
  const e = event('x'); const t = setup({}, { requestInput() { e.currentTarget.value = ''; } });
  t.controller.onChange(e); assert.deepEqual(t.calls, [['value', null, 'input-clear']]);
});
test('empty composition closes without clearing canonical selection yet', () => {
  const t = setup({ open: true, openOnInputClick: false }); t.controller.onCompositionStart(event('x'));
  t.controller.onChange(event('', 'deleteCompositionText'));
  assert.equal(t.calls.some(c => c[0] === 'input' || c[0] === 'value'), false);
  assert.equal(t.calls.some(c => c[0] === 'open' && c[1] === false), true);
});
