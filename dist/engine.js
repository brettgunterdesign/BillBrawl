import {MAPS,WEAPONS,mapForMode} from './content.js';
export {MAPS,WEAPONS};
export const WIDTH=640,HEIGHT=360,COLORS=['#ffcc64','#8eb6e6','#e98b89','#99c998'];
export const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function segmentRect(x1,y1,x2,y2,r){let lo=0,hi=1;for(const [p,d,min,max] of [[x1,x2-x1,r.x,r.x+r.w],[y1,y2-y1,r.y,r.y+r.h]]){if(Math.abs(d)<1e-9){if(p<min||p>max)return null;}else{let a=(min-p)/d,b=(max-p)/d;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return null;}}return lo;}
const emptyInput=()=>({left:false,right:false,jump:false,down:false,fire:false,grab:false,chirp:false,strafe:false});
const emit=(s,type,data={})=>s.events.push({type,...data});
export function createState(mode='duel',options={}){
 const zombie=mode==='zombie',count=zombie?clamp(options.players||1,1,4):mode==='party'?4:2;
 const start=Number.isInteger(options.arena)&&options.arena>=0&&options.arena<MAPS.length?options.arena:0;
 const s={mode,zombie,count,difficulty:options.difficulty||'normal',scores:Array(count).fill(0),round:0,mapIndex:start-1,startArena:start,phase:'countdown',timer:0,time:0,roundTime:0,players:[],items:[],bullets:[],grenades:[],particles:[],events:[],winner:null,shake:0,tide:352,wave:0,enemies:[],remaining:0,spawnClock:0,nextEntity:100,teamKills:0,upgradeLevels:Array.from({length:count},()=>({health:0,damage:0,speed:0})),navigation:null};
 startRound(s);return s;
}
function makePlayer(s,id,x,y){const level=s.upgradeLevels[id];return{id,x,y,w:16,h:22,vx:0,vy:0,dir:id%2?-1:1,alive:true,downed:false,bleed:0,revive:0,hp:100+level.health*25,maxHp:100+level.health*25,damageScale:1+level.damage*.15,speedScale:1+level.speed*.05,invulnerable:0,ground:false,coyote:0,buffer:0,cooldown:0,weapon:s.zombie?'pistol':null,ammo:s.zombie?WEAPONS.pistol.ammo:0,previous:emptyInput(),chirp:0,flash:0,botTime:0,brain:{jumpHeld:0,jumpRest:0,lastX:x,stuck:0,shootAt:0},points:0,kills:0};}
function makeItem(x,y,type,extra={}){return{x,y,w:16,h:9,type,ammo:WEAPONS[type]?.ammo??0,vx:0,vy:0,lock:0,...extra};}
export function startRound(s){
 s.round++;s.mapIndex=(s.mapIndex+1)%MAPS.length;s.map=mapForMode(s.mapIndex,s.zombie);s.roundTime=0;s.phase='countdown';s.timer=1.6;s.winner=null;s.tide=352;s.bullets=[];s.grenades=[];s.particles=[];s.shake=0;s.navigation=buildNavigation(s.map);
 s.players=s.map.spawn.slice(0,s.count).map(([x,y],id)=>makePlayer(s,id,x,y));s.items=s.map.items.map(([x,y,type])=>makeItem(x,y,type));
 if(s.zombie){s.wave=1;s.enemies=[];s.remaining=waveCount(s);s.spawnClock=1;s.supplyClock=8;emit(s,'wave',{wave:1});}else emit(s,'round',{round:s.round});
}
function particles(s,x,y,color,n=12){const count=Math.min(n,Math.max(0,420-s.particles.length));for(let i=0;i<count;i++)s.particles.push({x,y,vx:(Math.random()-.5)*220,vy:-Math.random()*180,life:.35+Math.random()*.5,color,size:1+Math.random()*2});}
function dropWeapon(s,p,throwing=false){if(!p.weapon)return;s.items.push(makeItem(p.x+8+p.dir*14,p.y+7,p.weapon,{ammo:p.ammo,vx:throwing?p.dir*230:p.vx*.5,vy:throwing?-150:-60,lock:.25,age:0}));p.weapon=null;p.ammo=0;}
export function killPlayer(s,p){if(!p.alive)return;p.alive=false;p.hp=0;p.vy=-130;p.vx=-p.dir*55;p.downed=s.zombie&&s.count>1;p.bleed=18;p.revive=0;particles(s,p.x+8,p.y+8,COLORS[p.id],20);emit(s,'death',{id:p.id,downed:p.downed});s.shake=Math.max(s.shake,4);if(!p.downed)dropWeapon(s,p);}
function hurt(s,p,damage,deaths){if(!p.alive||p.invulnerable>0)return;if(!s.zombie){deaths.add(p);return;}p.hp-=damage;p.invulnerable=.6;p.vx=-p.dir*100;p.vy=-90;emit(s,'hurt',{id:p.id});particles(s,p.x+8,p.y+8,'#e99580',6);if(p.hp<=0)deaths.add(p);}
function hitEnemy(s,z,damage,owner){if(!z.alive)return;z.hp-=damage;z.flash=.1;z.vx+=z.x>(owner?.x??z.x)?45:-45;emit(s,'zombie-hit');if(z.hp>0)return;z.alive=false;s.teamKills++;if(owner){owner.points+=100;owner.kills++;}particles(s,z.x+8,z.y+9,z.kind==='brute'?'#ccaf82':'#a2b38b',16);emit(s,'zombie-death');if(Math.random()<.14)s.items.push(makeItem(z.x,z.y,'medkit'));else if(Math.random()<.25)s.items.push(makeItem(z.x,z.y,'ammo'));}
function grab(s,p){if(p.weapon){dropWeapon(s,p,true);emit(s,'throw');return;}let nearest=null,d=38;for(const i of s.items){if(!WEAPONS[i.type])continue;const next=Math.hypot(i.x+8-p.x-8,i.y+4-p.y-11);if(i.lock<=0&&next<d){nearest=i;d=next;}}if(nearest){p.weapon=nearest.type;p.ammo=nearest.ammo;s.items.splice(s.items.indexOf(nearest),1);emit(s,'pickup',{id:p.id,weapon:p.weapon});}}
function fire(s,p){
 if(!p.weapon||p.cooldown>0)return;const def=WEAPONS[p.weapon];p.cooldown=def.cooldown;
 if(p.ammo===0){emit(s,'empty',{id:p.id});return;}if(p.ammo>0)p.ammo--;p.flash=.1;
 const x=p.x+8+p.dir*18,y=p.y+9;emit(s,'shot',{weapon:p.weapon,id:p.id});
 if(def.kind==='grenade'){s.grenades.push({x:p.x+8,y:p.y+6,vx:p.dir*220+p.vx*.4,vy:-240,fuse:1.35,owner:p.id,w:6,h:6,damage:def.damage*p.damageScale,radius:def.radius});}
 else if(def.kind==='melee'){const hitbox={x:p.dir>0?p.x+p.w:p.x-32,y:p.y-3,w:32,h:p.h+6};s.bullets.push({x:p.x+8,y:p.y+10,vx:0,vy:0,owner:p.id,kind:'melee',hitbox,damage:def.damage*p.damageScale,life:.08,age:0,hitIds:[]});}
 else{for(const a of p.weapon==='shotgun'?[-.13,-.065,0,.065,.13]:[0])s.bullets.push({x,y,vx:p.dir*def.speed,vy:a*def.speed,owner:p.id,weapon:p.weapon,kind:def.kind,damage:def.damage*p.damageScale,life:p.weapon==='shotgun'?.38:def.kind==='flame'?.27:def.kind==='bounce'?2.4:1.4,age:0,bounces:3,hitIds:[],color:def.color});p.vx-=p.dir*(p.weapon==='shotgun'?100:p.weapon==='sniper'?45:18);}
 s.shake=Math.max(s.shake,p.weapon==='shotgun'||p.weapon==='rocket'?2:1);
}
export function moveBody(p,platforms,dt,drop=false){p.x+=p.vx*dt;for(const b of platforms)if(!b.oneWay&&overlap(p,b)){if(p.vx>0)p.x=b.x-p.w;else if(p.vx<0)p.x=b.x+b.w;p.vx=0;}p.x=clamp(p.x,0,WIDTH-p.w);const bottom=p.y+p.h;p.y+=p.vy*dt;p.ground=false;for(const b of platforms){if(!overlap(p,b))continue;if(p.vy>=0&&bottom<=b.y+2&&!(b.oneWay&&drop)){p.y=b.y-p.h;p.vy=0;p.ground=true;}else if(!b.oneWay&&p.vy<0){p.y=b.y+b.h;p.vy=0;}}}
export function buildNavigation(map){const nodes=map.platforms.map((p,id)=>({...p,id}));const edges=nodes.map(()=>[]);for(const a of nodes)for(const b of nodes){if(a===b)continue;const gap=Math.max(0,b.x-(a.x+a.w),a.x-(b.x+b.w)),rise=a.y-b.y;if(rise<=65&&rise>=-200&&gap<=(rise>0?115:165)&&!(gap>65&&rise>45))edges[a.id].push(b.id);}return{nodes,edges};}
function platformUnder(s,entity){let best=null,d=Infinity;const feet=entity.y+(entity.h||9),x=entity.x+(entity.w||16)/2;for(const n of s.navigation.nodes){if(x>=n.x-3&&x<=n.x+n.w+3&&n.y>=feet-4&&n.y-feet<d){best=n;d=n.y-feet;}}return best;}
function path(s,from,to){if(!from||!to||from.id===to.id)return[];const queue=[from.id],prev=new Map([[from.id,null]]);for(let k=0;k<queue.length;k++){const id=queue[k];if(id===to.id)break;for(const next of s.navigation.edges[id])if(!prev.has(next)){prev.set(next,id);queue.push(next);}}if(!prev.has(to.id))return[];const route=[];for(let id=to.id;id!==from.id;id=prev.get(id))route.unshift(s.navigation.nodes[id]);return route;}
function visible(s,a,b){const x=a.x+8,y=a.y+10,tx=b.x+8,ty=b.y+10;return!s.map.platforms.some(w=>segmentRect(x,y,tx,ty,w)!==null);}
export function navigate(s,p,goal,dt){
 const i=emptyInput(),brain=p.brain;brain.jumpHeld=Math.max(0,brain.jumpHeld-dt);brain.jumpRest=Math.max(0,brain.jumpRest-dt);
 if(Math.abs(p.x-brain.lastX)<.12&&p.ground)brain.stuck+=dt;else brain.stuck=0;brain.lastX=p.x;
 const below=platformUnder(s,p);if(p.ground||brain.support===undefined)brain.support=below?.id;const here=s.navigation.nodes[brain.support]||below,there=platformUnder(s,goal),route=path(s,here,there),next=route[0];
 let targetX=goal.x+(goal.w||16)/2,needJump=false,drop=false;
 if(next&&here){
  targetX=clamp(p.x+8,next.x+18,next.x+next.w-18);
  if(next.y<here.y-5){const rise=here.y-next.y,gap=Math.max(0,next.x-p.x-p.w,p.x-next.x-next.w);needJump=gap<(rise>45?45:rise>30?65:95);if(targetX===p.x+8)targetX=clamp(goal.x+8,next.x+18,next.x+next.w-18);}
  else if(next.y>here.y+18){const crossing=next.x<here.x+here.w&&next.x+next.w>here.x;if(here.oneWay&&crossing){drop=p.x+8>next.x+12&&p.x+8<next.x+next.w-12;}else targetX=next.x+next.w/2<here.x+here.w/2?here.x-20:here.x+here.w+20;}
 }
 const dx=targetX-p.x-8;i.left=dx<-7;i.right=dx>7;
 const moving=Number(i.right)-Number(i.left),edge=here&&((moving>0&&p.x+p.w>here.x+here.w-24)||(moving<0&&p.x<here.x+24));
 if(p.ground&&(needJump||edge||brain.stuck>.35)&&brain.jumpRest<=0&&!p.previous.jump){brain.jumpHeld=.65;brain.jumpRest=.25;i.jump=true;brain.stuck=0;}else i.jump=!p.ground&&brain.jumpHeld>0;
 if(p.ground&&p.previous.jump)i.jump=false;
 if(drop&&p.ground&&!p.previous.jump){i.down=true;i.jump=true;brain.jumpHeld=0;}
 return i;
}
export function botInput(s,p,dt){
 const target=s.players.find(o=>o.alive&&o.id!==p.id);if(!target)return emptyInput();let goal=target;
 if(!p.weapon||p.ammo===0){let best=Infinity;for(const item of s.items)if(WEAPONS[item.type]&&item.ammo!==0){const from=platformUnder(s,p),to=platformUnder(s,item),route=path(s,from,to);if(from&&to&&from.id!==to.id&&!route.length)continue;const cost=Math.hypot(item.x-p.x,item.y-p.y)+route.length*35;if(cost<best){goal=item;best=cost;}}}
 const i=navigate(s,p,goal,dt),dx=target.x-p.x,dist=Math.abs(dx),aligned=Math.abs(target.y-p.y)<(s.difficulty==='hard'?20:16);
 if(!p.weapon&&Math.hypot(goal.x-p.x,goal.y-p.y)<36)i.grab=!p.previous.grab;
 if(p.weapon&&p.ammo===0)i.grab=!p.previous.grab;
 if(p.weapon&&p.ammo!==0){p.dir=dx>=0?1:-1;i.strafe=true;const range=p.weapon==='melee'?35:p.weapon==='flamethrower'?70:p.weapon==='grenade'?190:p.weapon==='shotgun'?215:480;
  if(aligned&&visible(s,p,target)){if(dist<range*.55&&p.weapon!=='melee'){i.left=dx>0;i.right=dx<0;}else if(dist<range*.85){i.left=false;i.right=false;}const delay=s.difficulty==='easy'?.42:s.difficulty==='hard'?.04:.16;if(dist<range&&s.time>=p.brain.shootAt){i.fire=true;p.brain.shootAt=s.time+delay;}}
  if(s.difficulty!=='easy'&&p.ground&&s.bullets.some(b=>b.owner!==p.id&&Math.abs(b.y-p.y-10)<20&&Math.abs(b.x-p.x)<100&&b.vx*(p.x-b.x)>0)&&!p.previous.jump){i.jump=true;p.brain.jumpHeld=.35;}
 }
 return i;
}
const waveCount=s=>Math.min(80,5+s.wave*3)+(s.count-1)*4;
export function beginWave(s){s.wave++;s.phase='countdown';s.timer=2;s.roundTime=0;s.remaining=waveCount(s);s.spawnClock=.7;s.enemies=[];s.bullets=[];s.grenades=[];s.items=s.map.items.map(([x,y,type])=>makeItem(x,y,type));for(const p of s.players){if(!p.alive){p.alive=true;p.downed=false;p.hp=Math.round(p.maxHp*.6);p.x=s.map.spawn[p.id][0];p.y=288;p.vx=0;p.vy=0;}else p.hp=Math.min(p.maxHp,p.hp+25);if(!p.weapon)p.weapon='pistol';p.ammo=WEAPONS[p.weapon].ammo;p.invulnerable=1.5;p.previous=emptyInput();}emit(s,'wave',{wave:s.wave});}
export function buyUpgrade(s,id,type){const p=s.players[id],level=s.upgradeLevels[id];if(!s.zombie||s.phase!=='wave-break'||!p||!['health','damage','speed'].includes(type))return false;const cost=type==='damage'?350+level[type]*150:250+level[type]*100;if(p.points<cost)return false;p.points-=cost;level[type]++;if(type==='health'){p.maxHp+=25;p.hp=Math.min(p.maxHp,p.hp+25);}if(type==='damage')p.damageScale+=.15;if(type==='speed')p.speedScale+=.05;emit(s,'upgrade',{id,upgrade:type});return true;}
export function upgradeCost(s,id,type){return(type==='damage'?350:250)+(s.upgradeLevels[id]?.[type]||0)*(type==='damage'?150:100);}
function spawnEnemy(s){const kind=s.wave>=5&&s.remaining%6===0?'brute':s.wave>=3&&s.remaining%3===0?'runner':'shambler',left=s.remaining%2===0;const hp=(38+s.wave*10)*(kind==='brute'?3:1);const z={id:s.nextEntity++,x:left?8:616,y:285,w:16,h:22,vx:0,vy:0,dir:left?1:-1,alive:true,ground:false,coyote:0,buffer:0,previous:emptyInput(),brain:{jumpHeld:0,jumpRest:0,lastX:left?8:616,stuck:0},kind,hp,maxHp:hp,speed:Math.min(115,40+s.wave*2)*(kind==='runner'?1.5:kind==='brute'?.7:1),attack:0,flash:0,species:['duck','platypus','shoebill','puffin'][s.remaining%4]};s.enemies.push(z);s.remaining--;emit(s,'zombie-spawn',{kind});}
function animate(s,dt){s.time+=dt;s.shake=Math.max(0,s.shake-dt*14);for(const p of s.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=500*dt;}s.particles=s.particles.filter(p=>p.life>0);}
function controlPlayer(s,p,i,dt){
 const old=p.previous,h=i.down?14:22;if(h!==p.h){const next={...p,y:p.y+p.h-h,h};if(h<p.h||!s.map.platforms.some(b=>!b.oneWay&&overlap(next,b))){p.y=next.y;p.h=h;}}
 const move=Number(i.right)-Number(i.left);if(move&&!i.strafe)p.dir=move;const desired=move*(i.down?90:160)*p.speedScale,acc=p.ground?1700*(s.map.grip||1):850;p.vx+=clamp(desired-p.vx,-acc*dt,acc*dt);
 p.coyote=p.ground?.09:Math.max(0,p.coyote-dt);p.buffer=i.jump&&!old.jump?.1:Math.max(0,p.buffer-dt);let dropping=false;
 if(p.buffer>0&&p.coyote>0){if(i.down&&s.map.platforms.some(b=>b.oneWay&&Math.abs(p.y+p.h-b.y)<3&&p.x+p.w>b.x&&p.x<b.x+b.w)){p.y+=3;p.vy=70;dropping=true;}else{p.vy=-325;emit(s,'jump',{id:p.id});}p.buffer=0;p.coyote=0;p.ground=false;}
 if(!i.jump&&old.jump&&p.vy<-130)p.vy=-130;p.vy=Math.min(i.jump&&p.vy>0?115:480,p.vy+850*dt);moveBody(p,s.map.platforms,dt,dropping);
 let reviving=false;if(s.zombie&&i.grab)for(const other of s.players)if(other.downed&&Math.hypot(p.x-other.x,p.y-other.y)<43){other.reviveWork+=dt;reviving=true;}
 if(i.grab&&!old.grab&&!reviving)grab(s,p);if(i.fire)fire(s,p);if(i.chirp&&!old.chirp){p.chirp=.35;emit(s,'chirp',{id:p.id});}p.previous={...i};
}
function explode(s,x,y,owner,damage,radius,deaths){particles(s,x,y,'#ffb64b',35);particles(s,x,y,'#ed7245',20);s.shake=7;emit(s,'explosion',{weapon:'grenade'});for(const p of s.players)if(p.alive&&(!s.zombie||p.id===owner)&&Math.hypot(p.x+8-x,p.y+p.h/2-y)<radius)hurt(s,p,s.zombie?damage*.55:damage,deaths);for(const z of s.enemies)if(z.alive&&Math.hypot(z.x+8-x,z.y+11-y)<radius)hitEnemy(s,z,damage,s.players[owner]);}
function projectiles(s,dt,deaths){
 const targets=s.zombie?s.enemies:s.players;
 for(const b of s.bullets){b.life-=dt;b.age+=dt;b.hitIds??=[];const owner=s.players[b.owner];
  if(b.kind==='melee'){for(const target of targets)if(target.alive&&target.id!==b.owner&&!b.hitIds.includes(target.id)&&overlap(b.hitbox,target)){b.hitIds.push(target.id);s.zombie?hitEnemy(s,target,b.damage,owner):hurt(s,target,b.damage,deaths);}continue;}
  if(b.kind==='bolt')b.vy+=100*dt;
  const x=b.x+b.vx*dt,y=b.y+b.vy*dt;let wallT=2,wall=null;for(const w of s.map.platforms){const t=segmentRect(b.x,b.y,x,y,w);if(t!==null&&t<wallT){wallT=t;wall=w;}}
  const hits=[];for(const target of targets)if(target.alive&&target.id!==b.owner&&!b.hitIds.includes(target.id)){const padding=b.kind==='flame'?4:0;const r={x:target.x-padding,y:target.y-padding,w:target.w+padding*2,h:target.h+padding*2},t=segmentRect(b.x,b.y,x,y,r);if(t!==null&&t<wallT)hits.push({target,t});}hits.sort((a,b)=>a.t-b.t);
  let impact=wallT<=1?wallT:null;
  for(const {target,t}of hits){b.hitIds.push(target.id);if(b.kind==='rocket'){impact=t;break;}s.zombie?hitEnemy(s,target,b.damage||34,owner):hurt(s,target,b.damage||34,deaths);particles(s,target.x+8,target.y+10,b.color||'#ffe8ac',4);if(b.kind!=='rail'&&b.kind!=='flame'){b.life=-1;impact=t;break;}}
  if(impact!==null){const ix=b.x+(x-b.x)*impact,iy=b.y+(y-b.y)*impact;if(b.kind==='rocket'){explode(s,ix,iy,b.owner,b.damage,WEAPONS.rocket.radius,deaths);b.life=-1;}else if(b.kind==='bounce'&&wall&&wallT===impact&&b.bounces>0){b.bounces--;emit(s,'bounce',{x:ix});if(Math.abs(iy-wall.y)<2||Math.abs(iy-wall.y-wall.h)<2)b.vy=-b.vy;else b.vx=-b.vx;b.x=ix+Math.sign(b.vx)*2;b.y=iy+Math.sign(b.vy)*2;continue;}else if(wallT===impact){b.life=-1;particles(s,ix,iy,b.color||'#ffe8ac',3);}}
  b.x=x;b.y=y;if(b.kind==='flame')particles(s,b.x,b.y,b.life>.15?'#ffe38a':'#ed7245',1);
  if(b.kind==='rocket'&&b.life<=0&&impact===null)explode(s,b.x,b.y,b.owner,b.damage,WEAPONS.rocket.radius,deaths);
 }
 s.bullets=s.bullets.filter(b=>b.life>0&&b.x>-10&&b.x<650&&b.y>-20&&b.y<380);
 for(const g of s.grenades){g.fuse-=dt;g.vy+=700*dt;g.x+=g.vx*dt;if(g.x<0||g.x>WIDTH-g.w){g.x=clamp(g.x,0,WIDTH-g.w);g.vx*=-.65;}const bottom=g.y+g.h;g.y+=g.vy*dt;for(const b of s.map.platforms)if(overlap(g,b)){if(g.vy>0&&bottom<=b.y+5){g.y=b.y-g.h;g.vy*=-.5;g.vx*=.7;}else if(!b.oneWay){g.vx*=-.65;g.x+=g.vx*dt;}}if(g.fuse<=0)explode(s,g.x,g.y,g.owner,g.damage||135,g.radius||72,deaths);}
 s.grenades=s.grenades.filter(g=>g.fuse>0&&g.y<450);
}
function items(s,dt){for(const item of s.items){item.lock=Math.max(0,item.lock-dt);item.vy=Math.min(400,item.vy+650*dt);moveBody(item,s.map.platforms,dt);if(item.ground)item.vx*=.85;item.age=(item.age||0)+dt;if(s.zombie&&!WEAPONS[item.type])for(const p of s.players)if(p.alive&&(item.type==='medkit'?p.hp<p.maxHp:p.weapon&&p.ammo>=0&&p.ammo<WEAPONS[p.weapon].ammo)&&overlap(p,{...item,x:item.x-8,y:item.y-8,w:item.w+16,h:item.h+16})){if(item.type==='medkit')p.hp=Math.min(p.maxHp,p.hp+35);if(item.type==='ammo'&&p.weapon&&p.ammo>=0)p.ammo=Math.min(WEAPONS[p.weapon].ammo,p.ammo+Math.ceil(WEAPONS[p.weapon].ammo*.6));item.age=999;emit(s,'pickup',{id:p.id,weapon:item.type});break;}}
 s.items=s.items.filter(i=>i.y<400&&i.age<(s.zombie?45:120));if(s.zombie){s.supplyClock-=dt;if(s.supplyClock<=0){s.supplyClock=8;for(const [x,y,type]of s.map.items)if(!s.items.some(i=>i.type===type&&Math.abs(i.x-x)<28)&&s.items.length<24)s.items.push(makeItem(x,y,type));}}
}
function zombieUpdate(s,dt,deaths){
 s.spawnClock-=dt;if(s.remaining>0&&s.spawnClock<=0&&s.enemies.filter(z=>z.alive).length<48){spawnEnemy(s);s.spawnClock=Math.max(.24,1-s.wave*.04);}
 for(const z of s.enemies){if(!z.alive)continue;z.flash=Math.max(0,z.flash-dt);z.attack=Math.max(0,z.attack-dt);const target=s.players.filter(p=>p.alive).sort((a,b)=>Math.hypot(a.x-z.x,a.y-z.y)-Math.hypot(b.x-z.x,b.y-z.y))[0];if(!target)continue;const i=navigate(s,z,target,dt),move=Number(i.right)-Number(i.left);if(move)z.dir=move;z.vx+=clamp(move*z.speed-z.vx,-700*dt,700*dt);if(i.jump&&!z.previous.jump&&z.ground)z.vy=-325;if(!i.jump&&z.previous.jump&&z.vy<-130)z.vy=-130;z.vy=Math.min(i.jump&&z.vy>0?150:480,z.vy+850*dt);const drop=i.down&&i.jump&&z.ground;if(drop){z.y+=3;z.vy=70;}moveBody(z,s.map.platforms,dt,drop);z.previous=i;if(z.y>400){z.alive=false;continue;}if(Math.abs(z.x-target.x)<23&&Math.abs(z.y-target.y)<23&&z.attack<=0){z.attack=.9;hurt(s,target,(z.kind==='brute'?30:17)+Math.floor(s.wave/4),deaths);}}
 s.enemies=s.enemies.filter(z=>z.alive);
 for(const p of s.players)if(p.downed){p.bleed-=dt;p.revive=p.reviveWork>0?p.revive+p.reviveWork:Math.max(0,p.revive-dt);if(p.revive>=2){p.alive=true;p.downed=false;p.hp=Math.round(p.maxHp*.55);p.invulnerable=2;p.revive=0;p.vx=0;p.vy=0;emit(s,'revive',{id:p.id});}else if(p.bleed<=0){p.downed=false;dropWeapon(s,p);}}
}
export function update(s,inputs=[],dt=1/60){
 animate(s,dt);
 if(s.phase==='countdown'){s.timer-=dt;if(s.timer<=0){s.phase='playing';emit(s,'go');}return;}
 if(s.phase==='wave-break'){s.timer-=dt;if(s.timer<=0)beginWave(s);return;}
 if(s.phase==='round-over'||s.phase==='match-over'||s.phase==='game-over'){s.timer-=dt;for(const p of s.players)if(!p.alive&&!p.downed){p.vy+=500*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}if(s.timer<=0&&s.phase==='round-over')startRound(s);return;}
 s.roundTime+=dt;s.tide=s.zombie?352:352-Math.max(0,s.roundTime-25)*7;const deaths=new Set();
 for(const p of s.players){p.reviveWork=0;p.chirp=Math.max(0,p.chirp-dt);p.flash=Math.max(0,p.flash-dt);p.cooldown=Math.max(0,p.cooldown-dt);p.invulnerable=Math.max(0,p.invulnerable-dt);}
 for(const p of s.players){if(!p.alive){if(p.downed){p.vx*=Math.max(0,1-dt*8);p.vy=Math.min(480,p.vy+850*dt);moveBody(p,s.map.platforms,dt);}else{p.vy+=500*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}continue;}const i=s.mode==='practice'&&p.id===1?botInput(s,p,dt):{...emptyInput(),...inputs[p.id]};controlPlayer(s,p,i,dt);if(p.y+p.h>s.tide+9||p.y>HEIGHT+30){if(s.zombie)p.invulnerable=0;hurt(s,p,9999,deaths);}}
 items(s,dt);projectiles(s,dt,deaths);if(s.zombie)zombieUpdate(s,dt,deaths);for(const p of deaths)killPlayer(s,p);
 const alive=s.players.filter(p=>p.alive);
 if(s.zombie){if(!alive.length){s.phase='game-over';s.timer=4;emit(s,'gameover',{wave:s.wave,kills:s.teamKills});}else if(s.remaining===0&&s.enemies.length===0){s.phase='wave-break';s.timer=12;for(const p of s.players)p.points+=150;emit(s,'wave-clear',{wave:s.wave});}}
 else if(alive.length<=1){s.winner=alive.length?alive[0].id:null;if(s.winner!==null)s.scores[s.winner]++;s.phase=s.winner!==null&&s.scores[s.winner]>=10?'match-over':'round-over';s.timer=s.phase==='match-over'?4:2.2;emit(s,'win',{id:s.winner,match:s.phase==='match-over'});}
}
