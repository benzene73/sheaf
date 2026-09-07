import { chromium, firefox, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const engines = { chromium, firefox, webkit };
const targets = [{ name: 'upstream', url: process.env.UPSTREAM_URL || 'http://localhost:4198/?fixture=menu' }];
if (process.env.UPSTREAM_ONLY !== '1') targets.push({ name: 'liveview', url: process.env.MENU_URL || 'http://localhost:4197/menu?fixture=menu' });
async function wheel(page) {
  await page.mouse.move(900, 500);
  const delivered = page.evaluate(() => new Promise(resolve => {
    window.addEventListener('wheel', () => requestAnimationFrame(() => requestAnimationFrame(resolve)), { once: true });
  }));
  await page.mouse.wheel(0, 350);
  await delivered;
}
const results = [];
for (const browserName of (process.env.BROWSERS || 'chromium').split(',')) {
  const browser = await engines[browserName].launch();
  try {
    for (const modal of [true, false]) for (const target of targets) {
      const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
      try {
        await page.goto(target.url + '&modal=' + modal);
        await page.locator('[data-fixture-ready=true]').waitFor({ state: 'attached' });
        // Identical scrollable document fixture around both implementations.
        await page.evaluate(() => { document.body.style.minHeight = '3000px'; });
        const initial = await page.evaluate(() => ({ body: document.body.style.overflow, html: document.documentElement.style.overflow }));
        await page.getByRole('button', { name: 'Open menu', exact: true }).focus();
        await page.keyboard.press('ArrowDown');
        await page.getByRole('menuitem', { name: 'Alpha', exact: true }).waitFor();
        if (modal) await page.waitForFunction(() => getComputedStyle(document.body).overflow === 'hidden' || getComputedStyle(document.documentElement).overflow === 'hidden');
        await wheel(page);
        const openScroll = await page.evaluate(() => scrollY);
        if (modal) assert.equal(openScroll, 0, 'Modal background must not wheel-scroll');
        else await page.waitForFunction(() => scrollY > 0);
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => document.querySelector('[aria-haspopup=menu]').getAttribute('aria-expanded') === 'false');
        await page.waitForFunction(initial => document.body.style.overflow === initial.body && document.documentElement.style.overflow === initial.html, initial);
        // Native focus restoration can scroll to the trigger. Begin the restored
        // wheel check from a known offset after close completion.
        await page.evaluate(() => scrollTo(0, 0));
        await wheel(page);
        await page.waitForFunction(() => scrollY > 0);
        const restoredScroll = await page.evaluate(() => scrollY);
        results.push({ browser: browserName, target: target.name, modal, pass: true, openScroll, restoredScroll });
        console.log(`PASS ${browserName} ${target.name}: ${modal ? 'modal locks' : 'nonmodal permits'} scroll and close restores`);
      } catch (error) {
        results.push({ browser: browserName, target: target.name, modal, pass: false, error: error.message });
        console.log(`FAIL ${browserName} ${target.name}: modal=${modal}`);
      } finally { await page.close(); }
    }
  } finally { await browser.close(); }
}
mkdirSync('artifacts', { recursive: true });
writeFileSync(process.env.REPORT_PATH || 'artifacts/menu-scroll-results.json', JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
console.log(`${results.filter(r => r.pass).length}/${results.length} target scenarios passed`);
if (results.some(r => !r.pass)) process.exitCode = 1;
