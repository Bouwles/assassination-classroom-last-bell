import {Lesson} from '../src/simulation.js';
import {heading,angleGap} from '../src/combat.js';
import {dist} from '../src/world.js';
export function aim(s,y=2.45){const p=s.player,k=s.koro;p.yaw=Math.atan2(p.x-k.x,p.z-k.z);p.pitch=Math.atan2(y-p.eye,dist(p,k));}
// Navigate with ordinary directional inputs while preserving independently aimed view.
const navigation=new WeakMap();
export function moveTo(s,target,{sprint=false,crouch=false,dash=false}={}){const p=s.player;let nav=navigation.get(s);if(!nav||s.time-nav.time>(dist(p,target)<5?.025:.16)||dist(nav.target,target)>.7){nav={path:s.world.path(p,target,.27),time:s.time,target};navigation.set(s,nav);}while(nav.path.length&&dist(p,nav.path[0])<.18)nav.path.shift();const q=nav.path[0];if(!q||dist(p,target)<.12)return {crouch};const dx=q.x-p.x,dz=q.z-p.z,len=Math.hypot(dx,dz),f=(-Math.sin(p.yaw)*dx-Math.cos(p.yaw)*dz)/len,r=(Math.cos(p.yaw)*dx-Math.sin(p.yaw)*dz)/len;return {forward:f>.38,back:f<-.38,right:r>.38,left:r<-.38,sprint,crouch,dash};}
function orbitTarget(s,side=1,radius=1.8){const k=s.koro,p=s.player,a=heading(k,p);for(const turn of [.55,.35,-.55,-.35,1.1,-1.1]){const t=a+turn*side,q={x:k.x+Math.sin(t)*radius,z:k.z+Math.cos(t)*radius};if(s.world.free(q.x,q.z,.28)&&(dist(p,k)>4||s.world.segmentFree(p,q,.27)))return q;}return s.world.nearest({x:k.x+Math.sin(a+.8)*radius,z:k.z+Math.cos(a+.8)*radius},.28);}
export function actionPolicy(s,ctx={}){
 const p=s.player,k=s.koro;ctx.side??=1;if(ctx.previous){ctx.stuck=dist(ctx.previous,p)<.01?(ctx.stuck||0)+Math.max(0,s.time-ctx.previous.time):0;if(ctx.stuck>.35){ctx.side*=-1;ctx.stuck=0;}}ctx.previous={x:p.x,z:p.z,time:s.time};aim(s);
 if(!s.ammo)s.reload();
 if(k.state==='windup'){
  if(ctx.commit!==k.target){ctx.commit=k.target;const h=heading(k,k.target);ctx.evade=[ctx.side,-ctx.side].map(side=>({x:k.target.x+Math.cos(h)*side*2.8,z:k.target.z-Math.sin(h)*side*2.8})).find(q=>s.world.free(q.x,q.z,.28)&&s.world.clear(p,q,1.3))||s.world.nearest({x:p.x+2.5,z:p.z},.28);}
  return moveTo(s,ctx.evade,{sprint:true,dash:k.timer<.45&&p.dashCooldown===0});
 }
 if(k.state==='tag'&&k.counter){const h=k.counter.heading;const target=s.world.nearest({x:k.counter.aim.x+Math.cos(h)*ctx.side*2.8,z:k.counter.aim.z-Math.sin(h)*ctx.side*2.8},.27);return moveTo(s,target,{sprint:true});}
 if(['sweepWindup','sweep'].includes(k.state)){const input=moveTo(s,orbitTarget(s,ctx.side,2),{crouch:true});return input;}
 if(k.state==='recover'){ctx.side=s.history.length%2?1:-1;return moveTo(s,orbitTarget(s,ctx.side,2.5),{sprint:true});}
 const d=dist(p,k),follow=k.follow&&k.follow.until>s.time;
 if(follow){const elapsed=s.time-k.follow.time;if(d<2.45){s.switchTool(2);if(s.opening(2).allowed)s.attack();return moveTo(s,orbitTarget(s,ctx.side,1.8),{sprint:true});}s.switchTool(1);if(s.opening(1).allowed)s.attack();return moveTo(s,orbitTarget(s,ctx.side,Math.max(2,d)),{sprint:true,dash:p.dashCooldown===0&&elapsed>.2});}
 if(!['reposition','feint','travel'].includes(k.state)){
  if(s.opening(2).allowed&&d<2.35){s.switchTool(2);s.attack();}
  else{s.switchTool(1);s.attack();}
 }
 if(ctx.teamwork!==false){for(const name of ['karma','kaede'])if(s.allies[name].cooldown===0&&s.allies[name].state==='idle'){s.selected=name;s.command();}}
 return moveTo(s,orbitTarget(s,ctx.side,d>3.3?2.4:1.8),{sprint:d>3.3});
}
export function counterPolicy(s,ctx={}){ctx.teamwork=false;return actionPolicy(s,ctx);}
export function crossfirePolicy(s,ctx={}){return actionPolicy(s,ctx);}
export function netPolicy(s,ctx={}){
 const p=s.player;ctx.netPhase??=0;
 if(ctx.netPhase===0){aim(s);if(s.time>1.2&&s.allies.karma.cooldown===0){s.selected='karma';s.command();}const target={x:6.3,z:-5.8};if(dist(p,target)>.25)return moveTo(s,target,{sprint:true});p.yaw=Math.PI/2;if(s.placeTrap()){s.selected='kaede';s.command();ctx.netPhase=1;}}
 if(ctx.netPhase===1&&!s.hits){aim(s);if(s.koro.follow)return actionPolicy(s,ctx);if(s.opening(1).allowed&&s.opening(1).route==='net'){s.switchTool(1);s.attack();}return moveTo(s,{x:6.2,z:-8.3},{sprint:true});}
 return actionPolicy(s,ctx);
}
export function combinedPolicy(s,ctx={}){return s.mode==='teamwork'&&!s.assists.trap?netPolicy(s,ctx):actionPolicy(s,ctx);}
if(typeof process!=='undefined'&&process.argv[1]?.endsWith('tactical-driver.mjs')){for(const difficulty of ['normal','hard'])for(const seed of [1,42,3018]){const s=new Lesson(seed,'standard',difficulty),ctx={};for(let i=0;i<480*60&&s.status==='playing';i++)s.update(1/60,actionPolicy(s,ctx));console.log(JSON.stringify({seed,difficulty,status:s.status,time:s.time,hits:s.hits,mistakes:s.mistakes,contacts:s.stats.contacts,history:s.history.map(h=>h.route)}));}}
