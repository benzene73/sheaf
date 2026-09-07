import {chromium, firefox, webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
const results=[];
for (const engine of (process.env.BROWSERS || 'chromium').split(',')) {
 const launcher = {chromium,firefox,webkit}[engine];
 const browser=await launcher.launch();
 try {for(const family of ['menu','select']) for(const modal of [true,false]) for(const target of ['upstream','liveview']) {
 const page=await browser.newPage();
 try {
 const url=target==='upstream'?`http://localhost:4198/?fixture=${family}&modal=${modal}`:`http://localhost:4197/${family}?modal=${modal}`;
 await page.goto(url); await page.locator('[data-fixture-ready=true]').waitFor({state:'attached'});
 await page.evaluate(()=>{const section=document.createElement('section');section.id='a11y-probe';section.innerHTML='<h2>Background audit heading</h2><p>Background audit text</p><button>Background audit control</button>';document.body.append(section);});
 const trigger=page.locator(target==='liveview'?'[data-part=anchor]':family==='menu'?'button:has-text("Open menu")':'[role=combobox]');
 await trigger.focus(); await trigger.press('ArrowDown');
 await page.waitForFunction(()=>document.querySelector('[aria-expanded=true]'));
 await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='menuitem'||document.activeElement?.getAttribute('role')==='option');
 const exposedOutside=await page.getByRole('button',{name:'Outside',exact:true}).count();
 const outside=await page.getByRole('button',{name:'Outside',exact:true,includeHidden:true}).evaluate(el=>{
 const ancestors=[];for(let n=el;n;n=n.parentElement)if(n.hasAttribute('aria-hidden')||n.hasAttribute('inert'))ancestors.push({tag:n.tagName,ariaHidden:n.getAttribute('aria-hidden'),inert:n.hasAttribute('inert')});return ancestors;});
 const exposedHeading=await page.getByRole('heading',{name:'Background audit heading'}).count();
 const markers=await page.locator('#a11y-probe').evaluate(el=>({aria:el.getAttribute('aria-hidden'),inert:el.inert,marker:el.hasAttribute('data-base-ui-inert')}));
 const open={exposedOutside,outside,exposedHeading,markers};
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>!document.querySelector('[aria-expanded=true]'));
 const restoredOutside=await page.getByRole('button',{name:'Outside',exact:true}).count();
 const restoredMarker=await page.locator('#a11y-probe').evaluate(el=>el.hasAttribute('data-base-ui-inert'));
 assert.equal(exposedOutside,1);assert.equal(exposedHeading,1);assert.equal(markers.aria,null);assert.equal(markers.inert,false);assert.equal(restoredOutside,1);assert.equal(restoredMarker,false);
 results.push({engine,family,modal,target,open,restoredOutside,restoredMarker,pass:true});
 }catch(e){results.push({engine,family,modal,target,error:e.message});}finally{await page.close();}
 }}finally{await browser.close();}
}
mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/a11y-modality.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));

if(results.some(row=>row.error))process.exitCode=1;
