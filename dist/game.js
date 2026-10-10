import {createState,update,MAPS,COLORS,WEAPONS} from './engine.js';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
let state=createState(),started=false,paused=false,mode='duel',keys=new Set(),accumulator=0,last=0,sound=false,audio=null,menuShown=false;
const species=['platypus','duck','pelican','toucan','puffin','shoebill'];
const roster=['platypus','duck','toucan','pelican'];
function rosterUI(){
 $('roster').innerHTML=roster.slice(0,mode==='party'?4:mode==='practice'?1:2).map((value,id)=>`<label>P${id+1}<select aria-label="Player ${id+1} species" data-player="${id}">${species.map(name=>`<option value="${name}"${name===value?' selected':''}>${name.toUpperCase()}</option>`).join('')}</select></label>`).join('');
 $('roster').querySelectorAll('select').forEach(select=>select.onchange=()=>{roster[Number(select.dataset.player)]=select.value;});
}
rosterUI();
const binds=[{left:'KeyA',right:'KeyD',jump:'KeyW',down:'KeyS',fire:'KeyF',grab:'KeyG',chirp:'KeyQ',strafe:'ShiftLeft'},{left:'ArrowLeft',right:'ArrowRight',jump:'ArrowUp',down:'ArrowDown',fire:'KeyK',grab:'KeyL',chirp:'KeyO',strafe:'Enter'}];
const used=new Set([...Object.values(binds[0]),...Object.values(binds[1]),'Escape','Space']);
window.addEventListener('keydown',e=>{if(used.has(e.code)&&started)e.preventDefault();if(e.code==='Escape'&&!e.repeat&&started)togglePause();keys.add(e.code);});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();if(started&&!paused)togglePause(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();if(started&&!paused)togglePause(true);}});
function togglePause(force){if(!started||state.phase==='match-over')return;paused=force??!paused;$('pause').classList.toggle('hidden',!paused);$('pause-button').textContent=paused?'RESUME ▶':'PAUSE II';keys.clear();accumulator=0;if(!paused)canvas.focus();}
function soundInit(){if(!audio){const Audio=window.AudioContext||window.webkitAudioContext;if(Audio)audio=new Audio();}if(audio?.state==='suspended')audio.resume().catch(()=>{});}
function tone(freq,duration=.08,volume=.04,type='square',end){if(!sound||!audio)return;const osc=audio.createOscillator(),gain=audio.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,audio.currentTime);if(end)osc.frequency.exponentialRampToValueAtTime(end,audio.currentTime+duration);gain.gain.setValueAtTime(volume,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration);}
$('sound').onclick=()=>{sound=!sound;if(sound)soundInit();$('sound').textContent=sound?'SOUND ON':'SOUND OFF';$('sound').setAttribute('aria-label',sound?'Disable sound':'Enable sound');$('sound').setAttribute('aria-pressed',String(sound));tone(460,.1);};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('screen').requestFullscreen();}catch{$('status').textContent='FULLSCREEN IS UNAVAILABLE IN THIS BROWSER';}};
$('help').onclick=()=>{const hidden=$('help-panel').classList.toggle('hidden');$('help').setAttribute('aria-expanded',String(!hidden));if(!hidden&&started&&!paused)togglePause(true);};
$('pause-button').onclick=()=>togglePause();$('resume').onclick=()=>togglePause(false);
$('quit').onclick=()=>{started=false;paused=false;keys.clear();$('pause').classList.add('hidden');$('menu').classList.remove('hidden');$('pause-button').disabled=true;$('announcement').textContent='';$('status').textContent='READY WHEN YOU ARE';state=createState(mode);syncHud();};
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;rosterUI();document.querySelectorAll('[data-mode]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});$('mode-note').textContent=mode==='party'?'Players 1–2: keyboard. Players 3–4: two controllers.':mode==='practice'?'You vs a practice bot. Player 01 controls.':'Share a keyboard or connect two controllers.';});
$('start').onclick=()=>{if(mode==='party'&&pads().length<2){$('mode-note').textContent='Connect two controllers and press any button on each.';return;}state=createState(mode);started=true;paused=false;menuShown=false;keys.clear();accumulator=0;$('menu').classList.add('hidden');$('pause').classList.add('hidden');$('pause-button').disabled=false;$('pause-button').textContent='PAUSE II';canvas.focus();if(sound)soundInit();syncHud();};
function pads(){return [...(navigator.getGamepads?.()||[])].filter(Boolean);}
function inputs(){
 const list=binds.map(binding=>Object.fromEntries(Object.entries(binding).map(([a,k])=>[a,keys.has(k)])));
 const controllers=pads();
 controllers.forEach((g,index)=>{const id=mode==='party'?index+2:index;if(id>=state.count||mode==='practice'&&id>0)return;const pressed=n=>!!g.buttons[n]?.pressed,axis=g.axes[0]||0;const i={left:axis<-.25||pressed(14),right:axis>.25||pressed(15),down:(g.axes[1]||0)>.4||pressed(13),jump:pressed(0),fire:pressed(2),grab:pressed(3),chirp:pressed(1),strafe:pressed(4)};list[id]={...list[id]};for(const [k,v]of Object.entries(i))list[id][k]=!!list[id][k]||v;});
 return list;
}
function syncHud(){
 $('arena-label').textContent=state.map.name;$('arena-label').nextElementSibling.textContent=`0${state.mapIndex+1} / 03`;
 $('scores').innerHTML=state.scores.map((n,id)=>`<span style="--player-color:${COLORS[id]}"><i></i>${String(n).padStart(2,'0')}</span>`).join('');
 $('round-label').textContent=started?`ROUND ${String(state.round).padStart(2,'0')} · FIRST TO 10`:'FIRST TO 10';
}
function events(){for(const e of state.events){switch(e.type){case'round':syncHud();tone(260,.1);break;case'go':tone(650,.12);break;case'jump':tone(120,.09,.013,'triangle',240);break;case'pickup':tone(720,.07,.025,'square',1000);break;case'shot':tone(e.weapon==='shotgun'?85:170,.08,.035,'sawtooth',45);break;case'throw':tone(300,.07,.015,'triangle',90);break;case'empty':tone(65,.03,.02);break;case'death':tone(260,.22,.03,'sawtooth',45);break;case'explosion':tone(80,.35,.07,'sawtooth',20);break;case'chirp':tone(530+e.id*50,.16,.045,'triangle',220);break;case'win':syncHud();tone(440,.12);setTimeout(()=>tone(660,.18),140);break;}}state.events=[];}
const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);};
function cloud(x,y,w){rect(x,y,w,8,'#f4e5ca');rect(x+10,y-5,w-20,6,'#f4e5ca');rect(x+23,y-9,w-46,4,'#f4e5ca');rect(x+8,y+8,w-20,2,'#dcbf9e');}
function building(x,y,w,h,color){rect(x,y,w,h,color);rect(x-3,y,w+6,4,'#385c54');for(let a=x+9;a<x+w-5;a+=18)for(let b=y+12;b<y+h-12;b+=23){rect(a,b,8,12,'#436c60');rect(a+1,b+1,5,7,'#83a18c');}}
function background(){
 const theme=state.map.theme;rect(0,0,640,360,'#dfb893');rect(0,0,640,88,'#e4c5a2');rect(0,88,640,55,'#d6b496');rect(0,143,640,40,'#b4b398');
 rect(481,30,35,35,'#f6d594');rect(474,38,49,20,'#f6d594');cloud(31,46,92);cloud(262,27,99);cloud(521,98,82);
 // Low, layered hills and a harbour skyline.
 for(let n=0;n<12;n++){const x=n*65-25,y=163+Math.sin(n*2)*13;rect(x,y,75,65,'#8da795');rect(x+12,y-9,48,10,'#8da795');}
 building(7,173,75,125,'#668b7a');building(92,195,55,105,'#76947e');building(508,163,94,150,'#6a8876');building(605,207,40,100,'#7a9279');
 // Crane silhouettes, cables, and dock pilings.
 rect(180,77,8,225,'#658e7d');rect(156,75,128,7,'#658e7d');rect(182,53,4,25,'#658e7d');for(let n=0;n<5;n++)rect(193+n*15,68+n*2,19,3,'#658e7d');rect(254,82,1,66,'#658e7d');rect(248,148,13,6,'#658e7d');rect(246,154,3,7,'#658e7d');
 rect(465,116,5,192,'#76947e');rect(422,112,81,5,'#76947e');rect(427,117,1,54,'#76947e');
 rect(0,293,640,67,'#587f70');for(let n=0;n<38;n++)rect(n*23,(n%3)*11+301,12,2,'#86a58c');
 if(theme==='roof'){building(250,249,140,111,'#54796d');rect(320,215,4,34,'#54796d');rect(303,213,36,3,'#54796d');}
 if(theme==='pump'){rect(27,203,16,117,'#446e63');rect(27,203,47,13,'#446e63');rect(590,203,16,117,'#446e63');rect(564,203,42,13,'#446e63');rect(301,148,38,76,'#668576');rect(292,172,55,10,'#668576');}
}
function stage(){
 for(const b of state.map.platforms){
  if(!b.oneWay&&b.h<32){rect(b.x,b.y,b.w,b.h,'#855b3b');rect(b.x+2,b.y+2,b.w-4,b.h-4,'#c19a67');rect(b.x+4,b.y+4,b.w-8,b.h-8,'#a97c4d');for(let n=0;n<3;n++)rect(b.x+3+n*6,b.y+3+n*5,4,4,'#d6ad79');continue;}
  rect(b.x,b.y,b.w,b.h,'#394d40');rect(b.x,b.y,b.w,4,'#bd9864');rect(b.x,b.y+4,b.w,3,'#e1b97c');rect(b.x,b.y+7,b.w,b.oneWay?5:7,'#7b5e3e');
  for(let x=b.x+5;x<b.x+b.w;x+=19){rect(x,b.y+1,2,2,'#4a4735');rect(x+6,b.y+7,9,1,'#b18a55');}
  if(b.oneWay){for(const x of [b.x+8,b.x+b.w-13]){rect(x,b.y+12,5,17,'#496655');rect(x-2,b.y+27,9,3,'#496655');}}
  else{for(let x=b.x+12;x<b.x+b.w;x+=42){rect(x,b.y+14,9,42,'#5a503b');rect(x+2,b.y+16,2,40,'#837457');}rect(b.x,b.y+18,b.w,2,'#273f35');}
 }
 // Reeds at the waterline and little hanging mooring ropes.
 for(const x of [16,36,601,620]){rect(x,307,2,13,'#3d6753');rect(x-3,303,3,8,'#709071');rect(x+2,300,3,10,'#709071');}
}
function weapon(x,y,type,dir=1){ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(dir,1);
 if(type==='pistol'){rect(-6,-3,14,4,'#273b35');rect(-3,1,4,5,'#765238');rect(3,-4,5,1,'#bfc5ab');}
 if(type==='shotgun'){rect(-10,-3,22,4,'#303d36');rect(-10,1,7,3,'#94623c');rect(-2,1,10,2,'#b58952');rect(8,-4,5,1,'#aebcaf');}
 if(type==='grenade'){rect(-4,-4,8,8,'#365645');rect(-3,-3,5,2,'#86a56c');rect(-2,-7,4,3,'#343b33');rect(2,-6,4,2,'#a7b59b');}
 ctx.restore();}
function platypus(p,demo=false){
 ctx.save();const crouch=p.h===14,walk=p.alive&&Math.abs(p.vx)>15?Math.sin(state.time*18):0;
 ctx.translate(Math.round(p.x+8),Math.round(p.y+p.h-8));ctx.scale(p.dir,1);
 if(!p.alive)ctx.rotate(state.time*6+p.id);if(crouch)ctx.scale(1,.65);
 const animal=roster[p.id]||'platypus';
 if(animal==='platypus'){
 // A broad, crosshatched paddle tail, dense fur, webbed feet, and a shovel bill.
 rect(-20,-3,9,8,'#4d3f32');rect(-22,-1,3,4,'#4d3f32');rect(-19,-2,7,6,'#94714e');for(let n=0;n<3;n++){rect(-19+n*2,-1,1,4,'#6e5138');rect(-19,-1+n*2,7,1,'#ae8559');}
 rect(-10,-8,17,12,'#543c2b');rect(-9,-10,13,3,'#543c2b');rect(-8,-8,13,11,'#936640');rect(-5,-5,11,7,'#bb8a55');rect(-8,-8,4,6,'#a57646');
 rect(-4,-15,12,10,'#543c2b');rect(-3,-14,10,9,'#996a42');rect(-3,-14,5,2,'#b38956');rect(4,-12,2,3,p.alive?'#172823':'#684a32');if(p.alive)rect(4,-12,1,1,'#f4f1e7');
 rect(7,-8,12,p.chirp>0?7:5,'#4d5144');rect(8,-7,12,3,'#b1a382');rect(9,-7,9,1,'#d1bb8c');rect(17,-6,1,1,'#4d5144');
 rect(-10,2+Math.max(0,walk)*2,8,4,'#514b37');rect(3,2+Math.max(0,-walk)*2,8,4,'#514b37');rect(-9,3+Math.max(0,walk)*2,6,2,'#a29465');rect(4,3+Math.max(0,-walk)*2,6,2,'#a29465');
 }else{
  const dark=animal==='toucan'||animal==='puffin',gray=animal==='shoebill';
  const body=dark?'#283a35':gray?'#8c9994':'#e3d6b6';
  rect(-11,-7,18,11,'#283d34');rect(-14,-5,5,4,body);rect(-10,-9,15,12,body);rect(-7,-5,12,8,dark?'#ece3c7':gray?'#afbab0':'#f0e6c8');rect(-9,-6,6,6,dark?'#354a40':gray?'#7f9188':'#c3b68e');
  rect(-3,-16,12,11,'#283d34');rect(-2,-15,10,10,body);if(animal==='puffin'){rect(2,-14,6,9,'#f7ecd0');rect(-2,-15,4,11,'#283a35');}
  if(animal==='duck'){rect(8,-9,10,4,'#db8a43');rect(9,-9,9,2,'#f5bf5d');}
  if(animal==='pelican'){rect(8,-10,15,3,'#e7ae63');rect(9,-7,11,4,'#d98e4e');rect(10,-3,8,2,'#d98e4e');rect(12,-1,4,2,'#d98e4e');}
  if(animal==='toucan'){rect(8,-14,17,8,'#e78244');rect(9,-14,10,3,'#f5c567');rect(9,-11,9,2,'#eb9d45');rect(20,-13,6,7,'#35423a');rect(8,-6,14,2,'#e6b651');}
  if(animal==='puffin'){rect(8,-11,7,6,'#e47a3f');rect(13,-9,3,3,'#e7b34f');rect(9,-10,2,4,'#f2c14b');}
  if(animal==='shoebill'){rect(8,-12,13,9,'#b8ac8b');rect(9,-11,11,3,'#d3c9a8');rect(18,-8,5,5,'#b8ac8b');rect(19,-5,3,3,'#8d8165');rect(-4,-18,4,5,'#8c9994');}
  rect(4,-12,2,2,p.alive?'#172823':'#647266');if(p.alive)rect(4,-12,1,1,'#ffffff');
  rect(-8,3+Math.max(0,walk)*2,7,3,'#cf934c');rect(3,3+Math.max(0,-walk)*2,7,3,'#cf934c');
  if(p.chirp>0){rect(28,-16,2,5,'#ffeac0');rect(30,-14,3,1,'#ffeac0');}
 }
 // Player-coloured cap and scarf remain visible when facing either direction.
 rect(-4,-17,11,3,COLORS[p.id]);rect(-2,-19,7,2,COLORS[p.id]);rect(5,-15,5,2,COLORS[p.id]);rect(-5,-5,11,2,COLORS[p.id]);rect(-7,-4,3,5,COLORS[p.id]);
 if(p.weapon&&p.alive){weapon(9,-1,p.weapon);rect(0,-1,5,3,'#b58955');if(p.flash>0){rect(24,-4,7,5,'#ffeac0');rect(27,-6,2,9,'#fff3cc');}}
 ctx.restore();
 if(p.alive){ctx.font='bold 7px monospace';ctx.textAlign='center';ctx.fillStyle=COLORS[p.id];ctx.fillText(`P${p.id+1}`,Math.round(p.x+8),Math.round(p.y-11));if(p.weapon&&!demo){for(let a=0;a<p.ammo;a++)rect(p.x-3+a*3,p.y-7,2,2,COLORS[p.id]);if(!p.ammo){ctx.fillStyle='#ffcf84';ctx.fillText('EMPTY',p.x+8,p.y-6);}}}
}
function render(){
 ctx.save();if(started&&state.shake)ctx.translate(Math.round((Math.random()-.5)*state.shake),Math.round((Math.random()-.5)*state.shake));background();stage();
 for(const i of state.items){const bob=Math.sin(state.time*3+i.x)*2;rect(i.x-3,i.y+11,21,2,'#273f3570');ctx.globalAlpha=.35+.1*Math.sin(state.time*4);rect(i.x-6,i.y-9,26,22,'#ffeab3');ctx.globalAlpha=1;weapon(i.x+7,i.y+4+bob,i.type);ctx.fillStyle='#fff0c8';ctx.font='6px monospace';ctx.textAlign='center';ctx.fillText(WEAPONS[i.type].name,i.x+7,i.y-12+bob);}
 if(started){for(const p of state.players)platypus(p);}else {for(const p of [{id:0,x:112,y:238,w:16,h:22,dir:1,vx:0,alive:true,chirp:0,weapon:'pistol',flash:0},{id:1,x:508,y:238,w:16,h:22,dir:-1,vx:0,alive:true,chirp:0,weapon:'shotgun',flash:0}])platypus(p,true);}
 for(const b of state.bullets){rect(b.x-4*Math.sign(b.vx),b.y,7,2,'#ffdf85');rect(b.x,b.y,2,2,'#fff6d7');}
 for(const g of state.grenades){weapon(g.x,g.y,'grenade');if(g.fuse<.6&&Math.floor(g.fuse*20)%2)rect(g.x-1,g.y-6,3,3,'#ff7458');}
 for(const p of state.particles){ctx.globalAlpha=Math.min(1,p.life*2);rect(p.x,p.y,Math.round(p.size),Math.round(p.size),p.color);}ctx.globalAlpha=1;
 const tide=started?state.tide:352;rect(0,tide,640,360-tide,'#477c77');rect(0,tide,640,2,'#90c5b3');for(let n=0;n<29;n++)rect((n*27+state.time*12)%660-15,tide+4+n%3*5,14,1,'#76aaa0');
 if(started&&state.roundTime>22&&state.phase==='playing'){ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillStyle='#ffe5aa';ctx.fillText('HIGH TIDE INCOMING',320,25);}
 // Subtle arcade scanlines.
 ctx.globalAlpha=.035;for(let y=0;y<360;y+=3)rect(0,y,640,1,'#172823');ctx.globalAlpha=1;ctx.restore();
 if(started){
  const phase=state.phase;
  if(phase==='countdown'){$('announcement').textContent=state.timer>.5?String(Math.ceil(state.timer+.4)):'GO!';$('status').textContent='GRAB A WEAPON. MAKE A SCENE.';}
  else if(phase==='playing'){$('announcement').textContent='';$('status').textContent=mode==='practice'?'PRACTICE · YOU VS BOT':'LOCAL MATCH · LAST BILL STANDING';}
  else {$('announcement').innerHTML=state.winner===null?'DOUBLE TROUBLE.<small>DRAW · NO POINTS</small>':`PLAYER ${String(state.winner+1).padStart(2,'0')} ${phase==='match-over'?'TAKES THE CROWN!':'WINS!'}<small>${phase==='match-over'?'TEN POINTS. ZERO MODESTY.':'ANOTHER ROUND. ANOTHER GRUDGE.'}</small>`;
   if(phase==='match-over'&&state.timer<=0&&!menuShown){menuShown=true;started=false;$('announcement').textContent='';$('menu').classList.remove('hidden');$('menu').querySelector('p').textContent=`Player ${state.winner+1} wins ${state.scores.join(' – ')}. Run it back?`;$('pause-button').disabled=true;$('status').textContent='MATCH COMPLETE · READY FOR A REMATCH';}}
 }
}
function frame(ms){const delta=Math.min(.1,(ms-last)/1000||0);last=ms;if(started&&!paused){accumulator+=delta;while(accumulator>=1/60){update(state,inputs(),1/60);accumulator-=1/60;}events();}else if(!started)state.time+=delta;render();requestAnimationFrame(frame);}
syncHud();requestAnimationFrame(frame);
