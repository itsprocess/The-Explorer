import {test} from 'node:test';
import assert from 'node:assert/strict';
import {settingInput,sceneInstructionsFor} from '../lib/lean-generation';
import {environmentPromptFields,settingCachePrefix} from '../lib/prompt-environment';
const cell=(inside:number,underground:number):any=>({x:1,y:2,occurrences:null,fieldwork:[
 {id:'biome.groundcover',name:'Groundcover',category:'biome',type:'gradient',present:true,value:.9,low:'low',high:'high'},
 {id:'civilization.inside',name:'Inside',category:'civilization',type:'boolean',present:true,value:inside,low:'outside',high:'inside'},
 {id:'biome.underground',name:'Underground',category:'biome',type:'boolean',present:true,value:underground,low:'above',high:'below'}
]});
test('building and constructed basement omit groundcover without mutating world fields',()=>{
 for(const underground of [0,1]){const c=cell(1,underground);assert.ok(!environmentPromptFields(c).some(f=>f.id==='biome.groundcover'));assert.ok(!settingInput([c],[]).definitions.some(d=>d.name==='Groundcover'));assert.equal(c.fieldwork[0].value,.9);assert.match(sceneInstructionsFor(c),/architectural floor/);assert.equal(settingCachePrefix(c),'setting-interior-v4:');}
});
test('outdoors and natural caves retain groundcover and existing cache keys',()=>{
 for(const underground of [0,1]){const c=cell(0,underground);assert.ok(environmentPromptFields(c).some(f=>f.id==='biome.groundcover'));assert.equal(settingCachePrefix(c),'setting-v3:');assert.doesNotMatch(sceneInstructionsFor(c),/architectural floor/);}
});
test('mixed five-cell setting batch omits only the indoor row vegetation',()=>{
 const indoor=cell(1,0),outdoor=cell(0,0),cave=cell(0,1);const input=settingInput([indoor,outdoor,cave],[]);const index=input.definitions.find(d=>d.name==='Groundcover')!.index;
 assert.ok(!input.cells[0].values.some(v=>v[0]===index));assert.deepEqual(input.cells[1].values.find(v=>v[0]===index),[index,.9]);assert.deepEqual(input.cells[2].values.find(v=>v[0]===index),[index,.9]);
});
