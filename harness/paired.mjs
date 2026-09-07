import { chromium, firefox, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

const engines = { chromium, firefox, webkit };
const engineNames = (process.env.BROWSERS || 'chromium').split(',');
const targets = process.env.UPSTREAM_ONLY === '1'
  ? [{ name: 'upstream', url: process.env.UPSTREAM_URL || 'http://localhost:4198/' }]
  : [{ name: 'upstream', url: process.env.UPSTREAM_URL || 'http://localhost:4198/' },
     { name: 'liveview', url: process.env.LIVEVIEW_URL || 'http://localhost:4197/paired' }];

async function state(page) {
  return page.getByRole('combobox', { name: 'Fruit' }).evaluate(input => ({
    active: document.getElementById(input.getAttribute('aria-activedescendant'))?.textContent.trim() || null,
    expanded: input.getAttribute('aria-expanded') === 'true',
    focused: document.activeElement === input,
    accepted: document.querySelector('[data-testid="accepted-value"]')?.textContent.trim() || '',
  }));
}
async function expectState(page, expected) {
  await page.waitForFunction(expected => {
    const input = document.querySelector('[role="combobox"]');
    if (!input) return false;
    const actual = {
      active: document.getElementById(input.getAttribute('aria-activedescendant'))?.textContent.trim() || null,
      expanded: input.getAttribute('aria-expanded') === 'true',
      focused: document.activeElement === input,
      accepted: document.querySelector('[data-testid="accepted-value"]')?.textContent.trim() || '',
    };
    return Object.entries(expected).every(([key, value]) => actual[key] === value);
  }, expected, { timeout: 2500 });
  return state(page);
}

// These exact scenarios and semantic expectations execute against both implementations.
// No framework-specific event dispatch or special LiveView success path is used.
const scenarios = [
  { name: 'down opens first enabled item', keys: ['ArrowDown'], expected: ['Apple'] },
  { name: 'up opens last enabled item', keys: ['ArrowUp'], expected: ['Cherry'] },
  { name: 'down highlights disabled and loops through input', keys: ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown'], expected: ['Apple', 'Banana', 'Cherry', null, 'Apple'] },
  { name: 'up highlights disabled and loops through input', keys: ['ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp'], expected: ['Cherry', 'Banana', 'Apple', null, 'Cherry'] },
  { name: 'nonlooping down clamps last', query: '?loop=false', keys: ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown'], expected: ['Apple', 'Banana', 'Cherry', 'Cherry'] },
  { name: 'nonlooping up clamps first', query: '?loop=false', keys: ['ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp'], expected: ['Cherry', 'Banana', 'Apple', 'Apple'] },
  { name: 'Home and End preserve editable input highlight', keys: ['ArrowDown', 'Home', 'End'], expected: ['Apple', 'Apple', 'Apple'] },
  { name: 'Enter cannot commit highlighted disabled item', keys: ['ArrowDown', 'ArrowDown', 'Enter'], expected: ['Apple', 'Banana', 'Banana'] },
  { name: 'Enter commits highlighted item and closes', keys: ['ArrowDown', 'ArrowDown', 'ArrowDown', 'Enter'], expected: ['Apple', 'Banana', 'Cherry', null], accepted: 'Cherry', closed: true },
];
const results = [];
for (const engineName of engineNames) {
  if (!engines[engineName]) throw new Error(`Unknown browser ${engineName}`);
  const browser = await engines[engineName].launch();
  try {
    for (const scenario of scenarios) {
      const traces = [];
      for (const target of targets) {
        const page = await browser.newPage();
        const pageErrors = [];
        page.on('pageerror', error => pageErrors.push(error.message));
        const trace = [];
        try {
          await page.goto(target.url + (scenario.query || ''));
          await page.locator('[data-fixture-ready="true"]').waitFor();
          await page.getByRole('combobox', { name: 'Fruit' }).focus();
          await expectState(page, { expanded: false, focused: true, accepted: '' });
          for (let i = 0; i < scenario.keys.length; i++) {
            await page.keyboard.press(scenario.keys[i]);
            const last = i === scenario.keys.length - 1;
            trace.push(await expectState(page, {
              active: scenario.expected[i], focused: true,
              expanded: !(last && scenario.closed),
              accepted: last && scenario.accepted ? scenario.accepted : '',
            }));
          }
          assert.deepEqual(pageErrors, [], 'Unexpected browser exceptions');
          results.push({ browser: engineName, target: target.name, scenario: scenario.name, pass: true, trace });
          traces.push(trace);
          console.log(`PASS ${engineName} ${target.name}: ${scenario.name}`);
        } catch (error) {
          results.push({ browser: engineName, target: target.name, scenario: scenario.name, pass: false, trace, actual: await state(page).catch(() => null), error: error.message, pageErrors });
          console.error(`FAIL ${engineName} ${target.name}: ${scenario.name}`);
        } finally { await page.close(); }
      }
      if (traces.length === 2) assert.deepEqual(traces[0], traces[1], `Differential trace mismatch: ${scenario.name}`);
    }
  } finally { await browser.close(); }
}
mkdirSync('artifacts', { recursive: true });
writeFileSync(process.env.REPORT_PATH || 'artifacts/paired-results.json', JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
console.log(`${results.filter(r => r.pass).length}/${results.length} target scenarios passed`);
if (results.some(r => !r.pass)) process.exitCode = 1;
