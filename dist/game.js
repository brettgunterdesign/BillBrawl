import {drawBattleEffects} from './terrain-art.js';
import {createState,update,MAPS,COLORS,WEAPONS,beginWave,buyUpgrade,upgradeCost} from './engine.js';
import {AudioDirector} from './audio.js';
import {ArcadeLobby} from './lobby.js';
import {MenuController,ControllerKeyboard} from './menu-controller.js';
import {OnlineArcade} from './online.js';
import {SharedCamera} from './camera.js';
import {drawCharacter,drawWeapon,drawWeaponIcon} from './sprites.js';
import {drawBackground,drawArena,drawWater} from './world.js';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d'),audio=new AudioDirector(),camera=new SharedCamera();
let state=createState(),started=false,paused=false,mode='duel',keys=new Set(),accumulator=0,last=0,sound=true,hudKey='',upgradeKey='',previousPads=0;
const roster=['platypus','duck','toucan','pelican'];
const binds=[{left:'KeyA',right:'KeyD',jump:'KeyW',down:'KeyS',fire:'KeyF',grab:'KeyG',chirp:'KeyQ',strafe:'ShiftLeft'},{left:'ArrowLeft',right:'ArrowRight',jump:'ArrowUp',down:'ArrowDown',fire:'KeyK',grab:'KeyL',chirp:'KeyO',strafe:'Enter'}];
const used=new Set([...Object.values(binds[0]),...Object.values(binds[1]),'Escape','Space']);
const theme=()=>({snow:'ice',ruins:'jungle',foundry:'lava'}[state.map.theme]||state.map.theme);
function scene(){audio.setScene(!started?'lobby':state.phase==='game-over'||state.phase==='match-over'?'gameover':state.zombie?'zombie':mode==='practice'?'practice':'pvp',theme());}
function art(target,paint,w,h){target.width=w*2;target.height=h*2;const c=target.getContext('2d');c.scale(2,2);c.imageSmoothingEnabled=false;paint(c);}
const lobbyMenu=new ArcadeLobby({audio,roster,onPreview:options=>{mode=options.mode;if(!started){state=createState(mode,options);hudKey='';scene();}},onStart:startMatch,onFullscreen:()=> $('fullscreen').click()});
const localRoster=[...roster];
const online=new OnlineArcade({onOpen:()=>{localRoster.splice(0,localRoster.length,...roster);audio.unlock();keys.clear();},onExit:()=>{roster.splice(0,roster.length,...localRoster);mode=lobbyMenu.mode;lobby();},onRoom:()=>{
 started=false;paused=false;helpPaused=false;keys.clear();accumulator=0;audio.setPaused(false);$('help-panel').classList.add('hidden');for(const id of ['menu','pause','game-hud','online-menu'])$(id).inert=false;$('upgrade-menu').classList.add('hidden');upgradeKey='';$('menu').classList.add('hidden');$('pause').classList.add('hidden');$('game-hud').classList.add('hidden');$('inventory').classList.add('hidden');$('online-connection').classList.add('hidden');$('status').classList.add('hidden');$('announcement').textContent='';scene();
},onState:(next,species)=>{
 const entering=!started;state=next;roster.splice(0,roster.length,...species);mode='online';started=true;
 if(entering){paused=false;keys.clear();accumulator=0;hudKey='';upgradeKey='';$('menu').classList.add('hidden');$('pause').classList.add('hidden');$('help-panel').classList.add('hidden');for(const id of ['menu','pause','game-hud','online-menu'])$(id).inert=false;$('game-hud').classList.remove('hidden');$('inventory').classList.remove('hidden');$('online-connection').classList.remove('hidden');$('status').classList.remove('hidden');$('pause-button').disabled=false;previousPads=pads().length;canvas.focus();audio.setPaused(false);audio.unlock();scene();}
},onEvent:e=>{state.events.push(e);events();}});
const controllerKeyboard=new ControllerKeyboard(),menuController=new MenuController({cue:()=>lobbyMenu.cue(),edit:e=>controllerKeyboard.open(e)});
window.addEventListener('keydown',e=>{if(controllerKeyboard.target){if(e.code==='Escape'){e.preventDefault();controllerKeyboard.close();}return;}if(!$('help-panel').classList.contains('hidden')){if(e.code==='Escape'){e.preventDefault();closeHelp();}return;}if(!started&&online.active){if(e.code==='Escape'&&!e.target.closest?.('input,select'))online.leave();return;}if(!started&&($('screen').contains(document.activeElement)||document.activeElement===document.body)&&lobbyMenu.handleKey(e)){e.preventDefault();return;}if(used.has(e.code)&&started)e.preventDefault();if(e.code==='Escape'&&!e.repeat&&started)togglePause();keys.add(e.code);});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();if(started&&!paused)togglePause(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();if(started&&!paused)togglePause(true);}});
function togglePause(force){if(!started)return;paused=force??!paused;$('pause').classList.toggle('hidden',!paused);$('pause-button').textContent=paused?'▶':'Ⅱ';$('pause-button').setAttribute('aria-label',paused?'Resume':'Pause');keys.clear();accumulator=0;if(online.active)online.release();$('pause').querySelector('h2').textContent=online.active?'MENU.':'PAUSED.';$('quit').textContent=online.active?'LEAVE ROOM':'MAIN MENU';audio.setPaused(paused);if(!paused){audio.unlock();canvas.focus();}syncUpgrades();}
function toggleSound(){sound=!sound;audio.setEnabled(sound);if(sound)audio.unlock();for(const id of ['sound','lobby-sound']){$(id).textContent=sound?'♫':'♪';$(id).setAttribute('aria-label',sound?'Disable sound':'Enable sound');$(id).setAttribute('aria-pressed',String(sound));}audio.play('ui');}
$('sound').onclick=toggleSound;$('lobby-sound').onclick=toggleSound;
for(const id of ['music-volume','sfx-volume'])$(id).oninput=()=>audio.setVolumes(Number($('music-volume').value)/100,Number($('sfx-volume').value)/100);
document.addEventListener('fullscreenchange',()=>{const label=document.fullscreenElement?'Exit fullscreen':'Enter fullscreen';for(const id of ['fullscreen','lobby-fullscreen','online-fullscreen']){$(id).setAttribute('aria-label',label);$(id).title=label;}});
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('screen').requestFullscreen();}catch{$('status').textContent='FULLSCREEN IS UNAVAILABLE IN THIS BROWSER';}};
$('online-fullscreen').onclick=()=>$('fullscreen').click();
let helpPaused=false;
function openHelp(){helpPaused=started&&!paused;if(helpPaused)togglePause(true);$('help-panel').classList.remove('hidden');for(const id of ['menu','pause','game-hud','online-menu'])$(id).inert=true;$('help').setAttribute('aria-expanded','true');keys.clear();$('help-close').focus();}
function closeHelp(){const resume=helpPaused;helpPaused=false;$('help-panel').classList.add('hidden');for(const id of ['menu','pause','game-hud','online-menu'])$(id).inert=false;$('help').setAttribute('aria-expanded','false');if(resume)togglePause(false);else (started?$('pause-controls'):online.active?$('online-back'):$('lobby-help')).focus();}
$('help').onclick=openHelp;$('lobby-help').onclick=openHelp;$('pause-controls').onclick=openHelp;$('help-close').onclick=closeHelp;$('help-done').onclick=closeHelp;$('help-fullscreen').onclick=()=>$('fullscreen').click();
const controlRows=[['Move',['A D','← →','STICK / D-PAD']],['Jump / flutter',['W','↑','SOUTH']],['Crouch / drop',['S','↓','DOWN']],['Fire',['F','K','WEST']],['Grab / door / revive',['G','L','NORTH']],['Call',['Q','O','EAST']],['Strafe',['SHIFT','ENTER','LB']],['Pause',['ESC','ESC','START']],['Menu navigation',['TAB / SHIFT TAB','TAB / SHIFT TAB','UP / DOWN']],['Menu confirm / back',['ENTER / ESC','ENTER / ESC','SOUTH / EAST']]];
function showControls(layout){const index=['p1','p2','pad'].indexOf(layout);$('control-list').innerHTML=controlRows.map(([action,bindings])=>`<div class="control-row"><span>${action}</span><kbd>${bindings[index]}</kbd></div>`).join('');document.querySelectorAll('[data-controls]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.controls===layout)));}
document.querySelectorAll('[data-controls]').forEach(b=>b.onclick=()=>showControls(b.dataset.controls));showControls('p1');
$('pause-button').onclick=()=>togglePause();$('resume').onclick=()=>togglePause(false);
function lobby(caption=''){
 started=false;paused=false;keys.clear();accumulator=0;audio.setPaused(false);$('pause').classList.add('hidden');$('upgrade-menu').classList.add('hidden');$('menu').classList.remove('hidden');lobbyMenu.reset(caption);$('game-hud').classList.add('hidden');$('inventory').classList.add('hidden');$('status').classList.add('hidden');$('help-panel').classList.add('hidden');helpPaused=false;$('pause-button').disabled=true;$('pause-button').textContent='Ⅱ';$('pause-button').setAttribute('aria-label','Pause');$('announcement').textContent='';$('status').textContent='READY WHEN YOU ARE';state=createState(mode,lobbyMenu.options());hudKey='';scene();syncHud();
}
$('quit').onclick=()=>online.active?online.leave():lobby();
function pads(){return [...(navigator.getGamepads?.()||[])].filter(Boolean);}
function startMatch(options){
 const count=options.players,required=count>2?count-2:0;if(pads().length<required){lobbyMenu.notice(`Connect ${required} controller${required>1?'s':''} and press any button on each.`);return;}
 mode=options.mode;state=createState(mode==='duel'&&count===4?'party':mode,options);started=true;paused=false;keys.clear();accumulator=0;hudKey='';upgradeKey='';previousPads=pads().length;
 $('menu').classList.add('hidden');$('game-hud').classList.remove('hidden');$('inventory').classList.remove('hidden');$('status').classList.remove('hidden');$('pause').classList.add('hidden');$('help-panel').classList.add('hidden');for(const id of ['menu','pause','game-hud','online-menu'])$(id).inert=false;$('help').setAttribute('aria-expanded','false');$('pause-button').disabled=false;$('pause-button').textContent='Ⅱ';$('pause-button').setAttribute('aria-label','Pause');canvas.focus();audio.setPaused(false);scene();audio.unlock();syncHud();
}
function inputs(){
 const list=binds.map(binding=>Object.fromEntries(Object.entries(binding).map(([a,k])=>[a,keys.has(k)])));
 pads().forEach((g,index)=>{const id=online.active?0:state.count>2?index+2:index;if(online.active&&index>0)return;if(id>=state.count||mode==='practice'&&id>0)return;const pressed=n=>!!g.buttons[n]?.pressed,axis=g.axes[0]||0;
 const i={left:axis<-.25||pressed(14),right:axis>.25||pressed(15),down:(g.axes[1]||0)>.4||pressed(13),jump:pressed(0),fire:pressed(2),grab:pressed(3),chirp:pressed(1),strafe:pressed(4)};list[id]={...list[id]};for(const [k,v]of Object.entries(i))list[id][k]=!!list[id][k]||v;
 });if(online.active){for(const key of Object.keys(binds[0]))list[0][key]=!!list[0][key]||!!list[1][key];return [list[0]];}return list;
}
function controllerScope(){
 if(controllerKeyboard.target)return controllerKeyboard.scope();
 if(!$('help-panel').classList.contains('hidden'))return {key:'help',root:$('help-panel'),initial:()=>$('help-close'),back:closeHelp,start:closeHelp};
 if(paused)return {key:'pause',root:$('pause'),initial:()=>$('resume'),back:()=>togglePause(false),start:()=>togglePause(false)};
 if(started&&!$('upgrade-menu').classList.contains('hidden'))return {key:'upgrades',root:$('upgrade-menu'),initial:()=>$('upgrade-players').querySelector('button:not(:disabled)')||$('next-wave'),back:()=>togglePause(true),start:()=>$('next-wave').click()};
 if(started)return null;
 if(online.active)return {key:'online-'+(online.room?'room':'entry'),root:$('online-menu'),initial:()=>$(online.room?'online-ready':'online-create'),back:()=>{if(online.room?.players.find(p=>p.id===online.slot)?.ready)$('online-ready').click();else online.leave();},start:()=>$(online.room?'online-start':'online-create').click(),bumper:delta=>{const e=$('online-species'),count=e.options.length;e.selectedIndex=(e.selectedIndex+delta+count)%count;e.dispatchEvent(new Event('change',{bubbles:true}));return true;}};
 return lobbyMenu.controllerScope();
}
function controllerStatus(){
 const gs=pads();lobbyMenu.updateDevices(gs);
 menuController.poll(gs,controllerScope(),{secondary:(index,state,edge,old)=>{if(!started&&!online.active&&$('help-panel').classList.contains('hidden'))lobbyMenu.controllerSecondary(index,state,edge,old,menuController);},start:()=>{if(started)togglePause();else if(!online.active&&$('help-panel').classList.contains('hidden')&&lobbyMenu.allReady())lobbyMenu.confirm();}});
 if(started&&gs.length<previousPads){togglePause(true);$('status').textContent='CONTROLLER DISCONNECTED · PAUSED';}previousPads=gs.length;
}
function syncHud(){
 const key=JSON.stringify([started,state.mapIndex,state.phase,state.wave,state.round,state.scores,state.players.map(p=>[p.weapon,p.ammo,p.alive,p.downed,Math.ceil(p.hp),Math.ceil(p.bleed),p.points,p.kills])]);if(key===hudKey)return;hudKey=key;
 $('arena-label').textContent=state.map.name;$('arena-number').textContent=`${String(state.mapIndex+1).padStart(2,'0')} / ${MAPS.length} · ${state.map.size}`;
 $('scores').innerHTML=state.players.map((p,id)=>`<span style="--player-color:${COLORS[id]}"><i></i>${state.zombie?`P${id+1} <b class="hp-inline">${p.alive?Math.ceil(p.hp)+' HP':p.downed?'DOWN':'OUT'}</b>`:String(state.scores[id]).padStart(2,'0')}</span>`).join('');
 $('round-label').textContent=state.zombie?`WAVE ${state.wave}`:started?`ROUND ${String(state.round).padStart(2,'0')}`:'FIRST TO 10';
 if(!started){$('inventory').innerHTML='';return;}
 $('inventory').innerHTML=state.players.map(p=>`<div class="inventory-card" style="--player-color:${COLORS[p.id]}"><span class="player-badge">${mode==='practice'&&p.id===1?'BOT':'P'+(p.id+1)}</span><canvas data-player="${p.id}" aria-label="${p.weapon?WEAPONS[p.weapon].name:'Unarmed'}"></canvas><div><span class="ammo-count" aria-label="${p.downed?'Downed':!p.alive?'Eliminated':p.weapon?'Ammo':'Unarmed'}">${p.downed?'↓':!p.alive?'×':p.weapon?(p.ammo<0?'∞':p.ammo):'–'}</span>${state.zombie?`<div class="health-track${p.downed?' downed':''}"><i style="width:${p.hp/p.maxHp*100}%"></i></div>`:''}</div></div>`).join('');
 $('inventory').querySelectorAll('canvas').forEach(c=>{const p=state.players[Number(c.dataset.player)];art(c,x=>{if(p.weapon)drawWeaponIcon(x,30,21,p.weapon,1.1);else drawCharacter(x,{...p,x:22,y:20,dir:1,alive:true,weapon:null},{species:roster[p.id],color:COLORS[p.id]});},62,42);});
}
function syncUpgrades(){
 const visible=started&&!paused&&state.phase==='wave-break';$('upgrade-menu').classList.toggle('hidden',!visible);if(!visible)return;
 $('upgrade-countdown').textContent=`NEXT WAVE IN ${Math.ceil(state.timer)}s`;
 const host=online.room?.players.find(p=>p.id===online.slot)?.host;
 $('next-wave').disabled=online.active&&(!host||online.connection!=='connected');$('next-wave').textContent=online.active&&!host?'WAITING FOR HOST':'NEXT WAVE →';
 const key=JSON.stringify([state.wave,state.players.map(p=>[p.points,p.departed]),state.upgradeLevels,online.active,online.you,online.connection]);if(key===upgradeKey)return;upgradeKey=key;
 $('upgrade-players').innerHTML=state.players.filter(p=>!p.departed).map(p=>`<div class="upgrade-card"><h4 style="color:${COLORS[p.id]}">${online.active&&p.id===online.you?'YOU':'P'+(p.id+1)} · ${p.points} PTS</h4>${[['health','+25 HEALTH'],['damage','+15% DAMAGE'],['speed','+5% SPEED']].map(([type,label])=>`<button data-id="${p.id}" data-upgrade="${type}"${p.points<upgradeCost(state,p.id,type)||online.active&&(p.id!==online.you||online.connection!=='connected')?' disabled':''}>${label} <span>${upgradeCost(state,p.id,type)} PTS</span></button>`).join('')}</div>`).join('');
 $('upgrade-players').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(online.active){online.send({type:'upgrade',upgrade:b.dataset.upgrade});return;}buyUpgrade(state,Number(b.dataset.id),b.dataset.upgrade);syncUpgrades();syncHud();events();});
}
$('next-wave').onclick=()=>{if(state.phase==='wave-break'){if(online.active){online.send({type:'next-wave'});return;}beginWave(state);keys.clear();accumulator=0;syncUpgrades();events();canvas.focus();}};
function events(){for(const e of state.events){if(e.type==='round'||e.type==='wave')scene();if(e.type==='gameover'||e.match)scene();const worldX=state.players[e.id]?.x??e.x;audio.play(e.type==='hurt'?'hit':e.type==='death'&&e.downed?'down':e.type,{...e,x:Number.isFinite(worldX)?(worldX-camera.x)*camera.scale:undefined,species:roster[e.id],wave:state.wave});}state.events=[];}

const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);};
function label(text,x,y,color='#fff1d0',size=7){ctx.font=`bold ${size}px monospace`;ctx.textAlign='center';ctx.fillStyle='#172823';ctx.fillText(text,x+1,y+1);ctx.fillStyle=color;ctx.fillText(text,x,y);}
function playerArt(p){
 if(p.downed){drawCharacter(ctx,{...p,alive:true,weapon:null,vx:0,h:14,y:p.y+p.h-14},{species:roster[p.id],time:state.time,color:'#8c928a'});label(`P${p.id+1} DOWN · ${Math.ceil(p.bleed)}s`,p.x+8,p.y-9,'#ffbca0');rect(p.x-9,p.y-6,34,3,'#273d36');rect(p.x-9,p.y-6,34*p.revive/2,3,'#9ce0b6');return;}
 ctx.globalAlpha=p.invulnerable>0&&Math.floor(state.time*12)%2?.55:1;drawCharacter(ctx,p,{species:roster[p.id],time:state.time,color:COLORS[p.id]});ctx.globalAlpha=1;
 if(p.frozen>0){ctx.globalAlpha=.5;rect(p.x-4,p.y-8,24,p.h+9,'#bbecff');ctx.globalAlpha=1;}if(p.charge>0){rect(p.x-6,p.y-25,28,3,'#493c64');rect(p.x-6,p.y-25,28*p.charge,3,'#ceb0ff');}if(p.spin>0&&p.weapon==='minigun'){rect(p.x-6,p.y-25,28*p.spin,2,'#d7bd9a');}
 if(p.alive){label(online.active&&p.id===online.you?'YOU':mode==='practice'&&p.id===1?'BOT':`P${p.id+1}`,p.x+8,p.y+p.h-42,COLORS[p.id],Math.max(7,7/camera.scale));if(state.zombie){rect(p.x-3,p.y+p.h-39,22,2,'#243b33');rect(p.x-3,p.y+p.h-39,22*p.hp/p.maxHp,2,'#b0dda3');}}
}
function render(){
 ctx.setTransform(2,0,0,2,0,0);ctx.imageSmoothingEnabled=false;ctx.save();if(started&&state.shake)ctx.translate(Math.round((Math.random()-.5)*state.shake),Math.round((Math.random()-.5)*state.shake));ctx.fillStyle=state.map.theme==='neon'?'#1c213a':state.map.theme==='foundry'?'#3d323d':'#233b3b';ctx.fillRect(0,0,640,360);ctx.scale(camera.scale,camera.scale);ctx.translate(-camera.x,-camera.y);drawBackground(ctx,state.map,state.time,state.zombie&&started);drawArena(ctx,state.map,state.time);
 for(const item of state.items){const bob=Math.sin(state.time*3+item.x)*2;ctx.globalAlpha=.18;rect(item.x-12,item.y-12,40,25,WEAPONS[item.type]?.color||'#b4dda7');ctx.globalAlpha=1;
 if(WEAPONS[item.type]){drawWeapon(ctx,item.x+8,item.y+3+bob,item.type,1,{time:state.time,scale:.8});label(WEAPONS[item.type].name,item.x+8,item.y-15+bob,WEAPONS[item.type].color,6);}
 else {rect(item.x,item.y-2,14,12,item.type==='medkit'?'#e9e6ce':'#9aa66d');if(item.type==='medkit'){rect(item.x+5,item.y,4,8,'#c45848');rect(item.x+3,item.y+2,8,4,'#c45848');}else for(let n=0;n<3;n++)rect(item.x+2+n*4,item.y+1,2,6,'#efd092');}
 }
 for(const z of state.enemies){ctx.save();if(z.kind==='brute'){ctx.translate(z.x+8,z.y+22);ctx.scale(1.3,1.3);ctx.translate(-z.x-8,-z.y-22);}drawCharacter(ctx,z,{species:z.species,time:state.time,zombie:true,color:z.kind==='runner'?'#c37d77':z.kind==='brute'?'#b4a177':'#81988a'});ctx.restore();rect(z.x-2,z.y-20,20,2,'#2c3831');rect(z.x-2,z.y-20,20*z.hp/z.maxHp,2,'#cb866b');}
 if(started)state.players.forEach(playerArt);else state.players.slice(0,2).forEach((p,id)=>playerArt({...p,x:id?510:112,y:276,weapon:id?'railgun':'smg',alive:true}));
 for(const b of state.bullets){if(b.kind==='melee'){ctx.strokeStyle='#ffeab3';ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.hitbox.x+16,b.hitbox.y+14,19,-1,1);ctx.stroke();}else if(b.kind==='rocket')drawWeapon(ctx,b.x,b.y,'rocket',Math.sign(b.vx),{scale:.35});else if(b.kind==='plasma'){ctx.fillStyle='#bba0ff';ctx.beginPath();ctx.arc(b.x,b.y,5+(b.charged||0)*5,0,Math.PI*2);ctx.fill();rect(b.x-2,b.y-2,4,4,'#f5eaff');}else if(b.kind==='acid'){rect(b.x-3,b.y-3,7,6,'#c3ed78');rect(b.x-1,b.y-4,3,2,'#edfbaa');}else if(b.kind==='boomerang'){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(state.time*25);rect(-7,-2,14,4,'#f5d08b');rect(-7,-6,4,7,'#c29259');rect(3,-6,4,7,'#c29259');ctx.restore();}else if(b.kind==='freeze'){rect(b.x-4,b.y-1,8,2,'#bceeff');rect(b.x-1,b.y-4,2,8,'#e4ffff');}else if(b.kind==='flame'){rect(b.x-3,b.y-3,6,6,'#ffc466');rect(b.x,b.y,3,3,'#fff1ae');}else{rect(b.x-(b.kind==='rail'?18:5)*Math.sign(b.vx),b.y,b.kind==='rail'?24:b.kind==='bolt'?12:7,b.kind==='rail'?3:2,b.color||'#ffdf85');rect(b.x,b.y,2,2,'#fff6d7');}}
 drawBattleEffects(ctx,state,state.time);
 for(const g of state.grenades){drawWeapon(ctx,g.x,g.y,'grenade',1,{scale:.65});if(g.fuse<.6&&Math.floor(g.fuse*20)%2)rect(g.x-1,g.y-6,3,3,'#ff7458');}
 for(const p of state.particles){ctx.globalAlpha=Math.min(1,p.life*2);rect(p.x,p.y,Math.round(p.size),Math.round(p.size),p.color);}ctx.globalAlpha=1;drawWater(ctx,state.map,started?state.tide:state.map.height-8,state.time);
 ctx.restore();ctx.save();if(started&&!state.zombie&&state.roundTime>state.map.tideDelay-3&&state.phase==='playing')label(state.map.theme==='foundry'?'LAVA RISING':'HIGH TIDE INCOMING',320,25,'#ffe5aa',9);
 ctx.globalAlpha=.025;for(let y=0;y<360;y+=3)rect(0,y,640,1,'#172823');ctx.globalAlpha=1;ctx.restore();
 if(!started)return;
 if(state.phase==='countdown'){$('announcement').innerHTML=`${state.timer>.5?Math.ceil(state.timer+.4):'GO!'}${state.zombie?`<small>WAVE ${state.wave} · STAY TOGETHER</small>`:''}`;$('status').textContent=state.zombie?'THE HORDE IS COMING':'GET READY';}
 else if(state.phase==='playing'){$('announcement').textContent='';$('status').textContent=state.zombie?`SURVIVAL · ${state.enemies.length+state.remaining} HOSTILES REMAIN`:mode==='practice'?`PRACTICE · ${state.difficulty.toUpperCase()} BOT`:online.active?'ONLINE · LAST BILL STANDING':'LAST BILL STANDING';}
 else if(state.phase==='wave-break'){$('announcement').textContent='';$('status').textContent=`WAVE ${state.wave} CLEARED · SPEND YOUR POINTS`;}
 else if(state.phase==='game-over'){$('announcement').innerHTML=`THE HORDE WINS.<small>WAVE ${state.wave} · ${state.teamKills} TEAM KILLS</small>`;$('status').textContent='SURVIVAL OVER';if(!online.active&&state.timer<=0)lobby(`Survived to wave ${state.wave}. ${state.teamKills} team kills. Try again?`);}
 else {$('announcement').innerHTML=state.winner===null?'DOUBLE TROUBLE.<small>DRAW · NO POINTS</small>':`${mode==='practice'&&state.winner===1?'BOT':`P${state.winner+1}`} WINS!<small>${state.phase==='match-over'?state.scores.join(' – '):''}</small>`;if(!online.active&&state.phase==='match-over'&&state.timer<=0)lobby(`P${state.winner+1} WINS · ${state.scores.join(' – ')}`);}
}
export function getSnapshot(){return {started,paused,mode,online:online.snapshot(),camera:camera.snapshot(),world:{width:state.map.width,height:state.map.height,size:state.map.size},lobby:{stage:lobbyMenu.stage,ready:[...lobbyMenu.ready],active:lobbyMenu.active,roster:[...roster],options:lobbyMenu.options()},phase:state.phase,mapIndex:state.mapIndex,wave:state.wave,enemies:state.enemies.length,remaining:state.remaining,players:state.players.map(p=>({id:p.id,x:p.x,y:p.y,w:p.w,h:p.h,weapon:p.weapon,ammo:p.ammo,alive:p.alive,hp:p.hp,points:p.points})),audio:{state:audio.context?.state,voices:audio.voices.size,musicVolume:audio.musicVolume,sfxVolume:audio.sfxVolume,enabled:audio.enabled,scene:audio.scene,theme:audio.theme}};}
// Explicit QA-only hooks let integration tests exercise late-wave menus without waiting through a full match.
if(new URLSearchParams(location.search).has('qa'))window.billBrawlQA={state:()=>state,audio,disconnect:()=>online.ws?.close(),nextWave:()=>{state.phase='wave-break';state.timer=12;state.remaining=0;state.enemies=[];for(const p of state.players)p.points=800;upgradeKey='';}};
function frame(ms){const delta=Math.min(.1,(ms-last)/1000||0);last=ms;controllerStatus();if(online.active&&online.current){accumulator+=delta;while(accumulator>=1/60){online.step(paused||document.hidden||state.phase==='wave-break'?{}:inputs()[0]);accumulator-=1/60;}state=online.frame()||state;}else if(started&&!paused){accumulator+=delta;while(accumulator>=1/60){update(state,$('upgrade-menu').classList.contains('hidden')?inputs():{},1/60);accumulator-=1/60;}events();}else if(!started)state.time+=delta;if(started&&(!paused||online.active))camera.update(state.map,state.players,delta,state.round);else if(!started)camera.full(state.map);render();if(!started&&!online.active)lobbyMenu.draw(state.time);syncHud();syncUpgrades();requestAnimationFrame(frame);}
window.addEventListener('pagehide',()=>audio.setPaused(true));window.addEventListener('pageshow',()=>audio.setPaused(paused));
$('status').classList.add('hidden');syncHud();requestAnimationFrame(frame);
