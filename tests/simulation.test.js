import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/world.js';
import { Lesson } from '../src/simulation.js';
const step = (s, seconds, input={}) => { for(let t=0;t<seconds;t+=1/60) s.update(1/60,input); };
const aim = (s) => { const p=s.player,k=s.koro; const dx=k.x-p.x,dz=k.z-p.z; p.yaw=Math.atan2(-dx,-dz); p.pitch=Math.atan2(2.3-p.eye,Math.hypot(dx,dz)); };
test('desks and walls block movement, a doorway connects the yard',()=>{
 const w=new World(); assert.equal(w.free(-5,-3,.3),false); assert.equal(w.free(8,0,.3),false); assert.equal(w.free(8,-6,.3),true);
 const p={x:0,z:0}; w.move(p,30,0,.3); assert.ok(p.x<8); const route=w.path({x:0,z:0},{x:17,z:0}); assert.ok(route.length>2); for(const p of route) assert.ok(w.free(p.x,p.z,.4));
});
test('solid wall intercepts rays but open doorway does not',()=>{
 const w=new World(); assert.ok(w.raycast({x:7,y:1.6,z:0},{x:1,y:0,z:0},10)<2); assert.equal(w.raycast({x:7,y:1.6,z:-6},{x:1,y:0,z:0},5),5);
});
test('aware teacher intercepts direct shots without interrupting a committed tag',()=>{
 const s=new Lesson(12);s.player.x=0;s.player.z=-2;s.koro.x=0;s.koro.z=-7;s.koro.state='windup';s.koro.target={x:0,z:-2};s.koro.timer=.8;aim(s);s.attack();assert.equal(s.hits,0);assert.equal(s.koro.state,'windup');assert.ok(s.events.some(e=>e.type==='intercept'));
});
test('knife cannot extend across the room or pass through a wall',()=>{
 const s=new Lesson();s.tool=2;s.player.x=7;s.player.z=0;s.koro.x=9;s.koro.z=0;s.koro.state='trapped';aim(s);s.attack();assert.equal(s.hits,0);
 s.cooldown=0;s.koro.x=7;s.koro.z=-5;aim(s);s.attack();assert.equal(s.hits,0);
});
test('tag immunity prevents one contact from draining all mistakes',()=>{
 const s=new Lesson();s.tag();s.tag();s.tag();assert.equal(s.mistakes,1);step(s,3.1);s.tag();assert.equal(s.mistakes,2);
});
test('trap placement and preview agree; retrieve returns inventory',()=>{
 const s=new Lesson();s.player.x=0;s.player.z=0;s.player.yaw=0;
 const p=s.trapPreview();assert.equal(p.valid,true);assert.equal(s.placeTrap(),true);assert.equal(s.traps.length,1);assert.equal(s.trapStock,2);
 s.player.z=-1;s.retrieve();assert.equal(s.traps.length,0);assert.equal(s.trapStock,3);
 s.player.x=7;s.player.z=0;s.player.yaw=-Math.PI/2;assert.equal(s.trapPreview().valid,false);assert.equal(s.placeTrap(),false);
});
test('a bound tentacle creates contact and needs coordinated follow-through',()=>{
 const s=new Lesson();Object.assign(s.koro,{x:0,z:-6,yaw:Math.PI,headYaw:Math.PI,state:'observe',timer:8,lane:{x:0,z:-3}});s.traps.push({id:1,x:0,z:-6,armed:0,used:false,seen:false});s.updateTraps(.01);assert.equal(s.koro.state,'trapped');s.player.x=3;s.player.z=-6;aim(s);s.attack();assert.equal(s.hits,0);assert.equal(s.stats.contacts,1);step(s,.3);s.player.x=3.3;s.player.z=-5.4;aim(s);s.attack();assert.equal(s.hits,1);assert.equal(s.assists.trap,1);
});
test('classmates move, prepare, distract and enforce cooldown',()=>{
 const s=new Lesson();const a=s.allies.karma;const before={x:a.x,z:a.z};assert.equal(s.command(),true);assert.equal(s.command(),false);
 step(s,1);assert.ok(Math.hypot(a.x-before.x,a.z-before.z)>.1);step(s,4);assert.ok(a.cooldown>0);assert.ok(s.events.some(e=>e.type==='ability'));
});
test('a missed committed tag has a real counter opening',()=>{
 const s=new Lesson();s.koro.state='windup';s.koro.timer=.01;s.koro.target={x:0,z:-3};s.koro.x=0;s.koro.z=-7;s.player.x=3;s.player.z=-3;
 step(s,1);assert.equal(s.koro.state,'counter');s.player.x=s.koro.x+1.6;s.player.z=s.koro.z;s.tool=2;aim(s);s.player.pitch=0;s.attack();assert.equal(s.hits,0);assert.equal(s.stats.contacts,1);step(s,.36);s.player.z-=.4;aim(s);s.attack();assert.equal(s.hits,1);
});
test('all stage objectives win, separate mistakes lose, retry fully resets',()=>{
 const s=new Lesson(42);for(let i=0;i<s.totalGoal;i++){s.koro.state='observe';s.score('angle');}assert.equal(s.status,'won');assert.equal(s.stage,3);
 const fresh=new Lesson(42);assert.equal(fresh.hits,0);assert.equal(fresh.traps.length,0);assert.equal(fresh.allies.karma.cooldown,0);assert.equal(fresh.seed,s.seed);assert.equal(fresh.stage,1);assert.equal(fresh.player.dashCooldown,0);
 for(let i=0;i<fresh.maxMistakes;i++){fresh.immunity=0;fresh.tag();}assert.equal(fresh.status,'lost');
});
test('lesson timeout ends and precision reload respects finite reserve',()=>{
 const s=new Lesson(1,'precision');s.ammo=0;s.reserve=2;s.reload();step(s,1.3);assert.equal(s.ammo,2);assert.equal(s.reserve,0);s.remaining=.01;step(s,.1);assert.equal(s.status,'lost');
});
test('teamwork requires both assistance types before the final result',()=>{
 const s=new Lesson(1,'teamwork');for(let i=0;i<s.totalGoal+3;i++){s.koro.state='observe';s.score('angle');}assert.equal(s.status,'playing');assert.equal(s.hits,s.totalGoal);assert.equal(s.stageHits,s.stageGoal);assert.match(s.lastHint,/net-assisted/);s.koro.state='observe';s.score('net');assert.equal(s.status,'playing');assert.equal(s.hits,s.totalGoal);assert.match(s.lastHint,/classmate-assisted/);s.koro.state='observe';s.score('crossfire');assert.equal(s.status,'won');assert.equal(s.hits,s.totalGoal);assert.equal(s.stageHits,s.stageGoal);
});
