import {treePlatforms} from './terrain.js';
// Original materials and arena props, drawn at world-pixel scale.
const r=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
const MATERIALS={wood:['#e4bd81','#a77648','#694631'],log:['#c69b6a','#8b603d','#503b2c'],rope:['#d3b785','#9e8154','#5c4934'],grass:['#c7d685','#809c56','#4e6844'],leaf:['#c2d590','#658954','#385e49'],metal:['#bcc2bb','#6b8284','#3b535f'],container:['#e2b47f','#9f7163','#543f50'],brick:['#dfbaa2','#a57d71','#6f5456'],stone:['#c7c5a4','#8b947d','#535f59'],sandstone:['#f0d5a0','#c5a36f','#92714d'],tile:['#b8e0c7','#69a59c','#3e706f'],ice:['#f5ffff','#67cce9','#267aab'],glass:['#e1ffff','#77c5d277','#315c7166'],basalt:['#ac9289','#665d64','#413d4c'],conveyor:['#e7c978','#586d7b','#364454']};
export function drawMaterial(c,b,time=0){
 if(b.destroyed)return;const kind=b.material||'wood',[top,face,dark]=MATERIALS[kind]||MATERIALS.wood;
 r(c,b.x,b.y+3,b.w,b.h,'#17232e');r(c,b.x+1,b.y+1,b.w-2,Math.max(3,b.h-2),face);r(c,b.x,b.y,b.w,3,top);
 if(kind==='glass'){r(c,b.x+2,b.y+3,2,b.h-4,'#efffff');for(let x=b.x+8;x<b.x+b.w-3;x+=38){r(c,x,b.y+4,12,1,'#d4f8ff');r(c,x+4,b.y+6,8,1,'#d4f8ff66');}return;}
 if(kind==='leaf'){for(let x=b.x+5;x<b.x+b.w;x+=17){r(c,x,b.y-4,12,5,face);r(c,x+3,b.y+6,10,5,dark);}return;}
 if(kind==='log'){for(let y=b.y+5;y<b.y+b.h;y+=6)r(c,b.x+3,y,b.w-6,1,dark);r(c,b.x+2,b.y+3,3,b.h-4,top);r(c,b.x+b.w-6,b.y+3,3,b.h-4,top);return;}
 if(kind==='ice'){
  r(c,b.x,b.y-2,b.w,4,'#f2ffff');r(c,b.x+2,b.y+4,b.w-4,2,'#a9f4ff');
  for(let x=b.x+8;x<b.x+b.w-6;x+=29){const depth=Math.min(b.h-4,13);r(c,x,b.y+6,2,depth,dark);r(c,x-5,b.y+9,7,1,'#dfffff');r(c,x+2,b.y+depth,8,1,dark);r(c,x+10,b.y+b.h,3,7,face);r(c,x+11,b.y+b.h+7,1,4,top);}
  c.save();c.beginPath();c.rect(b.x,b.y,b.w,b.h);c.clip();for(let x=b.x+(time*18)%80-15;x<b.x+b.w;x+=80){r(c,x,b.y+3,2,b.h-3,'#ffffff55');r(c,x+4,b.y+3,5,b.h-3,'#ffffff22');}c.restore();return;
 }
 if(kind==='rope'){for(let x=b.x+3;x<b.x+b.w;x+=12){r(c,x,b.y+3,8,5,face);r(c,x+8,b.y+3,2,5,dark);}c.strokeStyle='#bdae7a';c.lineWidth=1;for(const y of [b.y-5,b.y+8]){c.beginPath();c.moveTo(b.x,y);c.quadraticCurveTo(b.x+b.w/2,y+8,b.x+b.w,y);c.stroke();}return;}
 if(kind==='conveyor'){r(c,b.x+1,b.y+4,b.w-2,5,dark);for(let x=b.x+((time*(b.belt||60))%14+14)%14;x<b.x+b.w-5;x+=14)r(c,x,b.y+1,6,2,top);for(const x of [b.x+5,b.x+b.w-8]){r(c,x,b.y+7,4,4,face);r(c,x+1,b.y+8,2,2,top);}return;}
 if(kind==='container'){for(let x=b.x+8;x<b.x+b.w-3;x+=14){r(c,x,b.y+5,2,b.h-9,dark);r(c,x+2,b.y+5,1,b.h-9,top);}r(c,b.x+2,b.y+b.h-3,b.w-4,2,top);return;}
 if(kind==='brick'||kind==='stone'||kind==='sandstone'||kind==='basalt'||kind==='tile'||kind==='grass'){
  const height=b.oneWay?b.h:b.h,step=kind==='tile'?12:kind==='brick'?14:18,width=kind==='tile'?16:30;
  for(let row=0,y=b.y+5;y<b.y+height-2;row++,y+=step){r(c,b.x+2,y,b.w-4,1,dark);for(let x=b.x+2+(row%2?width/2:0);x<b.x+b.w-2;x+=width)r(c,x,y,1,Math.min(step,b.y+height-y),dark);}
  if(kind==='grass')for(let x=b.x+4;x<b.x+b.w-4;x+=19){r(c,x,b.y-3,1,4,'#c6df86');r(c,x+2,b.y-2,1,3,'#82b16a');}
 }else{
  for(let x=b.x+6;x<b.x+b.w;x+=20){r(c,x,b.y+4,1,Math.max(1,b.h-7),dark);r(c,x+4,b.y+5,6,1,top);}
 }
 // Structural supports vary by material; natural islands and masonry have solid faces.
 if(b.oneWay&&['wood','metal','conveyor'].includes(kind))for(const x of [b.x+8,b.x+b.w-12]){r(c,x,b.y+b.h,4,10,dark);r(c,x-3,b.y+b.h+9,10,2,dark);}
 if(b.flash>0)r(c,b.x,b.y,b.w,b.h,'#fff4c555');
}
export function drawDecorations(c,map,time=0){
 for(const d of map.decorations||[]){c.save();c.globalAlpha=.36;
  if(d.type==='arch'){r(c,d.x,d.y,25,d.h,'#b69d83');r(c,d.x+d.w-25,d.y,25,d.h,'#b69d83');r(c,d.x,d.y,d.w,22,'#b69d83');r(c,d.x+6,d.y+6,d.w-12,3,'#e7cc9c');}
  if(d.type==='pipe'){r(c,d.x,d.y,d.w,d.h,'#89a29c');r(c,d.x+3,d.y,3,d.h,'#d1d9b8');for(let y=d.y+15;y<d.y+d.h;y+=40)r(c,d.x-4,y,d.w+8,5,'#c8c39f');}
  if(d.type==='chain')for(let y=d.y;y<d.y+d.h;y+=13){r(c,d.x,y,7,10,'#b3b8b9');r(c,d.x+2,y+2,3,6,'#273946');}
  if(d.type==='bamboo')for(let n=0;n<4;n++){const x=d.x+n*12;r(c,x,d.y-d.h+n*15,5,d.h-n*15,'#a9ba76');for(let y=d.y-d.h+10;y<d.y;y+=30)r(c,x-1,y,7,3,'#d6d594');}
  if(d.type==='crystal'){for(let n=0;n<3;n++){c.fillStyle=['#a0dfec','#c0b6ee','#a0dfec'][n];c.beginPath();c.moveTo(d.x+n*15,d.y);c.lineTo(d.x+n*15-7,d.y-d.h*.7);c.lineTo(d.x+n*15+2,d.y-d.h+n*18);c.lineTo(d.x+n*15+16,d.y);c.fill();}}
  if(d.type==='gear'){c.translate(d.x,d.y);c.rotate(time*.12);for(let n=0;n<12;n++){c.rotate(Math.PI/6);r(c,-5,-d.r-3,10,10,'#c6a578');}c.strokeStyle='#c6a578';c.lineWidth=8;c.beginPath();c.arc(0,0,d.r-5,0,Math.PI*2);c.stroke();r(c,-4,-d.r,8,d.r*2,'#c6a578');r(c,-d.r,-4,d.r*2,8,'#c6a578');}
  if(d.type==='dome'){c.strokeStyle='#b5cbda';c.lineWidth=5;c.beginPath();c.ellipse(d.x+d.w/2,d.y+d.h,d.w/2,d.h,0,Math.PI,Math.PI*2);c.stroke();r(c,d.x+d.w/2-3,d.y,6,d.h,'#b5cbda');}
  if(d.type==='banner'){r(c,d.x,d.y,d.w,d.h,'#bb8061');r(c,d.x+4,d.y+4,d.w-8,d.h-14,'#d1b474');r(c,d.x+d.w/2-3,d.y+20,6,d.h-55,'#6a8061');}
  c.restore();
 }
}
export function drawObjects(c,map,time=0){
 for(const o of map.objects||[]){if(o.destroyed)continue;
  if(o.type==='tree'){
   r(c,o.x-2,o.y,o.w+4,o.h,'#33473c');r(c,o.x,o.y,o.w,o.h,'#946b48');r(c,o.x+3,o.y,3,o.h,'#cc9d69');for(let y=o.y+8;y<o.y+o.h-4;y+=19)r(c,o.x+9,y,6,2,'#5e4637');
   // Flat, bright upper edges line up exactly with the one-way landing surfaces.
   const branches=treePlatforms(o);
   for(const [n,b] of branches.entries()){
    const leaf=o.snow?'#699b96':'#397047',light=o.snow?'#efffff':'#b6d87c';
    r(c,b.x-3,b.y+4,b.w+6,11,'#284c3d');r(c,b.x,b.y,b.w,8,leaf);r(c,b.x+2,b.y,b.w-4,3,light);
    r(c,b.x+7,b.y+8,b.w-14,6,o.snow?'#90bfb8':'#568e53');
    if(!n){r(c,b.x+8,b.y+13,b.w-16,10,leaf);r(c,b.x+15,b.y+21,b.w-30,9,'#284c3d');}
    else {r(c,o.x+7,b.y+8,5,12,'#b48857');r(c,b.x+4,b.y+7,b.w-8,3,'#c39d62');}
    for(let x=b.x+9;x<b.x+b.w-4;x+=14)r(c,x,b.y+4,5,2,o.snow?'#cceeea':'#89b564');
   }
   r(c,o.x-8,o.y+o.h-4,o.w+16,4,'#604c38');
  }else if(o.type==='door'){
   r(c,o.x-3,o.y-4,o.w+6,o.h+4,'#543c36');
   if(o.open){r(c,o.x-5,o.y+3,4,o.h-3,'#d9b675');r(c,o.x-8,o.y+7,3,o.h-8,'#8f623d');r(c,o.x+o.w/2-1,o.y-5,3,3,'#8beca5');}
   else{r(c,o.x,o.y,o.w,o.h,'#bf9361');r(c,o.x+2,o.y+3,2,o.h-6,'#e3c68a');for(let y=o.y+9;y<o.y+o.h;y+=13)r(c,o.x+1,y,o.w-2,2,'#704934');r(c,o.x+o.w-4,o.y+o.h/2,3,3,'#f6d989');r(c,o.x+o.w/2-1,o.y-5,3,3,'#ffc982');}
  }else if(o.type==='barrel'){
   r(c,o.x,o.y+3,o.w,o.h-3,'#633d3c');r(c,o.x+2,o.y,o.w-4,o.h,'#be7956');r(c,o.x+3,o.y+3,o.w-6,2,'#ebbb77');for(const y of [o.y+8,o.y+20])r(c,o.x,y,o.w,3,'#374a4a');r(c,o.x+8,o.y+11,4,7,'#ffe596');r(c,o.x+6,o.y+14,8,2,'#ffe596');
  }else{
   const metal=o.material==='metal';r(c,o.x,o.y,o.w,o.h,'#27363e');r(c,o.x+1,o.y+1,o.w-2,o.h-2,metal?'#6b808b':'#bd8b56');r(c,o.x+3,o.y+3,o.w-6,o.h-6,metal?'#425b68':'#8f623d');r(c,o.x+3,o.y+3,o.w-6,2,metal?'#bad0d5':'#ecc892');
   for(let n=0;n<o.w-7;n++){r(c,o.x+4+n,o.y+4+n,2,2,metal?'#7c9ca7':'#d5ab70');r(c,o.x+o.w-5-n,o.y+4+n,2,2,metal?'#7c9ca7':'#d5ab70');}
  }
  if(o.flash>0)r(c,o.x,o.y,o.w,o.h,'#fff4c588');
 }
 for(const h of map.hazards||[]){
  if(h.type==='spring'){r(c,h.x,h.y,h.w,h.h,'#d4ca8a');r(c,h.x+3,h.y-4,h.w-6,4,'#bd7392');for(let x=h.x+4;x<h.x+h.w-4;x+=6)r(c,x,h.y+1,2,h.h,'#5d6775');}
  if(h.type==='ice')drawIcePatch(c,h,time);
  if(h.type==='lava'||h.type==='acid')drawLiquid(c,{...h,depth:Math.max(24,h.h)},time);
  if(h.type==='electric'){const active=time%(h.period||4)>(h.period||4)-(h.active||1.1);for(const x of [h.x,h.x+h.w-8]){r(c,x,h.y-28,8,28,'#527b8a');r(c,x-2,h.y-28,12,4,active?'#d7fbff':'#efc277');}if(active){c.strokeStyle='#bafaff';c.lineWidth=2;c.beginPath();for(let n=0;n<13;n++){const x=h.x+h.w*n/12,y=h.y-9+Math.sin(n*4+time*50)*7;if(n)c.lineTo(x,y);else c.moveTo(x,y);}c.stroke();}else for(let x=h.x+15;x<h.x+h.w-10;x+=25)r(c,x,h.y-2,5,2,'#eac178');}
 }
}
export function drawBattleEffects(c,s,time=0){
 for(const f of s.fields){if(f.kind==='acid'||f.kind==='ice'){c.save();c.globalAlpha=Math.min(1,f.life);if(f.kind==='acid')drawLiquid(c,{...f,type:'acid'},time);else drawIcePatch(c,f,time);c.restore();continue;}const color=f.kind==='ice'?'#c9f4ff':f.kind==='acid'?'#b8de6c':'#ffb75a';c.globalAlpha=Math.min(1,f.life);r(c,f.x,f.y+5,f.w,4,color);for(let x=f.x+2;x<f.x+f.w;x+=7){const h=f.kind==='fire'?5+Math.sin(time*13+x)*5:3+Math.sin(time*4+x)*2;r(c,x,f.y+5-h,4,h,color);if(f.kind==='fire')r(c,x+1,f.y+1-h,2,h*.5,'#ffe9ad');}c.globalAlpha=1;}
 for(const m of s.traps){r(c,m.x,m.y+2,m.w,4,'#4e5b5f');r(c,m.x+3,m.y,m.w-6,3,'#f0af79');r(c,m.x+6,m.y-2,2,2,m.arm<=0&&Math.sin(time*8)>0?'#ff6867':'#c7d093');if(m.arm<=0){c.globalAlpha=.15;c.strokeStyle='#ffb781';c.lineWidth=1;c.beginPath();c.arc(m.x+7,m.y,43,0,Math.PI*2);c.stroke();c.globalAlpha=1;}}
 for(const e of s.effects){c.save();c.globalAlpha=Math.min(1,e.life*7);c.strokeStyle=e.color||'#ffd29a';
  if(e.kind==='beam'){c.lineWidth=3;c.beginPath();c.moveTo(e.x,e.y);c.lineTo(e.x2,e.y2);c.stroke();c.strokeStyle='#fff8e8';c.lineWidth=1;c.stroke();}
  if(e.kind==='arc'){c.lineWidth=2;c.beginPath();e.points.forEach((p,i)=>{if(!i){c.moveTo(p.x,p.y);return;}const previous=e.points[i-1];for(let n=1;n<=6;n++)c.lineTo(previous.x+(p.x-previous.x)*n/6,previous.y+(p.y-previous.y)*n/6+(n<6?Math.sin(n*5+time*40)*6:0));});c.stroke();}
  if(e.kind==='blast'){c.lineWidth=2;c.beginPath();c.arc(e.x,e.y,e.radius*(1-e.life/.35),0,Math.PI*2);c.stroke();}
  c.restore();
 }
}

export function drawRooms(c,map,time=0){
 for(const room of map.rooms||[]){const {x,y,w,h}=room,metal=['pump','foundry'].includes(room.theme),face=metal?'#293c43':room.theme==='neon'?'#362e4b':'#4b403c';
  r(c,x,y,w,h,face);r(c,x+12,y+5,w-24,h-9,metal?'#354b51':'#66534b');
  for(let px=x+16;px<x+w-13;px+=22){r(c,px,y+5,1,h-10,metal?'#5c767c':'#8e6d52');r(c,px+5,y+10,7,1,'#ffffff12');}
  // Window, wall lamp, and equipment shelf make these real interiors, not loose gates.
  r(c,x+w/2-18,y+7,36,Math.min(16,h-18),'#142c37');r(c,x+w/2-16,y+9,32,Math.min(12,h-22),'#7cafb9');r(c,x+w/2-1,y+8,2,Math.min(14,h-20),'#203e48');
  r(c,x+20,y+5,7,3,'#ffe99a');r(c,x+22,y+2,3,3,'#a8a68b');r(c,x+15,y+8,17,h-12,'#ffde7a12');
  r(c,x+w-34,y+h-10,20,3,'#a39075');r(c,x+w-31,y+h-17,5,7,'#789c94');r(c,x+w-23,y+h-15,6,5,'#c3b47e');r(c,x+10,y+h-3,w-20,3,'#d3ae7344');
 }
}
export function drawIcePatch(c,h,time=0){
 r(c,h.x,h.y,h.w,h.h,'#57bddd');r(c,h.x,h.y,h.w,2,'#f3ffff');r(c,h.x+2,h.y+2,h.w-4,2,'#b9f6ff');
 for(let x=h.x+8;x<h.x+h.w-5;x+=23){r(c,x,h.y+3,1,Math.max(2,h.h-3),'#287ca6');r(c,x+1,h.y+4,5,1,'#f3ffff');r(c,x-3,h.y-2,7,1,'#dfffff');}
 // White six-point snowflake icon, repeated only on wide frozen patches.
 for(let x=h.x+16;x<h.x+h.w-9;x+=65){r(c,x,h.y-8,1,7,'#f4ffff');r(c,x-3,h.y-5,7,1,'#f4ffff');for(const d of [-2,2]){r(c,x+d,h.y-5+d,1,1,'#f4ffff');r(c,x+d,h.y-5-d,1,1,'#f4ffff');}}
}
export function drawLiquid(c,h,time=0){
 const depth=h.depth||h.h,lava=h.type==='lava',base=lava?'#ff541a':'#55c71c',bright=lava?'#fff07d':'#d6ff59',dark=lava?'#a82722':'#1c642e';
 c.save();c.globalAlpha*=.22;r(c,h.x,h.y-5,h.w,5,lava?'#ff9645':'#acff40');c.restore();
 r(c,h.x,h.y,h.w,depth,base);r(c,h.x,h.y,h.w,2,bright);r(c,h.x,h.y+depth-2,h.w,2,dark);
 c.save();c.beginPath();c.rect(h.x,h.y,h.w,depth);c.clip();
 for(let x=h.x-8;x<h.x+h.w;x+=19){const offset=Math.sin(time*3+x)*3;r(c,x+offset,h.y+3,11,2,lava?'#ffb52b':'#8cf13a');r(c,x+5-offset,h.y+Math.max(5,depth*.6),9,2,dark);if(lava){r(c,x+3,h.y+3,3,1,bright);r(c,x+offset+8,h.y+8,5,2,'#ffda45');r(c,x+offset+10,h.y+10,3,4,'#ff9a24');}else{r(c,x+offset+2,h.y+7,3,3,'#bcff46');r(c,x+offset+4,h.y+9,5,2,'#80e527');}}
 c.restore();
 for(let x=h.x+7;x<h.x+h.w-4;x+=23){const phase=(time*(lava?.7:.5)+x*.13)%1,rise=phase*12,px=x+Math.sin(time*2+x)*2;
  if(lava){r(c,px,h.y-rise-2,2,3,phase<.5?'#fff5a4':'#ff9335');const flame=3+Math.round((Math.sin(time*7+x)+1)*3);r(c,x+4,h.y-flame,5,flame,'#ffae2b');r(c,x+5,h.y-flame+2,3,flame-1,'#fff07d');}
  else {const size=phase<.6?4:6;c.strokeStyle=bright;c.lineWidth=1;c.strokeRect(Math.round(px),Math.round(h.y-rise),size,size);r(c,px+1,h.y-rise+1,1,1,'#f4ffbb');c.save();c.globalAlpha*=.15;r(c,x-3,h.y-18-rise,13,3,'#b7ff71');c.restore();}
 }
 // Scorched / corroded lips identify the pool edges at a glance.
 for(const x of [h.x-3,h.x+h.w]){r(c,x,h.y-2,3,6,dark);r(c,x,h.y-2,3,2,lava?'#a8a3a0':'#cadf76');}
}
