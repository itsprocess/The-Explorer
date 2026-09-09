import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contextFor} from '../lib/world';
import {settingInput,settingInstructions,leanSceneInstructions} from '../lib/lean-generation';
import {readFileSync} from 'node:fs';
test('batch input shares authored meanings once and reduces repeated field payloads',()=>{
 const cells=[[0,0],[1,0],[-1,0],[0,1],[0,-1]].map(([x,y])=>contextFor('token-fixture',x,y));
 const data=settingInput(cells,[]),compact=JSON.stringify(data),old=JSON.stringify(cells.map(c=>c.fieldwork));
 assert.ok(compact.length<old.length*.35);
 for(const row of data.cells)for(const [index,value] of row.values){assert.ok(data.definitions[index]);assert.ok(value>=0&&value<=1);}
 assert.doesNotMatch(settingInstructions,/grassland|woodland|jungle|market street/);
 assert.ok(leanSceneInstructions.length<1400);
 console.log('Shared setting payload:',compact.length,'characters; repeated full stacks:',old.length);
});
test('images no longer resubmit field stacks and ordinary scenes omit raw ratings',()=>{
 const images=readFileSync(new URL('../lib/location-images.ts',import.meta.url),'utf8');assert.doesNotMatch(images,/fields:p.context.fieldwork/);
 const generation=readFileSync(new URL('../lib/generation.ts',import.meta.url),'utf8');assert.match(generation,/delete sceneInput.context.ratings/);
 assert.doesNotMatch(generation,/await interpretPass\(c,'biome'/);
});
