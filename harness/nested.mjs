import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
let result;
try {
  await page.goto(process.env.NESTED_URL || 'http://localhost:4197/nested');
  await page.waitForFunction(() => document.querySelectorAll('[data-fixture-ready=true]').length === 2);
  await page.getByRole('button', {name: 'Edit profile', exact: true}).click();
  const dialog = page.locator('#nested-profile-dialog');
  const country = page.getByRole('combobox', {name: 'Country', exact: true});
  await country.focus(); await page.keyboard.press('ArrowDown');
  await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'option');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#nested-country-layer').evaluate(el => el.matches(':popover-open')), false);
  assert.equal(await dialog.evaluate(el => el.open), true);
  assert.equal(await country.evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('ArrowDown');
  await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'option');
  await page.keyboard.press('End'); await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('[data-testid=nested-country-value]').textContent === 'IN');
  assert.equal(await dialog.evaluate(el => el.open), true);
  await page.getByRole('button', {name: 'Save', exact: true}).click();
  await page.waitForFunction(() => document.querySelector('[data-testid=nested-saves]').textContent === '1');
  assert.equal(await page.locator('[data-testid=nested-saved-value]').textContent(), 'IN');
  assert.equal(await dialog.evaluate(el => el.open), true);
  await page.getByRole('button', {name: 'Close', exact: true}).click();
  assert.equal(await dialog.evaluate(el => el.open), false);
  assert.equal(await page.getByRole('button', {name: 'Edit profile', exact: true}).evaluate(el => el === document.activeElement), true);
  assert.deepEqual(errors, []);
  result = {pass: true, browser: 'chromium', checks: ['Select Escape leaves parent Dialog open and returns focus', 'Select value survives server patch', 'Save submits selected country and leaves Dialog open', 'Close returns focus to Edit profile'], errors};
} catch (error) { result = {pass: false, browser: 'chromium', error: error.message, errors}; process.exitCode = 1; }
finally { await browser.close(); }
mkdirSync('artifacts', {recursive: true});
writeFileSync(process.env.REPORT_PATH || 'artifacts/nested-smoke.json', JSON.stringify(result, null, 2));
console.log(result);
