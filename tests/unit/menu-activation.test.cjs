const {test} = require('node:test');
const assert = require('node:assert/strict');
const {buildSync} = require('esbuild');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'menu-activation-')), output = path.join(directory, 'menu.cjs');
buildSync({entryPoints: [path.join(__dirname, '../../src/behavior/menu-activation.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: output});
const port = require(output);
process.on('exit', () => fs.rmSync(directory, {recursive: true, force: true}));
function event(key) { return {key, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }}; }
const base = {disabled: false, typing: false, isCurrentTarget: true};
test('native button Enter is untouched, composite Space clicks once on keydown', () => {
  const state = {...base, nativeButton: true, isButton: true}; let count = 0;
  const enter = event('Enter'); port.activateMenuItemKey(state, enter, () => count++);
  assert.equal(enter.defaultPrevented, false); assert.equal(count, 0);
  const space = event(' '); port.activateMenuItemKey(state, space, () => count++);
  assert.equal(space.defaultPrevented, true); assert.equal(count, 1);
  const up = event(' '); port.suppressMenuItemKeyUp(state, up); assert.equal(up.defaultPrevented, true);
});
test('typing Space and disabled rows never activate; legacy nonnative Enter preserved', () => {
  let count = 0;
  port.activateMenuItemKey({...base, typing: true, nativeButton: true, isButton: true}, event(' '), () => count++);
  port.activateMenuItemKey({...base, disabled: true}, event('Enter'), () => count++);
  port.activateMenuItemKey(base, event('Enter'), () => count++);
  assert.equal(count, 1);
});
test('link Enter stays native while composite Space activates with source modifier data', () => {
  let count = 0;
  const enter = event('Enter'); port.activateMenuItemKey({...base, isLink: true}, enter, () => count++);
  assert.equal(enter.defaultPrevented, false); assert.equal(count, 0);
  port.activateMenuItemKey({...base, isLink: true}, event(' '), () => count++);
  assert.equal(count, 1);
});
