import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {DESKS} from './world.js';
import {painted,woodTexture,boardTexture,posterTexture} from './art.js';
import {KoroModel,StudentModel,createViewmodel,toon,mesh} from './characters.js';
export class GameScene {
 constructor(canvas){
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.setClearColor('#bfdedb');
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#c5dfec');this.scene.fog=new THREE.Fog('#c5dfec',38,110);
  this.camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.06,130);this.camera.rotation.order='YXZ';
  this.scene.add(new THREE.HemisphereLight('#dcefff','#b9a47f',1.8));const sun=new THREE.DirectionalLight('#fff0cc',3.4);sun.position.set(-24,11,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-22,right:28,top:22,bottom:-22,near:1,far:65});sun.shadow.normalBias=.065;sun.shadow.bias=-.00045;sun.shadow.radius=2;this.scene.add(sun);this.scene.add(sun.target);sun.target.position.set(0,0,0);
  const windowFill=new THREE.DirectionalLight('#d6eeff',1.05);windowFill.position.set(12,3,-2);this.scene.add(windowFill);
  this.environment=new THREE.Group();this.scene.add(this.environment);this.buildEnvironment();this.mergeStatic();
  this.koro=new KoroModel();this.scene.add(this.koro.root);this.students={karma:new StudentModel('karma'),kaede:new StudentModel('kaede')};Object.values(this.students).forEach(m=>this.scene.add(m.root));
  this.view=createViewmodel();this.camera.add(this.view.root);this.scene.add(this.camera);this.view.root.visible=false;
  this.trapGroup=new THREE.Group();this.scene.add(this.trapGroup);this.trapMeshes=new Map();this.effects=[];this.recoil=0;this.slash=0;this.markFlash=0;this.muzzleTime=0;
  this.preview=this.makeNet('#7edca5');this.preview.position.y=.025;this.scene.add(this.preview);this.preview.visible=false;
  const ringGeo=new THREE.RingGeometry(1.05,1.12,64);this.tell=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:'#ffdc56',transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));this.tell.rotation.x=-Math.PI/2;this.scene.add(this.tell);this.tell.visible=false;
  this.sweepCue=new THREE.Group();this.scene.add(this.sweepCue);this.sweepCue.visible=false;
  const sweepMat=new THREE.MeshBasicMaterial({color:'#f9bc55',transparent:true,opacity:.75,side:THREE.DoubleSide,depthWrite:false});
  const arc=mesh(this.sweepCue,new THREE.RingGeometry(3.59,3.65,48,1,Math.PI/2-1.35,2.7),sweepMat,[0,1.2,0]);arc.rotation.x=Math.PI/2;
  const floorArc=mesh(this.sweepCue,new THREE.RingGeometry(3.58,3.65,48,1,Math.PI/2-1.35,2.7),sweepMat,[0,.018,0]);floorArc.rotation.x=Math.PI/2;
  for(const a of [-1.35,1.35]){const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(Math.sin(a)*1.1,1.2,Math.cos(a)*1.1),new THREE.Vector3(Math.sin(a)*3.65,1.2,Math.cos(a)*3.65)]),new THREE.LineBasicMaterial({color:'#f9bc55',transparent:true,opacity:.5}));this.sweepCue.add(line);}
  this.resize();window.addEventListener('resize',()=>this.resize());
 }
 resize(){this.renderer.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();}
 box(x,y,z,w,h,d,mat){return mesh(this.environment,new THREE.BoxGeometry(w,h,d),mat,[x,y,z]);}
 buildEnvironment(){
  const g=this.environment,wood=new THREE.MeshStandardMaterial({color:'#ead6ae',roughness:.84,map:woodTexture()}),dark=new THREE.MeshStandardMaterial({color:'#584837',roughness:.9}),trim=new THREE.MeshStandardMaterial({color:'#ad8152',roughness:.85}),plaster=new THREE.MeshStandardMaterial({color:'#f9f5dd',roughness:1}),deskMat=new THREE.MeshStandardMaterial({color:'#d5ad79',roughness:.74,map:woodTexture()}),metal=new THREE.MeshStandardMaterial({color:'#444c47',roughness:.7,metalness:.25}),paper=new THREE.MeshStandardMaterial({color:'#fff9e7',roughness:1});
  wood.map.wrapS=wood.map.wrapT=THREE.RepeatWrapping;wood.map.repeat.set(4,5);
  this.box(0,-.12,-1,16,.24,18,wood);this.box(9.55,-.12,-1,3.1,.24,18,wood);
  const soil=new THREE.MeshStandardMaterial({color:'#fff3d9',roughness:1,map:painted(256,256,(c)=>{c.fillStyle='#cabe97';c.fillRect(0,0,256,256);for(let i=0;i<1500;i++){c.fillStyle=i%2?'#b4a47e':'#e2d4b1';const x=(i*73)%256,y=(i*127)%256;c.fillRect(x,y,1+i%2,1);}})});soil.map.wrapS=soil.map.wrapT=THREE.RepeatWrapping;soil.map.repeat.set(7,10);this.box(16.3,-.14,-1,10.4,.25,18,soil);
  const grass=new THREE.MeshStandardMaterial({color:'#90b77c',roughness:1});this.box(0,-.3,0,190,.2,190,grass);
  // Plaster walls framed in old timber. The long sides carry large gridded windows.
  this.box(0,2,-10,16,4,.22,plaster);this.box(0,2,8,16,4,.22,plaster);
  for(const x of [-8,8]){
   const sections=x===-8?[[-1,18]]:[[-8.75,2.5],[-.5,8],[7.25,1.5]];
   for(const [z,len]of sections){this.box(x,.45,z,.24,.9,len,plaster);this.box(x,3.65,z,.24,.7,len,plaster);
    const glass=new THREE.MeshBasicMaterial({color:'#b6e1e0',transparent:true,opacity:.16,side:THREE.DoubleSide});this.box(x,2.05,z,.04,2.3,len,glass);
    for(let zz=z-len/2+.5;zz<z+len/2;zz+=.8)this.box(x,2.1,zz,.12,2.35,.045,dark);
    for(const y of [1,2.15,3.25])this.box(x,y,z,.16,.08,len,dark);
   }
  }
  for(const x of [-8,8])for(const z of [-10,-4,2,8])this.box(x,2,z,.28,4,.3,dark);
  for(const x of [-8,8])this.box(x,4.15,-1,.24,.4,18,plaster);
  for(const z of [-10,8])this.box(0,4.15,z,16,.4,.22,plaster);
  for(const y of [.1,1,3.4,4]){this.box(0,y,-9.86,16,.16,.16,dark);this.box(0,y,7.86,16,.16,.16,dark);}
  for(const z of [-7.5,-4.5,3.5,6.5])this.box(8,1.95,z,.3,3.9,.13,dark);
  for(const z of [-6,5]){this.box(8,3.5,z,.3,.2,3,trim);this.box(8,.018,z,.4,.035,3,trim);}
  // Gathered linen curtains keep the long window wall recognisably a classroom.
  const linen=new THREE.MeshStandardMaterial({color:'#e2ecd6',roughness:1,side:THREE.DoubleSide});
  for(const x of [-7.8,7.8])for(const z of [-8.8,-4.2,.4,5.5]){
   this.box(x,3.37,z,.09,.07,1.05,dark);
   const geo=new THREE.PlaneGeometry(.68,2.18,16,8),a=geo.attributes.position;
   for(let i=0;i<a.count;i++){const u=a.getX(i),v=a.getY(i),pinch=1-.55*Math.exp(-(((v+.35)*3)**2));a.setXYZ(i,u*pinch,v,Math.sin(u*45)*.055);}geo.computeVertexNormals();
   const curtain=mesh(g,geo,linen,[x,2.22,z]);curtain.rotation.y=x<0?Math.PI/2:-Math.PI/2;
   this.box(x,1.88,z,.11,.065,.33,trim);
  }
  // Ceiling boards and transverse beams preserve the reference's low old-school roof.
  this.box(0,4.35,-1,16,.15,18,new THREE.MeshStandardMaterial({color:'#d7ceb3',roughness:1}));
  for(let z=-9.7;z<8;z+=2.5)this.box(0,4.1,z,16,.22,.2,dark);
  for(const x of [-5,0,5])this.box(x,4.16,-1,.16,.2,18,dark);
  const bounce=new THREE.PointLight('#fff2d9',8,15,2);bounce.position.set(0,3.2,-5);this.scene.add(bounce);
  const lightmat=new THREE.MeshBasicMaterial({color:'#fffbd9'});
  for(const x of [-3.7,3.7])for(const z of [-5,2]){this.box(x,3.72,z,2.8,.09,.24,metal);this.box(x,3.66,z,2.6,.05,.15,lightmat);this.box(x-.9,3.98,z,.025,.5,.025,metal);this.box(x+.9,3.98,z,.025,.5,.025,metal);}
  // Blackboard, chalk ledge and class notices.
  this.box(0,2.25,-9.7,9.6,2.65,.19,dark);mesh(g,new THREE.PlaneGeometry(9.3,2.42),new THREE.MeshBasicMaterial({map:boardTexture()}),[0,2.25,-9.59]);this.box(0,.94,-9.44,9.7,.09,.3,trim);
  for(let i=0;i<4;i++)this.box(-1+i*.13,1.01,-9.41,.09,.035,.03,paper);this.box(2.8,1.025,-9.4,.27,.08,.12,metal);
  const poster=new THREE.MeshStandardMaterial({map:posterTexture()});mesh(g,new THREE.PlaneGeometry(.75,1.55),poster,[-6.5,2.2,-9.75]);
  const clock=new THREE.Group();clock.position.set(6.1,3.25,-9.64);g.add(clock);mesh(clock,new THREE.CylinderGeometry(.35,.35,.08,32),dark).rotation.x=Math.PI/2;mesh(clock,new THREE.CircleGeometry(.31,32),paper,[0,0,.045]);const hand=mesh(clock,new THREE.BoxGeometry(.018,.21,.015),metal,[.03,.07,.06]);hand.rotation.z=-.5;mesh(clock,new THREE.BoxGeometry(.15,.018,.015),metal,[.065,0,.065]);
  // Teacher's table and notebooks.
  this.box(-4.8,.86,-8,2.4,.1,.95,deskMat);this.box(-4.8,.48,-8.3,2.3,.7,.08,trim);for(const x of [-5.85,-3.75])for(const z of [-8.38,-7.62])this.box(x,.42,z,.1,.84,.1,dark);
  for(let i=0;i<4;i++)this.box(-5.4,.94+i*.035,-8,.5,.03,.33,i%2?paper:toon('#557b77'));
  const vaultTape=new THREE.MeshStandardMaterial({color:'#8ec8ae',roughness:.9});
  DESKS.forEach(({x,z},i)=>{
   this.box(x,.835,z,1.45,.05,.85,dark);
   for(const edge of [-.73,.73])this.box(x+edge,.89,z,.025,.095,.89,trim);mesh(g,new RoundedBoxGeometry(1.48,.09,.89,2,.025),deskMat,[x,.89,z]);
   // The paired mint strips are the game's consistent low-vault affordance.
   for(const sx of [-.48,.48])this.box(x+sx,.938,z,.10,.008,.80,vaultTape);
   this.box(x,.806,z,1.35,.018,.74,dark);
   this.box(x,.65,z-.31,1.32,.28,.07,trim);this.box(x,.57,z,1.3,.05,.7,trim);
   for(const sx of [-.61,.61])for(const sz of [-.31,.31])this.box(x+sx,.41,z+sz,.06,.82,.06,metal);
   this.box(x,.47,z+.85,.65,.06,.65,deskMat);this.box(x,.85,z+1.13,.65,.23,.07,deskMat);
   for(const sx of [-.26,.26])for(const sz of [.59,1.1])this.box(x+sx,.25,z+sz,.045,.5,.045,metal);
   for(const sx of [-.27,.27])this.box(x+sx,.7,z+1.1,.045,.45,.045,metal);
   if(i%3!==0){const notebook=this.box(x-.22,.955,z-.1,.37,.025,.47,paper);notebook.rotation.y=(i%3-1)*.15;this.box(x-.39,.974,z-.1,.025,.007,.47,toon(i%2?'#9a5260':'#56817d'));this.box(x+.23,.964,z-.08,.16,.02,.025,metal);}
   if(i%4===1)this.box(x+.72,.51,z+.05,.15,.44,.34,toon('#323d46'));
  });
  // Rear cubbies, attendance board, notices and a plant.
  this.box(-7.55,.9,6.7,.6,1.8,1.8,trim);
  for(const y of [.3,.9,1.5])for(const z of [6.15,6.7,7.25]){this.box(-7.2,y,z,.05,.49,.49,dark);this.box(-7.16,y-.21,z,.09,.05,.49,wood);}
  this.box(0,2.55,7.7,5.6,1.35,.12,trim);for(let i=0;i<16;i++){this.box(-2.5+(i%8)*.71,2.25+Math.floor(i/8)*.6,7.61,.47,.48,.02,paper);}
  for(const x of [-5.8,5.6]){const poster2=mesh(g,new THREE.PlaneGeometry(.75,1.55),poster,[x,2.35,7.75]);poster2.rotation.y=Math.PI;}
  // Veranda canopy and rail. Open yard access along its entire edge.
  this.box(9.6,3.8,-1,3.4,.13,18,trim);for(const z of [-9.6,-1,7.6])this.box(10.9,1.9,z,.18,3.8,.18,dark);
  this.box(10.95,3.85,-1,.15,.38,18,dark);this.box(9.6,4.02,-1,3.7,.12,18,new THREE.MeshStandardMaterial({color:'#687d75',roughness:.85}));
  // Weathered veranda boards and thresholds describe the two return routes.
  for(let x=8.1;x<11.1;x+=.24)this.box(x,.009,-1,.012,.012,18,dark);
  const routeMat=new THREE.MeshBasicMaterial({color:'#e7e5c5',side:THREE.DoubleSide});
  for(const z of [-6,5]){for(let i=0;i<3;i++){const chevron=new THREE.Shape();chevron.moveTo(0,-.23);chevron.lineTo(.22,0);chevron.lineTo(0,.23);chevron.lineTo(-.07,.14);chevron.lineTo(.07,0);chevron.lineTo(-.07,-.14);chevron.closePath();const m=mesh(g,new THREE.ShapeGeometry(chevron),routeMat,[9+i*.5,.012,z]);m.rotation.x=-Math.PI/2;}}
  for(const z of [-9.7,7.7]){this.box(15.1,.83,z,12.6,.09,.1,trim);for(let x=9;x<22;x+=1.2)this.box(x,.55,z,.08,1.1,.08,trim);}
  this.box(21.3,.8,-1,.1,.1,18,trim);for(let z=-9;z<8;z+=1.2)this.box(21.3,.55,z,.09,1.1,.09,trim);
  // Chalk training circles and a wooden target in the yard.
  for(const z of [-5,3]){const ring=mesh(g,new THREE.RingGeometry(1.45,1.48,64),new THREE.MeshBasicMaterial({color:'#ece5ba',side:THREE.DoubleSide}),[16,.005,z]);ring.rotation.x=-Math.PI/2;}
  // Two raised school garden beds are real cover, matched in World.solids.
  const gardenSoil=new THREE.MeshStandardMaterial({color:'#544d36',roughness:1}),lettuce=[new THREE.MeshStandardMaterial({color:'#6c9564',roughness:1}),new THREE.MeshStandardMaterial({color:'#91ac73',roughness:1})];
  for(const {x,z,w,d}of [{x:16,z:-6.5,w:2.8,d:.7},{x:18,z:3.4,w:.7,d:2.8}]){
   this.box(x,.53,z,w,1.06,d,wood);this.box(x,1.08,z,w+.08,.08,d+.08,trim);this.box(x,1.126,z,w-.13,.025,d-.13,gardenSoil);
   for(const y of [.25,.57,.89])this.box(x,y,z,w+.018,.018,d+.018,dark);
   for(let i=0;i<9;i++){const px=x+(w>d?(i-4)*.29:0),pz=z+(d>w?(i-4)*.29:0);mesh(g,new THREE.SphereGeometry(.19,7,5),lettuce[i%2],[px,1.19,pz],[1,.35,1]);}
  }
  // Grass tufts frame the arena edge; none occupy the traversal surface.
  const tuft=new THREE.MeshStandardMaterial({color:'#729765',roughness:1,side:THREE.DoubleSide});
  for(let i=0;i<120;i++){const a=i*2.399,r=22+(i%7)*.7,x=Math.sin(a)*r+3,z=Math.cos(a)*r;const geo=new THREE.ConeGeometry(.13,.32+(i%3)*.07,3);mesh(g,geo,tuft,[x,.13,z]);}
  for(const z of [-9.45,7.45])for(const x of [11.6,20.5]){
   const pot=mesh(g,new THREE.CylinderGeometry(.23,.16,.38,8),new THREE.MeshStandardMaterial({color:'#9b6e49',roughness:1}),[x,.17,z]);
   for(let j=0;j<5;j++){const leaf=mesh(g,new THREE.SphereGeometry(.15,6,4),tuft,[x+Math.sin(j*2)*.18,.55+j*.045,z+Math.cos(j*2)*.17],[1,.35,1.8]);leaf.rotation.z=Math.sin(j)*.5;}
  }
  const bark=new THREE.MeshStandardMaterial({color:'#756043',roughness:1}),leaf=[toon('#7fa86c'),toon('#67956c'),toon('#9bbd7c')];
  for(let i=0;i<60;i++){const a=i*2.399,r=23+(i%7)*3.1,x=Math.sin(a)*r+3,z=Math.cos(a)*r;
   mesh(g,new THREE.CylinderGeometry(.18,.38,6+(i%3),7),bark,[x,2.6,z]);for(let j=0;j<3;j++)mesh(g,new THREE.SphereGeometry(2.5+(i%3)*.35,10,7),leaf[(i+j)%3],[x+Math.sin(j*2)*1.3,5+j*.7,z+Math.cos(j*2)*1.1],[1,1.2,1]);}
  const mountain=toon('#8eb3a0');for(let i=0;i<12;i++)mesh(g,new THREE.ConeGeometry(14,18+(i%3)*6,7),mountain,[Math.sin(i*.7)*65,-2,Math.cos(i*.7)*65],[1.3,1,1]);
  // Window-shaped pools of daylight with the same spacing as the timber mullions.
  const warm=new THREE.MeshBasicMaterial({color:'#fff3ce',transparent:true,opacity:.17,depthWrite:false,side:THREE.DoubleSide});
  for(let z=-8.7;z<7;z+=.8)for(let row=0;row<2;row++){
   const shape=new THREE.Shape();const x=-7.85+row*2.7,zz=z+row*.4;
   shape.moveTo(x,zz);shape.lineTo(x+2.55,zz+.4);shape.lineTo(x+2.55,zz+1.08);shape.lineTo(x,zz+.68);shape.closePath();
   const patch=mesh(g,new THREE.ShapeGeometry(shape),warm,[0,.009,0]);patch.rotation.x=Math.PI/2;
  }

 }
 mergeStatic(){
  this.environment.updateMatrixWorld(true);const groups=new Map(),remove=[];
  this.environment.traverse(o=>{if(o.isMesh&&!o.material.transparent){const key=o.material.uuid;if(!groups.has(key))groups.set(key,{mat:o.material,list:[]});const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(o.matrixWorld);groups.get(key).list.push(geo);remove.push(o);}});
  remove.forEach(o=>o.removeFromParent());for(const {mat,list}of groups.values()){const geo=mergeGeometries(list,false);if(geo){const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;this.scene.add(m);}list.forEach(g=>g.dispose());}
 }
 makeNet(color){
  const p=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,side:THREE.DoubleSide});const ring=new THREE.Mesh(new THREE.RingGeometry(.68,.73,48),mat);ring.rotation.x=-Math.PI/2;p.add(ring);
  for(const a of [-.4,0,.4])for(const flip of [false,true]){const line=new THREE.Mesh(new THREE.BoxGeometry(flip?.015:1.1,.015,flip?1.1:.015),mat);line.position.set(flip?a:0,.015,flip?0:a);p.add(line);}return p;
 }
 syncTraps(s){
  for(const [id,m]of this.trapMeshes)if(!s.traps.some(t=>t.id===id)){this.disposeObject(m);this.trapMeshes.delete(id);}
  for(const t of s.traps){let m=this.trapMeshes.get(t.id);if(!m){m=this.makeNet('#85e1a6');this.trapGroup.add(m);this.trapMeshes.set(t.id,m);}m.position.set(t.x,.02,t.z);m.visible=!t.used;m.children.forEach(c=>c.material.color.set(t.seen?'#e7b75b':t.armed?'#c5d5c6':'#85e1a6'));}
  this.preview.visible=s.tool===3&&s.status==='playing';if(this.preview.visible){const t=s.trapPreview();this.preview.position.set(t.x,.03,t.z);this.preview.children.forEach(c=>c.material.color.set(t.valid?'#a1f6bc':'#f47768'));}
 }
 disposeObject(o){o.traverse(m=>{if(m.geometry)m.geometry.dispose();if(m.material){if(Array.isArray(m.material))m.material.forEach(a=>a.dispose());else m.material.dispose();}});o.removeFromParent();}
 clearEffects(){for(const e of this.effects)this.disposeObject(e.object);this.effects=[];for(const m of this.trapMeshes.values())this.disposeObject(m);this.trapMeshes.clear();this.recoil=this.slash=this.muzzleTime=0;this.view.muzzle.visible=false;}
 effect(object,life,kind='fade'){if(this.effects.length>=32){const oldest=this.effects.shift();this.disposeObject(oldest.object);}this.scene.add(object);this.effects.push({object,life,max:life,kind});}
 handle(e,s){
  if(e.type==='attack'){
   this.recoil=e.tool===2?.035:.048;if(e.tool===1)this.muzzleTime=.045;if(e.tool===2){this.slash=1;const trail=new THREE.Mesh(new THREE.TorusGeometry(.65,.014,4,24,1.8),new THREE.MeshBasicMaterial({color:'#a5ffb4',transparent:true,opacity:.65}));trail.position.copy(this.camera.position).add(new THREE.Vector3(0,0,-1.2).applyQuaternion(this.camera.quaternion));trail.quaternion.copy(this.camera.quaternion);this.effect(trail,.14);}
   else {const d=Math.min(45,e.distance),o=e.origin,dir=e.dir;const start=new THREE.Vector3(o.x,o.y-.08,o.z),end=new THREE.Vector3(o.x+dir.x*d,o.y+dir.y*d,o.z+dir.z*d);const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([start,end]),new THREE.LineBasicMaterial({color:'#b0ffc6',transparent:true,opacity:.9}));this.effect(line,.1);}
  }
  if(['dodge','dash','reposition'].includes(e.type))this.afterimage(s);
  if(e.type==='reposition'&&e.target){const ring=this.makeNet('#e8de93');ring.position.set(e.target.x,.03,e.target.z);ring.scale.setScalar(.7);this.effect(ring,.55);}
  if(e.type==='ability'){
   const a=s.allies[e.who];
   if(e.who==='karma'){const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a.x,1.4,a.z),new THREE.Vector3(s.koro.x,1.8,s.koro.z)]),new THREE.LineBasicMaterial({color:'#9bffc5',transparent:true,opacity:.8}));this.effect(line,.18);}
   else {const ring=this.makeNet('#ffe59a');ring.position.set(a.x,1.6,a.z);ring.scale.setScalar(.35);ring.rotation.x=Math.PI/2;this.effect(ring,.7,'expand');}
  }
  if(e.type==='hit'||e.type==='trapTrigger'){
   const net=e.type==='hit'?new THREE.Group():this.makeNet('#86ffb3');if(e.type==='hit'){for(let i=0;i<4;i++){const mark=new THREE.Mesh(new THREE.BoxGeometry(.035,.24,.02),new THREE.MeshBasicMaterial({color:'#f6d447',transparent:true}));const a=i*Math.PI/2;mark.position.set(Math.cos(a)*.32,0,Math.sin(a)*.32);mark.rotation.x=Math.PI/2;net.add(mark);}}net.position.set(e.x,e.type==='hit'?1.5:.25,e.z);if(e.type==='hit')net.rotation.x=Math.PI/2;this.effect(net,.65,'expand');
   if(e.type==='hit')this.markFlash=1;
  }
  if(e.type==='intercept'){const curl=new THREE.Mesh(new THREE.TorusGeometry(.20,.022,5,20,4),new THREE.MeshBasicMaterial({color:'#f6d447',transparent:true,opacity:1}));curl.position.set(e.x,1.75,e.z);curl.quaternion.copy(this.camera.quaternion);this.effect(curl,.19);}
  if(['glance','contact','opening'].includes(e.type)){const accent=new THREE.Group(),color=e.type==='opening'?'#9ee8be':'#fff7d4';for(let i=0;i<3;i++){const mark=mesh(accent,new THREE.BoxGeometry(.018,.13,.014),new THREE.MeshBasicMaterial({color,transparent:true}),[(i-1)*.12,0,0]);mark.rotation.z=(i-1)*-.5;}accent.position.set(e.x??s.koro.x,1.9,e.z??s.koro.z);accent.quaternion.copy(this.camera.quaternion);this.effect(accent,.22);}
  if(e.type==='scenery'){
   const dot=new THREE.Mesh(new THREE.SphereGeometry(.035,6,4),new THREE.MeshBasicMaterial({color:e.surface==='wood'?'#d8b189':'#eee9d6',transparent:true,opacity:1}));dot.position.set(e.x,e.y,e.z);this.effect(dot,.5);
  }
 }
 afterimage(s){const g=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:'#ffe45c',transparent:true,opacity:.24,depthWrite:false});mesh(g,new THREE.SphereGeometry(.71,16,12),mat,[0,2.5,0]);mesh(g,new THREE.CylinderGeometry(.43,.78,1.66,12),mat,[0,1.25,0]);g.position.set(s.koro.x,0,s.koro.z);this.effect(g,.32);}
 update(s,dt,time,playing,settings={}){
  this.koro.update(s.koro,time);for(const [name,m]of Object.entries(this.students))m.update(s.allies[name],time);
  this.syncTraps(s);this.preview.visible&&=playing;
  if(playing){const p=s.player;this.camera.position.set(p.x,p.eye,p.z);this.camera.rotation.set(p.pitch,p.yaw,0);this.view.root.visible=true;
   const targetFov=settings.aiming&&s.tool===1?51:settings.fov||70;this.camera.fov+=(targetFov-this.camera.fov)*Math.min(1,dt*12);this.camera.updateProjectionMatrix();
  }else this.view.root.visible=false;
  this.recoil=Math.max(0,this.recoil-dt*.6);this.slash=Math.max(0,this.slash-dt*5);this.muzzleTime=Math.max(0,this.muzzleTime-dt);this.view.muzzle.visible=this.muzzleTime>0;this.view.slide.position.z=-.72+this.recoil*.7;
  this.view.root.scale.setScalar(.76);this.view.root.position.set(settings.aiming?-.076:.21,(settings.aiming?-.12:-.25)+(settings.reduced?0:Math.sin(time*1.8)*.003),-.1+this.recoil);this.view.root.rotation.z=-this.slash*.65+(s.disarm||0)*.7;this.view.root.position.y-=(s.disarm||0)*.25;
  this.view.gun.visible=s.tool===1;this.view.knife.visible=s.tool===2;this.view.net.visible=s.tool===3;
  if(s.reloadTime>0){const r=Math.min(1,s.reloadTime/1.1);this.view.root.rotation.x=-Math.sin(r*Math.PI)*.55;this.view.root.rotation.z-=Math.sin(r*Math.PI)*.3;this.view.root.position.y-=Math.sin(r*Math.PI)*.06;}else this.view.root.rotation.x=this.recoil*1.4;
  if(s.player.slide>0)this.view.root.position.y-=.035;if(s.player.vault>0)this.view.root.rotation.z+=.15;
  this.tell.visible=['windup','tag'].includes(s.koro.state)&&playing;if(this.tell.visible){this.tell.position.set(s.koro.target?.x??s.player.x,.025,s.koro.target?.z??s.player.z);this.tell.scale.setScalar(1+Math.sin(time*13)*.05);}
  this.sweepCue.visible=['sweepWindup','sweep'].includes(s.koro.state)&&playing;if(this.sweepCue.visible){this.sweepCue.position.set(s.koro.x,0,s.koro.z);this.sweepCue.rotation.y=s.koro.sweepYaw??s.koro.yaw;this.sweepCue.children.forEach(c=>c.material.opacity=s.koro.state==='sweep'?.75:.32+Math.sin(time*15)*.12);}
  if(['dodge','tag','reposition'].includes(s.koro.state)&&Math.floor(time*12)!==this.lastTrail){this.lastTrail=Math.floor(time*12);this.afterimage(s);}
  for(let i=this.effects.length-1;i>=0;i--){const e=this.effects[i];e.life-=dt;if(e.life<=0){this.disposeObject(e.object);this.effects.splice(i,1);continue;}e.object.traverse(m=>{if(m.material)m.material.opacity=Math.min(.8,e.life/e.max);});if(e.kind==='expand')e.object.scale.setScalar(1+(1-e.life/e.max)*.7);}
  this.renderer.render(this.scene,this.camera);
 }
 menuCamera(time){this.camera.position.set(5.7,2.4,6.4);this.camera.lookAt(-.7,1.7,-6.4);this.camera.fov=68;this.camera.updateProjectionMatrix();}
 project(x,y,z){const p=new THREE.Vector3(x,y,z).project(this.camera);return {x:(p.x*.5+.5)*innerWidth,y:(-.5*p.y+.5)*innerHeight,visible:p.z<1&&p.z>-1&&Math.abs(p.x)<.94&&Math.abs(p.y)<.9};}
}
