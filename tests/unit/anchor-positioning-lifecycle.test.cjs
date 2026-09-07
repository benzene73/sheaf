const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {transformSync} = require('esbuild');

// Control asynchronous completion order; geometry correctness is independently
// tested with real Floating UI in the shared browser suite.
function setup() {
  const pending = [];
  let cleanups = 0;
  const middleware = name => options => ({name, options});
  const dependency = {
    ...Object.fromEntries(['offset', 'flip', 'shift', 'size', 'limitShift'].map(name => [name, middleware(name)])),
    autoUpdate(_anchor, _floating, update) { update(); return () => { cleanups++; }; },
    computePosition(_anchor, _floating, options) {
      return new Promise(resolve => pending.push({options, resolve}));
    },
  };
  const source = fs.readFileSync(path.join(__dirname, '../../src/behavior/anchor-positioning.ts'), 'utf8');
  const code = transformSync(source, {loader: 'ts', format: 'cjs', target: 'es2022'}).code;
  const module = {exports: {}};
  vm.runInNewContext(code, {module, exports: module.exports, require(name) {
    assert.equal(name, '@floating-ui/dom'); return dependency;
  }});
  const properties = {};
  const style = {setProperty(name, value) {properties[name] = value;}};
  const element = {style, dataset: {}, ownerDocument: {defaultView: {devicePixelRatio: 1}}};
  const controller = module.exports.startAnchorPositioning({}, element);
  function finish(index, value) {
    const computation = pending[index];
    computation.options.middleware.find(item => item?.name === 'size').options.apply({
      elements: {floating: element}, availableWidth: value, availableHeight: value,
      rects: {reference: {x: 0, y: 0, width: value, height: value}},
    });
    computation.resolve({x: value, y: value, strategy: 'absolute', placement: 'bottom'});
  }
  return {controller, properties, style, finish, element, cleanups: () => cleanups};
}
const drain = () => new Promise(resolve => setImmediate(resolve));

test('older completion cannot overwrite newer size or coordinates', async () => {
  const fixture = setup();
  const latest = fixture.controller.update();
  fixture.finish(1, 22);
  await latest;
  fixture.finish(0, 11);
  await drain();
  assert.equal(fixture.properties['--available-width'], '22px');
  assert.equal(fixture.properties['--available-height'], '22px');
  assert.equal(fixture.properties['--anchor-width'], '22px');
  assert.equal(fixture.properties['--anchor-height'], '22px');
  assert.equal(fixture.style.transform, 'translate(22px, 22px)');
  fixture.controller.destroy();
});

test('destroyed controller blocks pending middleware and result writes', async () => {
  const fixture = setup();
  fixture.controller.destroy();
  const before = {...fixture.properties};
  fixture.finish(0, 33);
  await drain();
  assert.deepEqual(fixture.properties, before);
  assert.equal(fixture.style.transform, '');
  assert.equal(fixture.element.dataset.positioned, undefined);
  assert.equal(fixture.cleanups(), 1);
});
