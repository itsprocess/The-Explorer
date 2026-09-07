import {mkdtemp,cp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
// Allowlist source files. Never package keys, accounts, world data, or dependency folders.
const folder=await mkdtemp(join(tmpdir(),'explorer-release-'));
try {
 for(const name of ['app','lib','runtime','scripts','tests','docs','public','drizzle','.openai','explorer.config.json','vite.config.ts','tsconfig.json','package.json','package-lock.json']){
  await cp(name,join(folder,name),{recursive:true});
 }
 const pkg=JSON.parse(await readFile(join(folder,'package.json'),'utf8'));
 pkg.scripts.build='node scripts/build-node.mjs';pkg.scripts.start='node runtime/start.mjs';
 await writeFile(join(folder,'package.json'),JSON.stringify(pkg,null,2)+'\n');
 await writeFile(join(folder,'README.md'),await readFile('docs/PORTABLE-HOSTING.md','utf8'));
 await mkdir('outputs',{recursive:true});
 const archive=resolve('outputs/the-explorer-node.zip');
 // Windows and modern Unix bsdtar support zip via -a. Source-only artifact builds on the host.
 const result=spawnSync('tar',['-a','-cf',archive,'-C',folder,'.'],{stdio:'inherit'});
 if(result.status!==0)throw Error('Release archive failed');
 console.log('Created outputs/the-explorer-node.zip (source only; no secrets or world data).');
}finally{await rm(folder,{recursive:true,force:true});}
