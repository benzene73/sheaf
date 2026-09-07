import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:375,height:500}});let result;
try{
 await page.goto('http://localhost:4197/label-combobox');await page.locator('[data-fixture-ready=true]').waitFor({state:'attached'});
 await page.locator('[role=combobox]').evaluate(el=>el.style.cssText='position:fixed;left:8px;bottom:8px;width:400px');
 await page.locator('[role=listbox]').evaluate(el=>el.style.height='1000px');
 await page.getByRole('combobox',{name:'Country'}).focus();await page.keyboard.press('ArrowDown');
 await page.waitForFunction(()=>{const el=document.querySelector('[role=listbox]'),r=el.getBoundingClientRect();return el.matches(':popover-open')&&r.x>=7.5&&r.y>=7.5&&r.right<=367.5&&r.bottom<=492.5;});
 const snapshot=await page.locator('[role=listbox]').evaluate(el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,position:getComputedStyle(el).position,inputFocused:document.activeElement?.getAttribute('role')==='combobox'};});
 assert.equal(snapshot.position,'fixed');assert.equal(snapshot.inputFocused,true);
 await page.keyboard.press('Escape');assert.equal(await page.locator('[role=listbox]').evaluate(el=>el.matches(':popover-open')),false);
 result={pass:true,browser:'chromium',snapshot};
}catch(error){result={pass:false,error:error.message};process.exitCode=1;}finally{await browser.close();}
mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/combobox-positioning.json',JSON.stringify(result,null,2));console.log(result);
