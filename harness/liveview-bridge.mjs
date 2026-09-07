import { chromium, firefox, webkit } from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
const results=[];
for(const name of (process.env.BROWSERS||'chromium').split(',')) {
 const browser=await ({chromium,firefox,webkit}[name]).launch();
 async function run(title,fn,query='?delay=true'){
  const page=await browser.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try {await page.goto('http://localhost:4197/paired'+query);await page.locator('[data-fixture-ready=true]').waitFor();await page.getByRole('combobox').focus();await fn(page);assert.deepEqual(errors,[]);results.push({browser:name,title,pass:true});console.log('PASS',name,title);}
  catch(e){results.push({browser:name,title,pass:false,error:e.message});console.error('FAIL',name,title,e.message);}
  finally{await page.close();}
 }
 const count=(p,part,value)=>p.waitForFunction(({part,value})=>Number(document.querySelector(`[data-testid="${part}"]`).textContent)===value,{part,value});
 const canonical=(p)=>p.getByTestId('accepted-value').textContent();
 const key=(p,k)=>p.keyboard.press(k);
 await run('new input invalidates delayed selection on both sides',async p=>{
  await key(p,'ArrowDown');await key(p,'Enter');await count(p,'pending-request',1);
  await p.getByRole('combobox').fill('Ch');await count(p,'settled-count',1);
  assert.equal(await canonical(p),'');assert.equal(await p.getByRole('combobox').inputValue(),'Ch');
  assert.equal(await p.getByRole('combobox').getAttribute('aria-expanded'),'true');
  await key(p,'ArrowDown');await key(p,'Enter');await count(p,'settled-count',2);
  await p.waitForFunction(()=>document.querySelector('[role=combobox]').value==='Cherry');assert.equal(await canonical(p),'Cherry');
 });
 await run('dismissal invalidates pending selection without reopening',async p=>{
  await key(p,'ArrowDown');await key(p,'Enter');await count(p,'pending-request',1);await key(p,'Escape');await count(p,'settled-count',1);
  assert.equal(await canonical(p),'');assert.equal(await p.getByRole('combobox').getAttribute('aria-expanded'),'false');
 });
 await run('newer proposal wins while older validation finishes',async p=>{
  await key(p,'ArrowDown');await key(p,'Enter');await count(p,'pending-request',1);
  await key(p,'ArrowUp');await key(p,'ArrowUp');await key(p,'Enter');await count(p,'pending-request',2);await count(p,'settled-count',2);
  await p.waitForFunction(()=>document.querySelector('[role=combobox]').value==='Cherry');assert.equal(await canonical(p),'Cherry');
 },'?reverse=true');
 await run('delayed rejection preserves accepted value and open popup',async p=>{
  await key(p,'ArrowUp');await key(p,'ArrowUp');await key(p,'ArrowUp');await key(p,'Enter');await count(p,'settled-count',1);
  await count(p,'value-change-count',1);assert.equal(await canonical(p),'Apple');assert.equal(await p.getByRole('combobox').getAttribute('aria-expanded'),'true');
 },'?delay=true&cancelValue=true&defaultValue=Apple');
 await run('external accepted value reconciles independently of query',async p=>{
  await p.getByRole('combobox').fill('xyz');await p.locator('#paired-external').evaluate(el=>el.click());
  await p.waitForFunction(()=>document.querySelector('[data-testid=accepted-value]').textContent==='Apple');
  assert.equal(await p.getByRole('combobox').inputValue(),'xyz');await p.locator('#paired-outside').click();
  assert.equal(await p.getByRole('combobox').inputValue(),'Apple');
 });
 await run('LiveView option patch preserves active item and input focus',async p=>{
  await key(p,'ArrowUp');const active=await p.getByRole('combobox').getAttribute('aria-activedescendant');
  await p.locator('#paired-patch').evaluate(el=>el.click());await p.waitForFunction(()=>document.querySelector('#paired-tick').textContent==='1');
  assert.equal(await p.getByRole('combobox').getAttribute('aria-activedescendant'),active);assert.equal(await p.getByRole('combobox').evaluate(el=>document.activeElement===el),true);
 });
 await browser.close();
}
mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/liveview-bridge-results.json',JSON.stringify({at:new Date().toISOString(),results},null,2));
if(results.some(x=>!x.pass))process.exitCode=1;
