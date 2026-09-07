import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readGenerationPackets} from '../lib/generation-packets';
import {generationStream} from '../lib/generation-stream';
test('completion packets handle fragmented UTF-8 without waiting for unrelated jobs',async()=>{
 const encoded=new TextEncoder().encode('{"type":"heartbeat"}\n{"type":"stage","stage":"text"}\n{"type":"complete","data":{"title":"Forêt"}}\n');
 const response=new Response(new ReadableStream({start(c){for(const byte of encoded)c.enqueue(Uint8Array.of(byte));c.close();}}),{headers:{'Content-Type':'application/x-ndjson'}});
 const stages:string[]=[];assert.deepEqual(await readGenerationPackets(response,p=>stages.push(p.type)),{title:'Forêt'});assert.deepEqual(stages,['heartbeat','stage','complete']);
});
test('stream sends acceptance before the asynchronous result and detects lost connections',async()=>{
 let finish!:(value:unknown)=>void;
 const response=await generationStream(()=>new Promise(r=>finish=r));
 const reader=response.body!.getReader();assert.match(new TextDecoder().decode((await reader.read()).value),/accepted/);reader.releaseLock();
 finish({ready:true});assert.deepEqual(await readGenerationPackets(response),{ready:true});
 await assert.rejects(readGenerationPackets(new Response('{"type":"accepted"}\n',{headers:{'Content-Type':'application/x-ndjson'}})),/interrupted/);
});
