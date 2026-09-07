import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {tokenUsage,usageTotals,exhausted} from '../lib/token-usage';
import {contextFor} from '../lib/world';
import {scenePrompt,compactContext,preparedDetails,sceneSchemaFor,normalizeScene} from '../lib/prompts';
import {generationRequest} from '../lib/generation-request';
test('usage totals count retries without counting cache/reasoning twice; missing usage stays unknown',()=>{
 const a=tokenUsage({input_tokens:100,output_tokens:50,total_tokens:150,input_tokens_details:{cached_tokens:60},output_tokens_details:{reasoning_tokens:20}});
 const b=tokenUsage({input_tokens:30,output_tokens:20});
 assert.deepEqual(usageTotals([{usage:a},{usage:b},{usage:tokenUsage(null)}]),{requests:3,reported:2,input:130,output:70,total:200,cached:60,reasoning:20});
 assert.equal(tokenUsage(null).total,null);assert.equal(tokenUsage({input_tokens:0,output_tokens:0}).total,0);
 for(const code of ['credit_balance_exhausted','insufficient_quota'])assert.ok(exhausted({error:{code}}));
 assert.ok(exhausted({error:{type:'insufficient_quota'}}));assert.ok(!exhausted({error:{code:'rate_limit_exceeded'}}));
});
test('compact scene keeps geography/mechanics and old passage context, omits absent features and derivation recipes',()=>{
 const c=contextFor('efficiency',80,0),compact=compactContext(c),old='A granite arch with a broken step.';
 const p=scenePrompt(c,[],preparedDetails(c),[{direction:'east',shared_exit:old}]);
 const data=JSON.parse(p.input);
 assert.deepEqual(data.context.event,c.event);assert.deepEqual(data.context.stateRule,c.stateRule);assert.deepEqual(data.context.blocked,c.blocked);
 assert.equal(data.context.edges.length,c.edges.length);assert.ok(p.input.includes(old));assert.ok(!p.input.includes('recipe'));assert.ok(!p.input.includes('portalDestination'));
 assert.ok(compact.ratings.every(r=>c.ratings.find(v=>v.id===r.id)!.kind==='baseline'||r.strength>0));
 assert.ok(p.input.length<JSON.stringify(c).length/2);assert.deepEqual(preparedDetails(c),{details:[],regional_texture:''});
});
test('stream deadline interrupts even a never-ending accepted/heartbeat response',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('{"type":"accepted"}\n'));}}),{headers:{'Content-Type':'application/x-ndjson'}}));
 const start=Date.now();await assert.rejects(generationRequest('/api/game',undefined,undefined,{maxWaitMs:35}),/taking too long/);assert.ok(Date.now()-start<1000);
});
test('credit errors end streamed loading without a retry loop',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return new Response('{"type":"error","data":{"error":"Add API credit","code":"provider_credit"}}\n',{headers:{'Content-Type':'application/x-ndjson'}});});
 await assert.rejects(generationRequest('/api/game'),{message:'Add API credit',code:'provider_credit'});assert.equal(calls,1);
});
test('full reset clears every app identity and world table and leaves credit generation paused',()=>{
 const db=new DatabaseSync(':memory:');for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync('drizzle/'+f,'utf8'));
 db.exec(`INSERT INTO characters(id,owner,value,updated) VALUES('c','c','{}',1); INSERT INTO character_credentials VALUES('c','name','hash',1); INSERT INTO character_sessions VALUES('session','c',123); INSERT INTO character_presence VALUES('c',1); INSERT INTO packages(key,kind,value,updated) VALUES('seed:world-7:image:1:2','image','{"objectKey":"seed:world-7:illustrations/1/2/old.webp"}',1);`);
 db.exec(readFileSync('drizzle/0013_reset_all_efficiency.sql','utf8'));
 for(const table of ['characters','character_credentials','character_sessions','character_presence','visits','claims','packages','generation_jobs','generation_usage','auth_attempts'])assert.equal((db.prepare('SELECT count(*) n FROM '+table).get() as any).n,0,table);
 assert.ok((db.prepare("SELECT value FROM server_settings WHERE key='provider_pause'").get() as any).value.includes('provider_credit'));
 assert.equal((db.prepare("SELECT count(*) n FROM server_settings WHERE key LIKE 'retired-image:%'").get() as any).n,1);db.close();
});

test('conditional schemas omit unused output but preserve required branches',()=>{
 const c=contextFor('efficiency',0,0);const schema=sceneSchemaFor(c);assert.ok(!schema.required.includes('event_narrative'));assert.ok(schema.required.includes('exits'));
 c.event={kind:'death',mode:'every_visit',id:'trap',cause:'slab',deathId:'slab',entityId:null};c.stateRule={kind:'check',condition:{kind:'status',family:'blessing',value:'speed'},onMatch:'avoid_death'};
 const death=sceneSchemaFor(c);assert.ok(death.required.includes('event_narrative'));assert.ok(death.required.includes('conditional_narrative'));assert.ok(!death.required.includes('trait_name'));
 assert.equal(normalizeScene({title:'Ordinary Ground'} as any).event_narrative,'');
});
