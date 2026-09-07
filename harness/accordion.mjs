import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const targets=[{name:'upstream',url:'http://localhost:4198/?fixture=accordion'}];
if(process.env.UPSTREAM_ONLY!=='1') targets.push({name:'liveview',url:process.env.ACCORDION_URL||'http://localhost:4197/accordion'});
const scenarios=[
 {name:'pointer expands and collapses',steps:[['click','Overview',['Overview']],['click','Overview',[]]]},
 {name:'Enter and Space activate disclosure',steps:[['key','Enter',['Overview']],['key','Space',[]]]},
 {name:'single-open closes previous panel',steps:[['click','Overview',['Overview']],['click','Reviews',['Reviews']]]},
 {name:'disabled item cannot open',steps:[['disabled','Disabled',[]]]},
];
const results=[];const browser=await chromium.launch();
try{for(const scenario of scenarios)for(const target of targets){const page=await browser.newPage();try{
 await page.goto(target.url);await page.locator('[data-fixture-ready=true]').waitFor();
 await page.getByRole('button',{name:'Overview',exact:true}).focus();
 for(const [action,value,expected] of scenario.steps){
  const button=page.getByRole('button',{name:value,exact:true});
  if(action==='click')await button.click();else if(action==='key')await page.keyboard.press(value);else{assert.equal(await button.isDisabled(),true);await button.evaluate(e=>e.click());}
  await page.waitForFunction(expected=>JSON.stringify([...document.querySelectorAll('button[aria-expanded=true]')].map(e=>e.textContent.trim()))===JSON.stringify(expected),expected);
  assert.deepEqual(await page.getByRole('region').allTextContents(),expected.map(label=>`${label} content`));
  for(const label of expected){const trigger=page.getByRole('button',{name:label,exact:true});const panel=page.getByRole('region',{name:label,exact:true});assert.equal(await trigger.getAttribute('aria-controls'),await panel.getAttribute('id'));assert.equal(await panel.getAttribute('aria-labelledby'),await trigger.getAttribute('id'));}
 }
 results.push({target:target.name,scenario:scenario.name,pass:true});console.log(`PASS ${target.name}: ${scenario.name}`);
}catch(error){results.push({target:target.name,scenario:scenario.name,pass:false,error:error.message});console.log(`FAIL ${target.name}: ${scenario.name}`);}finally{await page.close();}}}finally{await browser.close();}
writeFileSync(process.env.REPORT_PATH||'artifacts/accordion-results.json',JSON.stringify({at:new Date().toISOString(),browser:'chromium',results},null,2));
console.log(`${results.filter(r=>r.pass).length}/${results.length} target scenarios passed`);if(results.some(r=>!r.pass))process.exitCode=1;
