export const DESKS = [-5,-2.5,2.5,5].flatMap(x=>[-3,0,3,6].map(z=>({x,z})));
export const dist = (a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
export function rayBox(o,d,b,max=100) {
 let lo=0,hi=max;
 for(const axis of ['x','y','z']) {
  if(Math.abs(d[axis])<1e-8) { if(o[axis]<b[axis+'0']||o[axis]>b[axis+'1']) return max; }
  else {let a=(b[axis+'0']-o[axis])/d[axis],c=(b[axis+'1']-o[axis])/d[axis];if(a>c)[a,c]=[c,a];lo=Math.max(lo,a);hi=Math.min(hi,c);if(hi<lo)return max;}
 } return lo;
}
export class World {
 constructor(){
  this.solids=[];
  const box=(x,z,w,d,h=4,y=0,kind='wall')=>this.solids.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,y0:y,y1:y+h,kind});
  box(-8, -1,.3,18);box(0,-10,16,.3);box(0,8,16,.3);
  // Two open sliding doorways: [-7.5,-4.5] and [3.5,6.5].
  box(8,-8.75,.3,2.5);box(8,-.5,.3,8);box(8,7.25,.3,1.5);
  for(const {x,z} of DESKS){box(x,z,1.48,.89,.94,0,'desk');box(x,z+.85,.65,.65,.98,0,'chair');}
  for(const z of [-9.6,-1,7.6])box(10.9,z,.18,.18,3.8,0,'post');
  box(-4.8,-8,2.4,.95,.9,0,'teacher');
  box(-7.55,6.7,.6,1.8,1.8,0,'cabinet');
  // The whole local encounter is bounded by a low timber fence.
  box(21.5,-1,.25,18,1.15,0,'fence');box(14.7,-10,13.5,.25,1.15,0,'fence');box(14.7,8,13.5,.25,1.15,0,'fence');
  this.navCache=new Map();
 }
 free(x,z,r=.3){
  if(x < -7.8+r || x > 21.3-r || z < -9.8+r || z > 7.8-r) return false;
  return !this.solids.some(b=>{const px=clamp(x,b.x0,b.x1),pz=clamp(z,b.z0,b.z1);return Math.hypot(px-x,pz-z)<r;});
 }
 move(p,dx,dz,r=.3){
  const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12));
  for(let i=0;i<n;i++){if(this.free(p.x+dx/n,p.z,r))p.x+=dx/n;if(this.free(p.x,p.z+dz/n,r))p.z+=dz/n;}
 }
 raycast(o,d,max=100){let near=max;for(const b of this.solids) near=Math.min(near,rayBox(o,d,b,near));return near;}
 raycastHit(o,d,max=100){let distance=max,kind='air';for(const b of this.solids){const near=rayBox(o,d,b,distance);if(near<distance){distance=near;kind=['desk','chair','teacher','fence','cabinet','post'].includes(b.kind)?'wood':'plaster';}}if(Math.abs(d.y)>1e-8){for(const y of [0,4.25]){const t=(y-o.y)/d.y,x=o.x+d.x*t,z=o.z+d.z*t;if(t>0&&t<distance&&x>=-8&&x<=21.3&&z>=-10&&z<=8&&(y===0||x<11)){distance=t;kind=y===0&&x>11?'ground':'wood';}}}return {distance,kind};}
 clear(a,b,height=1.5){const length=dist(a,b);if(length<.01)return true;return this.raycast({x:a.x,y:height,z:a.z},{x:(b.x-a.x)/length,y:0,z:(b.z-a.z)/length},length)>=length-.02;}
 segmentFree(a,b,r=.42,avoid=[]){const d=dist(a,b);for(let i=0;i<=Math.ceil(d/.18);i++){const t=d<.01?0:Math.min(1,i*.18/d),p={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};if(!this.free(p.x,p.z,r)||avoid.some(n=>dist(n,p)<1.15))return false;}return this.free(b.x,b.z,r)&&!avoid.some(n=>dist(n,b)<1.15);}
 nearest(p,r=.44,avoid=[]){const ok=q=>this.free(q.x,q.z,r)&&!avoid.some(n=>dist(n,q)<1.15);if(ok(p))return {...p};for(let rad=.4;rad<8;rad+=.4)for(let i=0;i<20;i++){const a=i*Math.PI/10,q={x:p.x+Math.cos(a)*rad,z:p.z+Math.sin(a)*rad};if(ok(q))return q;}return {x:0,z:-7};}
 path(from,to,r=.44,avoid=[]){
  const goal=this.nearest(to,r,avoid); if(this.segmentFree(from,goal,r,avoid))return [goal];
  const key=p=>`${Math.round(p.x*2)},${Math.round(p.z*2)}`;
  const start=this.nearest({x:Math.round(from.x*2)/2,z:Math.round(from.z*2)/2},r,avoid);
  const finish=this.nearest({x:Math.round(goal.x*2)/2,z:Math.round(goal.z*2)/2},r,avoid);
  const nodes=[{...start,g:0,f:dist(start,finish),key:key(start),parent:null}],visited=new Map();visited.set(nodes[0].key,nodes[0]);
  let end=null,iterations=0;
  while(nodes.length&&iterations++<5000){
   nodes.sort((a,b)=>b.f-a.f);const cur=nodes.pop();if(dist(cur,finish)<.4){end=cur;break;}
   for(const [dx,dz]of [[.5,0],[-.5,0],[0,.5],[0,-.5],[.5,.5],[.5,-.5],[-.5,.5],[-.5,-.5]]){
    const p={x:cur.x+dx,z:cur.z+dz},k=key(p),g=cur.g+Math.hypot(dx,dz);
    if(!this.free(p.x,p.z,r)||!this.segmentFree(cur,p,r,avoid)||visited.has(k)&&visited.get(k).g<=g)continue;
    const n={...p,key:k,g,f:g+dist(p,finish),parent:cur};visited.set(k,n);nodes.push(n);
   }
  }
  if(!end)return [];
  const raw=[goal];while(end){raw.unshift({x:end.x,z:end.z});end=end.parent;}
  const result=[];let p=from;for(let i=0;i<raw.length;){let j=i;while(j+1<raw.length&&this.segmentFree(p,raw[j+1],r,avoid))j++;result.push(raw[j]);p=raw[j];i=j+1;}return result;
 }
}
