// Shared terrain rules are independent of Canvas and can run on the match server.
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Branches and canopy are one-way floors. The decorative trunk never blocks a body.
export function treePlatforms(o){
 const floor=o.y+o.h,top=o.y-20,levels=[top];
 for(let y=floor-50;y>top+28;y-=50)levels.push(y);
 return levels.map((y,n)=>({x:o.x+o.w/2-(n?24:36),y,w:n?48:72,h:8,oneWay:true,material:o.snow?'ice':'leaf',hp:o.hp,source:o}));
}
export function terrainForMap(map){return [...map.platforms.filter(b=>!b.destroyed),...(map.objects||[]).flatMap(o=>o.destroyed?[]:o.type==='tree'?treePlatforms(o):o.solid&&!(o.type==='door'&&o.open)?[o]:[])];}
export function collisionTerrain(s){return s._terrainCache??=terrainForMap(s.map);}
export function toggleDoor(s,p,maxDistance=43){
 const doors=(s.map.objects||[]).filter(o=>o.type==='door'&&!o.destroyed&&Math.hypot(o.x+o.w/2-p.x-8,o.y+o.h/2-p.y-p.h/2)<maxDistance);
 const door=doors.sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];if(!door)return false;
 if(door.open&&[...s.players,...s.enemies].some(a=>a.alive&&overlap(a,door)))return true;
 door.open=!door.open;s._terrainCache=null;s.events.push({type:'door',x:door.x});return true;
}
export function breakTerrain(s,b,damage,owner){
 b=b.source||b;
 if(b.destroyed||!Number.isFinite(b.hp))return false;
 b.hp-=damage;if(b.hp>0){b.flash=.12;return false;}
 b.destroyed=true;s._terrainCache=null;s.terrainDirty=true;s.events.push({type:'break',x:b.x,material:b.material});
 for(let n=0;n<10&&s.particles.length<420;n++)s.particles.push({x:b.x+b.w/2,y:b.y+b.h/2,vx:(Math.random()-.5)*180,vy:-Math.random()*180,life:.5,color:b.material==='glass'?'#b9eced':b.material==='metal'?'#929ea2':'#c99a62',size:2+n%3});
 if(b.explosive)s.pendingExplosions.push({x:b.x+b.w/2,y:b.y+b.h/2,owner,damage:140,radius:95});
 return true;
}
export function blastTerrain(s,x,y,radius,damage,owner){
 for(const b of [...s.map.platforms,...(s.map.objects||[])]){
  const distance=Math.hypot(x-clamp(x,b.x,b.x+b.w),y-clamp(y,b.y,b.y+b.h));
  if(distance<radius)breakTerrain(s,b,damage*(1-distance/radius*.65),owner);
 }
}
export function addField(s,kind,x,y,owner,damage=12){
 const duration=kind==='fire'?5:kind==='acid'?8:2.8,w=kind==='acid'?54:kind==='fire'?36:42;
 const below=collisionTerrain(s).filter(b=>x>=b.x&&x<=b.x+b.w&&b.y>=y-6&&b.y-y<240).sort((a,b)=>a.y-b.y)[0];
 if(!below)return;
 const floor=below.y,existing=s.fields.find(f=>f.kind===kind&&f.owner===owner&&Math.abs(f.x+w/2-x)<w*.6&&Math.abs(f.y+f.h-floor)<5);
 if(existing){existing.life=duration;return;}
 if(s.fields.length>=64)s.fields.shift();
 s.fields.push({kind,x:clamp(x-w/2,0,s.map.width-w),y:floor-9,w,h:9,life:duration,owner,damage,clock:0});
}
export function updateTerrain(s,dt,callbacks,deaths){
 const {hurt,hitEnemy,explode}=callbacks;
 for(const b of [...s.map.platforms,...(s.map.objects||[])])b.flash=Math.max(0,(b.flash||0)-dt);
 for(const p of s.players){p.springCooldown=Math.max(0,(p.springCooldown||0)-dt);if(!p.alive)continue;
  for(const h of s.map.hazards||[]){
   if(!overlap(p,{...h,y:h.y-2,h:h.h+4}))continue;
   if(h.type==='spring'&&p.vy>=0&&p.springCooldown===0){p.vy=-535;p.ground=false;p.springCooldown=.3;s.events.push({type:'spring',id:p.id});}
   else if(h.type==='lava'||h.type==='acid'||h.type==='electric'&&s.time%(h.period||4)>(h.period||4)-(h.active||1)){hurt(s,p,h.type==='lava'?9999:25,deaths);}
  }
 }
 for(const f of s.fields){
  const support=collisionTerrain(s).some(b=>b.x<f.x+f.w&&b.x+b.w>f.x&&Math.abs(b.y-f.y-f.h)<3);
  if(!support){const bottom=f.y+f.h;f.vy=(f.vy||0)+500*dt;f.y+=f.vy*dt;for(const b of collisionTerrain(s))if(b.x<f.x+f.w&&b.x+b.w>f.x&&bottom<=b.y+2&&f.y+f.h>=b.y){f.y=b.y-f.h;f.vy=0;break;}}
  f.life-=dt;f.clock-=dt;if(f.kind==='ice'||f.clock>0)continue;f.clock=.3;
  for(const p of s.players)if(p.alive&&(!s.zombie||p.id===f.owner)&&overlap(p,f))hurt(s,p,f.damage,deaths);
  for(const z of s.enemies)if(z.alive&&overlap(z,f))hitEnemy(s,z,f.damage,s.players[f.owner]);
  for(const b of [...s.map.platforms,...(s.map.objects||[])])if(overlap({...f,y:f.y-12,h:f.h+24},b)&&(f.kind==='acid'||['wood','log','rope','leaf'].includes(b.material)))breakTerrain(s,b,f.kind==='acid'?22:14,f.owner);
 }
 s.fields=s.fields.filter(f=>f.life>0&&f.y<s.tide+8);
 for(const mine of s.traps){
  mine.life-=dt;mine.arm-=dt;if(mine.ground&&!collisionTerrain(s).some(b=>b.x<mine.x+mine.w&&b.x+b.w>mine.x&&Math.abs(b.y-mine.y-mine.h)<3))mine.ground=false;if(!mine.ground){mine.vy+=700*dt;const bottom=mine.y+mine.h;mine.y+=mine.vy*dt;for(const b of collisionTerrain(s))if(overlap(mine,b)&&bottom<=b.y+3){mine.y=b.y-mine.h;mine.vy=0;mine.ground=true;mine.arm=.7;break;}}
  const targets=s.zombie?s.enemies:s.players;
  if(mine.ground&&mine.arm<=0&&targets.some(t=>t.alive&&t.id!==mine.owner&&Math.hypot(t.x+8-mine.x-7,t.y+t.h-mine.y)<43)){
   mine.life=0;explode(s,mine.x+7,mine.y,mine.owner,mine.damage,mine.radius,deaths);
  }
 }
 s.traps=s.traps.filter(m=>m.life>0&&m.y<s.map.height+50);
 // Chain reactions are queued so a barrel cannot recursively explode itself.
 for(let count=0;s.pendingExplosions.length&&count<32;count++){const e=s.pendingExplosions.shift();explode(s,e.x,e.y,e.owner,e.damage,e.radius,deaths);}
 s.pendingExplosions=[];
 s.effects=s.effects.filter(e=>(e.life-=dt)>0);
}
export function footing(s,p){
 const floor=collisionTerrain(s).find(b=>Math.abs(p.y+p.h-b.y)<3&&p.x+p.w>b.x&&p.x<b.x+b.w);
 const ice=(s.map.hazards||[]).some(h=>h.type==='ice'&&overlap(p,{...h,y:h.y-5,h:h.h+8}))||s.fields.some(f=>f.kind==='ice'&&overlap(p,{...f,y:f.y-5,h:f.h+8}));
 return {grip:(ice||floor?.material==='ice') ? .16 : (s.map.grip||1),belt:floor?.belt||0};
}
