import {World,dist,clamp} from './world.js';
import {assessOpening,heading,angleGap,activeThreats} from './combat.js';
import {DIFFICULTIES,STAGES} from './config.js';
import {movePlayer} from './movement.js';
export const STATE_LABELS={search:'Searching the room',teach:'Teaching · still watching',observe:'Reading your approach',travel:'Closing the distance',dodge:'Repositioning',windup:'Tag incoming · move sideways',tag:'Tag committed',counter:'Tag missed · close on his flank',distracted:'Answering a challenge',trapped:'One tentacle caught',recover:'Training mark verified',inspect:'Checking the ground',sweepWindup:'High sweep - crouch or slide',sweep:'High sweep',feint:'Feint - watch the open palm',reposition:'Changing the angle'};
export class Lesson{
 constructor(seed=3018,mode='standard',difficulty='normal'){
  this.seed=seed;this.rng=seed||1;this.mode=mode;this.world=new World();this.status='playing';this.time=0;this.difficulty=difficulty==='hard'?'hard':'normal';this.config=DIFFICULTIES[this.difficulty];this.duration=this.config.duration;this.remaining=this.duration;this.maxMistakes=this.config.maxMistakes;this.stage=1;this.stageName=STAGES[0].name;this.stageHits=0;this.stageGoal=STAGES[0].goal;this.totalGoal=STAGES.reduce((n,s)=>n+s.goal,0);
  this.player={x:0,z:5.2,yaw:0,pitch:0,eye:1.55,jump:0,vy:0,crouch:false,sprint:false,moving:false,vx:0,vz:0,dashCooldown:0,dashTime:0,slide:0,slideCooldown:0,vault:0,vaultTarget:null};
  this.koro={x:(this.random()-.5)*1.5,z:-6.8,yaw:0,headYaw:0,state:'teach',timer:3.6,path:[],assist:null,target:null,boundUntil:0,counter:null,lane:null,guardYaw:0,intercept:0,commitments:[],follow:null,moveIndex:0,sweepYaw:0,sweepProgress:0};
  this.allies={karma:this.ally(-3.5,-5),kaede:this.ally(6.6,-1.4)};this.selected='karma';this.tool=1;this.ammo=this.config.magazine;this.reserve=mode==='precision'?100:240;this.reloadTime=0;this.cooldown=0;this.disarm=0;this.trapStock=3;this.traps=[];this.nextTrap=1;
  this.hits=0;this.mistakes=0;this.immunity=0;this.assists={trap:0,classmate:0};this.events=[];this.history=[];this.commandHistory=[];this.lastHint='Split his attention, then leave the lane he last saw.';
  this.stats={shots:0,dodges:0,misses:0,accurateShots:0,contacts:0,evasions:0,knifeHits:0,setups:0,dashes:0};this.lastTag=-7;this.lastChatter=-10;this.lastShotTime=-10;this.intent=0;this.lastSeen={x:0,z:5.2,time:0};this.camp={x:0,z:5.2,time:0};this.stepDistance=0;this.searchIndex=0;this.repathAt=0;this.countdownAt=this.duration;
  this.emit('dialogue',{speaker:'Koro-sensei',text:'I have more than one tentacle, Nagisa. Give them all something to do.'});
 }
 ally(x,z){return {x,z,yaw:0,state:'idle',timer:0,cooldown:0,path:[],target:null,started:-10,phase:0,travel:0,step:0,predictable:false,engaged:false};}
 random(){this.rng=(Math.imul(this.rng,1664525)+1013904223)>>>0;return this.rng/4294967296;}
 emit(type,data={}){this.events.push({type,time:this.time,...data});if(this.events.length>160)this.events.shift();}
 say(speaker,text,force=false){if(!force&&this.time-this.lastChatter<3)return;this.lastChatter=this.time;this.emit('dialogue',{speaker,text});}
 hint(text){this.lastHint=text;this.emit('hint',{text});}
 lookAt(e,p){e.yaw=heading(e,p);}
 sees(p,ground=false){const k=this.koro,d=dist(k,p),yaw=k.headYaw??k.yaw;return d<(ground?7:23)&&this.world.clear(k,p,ground?.32:p.crouch?.85:1.4)&&(angleGap(heading(k,p),yaw)<(ground?.85:1.16)||!ground&&d<(p.sprint?5.5:p.crouch?.85:1.4));}
 noticePlayer(source){const p=this.player;this.lastSeen={x:p.x,z:p.z,time:this.time,source};}
 occupied(){return assessOpening(this).allowed;}
 opening(tool=this.tool){return assessOpening(this,tool);}
 setState(state,timer,target=null){const k=this.koro;k.state=state;k.searching=false;k.timer=timer;k.target=target;k.path=[];if(!['distracted','trapped'].includes(state))k.assist=null;}
 route(e,target){const isKoro=e===this.koro,avoid=isKoro&&!['distracted','tag'].includes(e.state)?this.traps.filter(t=>t.seen&&!t.used):[];e.path=this.world.path(e,target,isKoro?.62:.28,avoid);e.target=target;e.stuck=0;}
 walk(e,speed,dt){
  if(!e.path.length)return true;const t=e.path[0],d=dist(e,t);if(d<.09){e.path.shift();return !e.path.length;}
  this.lookAt(e,t);const before={x:e.x,z:e.z},step=Math.min(d,speed*dt);this.world.move(e,(t.x-e.x)/d*step,(t.z-e.z)/d*step,e===this.koro?.62:.28);const moved=dist(before,e);e.travel=(e.travel||0)+moved;e.stuck=moved<.001?(e.stuck||0)+dt:0;
  if(e.stuck>.4&&e.target){this.route(e,e.target);return false;}
  if(e!==this.koro){e.step+=moved;if(e.step>.65){e.step=0;this.emit('footstep',{x:e.x,z:e.z,surface:e.x>11?'ground':e.x>8?'veranda':'wood',ally:true});}}return false;
 }
 update(dt,input={}){
  if(this.status!=='playing')return;dt=Math.min(dt,.05);this.time+=dt;this.remaining=Math.max(0,this.remaining-dt);this.cooldown=Math.max(0,this.cooldown-dt);this.immunity=Math.max(0,this.immunity-dt);this.disarm=Math.max(0,this.disarm-dt);this.intent=Math.max(0,this.intent-dt*.18);this.koro.intercept=Math.max(0,this.koro.intercept-dt);
  if(this.reloadTime>0){this.reloadTime-=dt;if(this.reloadTime<=0){const n=Math.min(this.config.magazine-this.ammo,this.reserve);this.ammo+=n;this.reserve-=n;this.emit('reloadDone');}}
  this.koro.commitments=this.koro.commitments.filter(t=>t.until>this.time);if(this.koro.follow&&this.koro.follow.until<=this.time)this.koro.follow=null;this.movePlayer(dt,input);this.updateAllies(dt);this.updateKoro(dt);this.updateTraps(dt);
  const sec=Math.ceil(this.remaining);if(sec!==this.countdownAt){this.countdownAt=sec;if(sec<=10||sec===60)this.emit('countdown',{seconds:sec});}
  if(!this.remaining)this.finish(false,this.hits?'The bell rang. Your setup worked; make the next commitment sooner.':'A single distraction leaves him a free guard. Overlap your threats and change lanes.');
 }
 movePlayer(dt,input){movePlayer(this,dt,input);}
 command(){
  if(this.status!=='playing')return false;const name=this.selected,a=this.allies[name],k=this.koro,p=this.player;
  if(a.cooldown>0||a.state!=='idle'){this.hint(`${name==='karma'?'Karma':'Kaede'}: ${a.state==='recover'?'resetting':a.state!=='idle'?'already committed':`${Math.ceil(a.cooldown)}s to recover`}.`);return false;}
  const base=heading(k,p),side=name==='karma'?-1:1;let target=this.world.nearest({x:k.x+Math.sin(base+side*1.3)*3.5,z:k.z+Math.cos(base+side*1.3)*3.5},.28);a.lure=null;
  if(name==='kaede'){const trap=this.traps.filter(t=>!t.used&&!t.seen&&dist(t,k)<13).sort((u,v)=>dist(u,k)-dist(v,k))[0];if(trap){const d=dist(k,trap)||1;target=this.world.nearest({x:trap.x+(trap.x-k.x)/d*1.6,z:trap.z+(trap.z-k.z)/d*1.6},.28);a.lure=trap.id;}}
  const candidates=[target,...[-.6,.6,1.3,-1.3].map(turn=>this.world.nearest({x:k.x+Math.sin(base+side*1.3+turn)*3.2,z:k.z+Math.cos(base+side*1.3+turn)*3.2},.28))];target=candidates.find(q=>this.world.clear(q,k,1.3)&&this.world.path(a,q,.28).length)||target;
  if(dist(a,target)<.65)target=this.world.nearest({x:target.x+.65*side,z:target.z+.5},.28);
  a.predictable=this.commandHistory.some(h=>h.name===name&&this.time-h.time<35&&dist(h,p)<2.5);this.commandHistory.push({name,x:p.x,z:p.z,time:this.time});this.route(a,target);a.state='move';a.timer=8;a.cooldown=name==='karma'?this.config.allyKarma:this.config.allyKaede;a.phase=0;a.engaged=false;
  if(this.sees(p))k.lane={x:p.x,z:p.z};this.emit('command',{who:name,x:a.x,z:a.z});this.hint(`${name==='karma'?'Karma':'Kaede'} acknowledged. ${a.predictable?'He remembers this lane—reposition.':'Moving into position.'}`);return true;
 }
 updateAllies(dt){for(const [name,a]of Object.entries(this.allies)){
  a.cooldown=Math.max(0,a.cooldown-dt);a.reaction=Math.max(0,(a.reaction||0)-dt);a.timer-=dt;
  if(a.state==='move'){const done=this.walk(a,3.65,dt);if(done){a.state='prepare';a.timer=name==='karma'?.82:1.05;this.lookAt(a,this.koro);this.emit('prepare',{who:name,x:a.x,z:a.z});}else if(a.timer<0){a.state='recover';a.timer=1;this.hint(`${name==='karma'?'Karma':'Kaede'} lost the angle. Reposition and call again.`);a.cooldown=Math.min(a.cooldown,4);}}
  else if(a.state==='prepare'){
   this.lookAt(a,this.koro);a.phase=1-a.timer/(name==='karma'?.82:1.05);
   if(a.timer<=0){a.state='active';a.started=this.time;a.timer=name==='karma'?3.2:3.8;this.emit('ability',{who:name,x:a.x,z:a.z});const k=this.koro;
    if(this.world.clear(a,k,1.3)&&dist(a,k)<10&&!['recover','windup','tag','sweepWindup','sweep','feint','reposition'].includes(k.state)){
     a.engaged=true;if(!k.lane&&this.sees(this.player))k.lane={x:this.player.x,z:this.player.z};this.setState('distracted',Math.min(a.timer,1.6));k.assist=name;k.guardYaw=heading(k,a);this.lookAt(k,a);k.headYaw=a.predictable&&this.lastSeen?heading(k,this.lastSeen):k.yaw;
     if(name==='kaede'&&a.lure){const trap=this.traps.find(t=>t.id===a.lure&&!t.used);if(trap){this.route(k,trap);a.timer+=Math.min(3,dist(k,trap)/4);k.timer=a.timer;}}
     this.say(name==='karma'?'Karma':'Kaede',name==='karma'?['Try keeping up, teach.','I have this side. Find yours.'][Math.floor(this.time)%2]:['Sensei! A little help over here?','I will draw him over. Be ready.'][Math.floor(this.time)%2],true);
    }else this.hint('He is already committed elsewhere. Use the counter or reset your setup.');
   }
  }else if(a.state==='active'){this.lookAt(a,this.koro);a.phase=clamp((this.time-a.started)/.35,0,1);if(a.timer<=0){a.state='recover';a.timer=.8;this.emit('abilityEnd',{who:name,x:a.x,z:a.z});}}
  else if(a.state==='recover'&&a.timer<=0){a.state='idle';a.phase=0;}else if(a.state==='idle')this.lookAt(a,this.koro);
 }}
 pressurePoint(target){const k=this.koro,candidates=[];for(let r=.9;r<=2.5;r+=.5)for(let i=0;i<16;i++){const a=i*Math.PI/8,p={x:target.x+Math.sin(a)*r,z:target.z+Math.cos(a)*r};if(this.world.free(p.x,p.z,.62)&&this.world.clear(p,target,1.2))candidates.push(p);}candidates.sort((a,b)=>dist(a,target)+dist(a,k)*.12-dist(b,target)-dist(b,k)*.12);return candidates[0]||this.world.nearest(target,.62);}
 beginPressure(){const target=this.lastSeen||this.chooseStation();this.setState('travel',12);this.route(this.koro,this.pressurePoint(target));this.repathAt=this.time+1.2;}
 updateKoro(dt){const k=this.koro,p=this.player;k.timer-=dt;if(this.sees(p)){this.noticePlayer('sighting');k.seenPlayer=true;}else k.seenPlayer=false;
  if(k.boundUntil>this.time){k.state='trapped';k.timer=k.boundUntil-this.time;return;}
  if(k.state==='trapped'){this.emit('trapEscape',{x:k.x,z:k.z});this.setState('observe',.55);k.headYaw=k.yaw=heading(k,this.lastSeen||p);}
  if(k.follow&&k.follow.until>this.time&&k.state!=='trapped')return;
  if(k.state==='sweepWindup'){k.headYaw=k.yaw=k.sweepYaw;if(k.timer<=0){this.setState('sweep',this.config.sweepDuration);k.sweepHit=false;k.sweepProgress=0;this.emit('sweep',{x:k.x,z:k.z,target:k.sweepTarget,range:this.config.sweepRange,arc:this.config.sweepArc,height:this.config.sweepHeight});}return;}
  if(k.state==='sweep'){k.sweepProgress=clamp(1-k.timer/this.config.sweepDuration,0,1);const armYaw=k.sweepYaw-this.config.sweepArc+2*this.config.sweepArc*k.sweepProgress;if(!k.sweepHit&&dist(k,p)<this.config.sweepRange&&angleGap(heading(k,p),armYaw)<.38&&((p.crouch||p.slide ? .86 : 1.55)+p.jump)>this.config.sweepHeight-.07&&this.world.clear(k,p,this.config.sweepHeight)){this.tag();k.sweepHit=true;}if(k.timer<=0){if(!k.sweepHit)this.stats.evasions++;k.counter={missed:!k.sweepHit,aim:k.sweepTarget||{x:p.x,z:p.z},heading:k.sweepYaw,until:this.time+this.config.tagRecovery};k.guardYaw=k.sweepYaw;this.setState('counter',this.config.tagRecovery);}return;}
  if(k.state==='feint'){k.headYaw=k.yaw;if(k.timer<=0)this.reposition();return;}
  if(k.state==='reposition'){if(this.walk(k,13+this.stage,dt)||k.timer<=0){this.setState('observe',.32);k.headYaw=k.yaw=heading(k,this.lastSeen||p);this.emit('arrival',{x:k.x,z:k.z});}return;}
  if(k.state==='recover'){if(k.timer<=0){k.lane=null;k.counter=null;this.intent=1;if(this.stage>=2&&this.hits%2===0)this.reposition();else this.beginPressure();}return;}
  if(k.state==='windup'){k.headYaw=k.yaw;if(k.timer<=0){const aim={...k.target};k.counter={aim,heading:heading(k,aim),missed:true,until:0};this.setState('tag',1.45,aim);this.route(k,this.pressurePoint(aim));this.emit('dash',{x:k.x,z:k.z,target:aim});}return;}
  if(k.state==='tag'){const done=this.walk(k,this.config.tagSpeed,dt);k.headYaw=k.yaw;if(dist(k,p)<1.55&&this.world.clear(k,p,1.2)&&this.immunity===0){this.tag();if(k.counter)k.counter.missed=false;}if(done||k.timer<=0){k.guardYaw=k.counter?.heading??k.yaw;this.setState('counter',this.config.tagRecovery);if(k.counter){k.counter.until=this.time+this.config.tagRecovery;if(k.counter.missed)this.stats.evasions++;};this.emit('arrival',{x:k.x,z:k.z});}return;}
  if(k.state==='counter'){if(k.timer<=0){k.counter=null;this.setState('observe',1.2);k.headYaw=k.yaw=heading(k,this.lastSeen||p);}return;}
  if(k.state==='dodge'){if(this.walk(k,13,dt)||k.timer<=0){this.emit('arrival',{x:k.x,z:k.z});this.setState('observe',.6);k.yaw=k.headYaw=heading(k,this.lastSeen||p);}return;}
  if(k.state==='inspect'){k.headYaw=k.yaw;if(k.timer<=0)this.beginPressure();return;}
  if(k.state==='distracted'){
   const active=Object.entries(this.allies).filter(([,a])=>a.state==='active'&&this.world.clear(a,k,1.3)&&dist(a,k)<10);if(k.path.length)this.walk(k,4.8,dt);
   if(active.length){const [name,a]=active[0];k.assist=name;k.guardYaw=heading(k,a);k.yaw=k.guardYaw;k.headYaw=a.predictable&&k.lane?heading(k,k.lane):k.guardYaw;}
   if(!active.length||k.timer<=0){this.setState('observe',.7);k.lane=null;k.yaw=k.headYaw=heading(k,this.lastSeen||p);}return;
  }
  if(k.state==='search'){k.headYaw+=dt*2.7;k.yaw=k.headYaw;if(k.seenPlayer){this.setState('observe',.6);}else if(k.timer<=0)this.beginSearch();return;}
  if(k.state==='travel'){k.headYaw=this.lastSeen&&this.time-this.lastSeen.time<5?heading(k,this.lastSeen):k.yaw;if(!k.searching&&this.time>this.repathAt&&this.lastSeen){this.route(k,this.pressurePoint(this.lastSeen));this.repathAt=this.time+1.2;}if(this.walk(k,4.8,dt)||k.timer<=0){const searching=k.searching;this.setState(searching?'search':'observe',searching?2.5:.65);if(!searching)k.yaw=k.headYaw=heading(k,this.lastSeen||p);}return;}
  if(k.state==='teach'){k.headYaw=k.yaw+Math.sin(this.time*1.2)*.8;if(this.intent>1||k.timer<=0){this.setState('observe',1.1);k.yaw=k.headYaw=heading(k,this.lastSeen||this.chooseStation());}return;}
  if(k.state==='observe'){
   if(this.lastSeen&&this.time-this.lastSeen.time<8)k.yaw=k.headYaw=heading(k,this.lastSeen);else k.headYaw=k.yaw+Math.sin(this.time)*1.4;
   if(k.timer<=0){const known=this.lastSeen,canTag=known&&this.time-known.time<3&&dist(k,known)<7.5&&this.world.clear(k,known,1.2);
    if(canTag&&this.time-this.lastTag>this.config.attackInterval-(this.stage-1)*.45){this.lastTag=this.time;this.beginAttack(known);}
    else if(!known||this.time-known.time>6)this.beginSearch();
    else if(known&&(dist(k,known)>5||this.time-this.camp.time>4||this.intent>.7))this.beginPressure();
    else {this.setState('teach',2.3);k.yaw=heading(k,known);}
   }
  }
 }
 beginSearch(){this.setState('travel',10);this.koro.searching=true;this.route(this.koro,this.chooseStation());}
 chooseStation(){const points=[{x:0,z:-6},{x:0,z:5},{x:10,z:5},{x:16,z:4},{x:18,z:-5},{x:10,z:-6},{x:-6.6,z:-5},{x:-6.6,z:4},{x:0,z:1}];return points[(this.searchIndex++)%points.length];}
 updateTraps(dt){for(const t of this.traps){if(t.used)continue;const before=t.armed;t.armed=Math.max(0,t.armed-dt);if(before>0&&!t.armed)this.emit('trapArmed',{x:t.x,z:t.z});const k=this.koro;
  if(!t.seen&&dist(t,k)<6&&this.sees(t,true)&&!['distracted','tag','recover','trapped'].includes(k.state)){t.seen=true;this.emit('trapSeen',{x:t.x,z:t.z});this.say('Koro-sensei','A net in plain sight? I will watch that step.');if(['travel','teach','observe'].includes(k.state)){this.setState('inspect',.7);this.lookAt(k,t);}}
  const committed=['tag','distracted'].includes(k.state);
  if(!t.armed&&dist(t,k)<1.02&&k.state!=='recover'&&k.boundUntil<=this.time&&(!t.seen||committed)){t.used=true;k.guardYaw=k.yaw;k.boundUntil=this.time+this.config.trapBind;k.lane=k.lane||{...this.lastSeen};this.setState('trapped',this.config.trapBind);k.assist='trap';this.emit('trapTrigger',{x:t.x,z:t.z});this.say('Koro-sensei','One tentacle caught. What about the others?',true);}
 }}
 trapPreview(){const p=this.player,point={x:p.x-Math.sin(p.yaw)*1.9,z:p.z-Math.cos(p.yaw)*1.9};let reason='';if(this.trapStock<=0)reason='No unused nets left.';else if(dist(point,this.koro)<2.8)reason='Too close to Koro-sensei. Prepare the route ahead of him.';else if(!this.world.free(point.x,point.z,.72)||!this.world.clear(p,point,.2))reason='Find clear ground within reach.';else if(this.traps.some(t=>!t.used&&dist(t,point)<1.9))reason='Leave space between nets.';return {...point,valid:!reason,reason};}
 placeTrap(){const t=this.trapPreview();if(!t.valid){this.hint(t.reason);return false;}const seen=this.sees(t,true);this.traps.push({...t,id:this.nextTrap++,armed:this.config.trapArm,used:false,seen,placed:this.time});this.trapStock--;this.emit('place',t);if(seen)this.hint('He saw you place that net. Distract him before drawing him across it.');return true;}
 retrieve(){const i=this.traps.findIndex(t=>!t.used&&dist(t,this.player)<2.6&&this.world.clear(this.player,t,.25));if(i<0){this.hint('Move close to an unused net to retrieve it.');return false;}const [t]=this.traps.splice(i,1);this.trapStock++;this.emit('retrieve',t);return true;}
 reload(){if(this.ammo>=this.config.magazine||this.reloadTime>0||!this.reserve||this.disarm)return;this.reloadTime=this.config.reload;this.emit('reload');}
 switchTool(tool){if(this.tool===tool)return;this.tool=tool;this.emit('equip',{tool});}
 attack(){
  if(this.status!=='playing'||this.cooldown>0||this.disarm>0||this.tool===1&&this.reloadTime>0)return;
  if(this.tool===3){if(this.placeTrap())this.cooldown=.4;return;}if(this.tool===1&&!this.ammo){this.reload();this.emit('empty');return;}
  const p=this.player,k=this.koro,range=this.tool===2?2.05:60,opening=this.opening();this.cooldown=this.tool===2?this.config.knifeCooldown:this.config.shotCooldown;
  if(this.tool===1){this.ammo--;this.stats.shots++;this.lastShotTime=this.time;this.intent+=.65;if(dist(k,p)<24)this.noticePlayer('shot');}
  const dir={x:-Math.sin(p.yaw)*Math.cos(p.pitch),y:Math.sin(p.pitch),z:-Math.cos(p.yaw)*Math.cos(p.pitch)},origin={x:p.x,y:p.eye,z:p.z},obstruction=this.world.raycastHit(origin,dir,range);let hitDistance=Infinity;
  for(const sphere of [{y:2.5,r:.71},{y:1.4,r:.62},{y:.6,r:.6}]){const v={x:k.x-p.x,y:sphere.y-p.eye,z:k.z-p.z},along=v.x*dir.x+v.y*dir.y+v.z*dir.z,perp=v.x*v.x+v.y*v.y+v.z*v.z-along*along;if(along>0&&perp<sphere.r*sphere.r){const near=along-Math.sqrt(sphere.r*sphere.r-perp);if(near<=range)hitDistance=Math.min(hitDistance,near);}}
  this.emit('attack',{tool:this.tool,origin,dir,distance:Math.min(obstruction.distance,hitDistance,range)});
  if(hitDistance<=obstruction.distance&&hitDistance<=range){if(this.tool===1)this.stats.accurateShots++;if(opening.allowed){if(opening.decisive)this.score(opening.route,opening.reason);else this.contact(opening);}else {
   this.stats.dodges++;k.intercept=.3;if(this.tool===1&&!['recover','tag','windup','sweep','sweepWindup','reposition','feint'].includes(k.state)){k.commitments.push({angle:heading(k,p),x:p.x,z:p.z,until:this.time+this.config.commitment});k.commitments=k.commitments.slice(-6);this.emit('opening',{x:k.x,z:k.z,duration:this.config.commitment});}this.hint(opening.reason);this.emit('intercept',{x:k.x,z:k.z,tool:this.tool});
   if(['teach','observe','inspect'].includes(k.state)){this.setState('observe',Math.min(k.timer,.35));k.yaw=k.headYaw=heading(k,p);}if(this.tool===2&&dist(k,p)<2.5&&this.immunity<=0&&['teach','observe','inspect'].includes(k.state)){this.intent+=1;this.setState('observe',.15);}
   this.say('Koro-sensei',['I kept one tentacle free for you.','You are still in the same lane.','A good plan needs a follow-through.'][this.stats.dodges%3]);
  }}else{this.stats.misses++;this.intent+=this.tool===2?.35:.25;const d=obstruction.distance;this.emit(d<range?'scenery':'miss',{x:p.x+dir.x*d,y:p.eye+dir.y*d,z:p.z+dir.z*d,surface:obstruction.kind,tool:this.tool});}
 }
 contact(opening){const k=this.koro;this.stats.contacts++;k.follow={route:opening.route,time:this.time,until:this.time+this.config.followWindow,angle:heading(k,this.player)};k.commitments=[];this.lastHint=opening.reason+'. Knife when the crosshair turns white, or change angle and coordinate.';this.emit('contact',{x:k.x,z:k.z,tool:this.tool,route:opening.route});}
 score(route,label){if(this.status!=='playing'||this.koro.state==='recover')return;this.hits=Math.min(this.totalGoal,this.hits+1);this.stageHits=Math.min(this.stageGoal,this.stageHits+1);if(this.tool===2)this.stats.knifeHits++;this.stats.setups=new Set([...this.history.map(h=>h.route),route]).size;for(const a of Object.values(this.allies))a.reaction=.7;if(route==='net')this.assists.trap++;if(['crossfire','ambush','challenge'].includes(route)||activeThreats(this).length)this.assists.classmate++;
  this.history.push({route,reason:route,x:this.player.x,z:this.player.z,time:this.time,angle:heading(this.koro,this.player),side:route==='counter'?Math.sign(Math.sin(heading(this.koro,this.player)-(this.koro.counter?.heading??0))):0});this.lastHint=label||route;this.koro.boundUntil=0;this.koro.follow=null;this.koro.commitments=[];this.setState('recover',this.config.recovery);this.emit('hit',{reason:route,label:this.lastHint,x:this.koro.x,z:this.koro.z});this.say('Koro-sensei',['There! A proper follow-through.','Good. Now show me a new approach.','That was a plan worth teaching.'][this.hits%3],true);
  if(this.stageHits>=this.stageGoal){if(this.stage===3){if(this.mode==='teamwork'&&(!this.assists.trap||!this.assists.classmate)){const missing=[!this.assists.trap?'net-assisted mark':null,!this.assists.classmate?'classmate-assisted mark':null].filter(Boolean);this.hint('Teamwork finish: secure a '+missing.join(' and a ')+'.');return;}this.finish(true,'Three stages complete. You created openings and executed the finish.');return;}this.stage++;this.stageHits=0;this.stageName=STAGES[this.stage-1].name;this.stageGoal=STAGES[this.stage-1].goal;this.trapStock=Math.min(3,this.trapStock+1);this.reserve+=30;this.immunity=Math.max(this.immunity,1.6);for(const a of Object.values(this.allies))a.cooldown=Math.min(a.cooldown,3);this.emit('stage',{stage:this.stage,name:this.stageName});this.say('Koro-sensei',this.stage===2?'I am paying attention now. Watch the open palm.':'One last attempt. Use everything you have learned.',true);}
 }
 beginAttack(known){const k=this.koro,target={x:known.x,z:known.z},move=k.moveIndex++;k.guardYaw=k.yaw=heading(k,target);k.headYaw=k.yaw;
  if(this.stage>=2&&move%5===3){this.setState('feint',this.config.tagTell*.8,target);k.feint=true;this.emit('feint',{x:k.x,z:k.z,target});this.hint('Open palm: a feint. Track his destination before committing.');}
  else if(move%3===1&&dist(k,target)<4.8){k.sweepYaw=k.yaw;k.sweepTarget=target;k.sweepProgress=0;this.setState('sweepWindup',this.config.sweepTell,target);this.emit('sweepTell',{x:k.x,z:k.z,target,range:this.config.sweepRange,arc:this.config.sweepArc,height:this.config.sweepHeight});this.hint('High sweep: crouch, slide underneath, or leave the marked arc.');}
  else if(this.stage>=2&&move%4===2)this.reposition();
  else{this.setState('windup',this.config.tagTell,target);k.feint=false;this.emit('telegraph',{x:k.x,z:k.z,target});this.say('Koro-sensei','A quick test of your footwork.');}
 }
 reposition(){const k=this.koro,p=this.lastSeen||this.player,base=heading(p,k),side=k.moveIndex%2?1:-1,target=this.world.nearest({x:p.x+Math.sin(base+side*1.1)*4.2,z:p.z+Math.cos(base+side*1.1)*4.2},.62);this.setState('reposition',2);k.repositionTarget=target;this.route(k,target);this.emit('reposition',{x:k.x,z:k.z,target});}
 tag(){if(this.immunity||this.status!=='playing')return;this.mistakes++;this.immunity=this.config.tagProtection;this.disarm=.38;this.koro.follow=null;this.lastHint=this.intent>1?'Repeated fire exposed your lane. Move after committing an attack.':'The warning marks a committed tag. Sidestep, then approach his flank.';this.emit('tag',{x:this.koro.x,z:this.koro.z});if(this.mistakes>=this.maxMistakes)this.finish(false,this.lastHint);}
 finish(won,feedback){if(this.status!=='playing')return;this.status=won?'won':'lost';this.feedback=feedback;this.grade=won?(this.mistakes===0&&this.stats.setups>=3?'S':this.mistakes<3?'A':'B'):'C';this.emit('finish',{won});}
}
