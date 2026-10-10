import {predictPlayer,MAPS,COLORS} from './engine.js';
import {SPECIES,drawCharacter} from './sprites.js';
import {drawMapPreview} from './world.js';
import {ONLINE_ENDPOINT} from './online-config.js';
const $=id=>document.getElementById(id),lerp=(a,b,t)=>a+(b-a)*t;
const endpoint=()=>{
 const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
 const value=(local?new URLSearchParams(location.search).get('rooms'):'')||ONLINE_ENDPOINT||document.querySelector('meta[name="bill-brawl-rooms"]')?.content;
 if(!value)return '';try{const url=new URL(value,location.href);if(url.protocol==='https:')url.protocol='wss:';if(local&&url.protocol==='http:')url.protocol='ws:';if(url.protocol==='wss:'||local&&url.protocol==='ws:')return url.href;}catch{}return '';
};
const readSeat=()=>{try{return JSON.parse(sessionStorage.getItem('bill-brawl-seat'));}catch{return null;}};
export class OnlineArcade{
 constructor({onState,onRoom,onExit,onEvent,onOpen}){
  Object.assign(this,{endpoint:endpoint(),onState,onRoom,onExit,onEvent,onOpen,pending:[],seq:0,active:false,rtt:0,lastTick:-1,connection:'idle'});
  $('online-open').classList.toggle('hidden',!this.endpoint);$('online-open').onclick=()=>this.open();$('online-back').onclick=()=>this.leave();
  $('online-create').onclick=()=>this.connect({type:'create',...this.identity()});
  $('online-join').onclick=()=>{const code=$('online-code').value.trim().toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code)){this.notice('Enter the six-character room code.');return;}this.connect({type:'join',code,...this.identity()});};
  $('online-code').oninput=()=>{$('online-code').value=$('online-code').value.toUpperCase().replace(/[^A-Z2-9]/g,'').slice(0,6);};
  $('online-code').onkeydown=e=>{if(e.code==='Enter'){e.preventDefault();$('online-join').click();}};
  $('online-rejoin').onclick=()=>{const seat=readSeat();if(seat?.endpoint===this.endpoint){this.code=seat.code;this.token=seat.token;this.connect({type:'resume',code:seat.code,token:seat.token});}};
  $('online-species').replaceChildren(...SPECIES.map(species=>new Option(species.toUpperCase(),species)));$('online-species').value='platypus';
  $('online-species').onchange=()=>{if(this.room)this.send({type:'species',species:$('online-species').value});};
  $('online-ready').onclick=()=>this.send({type:'ready',ready:!this.room?.players.find(p=>p.id===this.slot)?.ready});
  $('online-start').onclick=()=>this.send({type:'start'});$('online-arena').replaceChildren(...MAPS.map((m,id)=>new Option(`${String(id+1).padStart(2,'0')} / ${m.name} · ${m.size}`,String(id))));
  $('online-arena').onchange=()=>this.send({type:'arena',arena:Number($('online-arena').value)});
  $('online-copy').onclick=async()=>{try{await navigator.clipboard.writeText(this.room.code);this.notice('Copied. Share this code with your crew.');}catch{this.notice('Share this code with your crew.');}};
  this.pingTimer=setInterval(()=>{if(this.ws?.readyState===WebSocket.OPEN&&this.token)this.send({type:'ping',sent:performance.now()});},2000);
  window.addEventListener('pagehide',()=>{this.unloading=true;this.release();this.ws?.close();});
  window.addEventListener('pageshow',()=>{this.unloading=false;if(this.active&&this.token&&this.ws?.readyState>1)this.retryConnection();});
 }
 identity(){return {name:$('online-name').value.trim().slice(0,16)||'Player',species:$('online-species').value};}
 notice(text){$('online-notice').textContent=text;}
 saveSeat(){try{sessionStorage.setItem('bill-brawl-seat',JSON.stringify({endpoint:this.endpoint,code:this.code,token:this.token}));}catch{}}
 clearSeat(){try{sessionStorage.removeItem('bill-brawl-seat');}catch{}}
 open(){this.active=true;this.onOpen();$('menu').classList.add('hidden');$('online-menu').classList.remove('hidden');this.notice('Create a room or enter your crew’s code.');$('online-rejoin').classList.toggle('hidden',readSeat()?.endpoint!==this.endpoint);$('online-name').focus();}
 connect(command){
  if(this.ws&&this.ws.readyState<2)return;this.active=true;this.explicitLeave=false;this.connection='connecting';this.notice(command.type==='resume'?'Rejoining your seat…':'Connecting…');this.drawConnection();
  $('online-create').disabled=$('online-join').disabled=$('online-rejoin').disabled=true;
  const ws=this.ws=new WebSocket(this.endpoint);this.connectTimer=setTimeout(()=>{if(ws.readyState===WebSocket.CONNECTING)ws.close();},5000);
  ws.onopen=()=>{clearTimeout(this.connectTimer);this.send(command);};
  ws.onmessage=event=>{let data;try{data=JSON.parse(event.data);}catch{return;}if(ws!==this.ws)return;
   if(data.type==='joined'){
    if(data.protocol!==1){this.fatal('This arcade needs the latest game version.');return;}
    this.slot=data.you;this.code=data.code;this.token=data.token;this.seq=data.sequence||0;this.pending=[];this.connection='connected';this.disconnectedAt=null;this.saveSeat();this.notice('Ready up when your crew arrives.');
   }
   if(data.type==='lobby'){this.room=data;if(!data.playing){this.current=null;this.pending=[];this.previous=null;this.authoritative=null;this.lastTick=-1;this.seq=0;$('online-menu').classList.remove('hidden');this.onRoom(data);}this.drawRoom();}
   if(data.type==='state')this.receive(data);
   if(data.type==='pong'&&Number.isFinite(data.sent)){this.rtt=Math.max(0,Math.round(performance.now()-data.sent));this.drawConnection();}
   if(data.type==='error'){if(command.type==='resume'&&['EXPIRED','NO_ROOM'].includes(data.code)){this.fatal(data.message);return;}this.notice(data.message);if(!this.token){this.explicitLeave=true;ws.close();this.connection='idle';$('online-create').disabled=$('online-join').disabled=$('online-rejoin').disabled=false;}}
  };
  ws.onerror=()=>this.notice('Could not reach the arcade. Try again.');
  ws.onclose=event=>{clearTimeout(this.connectTimer);if(ws!==this.ws||this.explicitLeave||this.unloading)return;this.pending=[];if(!this.token){this.connection='idle';this.notice('The arcade is unavailable. Try again or play locally.');$('online-create').disabled=$('online-join').disabled=$('online-rejoin').disabled=false;return;}
   if([4001,4008,4009].includes(event.code)){this.fatal(event.reason||'Connection closed. Join again.');return;}this.retryConnection();
  };
 }
 retryConnection(){
  this.disconnectedAt??=performance.now();if(performance.now()-this.disconnectedAt>28000){this.fatal('Your seat expired. Join a new room.');return;}
  this.connection='reconnecting';this.notice('Reconnecting… Your seat is held for 30 seconds.');this.drawConnection();clearTimeout(this.retry);this.retry=setTimeout(()=>this.connect({type:'resume',code:this.code,token:this.token}),1500);
 }
 fatal(message){this.explicitLeave=true;clearTimeout(this.retry);this.ws?.close();this.clearSeat();this.token=null;this.room=null;this.current=null;this.lastTick=-1;this.connection='idle';this.pending=[];this.onRoom(null);$('online-entry').classList.remove('hidden');$('online-room').classList.add('hidden');$('online-menu').classList.remove('hidden');$('online-name').disabled=false;$('online-create').disabled=$('online-join').disabled=$('online-rejoin').disabled=false;$('online-rejoin').classList.add('hidden');this.notice(message);}
 send(data){if(this.ws?.readyState===WebSocket.OPEN){this.ws.send(JSON.stringify(data));return true;}return false;}
 receive(data){
  if(data.tick<=this.lastTick)return;this.lastTick=data.tick;
  const next=data.state,events=[...next.events],sameRound=this.current?.round===next.round;
  this.previous=sameRound?this.authoritative:null;this.authoritative=structuredClone(next);this.received=performance.now();this.you=data.you;this.pending=this.pending.filter(p=>p.seq>data.ack);if(!sameRound)this.pending=[];
  next.events=[];next._terrainCache=null;const own=next.players[this.you];for(const command of this.pending)predictPlayer(next,own,command.input);next.events=[];
  this.current=next;this.species=data.roster;$('online-menu').classList.add('hidden');this.onState(next,data.roster,this.you);for(const e of events)this.onEvent(e);this.drawConnection();
 }
 step(input){if(!this.current||this.connection!=='connected'||this.ws?.readyState!==WebSocket.OPEN)return;const command={type:'input',seq:++this.seq,input};if(!this.send(command))return;this.pending.push(command);if(this.pending.length>90)this.pending.shift();predictPlayer(this.current,this.current.players[this.you],input);this.current.events=[];}
 release(){if(this.current){this.send({type:'release',seq:++this.seq});this.pending=[];}}
 frame(){
  if(!this.current)return null;const t=Math.min(1,(performance.now()-this.received)/50),state={...this.current};
  state.players=this.current.players.map((p,id)=>{const a=this.previous?.players[id];return id===this.you||!a||a.alive!==p.alive? p:{...p,x:lerp(a.x,p.x,t),y:lerp(a.y,p.y,t)};});
  for(const key of ['bullets','grenades']){const prior=new Map((this.previous?.[key]||[]).map(p=>[p.id,p]));state[key]=this.current[key].map(p=>{const a=prior.get(p.id);return !a?p:{...p,x:lerp(a.x,p.x,t),y:lerp(a.y,p.y,t)};});}return state;
 }
 drawConnection(){$('online-connection').textContent=this.connection==='connected'?`${this.code} · YOU P${(this.you??this.slot??0)+1} · ${this.rtt} MS`:this.connection.toUpperCase();}
 drawRoom(){
  const room=this.room,own=room.players.find(p=>p.id===this.slot),host=own?.host;
  $('online-entry').classList.add('hidden');$('online-room').classList.remove('hidden');$('online-name').disabled=true;$('online-name').value=own?.name||'';$('online-room-code').textContent=room.code;$('online-arena').value=room.arena;$('online-arena').disabled=!host;$('online-species').value=own?.species||'platypus';
  $('online-ready').textContent=own?.ready?'✓ READY':'READY';$('online-ready').setAttribute('aria-pressed',String(!!own?.ready));$('online-start').classList.toggle('hidden',!host);$('online-start').disabled=room.players.filter(p=>p.connected).length<2||room.players.some(p=>!p.connected||!p.ready);
  $('online-caption').textContent=room.caption||`${room.players.length} / 4 JOINED`;
  $('online-roster').replaceChildren(...room.players.map(p=>{
   const card=document.createElement('article');card.className='online-seat';card.style.setProperty('--player-color',COLORS[p.id]);
   const c=document.createElement('canvas');c.width=176;c.height=128;c.setAttribute('aria-label',p.species);const x=c.getContext('2d');x.scale(2,2);drawCharacter(x,{id:p.id,x:35,y:37,w:16,h:22,dir:1,vx:0,alive:true},{species:p.species,color:COLORS[p.id]});
   const name=document.createElement('strong');name.textContent=`P${p.id+1} · ${p.name}${p.id===this.slot?' (YOU)':''}`;const status=document.createElement('small');status.textContent=!p.connected?'RECONNECTING':p.ready?'READY':p.host?'HOST':'CHOOSING';card.append(c,name,status);return card;
  }));
  drawMapPreview($('online-preview').getContext('2d'),MAPS[room.arena]);this.drawConnection();
 }
 leave(){this.explicitLeave=true;clearTimeout(this.retry);clearTimeout(this.connectTimer);this.release();this.send({type:'leave'});this.ws?.close();this.ws=null;this.clearSeat();this.token=null;this.room=null;this.current=null;this.authoritative=null;this.previous=null;this.you=null;this.slot=null;this.code=null;this.lastTick=-1;this.active=false;this.pending=[];this.connection='idle';
  $('online-menu').classList.add('hidden');$('online-connection').classList.add('hidden');$('online-entry').classList.remove('hidden');$('online-room').classList.add('hidden');$('online-name').disabled=false;$('online-create').disabled=$('online-join').disabled=$('online-rejoin').disabled=false;this.onExit();
 }
 snapshot(){return {active:this.active,connection:this.connection,code:this.room?.code||null,you:this.you??null,slot:this.slot??null,players:this.room?.players||[],tick:this.lastTick,pending:this.pending.length,rtt:this.rtt,authoritative:this.authoritative?{round:this.authoritative.round,phase:this.authoritative.phase,scores:this.authoritative.scores,players:this.authoritative.players.map(({id,x,y,alive,weapon,ammo})=>({id,x,y,alive,weapon,ammo})),objects:this.authoritative.map.objects}:null};}
}
