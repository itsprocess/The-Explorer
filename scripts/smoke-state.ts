import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {contextFor} from '../lib/world';
import type {StateRule} from '../lib/traits';
const base='http://localhost:3000',seed='the-explorer-crosscurrents-20260907',start=88000;
function sql(command:string){const r=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','wrangler.local.json','--command',command],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);}
function fixture(x:number,rule:StateRule|null,name='',kind='interaction'){
 const c=contextFor(seed,x,0);c.stateRule=rule;c.hostilityPolicy.enforcesForeignHonors=false;c.event=x===0?null:{id:'state-suite',kind,mode:'every_visit',cause:'falling slab',deathId:'death:state-suite',entityId:null} as any;
 const scene={title:'Test Site '+x,description:'An ordinary patch of ground.',visual_brief:'An open landscape.',continuity_facts:[],exits:c.edges.map(e=>({direction:e.direction,description:'A firm route leads onward.'})),event_narrative:kind==='death'?'{character_name} was struck by a slab.':'{character_name} received '+name+'.',consumed_narrative:'',hostility_narrative:'',death_badge_title:'Struck by a Slab',death_badge_description:'A falling slab ended the journey.',honor_badge_title:'',trait_name:name,trait_description:name?'A local mark carried by an explorer.':'',conditional_narrative:rule?.kind==='check'?'{character_name} escaped the slab with {trait_name}.':''};
 const value=JSON.stringify({context:c,scene,regions:[],created:Date.now()}).replaceAll("'","''");sql("INSERT INTO packages(key,kind,value,lease,updated) VALUES('"+seed+':'+c.version+':cell:'+x+":0','cell','"+value+"',0,0) ON CONFLICT(key) DO NOTHING");
}
fixture(0,null);fixture(start,{kind:'grant',spec:{kind:'status',family:'social_rank',value:'royalty',lifetime:'permanent'}},'Reed Crown');
fixture(start+1,{kind:'grant',spec:{kind:'status',family:'blessing',value:'speed',lifetime:'single_use'}},'Swift Favor');
fixture(start+2,{kind:'check',condition:{kind:'status',family:'blessing',value:'speed'},onMatch:'avoid_death'},'','death');
fixture(start+3,{kind:'grant',spec:{kind:'possession',purpose:'craft',affinity:'water',material:'metal',lifetime:'until_death'}},'Tidal Tool');
fixture(start+4,null,'','death');
const sign=await fetch(base+'/signin-with-chatgpt?return_to=/',{redirect:'manual'});let cookie=sign.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');
async function call(path:string,body?:unknown,status=200){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{cookie,Origin:base,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const d:any=await r.json();assert.equal(r.status,status,JSON.stringify(d));return {r,d};}
const made=await call('/api/character',{action:'create',name:'State Test '+crypto.randomUUID().slice(0,8),password:crypto.randomUUID()});cookie+='; '+made.r.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');const id=made.d.character.id;
sql("UPDATE characters SET value=json_set(value,'$.x',"+(start-1)+",'$.y',0),revision=revision+1 WHERE id='"+id+"'");
let state:any;for(let i=0;i<5;i++){const move={action:'move',direction:'east',requestId:crypto.randomUUID()};state=(await call('/api/game',move)).d;
 if(i===0)assert.equal(state.traits[0].name,'Reed Crown');
 if(i===1){assert.equal(state.traits.length,2);const replay=(await call('/api/game',move)).d;assert.deepEqual(replay.traits,state.traits);assert.deepEqual(replay.history,state.history);}
 if(i===2){assert.equal(state.character.alive,true);assert.equal(state.lastEvent.kind,'escape');assert.equal(state.character.deaths,0);assert.equal(state.traits.length,1);}
 if(i===3)assert.equal(state.traits.length,2);
}
assert.equal(state.character.deaths,1);assert.equal(state.traits.length,1);assert.equal(state.traits[0].name,'Reed Crown');
const query=async(q:string,filter:string)=>(await call('/api/history?'+new URLSearchParams({q,filter}))).d;
assert.equal((await query('Swift Favor','acquisitions')).history.length,1);assert.equal((await query('Swift Favor','uses')).history.length,1);assert.equal((await query('Tidal Tool','losses')).history.length,1);
await call('/api/history?filter=invalid',undefined,400);
const publicHistory=(await call('/api/history?'+new URLSearchParams({character:id,q:'Reed Crown',filter:'acquisitions'}))).d;assert.equal(publicHistory.history.length,1);
const returned=(await call('/api/game',{action:'return',requestId:crypto.randomUUID()})).d;assert.equal(returned.character.alive,true);assert.equal(returned.traits[0].name,'Reed Crown');
console.log('Verified real HTTP/auth/D1: acquisitions, persistent traits, single-use escape, death losses, replay idempotency, and filtered private/public history. Cached local fixtures only.');
