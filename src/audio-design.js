// Original procedural foley. Each recipe combines a transient, resonating body and tail.
// Generated once, locally; no downloads, recorded voices or third-party audio.
export const recipes={
 wood:{d:.23,noise:.27,low:950,body:115,ring:310,decay:23},
 ground:{d:.24,noise:.7,low:2400,body:65,ring:0,decay:15},
 cloth:{d:.22,noise:.24,low:3700,body:0,ring:0,decay:12},
 pistol:{d:.2,noise:.8,low:7200,body:175,ring:850,decay:39},
 click:{d:.1,noise:.35,low:4600,body:680,ring:1500,decay:65},
 reload:{d:.58,noise:.25,low:2800,body:210,ring:580,decay:24,pulses:[0,.23,.46]},
 plaster:{d:.2,noise:.7,low:4800,body:270,ring:0,decay:28},
 impact:{d:.22,noise:.37,low:1900,body:145,ring:430,decay:26},
 slash:{d:.29,noise:.6,low:4100,body:0,ring:0,decay:10,swell:true},
 tentacle:{d:.28,noise:.16,low:1300,body:220,ring:380,decay:16,bend:-180},
 dash:{d:.48,noise:.8,low:2800,body:80,ring:0,decay:7,swell:true,bend:-50},
 arrival:{d:.36,noise:.45,low:1400,body:70,ring:190,decay:17},
 tension:{d:.8,noise:.12,low:900,body:190,ring:290,decay:5,bend:120,swell:true},
 net:{d:.46,noise:.56,low:3200,body:300,ring:620,decay:19,pulses:[0,.09,.19]},
 spring:{d:.38,noise:.12,low:2100,body:410,ring:830,decay:12,bend:-300},
 rustle:{d:.5,noise:.52,low:4200,body:0,ring:0,decay:13,pulses:[0,.18]},
 hit:{d:.65,noise:.32,low:2000,body:240,ring:960,decay:13,bend:160},
 tag:{d:.32,noise:.55,low:1800,body:95,ring:230,decay:19},
 tick:{d:.18,noise:.12,low:1400,body:520,ring:780,decay:30},
 ui:{d:.065,noise:.12,low:2500,body:490,ring:0,decay:60},
 confirm:{d:.22,noise:.08,low:2300,body:440,ring:880,decay:22,pulses:[0,.06]},
 leaves:{d:3,noise:.6,low:900,body:0,ring:0,decay:.6,swell:true},
 creak:{d:.7,noise:.08,low:500,body:145,ring:285,decay:5,bend:-55},
 bird:{d:.45,noise:.02,low:1800,body:1800,ring:0,decay:13,bend:1200,pulses:[0,.16]}
};
export function synthesize(name,seed=1,rate=24000){
 const r=recipes[name];if(!r)throw new Error(`Unknown sound ${name}`);
 const data=new Float32Array(Math.ceil(rate*r.d));let state=seed>>>0,low=0,phase=0;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296*2-1;};
 const variant=1+random()*.06,alpha=1-Math.exp(-2*Math.PI*r.low/rate);
 for(let i=0;i<data.length;i++){
  const t=i/rate;low+=(random()-low)*alpha;phase+=2*Math.PI*Math.max(25,(r.body+(r.bend||0)*t/r.d)*variant)/rate;
  let env=0;for(const offset of r.pulses||[0]){const age=t-offset;if(age>=0)env+=Math.min(1,age/.003)*Math.exp(-age*r.decay);}
  if(r.swell)env=Math.sin(Math.PI*t/r.d)**1.8;
  const body=r.body?Math.sin(phase)*.34:0,ring=r.ring?Math.sin(2*Math.PI*r.ring*variant*t)*.13*Math.exp(-t*18):0;
  data[i]=(low*r.noise+body+ring)*env*Math.min(1,(r.d-t)/.025);
 }
 let peak=0;for(const v of data)peak=Math.max(peak,Math.abs(v));if(peak>.8)for(let i=0;i<data.length;i++)data[i]*=.8/peak;
 return data;
}
