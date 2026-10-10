// A shared camera follows combatants, not projectiles or eliminated ragdolls.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const ASPECT=16/9;
export function playerBounds(players){
 const actors=players.filter(p=>p.alive||p.downed);if(!actors.length)return null;
 return actors.reduce((b,p)=>{const leadX=clamp((p.vx||0)*.18,-38,38),leadY=clamp((p.vy||0)*.1,-25,25),feet=p.y+p.h;b.left=Math.min(b.left,p.x-25,p.x-25+leadX);b.right=Math.max(b.right,p.x+p.w+28,p.x+p.w+28+leadX);b.top=Math.min(b.top,feet-46,feet-46+leadY);b.bottom=Math.max(b.bottom,feet+7,feet+7+leadY);return b;},{left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity});
}
export class SharedCamera{
 constructor(){this.x=0;this.y=0;this.width=640;this.height=360;this.map=null;this.round=null;}
 full(map){this.map=map;this.width=map.width;this.height=map.height;this.x=0;this.y=0;}
 update(map,players,dt=1/60,round=0){
  const bounds=playerBounds(players);if(!bounds){if(this.map!==map)this.full(map);return;}
  const maxWidth=Math.max(map.width,map.height*ASPECT)+192;
  const targetWidth=clamp(Math.max(360,bounds.right-bounds.left+150,(bounds.bottom-bounds.top+130)*ASPECT),360,maxWidth);
  const targetX=(bounds.left+bounds.right)/2,targetY=(bounds.top+bounds.bottom)/2;
  const changed=this.map!==map||this.round!==round;this.map=map;this.round=round;
  // Pull back quickly, ease inward slowly. A safety frame keeps fast-moving players visible.
  const alpha=changed?1:1-Math.exp(-dt*(targetWidth>this.width?7:2.2));
  const cx=this.x+this.width/2,cy=this.y+this.height/2;
  this.width+= (targetWidth-this.width)*alpha;
  this.width=Math.max(this.width,bounds.right-bounds.left+90,(bounds.bottom-bounds.top+80)*ASPECT);
  this.height=this.width/ASPECT;
  const follow=changed?1:1-Math.exp(-dt*5);
  let x=cx+(targetX-cx)*follow,y=cy+(targetY-cy)*follow;
  x=clamp(x,bounds.right+42-this.width/2,bounds.left-42+this.width/2);
  y=clamp(y,bounds.bottom+36-this.height/2,bounds.top-36+this.height/2);
  x=clamp(x,this.width/2-96,map.width+96-this.width/2);
  // Extra sky/ground margin leaves room for bills and labels at the world's edges.
  const low=this.height/2-96,high=map.height+96-this.height/2;
  y=low<=high?clamp(y,low,high):map.height/2;
  this.x=x-this.width/2;this.y=y-this.height/2;
 }
 get scale(){return 640/this.width;}
 snapshot(){return {x:this.x,y:this.y,width:this.width,height:this.height,scale:this.scale};}
}
