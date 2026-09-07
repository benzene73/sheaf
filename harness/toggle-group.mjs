import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const targets=[{name:'upstream',url:'http://localhost:4198/?fixture=toggle-group'}];
if(process.env.UPSTREAM_ONLY!=='1')targets.push({name:'liveview',url:process.env.TOGGLE_GROUP_URL||'http://localhost:4197/toggle-group?fixture=toggle-group'});
const scenarios=[
 {name:'single selection replaces and can clear',steps:[['click','List',['List']],['click','List',[]]]},
 {name:'arrows skip disabled and activation changes selection',steps:[['key','ArrowRight',['Grid'],'List'],['key','Space',['List'],'List'],['key','ArrowRight',['List'],'Grid']]},
 {name:'disabled toggle cannot activate',steps:[['disabled','Disabled',['Grid']]]},
 {name:'multiple selection preserves other pressed item',query:'&multiple=true',steps:[['click','List',['Grid','List']],['click','Grid',['List']]]},
];
const results=[];const browser=await chromium.launch();
try{for(const scenario of scenarios)for(const target of targets){const page=await browser.newPage();try{
await page.goto(target.url+(scenario.query||''));await page.locator('[data-fixture-ready=true]').waitFor();await page.getByRole('button',{name:'Grid',exact:true}).focus();
for(const [action,value,pressed,focus]of scenario.steps){const button=page.getByRole('button',{name:value,exact:true});if(action==='click')await button.click();else if(action==='key')await page.keyboard.press(value);else{assert.equal(await button.isDisabled(),true);await button.evaluate(e=>e.click());}
await page.waitForFunction(expected=>JSON.stringify([...document.querySelectorAll('button[aria-pressed=true]')].map(e=>e.textContent.trim()))===JSON.stringify(expected),pressed);
if(focus)assert.equal(await page.evaluate(()=>document.activeElement.textContent.trim()),focus);}
results.push({target:target.name,scenario:scenario.name,pass:true});console.log(`PASS ${target.name}: ${scenario.name}`);
}catch(error){results.push({target:target.name,scenario:scenario.name,pass:false,error:error.message});console.log(`FAIL ${target.name}: ${scenario.name}`);}finally{await page.close();}}}finally{await browser.close();}
writeFileSync(process.env.REPORT_PATH||'artifacts/toggle-group-results.json',JSON.stringify({at:new Date().toISOString(),browser:'chromium',results},null,2));console.log(`${results.filter(r=>r.pass).length}/${results.length} target scenarios passed`);if(results.some(r=>!r.pass))process.exitCode=1;
