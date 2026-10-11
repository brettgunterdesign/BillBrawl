import {createServer} from 'node:http';
import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {WebSocketServer,WebSocket} from 'ws';
import {createState,update,killPlayer,beginWave,buyUpgrade,MAPS} from '../dist/engine.js';
import {SPECIES} from '../dist/sprites.js';

const INPUT_KEYS=['left','right','jump','down','fire','grab','chirp','strafe'];
const ROOM_MODES=['versus','zombie'];
const ROOM_ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const roomCode=()=>[...randomBytes(6)].map(n=>ROOM_ALPHABET[n%ROOM_ALPHABET.length]).join('');
const cleanInput=input=>Object.fromEntries(INPUT_KEYS.map(key=>[key,input?.[key]===true]));
const send=(ws,message)=>{if(ws?.readyState!==WebSocket.OPEN)return;if(ws.bufferedAmount>1024*1024){ws.close(4009,'Connection too slow');return;}if(message.type!=='state'||ws.bufferedAmount<128*1024)ws.send(JSON.stringify(message));};
const snapshot=s=>Object.fromEntries(['mode','count','zombie','difficulty','scores','round','mapIndex','map','phase','timer','time','roundTime','players','items','bullets','grenades','particles','winner','shake','tide','wave','enemies','remaining','teamKills','upgradeLevels','fields','traps','effects','events'].map(key=>[key,['players','enemies'].includes(key)?s[key].map(({brain,...p})=>p):key==='particles'?s.particles.slice(-100):s[key]]));

export function createRoomServer({port=Number(process.env.PORT)||3001,host='0.0.0.0',allowedOrigins=(process.env.ALLOWED_ORIGINS||'https://bill-brawl.brettgunter18.chatgpt.site').split(','),reconnectMs=30000,maxRooms=32,manualTick=false}={}){
 const rooms=new Map();
 const root=fileURLToPath(new URL('../dist/',import.meta.url));
 const http=createServer(async(req,res)=>{
  if(req.url==='/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,protocol:1,modes:ROOM_MODES,arenas:MAPS.length,rooms:rooms.size}));}
  else{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname)),ext=extname(file);if(!file.startsWith(root)||!['.html','.js','.css'].includes(ext))throw Error('Not found');let body=await readFile(file);if(ext==='.html')body=body.toString().replace('<head>','<head><meta name="bill-brawl-rooms" content="/ws">');res.writeHead(200,{'Content-Type':ext==='.js'?'text/javascript':ext==='.css'?'text/css':'text/html','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:body);}catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}}
 });
 const wss=new WebSocketServer({noServer:true,maxPayload:4096,perMessageDeflate:{threshold:1024,zlibDeflateOptions:{level:3},serverNoContextTakeover:true}});
 http.on('upgrade',(req,socket,head)=>{
  let sameOrigin=false;try{const origin=new URL(req.headers.origin);sameOrigin=['https:','http:'].includes(origin.protocol)&&origin.host===req.headers.host;}catch{}
  if(req.url!=='/ws'||req.headers.origin&&!allowedOrigins.map(s=>s.trim()).includes(req.headers.origin)&&!sameOrigin){socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');socket.destroy();return;}
  wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));
 });
 const roster=room=>room.members.map(m=>({id:m.slot,name:m.name,species:m.species,ready:m.ready,connected:m.ws?.readyState===WebSocket.OPEN,host:m.token===room.hostToken}));
 const lobby=room=>{for(const m of room.members)send(m.ws,{type:'lobby',code:room.code,you:m.slot,arena:room.arena,mode:room.mode,modes:ROOM_MODES,players:roster(room),caption:room.caption||'',playing:!!room.state});};
 const fail=(ws,code,message)=>send(ws,{type:'error',code,message});
 const finish=(room,caption)=>{room.state=null;room.caption=caption;for(const m of room.members){m.ready=false;m.playerId=null;m.input={};m.queue=[];}lobby(room);};
 const broadcast=room=>{
  if(!room.state)return;const state=snapshot(room.state);
  for(const m of room.members)if(m.playerId!==null)send(m.ws,{type:'state',tick:room.tick,you:m.playerId,ack:m.appliedSequence,roster:room.state.players.map(p=>room.members.find(m=>m.playerId===p.id)?.species||'duck'),state});
  room.state.events=[];
 };
 wss.on('connection',ws=>{
  let room=null,member=null,windowStart=Date.now(),messages=0;
  const authenticate=setTimeout(()=>{if(!member)ws.close(4000,'Join a room first');},5000);authenticate.unref();
  ws.on('error',()=>{});
  ws.isAlive=true;ws.on('pong',()=>ws.isAlive=true);
  ws.on('message',bytes=>{
   if(Date.now()-windowStart>1000){messages=0;windowStart=Date.now();}if(++messages>120){ws.close(4008,'Too many messages');return;}
   let data;try{data=JSON.parse(bytes.toString());}catch{fail(ws,'BAD_MESSAGE','Invalid game message.');return;}
   if(!data||typeof data!=='object'||Array.isArray(data))return;
   if(!member){
    if(!['create','join','resume'].includes(data.type)){fail(ws,'JOIN_FIRST','Create or join a room first.');return;}
    if(data.type==='create'){
     if(rooms.size>=maxRooms){fail(ws,'BUSY','The arcade is full. Please try again soon.');return;}
     let code;do{code=roomCode();}while(rooms.has(code));room={code,hostToken:null,members:[],arena:0,mode:'versus',state:null,tick:0,lastActive:Date.now()};rooms.set(code,room);
    }else{room=rooms.get(String(data.code||'').toUpperCase());if(!room){fail(ws,'NO_ROOM','That room is no longer available.');return;}}
    if(data.type==='resume'){
     member=room.members.find(m=>m.token===data.token);
     if(!member||member.disconnectedAt!=null&&Date.now()-member.disconnectedAt>reconnectMs){member=null;fail(ws,'EXPIRED','Your seat has expired. Join a new room.');return;}
     const old=member.ws;member.ws=ws;if(old&&old!==ws)old.close(4001,'Connection moved to another tab');member.disconnectedAt=null;member.input={};member.queue=[];
    }else{
     if(room.state){fail(ws,'IN_MATCH','That match has already started. Join after it finishes.');return;}
     if(room.members.length>=4){fail(ws,'FULL','That room already has four players.');return;}
     const slots=new Set(room.members.map(m=>m.slot)),slot=[0,1,2,3].find(n=>!slots.has(n));
     member={slot,token:randomBytes(24).toString('base64url'),name:String(data.name||'Player').replace(/[\x00-\x1f\x7f]/g,'').trim().slice(0,16)||'Player',species:SPECIES.includes(data.species)?data.species:'platypus',ready:false,ws,input:{},queue:[],sequence:0,appliedSequence:0,playerId:null,lastInput:Date.now()};room.members.push(member);
     room.hostToken??=member.token;
    }
    clearTimeout(authenticate);send(ws,{type:'joined',code:room.code,protocol:1,modes:ROOM_MODES,token:member.token,you:member.slot,sequence:member.sequence});lobby(room);if(room.state)broadcast(room);return;
   }
   if(data.type==='ping'){send(ws,{type:'pong',sent:data.sent});return;}
   if(data.type==='input'||data.type==='release'){
    if(!room.state||member.playerId===null||!Number.isSafeInteger(data.seq)||data.seq<=member.sequence)return;
    member.sequence=data.seq;if(data.type==='release'){member.queue=[];member.input={};member.appliedSequence=data.seq;member.lastInput=Date.now();return;}member.queue.push({seq:data.seq,input:cleanInput(data.input)});member.lastInput=Date.now();if(member.queue.length>90){ws.close(4009,'Input backlog too large');}return;
   }
   if(data.type==='leave'){member.disconnectedAt=0;ws.close(1000,'Left the arcade');return;}
   if(data.type==='upgrade'){
    if(!room.state?.zombie||room.state.phase!=='wave-break'){fail(ws,'NO_UPGRADES','Upgrades are available between survival waves.');return;}
    if(!buyUpgrade(room.state,member.playerId,data.upgrade)){fail(ws,'UPGRADE_DENIED','That upgrade is unavailable or needs more points.');return;}
    // Use the authenticated seat, never a player ID or balance supplied by the browser.
    room.tick++;broadcast(room);return;
   }
   if(data.type==='next-wave'){
    if(member.token!==room.hostToken){fail(ws,'HOST_ONLY','The host starts the next wave.');return;}
    if(!room.state?.zombie||room.state.phase!=='wave-break'){fail(ws,'NO_BREAK','Wait until the wave is cleared.');return;}
    beginWave(room.state);room.tick++;broadcast(room);return;
   }
   if(room.state){fail(ws,'IN_MATCH','Finish the current match before changing the room.');return;}
   if(data.type==='species'){if(SPECIES.includes(data.species)){member.species=data.species;member.ready=false;lobby(room);}return;}
   if(data.type==='ready'){member.ready=data.ready===true;lobby(room);return;}
   if(data.type==='mode'){
    if(member.token!==room.hostToken){fail(ws,'HOST_ONLY','Only the host can choose the mode.');return;}
    if(!ROOM_MODES.includes(data.mode)){fail(ws,'BAD_MODE','Choose Versus or Survival.');return;}
    room.mode=data.mode;room.caption='';room.members.forEach(m=>m.ready=false);lobby(room);return;
   }
   if(data.type==='arena'){
    if(member.token!==room.hostToken)return;if(Number.isInteger(data.arena)&&data.arena>=0&&data.arena<MAPS.length){room.arena=data.arena;room.members.forEach(m=>m.ready=false);lobby(room);}return;
   }
   if(data.type==='start'){
    if(member.token!==room.hostToken)return;
    const players=room.members.filter(m=>m.ws?.readyState===WebSocket.OPEN);
    if(players.length!==room.members.length){fail(ws,'RECONNECTING','A player is reconnecting. Wait for their seat to return or expire.');return;}
    if(players.length<(room.mode==='zombie'?1:2)||players.some(m=>!m.ready)){fail(ws,'NOT_READY',room.mode==='zombie'?'Every connected player must be ready.':'At least two connected players must be ready.');return;}
    room.state=createState(room.mode==='zombie'?'zombie':players.length===2?'duel':'party',{arena:room.arena,players:players.length});
    // The engine's round reset already uses count, so three-player rooms are supported.
    room.state.count=players.length;room.state.players.length=players.length;room.state.scores.length=players.length;room.state.upgradeLevels.length=players.length;
    room.tick=0;room.caption='';for(const m of room.members)m.playerId=null;
    players.forEach((m,id)=>{m.playerId=id;m.sequence=0;m.appliedSequence=0;m.input={};m.queue=[];m.lastInput=Date.now();});broadcast(room);
   }
  });
  ws.on('close',()=>{
   clearTimeout(authenticate);if(!member||member.ws!==ws)return;member.ws=null;member.ready=false;member.input={};member.queue=[];member.disconnectedAt??=Date.now();lobby(room);
  });
 });
 function step(){
  for(const room of rooms.values()){
   const now=Date.now();
   const expired=room.members.filter(m=>m.disconnectedAt!==null&&m.disconnectedAt!==undefined&&now-m.disconnectedAt>reconnectMs);
   for(const m of expired){if(room.state&&m.playerId!==null){const p=room.state.players[m.playerId];killPlayer(room.state,p);p.departed=true;p.downed=false;p.revive=0;}room.members.splice(room.members.indexOf(m),1);}
   if(!room.members.length){rooms.delete(room.code);continue;}
   if(!room.members.some(m=>m.token===room.hostToken)){room.hostToken=(room.members.find(m=>m.ws)||room.members[0]).token;lobby(room);}
   if(!room.state){if(expired.length)lobby(room);continue;}
   const inputs=Array.from({length:room.state.count},()=>({}));
   for(const m of room.members)if(m.playerId!==null){const command=m.queue.shift();if(command){m.input=command.input;m.appliedSequence=command.seq;}inputs[m.playerId]=now-m.lastInput>250?{}:m.input;}
   // Forfeited seats stay eliminated after round changes; they cannot win as ghosts.
   const participating=new Set(room.members.filter(m=>m.playerId!==null).map(m=>m.playerId));
   for(const p of room.state.players)if(!participating.has(p.id)){killPlayer(room.state,p);p.departed=true;p.downed=false;}
   update(room.state,inputs,1/60);room.tick++;
   if(room.state.phase==='match-over'&&room.state.timer<=0){const winner=room.members.find(m=>m.playerId===room.state.winner);finish(room,(winner?.name||'A bill')+' takes the crown!');continue;}
   if(room.state.phase==='game-over'&&room.state.timer<=0){finish(room,`Survived to wave ${room.state.wave} · ${room.state.teamKills} team kills. Ready for another run?`);continue;}
   if(!room.state.zombie&&room.members.filter(m=>m.playerId!==null).length<2){finish(room,'The other players left. Start a new match when the crew returns.');continue;}
   if(room.tick%3===0)broadcast(room);
  }
 }
 let clock=performance.now(),accumulator=0;
 const timer=manualTick?null:setInterval(()=>{const now=performance.now();accumulator+=Math.min(100,now-clock);clock=now;for(let catchup=0;accumulator>=1000/60&&catchup<6;catchup++){step();accumulator-=1000/60;}},1000/60);
 const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.isAlive){ws.terminate();continue;}ws.isAlive=false;ws.ping();}},15000);heartbeat.unref();
 return {http,rooms,step,listen:()=>new Promise(resolve=>http.listen(port,host,()=>resolve(http.address()))),close:()=>new Promise(resolve=>{clearInterval(timer);clearInterval(heartbeat);for(const ws of wss.clients)ws.terminate();wss.close(()=>http.close(resolve));})};
}
if(process.argv[1]===new URL(import.meta.url).pathname){const server=createRoomServer();server.listen().then(address=>console.log(`Bill Brawl rooms listening on ${address.port}`));process.on('SIGTERM',()=>server.close().then(()=>process.exit(0)));process.on('SIGINT',()=>server.close().then(()=>process.exit(0)));}
