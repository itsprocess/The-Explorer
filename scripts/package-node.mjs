import {mkdtemp,cp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
// Allowlist source files. Never package keys, accounts, world data, or dependency folders.
const folder=await mkdtemp(join(tmpdir(),'explorer-release-'));
try {
 for(const name of ['app.js','app','lib','runtime','scripts','tests','docs','public','drizzle','.openai','explorer.config.json','vite.config.ts','next.config.ts','tsconfig.json','package.json','package-lock.json']){
  await cp(name,join(folder,name),{recursive:true});
 }
 const pkg=JSON.parse(await readFile(join(folder,'package.json'),'utf8'));
 pkg.main='app.js';
 pkg.dependencies={...pkg.dependencies,...pkg.devDependencies};delete pkg.devDependencies;
 pkg.scripts.build='node scripts/build-node.mjs';pkg.scripts.start='node runtime/start.mjs';
 await writeFile(join(folder,'package.json'),JSON.stringify(pkg,null,2)+'\n');
 // Let npm reconcile the dependency graph after moving build tools into
 // dependencies. Editing lockfile flags by hand omitted transitive packages.
 if(!process.env.npm_execpath)throw Error('Run this packager through npm run package:node.');
 const npmArgs=['--ignore-scripts','--no-audit','--no-fund','--os=linux','--cpu=x64'];
 for(const args of [['install','--package-lock-only',...npmArgs],['ci','--dry-run',...npmArgs]]){
  const check=spawnSync(process.execPath,[process.env.npm_execpath,...args],{cwd:folder,encoding:'utf8'});
  if(check.status!==0)throw Error('Release dependency validation failed:\n'+check.stderr+'\n'+check.stdout);
 }
 await writeFile(join(folder,'README.md'),await readFile('docs/PORTABLE-HOSTING.md','utf8'));
 await mkdir('outputs',{recursive:true});
 const archive=resolve('outputs/the-explorer-node.zip');
 // Windows and modern Unix bsdtar support zip via -a. Source-only artifact builds on the host.
 const result=spawnSync('tar',['-a','-cf',archive,'-C',folder,'.'],{stdio:'inherit'});
 if(result.status!==0)throw Error('Release archive failed');
 console.log('Created outputs/the-explorer-node.zip (source only; no secrets or world data).');
}finally{await rm(folder,{recursive:true,force:true});}
