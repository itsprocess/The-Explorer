import {test} from 'node:test';
import assert from 'node:assert/strict';
import baseline from '../lib/fieldwork-baseline.json';
import preview from '../sandbox/reviewed-project.json';
import {parseProject,evaluator} from '../sandbox/model';
import {standingResultChance,optionPortalAllowed,occurrencesFor} from '../lib/occurrences';
const p=parseProject(JSON.stringify(baseline));
test('runtime and preview share doubled occurrence candidates and half-density portals',()=>{
 assert.deepEqual(baseline,preview);
 for(const v of p.variables.filter(v=>v.category==='occurrences')){
  const sparks=v.layers.filter(l=>l.source==='sparks');
  if(v.appName==='occurrences.teleport'){
   assert.equal(sparks.length,1);assert.ok(Math.abs((1-sparks[0].sparkCutoff!**9)/(1-.96**9)-.5)<1e-10);
  }else{assert.equal(sparks.length,2);assert.notEqual(sparks[0].channel,sparks[1].channel);assert.equal(sparks[1].blend,'max');assert.equal(sparks[0].sparkCutoff,sparks[1].sparkCutoff);}
 }
});
test('weather patch chance is one third; barrier layouts have twice the spatial density',()=>{
 const v=(name:string)=>p.variables.find(v=>v.appName===name)!;
 assert.ok(Math.abs(v('biome.weather_severity').layers.find(l=>l.source==='patches')!.patchChance!-.35/3)<1e-10);
 assert.ok(Math.abs(v('natural.ocean').layers[0].scaleX-1500/Math.sqrt(2))<1e-10);
 assert.ok(Math.abs(v('biome.void').layers[0].scaleX-150)<1e-10);
 assert.ok(Math.abs(v('biome.chasms').layers[0].scaleX-50/Math.sqrt(2))<1e-10);
 const lakes=v('biome.lakes_ponds').layers.filter(l=>l.source==='patches');assert.equal(lakes.length,6);for(const l of lakes)assert.ok(Math.abs(l.patchSpacing!-60.104076400856535)<1e-10);
 assert.equal(v('biome.river_barrier').layers[1].channel,'river-relief');
});
test('portal choice gate is one in twenty and standing chances double with saturation',()=>{
 assert.equal(optionPortalAllowed(.049999),true);assert.equal(optionPortalAllowed(.05),false);assert.equal(optionPortalAllowed(.99),false);
 assert.equal(standingResultChance(0),.3);assert.ok(Math.abs(standingResultChance(.25)-.65)<1e-10);assert.equal(standingResultChance(1),1);
 // A few fixed fixtures exercise nested option outcomes without procedural sweeps.
 for(const [x,y] of [[0,0],[2,3],[8,-4],[100,80]]){
  const o=occurrencesFor('balance-fixture',x,y,{'occurrences.option':1},[]);
  for(const choice of o.option!.choices)if(choice.kind==='challenge'){assert.notEqual(choice.present.kind,'teleport');assert.notEqual(choice.absent.kind,'teleport');}
 }
});

test('built interiors can coexist with underground and sky poles name supported forms',()=>{
 const fixture=parseProject(JSON.stringify(baseline));fixture.civilizationObeysTraversal=false;
 const get=(name:string)=>fixture.variables.find(v=>v.appName===name)!;
 for(const name of ['civilization.footprint','civilization.infrastructure','civilization.inside','biome.underground']){
  const v=get(name);if(name==='civilization.footprint'||name==='civilization.infrastructure')v.layers=[{...v.layers[0],source:'constant',constant:1,blend:'replace',weight:1,gain:1,bias:0,invert:false,noiseTransform:'value'}];else v.layers=v.layers.map(l=>l.source==='variable'?l:{...l,source:'constant',constant:1,gain:1,bias:0,invert:false,noiseTransform:'value'});
 }
 const evaluate=evaluator(fixture);
 assert.equal(evaluate(get('civilization.inside').id,0,0).value,1);
 assert.equal(evaluate(get('biome.underground').id,0,0).value,1);
 assert.match(get('biome.underground').on,/dungeon, mineshaft/);
 assert.match(get('biome.off_ground').high,/treehouses/);assert.match(get('biome.off_ground').high,/floating islands/);
});
