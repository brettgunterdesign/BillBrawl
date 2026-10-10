import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AudioDirector} from '../dist/audio.js';

const themes=['dock','roof','pump','jungle','neon','ice','lava'];
test('bot rounds keep the same scheduled beat spacing across arena rotations',()=>{
 const audio=new AudioDirector();
 audio.context={state:'running',currentTime:0};
 audio._tone=()=>{}; // Exercise scheduling and round events without synthesizing sound.
 const notes=[];
 audio._musicStep=(track,step,when,length)=>notes.push({step,when,length,bpm:track.bpm});
 for(let round=0;round<28;round++){
  audio.context.currentTime=round*2;
  audio.setScene('practice',themes[round%themes.length]);
  audio.play('round',{wave:0});
  const start=notes.length;
  for(let tick=0;tick<40;tick++){
   audio.context.currentTime=round*2+tick*.025;
   audio._schedule();
  }
  const scheduled=notes.slice(start);
  assert.ok(scheduled.length>=8);
  for(let n=0;n<scheduled.length;n++){
   assert.equal(scheduled[n].bpm,126);
   assert.ok(Math.abs(scheduled[n].length-60/126/4)<1e-9);
   if(n)assert.ok(Math.abs(scheduled[n].when-scheduled[n-1].when-60/126/4)<1e-9);
  }
 }
});
test('fixed practice tempo retains arena melodies and existing mode music',()=>{
 const audio=new AudioDirector();
 audio.setScene('practice','dock');const dock=audio._track();
 audio.setScene('practice','roof');const roof=audio._track();
 assert.notDeepEqual(dock.melody,roof.melody);
 assert.notEqual(dock.root,roof.root);
 audio.setScene('lobby');assert.equal(audio._track().bpm,104);
 audio.setScene('pvp','roof');assert.equal(audio._track().bpm,136);
 audio.setScene('zombie');audio.play('wave',{wave:8});assert.equal(audio._track().bpm,132);
 audio.setScene('practice','ice');assert.equal(audio._track().bpm,126);
});
