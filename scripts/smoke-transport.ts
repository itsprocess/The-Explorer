import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {contextFor} from '../lib/world';
const base='http://localhost:3000',seed='the-explorer-crosscurrents-20260907';
// Optional cached fixtures exercise real HTTP/auth/D1 semantics without provider credits.
function sql(command:string){const r=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','wrangler.local.json','--command',command],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);}
function fixture(x:number,y:number){
 const context=contextFor(seed,x,y),scene={title:'Fixture '+x+' '+y,description:'An open stretch of ground.',visual_brief:'An open landscape.',continuity_facts:[],exits:context.edges.map(e=>({direction:e.direction,description:'A clear path crosses the ground.'})),blocked:context.blocked,event_narrative:context.event?.kind==='portal'?'{character_name} traveled with an unexpected conveyance.':'',consumed_narrative:'',hostility_narrative:'',death_badge_title:'',death_badge_description:'',honor_badge_title:''};
 const value=JSON.stringify({context,scene,regions:[],created:Date.now()}).replaceAll("'","''"),key=seed+':'+context.version+':cell:'+x+':'+y;
 sql("INSERT INTO packages(key,kind,value,lease,updated) VALUES('"+key+"','cell','"+value+"',0,0) ON CONFLICT(key) DO UPDATE SET value=excluded.value,lease=0,token=NULL WHERE packages.value IS NULL");
}
if(process.env.EXPLORER_FIXTURE_TEST==='1')fixture(0,0);
const sign=await fetch(base+'/signin-with-chatgpt?return_to=/',{redirect:'manual'});let cookie=sign.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');
async function call(path:string,body?:unknown,status=200){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{cookie,Origin:base,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const d:any=await r.json();assert.equal(r.status,status,JSON.stringify(d));return {r,d};}
const made=await call('/api/character',{action:'create',name:'Transport '+crypto.randomUUID().slice(0,8),password:crypto.randomUUID()});cookie+='; '+made.r.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');
let target=3;while(target<1000){const c=contextFor(seed,target,0);if(c.event?.kind==='portal'&&Math.hypot(c.portalDestination!.x,c.portalDestination!.y)>10)break;target++;}assert.ok(target<1000);
if(process.env.EXPLORER_FIXTURE_TEST==='1'){fixture(target,0);const d=contextFor(seed,target,0).portalDestination!;fixture(d.x,d.y);}
const updateSql="UPDATE characters SET value=json_set(value,'$.x',"+(target-1)+",'$.y',0) WHERE id='"+made.d.character.id+"'";
const setup=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','wrangler.local.json','--command',updateSql],{encoding:'utf8'});assert.equal(setup.status,0,setup.stderr);
const move={action:'move',direction:'east',requestId:crypto.randomUUID()},waiting=(await call('/api/game',move)).d,c=contextFor(seed,target,0);
assert.equal(waiting.character.x,target);assert.equal(waiting.character.y,0);assert.ok(waiting.character.pendingTransport);
assert.equal(waiting.lastEvent.kind,'transport_pending');
const reloaded=(await call('/api/game')).d;assert.deepEqual(reloaded.character,waiting.character);
await call('/api/game',{action:'move',direction:'east',requestId:crypto.randomUUID()},409);
await call('/api/game',{action:'teleport',token:'wrong-token',requestId:crypto.randomUUID()},409);
await call('/api/preload',{x:target,y:0,direction:'transport',stage:'text'});
assert.deepEqual((await call('/api/game')).d.character,waiting.character);
const publicDestination=await (await fetch(base+'/cell/'+c.portalDestination!.x+'/'+c.portalDestination!.y,{headers:{cookie}})).text();assert.match(publicDestination,/Undiscovered/);
const confirmation={action:'teleport',token:waiting.character.pendingTransport.token,requestId:crypto.randomUUID()};
const landed=(await call('/api/game',confirmation)).d;
assert.equal(landed.character.x,c.portalDestination!.x);assert.equal(landed.character.y,c.portalDestination!.y);assert.equal(landed.character.alive,true);
assert.equal(landed.lastEvent.kind,'portal');assert.doesNotMatch(landed.lastEvent.text,/\b(you|your)\b/i);assert.match(landed.lastEvent.text,/Transport /);
assert.ok(landed.badges.some((b:any)=>b.id==='distance:10'));
assert.ok(landed.history.some((h:any)=>h.x===target&&h.y===0));assert.ok(landed.history.some((h:any)=>h.x===landed.character.x&&h.y===landed.character.y));
const again=(await call('/api/game',confirmation)).d;assert.deepEqual(again.character,landed.character);assert.deepEqual(again.history,landed.history);
console.log(JSON.stringify({source:[target,0],destination:c.portalDestination,history:landed.lastEvent.text,verified:'source retained across refresh; movement blocked; destination preloads without discovery; explicit confirmation transfers exactly once'}));

const community=(await call('/api/community',{x:landed.character.x,y:landed.character.y})).d;
assert.ok(community.stats.explorers>=1);assert.ok(community.stats.locations>=3);assert.ok(community.stats.furthest>=landed.character.furthest);
await call('/api/community',{x:landed.character.x+1,y:landed.character.y},409);
console.log('Verified exact-cell community access and server stats.');
