import {dist} from './world.js';
export const heading=(a,b)=>Math.atan2(b.x-a.x,b.z-a.z);
export const angleGap=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
export function activeThreats(s){return Object.entries(s.allies).filter(([,a])=>a.state==='active'&&a.engaged&&s.time-a.started>.16&&s.world.clear(a,s.koro,1.3)&&dist(a,s.koro)<10);}
export function assessOpening(s,tool=s.tool){
 const k=s.koro,p=s.player,c=s.config,attackAngle=heading(k,p),range=dist(k,p),deny=reason=>({allowed:false,decisive:false,reason,route:null});
 if(tool===3)return deny('Prepare the route, then switch to a weapon.');
 if(['recover','windup','tag','dodge','reposition','feint','sweepWindup','sweep'].includes(k.state))return deny(k.state==='recover'?'Training mark verified. Find your next approach.':'Read the commitment, evade, then punish the recovery.');
 if(tool===2&&range>2.55)return deny('Close the distance before committing the knife.');
 const fresh=activeThreats(s),follow=k.follow;
 if(follow&&follow.until>s.time){
  const elapsed=s.time-follow.time,angle=angleGap(attackAngle,follow.angle),support=fresh.some(([,a])=>angleGap(heading(k,a),attackAngle)>.8)||k.boundUntil>s.time;
  if(elapsed<c.followMin)return deny('Let the first strike land. Follow through when the crosshair turns white.');
  if(tool===2&&elapsed<=c.knifeFollowWindow&&(angle>.12||support)||tool===1&&(support&&angle>.13||angle>.34))return {allowed:true,decisive:true,route:follow.route,reason:tool===2?'Timed knife follow-through':'Coordinated follow-through'};
  return deny('Contact! Move across his guard and knife when the crosshair turns white, change angle again, or coordinate a teammate.');
 }
 const offset=angleGap(attackAngle,k.guardYaw??k.yaw),lane=k.lane,shifted=!lane||dist(lane,p)>1.3&&angleGap(heading(k,lane),attackAngle)>.3;
 const commitments=k.commitments.filter(t=>t.until>s.time),newAngle=commitments.some(t=>angleGap(attackAngle,t.angle)>c.angleThreshold+(s.stage-1)*.05+(s.history.some(h=>h.route==='angle'&&s.time-h.time<c.adaptation&&dist(h,p)<2.6)?.18:0)&&dist(t,p)>1.25);
 let route=null,reason='Accurate shots occupy a tentacle. Move to a new angle while it intercepts.';
 if(k.boundUntil>s.time){if(offset>.8&&(fresh.length||shifted))route='net';else reason='A tentacle is caught. Flank his guard or coordinate a teammate.';}
 else if(tool===2&&k.counter?.missed&&k.counter.until>s.time&&dist(p,k.counter.aim)>1.25&&angleGap(attackAngle,k.counter.heading)>.9)route='counter';
 else if(fresh.length>=2&&fresh.every(([,a])=>angleGap(attackAngle,heading(k,a))>.6)&&shifted)route='crossfire';
 else if(fresh.length&&shifted&&offset>1.65&&tool===2&&p.crouch&&s.time-s.lastShotTime>1)route='ambush';
 else if(fresh.length&&shifted&&offset>.9&&newAngle)route='challenge';
 else if(newAngle)route='angle';
 if(!route)return deny(reason);
 const recent=s.history.filter(h=>h.route===route&&s.time-h.time<c.adaptation),repeated=route==='counter'?recent.length>=2:recent.some(h=>dist(h,p)<2.6&&angleGap(h.angle,attackAngle)<.55);
 if(repeated&&!fresh.length&&!newAngle&&k.boundUntil<=s.time)return deny('He remembers this setup. Add accurate pressure or a teammate, then change your approach.');
 return {allowed:true,decisive:false,route,reason:({net:'Net occupied · make contact',counter:'Evaded commitment · knife contact',crossfire:'Two threats · new angle',ambush:'Close approach behind a challenge',angle:'Interception occupied · new angle',challenge:'Challenge + accurate pressure'})[route]};
}
