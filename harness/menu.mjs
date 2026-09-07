import { chromium, firefox, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const engines = { chromium, firefox, webkit };
const targets = [{ name: 'upstream', url: process.env.UPSTREAM_URL || 'http://localhost:4198/?fixture=menu' }];
if (process.env.UPSTREAM_ONLY !== '1') targets.push({ name: 'liveview', url: process.env.MENU_URL || 'http://localhost:4197/menu?fixture=menu' });
const scenarios = [
  { name: 'ArrowDown opens first menuitem', keys: ['ArrowDown'], active: ['Alpha'] },
  { name: 'ArrowUp opens last menuitem', keys: ['ArrowUp'], active: ['Charlie'] },
  { name: 'arrows include disabled and loop directly', keys: ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown'], active: ['Alpha', 'Beta', 'Bravo', 'Charlie', 'Alpha'] },
  { name: 'Home and End focus endpoints', keys: ['ArrowDown', 'End', 'Home'], active: ['Alpha', 'Charlie', 'Alpha'] },
  { name: 'repeated typeahead cycles matching labels including disabled', keys: ['ArrowDown', 'b', 'b', 'b'], active: ['Alpha', 'Beta', 'Bravo', 'Beta'] },
  { name: 'multi-letter typeahead chooses matching label', keys: ['ArrowDown', 'c', 'h'], active: ['Alpha', 'Charlie', 'Charlie'] },
  { name: 'disabled Enter ignores action and stays open', keys: ['ArrowDown', 'ArrowDown', 'Enter'], active: ['Alpha', 'Beta', 'Beta'] },
  { name: 'enabled Enter invokes action closes and returns focus', keys: ['ArrowDown', 'Enter'], active: ['Alpha', null], action: 'Alpha', closed: true },
  { name: 'Space invokes action closes and returns focus', keys: ['ArrowDown', 'Space'], active: ['Alpha', null], action: 'Alpha', closed: true },
  { name: 'Escape closes and returns trigger focus', keys: ['ArrowDown', 'Escape'], active: ['Alpha', null], closed: true },
  { name: 'Tab closes and moves focus outside', keys: ['ArrowDown', 'Tab'], active: ['Alpha', null], closed: true, outsideFocus: true },
  { name: 'modal backdrop pointer dismisses and restores trigger focus', keys: ['ArrowDown', 'OutsideClick'], active: ['Alpha', null], closed: true },
  { name: 'nonmodal outside pointer activates target with native focus policy', query: '&modal=false', keys: ['ArrowDown', 'OutsideClick'], active: ['Alpha', null], closed: true, outsideFocus: true, outsideClicks: 1, pointerFocus: true },
  { name: 'closeOnClick false keeps enabled action open', query: '&keepOpen=true', keys: ['ArrowDown', 'Enter'], active: ['Alpha', 'Alpha'], action: 'Alpha' },
];
function snapshot() {
  const trigger = [...document.querySelectorAll('button')].find(e => e.textContent.trim() === 'Open menu');
  const focused = document.activeElement;
  return { active: focused?.getAttribute('role') === 'menuitem' ? focused.textContent.trim() : null,
    expanded: trigger.getAttribute('aria-expanded') === 'true', triggerFocused: trigger === focused,
    outsideFocused: focused?.tagName === 'BUTTON' && focused.textContent.trim() === 'Outside',
    outsideClicks: Number(document.querySelector('[data-testid="outside-click-count"]').textContent),
    action: document.querySelector('[data-testid="menu-action"]').textContent.trim() };
}
const results = [];
for (const browserName of (process.env.BROWSERS || 'chromium').split(',')) {
  const browser = await engines[browserName].launch();
  try {
    for (const scenario of scenarios) {
      const pair = [];
      for (const target of targets) {
        const page = await browser.newPage(); const trace = []; const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        try {
          await page.goto(target.url + (scenario.query || ''));
          await page.locator('[data-fixture-ready="true"]').waitFor({ state: 'attached' });
          await page.getByRole('button', { name: 'Open menu', exact: true }).focus();
          for (let i = 0; i < scenario.keys.length; i++) {
            if (scenario.keys[i] === 'OutsideClick') {
              const box = await page.locator('button').filter({ hasText: /^Outside$/ }).boundingBox();
              // A modal backdrop intentionally intercepts this point. Exercise the
              // real pointer rather than forcing the underlying button's handler.
              await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
            }
            else await page.keyboard.press(scenario.keys[i]);
            const last = i === scenario.keys.length - 1;
            // Actual upstream WebKit activates clicked buttons without focusing
            // them; its close focus manager restores the trigger in that case.
            const outsideFocus = scenario.outsideFocus && !(scenario.pointerFocus && browserName === 'webkit');
            const expected = { active: scenario.active[i], expanded: !(last && scenario.closed), triggerFocused: Boolean(last && scenario.closed && !outsideFocus), outsideFocused: Boolean(last && outsideFocus), outsideClicks: last && scenario.outsideClicks ? scenario.outsideClicks : 0, action: last && scenario.action ? scenario.action : '' };
            const deadline = Date.now() + 2500; let actual;
            do {
              actual = await page.evaluate(snapshot);
              if (Object.entries(expected).every(([key, value]) => actual[key] === value)) break;
              await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
            } while (Date.now() < deadline);
            assert.deepEqual(actual, expected);
            trace.push(actual);
          }
          assert.deepEqual(errors, []); pair.push(trace);
          results.push({ browser: browserName, target: target.name, scenario: scenario.name, pass: true, trace });
          console.log(`PASS ${browserName} ${target.name}: ${scenario.name}`);
        } catch (error) {
          results.push({ browser: browserName, target: target.name, scenario: scenario.name, pass: false, trace, actual: await page.evaluate(snapshot).catch(() => null), error: error.message, errors });
          console.log(`FAIL ${browserName} ${target.name}: ${scenario.name}`);
        } finally { await page.close(); }
      }
      if (pair.length === 2) assert.deepEqual(pair[0], pair[1]);
    }
  } finally { await browser.close(); }
}
mkdirSync('artifacts', { recursive: true });
writeFileSync(process.env.REPORT_PATH || 'artifacts/menu-results.json', JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
console.log(`${results.filter(r => r.pass).length}/${results.length} target scenarios passed`);
if (results.some(r => !r.pass)) process.exitCode = 1;
