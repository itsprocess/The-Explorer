import {test} from 'node:test';
import assert from 'node:assert/strict';
import {separateAutomaticOutcomes} from '../lib/occurrences';
import {environmentPromptFields} from '../lib/prompt-environment';
import {riverSetting,settingInput} from '../lib/lean-generation';
const standing:any={family:'faction',value:'a',delta:-12};
const base:any={death:false,relic:true,teleport:{x:4,y:5},gift:{kind:'give',awards:[],badge:false,standing},option:null,challenge:{kind:'challenge',requirement:{kind:'defining',value:'Wit'},present:{kind:'give',awards:[],badge:false,standing:{...standing,delta:12}},absent:{kind:'kill',standing}}};
test('automatic deaths and check outcomes do not stack penalties or rewards',()=>{
 const c=separateAutomaticOutcomes(base,'fixture',-2,1);assert.deepEqual(c.challenge!.absent,{kind:'kill'});assert.equal(c.gift,null);assert.equal(c.teleport,null);assert.equal(c.relic,false);
 assert.ok(c.challenge!.present.kind==='none'||!c.challenge!.present.standing);assert.deepEqual(separateAutomaticOutcomes(c,'fixture',-2,1),c);
 const death=separateAutomaticOutcomes({...base,death:true},'fixture',-2,1);assert.equal(death.challenge,null);assert.equal(death.gift,null);assert.equal(death.teleport,null);assert.equal(death.relic,false);
 const option={...base,challenge:null,option:{policy:'character',choices:[{kind:'none'},{kind:'none',standing}]}};assert.deepEqual(separateAutomaticOutcomes(option,'fixture',0,0).option,option.option);
});
test('underground and developed settlements ignore local rivers but retain neighbor rivers',()=>{
 for(const field of ['biome.underground','civilization.inside','civilization.footprint']){
 const c:any={x:0,y:0,fieldwork:[{id:field,present:true,value:1},{id:'biome.river',present:true,value:.8},{id:'biome.river_barrier',present:true,value:1}],adjacentTerrain:[{direction:'north',terrain:[{kind:'river',strength:.9}]}]};
 assert.equal(riverSetting(c),undefined);assert.ok(!environmentPromptFields(c).some(f=>f.id.startsWith('biome.river')));assert.deepEqual(settingInput([c],[]).cells[0].adjacentTerrain,c.adjacentTerrain);
 }
 assert.equal(riverSetting({fieldwork:[{id:'biome.river',present:true,value:.8}]} as any)?.strength,.8);
});
