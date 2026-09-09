import {test} from 'node:test';
import assert from 'node:assert/strict';
import baseline from '../lib/fieldwork-baseline.json';
import reviewed from '../sandbox/reviewed-project.json';
import {parseProject,evaluator,issues} from '../sandbox/model';
test('runtime and noise-app default contain the identical complete valid stack',()=>{
 assert.deepEqual(reviewed,baseline);const p=parseProject(JSON.stringify(baseline));assert.deepEqual(issues(p),[]);
 for(const id of ['biome.off_ground','biome.weather_severity','variation.vibrance','variation.psychedelic','variation.terrifying','civilization.devoutness','occurrences.relic'])assert.equal(p.variables.filter(v=>v.appName===id).length,1);
});
test('sky patches are half civilization diameter and one-fifth candidate frequency',()=>{
 const p=parseProject(JSON.stringify(baseline)),sky=p.variables.find(v=>v.appName==='biome.off_ground')!,civ=p.variables.find(v=>v.appName==='civilization.density')!;
 const a=sky.layers.filter(l=>l.source==='patches'),b=civ.layers.filter(l=>l.source==='patches');assert.equal(a.length,b.length);a.forEach((l,i)=>{assert.equal(l.patchChance,b[i].patchChance!/5);assert.equal(l.patchMaxDiameter,Math.max(1,b[i].patchMaxDiameter!/2));assert.equal(l.patchSpacing,b[i].patchSpacing);});assert.equal(sky.traversal?.mode,'passable');
});
test('sky, weather and vibrance escalate radially, preserve zero, and leave unselected biomes unchanged',()=>{
 const p=parseProject(JSON.stringify(baseline));p.variables=p.variables.filter(v=>['biome.off_ground','biome.weather_severity','variation.vibrance','variation.psychedelic','variation.terrifying','natural.elevation'].includes(v.appName));p.civilizationObeysTraversal=false;
 for(const v of p.variables){delete v.presenceReference;v.layers=[{...v.layers[0],source:'constant',constant:.1,gain:1,bias:0,weight:1,blend:'replace',invert:false}];}
 const sample=evaluator(p);for(const v of p.variables){const near=sample(v.id,0,0).value,far=sample(v.id,10000,0).value;assert.equal(near,.1);assert.equal(far,sample(v.id,-10000,0).value);if(v.appName==='natural.elevation')assert.equal(far,near);else assert.ok(far>near&&far<1);v.layers[0].constant=0;assert.equal(evaluator(p)(v.id,10000,0).value,0);}
});
