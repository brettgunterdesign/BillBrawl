import {spawn} from 'node:child_process';
import readline from 'node:readline';
import {fileURLToPath} from 'node:url';
import {featuresFor,actionInput} from './features.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url)),pending=new Map();let child=null,id=0,tick=0,last=null;
function launch(){
 child=spawn(process.env.BILL_BRAWL_JEV_PYTHON||root+'.jev-runtime/venv/bin/python',[fileURLToPath(new URL('./worker.py',import.meta.url))],{cwd:root,stdio:['pipe','pipe','pipe'],env:process.env});
 const fail=message=>{for(const request of pending.values())request.reject(Error(message));pending.clear();};
 child.on('error',()=>fail('JevHarness runtime unavailable. Run npm run setup:jev.'));child.on('exit',code=>fail(`JevHarness worker exited (${code}); check runtime setup and provider credential configuration.`));
 child.stderr.on('data',data=>process.stderr.write(data));readline.createInterface({input:child.stdout}).on('line',line=>{try{const result=JSON.parse(line),request=pending.get(result.id);if(!request)return;pending.delete(result.id);if(result.error)request.reject(Error(result.error.message));else request.resolve(result);}catch{fail('Invalid JevHarness worker response');}});
}
export async function decide(observation){
 const inputs=observation.baselineInputs.map(i=>({...i}));if(observation.state.phase!=='playing'||!observation.state.players[0].alive)return {inputs,holdMs:100};if(!child)launch();
 const features=featuresFor(observation),episode=`${observation.caseId}:${observation.state.round}`;if(last?.episode===episode)features.recentProgress={previousX:last.x,previousY:last.y,lastAction:last.action,distanceMoved:Math.hypot(features.self.x-last.x,features.self.y-last.y)};features.recentDecisions=tick;const current=++id;
 const response=await new Promise((resolve,reject)=>{pending.set(current,{resolve,reject});child.stdin.write(JSON.stringify({id:current,episode,features})+'\n',error=>{if(error){pending.delete(current);reject(Error('JevHarness input transport failed'));}});});
 inputs[0]=actionInput(response.output.action,features,tick++);last={episode,x:features.self.x,y:features.self.y,action:response.output.action};
 return {inputs,holdMs:250,notes:[`${response.mode}: session=${response.session}; decision=${current}; action=${response.output.action}; concern=${response.output.concern}; calls=${response.stats.calls}`]};
}
export async function close(){if(child){child.stdin.end();child.kill();child=null;}}
