import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const targets=[{name:'upstream',url:'http://localhost:4198/?fixture=label-combobox'}];
if(process.env.UPSTREAM_ONLY!=='1')targets.push({name:'liveview',url:'http://localhost:4197/label-combobox'});
const results=[];const browser=await chromium.launch();
try{for(const scenario of ['selected label submits distinct ID','Escape restores selected label'])for(const target of targets){const page=await browser.newPage();try{
await page.goto(target.url);await page.locator('[data-fixture-ready=true]').waitFor();const input=page.getByRole('combobox',{name:'Country'});assert.equal(await input.inputValue(),'United Kingdom');
if(scenario==='selected label submits distinct ID'){
await input.fill('Ind');await page.getByRole('option',{name:'India',exact:true}).waitFor();await input.press('ArrowDown');await input.press('Enter');
await page.waitForFunction(()=>document.querySelector('input[role=combobox]').value==='India');assert.equal(await page.locator('input[name=country]').inputValue(),'in');await page.getByRole('button',{name:'Submit',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-testid=last-submitted-value]').textContent.trim()==='in');
}else{await input.fill('Ind');await page.getByRole('option',{name:'India',exact:true}).waitFor();await input.press('Escape');await page.waitForFunction(()=>document.querySelector('input[role=combobox]').value==='United Kingdom');assert.equal(await page.locator('input[name=country]').inputValue(),'gb');}
results.push({target:target.name,scenario,pass:true});console.log(`PASS ${target.name}: ${scenario}`);
}catch(error){results.push({target:target.name,scenario,pass:false,error:error.message});console.log(`FAIL ${target.name}: ${scenario}`);}finally{await page.close();}}}finally{await browser.close();}
writeFileSync(process.env.REPORT_PATH||'artifacts/label-combobox-results.json',JSON.stringify({at:new Date().toISOString(),browser:'chromium',results},null,2));console.log(`${results.filter(r=>r.pass).length}/${results.length} target scenarios passed`);if(results.some(r=>!r.pass))process.exitCode=1;

