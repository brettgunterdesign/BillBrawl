import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const server=createServer(async(req,res)=>{try{const file=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(file.includes('..'))throw Error('path');res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'text/html');res.end(await readFile(new URL('../dist/'+file,import.meta.url)));}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{const page=await browser.newPage({viewport:{width:1440,height:1040}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/`);
 const result=await page.evaluate(async()=>{
  const {MAPS,createState,update,predictPlayer}=await import('./engine.js'),{drawArena,drawBackground}=await import('./world.js'),{drawLiquid,drawIcePatch}=await import('./terrain-art.js');
  const board=document.createElement('canvas');board.width=1440;board.height=1040;const c=board.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#14242c';c.fillRect(0,0,1440,1040);
  const scenes=[{index:1,x:10,y:10,view:[0,405,330,115],title:'ROOFTOP ROOMS'},{index:10,x:730,y:10,view:[100,405,340,115],title:'SANDSTONE VAULT'},{index:7,x:10,y:300,view:[210,330,180,190],title:'TREE BRANCHES'},{index:5,x:730,y:300,view:[310,520,180,190],title:'SNOW + ICE'}];
  for(const scene of scenes){const map=MAPS[scene.index],scale=scene.index===7||scene.index===5?1.8:2;c.save();c.translate(scene.x,scene.y+25);c.beginPath();c.rect(0,0,680,scene.index===7||scene.index===5?360:250);c.clip();c.scale(scale,scale);c.translate(-scene.view[0],-scene.view[1]);drawBackground(c,map,2);drawArena(c,map,2);c.restore();c.font='bold 16px monospace';c.fillStyle='#fff0c2';c.fillText(scene.title,scene.x,scene.y+16);}
  for(const [n,type] of ['lava','acid','ice'].entries()){const x=45+n*475,y=825;c.fillStyle='#44515a';c.fillRect(x,y,390,110);if(type==='ice')drawIcePatch(c,{x,y,w:390,h:15},2);else drawLiquid(c,{type,x,y,w:390,h:48},2);c.font='bold 20px monospace';c.fillStyle='#fff0c2';c.fillText(type.toUpperCase(),x,y+85);}
  const samples=[0,1,2].map(n=>Array.from(c.getImageData(45+n*475+2,828,1,1).data));
  const animated=document.createElement('canvas');animated.width=100;animated.height=70;const a=animated.getContext('2d');const frames=[];for(const time of [0,1]){a.clearRect(0,0,100,70);drawLiquid(a,{type:'acid',x:5,y:25,w:90,h:20},time);frames.push(animated.toDataURL());}
  // Use the actual shared browser engine to enter a room, collect its stash, and leave.
  const s=createState('duel',{arena:1});s.phase='playing';const room=s.map.rooms[0],p=s.players[0];s.items=s.items.filter(i=>i.type===room.stash);Object.assign(p,{x:room.x-24,y:s.map.height-62,ground:true,vx:0,vy:0});
  for(let n=0;n<20;n++)update(s,[{right:true}]);const blocked=p.x+p.w<=room.x;update(s,[{grab:true}]);for(let n=0;n<36;n++)update(s,[{right:true}]);update(s,[{grab:true}]);const weapon=p.weapon;
  for(let n=0;n<60;n++)update(s,[{right:true,grab:n===20}]);const exited=p.x>room.x+room.w;
  document.body.replaceChildren(board);document.body.style.cssText='margin:0;background:#14242c;overflow:hidden';return {samples,animated:frames[0]!==frames[1],blocked,weapon,exited};
 });
 assert.ok(result.blocked);assert.equal(result.weapon,'shotgun');assert.ok(result.exited);assert.ok(result.animated);assert.notDeepEqual(result.samples[0],result.samples[1]);assert.notDeepEqual(result.samples[1],result.samples[2]);assert.deepEqual(errors,[]);await page.screenshot({path:'/workspace/sites/fowl-play/arena-fidelity.png'});console.log('Browser room entry, weapon pickup, exit, distinct hazards and animation passed.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
