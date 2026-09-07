import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const browser=await chromium.launch();const page=await browser.newPage();const errors=[];
page.on('pageerror',error=>errors.push(error.message));
let result;
try{
 await page.goto(process.env.COMPONENTS_URL||'http://localhost:4197/components');
 await page.waitForFunction(()=>document.querySelectorAll('[data-fixture-ready=true]').length===4);
 assert.equal(await page.locator('#country [data-part=value]').textContent(),'United Kingdom');
 await page.getByRole('combobox',{name:'Country'}).focus();await page.keyboard.press('ArrowDown');await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='option');await page.keyboard.press('End');await page.keyboard.press('Enter');
 await page.waitForFunction(()=>document.querySelector('[data-testid=country-value]').textContent==='IN');
 assert.equal(await page.locator('#country [data-part=value]').textContent(),'India');
 assert.equal(await page.locator('[data-testid=country-chevron]').count(),1);
 assert.equal(await page.locator('#country-hidden').inputValue(),'IN');
 await page.getByRole('button',{name:'Actions',exact:true}).focus();await page.keyboard.press('ArrowDown');await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='menuitem');await page.keyboard.press('Enter');
 await page.waitForFunction(()=>document.querySelector('[data-testid=action-value]').textContent==='edit');
 await page.getByRole('button',{name:'Edit profile',exact:true}).click();
 await page.getByRole('textbox',{name:'Name',exact:true}).fill('Reader');await page.getByRole('button',{name:'Save',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('[data-testid=saved-name]').textContent==='Reader');
 assert.equal(await page.locator('#profile-dialog').evaluate(el=>el.open),true);
 await page.getByRole('button',{name:'Close',exact:true}).click();
 await page.getByRole('button',{name:'Reading help',exact:true}).click();
 await page.getByRole('button',{name:'Got it',exact:true}).waitFor({state:'visible'});
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#help-layer').evaluate(el=>el.matches(':popover-open')),false);
 assert.deepEqual(errors,[]);result={pass:true,browser:'chromium',checks:['distinct select label/value and preserved decoration','accepted hidden form value','menu action routing','dialog Save patch stays open','popover content and Escape'],errors};
}catch(error){result={pass:false,browser:'chromium',error:error.message,errors};process.exitCode=1;}
finally{await browser.close();}
mkdirSync('artifacts',{recursive:true});writeFileSync(process.env.REPORT_PATH || 'artifacts/components-smoke.json',JSON.stringify(result,null,2));console.log(result);
