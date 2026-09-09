import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sceneInstructionsFor,neighborContinuity} from '../lib/lean-generation';
import {occurrencesFor} from '../lib/occurrences';
import {previewResult} from '../lib/dev-travel-state';
import type {Character} from '../lib/rules';
const empty=occurrencesFor('fixture',1,1,{},[]);
test('unassigned scenes and origin never request teleport or relic manifestations',()=>{
 for(const occurrences of [null,empty]){
 const prompt=sceneInstructionsFor({occurrences});assert.doesNotMatch(prompt,/teleport|relic/i);assert.match(prompt,/Null means no encounter/);
 }
});
test('each special depiction requires its own assigned outcome, including nested choice branches',()=>{
 const teleport=sceneInstructionsFor({occurrences:{...empty,teleport:{x:3,y:4}}});assert.match(teleport,/assigned teleport/);assert.doesNotMatch(teleport,/relic/);
 const relic=sceneInstructionsFor({occurrences:{...empty,relic:true}});assert.match(relic,/assigned relic/);assert.doesNotMatch(relic,/teleport/);
 const nested=sceneInstructionsFor({occurrences:{...empty,option:{policy:'life',choices:[{kind:'none'},{kind:'challenge',requirement:{kind:'defining',value:'Wit'},present:{kind:'teleport',destination:{x:3,y:4}},absent:{kind:'none'}}]}}});assert.match(nested,/assigned teleport/);assert.doesNotMatch(nested,/relic/);
});
test('neighbor continuity transmits the boundary and setting, not local encounter scenery',()=>{
 const context={x:1,y:2,occurrences:{...empty,relic:true},description:'A portal and relic stand here.'};
 const data=neighborContinuity(context as any,'Wooded slope','A stone arch opens onto the slope.');
 assert.deepEqual(data,{coordinate:[1,2],setting:'Wooded slope',shared_exit:'A stone arch opens onto the slope.'});assert.doesNotMatch(JSON.stringify(data),/portal|relic/);
});
test('Dev discoveries and movement never advance real progress counters',()=>{
 const real:Character={id:'a',name:'A',x:0,y:0,alive:true,deaths:0,furthest:0,badges:[],consumed:[],distanceLife:3,distanceTotal:10,relicsLife:1,relicsTotal:2};
 const preview=previewResult(real,{...real,x:100,distanceLife:103,distanceTotal:110,relicsLife:2,relicsTotal:3},{kind:'relic',text:'Discovered.',newBadge:null});
 assert.equal(preview.devState.distanceTotal,10);assert.equal(preview.devState.distanceLife,3);assert.equal(preview.devState.relicsLife,1);assert.equal(preview.devState.relicsTotal,2);assert.equal(real.x,0);
});
