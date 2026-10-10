// Original materials and arena props, drawn at world-pixel scale.
const r=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
const MATERIALS={wood:['#e4bd81','#a77648','#694631'],log:['#c69b6a','#8b603d','#503b2c'],rope:['#d3b785','#9e8154','#5c4934'],grass:['#c7d685','#809c56','#4e6844'],leaf:['#c2d590','#658954','#385e49'],metal:['#bcc2bb','#6b8284','#3b535f'],container:['#e2b47f','#9f7163','#543f50'],brick:['#dfbaa2','#a57d71','#6f5456'],stone:['#c7c5a4','#8b947d','#535f59'],sandstone:['#f0d5a0','#c5a36f','#92714d'],tile:['#b8e0c7','#69a59c','#3e706f'],ice:['#f1fbf7','#add7e3','#779fad'],glass:['#e1ffff','#77c5d277','#315c7166'],basalt:['#ac9289','#665d64','#413d4c'],conveyor:['#e7c978','#586d7b','#364454']};
export function drawMaterial(c,b,time=0){
 if(b.destroyed)return;const kind=b.material||'wood',[top,face,dark]=MATERIALS[kind]||MATERIALS.wood;
 r(c,b.x,b.y+3,b.w,b.h,'#17232e');r(c,b.x+1,b.y+1,b.w-2,Math.max(3,b.h-2),face);r(c,b.x,b.y,b.w,3,top);
 if(kind==='glass'){r(c,b.x+2,b.y+3,2,b.h-4,'#efffff');for(let x=b.x+8;x<b.x+b.w-3;x+=38){r(c,x,b.y+4,12,1,'#d4f8ff');r(c,x+4,b.y+6,8,1,'#d4f8ff66');}return;}
 if(kind==='leaf'){for(let x=b.x+5;x<b.x+b.w;x+=17){r(c,x,b.y-4,12,5,face);r(c,x+3,b.y+6,10,5,dark);}return;}
 if(kind==='log'){for(let y=b.y+5;y<b.y+b.h;y+=6)r(c,b.x+3,y,b.w-6,1,dark);r(c,b.x+2,b.y+3,3,b.h-4,top);r(c,b.x+b.w-6,b.y+3,3,b.h-4,top);return;}
 if(kind==='ice'){for(let x=b.x+9;x<b.x+b.w;x+=33){r(c,x,b.y+3,2,6,top);r(c,x+2,b.y+7,9,1,top);r(c,x+9,b.y+b.h,2,6,face);}return;}
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
   for(let n=0;n<4;n++){const w=58+n*13,x=o.x+o.w/2-w/2,y=o.y-22+n*13;r(c,x,y,w,14,o.snow?'#668a87':'#3e6c4a');r(c,x+5,y-4,w-10,7,o.snow?'#e6f4ed':'#85ab64');r(c,x+9,y+4,w-18,3,o.snow?'#bad9d4':'#a8c57c');}r(c,o.x-8,o.y+o.h-4,o.w+16,4,'#604c38');
  }else if(o.type==='door'){
   r(c,o.x-3,o.y-4,o.w+6,o.h+4,'#543c36');
   if(o.open){r(c,o.x-1,o.y,3,o.h,'#d9b675');r(c,o.x-5,o.y+3,5,2,'#c5ae77');}
   else{r(c,o.x,o.y,o.w,o.h,'#bf9361');r(c,o.x+2,o.y+3,2,o.h-6,'#e3c68a');for(let y=o.y+9;y<o.y+o.h;y+=13)r(c,o.x+1,y,o.w-2,2,'#704934');r(c,o.x+o.w-4,o.y+o.h/2,3,3,'#f6d989');}
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
  if(h.type==='ice'){r(c,h.x,h.y,h.w,h.h,'#beeafa');r(c,h.x+5,h.y+1,h.w-10,1,'#f0ffff');}
  if(h.type==='lava'||h.type==='acid'){const lava=h.type==='lava';r(c,h.x,h.y,h.w,h.h,lava?'#d26e39':'#7b9c43');r(c,h.x,h.y,h.w,2,lava?'#ffd074':'#d7f491');for(let x=h.x+4;x<h.x+h.w;x+=13){const rise=2+Math.round((Math.sin(time*5+x)+1)*3);r(c,x,h.y-rise,3,rise,lava?'#ffc169':'#abc769');}}
  if(h.type==='electric'){const active=time%(h.period||4)>(h.period||4)-(h.active||1.1);for(const x of [h.x,h.x+h.w-8]){r(c,x,h.y-28,8,28,'#527b8a');r(c,x-2,h.y-28,12,4,active?'#d7fbff':'#efc277');}if(active){c.strokeStyle='#bafaff';c.lineWidth=2;c.beginPath();for(let n=0;n<13;n++){const x=h.x+h.w*n/12,y=h.y-9+Math.sin(n*4+time*50)*7;if(n)c.lineTo(x,y);else c.moveTo(x,y);}c.stroke();}else for(let x=h.x+15;x<h.x+h.w-10;x+=25)r(c,x,h.y-2,5,2,'#eac178');}
 }
}
export function drawBattleEffects(c,s,time=0){
 for(const f of s.fields){const color=f.kind==='ice'?'#c9f4ff':f.kind==='acid'?'#b8de6c':'#ffb75a';c.globalAlpha=Math.min(1,f.life);r(c,f.x,f.y+5,f.w,4,color);for(let x=f.x+2;x<f.x+f.w;x+=7){const h=f.kind==='fire'?5+Math.sin(time*13+x)*5:3+Math.sin(time*4+x)*2;r(c,x,f.y+5-h,4,h,color);if(f.kind==='fire')r(c,x+1,f.y+1-h,2,h*.5,'#ffe9ad');}c.globalAlpha=1;}
 for(const m of s.traps){r(c,m.x,m.y+2,m.w,4,'#4e5b5f');r(c,m.x+3,m.y,m.w-6,3,'#f0af79');r(c,m.x+6,m.y-2,2,2,m.arm<=0&&Math.sin(time*8)>0?'#ff6867':'#c7d093');if(m.arm<=0){c.globalAlpha=.15;c.strokeStyle='#ffb781';c.lineWidth=1;c.beginPath();c.arc(m.x+7,m.y,43,0,Math.PI*2);c.stroke();c.globalAlpha=1;}}
 for(const e of s.effects){c.save();c.globalAlpha=Math.min(1,e.life*7);c.strokeStyle=e.color||'#ffd29a';
  if(e.kind==='beam'){c.lineWidth=3;c.beginPath();c.moveTo(e.x,e.y);c.lineTo(e.x2,e.y2);c.stroke();c.strokeStyle='#fff8e8';c.lineWidth=1;c.stroke();}
  if(e.kind==='arc'){c.lineWidth=2;c.beginPath();e.points.forEach((p,i)=>{if(!i){c.moveTo(p.x,p.y);return;}const previous=e.points[i-1];for(let n=1;n<=6;n++)c.lineTo(previous.x+(p.x-previous.x)*n/6,previous.y+(p.y-previous.y)*n/6+(n<6?Math.sin(n*5+time*40)*6:0));});c.stroke();}
  if(e.kind==='blast'){c.lineWidth=2;c.beginPath();c.arc(e.x,e.y,e.radius*(1-e.life/.35),0,Math.PI*2);c.stroke();}
  c.restore();
 }
}
