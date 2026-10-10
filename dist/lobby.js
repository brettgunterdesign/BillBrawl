import {MAPS,COLORS} from './engine.js';
import {SPECIES,drawCharacter,drawWeaponIcon} from './sprites.js';
import {drawBackground,drawArena,drawWater} from './world.js';
const $=id=>document.getElementById(id);
const MODE_NAMES={duel:'CLASSIC BRAWL',practice:'BOT PRACTICE',zombie:'HORDE SURVIVAL'};
const PERSONALITIES={platypus:'Paddle tail. Big main-character energy.',duck:'The original troublemaker.',pelican:'Big bill. Bigger appetite for chaos.',toucan:'Loud colours. Louder attitude.',puffin:'Small bird. Absolutely no fear.',shoebill:'The stare that starts a fight.'};
const ARENA_DESCRIPTIONS=['Harbour cranes, stacked platforms, and a tide with other plans.','Leap between rooftops. Long sightlines reward a steady bill.','Pipes, tight corners, and plenty of industrial-strength trouble.','Ancient ruins. Jungle canopy. Modern bad decisions.','After dark, every bill has a price. Welcome to the night market.','Slippery footing. Cold water. Keep your cool.','A factory floor with a lava problem. Things are heating up.'];
const wrap=(n,max)=>(n+max)%max;
export class ArcadeLobby{
 constructor({audio,roster,onPreview,onStart,onFullscreen}){
  this.audio=audio;this.roster=roster;this.onPreview=onPreview;this.onStart=onStart;this.mode='duel';this.count=2;this.difficulty='normal';this.arena=0;this.stage='mode';this.active=0;this.ready=Array(4).fill(false);this.padPrevious=new Map();this.devices=0;this.chirpUntil=Array(4).fill(0);this.time=0;this.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>this.chooseMode(b.dataset.mode));
  $('mode-next').onclick=()=>this.show('crew');$('crew-back').onclick=()=>this.show('mode');$('arena-back').onclick=()=>this.show('crew');$('crew-next').onclick=()=>{if(this.allReady())this.show('arena');};
  $('arena-prev').onclick=()=>this.chooseArena(this.arena-1);$('arena-next').onclick=()=>this.chooseArena(this.arena+1);$('start').onclick=()=>this.launch();$('lobby-fullscreen').onclick=onFullscreen;
  $('arena-dots').innerHTML=MAPS.map((m,id)=>`<button data-arena="${id}" aria-label="${m.name}" aria-pressed="${id===0}">${String(id+1).padStart(2,'0')}</button>`).join('');
  $('arena-dots').querySelectorAll('button').forEach(b=>b.onclick=()=>this.chooseArena(Number(b.dataset.arena)));
  $('species-choices').innerHTML=SPECIES.map(name=>`<button data-species="${name}" aria-label="Choose ${name}" aria-pressed="false"><canvas width="144" height="86" aria-hidden="true"></canvas><small>${name.toUpperCase()}</small></button>`).join('');
  $('species-choices').querySelectorAll('button').forEach(b=>b.onclick=()=>this.chooseSpecies(this.active,b.dataset.species));
  this.configure();this.crewUI();this.arenaUI();this.sync();this.preview();
 }
 options(){return {mode:this.mode,players:this.mode==='practice'?1:this.count,arena:this.arena,difficulty:this.difficulty};}
 allReady(){return this.ready.slice(0,this.options().players).every(Boolean);}
 cue(type='ui',data={}){this.audio.unlock();this.audio.play(type,data);}
 preview(){this.onPreview(this.options());}
 chooseMode(mode){if(!MODE_NAMES[mode])return;const changed=mode!==this.mode;this.mode=mode;if(changed){this.ready.fill(false);this.active=0;if(mode==='practice')this.count=1;else if(mode==='duel'&&![2,4].includes(this.count))this.count=2;}this.configure();this.crewUI();this.sync();this.preview();this.cue();}
 configure(){
  document.querySelectorAll('[data-mode]').forEach(b=>{const selected=b.dataset.mode===this.mode;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
  $('mode-detail').textContent=this.mode==='zombie'?'ONE CREW. ENDLESS WAVES. STAY TOGETHER.':this.mode==='practice'?'LEARN THE MOVES. MAKE THE BOT REGRET IT.':'ONE HIT. TEN WINS. NO HARD FEELINGS.';
  $('crew-mode').textContent=MODE_NAMES[this.mode]+' / CHARACTER SELECT';
  $('players-label').classList.toggle('hidden',this.mode==='practice');$('difficulty-label').classList.toggle('hidden',this.mode!=='practice');
  $('player-choices').innerHTML=(this.mode==='zombie'?[1,2,3,4]:[2,4]).map(n=>`<button data-count="${n}" class="${n===this.count?'selected':''}" aria-label="${n} players" aria-pressed="${n===this.count}">${n}</button>`).join('');
  $('player-choices').querySelectorAll('button').forEach(b=>b.onclick=()=>this.setCount(Number(b.dataset.count)));
  $('difficulty-choices').innerHTML=['easy','normal','hard'].map(d=>`<button data-difficulty="${d}" class="${d===this.difficulty?'selected':''}" aria-pressed="${d===this.difficulty}">${d.toUpperCase()}</button>`).join('');
  $('difficulty-choices').querySelectorAll('button').forEach(b=>b.onclick=()=>this.setDifficulty(b.dataset.difficulty));
 }
 setCount(count){this.count=count;this.ready.fill(false);this.active=Math.min(this.active,count-1);this.configure();this.crewUI();this.sync();this.preview();this.cue();}
 setDifficulty(difficulty){this.difficulty=difficulty;this.configure();this.crewUI();this.sync();this.cue();}
 cycleSetup(delta){if(this.mode==='practice'){const choices=['easy','normal','hard'];this.setDifficulty(choices[wrap(choices.indexOf(this.difficulty)+delta,3)]);}else {const choices=this.mode==='zombie'?[1,2,3,4]:[2,4];this.setCount(choices[wrap(choices.indexOf(this.count)+delta,choices.length)]);}}
 crewUI(){
  const count=this.mode==='practice'?2:this.count;$('roster').style.setProperty('--crew-count',count);$('roster').dataset.count=String(count);
  $('roster').innerHTML=Array.from({length:count},(_,id)=>{const bot=this.mode==='practice'&&id===1;return `<article class="crew-slot${bot?' bot':''}" data-slot="${id}" style="--player-color:${COLORS[id]}"><div class="slot-header"><button class="slot-player" data-active="${id}"${bot?' disabled':''}>${bot?'RIVAL BOT':'PLAYER '+String(id+1).padStart(2,'0')}</button><span class="slot-device">${bot?'AI · '+this.difficulty.toUpperCase():this.deviceName(id)}</span></div><canvas class="crew-portrait" width="400" height="280" aria-label="${this.roster[id]} preview"></canvas><div class="crew-species"><button class="species-arrow" data-cycle="-1" aria-label="Previous species for player ${id+1}"${bot?' disabled':''}>‹</button><h3>${this.roster[id]}</h3><button class="species-arrow" data-cycle="1" aria-label="Next species for player ${id+1}"${bot?' disabled':''}>›</button></div><p class="species-tagline">${bot?'A worthy rival. A very punchable bill.':PERSONALITIES[this.roster[id]]}</p><button class="ready-button" data-ready="${id}" aria-pressed="false"${bot?' disabled':''}>${bot?'AI OPPONENT':'LOCK IN →'}</button><span class="slot-keys">${bot?'HUNTS · JUMPS · FIGHTS':id===0?'A / D SELECT · F READY':id===1?'← / → SELECT · K READY':'STICK SELECT · SOUTH READY'}</span></article>`;}).join('');
  $('roster').querySelectorAll('[data-active]').forEach(b=>b.onclick=()=>{this.active=Number(b.dataset.active);this.sync();this.cue();});
  $('roster').querySelectorAll('[data-cycle]').forEach(b=>b.onclick=()=>this.cycleSpecies(Number(b.closest('[data-slot]').dataset.slot),Number(b.dataset.cycle)));
  $('roster').querySelectorAll('[data-ready]').forEach(b=>b.onclick=()=>this.toggleReady(Number(b.dataset.ready)));
 }
 deviceName(id){if(this.options().players>2)return id<2?'KEYBOARD '+(id+1):'CONTROLLER '+(id-1);return id<this.devices?'KEYBOARD / PAD':'KEYBOARD';}
 chooseSpecies(id,name){if(!SPECIES.includes(name)||id>=this.options().players)return;if(this.ready[id]){this.notice('Unlock your character before changing species.');return;}this.active=id;this.roster[id]=name;this.chirpUntil[id]=this.time+.4;const slot=$('roster').querySelector(`[data-slot="${id}"]`);slot.querySelector('h3').textContent=name;slot.querySelector('.species-tagline').textContent=PERSONALITIES[name];slot.querySelector('canvas').setAttribute('aria-label',name+' preview');this.sync();this.cue('chirp',{species:name,x:id*180});}
 cycleSpecies(id,step){this.chooseSpecies(id,SPECIES[wrap(SPECIES.indexOf(this.roster[id])+step,SPECIES.length)]);}
 toggleReady(id,force){if(id>=this.options().players)return;this.active=id;this.ready[id]=force??!this.ready[id];this.chirpUntil[id]=this.time+.45;this.cue(this.ready[id]?'pickup':'ui');this.sync();}
 notice(text){$('mode-note').textContent=text;$('mode-note').classList.add('lobby-error');this.errorUntil=this.time+4;}
 sync(){
  const stages=['mode','crew','arena'];document.querySelectorAll('[data-step]').forEach(n=>{n.classList.toggle('current',n.dataset.step===this.stage);n.classList.toggle('complete',stages.indexOf(n.dataset.step)<stages.indexOf(this.stage));if(n.dataset.step===this.stage)n.setAttribute('aria-current','step');else n.removeAttribute('aria-current');});
  for(let id=0;id<this.options().players;id++){const slot=$('roster').querySelector(`[data-slot="${id}"]`);if(!slot)continue;slot.classList.toggle('active',this.active===id);slot.classList.toggle('ready',this.ready[id]);slot.querySelector('.slot-device').textContent=this.deviceName(id);const b=slot.querySelector('[data-ready]');b.textContent=this.ready[id]?'✓ READY · UNLOCK':'LOCK IN →';b.setAttribute('aria-pressed',String(this.ready[id]));slot.querySelectorAll('[data-cycle]').forEach(b=>b.disabled=this.ready[id]);}
  $('crew-next').disabled=!this.allReady();$('ready-status').textContent=`${this.ready.slice(0,this.options().players).filter(Boolean).length} / ${this.options().players} PLAYERS READY`;
  $('species-prompt').textContent=`P${this.active+1} · ${this.ready[this.active]?'LOCKED IN':'PICK A BILL'}`;$('species-choices').parentElement.style.setProperty('--active-color',COLORS[this.active]);
  $('species-choices').querySelectorAll('button').forEach(b=>{const selected=b.dataset.species===this.roster[this.active];b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));b.disabled=this.ready[this.active];this.speciesIcon(b.querySelector('canvas'),b.dataset.species);});
  $('start').firstChild.textContent=this.mode==='zombie'?'FACE THE HORDE ':'LET’S BRAWL ';
  $('match-summary').textContent=MODE_NAMES[this.mode]+' · '+(this.mode==='practice'?this.difficulty+' BOT':this.count+' PLAYERS');
  $('menu-hint').innerHTML=this.stage==='crew'?'<kbd>A D</kbd> P1 <kbd>← →</kbd> P2 <kbd>F / K</kbd> READY':this.stage==='arena'?'<kbd>←</kbd><kbd>→</kbd> ARENA <kbd>ENTER</kbd> BRAWL':'<kbd>←</kbd><kbd>→</kbd> SELECT <kbd>ENTER</kbd> CONFIRM';
  if(!this.errorUntil||this.errorUntil<this.time){$('mode-note').classList.remove('lobby-error');$('mode-note').textContent=this.stage==='crew'?'W / S OR LB / RB: MATCH OPTIONS':this.stage==='arena'?(this.mode==='zombie'?'SURVIVAL STAYS IN THIS WORLD':'ARENAS ROTATE EACH ROUND'):'KEYBOARD + CONTROLLERS WELCOME';}
 }
 show(stage,{focus=true}={}){this.stage=stage;this.errorUntil=0;document.querySelectorAll('[data-stage]').forEach(n=>n.classList.toggle('hidden',n.dataset.stage!==stage));this.sync();this.cue();if(focus){const h=$('stage-'+stage).querySelector('h2');h.tabIndex=-1;h.focus({preventScroll:true});}}
 reset(caption){this.ready.fill(false);this.active=0;this.crewUI();$('menu-caption').textContent=caption;this.show('mode',{focus:false});}
 arenaUI(){const m=MAPS[this.arena];$('arena-name').textContent=m.name;$('arena-tag').textContent=m.tag;$('arena-description').textContent=ARENA_DESCRIPTIONS[this.arena];$('arena-counter').textContent=`0${this.arena+1} / 07`;$('arena-preview').setAttribute('aria-label',m.name+' preview');$('arena-dots').querySelectorAll('button').forEach(b=>{const selected=Number(b.dataset.arena)===this.arena;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});}
 chooseArena(id){this.arena=wrap(id,MAPS.length);this.arenaUI();this.preview();this.cue();}
 launch(){if(!this.allReady()){this.show('crew');return;}const needed=Math.max(0,this.options().players-2);if(this.devices<needed){this.notice(`Connect ${needed} controller${needed===1?'':'s'} for players 3${needed>1?'–4':''}.`);return;}this.onStart(this.options());}
 confirm(){if(this.stage==='mode')this.show('crew');else if(this.stage==='crew'){if(this.allReady())this.show('arena');else this.toggleReady(this.active,true);}else this.launch();}
 back(){if(this.stage==='arena')this.show('crew');else if(this.stage==='crew')this.show('mode');}
 handleKey(e){
  if(e.altKey||e.ctrlKey||e.metaKey||e.repeat)return false;
  const native=(e.target.closest?.('button')&&['Enter','Space'].includes(e.code))||e.target.closest?.('input,select,textarea');if(native)return false;
  const code=e.code;
  if(code==='Escape'){this.back();return true;}
  if(code==='Enter'||code==='Space'){if(this.stage==='crew'&&!this.allReady()){this.notice('Lock in every player to choose the arena.');}else this.confirm();return true;}
  if(this.stage==='crew'){
   if(code==='KeyW'||code==='KeyS'){this.cycleSetup(code==='KeyW'?1:-1);return true;}
   const id=['ArrowLeft','ArrowRight','KeyK','KeyL'].includes(code)&&this.options().players>1?1:0;
   if(['KeyA','KeyD','ArrowLeft','ArrowRight'].includes(code)){this.cycleSpecies(id,code==='KeyA'||code==='ArrowLeft'?-1:1);return true;}
   if(['KeyF','KeyK'].includes(code)){this.toggleReady(id,true);return true;}
   if(['KeyG','KeyL'].includes(code)){this.toggleReady(id,false);return true;}
  }else if(['KeyA','KeyD','ArrowLeft','ArrowRight'].includes(code)){const delta=code==='KeyA'||code==='ArrowLeft'?-1:1;if(this.stage==='mode')this.chooseMode(['duel','practice','zombie'][wrap(['duel','practice','zombie'].indexOf(this.mode)+delta,3)]);else this.chooseArena(this.arena+delta);return true;}
  return false;
 }
 poll(controllers){
  if(this.devices!==controllers.length){this.devices=controllers.length;this.sync();$('pad-indicator').innerHTML=`<i></i>${controllers.length?controllers.length+' PAD'+(controllers.length>1?'S':'')+' CONNECTED':'LOCAL ARCADE'}`;}
  const current=new Map();
  controllers.forEach((g,index)=>{const id=this.options().players>2?index+2:index,prev=this.padPrevious.get(g.index)||{},press=n=>!!g.buttons[n]?.pressed,dir=(g.axes[0]||0)<-.5||press(14)?-1:(g.axes[0]||0)>.5||press(15)?1:0,a=press(0),b=press(1),start=press(9),lb=press(4),rb=press(5);current.set(g.index,{dir,a,b,start,lb,rb});
   if(this.stage==='crew'&&index===0&&((lb&&!prev.lb)||(rb&&!prev.rb))){this.cycleSetup(rb?1:-1);return;}
   if(this.stage==='crew'&&id<this.options().players){if(dir&&dir!==prev.dir)this.cycleSpecies(id,dir);if(a&&!prev.a)this.toggleReady(id,true);if(b&&!prev.b){if(this.ready[id])this.toggleReady(id,false);else this.back();}if(start&&!prev.start&&this.allReady())this.show('arena');}
   else if(index===0){if(dir&&dir!==prev.dir){if(this.stage==='mode')this.chooseMode(['duel','practice','zombie'][wrap(['duel','practice','zombie'].indexOf(this.mode)+dir,3)]);else if(this.stage==='arena')this.chooseArena(this.arena+dir);}if(a&&!prev.a)this.confirm();if(b&&!prev.b)this.back();}
  });this.padPrevious=current;
 }
 speciesIcon(canvas,name){const c=canvas.getContext('2d');c.setTransform(2,0,0,2,0,0);c.clearRect(0,0,72,43);c.imageSmoothingEnabled=false;drawCharacter(c,{id:this.active,x:25,y:17,w:16,h:22,dir:1,vx:0,alive:true},{species:name,color:COLORS[this.active]});}
 draw(time){
  this.time=time;if(this.errorUntil&&this.errorUntil<time){this.errorUntil=0;this.sync();}const t=this.reducedMotion?0:time;
  if(this.stage==='mode')document.querySelectorAll('.mode-card').forEach((card,index)=>{const c=card.querySelector('canvas').getContext('2d');c.setTransform(.7,0,0,.7,0,0);c.imageSmoothingEnabled=false;const map=MAPS[[0,1,4][index]];drawBackground(c,map,t,index===2);c.fillStyle='#142f36';c.fillRect(0,318,640,42);c.fillStyle='#b4ba8c';c.fillRect(0,315,640,4);c.save();c.translate(320,318);c.scale(2.35,2.35);c.translate(-320,-318);const p=(id,x,dir,weapon)=>({id,x,y:296+Math.sin(t*2+id)*1.3,w:16,h:22,dir,vx:28,alive:true,weapon,flash:Math.sin(t*4+id)> .95?.1:0});
   drawCharacter(c,p(0,269,1,index===2?'shotgun':'smg'),{species:'platypus',time:t,color:COLORS[0]});drawCharacter(c,p(1,355,-1,index===1?'railgun':null),{species:index===1?'shoebill':index===2?'duck':'toucan',time:t,color:COLORS[1],zombie:index===2});if(index===2)drawCharacter(c,p(2,395,-1,null),{species:'puffin',time:t,zombie:true});c.restore();});
  else if(this.stage==='crew')$('roster').querySelectorAll('.crew-portrait').forEach((canvas,id)=>{const c=canvas.getContext('2d');c.setTransform(2,0,0,2,0,0);c.imageSmoothingEnabled=false;c.clearRect(0,0,200,140);const ready=this.ready[id],bot=this.mode==='practice'&&id===1;
   const glow=c.createRadialGradient(100,100,0,100,100,74);glow.addColorStop(0,COLORS[id]+'33');glow.addColorStop(1,COLORS[id]+'00');c.fillStyle=glow;c.fillRect(0,0,200,140);c.fillStyle='#142826';c.fillRect(39,124,122,6);c.fillStyle=ready?COLORS[id]:'#537364';c.fillRect(32,121,136,3);c.fillStyle='#385349';c.fillRect(39,130,122,3);c.save();c.translate(100,121+(ready?0:Math.sin(t*2.5+id)*1.4));c.scale(2.75,2.75);drawCharacter(c,{id,x:-8,y:-22,w:16,h:22,dir:1,vx:ready?0:35,alive:true,chirp:this.chirpUntil[id]>time?.3:0,weapon:bot?'pistol':null},{species:this.roster[id],time:t,color:COLORS[id]});c.restore();
   if(ready&&!this.reducedMotion){c.fillStyle=COLORS[id];for(let n=0;n<5;n++){const x=45+n*28,y=95-((t*14+n*27)%85);c.globalAlpha=.35;c.fillRect(x,y,2,2);}c.globalAlpha=1;}
  });
  else if(this.stage==='arena'){const c=$('arena-preview').getContext('2d'),map=MAPS[this.arena];c.imageSmoothingEnabled=false;drawBackground(c,map,t,this.mode==='zombie');drawArena(c,map);drawWater(c,map,352,t);map.items.forEach(([x,y,type])=>drawWeaponIcon(c,x+8,y+3+Math.sin(t*2+x),type,.65));}
 }
}
