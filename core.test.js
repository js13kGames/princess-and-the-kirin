const assert=require('node:assert/strict');
const {KirinGame,MAX_HP,FIRE_INTERVAL}=require('./core.js');
function fight(){let g=new KirinGame();g.advance();g.advance();g.clearTime=0;return g;}
let g=fight();g.update(.001,{fire:true});assert.equal(g.shots.length,7);assert(g.shots.every(s=>Math.abs(s.damage-10)<.001));assert(Math.abs(Math.atan2(g.shots[6].vy,g.shots[6].vx)-Math.atan2(g.shots[0].vy,g.shots[0].vx)-Math.PI/18)<1e-8);
g=fight();g.update(.001,{fire:true,focus:true});assert(g.shots.every(s=>Math.abs(s.vx)<1e-8));
g=fight();let x=g.player.x;g.update(.1,{right:true});assert.equal(g.player.x-x,25);g=fight();x=g.player.x;g.update(.1,{right:true,focus:true});assert.equal(g.player.x-x,12.5);
g=fight();g.player.inv=0;g.shot(g.player.x,g.player.y,0,0);g.update(.001);assert.equal(g.lives,4);g.shot(g.player.x,g.player.y,0,0);g.update(.001);assert.equal(g.lives,4);
g=fight();g.boss.hp=MAX_HP*.6;g.update(.01);assert.equal(g.phase,1);assert(g.clearTime>0);assert.equal(g.bullets.length,0);
for(let boss=0;boss<3;boss++)for(let phase=0;phase<3;phase++){
 g=fight();g.index=boss;g.phase=phase;g.boss.hp=MAX_HP*(1-phase/3)-1;
 for(let i=0;i<60*120;i++){g.player.inv=10;g.update(1/120,{right:Math.sin(i/130)>.5,left:Math.sin(i/130)<-.5});assert(g.bullets.every(s=>Number.isFinite(s.x)&&Number.isFinite(s.y)));assert(g.bullets.length<700);}
 assert(g.volley>0);
}
g=fight();for(let boss=0;boss<3;boss++){g.boss.hp=0;g.update(.01);assert.equal(g.state,'defeated');assert.equal(g.bullets.length,0);g.transition(2);if(boss<2){assert.equal(g.state,'dialogue');g.advance();}}assert.equal(g.state,'won');
g=fight();g.lives=1;g.player.inv=0;g.shot(g.player.x,g.player.y,0,0);g.update(.001);assert.equal(g.state,'lost');
g=fight();g.pause=true;g.update(1,{fire:true,right:true});assert.equal(g.time,0);assert.equal(g.shots.length,0);
assert(Math.abs(MAX_HP/(70/FIRE_INTERVAL)-60)<.1);
console.log('PASS: spread, focused volleys, movement, damage/invulnerability, all nine 60-second pattern runs, phases, victory/loss, pause, HP target.');

// The enlarged collision boundary should register a graze that previously missed.
g=fight();g.player.inv=0;g.shot(g.player.x+6.7,g.player.y,0,0);g.update(.001);assert.equal(g.lives,4);
// Every Ice emission has a matching bullet after rotation by 60 degrees.
for(let phase=0;phase<3;phase++){
 g=fight();g.index=1;g.phase=phase;g.phaseTime=8;g.volley=3;g.pattern();
 const c=Math.cos(Math.PI/3),s=Math.sin(Math.PI/3);
 for(const b of g.bullets){const x=b.x-g.boss.x,y=b.y-g.boss.y;
  assert.equal(b.kind,2);assert.equal(b.r,3.6);
  assert(g.bullets.some(v=>Math.hypot(v.x-g.boss.x-(x*c-y*s),v.y-g.boss.y-(x*s+y*c))<1e-7&&Math.hypot(v.vx-(b.vx*c-b.vy*s),v.vy-(b.vx*s+b.vy*c))<1e-7));
 }
}
console.log('PASS: enlarged hit boundary and sixfold symmetry in every Ice pattern.');

// Every crossed HP threshold spawns exactly once, including a multi-threshold hit.
g=fight();g.boss.hp=MAX_HP*.9;g.update(.001);assert.equal(g.orbs.length,2);g.update(.001);assert.equal(g.orbs.length,2);
g.player.x=g.orbs[0].x+27;g.player.y=g.orbs[0].y;g.transition(.001);assert.equal(g.points,2);
g.boss.hp=0;g.update(.001);for(let i=0;i<240;i++)g.transition(1/120);assert.equal(g.points,20);assert.equal(g.state,'dialogue');g.startBoss();assert.equal(g.points,20);assert.equal(g.drops,0);
// Damage increases with proximity but cannot exceed 15 or fall below 10.
let damage=[];for(const y of [618,552,350,165]){g=fight();g.player.y=y;g.update(.001,{fire:true});damage.push(g.shots[0].damage);}assert.equal(damage[0],10);assert(damage[2]>damage[1]);assert.equal(damage[3],15);
// Hits during the cooldown do not extend the bright pulse.
g=fight();g.boss.flash=.2;g.shots=[{x:240,y:104,vx:0,vy:0,damage:10}];g.update(.01);assert(Math.abs(g.boss.flash-.19)<1e-8);
console.log('PASS: threshold orbs, generous pickup radius, defeat homing, score persistence, proximity damage, and flash cooldown.');
