import {mkdtemp,cp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
if(!process.env.npm_execpath)throw Error('Run npm run package:godaddy-preview.');
const config=JSON.parse(await readFile('explorer.config.json','utf8'));
const manifest=JSON.parse(await readFile('dist/explorer-build.json','utf8'));
const compiled={...config};delete compiled.hosting;
if(manifest.target!=='node'||manifest.basePath!==config.hosting.basePath||manifest.configHash!==createHash('sha256').update(JSON.stringify(compiled)).digest('hex'))throw Error('Run npm run build:node first.');
config.hosting.publicOrigin='';
config.hosting.publicOriginEnv='EXPLORER_PUBLIC_ORIGIN';
config.hosting.dataDirectory='./world-data';
const folder=await mkdtemp(join(tmpdir(),'explorer-godaddy-preview-'));
const files=['app.js','runtime','dist','explorer.config.json','package.json','package-lock.json','README.txt'];
function npm(args){const r=spawnSync(process.execPath,[process.env.npm_execpath,...args],{cwd:folder,encoding:'utf8'});if(r.status!==0)throw Error(r.stdout+'\n'+r.stderr);return r.stdout;}
try{
 for(const name of ['app.js','runtime','dist'])await cp(name,join(folder,name),{recursive:true});
 await writeFile(join(folder,'explorer.config.json'),JSON.stringify(config,null,2)+'\n');
 const original=JSON.parse(await readFile('package.json','utf8'));
 const dependencies={...original.dependencies};
 // Pin framework peers explicitly; omit unrelated development tools entirely.
 for(const name of ['vite','@vitejs/plugin-react','@vitejs/plugin-rsc'])dependencies[name]=original.devDependencies[name];
 const pkg={name:'the-explorer',version:original.version,private:true,type:'module',main:'app.js',engines:original.engines,dependencies,scripts:{dev:'node runtime/start.mjs',start:'node runtime/start.mjs',build:'node --check runtime/start.mjs'}};
 await writeFile(join(folder,'package.json'),JSON.stringify(pkg,null,2)+'\n');
 // Generate a fresh lock instead of recycling platform-specific optional entries.
 npm(['install','--package-lock-only','--ignore-scripts','--no-audit','--no-fund','--os=linux','--cpu=x64']);
 npm(['ci','--dry-run','--ignore-scripts','--no-audit','--no-fund','--os=linux','--cpu=x64']);
 npm(['ci','--no-audit','--no-fund']);
 console.log(npm(['audit']));
 const smoke=spawnSync(process.execPath,['scripts/smoke-node.mjs'],{env:{...process.env,EXPLORER_SMOKE_ROOT:folder,EXPLORER_SMOKE_MODULES:join(folder,'node_modules')},stdio:'inherit'});
 if(smoke.status!==0)throw Error('Packaged app HTTP check failed.');
 await writeFile(join(folder,'README.txt'),`THE EXPLORER - GODADDY NODE PREVIEW\n\nUpload this complete ZIP using Update Preview on the existing app.\nStart command: npm start. The app is already compiled.\n\nSet server environment variables (values are not included):\nOPENAI_API_KEY\nEXPLORER_ACCESS_PASSWORD (at least 24 characters)\nEXPLORER_ADMIN_PASSWORD (different, at least 24 characters)\n\nEXPLORER_PUBLIC_ORIGIN (https:// followed by the generated hostname, no path)\nSet this after GoDaddy assigns the preview URL, then restart. Until set, startup\nreports the missing setting and keeps the app closed. No rebuild or re-upload needed.\nOpen the configured origin followed by ${config.hosting.basePath}/.\nIf publishing assigns a new hostname, change EXPLORER_PUBLIC_ORIGIN and restart.\n\nData: ./world-data under the running application directory. Persistence across\nredeploys is NOT verified. Confirm persistent storage before relying on saved progress.\nThis ZIP contains no credentials, accounts, world data, or node_modules.\nThe existing cPanel installation and live Sites world are not changed.\n`);
 await mkdir('outputs',{recursive:true});
 const archive=resolve('outputs/the-explorer-godaddy-generated-domain.zip');
 const r=spawnSync('tar',['-a','-cf',archive,'-C',folder,...files],{stdio:'inherit'});
 if(r.status!==0)throw Error('ZIP creation failed.');
 console.log('Created '+archive);
}finally{await rm(folder,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
