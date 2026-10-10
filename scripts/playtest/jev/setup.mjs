import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../../',import.meta.url)),source=root+'.jev-runtime/source',venv=root+'.jev-runtime/venv',revision='34d5c9602f6f73792e2c625cc31dd9ed7b4f39b5';
function run(command,args,cwd=root){const result=spawnSync(command,args,{cwd,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
mkdirSync(root+'.jev-runtime',{recursive:true});if(!existsSync(source+'/auto_jev')){run('git',['clone','--no-checkout','https://github.com/TianyuCodings/JevHarness.git',source]);run('git',['checkout',revision],source);}
const actual=spawnSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'});if(actual.stdout.trim()!==revision)throw Error('JevHarness revision differs from the reviewed version; refusing to silently change it');
if(!existsSync(venv+'/bin/python'))run('python3',['-m','venv',venv]);run(venv+'/bin/pip',['install','-e',source]);console.log('JevHarness installed; API keys remain external environment variables.');
