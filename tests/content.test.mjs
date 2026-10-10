import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,update,MAPS,WEAPONS,startRound} from '../dist/engine.js';
import {collisionTerrain,addField} from '../dist/terrain.js';
const input={};
function arena(mode='duel'){
 const s=createState(mode,{players:2});s.phase='playing';s.remaining=1;s.spawnClock=1000;
 s.map={...s.map,width:640,height:360,tideDelay:1000,platforms:[{x:0,y:320,w:640,h:40,oneWay:false,material:'stone'}],objects:[],hazards:[]};
 s._terrainCache=null;s.navigation={nodes:s.map.platforms.map((b,id)=>({...b,id})),edges:[[]]};s.items=[];
 s.players.forEach((p,id)=>Object.assign(p,{x:id?540:70,y:298,ground:true,vx:0,vy:0}));return s;
}
function ticks(s,count,inputs=[]){for(let n=0;n<count;n++)update(s,inputs);}
const enemy=(id,x,hp=500)=>({id,x,y:298,w:16,h:22,vx:0,vy:0,dir:-1,alive:true,ground:true,hp,maxHp:hp,kind:'shambler',speed:0,attack:100,flash:0,previous:{},brain:{jumpHeld:0,jumpRest:0,lastX:x,stuck:0}});
test('21 distinct layouts stock all 22 weapons and varied materials with clear starts',()=>{
 assert.equal(MAPS.length,21);assert.equal(new Set(MAPS.map(m=>m.name)).size,21);
 assert.equal(new Set(MAPS.map(m=>JSON.stringify(m.platforms))).size,21);
 assert.deepEqual(new Set(MAPS.flatMap(m=>m.items.map(i=>i[2]))),new Set(Object.keys(WEAPONS)));
 assert.ok(new Set(MAPS.flatMap(m=>m.platforms.map(p=>p.material))).size>=12);
 for(let i=0;i<21;i++)for(const mode of ['party','zombie']){
  const s=createState(mode,{players:4,arena:i});
  for(const p of s.players)assert.ok(!collisionTerrain(s).filter(b=>!b.oneWay).some(b=>p.x<b.x+b.w&&p.x+p.w>b.x&&p.y<b.y+b.h&&p.y+p.h>b.y),MAPS[i].name+' blocked spawn');
 }
});
test('a door blocks movement, opens with grab while armed, and never closes on a body',()=>{
 const s=arena(),p=s.players[0];p.x=220;p.weapon='pistol';p.ammo=12;
 s.map.objects=[{type:'door',x:260,y:272,w:10,h:48,solid:true,hp:85,open:false}];
 ticks(s,30,[{right:true}]);assert.equal(p.x,244);
 update(s,[{grab:true}]);assert.equal(s.map.objects[0].open,true);assert.equal(p.weapon,'pistol');
 ticks(s,8,[{right:true}]);update(s,[{grab:true}]);assert.equal(s.map.objects[0].open,true);
});
test('bullets chip and destroy cover without altering the shared arena catalog',()=>{
 const s=arena(),p=s.players[0];p.weapon='pistol';p.ammo=12;
 s.map.objects=[{type:'crate',x:160,y:294,w:26,h:26,solid:true,hp:65,material:'wood'}];
 ticks(s,38,[{fire:true}]);assert.equal(s.map.objects[0].destroyed,true);assert.ok(!collisionTerrain(s).includes(s.map.objects[0]));
 const r=createState();r.map.objects[0].destroyed=true;startRound(r);assert.ok(MAPS.every(m=>m.objects.every(o=>!o.destroyed)));
});
test('explosions break glass and trigger each nearby barrel only once',()=>{
 const s=arena();s.map.objects=[240,310].map(x=>({type:'barrel',x,y:292,w:20,h:28,hp:32,solid:true,explosive:true}));
 s.map.platforms.push({x:285,y:265,w:8,h:55,hp:24,material:'glass',oneWay:false});
 s.grenades=[{x:245,y:300,w:6,h:6,vx:0,vy:0,fuse:.001,damage:135,radius:76,owner:0}];
 update(s,[]);assert.ok(s.map.objects.every(o=>o.destroyed));assert.equal(s.map.platforms[1].destroyed,true);assert.equal(s.events.filter(e=>e.type==='explosion').length,3);
});
test('spring pads launch players and ice changes stopping distance',()=>{
 const s=arena();s.map.hazards=[{type:'spring',x:65,y:314,w:26,h:6}];update(s,[]);assert.ok(s.players[0].vy<-500);
 const ice=arena(),stone=arena();ice.map.platforms[0].material='ice';
 for(const state of [ice,stone]){state.players[0].vx=160;ticks(state,12);}
 assert.ok(ice.players[0].x>stone.players[0].x+12);
});
test('flame leaves fire after the projectile expires; acid lasts longer and corrodes metal',()=>{
 const s=arena('zombie'),p=s.players[0];p.weapon='flamethrower';p.ammo=70;update(s,[{fire:true}]);ticks(s,35);
 assert.ok(s.fields.some(f=>f.kind==='fire'&&f.life>4));assert.equal(s.bullets.length,0);
 const acid=arena();acid.map.objects=[{type:'crate',x:200,y:294,w:26,h:26,solid:true,hp:65,material:'metal'}];
 addField(acid,'acid',210,291,0,12);assert.equal(acid.fields[0].life,8);ticks(acid,55);assert.equal(acid.map.objects[0].destroyed,true);
});
test('persistent effects hurt enemies but spare co-op teammates',()=>{
 const s=arena('zombie');s.players[1].x=200;s.enemies=[enemy(100,208)];addField(s,'fire',210,312,0,20);ticks(s,35);
 assert.equal(s.players[1].hp,100);assert.ok(s.enemies[0].hp<500);
});
test('minigun needs spin-up, plasma needs release, and burst ammo covers three timed shots',()=>{
 const mini=arena();mini.players[0].weapon='minigun';mini.players[0].ammo=100;ticks(mini,25,[{fire:true}]);assert.equal(mini.players[0].ammo,100);ticks(mini,10,[{fire:true}]);assert.ok(mini.players[0].ammo<100);
 const plasma=arena();plasma.players[0].weapon='plasma';plasma.players[0].ammo=6;ticks(plasma,55,[{fire:true}]);assert.equal(plasma.bullets.length,0);assert.equal(plasma.players[0].ammo,6);update(plasma,[{}]);assert.equal(plasma.players[0].ammo,5);assert.ok(plasma.bullets[0].radius>=80);
 const burst=arena();burst.players[0].weapon='burst';burst.players[0].ammo=27;ticks(burst,12,[{fire:true}]);assert.equal(burst.players[0].ammo,24);assert.equal(burst.events.filter(e=>e.type==='shot').length,3);
});
test('billerang returns to its owner and restores its single reusable shot',()=>{
 const s=arena();s.players[0].weapon='boomerang';s.players[0].ammo=1;update(s,[{fire:true}]);assert.equal(s.players[0].ammo,0);ticks(s,90);assert.equal(s.players[0].ammo,1);assert.ok(s.events.some(e=>e.type==='catch'));
});
test('frost needs two hits to eliminate a player',()=>{
 const s=arena();s.players[1].x=180;s.players[0].weapon='freeze';s.players[0].ammo=12;
 ticks(s,18,[{fire:true}]);assert.equal(s.players[1].alive,true);assert.ok(s.players[1].frozen>0);ticks(s,22,[{fire:true}]);assert.equal(s.players[1].alive,false);
});
test('tesla chains across nearby enemies but stops at solid walls',()=>{
 const s=arena('zombie');s.players[0].weapon='tesla';s.players[0].ammo=6;s.enemies=[enemy(100,180),enemy(101,250),enemy(102,320)];update(s,[{fire:true}]);assert.ok(s.enemies.every(e=>e.hp===430));
 const wall=arena('zombie');wall.players[0].weapon='tesla';wall.players[0].ammo=6;wall.map.platforms.push({x:140,y:270,w:10,h:50,oneWay:false});wall.enemies=[enemy(100,180)];update(wall,[{fire:true}]);assert.equal(wall.enemies[0].hp,500);
});
test('mines arm after landing, persist, and explode on proximity with self damage',()=>{
 const s=arena();s.players[0].weapon='mine';s.players[0].ammo=3;update(s,[{fire:true}]);ticks(s,70);assert.equal(s.traps.length,1);assert.ok(s.traps[0].life>23&&s.traps[0].arm<=0);
 s.players[1].x=s.traps[0].x+25;update(s,[]);assert.equal(s.traps.length,0);assert.ok(s.players.every(p=>!p.alive));
});
test('cluster shells create delayed bomblets, with destruction cleared at a new round',()=>{
 const s=arena();s.players[0].weapon='cluster';s.players[0].ammo=3;update(s,[{fire:true}]);ticks(s,59);assert.equal(s.grenades.length,4);assert.ok(s.grenades.every(g=>g.fuse>0));
 s.fields.push({kind:'acid',life:8});startRound(s);assert.equal(s.fields.length,0);assert.equal(s.traps.length,0);assert.equal(s.salvos.length,0);
});

test('conveyor carry stops at closed solid cover',()=>{
 const s=arena();s.map.platforms[0].belt=100;s.players[0].x=143;
 s.map.objects=[{type:'door',x:160,y:272,w:10,h:48,solid:true,open:false,hp:85}];
 ticks(s,20);assert.ok(s.players[0].x+s.players[0].w<=160);
});
