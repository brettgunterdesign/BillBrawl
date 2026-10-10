export const WIDTH=640, HEIGHT=360;
export const COLORS=['#ffcc64','#8eb6e6','#e98b89','#99c998'];
const platform=(x,y,w,h=12,oneWay=true)=>({x,y,w,h,oneWay});
export const MAPS=[
 {name:'DOCKSIDE',theme:'dock',spawn:[[62,286],[560,286],[126,135],[494,135]],platforms:[platform(0,320,270,40,false),platform(370,320,270,40,false),platform(65,260,125),platform(450,260,125),platform(235,220,170),platform(110,170,120),platform(410,170,120),platform(265,120,110),platform(205,295,22,25,false),platform(413,295,22,25,false)],items:[[100,236,'pistol'],[520,236,'pistol'],[282,196,'shotgun'],[350,196,'shotgun'],[155,145,'grenade'],[465,145,'grenade']]},
 {name:'ROOFTOP RUMBLE',theme:'roof',spawn:[[55,285],[570,285],[155,158],[480,158]],platforms:[platform(0,320,230,40,false),platform(410,320,230,40,false),platform(235,290,170),platform(40,245,145),platform(455,245,145),platform(125,190,135),platform(380,190,135),platform(275,145,90),platform(40,95,100),platform(500,95,100),platform(202,291,20,29,false),platform(418,291,20,29,false)],items:[[82,220,'pistol'],[540,220,'pistol'],[190,165,'shotgun'],[435,165,'shotgun'],[300,120,'grenade'],[337,120,'grenade']]},
 {name:'PUMP STATION',theme:'pump',spawn:[[50,285],[573,285],[110,118],[510,118]],platforms:[platform(0,320,640,40,false),platform(75,255,150),platform(415,255,150),platform(265,260,110),platform(180,200,100),platform(360,200,100),platform(75,150,90),platform(475,150,90),platform(270,120,100),platform(310,290,20,30,false)],items:[[90,230,'pistol'],[533,230,'pistol'],[220,175,'shotgun'],[420,175,'shotgun'],[292,95,'grenade'],[340,95,'grenade']]}
];
export const WEAPONS={pistol:{name:'PISTOL',ammo:9,cooldown:.24,speed:780},shotgun:{name:'SHOTGUN',ammo:4,cooldown:.65,speed:680},grenade:{name:'GRENADE',ammo:3,cooldown:.5}};
export const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export function segmentRect(x1,y1,x2,y2,r){
 let lo=0,hi=1;
 for(const [p,d,min,max] of [[x1,x2-x1,r.x,r.x+r.w],[y1,y2-y1,r.y,r.y+r.h]]){
  if(Math.abs(d)<1e-9){if(p<min||p>max)return null;}
  else {let a=(min-p)/d,b=(max-p)/d;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return null;}
 }
 return lo;
}
const emptyInput=()=>({left:false,right:false,jump:false,down:false,fire:false,grab:false,chirp:false,strafe:false});
export function createState(mode='duel'){
 const count=mode==='party'?4:2;
 const state={mode,count,scores:Array(count).fill(0),round:0,mapIndex:-1,phase:'countdown',timer:0,time:0,roundTime:0,players:[],items:[],bullets:[],grenades:[],particles:[],events:[],winner:null,shake:0,tide:352};
 startRound(state);return state;
}
export function startRound(s){
 s.round++;s.mapIndex=(s.mapIndex+1)%MAPS.length;s.map=MAPS[s.mapIndex];s.roundTime=0;s.phase='countdown';s.timer=1.6;s.winner=null;s.tide=352;s.bullets=[];s.grenades=[];s.particles=[];s.shake=0;
 s.players=s.map.spawn.slice(0,s.count).map(([x,y],id)=>({id,x,y,w:16,h:22,vx:0,vy:0,dir:id%2?-1:1,alive:true,ground:false,coyote:0,buffer:0,cooldown:0,weapon:null,ammo:0,previous:emptyInput(),chirp:0,flash:0,botTime:0}));
 s.items=s.map.items.map(([x,y,type])=>({x,y,w:14,h:8,type,ammo:WEAPONS[type].ammo,vx:0,vy:0,lock:0}));
 s.events.push({type:'round',round:s.round});
}
function emit(s,type,data={}){s.events.push({type,...data});}
function particles(s,x,y,color,n=12){for(let i=0;i<n;i++)s.particles.push({x,y,vx:(Math.random()-.5)*220,vy:-Math.random()*180,life:.35+Math.random()*.5,color,size:2+Math.random()*2});}
export function killPlayer(s,p){if(!p.alive)return;p.alive=false;p.vy=-200;p.vx=p.dir*-75;particles(s,p.x+8,p.y+8,COLORS[p.id],20);emit(s,'death',{id:p.id});s.shake=Math.max(s.shake,4);dropWeapon(s,p);}
function dropWeapon(s,p,throwing=false){if(!p.weapon)return;s.items.push({type:p.weapon,ammo:p.ammo,x:p.x+8+p.dir*14,y:p.y+7,w:14,h:8,vx:throwing?p.dir*230:p.vx*.5,vy:throwing?-150:-60,lock:.25});p.weapon=null;p.ammo=0;}
function grab(s,p){
 if(p.weapon){dropWeapon(s,p,true);emit(s,'throw');return;}
 let nearest=null,distance=38;
 for(const i of s.items){const d=Math.hypot(i.x+7-p.x-8,i.y+4-p.y-11);if(i.lock<=0&&d<distance){nearest=i;distance=d;}}
 if(nearest){p.weapon=nearest.type;p.ammo=nearest.ammo;s.items.splice(s.items.indexOf(nearest),1);emit(s,'pickup',{id:p.id});}
}
function fire(s,p){
 if(!p.weapon||p.cooldown>0)return;
 const def=WEAPONS[p.weapon];p.cooldown=def.cooldown;
 if(p.ammo<=0){emit(s,'empty');return;}
 p.ammo--;p.flash=.08;
 const x=p.x+8+p.dir*18,y=p.y+9;
 if(p.weapon==='grenade'){s.grenades.push({x:p.x+8,y:p.y+6,vx:p.dir*220+p.vx*.4,vy:-240,fuse:1.35,owner:p.id,w:6,h:6});emit(s,'throw');}
 else {for(const a of p.weapon==='shotgun'?[-.13,-.065,0,.065,.13]:[0])s.bullets.push({x,y,vx:p.dir*def.speed,vy:a*def.speed,owner:p.id,life:p.weapon==='shotgun'?.46:1,age:0});p.vx-=p.dir*(p.weapon==='shotgun'?100:18);emit(s,'shot',{weapon:p.weapon});s.shake=Math.max(s.shake,p.weapon==='shotgun'?2:1);}
}
function moveBody(p,platforms,dt,drop=false){
 p.x+=p.vx*dt;
 for(const b of platforms)if(!b.oneWay&&overlap(p,b)){if(p.vx>0)p.x=b.x-p.w;else if(p.vx<0)p.x=b.x+b.w;p.vx=0;}
 p.x=Math.max(0,Math.min(WIDTH-p.w,p.x));
 const lastBottom=p.y+p.h;p.y+=p.vy*dt;p.ground=false;
 for(const b of platforms){if(!overlap(p,b))continue;
  if(p.vy>=0&&lastBottom<=b.y+2&&!(b.oneWay&&drop)){p.y=b.y-p.h;p.vy=0;p.ground=true;}
  else if(!b.oneWay&&p.vy<0){p.y=b.y+b.h;p.vy=0;}
 }
}
function botInput(s,p,dt){
 const target=s.players.find(o=>o.alive&&o.id!==p.id);const i=emptyInput();if(!target)return i;
 p.botTime-=dt;
 let goal=target;
 if(!p.weapon||!p.ammo){let best=Infinity;for(const item of s.items)if(item.ammo>0){const d=Math.hypot(item.x-p.x,(item.y-p.y)*1.2);if(d<best){goal=item;best=d;}}}
 const dx=goal.x-p.x;i.left=dx<-10;i.right=dx>10;i.grab=(!p.weapon&&Math.hypot(dx,goal.y-p.y)<43)||!!p.weapon&&!p.ammo;
 i.jump=(p.ground&&(goal.y<p.y-15||p.botTime<=0))||(!p.ground&&p.vy>0&&goal.y<p.y+10);
 if(p.ground&&i.jump)p.botTime=.7+Math.random()*.7;
 if(p.weapon){p.dir=target.x>p.x?1:-1;i.strafe=true;i.fire=Math.abs(target.y-p.y)<25&&(p.weapon!=='grenade'||Math.abs(target.x-p.x)<210);}
 return i;
}
export function update(s,inputs,dt=1/60){
 s.time+=dt;s.shake=Math.max(0,s.shake-dt*14);
 for(const p of s.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=500*dt;}s.particles=s.particles.filter(p=>p.life>0);
 if(s.phase==='countdown'){s.timer-=dt;if(s.timer<=0){s.phase='playing';emit(s,'go');}return;}
 if(s.phase==='round-over'||s.phase==='match-over'){
  s.timer-=dt;for(const p of s.players)if(!p.alive){p.vy+=500*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}
  if(s.timer<=0&&s.phase==='round-over')startRound(s);return;
 }
 s.roundTime+=dt;s.tide=352-Math.max(0,s.roundTime-25)*7;
 const deaths=new Set();
 for(const p of s.players){
  p.chirp=Math.max(0,p.chirp-dt);p.flash=Math.max(0,p.flash-dt);p.cooldown=Math.max(0,p.cooldown-dt);
  if(!p.alive){p.vy+=500*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;continue;}
  const i=s.mode==='practice'&&p.id===1?botInput(s,p,dt):{...emptyInput(),...inputs[p.id]};
  const old=p.previous;
  const h=i.down?14:22;if(h!==p.h){const next={...p,y:p.y+p.h-h,h};if(h<p.h||!s.map.platforms.some(b=>!b.oneWay&&overlap(next,b))){p.y=next.y;p.h=h;}}
  const move=Number(i.right)-Number(i.left);if(move&&!i.strafe)p.dir=move;
  const desired=move*(i.down?90:160),acc=p.ground?1700:850;p.vx+=Math.max(-acc*dt,Math.min(acc*dt,desired-p.vx));
  p.coyote=p.ground?.09:Math.max(0,p.coyote-dt);p.buffer=i.jump&&!old.jump?.1:Math.max(0,p.buffer-dt);
  let dropping=false;
  if(p.buffer>0&&p.coyote>0){
   if(i.down&&s.map.platforms.some(b=>b.oneWay&&Math.abs(p.y+p.h-b.y)<3&&p.x+p.w>b.x&&p.x<b.x+b.w)){p.y+=3;p.vy=70;dropping=true;}
   else {p.vy=-325;emit(s,'jump');}p.buffer=0;p.coyote=0;p.ground=false;
  }
  if(!i.jump&&old.jump&&p.vy<-130)p.vy=-130;
  p.vy=Math.min(i.jump&&p.vy>0?115:480,p.vy+850*dt);moveBody(p,s.map.platforms,dt,dropping);
  if(i.grab&&!old.grab)grab(s,p);if(i.fire)fire(s,p);
  if(i.chirp&&!old.chirp){p.chirp=.35;emit(s,'chirp',{id:p.id});particles(s,p.x+8,p.y,COLORS[p.id],3);}
  if(p.y+p.h>s.tide+9||p.y>HEIGHT+30)deaths.add(p);
  p.previous={...i};
 }
 for(const item of s.items){item.lock=Math.max(0,item.lock-dt);item.vy=Math.min(400,item.vy+650*dt);moveBody(item,s.map.platforms,dt);if(item.ground)item.vx*=.85;}s.items=s.items.filter(i=>i.y<400);
 for(const b of s.bullets){
  b.life-=dt;b.age+=dt;const x=b.x+b.vx*dt,y=b.y+b.vy*dt;let closest=2,victim=null;
  for(const wall of s.map.platforms){const t=segmentRect(b.x,b.y,x,y,wall);if(t!==null&&t<closest){closest=t;victim=null;}}
  for(const p of s.players)if(p.alive&&p.id!==b.owner){const t=segmentRect(b.x,b.y,x,y,p);if(t!==null&&t<closest){closest=t;victim=p;}}
  if(closest<=1){particles(s,b.x+(x-b.x)*closest,b.y+(y-b.y)*closest,'#ffe8ac',5);b.life=-1;if(victim)deaths.add(victim);}
  b.x=x;b.y=y;
 }
 s.bullets=s.bullets.filter(b=>b.life>0&&b.x>-10&&b.x<650&&b.y>-20&&b.y<380);
 for(const g of s.grenades){
  g.fuse-=dt;g.vy+=700*dt;g.x+=g.vx*dt;if(g.x<0||g.x>WIDTH-g.w){g.x=Math.max(0,Math.min(WIDTH-g.w,g.x));g.vx*=-.65;}
  const bottom=g.y+g.h;g.y+=g.vy*dt;
  for(const b of s.map.platforms)if(overlap(g,b)){
   if(g.vy>0&&bottom<=b.y+5){g.y=b.y-g.h;g.vy*=-.5;g.vx*=.7;}
   else if(!b.oneWay){g.vx*=-.65;g.x+=g.vx*dt;}
  }
  if(g.fuse<=0){particles(s,g.x,g.y,'#ffb64b',42);particles(s,g.x,g.y,'#ed7245',20);s.shake=8;emit(s,'explosion');for(const p of s.players)if(p.alive&&Math.hypot(p.x+8-g.x,p.y+p.h/2-g.y)<68)deaths.add(p);}
 }
 s.grenades=s.grenades.filter(g=>g.fuse>0&&g.y<450);
 for(const p of deaths)killPlayer(s,p);
 const alive=s.players.filter(p=>p.alive);
 if(alive.length<=1){s.winner=alive.length?alive[0].id:null;if(s.winner!==null)s.scores[s.winner]++;s.phase=s.winner!==null&&s.scores[s.winner]>=10?'match-over':'round-over';s.timer=s.phase==='match-over'?4:2.2;emit(s,'win',{id:s.winner,match:s.phase==='match-over'});}
}
