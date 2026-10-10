import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const files=['scripts/playtest/jev/pipeline.json','scripts/playtest/jev/features.mjs','scripts/playtest/jev/driver.mjs','scripts/playtest/jev/worker.py','scripts/playtest/checks.mjs','scripts/playtest/driver.mjs','dist/engine.js','dist/content.js','dist/terrain.js'];
const hashes={};for(const file of files)hashes[file]=createHash('sha256').update(await readFile(root+file)).digest('hex');
const manifest={version:1,upstream:'https://github.com/TianyuCodings/JevHarness',upstream_commit:'34d5c9602f6f73792e2c625cc31dd9ed7b4f39b5',pipeline_version:2,validation:'offline wiring only; live Jev evaluation requires provider credentials',jev_required_for_live:true,reflection_enabled:false,files:hashes};
await writeFile(new URL('./policy-lock.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n');console.log('Pinned the reviewed pipeline, action adapter, evaluator, and game rules. Live model weights are not locked by this manifest.');
