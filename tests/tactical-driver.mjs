import {Lesson} from '../src/simulation.js';
import {heading} from '../src/combat.js';
import {dist} from '../src/world.js';
export function aim(s,y=1.45){const p=s.player,k=s.koro;p.yaw=Math.atan2(p.x-k.x,p.z-k.z);p.pitch=Math.atan2(y-p.eye,dist(p,k));}
export function moveTo(s,target,{sprint=false,crouch=false}={}){const p=s.player,path=s.world.path(p,target,.27),q=path.find(q=>dist(p,q)>.12);if(!q||dist(p,target)<.1)return {};p.yaw=Math.atan2(p.x-q.x,p.z-q.z);p.pitch=0;return {forward:true,sprint,crouch};}
export function counterPolicy(s,ctx={}){
 const k=s.koro,p=s.player;
 if(s.opening(2).allowed&&dist(p,k)<2.1&&s.world.clear(p,k,1.2)){s.switchTool(2);aim(s);s.attack();return {};}
 if(k.state==='windup'){
  if(ctx.commit!==k.target){ctx.commit=k.target;const h=heading(k,k.target);const previous=[...s.history].reverse().find(h=>h.route==='counter');const sides=previous?[-previous.side,previous.side]:[1,-1];ctx.side=sides[0];const candidates=sides.map(side=>({x:k.target.x+Math.cos(h)*side*2.1,z:k.target.z-Math.sin(h)*side*2.1}));ctx.evade=candidates.find(q=>s.world.free(q.x,q.z,.28)&&s.world.clear(p,q,1.1))||s.world.nearest(candidates[0],.28);}
  return moveTo(s,ctx.evade,{sprint:true});
 }
 if(['tag','counter'].includes(k.state)&&k.counter){const h=k.counter.heading,choices=[ctx.side||1,-(ctx.side||1)].map(side=>({x:k.x+Math.cos(h)*side*1.65,z:k.z-Math.sin(h)*side*1.65})).filter(q=>s.world.free(q.x,q.z,.27));return moveTo(s,choices[0]||ctx.evade,{sprint:true});}
 const d=dist(p,k);if(d>4.5)return moveTo(s,{x:k.x,z:k.z+4},{sprint:false});
 aim(s);return {};
}

export function netPolicy(s,ctx){
 const p=s.player;let input={};ctx.phase??=0;
 if(ctx.phase===0){input=moveTo(s,{x:6.3,z:-5.8},{sprint:true});if(s.time>1.4&&s.allies.karma.cooldown===0){s.selected='karma';s.command();}if(dist(p,{x:6.3,z:-5.8})<.2)ctx.phase=1;}
 if(ctx.phase===1){p.yaw=Math.PI/2;if(s.placeTrap()){s.selected='kaede';s.command();ctx.phase=2;}}
 if(ctx.phase===2){input=moveTo(s,{x:6.2,z:-8.3},{sprint:true});if(s.opening(1).allowed&&s.opening(1).route==='net'){s.switchTool(1);aim(s,2.5);s.attack();}}
 return input;
}
export function crossfirePolicy(s,ctx){ctx.phase??=0;let input={};if(ctx.phase===0){input=moveTo(s,{x:0,z:-2});if(s.player.z<-1.8){s.selected='karma';s.command();s.selected='kaede';s.command();ctx.phase=1;}}
 if(ctx.phase===1){input=moveTo(s,{x:1.2,z:-8.4},{sprint:true});if(s.opening(1).allowed){s.switchTool(1);aim(s,2.5);s.attack();}}return input;
}
export function combinedPolicy(s,ctx={}){return s.hits===0?netPolicy(s,ctx):counterPolicy(s,ctx);}
if(typeof process!=='undefined'&&process.argv[1]?.endsWith('tactical-driver.mjs')){for(const mode of ['standard','precision','teamwork'])for(const seed of [1,42,3018]){const s=new Lesson(seed,mode),ctx={};for(let i=0;i<14400&&s.status==='playing';i++){const input=combinedPolicy(s,ctx);s.update(1/60,input);}console.log(JSON.stringify({seed,mode,status:s.status,time:s.time,hits:s.hits,mistakes:s.mistakes,history:s.history}));}}

