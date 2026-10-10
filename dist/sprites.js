// Original Bill Brawl pixel sprites. All positions are local to the feet or weapon grip.
export const SPECIES=['platypus','duck','pelican','toucan','puffin','shoebill'];
const INK='#202c31', LIGHT='#fff1d0';
const PLAYER_COLORS=['#ffcc64','#8eb6e6','#e98b89','#99c998'];
const MUZZLES={pistol:13,shotgun:20,smg:15,sniper:26,rocket:21,ricochet:17,flamethrower:21,railgun:24,crossbow:20,melee:14,grenade:4};
function pixel(ctx,x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
function box(ctx,x,y,w,h,c,border=INK){pixel(ctx,x,y,w,h,border);if(w>2&&h>2)pixel(ctx,x+1,y+1,w-2,h-2,c);}
function gunArt(ctx,type,time){
 const r=(x,y,w,h,c)=>pixel(ctx,x,y,w,h,c),b=(x,y,w,h,c)=>box(ctx,x,y,w,h,c);
 switch(type){
  case 'pistol':
   b(-7,-4,20,6,'#7d99aa');r(-5,-4,14,1,'#c2dce0');r(9,-3,4,3,'#343e48');r(11,-2,1,1,'#080f19');b(-4,1,6,8,'#9e6d45');r(-3,3,2,4,'#daa46b');r(2,2,4,1,'#202c31');r(5,-6,3,2,'#172831');break;
  case 'shotgun':
   b(-12,-3,32,5,'#526979');r(-6,-3,25,1,'#b8c7c8');r(17,-2,3,3,'#1d2930');b(-5,1,13,5,'#b77c40');r(-3,2,1,3,'#e6b16b');r(1,2,1,3,'#85522f');r(5,2,1,3,'#85522f');b(-14,0,10,7,'#935932');r(-13,2,5,3,'#c28d50');r(-5,-1,5,2,'#899295');r(-2,6,5,1,INK);break;
  case 'grenade':
   b(-6,-4,12,13,'#638645');r(-4,-3,7,2,'#a6c777');r(-5,1,10,1,'#344f37');r(-5,5,10,1,'#344f37');r(-2,-2,1,10,'#354f37');r(2,-2,1,10,'#354f37');b(-3,-8,6,5,'#c2c3a5');r(3,-7,5,2,'#e5d9b1');r(7,-5,1,6,'#b4b995');break;
  case 'smg':
   b(-10,-5,24,8,'#667781');r(-9,-4,12,2,'#9caab1');r(1,-3,6,4,'#323f4b');r(14,-3,3,3,INK);b(-7,2,5,7,'#d88743');b(2,2,6,9,'#a1b6bb');r(3,4,3,1,'#526d78');r(3,7,3,1,'#526d78');r(-13,-3,3,8,INK);r(-15,3,3,2,'#526979');r(5,-7,4,2,INK);r(11,-5,2,2,'#ffb649');break;
  case 'sniper':
   b(-12,-3,38,5,'#7b9693');r(-8,-3,31,1,'#d0d4bb');b(-6,1,13,4,'#b79050');b(-14,0,11,7,'#795c3a');r(-13,2,6,2,'#ae8a4a');r(24,-2,3,3,INK);b(-2,-10,15,6,'#3d4e59');r(-1,-9,10,1,'#819caa');r(11,-9,2,4,'#a7e4e8');r(1,-4,2,1,INK);r(8,-4,2,1,INK);r(14,2,2,5,'#293d40');r(12,7,3,1,'#293d40');r(17,7,3,1,'#293d40');break;
  case 'rocket':
   b(-14,-7,35,13,'#72924e');r(-12,-6,29,2,'#a3bb68');r(-13,2,30,2,'#3d563c');r(-15,-8,4,15,'#34483d');r(-14,-6,2,10,'#182c30');r(17,-8,5,15,'#283b38');r(19,-5,3,9,'#0d2228');r(-5,-6,3,11,'#eed278');r(9,-6,3,11,'#e5ac55');b(-4,5,5,7,'#9a7153');r(2,-10,7,3,'#526c4c');r(7,-12,2,3,'#ee8d56');break;
  case 'ricochet':
   b(-9,-6,22,10,'#d293c9');r(-6,-5,11,2,'#efb7e9');b(11,-4,7,6,'#6d60a6');r(14,-3,4,3,'#96eadf');r(-6,-2,2,4,'#6c4b8e');r(-2,-2,2,4,'#6c4b8e');r(2,-2,2,4,'#6c4b8e');b(-6,3,6,8,'#82658f');r(-4,5,2,4,'#d59cc8');b(3,3,6,5,'#65c7c6');r(4,4,3,2,LIGHT);r(-4,-9,8,3,'#96e1de');break;
  case 'flamethrower':
   b(-8,-3,29,7,'#92564b');r(-6,-2,17,2,'#dfa373');r(16,-4,6,9,'#3d3f43');r(17,-2,2,5,'#b9aba0');r(20,1,3,1,'#ffbb62');b(-12,-10,11,9,'#e69a45');r(-10,-9,7,2,'#ffe59a');r(-11,-5,9,1,'#b66d34');r(-5,-11,3,1,'#283f44');b(-5,3,5,7,'#6d5140');r(-11,0,3,9,'#343943');r(-8,8,9,2,'#343943');r(1,8,2,1,'#b59768');r(1,4,2,4,'#b59768');break;
  case 'railgun':
   b(-11,-6,35,11,'#345d75');r(-10,-5,29,2,'#769ca8');r(-8,-2,30,3,'#48d3e3');r(-7,-1,29,1,'#d0ffff');r(2,-7,3,13,'#213e54');r(9,-7,3,13,'#213e54');r(17,-7,3,13,'#213e54');r(23,-5,3,9,'#1b3347');b(-7,4,6,8,'#526273');r(-5,5,2,5,'#90a6b4');r(-11,-8,9,2,'#7bcedc');r(-9,-10,5,2,'#345d75');break;
  case 'crossbow':
   b(-12,-2,32,5,'#9b6b3d');r(-10,-1,28,1,'#e7c291');b(-6,2,6,7,'#8d5336');r(14,-12,3,24,'#674936');r(11,-13,4,2,'#ac8253');r(11,11,4,2,'#ac8253');r(9,-11,2,3,'#cfab73');r(9,8,2,3,'#cfab73');r(7,-8,1,16,'#e9d7ad');r(7,-1,17,1,'#d4d5c0');r(22,-2,4,3,'#657878');r(-1,-4,3,2,'#f0deaa');break;
  case 'melee':
   b(-9,0,23,5,'#ac7046');r(-7,1,20,1,'#e3b27c');r(-6,3,16,1,'#815338');b(8,-11,11,21,'#8da6b1');r(9,-10,7,4,'#c9e2e2');r(12,-11,6,4,'#adbec4');r(10,-2,6,6,'#607986');r(12,-12,6,3,'#8da6b1');r(14,-9,5,5,INK);r(16,7,4,3,'#c9e2e2');break;
  default:gunArt(ctx,'pistol',time);
 }
 // Fine machining highlights resolve cleanly on the 2× canvas backing store.
 if(type!=='grenade'&&type!=='melee'){r(-4,-2.5,2,.5,'#ffffff90');r(-1,-2.5,1,.5,'#ffffff60');}
 if(type==='grenade')r(-3.5,-2,1,1.5,'#d5df8f');
}
export function drawWeapon(ctx,x,y,type,dir=1,{time=0,scale=1}={}){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale((dir<0?-1:1)*scale,scale);gunArt(ctx,type,time);ctx.restore();
}
export function drawWeaponIcon(ctx,x,y,type,scale=1){drawWeapon(ctx,x,y,type,1,{scale});}
function palette(species,zombie){
 const colors={platypus:['#9b6948','#d0a173','#684631'],duck:['#e6d9bb','#fff3d6','#b3a787'],pelican:['#e2ddd0','#fff4dc','#a8b2a6'],toucan:['#293741','#f6da99','#42586a'],puffin:['#303945','#f7ecde','#506175'],shoebill:['#96a5a5','#c6d0c6','#637984']}[species]||['#9b6948','#d0a173','#684631'];
 return zombie?['#758775','#adbc8c','#425755']:colors;
}
function characterArt(ctx,p,species,time,color,zombie){
 const r=(x,y,w,h,c)=>pixel(ctx,x,y,w,h,c),b=(x,y,w,h,c)=>box(ctx,x,y,w,h,c);
 const [base,light,shade]=palette(species,zombie),dead=p.alive===false,walk=!dead&&Math.abs(p.vx||0)>12?Math.sin(time*17+(p.id||0)):0;
 const left=Math.round(Math.max(0,walk)*2),right=Math.round(Math.max(0,-walk)*2),call=(p.chirp||p.call||0)>0;
 const foot=zombie?'#58785c':species==='platypus'?'#b7a27d':'#e4a154';
 // Silhouettes: paddle tail, fan tail, pelican wing, toucan long tail, puffin stub, shoebill neck.
 if(species==='platypus'){
  b(-24,-11,14,10,shade);r(-26,-8,2,5,INK);r(-23,-10,11,7,zombie?'#7b9677':'#bd905b');
  for(let n=0;n<4;n++){r(-22+n*3,-9,1,6,shade);r(-23,-9+n*2,11,1,shade);}r(-23,-10,9,1,light);
 }else if(species==='duck'){r(-15,-12,6,9,INK);r(-16,-14,4,5,INK);r(-15,-13,3,4,light);r(-14,-9,6,4,base);}
 else if(species==='toucan'){r(-15,-12,5,15,INK);r(-14,-10,3,13,base);r(-13,0,3,4,shade);}
 else if(species==='puffin'){r(-14,-11,5,8,INK);r(-13,-9,4,5,shade);}
 else if(species==='pelican'){r(-15,-13,7,9,INK);r(-14,-12,5,6,shade);r(-17,-10,5,4,base);}
 else {r(-14,-10,6,8,INK);r(-13,-9,5,5,shade);r(-6,-26,8,12,INK);r(-5,-25,6,12,base);}
 // Feet remain at the same physical anchor for every species.
 b(-10,-3+left,10,4,foot);b(3,-3+right,10,4,foot);r(-8,-2+left,1,2,shade);r(-5,-2+left,1,2,shade);r(6,-2+right,1,2,shade);r(9,-2+right,1,2,shade);
 b(-12,-17,22,16,base);r(-10,-18,16,2,INK);r(-8,-16,13,2,light);r(-7,-12,15,9,light);r(-10,-10,5,8,base);r(-4,-4,9,2,base);
 // Wing or forearm has feather/fur highlights rather than one flat block.
 b(-12,-13,9,9,shade);r(-10,-12,5,2,base);r(-10,-8,5,1,base);r(-8,-6,3,1,light);
 if(!p.ground&&(p.vy||0)>30&&p.alive!==false){r(-16,-17,5,3,INK);r(-15,-16,5,1,light);}
 const headY=species==='shoebill'?-31:-28;
 b(-5,headY,16,15,base);r(-3,headY-1,11,1,INK);r(-3,headY+1,8,2,light);r(-4,headY+4,3,7,shade);r(0,headY+11,8,2,light);
 if(species==='platypus'){
  b(9,-20,15,7,zombie?'#a0af8d':'#b8b49a');r(11,-19,11,2,zombie?'#ced0a8':'#e1d1a7');r(12,-16,11,1,'#7d806c');r(20,-18,1,1,INK);r(22,-17,1,1,INK);r(8,-19,2,4,base);
 }else if(species==='duck'){
  b(9,-21,12,6,zombie?'#bfc278':'#f2bd55');r(11,-20,9,1,'#ffe49b');r(11,-17,9,1,'#c3793b');r(18,-19,1,1,INK);r(8,-21,3,3,base);
 }else if(species==='pelican'){
  b(9,-23,23,4,zombie?'#a6bb83':'#e6b273');r(11,-22,20,1,'#ffe0a0');r(29,-20,2,2,'#c48452');r(11,-19,18,3,INK);r(12,-18,15,3,zombie?'#93a970':'#e29e5a');r(15,-15,10,3,INK);r(16,-15,8,2,zombie?'#a1b678':'#f6bf73');r(19,-12,4,1,INK);
 }else if(species==='toucan'){
  b(9,-29,22,14,zombie?'#b8c375':'#ec9e49');r(11,-28,15,3,zombie?'#d5d49c':'#ffe075');r(11,-25,12,3,zombie?'#bac585':'#f6bd51');r(11,-22,13,3,zombie?'#889f77':'#ea8747');r(11,-19,12,2,'#dfbb59');r(26,-27,5,10,INK);r(28,-24,4,7,INK);r(10,-17,17,1,'#664539');r(10,-24,2,7,'#d8d285');r(-1,-16,9,3,light);r(1,-22,2,6,light);
 }else if(species==='puffin'){
  r(1,-27,9,12,light);r(-2,-27,3,10,shade);r(8,-26,2,2,base);
  b(10,-23,9,9,zombie?'#b0ba78':'#e58749');r(11,-22,3,6,'#f5c25b');r(15,-21,3,5,zombie?'#829568':'#d46342');r(19,-20,2,5,INK);r(13,-19,1,3,'#f4e0a0');r(6,-24,3,5,zombie?'#a2c699':'#a8cee2');
 }else {
  b(9,-26,18,12,zombie?'#a6b793':'#c0bd9d');r(11,-25,13,3,zombie?'#d0d6af':'#e9dec0');r(12,-20,14,1,'#8b947e');r(22,-22,5,6,'#afa784');r(25,-17,4,4,INK);r(26,-17,2,3,'#c0bd9d');r(17,-23,2,1,INK);r(-6,-33,3,7,shade);r(-3,-34,3,4,light);r(-8,-32,2,4,shade);
 }
 // Small fur and feather accents add detail without changing the silhouette.
 if(species==='platypus'){r(-7,-14,1.5,.5,light);r(-5,-11,1,.5,light);r(-3,-7,1.5,.5,base);r(2,-6,1.5,.5,base);r(-2,headY+5,1,.5,light);r(0,headY+3,1.5,.5,light);r(13,-18.5,4,.5,'#f4e2c1');}
 else {r(-5,-8,3,.5,base);r(-3,-6,3,.5,base);r(0,-4,3,.5,base);r(-9,-10,3,.5,light);r(-8,-8,2,.5,light);}
 // Eyes carry emotion and remain legible over light feathers.
 const eyeY=species==='shoebill'?-27:-24;
 if(dead){r(5,eyeY,4,1,INK);r(6,eyeY-1,1,3,INK);}else if(zombie){r(4,eyeY-1,5,4,'#314946');r(5,eyeY,3,2,'#c8ff79');r(7,eyeY,1,1,'#f1ffbc');}
 else {r(4,eyeY-1,5,5,INK);r(5,eyeY,3,3,LIGHT);r(7,eyeY,1,3,INK);r(5,eyeY,1,1,'#ffffff');}
 if(species==='shoebill')r(3,eyeY-2,7,2,shade);
 // Player caps and scarves keep identification visible despite radically different bills.
 if(zombie){
  r(-2,headY+3,4,3,'#455d53');r(-1,headY+3,2,1,'#aabd8b');r(-9,-7,4,4,'#526b59');r(-7,-6,3,2,'#cb8b71');r(4,-6,3,3,'#455d53');r(5,-5,2,1,'#9aa787');
  if(p.hp!==undefined&&p.hp<=1){r(2,-12,5,3,'#443e3b');r(3,-11,3,1,'#dbab82');r(-2,headY+7,2,4,'#405651');r(-1,headY+8,1,2,'#c0c78c');}
  r(-6,-16,13,2,'#695547');r(-9,-16,4,5,'#695547');r(-9,-13,2,2,'#94755d');
 }else {
  const capY=headY-4;
  b(-5,capY,15,5,color);r(-3,capY-2,10,2,INK);r(-2,capY-1,8,2,color);r(-2,capY+1,6,1,LIGHT);r(8,capY+3,6,2,INK);r(9,capY+3,5,1,color);r(3,capY+1,2,2,'#fff5db');
  b(-6,-16,14,4,color);r(-5,-15,11,1,LIGHT);r(-7,-13,5,7,INK);r(-6,-13,3,5,color);r(-9,-11,3,4,color);
 }
 if(p.weapon&&!dead&&!zombie){
  drawWeapon(ctx,8,-11,p.weapon,1,{time});b(0,-10,9,5,base);r(2,-9,5,1,light);
  if(p.flash>0&&p.weapon!=='grenade'&&p.weapon!=='melee'){
   const tip=8+(MUZZLES[p.weapon]||13),c=p.weapon==='railgun'?'#bcffff':p.weapon==='ricochet'?'#f2b9ff':'#ffdf85';
   r(tip,-14,5,7,c);r(tip+3,-12,6,3,LIGHT);r(tip+1,-16,2,11,c);r(tip+7,-13,2,1,c);r(tip+7,-9,2,1,c);
  }
 }else if(zombie){
  b(6,-15,8,4,shade);r(12,-14,4,2,light);if(p.flash>0)r(13,-15,5,4,'#e9eeaf');r(14,-16,1,3,'#ced5b2');r(15,-12,1,2,'#ced5b2');
 }
 if(call&&!dead){r(32,-31,2,5,zombie?'#c8ff79':'#fff1c8');r(36,-29,2,3,zombie?'#c8ff79':'#fff1c8');r(31,-23,3,1,zombie?'#c8ff79':'#fff1c8');}
}
export function drawCharacter(ctx,p,{species='platypus',time=0,color,zombie=false}={}){
 ctx.save();ctx.translate(Math.round(p.x+(p.w||16)/2),Math.round(p.y+(p.h||22)));ctx.scale(p.dir<0?-1:1,1);
 if(p.alive===false){ctx.translate(0,-11);ctx.rotate(time*6+(p.id||0));ctx.translate(0,11);}
 else if(p.h<=14)ctx.scale(1,.7);
 characterArt(ctx,p,SPECIES.includes(species)?species:'platypus',time,color||PLAYER_COLORS[(p.id||0)%PLAYER_COLORS.length],zombie);
 ctx.restore();
}
