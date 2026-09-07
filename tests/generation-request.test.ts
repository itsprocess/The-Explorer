import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generationRequest} from '../lib/generation-request';
test('generation waits preserve movement idempotency, switch authenticated retries to GET, and reject other conflicts',async t=>{
 const requests:{url:unknown;init:RequestInit|undefined}[]=[];
 let pending=true;
 t.mock.method(globalThis,'fetch',async(url:unknown,init?:RequestInit)=>{requests.push({url,init});if(pending){pending=false;return Response.json({code:'generation_pending'},{status:202});}return Response.json({ok:true});});
 const move={method:'POST',body:JSON.stringify({requestId:'same-move-id'})};
 assert.deepEqual(await generationRequest('/api/game',move),{ok:true});
 assert.equal(requests.length,2);assert.equal(requests[0].init,requests[1].init);
 pending=true;requests.length=0;
 await generationRequest('/api/character',{method:'POST',body:'credentials'},'/api/game');
 assert.equal(requests[1].url,'/api/game');assert.equal(requests[1].init,undefined);
 t.mock.method(globalThis,'fetch',async()=>Response.json({error:'Name taken'},{status:409}));
 await assert.rejects(generationRequest('/api/character'),/Name taken/);
});
test('leaving a cell cancels its preload retry loop',async t=>{
 let calls=0;const controller=new AbortController();t.mock.method(globalThis,'fetch',async()=>{calls++;return Response.json({code:'generation_pending'},{status:202});});
 const waiting=generationRequest('/api/preload',undefined,undefined,{signal:controller.signal});setTimeout(()=>controller.abort(),20);
 await assert.rejects(waiting,{name:'AbortError'});assert.equal(calls,1);
});
