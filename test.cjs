const {chromium}=require('C:/Users/benze/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{
const browser=await chromium.launch(); const page=await browser.newPage();page.setDefaultTimeout(5000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));const results=[];
async function ready(){await page.goto('http://localhost:4197');await page.locator('.phx-connected').waitFor();await page.locator('#option-Apple').waitFor();await page.locator('#query').focus();}
async function test(name,fn){try{await ready();await fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',error:e.message});}}
await test('ArrowDown / Enter selects without navigation',async()=>{
 await page.keyboard.press('ArrowDown');assert.equal(await page.locator('#query').getAttribute('aria-activedescendant'),'option-Apple');
 await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('#accepted').value==='Apple');assert.equal(new URL(page.url()).pathname,'/');
});
await test('New query immediately invalidates old choices',async()=>{
 await page.keyboard.press('ArrowDown');await page.locator('#query').fill('slow');await page.keyboard.press('Enter');
 assert.equal(await page.locator('#accepted').inputValue(),'');assert.equal(await page.locator('#query').getAttribute('aria-activedescendant'),null);
 await page.waitForFunction(()=>Number(document.querySelector('#arrivals').textContent)>=2);assert.equal(await page.locator('#accepted').inputValue(),'');
});
await test('Out-of-order server result cannot replace newer result',async()=>{
 await page.locator('#query').fill('slow');await page.waitForTimeout(85);await page.locator('#query').fill('fast');
 await page.locator('#option-Banana').waitFor();await page.waitForFunction(()=>Number(document.querySelector('#arrivals').textContent)>=3);
 assert.equal(await page.locator('#options').innerText(),'Banana');assert.equal(await page.locator('#query').inputValue(),'fast');
});
await test('LiveView patch preserves input focus and active descendant',async()=>{
 await page.keyboard.press('ArrowDown');
 await page.evaluate(()=>document.querySelector('#patch').click());await page.waitForFunction(()=>document.querySelector('#tick').textContent==='1');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'query');
 assert.equal(await page.locator('#option-Apple').getAttribute('data-patch'),'1');
 const id=await page.locator('#query').getAttribute('aria-activedescendant');assert.equal(id,'option-Apple');assert(await page.locator('#'+id).isVisible());
});
await test('ArrowUp initially chooses last option',async()=>{
 await page.keyboard.press('ArrowUp');assert.equal(await page.locator('#query').getAttribute('aria-activedescendant'),'option-Cherry');
});
await test('Second Escape closes native dialog',async()=>{
 await page.keyboard.press('Escape');assert(await page.locator('#modal').evaluate(e=>e.open));await page.keyboard.press('Escape');assert(!(await page.locator('#modal').evaluate(e=>e.open)));
});
await test('Escape dismisses combo only and delayed reply stays closed',async()=>{
 await page.locator('#query').fill('slow');await page.waitForTimeout(85);await page.keyboard.press('Escape');
 await page.waitForFunction(()=>Number(document.querySelector('#arrivals').textContent)>=2);
 assert(await page.locator('#modal').evaluate(e=>e.open));assert(await page.locator('#options').evaluate(e=>e.hidden));
});
await test('Rejected selection preserves accepted form value',async()=>{
 await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('#accepted').value==='Apple');
 await page.locator('#query').fill('Cherry');await page.locator('#option-Cherry').waitFor();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 await page.locator('#error').filter({hasText:'Selection rejected'}).waitFor();assert.equal(await page.locator('#accepted').inputValue(),'Apple');assert.equal(await page.locator('#accepted-label').innerText(),'Apple');
});
fs.mkdirSync(__dirname+'/artifacts',{recursive:true});fs.writeFileSync(__dirname+'/artifacts/results.json',JSON.stringify({results,errors},null,2));
console.log(JSON.stringify({results,errors},null,2));await page.screenshot({path:__dirname+'/artifacts/fixture.png'});await browser.close();
process.exitCode=results.some(r=>r.status==='FAIL')||errors.length?1:0;
})().catch(e=>{console.error(e);process.exit(1)});
