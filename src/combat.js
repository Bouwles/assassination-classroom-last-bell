import {dist} from './world.js';
export const heading=(a,b)=>Math.atan2(b.x-a.x,b.z-a.z);
export const angleGap=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
export function assessOpening(s,tool=s.tool){
 const k=s.koro,p=s.player,range=dist(k,p),attackAngle=heading(k,p),deny=reason=>({allowed:false,reason,route:null});
 if(tool===3)return deny('Prepare the route, then switch to a weapon.');
 if(['recover','windup','tag','dodge'].includes(k.state))return deny(k.state==='recover'?'He is resetting the training mark.':'He has not committed his guard yet.');
 const threats=Object.entries(s.allies).filter(([,a])=>a.state==='active'&&a.engaged&&s.world.clear(a,k,1.3)&&dist(a,k)<9),fresh=threats.filter(([,a])=>s.time-a.started>.16);
 const offset=angleGap(attackAngle,k.guardYaw??k.yaw),flank=offset>1.05,lane=k.lane,shifted=!lane||dist(lane,p)>1.7&&angleGap(heading(k,lane),attackAngle)>.34;
 let route=null,reason='He still has a free tentacle watching your lane.';
 if(k.boundUntil>s.time){if(flank&&(fresh.length>0||shifted))route='net';else reason='One tentacle is caught. Flank his guard or add a classmate.';}
 else if(tool===2&&k.counter&&k.counter.until>s.time){const c=k.counter;if(c.missed&&dist(p,c.aim)>1.25&&angleGap(attackAngle,c.heading)>1.0)route='counter';else reason='Evade the committed tag, then close from his side.';}
 else if(fresh.length>=2){const separation=angleGap(heading(k,fresh[0][1]),heading(k,fresh[1][1])),offThreat=fresh.every(([,a])=>angleGap(attackAngle,heading(k,a))>.65);if(separation>1.1&&offThreat&&shifted)route='crossfire';else reason=shifted?'Your threats share an angle. Create a wider crossfire.':'He kept a tentacle on your old position. Change lanes.';}
 else if(tool===2&&fresh.length&&offset>1.85&&p.crouch&&s.time-s.lastShotTime>2&&shifted)route='ambush';
 else if(fresh.length)reason=tool===2?'Crouch and approach behind his attention.':'One distraction is not enough. Add the other classmate or a net.';
 else if(k.state==='counter')reason='His back is exposed only at close range. Use the knife from his flank.';
 else if(k.state==='inspect')reason='Checking a net does not occupy his guard.';
 else if(k.state==='teach')reason='Even while teaching, he is watching obvious shots.';
 if(!route)return deny(reason);if(tool===2&&range>2.55)return deny('Close the distance before committing the knife.');
 if(route==='counter'){const side=Math.sign(Math.sin(attackAngle-k.counter.heading));const previous=[...s.history].reverse().find(h=>h.route==='counter'&&s.time-h.time<50);if(previous&&previous.side===side)return deny('He remembers your sidestep. Counter from the other side or add a threat.');}
 if(s.history.find(h=>s.time-h.time<50&&h.route===route&&dist(h,p)<3&&angleGap(h.angle,attackAngle)<.65))return deny('He remembers this setup. Change your lane or combine a different threat.');
 return {allowed:true,route,reason:({net:'Prepared net + flank',counter:'Evaded tag + knife flank',crossfire:'Two threats + a new angle',ambush:'Quiet approach behind a challenge'})[route]};
}
