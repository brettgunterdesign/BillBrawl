import test from 'node:test';
import assert from 'node:assert/strict';
import {runScenario,scenarios} from '../scripts/playtest/run.mjs';
import {inspectState,stallTracker} from '../scripts/playtest/checks.mjs';
import {createState} from '../dist/engine.js';
const config={id:'regression',mode:'duel',arena:1};
test('seeded playthroughs repeat exactly, and recorded inputs replay the same state',()=>{
 const before=Math.random,a=runScenario(config,{seed:9,seconds:12,capture:true}),b=runScenario(config,{seed:9,seconds:12,capture:true});assert.deepEqual(a,b);assert.equal(Math.random,before);
 const replay=runScenario(config,{seed:9,seconds:12,inputs:a.inputs});assert.deepEqual(replay.final,a.final);assert.deepEqual(replay.metrics,a.metrics);
});
test('the harness catches injected numerical corruption and restores random state',()=>{
 const before=Math.random,r=runScenario(config,{seconds:2,fault:(s,tick)=>{if(tick===101)s.players[0].x=NaN;}});assert.equal(r.status,'failed');assert.ok(r.failures.some(f=>f.code==='non-finite-player'&&f.tick===101));assert.equal(Math.random,before);
});
test('solid overlaps are failures, one-way foliage is passable, and stalls are review findings',()=>{
 const s=createState();s.phase='playing';const p=s.players[0];s.map.objects=[];s.map.platforms=[{x:p.x,y:p.y,w:30,h:30,oneWay:false}];s._terrainCache=null;assert.ok(inspectState(s).some(i=>i.code==='body-inside-solid'));
 s.map.platforms[0].oneWay=true;s._terrainCache=null;assert.ok(!inspectState(s).some(i=>i.code==='body-inside-solid'));
 const track=stallTracker();assert.deepEqual(track(s,[{right:true}],0),[]);assert.equal(track(s,[{right:true}],361)[0].code,'possible-movement-stall');assert.deepEqual(track(s,[{right:true}],362),[]);
});
test('the playthrough matrix covers every arena, mode, bot difficulty and weapon',()=>{
 const all=scenarios();assert.equal(new Set(all.map(c=>c.id)).size,all.length);assert.equal(new Set(all.map(c=>c.arena)).size,21);assert.deepEqual(new Set(all.map(c=>c.mode)),new Set(['duel','party','practice','zombie']));assert.equal(new Set(all.filter(c=>c.mode==='practice').map(c=>c.difficulty)).size,4);assert.equal(new Set(all.filter(c=>c.weapon).map(c=>c.weapon)).size,22);
});
const {validateDecision,modelDecision}=await import('../scripts/playtest/driver.mjs');
test('AI driver accepts bounded input plans and rejects malformed controls and missing players',async()=>{
 assert.equal(validateDecision({inputs:[{right:true}],holdMs:200},1).inputs[0].jump,false);assert.throws(()=>validateDecision({inputs:[{teleport:true}]},1));assert.throws(()=>validateDecision({inputs:[]},1));assert.throws(()=>validateDecision({inputs:[{}],holdMs:9999},1));
 const observation={state:{players:[{id:0}]},screenshot:'data:image/png;base64,test'};let seen;
 const plan=await modelDecision({decide:async value=>{seen=value;return {inputs:[{jump:true}],notes:['Inspecting an exit.']};}},observation);assert.equal(seen,observation);assert.equal(plan.inputs[0].jump,true);
 await assert.rejects(modelDecision({decide:()=>new Promise(()=>{})},observation,10),/timed out/);
});
