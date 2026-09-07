import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const base='http://localhost:3000';const sign=await fetch(base+'/signin-with-chatgpt?return_to=/',{redirect:'manual'});let cookie=sign.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');
async function call(path:string,body?:unknown){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{cookie,Origin:base,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const d:any=await r.json();assert.equal(r.status,200,JSON.stringify(d));return{r,d};}
function sql(query:string){const r=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','wrangler.local.json','--command',query],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);}
const made=await call('/api/character',{action:'create',name:'Loading '+crypto.randomUUID().slice(0,8),password:crypto.randomUUID()});cookie+='; '+made.r.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');
// Reproduce a reset-surviving character whose initial visit was erased.
sql("DELETE FROM visits WHERE character='"+made.d.character.id+"'");
const repaired=(await call('/api/game')).d;assert.equal(repaired.history.length,1);assert.equal(repaired.history[0].kind,'arrival');
assert.deepEqual((await call('/api/game')).d.history,repaired.history);
const image=(await call('/api/image',{x:0,y:0})).d;
const r=await fetch(base+image.url,{headers:{cookie}});assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/webp');const bytes=Buffer.from(await r.arrayBuffer());assert.equal(bytes.subarray(8,12).toString(),'WEBP');
// Simulate a request interrupted before it released its ten-minute legacy lock.
const key='the-explorer-wild-horizons-20260907:world-6:image:0:0',now=Date.now();
// A separate partial stage can be reclaimed without touching the completed origin or image.
sql("INSERT OR REPLACE INTO packages(key,kind,value,token,lease,updated) VALUES('the-explorer-wild-horizons-20260907:world-6:cell:1:0','cell',NULL,'interrupted',"+(now+600000)+","+(now-120000)+")");
const start=Date.now();await call('/api/preload',{x:0,y:0,direction:'east',stage:'text'});assert.ok(Date.now()-start<90000);
assert.equal((await call('/api/game')).d.character.x,0);
console.log('Passed: reset-origin arrival repaired once, saved image served as WebP, legacy abandoned lock reclaimed without its ten-minute wait, preload did not move character.');
