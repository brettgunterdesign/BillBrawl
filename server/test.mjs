import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {WebSocket} from 'ws';
import {createRoomServer} from './index.mjs';
import {killPlayer} from '../dist/engine.js';

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
async function start(f){f.host.send({type:'ready',ready:true});f.guest.send({type:'ready',ready:true});await flush();f.host.send({type:'start'});await f.host.take('state');}
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
 for(let seq=1;seq<=8;seq++)f.host.send({type:'input',seq,input:{right:true,jump:seq===3}});await flush();steps(f,3);assert.equal(f.room.members[0].appliedSequence,3);assert.equal(f.room.state.players[0].previous.jump,true);
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
 const health=await (await fetch(base+'/health')).json();assert.deepEqual(health,{ok:true,protocol:1,arenas:21,rooms:0});assert.equal((await fetch(base+'/server/index.mjs')).status,404);assert.equal((await fetch(base+'/.openai/hosting.json')).status,404);assert.equal((await fetch(base+'/game.js')).headers.get('Content-Type'),'text/javascript');
});
