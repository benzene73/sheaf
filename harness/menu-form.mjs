import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const targets=[{name:'upstream',url:process.env.UPSTREAM_URL||'http://localhost:4198/?fixture=menu-form'}];
if(process.env.UPSTREAM_ONLY!=='1')targets.push({name:'liveview',url:'http://localhost:4197/menu-form'});
const results=[];const browser=await chromium.launch();
try{for(const scenario of ['Enter submits native menu button','Space submits native menu button','pointer submits native menu button','disabled menu button cannot submit'])for(const target of targets){const page=await browser.newPage();try{
await page.goto(target.url);await page.locator('[data-fixture-ready=true]').waitFor();const trigger=page.getByRole('button',{name:'Actions',exact:true});await trigger.focus();await trigger.press('ArrowDown');const archive=page.getByRole('menuitem',{name:'Archive',exact:true});await archive.waitFor();await page.waitForFunction(()=>document.activeElement?.textContent.trim()==='Archive');
if(scenario==='disabled menu button cannot submit'){const disabled=page.getByRole('menuitem',{name:'Delete',exact:true});assert.equal(await disabled.isDisabled(),true);await disabled.evaluate(e=>e.click());assert.equal((await page.getByTestId('submit-count').textContent()).trim(),'0');assert.equal(await trigger.getAttribute('aria-expanded'),'true');}
else{if(scenario.startsWith('Enter'))await page.keyboard.press('Enter');else if(scenario.startsWith('Space'))await page.keyboard.press('Space');else await archive.click();await page.waitForFunction(()=>document.querySelector('[data-testid=submit-count]').textContent.trim()==='1');assert.equal((await page.getByTestId('submitted-action').textContent()).trim(),'archive');await page.waitForFunction(()=>document.querySelector('button[aria-haspopup=menu]')?.getAttribute('aria-expanded')==='false');assert.equal((await page.getByTestId('submit-count').textContent()).trim(),'1');}
results.push({target:target.name,scenario,pass:true});console.log(`PASS ${target.name}: ${scenario}`);
}catch(error){results.push({target:target.name,scenario,pass:false,error:error.message});console.log(`FAIL ${target.name}: ${scenario}`);}finally{await page.close();}}}finally{await browser.close();}
writeFileSync(process.env.REPORT_PATH||'artifacts/menu-form-results.json',JSON.stringify({at:new Date().toISOString(),browser:'chromium',results},null,2));console.log(`${results.filter(r=>r.pass).length}/${results.length} target scenarios passed`);if(results.some(r=>!r.pass))process.exitCode=1;

