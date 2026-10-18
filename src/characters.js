import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {faceTexture} from './art.js';
const grad=new THREE.DataTexture(new Uint8Array([130,195,255]),3,1,THREE.RedFormat);grad.needsUpdate=true;grad.minFilter=grad.magFilter=THREE.NearestFilter;
export const toon=(color)=>new THREE.MeshToonMaterial({color,gradientMap:grad});
const outline=new THREE.MeshBasicMaterial({color:0x282d32,side:THREE.BackSide});
const colors={yellow:toon('#ffe146'),robe:toon('#24252a'),red:toon('#a6363e'),purple:toon('#65519b'),gold:toon('#f2b75d'),white:toon('#fffbea'),skin:toon('#f7cfb4'),grey:toon('#9293a4'),dark:toon('#354044'),shirt:toon('#f8f5e9'),black:toon('#292b32')};
colors.yellow.emissive.set('#d9a816');colors.yellow.emissiveIntensity=.12;colors.yellow.toneMapped=false;
export function mesh(parent,geo,mat,pos=[0,0,0],scale=null,outlined=false){const m=new THREE.Mesh(geo,mat);m.position.set(...pos);if(scale)m.scale.set(...scale);m.castShadow=!mat.transparent;m.receiveShadow=!mat.transparent&&mat!==colors.yellow;parent.add(m);if(outlined){const edge=new THREE.Mesh(geo,outline);edge.scale.setScalar(1.025);m.add(edge);}return m;}
const sphere=new THREE.SphereGeometry(1,24,16),box=new THREE.BoxGeometry(1,1,1);
const ball=(p,mat,pos,scale,out=true)=>mesh(p,sphere,mat,pos,scale,out);
function face(parent,kind,w,h,z,y){
 const g=new THREE.PlaneGeometry(w,h,20,12),a=g.attributes.position;
 for(let i=0;i<a.count;i++){const x=a.getX(i),yy=a.getY(i);a.setZ(i,-x*x*(kind==='koro'?.65:1.6)-yy*yy*.15);}g.computeVertexNormals();
 return mesh(parent,g,new THREE.MeshBasicMaterial({map:faceTexture(kind),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}),[0,y,z]);
}
function curvedMesh(parent,mat,r=.1){
 const g=new THREE.BufferGeometry(),n=24,sides=8;g.setAttribute('position',new THREE.BufferAttribute(new Float32Array((n+1)*(sides+1)*3),3));g.setAttribute('normal',new THREE.BufferAttribute(new Float32Array((n+1)*(sides+1)*3),3));const idx=[];
 for(let i=0;i<n;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;idx.push(a,b,a+1,b,b+1,a+1);}g.setIndex(idx);const m=mesh(parent,g,mat);m.userData.radius=r;return m;
}
const v=new THREE.Vector3(),tangent=new THREE.Vector3(),normal=new THREE.Vector3(),binormal=new THREE.Vector3();
function bend(m,points){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),p=m.geometry.attributes.position,n=m.geometry.attributes.normal;
 for(let i=0;i<=24;i++){const t=i/24;curve.getPoint(t,v);curve.getTangent(t,tangent);normal.set(0,0,1).cross(tangent).normalize();if(normal.lengthSq()<.1)normal.set(1,0,0);binormal.crossVectors(tangent,normal).normalize();const radius=m.userData.radius*(1-.52*t);
  for(let j=0;j<=8;j++){const a=j/8*Math.PI*2,dx=normal.x*Math.cos(a)+binormal.x*Math.sin(a),dy=normal.y*Math.cos(a)+binormal.y*Math.sin(a),dz=normal.z*Math.cos(a)+binormal.z*Math.sin(a),idx=i*9+j;p.setXYZ(idx,v.x+dx*radius,v.y+dy*radius,v.z+dz*radius);n.setXYZ(idx,dx,dy,dz);}}
 p.needsUpdate=true;n.needsUpdate=true;m.geometry.computeBoundingSphere();
}
export class KoroModel {
 constructor(){
  this.root=new THREE.Group();this.body=new THREE.Group();this.root.add(this.body);const p=this.body;
  mesh(p,new THREE.CylinderGeometry(.43,.78,1.66,24),colors.robe,[0,1.25,0],null,true);
  // A flared academic gown, with separate red stole and gold-lined collar.
  const stole=new THREE.Shape();stole.moveTo(-.17,1.98);stole.lineTo(.17,1.98);stole.lineTo(.32,.47);stole.lineTo(0,.31);stole.lineTo(-.32,.47);stole.closePath();
  mesh(p,new THREE.ShapeGeometry(stole),colors.red,[0,0,.76]);
  for(const s of [-1,1]){
   const sleeve=mesh(p,new THREE.CylinderGeometry(.28,.49,.85,16),colors.robe,[s*.71,1.79,0],null,true);sleeve.rotation.z=s*.96;
   for(let i=0;i<3;i++){mesh(sleeve,new THREE.CylinderGeometry(.372+i*.045,.397+i*.045,.09,16),colors.purple,[0,.1-i*.18,0]);}
   const collar=curvedMesh(p,colors.gold,.065);bend(collar,[[s*.53,2.09,.16],[s*.6,1.93,.4],[s*.42,1.67,.55],[0,1.5,.66]]);
   const collarShape=new THREE.Shape();collarShape.moveTo(s*.02,1.92);collarShape.lineTo(s*.34,1.89);collarShape.lineTo(s*.16,1.62);collarShape.closePath();mesh(p,new THREE.ShapeGeometry(collarShape),colors.white,[0,0,.79]);
  }
  const tieShape=new THREE.Shape();tieShape.moveTo(0,.42);tieShape.lineTo(.23,-.26);tieShape.lineTo(0,-.45);tieShape.lineTo(-.23,-.26);tieShape.closePath();
  mesh(p,new THREE.ShapeGeometry(tieShape),colors.black,[0,1.49,.82]);
  const moon=mesh(p,new THREE.TorusGeometry(.13,.027,8,30,Math.PI*1.7),colors.gold,[0,1.31,.84]);moon.rotation.z=-.5;
  this.head=ball(p,colors.yellow,[0,2.5,0],[.71,.71,.71]);face(this.head,'koro',1.65,1.35,1.015,-.03);
  mesh(p,new THREE.CylinderGeometry(.27,.27,.17,16),colors.black,[0,3.17,0]);const cap=mesh(p,box,colors.black,[0,3.27,0],[.62,.05,.62],true);cap.rotation.y=.25;
  const tassel=curvedMesh(p,colors.gold,.025);bend(tassel,[[.02,3.31,.03],[.35,3.31,.15],[.4,3.16,.21],[.45,3.06,.2]]);
  this.arms=Array.from({length:4},()=>curvedMesh(p,colors.yellow,.135));this.feet=Array.from({length:6},()=>curvedMesh(p,colors.yellow,.19));
  this.tips=Array.from({length:10},(_,i)=>ball(p,colors.yellow,[0,0,0],i<4?[.065,.065,.065]:[.095,.095,.095],false));
  this.fingers=Array.from({length:4},()=>curvedMesh(p,colors.yellow,.06));
  this.chalk=mesh(p,new THREE.CylinderGeometry(.025,.025,.22,8),colors.white,[1.4,2,0]);
  this.paper=mesh(p,new THREE.BoxGeometry(.3,.38,.012),colors.white,[-1,1.25,.4]);this.paper.rotation.z=.12;
  for(let i=0;i<4;i++)mesh(this.paper,new THREE.BoxGeometry(.18,.008,.004),i===0?colors.red:colors.grey,[0,.11-i*.055,.008]);
  this.sweat=ball(p,toon('#b5e9f6'),[.62,2.75,.38],[.06,.13,.045],false);this.sweat.visible=false;
  this.update({x:0,z:0,yaw:0,state:'teach'},0);
 }
 update(k,time){
  const sweep=['sweepWindup','sweep'].includes(k.state);this.root.position.set(k.x,0,k.z);const facing=sweep?(k.sweepYaw??k.yaw):k.yaw;let diff=Math.atan2(Math.sin(facing-this.root.rotation.y),Math.cos(facing-this.root.rotation.y));this.root.rotation.y+=diff*(sweep?.5:.23);
  this.head.rotation.y=Math.atan2(Math.sin((k.headYaw??k.yaw)-this.root.rotation.y),Math.cos((k.headYaw??k.yaw)-this.root.rotation.y))*.55;
  const excited=['windup','tag','trapped','recover','sweepWindup','sweep'].includes(k.state),moving=['tag','travel','dodge','reposition'].includes(k.state);this.body.position.y=Math.sin(time*2.3)*.035;this.body.rotation.z=k.state==='dodge'?Math.sin(time*30)*.12:k.state==='feint'?-.12:sweep?-.08:Math.sin(time*1.8)*.018;this.body.rotation.x=k.state==='tag'?.12:k.state==='reposition'?.18:k.state==='counter'?-.05:0;
  this.head.material=k.state==='recover'?toonCached('#ff9a94'):colors.yellow;this.sweat.visible=k.state==='trapped';
  for(let i=0;i<4;i++){const s=i%2===0?-1:1,upper=i<2,wave=Math.sin(time*(excited?7:2.3)+i)*.14,y=upper?1.75:1.1;
   const end=[s*(upper?1.38:.92),y+(upper?.9:.3)+wave,k.intercept>0&&i===1?1.5:k.state==='tag'?1.1:.3];
   if(sweep&&i===0){const angle=-1.35+(k.state==='sweep'?(k.sweepProgress??0)*2.7:0),r=k.state==='sweep'?3.65:1.65;end[0]=Math.sin(angle)*r;end[1]=1.2;end[2]=Math.cos(angle)*r;}
   if(k.state==='windup'&&upper){end[0]*=.75;end[1]=1.8;end[2]=1.35;}
   bend(this.arms[i],[[s*.55,y,0],[s*1.15,y-.15,.08],[s*(upper?1.62:1.3),y+(upper?.4:-.15)+wave,.2],end]);this.tips[i].position.set(...end);
   if(upper)for(let j=0;j<2;j++)bend(this.fingers[i*2+j],[end,[end[0]+s*(j*.12),end[1]+.14,end[2]],[end[0]+s*(.12+j*.13),end[1]+.26,end[2]],[end[0]+s*(.18+j*.13),end[1]+.23,end[2]+.02]]);
  }
  for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2,s=Math.sin(time*(moving?11:2)+i)*.1,end=[Math.sin(a)*1.04,.18+s,Math.cos(a)*1.04];bend(this.feet[i],[[Math.sin(a)*.35,.6,Math.cos(a)*.35],[Math.sin(a)*.65,.2+s,Math.cos(a)*.65],[Math.sin(a)*.95,.13,Math.cos(a)*.95],end]);this.tips[i+4].position.set(...end);}
  this.chalk.visible=k.state==='teach';this.chalk.position.copy(this.tips[1].position);this.chalk.position.y+=.18;this.paper.visible=['teach','intercept'].includes(k.state)||k.intercept>0;this.paper.position.copy(this.tips[2].position);this.paper.position.y+=.1;
 }
}
const matCache={};function toonCached(c){return matCache[c]??=toon(c);}
function spike(parent,mat,x,y,z,tx,ty,tz,width=.13){
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([x-width,y,z,x+width,y,z,x,y+.03,z+.12,tx,ty,tz],3));g.setIndex([0,2,3,2,1,3,1,0,3,0,1,2]);g.computeVertexNormals();return mesh(parent,g,mat);
}
export {StudentModel} from './students.js';
export function createViewmodel(){const root=new THREE.Group();const hand=toon('#f3c8ac'),blue=toon('#354a65'),grey=toon('#454e52'),mint=toon('#79d899');
 for(const s of [-1,1]){const arm=mesh(root,new THREE.CylinderGeometry(.055,.072,.48,12),colors.white,[s*.19,-.25,-.42]);arm.rotation.x=-.9;ball(root,hand,[s*.12,-.15,-.61],[.058,.036,.085]);for(let i=0;i<4;i++){const finger=mesh(root,new THREE.CapsuleGeometry(.012,.07,3,6),hand,[s*.12+(i-1.5)*.022,-.15,-.67]);finger.rotation.x=Math.PI/2;}}
 const gun=new THREE.Group();root.add(gun);const slide=mesh(gun,new RoundedBoxGeometry(.105,.085,.32,2,.008),grey,[.1,-.08,-.72],null,true);gun.userData.slide=slide;mesh(gun,new RoundedBoxGeometry(.087,.19,.1,2,.008),blue,[.1,-.19,-.61]);mesh(gun,box,mint,[.1,-.035,-.78],[.035,.025,.07]);mesh(gun,new THREE.CylinderGeometry(.025,.025,.03,12),colors.black,[.1,-.08,-.89]).rotation.x=Math.PI/2;
 mesh(gun,box,colors.black,[.1,-.129,-.73],[.09,.008,.27]);mesh(gun,box,grey,[.1,-.29,-.61],[.09,.015,.105]);
 const muzzle=new THREE.Group();muzzle.position.set(.1,-.08,-.915);gun.add(muzzle);for(let i=0;i<2;i++){const star=mesh(muzzle,new THREE.PlaneGeometry(.12,.055),new THREE.MeshBasicMaterial({color:i?'#e8fff1':'#a8ffd5',transparent:true,opacity:.85,depthWrite:false}));star.rotation.z=i*Math.PI/2;}muzzle.visible=false;gun.userData.muzzle=muzzle;
 // Fixed sights, trigger guard, grip seams and slide separation make handling readable.
 mesh(gun,box,colors.black,[.1,-.047,-.61],[.073,.012,.03]);mesh(gun,box,colors.black,[.1,-.043,-.86],[.015,.019,.022]);
 const guard=mesh(gun,new THREE.TorusGeometry(.048,.008,6,16,Math.PI*1.65),grey,[.1,-.183,-.72]);guard.rotation.y=Math.PI/2;
 for(let i=0;i<4;i++)mesh(gun,box,colors.black,[.145,-.085,-.61-i*.022],[.005,.05,.007]);
 for(let i=0;i<3;i++)mesh(gun,box,colors.black,[.144,-.15-i*.035,-.61],[.007,.012,.083]);
 const knife=new THREE.Group();root.add(knife);mesh(knife,box,grey,[.12,-.12,-.67],[.055,.055,.22]);const blade=mesh(knife,new THREE.ConeGeometry(.065,.43,3),mint,[.12,-.08,-.96]);blade.rotation.x=-Math.PI/2;blade.scale.z=.2;
 const net=new THREE.Group();root.add(net);mesh(net,new THREE.CylinderGeometry(.13,.13,.035,24),mint,[.08,-.1,-.7]);
 return {root,gun,knife,net,slide,muzzle};}
