import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,predictPlayer,update,MAPS} from '../dist/engine.js';
import {collisionTerrain,treePlatforms,breakTerrain} from '../dist/terrain.js';
const forest=()=>{const s=createState();s.phase='playing';s.map={...s.map,width:640,height:360,tideDelay:1000,platforms:[{x:0,y:320,w:640,h:40,oneWay:false,material:'stone'}],objects:[{type:'tree',x:200,y:220,w:20,h:100,hp:180,solid:false,material:'wood'}],hazards:[]};s._terrainCache=null;s.items=[];Object.assign(s.players[0],{x:170,y:298,ground:true,vx:0,vy:0});return s;};
test('players walk through trunks, jump onto branches, and drop through foliage',()=>{
 const s=forest(),p=s.players[0];for(let n=0;n<45;n++)predictPlayer(s,p,{right:true});assert.ok(p.x>230);assert.equal(p.y,298);
 Object.assign(p,{x:200,y:298,vx:0,vy:0,ground:true,previous:{}});let landed=false;for(let n=0;n<130;n++){predictPlayer(s,p,{jump:true});landed ||=p.ground&&p.y+p.h===270;}assert.ok(landed);
 predictPlayer(s,p,{});predictPlayer(s,p,{down:true,jump:true});assert.ok(p.y+p.h>270);for(let n=0;n<30;n++)predictPlayer(s,p,{});assert.equal(p.y+p.h,320);
});
test('destroying a branch destroys its owning tree and removes every landing surface',()=>{
 const s=forest(),tree=s.map.objects[0],branch=collisionTerrain(s).find(b=>b.source===tree);assert.equal(treePlatforms(tree).length,2);
 assert.ok(breakTerrain(s,branch,200,0));assert.equal(tree.destroyed,true);assert.equal(collisionTerrain(s).length,1);assert.doesNotThrow(()=>JSON.stringify(s.map));
});
test('every door belongs to a furnished room with two entrances and an interior weapon',()=>{
 let total=0;for(const map of MAPS){const doors=map.objects.filter(o=>o.type==='door');total+=doors.length;for(const d of doors){const room=map.rooms[d.room];assert.ok(room);assert.equal(doors.filter(o=>o.room===d.room).length,2);assert.equal(d.y+d.h,map.height-40);assert.ok(map.items.some(([x,y,type])=>x>room.x+10&&x<room.x+room.w-10&&y>=room.y&&type===room.stash));}}
 assert.ok(total>=30);
});
test('nearby room loot takes priority over an open door for an unarmed player',()=>{
 const s=forest(),p=s.players[0];s.map.objects=[{type:'door',x:230,y:272,w:10,h:48,solid:true,open:true,hp:85}];p.x=200;s._terrainCache=null;s.items=[{x:200,y:311,w:16,h:9,lock:0,type:'pistol',ammo:12,vx:0,vy:0}];update(s,[{grab:true}]);assert.equal(p.weapon,'pistol');assert.equal(s.map.objects[0].open,true);
});
