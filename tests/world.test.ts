import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contextFor,deriveRatings,exists,connections,directions,recipes,regionalRefs,broadTerrain} from '../lib/world';
import {random,oi} from '../lib/noise';
import {detailPrompt,descriptiveIds,assertDetails,scenePrompt,assertScene,type Scene} from '../lib/prompts';
import {resolveArrival,type Character} from '../lib/rules';
import type {CellPackage} from '../lib/generation';
const seed='test-world';
const character=():Character=>({id:'test',name:'Tester',x:0,y:0,alive:true,deaths:0,furthest:0,badges:[],consumed:[]});
function fixture(x=8,y=4):CellPackage{
 const context=contextFor(seed,x,y);context.event={id:'trap',kind:'death',mode:'every_visit',cause:'archival press',deathId:'death:archival press',entityId:null};context.hostilityPolicy.enforcesForeignHonors=false;
 const scene:Scene={title:'Test location',description:'A fixture scene for rule verification.',exits:context.edges.map(e=>({direction:e.direction as keyof typeof directions,description:e.material+' '+e.opening+' with a flat threshold.'})),visual_brief:'',continuity_facts:[],event_narrative:'{character_name} was pressed into a footnote.',consumed_narrative:'The ceremony is over.',hostility_narrative:'The kingdom remembered your rival honor.',death_badge_title:'Footnoted',death_badge_description:'Killed by an archival press.',honor_badge_title:'Honorary archivist'};
 return {context,scene,regions:context.regions.map(r=>({id:r.id,kind:r.kind,name:r.kind,lore:''})),created:0,pass2Prompt:null,pass2Result:null,imagePackage:{enabled:false}};
}
test('all registered fields are deterministic, finite, and separately addressed',()=>{
 const a=deriveRatings(seed,-891,1702),b=deriveRatings(seed,-891,1702);assert.deepEqual(a,b);assert.equal(a.length,recipes.length);assert.equal(new Set(a.map(r=>r.recipe)).size,recipes.length);assert.equal(new Set(recipes.map(r=>r.recipe)).size,recipes.length);a.forEach(r=>assert.ok(r.value>=0&&r.value<=1));assert.notDeepEqual(a,deriveRatings(seed+'2',-891,1702));assert.throws(()=>oi(NaN));
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
test('local preparation keeps relevant ratings and legacy details remain valid',()=>{
 const c=contextFor(seed,0,0),prompt=detailPrompt(c,[]),data=JSON.parse(prompt.input);assert.ok(data.context.ratings.length<recipes.length);assert.equal(data.context.protectedOrigin,true);assert.ok(prompt.instructions.includes('no model call'));
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
test('automatic interactions record experience without inventing rewards or deaths',()=>{
 const p=fixture();p.context.event={id:'interaction',kind:'interaction',mode:'once_per_character',entityId:null,cause:null,deathId:null};
 p.scene.event_narrative='{character_name} helped a wind-driven cart clear a rut.';
 const first=resolveArrival(character(),p);assert.equal(first.event.kind,'interaction');assert.equal(first.event.newBadge,null);assert.equal(first.character.deaths,0);assert.ok(first.character.alive);
 assert.equal(resolveArrival(first.character,p).event.kind,'revisit');
});
test('scenes must describe exactly the available exits and stay brief',()=>{
 const p=fixture(0,0);p.context.event=null;p.scene.description='A low stone shelter surrounds a worn bench. Its floor is swept clean.';
 assert.doesNotThrow(()=>assertScene(p.scene,p.context));
 assert.throws(()=>assertScene({...p.scene,exits:p.scene.exits.slice(1)},p.context));
 assert.throws(()=>assertScene({...p.scene,exits:[p.scene.exits[0],...p.scene.exits.slice(1).map(()=>p.scene.exits[0])]},p.context));
 assert.throws(()=>assertScene({...p.scene,description:'word '.repeat(81)},p.context));
 const prompt=scenePrompt(p.context,[],{details:[],regional_texture:''},[]);
 assert.ok(prompt.instructions.includes('continuity context only'));
 assert.ok(!prompt.instructions.includes('No imagery'));
});
test('features are sparse, stability is usually high, and forests form patches',()=>{
 const counts:Record<string,number>={};let quiet=0,stability=0,forest=0,forestNext=0;
 const n=4000;
 for(let i=0;i<n;i++){
  const x=Math.floor(random(seed,'sample-x',i,0)*20000)-10000,y=Math.floor(random(seed,'sample-y',i,0)*20000)-10000;
  const rs=deriveRatings(seed,x,y),v=Object.fromEntries(rs.map(r=>[r.id,r.value]));
  for(const r of rs)if(r.kind==='feature'&&r.value>0)counts[r.id]=(counts[r.id]||0)+1;
  if(rs.filter(r=>r.kind==='feature'&&r.id!=='scenery.unique_features'&&r.value>0).length===0)quiet++;
  if(v['architecture.structural_integrity']>.8)stability++;
  if(v['vegetation.forest']>0){forest++;if(deriveRatings(seed,x+1,y).find(r=>r.id==='vegetation.forest')!.value>0)forestNext++;}
 }
 assert.ok(quiet/n>.3,'At least 30% should have no special features beyond minor scenery');
 assert.ok(stability/n>.85,'Sound structure should be the ordinary baseline');
 assert.ok((counts['civilization.settlement']||0)/n<.03);
 assert.ok((counts['encounters.treasure']||0)/n<.004);
 assert.ok(forest/n>.03&&forest/n<.4);
 assert.ok(forestNext/forest>.65,'Forests must persist across adjacent cells');
 for(const count of Object.values(counts))assert.ok(count/n<.4,'No special feature should dominate the world');
});
test('direction descriptions partition the compass and previews exclude secret features',()=>{
 for(const [x,y] of [[0,0],[13,27],[-19,51],[1000000000,0]]){
  const c=contextFor(seed,x,y);
  assert.equal(c.edges.length+c.blocked.length,4);
  assert.equal(new Set([...c.edges,...c.blocked].map(e=>e.direction)).size,4);
  for(const b of c.blocked){assert.equal(c.connections[b.direction],false);assert.ok(b.reason.length>15);}
  for(const e of c.edges)assert.ok(e.glimpse.length>0);
 }
 const ordinary={'terrain.enclosure':0,'climate.temperature':.5};
 assert.equal(broadTerrain(ordinary),broadTerrain({...ordinary,'encounters.treasure':1,'hazards.trap':1,'supernatural.portal':1,'civilization.prison':1}));
});
test('oceans have regional continuity and a dry connected origin',()=>{
 let wet=0,adjacent=0;
 for(let i=0;i<1500;i++){
  const x=i*19-15000,y=i*37-18000;
  const a=deriveRatings(seed,x,y).find(r=>r.id==='water.ocean')!.value;
  if(a>.15){wet++;if(deriveRatings(seed,x+1,y).find(r=>r.id==='water.ocean')!.value>.15)adjacent++;}
 }
 assert.ok(wet>20);assert.ok(adjacent/wet>.9);
 for(let x=-2;x<=2;x++)assert.equal(deriveRatings(seed,x,0).find(r=>r.id==='water.ocean')!.value,0);
 assert.ok(recipes.filter(r=>r.kind==='feature').length>=54);assert.ok(recipes.filter(r=>r.kind==='baseline').length>=10);
});
test('unique scenery is sparse and always gets a descriptive slot without selecting an event',()=>{
 let present=0;
 for(let i=0;i<1800;i++){
  const x=i%41-20,y=Math.floor(i/41)%41-20,sampleSeed=seed+i,rs=deriveRatings(sampleSeed,x,y),r=rs.find(r=>r.id==='scenery.unique_features')!;
  if(r.value>0){present++;if(present<5){const c=contextFor(sampleSeed,x,y);assert.ok(descriptiveIds(c).includes(r.id));assert.notEqual(c.event?.id,r.id);}}
 }
 assert.ok(present/1800>.16&&present/1800<.25);
});
