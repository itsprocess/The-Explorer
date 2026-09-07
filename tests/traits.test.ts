import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contextFor} from '../lib/world';
import {resolveArrival,type Character} from '../lib/rules';
import {grantTrait,validTrait,stateRuleFor,type Trait,type StateRule} from '../lib/traits';
import {assertScene,scenePrompt,sceneSchema} from '../lib/prompts';
import type {CellPackage} from '../lib/generation';
const character=():Character=>({id:'a',name:'Explorer',x:7,y:0,alive:true,deaths:0,furthest:7,badges:[],consumed:[]});
function cell(rule:StateRule,kind='interaction'):CellPackage{
 const context=contextFor('traits',8,0);context.stateRule=rule;context.hostilityPolicy.enforcesForeignHonors=false;context.event={id:'test',kind,mode:'every_visit',cause:'falling slab',deathId:'death:slab',entityId:null} as any;
 return {context,regions:[],created:0,pass2Prompt:null,pass2Result:null,imagePackage:null,scene:{title:'Stone Path',description:'A path beneath a rock face.',visual_brief:'A rocky path.',continuity_facts:[],exits:context.edges.map(e=>({direction:e.direction as 'north'|'east'|'south'|'west',description:'A path leads across firm ground.'})),event_narrative:kind==='death'?'{character_name} was struck by a falling slab.':'{character_name} received the Swift Favor.',consumed_narrative:'',hostility_narrative:'',death_badge_title:'Stonefall',death_badge_description:'Struck by a slab.',honor_badge_title:'',trait_name:rule.kind==='grant'?'Swift Favor':'',trait_description:rule.kind==='grant'?'A fleeting blessing of speed.':'',conditional_narrative:rule.kind==='check'?'{character_name} escaped the falling slab with {trait_name}.':''}};
}
const grant:StateRule={kind:'grant',spec:{kind:'status',family:'blessing',value:'speed',lifetime:'single_use'}};
test('status acquisitions have provenance, do not duplicate, and can be regained after use',()=>{
 const p=cell(grant),first=resolveArrival(character(),p,false,'visit-1');
 assert.equal(first.event.kind,'acquisition');assert.equal(first.character.traits?.length,1);assert.equal(first.character.traits![0].source.visitId,'visit-1');
 const repeated=resolveArrival(first.character,p,false,'visit-2');assert.equal(repeated.event.kind,'revisit');assert.equal(repeated.character.traits?.length,1);
 const check=cell({kind:'check',condition:{kind:'status',family:'blessing',value:'speed'},onMatch:'avoid_death'},'death');
 const escaped=resolveArrival(first.character,check);assert.equal(escaped.character.alive,true);assert.equal(escaped.character.deaths,0);assert.equal(escaped.character.badges.filter(b=>b.kind==='death').length,0);assert.equal(escaped.event.kind,'escape');assert.equal(escaped.character.traits?.length,0);assert.equal(escaped.event.stateChanges?.[0].type,'consumed');
 const fallen=resolveArrival(escaped.character,check);assert.equal(fallen.character.deaths,1);
 const regained=resolveArrival({...fallen.character,alive:true},p,false,'visit-3');assert.equal(regained.character.traits?.length,1);assert.equal(regained.character.traits![0].source.visitId,'visit-3');
});
test('permanent means survives death, but another value in the same family replaces it',()=>{
 const first=resolveArrival(character(),cell({...grant,spec:{kind:'status',family:'social_rank',value:'royalty',lifetime:'permanent'}} as StateRule));
 const old=first.character.traits![0];const next={...old,id:'another-site',value:'commoner',lifetime:'until_death'} as Trait;
 const result=grantTrait(first.character.traits!,next);assert.equal(result.traits.length,1);assert.equal(result.changes[0].type,'replaced');assert.equal(result.changes[0].trait.id,old.id);
});
test('death removes both temporary lifetimes and retains permanent possessions and statuses',()=>{
 const template=resolveArrival(character(),cell(grant)).character.traits![0];
 const c=character();c.traits=[{...template,id:'permanent',lifetime:'permanent'},{...template,id:'temporary',lifetime:'until_death'},{...template,id:'once',lifetime:'single_use'}] as Trait[];
 const p=cell({kind:'check',condition:{kind:'status',family:'blessing',value:'ward'},onMatch:'avoid_death'},'death');
 const r=resolveArrival(c,p);assert.equal(r.character.deaths,1);assert.deepEqual(r.character.traits?.map(t=>t.id),['permanent']);assert.equal(r.event.stateChanges?.filter(x=>x.type==='lost').length,2);
});
test('possessions match by controlled dimensions; unrelated items and unrecognized enums confer no power',()=>{
 const p=cell({kind:'grant',spec:{kind:'possession',purpose:'protection',affinity:'stone',material:'woven',lifetime:'until_death'}}),c=resolveArrival(character(),p).character;
 const protectedCell=cell({kind:'check',condition:{kind:'possession',purpose:'protection',affinity:'stone'},onMatch:'avoid_death'},'death');
 const r=resolveArrival(c,protectedCell);assert.equal(r.character.alive,true);assert.equal(r.character.traits?.length,1);
 assert.equal(validTrait({kind:'status',family:'blessing',value:'invincible',lifetime:'permanent'}),false);
 const other={...c.traits![0],id:'another',affinity:'water'} as Trait;assert.equal(grantTrait(c.traits!,other).traits.length,2);
});
test('new cell prompts include fixed branch requirements while old saved cells remain compatible',()=>{
 const p=cell(grant);assertScene(p.scene,p.context);p.scene.trait_name='';assert.throws(()=>assertScene(p.scene,p.context),/grant/);
 const check=cell({kind:'check',condition:{kind:'status',family:'blessing',value:'speed'},onMatch:'avoid_death'},'death');assertScene(check.scene,check.context);
 assert.match(scenePrompt(check.context,[],{details:[],regional_texture:''},[]).instructions,/Write both branches once/);
 assert.ok(sceneSchema.required.includes('conditional_narrative'));
 delete (check.context as any).stateRule;delete check.scene.conditional_narrative;assert.equal(resolveArrival(character(),check).character.alive,false);
});
test('mechanic selection is deterministic, sparse, origin-safe and confined to controlled enums',()=>{
 const v={};let count=0;for(let i=0;i<1000;i++){const rule=stateRuleFor('sample'+i,10,10,{kind:'interaction'},v);assert.deepEqual(rule,stateRuleFor('sample'+i,10,10,{kind:'interaction'},v));if(rule?.kind==='grant'){count++;assert.ok(validTrait(rule.spec));}}
 assert.ok(count>170&&count<270);assert.equal(stateRuleFor('s',0,0,{kind:'death'},{}),null);
});
