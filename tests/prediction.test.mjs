import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,update,predictPlayer} from '../dist/engine.js';
const make=material=>{const s=createState('duel');s.phase='playing';s.map.platforms=[{x:0,y:320,w:640,h:40,oneWay:false,material}];s.map.objects=[];s.map.hazards=[];s.items=[];Object.assign(s.players[0],{x:100,y:298,vx:0,vy:0,ground:true});Object.assign(s.players[1],{x:550,y:298,ground:true});return s;};
test('predicted movement matches authoritative jumping, crouching, fluttering, ice and conveyors',()=>{
 for(const material of ['stone','ice','conveyor']){const server=make(material),client=structuredClone(server);for(let tick=0;tick<90;tick++){
  const input={right:tick<35,left:tick>70,jump:tick>=12&&tick<38,down:tick>=55&&tick<65};update(server,[input],1/60);predictPlayer(client,client.players[0],input);
  for(const key of ['x','y','vx','vy','h','dir','ground','coyote','buffer'])assert.equal(client.players[0][key],server.players[0][key],`${material} ${key} tick ${tick}`);
 }}
});
test('prediction cannot consume ammo, grab equipment, damage terrain or score eliminations',()=>{
 const s=make('stone'),p=s.players[0];p.weapon='rocket';p.ammo=5;s.map.objects=[{type:'crate',x:200,y:294,w:26,h:26,hp:65,solid:true}];s.items=[{x:100,y:298,w:16,h:9,type:'pistol'}];const before=JSON.stringify([s.scores,s.map.objects,s.items]);
 for(let n=0;n<30;n++)predictPlayer(s,p,{fire:true,grab:true,chirp:true});assert.equal(p.ammo,5);assert.equal(s.bullets.length,0);assert.equal(JSON.stringify([s.scores,s.map.objects,s.items]),before);
});
test('tree branch landing and dropping match the authoritative online simulation',()=>{
 const server=make('stone');server.map.objects=[{type:'tree',x:100,y:220,w:20,h:100,hp:180,solid:false,material:'wood'}];const client=structuredClone(server);
 let onBranch=false,returned=false;for(let tick=0;tick<180;tick++){
  const input={jump:tick<115||tick===125,down:tick===125};update(server,[input],1/60);predictPlayer(client,client.players[0],input);
  for(const key of ['x','y','vx','vy','h','ground'])assert.equal(client.players[0][key],server.players[0][key],`${key} tick ${tick}`);
  onBranch ||=server.players[0].ground&&server.players[0].y+server.players[0].h===270;
  if(tick>125)returned ||=server.players[0].ground&&server.players[0].y+server.players[0].h===320;
 }assert.ok(onBranch&&returned);
});
