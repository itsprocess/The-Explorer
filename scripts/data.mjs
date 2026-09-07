import {spawnSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
const args=process.argv.slice(2),command=args[0]||'status';
const test=args.includes('--test');
const storage=resolve(test?'outputs/reset-test-db':'.wrangler/state');
function sql(query){
 query=query.replace(/^\s*--[^\n]*$/gm,'').trim();
 const run=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','wrangler.local.json','--persist-to',storage,'--json','--command',query],{encoding:'utf8',maxBuffer:16*1024*1024});
 if(run.status!==0)throw Error(run.stderr||run.stdout);
 return JSON.parse(run.stdout)[0]?.results??[];
}
if(command==='migrate'){
 sql('CREATE TABLE IF NOT EXISTS explorer_dev_migrations (name TEXT PRIMARY KEY)');
 const tables=new Set(sql("SELECT name FROM sqlite_master WHERE type='table'").map(r=>r.name));
 // Adopt databases initialized by the original direct-SQL setup.
 if(['packages','characters','visits','claims'].every(t=>tables.has(t)))sql("INSERT OR IGNORE INTO explorer_dev_migrations VALUES ('0000_tiny_hannibal_king.sql')");
 if(['auth_attempts','character_credentials','character_sessions','server_settings'].every(t=>tables.has(t)))sql("INSERT OR IGNORE INTO explorer_dev_migrations VALUES ('0001_flowery_mockingbird.sql')");
 const applied=new Set(sql('SELECT name FROM explorer_dev_migrations').map(r=>r.name));
 for(const file of readdirSync('drizzle').filter(f=>/^\d+_.+\.sql$/.test(f)).sort()){
  if(applied.has(file))continue;
  sql(readFileSync('drizzle/'+file,'utf8')+"; INSERT INTO explorer_dev_migrations VALUES ('"+file+"')");
  console.log('Applied '+file);
 }
 console.log('Local schema ready.');
}else if(command==='reset'){
 const scope=args.includes('--scope')?args[args.indexOf('--scope')+1]:'all';
 if(!args.includes('--confirm')||args[args.indexOf('--confirm')+1]!=='RESET'||!['all','characters','world'].includes(scope))throw Error('Use: npm run data:reset -- --scope all|characters|world --confirm RESET. Stop the dev server first.');
 const tables=['character_sessions','character_credentials','visits','claims','characters','auth_attempts'];
 if(scope==='all'||scope==='world'){
  for(const row of sql("SELECT value FROM packages WHERE kind='image' AND value IS NOT NULL")){
   const objectKey=JSON.parse(row.value).objectKey;if(typeof objectKey!=='string')continue;
   const removed=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','r2','object','delete','site-creator-r2/'+objectKey,'--local','--config','wrangler.local.json','--persist-to',storage],{encoding:'utf8'});
   if(removed.status!==0)throw Error('Could not clear a local image: '+removed.stderr);
  }
 }
 if(scope==='all')tables.push('packages','generation_jobs');
 const queries=tables.map(t=>'DELETE FROM '+t+';').join('\n')+(scope==='all'?"\nINSERT INTO server_settings(key,value) VALUES ('bootstrap_disabled','1') ON CONFLICT(key) DO UPDATE SET value='1';":'');
 sql(scope==='world'?readFileSync('drizzle/0002_reset_world_v2.sql','utf8')+'\nDELETE FROM generation_jobs;':queries);
 console.log('Cleared '+scope+' in '+storage+'. API keys and schema preserved.');
}else if(command!=='status')throw Error('Unknown command.');
if(command!=='migrate'){
 const counts=sql('SELECT '+['packages','characters','character_credentials','character_sessions','visits','claims'].map(t=>'(SELECT COUNT(*) FROM '+t+') AS '+t).join(','))[0];
 console.log(JSON.stringify({storage,counts,bootstrapDisabled:sql("SELECT value FROM server_settings WHERE key='bootstrap_disabled'")[0]?.value==='1'},null,2));
}
