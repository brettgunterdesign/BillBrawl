// Independent input-only test player. It never changes the simulation or uses the game's bot navigation.
export function randomGenerator(seed){let value=seed>>>0;return()=>{value+=0x6D2B79F5;let n=value;n=Math.imul(n^n>>>15,n|1);n^=n+Math.imul(n^n>>>7,n|61);return((n^n>>>14)>>>0)/4294967296;};}
export function makeAgent(seed){
 const random=randomGenerator(seed),memory=new Map();
 return (s,p,tick)=>{
  const i={left:false,right:false,jump:false,down:false,fire:false,grab:false,chirp:false,strafe:false};if(!p.alive||s.phase!=='playing')return i;
  let m=memory.get(p.id);if(!m||m.round!==s.round){m={round:s.round,jumpUntil:0,nextJump:0,lastX:p.x,stalled:0};memory.set(p.id,m);}
  m.stalled=Math.abs(p.x-m.lastX)<.2?m.stalled+1:0;m.lastX=p.x;
  const distance=a=>Math.hypot(a.x-p.x,a.y-p.y),closest=list=>list.filter(a=>a.alive!==false).sort((a,b)=>distance(a)-distance(b))[0];
  const partner=s.zombie?closest(s.players.filter(a=>a.downed)):null;
  if(partner&&distance(partner)<36){i.grab=true;return i;}
  let goal=partner&&distance(partner)<140?partner:s.zombie?closest(s.enemies):closest(s.players.filter(a=>a.id!==p.id&&a.alive));
  if(!p.weapon||p.ammo===0){const item=closest(s.items.filter(a=>a.ammo!==0&&a.lock<=0&&!['medkit','ammo'].includes(a.type)));if(item)goal=item;if(p.ammo===0&&p.weapon)i.grab=!p.previous.grab;else if(item&&distance(item)<32)i.grab=!p.previous.grab;}
  if(s.zombie&&p.hp<p.maxHp*.55){const kit=closest(s.items.filter(a=>a.type==='medkit'));if(kit&&distance(kit)<180)goal=kit;}
  if(!goal)goal={x:s.map.width/2+Math.sin(tick/160+p.id)*s.map.width*.3,y:p.y};
  const dx=goal.x-p.x,dy=goal.y-p.y;i.left=dx<-12;i.right=dx>12;
  const door=s.map.objects.find(o=>o.type==='door'&&!o.open&&!o.destroyed&&Math.hypot(o.x+o.w/2-p.x-8,o.y+o.h/2-p.y-p.h/2)<38);
  if(door)i.grab=!p.previous.grab;
  if(p.ground&&tick>=m.nextJump&&(dy<-28&&Math.abs(dx)<160||m.stalled>20||tick%150===p.id*20)){
   m.jumpUntil=tick+24+Math.floor(random()*17);m.nextJump=m.jumpUntil+15;m.stalled=0;
   if(dy>35&&Math.abs(dx)<65){i.down=true;m.jumpUntil=tick+1;}
  }
  i.jump=tick<m.jumpUntil;
  if(dy>40&&Math.abs(dx)<80&&p.ground&&tick%100===0){i.down=true;i.jump=true;}
  if(p.weapon&&p.ammo!==0){const target=s.zombie?closest(s.enemies):closest(s.players.filter(a=>a.id!==p.id&&a.alive));if(target){const tx=target.x-p.x;i.strafe=true;
   // Face by input on a separate tick rather than editing the player's direction.
   if((tx>=0?1:-1)!==p.dir){i.strafe=false;i.left=tx<0;i.right=tx>0;}
   i.fire=Math.abs(target.y-p.y)<30||tick%120<20;if(p.weapon==='plasma')i.fire=i.fire&&tick%100<65;
  }}
  return i;
 };
}
