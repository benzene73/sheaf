import {buildSync} from 'esbuild';
import {chromium,firefox,webkit} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
mkdirSync('artifacts',{recursive:true});
const bundle=buildSync({entryPoints:['src/liveview/ported-combobox.ts'],bundle:true,format:'iife',globalName:'ActualHook',write:false}).outputFiles[0].text;
const results=[];
for(const [engine,launcher] of Object.entries({chromium,firefox,webkit}).filter(([name])=>(process.env.BROWSERS||'chromium').split(',').includes(name))){
 const browser=await launcher.launch(); const page=await browser.newPage();
 try{
 await page.route('https://bridge-audit.test/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
 await page.goto('https://bridge-audit.test/');
 await page.setContent(['a','b'].map(id=>`<div id="${id}" data-accepted=""><input data-part="input" role="combobox"><div data-part="list" hidden>${['Apple','Banana','Cherry'].map(v=>`<div id="${id}-${v}" data-value="${v}" role="option">${v}</div>`).join('')}</div></div>`).join(''));
 await page.addScriptTag({content:bundle});
 await page.evaluate(()=>{window.sent=[];window.replies=[];window.hooks=['a','b'].map(id=>{const h={...ActualHook.PortedCombobox,el:document.getElementById(id),pushEvent:(name,payload)=>window.sent.push({id,name,payload}),handleEvent:(_name,callback)=>window.replies.push(callback)};h.mounted();return h;});});
 await page.locator('#a input').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 await page.locator('#b input').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 const before=await page.evaluate(()=>hooks.map(h=>({id:h.el.id,accepted:h.accepted,pending:h.pending?.value})));
 await page.evaluate(()=>{const sentA=sent.find(e=>e.id==='a'&&e.name==='select').payload;const reply={...sentA,component_id:'a',accepted:true,obsolete:false,value:'Apple'};for(const callback of replies)callback(reply);});
 const after=await page.evaluate(()=>hooks.map(h=>({id:h.el.id,accepted:h.accepted,pending:h.pending?.value??null,input:h.input.value})));
 let pass=true,error;try{assert.equal(after[0].accepted,'Apple');assert.equal(after[1].accepted,null);assert.equal(after[1].pending,'Cherry');}catch(e){pass=false;error=e.message;}
 const lifetime=await page.evaluate(()=>{
 const previous=sent.find(e=>e.id==='a'&&e.name==='select').payload;
 const old=hooks[0];old.destroyed();
 const fresh={...ActualHook.PortedCombobox,el:document.getElementById('a'),pushEvent:(name,payload)=>sent.push({id:'a-new',name,payload}),handleEvent:(_name,callback)=>replies.push(callback)};
 fresh.mounted();hooks[0]=fresh;
 return {previous};
 });
 await page.locator('#a input').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 const stale=await page.evaluate(previous=>{for(const callback of replies)callback({...previous,component_id:'a',accepted:true,obsolete:false,value:'Apple'});return {accepted:hooks[0].accepted,pending:hooks[0].pending?.value??null};},lifetime.previous);
 const valid=await page.evaluate(()=>{const current=sent.find(e=>e.id==='a-new'&&e.name==='select').payload;for(const callback of replies)callback({...current,component_id:'a',accepted:true,obsolete:false,value:'Apple'});return {accepted:hooks[0].accepted,pending:hooks[0].pending?.value??null};});
 let lifetimePass=true,lifetimeError;try{assert.equal(stale.accepted,null);assert.equal(stale.pending,'Apple');assert.equal(valid.accepted,'Apple');assert.equal(valid.pending,null);}catch(e){lifetimePass=false;lifetimeError=e.message;}
 results.push({engine,before,after,pass,error,stale,valid,lifetimePass,lifetimeError});
 }finally{await page.close();await browser.close();}
}
writeFileSync(process.env.REPORT_PATH||'artifacts/bridge-isolation.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
if(results.some(r=>!r.pass||!r.lifetimePass))process.exitCode=1;
