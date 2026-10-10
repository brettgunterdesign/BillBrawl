import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {featuresFor,actionInput} from '../scripts/playtest/jev/features.mjs';
const observation={caseId:'fixture',camera:{x:0,y:0,width:640,height:360},state:{mode:'duel',phase:'playing',round:1,arena:0,wave:0,players:[{id:0,x:50,y:298,w:16,h:22,dir:1,alive:true,weapon:null,ammo:0},{id:1,x:560,y:298,w:16,h:22,alive:true}]},terrain:{width:1280,height:720,items:[{x:95,y:311,w:16,h:9,type:'pistol',ammo:12},{x:1000,y:500,w:16,h:9,type:'secret-offscreen',ammo:2}],enemies:[],objects:[],hazards:[],platforms:[{x:0,y:320,w:640,h:40,oneWay:false}]}};
test('Jev observations exclude offscreen pickups and private simulator state',()=>{
 const f=featuresFor(observation);assert.equal(f.pickups.length,1);assert.equal(f.goal.x,95);assert.ok(!JSON.stringify(f).includes('secret-offscreen'));assert.equal(f.self.id,0);
});
test('Jev action mapping rejects invented actions and releases edge-triggered controls',()=>{
 const f=featuresFor(observation);assert.throws(()=>actionInput('teleport',f,0));assert.equal(actionInput('jump_advance',f,0).jump,true);assert.equal(actionInput('jump_advance',f,2).jump,false);assert.equal(actionInput('interact',f,0).grab,true);assert.equal(actionInput('interact',f,1).grab,false);
});
test('the pinned JevHarness runtime validates and executes the real Bill Brawl pipeline offline',()=>{
 const code="import json; from auto_jev.spec import validate_spec; from auto_jev.providers import JevClient; from auto_jev.runtime import PipelineRuntime; s=validate_spec(json.load(open('scripts/playtest/jev/pipeline.json'))); r=PipelineRuntime(s,JevClient(mock=True,transport='typesafe')).run({'features':{'self':{'x':50,'y':298}}}); print(json.dumps(r['output']))";
 const result=spawnSync('.jev-runtime/venv/bin/python',['-c',code],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.deepEqual(JSON.parse(result.stdout),{action:'advance',concern:'none'});
});
test('the Jev bridge stops at its request budget and records complete mock decisions',()=>{
 const payload={id:1,episode:'fixture',features:featuresFor(observation)};
 const result=spawnSync('.jev-runtime/venv/bin/python',['scripts/playtest/jev/worker.py'],{encoding:'utf8',input:JSON.stringify(payload)+'\n'+JSON.stringify({...payload,id:2})+'\n',env:{...process.env,BILL_BRAWL_JEV_MODE:'mock',BILL_BRAWL_JEV_MAX_CALLS:'1'}});assert.equal(result.status,0,result.stderr);const [first,second]=result.stdout.trim().split('\n').map(JSON.parse);assert.equal(first.mode,'mock-wiring-only');assert.equal(first.stats.calls,1);assert.match(second.error.message,/budget/);
});
test('the reviewed Jev policy manifest matches the pipeline, adapter and game rules',async()=>{
 const {readFile}=await import('node:fs/promises'),{createHash}=await import('node:crypto'),lock=JSON.parse(await readFile('scripts/playtest/jev/policy-lock.json','utf8'));
 assert.equal(lock.jev_required_for_live,true);for(const [file,hash]of Object.entries(lock.files))assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),hash,file+' changed; review and refresh the policy manifest');
});
test('live Jev fails clearly before inference when its configured credential is absent',()=>{
 const env={...process.env,BILL_BRAWL_JEV_MODE:'live',BILL_BRAWL_JEV_TRANSPORT:'typesafe'};delete env.TYPESAFE_API_KEY;delete env.AI_GATEWAY_API_KEY;
 const result=spawnSync('.jev-runtime/venv/bin/python',['scripts/playtest/jev/worker.py'],{encoding:'utf8',env});assert.equal(result.status,2);assert.match(result.stderr,/Missing Jev provider key/);assert.equal(result.stdout,'');
});
