import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
function run(args,expected=0){const r=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(r.status,expected,r.stderr||r.stdout);return r.stdout;}
const data=(...args)=>run(['scripts/data.mjs',...args,'--test']);
data('migrate');
data('reset','--confirm','RESET');
run(['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','wrangler.local.json','--persist-to','outputs/reset-test-db','--command',`
INSERT INTO packages(key,kind,value,updated) VALUES ('test','cell','{}',1);
INSERT INTO characters(id,owner,value,updated) VALUES ('test','test','{}',1);
INSERT INTO character_credentials VALUES ('test','test','hash',1);
INSERT INTO character_sessions VALUES ('token','test',9999999999999);
INSERT INTO visits VALUES ('test','test',0,0,'{}',1);
INSERT INTO claims VALUES ('test','test','test',1);
`]);
run(['scripts/data.mjs','reset','--test'],1);
let status=JSON.parse(data('status'));assert.equal(status.counts.characters,1);
data('reset','--scope','characters','--confirm','RESET');
status=JSON.parse(data('status'));assert.equal(status.counts.packages,1);
for(const [table,count] of Object.entries(status.counts))if(table!=='packages')assert.equal(count,0,table);
data('reset','--scope','all','--confirm','RESET');
status=JSON.parse(data('status'));assert.ok(Object.values(status.counts).every(n=>n===0));assert.equal(status.bootstrapDisabled,true);
data('migrate');
console.log('Passed isolated resets: confirmation required, character-only retains world, full reset clears all and disables bootstrap, schema survives.');
