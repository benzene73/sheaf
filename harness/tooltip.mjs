import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const targets = [{name:'upstream',url:'http://localhost:4198/?fixture=tooltip'}];
if (process.env.UPSTREAM_ONLY !== '1') targets.push({name:'liveview',url:process.env.TOOLTIP_URL || 'http://localhost:4197/tooltip'});
const scenarios = [
  {name:'keyboard focus opens tooltip', action:'focus'},
  {name:'Escape closes and retains trigger focus', action:'escape'},
  {name:'keyboard blur closes tooltip', action:'blur'},
  {name:'pointer hover opens and leaving closes tooltip', action:'hover'},
];
const results=[]; const browser=await chromium.launch();
try {
 for(const scenario of scenarios) for(const target of targets) {
  const page=await browser.newPage();
  try {
   await page.goto(target.url); await page.locator('[data-fixture-ready=true]').waitFor();
   const trigger=page.getByRole('button',{name:'Help',exact:true});
   const tooltip=page.getByTestId('tooltip-popup');
   if(scenario.action==='hover') await trigger.hover(); else await page.keyboard.press('Tab');
   await tooltip.waitFor({state:'visible'});
   assert.equal((await tooltip.textContent()).trim(),'Helpful information');
   const semantics={role:await tooltip.getAttribute('role'),describedBy:await trigger.getAttribute('aria-describedby')};
   if(scenario.action==='escape') {
    await page.keyboard.press('Escape'); await tooltip.waitFor({state:'hidden'});
    assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);
   } else if(scenario.action==='blur') {
    await page.keyboard.press('Tab'); await tooltip.waitFor({state:'hidden'});
    assert.equal(await page.getByRole('button',{name:'Outside',exact:true}).evaluate(e=>e===document.activeElement),true);
   } else if(scenario.action==='hover') {
    await page.getByRole('button',{name:'Outside',exact:true}).hover(); await tooltip.waitFor({state:'hidden'});
   }
   results.push({target:target.name,scenario:scenario.name,pass:true,semantics}); console.log(`PASS ${target.name}: ${scenario.name}`);
  }catch(error){results.push({target:target.name,scenario:scenario.name,pass:false,error:error.message}); console.log(`FAIL ${target.name}: ${scenario.name}`);}
  finally {await page.close();}
 }
} finally {await browser.close();}
writeFileSync(process.env.REPORT_PATH || 'artifacts/tooltip-results.json',JSON.stringify({at:new Date().toISOString(),browser:'chromium',results},null,2));
console.log(`${results.filter(r=>r.pass).length}/${results.length} target scenarios passed`);
if(results.some(r=>!r.pass)) process.exitCode=1;


