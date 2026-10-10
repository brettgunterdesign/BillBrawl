import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,update,botInput,buildNavigation,startRound,BOT_DIFFICULTIES,WEAPONS} from '../dist/engine.js';

function practice(difficulty='easy',weapon='pistol'){
 const s=createState('practice',{difficulty});s.phase='playing';
 s.map={...s.map,width:640,height:360,platforms:[{x:0,y:320,w:640,h:40,oneWay:false}],objects:[],hazards:[]};
 s.navigation=buildNavigation(s.map);s.items=[];
 s.players.forEach((p,id)=>Object.assign(p,{x:100+id*200,y:298,vx:0,vy:0,ground:true,invulnerable:1000}));
 Object.assign(s.players[1],{weapon,ammo:1000});return s;
}
function tick(s){
 s.players.forEach((p,id)=>Object.assign(p,{x:100+id*200,y:298,vx:0,vy:0,ground:true}));
 s.events=[];update(s,[]);const shots=s.events.filter(e=>e.type==='shot'&&e.id===1);s.bullets=[];s.fields=[];
 return shots;
}
test('practice defaults to Easy, validates settings, and retains the choice between rounds',()=>{
 assert.equal(createState('practice').difficulty,'easy');
 assert.equal(createState('practice',{difficulty:'unknown'}).difficulty,'easy');
 assert.equal(createState('practice',{difficulty:'toString'}).difficulty,'easy');
 for(const difficulty of Object.keys(BOT_DIFFICULTIES)){const s=practice(difficulty);startRound(s);assert.equal(s.difficulty,difficulty);assert.equal(s.players[1].brain.aimKey,undefined);}
});
test('all settings give reaction time and increasingly frequent pistol fire',()=>{
 const counts=[];
 for(const [difficulty,profile] of Object.entries(BOT_DIFFICULTIES)){
  const s=practice(difficulty);let first=null,shots=0;
  for(let n=0;n<600;n++){const events=tick(s);if(events.length&&first===null)first=s.time;shots+=events.length;}
  assert.ok(first>=profile.reaction,`${difficulty} fired too soon`);assert.ok(first<profile.reaction+.06,`${difficulty} did not fire after reacting`);counts.push(shots);
 }
 assert.ok(counts[0]<counts[1]&&counts[1]<counts[2]&&counts[2]<counts[3],JSON.stringify(counts));
});
test('losing sight forces a fresh reaction before the next attack',()=>{
 const s=practice('easy'),p=s.players[1];
 assert.equal(botInput(s,p,1/60).fire,false);s.time=.9;assert.equal(botInput(s,p,1/60).fire,true);
 s.map.platforms.push({x:200,y:260,w:10,h:60,oneWay:false});s._terrainCache=null;s.time=1;
 assert.equal(botInput(s,p,1/60).fire,false);
 s.map.platforms.pop();s._terrainCache=null;s.time=3;
 assert.equal(botInput(s,p,1/60).fire,false);s.time=3.7;assert.equal(botInput(s,p,1/60).fire,false);s.time=3.81;assert.equal(botInput(s,p,1/60).fire,true);
});
test('miniguns and plasma respect reaction and recovery on every setting',()=>{
 for(const difficulty of Object.keys(BOT_DIFFICULTIES))for(const weapon of ['minigun','plasma']){
  const profile=BOT_DIFFICULTIES[difficulty],s=practice(difficulty,weapon);let first=null,shots=0,gap=false,last=null;
  for(let n=0;n<600;n++){const events=tick(s);if(events.length){first??=s.time;shots+=events.length;if(last!==null&&s.time-last>=profile.pause-.04)gap=true;last=s.time;}}
  assert.ok(first>=profile.reaction+(WEAPONS[weapon].spinup||WEAPONS[weapon].charge)-.02,`${difficulty} ${weapon} bypassed reaction/spin-up`);
  assert.ok(shots>1&&gap,`${difficulty} ${weapon} failed to fire repeatedly with recovery pauses`);
 }
});
test('breaking cover cannot bypass reaction or firing pauses',()=>{
 const s=practice('beginner'),p=s.players[1];s.map.platforms.push({x:270,y:260,w:10,h:60,oneWay:false,hp:1000});s._terrainCache=null;
 assert.equal(botInput(s,p,1/60).fire,false);s.time=1.19;assert.equal(botInput(s,p,1/60).fire,false);s.time=1.21;assert.equal(botInput(s,p,1/60).fire,true);s.time=1.3;assert.equal(botInput(s,p,1/60).fire,false);s.time=2.9;assert.equal(botInput(s,p,1/60).fire,true);
});
test('Beginner and Easy do not auto-dodge; Normal and Hard respect dodge cooldowns',()=>{
 for(const difficulty of Object.keys(BOT_DIFFICULTIES)){
  const s=practice(difficulty),p=s.players[1];p.brain.lastX=p.x;
  s.bullets=[{owner:0,x:p.x-45,y:p.y+10,vx:900,vy:0}];
  const dodge=botInput(s,p,1/60).jump;assert.equal(dodge,['normal','hard'].includes(difficulty),difficulty);
  if(dodge){p.brain.jumpHeld=0;s.time=.05;assert.equal(botInput(s,p,1/60).jump,false,difficulty+' dodged again immediately');}
 }
});
test('imperfect bot aim leaves human and multiplayer weapon trajectories unchanged',()=>{
 const random=Math.random;Math.random=()=>.9;
 try{
  for(const difficulty of Object.keys(BOT_DIFFICULTIES)){
   const s=practice(difficulty);let shot;
   for(let n=0;n<120&&!shot;n++){s.players.forEach((p,id)=>Object.assign(p,{x:100+id*200,y:298,vx:0,vy:0,ground:true}));update(s,[]);shot=s.bullets.find(b=>b.owner===1);}
   assert.ok(shot,difficulty);assert.equal(shot.vy,WEAPONS.pistol.speed*.8*BOT_DIFFICULTIES[difficulty].aimSpread);
  }
  for(const mode of ['duel','practice','zombie']){
   const s=practice('beginner');s.mode=mode;Object.assign(s.players[0],{weapon:'pistol',ammo:10});update(s,[{fire:true}]);assert.equal(s.bullets.find(b=>b.owner===0).vy,0,mode+' changed human aim');
  }
 }finally{Math.random=random;}
});
