import { chromium, firefox, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const engines = { chromium, firefox, webkit };
const targets = [{ name: 'upstream', url: process.env.UPSTREAM_URL || 'http://localhost:4198/?fixture=select' }];
if (process.env.UPSTREAM_ONLY !== '1') targets.push({ name: 'liveview', url: process.env.SELECT_URL || 'http://localhost:4197/select?fixture=select' });
const scenarios = [
  { name: 'ArrowDown opens first option', keys: ['ArrowDown'], active: ['Alpha'] },
  { name: 'ArrowUp opens last option', keys: ['ArrowUp'], active: ['Charlie'] },
  { name: 'arrows highlight disabled and clamp last', keys: ['ArrowDown','ArrowDown','ArrowDown','ArrowDown','ArrowDown'], active: ['Alpha','Beta','Bravo','Charlie','Charlie'] },
  { name: 'Home and End focus endpoints', keys: ['ArrowDown','End','Home'], active: ['Alpha','Charlie','Alpha'] },
  { name: 'closed typeahead skips disabled and commits without opening', keys: ['b'], active: [null], value: 'Bravo', closed: true },
  { name: 'open typeahead skips disabled without committing', keys: ['ArrowDown','b'], active: ['Alpha','Bravo'] },
  { name: 'Enter selects closes and returns focus', keys: ['ArrowDown','Enter'], active: ['Alpha',null], value: 'Alpha', closed: true },
  { name: 'disabled Enter does not select or close', keys: ['ArrowDown','ArrowDown','Enter'], active: ['Alpha','Beta','Beta'] },
  { name: 'canceled selection closes without accepting', query: '&cancelValue=true', keys: ['ArrowDown','Enter'], active: ['Alpha',null], closed: true, changes: 1 },
  { name: 'Escape closes without changing value', keys: ['ArrowDown','Escape'], active: ['Alpha',null], closed: true },
];
function snapshot() {
  const trigger = document.querySelector('[aria-label="Choose fruit"]');
  const focused = document.activeElement;
  return { active: focused?.getAttribute('role') === 'option' ? focused.textContent.trim() : null,
    expanded: trigger.getAttribute('aria-expanded') === 'true', triggerFocused: focused === trigger,
    value: document.querySelector('[data-testid=select-value]').textContent.trim(),
    changes: Number(document.querySelector('[data-testid=select-change-count]').textContent) };
}
const results = [];
for (const browserName of (process.env.BROWSERS || 'chromium').split(',')) {
  const browser = await engines[browserName].launch();
  try {
    for (const scenario of scenarios) {
      const pair = [];
      for (const target of targets) {
        const page = await browser.newPage(); const trace = []; const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        try {
          await page.goto(target.url + (scenario.query || ''));
          await page.locator('[data-fixture-ready=true]').waitFor({ state: 'attached' });
          await page.locator('[aria-label="Choose fruit"]').focus();
          for (let i = 0; i < scenario.keys.length; i++) {
            await page.keyboard.press(scenario.keys[i]); const last = i === scenario.keys.length - 1;
            const expected = { active: scenario.active[i], expanded: !(last && scenario.closed), triggerFocused: Boolean(last && scenario.closed), value: last && scenario.value ? scenario.value : '', changes: last && (scenario.changes || scenario.value) ? scenario.changes || 1 : 0 };
            const deadline = Date.now() + 3000; let actual;
            do {
              actual = await page.evaluate(snapshot);
              if (JSON.stringify(actual) === JSON.stringify(expected)) break;
              await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
            } while (Date.now() < deadline);
            assert.deepEqual(actual, expected); trace.push(actual);
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
writeFileSync(process.env.REPORT_PATH || 'artifacts/select-results.json', JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
console.log(`${results.filter(r => r.pass).length}/${results.length} target scenarios passed`);
if (results.some(r => !r.pass)) process.exitCode = 1;
