const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'collator-filter-'));
const output = path.join(directory, 'filter.cjs');
buildSync({ entryPoints: [path.join(__dirname, '../../src/behavior/filter.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: output });
const port = require(output);
process.on('exit', () => fs.rmSync(directory, { recursive: true, force: true }));
test('default case/accent sensitivity matches equal-length substrings', () => {
  const f = port.getFilter({ locale: 'en' });
  assert.equal(f.contains('Québec', 'QUE'), true);
  assert.equal(f.startsWith('Éclair', 'ecl'), true);
  assert.equal(f.endsWith('CAFÉ', 'afe'), true);
});
test('runtime collator options can retain accents', () => {
  assert.equal(port.getFilter({ locale: 'en', sensitivity: 'accent' }).contains('café', 'cafe'), false);
});
test('Turkish locale handles dotted and dotless I', () => {
  assert.equal(port.getFilter({ locale: 'tr' }).startsWith('Istanbul', 'ıst'), true);
  assert.equal(port.getFilter({ locale: 'en' }).startsWith('Istanbul', 'ıst'), false);
});
test('Intl.Locale objects do not collide in cache', () => {
  assert.notEqual(port.getFilter({ locale: new Intl.Locale('fr-FR') }), port.getFilter({ locale: new Intl.Locale('en-US') }));
  assert.equal(port.getFilter({ locale: 'en' }), port.getFilter({ locale: 'en' }));
});
test('empty query matches at core level but item wrapper rejects null', () => {
  const f = port.getFilter();
  for (const method of ['contains', 'startsWith', 'endsWith']) assert.equal(f[method](null, ''), true);
  assert.equal(port.createCollatorItemFilter(f)(null, ''), false);
});
test('labels prefer custom mapper then object label then value', () => {
  assert.equal(port.stringifyAsLabel({ value: 12, label: 'Café' }), 'Café');
  assert.equal(port.stringifyAsLabel({ value: 12 }), '12');
  assert.equal(port.stringifyAsLabel({ label: 'ignored' }, () => 'mapped'), 'mapped');
  assert.equal(port.getFilter().contains({ label: 'Café' }, 'cafe'), true);
});
test('source preserves fixed UTF16 window limitations rather than normalization', () => {
  const f = port.getFilter({ locale: 'en' });
  assert.equal(f.contains('café', 'cafe\u0301'), false);
  assert.equal(f.contains('co-op', 'coop'), false);
  assert.equal(f.startsWith('coop', 'co-op'), true);
});
test('single-selection helper shows all items while query equals selected label', () => {
  const filter = port.createSingleSelectionCollatorFilter(port.getFilter({ locale: 'en' }), undefined, 'Apple');
  assert.equal(filter('Banana', 'apple'), true);
  assert.equal(filter('Banana', 'app'), false);
});
test('Root bypass respects queryChangedAfterOpen unlike public helper', () => {
  const state = { open: true, closeQuery: null, inputValue: ' Apple ', single: true, selectedLabel: 'Apple', queryChangedAfterOpen: false };
  assert.deepEqual(port.resolveComboboxFilterQuery(state, port.getFilter()), { query: 'Apple', shouldBypassFiltering: true, filterQuery: '' });
  assert.equal(port.resolveComboboxFilterQuery({ ...state, queryChangedAfterOpen: true }, port.getFilter()).filterQuery, 'Apple');
});
test('closing query and explicit filter query follow source precedence', () => {
  const state = { open: false, closeQuery: 'frozen', inputValue: 'typed', single: false, selectedLabel: '', queryChangedAfterOpen: true };
  assert.equal(port.resolveComboboxFilterQuery(state, port.getFilter()).filterQuery, 'frozen');
  assert.equal(port.resolveComboboxFilterQuery({ ...state, filterQuery: 'external' }, port.getFilter()).filterQuery, 'external');
});
test('flat filter retains input identity for unrestricted empty query and applies limit otherwise', () => {
  const items = ['Apple', 'Banana', 'Apricot'];
  const f = port.createCollatorItemFilter(port.getFilter());
  assert.equal(port.filterFlatItems(items, '', f), items);
  assert.deepEqual(port.filterFlatItems(items, 'ap', f, 1), ['Apple']);
  assert.deepEqual(port.filterFlatItems(items, 'ap', f, 0), []);
});
