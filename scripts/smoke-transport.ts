import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {contextFor} from '../lib/world';
const base='http://localhost:3000',seed='the-explorer-wild-horizons-20260907';
const sign=await fetch(base+'/signin-with-chatgpt?return_to=/',{redirect:'manual'});let cookie=sign.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');
async function call(path:string,body?:unknown){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{cookie,Origin:base,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const d:any=await r.json();assert.equal(r.status,200,JSON.stringify(d));return {r,d};}
const made=await call('/api/character',{action:'create',name:'Transport '+crypto.randomUUID().slice(0,8),password:crypto.randomUUID()});cookie+='; '+made.r.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');
let target=3;while(target<1000){const c=contextFor(seed,target,0);if(c.event?.kind==='portal'&&Math.hypot(c.portalDestination!.x,c.portalDestination!.y)>10)break;target++;}assert.ok(target<1000);
const sql="UPDATE characters SET value=json_set(value,'$.x',"+(target-1)+",'$.y',0) WHERE id='"+made.d.character.id+"'";
const setup=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','wrangler.local.json','--command',sql],{encoding:'utf8'});assert.equal(setup.status,0,setup.stderr);
const move={action:'move',direction:'east',requestId:crypto.randomUUID()},landed=(await call('/api/game',move)).d,c=contextFor(seed,target,0);
assert.equal(landed.character.x,c.portalDestination!.x);assert.equal(landed.character.y,c.portalDestination!.y);assert.equal(landed.character.alive,true);
assert.equal(landed.lastEvent.kind,'portal');assert.doesNotMatch(landed.lastEvent.text,/\b(you|your)\b/i);assert.match(landed.lastEvent.text,/Transport /);
assert.ok(landed.badges.some((b:any)=>b.id==='distance:10'));
assert.ok(landed.history.some((h:any)=>h.x===target&&h.y===0));assert.ok(landed.history.some((h:any)=>h.x===landed.character.x&&h.y===landed.character.y));
const again=(await call('/api/game',move)).d;assert.deepEqual(again.character,landed.character);assert.deepEqual(again.history,landed.history);
console.log(JSON.stringify({source:[target,0],destination:c.portalDestination,history:landed.lastEvent.text,verified:'single transfer, both visits, distance badge, historical narration, idempotent replay'}));
