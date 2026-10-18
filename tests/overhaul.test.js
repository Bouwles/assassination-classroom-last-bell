import test from 'node:test';
import assert from 'node:assert/strict';
import {Lesson} from '../src/simulation.js';
const tick=(s,seconds,input={})=>{for(let i=0;i<Math.ceil(seconds*60);i++)s.update(1/60,input);};
const fixture=()=>{const s=new Lesson(3018);s.player.x=0;s.player.z=-2;s.koro.x=0;s.koro.z=-7;s.koro.yaw=0;return s;};
const aim=s=>{const p=s.player,k=s.koro;p.yaw=Math.atan2(p.x-k.x,p.z-k.z);p.pitch=Math.atan2(2.5-p.eye,Math.hypot(k.x-p.x,k.z-p.z));};
test('one distraction is not a free pistol hit',()=>{const s=fixture();s.koro.state='distracted';s.koro.yaw=Math.PI/2;s.koro.timer=3;s.koro.assist='karma';aim(s);s.attack();assert.equal(s.hits,0);});
test('inspection and a nominal counter state are not automatic vulnerabilities',()=>{for(const state of ['inspect','counter']){const s=fixture();s.koro.state=state;s.koro.timer=1;aim(s);s.attack();assert.equal(s.hits,0,state);}});
test('watching the blackboard does not grant a free long-range mark',()=>{const s=fixture();s.koro.state='teach';s.koro.yaw=Math.PI;aim(s);s.attack();assert.equal(s.hits,0);});
test('net placement cannot overlap or touch the teacher',()=>{const s=fixture();s.player.z=-4.7;s.player.yaw=0;s.tool=3;assert.equal(s.trapPreview().valid,false);assert.equal(s.placeTrap(),false);});
test('nets require preparation and hidden nets are not revealed without perception',()=>{const s=fixture();s.player.z=0;s.player.yaw=0;s.koro.yaw=s.koro.headYaw=Math.PI;s.tool=3;assert.equal(s.placeTrap(),true);assert.ok(s.traps[0].armed>=1.1);s.hits=2;tick(s,.7);assert.equal(s.traps[0].seen,false);});
test('pressure reaches classroom, rear corner, veranda and far yard',()=>{for(const p of [{x:0,z:6},{x:-7,z:7},{x:10,z:6},{x:20,z:6}]){const s=new Lesson(22);Object.assign(s.player,p);s.noticePlayer('sighting');tick(s,32);assert.ok(s.mistakes>0,JSON.stringify({p,k:s.koro}));}});
test('repeated exposed gunfire produces an approaching counter, not quiet-approach marks',()=>{const s=fixture();for(let i=0;i<40*60&&s.status==='playing';i++){aim(s);s.attack();if(!s.ammo)s.reload();s.update(1/60);}assert.ok(s.hits<3);assert.ok(s.mistakes>0);});
test('a miss reveals intent and emits material-specific feedback',()=>{const s=fixture();s.player.yaw=Math.PI/2;s.player.pitch=0;s.attack();assert.ok(s.intent>0);assert.ok(s.events.some(e=>e.type==='scenery'&&e.surface));});

test('losing sight of the player triggers a real search instead of circling old memory',()=>{for(const p of [{x:20,z:0},{x:9,z:0},{x:-7,z:1,crouch:true}]){const s=new Lesson(1);Object.assign(s.player,p);for(let i=0;i<60*60&&!s.mistakes;i++)s.update(1/60,{crouch:p.crouch});assert.ok(s.mistakes>0,JSON.stringify(p));assert.ok(s.searchIndex>0);}});
test('floor, yard and ceiling impacts resolve at the rendered surface',()=>{const s=new Lesson();assert.deepEqual(s.world.raycastHit({x:0,y:1.5,z:0},{x:0,y:-1,z:0},60),{distance:1.5,kind:'wood'});assert.deepEqual(s.world.raycastHit({x:16,y:1.5,z:0},{x:0,y:-1,z:0},60),{distance:1.5,kind:'ground'});assert.deepEqual(s.world.raycastHit({x:0,y:1.5,z:0},{x:0,y:1,z:0},60),{distance:2.75,kind:'wood'});});
