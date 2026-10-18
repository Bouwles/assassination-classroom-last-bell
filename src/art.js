import * as THREE from 'three';
export function painted(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
export function woodTexture(){return painted(512,512,(c,w,h)=>{
 c.fillStyle='#c29560';c.fillRect(0,0,w,h);
 for(let j=0;j<8;j++){
  const y=j*64;c.fillStyle=['#c59b68','#cba373','#bd915c','#c9a170'][j%4];c.fillRect(0,y,w,64);
  const shade=c.createLinearGradient(0,y,0,y+64);shade.addColorStop(0,'#4d36151c');shade.addColorStop(.12,'#ffffff0a');shade.addColorStop(.9,'#ffffff00');shade.addColorStop(1,'#3f2a151a');c.fillStyle=shade;c.fillRect(0,y,w,64);
  c.fillStyle='#72512e75';c.fillRect(0,y,512,1);const seam=(j%3)*160+64;c.fillRect(seam,y,1,64);
  for(let i=0;i<18;i++){c.strokeStyle=i%3?'#77543118':'#fbe3b729';c.lineWidth=.5;c.beginPath();const yy=y+3+i*3.3;c.moveTo(0,yy);c.bezierCurveTo(150,yy+Math.sin(i+j)*3,300,yy-Math.cos(i)*3,512,yy+1);c.stroke();}
  for(const x of [seam+6,seam-6]){c.fillStyle='#654b3455';c.fillRect(x,y+7,1,2);c.fillRect(x,y+55,1,2);}
 }
 });}
export function boardTexture(){return painted(1536,640,(c,w,h)=>{
 c.fillStyle='#214b43';c.fillRect(0,0,w,h);for(let i=0;i<140;i++){c.fillStyle=i%2?'#ffffff03':'#020f0c05';c.fillRect((i*139)%w,(i*71)%h,80+i%70,12);}c.fillStyle='#f3efcc';c.font='32px Georgia';c.fillText('Class 3-E',65,66);c.font='25px sans-serif';c.fillText('Assassination training',1080,65);c.strokeStyle='#83a699';c.lineWidth=2;c.beginPath();c.moveTo(60,90);c.lineTo(1470,90);c.stroke();
 c.font='70px Georgia';c.fillText('A good plan beats a fast trigger.',66,195);c.font='34px sans-serif';
 ['Observe his attention.','Create an opening together.','Follow through. Then learn.'].forEach((s,i)=>{c.fillStyle='#f2df92';c.fillText(`${i+1}.`,85,290+i*86);c.fillStyle='#e8edda';c.fillText(s,140,290+i*86);});
 c.strokeStyle='#f6dd67';c.lineWidth=5;c.beginPath();c.arc(1240,365,112,0,Math.PI*2);c.stroke();c.fillStyle='#f6dd67';c.beginPath();c.arc(1205,340,5,0,7);c.arc(1275,340,5,0,7);c.fill();c.beginPath();c.arc(1240,364,72,.15,Math.PI-.15);c.stroke();c.font='24px Georgia';c.fillText('You have potential.',1120,530);
 });}
export function faceTexture(kind){return painted(512,512,(c)=>{
 c.lineCap='round';c.lineJoin='round';
 if(kind==='koro'){
  c.fillStyle='#36322a';for(const x of [139,373]){c.beginPath();c.ellipse(x,154,4,6,0,0,7);c.fill();}
  c.beginPath();c.moveTo(37,241);c.bezierCurveTo(70,338,435,338,475,241);c.bezierCurveTo(462,412,62,412,37,241);c.fillStyle='#fffcef';c.fill();c.strokeStyle='#463b29';c.lineWidth=4;c.stroke();
  c.save();c.clip();c.lineWidth=2;for(let x=70;x<470;x+=34){c.beginPath();c.moveTo(x,293);c.lineTo(x+(x-256)*.04,397);c.stroke();}c.restore();
 }else{
  const karma=kind==='karma';const eye=karma?'#bc855c':kind==='kaede'?'#bc9235':'#538cb5';
  for(const side of [-1,1]){const x=256+side*105;c.fillStyle='#fffefa';c.beginPath();c.moveTo(x-66,210);c.quadraticCurveTo(x,karma?191:157,x+62,210);c.quadraticCurveTo(x+35,karma?277:302,x-56,270);c.closePath();c.fill();
   c.fillStyle=eye;c.beginPath();c.ellipse(x+4,235,27,karma?36:48,0,0,7);c.fill();c.fillStyle='#283645';c.beginPath();c.ellipse(x+4,239,12,31,0,0,7);c.fill();c.fillStyle='white';c.beginPath();c.ellipse(x-5,219,10,14,0,0,7);c.fill();
   c.strokeStyle='#3c343b';c.lineWidth=9;c.beginPath();c.moveTo(x-65,211);c.quadraticCurveTo(x,karma?190:157,x+62,210);c.stroke();c.lineWidth=5;c.beginPath();c.moveTo(x-56,karma?161:137);c.lineTo(x+50,karma?152:144);c.stroke();
  }
  c.strokeStyle='#bb8877';c.lineWidth=4;c.beginPath();c.moveTo(254,275);c.lineTo(249,300);c.lineTo(261,303);c.stroke();c.strokeStyle='#684d4b';c.lineWidth=5;c.beginPath();c.moveTo(222,353);c.quadraticCurveTo(257,karma?371:358,293,karma?342:353);c.stroke();
 }
 });}
export function posterTexture(){return painted(256,512,c=>{c.fillStyle='#f5eed4';c.fillRect(0,0,256,512);c.strokeStyle='#7d3932';c.lineWidth=5;c.strokeRect(14,14,228,484);c.fillStyle='#384c40';c.textAlign='center';c.font='36px Georgia';['Learn.','Observe.','Adapt.'].forEach((s,i)=>c.fillText(s,128,100+i*110));c.font='20px sans-serif';c.fillText('CLASS 3-E',128,455);});}
