import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {enrichEncounters,civilizationEventDrive} from '../sandbox/encounter-refinement';
import {parseProject,evaluator} from '../sandbox/model';
import baseline from '../lib/fieldwork-baseline.json';
test('extra civilization sites keep size and gates; all occurrence channels increase independently',()=>{
 const p=parseProject(JSON.stringify(baseline)),next=enrichEncounters(p);
 p.variables.forEach((v,i)=>{
  const n=next.variables[i];assert.deepEqual(n.traversal,v.traversal);assert.equal(n.presenceReference,v.presenceReference);
  if(v.category==='biome')assert.deepEqual(n,v);
  if(v.category==='civilization')for(const l of v.layers.filter(l=>l.source==='patches')){
   const extra=n.layers.find(r=>r.id===l.id+'-extra-sites')!;
   assert.equal(extra.patchMinDiameter,l.patchMinDiameter);assert.equal(extra.patchMaxDiameter,l.patchMaxDiameter);
   assert.equal(extra.patchChance,l.patchChance);assert.notEqual(extra.channel,l.channel);assert.notEqual(extra.offsetX,l.offsetX);
  }
  if(v.category==='occurrences')for(const l of v.layers.filter(l=>l.source==='sparks'))assert.ok(Math.abs((1-n.layers.find(r=>r.id===l.id)!.sparkCutoff!)-2*(1-l.sparkCutoff!))<1e-8);
 });
});
test('civilization scales the shared event candidate drive smoothly from 1 to 3',()=>{
 assert.equal(civilizationEventDrive([0,0,0]),1);assert.equal(civilizationEventDrive([.5,.25,0]),2);assert.equal(civilizationEventDrive([1,.2,.1]),3);
 const p=parseProject(JSON.stringify(baseline));const evaluate=evaluator(p);
 for(const v of p.variables){const r=evaluate(v.id,3,-2);assert.ok(Number.isFinite(r.value));}
});
test('generation commits adjacent biome peeks and separates reverse scenery from shared geometry',()=>{
 const generation=readFileSync(new URL('../lib/generation.ts',import.meta.url),'utf8');
 assert.match(generation,/await ensureSettings\(targets\)/);assert.match(generation,/edge.glimpse=nextSetting.name/);
 const prompts=readFileSync(new URL('../lib/prompts.ts',import.meta.url),'utf8');assert.match(prompts,/immediately adjacent cell/);assert.match(prompts,/do not copy that view/);
 const policy=readFileSync(new URL('../lib/interpretation.ts',import.meta.url),'utf8');assert.match(policy,/Never narrate that no challenge exists/);
});
