import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {WebSocket} from 'ws';
import {createRoomServer} from './index.mjs';
import {killPlayer} from '../dist/engine.js';

const until=async predicate=>{const end=Date.now()+3000;while(!predicate()){if(Date.now()>end)throw Error('Transport did not settle');await flush();}};
const flush=()=>new Promise(resolve=>setTimeout(resolve,15));
async function client(port,command){
 const ws=new WebSocket(`ws://127.0.0.1:${port}/ws`,{origin:'http://bill-brawl.test'}),messages=[];
 ws.on('error',()=>{});ws.on('message',bytes=>messages.push(JSON.parse(bytes.toString())));
 await once(ws,'open');
 const send=data=>ws.send(JSON.stringify(data));
 const take=async(type,predicate=()=>true)=>{const end=Date.now()+3000;while(Date.now()<end){const index=messages.findIndex(m=>m.type===type&&predicate(m));if(index>=0)return messages.splice(index,1)[0];await flush();}throw Error('Timed out waiting for '+type);};
 send(command);const joined=await take(command.expectError?'error':'joined');return {ws,send,take,joined,messages};
}
async function fixture(t,options={}){
 const server=createRoomServer({port:0,host:'127.0.0.1',allowedOrigins:['http://bill-brawl.test'],manualTick:true,...options});const address=await server.listen();t.after(()=>server.close());return {server,port:address.port};
}
async function pair(t){const f=await fixture(t),host=await client(f.port,{type:'create',name:'Host',species:'platypus'}),guest=await client(f.port,{type:'join',code:host.joined.code,name:'Guest',species:'toucan'});return {...f,host,guest,room:f.server.rooms.get(host.joined.code)};}
async function start(f){f.host.messages.splice(0);f.host.send({type:'ready',ready:true});f.guest.send({type:'ready',ready:true});await flush();f.host.send({type:'start'});await f.host.take('state');}
const steps=(f,count)=>{for(let n=0;n<count;n++)f.server.step();};

test('guest rooms share a ready lobby and the server owns movement, ack and scores',async t=>{
 const f=await pair(t);
 assert.match(f.host.joined.code,/^[A-Z2-9]{6}$/);assert.equal(f.room.members.length,2);
 f.guest.send({type:'arena',arena:20});await flush();assert.equal(f.room.arena,0);
 f.host.send({type:'start'});assert.equal((await f.host.take('error')).code,'NOT_READY');
 await start(f);steps(f,105);const x=f.room.state.players[0].x;
 f.host.send({type:'input',seq:1,input:{right:true,x:99999,hp:99999},playerId:1});await flush();steps(f,20);
 assert.ok(f.room.state.players[0].x>x+10);assert.equal(f.room.state.players[0].hp,100);assert.equal(f.room.state.players[1].x,f.room.state.map.spawn[1][0]);
 f.host.send({type:'input',seq:2,input:{left:true}});f.host.send({type:'input',seq:1,input:{right:true}});await flush();steps(f,3);
 const received=await f.host.take('state',m=>m.ack===2);assert.equal(received.you,0);assert.equal(received.state.players[0].previous.left,true);
 assert.ok(!JSON.stringify(received).includes(f.guest.joined.token));assert.ok(!JSON.stringify(received).includes(f.host.joined.token));
 for(let win=0;win<10;win++){const s=f.room.state;s.phase='playing';killPlayer(s,s.players[1]);f.server.step();if(win<9){steps(f,140);steps(f,100);}await flush();}
 assert.equal(f.room.state.phase,'match-over');assert.equal(f.room.state.scores[0],10);steps(f,250);assert.equal(f.room.state,null);assert.ok(f.room.members.every(m=>!m.ready));
 await f.guest.take('lobby',m=>m.caption.includes('takes the crown'));
});

test('two browser transports receive the same destruction and a guest can resume its seat',async t=>{
 const f=await pair(t);await start(f);steps(f,105);
 const s=f.room.state;s.map.platforms=[{x:0,y:320,w:640,h:40,oneWay:false}];s.map.objects=[{type:'crate',x:240,y:294,w:26,h:26,hp:65,material:'wood',solid:true}];s.map.hazards=[];s.items=[];
 Object.assign(s.players[0],{x:180,y:298,vx:0,vy:0,weapon:'pistol',ammo:12});Object.assign(s.players[1],{x:540,y:298,vx:0,vy:0});
 f.host.send({type:'input',seq:1,input:{fire:true}});await flush();steps(f,42);assert.equal(s.map.objects[0].destroyed,true);
 const a=await f.host.take('state',m=>m.state.map.objects[0]?.destroyed),b=await f.guest.take('state',m=>m.state.map.objects[0]?.destroyed);assert.deepEqual(a.state.map,b.state.map);
 f.guest.ws.close();await flush();assert.equal(f.room.members[1].ws,null);
 const resumed=await client(f.port,{type:'resume',code:f.guest.joined.code,token:f.guest.joined.token});assert.equal(resumed.joined.you,1);assert.equal((await resumed.take('state')).you,1);assert.equal(f.room.members.length,2);
 f.host.ws.close();await flush();f.room.members[0].disconnectedAt=Date.now()-31000;f.server.step();assert.equal(f.room.members.length,1);assert.equal(f.room.hostToken,f.guest.joined.token);assert.equal(f.room.state,null);
});

test('four seats are enforced, three-player matches work, and stale inputs release',async t=>{
 const f=await pair(t),third=await client(f.port,{type:'join',code:f.host.joined.code,name:'Third'}),fourth=await client(f.port,{type:'join',code:f.host.joined.code,name:'Fourth'});
 const rejected=await client(f.port,{type:'join',code:f.host.joined.code,expectError:true});assert.equal(rejected.joined.code,'FULL');
 fourth.send({type:'leave'});await flush();f.server.step();assert.equal(f.room.members.length,3);
 f.host.send({type:'ready',ready:true});f.guest.send({type:'ready',ready:true});third.send({type:'ready',ready:true});await flush();f.host.send({type:'start'});await f.host.take('state');assert.equal(f.room.state.count,3);assert.equal(f.room.state.players.length,3);
 steps(f,105);f.host.send({type:'input',seq:1,input:{right:true,fire:true}});await flush();f.room.members[0].lastInput=Date.now()-1000;f.server.step();assert.equal(f.room.state.players[0].previous.right,false);assert.equal(f.room.state.players[0].previous.fire,false);
});

test('input edges are queued and opening a menu immediately releases a held action',async t=>{
 const f=await pair(t);await start(f);steps(f,105);
 for(let seq=1;seq<=8;seq++)f.host.send({type:'input',seq,input:{right:true,jump:seq===3}});await until(()=>f.room.members[0].queue.length===8);steps(f,3);assert.equal(f.room.members[0].appliedSequence,3);assert.equal(f.room.state.players[0].previous.jump,true);
 f.host.send({type:'release',seq:9});await flush();assert.equal(f.room.members[0].queue.length,0);f.server.step();assert.equal(f.room.state.players[0].previous.right,false);assert.equal(f.room.members[0].appliedSequence,9);
});

test('wrong origins and forged resume tokens are rejected, rooms disappear after everyone leaves',async t=>{
 const f=await pair(t);
 for(const origin of ['https://untrusted.example','invalid origin']){const ws=new WebSocket(`ws://127.0.0.1:${f.port}/ws`,{origin});const [error]=await once(ws,'error');assert.match(error.message,/403/);}
 const impostor=await client(f.port,{type:'resume',code:f.host.joined.code,token:'invalid',expectError:true});assert.equal(impostor.joined.code,'EXPIRED');assert.equal(f.room.members.length,2);
 f.host.send({type:'leave'});f.guest.send({type:'leave'});await flush();f.server.step();assert.equal(f.server.rooms.size,0);
});

test('the deployment serves the game and health without exposing source or guest credentials',async t=>{
 const f=await fixture(t),base=`http://127.0.0.1:${f.port}`;const page=await fetch(base);assert.equal(page.status,200);assert.match(await page.text(),/name="bill-brawl-rooms" content="\/ws"/);
 const health=await (await fetch(base+'/health')).json();assert.deepEqual(health,{ok:true,protocol:1,modes:['versus','zombie'],arenas:21,rooms:0});assert.equal((await fetch(base+'/server/index.mjs')).status,404);assert.equal((await fetch(base+'/.openai/hosting.json')).status,404);assert.equal((await fetch(base+'/game.js')).headers.get('Content-Type'),'text/javascript');
});

async function survival(f){f.host.send({type:'mode',mode:'zombie'});await f.guest.take('lobby',m=>m.mode==='zombie');await start(f);steps(f,105);}
function flat(s){s.map.platforms=[{x:0,y:320,w:s.map.width,h:40,oneWay:false}];s.map.objects=[];s.map.hazards=[];s.items=[];s._terrainCache=null;s.remaining=10;s.spawnClock=999;for(const p of s.players)Object.assign(p,{x:120+p.id*25,y:298,vx:0,vy:0,ground:true});}

test('survival mode is host-selected, resets readiness and supports a solo ready room',async t=>{
 const f=await pair(t);assert.deepEqual(f.host.joined.modes,['versus','zombie']);
 f.guest.send({type:'mode',mode:'zombie'});assert.equal((await f.guest.take('error')).code,'HOST_ONLY');assert.equal(f.room.mode,'versus');
 f.host.send({type:'ready',ready:true});await flush();f.host.send({type:'mode',mode:'bogus'});assert.equal((await f.host.take('error')).code,'BAD_MODE');assert.equal(f.room.mode,'versus');
 await survival(f);assert.equal(f.room.state.zombie,true);assert.equal(f.room.state.count,2);assert.equal(f.room.state.remaining,12);
 const a=await f.guest.take('state',m=>m.state.zombie);assert.deepEqual(a.state.upgradeLevels,[{health:0,damage:0,speed:0},{health:0,damage:0,speed:0}]);assert.ok(a.state.players.every(p=>p.weapon==='pistol'&&p.hp===100));assert.ok(a.state.players.every(p=>!p.brain));
 const solo=await client(f.port,{type:'create'});solo.send({type:'mode',mode:'zombie'});await solo.take('lobby',m=>m.mode==='zombie');solo.send({type:'ready',ready:true});await flush();solo.send({type:'start'});assert.equal((await solo.take('state')).state.count,1);
 f.host.send({type:'mode',mode:'versus'});assert.equal((await f.host.take('error')).code,'IN_MATCH');
});

test('online teammates do not take friendly fire and holding grab revives through authoritative inputs',async t=>{
 const f=await pair(t);await survival(f);const s=f.room.state;flat(s);
 f.host.send({type:'input',seq:1,input:{fire:true}});await flush();steps(f,90);assert.equal(s.players[1].hp,100);assert.ok(s.players[0].ammo<12);
 killPlayer(s,s.players[1]);Object.assign(s.players[1],{x:145,y:298,vx:0,vy:0});f.host.send({type:'input',seq:2,input:{grab:true}});await flush();steps(f,123);
 assert.equal(s.players[1].alive,true);assert.equal(s.players[1].downed,false);assert.equal(s.players[1].hp,55);
 await flush();steps(f,3);await f.guest.take('state',m=>m.state.players[1].hp===55);assert.equal(s.players[0].points,0);
});

test('upgrades spend only the authenticated player points and host or timer advances the shared wave',async t=>{
 const f=await pair(t);await survival(f);const s=f.room.state;flat(s);s.phase='wave-break';s.timer=12;for(const p of s.players)p.points=800;
 f.guest.send({type:'upgrade',playerId:0,upgrade:'health',points:99999});await f.host.take('state',m=>m.state.upgradeLevels[1].health===1);
 assert.equal(s.players[0].points,800);assert.equal(s.players[1].points,550);assert.equal(s.players[1].maxHp,125);
 f.guest.send({type:'upgrade',upgrade:'constructor'});assert.equal((await f.guest.take('error')).code,'UPGRADE_DENIED');
 f.guest.send({type:'upgrade',upgrade:'damage'});await flush();assert.equal(s.players[1].points,200);assert.equal(s.players[1].damageScale,1.15);
 f.guest.send({type:'upgrade',upgrade:'damage'});assert.equal((await f.guest.take('error')).code,'UPGRADE_DENIED');assert.equal(s.players[1].points,200);
 f.guest.send({type:'next-wave'});assert.equal((await f.guest.take('error')).code,'HOST_ONLY');assert.equal(s.wave,1);
 f.host.send({type:'next-wave'});await f.guest.take('state',m=>m.state.wave===2);assert.equal(s.phase,'countdown');assert.equal(s.remaining,15);assert.equal(s.players[1].maxHp,125);
 f.guest.send({type:'upgrade',upgrade:'speed'});assert.equal((await f.guest.take('error')).code,'NO_UPGRADES');
 s.phase='wave-break';s.timer=.01;steps(f,1);assert.equal(s.wave,3);assert.equal(s.phase,'countdown');
});

test('expired survival seats cannot revive or respawn; the remaining player continues and hosts the run',async t=>{
 const f=await pair(t);await survival(f);flat(f.room.state);const s=f.room.state;
 s.players[1].points=600;s.players[1].hp=73;
 f.guest.ws.close();await flush();const resumed=await client(f.port,{type:'resume',code:f.guest.joined.code,token:f.guest.joined.token});const recovered=await resumed.take('state');assert.equal(recovered.state.players[1].hp,73);assert.equal(recovered.state.players[1].points,600);
 f.host.send({type:'leave'});await flush();steps(f,1);assert.equal(f.room.state,s);assert.equal(f.room.hostToken,f.guest.joined.token);assert.equal(s.players[0].departed,true);assert.equal(s.players[0].downed,false);
 s.remaining=0;s.enemies=[];steps(f,1);assert.equal(s.phase,'wave-break');assert.equal(s.players[0].points,0);assert.equal(s.players[1].points,750);
 resumed.send({type:'next-wave'});await resumed.take('state',m=>m.state.wave===2);assert.equal(s.remaining,11);assert.equal(s.players[0].alive,false);assert.equal(s.players[0].downed,false);
});

test('survival shares enemy snapshots, team wipe results and preserves mode for a fresh rematch',async t=>{
 const f=await pair(t);await survival(f);flat(f.room.state);const s=f.room.state;s.spawnClock=0;steps(f,3);
 const a=await f.host.take('state',m=>m.state.enemies.length>0),b=await f.guest.take('state',m=>m.tick===a.tick);assert.deepEqual(a.state.enemies,b.state.enemies);assert.ok(a.state.enemies.every(z=>!z.brain));
 killPlayer(s,s.players[0]);killPlayer(s,s.players[1]);steps(f,1);assert.equal(s.phase,'game-over');s.teamKills=7;steps(f,250);assert.equal(f.room.state,null);assert.equal(f.room.mode,'zombie');assert.ok(f.room.members.every(m=>!m.ready));
 await f.host.take('lobby',m=>m.caption.includes('7 team kills'));await start(f);assert.equal(f.room.state.wave,1);assert.equal(f.room.state.teamKills,0);assert.ok(f.room.state.players.every(p=>p.points===0));
});

test('four-player survival scales waves and resumes a non-contiguous seat without changing its upgrades',async t=>{
 const f=await pair(t),third=await client(f.port,{type:'join',code:f.host.joined.code}),fourth=await client(f.port,{type:'join',code:f.host.joined.code});
 f.host.send({type:'mode',mode:'zombie'});await fourth.take('lobby',m=>m.mode==='zombie');for(const c of [f.host,f.guest,third,fourth])c.send({type:'ready',ready:true});await flush();f.host.send({type:'start'});const a=await fourth.take('state');assert.equal(a.you,3);assert.equal(a.state.count,4);assert.equal(a.state.remaining,20);
 third.send({type:'leave'});await flush();steps(f,1);const s=f.room.state;assert.equal(s.players[2].departed,true);assert.equal(s.players[2].downed,false);assert.equal(f.room.members.length,3);
 s.phase='wave-break';s.timer=12;s.players[3].points=800;fourth.send({type:'upgrade',upgrade:'speed',playerId:2});await fourth.take('state',m=>m.state.upgradeLevels[3].speed===1);assert.equal(s.players[3].points,550);assert.equal(s.upgradeLevels[2].speed,0);
 f.host.send({type:'next-wave'});await fourth.take('state',m=>m.state.wave===2);assert.equal(s.remaining,19);assert.equal(s.players[2].alive,false);assert.equal(s.players[3].speedScale,1.05);
 fourth.ws.close();await flush();const resumed=await client(f.port,{type:'resume',code:f.host.joined.code,token:fourth.joined.token});assert.equal((await resumed.take('state')).you,3);assert.equal(s.players[3].points,550);
});
