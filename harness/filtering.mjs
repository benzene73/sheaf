import { chromium, firefox, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const engines = { chromium, firefox, webkit };
const targets = [{ name: 'upstream', url: process.env.UPSTREAM_URL || 'http://localhost:4198/' }];
if (process.env.UPSTREAM_ONLY !== '1') targets.push({ name: 'liveview', url: process.env.LIVEVIEW_URL || 'http://localhost:4197/paired' });
const scenarios = [
  { name: 'contains filtering ignores case and accents', query: '?items=locale', steps: [
    ['fill', 'AFE', { input: 'AFE', options: ['Café'], open: true }],
  ] },
  { name: 'unmatched input has no selectable result', steps: [
    ['fill', 'xyz', { options: [], open: true }],
    ['key', 'ArrowDown', { options: [], active: null, accepted: '' }],
  ] },
  { name: 'typing selected label filters after initial bypass', query: '?defaultValue=Apple', steps: [
    ['key', 'ArrowDown', { options: ['Apple', 'Banana', 'Cherry'], active: 'Apple' }],
    ['fill', 'Appl', { options: ['Apple'], input: 'Appl' }],
    ['fill', 'Apple', { options: ['Apple'], input: 'Apple' }],
    ['key', 'Escape', { open: false, accepted: 'Apple', options: [], active: null }],
    ['key', 'ArrowDown', { options: ['Apple', 'Banana', 'Cherry'], active: 'Apple' }],
  ] },
  { name: 'closed Enter submits canonical selected value', query: '?defaultValue=Apple', steps: [
    ['key', 'Enter', { submits: 1, submitted: 'Apple', accepted: 'Apple', open: false }],
  ] },
  { name: 'filtered selection submits canonical value rather than query', query: '?items=locale', steps: [
    ['fill', 'caf', { options: ['Café'], input: 'caf' }],
    ['key', 'ArrowDown', { active: 'Café' }],
    ['key', 'Enter', { accepted: 'Café', input: 'Café', open: false, submits: 0 }],
    ['key', 'Enter', { submitted: 'Café', submits: 1 }],
  ] },
];
function snapshot() {
  const input = document.querySelector('[role=combobox]');
  const output = id => document.querySelector(`[data-testid="${id}"]`).textContent.trim();
  return { input: input.value, open: input.getAttribute('aria-expanded') === 'true',
    active: document.getElementById(input.getAttribute('aria-activedescendant'))?.textContent.trim() || null,
    options: [...document.querySelectorAll('[role=option]')].filter(el => el.checkVisibility()).map(el => el.textContent.trim()),
    accepted: output('accepted-value'), submitted: output('last-submitted-value'), submits: Number(output('submit-count')) };
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
          const input = page.getByRole('combobox', { name: 'Fruit' }); await input.focus();
          for (const [action, value, expected] of scenario.steps) {
            if (action === 'fill') await input.fill(value); else await page.keyboard.press(value);
            const deadline = Date.now() + 3000; let actual;
            do {
              actual = await page.evaluate(snapshot);
              if (Object.entries(expected).every(([key, value]) => JSON.stringify(actual[key]) === JSON.stringify(value))) break;
              await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
            } while (Date.now() < deadline);
            for (const [key, value] of Object.entries(expected)) assert.deepEqual(actual[key], value, key);
            trace.push(Object.fromEntries(Object.keys(expected).map(key => [key, actual[key]])));
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
writeFileSync(process.env.REPORT_PATH || 'artifacts/filtering-results.json', JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
console.log(`${results.filter(r => r.pass).length}/${results.length} target scenarios passed`);
if (results.some(r => !r.pass)) process.exitCode = 1;
