/* Simulation uses a 480 Ãƒâ€” 640 playfield. Rendered artwork may extend outside it. */
const W=480,H=640,MAX_HP=73000,FIRE_INTERVAL=.0575;
const QUEENS=['Queen of Autumn','Queen of Ice','Queen of Storms'];
class KirinGame {
 constructor(){this.reset();}
 reset(){this.state='title';this.points=0;this.orbs=[];this.index=0;this.lives=5;this.time=0;this.shots=[];this.bullets=[];this.player={x:240,y:552,r:3.2,inv:0};this.boss={x:240,y:104,r:31,hp:MAX_HP,flash:0};this.phase=0;this.phaseTime=0;this.clearTime=0;this.firing=0;this.tick=0;this.volley=0;this.pause=false;this.hitEvent=0;this.shotEvent=0;}
 advance(){if(this.state==='title'){this.state='dialogue';return;}if(this.state==='dialogue'){this.startBoss();return;}if(this.state==='won'||this.state==='lost')this.reset();}
 startBoss(){this.state='fight';this.drops=0;this.orbs=[];this.phase=0;this.phaseTime=0;this.clearTime=1.2;this.tick=0;this.volley=0;this.firing=0;this.shots=[];this.bullets=[];this.player.x=240;this.player.y=552;this.player.inv=1.5;this.boss={x:240,y:104,r:31,hp:MAX_HP,flash:0};}
 shot(x,y,angle,speed,kind=0,extra={}){this.bullets.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:3.6,age:0,kind,...extra});}
 fan(angle,count,spread,speed,kind=0){for(let i=0;i<count;i++)this.shot(this.boss.x,this.boss.y+20,angle+(i-(count-1)/2)*spread,speed,kind,{seed:i*.9});}
 aimed(){return Math.atan2(this.player.y-this.boss.y,this.player.x-this.boss.x);}
 pattern(){let t=this.phaseTime,q=this.index,p=this.phase;
  // The middle phase alternates two patterns; the final phase showcases the third.
  if(p===1)p=Math.floor(t/7)%2;
  const n=this.volley++;
  if(q===0){
   if(p===0){this.fan(Math.PI/2,11,.145,95,1);return 1.05;}
   if(p===1){if(n%24<20)for(let j=0;j<2;j++)this.fan(n*.21+j*Math.PI,1,0,112,0);return .12;}
   this.fan(this.aimed(),5,.115,150,0);if(n%2===0)this.fan(Math.PI/2,7,.25,82,1);return 1.15;
  }
  if(q===1){
   if(p===0){for(let j=0;j<6;j++)for(let k=0;k<3;k++)this.shot(this.boss.x,this.boss.y, n*.13+j*Math.PI/3,95+k*17,2);return .85;}
   // Six branching arms: each arm opens into a crystalline fan.
   if(p===1){for(let j=0;j<6;j++)for(let k=-2;k<=2;k++){const a=n*.17+j*Math.PI/3;this.shot(this.boss.x+Math.cos(a)*35,this.boss.y+Math.sin(a)*35,a+k*.14,120+Math.abs(k)*13,2);}return .65;}
   // Nested counter-rotating snowflakes, with sixfold symmetry at every speed.
   for(let j=0;j<6;j++)for(let k=0;k<5;k++){
    this.shot(this.boss.x,this.boss.y,j*Math.PI/3+n*.19+k*.045,92+k*15,2);
    this.shot(this.boss.x,this.boss.y,j*Math.PI/3-n*.19-k*.045,113+k*15,2);
   }return .8;
  }
  if(p===0){const a=Math.PI/2+Math.sin(t*.72)*1.02;this.fan(a,3,.105,142,4);this.fan(Math.PI-a,3,.105,142,4);return .25;}
  // Quick aimed lightning salvos with a pause between groups; no redundant marker.
  if(p===1){if(n%6<3)this.fan(this.aimed(),5,.075,340+(n%3)*35,4);return .24;}
  // Interleaved spiral arms create a moving lattice; aimed shots prevent camping.
  for(let j=0;j<8;j++)for(let k=0;k<2;k++){
   const a=j*Math.PI/4+n*.145;
   this.shot(this.boss.x,this.boss.y,a+k*.065,155+k*24,4);
   this.shot(this.boss.x,this.boss.y,-a+k*.065,125+k*24,4);
  }
  if(n%8===0)this.fan(this.aimed(),3,.13,255,4);return .32;
 }
 update(dt,input={}){
  if(this.pause||this.state!=='fight')return;
  this.time+=dt;const p=this.player,b=this.boss;p.inv=Math.max(0,p.inv-dt);b.flash=Math.max(0,b.flash-dt);
  let dx=(input.right?1:0)-(input.left?1:0),dy=(input.down?1:0)-(input.up?1:0),len=Math.hypot(dx,dy),speed=input.focus?125:250;
  if(len){p.x+=dx/len*speed*dt;p.y+=dy/len*speed*dt;}p.x=Math.max(12,Math.min(468,p.x));p.y=Math.max(24,Math.min(618,p.y));
  b.x=240+Math.sin(this.time*.48)*105;b.y=104+Math.sin(this.time*.7)*12;
  this.firing-=dt;
  if(input.fire){while(this.firing<=0){for(let i=0;i<7;i++){let a=-Math.PI/2+(input.focus?0:(i-3)*Math.PI/108);this.shots.push({x:p.x+(i-3)*1.4,y:p.y-18,vx:Math.cos(a)*1020,vy:Math.sin(a)*1020,damage:10+5*Math.max(0,Math.min(1,(448-Math.hypot(p.x-b.x,p.y-b.y))/384)),color:i});}this.firing+=FIRE_INTERVAL;this.shotEvent++;}}else this.firing=0;
  for(const s of this.shots){let ox=s.x,oy=s.y;s.x+=s.vx*dt;s.y+=s.vy*dt;let vx=s.x-ox,vy=s.y-oy,k=Math.max(0,Math.min(1,((b.x-ox)*vx+(b.y-oy)*vy)/(vx*vx+vy*vy||1)));if(Math.hypot(ox+k*vx-b.x,oy+k*vy-b.y)<b.r+2){b.hp=Math.max(0,b.hp-s.damage);if(!b.flash)b.flash=.28;s.dead=true;}}
  this.shots=this.shots.filter(s=>!s.dead&&s.y>-30&&s.x>-30&&s.x<510);
  while(this.drops<20&&b.hp<=MAX_HP*(19-this.drops)/20){this.drops++;this.orbs.push({x:b.x,y:b.y});}
  if(b.hp<=0){this.state='defeated';this.clearTime=1.5;this.bullets=[];this.shots=[];return;}
  const phase=Math.min(2,Math.floor((1-b.hp/MAX_HP)*3));
  if(phase>this.phase){this.phase=phase;this.phaseTime=0;this.tick=0;this.volley=0;this.clearTime=1.1;this.bullets=[];}
  if(this.clearTime>0){this.clearTime-=dt;return;}
  this.phaseTime+=dt;this.tick-=dt;if(this.tick<=0)this.tick+=this.pattern();
  if(!p.inv&&Math.hypot(b.x-p.x,b.y-p.y)<b.r+p.r)this.shot(p.x,p.y,0,0);
  for(const s of this.bullets){s.age+=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;if(s.kind===1)s.x+=Math.cos(s.age*2.7+s.seed)*22*dt;
   if(!p.inv&&Math.hypot(s.x-p.x,s.y-p.y)<s.r+p.r){this.lives--;p.inv=2;this.hitEvent++;for(const near of this.bullets)if(Math.hypot(near.x-p.x,near.y-p.y)<90)near.dead=true;if(!this.lives){this.state='lost';return;}}
  }
  this.bullets=this.bullets.filter(s=>!s.dead&&s.age<14&&s.x>-100&&s.x<580&&s.y>-120&&s.y<690);
 }
 transition(dt){
  if(this.pause)return;
  if(this.state==='fight'||this.state==='defeated'){
   for(const o of this.orbs){const dx=this.player.x-o.x,dy=this.player.y-o.y,d=Math.hypot(dx,dy);
    if(this.state==='defeated'){const k=Math.min(1,600*dt/(d||1));o.x+=dx*k;o.y+=dy*k;}else o.y+=90*dt;
    if(Math.hypot(this.player.x-o.x,this.player.y-o.y)<28){this.points++;o.dead=true;}
   }
   this.orbs=this.orbs.filter(o=>!o.dead&&o.y<670);
  }
  if(this.state==='defeated'&&(this.clearTime-=dt)<=0&&!this.orbs.length){if(++this.index===3)this.state='won';else this.state='dialogue';}
 }
}
if(typeof module!=='undefined')module.exports={KirinGame,W,H,MAX_HP,FIRE_INTERVAL};
