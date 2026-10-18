import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 const page=await browser.newPage({viewport:{width:1366,height:768}}),external=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.hostname==='127.0.0.1')route.continue();else{external.push(url.href);route.abort();}});
 await page.goto('http://127.0.0.1:4173');await page.getByRole('button',{name:'Enter the classroom'}).waitFor();await page.screenshot({path:'test-results/production-title.png'});
 await page.getByRole('button',{name:'Enter the classroom'}).click();await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>window.__game),undefined);assert.equal(await page.evaluate(()=>document.pointerLockElement?.id),'game');
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'Controls & settings'}).click();await page.screenshot({path:'test-results/settings.png'});await page.getByRole('button',{name:'Save & return'}).click();await page.getByRole('button',{name:'Quit to title'}).click();
 await page.getByRole('button',{name:'Precision',exact:true}).click();await page.getByRole('button',{name:'Enter the classroom'}).click();await page.waitForTimeout(150);assert.equal(await page.locator('#reserve').innerText(),'/ 16');
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'Quit to title'}).click();await page.getByRole('button',{name:'Teamwork',exact:true}).click();await page.getByRole('button',{name:'Enter the classroom'}).click();await page.waitForTimeout(150);assert.match(await page.locator('#team-objective').innerText(),/Net-assisted hit/);
 // This workstation's antivirus injects its own request into localhost HTML.
 // It is blocked by the route above; it is not shipped in the application.
 const appExternal=external.filter(url=>new URL(url).hostname!=='gc.kis.v2.scr.kaspersky-labs.com');
 assert.deepEqual(appExternal,[]);assert.deepEqual(errors,[]);console.log(`Production offline check passed at 1366×768: all external requests blocked (${external.length} antivirus injection), no external app requests, no dev hooks, settings and both variations work.`);
}finally{await browser.close();}
