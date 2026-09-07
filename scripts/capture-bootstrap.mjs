import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const output=execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','wrangler.local.json','--json','--command','SELECT key,kind,value FROM packages WHERE value IS NOT NULL'],{encoding:'utf8',maxBuffer:16*1024*1024});
const results=JSON.parse(output).flatMap(x=>x.results);
const packages=Object.fromEntries(results.map(r=>[r.key,{kind:r.kind,value:JSON.parse(r.value)}]));
writeFileSync('lib/bootstrap.json',JSON.stringify(packages,null,2)+'\n');
console.log('Captured '+results.length+' canonical world packages; no characters, account records, or secrets.');
