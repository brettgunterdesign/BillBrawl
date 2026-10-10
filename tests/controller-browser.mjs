import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname,file=path==='/'?'index.html':path.slice(1);if(file.includes('..'))throw Error('Invalid path');res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(await readFile(new URL('../dist/'+file,import.meta.url)));}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const snapshot=()=>page.evaluate(async()=>(await import('./game.js')).getSnapshot());
const frames=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const button=async(n,value,index=0)=>{await page.evaluate(({n,value,index})=>window.testPads[index].buttons[n].pressed=value,{n,value,index});await frames();};
const tap=async(n,index=0)=>{await button(n,true,index);await button(n,false,index);};
const direction=async(x,y)=>{await page.evaluate(({x,y})=>window.testPads[0].axes=[x,y],{x,y});await frames();await page.evaluate(()=>window.testPads[0].axes=[0,0]);await frames();};
const focus=async(selector)=>{for(let n=0;n<90;n++){if(await page.evaluate(selector=>document.activeElement?.matches(selector),selector))return;if(await page.locator('#controller-keyboard').isVisible())await tap(5);else await direction(0,1);}throw Error('Controller cannot focus '+selector+'; active: '+await page.evaluate(()=>document.activeElement?.outerHTML));};
const reachAll=async(root)=>{const result=await page.evaluate(root=>[...document.querySelectorAll(root+' button,'+root+' input,'+root+' select')].filter(e=>!e.disabled&&!e.closest('.hidden,[hidden],[inert]')&&e.getBoundingClientRect().height).map(e=>e.id||[...e.attributes].filter(a=>a.name.startsWith('data-')).map(a=>a.name+'='+a.value).join('|')+'@'+(e.closest('[data-slot]')?.dataset.slot??'')),root),seen=new Set();
 for(let n=0;n<result.length+4;n++){seen.add(await page.evaluate(()=>(()=>{const e=document.activeElement;return e.id||[...e.attributes].filter(a=>a.name.startsWith('data-')).map(a=>a.name+'='+a.value).join('|')+'@'+(e.closest('[data-slot]')?.dataset.slot??'');})()));await direction(0,1);}assert.deepEqual(result.filter(key=>!seen.has(key)),[],root+' has unreachable controls');
};
const quit=async()=>{if(!(await snapshot()).paused)await tap(9);await focus('#quit');await tap(0);assert.equal((await snapshot()).started,false);};
try{
 await page.goto(`http://127.0.0.1:${server.address().port}/?qa=1&rooms=ws://127.0.0.1:1`,{waitUntil:'networkidle'});
 await page.evaluate(()=>{window.testPads=[{index:5,axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))}];navigator.getGamepads=()=>window.testPads;});await frames();
 assert.equal(await page.locator('#mode-next').evaluate(e=>e.classList.contains('controller-focus')),true);
 await reachAll('#menu');await focus('#lobby-help');await tap(0);await reachAll('#help-panel');await focus('[data-controls="pad"]');await tap(0);assert.match(await page.locator('#control-list').textContent(),/STICK/);await tap(1);assert.equal(await page.locator('#help-panel').isVisible(),false);
 await focus('#lobby-sound');await tap(0);assert.equal((await snapshot()).audio.enabled,false);await tap(0);
 // Reported regression: one survivor, ready, Next focused and usable with A.
 await focus('#mode-next');await direction(1,0);await direction(1,0);assert.equal((await snapshot()).mode,'zombie');await tap(0);await focus('[data-count="1"]');await tap(0);await focus('[data-ready="0"]');assert.equal((await snapshot()).lobby.options.players,1);
 await direction(1,0);assert.equal((await snapshot()).lobby.roster[0],'duck');
 await button(0,true);await page.waitForTimeout(550);assert.equal((await snapshot()).lobby.stage,'crew','Held A must not advance twice');await button(0,false);
 assert.equal(await page.locator('#crew-next').evaluate(e=>e===document.activeElement&&e.classList.contains('controller-focus')),true);
 await page.screenshot({path:new URL('../controller-ready-next.png',import.meta.url).pathname});
 await reachAll('#menu');await focus('#crew-next');await tap(0);assert.equal((await snapshot()).lobby.stage,'arena');await reachAll('#menu');await focus('#start');
 await direction(1,0);assert.equal((await snapshot()).lobby.options.arena,1);await tap(9);assert.equal((await snapshot()).started,true);assert.equal((await snapshot()).paused,false,'Starting a match must not also pause it');
 await tap(9);assert.equal((await snapshot()).paused,true);await reachAll('#pause');await focus('#music-volume');const volume=(await snapshot()).audio.musicVolume;await direction(-1,0);assert.ok((await snapshot()).audio.musicVolume<volume);await direction(1,0);assert.equal((await snapshot()).audio.musicVolume,volume);
 await focus('#pause-controls');await tap(0);await tap(9);assert.equal((await snapshot()).paused,true);assert.equal(await page.locator('#help-panel').isVisible(),false);
 await tap(1);assert.equal((await snapshot()).paused,false);await page.waitForTimeout(1900);
 await page.evaluate(()=>window.billBrawlQA.nextWave());await frames();await reachAll('#upgrade-menu');await focus('[data-id="0"][data-upgrade="health"]');await tap(0);assert.equal((await snapshot()).players[0].points,550);await frames();assert.equal(await page.locator('[data-id="0"][data-upgrade="health"]').evaluate(e=>e===document.activeElement),true,'Keep focus across rebuilt upgrade buttons');
 await focus('#next-wave');await tap(0);assert.equal((await snapshot()).wave,2);await quit();
 // All difficulty chips remain reachable after rebuilding the crew DOM.
 await focus('#mode-next');await direction(-1,0);assert.equal((await snapshot()).mode,'practice');await tap(0);
 await reachAll('#menu');for(const difficulty of ['beginner','easy','normal','hard']){await focus(`[data-difficulty="${difficulty}"]`);await tap(0);await frames();assert.equal((await snapshot()).lobby.options.difficulty,difficulty);assert.equal(await page.locator(`[data-difficulty="${difficulty}"]`).evaluate(e=>e===document.activeElement),true);}
 await focus('[data-ready="0"]');await tap(0);await tap(1);assert.equal((await snapshot()).lobby.ready[0],false);await tap(1);assert.equal((await snapshot()).lobby.stage,'mode');
 // Text inputs and species can be edited without a physical keyboard.
 await focus('#online-open');await tap(0);await reachAll('#online-menu');await focus('#online-name');await tap(0);assert.equal(await page.locator('#controller-keyboard').isVisible(),true);await focus('[data-edit="clear"]');await tap(0);await focus('[data-char="B"]');await tap(0);await focus('[data-char="I"]');await tap(0);await tap(9);assert.equal(await page.locator('#online-name').inputValue(),'BI');
 await focus('#online-species');const species=await page.locator('#online-species').inputValue();await direction(1,0);assert.notEqual(await page.locator('#online-species').inputValue(),species);
 await focus('#online-code');await tap(0);await tap(0);await tap(1);assert.equal(await page.locator('#online-code').inputValue(),'','Cancel discards keyboard draft');await tap(0);await tap(0);await tap(9);assert.equal(await page.locator('#online-code').inputValue(),'A');await tap(1);
 // Four-player setup is fully operable by the primary pad; other pads retain personal controls.
 await page.evaluate(()=>window.testPads.push({index:8,axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))}));await frames();await focus('#mode-next');await direction(-1,0);assert.equal((await snapshot()).mode,'duel');await tap(0);await focus('[data-count="4"]');await tap(0);await frames();await reachAll('#menu');
 for(let id=0;id<4;id++){await focus(`[data-ready="${id}"]`);await tap(0);}assert.ok((await snapshot()).lobby.ready.slice(0,4).every(Boolean));await tap(1,1);assert.equal((await snapshot()).lobby.ready[3],false);await tap(0,1);assert.equal((await snapshot()).lobby.ready[3],true);await tap(0);await focus('#start');await tap(0);assert.equal((await snapshot()).players.length,4);await tap(9,1);assert.equal((await snapshot()).paused,true);await quit();
 // Focus and footer remain usable on small screens, and removed devices clear focus.
 for(const viewport of [{width:390,height:844},{width:852,height:393},{width:320,height:568}]){await page.setViewportSize(viewport);await focus('#mode-next');await tap(0);await reachAll('#menu');await focus('#crew-back');await tap(0);}
 await page.evaluate(()=>window.testPads=[]);await frames();assert.equal(await page.locator('.controller-focus').count(),0);
 assert.deepEqual(errors,[]);console.log('Controller-only checks passed: every visible menu control; single-player Ready → Next; A/Start edge latching; independent multiplayer ready/back; all difficulty settings; arena selection; volume sliders; help; pause/resume/quit; upgrade focus after purchase; online name/code keyboard and species; compact screens; disconnect.');
}catch(e){await page.screenshot({path:new URL('../controller-qa-failure.png',import.meta.url).pathname});console.error(await snapshot(),errors);throw e;}finally{await browser.close();await new Promise(r=>server.close(r));}
