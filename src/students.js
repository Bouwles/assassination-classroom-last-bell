import * as THREE from 'three';
import {toon,mesh} from './characters.js';
import {faceTexture} from './art.js';
const sphere=new THREE.SphereGeometry(1,24,16);
function solid(p,g,m,position=[0,0,0],scale=null){return mesh(p,g,m,position,scale,true);}
function oval(p,m,pos,s){return solid(p,sphere,m,pos,s);}
function panel(p,points,m,z){const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();return mesh(p,new THREE.ShapeGeometry(shape),m,[0,0,z]);}
function lock(p,mat,points,width){
 const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),positions=[],idx=[],normal=new THREE.Vector3(),tangent=new THREE.Vector3();
 for(let i=0;i<=10;i++){const t=i/10,c=curve.getPoint(t);curve.getTangent(t,tangent);normal.set(0,0,1).cross(tangent).normalize();const w=width*(1-t)**.65+.0005;
  for(const [a,b]of [[-1,0],[0,1],[1,0],[0,-.3]])positions.push(c.x+normal.x*w*a,c.y+normal.y*w*a,c.z+w*.32*b);
  if(i<10)for(let j=0;j<4;j++){const a=i*4+j,b=i*4+(j+1)%4;idx.push(a,a+4,b,b,a+4,b+4);}
 }const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(idx);g.computeVertexNormals();mesh(p,g,mat);
}
function cap(p,mat){const positions=[],idx=[],n=32,rings=14;
 for(let i=0;i<=rings;i++)for(let j=0;j<=n;j++){const phi=j/n*Math.PI*2,end=Math.cos(phi)>0?.46*Math.PI:.78*Math.PI,theta=i/rings*end;positions.push(Math.sin(phi)*Math.sin(theta)*.154,Math.cos(theta)*.183+.012,Math.cos(phi)*Math.sin(theta)*.136-.018);if(i<rings&&j<n){const a=i*(n+1)+j,b=a+n+1;idx.push(a,b,a+1,b,b+1,a+1);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(idx);g.computeVertexNormals();solid(p,g,mat);
}
export class StudentModel{
 constructor(name){
  this.name=name;this.root=new THREE.Group();this.root.scale.setScalar(name==='kaede'?.9:1.04);this.previousTime=0;this.phase=0;
  const girl=name==='kaede',hair=toon(girl?'#74ba9d':'#bd3944'),hairLight=toon(girl?'#95d2b6':'#d84b50'),skin=toon('#f5d3bc'),jacket=toon(girl?'#9192a1':'#393b40'),pants=toon('#9696a5'),white=toon('#fff9ef'),ink=toon('#303b3e'),shoe=toon('#30363b');skin.emissive.set('#e2b69c');skin.emissiveIntensity=.12;
  const p=this.root;this.torso=new THREE.Group();p.add(this.torso);const body=this.torso;
  solid(body,new THREE.CylinderGeometry(.205,.17,.5,16),jacket,[0,1.075,0],[1,1,.59]);
  panel(body,girl?[[-.085,1.31],[.085,1.31],[.035,1.12],[-.035,1.12]]:[[-.085,1.31],[.085,1.31],[.065,.84],[-.065,.84]],white,.129);
  for(const s of [-1,1]){
   panel(body,[[s*.025,1.32],[s*.105,1.29],[s*.065,1.19],[s*.015,1.25]],white,.147);
   panel(body,[[s*.11,1.29],[s*.175,1.22],[s*.10,1.18],[s*.125,1.13],[s*.035,.91],[s*.065,1.20]],girl?toon('#666b75'):toon('#4b4d53'),.155);
  }
  if(girl){panel(body,[[-.027,1.25],[.027,1.25],[.036,1.00],[0,.95],[-.034,1]],ink,.164);
   const skirtGeo=new THREE.CylinderGeometry(.165,.258,.30,40),a=skirtGeo.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i),ang=Math.atan2(x,z),fold=1+Math.cos(ang*10)*.035;a.setX(i,x*fold);a.setZ(i,z*fold*.72);}skirtGeo.computeVertexNormals();solid(body,skirtGeo,pants,[0,.72,0]);
   solid(body,new THREE.CylinderGeometry(.25,.258,.035,40),ink,[0,.575,0],[1,1,.72]);
  }else{solid(body,new THREE.CylinderGeometry(.17,.17,.04,16),ink,[0,.825,0],[1,1,.65]);solid(body,new THREE.BoxGeometry(.055,.036,.014),toon('#b9b9b2'),[.03,.825,.117]);}
  for(let i=0;i<3;i++)oval(body,ink,[girl?.045:.018,1.12-i*.105,.157],[.009,.009,.005]);
  this.legs=[];
  for(const s of [-1,1]){const hip=new THREE.Group();hip.position.set(s*.095,.84,0);p.add(hip);solid(hip,new THREE.CylinderGeometry(.073,.057,.36,12),girl?skin:pants,[0,-.18,0],[1,1,.85]);
   const knee=new THREE.Group();knee.position.y=-.36;hip.add(knee);solid(knee,new THREE.CylinderGeometry(.057,.04,.39,12),girl?ink:pants,[0,-.195,0],[1,1,.9]);
   oval(knee,shoe,[0,-.405,.037],[.058,.045,.115]);solid(knee,new THREE.BoxGeometry(.108,.018,.19),ink,[0,-.435,.032]);this.legs.push({hip,knee});}
  this.arms=[];
  for(const s of [-1,1]){const shoulder=new THREE.Group();shoulder.position.set(s*.21,1.29,0);body.add(shoulder);oval(shoulder,jacket,[0,-.035,0],[.058,.075,.06]);solid(shoulder,new THREE.CylinderGeometry(.054,.043,.235,12),jacket,[0,-.135,0]);
   const elbow=new THREE.Group();elbow.position.y=-.25;shoulder.add(elbow);solid(elbow,new THREE.CylinderGeometry(.044,.035,.215,12),jacket,[0,-.105,0]);solid(elbow,new THREE.CylinderGeometry(.037,.037,.025,12),white,[0,-.222,0]);
   const hand=new THREE.Group();hand.position.y=-.25;elbow.add(hand);oval(hand,skin,[0,-.015,0],[.036,.049,.022]);for(let j=0;j<4;j++)oval(hand,skin,[(j-1.5)*.015,-.054,.002],[.009,.025,.011]);oval(hand,skin,[-s*.035,-.02,.015],[.012,.028,.012]);
   this.arms.push({shoulder,elbow,hand});
  }
  solid(body,new THREE.CylinderGeometry(.045,.05,.10,16),skin,[0,1.36,0]);this.head=new THREE.Group();this.head.position.set(0,1.535,0);body.add(this.head);
  const headGeo=new THREE.SphereGeometry(1,32,24),a=headGeo.attributes.position;
  for(let i=0;i<a.count;i++){const y=a.getY(i),jaw=y<-.05?1+(y+.05)*.31:1;a.setXYZ(i,a.getX(i)*.14*jaw,y*.174,a.getZ(i)*.121*(y<-.3?.95:1));}headGeo.computeVertexNormals();solid(this.head,headGeo,skin);
  for(const s of [-1,1])oval(this.head,skin,[s*.137,-.015,-.006],[.022,.04,.018]);
  const faceGeo=new THREE.PlaneGeometry(.253,.282,24,18),f=faceGeo.attributes.position;
  for(let i=0;i<f.count;i++){const x=f.getX(i),y=f.getY(i),r=1-x*x/(.146*.146)-y*y/(.188*.188);f.setZ(i,Math.sqrt(Math.max(.02,r))*.125);}faceGeo.computeVertexNormals();
  this.face=mesh(this.head,faceGeo,new THREE.MeshBasicMaterial({map:faceTexture(name),transparent:true,depthWrite:false}),[0,-.012,.003]);
  cap(this.head,hair);
  if(girl){
   for(let i=0;i<6;i++){const x=(i-2.5)*.043;lock(this.head,i%2?hair:hairLight,[[x*.5,.16,.06],[x,.105,.13],[x+.006,.038,.133]],.031);}
   for(const s of [-1,1]){
    lock(this.head,hair,[[s*.12,.1,.04],[s*.155,-.02,.05],[s*.13,-.17,.025]],.047);
    lock(this.head,hair,[[s*.11,.11,-.035],[s*.14,.245,-.035],[s*.205,.125,-.05]],.045);
    lock(this.head,hairLight,[[s*.14,.22,-.035],[s*.19,.17,-.09],[s*.225,.06,-.08]],.028);
    oval(this.head,ink,[s*.139,.18,-.037],[.023,.012,.023]);
   }
   for(let i=0;i<7;i++){const phi=(i/6)*Math.PI+Math.PI/2;lock(this.head,hair,[[Math.sin(phi)*.115,.06,Math.cos(phi)*.11],[Math.sin(phi)*.14,-.06,Math.cos(phi)*.14],[Math.sin(phi)*.115,-.155,Math.cos(phi)*.12]],.037);}
  }else{
   for(let i=0;i<7;i++){const x=(i-3)*.037;lock(this.head,i%3?hair:hairLight,[[x*.4-.025,.17,.03],[x-.018,.095,.135],[x-.036,i%3===0?-.025:.025,.129]],.032);}
   for(const s of [-1,1])for(let i=0;i<4;i++)lock(this.head,hair,[[s*.1,.14-i*.025,-.04],[s*(.155+i*.005),.09-i*.032,-.04-i*.025],[s*(.175-i*.008),-.02-i*.035,-.015-i*.03]],.031);
   for(let i=0;i<5;i++)lock(this.head,i%2?hair:hairLight,[[.02,.13,-.03],[(i-2)*.055,.17,-.09],[(i-2)*.07,.13,-.15]],.031);
  }
  this.prop=new THREE.Group();this.arms[1].hand.add(this.prop);this.prop.position.set(0,-.02,.025);
  if(girl){solid(this.prop,new THREE.CylinderGeometry(.047,.035,.055,20),toon('#e2cfa5'),[0,.025,.025]);oval(this.prop,toon('#a66942'),[0,.055,.025],[.043,.01,.043]);}
  else{solid(this.prop,new THREE.BoxGeometry(.055,.055,.16),ink,[0,0,.065]);solid(this.prop,new THREE.BoxGeometry(.038,.08,.043),ink,[0,-.035,.012]);solid(this.prop,new THREE.BoxGeometry(.025,.012,.03),toon('#90cc9d'),[0,.033,.11]);}
 }
 update(a,time){
  const dt=Math.min(.05,Math.max(.001,time-this.previousTime));this.previousTime=time;const ease=1-Math.exp(-dt*15),girl=this.name==='kaede',walk=a.state==='move',prepare=a.state==='prepare',active=a.state==='active',react=a.reaction>0;
  this.root.position.set(a.x,0,a.z);const diff=Math.atan2(Math.sin(a.yaw-this.root.rotation.y),Math.cos(a.yaw-this.root.rotation.y));this.root.rotation.y+=diff*ease;
  const phase=(a.travel||0)*Math.PI*2/1.24;
  this.legs.forEach(({hip,knee},i)=>{const swing=Math.sin(phase+i*Math.PI),target=walk?swing*.38:active?(i===1?.14:-.12):!girl&&i===1?.045:0;hip.rotation.x+=(target-hip.rotation.x)*ease;knee.rotation.x+=((walk?Math.max(0,-swing)*.65:active?.13:0)-knee.rotation.x)*ease;});
  this.arms.forEach(({shoulder,elbow},i)=>{let x=walk?-Math.sin(phase+i*Math.PI)*.3:0,z=(i?1:-1)*.055,e=-.1;
   if(prepare||active){if(girl){x=i?-1.15:-.45;z=i?-.35:.28;e=i?-.65:-.3;if(active&&i)z+=Math.sin(time*9)*.15;}else{x=i?-1.28:-1.05;z=i?-.05:.35;e=-.35;if(active)x-=Math.exp(-(time-a.started)*15)*.15;}}
   if(react){x=-.4;z=(i?1:-1)*.25;}
   shoulder.rotation.x+=(x-shoulder.rotation.x)*ease;shoulder.rotation.z+=(z-shoulder.rotation.z)*ease;elbow.rotation.x+=(e-elbow.rotation.x)*ease;
  });
  this.torso.position.y=Math.sin(time*2.1)*.003+(walk?Math.abs(Math.sin(phase))*.009:0);this.torso.rotation.z+=( (!girl&&!walk&&!active?-.035:0)-this.torso.rotation.z)*ease;this.torso.rotation.x+=((active?.055:0)-this.torso.rotation.x)*ease;
  this.head.rotation.z=(girl?.025:-.045)+(active?Math.sin(time*2)*.025:0);this.head.rotation.x=prepare?-.06:0;this.prop.visible=prepare||active;
 }
}
