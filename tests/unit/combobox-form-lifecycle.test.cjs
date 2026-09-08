const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {transformSync} = require('esbuild');

// Exercise the real hook update boundary with an intentionally late form echo.
// DOM positioning/navigation are covered by the integrated browser scenarios.
const source = fs.readFileSync(path.join(__dirname, '../../src/liveview/ported-combobox.ts'), 'utf8');
const moduleUnderTest = {exports: {}};
vm.runInNewContext(transformSync(source, {loader: 'ts', format: 'cjs'}).code, {
  module: moduleUnderTest, exports: moduleUnderTest.exports, require() { return {}; },
});
const hook = moduleUnderTest.exports.PortedCombobox;

test('form acknowledgement preserves newer draft/composition; canonical replacement restores its label', () => {
  const field = {value: 'jp'};
  const context = {
    asyncSelection: false, serverValue: 'gb', accepted: 'jp',
    queryChanged: true, queryValue: 'new search', composingValue: 'に',
    input: {value: 'に'},
    el: {dataset: {accepted: 'jp'}, querySelector() { return field; }},
    valueLabel(value) { return {jp: 'Japan', gb: 'United Kingdom'}[value] ?? ''; },
    setInput: hook.setInput, syncForm: hook.syncForm, sync() {},
  };
  hook.updated.call(context);
  assert.equal(context.serverValue, 'jp');
  assert.equal(context.accepted, 'jp');
  assert.equal(context.queryValue, 'new search');
  assert.equal(context.queryChanged, true);
  assert.equal(context.composingValue, 'に');
  assert.equal(context.input.value, 'に');
  assert.equal(field.value, 'jp');

  context.el.dataset.accepted = 'gb';
  hook.updated.call(context);
  assert.equal(context.accepted, 'gb');
  assert.equal(context.queryChanged, false);
  assert.equal(context.composingValue, null);
  assert.equal(context.input.value, 'United Kingdom');
  assert.equal(field.value, 'gb');
});
