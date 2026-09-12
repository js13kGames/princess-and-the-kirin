// Procedural samples are generated once. All tails wrap into the loop buffer.
// Tuning: piano partials/decay, kick sweep, snare noise, and mix gains below.
function renderMusic(rate){
 const beat=60/156,step=beat/4,out=new Float32Array(Math.round(beat*16*rate));
 function note(at,pitch,duration,velocity,drum=0){
  let f=440*2**((pitch-69)/12),length=drum?.32:duration+.24,noise=0;
  for(let i=0;i<length*rate;i++){
   const t=i/rate,a=Math.min(1,t/.003),phase=2*Math.PI*f*t;
   let v;
   // Soft saturation before the envelope adds harmonics, strongest below C4.
   if(!drum)v=Math.tanh((Math.sin(phase)+.38*Math.sin(phase*2)*Math.exp(-t*12)+.16*Math.sin(phase*3)*Math.exp(-t*20))*(pitch<60?1.8:1.1))*Math.exp(-t*3)*Math.exp(-Math.max(0,t-duration)*25)*.19;
   else if(pitch===36)v=Math.sin(2*Math.PI*(48*t+4*(1-Math.exp(-t*35))))*Math.exp(-t*18)*.48;
   else {const n=Math.random()*2-1;v=((n-noise)*.18+Math.sin(t*1131)*.1)*Math.exp(-t*23);noise=n;}
   out[(Math.round(at*rate)+i)%out.length]+=v*a*velocity/127*Math.min(1,(length-t)/.01);
  }
 }
 for(const [at,pitch,duration,velocity] of SCORE)note(at*step,pitch,duration*step,velocity);
 for(let repeat=0;repeat<8;repeat++)for(const [at,pitch,duration,velocity] of DRUMS)note((repeat*8+at)*step,pitch,duration*step,velocity,1);
 return out;
}
let musicGain;
function startMusic(){
 const data=renderMusic(audio.sampleRate),buffer=audio.createBuffer(1,data.length,audio.sampleRate),source=audio.createBufferSource();
 buffer.getChannelData(0).set(data);source.buffer=buffer;source.loop=true;
 musicGain=audio.createGain();musicGain.gain.value=0;source.connect(musicGain).connect(audio.destination);source.start();
}
function musicVolume(){if(musicGain)musicGain.gain.setTargetAtTime(mute||sim.pause||document.hidden?0:.7,audio.currentTime,.025);}
