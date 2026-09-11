import {test} from 'node:test';
import assert from 'node:assert/strict';
import {passageOpening} from '../lib/enclosure';
import {contextFor} from '../lib/world';
import {settingInput,neighborContinuity} from '../lib/lean-generation';
import {scenePrompt} from '../lib/prompts';
import type {Layer} from '../sandbox/model';
import baseline from '../lib/fieldwork-baseline.json';
import sandbox from '../sandbox/reviewed-project.json';
const cave={'biome.underground':1},room={'civilization.inside':1},basement={...cave,...room};
test('shared enclosure produces internal passages in both directions',()=>{
 for(const [a,b,phrase] of [[cave,cave,'rock overhead'],[room,room,'indoors on both sides'],[basement,cave,'rock overhead'],[basement,basement,'enclosed on both sides'],[room,basement,'indoors on both sides']] as const){
  const opening=passageOpening(a,b);assert.equal(opening,passageOpening(b,a));assert.ok(opening.includes(phrase));assert.doesNotMatch(opening,/outdoor|entrance/);
 }
 assert.match(passageOpening(cave,{}),/cave entrance/);assert.match(passageOpening(room,{}),/building entrance/);
});
test('internal passage geometry reaches setting and scene prompts; unseen neighbors retain enclosure',()=>{
 const c=contextFor('fixture',0,0);c.edges=[{id:'edge',direction:'north',glimpse:'Deeper chamber',visibleFeatures:[],material:'stone',opening:passageOpening(cave,cave)}];
 c.fieldwork=[{id:'biome.underground',present:true,value:1} as any];
 assert.match(settingInput([c],[]).cells[0].passages[0].opening,/rock overhead/);
 const prompt=scenePrompt(c,[],{details:[],regional_texture:''},[]);assert.match(prompt.input,/rock overhead/);
 assert.equal(neighborContinuity(c,'Deeper chamber',undefined).enclosure.underground,true);
});
test('cave recipe is one third of previous band width and pocket chance; defaults agree',()=>{
 assert.deepEqual(baseline,sandbox);
 const cave=baseline.variables.find(v=>v.appName==='biome.underground')! as {layers:Layer[]};
 assert.ok(Math.abs((cave.layers[0].bandHigh!-cave.layers[0].bandLow!)-.04)<1e-9);
 assert.ok(Math.abs(cave.layers[1].patchChance!-.35/3)<1e-9);
});
