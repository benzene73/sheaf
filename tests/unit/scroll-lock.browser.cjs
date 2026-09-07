const { chromium, firefox, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'D:/liveview-primitives-lab/node_modules/playwright');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const bundle = path.join(root, 'artifacts/scroll-lock.js');
execFileSync(process.env.ESBUILD_BINARY || 'D:/kaguya/assets/node_modules/@esbuild/win32-x64/esbuild.exe',
  [path.join(root, 'src/behavior/scroll-lock.ts'), '--bundle', '--platform=browser', '--format=iife', '--global-name=ScrollLockPort', `--outfile=${bundle}`],
  { env: { ...process.env, NODE_PATH: process.env.NODE_PATH || 'D:/liveview-primitives-lab/node_modules' } });
(async () => {
  const results = [];
  for (const [name, type] of Object.entries({ chromium, firefox, webkit })) {
    const browser = await type.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 640, height: 480 } });
    async function reset() {
      await page.goto('about:blank');
      await page.setContent('<html style="scroll-behavior:auto"><head></head><body style="margin:0"><div style="height:3000px">Page</div></body></html>');
      await page.addScriptTag({ path: bundle });
    }
    async function run(label, fn) {
      await reset(); await fn(); results.push({ browser: name, test: label, pass: true });
      console.log(`${name}: ${label}`);
    }
    await run('nested locks restore exact owned inline styles only after final release', async () => {
      await page.evaluate(() => { window.before = [document.documentElement.style.cssText, document.body.style.cssText]; window.release1 = ScrollLockPort.acquireScrollLock(document); window.release2 = ScrollLockPort.acquireScrollLock(document); });
      await page.waitForFunction(() => getComputedStyle(document.body).overflowY === 'hidden' || getComputedStyle(document.documentElement).overflowY === 'hidden');
      await page.evaluate(() => window.release1());
      assert.equal(await page.evaluate(() => getComputedStyle(document.body).overflowY === 'hidden' || getComputedStyle(document.documentElement).overflowY === 'hidden'), true);
      await page.evaluate(() => window.release2());
      await page.waitForFunction(() => document.documentElement.style.cssText === window.before[0] && document.body.style.cssText === window.before[1]);
    });
    await run('independent iframe document lock remains after outer document releases', async () => {
      await page.evaluate(async () => {
        const frame = document.createElement('iframe'); document.body.append(frame);
        const doc = frame.contentDocument; doc.body.innerHTML = '<div style="height:3000px">Frame</div>';
        window.childDoc = doc; window.release1 = ScrollLockPort.acquireScrollLock(document); window.release2 = ScrollLockPort.acquireScrollLock(doc);
      });
      await page.waitForFunction(() => childDoc.defaultView.getComputedStyle(childDoc.body).overflowY === 'hidden' || childDoc.defaultView.getComputedStyle(childDoc.documentElement).overflowY === 'hidden');
      await page.evaluate(() => release1());
      await page.waitForFunction(() => document.body.style.overflowY !== 'hidden');
      // Parent unlock may resize the iframe; upstream unlocks then relocks on rAF.
      await page.waitForFunction(() => childDoc.defaultView.getComputedStyle(childDoc.body).overflowY === 'hidden' || childDoc.defaultView.getComputedStyle(childDoc.documentElement).overflowY === 'hidden');
      await page.evaluate(() => release2());
      await page.waitForFunction(() => childDoc.body.style.overflowY !== 'hidden' && childDoc.documentElement.style.overflowY !== 'hidden');
    });
    await run('author class lock is observed and not restored after handoff', async () => {
      await page.evaluate(async () => {
        const style = document.createElement('style'); style.textContent = '.author-lock { overflow: hidden; }'; document.head.append(style);
        document.body.className = 'author-lock'; window.release1 = ScrollLockPort.acquireScrollLock(document);
        await new Promise(resolve => setTimeout(resolve, 0)); // Flush the source's documented deferred acquisition.
        document.body.className = '';
      });
      await page.waitForFunction(() => document.body.style.overflowY === 'hidden' || document.documentElement.style.overflowY === 'hidden');
      await page.evaluate(() => release1());
      await page.waitForFunction(() => getComputedStyle(document.body).overflowY !== 'hidden' && getComputedStyle(document.documentElement).overflowY !== 'hidden');
    });
    await run('idempotent release and close-before-acquire do not poison next lock', async () => {
      await page.evaluate(() => { const release = ScrollLockPort.acquireScrollLock(document); release(); release(); window.release2 = ScrollLockPort.acquireScrollLock(document); });
      await page.waitForFunction(() => document.body.style.overflowY === 'hidden' || document.documentElement.style.overflowY === 'hidden');
      await page.evaluate(() => release2());
      await page.waitForFunction(() => document.body.style.overflowY !== 'hidden' && document.documentElement.style.overflowY !== 'hidden');
    });
    await run('html overflow container is locked and restored', async () => {
      await page.evaluate(() => { document.documentElement.style.overflow = 'auto'; window.release1 = ScrollLockPort.acquireScrollLock(document); });
      await page.waitForFunction(() => document.documentElement.style.overflowY === 'hidden');
      await page.evaluate(() => release1());
      await page.waitForFunction(() => document.documentElement.style.overflowY === 'auto');
    });
    await run('touch lock uses exact twenty-pixel width tolerance', async () => {
      const decision = await page.evaluate(() => {
        const popup = document.createElement('div'); document.body.append(popup);
        popup.style.width = `${document.documentElement.clientWidth - 20}px`;
        const wide = ScrollLockPort.shouldLockAnchoredPopup(true, true, popup);
        popup.style.width = `${document.documentElement.clientWidth - 21}px`;
        return [wide, ScrollLockPort.shouldLockAnchoredPopup(true, true, popup), ScrollLockPort.shouldLockAnchoredPopup(true, false, null), ScrollLockPort.shouldLockAnchoredPopup(false, false, popup)];
      });
      assert.deepEqual(decision, [true, false, true, false]);
    });
    await browser.close();
  }
  fs.writeFileSync(path.join(root, 'artifacts/scroll-lock-results.json'), JSON.stringify(results, null, 2));
  console.log(`${results.length}/${results.length} passed`);
})().catch(error => { console.error(error); process.exit(1); });
