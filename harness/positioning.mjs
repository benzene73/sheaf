import { chromium, firefox, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const engines = { chromium, firefox, webkit };
const targets = [{ name: 'upstream', url: process.env.UPSTREAM_URL || 'http://localhost:4198/?fixture=popover' }];
if (process.env.UPSTREAM_ONLY !== '1') targets.push({ name: 'liveview', url: process.env.POSITIONING_URL || 'http://localhost:4197/positioning?fixture=popover' });
const scenarios = [
  { name: 'tall popup rests exactly at top collision padding', size: 'tall', viewport: { width: 1000, height: 700 }, top: 12 },
  { name: 'tall popup fits narrow mobile viewport', size: 'tall', viewport: { width: 320, height: 450 }, top: 12 },
  { name: 'wide popup fits narrow mobile viewport', size: 'wide', viewport: { width: 320, height: 450 } },
  { name: 'normal popup preserves anchor gap after flip', size: 'normal', viewport: { width: 1000, height: 700 } },
  { name: 'open popup recomputes after viewport resize', size: 'tall', viewport: { width: 1000, height: 700 }, resize: { width: 320, height: 450 }, top: 12 },
];
function geometry() {
  const positioner = document.querySelector('[data-testid="positioner"]');
  const popup = document.querySelector('[data-testid="popup"]');
  const anchor = document.querySelector('[data-testid="anchor"]');
  const rect = popup.getBoundingClientRect();
  const ar = anchor.getBoundingClientRect();
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom,
    side: positioner.dataset.side, anchorTop: ar.top, gap: ar.top - rect.bottom, viewportWidth: innerWidth, viewportHeight: innerHeight };
}
const close = (a, b) => Math.abs(a - b) <= 0.75;
function validate(g, scenario) {
  assert.equal(g.side, 'top');
  assert.ok(g.x >= 11.25 && g.y >= 11.25, 'popup starts inside collision inset');
  assert.ok(g.right <= g.viewportWidth - 11.25 && g.bottom <= g.viewportHeight - 11.25, 'popup ends inside collision inset');
  assert.ok(close(g.gap, 8), `anchor gap ${g.gap} must equal 8`);
  if (scenario.top != null) assert.ok(close(g.y, scenario.top), `top ${g.y} must equal ${scenario.top}; preferred-side bias must not leak`);
}
const results = [];
for (const browserName of (process.env.BROWSERS || 'chromium').split(',')) {
  const browser = await engines[browserName].launch();
  try {
    for (const scenario of scenarios) {
      const pair = [];
      for (const target of targets) {
        const page = await browser.newPage({ viewport: scenario.viewport });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        try {
          await page.goto(target.url + '&size=' + scenario.size);
          await page.locator('[data-fixture-ready="true"]').waitFor({ state: 'attached' });
          await page.locator('[data-testid="anchor"]').click();
          await page.locator('[data-testid="popup"]').waitFor({ state: 'visible' });
          if (scenario.resize) await page.setViewportSize(scenario.resize);
          const deadline = Date.now() + 3000;
          let g, lastError;
          do {
            g = await page.evaluate(geometry);
            try { validate(g, scenario); lastError = null; break; } catch (error) { lastError = error; }
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
          } while (Date.now() < deadline);
          if (lastError) throw lastError;
          assert.deepEqual(errors, []);
          pair.push(g);
          results.push({ browser: browserName, target: target.name, scenario: scenario.name, pass: true, geometry: g });
          console.log(`PASS ${browserName} ${target.name}: ${scenario.name}`);
        } catch (error) {
          results.push({ browser: browserName, target: target.name, scenario: scenario.name, pass: false, geometry: await page.evaluate(geometry).catch(() => null), error: error.message, errors });
          console.log(`FAIL ${browserName} ${target.name}: ${scenario.name}`);
        } finally { await page.close(); }
      }
      if (pair.length === 2) for (const key of ['x', 'y', 'width', 'height']) assert.ok(close(pair[0][key], pair[1][key]), `${scenario.name} differential ${key}: ${pair[0][key]} vs ${pair[1][key]}`);
    }
  } finally { await browser.close(); }
}
mkdirSync('artifacts', { recursive: true });
writeFileSync(process.env.REPORT_PATH || 'artifacts/positioning-results.json', JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
console.log(`${results.filter(r => r.pass).length}/${results.length} target scenarios passed`);
if (results.some(r => !r.pass)) process.exitCode = 1;
