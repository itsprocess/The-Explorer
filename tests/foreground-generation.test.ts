import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publicFailure,AppError} from '../lib/app-error';
import {generationStream} from '../lib/generation-stream';
import {readGenerationPackets} from '../lib/generation-packets';
import {compileScene,assertScene,sceneSchemaFor} from '../lib/prompts';
import {contextFor} from '../lib/world';
import {POST as disabledPreload} from '../app/api/preload/route';
test('internal validation never leaks into streamed or JSON player errors',async()=>{
 const fail=()=>Promise.reject(Error('consumed_narrative must include {character_name}'));
 for(const req of [new Request('https://example.test'),new Request('https://example.test',{headers:{Accept:'application/x-ndjson'}})]){
  const r=await generationStream(fail,req),data=await readGenerationPackets(r);assert.equal(data.code,'generation_failed');assert.ok(!JSON.stringify(data).includes('consumed_narrative'));assert.ok(!JSON.stringify(data).includes('{character_name}'));
 }
 assert.equal(publicFailure(new AppError('Incorrect name or password.',401)).status,401);
});
test('all old preload requests are cheap no-ops with no dependencies on providers or sessions',async()=>{
 const responses=await Promise.all(Array.from({length:20},()=>disabledPreload()));
 for(const r of responses)assert.deepEqual(await r.json(),{ready:false,disabled:true});
});
test('the app assembles historical subjects and exact exit keys for all encounter branches',()=>{
 const c=contextFor('format',80,0);c.safeApproach=false;c.event={id:'honor',kind:'honor',mode:'once_ever',cause:null,entityId:'faction:a',deathId:null};c.stateRule=null;c.hostilityPolicy.enforcesForeignHonors=false;
 const schema=sceneSchemaFor(c);assert.deepEqual(schema.properties.exits.required,c.edges.map(e=>e.direction));assert.equal(schema.properties.exits.additionalProperties,false);
 const raw={title:'Open Ground',description:'A grassy clearing lies beneath the sky.',exits:Object.fromEntries(c.edges.map(e=>[e.direction,'A firm stone path leads onward.'])),visual_brief:'An ordinary clearing.',continuity_facts:[],event_narrative:'was recognized for crossing the valley.',consumed_narrative:'found the assembly gone and its benches empty.',honor_badge_title:'Valley Guest'};
 const scene=compileScene(raw);assert.doesNotThrow(()=>assertScene(scene,c));assert.equal(scene.consumed_narrative,'{character_name} found the assembly gone and its benches empty.');assert.equal(scene.exits.length,c.edges.length);
 c.stateRule={kind:'check',condition:{kind:'status',family:'blessing',value:'speed'},onMatch:'avoid_death'};const checked=compileScene({...raw,conditional_narrative:'escaped before the stones fell.'});assert.ok(checked.conditional_narrative?.includes('{trait_name}'));assert.doesNotThrow(()=>assertScene(checked,c));
});
