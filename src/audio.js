import {synthesize,recipes} from './audio-design.js';
export class Sound {
 constructor(){this.ctx=null;this.sound=.55;this.music=.12;this.clock=0;this.beat=0;this.ambient=0;this.variation=0;this.duckUntil=0;this.bank={};}
 start(){
  if(!this.ctx){const c=this.ctx=new AudioContext();this.master=c.createDynamicsCompressor();this.master.threshold.value=-15;this.master.knee.value=12;this.master.ratio.value=5;this.master.attack.value=.003;this.master.release.value=.18;this.master.connect(c.destination);
   this.fx=c.createGain();this.fx.connect(this.master);this.musicGain=c.createGain();this.musicGain.connect(this.master);
   this.reverb=c.createConvolver();const ir=c.createBuffer(2,c.sampleRate*.34,c.sampleRate);for(let ch=0;ch<2;ch++){const a=ir.getChannelData(ch);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.exp(-i/a.length*9)*.13;}this.reverb.buffer=ir;const wet=c.createGain();wet.gain.value=.12;this.reverb.connect(wet);wet.connect(this.fx);
   for(const name of Object.keys(recipes))this.bank[name]=[1,21,41,61].map(seed=>{const samples=synthesize(name,seed);const b=c.createBuffer(1,samples.length,24000);b.copyToChannel(samples,0);return b;});
  }this.ctx.resume();this.levels(this.sound,this.music);
 }
 levels(fx,music){this.sound=fx;this.music=music;if(this.ctx){this.fx.gain.setTargetAtTime(fx,this.ctx.currentTime,.03);this.musicGain.gain.setTargetAtTime(music,this.ctx.currentTime,.1);}}
 play(name,{gain=.5,pan=0,distance=0,delay=0,rate=1,outdoor=false}={}){
  if(!this.ctx||!this.bank[name])return;const c=this.ctx,src=c.createBufferSource(),g=c.createGain(),p=c.createStereoPanner(),filter=c.createBiquadFilter();src.buffer=this.bank[name][this.variation++%4];src.playbackRate.value=rate;filter.type='lowpass';filter.frequency.value=Math.max(1600,15000-distance*650);g.gain.value=gain/(1+distance*.12);p.pan.value=Math.max(-1,Math.min(1,pan));src.connect(filter);filter.connect(g);g.connect(p);p.connect(this.fx);if(!outdoor)p.connect(this.reverb);src.start(c.currentTime+delay);src.onended=()=>{src.disconnect();filter.disconnect();g.disconnect();p.disconnect();};
 }
 position(e,s){if(e.x===undefined)return {};const dx=e.x-s.player.x,dz=e.z-s.player.z,d=Math.hypot(dx,dz);return {pan:(dx*Math.cos(s.player.yaw)-dz*Math.sin(s.player.yaw))/Math.max(2,d),distance:d,outdoor:e.x>11};}
 event(e,s){const pos=this.position(e,s),play=(n,g=.5,delay=0)=>this.play(n,{...pos,gain:g,delay});
  switch(e.type){
   case 'footstep':play(e.surface==='ground'?'ground':'wood',e.quiet?.12:e.ally?.3:e.sprint?.46:.3);if(e.sprint)play('cloth',.14,.03);break;
   case 'land':play(e.surface==='ground'?'ground':'wood',.6);play('cloth',.25);break;
   case 'cloth':case 'equip':play('cloth',.3);play('click',.15,.06);break;
   case 'attack':play(e.tool===2?'slash':'pistol',e.tool===2?.65:.58);if(e.tool===1)play('click',.25,.055);break;
   case 'scenery':play(e.surface==='wood'?'impact':e.surface==='ground'?'ground':'plaster',.38);break;
   case 'reload':play('reload',.5);play('cloth',.2,.28);break;
   case 'reloadDone':play('click',.36);break;
   case 'empty':play('click',.18);break;
   case 'intercept':play('tentacle',.8);play('click',.3,.04);break;
   case 'telegraph':play('tension',.9);play('cloth',.5,.35);this.duckUntil=this.ctx?.currentTime+1.8;break;
   case 'dash':case 'dodge':play('dash',.85);break;
   case 'arrival':play('arrival',.7);play('tentacle',.3,.05);break;
   case 'place':play('net',.4);break;
   case 'retrieve':play('rustle',.4);break;
   case 'trapArmed':play('spring',.3);break;
   case 'trapSeen':play('tentacle',.24);break;
   case 'trapTrigger':play('net',.8);play('spring',.65,.05);this.duckUntil=this.ctx?.currentTime+1;break;
   case 'trapEscape':play('rustle',.55);play('tentacle',.5,.08);break;
   case 'command':play('confirm',.24);break;
   case 'prepare':play(e.who==='karma'?'reload':'rustle',.45);break;
   case 'ability':play(e.who==='karma'?'pistol':'cloth',.55);play(e.who==='karma'?'pistol':'rustle',.4,.21);break;
   case 'abilityEnd':play('cloth',.22);break;
   case 'hit':play('hit',.8);play('spring',.35,.08);this.duckUntil=this.ctx?.currentTime+1;break;
   case 'tag':play('tag',.8);play('cloth',.6,.04);this.duckUntil=this.ctx?.currentTime+1;break;
   case 'countdown':play('tick',e.seconds===60?.3:.45);break;
   case 'finish':(e.won?[60,64,67,72]:[60,59,55]).forEach((n,i)=>this.pluck(n,.5,i*.16,false));break;
  }
 }
 pluck(note,gain=.15,delay=0,music=true){if(!this.ctx)return;const c=this.ctx,f=440*2**((note-69)/12),b=c.createBuffer(1,c.sampleRate*1.4,c.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++){const t=i/c.sampleRate;a[i]=(Math.sin(2*Math.PI*f*t)+.3*Math.sin(2*Math.PI*f*2*t)*Math.exp(-t*12)+.12*Math.sin(2*Math.PI*f*3.01*t)*Math.exp(-t*18))*Math.exp(-t*5)*Math.min(1,t*250)*.5;}const src=c.createBufferSource(),g=c.createGain();src.buffer=b;g.gain.value=gain;src.connect(g);g.connect(music?this.musicGain:this.fx);src.start(c.currentTime+delay);src.onended=()=>{src.disconnect();g.disconnect();};}
 update(dt,s){if(!this.ctx)return;this.clock+=dt;this.ambient+=dt;const pressure=['windup','tag','travel'].includes(s?.koro.state),c=this.ctx;this.musicGain.gain.setTargetAtTime(this.music*(c.currentTime<this.duckUntil?.28:1),c.currentTime,.15);
  if(this.clock>(pressure?.32:.48)){this.clock=0;const notes=[64,0,67,71,0,67,62,0,64,0,69,67,0,62,59,0],n=notes[this.beat++%16];if(n)this.pluck(n,.22);if(this.beat%4===0)this.pluck(pressure?45:48,.15);}
  if(this.ambient>3.1){this.ambient=0;const outdoor=s?.player.x>11;this.play('leaves',{gain:outdoor?.12:.045,pan:.65,outdoor:true});if(this.beat%3===0)this.play(outdoor?'bird':'creak',{gain:.045,pan:-.6,outdoor});}
 }
}
