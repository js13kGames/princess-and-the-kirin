const canvas=document.getElementById('game'),ctx=canvas.getContext('2d'),sim=new KirinGame(),keys={};
const rainbow=['#ff5279','#ffa047','#ffe878','#8bf084','#66def0','#8291ff','#d782ff'];
const themes=['autumn','winter','spring'],tints=[['#6a3c98','#a34f3e'],['#6a3c98','#527d9d']],bossImages=[],portraits=[];
const image=s=>{let i=new Image();i.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);return i;};
// Pre-render sway poses from shared SVG groups; no duplicate art in the ZIP.
function animated(s,boss=false){return Array.from({length:24},(_,i)=>image(s.replace(/id="(hair|tail|skirt)"/g,(_,part)=>`transform="rotate(${Math.sin(i*Math.PI/12)*(boss?2:5)*(part==='hair'?-1:1)} ${boss?57:64} ${boss?(part==='skirt'?100:34):(part==='tail'?120:80)})"`)));}
const reducedMotion=matchMedia('(prefers-reduced-motion:reduce)').matches;
function themed(s,n){const map=n===0?{'#6a3c98':'#a34f3e','#af8dc3':'#dfab72','#261934':'#392334'}:n===1?{'#6a3c98':'#527d9d','#af8dc3':'#adcddc','#261934':'#25304c'}:{};for(const a in map)s=s.split(a).join(map[a]);return s;}
for(let n=0;n<3;n++){
 let icon=ART.decals[themes[n]];
 bossImages.push(animated(themed(ART.boss.replace('</svg>',icon+'</svg>'),n),true));
 // Portrait symbol shares the sprite decal and is scaled into the staff ring.
 icon=icon.replace('x="95"','x="622"').replace('y="24"','y="122"').replace('width="20"','width="160"').replace('height="22"','height="180"');
 portraits.push(image(themed(ART.portrait.replace('</svg>',icon+'</svg>'),n)));
}
const playerImage=animated(ART.player),princessImage=image(ART.princess);
const $=id=>document.getElementById(id);$('princess').src=princessImage.src;
let audio,mute=false,last=0,displayState='',lastHit=0,lastShot=0,lastPoint=0;
function tone(f,d=.07,type='sine',volume=.035,ratio=.65,delay=0){if(mute||!audio)return;let o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+delay;o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*ratio,t+d);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+d);}
function unlock(){if(!audio)try{audio=new(window.AudioContext||window.webkitAudioContext)();startMusic();}catch{}if(audio?.state==='suspended')audio.resume();}
$('sound').onclick=()=>{unlock();mute=!mute;musicVolume();$('sound').textContent=mute?'Sound off':'Sound on';};
function advance(){unlock();if(sim.pause){sim.pause=false;return;}sim.advance();}
$('continue').onclick=advance;
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','ShiftLeft','ShiftRight','KeyZ','Enter','Escape','KeyR'].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.repeat)return;if(e.code==='Escape'&&['fight','defeated'].includes(sim.state))sim.pause=!sim.pause;else if(e.code==='KeyR'&&['lost','won'].includes(sim.state)){sim.reset();sim.advance();}else if((e.code==='Enter'||e.code==='KeyZ')&&sim.state!=='fight'&&sim.state!=='defeated')advance();else if(e.code==='KeyZ')unlock();});
addEventListener('keyup',e=>keys[e.code]=false);
function blur(){for(const k in keys)keys[k]=false;if(sim.state==='fight'||sim.state==='defeated')sim.pause=true;musicVolume();}
addEventListener('blur',blur);document.addEventListener('visibilitychange',()=>{if(document.hidden)blur();});
function menu(){let state=sim.pause?'pause':sim.state,key=state+sim.index;if(displayState===key)return;displayState=key;document.body.classList.toggle('playing',state==='fight'||state==='defeated');if(state==='fight'||state==='defeated')return;
 $('princess').style.display=state==='pause'||state==='lost'?'none':'';$('queen').style.display=state==='dialogue'?'':'none';$('queen').src=portraits[Math.min(sim.index,2)].src;
 let title='Princess and the Kirin',eyebrow='KIRIN',description='The Princess and the Kirin seek sunshine and rainbows. Three queens stand in their way.',line='ARROWS move · Hold Z to shoot · SHIFT slows movement and focuses all seven rainbow shots.',button='Begin journey';
 if(state==='dialogue'){title=QUEENS[sim.index];eyebrow=`BOSS ${sim.index+1} / 3`;description=['The sky turns gray. Summer is over.','Frost envelopes the land.','Thunder rattles the sky.'][sim.index];line=["Queen of Autumn: The season of sunshine and rainbows is over.\nPrincess: I will bring it back!","Princess: I promise I will bring back sunshine and rainbows.\nQueen of Ice: It's time to chill.","Queen of Storms: This tempest will never end.\nPrincess: Not if I can help it."][sim.index];button='Begin battle';}
 if(state==='pause'){title='Paused';description='Take a breath. The storm can wait.';line='Press Escape or select Resume.';button='Resume';}
 if(state==='lost'){title='Game Over';description='Darkness remains.';line='Press R to try again';button='Menu';}
 if(state==='won'){title='Summer returns';description='Rays of sunlight pierce the clouds. A rainbow appears.';line=`All three queens defeated · ${sim.lives} ${sim.lives===1?'life':'lives'} remaining`;button='Menu';}
 if(state==='lost'||state==='won')line+=' · Points '+sim.points;
 $('title').textContent=title;$('eyebrow').textContent=eyebrow;$('description').textContent=description;$('line').textContent=line;$('continue').textContent=button;
}
// Cached translucent cloud tiles: only the offsets change each frame.
let seed=917;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const clouds=[0,1,2].map(layer=>{let c=document.createElement('canvas');c.width=480;c.height=360;let x=c.getContext('2d');for(let j=0;j<28;j++){let px=rand()*480,py=rand()*360,r=40+rand()*90;for(let tx=-1;tx<=1;tx++)for(let ty=-1;ty<=1;ty++){let g=x.createRadialGradient(px+tx*480,py+ty*360,0,px+tx*480,py+ty*360,r);g.addColorStop(0,['#4b435c35','#52526830','#55536c28'][layer]);g.addColorStop(1,'#25233700');x.fillStyle=g;x.fillRect(px+tx*480-r,py+ty*360-r,r*2,r*2);}}return c;});
function background(t){ctx.fillStyle=sim.state==='won'?'#41657a':'#171526';ctx.fillRect(0,0,W,H);clouds.forEach((c,i)=>{let y=t*(7+i*6)%360;for(let j=-1;j<2;j++)ctx.drawImage(c,0,y+j*360);});if(sim.state==='won'){ctx.globalAlpha=.35;rainbow.forEach((c,i)=>{ctx.strokeStyle=c;ctx.lineWidth=12;ctx.beginPath();ctx.arc(240,550,320+i*12,Math.PI,Math.PI*2);ctx.stroke();});ctx.globalAlpha=1;}}
function sprite(i,x,y,w,h){if(i.complete&&i.naturalWidth)ctx.drawImage(i,x,y,w,h);}
function draw(t){background(t);if(!['fight','defeated'].includes(sim.state))return;
 const b=sim.boss,p=sim.player,pose=reducedMotion?0:Math.floor(sim.time*5)%24;
 for(const s of sim.shots){ctx.strokeStyle=rainbow[s.color];ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x-s.vx*.009,s.y-s.vy*.009);ctx.stroke();}
 if(sim.state==='fight'){ctx.save();ctx.filter=b.flash>.21?'brightness(1.25) saturate(.85)':'none';sprite(bossImages[sim.index][pose],b.x-57*.7,b.y-83*.7,128*.7,112);ctx.restore();}
 if(!p.inv||Math.floor(t*12)%2){sprite(playerImage[pose],p.x-64*.4,p.y-73*.4,51.2,64);}
 if(keys.ShiftLeft||keys.ShiftRight){ctx.strokeStyle='#fff4b5';ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.stroke();}
 for(const o of sim.orbs){const r=6+Math.sin(t*6)*1.2,g=ctx.createRadialGradient(o.x-2,o.y-2,0,o.x,o.y,r);g.addColorStop(0,'white');g.addColorStop(.4,'#e7f1ff');g.addColorStop(1,'#78879b');ctx.fillStyle=g;ctx.strokeStyle='#eff8ff';ctx.lineWidth=1;ctx.beginPath();ctx.arc(o.x,o.y,r,0,7);ctx.fill();ctx.stroke();}
 for(const s of sim.bullets){let col=sim.index===0?(s.kind===1?'#eeb266':'#f0db86'):sim.index===1?'#b8ecff':'#e3b5ff';ctx.fillStyle=col;ctx.strokeStyle='#211c38';ctx.lineWidth=1;ctx.beginPath();if(s.kind===1){ctx.ellipse(s.x,s.y,3.96,6,s.age*.8,0,7);}else if(s.kind===2){for(let j=0;j<6;j++){const a=j*Math.PI/3;ctx.lineTo(s.x+Math.cos(a)*6,s.y+Math.sin(a)*6);}ctx.closePath();}else ctx.arc(s.x,s.y,4.44,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#fff8e9';ctx.fillRect(s.x-1,s.y-1,1.5,1.5);}
 ctx.fillStyle='#111025d9';ctx.fillRect(0,0,480,47);ctx.fillStyle='#d6c5e4';ctx.font='12px system-ui';ctx.textAlign='left';ctx.fillText(QUEENS[sim.index],12,18);ctx.textAlign='right';ctx.fillStyle='#ffe2a3';ctx.fillText('LIVES '+sim.lives,468,18);ctx.fillStyle='#42374f';ctx.fillRect(12,27,456,5);ctx.fillStyle=['#d0a06c','#a3d9e9','#caa5ef'][sim.index];ctx.fillRect(12,27,456*b.hp/MAX_HP,5);ctx.fillStyle='#b3a8c5';ctx.font='10px system-ui';ctx.textAlign='right';ctx.fillText(Math.ceil(b.hp).toLocaleString()+' HP',468,43);
 if(sim.state==='defeated'){ctx.textAlign='center';ctx.fillStyle='#efe2bd';ctx.font='20px Georgia';ctx.fillText('A glimmer of hope',240,230);}
}
function frame(ms){let dt=Math.min(.033,(ms-last)/1000||0);last=ms;const input={left:keys.ArrowLeft,right:keys.ArrowRight,up:keys.ArrowUp,down:keys.ArrowDown,focus:keys.ShiftLeft||keys.ShiftRight,fire:keys.KeyZ};
 // Small simulation steps keep fast projectiles and collisions consistent.
 if(!sim.pause){let left=dt;while(left>0){let step=Math.min(left,1/120);sim.update(step,input);sim.transition(step);left-=step;}}
 if(sim.points!==lastPoint){if(sim.points>lastPoint){tone(1047,.075,'sine',.06,1);tone(1568,.16,'sine',.05,1,.065);}lastPoint=sim.points;}
 if(sim.hitEvent!==lastHit){lastHit=sim.hitEvent;tone(120,.3,'triangle',.12);}if(sim.shotEvent!==lastShot){lastShot=sim.shotEvent;if(lastShot%4===0)tone(660,.025,'sine',.012);}musicVolume();menu();draw(ms/1000);requestAnimationFrame(frame);}
// Read-only diagnostics for browser QA.
window.Kirin={snapshot:()=>({state:sim.state,boss:sim.index,hp:sim.boss.hp,phase:sim.phase,lives:sim.lives,bullets:sim.bullets.length,shots:sim.shots.length,paused:sim.pause,player:{...sim.player}})};
menu();requestAnimationFrame(frame);
