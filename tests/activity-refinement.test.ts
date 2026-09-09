import {test} from 'node:test';
import assert from 'node:assert/strict';
import {refineActivity} from '../sandbox/activity-refinement';
import {parseProject} from '../sandbox/model';
import baseline from '../lib/fieldwork-baseline.json';
import {broadTerrain} from '../lib/world';
import {interpretationInstructions} from '../lib/interpretation-policy';
test('activity refinement doubles point and site density without enlarging sites or amplifying quiet values',()=>{
 const p=parseProject(JSON.stringify(baseline)),n=refineActivity(p);
 p.variables.forEach((v,i)=>v.layers.forEach((l,j)=>{
  const r=n.variables[i].layers[j];assert.equal(r.gain,l.gain);assert.equal(r.weight,l.weight);
  if(l.source==='sparks')assert.ok(Math.abs((1-r.sparkCutoff!)-2*(1-l.sparkCutoff!))<1e-9);
  if(l.source==='patches'){
   assert.equal(r.patchMaxDiameter,l.patchMaxDiameter);assert.equal(r.patchMinDiameter,l.patchMinDiameter);
   const expected=Math.min(1,l.patchChance!*2*(r.patchSpacing!/l.patchSpacing!)**2);
   assert.equal(r.patchChance,expected);
  }
  if(l.source==='perlin'||l.source==='fbm')assert.equal(r.scaleX,l.scaleX/2);
 }));
});
test('biome compilation and previews use setting names',()=>{
 assert.equal(broadTerrain({'biome.groundcover':.8}),'');
 assert.equal(broadTerrain({'biome.large_foliage':.8,'biome.moisture':.8}),'');
 assert.match(interpretationInstructions('biome'),/original biome label/);
 assert.match(interpretationInstructions('biome'),/20 words/);
});
