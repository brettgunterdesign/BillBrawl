import {createState,predictPlayer,overlap} from '../dist/engine.js';
import {collisionTerrain,toggleDoor} from '../dist/terrain.js';
import {MAPS} from '../dist/content.js';
import {pathToFileURL} from 'node:url';

const DT=1/60,STEP=24;
const dangerous=(map,p)=>map.hazards.some(h=>['lava','acid','electric'].includes(h.type)&&overlap(p,{...h,y:h.y-2,h:h.h+4}));
const clear=(map,terrain,p)=>p.x>=0&&p.x+p.w<=map.width&&!dangerous(map,p)&&!terrain.some(b=>!b.oneWay&&overlap(p,b));

function standingRegions(s){
 const terrain=collisionTerrain(s),xs=new Set([0,s.map.width-16]);
 for(let x=0;x<s.map.width-16;x+=STEP)xs.add(x);
 for(const b of terrain)for(const x of [b.x-16,b.x-15,b.x-1,b.x,b.x+b.w-16,b.x+b.w-1,b.x+b.w,b.x+b.w+1])if(x>=0&&x<=s.map.width-16)xs.add(x);
 const ordered=[...xs].sort((a,b)=>a-b),ys=[...new Set(terrain.map(b=>b.y))].sort((a,b)=>a-b),regions=[];
 for(const floor of ys){let current=null;
  for(const x of ordered){
   let height=22,body={x,y:floor-height,w:16,h:height};
   if(!clear(s.map,terrain,body)){height=14;body={x,y:floor-height,w:16,h:height};}
   const supported=terrain.some(b=>b.y===floor&&x+16>b.x&&x<b.x+b.w);
   if(supported&&clear(s.map,terrain,body)){
    if(!current||current.h!==height){current={id:regions.length,y:floor-height,h:height,min:x,max:x,launches:[]};regions.push(current);}
    current.max=x;current.launches.push(x);
   }else current=null;
  }
 }
 return regions;
}
const schemes=[
 {move:-1},{move:1},{move:-1,crouch:true},{move:1,crouch:true},
 ...[-1,0,1].map(move=>({move,jump:true})),
 ...[-1,0,1].map(move=>({move,drop:true})),
 {move:-1,jump:true,reverse:true},{move:1,jump:true,reverse:true},
 {move:-1,jump:true,delay:true},{move:1,jump:true,delay:true}
];
function bodyAt(s,x,y,h=22){return {...s.players[0],x,y,vx:0,vy:0,h,ground:true,coyote:0,buffer:0,previous:{},weapon:null,ammo:0,springCooldown:0};}
function regionAt(regions,p){return regions.find(r=>Math.abs(p.y+p.h-r.y-r.h)<.2&&p.x>=r.min-1&&p.x<=r.max+1);}
function trace(s,regions,start,scheme,visit){
 const local={...s,map:{...s.map,objects:s.map.objects.map(o=>({...o}))},events:[],_terrainCache:null};
 const p={...start,previous:{}};local.players=[p];
 for(let frame=0;frame<100;frame++){
  const move=scheme.delay&&frame<12?0:scheme.reverse&&frame>=20?-scheme.move:scheme.move;
  const input={left:move<0,right:move>0,down:!!scheme.crouch||!!scheme.drop&&frame<25,jump:!!scheme.jump||!!scheme.drop&&frame<1};
  // Doors are usable without a weapon; opening a nearby closed door is part of the route.
  if(!scheme.jump&&!scheme.drop&&local.map.objects.some(o=>o.type==='door'&&!o.open&&!o.destroyed&&Math.hypot(o.x+o.w/2-p.x-8,o.y+o.h/2-p.y-p.h/2)<43))toggleDoor(local,p);
  predictPlayer(local,p,input,DT);
  if(p.y>local.map.height||dangerous(local.map,p))break;
  if(p.ground){const node=regionAt(regions,p);if(node)visit(node.id,{x:p.x,y:p.y});}
 }
}
const reach=(edges,starts)=>{const found=new Set(starts),queue=[...starts];for(let i=0;i<queue.length;i++)for(const next of edges[queue[i]])if(!found.has(next)){found.add(next);queue.push(next);}return found;};
export function auditArena(arena,{zombie=false,variant='intact',map}={}){
 const s=createState(zombie?'zombie':'party',{arena,players:4});s.phase='playing';if(map)s.map=structuredClone(map);
 if(variant!=='intact')for(const b of s.map.platforms)if(Number.isFinite(b.hp))b.destroyed=true;
 if(variant==='destroyed'||variant==='cover')for(const b of s.map.objects)if(Number.isFinite(b.hp)&&(variant==='destroyed'||b.h<=50))b.destroyed=true;
 s._terrainCache=null;const regions=standingRegions(s),edges=regions.map(()=>new Set()),spawnNodes=[];
 for(const region of regions)for(const x of region.launches)for(const scheme of schemes)trace(s,regions,bodyAt(s,x,region.y,region.h),scheme,to=>edges[region.id].add(to));
 const failures=[];
 for(const [slot,[x,y]] of s.map.spawn.entries()){
  const p=bodyAt(s,x,y);p.ground=false;const nodes=new Set();
  for(const scheme of [{move:0},...schemes])trace(s,regions,p,scheme,to=>nodes.add(to));
  spawnNodes.push(nodes);if(!nodes.size)failures.push({type:'spawn',slot:slot+1,x,y});
 }
 // Everyone must be able to reach every safe standing region, and return from it.
 const allSpawnReach=spawnNodes.map(nodes=>reach(edges,nodes));
 const disconnected=regions.filter(r=>allSpawnReach.some(found=>!found.has(r.id)));
 const reverse=regions.map(()=>new Set());edges.forEach((set,from)=>set.forEach(to=>reverse[to].add(from)));
 const canReturn=spawnNodes.map(nodes=>reach(reverse,nodes));
 const traps=regions.filter(r=>canReturn.some(found=>!found.has(r.id)));
 if(variant==='intact')for(const r of disconnected)failures.push({type:'unreachable',x:Math.round((r.min+r.max)/2),y:r.y+r.h,width:Math.round(r.max-r.min+16)});
 for(const r of traps)failures.push({type:'trap',x:Math.round((r.min+r.max)/2),y:r.y+r.h,width:Math.round(r.max-r.min+16)});
 return {arena,name:MAPS[arena].name,zombie,variant,regions:regions.length,inaccessible:disconnected.length,failures};
}
export function auditAll(options={}){return MAPS.map((_,arena)=>auditArena(arena,options));}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const arena=process.argv.indexOf('--arena'),variant=process.argv.indexOf('--variant');
 const options={zombie:process.argv.includes('--zombie'),variant:variant<0?'intact':process.argv[variant+1]};
 const indices=arena<0?MAPS.map((_,i)=>i):[Number(process.argv[arena+1])];
 let failed=false;for(const index of indices){const result=auditArena(index,options);console.log(JSON.stringify(result));failed ||=result.failures.length>0;}
 if(failed)process.exitCode=1;
}
