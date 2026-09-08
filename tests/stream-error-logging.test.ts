import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generationStream} from '../lib/generation-stream';
import {readGenerationPackets} from '../lib/generation-packets';

test('stream and JSON failures are logged privately without leaking internal errors',async(t)=>{
 const calls:unknown[][]=[];
 t.mock.method(console,'error',(...args:unknown[])=>calls.push(args));
 for(const accept of ['application/json','application/x-ndjson']){
  const request=new Request('https://example.test/api/game',{headers:{Accept:accept}});
  const response=await generationStream(async()=>{throw Error('simulated storage failure');},request);
  const failure=await readGenerationPackets(response);
  assert.equal(failure.code,'generation_failed');
  assert.ok(!JSON.stringify(failure).includes('simulated storage failure'));
 }
 assert.equal(calls.length,2);
 for(const call of calls){assert.equal(call[0],'Explorer unexpected request failure:');assert.match(String(call[1]),/simulated storage failure/);}
});
