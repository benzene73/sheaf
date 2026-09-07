import { chromium, firefox, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

const engines = { chromium, firefox, webkit };
const targets = [{ name: 'upstream', url: process.env.UPSTREAM_URL || 'http://localhost:4198/' }];
if (process.env.UPSTREAM_ONLY !== '1') targets.push({ name: 'liveview', url: process.env.LIVEVIEW_URL || 'http://localhost:4197/paired' });
function snapshot() {
  const input = document.querySelector('[role="combobox"]');
  return {
    active: document.getElementById(input.getAttribute('aria-activedescendant'))?.textContent.trim() || null,
    expanded: input.getAttribute('aria-expanded') === 'true',
    focused: document.activeElement === input,
    accepted: document.querySelector('[data-testid="accepted-value"]').textContent.trim(),
    input: input.value,
    submits: Number(document.querySelector('[data-testid="submit-count"]').textContent),
    caret: input.selectionStart,
  };
}
const scenarios = [
  { name: 'Enter with no active item closes and submits', steps: [
    ['key', 'ArrowUp', { active: 'Cherry', expanded: true }],
    ['key', 'ArrowDown', { active: null, expanded: true }],
    ['key', 'Enter', { expanded: false, accepted: '', submits: 1 }],
  ] },
  { name: 'active Enter commits without submitting', steps: [
    ['key', 'ArrowDown', { active: 'Apple' }],
    ['key', 'Enter', { accepted: 'Apple', input: 'Apple', expanded: false, submits: 0 }],
  ] },
  { name: 'disabled Enter neither commits nor submits', steps: [
    ['key', 'ArrowDown', { active: 'Apple' }], ['key', 'ArrowDown', { active: 'Banana' }],
    ['key', 'Enter', { accepted: '', expanded: true, active: 'Banana', submits: 0 }],
  ] },
  { name: 'canceled selection stays open and unchanged', query: '?cancelValue=true', steps: [
    ['key', 'ArrowDown', { active: 'Apple' }],
    ['key', 'Enter', { accepted: '', input: '', expanded: true, active: 'Apple', submits: 0 }],
  ] },
  { name: 'canceled close accepts value but stays open', query: '?cancelClose=true', steps: [
    ['key', 'ArrowDown', { active: 'Apple' }],
    ['key', 'Enter', { accepted: 'Apple', input: 'Apple', expanded: true, submits: 0 }],
  ] },
  { name: 'Escape open restores label then closed Escape clears value', query: '?defaultValue=Apple', steps: [
    ['fill', 'xyz', { input: 'xyz', expanded: true, accepted: 'Apple' }],
    ['key', 'Escape', { input: 'Apple', expanded: false, accepted: 'Apple' }],
    ['key', 'Escape', { input: '', expanded: false, accepted: '' }],
  ] },
  { name: 'outside close completion restores accepted label', query: '?defaultValue=Apple', steps: [
    ['fill', 'xyz', { input: 'xyz', expanded: true, accepted: 'Apple' }],
    ['outside', '', { input: 'Apple', expanded: false, accepted: 'Apple', focused: false }],
  ] },
  { name: 'Home and End move input caret without changing value', query: '?defaultValue=Apple', steps: [
    ['key', 'Home', { input: 'Apple', caret: 0 }],
    ['key', 'End', { input: 'Apple', caret: 5 }],
  ] },
  { name: 'readOnly input allows highlight but Enter cannot select or submit', query: '?readOnly=true', steps: [
    ['key', 'ArrowDown', { active: 'Apple', expanded: true, input: '', accepted: '' }],
    ['key', 'Enter', { active: 'Apple', expanded: true, accepted: '', submits: 0 }],
  ] },
];
const results = [];
for (const browserName of (process.env.BROWSERS || 'chromium').split(',')) {
  const browser = await engines[browserName].launch();
  try {
    for (const scenario of scenarios) {
      const traces = [];
      for (const target of targets) {
        const page = await browser.newPage();
        const trace = [];
        const pageErrors = [];
        page.on('pageerror', error => pageErrors.push(error.message));
        try {
          await page.goto(target.url + (scenario.query || ''));
          await page.locator('[data-fixture-ready="true"]').waitFor();
          const input = page.getByRole('combobox', { name: 'Fruit' });
          await input.focus();
          for (const [action, value, expected] of scenario.steps) {
            if (action === 'key') await page.keyboard.press(value);
            else if (action === 'fill') await input.fill(value);
            else if (action === 'outside') await page.locator('button').filter({ hasText: /^Outside$/ }).click();
            const deadline = Date.now() + 3000;
            let current;
            do {
              current = await page.evaluate(snapshot);
              if (Object.entries(expected).every(([key, value]) => current[key] === value)) break;
              await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
            } while (Date.now() < deadline);
            for (const [key, value] of Object.entries(expected)) assert.deepEqual(current[key], value, `${action} ${value}: ${key}`);
            // Compare semantic contract fields, not implementation-specific caret defaults.
            trace.push(Object.fromEntries(Object.keys(expected).map(key => [key, current[key]])));
          }
          assert.deepEqual(pageErrors, []);
          traces.push(trace);
          results.push({ browser: browserName, target: target.name, scenario: scenario.name, pass: true, trace });
          console.log(`PASS ${browserName} ${target.name}: ${scenario.name}`);
        } catch (error) {
          results.push({ browser: browserName, target: target.name, scenario: scenario.name, pass: false, trace, actual: await page.evaluate(snapshot).catch(() => null), error: error.message, pageErrors });
          console.log(`FAIL ${browserName} ${target.name}: ${scenario.name}`);
        } finally { await page.close(); }
      }
      if (traces.length === 2) assert.deepEqual(traces[0], traces[1]);
    }
  } finally { await browser.close(); }
}
mkdirSync('artifacts', { recursive: true });
writeFileSync(process.env.REPORT_PATH || 'artifacts/lifecycle-results.json', JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
console.log(`${results.filter(row => row.pass).length}/${results.length} target scenarios passed`);
if (results.some(row => !row.pass)) process.exitCode = 1;
