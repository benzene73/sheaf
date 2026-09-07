const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'anchor-positioning-'));
const output = path.join(directory, 'positioning.cjs');
execFileSync(process.env.ESBUILD_BINARY || 'D:/kaguya/assets/node_modules/@esbuild/win32-x64/esbuild.exe',
  [path.join(__dirname, '../../src/behavior/anchor-positioning.ts'), '--bundle', '--platform=node', '--format=cjs', `--outfile=${output}`],
  { env: { ...process.env, NODE_PATH: process.env.NODE_PATH || 'D:/liveview-primitives-lab/node_modules' } });
const port = require(output);
process.on('exit', () => fs.rmSync(directory, { recursive: true, force: true }));
const middleware = (options, name) => options.middleware.find(item => item?.name === name);

test('preferred-side bias affects flip only, never resting padding', () => {
  const options = port.createAnchorPositioningOptions({ side: 'bottom', collisionPadding: 12 });
  assert.deepEqual(middleware(options, 'flip').options.padding, { top: 14, right: 13, bottom: 13, left: 13 });
  for (const name of ['shift', 'size']) {
    assert.deepEqual(middleware(options, name).options.padding, { top: 12, right: 12, bottom: 12, left: 12 });
  }
});
test('alignment and center select source middleware ordering', () => {
  const names = opts => port.createAnchorPositioningOptions(opts).middleware.filter(Boolean).map(m => m.name);
  assert.deepEqual(names({ align: 'center' }), ['offset', 'shift', 'flip', 'size']);
  assert.deepEqual(names({ align: 'start' }), ['offset', 'flip', 'shift', 'size']);
  assert.deepEqual(names({ align: 'start', collisionAvoidance: { align: 'shift' } }), ['offset', 'shift', 'flip', 'size']);
});
test('offset callbacks receive rendered logical side and dimensions', () => {
  let seen;
  const options = port.createAnchorPositioningOptions({ side: 'inline-end', direction: 'rtl', align: 'start',
    sideOffset: data => { seen = data; return data.anchor.width; }, alignOffset: 3 });
  assert.equal(options.placement, 'left-start');
  const result = middleware(options, 'offset').options({ placement: 'right-end',
    rects: { reference: { width: 37, height: 21 }, floating: { width: 99, height: 65 } } });
  assert.deepEqual(seen, { side: 'inline-start', align: 'end', anchor: { width: 37, height: 21 }, positioner: { width: 99, height: 65 } });
  assert.deepEqual(result, { mainAxis: 37, crossAxis: 3, alignmentAxis: 3 });
});
test('size publishes both available dimensions and device-snapped anchor dimensions', () => {
  const values = {};
  const options = port.createAnchorPositioningOptions();
  middleware(options, 'size').options.apply({ availableWidth: 123, availableHeight: 45,
    elements: { floating: { style: { setProperty: (key, value) => values[key] = value }, ownerDocument: { defaultView: { devicePixelRatio: 2 } } } },
    rects: { reference: { x: 0.2, y: 0.3, width: 10.2, height: 20.4 } } });
  assert.deepEqual(values, { '--available-width': '123px', '--available-height': '45px', '--anchor-width': '10.5px', '--anchor-height': '20px' });
});
test('unmounted size pass cannot mutate detached UI', () => {
  const options = port.createAnchorPositioningOptions({ isMounted: () => false });
  middleware(options, 'size').options.apply({ elements: { floating: { get style() { throw Error('late DOM write'); } } } });
});
test('none disables side flipping and alignment shifting', () => {
  const options = port.createAnchorPositioningOptions({ collisionAvoidance: { side: 'none', align: 'none' } });
  assert.deepEqual(options.middleware.filter(Boolean).map(m => m.name), ['offset', 'size']);
});
