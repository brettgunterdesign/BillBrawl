// Model adapters implement async decide({state, terrain, screenshot, controls}).
// Their only output is game input; this bridge never exposes mutable engine objects.
const controls=['left','right','jump','down','fire','grab','chirp','strafe'];
export function validateDecision(decision,count){
 if(!decision||!Array.isArray(decision.inputs)||decision.inputs.length!==count)throw Error(`Model must return inputs for ${count} players`);
 const inputs=decision.inputs.map(input=>{if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid model input');for(const [key,value]of Object.entries(input))if(!controls.includes(key)||typeof value!=='boolean')throw Error(`Invalid model control: ${key}`);return Object.fromEntries(controls.map(key=>[key,input[key]??false]));});
 const holdMs=decision.holdMs??100;if(!Number.isInteger(holdMs)||holdMs<50||holdMs>1000)throw Error('Model holdMs must be an integer from 50 to 1000');
 const notes=decision.notes??[];if(!Array.isArray(notes)||notes.some(n=>typeof n!=='string'))throw Error('Model notes must be strings');return {inputs,holdMs,notes};
}
export async function modelDecision(driver,observation,timeoutMs=15000){
 if(typeof driver.decide!=='function')throw Error('Model driver must export decide(observation)');let timer;
 try{return validateDecision(await Promise.race([driver.decide(observation),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Model decision timed out')),timeoutMs);})]),observation.state.players.length);}
 finally{clearTimeout(timer);}
}
