import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),file=url.pathname==='/'?'index.html':url.pathname.slice(1);if(file.includes('..'))throw Error('Invalid path');const content=await readFile(new URL('../dist/'+file,import.meta.url));res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(content);}catch{res.statusCode=404;res.end('Not found');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1160}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const snapshot=()=>page.evaluate(async()=> (await import('./game.js')).getSnapshot());
const quit=async()=>{if(!(await snapshot()).paused)await page.keyboard.press('Escape');await page.locator('#quit').click();};
try{
 await page.goto(`http://127.0.0.1:${server.address().port}/?qa=1`,{waitUntil:'networkidle'});
 assert.equal(await page.title(),'Bill Brawl — Small bills. Big trouble.');
 assert.equal(await page.locator('.species-card').count(),6);assert.equal(await page.locator('.weapon-card').count(),11);assert.equal(await page.locator('.world-card').count(),7);
 await page.screenshot({path:'/workspace/sites/fowl-play/updated-lobby.png',fullPage:true});
 await page.locator('#roster select').nth(1).selectOption('toucan');await page.locator('#start').click();await page.waitForTimeout(1900);
 let s=await snapshot();assert.equal(s.phase,'playing');assert.equal(s.audio.state,'running');assert.ok(s.audio.voices>0&&s.audio.voices<=64);
 const x=s.players[0].x;await page.keyboard.down('KeyD');await page.waitForTimeout(300);await page.keyboard.up('KeyD');assert.ok((await snapshot()).players[0].x>x+10);
 await page.keyboard.down('KeyW');await page.waitForTimeout(200);await page.keyboard.press('KeyG',{delay:60});await page.keyboard.up('KeyW');assert.equal((await snapshot()).players[0].weapon,'pistol');await page.keyboard.press('KeyF',{delay:60});assert.equal((await snapshot()).players[0].ammo,11);
 await page.keyboard.press('Escape');s=await snapshot();assert.equal(s.paused,true);assert.equal(s.audio.voices,0);
 await page.locator('#music-volume').fill('25');await page.locator('#sfx-volume').fill('60');assert.equal((await snapshot()).audio.musicVolume,.25);assert.equal((await snapshot()).audio.sfxVolume,.6);
 await page.locator('#resume').click();await page.waitForTimeout(150);assert.equal((await snapshot()).paused,false);
 await page.locator('#sound').click();assert.equal((await snapshot()).audio.enabled,false);assert.equal((await snapshot()).audio.voices,0);await page.locator('#sound').click();await page.waitForTimeout(150);assert.equal((await snapshot()).audio.enabled,true);
 await page.screenshot({path:'/workspace/sites/fowl-play/updated-match.png',fullPage:true});
 await quit();await page.locator('#player-count').selectOption('4');await page.locator('#start').click();assert.match(await page.locator('#mode-note').textContent(),/Connect 2 controllers/);assert.equal((await snapshot()).started,false);
 await page.locator('[data-mode="practice"]').click();assert.equal(await page.locator('#roster select').count(),1);await page.locator('#difficulty').selectOption('hard');await page.locator('#start').click();await page.waitForTimeout(2100);const botX=(await snapshot()).players[1].x;await page.waitForTimeout(1600);assert.ok(Math.abs((await snapshot()).players[1].x-botX)>10);assert.match(await page.locator('#status').textContent(),/HARD BOT/);
 await quit();await page.locator('[data-mode="zombie"]').click();await page.locator('#player-count').selectOption('2');await page.locator('#arena-choice').selectOption('4');await page.locator('#start').click();await page.waitForTimeout(3400);
 s=await snapshot();assert.equal(s.wave,1);assert.ok(s.enemies>0);assert.ok(s.players.every(p=>p.hp===100&&p.weapon==='pistol'));assert.equal(s.audio.scene,'zombie');assert.equal(s.audio.theme,'neon');assert.equal(await page.locator('.inventory-card').count(),2);
 await page.screenshot({path:'/workspace/sites/fowl-play/updated-zombies.png',fullPage:true});
 await page.evaluate(()=>window.billBrawlQA.nextWave());await page.waitForTimeout(100);assert.equal(await page.locator('#upgrade-menu').isVisible(),true);
 await page.locator('[data-id="0"][data-upgrade="health"]').click();assert.equal((await snapshot()).players[0].points,550);assert.equal((await snapshot()).players[0].hp,125);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#upgrade-menu').isVisible(),false);await page.locator('#resume').click();assert.equal(await page.locator('#upgrade-menu').isVisible(),true);
 await page.screenshot({path:'/workspace/sites/fowl-play/updated-upgrades.png',fullPage:true});await page.locator('#next-wave').click();assert.equal((await snapshot()).wave,2);assert.equal((await snapshot()).phase,'countdown');assert.equal(await page.locator('#upgrade-menu').isVisible(),false);
 // Actual browser audio graph: each weapon creates signal; disabling effects leaves its bus silent.
 await page.keyboard.press('Escape');const audioCheck=await page.evaluate(async()=>{const a=window.billBrawlQA.audio;a.setPaused(false);a.setVolumes(0,.7);const analyser=a.context.createAnalyser();analyser.fftSize=2048;a.sfxBus.connect(analyser);const samples=new Float32Array(analyser.fftSize),levels={};for(const weapon of ['pistol','shotgun','grenade','smg','sniper','rocket','ricochet','flamethrower','railgun','crossbow','melee']){a._stopVoices();a.play('shot',{weapon});await new Promise(r=>setTimeout(r,40));analyser.getFloatTimeDomainData(samples);levels[weapon]=Math.sqrt(samples.reduce((n,v)=>n+v*v,0)/samples.length);}a.sfxBus.disconnect(analyser);a.setVolumes(.25,.6);a.setPaused(true);return levels;});assert.ok(Object.values(audioCheck).every(n=>n>.0001),JSON.stringify(audioCheck));
 await page.locator('#quit').click();
 // Controller mappings, pause edge, and disconnect are tested with a virtual Gamepad API.
 await page.evaluate(()=>{window.testPads=[0,1].map(index=>({index,axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))}));navigator.getGamepads=()=>window.testPads;});
 await page.locator('[data-mode="duel"]').click();await page.locator('#player-count').selectOption('4');await page.locator('#start').click();await page.waitForTimeout(1900);assert.equal((await snapshot()).players.length,4);const p3x=(await snapshot()).players[2].x;
 await page.evaluate(()=>window.testPads[0].axes[0]=1);await page.waitForTimeout(350);assert.ok((await snapshot()).players[2].x>p3x+10);await page.evaluate(()=>window.testPads[0].buttons[9].pressed=true);await page.waitForTimeout(100);assert.equal((await snapshot()).paused,true);await page.waitForTimeout(100);assert.equal((await snapshot()).paused,true);await page.evaluate(()=>{window.testPads[0].buttons[9].pressed=false;window.testPads[0].axes[0]=0;});await page.locator('#resume').click();await page.evaluate(()=>window.testPads=[]);await page.waitForTimeout(100);assert.equal((await snapshot()).paused,true);await page.locator('#quit').click();
 await page.setViewportSize({width:390,height:844});await page.locator('[data-mode="zombie"]').click();await page.locator('#player-count').selectOption('2');await page.screenshot({path:'/workspace/sites/fowl-play/updated-mobile.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const layout=await page.evaluate(()=>{const a=document.querySelector('#start').getBoundingClientRect(),b=document.querySelector('#screen').getBoundingClientRect();return{start:a.bottom,screen:b.bottom};});assert.ok(layout.start<=layout.screen,JSON.stringify(layout));
 await page.locator('#start').click();await page.waitForTimeout(2200);await page.screenshot({path:'/workspace/sites/fowl-play/updated-mobile-match.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 console.log('Browser checks passed: content galleries, PVP controls/pickup/fire, active hard bot, zombie co-op, upgrades, audio graph for all 11 weapons, pause/mute/volume, virtual four-player controllers/disconnect, mobile layouts.');console.log('Weapon audio RMS:',audioCheck);
}catch(e){console.error('Browser errors:',errors);console.error('State:',await snapshot());await page.screenshot({path:'/workspace/sites/fowl-play/qa-failure.png',fullPage:true});throw e;}finally{await browser.close();server.close();}
