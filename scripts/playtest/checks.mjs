import {collisionTerrain} from '../../dist/terrain.js';
export function inspectState(s,camera){
 const issues=[],add=(code,detail)=>issues.push({code,...detail});
 for(const p of s.players){
  for(const key of ['x','y','vx','vy','hp','ammo','cooldown'])if(!Number.isFinite(p[key]))add('non-finite-player',{player:p.id,key,value:String(p[key])});
  if(p.alive&&(p.x<-.01||p.x+p.w>s.map.width+.01))add('player-outside-world',{player:p.id,x:p.x});
  if(p.ammo<-1||!Number.isInteger(p.ammo))add('invalid-ammo',{player:p.id,ammo:p.ammo,weapon:p.weapon});
  if(p.alive&&p.hp>p.maxHp)add('health-over-limit',{player:p.id,hp:p.hp,max:p.maxHp});
  if(p.alive&&p.downed)add('alive-and-downed',{player:p.id});
  if(p.alive&&s.phase==='playing'){
   const wall=collisionTerrain(s).find(b=>!b.oneWay&&p.x<b.x+b.w-.2&&p.x+p.w>b.x+.2&&p.y<b.y+b.h-.2&&p.y+p.h>b.y+.2);
   if(wall)add('body-inside-solid',{player:p.id,x:p.x,y:p.y,wall:{x:wall.x,y:wall.y,w:wall.w,h:wall.h,type:wall.type,material:wall.material}});
  }
 }
 for(const key of ['bullets','grenades','items','enemies','fields','traps'])for(const entity of s[key])for(const field of ['x','y'])if(!Number.isFinite(entity[field]))add('non-finite-entity',{collection:key,field});
 if(s.particles.length>420||s.fields.length>64||s.traps.length>16||s.enemies.length>48)add('entity-cap-exceeded',{particles:s.particles.length,fields:s.fields.length,traps:s.traps.length,enemies:s.enemies.length});
 if(s.scores.some(n=>!Number.isInteger(n)||n<0))add('invalid-score',{scores:s.scores});
 if(camera)for(const p of s.players.filter(p=>p.alive||p.downed))if(p.x+p.w<camera.x||p.x>camera.x+camera.width||p.y+p.h<camera.y||p.y>camera.y+camera.height)add('camera-lost-player',{player:p.id,x:p.x,y:p.y,camera:camera.snapshot?.()||camera});
 return issues;
}
export function stateSummary(s){return {phase:s.phase,round:s.round,arena:s.mapIndex,wave:s.wave,scores:[...s.scores],players:s.players.map(p=>({id:p.id,x:p.x,y:p.y,vx:p.vx,vy:p.vy,alive:p.alive,downed:p.downed,hp:p.hp,weapon:p.weapon,ammo:p.ammo})),counts:Object.fromEntries(['items','enemies','bullets','grenades','fields','traps'].map(k=>[k,s[k].length]))};}
export function stallTracker(){const history=new Map(),reported=new Set();return(s,inputs,tick)=>{const warnings=[];for(const p of s.players){const input=inputs[p.id]||{},key=`${s.round}:${p.id}`;if(!p.alive||s.phase!=='playing'||!input.left&&!input.right&&!input.jump||input.grab){history.delete(key);continue;}let h=history.get(key);if(!h){h={tick,x:p.x,y:p.y};history.set(key,h);}if(Math.hypot(p.x-h.x,p.y-h.y)>12){history.set(key,{tick,x:p.x,y:p.y});continue;}if(tick-h.tick>360&&!reported.has(key)){reported.add(key);warnings.push({code:'possible-movement-stall',player:p.id,x:p.x,y:p.y,tick,round:s.round});}}return warnings;};}
