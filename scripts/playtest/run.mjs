import {createState,update,MAPS,WEAPONS,BOT_DIFFICULTIES,buyUpgrade} from '../../dist/engine.js';
import {SharedCamera} from '../../dist/camera.js';
import {makeAgent,randomGenerator} from './agent.mjs';
import {inspectState,stateSummary,stallTracker} from './checks.mjs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export function scenarios(){
 const cases=[];for(let arena=0;arena<MAPS.length;arena++){
  for(const mode of ['duel','party'])cases.push({id:`${mode}-${arena}`,mode,arena});
  for(const difficulty of Object.keys(BOT_DIFFICULTIES))cases.push({id:`practice-${difficulty}-${arena}`,mode:'practice',arena,difficulty});
  for(const players of [1,2])cases.push({id:`zombie-${players}-${arena}`,mode:'zombie',players,arena});
 }
 // Controlled starting loadouts stress every attack without waiting for random pickups.
 for(const weapon of Object.keys(WEAPONS))for(const mode of ['duel','zombie'])cases.push({id:`weapon-${weapon}-${mode}`,mode,arena:weapon.length%MAPS.length,players:mode==='zombie'?2:undefined,weapon});
 return cases;
}
export function runScenario(config,{seed=1,seconds=45,capture=false,inputs:recordedInputs,fault}={}){
 const originalRandom=Math.random;Math.random=randomGenerator(seed);
 try{
  const s=createState(config.mode,config),camera=new SharedCamera(),agent=makeAgent(seed^0xa511e9b3),stall=stallTracker(),failures=[],warnings=[],record=[],trail=[];
  const metrics={ticks:0,rounds:0,waves:0,shots:0,pickups:0,deaths:0,revives:0,doors:0,breaks:0,kills:0,weapons:[],maxEntities:0},weapons=new Set();let loadedRound=-1,lastPhase=s.phase;
  for(let tick=0;tick<Math.ceil(seconds*60);tick++){
   if(config.weapon&&loadedRound!==s.round){loadedRound=s.round;for(const p of s.players){p.weapon=config.weapon;p.ammo=WEAPONS[config.weapon].ammo;}}
   if(s.phase==='wave-break')for(const p of s.players)buyUpgrade(s,p.id,['health','damage','speed'][s.wave%3]);
   const inputs=recordedInputs?.[tick]??s.players.map(p=>agent(s,p,tick));if(capture)record.push(inputs);
   s.events=[];update(s,inputs);fault?.(s,tick);camera.update(s.map,s.players,1/60,s.round);
   metrics.ticks++;metrics.rounds=Math.max(metrics.rounds,s.round);metrics.waves=Math.max(metrics.waves,s.wave);metrics.kills=s.teamKills;
   for(const e of s.events){const key={shot:'shots',pickup:'pickups',death:'deaths',revive:'revives',door:'doors',break:'breaks'}[e.type];if(key)metrics[key]++;if(e.type==='shot')weapons.add(e.weapon);}
   metrics.maxEntities=Math.max(metrics.maxEntities,s.bullets.length+s.grenades.length+s.fields.length+s.traps.length+s.enemies.length+s.items.length);
   if(tick%60===0||s.phase!==lastPhase){trail.push({tick,...stateSummary(s)});if(trail.length>20)trail.shift();lastPhase=s.phase;}
   warnings.push(...stall(s,inputs,tick));
   const issues=inspectState(s,camera);if(issues.length){failures.push(...issues.map(issue=>({...issue,tick,arena:s.mapIndex,round:s.round})));break;}
   if(['match-over','game-over'].includes(s.phase))break;
  }
  metrics.weapons=[...weapons].sort();return {config,seed,seconds,status:failures.length?'failed':warnings.length?'review':'passed',metrics,failures,warnings,trail,final:stateSummary(s),...(capture?{inputs:record}:{})};
 }catch(error){return {config,seed,seconds,status:'failed',failures:[{code:'exception',message:error.message,stack:error.stack}],warnings:[],metrics:{ticks:0},trail:[]};}
 finally{Math.random=originalRandom;}
}
const argument=(args,key,fallback)=>{const at=args.indexOf(key);if(at<0)return fallback;if(at+1===args.length||args[at+1].startsWith('--'))throw Error(`Missing ${key} value`);return args[at+1];};
export async function main(args=process.argv.slice(2)){
 const firstSeed=Number(argument(args,'--seed','1')),seeds=Number(argument(args,'--seeds','1')),seconds=Number(argument(args,'--seconds','45')),out=path.resolve(argument(args,'--out','artifacts/playtest'));
 if(!Number.isInteger(firstSeed)||firstSeed<0||!Number.isInteger(seeds)||seeds<1||!Number.isFinite(seconds)||seconds<=0)throw Error('Positive --seeds and --seconds required');
 let cases=scenarios(),replay=null;const replayPath=argument(args,'--replay',null),caseId=argument(args,'--case',null),arena=argument(args,'--arena',null);
 if(replayPath){replay=JSON.parse(await readFile(replayPath,'utf8'));cases=[replay.config];}else{if(caseId)cases=cases.filter(c=>c.id===caseId);if(arena!==null)cases=cases.filter(c=>c.arena===Number(arena));}
 if(!cases.length)throw Error('No matching playthroughs');await mkdir(out,{recursive:true});const results=[];
 for(const config of cases)for(let offset=0;offset<(replay?1:seeds);offset++){
  const result=runScenario(config,{seed:replay?.seed??firstSeed+offset,seconds:replay?.seconds??seconds,inputs:replay?.inputs});
  if(result.status==='failed'){const detailed=runScenario(config,{seed:result.seed,seconds:result.seconds,capture:true,inputs:replay?.inputs});const file=`${config.id}-seed-${result.seed}.json`;await writeFile(path.join(out,file),JSON.stringify(detailed,null,2)+'\n');result.replay=file;}
  results.push(result);console.log(`${result.status.toUpperCase()} ${config.id} seed=${result.seed} ticks=${result.metrics.ticks} failures=${result.failures.length} warnings=${result.warnings.length}`);
 }
 const summary={cases:results.length,failed:results.filter(r=>r.status==='failed').length,review:results.filter(r=>r.status==='review').length,ticks:results.reduce((n,r)=>n+r.metrics.ticks,0),shots:results.reduce((n,r)=>n+(r.metrics.shots||0),0),weapons:[...new Set(results.flatMap(r=>r.metrics.weapons||[]))].sort()};
 await writeFile(path.join(out,'report.json'),JSON.stringify({summary,results},null,2)+'\n');
 const report=['# Automated gameplay report','',`${summary.cases} playthroughs; ${summary.failed} failed; ${summary.review} need review; ${summary.ticks} simulation ticks; ${summary.shots} shots; ${summary.weapons.length}/22 weapon types fired.`,'','Possible stalls describe automated-agent behavior and need investigation; they are not proof of an inescapable level.',''];
 for(const r of results.filter(r=>r.status!=='passed')){report.push(`## ${r.config.id} — seed ${r.seed}`, '',...r.failures.map(f=>`- FAILURE ${f.code}, tick ${f.tick}: ${JSON.stringify(f)}`),...r.warnings.map(w=>`- REVIEW ${w.code}, player ${w.player+1}, tick ${w.tick}, at (${w.x.toFixed(1)}, ${w.y.toFixed(1)})`), ...(r.replay?[`- Reproduce: \`npm run playtest -- --replay ${path.join(out,r.replay)}\``]:[]),'');}
 await writeFile(path.join(out,'report.md'),report.join('\n')+'\n');console.log(JSON.stringify(summary));if(summary.failed||args.includes('--strict')&&summary.review)process.exitCode=1;return {summary,results};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(error=>{console.error(error.message);process.exitCode=1;});
