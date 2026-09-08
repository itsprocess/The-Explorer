// Precompiled Passenger release. Keep all server credentials and data out of the archive.
import {mkdtemp,cp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const config=JSON.parse(await readFile('explorer.config.json','utf8'));
const manifest=JSON.parse(await readFile('dist/explorer-build.json','utf8'));
const basePath=config.hosting.basePath;delete config.hosting;
if(manifest.target!=='node'||manifest.basePath!==basePath||manifest.configHash!==createHash('sha256').update(JSON.stringify(config)).digest('hex'))throw Error('Run npm run build:node first.');
if(!process.env.npm_execpath)throw Error('Run npm run package:cpanel.');
const folder=await mkdtemp(join(tmpdir(),'explorer-cpanel-'));
const files=['app.js','runtime','dist','explorer.config.json','package.json','package-lock.json'];
function npm(args){const r=spawnSync(process.execPath,[process.env.npm_execpath,...args],{cwd:folder,encoding:'utf8'});if(r.status!==0)throw Error(r.stdout+'\n'+r.stderr);return r.stdout;}
try{
 for(const file of files)await cp(file,join(folder,file),{recursive:true});
 const pkg=JSON.parse(await readFile(join(folder,'package.json'),'utf8'));
 pkg.main='app.js';pkg.scripts={start:'node runtime/start.mjs'};
 await writeFile(join(folder,'package.json'),JSON.stringify(pkg,null,2)+'\n');
 // Install exactly the production graph, including npm's peer dependencies.
 npm(['ci','--omit=dev','--no-fund','--no-audit']);
 console.log(npm(['audit','--omit=dev']));
 const smoke=spawnSync(process.execPath,['scripts/smoke-node.mjs'],{env:{...process.env,EXPLORER_SMOKE_MODULES:join(folder,'node_modules')},stdio:'inherit'});
 if(smoke.status!==0)throw Error('Production-only runtime check failed.');
 npm(['ci','--dry-run','--omit=dev','--ignore-scripts','--no-audit','--no-fund','--os=linux','--cpu=x64']);
 await mkdir('outputs',{recursive:true});
 const archive=resolve('outputs/the-explorer-cpanel.zip');
 const r=spawnSync('tar',['-a','-cf',archive,'-C',folder,...files],{stdio:'inherit'});
 if(r.status!==0)throw Error('Archive failed.');
 console.log('Created outputs/the-explorer-cpanel.zip. Install with npm ci --omit=dev; no server build required. No credentials, dependencies, or world data included.');
}finally{await rm(folder,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
