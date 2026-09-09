import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {enlivenWorld} from '../sandbox/living-settings';
import {parseProject} from '../sandbox/model';
import baseline from '../lib/fieldwork-baseline.json';
import {interpretationInstructions} from '../lib/interpretation-policy';
test('frequency tuning preserves civilization shapes, quiet amplitudes and civilization multiplier',()=>{
 const p=parseProject(JSON.stringify(baseline)),next=enlivenWorld(p);
 assert.equal(next.occurrenceCivilizationBoost,p.occurrenceCivilizationBoost);
 p.variables.forEach((v,i)=>{
  if(!['variation','occurrences'].includes(v.category)){assert.deepEqual(next.variables[i],v);return;}
  v.layers.forEach((l,j)=>{const n=next.variables[i].layers[j];assert.equal(n.gain,l.gain);assert.equal(n.weight,l.weight);
   if(l.source==='sparks')assert.ok(Math.abs((1-n.sparkCutoff!)-2*(1-l.sparkCutoff!))<1e-8);
   if(l.source==='fbm'||l.source==='perlin')assert.equal(n.scaleX,l.scaleX/2);
  });
 });
});
test('population and built setting are represented throughout interpretation, peeks and image prompts',()=>{
 assert.match(interpretationInstructions('civilization'),/CURRENT POPULATION DENSITY/);
 const generation=readFileSync(new URL('../lib/generation.ts',import.meta.url),'utf8');
 assert.match(generation,/const setting=await ensureSetting\(context\)/);assert.match(generation,/await ensureSetting\(next\)/);
 assert.match(generation,/civilization:saved.civilization/);
 const image=readFileSync(new URL('../lib/location-images.ts',import.meta.url),'utf8');assert.match(image,/Positive density requires visible people/);
 assert.doesNotMatch(image,/never neighboring occupants/);
});
