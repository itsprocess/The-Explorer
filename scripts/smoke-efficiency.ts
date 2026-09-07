import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {contextFor} from '../lib/world';
const base='http://localhost:3000',seed='the-explorer-riverglass-20260907';
function sql(command:string){const r=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','wrangler.local.json','--json','--command',command],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout)[0]?.results;}
const pause=sql("SELECT value FROM server_settings WHERE key='provider_pause'")[0];assert.ok(pause?.value.includes('provider_credit'),'This smoke test must run with generation paused.');
const home=await fetch(base);assert.equal(home.status,200);
const sign=await fetch(base+'/signin-with-chatgpt?return_to=/',{redirect:'manual'});let cookie=sign.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');
async function call(path:string,body?:unknown,status=200){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{cookie,Origin:base,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const d:any=await r.json();assert.equal(r.status,status,JSON.stringify(d));return {r,d};}
const started=Date.now(),created=await call('/api/character',{action:'create',name:'Efficiency Test '+crypto.randomUUID().slice(0,6),password:crypto.randomUUID()},503);
cookie+='; '+created.r.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');assert.equal(created.d.code,'provider_credit');assert.ok(Date.now()-started<10000);
assert.equal((await call('/api/game',undefined,503)).d.code,'provider_credit');
const c=contextFor(seed,0,0),scope=seed+':'+c.version+':cell:0:0';
const value=JSON.stringify({context:c,scene:{title:'Cached Test Ground',description:'An ordinary clearing.',exits:c.edges.map(e=>({direction:e.direction,description:'A firm path leads onward.'}))},regions:[],created:Date.now()}).replaceAll("'","''");
sql("INSERT INTO packages(key,kind,value,updated) VALUES('"+scope+"','cell','"+value+"',1)");
assert.equal((await call('/api/game')).d.cell.scene.title,'Cached Test Ground');
const results=await Promise.all(['north','east','south','west'].map(direction=>call('/api/preload',{x:0,y:0,direction,stage:'all'})));
assert.ok(results.every(r=>r.d.disabled===true));
assert.equal((await call('/api/image',{x:0,y:0},503)).d.code,'provider_credit');
assert.equal(sql('SELECT count(*) n FROM generation_usage')[0].n,0,'No provider requests during quota pause');
const usage=JSON.stringify({input_tokens:100,output_tokens:20,total_tokens:120,input_tokens_details:{cached_tokens:40}});
sql("INSERT INTO generation_usage(id,scope,lane,stage,model,status,usage,created) VALUES('fixture','"+scope+"','text','canonical_scene','fixture','200:completed','"+usage+"',1)");
const dev=(await call('/api/workshop?x=0&y=0')).d;assert.equal(dev.usage.cell.total,120);assert.equal(dev.usage.cell.cached,40);assert.equal(dev.usage.rows.length,1);
// Resume control is tested without issuing any generation request; immediately re-pause locally.
await call('/api/generation/retry',{});assert.equal(sql("SELECT count(*) n FROM server_settings WHERE key='provider_pause'")[0].n,0);
sql("INSERT INTO server_settings(key,value) VALUES('provider_pause','"+pause.value.replaceAll("'","''")+"')");
assert.equal((await call('/api/image',{x:0,y:0},503)).d.code,'provider_credit');
console.log('Passed real HTTP/auth/D1: exhausted-credit login, cached cell access, four disabled preload requests, image failure, Dev token totals, explicit resume. No OpenAI requests.');
