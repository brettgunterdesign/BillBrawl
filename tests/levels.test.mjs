import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,update,predictPlayer,MAPS} from '../dist/engine.js';
import {auditArena} from '../scripts/audit-levels.mjs';

test('both Rooftop Rumble floor spawns can jump directly onto their first balcony',()=>{
 for(const slot of [0,1]){
  const s=createState('duel',{arena:1});s.phase='playing';let climbed=false;
  for(let tick=0;tick<130;tick++){update(s,s.players.map((_,id)=>({jump:id===slot&&tick>=25})));const p=s.players[slot];climbed ||=p.alive&&p.ground&&p.y+p.h===440;}
  assert.ok(climbed,`P${slot+1} remained trapped below the balcony`);
 }
});
test('held jump clears an 80-pixel ledge, tap jump stays lower, and flutter remains controlled',()=>{
 const rise=hold=>{const s=createState();s.phase='playing';s.map.platforms=[{x:0,y:320,w:640,h:40,oneWay:false}];s.map.objects=[];s.map.hazards=[];s._terrainCache=null;const p=s.players[0];Object.assign(p,{x:100,y:298,ground:true});let top=p.y,fall=0;for(let tick=0;tick<120;tick++){predictPlayer(s,p,{jump:tick<hold});top=Math.min(top,p.y);if(tick<hold)fall=Math.max(fall,p.vy);}assert.ok(p.ground);return {rise:298-top,fall};};
 const held=rise(120),tap=rise(1);assert.ok(held.rise>80&&held.rise<85);assert.ok(tap.rise<held.rise/2);assert.ok(held.fall<=115);
});
test('the audit rejects a clear spawn inside a sealed courtyard',()=>{
 const floor={x:0,y:320,w:640,h:40,oneWay:false};
 const map={width:640,height:360,spawn:[[200,286],[500,286]],platforms:[floor,{x:150,y:200,w:20,h:120,oneWay:false},{x:300,y:200,w:20,h:120,oneWay:false}],objects:[],hazards:[]};
 const report=auditArena(0,{map});assert.ok(report.failures.some(f=>f.type==='trap'&&f.x>170&&f.x<300),JSON.stringify(report));
});
test('the audit can escape a crouch-only tunnel and use a closed door',()=>{
 const map={width:640,height:360,spawn:[[80,286],[550,286]],platforms:[{x:0,y:320,w:640,h:40,oneWay:false},{x:200,y:260,w:70,h:44,oneWay:false}],objects:[{type:'door',x:380,y:272,w:10,h:48,solid:true,hp:85,open:false}],hazards:[]};
 const report=auditArena(0,{map});assert.deepEqual(report.failures,[],JSON.stringify(report));
});

for(const [label,options] of [
 ['intact PvP arenas',{}],['intact survival arenas',{zombie:true}],
 ['fragile platforms destroyed',{variant:'platforms'}],
 ['fragile platforms and short cover destroyed, tall obstacles intact',{variant:'cover'}],
 ['all breakable terrain destroyed',{variant:'destroyed'}],
 ['survival with platforms and short cover destroyed',{zombie:true,variant:'cover'}]
])test(`all 21 ${label} have usable spawns and escape routes`,()=>{
 for(let arena=0;arena<MAPS.length;arena++){
  const report=auditArena(arena,options);assert.deepEqual(report.failures,[],`${report.name}: ${JSON.stringify(report.failures)}`);
 }
});
