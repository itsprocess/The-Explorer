import {test} from 'node:test';
import assert from 'node:assert/strict';
import {riverSetting,settingInput,sceneInstructionsFor} from '../lib/lean-generation';
import baseline from '../lib/fieldwork-baseline.json';
const cell=(barrier:number,strength=.8)=>({x:1,y:2,occurrences:null,fieldwork:[{id:'biome.river',name:'River',category:'biome',type:'gradient',present:true,value:strength,low:'low',high:'high'},{id:'biome.river_barrier',name:'River barrier',category:'biome',type:'boolean',present:true,value:barrier,low:'open',high:'blocked'}]}) as any;
test('crossing relief preserves river strength through setting and scene handoffs',()=>{
 const open=cell(0),blocked=cell(1);assert.deepEqual(riverSetting(open),{strength:.8,crossingBlocked:false});assert.deepEqual(riverSetting(blocked),{strength:.8,crossingBlocked:true});
 assert.equal(settingInput([open],[]).cells[0].river?.strength,.8);assert.equal(settingInput([blocked],[]).cells[0].river?.strength,.8);
 assert.match(sceneInstructionsFor(open),/crossing is open/);assert.match(sceneInstructionsFor(open),/Preserve it in the scene and visual_brief/);assert.match(sceneInstructionsFor(blocked),/invent no safe crossing/);
});
test('non-river tiles receive no river instruction or payload',()=>{assert.equal(riverSetting(cell(0,0)),undefined);assert.doesNotMatch(sceneInstructionsFor(cell(0,0)),/This cell contains river water/);});
test('default stack keeps river identity and crossing in separate variables',()=>{const river=baseline.variables.find(v=>v.appName==='biome.river')!,barrier=baseline.variables.find(v=>v.appName==='biome.river_barrier')!;assert.notEqual(river.id,barrier.id);assert.match(river.description,/separate river barrier/);assert.match(barrier.off!,/where a river exists/);});
