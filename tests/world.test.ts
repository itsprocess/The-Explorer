import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contextFor,deriveRatings,exists,connections,directions,recipes,regionalRefs} from '../lib/world';
import {random,oi} from '../lib/noise';
import {detailPrompt,descriptiveIds,assertDetails,scenePrompt,type Scene} from '../lib/prompts';
import {resolveArrival,type Character} from '../lib/rules';
import type {CellPackage} from '../lib/generation';
const seed='test-world';
const character=():Character=>({id:'test',name:'Tester',x:0,y:0,alive:true,deaths:0,furthest:0,badges:[],consumed:[]});
function fixture(x=8,y=4):CellPackage{
 const context=contextFor(seed,x,y);context.event={id:'trap',kind:'death',mode:'every_visit',cause:'archival press',deathId:'death:archival press',entityId:null};context.hostilityPolicy.enforcesForeignHonors=false;
 const scene:Scene={title:'Test location',description:'A fixture scene for rule verification.',visual_brief:'',continuity_facts:[],event_narrative:'{character_name} was pressed into a footnote.',consumed_narrative:'The ceremony is over.',hostility_narrative:'The kingdom remembered your rival honor.',death_badge_title:'Footnoted',death_badge_description:'Killed by an archival press.',honor_badge_title:'Honorary archivist'};
 return {context,scene,regions:context.regions.map(r=>({id:r.id,kind:r.kind,name:r.kind,lore:''})),created:0,pass2Prompt:null,pass2Result:null,imagePackage:{enabled:false}};
}
test('all 160 ratings are deterministic, finite, and separately addressed',()=>{
 const a=deriveRatings(seed,-891,1702),b=deriveRatings(seed,-891,1702);assert.deepEqual(a,b);assert.equal(a.length,160);assert.equal(new Set(a.map(r=>r.recipe)).size,160);assert.ok(new Set(recipes.map(r=>r.algo)).size>=6);a.forEach(r=>assert.ok(r.value>0&&r.value<1));assert.notDeepEqual(a,deriveRatings(seed+'2',-891,1702));assert.throws(()=>oi(NaN));
});
test('backbone, origin, and approaches survive any tested seed',()=>{
 for(let s=0;s<20;s++){const key='seed-'+s;for(let i=-64;i<=64;i++){assert.ok(exists(key,i,0));assert.ok(exists(key,0,i));}for(const [x,y] of [[0,0],[1,0],[0,-1],[2,0]]){const c=contextFor(key,x,y);assert.ok(c.exists);assert.ok(c.safeApproach);assert.equal(c.event,null);assert.equal(c.features.trap,false);assert.equal(c.features.portal,false);}}
});
test('cardinal edges are reciprocal at negative and far coordinates',()=>{
 const opposite={north:'south',south:'north',east:'west',west:'east'} as const;
 for(const [x,y] of [[0,0],[-8,-9],[999999992,-999999992]]){const c=contextFor(seed,x,y);for(const [d,[dx,dy]] of Object.entries(directions)){const n=contextFor(seed,x+dx,y+dy);assert.equal(c.connections[d as keyof typeof directions],n.connections[opposite[d as keyof typeof opposite]]);if(c.connections[d as keyof typeof directions])assert.deepEqual(c.edges.find(e=>e.direction===d)?.id,n.edges.find(e=>e.direction===opposite[d as keyof typeof opposite])?.id);}}
});
test('nearby climate is coherent while entity IDs persist across cells',()=>{
 const a=deriveRatings(seed,20,20),b=deriveRatings(seed,21,20);for(const id of ['climate.temperature','climate.humidity'])assert.ok(Math.abs(a.find(r=>r.id===id)!.value-b.find(r=>r.id===id)!.value)<.1);assert.deepEqual(regionalRefs(seed,0,0).map(r=>r.id),regionalRefs(seed,1,0).map(r=>r.id));assert.notEqual(random(seed,'chest',0,0),random(seed,'portal',0,0));
});
test('first prompt carries all ratings but requests a bounded descriptive selection',()=>{
 const c=contextFor(seed,0,0),prompt=detailPrompt(c,[]),data=JSON.parse(prompt.input);assert.equal(data.ratings.length,160);assert.ok(data.selected_rating_ids.length<=16);assert.ok(prompt.instructions.includes('unique origin'));
 const valid={details:descriptiveIds(c).map(id=>({rating_id:id,description:'A grounded detail.'})),regional_texture:''};assert.doesNotThrow(()=>assertDetails(valid,c));assert.throws(()=>assertDetails({...valid,details:valid.details.slice(1)},c));const second=JSON.parse(scenePrompt(c,[],valid,[{package:{title:'Neighbor'}}]).input);assert.equal(second.connected_cells[0].package.title,'Neighbor');
});
test('a repeated death adds to the count but awards only one death badge',()=>{
 const p=fixture(),first=resolveArrival(character(),p);assert.equal(first.character.deaths,1);assert.equal(first.character.alive,false);assert.equal(first.character.badges.filter(b=>b.kind==='death').length,1);const second=resolveArrival({...first.character,alive:true},p);assert.equal(second.character.deaths,2);assert.equal(second.event.newBadge,null);assert.equal(second.character.badges.filter(b=>b.kind==='death').length,1);assert.equal(first.character.deaths,1);
});
test('new character collection is separate, origin preserves counters and maximum',()=>{
 const dead=resolveArrival(character(),fixture()).character;const origin=fixture(0,0);const back=resolveArrival({...dead,alive:true},origin);assert.ok(back.character.alive);assert.equal(back.character.deaths,1);assert.equal(back.character.furthest,dead.furthest);const fresh=resolveArrival(character(),fixture());assert.equal(fresh.event.newBadge,'Footnoted');
});
test('per-character consumption persists, global consumption uses supplied committed state',()=>{
 const p=fixture();p.context.event={id:'election',kind:'honor',mode:'once_per_character',entityId:'faction:a',cause:null,deathId:null};const first=resolveArrival(character(),p);assert.equal(first.event.kind,'honor');const again=resolveArrival(first.character,p);assert.equal(again.event.kind,'revisit');assert.equal(resolveArrival(character(),p).event.kind,'honor');p.context.event.mode='once_ever';assert.equal(resolveArrival(character(),p,true).event.kind,'revisit');
});
test('hostile badges affect only their character and never override safe origin',()=>{
 const p=fixture();p.context.event=null;p.context.hostilityPolicy.enforcesForeignHonors=true;const c=character();c.badges=[{id:'foreign',title:'Foreign honor',description:'',kind:'honor',entityId:'faction:elsewhere'}];assert.equal(resolveArrival(c,p).character.alive,false);assert.equal(resolveArrival(character(),p).character.alive,true);const origin=fixture(0,0);origin.context.hostilityPolicy.enforcesForeignHonors=true;assert.equal(resolveArrival(c,origin).character.alive,true);
});
