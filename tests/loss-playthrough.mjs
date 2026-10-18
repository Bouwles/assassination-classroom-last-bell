import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{const page=await browser.newPage({viewport:{width:1440,height:900}});await page.goto('http://127.0.0.1:5173');await page.getByRole('button',{name:'Enter the classroom'}).click();await page.keyboard.down('w');await page.waitForTimeout(1900);await page.keyboard.up('w');
 const start=Date.now();let result;
 let count=0;while(Date.now()-start<180000){result=await page.evaluate(()=>({screen:window.__game.screen,status:window.__game.lesson.status,time:window.__game.lesson.time,mistakes:window.__game.lesson.mistakes,koro:window.__game.lesson.koro.state,x:window.__game.lesson.player.x,z:window.__game.lesson.player.z}));if(++count%20===0)console.log('Progress',result);if(result.status!=='playing')break;await page.waitForTimeout(500);}
 console.log(result);assert.equal(result.status,'lost');assert.equal(result.mistakes,3);await page.getByRole('heading',{name:'A lesson learned.'}).waitFor();await page.screenshot({path:'test-results/real-loss.png'});
 const seed=await page.evaluate(()=>window.__game.lesson.seed);await page.getByRole('button',{name:'Retry this setup'}).click();await page.waitForTimeout(150);const fresh=await page.evaluate(()=>({seed:window.__game.lesson.seed,mistakes:window.__game.lesson.mistakes,hits:window.__game.lesson.hits,status:window.__game.lesson.status}));assert.equal(fresh.seed,seed);assert.equal(fresh.mistakes,0);assert.equal(fresh.hits,0);assert.equal(fresh.status,'playing');console.log('Natural three-tag browser loss and same-setup retry passed.');
}finally{await browser.close();}
