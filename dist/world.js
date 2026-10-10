const palettes={dock:['#edcfa7','#d4ae87','#789f8b'],roof:['#dda58c','#a68e99','#5e6679'],pump:['#aab4aa','#758e87','#48695f'],ruins:['#d3d9af','#91b487','#456950'],neon:['#1c213a','#30334d','#27324c'],snow:['#dcebee','#a9cddc','#6a8b9e'],foundry:['#3d323d','#60433f','#45373a']};
const rect=(ctx,x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);};
function cloud(ctx,x,y,w,c){rect(ctx,x,y,w,8,c);rect(ctx,x+10,y-5,w-20,6,c);rect(ctx,x+23,y-9,w-46,4,c);}
function building(ctx,x,y,w,h,c,window){rect(ctx,x,y,w,h,c);rect(ctx,x-3,y,w+6,4,c);for(let a=x+9;a<x+w-5;a+=18)for(let b=y+12;b<y+h-12;b+=23){rect(ctx,a,b,8,12,'#17282355');rect(ctx,a+1,b+1,5,7,window);}}
export function drawBackground(ctx,map,time=0,zombie=false){
 ctx.save();ctx.scale((map.width||640)/640,(map.height||360)/360);
 const theme=map.theme,[sky,mid,far]=palettes[theme]||palettes.dock;
 rect(ctx,0,0,640,360,sky);rect(ctx,0,90,640,100,mid);rect(ctx,0,285,640,75,far);
 if(theme==='neon'||theme==='foundry'){for(let n=0;n<38;n++)rect(ctx,(n*137)%640,(n*73)%146,1,n%5===0?2:1,'#d5bdbe');rect(ctx,497,32,25,25,'#e9cead');rect(ctx,503,29,14,31,'#e9cead');}
 else{rect(ctx,484,30,35,35,theme==='snow'?'#f5f4dc':'#f6d594');rect(ctx,477,38,49,20,theme==='snow'?'#f5f4dc':'#f6d594');cloud(ctx,31,46,92,'#f4e5ca');cloud(ctx,262,27,99,'#f4e5ca');cloud(ctx,521,98,82,'#f4e5ca');}
 if(theme==='snow'){
  for(let n=0;n<8;n++){const x=n*105-30;ctx.fillStyle=n%2?'#92b4c6':'#aacbd4';ctx.beginPath();ctx.moveTo(x,250);ctx.lineTo(x+80,110+n%3*21);ctx.lineTo(x+155,250);ctx.fill();ctx.fillStyle='#e8f1eb';ctx.beginPath();ctx.moveTo(x+58,151+n%3*21);ctx.lineTo(x+80,110+n%3*21);ctx.lineTo(x+105,158+n%3*21);ctx.fill();}
  for(let n=0;n<14;n++){const x=n*49-10;rect(ctx,x,226,5,80,'#476c70');for(let k=0;k<4;k++)rect(ctx,x-12-k*2,225+k*13,29+k*4,9,'#6b9090');}
  for(let n=0;n<45;n++)rect(ctx,(n*71+time*12)%660-10,(n*53+time*18)%350,2,2,'#edf6f0');
 }else if(theme==='ruins'){
  for(let n=0;n<13;n++){const x=n*53-14,y=168+n%3*13;rect(ctx,x,y,45,125,far);rect(ctx,x-9,y+20,60,30,far);rect(ctx,x+12,y-15,30,20,far);}
  rect(ctx,248,138,147,150,'#708c61');rect(ctx,240,134,163,10,'#94a779');for(const x of [257,310,365]){rect(ctx,x,144,20,143,'#889a6e');rect(ctx,x+3,147,3,138,'#afbc8b');}rect(ctx,296,190,54,97,'#45644c');for(let n=0;n<15;n++)rect(ctx,275+n*4,140+n*9,3,15,'#547950');
 }else{
  for(let n=0;n<12;n++){const x=n*65-25,y=163+Math.sin(n*2)*13;rect(ctx,x,y,75,65,far);rect(ctx,x+12,y-9,48,10,far);}
  const win=theme==='neon'?'#cc97c9':theme==='foundry'?'#e79555':'#b5c1a2';building(ctx,7,173,75,125,far,win);building(ctx,92,195,55,105,far,win);building(ctx,508,163,94,150,far,win);building(ctx,605,207,40,100,far,win);
  if(theme==='dock'){rect(ctx,180,77,8,225,'#759180');rect(ctx,156,75,128,7,'#759180');rect(ctx,182,53,4,25,'#759180');for(let n=0;n<5;n++)rect(ctx,193+n*15,68+n*2,19,3,'#759180');rect(ctx,254,82,1,66,'#759180');rect(ctx,248,148,13,6,'#759180');rect(ctx,246,154,3,7,'#759180');rect(ctx,465,116,5,192,'#8b9b80');rect(ctx,422,112,81,5,'#8b9b80');}
  if(theme==='roof'){building(ctx,250,249,140,111,far,win);rect(ctx,320,215,4,34,far);rect(ctx,303,213,36,3,far);rect(ctx,88,132,16,40,far);rect(ctx,535,122,18,40,far);}
  if(theme==='pump'||theme==='foundry'){for(const x of [28,596]){rect(ctx,x,203,16,117,far);rect(ctx,x-4,203,48,13,far);rect(ctx,x+3,215,3,105,'#7b95836b');}rect(ctx,300,152,42,76,far);rect(ctx,292,172,58,10,far);rect(ctx,321,133,5,30,far);for(let n=0;n<5;n++)cloud(ctx,312+Math.sin(time+n)*6,130-((time*13+n*23)%90),24+n*5,'#b9b5a039');}
  if(theme==='neon'){for(const [x,y,w,text,color]of [[23,197,62,'BILLS','#f78ab4'],[509,193,82,'NOODLES','#93e5db'],[92,238,49,'OPEN','#f0c785']]){rect(ctx,x-2,y-2,w+4,18,'#17213e');rect(ctx,x,y,w,14,color);rect(ctx,x+2,y+2,w-4,10,'#292c45');ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(text,x+w/2,y+10);}for(let n=0;n<9;n++){rect(ctx,n*85,290,65,5,n%2?'#a2688d':'#66879b');rect(ctx,n*85+4,295,2,30,'#374761');}}
 }
 ctx.restore();
 if(zombie){const width=map.width||640,height=map.height||360,floor=height-40;ctx.fillStyle='#16253335';ctx.fillRect(0,0,width,height);for(const x of [6,width-30]){rect(ctx,x,floor-50,24,50,'#263632');rect(ctx,x+3,floor-46,18,44,'#152723');rect(ctx,x+5,floor-42,14,3,'#95b574');}for(let n=0;n<Math.ceil(width/90);n++)rect(ctx,(n*123+time*8)%(width+90)-70,floor-34+n%3*17,92,3,'#a9caa318');}

}
export function drawArena(ctx,map){
 const theme=map.theme,metal=['pump','neon','foundry'].includes(theme),stone=theme==='ruins',ice=theme==='snow';
 for(const b of map.platforms){
  if(!b.oneWay&&b.h<32){const c=metal?'#667976':stone?'#89916a':ice?'#accfd2':'#b48b5a';rect(ctx,b.x,b.y,b.w,b.h,'#304b40');rect(ctx,b.x+1,b.y+1,b.w-2,b.h-2,c);rect(ctx,b.x+3,b.y+3,b.w-6,b.h-6,metal?'#465d59':stone?'#758055':ice?'#85b3c0':'#956b40');rect(ctx,b.x+2,b.y+2,b.w-4,2,ice?'#edf5ed':'#dac49b');for(let n=0;n<3;n++)rect(ctx,b.x+3+n*5,b.y+4+n*5,3,3,metal?'#9caf9b':'#cdb082');continue;}
  const top=ice?'#e6f2ed':stone?'#b3ba88':metal?'#9da59c':'#d7b27c',side=ice?'#8ab6c1':stone?'#727e56':metal?'#4b6361':'#795c3d';
  rect(ctx,b.x,b.y+3,b.w,b.h,'#243c3560');rect(ctx,b.x,b.y,b.w,b.h,'#31463d');rect(ctx,b.x,b.y,b.w,3,top);rect(ctx,b.x,b.y+3,b.w,3,ice?'#c4e0e0':stone?'#879660':metal?'#697d72':'#e4c793');rect(ctx,b.x,b.y+6,b.w,b.oneWay?6:9,side);
  for(let x=b.x+5;x<b.x+b.w;x+=19){rect(ctx,x,b.y+1,1,1,'#445344');rect(ctx,x+6,b.y+7,8,1,metal?'#8e9b8e':ice?'#cee8e2':'#b39566');}
  if(stone)for(let x=b.x+8;x<b.x+b.w;x+=27)rect(ctx,x,b.y+11,12,2,'#4f774d');
  if(ice)for(let x=b.x+7;x<b.x+b.w;x+=31){rect(ctx,x,b.y+10,2,9,'#b4d8dc');rect(ctx,x,b.y+18,1,4,'#d6e9e4');}
  if(b.oneWay){for(const x of [b.x+8,b.x+b.w-13]){rect(ctx,x,b.y+12,5,17,metal?'#496460':stone?'#697b54':'#52705a');rect(ctx,x-2,b.y+27,9,3,metal?'#496460':stone?'#697b54':'#52705a');}}
  else for(let x=b.x+12;x<b.x+b.w;x+=42){rect(ctx,x,b.y+15,8,40,side);rect(ctx,x+2,b.y+17,2,38,top);}
 }
}
export function drawWater(ctx,map,tide,time=0){const lava=map.theme==='foundry',width=map.width||640,height=map.height||360;rect(ctx,0,tide,width,Math.max(0,height-tide),lava?'#9e543a':'#477c77');rect(ctx,0,tide,width,2,lava?'#ffb960':'#90c5b3');for(let n=0;n<Math.ceil(width/23);n++)rect(ctx,(n*27+time*12)%(width+20)-15,tide+4+n%3*5,14,1,lava?'#ef8f50':'#76aaa0');}
export function drawMapPreview(ctx,map,time=0,zombie=false){ctx.save();ctx.scale(640/map.width,360/map.height);drawBackground(ctx,map,time,zombie);drawArena(ctx,map);drawWater(ctx,map,map.height-8,time);ctx.restore();}
