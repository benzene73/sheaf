const { buildSync } = require('esbuild');
const { chromium, firefox, webkit } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const script = buildSync({ entryPoints: [path.join(__dirname, '../../src/behavior/tabbable.ts')], bundle: true,
  nodePaths: require.resolve.paths('@floating-ui/utils'),
  platform: 'browser', format: 'iife', globalName: 'TabbablePort', write: false }).outputFiles[0].text;
(async () => {
  let count = 0;
  for (const engine of [chromium, firefox, webkit]) {
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent('<main id="fixture"></main>');
      await page.addScriptTag({ content: script });
      const result = await page.evaluate(() => {
        const root = document.querySelector('#fixture');
        const ids = () => TabbablePort.tabbable(root).map(el => el.id);
        const results = {};
        root.innerHTML = '<button id="ok">ok</button><input type="hidden"><button disabled>no</button><button aria-disabled="true" id="aria">aria</button><span tabindex="-1" id="negative">n</span>';
        results.controls = ids();
        results.focusable = TabbablePort.focusable(root).map(el => el.id);
        root.innerHTML = '<details><summary id="summary">s</summary><summary>extra</summary><button>hidden</button></details><details id="alone"></details>';
        results.details = ids();
        root.innerHTML = '<input type="radio" name="r" id="r1"><input type="radio" name="r" id="r2" checked><input type="radio" name="other" id="r3"><input type="radio" name="other" id="r4">';
        results.radios = ids();
        root.innerHTML = '<div style="display:contents"><button id="contents">a</button></div><div style="visibility:hidden"><button style="visibility:visible" id="override">b</button></div><div hidden><button>c</button></div><div inert><button>d</button></div>';
        results.visibility = ids();
        root.innerHTML = '<div id="host"><button slot="visible" id="slotted">yes</button><button id="unslotted">no</button></div>';
        const host = root.firstElementChild;
        host.attachShadow({ mode: 'open' }).innerHTML = '<button id="shadow">shadow</button><slot name="visible"></slot>';
        results.shadow = ids();
        host.shadowRoot.innerHTML = '<div inert><slot name="visible"></slot></div>';
        results.inertSlot = ids();
        root.innerHTML = '<button tabindex="2" id="two">two</button><button tabindex="1" id="one">one</button><button id="default">default</button>';
        results.order = ids();
        TabbablePort.disableFocusInside(root);
        results.disabled = ids();
        TabbablePort.enableFocusInside(root);
        results.restored = [ids(), root.children[0].getAttribute('tabindex'), root.children[2].hasAttribute('tabindex')];
        root.innerHTML = '<svg><a href="#" id="svg-link"><text>svg</text></a></svg><button id="last">last</button>';
        results.svg = ids();
        return results;
      });
      const expected = { controls: ['ok', 'aria'], focusable: ['ok', 'aria', 'negative'], details: ['summary', 'alone'],
        radios: ['r2', 'r3'], visibility: ['contents', 'override'], shadow: ['shadow', 'slotted'], inertSlot: [],
        order: ['two', 'one', 'default'], disabled: [], restored: [['two', 'one', 'default'], '2', false], svg: ['svg-link', 'last'] };
      for (const [name, value] of Object.entries(expected)) { assert.deepEqual(result[name], value, `${engine.name()}: ${name}`); count++; }
      console.log(`${engine.name()}: ${Object.keys(expected).length} passed`);
    } finally { await browser.close(); }
  }
  console.log(`Total ${count} passed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
