import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {readGenerationPackets} from '../lib/generation-packets';
const base='http://localhost:3000';
const sign=await fetch(base+'/signin-with-chatgpt?return_to=/',{redirect:'manual'});
const platform=sign.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');
async function create(){const r=await fetch(base+'/api/character',{method:'POST',headers:{cookie:platform,'Content-Type':'application/json',Origin:base},body:JSON.stringify({action:'create',name:'Pipeline '+crypto.randomUUID().slice(0,10),password:crypto.randomUUID()})});assert.equal(r.status,200);await r.json();return platform+'; '+r.headers.getSetCookie().find(c=>c.startsWith('explorer_character='))!.split(';')[0];}
const cookies=await Promise.all([create(),create()]);
const snapshot=async(cookie:string):Promise<any>=>(await fetch(base+'/api/game',{headers:{cookie}})).json();
const before=await Promise.all(cookies.map(snapshot)),records:any[]=[];
const start=performance.now();
async function stream(cookie:string,path:string,body:any){
 const response=await fetch(base+path,{method:'POST',headers:{cookie,Origin:base,'Content-Type':'application/json',Accept:'application/x-ndjson'},body:JSON.stringify(body)});
 assert.equal(response.status,200);assert.match(response.headers.get('content-type')!,/ndjson/);
 const label=body.direction??'current';let first=true;
 const result=await readGenerationPackets(response,packet=>{if(first){assert.equal(packet.type,'accepted');first=false;}if(packet.type!=='heartbeat')records.push({cell:label,packet:packet.type,stage:packet.stage,ms:Math.round(performance.now()-start)});});
 assert.ok(!result.error,JSON.stringify(result));return result;
}
const directions=Object.keys(before[0].connections).filter(d=>before[0].connections[d]);
const work=directions.map(direction=>stream(cookies[0],'/api/preload',{x:0,y:0,direction,stage:'all'}));
// A second player joins the same frontier; the current illustration has its own lane priority.
work.push(stream(cookies[1],'/api/preload',{x:0,y:0,direction:directions[0],stage:'all'}));
const current=stream(cookies[0],'/api/image',{x:0,y:0});
await Promise.all(work);const image=await current;
assert.equal((await fetch(base+image.url,{headers:{cookie:cookies[0]}})).status,200);
const after=await Promise.all(cookies.map(snapshot));
for(let i=0;i<2;i++){assert.deepEqual(after[i].character,before[i].character);assert.deepEqual(after[i].history,before[i].history);assert.deepEqual(after[i].map,before[i].map);}
assert.equal(records.filter(r=>r.packet==='accepted').length,directions.length+2);
assert.ok(Math.max(...records.filter(r=>r.packet==='accepted').map(r=>r.ms))<5000,'all streams accepted before generation finishes');
writeFileSync('outputs/pipeline-smoke.json',JSON.stringify({elapsedMs:Math.round(performance.now()-start),players:2,neighbors:directions.length,records},null,2));
console.log('Verified concurrent neighbor text/art streams, two-player deduplication path, current image delivery, and no preload discovery or player changes.',Math.round(performance.now()-start)+'ms');
