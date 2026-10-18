import {MOVEMENT as M} from './config.js';
import {dist} from './world.js';
export function movePlayer(s,dt,input){
 const p=s.player,before={x:p.x,z:p.z},f=(input.forward?1:0)-(input.back?1:0),r=(input.right?1:0)-(input.left?1:0),length=Math.hypot(f,r)||1;
 const dx=(-Math.sin(p.yaw)*f+Math.cos(p.yaw)*r)/length,dz=(-Math.cos(p.yaw)*f-Math.sin(p.yaw)*r)/length;
 const dashEdge=!!input.dash&&!p.dashHeld,jumpEdge=!!input.jump&&!p.jumpHeld,crouchEdge=!!input.crouch&&!p.crouchHeld;
 p.dashHeld=!!input.dash;p.jumpHeld=!!input.jump;p.crouchHeld=!!input.crouch;
 p.dashCooldown=Math.max(0,p.dashCooldown-dt);p.slideCooldown=Math.max(0,p.slideCooldown-dt);
 if(!p.vault&&dashEdge&&p.dashCooldown===0&&!p.slide){s.stats.dashes++;p.dashTime=M.dashDuration;p.dashCooldown=M.dashRecovery;p.burstX=dx||dz?dx:-Math.sin(p.yaw);p.burstZ=dx||dz?dz:-Math.cos(p.yaw);s.emit('dashPlayer',{x:p.x,z:p.z});}
 if(!p.vault&&crouchEdge&&p.sprint&&Math.hypot(p.vx,p.vz)>M.walk&&p.slideCooldown===0&&p.jump===0&&!p.dashTime){p.slide=M.slideDuration;p.slideCooldown=M.slideDuration+M.slideRecovery;p.slideX=dx||dz?dx:-Math.sin(p.yaw);p.slideZ=dx||dz?dz:-Math.cos(p.yaw);s.emit('slide',{x:p.x,z:p.z});}
 p.crouch=!!input.crouch||p.slide>0;p.sprint=!!input.sprint&&!p.crouch;
 if(jumpEdge&&!p.jump&&!p.vault&&!p.slide){const target=s.world.vaultTarget(p,{x:dx||dz?dx:-Math.sin(p.yaw),z:dx||dz?dz:-Math.cos(p.yaw)},M.vaultReach);if(target){p.vault=M.vaultDuration;p.vaultTarget=target;p.vaultStart={x:p.x,z:p.z};s.emit('vault',{x:p.x,z:p.z,target});}else if(!p.crouch){p.vy=M.jumpSpeed;s.emit('cloth');}}
 if(p.vault>0){p.vault=Math.max(0,p.vault-dt);const t=1-p.vault/M.vaultDuration,e=t*t*(3-2*t);p.x=p.vaultStart.x+(p.vaultTarget.x-p.vaultStart.x)*e;p.z=p.vaultStart.z+(p.vaultTarget.z-p.vaultStart.z)*e;p.jump=Math.sin(t*Math.PI)*1.12;p.vx=p.vz=0;if(!p.vault){p.jump=0;p.vy=0;s.emit('land',{surface:'wood'});}}
 else {
  const speed=p.crouch?M.crouch:p.sprint?M.sprint:M.walk,targetX=dx*speed,targetZ=dz*speed,accel=(f||r?M.acceleration:M.brake)*(p.jump?M.airControl:1),approach=(a,b)=>a+Math.max(-accel*dt,Math.min(accel*dt,b-a));
  p.vx=approach(p.vx,targetX);p.vz=approach(p.vz,targetZ);
  let vx=p.vx,vz=p.vz;if(p.dashTime>0){vx=p.burstX*M.dashSpeed;vz=p.burstZ*M.dashSpeed;p.dashTime=Math.max(0,p.dashTime-dt);}else if(p.slide>0){const speed=M.slideSpeed*(.62+.38*p.slide/M.slideDuration);vx=p.slideX*speed;vz=p.slideZ*speed;p.slide=Math.max(0,p.slide-dt);}
  s.world.move(p,vx*dt,vz*dt,.27);const airborne=p.jump>0;p.vy-=M.gravity*dt;p.jump=Math.max(0,p.jump+p.vy*dt);if(!p.jump){p.vy=0;if(airborne)s.emit('land',{surface:p.x>11?'ground':p.x>8?'veranda':'wood'});}
 }
 const moved=dist(before,p);p.moving=moved>.001;s.stepDistance+=moved;
 if(s.stepDistance>(p.crouch?.95:p.sprint?.95:.78)&&p.jump<.05&&!p.slide){s.stepDistance=0;s.emit('footstep',{surface:p.x>11?'ground':p.x>8?'veranda':'wood',quiet:p.crouch,sprint:p.sprint});}
 p.eye+=((p.crouch?.86:1.55)+p.jump-p.eye)*Math.min(1,dt*20);
 if(dist(s.camp,p)>1.7)s.camp={x:p.x,z:p.z,time:s.time};if(p.sprint&&moved>0&&dist(p,s.koro)<13&&s.world.clear(p,s.koro,1.3))s.noticePlayer('running');
}
