const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'toggle-port-')), output = path.join(directory, 'toggle.cjs');
buildSync({ entryPoints: [path.join(__dirname, '../../src/behavior/toggle-group.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: output });
const port = require(output);
process.on('exit', () => fs.rmSync(directory, { recursive: true, force: true }));
test('single can deselect all; multiple appends and removes preserving order', () => {
  let values = ['grid'];
  const run = (value, pressed, multiple) => port.runToggleClick(new Event('click'), {value, pressed}, {
    requestGroupValue: (v, next, details) => port.requestToggleGroupValue(v, next, details, {multiple, values}, {assignValues: next => { values = next; }}), assignPressed() {},
  });
  run('grid', true, false); assert.deepEqual(values, []);
  run('grid', false, true); run('list', false, true); assert.deepEqual(values, ['grid', 'list']);
  run('grid', true, true); assert.deepEqual(values, ['list']);
});
test('child or group cancellation vetoes remaining assignments with shared details', () => {
  let assignments = 0, childDetails;
  port.runToggleClick(new Event('click'), {value: 'grid', pressed: false}, {
    onPressedChange(_next, details) { childDetails = details; },
    requestGroupValue(value, next, details) {
      assert.equal(details, childDetails);
      port.requestToggleGroupValue(value, next, details, {multiple: false, values: []}, {
        onValueChange(_values, event) { event.cancel(); }, assignValues() { assignments++; },
      });
    }, assignPressed() { assignments++; },
  });
  assert.equal(assignments, 0);
});
