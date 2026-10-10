const p=(x,y,w,h=12,oneWay=true)=>({x,y,w,h,oneWay});
export const WEAPONS={
 pistol:{name:'PISTOL',ammo:12,cooldown:.24,speed:780,damage:34,color:'#efc975',desc:'Reliable single shots. Keep moving.',kind:'bullet'},
 shotgun:{name:'SHOTGUN',ammo:6,cooldown:.7,speed:680,damage:23,color:'#e69a64',desc:'Five pellets. Big recoil. Short reach.',kind:'bullet'},
 grenade:{name:'GRENADE',ammo:4,cooldown:.55,damage:135,radius:72,color:'#a9c785',desc:'A bouncing fuse. Watch your own blast.',kind:'grenade'},
 smg:{name:'SMG',ammo:40,cooldown:.075,speed:850,damage:14,color:'#e3d18b',desc:'Fast bursts. Burns through ammunition.',kind:'bullet'},
 sniper:{name:'SNIPER',ammo:6,cooldown:1.05,speed:1350,damage:145,color:'#9bd0d8',desc:'Long sightlines. Heavy shot. Slow follow-up.',kind:'bullet'},
 rocket:{name:'ROCKET',ammo:4,cooldown:.9,speed:350,damage:150,radius:68,color:'#f3ab6a',desc:'Splash damage. Give yourself some room.',kind:'rocket'},
 ricochet:{name:'BOUNCE GUN',ammo:16,cooldown:.28,speed:480,damage:32,color:'#ce9ce3',desc:'Three bounces. Bank shots around corners.',kind:'bounce'},
 flamethrower:{name:'FLAMETHROWER',ammo:90,cooldown:.065,speed:260,damage:9,color:'#ff9168',desc:'A close-range stream of fire.',kind:'flame'},
 railgun:{name:'RAILGUN',ammo:5,cooldown:1.25,speed:1900,damage:200,color:'#89f0d6',desc:'Pierces enemies. Make your shot count.',kind:'rail'},
 crossbow:{name:'CROSSBOW',ammo:10,cooldown:.6,speed:520,damage:100,color:'#d6c18a',desc:'A heavy bolt with a gentle falling arc.',kind:'bolt'},
 melee:{name:'BILL HAMMER',ammo:-1,cooldown:.42,damage:80,color:'#e7b9a5',desc:'No ammunition. A dangerous close encounter.',kind:'melee'}
};
const compactMaps=[
 {name:'DOCKSIDE',theme:'dock',tag:'HARBOUR / DAY',spawn:[[62,286],[560,286],[126,135],[494,135]],platforms:[p(0,320,270,40,false),p(370,320,270,40,false),p(65,260,125),p(450,260,125),p(235,220,170),p(110,170,120),p(410,170,120),p(265,120,110),p(205,295,22,25,false),p(413,295,22,25,false)],items:[[100,236,'pistol'],[520,236,'pistol'],[282,196,'shotgun'],[350,196,'smg'],[155,145,'grenade'],[465,145,'crossbow'],[312,98,'railgun']]},
 {name:'ROOFTOP RUMBLE',theme:'roof',tag:'CITY / SUNSET',spawn:[[55,285],[570,285],[155,158],[480,158]],platforms:[p(0,320,230,40,false),p(410,320,230,40,false),p(235,290,170),p(40,245,145),p(455,245,145),p(125,190,135),p(380,190,135),p(275,145,90),p(40,95,100),p(500,95,100),p(202,291,20,29,false),p(418,291,20,29,false)],items:[[82,220,'pistol'],[540,220,'pistol'],[190,165,'sniper'],[435,165,'sniper'],[300,120,'rocket'],[337,120,'grenade'],[80,70,'crossbow'],[545,70,'ricochet']]},
 {name:'PUMP STATION',theme:'pump',tag:'INDUSTRIAL / DUSK',spawn:[[50,285],[573,285],[110,118],[510,118]],platforms:[p(0,320,640,40,false),p(75,255,150),p(415,255,150),p(265,260,110),p(180,200,100),p(360,200,100),p(75,150,90),p(475,150,90),p(270,120,100),p(310,290,20,30,false)],items:[[90,230,'pistol'],[533,230,'pistol'],[220,175,'flamethrower'],[420,175,'smg'],[292,95,'ricochet'],[340,95,'rocket'],[315,237,'melee']]},
 {name:'SUNKEN TEMPLE',theme:'ruins',tag:'ANCIENT / JUNGLE',spawn:[[45,287],[575,287],[175,137],[445,137]],platforms:[p(0,320,250,40,false),p(390,320,250,40,false),p(260,300,120),p(40,265,130),p(470,265,130),p(180,245,95),p(365,245,95),p(130,190,130),p(380,190,130),p(270,150,100),p(195,95,95),p(350,95,95)],items:[[80,240,'pistol'],[540,240,'pistol'],[205,165,'crossbow'],[425,165,'crossbow'],[300,125,'railgun'],[230,70,'grenade'],[382,70,'melee'],[305,275,'shotgun']]},
 {name:'NEON NIGHT MARKET',theme:'neon',tag:'CITY / MIDNIGHT',spawn:[[45,287],[575,287],[135,157],[490,157]],platforms:[p(0,320,640,40,false),p(25,265,135),p(480,265,135),p(185,265,110),p(345,265,110),p(100,205,145),p(395,205,145),p(265,155,110),p(40,140,85),p(515,140,85),p(280,95,80),p(305,292,30,28,false)],items:[[75,240,'pistol'],[545,240,'pistol'],[190,180,'smg'],[450,180,'smg'],[300,130,'ricochet'],[65,115,'flamethrower'],[550,115,'shotgun'],[310,70,'railgun']]},
 {name:'FROSTBITE COVE',theme:'snow',tag:'ARCTIC / ICE',grip:.55,spawn:[[45,287],[575,287],[140,147],[485,147]],platforms:[p(0,320,280,40,false),p(360,320,280,40,false),p(55,265,140),p(445,265,140),p(235,265,170),p(110,205,130),p(400,205,130),p(265,155,110),p(70,140,90),p(480,140,90),p(260,95,120)],items:[[95,240,'pistol'],[525,240,'pistol'],[165,180,'sniper'],[455,180,'crossbow'],[290,130,'shotgun'],[335,130,'grenade'],[105,115,'ricochet'],[515,115,'rocket'],[310,70,'railgun']]},
 {name:'EMBER WORKS',theme:'foundry',tag:'FACTORY / FIRE',spawn:[[45,287],[575,287],[140,132],[485,132]],platforms:[p(0,320,210,40,false),p(430,320,210,40,false),p(230,305,180),p(35,260,130),p(475,260,130),p(180,240,110),p(350,240,110),p(110,185,130),p(400,185,130),p(265,135,110),p(270,80,100),p(193,293,17,27,false),p(430,293,17,27,false)],items:[[75,235,'pistol'],[545,235,'pistol'],[215,215,'flamethrower'],[395,215,'rocket'],[160,160,'shotgun'],[460,160,'smg'],[315,110,'grenade'],[305,55,'railgun'],[280,280,'melee']]}
];
// Platform sizes and jump spacing remain human-sized as the worlds expand.
const tower=(xs,floor,levels,width=150)=>Array.from({length:levels},(_,row)=>xs.map((x,column)=>p(x+(row%2?15:-10)*(column%2?-1:1),floor-60-row*55,width))).flat();
const roof={width:960,height:540,size:'MEDIUM',spawn:[[55,466],[890,466],[230,308],[680,308]],platforms:[p(0,500,315,40,false),p(650,500,310,40,false),p(345,485,270),...tower([55,240,430,635,795],500,7,120),p(210,440,250),p(515,440,220),p(220,330,260),p(565,330,250),p(110,220,240),p(500,220,290),p(370,110,220)],items:[[95,474,'pistol'],[852,474,'pistol'],[408,459,'shotgun'],[558,459,'smg'],[280,414,'sniper'],[683,414,'crossbow'],[445,304,'rocket'],[725,304,'ricochet'],[210,194,'grenade'],[680,194,'sniper'],[465,84,'railgun']]};
const temple={width:1280,height:720,size:'LARGE',spawn:[[50,646],[1214,646],[462,488],[810,488]],platforms:[p(0,680,330,40,false),p(450,680,380,40,false),p(950,680,330,40,false),p(325,665,140),p(815,665,150),...tower([55,270,480,705,925,1100],680,11,145),p(230,565,260),p(725,565,250),p(445,455,330),p(230,345,270),p(720,345,300),p(435,235,350),p(510,70,260)],items:[[95,654,'pistol'],[1165,654,'pistol'],[360,639,'shotgun'],[870,639,'smg'],[530,594,'crossbow'],[775,594,'crossbow'],[365,539,'melee'],[835,539,'grenade'],[555,429,'rocket'],[700,429,'ricochet'],[380,319,'flamethrower'],[870,319,'sniper'],[570,209,'railgun'],[700,44,'railgun']]};
const market={width:960,height:540,size:'MEDIUM',spawn:[[45,466],[899,466],[300,308],[660,308]],platforms:[p(0,500,960,40,false),...tower([45,245,445,655,810],500,7,125),p(285,472,24,28,false),p(654,472,24,28,false),p(180,440,220),p(575,440,200),p(220,330,280),p(605,330,235),p(135,220,260),p(520,220,280),p(325,110,320)],items:[[85,474,'pistol'],[855,474,'pistol'],[295,414,'smg'],[680,414,'smg'],[400,304,'ricochet'],[710,304,'shotgun'],[225,194,'flamethrower'],[630,194,'crossbow'],[435,84,'railgun'],[550,84,'grenade']]};
const ice={width:1280,height:720,size:'LARGE',spawn:[[45,646],[1219,646],[330,488],[1000,488]],platforms:[p(0,680,300,40,false),p(480,680,320,40,false),p(980,680,300,40,false),p(285,665,215),p(780,665,215),...tower([45,270,505,735,965,1115],680,11,145),p(245,565,260),p(785,565,230),p(320,455,640),p(195,345,300),p(770,345,300),p(365,235,535),p(440,125,400)],items:[[95,654,'pistol'],[1165,654,'pistol'],[350,639,'shotgun'],[880,639,'grenade'],[360,539,'sniper'],[870,539,'crossbow'],[500,429,'ricochet'],[760,429,'rocket'],[320,319,'smg'],[945,319,'flamethrower'],[615,209,'railgun'],[520,99,'sniper'],[760,99,'railgun']]};
const foundry={width:1600,height:900,size:'HUGE',spawn:[[50,826],[1534,826],[530,558],[1045,558]],platforms:[p(0,860,350,40,false),p(470,860,660,40,false),p(1250,860,350,40,false),p(335,845,155),p(1110,845,160),...tower([55,465,875,1290],860,14,195),...Array.from({length:5},(_,row)=>[p(245,800-row*165,235),p(655,800-row*165,235),p(1065,800-row*165,235)]).flat(),p(335,690,270),p(965,690,270),p(580,525,470),p(330,360,285),p(985,360,300),p(580,195,440),p(700,80,200)],items:[[100,834,'pistol'],[1475,834,'pistol'],[395,819,'smg'],[1185,819,'shotgun'],[740,834,'melee'],[375,774,'flamethrower'],[790,774,'rocket'],[1175,774,'smg'],[445,664,'shotgun'],[1090,664,'crossbow'],[680,499,'grenade'],[935,499,'ricochet'],[440,334,'sniper'],[1120,334,'flamethrower'],[690,169,'railgun'],[915,169,'rocket'],[805,54,'railgun']]};
const expanded={1:roof,3:temple,4:market,5:ice,6:foundry};
const originalMaps=compactMaps.map((map,index)=>{const result={width:640,height:360,size:'SMALL',...map,...expanded[index]};result.tideDelay=25+(result.width-640)/160*1.4;return result;});

// Each attack declares its own reach, travel time, recoil and resource budget.
const weaponDetails={
 pistol:{speed:780,life:.68,range:530,recoil:18,role:'SIDEARM',desc:'12 precise shots. Medium reach. Quick recovery.'},
 shotgun:{pellets:5,spread:.14,life:.3,range:200,recoil:115,role:'SCATTER',desc:'Five pellets. Short reach. Heavy recoil breaks wooden cover.'},
 grenade:{fuse:1.35,throwSpeed:220,throwY:-240,radius:76,range:200,role:'EXPLOSIVE',desc:'Four bouncing grenades. 1.35-second fuses; blasts break cover.'},
 smg:{life:.44,range:375,recoil:10,role:'AUTOMATIC',desc:'40 rapid shots. Medium reach. Small impacts; easy to control.'},
 sniper:{life:.95,range:1280,recoil:65,role:'PRECISION',desc:'Six powerful rounds. Longest bullet reach. Slow follow-up.'},
 rocket:{life:1.9,radius:92,range:660,recoil:45,role:'EXPLOSIVE',desc:'Four slow rockets. Wide impact blasts destroy cover and hurt you.'},
 ricochet:{life:3.2,bounces:5,range:500,recoil:8,role:'TRICK SHOT',desc:'16 long-lived shots. Five rebounds turn tight rooms into traps.'},
 flamethrower:{ammo:70,life:.42,range:110,recoil:0,role:'AREA DENIAL',desc:'70 fuel. Close-range flame leaves five-second fires and burns wood.'},
 railgun:{ammo:4,life:.75,range:1400,recoil:75,role:'PIERCING',desc:'Four piercing bolts. Cuts through enemies and fragile cover.'},
 crossbow:{life:1.6,gravity:180,range:560,recoil:5,role:'ARC SHOT',desc:'Ten silent bolts. Gravity bends their path; recover from light recoil.'},
 melee:{reach:34,range:42,recoil:0,role:'MELEE',desc:'Unlimited swings. Smashes nearby cover. Get dangerously close.'}
};
for(const [key,detail] of Object.entries(weaponDetails))Object.assign(WEAPONS[key],detail);
Object.assign(WEAPONS,{
 burst:{name:'BURST CARBINE',ammo:27,cooldown:.55,speed:900,life:.62,damage:32,color:'#c4d397',kind:'burst',range:550,recoil:14,role:'BURST',desc:'27 rounds in timed three-shot bursts. Nine trigger pulls; tight grouping.'},
 blunderbuss:{name:'BLUNDERBUSS',ammo:3,cooldown:1.15,speed:560,life:.23,damage:26,pellets:11,spread:.3,recoil:185,range:135,color:'#d8ab73',kind:'bullet',role:'SCATTER',desc:'Three huge sprays. Eleven pellets and massive recoil; very short reach.'},
 minigun:{name:'MINIGUN',ammo:100,cooldown:.045,speed:980,life:.6,damage:18,recoil:12,spinup:.5,moveScale:.62,range:590,color:'#adb0ba',kind:'bullet',role:'HEAVY',desc:'100 rounds. Hold fire to spin up; walking slows while the barrel spins.'},
 laser:{name:'PRISM LASER',ammo:7,cooldown:.8,speed:100000,life:.02,damage:100,recoil:0,range:580,color:'#ff879e',kind:'laser',role:'BEAM',desc:'Seven instant beams. Stops at solid cover; no bullet travel delay.'},
 plasma:{name:'PLASMA CANNON',ammo:6,cooldown:.8,speed:250,life:1.6,damage:100,radius:56,recoil:80,range:400,charge:.85,color:'#bca0ff',kind:'plasma',role:'CHARGED',desc:'Hold fire to charge, release to launch. Slow expanding blast; six cells.'},
 tesla:{name:'TESLA FORK',ammo:6,cooldown:.85,damage:70,range:155,chains:4,chainRange:90,recoil:0,color:'#b5f0ff',kind:'tesla',role:'CHAIN',desc:'Six arcs. Jumps between up to four nearby targets; cannot cross walls.'},
 freeze:{name:'FROST SPRAYER',ammo:12,cooldown:.33,speed:490,life:.65,damage:12,range:320,recoil:4,color:'#a5e8fb',kind:'freeze',role:'CONTROL',desc:'First hit slows; a second hit shatters. Leaves slippery ice on impact.'},
 acid:{name:'ACID LOBBER',ammo:8,cooldown:.68,speed:310,launchY:-115,gravity:460,life:2.2,damage:14,range:300,recoil:22,color:'#c3ed78',kind:'acid',role:'AREA DENIAL',desc:'Eight arcing blobs. Eight-second acid pools corrode cover and deny routes.'},
 boomerang:{name:'BILLERANG',ammo:1,cooldown:.35,speed:410,life:1.8,damage:100,range:210,recoil:0,color:'#f5d08b',kind:'boomerang',role:'RETURNING',desc:'One curved blade. Hits on the way out and back; catch it to reuse it.'},
 mine:{name:'PROXIMITY MINE',ammo:3,cooldown:.6,damage:150,radius:88,range:45,life:25,color:'#efa080',kind:'mine',role:'TRAP',desc:'Three mines. Arm after landing; stay for 25 seconds until someone approaches.'},
 cluster:{name:'CLUSTER LAUNCHER',ammo:3,cooldown:1.4,damage:60,radius:44,throwSpeed:300,throwY:-160,fuse:.95,range:300,color:'#efc267',kind:'cluster',role:'EXPLOSIVE',desc:'Three arcing shells. Each blast scatters four delayed explosive bomblets.'}
});
const surface=(x,y,w,h=12,material='wood',oneWay=true,extra={})=>({x,y,w,h,material,oneWay,...extra});
const ground=(w,h,material='stone')=>surface(0,h-40,w,40,material,false);
const crate=(x,y,material='wood')=>({type:'crate',x,y,w:26,h:26,material,hp:material==='metal'?150:65,solid:true});
const barrel=(x,y)=>({type:'barrel',x,y,w:20,h:28,hp:32,solid:true,explosive:true});
const door=(x,y)=>({type:'door',x,y,w:10,h:48,hp:85,solid:true,material:'wood',open:false});
const tree=(x,floor,height=96,snow=false)=>({type:'tree',x,y:floor-height,w:20,h:height,hp:180,solid:false,material:'wood',snow});
const hazard=(type,x,y,w,h=8,extra={})=>({type,x,y,w,h,...extra});
function arena(name,theme,width,description,platforms,objects=[],hazards=[],decorations=[]){
 const height=width*9/16,floor=height-40,keys=Object.keys(WEAPONS);
 const usable=platforms.filter(b=>b.oneWay&&b.w>=65),items=[[52,floor-26,'pistol'],[width-76,floor-26,'pistol']];
 usable.forEach((b,i)=>{if(i%2===0)items.push([b.x+b.w/2-8,b.y-22,keys[(i+name.length)%keys.length]]);});
 return {name,theme,width,height,description,size:width===640?'SMALL':width===960?'MEDIUM':width===1280?'LARGE':'HUGE',tag:description.split('.')[0].toUpperCase(),platforms,objects,hazards,decorations,spawn:[[40,floor-34],[width-56,floor-34],[width*.32,floor-34],[width*.68,floor-34]],items,tideDelay:25+(width-640)/160*1.4};
}
const newMaps=[
 arena('TIMBERLINE TREETOPS','ruins',960,'Forest canopy. Branches, fallen logs, and breakable tree trunks.',[
  ground(960,540,'grass'),surface(70,445,180,16,'log'),surface(695,445,190,16,'log'),surface(245,390,130,14,'leaf'),surface(565,390,150,14,'leaf'),surface(330,335,295,12,'rope'),surface(130,280,230,18,'leaf'),surface(600,280,220,18,'leaf'),surface(345,225,260,12,'log'),surface(235,170,110,14,'leaf'),surface(620,170,110,14,'leaf'),surface(380,115,190,18,'leaf'),surface(315,450,70,50,'stone',false),surface(560,450,70,50,'stone',false)
 ],[tree(270,500,115),tree(655,500,115),tree(190,280,95),tree(705,280,105),crate(425,474),barrel(515,472)]),
 arena('GLASSHOUSE','roof',640,'Glass conservatory. Fragile panes divide brick terraces.',[
  ground(640,360,'brick'),surface(95,260,170,16,'brick'),surface(375,260,170,16,'brick'),surface(245,205,150,12,'glass'),surface(70,150,130,12,'glass'),surface(435,150,130,12,'glass'),surface(225,95,190,16,'brick'),surface(207,150,8,94,'glass',false,{hp:20}),surface(425,150,8,94,'glass',false,{hp:20}),surface(300,260,40,60,'brick',false)
 ],[door(180,272),door(452,272),crate(90,294),crate(520,294)],[hazard('spring',310,315,25,5)]),
 arena('MOLTEN LOCK','foundry',1600,'Volcanic lock gates. Stone islands, glass walkways, and lava basins.',[
  ground(1600,900,'basalt'),surface(150,805,220,18,'stone'),surface(1200,805,240,18,'stone'),surface(385,750,195,12,'rope'),surface(990,750,195,12,'rope'),surface(590,695,420,24,'basalt'),surface(225,640,300,20,'stone'),surface(1100,640,270,20,'stone'),surface(510,585,225,12,'glass'),surface(850,585,240,12,'glass'),surface(710,530,180,26,'basalt'),surface(430,475,240,18,'stone'),surface(940,475,260,18,'stone'),surface(230,420,180,12,'rope'),surface(1195,420,175,12,'rope'),surface(430,365,265,18,'stone'),surface(905,365,285,18,'stone'),surface(655,310,285,14,'glass'),surface(425,255,190,18,'basalt'),surface(995,255,190,18,'basalt'),surface(590,200,420,20,'stone'),surface(740,145,120,12,'rope')
 ],[barrel(455,832),barrel(1115,832),crate(725,669),crate(830,669)],[hazard('lava',620,852,350,8),hazard('spring',340,854,30,6),hazard('spring',1230,854,30,6)]),
 arena('SANDSTONE VAULT','ruins',960,'Desert vault. Thick masonry, narrow doorways, and explosive stores.',[
  ground(960,540,'sandstone'),surface(125,440,250,20,'sandstone'),surface(590,440,240,20,'sandstone'),surface(390,385,180,16,'wood'),surface(205,330,160,20,'sandstone'),surface(590,330,175,20,'sandstone'),surface(360,275,245,18,'brick'),surface(140,220,165,16,'sandstone'),surface(650,220,155,16,'sandstone'),surface(335,165,295,20,'sandstone'),surface(255,452,20,48,'sandstone',false),surface(690,452,20,48,'sandstone',false),surface(465,440,30,60,'brick',false)
 ],[door(285,452),door(655,452),crate(330,474),barrel(610,472),crate(685,304)],[],[{type:'arch',x:370,y:335,w:230,h:165}]),
 arena('FREIGHT YARD','pump',1280,'Cargo yard. Container roofs, stacked crates, and rolling conveyors.',[
  ground(1280,720,'metal'),surface(155,625,245,55,'container',false),surface(895,625,230,55,'container',false),surface(425,570,200,12,'conveyor',true,{belt:65}),surface(660,570,205,12,'conveyor',true,{belt:-65}),surface(225,515,190,45,'container',false),surface(860,515,180,45,'container',false),surface(465,460,335,12,'metal'),surface(245,460,145,12,'metal'),surface(900,460,145,12,'metal'),surface(110,405,175,50,'container',false),surface(995,405,175,50,'container',false),surface(310,350,190,12,'rope'),surface(780,350,205,12,'rope'),surface(530,295,220,35,'container',false),surface(290,240,170,12,'metal'),surface(825,240,170,12,'metal'),surface(500,185,280,12,'conveyor',true,{belt:80})
 ],[crate(435,654),crate(463,654),crate(435,628),crate(810,654),barrel(665,652),crate(270,489)], [hazard('spring',630,674,28,6)]),
 arena('CLOCKWORK ATTIC','roof',640,'Clockmaker attic. Timber rafters, gears, and spring-powered shortcuts.',[
  ground(640,360,'wood'),surface(100,265,115,16,'wood'),surface(425,265,115,16,'wood'),surface(225,210,190,12,'conveyor',true,{belt:80}),surface(50,155,130,16,'wood'),surface(460,155,130,16,'wood'),surface(225,100,190,16,'log'),surface(290,272,60,48,'brick',false),surface(190,155,20,95,'wood',false,{hp:110}),surface(430,155,20,95,'wood',false,{hp:110})
 ],[door(370,272),barrel(240,292)],[hazard('spring',60,314,26,6),hazard('spring',554,314,26,6)],[{type:'gear',x:315,y:160,r:36},{type:'gear',x:90,y:225,r:24}]),
 arena('CRYSTAL CAVERN','snow',960,'Crystal grotto. Ice shelves, rough stone, and glacial cover.',[
  ground(960,540,'stone'),surface(70,445,160,22,'stone'),surface(730,445,160,22,'stone'),surface(260,390,185,14,'ice'),surface(535,390,180,14,'ice'),surface(390,335,180,22,'stone'),surface(105,280,205,14,'ice'),surface(665,280,190,14,'ice'),surface(335,225,290,22,'stone'),surface(170,170,155,14,'ice'),surface(630,170,160,14,'ice'),surface(340,115,285,14,'glass'),surface(440,452,70,48,'stone',false)
 ],[crate(305,474,'metal'),crate(590,474,'metal')],[hazard('spring',450,330,24,5)],[{type:'crystal',x:250,y:500,h:105},{type:'crystal',x:675,y:500,h:88}]),
 arena('BAMBOO BATHHOUSE','ruins',960,'Bamboo spa. Tiled pools, wooden screens, and leafy balconies.',[
  ground(960,540,'tile'),surface(90,445,230,14,'wood'),surface(630,445,240,14,'wood'),surface(355,390,250,12,'rope'),surface(195,335,165,20,'tile'),surface(600,335,170,20,'tile'),surface(350,280,265,12,'wood'),surface(105,225,195,14,'leaf'),surface(680,225,175,14,'leaf'),surface(315,170,325,14,'wood'),surface(210,452,15,48,'wood',false,{hp:90}),surface(735,452,15,48,'wood',false,{hp:90})
 ],[door(255,452),door(700,452),tree(440,500,100),crate(600,474)],[hazard('ice',315,496,75,4),hazard('ice',580,496,70,4)],[{type:'bamboo',x:155,y:500,h:220},{type:'bamboo',x:780,y:500,h:250}]),
 arena('STORMPIER','neon',1280,'Storm harbour. Lightning coils, wet steel, and hanging chains.',[
  ground(1280,720,'metal'),surface(115,625,180,12,'rope'),surface(1000,625,165,12,'rope'),surface(340,570,190,18,'metal'),surface(755,570,190,18,'metal'),surface(500,515,295,12,'conveyor',true,{belt:75}),surface(205,460,230,12,'rope'),surface(845,460,215,12,'rope'),surface(430,405,170,18,'metal'),surface(680,405,180,18,'metal'),surface(230,405,115,12,'rope'),surface(940,405,115,12,'rope'),surface(100,350,170,12,'rope'),surface(1015,350,160,12,'rope'),surface(275,295,205,14,'glass'),surface(800,295,195,14,'glass'),surface(475,240,325,18,'metal'),surface(560,185,160,12,'rope')
 ],[barrel(420,652),barrel(845,652),crate(630,654,'metal')],[hazard('electric',565,675,150,5,{period:4,active:1.1}),hazard('spring',305,674,28,6)],[{type:'chain',x:260,y:40,h:310},{type:'chain',x:1040,y:40,h:310}]),
 arena('FURNACE RUN','foundry',960,'Smelting line. Belt-driven routes and isolated lava channels.',[
  ground(960,540,'basalt'),surface(75,445,190,12,'conveyor',true,{belt:90}),surface(695,445,190,12,'conveyor',true,{belt:-90}),surface(290,390,140,18,'metal'),surface(530,390,140,18,'metal'),surface(375,335,210,12,'conveyor',true,{belt:100}),surface(125,280,180,20,'brick'),surface(655,280,180,20,'brick'),surface(310,225,340,12,'metal'),surface(180,170,150,12,'conveyor',true,{belt:-70}),surface(635,170,150,12,'conveyor',true,{belt:70}),surface(370,115,220,18,'basalt')
 ],[barrel(280,472),barrel(680,472),crate(470,309)],[hazard('lava',370,492,220,8),hazard('spring',315,494,24,6),hazard('spring',620,494,24,6)]),
 arena('MOONBILL OBSERVATORY','roof',1280,'Night observatory. Glass domes, telescope decks, and masonry shelters.',[
  ground(1280,720,'brick'),surface(90,625,250,22,'brick'),surface(940,625,250,22,'brick'),surface(365,570,170,12,'glass'),surface(745,570,170,12,'glass'),surface(505,515,270,20,'stone'),surface(185,460,210,16,'wood'),surface(885,460,210,16,'wood'),surface(420,405,180,12,'glass'),surface(685,405,180,12,'glass'),surface(260,350,160,20,'brick'),surface(860,350,160,20,'brick'),surface(440,295,400,12,'glass'),surface(245,240,165,16,'stone'),surface(870,240,165,16,'stone'),surface(440,185,400,20,'brick'),surface(540,130,200,12,'glass'),surface(400,635,80,16,'stone'),surface(800,635,80,16,'stone'),surface(365,582,8,98,'glass',false,{hp:20}),surface(910,582,8,98,'glass',false,{hp:20})
 ],[door(450,632),door(820,632),crate(600,654,'metal')],[],[{type:'dome',x:510,y:115,w:260,h:200}]),
 arena('SEWER CIRCUIT','pump',640,'Drainage tunnels. Brick walls, corroded doors, and acid spills.',[
  ground(640,360,'brick'),surface(65,265,185,24,'brick'),surface(395,265,180,24,'brick'),surface(265,210,110,12,'metal'),surface(90,155,140,20,'brick'),surface(415,155,140,20,'brick'),surface(255,100,135,12,'metal'),surface(275,272,20,48,'brick',false),surface(345,272,20,48,'brick',false)
 ],[door(300,272),crate(200,294),barrel(440,292)],[hazard('acid',315,312,25,8),hazard('spring',105,314,25,6)],[{type:'pipe',x:180,y:30,w:18,h:210},{type:'pipe',x:460,y:10,w:18,h:230}]),
 arena('SKY ORCHARD','ruins',1280,'Floating orchard. Turf islands, rope crossings, and fruit-tree cover.',[
  ground(1280,720,'grass'),surface(70,625,190,32,'grass'),surface(1020,625,190,32,'grass'),surface(285,570,150,12,'rope'),surface(845,570,150,12,'rope'),surface(460,515,360,32,'grass'),surface(215,460,200,12,'rope'),surface(875,460,195,12,'rope'),surface(90,405,190,32,'grass'),surface(995,405,180,32,'grass'),surface(325,350,220,32,'grass'),surface(735,350,225,32,'grass'),surface(540,295,210,12,'rope'),surface(290,240,220,32,'grass'),surface(775,240,210,32,'grass'),surface(500,185,280,32,'grass'),surface(560,130,160,12,'leaf')
 ],[tree(650,680,125),tree(150,405,75),tree(1050,405,75),tree(610,185,85),crate(450,654)], [hazard('spring',450,674,25,6)], [{type:'banner',x:400,y:90,w:38,h:110}]),
 arena('FOUNDRY CATHEDRAL','foundry',1600,'Iron cathedral. Brick chambers, stained glass, and a molten altar.',[
  ground(1600,900,'basalt'),surface(100,805,235,20,'brick'),surface(1270,805,230,20,'brick'),surface(355,750,200,12,'metal'),surface(1045,750,200,12,'metal'),surface(570,695,460,24,'stone'),surface(205,640,270,20,'brick'),surface(1120,640,270,20,'brick'),surface(485,585,230,12,'glass'),surface(900,585,225,12,'glass'),surface(715,530,180,24,'stone'),surface(365,475,270,20,'brick'),surface(975,475,270,20,'brick'),surface(640,420,335,12,'metal'),surface(365,420,155,12,'metal'),surface(1090,420,155,12,'metal'),surface(250,365,230,12,'glass'),surface(1120,365,225,12,'glass'),surface(510,310,245,20,'brick'),surface(850,310,245,20,'brick'),surface(650,255,300,12,'glass'),surface(395,200,250,20,'stone'),surface(955,200,250,20,'stone'),surface(660,145,280,20,'stone'),surface(340,812,20,48,'brick',false),surface(1240,812,20,48,'brick',false),surface(790,695,20,130,'glass',false,{hp:30})
 ],[door(375,812),door(1205,812),barrel(610,832),barrel(970,832),crate(720,669),crate(860,669)],[hazard('lava',725,852,150,8),hazard('spring',515,854,25,6),hazard('spring',1060,854,25,6)],[{type:'arch',x:600,y:180,w:400,h:650},{type:'chain',x:320,y:15,h:350},{type:'chain',x:1280,y:15,h:350}])
];
// Remodel the original seven worlds as well: different materials, fewer repeated tiers,
// grounded cover and interactive features. Platform removal preserves nearby jump routes.
const originalDescriptions=[
 'Working harbour. Cargo crates, breakable decking, and barrel cover.',
 'Rooftop alleys. Brick chimneys, glass balconies, and rooftop doors.',
 'Pump controls. Steel machinery, conveyors, and pressure springs.',
 'Jungle temple. Stone sanctums, leafy branches, and wooden gates.',
 'Midnight bazaar. Tiled stalls, glass screens, and volatile fuel drums.',
 'Snowbound cove. Ice ledges, snowy trees, and slippery escape routes.',
 'Ironworks. Masonry walls, conveyor bridges, and pockets of lava.'
];
const rebuiltLayouts={
 1:[surface(0,500,315,40,'brick',false),surface(650,500,310,40,'brick',false),surface(345,485,270,12,'metal'),surface(65,440,145,18,'brick'),surface(760,440,135,18,'brick'),surface(230,385,160,12,'glass'),surface(595,385,135,12,'glass'),surface(395,330,175,18,'wood'),surface(85,330,120,22,'brick'),surface(760,330,120,22,'brick'),surface(205,275,180,12,'metal'),surface(605,275,170,12,'metal'),surface(410,220,165,20,'brick'),surface(165,165,180,12,'glass'),surface(650,165,160,12,'glass'),surface(345,110,285,18,'brick'),surface(225,452,20,48,'brick',false),surface(705,452,20,48,'brick',false)],
 3:[ground(1280,720,'stone'),surface(60,620,220,26,'stone'),surface(1010,620,215,26,'stone'),surface(300,565,180,12,'leaf'),surface(800,565,190,12,'leaf'),surface(490,510,300,24,'stone'),surface(195,455,220,16,'wood'),surface(870,455,215,16,'wood'),surface(415,400,190,12,'rope'),surface(690,400,180,12,'rope'),surface(115,345,195,24,'stone'),surface(975,345,195,24,'stone'),surface(325,290,235,12,'leaf'),surface(730,290,225,12,'leaf'),surface(540,235,190,24,'stone'),surface(330,180,190,12,'rope'),surface(760,180,195,12,'rope'),surface(515,125,245,24,'stone'),surface(620,565,40,115,'stone',false)],
 4:[ground(960,540,'tile'),surface(60,445,225,16,'wood'),surface(675,445,220,16,'wood'),surface(305,390,140,12,'metal'),surface(530,390,120,12,'metal'),surface(150,335,190,22,'tile'),surface(640,335,185,22,'tile'),surface(365,280,235,12,'glass'),surface(95,225,195,16,'wood'),surface(685,225,165,16,'wood'),surface(315,170,330,12,'metal'),surface(400,115,155,12,'glass'),surface(310,452,18,48,'tile',false),surface(638,452,18,48,'tile',false)],
 5:[ground(1280,720,'ice'),surface(75,620,225,28,'stone'),surface(990,620,210,28,'stone'),surface(315,565,195,14,'ice'),surface(790,565,180,14,'ice'),surface(510,510,280,12,'rope'),surface(175,455,210,22,'ice'),surface(885,455,215,22,'ice'),surface(390,400,185,24,'stone'),surface(710,400,180,24,'stone'),surface(85,345,185,14,'ice'),surface(1010,345,175,14,'ice'),surface(290,290,235,12,'rope'),surface(770,290,220,12,'rope'),surface(510,235,280,22,'ice'),surface(350,180,130,14,'ice'),surface(810,180,140,14,'ice'),surface(465,125,355,26,'stone')],
 6:[surface(0,860,350,40,'basalt',false),surface(470,860,660,40,'basalt',false),surface(1250,860,350,40,'basalt',false),surface(335,845,155,12,'metal'),surface(1110,845,160,12,'metal'),surface(60,785,225,34,'brick',false),surface(1330,785,210,34,'brick',false),surface(315,730,210,12,'conveyor',true,{belt:75}),surface(1070,730,225,12,'conveyor',true,{belt:-75}),surface(545,675,195,20,'metal'),surface(860,675,190,20,'metal'),surface(725,620,150,18,'glass'),surface(380,565,250,24,'brick'),surface(985,565,230,24,'brick'),surface(155,510,200,12,'metal'),surface(1235,510,190,12,'metal'),surface(340,455,185,12,'conveyor',true,{belt:70}),surface(1090,455,175,12,'conveyor',true,{belt:-70}),surface(535,400,535,24,'brick'),surface(275,345,180,12,'glass'),surface(1130,345,180,12,'glass'),surface(445,290,245,20,'metal'),surface(920,290,250,20,'metal'),surface(680,235,245,12,'glass'),surface(515,180,140,12,'metal'),surface(955,180,145,12,'metal'),surface(655,125,305,22,'brick')]
};
for(const [index,layout] of Object.entries(rebuiltLayouts))originalMaps[index].platforms=layout;
const renovated=originalMaps.map((m,index)=>{
 const floor=m.height-40,material=['wood','brick','metal','stone','tile','ice','basalt'][index];
 const platforms=m.platforms.map((b,i)=>({...b,material:b.material||(b.oneWay?(i%4===0?['rope','glass','conveyor','leaf','wood','ice','metal'][index]:material):material),...(index===2&&b.oneWay&&i%4===0?{belt:70}:{}),...(b.oneWay&&['wood','rope','glass'].includes(material)&&i%5===0?{hp:material==='glass'?20:110}:{})}));
 // Permanent footholds keep the temple's central courtyard escapable without crates.
 if(index===3)platforms.push(surface(405,floor-50,60,50,'stone',false),surface(565,floor-50,45,50,'stone',false));
 const objects=[crate(m.width*.37,floor-26,index===2?'metal':'wood'),barrel(m.width*.62,floor-28)];
 if([1,3,4].includes(index))objects.push(door(m.width*.49,floor-48));
 if(index===3||index===5)objects.push(tree(m.width*.28,floor,100,index===5));
 const hazards=index===6?[hazard('lava',m.width*.46,floor-8,130,8),hazard('spring',m.width*.3,floor-6,26,6)]:index===2?[hazard('spring',80,floor-6,25,6)]:index===5?[hazard('ice',m.width*.43,floor-4,170,4)]:[];
 const ledges=platforms.filter(b=>b.oneWay&&b.w>=100);
 const items=m.items.map((item,i)=>{if(i<2)return item;const b=ledges[(i-2)%ledges.length];return [b.x+b.w/2-8,b.y-22,Object.keys(WEAPONS)[(index*3+i+7)%22]];});
 if(index===3||index===5){const b=ledges[4];objects.push(tree(b.x+b.w*.75,b.y,70,index===5));}
 if(index!==0){for(const b of ledges.filter((b,i)=>i%5===1))objects.push(crate(b.x+b.w*.75,b.y-26,index===2?'metal':'wood'));}

 return {...m,description:originalDescriptions[index],platforms,objects,hazards,decorations:index===2?[{type:'pipe',x:220,y:40,w:24,h:150}]:[],items};
});
// Replace freestanding doors with two-ended chambers underneath existing terraces.
// Their balcony roofs provide a second route; ground-floor doors protect a weapon stash.
function furnishRooms(m){
 if(!m.objects.some(o=>o.type==='door'))return m;
 const floor=m.height-40,rooms=[],objects=m.objects.filter(o=>o.type!=='door'),items=[...m.items],platforms=[...m.platforms];
 const roofs=platforms.filter(b=>b.oneWay&&b.w>=110&&b.y>=floor-65&&b.y<=floor-45).slice(0,2);
 for(const [n,roof] of roofs.entries()){
  const x=roof.x+8,w=roof.w-16,y=roof.y+roof.h,h=floor-y;
  const room={x,y,w,h,material:roof.material,theme:m.theme,stash:n?'tesla':'shotgun'};rooms.push(room);
  for(const dx of [x,x+w-10]){
   objects.push({...door(dx,floor-48),room:rooms.length-1});
   if(y<floor-48)platforms.push(surface(dx,y,10,floor-48-y,roof.material,false));
  }
  // Stash is physically inside the chamber, between both entrances.
  items.push([x+w/2-8,floor-22,room.stash]);
 }
 const doors=objects.filter(o=>o.type==='door');
 return {...m,rooms,items,platforms,objects:objects.filter(o=>o.type!=='crate'&&o.type!=='barrel'||!doors.some(d=>o.x<d.x+d.w+2&&o.x+o.w>d.x-2&&o.y<floor&&o.y+o.h>d.y))};
}
export const MAPS=[...renovated,...newMaps].map(furnishRooms).map(m=>({...m,platforms:m.platforms.map(b=>({...b,...(b.material==='glass'?{hp:b.hp||24}:{}),...(!b.oneWay&&b.h<32&&b.material==='wood'?{hp:80}:{})}))}));
export function mapForMode(index,zombie){
 const m=MAPS[index],floor=m.height-40;
 // Arena terrain is cloned per round: destruction never mutates the shared catalog.
 const map={...m,platforms:m.platforms.map(b=>({...b,maxHp:b.hp})),objects:m.objects.map(o=>({...o,maxHp:o.hp})),hazards:m.hazards.map(h=>({...h})),decorations:m.decorations.map(d=>({...d}))};
 if(zombie){map.platforms=[...map.platforms.filter(b=>b.y<floor),ground(m.width,m.height,'stone')];map.spawn=[[m.width/2-150,floor-32],[m.width/2+130,floor-32],[m.width/2-60,floor-32],[m.width/2+50,floor-32]];map.hazards=map.hazards.filter(h=>!['lava','acid','electric'].includes(h.type));}
 // Keep all starting bodies clear of cover and lethal pools in every mode.
 map.spawn=map.spawn.map(([x,y])=>{
  for(let step=0;step<22;step++){
   const dx=step===0?0:Math.ceil(step/2)*22*(step%2?1:-1),px=Math.max(8,Math.min(map.width-24,x+dx)),body={x:px,y,w:16,h:22};
   const intersects=b=>body.x<b.x+b.w&&body.x+16>b.x&&body.y<b.y+b.h&&body.y+22>b.y;
   if(![...map.platforms.filter(b=>!b.oneWay),...map.objects.filter(b=>b.solid)].some(intersects)&&!map.hazards.filter(h=>['lava','acid','electric'].includes(h.type)).some(intersects))return [px,y];
  }
  return [x,y-60];
 });
 return map;
}
