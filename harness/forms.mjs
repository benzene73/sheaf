import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
const checks = [];
page.on('pageerror', error => errors.push(error.message));
let result;
try {
  await page.goto(process.env.FORMS_URL || 'http://localhost:4197/forms');
  await page.waitForFunction(() => document.querySelectorAll('[data-fixture-ready=true]').length === 4);
  const combo = page.getByRole('combobox', {name: 'Visual novel', exact: true});
  const status = page.getByRole('combobox', {name: 'Status', exact: true});
  const quantity = page.getByLabel('Quantity', {exact: true});
  assert.equal(await combo.inputValue(), 'Hotel Dusk');
  assert.equal(await quantity.inputValue(), '1');
  await combo.fill('Clan');
  await page.getByRole('option', {name: 'Clannad', exact: true}).click();
  await page.waitForFunction(() => document.querySelector('[name="entry[vn_id]"]').value === 'clannad');
  assert.equal(await combo.inputValue(), 'Clannad');
  checks.push('custom option content preserves canonical label and submitted ID');

  await status.focus(); await page.keyboard.press('ArrowDown');
  await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'option');
  await page.keyboard.press('End'); await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('[name="entry[status]"]').value === 'wishlist');
  await quantity.fill('2.5'); await quantity.press('Tab');
  await page.getByRole('button', {name: 'Save entry', exact: true}).click();
  await page.waitForFunction(() => document.querySelector('[data-testid=form-saves]').textContent === '1');
  assert.deepEqual(JSON.parse(await page.locator('[data-testid=form-saved]').textContent()),
    {vn_id: 'clannad', status: 'wishlist', quantity: '2.5'});
  checks.push('field-backed combobox/select/number submit through one normal Phoenix form');

  await quantity.fill('0'); await quantity.press('Tab');
  await page.getByText('must be greater than zero', {exact: true}).waitFor({state: 'visible'});
  assert.equal(await quantity.getAttribute('aria-invalid'), 'true');
  const describedBy = await quantity.getAttribute('aria-describedby');
  assert.ok(describedBy);
  assert.match(await page.locator(`[id="${describedBy.split(' ')[0]}"]`).textContent(), /greater than zero/);
  await page.getByRole('button', {name: 'Save entry', exact: true}).click();
  assert.equal(await page.locator('[data-testid=form-saves]').textContent(), '1');
  checks.push('server validation is visible and associated with its input');

  await page.getByRole('button', {name: 'Load another entry', exact: true}).click();
  await page.waitForFunction(() => document.querySelector('[name="entry[vn_id]"]').value === 'umineko');
  await page.waitForFunction(() => document.querySelector('#entry_quantity-input').value === '3');
  assert.equal(await combo.inputValue(), 'Umineko');
  await page.getByRole('button', {name: 'Restore initial entry', exact: true}).click();
  await page.waitForFunction(() => document.querySelector('#entry_quantity-input').value === '1');
  assert.equal(await combo.inputValue(), 'Hotel Dusk');
  assert.equal(await page.locator('[name="entry[status]"]').inputValue(), 'reading');
  checks.push('server replacement and reset reconcile all three controls');

  await combo.fill('Uncommitted search');
  await page.getByRole('button', {name: 'Reset browser fields', exact: true}).click();
  await page.waitForFunction(() => document.querySelector('#entry_vn_id-input').value === 'Hotel Dusk');
  checks.push('native form reset clears the transient combobox query');

  const menu = page.getByRole('button', {name: 'Entry actions', exact: true});
  await menu.focus(); await page.keyboard.press('ArrowDown');
  await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'menuitem');
  await page.keyboard.press('d');
  await page.waitForFunction(() => document.activeElement?.getAttribute('data-value') === 'duplicate');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('[data-testid=form-action]').textContent === 'duplicate');
  checks.push('composed menu typeahead uses semantic label rather than decorative content');
  assert.deepEqual(errors, []);
  result = {pass: true, browser: 'chromium', checks, errors};
} catch (error) {
  result = {pass: false, browser: 'chromium', checks, error: error.message, errors};
  process.exitCode = 1;
} finally { await browser.close(); }
mkdirSync('artifacts', {recursive: true});
writeFileSync(process.env.REPORT_PATH || 'artifacts/forms.json', JSON.stringify(result, null, 2));
console.log(result);
