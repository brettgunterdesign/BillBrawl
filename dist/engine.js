import {MAPS,WEAPONS,mapForMode} from './content.js';
import {collisionTerrain,terrainForMap,toggleDoor,breakTerrain,blastTerrain,addField,updateTerrain,footing} from './terrain.js';
export {MAPS,WEAPONS};
export const WIDTH=640,HEIGHT=360,COLORS=['#ffcc64','#8eb6e6','#e98b89','#99c998'];
export const JUMP_SPEED=380;
export const BOT_DIFFICULTIES=Object.freeze({
 beginner:Object.freeze({reaction:1.2,burst:.04,pause:1.6,aimSpread:.18,alignment:10,retreat:0,dodge:0,description:'Plenty of reaction time, imperfect aim, no dodging.'}),
 easy:Object.freeze({reaction:.8,burst:.08,pause:1,aimSpread:.08,alignment:12,retreat:0,dodge:0,description:'Slower reactions, short bursts, no dodging.'}),
 normal:Object.freeze({reaction:.35,burst:.3,pause:.45,aimSpread:.02,alignment:16,retreat:.35,dodge:1.2,description:'Balanced reactions and occasional dodging.'}),
 hard:Object.freeze({reaction:.1,burst:1.2,pause:.08,aimSpread:0,alignment:20,retreat:.55,dodge:.35,description:'Quick reactions, accurate aim, frequent dodging.'})
});
export const DEFAULT_BOT_DIFFICULTY='easy';
export const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function segmentRect(x1,y1,x2,y2,r){let lo=0,hi=1;for(const [p,d,min,max] of [[x1,x2-x1,r.x,r.x+r.w],[y1,y2-y1,r.y,r.y+r.h]]){if(Math.abs(d)<1e-9){if(p<min||p>max)return null;}else{let a=(min-p)/d,b=(max-p)/d;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return null;}}return lo;}
const emptyInput=()=>({left:false,right:false,jump:false,down:false,fire:false,grab:false,chirp:false,strafe:false});
const emit=(s,type,data={})=>s.events.push({type,...data});
export function createState(mode='duel',options={}){
 const zombie=mode==='zombie',count=zombie?clamp(options.players||1,1,4):mode==='party'?4:2;
 const start=Number.isInteger(options.arena)&&options.arena>=0&&options.arena<MAPS.length?options.arena:0;
 const s={mode,zombie,count,difficulty:Object.hasOwn(BOT_DIFFICULTIES,options.difficulty)?options.difficulty:DEFAULT_BOT_DIFFICULTY,scores:Array(count).fill(0),round:0,mapIndex:start-1,startArena:start,phase:'countdown',timer:0,time:0,roundTime:0,players:[],items:[],bullets:[],grenades:[],particles:[],events:[],winner:null,shake:0,tide:352,wave:0,enemies:[],remaining:0,spawnClock:0,nextEntity:100,teamKills:0,upgradeLevels:Array.from({length:count},()=>({health:0,damage:0,speed:0})),navigation:null};
 startRound(s);return s;
}
function makePlayer(s,id,x,y){const level=s.upgradeLevels[id];return{id,x,y,w:16,h:22,vx:0,vy:0,dir:id%2?-1:1,alive:true,downed:false,bleed:0,revive:0,hp:100+level.health*25,maxHp:100+level.health*25,damageScale:1+level.damage*.15,speedScale:1+level.speed*.05,invulnerable:0,ground:false,coyote:0,buffer:0,cooldown:0,weapon:s.zombie?'pistol':null,ammo:s.zombie?WEAPONS.pistol.ammo:0,previous:emptyInput(),chirp:0,flash:0,botTime:0,brain:{jumpHeld:0,jumpRest:0,lastX:x,stuck:0,shootAt:0},points:0,kills:0};}
function makeItem(x,y,type,extra={}){return{x,y,w:16,h:9,type,ammo:WEAPONS[type]?.ammo??0,vx:0,vy:0,lock:0,...extra};}
export function startRound(s){
 s._terrainCache=null;s.round++;s.mapIndex=(s.mapIndex+1)%MAPS.length;s.map=mapForMode(s.mapIndex,s.zombie);s.roundTime=0;s.phase='countdown';s.timer=1.6;s.winner=null;s.tide=s.map.height-8;s.bullets=[];s.grenades=[];s.particles=[];s.shake=0;s.fields=[];s.traps=[];s.effects=[];s.salvos=[];s.pendingExplosions=[];s.terrainDirty=false;s.navigation=buildNavigation(s.map,s.zombie?65:undefined);
 s.players=s.map.spawn.slice(0,s.count).map(([x,y],id)=>makePlayer(s,id,x,y));s.items=s.map.items.map(([x,y,type])=>makeItem(x,y,type));
 if(s.zombie){s.wave=1;s.enemies=[];s.remaining=waveCount(s);s.spawnClock=1;s.supplyClock=8;emit(s,'wave',{wave:1});}else emit(s,'round',{round:s.round});
}
function particles(s,x,y,color,n=12){const count=Math.min(n,Math.max(0,420-s.particles.length));for(let i=0;i<count;i++)s.particles.push({x,y,vx:(Math.random()-.5)*220,vy:-Math.random()*180,life:.35+Math.random()*.5,color,size:1+Math.random()*2});}
function dropWeapon(s,p,throwing=false){if(!p.weapon)return;s.items.push(makeItem(p.x+8+p.dir*14,p.y+7,p.weapon,{ammo:p.ammo,vx:throwing?p.dir*230:p.vx*.5,vy:throwing?-150:-60,lock:.25,age:0}));p.weapon=null;p.ammo=0;p.charge=0;p.spin=0;}
export function killPlayer(s,p){if(!p.alive)return;p.alive=false;p.hp=0;p.vy=-130;p.vx=-p.dir*55;p.downed=s.zombie&&s.players.filter(p=>!p.departed).length>1;p.bleed=18;p.revive=0;particles(s,p.x+8,p.y+8,COLORS[p.id],20);emit(s,'death',{id:p.id,downed:p.downed});s.shake=Math.max(s.shake,4);if(!p.downed)dropWeapon(s,p);}
function hurt(s,p,damage,deaths){if(!p.alive||p.invulnerable>0)return;if(!s.zombie){deaths.add(p);return;}p.hp-=damage;p.invulnerable=.6;p.vx=-p.dir*100;p.vy=-90;emit(s,'hurt',{id:p.id});particles(s,p.x+8,p.y+8,'#e99580',6);if(p.hp<=0)deaths.add(p);}
function hitEnemy(s,z,damage,owner){if(!z.alive)return;z.hp-=damage;z.flash=.1;z.vx+=z.x>(owner?.x??z.x)?45:-45;emit(s,'zombie-hit');if(z.hp>0)return;z.alive=false;s.teamKills++;if(owner){owner.points+=100;owner.kills++;}particles(s,z.x+8,z.y+9,z.kind==='brute'?'#ccaf82':'#a2b38b',16);emit(s,'zombie-death');if(Math.random()<.14)s.items.push(makeItem(z.x,z.y,'medkit'));else if(Math.random()<.25)s.items.push(makeItem(z.x,z.y,'ammo'));}
function grab(s,p){let nearest=null,d=38;for(const i of s.items){if(!WEAPONS[i.type])continue;const next=Math.hypot(i.x+8-p.x-8,i.y+4-p.y-11);if(i.lock<=0&&next<d){nearest=i;d=next;}}
 // An unarmed player can collect nearby loot instead of repeatedly toggling a doorway.
 if(toggleDoor(s,p,!p.weapon&&nearest?d:43))return;if(p.weapon){dropWeapon(s,p,true);emit(s,'throw');return;}if(nearest){p.weapon=nearest.type;p.ammo=nearest.ammo;s.items.splice(s.items.indexOf(nearest),1);emit(s,'pickup',{id:p.id,weapon:p.weapon});}}
function spawnShot(s,p,weapon,extra={}){
 const def=WEAPONS[weapon],count=def.pellets||1;
 for(let n=0;n<count;n++){
  const aimSpread=s.mode==='practice'&&p.id===1?BOT_DIFFICULTIES[s.difficulty].aimSpread:0;
  const spread=(count===1?0:(n/(count-1)*2-1)*def.spread)+(Math.random()*2-1)*aimSpread;
  s.bullets.push({id:s.nextEntity++,x:p.x+8+p.dir*6,y:p.y+9,vx:p.dir*def.speed,vy:(def.launchY||0)+spread*def.speed,
   owner:p.id,weapon,kind:def.kind==='burst'?'bullet':def.kind,damage:def.damage*p.damageScale,life:def.life||1.4,age:0,
   bounces:def.bounces||0,hitIds:[],color:def.color,gravity:def.gravity||0,remaining:def.range||1000,radius:def.radius,...extra});
 }
 p.vx-=p.dir*(def.recoil||0);p.flash=.1;
}
function fire(s,p,deaths,charge=1){
 if(!p.weapon||p.cooldown>0)return;const def=WEAPONS[p.weapon];p.cooldown=def.cooldown;
 if(p.ammo===0){emit(s,'empty',{id:p.id});return;}
 const ammo=def.kind==='burst'?Math.min(3,p.ammo):1;if(p.ammo>0)p.ammo-=ammo;
 p.flash=.1;emit(s,'shot',{weapon:p.weapon,id:p.id});
 if(def.kind==='grenade'||def.kind==='cluster'){
  s.grenades.push({id:s.nextEntity++,x:p.x+8,y:p.y+6,vx:p.dir*def.throwSpeed+p.vx*.4,vy:def.throwY,fuse:def.fuse,owner:p.id,w:6,h:6,damage:def.damage*p.damageScale,radius:def.radius,cluster:def.kind==='cluster',weapon:p.weapon});
 }else if(def.kind==='mine'){
  if(s.traps.length>=16)s.traps.shift();s.traps.push({x:p.x+8+p.dir*16,y:p.y+10,w:14,h:6,vy:0,owner:p.id,life:def.life,arm:.7,ground:false,damage:def.damage*p.damageScale,radius:def.radius});
 }else if(def.kind==='tesla'){
  const targets=(s.zombie?s.enemies:s.players).filter(t=>t.alive&&t.id!==p.id),hit=new Set();let from=p,range=def.range,points=[{x:p.x+8+p.dir*15,y:p.y+8}];
  for(let n=0;n<def.chains;n++){
   const next=targets.filter(t=>!hit.has(t.id)&&Math.hypot(t.x-from.x,t.y-from.y)<range&&visible(s,from,t)).sort((a,b)=>Math.hypot(a.x-from.x,a.y-from.y)-Math.hypot(b.x-from.x,b.y-from.y))[0];
   if(!next)break;hit.add(next.id);s.zombie?hitEnemy(s,next,def.damage*p.damageScale,p):hurt(s,next,def.damage,deaths);points.push({x:next.x+8,y:next.y+10});from=next;range=def.chainRange;
  }
  if(points.length===1)points.push({x:p.x+8+p.dir*def.range,y:p.y+8});s.effects.push({kind:'arc',points,color:def.color,life:.22});
 }else if(def.kind==='melee'){
  s.bullets.push({id:s.nextEntity++,x:p.x+8,y:p.y+10,vx:0,vy:0,owner:p.id,kind:'melee',hitbox:{x:p.dir>0?p.x+p.w:p.x-def.reach,y:p.y-3,w:def.reach,h:p.h+6},damage:def.damage*p.damageScale,life:.08,age:0,hitIds:[],terrainHits:[]});
 }else{
  spawnShot(s,p,p.weapon,def.kind==='plasma'?{damage:def.damage*p.damageScale*(.4+charge*.8),radius:26+def.radius*charge,charged:charge}:{});
  if(def.kind==='burst')for(let n=1;n<ammo;n++)s.salvos.push({owner:p.id,weapon:p.weapon,delay:n*.075});
 }
 s.shake=Math.max(s.shake,['shotgun','blunderbuss','rocket','cluster'].includes(p.weapon)?2:1);
}
export function moveBody(p,platforms,dt,drop=false,width=WIDTH){p.x+=p.vx*dt;for(const b of platforms)if(!b.oneWay&&overlap(p,b)){if(p.vx>0)p.x=b.x-p.w;else if(p.vx<0)p.x=b.x+b.w;p.vx=0;}p.x=clamp(p.x,0,width-p.w);const bottom=p.y+p.h;p.y+=p.vy*dt;p.ground=false;for(const b of platforms){if(!overlap(p,b))continue;if(p.vy>=0&&bottom<=b.y+2&&!(b.oneWay&&drop)){p.y=b.y-p.h;p.vy=0;p.ground=true;}else if(!b.oneWay&&p.vy<0){p.y=b.y+b.h;p.vy=0;}}}
export function buildNavigation(map,maxRise=Math.floor(JUMP_SPEED*JUMP_SPEED/1700-8)){const nodes=terrainForMap(map).filter(b=>b.type!=='door').map((p,id)=>({...p,id}));const edges=nodes.map(()=>[]);for(const a of nodes)for(const b of nodes){if(a===b)continue;const gap=Math.max(0,b.x-(a.x+a.w),a.x-(b.x+b.w)),rise=a.y-b.y;if(rise<=maxRise&&rise>=-200&&gap<=(rise>0?115:165)&&!(gap>65&&rise>45))edges[a.id].push(b.id);}return{nodes,edges};}
function platformUnder(s,entity){let best=null,d=Infinity;const feet=entity.y+(entity.h||9),x=entity.x+(entity.w||16)/2;for(const n of s.navigation.nodes){if(x>=n.x-3&&x<=n.x+n.w+3&&n.y>=feet-4&&n.y-feet<d){best=n;d=n.y-feet;}}return best;}
function path(s,from,to){if(!from||!to||from.id===to.id)return[];const queue=[from.id],prev=new Map([[from.id,null]]);for(let k=0;k<queue.length;k++){const id=queue[k];if(id===to.id)break;for(const next of s.navigation.edges[id])if(!prev.has(next)){prev.set(next,id);queue.push(next);}}if(!prev.has(to.id))return[];const route=[];for(let id=to.id;id!==from.id;id=prev.get(id))route.unshift(s.navigation.nodes[id]);return route;}
function visible(s,a,b){const x=a.x+8,y=a.y+10,tx=b.x+8,ty=b.y+10;return!collisionTerrain(s).some(w=>segmentRect(x,y,tx,ty,w)!==null);}
export function navigate(s,p,goal,dt){
 const i=emptyInput(),brain=p.brain;brain.jumpHeld=Math.max(0,brain.jumpHeld-dt);brain.jumpRest=Math.max(0,brain.jumpRest-dt);
 if(Math.abs(p.x-brain.lastX)<.12&&p.ground)brain.stuck+=dt;else brain.stuck=0;brain.lastX=p.x;
 const below=platformUnder(s,p);if(p.ground||brain.support===undefined)brain.support=below?.id;const here=s.navigation.nodes[brain.support]||below,there=platformUnder(s,goal),route=path(s,here,there),next=route[0];
 let targetX=goal.x+(goal.w||16)/2,needJump=false,drop=false;
 if(next&&here){
  targetX=clamp(p.x+8,next.x+18,next.x+next.w-18);
  if(next.y<here.y-5){const rise=here.y-next.y,gap=Math.max(0,next.x-p.x-p.w,p.x-next.x-next.w);needJump=gap<(rise>45?45:rise>30?65:95);if(targetX===p.x+8)targetX=clamp(goal.x+8,next.x+18,next.x+next.w-18);}
  else if(next.y>here.y+8){const crossing=next.x<here.x+here.w&&next.x+next.w>here.x;if(here.oneWay&&crossing){drop=p.x+8>next.x+12&&p.x+8<next.x+next.w-12;}else targetX=next.x+next.w/2<here.x+here.w/2?here.x-20:here.x+here.w+20;}
 }
 const dx=targetX-p.x-8;i.left=dx<-7;i.right=dx>7;
 const moving=Number(i.right)-Number(i.left),edge=here&&((moving>0&&p.x+p.w>here.x+here.w-24)||(moving<0&&p.x<here.x+24));
 if(p.ground&&(needJump||edge||brain.stuck>.35)&&brain.jumpRest<=0&&!p.previous.jump){brain.jumpHeld=.65;brain.jumpRest=.25;i.jump=true;brain.stuck=0;}else i.jump=!p.ground&&brain.jumpHeld>0;
 if(p.ground&&p.previous.jump)i.jump=false;
 if(drop&&p.ground&&!p.previous.jump){i.down=true;i.jump=true;brain.jumpHeld=0;}
 return i;
}
// Aim acquisition, sustained weapons, and breaking cover share the same attack budget.
function botTrigger(s,p,key,profile,weapon,ready){
 const brain=p.brain;
 if(brain.aimKey!==key){brain.aimKey=key;brain.aimAt=s.time+profile.reaction;brain.burstUntil=0;}
 if(!key||!ready||s.time<brain.aimAt||p.cooldown>0&&weapon.charge)return false;
 if(s.time>=(brain.burstUntil||0)){
  if(s.time<(brain.nextBurstAt||0))return false;
  brain.burstUntil=s.time+(weapon.spinup||weapon.charge||0)+profile.burst;
  brain.nextBurstAt=brain.burstUntil+profile.pause;
 }
 if(weapon.charge&&(p.charge||0)>=1){brain.burstUntil=s.time;return false;}
 return true;
}
export function botInput(s,p,dt){
 const target=s.players.find(o=>o.alive&&o.id!==p.id);if(!target)return emptyInput();let goal=target;
 if(!p.weapon||p.ammo===0){let best=Infinity;for(const item of s.items)if(WEAPONS[item.type]&&item.ammo!==0){const from=platformUnder(s,p),to=platformUnder(s,item),route=path(s,from,to);if(from&&to&&from.id!==to.id&&!route.length)continue;const cost=Math.hypot(item.x-p.x,item.y-p.y)+route.length*35;if(cost<best){goal=item;best=cost;}}}
 const profile=BOT_DIFFICULTIES[s.difficulty]||BOT_DIFFICULTIES[DEFAULT_BOT_DIFFICULTY];
 const i=navigate(s,p,goal,dt),dx=target.x-p.x,dist=Math.abs(dx),aligned=Math.abs(target.y-p.y)<profile.alignment;let aimKey=null,ready=false,dodging=false;
 if(!p.weapon&&Math.hypot(goal.x-p.x,goal.y-p.y)<36)i.grab=!p.previous.grab;
 if(p.weapon&&p.ammo===0)i.grab=!p.previous.grab;
 if(p.weapon&&p.ammo!==0){p.dir=dx>=0?1:-1;i.strafe=true;const range=WEAPONS[p.weapon].range||480;
  if(dist<range&&visible(s,p,target)){aimKey=`player:${target.id}:${p.weapon}`;ready=aligned;if(aligned){if(dist<range*profile.retreat&&p.weapon!=='melee'){i.left=dx>0;i.right=dx<0;}else if(dist<range*.85){i.left=false;i.right=false;}}}
  if(profile.dodge&&s.time>=(p.brain.dodgeAt||0)&&p.ground&&s.bullets.some(b=>b.owner!==p.id&&Math.abs(b.y-p.y-10)<20&&Math.abs(b.x-p.x)<(s.difficulty==='hard'?100:60)&&b.vx*(p.x-b.x)>0)&&!p.previous.jump){i.jump=true;dodging=true;p.brain.jumpHeld=.35;p.brain.dodgeAt=s.time+profile.dodge;}
 }
 if((s.map.objects||[]).some(o=>o.type==='door'&&!o.open&&!o.destroyed&&Math.hypot(o.x+o.w/2-p.x-8,o.y+o.h/2-p.y-p.h/2)<40))i.grab=!p.previous.grab;
 if(p.weapon&&p.ammo!==0&&collisionTerrain(s).some(o=>Number.isFinite(o.hp)&&!o.oneWay&&segmentRect(p.x+8,p.y+10,p.x+8+p.dir*65,p.y+10,o)!==null)){aimKey=`cover:${p.weapon}`;ready=true;}
 // Waiting to aim is intentional; don't treat it as a stuck navigation route.
 if(aimKey&&ready&&!dodging&&p.ground&&(aimKey.startsWith('cover:')||!i.left&&!i.right)){i.jump=false;p.brain.stuck=0;p.brain.jumpHeld=0;}
 i.fire=botTrigger(s,p,aimKey,profile,WEAPONS[p.weapon]||{},ready);
 return i;
}
const waveCount=s=>Math.min(80,5+s.wave*3)+Math.max(0,s.players.filter(p=>!p.departed).length-1)*4;
export function beginWave(s){s.wave++;s.phase='countdown';s.timer=2;s.roundTime=0;s.remaining=waveCount(s);s.spawnClock=.7;s.enemies=[];s.bullets=[];s.grenades=[];s.fields=[];s.traps=[];s.salvos=[];s.effects=[];s.items=s.map.items.map(([x,y,type])=>makeItem(x,y,type));for(const p of s.players){if(p.departed)continue;if(!p.alive){p.alive=true;p.downed=false;p.hp=Math.round(p.maxHp*.6);p.x=s.map.spawn[p.id][0];p.y=s.map.spawn[p.id][1];p.vx=0;p.vy=0;}else p.hp=Math.min(p.maxHp,p.hp+25);if(!p.weapon)p.weapon='pistol';p.ammo=WEAPONS[p.weapon].ammo;p.invulnerable=1.5;p.charge=0;p.spin=0;p.frozen=0;p.previous=emptyInput();}emit(s,'wave',{wave:s.wave});}
export function buyUpgrade(s,id,type){const p=s.players[id],level=s.upgradeLevels[id];if(!s.zombie||s.phase!=='wave-break'||!p||!['health','damage','speed'].includes(type))return false;const cost=type==='damage'?350+level[type]*150:250+level[type]*100;if(p.points<cost)return false;p.points-=cost;level[type]++;if(type==='health'){p.maxHp+=25;p.hp=Math.min(p.maxHp,p.hp+25);}if(type==='damage')p.damageScale+=.15;if(type==='speed')p.speedScale+=.05;emit(s,'upgrade',{id,upgrade:type});return true;}
export function upgradeCost(s,id,type){return(type==='damage'?350:250)+(s.upgradeLevels[id]?.[type]||0)*(type==='damage'?150:100);}
function spawnEnemy(s){const living=s.players.filter(p=>p.alive);if(!living.length)return;const kind=s.wave>=5&&s.remaining%6===0?'brute':s.wave>=3&&s.remaining%3===0?'runner':'shambler',left=s.remaining%2===0;const hp=(38+s.wave*10)*(kind==='brute'?3:1);const z={id:s.nextEntity++,x:left?Math.max(8,Math.min(...living.map(p=>p.x))-280):Math.min(s.map.width-24,Math.max(...living.map(p=>p.x))+280),y:s.map.height-75,w:16,h:22,vx:0,vy:0,dir:left?1:-1,alive:true,ground:false,coyote:0,buffer:0,previous:emptyInput(),brain:{jumpHeld:0,jumpRest:0,lastX:0,stuck:0},kind,hp,maxHp:hp,speed:Math.min(115,40+s.wave*2)*(kind==='runner'?1.5:kind==='brute'?.7:1),attack:0,flash:0,species:['duck','platypus','shoebill','puffin'][s.remaining%4]};s.enemies.push(z);s.remaining--;emit(s,'zombie-spawn',{kind});}
function animate(s,dt){s.time+=dt;s.shake=Math.max(0,s.shake-dt*14);for(const p of s.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=500*dt;}s.particles=s.particles.filter(p=>p.life>0);}
export function movePlayer(s,p,i,dt){
 const old=p.previous,h=i.down?14:22;if(h!==p.h){const next={...p,y:p.y+p.h-h,h};if(h<p.h||!collisionTerrain(s).some(b=>!b.oneWay&&overlap(next,b))){p.y=next.y;p.h=h;}}
 const move=Number(i.right)-Number(i.left);if(move&&!i.strafe)p.dir=move;const floor=footing(s,p),def=WEAPONS[p.weapon],slow=p.frozen>0?.25:1;const desired=move*(i.down?90:160)*p.speedScale*slow*(i.fire?(def?.moveScale||1):1),acc=p.ground?1700*floor.grip:850;p.vx+=clamp(desired-p.vx,-acc*dt,acc*dt);
 p.coyote=p.ground?.09:Math.max(0,p.coyote-dt);p.buffer=i.jump&&!old.jump?.1:Math.max(0,p.buffer-dt);let dropping=false;
 if(p.buffer>0&&p.coyote>0){if(i.down&&collisionTerrain(s).some(b=>b.oneWay&&Math.abs(p.y+p.h-b.y)<3&&p.x+p.w>b.x&&p.x<b.x+b.w)&&!collisionTerrain(s).some(b=>!b.oneWay&&Math.abs(p.y+p.h-b.y)<3&&p.x+p.w>b.x&&p.x<b.x+b.w)){p.y+=3;p.vy=70;dropping=true;}else{p.vy=-JUMP_SPEED;emit(s,'jump',{id:p.id});}p.buffer=0;p.coyote=0;p.ground=false;}
 if(!i.jump&&old.jump&&p.vy<-130)p.vy=-130;p.vy=Math.min(i.jump&&p.vy>0?115:480,p.vy+850*dt);moveBody(p,collisionTerrain(s),dt,dropping,s.map.width);if(p.ground&&floor.belt){const before=p.x;p.x=clamp(p.x+floor.belt*dt,0,s.map.width-p.w);if(collisionTerrain(s).some(b=>!b.oneWay&&overlap(p,b)))p.x=before;}
 p.previous={...i};
}
export function predictPlayer(s,p,i,dt=1/60){
 if(s.phase!=='playing'||!p.alive)return;
 p.frozen=Math.max(0,(p.frozen||0)-dt);p.springCooldown=Math.max(0,(p.springCooldown||0)-dt);movePlayer(s,p,{...emptyInput(),...i},dt);
 for(const h of s.map.hazards||[])if(h.type==='spring'&&p.vy>=0&&!p.springCooldown&&overlap(p,{...h,y:h.y-2,h:h.h+4})){p.vy=-535;p.ground=false;p.springCooldown=.3;}
}
function controlPlayer(s,p,i,dt,deaths){
 const old=p.previous;movePlayer(s,p,i,dt);
 let reviving=false;if(s.zombie&&i.grab)for(const other of s.players)if(other.downed&&Math.hypot(p.x-other.x,p.y-other.y)<43){other.reviveWork+=dt;reviving=true;}
 if(i.grab&&!old.grab&&!reviving)grab(s,p);
 const weapon=WEAPONS[p.weapon];
 if(weapon?.charge){if(i.fire&&!old.fire&&p.ammo!==0&&p.cooldown<=0)emit(s,'charge',{id:p.id});if(i.fire&&p.ammo!==0&&p.cooldown<=0)p.charge=Math.min(1,(p.charge||0)+dt/weapon.charge);else if(!i.fire&&old.fire){if(p.charge>.12)fire(s,p,deaths,p.charge);p.charge=0;}}
 else{p.charge=0;if(weapon?.spinup&&i.fire&&!old.fire)emit(s,'spin',{id:p.id});p.spin=i.fire?Math.min(1,(p.spin||0)+dt/(weapon?.spinup||.01)):0;if(i.fire&&(!weapon?.spinup||p.spin>=1))fire(s,p,deaths);}
 if(i.chirp&&!old.chirp){p.chirp=.35;emit(s,'chirp',{id:p.id});}p.previous={...i};
}
function explode(s,x,y,owner,damage,radius,deaths){s.effects.push({kind:'blast',x,y,radius,life:.3});blastTerrain(s,x,y,radius,damage,owner);particles(s,x,y,'#ffb64b',35);particles(s,x,y,'#ed7245',20);s.shake=7;emit(s,'explosion',{weapon:'grenade'});for(const p of s.players)if(p.alive&&(!s.zombie||p.id===owner||!s.players[owner])&&Math.hypot(p.x+8-x,p.y+p.h/2-y)<radius)hurt(s,p,s.zombie?damage*.55:damage,deaths);for(const z of s.enemies)if(z.alive&&Math.hypot(z.x+8-x,z.y+11-y)<radius)hitEnemy(s,z,damage,s.players[owner]);}
function projectileHit(s,target,b,deaths){
 const owner=s.players[b.owner];
 if(b.kind==='freeze'){
  if(target.frozen>0){s.zombie?hitEnemy(s,target,Math.max(250,b.damage),owner):hurt(s,target,100,deaths);target.frozen=0;particles(s,target.x+8,target.y+10,'#c7f6ff',18);}
  else{target.frozen=1.4;target.vx*=.25;if(s.zombie)hitEnemy(s,target,b.damage,owner);emit(s,'freeze',{x:target.x});}
 }else s.zombie?hitEnemy(s,target,b.damage||34,owner):hurt(s,target,b.damage||34,deaths);
}
function projectiles(s,dt,deaths){
 const targets=s.zombie?s.enemies:s.players;
 for(const salvo of s.salvos){salvo.delay-=dt;if(salvo.delay<=0){const p=s.players[salvo.owner];if(p?.alive&&p.weapon===salvo.weapon){spawnShot(s,p,salvo.weapon);emit(s,'shot',{id:p.id,weapon:salvo.weapon});}}}
 s.salvos=s.salvos.filter(v=>v.delay>0);
 for(const b of s.bullets){
  b.life-=dt;b.age+=dt;b.hitIds??=[];const owner=s.players[b.owner];
  if(b.kind==='melee'){
   for(const t of targets)if(t.alive&&t.id!==b.owner&&!b.hitIds.includes(t.id)&&overlap(b.hitbox,t)){b.hitIds.push(t.id);projectileHit(s,t,b,deaths);}
   b.terrainHits??=[];for(const terrain of collisionTerrain(s))if(overlap(b.hitbox,terrain)&&!b.terrainHits.includes(terrain)){b.terrainHits.push(terrain);breakTerrain(s,terrain,b.damage,b.owner);}continue;
  }
  if(b.kind==='boomerang'&&b.age>.48&&owner?.alive){const dx=owner.x+8-b.x,dy=owner.y+12-b.y,distance=Math.hypot(dx,dy);b.vx=dx/Math.max(1,distance)*460;b.vy=dy/Math.max(1,distance)*460;if(distance<17){if(owner.weapon==='boomerang')owner.ammo=1;else s.items.push(makeItem(owner.x,owner.y,'boomerang'));b.life=-1;emit(s,'catch',{id:b.owner});continue;}if(!b.returning){b.hitIds=[];b.returning=true;}}
  b.vy+=(b.gravity||(b.kind==='bolt'?180:0))*dt;
  const distance=Math.hypot(b.vx*dt,b.vy*dt),travel=b.kind!=='boomerang'&&Number.isFinite(b.remaining)?Math.min(1,b.remaining/Math.max(.001,distance)):1;
  const x=b.x+b.vx*dt*travel,y=b.y+b.vy*dt*travel;if(b.kind!=='boomerang'&&Number.isFinite(b.remaining)){b.remaining-=distance*travel;if(b.remaining<=0&&b.kind!=='boomerang')b.life=0;}
  let wallT=2,wall=null;
  for(const w of collisionTerrain(s)){const t=segmentRect(b.x,b.y,x,y,w);if(t!==null&&t<wallT){wallT=t;wall=w;}}
  const hits=[];for(const target of targets)if(target.alive&&target.id!==b.owner&&!b.hitIds.includes(target.id)){
   const padding=b.kind==='flame'?4:b.kind==='plasma'?5:0,r={x:target.x-padding,y:target.y-padding,w:target.w+padding*2,h:target.h+padding*2},t=segmentRect(b.x,b.y,x,y,r);if(t!==null&&t<wallT)hits.push({target,t});
  }
  hits.sort((a,b)=>a.t-b.t);let impact=wallT<=1?wallT:null;
  for(const {target,t}of hits){
   b.hitIds.push(target.id);if(['rocket','plasma','acid'].includes(b.kind)){impact=t;break;}
   projectileHit(s,target,b,deaths);particles(s,target.x+8,target.y+10,b.color||'#ffe8ac',4);
   if(!['rail','flame','boomerang'].includes(b.kind)){b.life=-1;impact=t;break;}
  }
  let endX=x,endY=y;
  if(impact!==null){
   const ix=b.x+(x-b.x)*impact,iy=b.y+(y-b.y)*impact;endX=ix;endY=iy;
   if(['rocket','plasma'].includes(b.kind)){explode(s,ix,iy,b.owner,b.damage,b.radius||92,deaths);b.life=-1;b.resolved=true;}
   else if(['acid','flame','freeze'].includes(b.kind)&&(b.kind==='acid'||wallT===impact)){addField(s,b.kind==='flame'?'fire':b.kind==='freeze'?'ice':'acid',ix,iy,b.owner,b.damage);b.life=-1;b.resolved=true;}
   else if(b.kind==='bounce'&&wall&&wallT===impact&&b.bounces>0){b.bounces--;breakTerrain(s,wall,b.damage,b.owner);emit(s,'bounce',{x:ix});if(Math.abs(iy-wall.y)<2||Math.abs(iy-wall.y-wall.h)<2)b.vy=-b.vy;else b.vx=-b.vx;b.x=ix+Math.sign(b.vx)*2;b.y=iy+Math.sign(b.vy)*2;continue;}
   else if(wallT===impact){
    const destroyed=breakTerrain(s,wall,b.damage||34,b.owner);
    if(b.kind==='boomerang'){b.age=Math.max(b.age,.5);b.x=ix-Math.sign(b.vx)*2;b.y=iy;continue;}
    if(!(b.kind==='rail'&&destroyed)){b.life=-1;particles(s,ix,iy,b.color||'#ffe8ac',3);}else{b.x=ix+Math.sign(b.vx)*2;b.y=iy;continue;}
   }
  }
  if(b.kind==='laser')s.effects.push({kind:'beam',x:b.x,y:b.y,x2:endX,y2:endY,color:b.color,life:.14});
  if(b.kind==='rail')s.effects.push({kind:'beam',x:b.x,y:b.y,x2:endX,y2:endY,color:b.color,life:.09});
  b.x=x;b.y=y;
  if(b.kind==='flame')particles(s,b.x,b.y,b.life>.15?'#ffe38a':'#ed7245',1);
  if(b.life<=0&&!b.resolved){if(['rocket','plasma'].includes(b.kind))explode(s,b.x,b.y,b.owner,b.damage,b.radius||92,deaths);else if(['acid','flame','freeze'].includes(b.kind))addField(s,b.kind==='flame'?'fire':b.kind==='freeze'?'ice':'acid',b.x,b.y,b.owner,b.damage);}
 }
 s.bullets=s.bullets.filter(b=>b.life>0&&b.x>-10&&b.x<s.map.width+10&&b.y>-80&&b.y<s.map.height+20);
 const fragments=[];
 for(const g of s.grenades){
  g.fuse-=dt;g.vy+=700*dt;g.x+=g.vx*dt;if(g.x<0||g.x>s.map.width-g.w){g.x=clamp(g.x,0,s.map.width-g.w);g.vx*=-.65;}
  const bottom=g.y+g.h;g.y+=g.vy*dt;
  for(const b of collisionTerrain(s))if(overlap(g,b)){if(g.vy>0&&bottom<=b.y+5){g.y=b.y-g.h;g.vy*=-.5;g.vx*=.7;}else if(!b.oneWay){g.vx*=-.65;g.x+=g.vx*dt;}}
  if(g.fuse<=0){explode(s,g.x,g.y,g.owner,g.damage||135,g.radius||72,deaths);if(g.cluster)for(let n=0;n<4;n++)fragments.push({id:s.nextEntity++,x:g.x,y:g.y-5,w:5,h:5,vx:(n-1.5)*105,vy:-210-Math.abs(n-1.5)*40,fuse:.4+n*.13,owner:g.owner,damage:70,radius:46,weapon:'cluster'});}
 }
 s.grenades=s.grenades.filter(g=>g.fuse>0&&g.y<s.map.height+90);s.grenades.push(...fragments);
}
function items(s,dt){for(const item of s.items){item.lock=Math.max(0,item.lock-dt);item.vy=Math.min(400,item.vy+650*dt);moveBody(item,collisionTerrain(s),dt,false,s.map.width);if(item.ground)item.vx*=.85;item.age=(item.age||0)+dt;if(s.zombie&&!WEAPONS[item.type])for(const p of s.players)if(p.alive&&(item.type==='medkit'?p.hp<p.maxHp:p.weapon&&p.ammo>=0&&p.ammo<WEAPONS[p.weapon].ammo)&&overlap(p,{...item,x:item.x-8,y:item.y-8,w:item.w+16,h:item.h+16})){if(item.type==='medkit')p.hp=Math.min(p.maxHp,p.hp+35);if(item.type==='ammo'&&p.weapon&&p.ammo>=0)p.ammo=Math.min(WEAPONS[p.weapon].ammo,p.ammo+Math.ceil(WEAPONS[p.weapon].ammo*.6));item.age=999;emit(s,'pickup',{id:p.id,weapon:item.type});break;}}
 s.items=s.items.filter(i=>i.y<s.map.height+40&&i.age<(s.zombie?45:120));if(s.zombie){s.supplyClock-=dt;if(s.supplyClock<=0){s.supplyClock=8;for(const [x,y,type]of s.map.items)if(!s.items.some(i=>i.type===type&&Math.abs(i.x-x)<28)&&s.items.length<24)s.items.push(makeItem(x,y,type));}}
}
function zombieUpdate(s,dt,deaths){
 s.spawnClock-=dt;if(s.remaining>0&&s.spawnClock<=0&&s.enemies.filter(z=>z.alive).length<48){spawnEnemy(s);s.spawnClock=Math.max(.24,1-s.wave*.04);}
 for(const z of s.enemies){if(!z.alive)continue;z.frozen=Math.max(0,(z.frozen||0)-dt);z.flash=Math.max(0,z.flash-dt);z.attack=Math.max(0,z.attack-dt);const target=s.players.filter(p=>p.alive).sort((a,b)=>Math.hypot(a.x-z.x,a.y-z.y)-Math.hypot(b.x-z.x,b.y-z.y))[0];if(!target)continue;const i=navigate(s,z,target,dt),move=Number(i.right)-Number(i.left);if(move)z.dir=move;z.vx+=clamp(move*z.speed*(z.frozen>0?.25:1)-z.vx,-700*dt,700*dt);if(i.jump&&!z.previous.jump&&z.ground)z.vy=-325;if(!i.jump&&z.previous.jump&&z.vy<-130)z.vy=-130;z.vy=Math.min(i.jump&&z.vy>0?150:480,z.vy+850*dt);const drop=i.down&&i.jump&&z.ground;if(drop){z.y+=3;z.vy=70;}moveBody(z,collisionTerrain(s),dt,drop,s.map.width);z.previous=i;for(const b of collisionTerrain(s))if(Number.isFinite(b.hp)&&Math.hypot(z.x+8-Math.max(b.x,Math.min(b.x+b.w,z.x+8)),z.y+11-Math.max(b.y,Math.min(b.y+b.h,z.y+11)))<25&&z.attack<=0){z.attack=.7;breakTerrain(s,b,26,z.id);emit(s,'zombie-hit');}if(z.y>s.map.height+40){z.alive=false;continue;}if(Math.abs(z.x-target.x)<23&&Math.abs(z.y-target.y)<34&&z.attack<=0){z.attack=.9;hurt(s,target,(z.kind==='brute'?30:17)+Math.floor(s.wave/4),deaths);}}
 s.enemies=s.enemies.filter(z=>z.alive);
 for(const p of s.players)if(p.downed){p.bleed-=dt;p.revive=p.reviveWork>0?p.revive+p.reviveWork:Math.max(0,p.revive-dt);if(p.revive>=2){p.alive=true;p.downed=false;p.hp=Math.round(p.maxHp*.55);p.invulnerable=2;p.revive=0;p.vx=0;p.vy=0;emit(s,'revive',{id:p.id});}else if(p.bleed<=0){p.downed=false;dropWeapon(s,p);}}
}
export function update(s,inputs=[],dt=1/60){
 s._terrainCache=null;animate(s,dt);
 if(s.phase==='countdown'){s.timer-=dt;if(s.timer<=0){s.phase='playing';emit(s,'go');}return;}
 if(s.phase==='wave-break'){s.timer-=dt;if(s.timer<=0)beginWave(s);return;}
 if(s.phase==='round-over'||s.phase==='match-over'||s.phase==='game-over'){s.timer-=dt;for(const p of s.players)if(!p.alive&&!p.downed){p.vy+=500*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}if(s.timer<=0&&s.phase==='round-over')startRound(s);return;}
 s.roundTime+=dt;s.tide=s.map.height-8-(s.zombie?0:Math.max(0,s.roundTime-s.map.tideDelay)*7);const deaths=new Set();
 for(const p of s.players){p.reviveWork=0;p.chirp=Math.max(0,p.chirp-dt);p.flash=Math.max(0,p.flash-dt);p.cooldown=Math.max(0,p.cooldown-dt);p.invulnerable=Math.max(0,p.invulnerable-dt);p.frozen=Math.max(0,(p.frozen||0)-dt);}
 for(const p of s.players){if(!p.alive){if(p.downed){p.vx*=Math.max(0,1-dt*8);p.vy=Math.min(480,p.vy+850*dt);moveBody(p,collisionTerrain(s),dt,false,s.map.width);}else{p.vy+=500*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}continue;}const i=s.mode==='practice'&&p.id===1?botInput(s,p,dt):{...emptyInput(),...inputs[p.id]};controlPlayer(s,p,i,dt,deaths);if(p.y+p.h>s.tide+9||p.y>s.map.height+30){if(s.zombie)p.invulnerable=0;hurt(s,p,9999,deaths);}}
 items(s,dt);projectiles(s,dt,deaths);updateTerrain(s,dt,{hurt,hitEnemy,explode},deaths);if(s.terrainDirty){s.navigation=buildNavigation(s.map,s.zombie?65:undefined);for(const p of [...s.players,...s.enemies])p.brain.support=undefined;s.terrainDirty=false;}if(s.zombie)zombieUpdate(s,dt,deaths);for(const p of deaths)killPlayer(s,p);
 const alive=s.players.filter(p=>p.alive);
 if(s.zombie){if(!alive.length){s.phase='game-over';s.timer=4;emit(s,'gameover',{wave:s.wave,kills:s.teamKills});}else if(s.remaining===0&&s.enemies.length===0){s.phase='wave-break';s.timer=12;for(const p of s.players)if(!p.departed)p.points+=150;emit(s,'wave-clear',{wave:s.wave});}}
 else if(alive.length<=1){s.winner=alive.length?alive[0].id:null;if(s.winner!==null)s.scores[s.winner]++;s.phase=s.winner!==null&&s.scores[s.winner]>=10?'match-over':'round-over';s.timer=s.phase==='match-over'?4:2.2;emit(s,'win',{id:s.winner,match:s.phase==='match-over'});}
}
