import {test} from 'node:test';
import assert from 'node:assert/strict';
import {encounterPrompt} from '../lib/encounter-prompt';
import {outcomeNarrativeSchema,normalizeOutcomeNarratives,validateOutcomeNarratives} from '../lib/occurrence-narrative';
import {settingInput} from '../lib/lean-generation';
import type {Occurrences} from '../lib/occurrences';
const o:Occurrences={death:false,teleport:null,gift:null,challenge:null,option:null};
test('relic prompt omits unrelated instructions and duplicate mechanical trees',()=>{
 const p=encounterPrompt({...o,relic:true},{seed:'s',x:1,y:2},{}),input=JSON.parse(p.input);
 assert.equal(input.occurrences,undefined);assert.equal(input.outcomeLeaves.length,1);assert.doesNotMatch(p.instructions,/assigned teleport|Options are|For each challenge|recognizable physical objects/);assert.match(p.instructions,/relic is a discovery/);
});
test('compact schema retains required death metadata and normalizes omitted unused fields',()=>{
 const death={...o,death:true},schema:any=outcomeNarrativeSchema(death,false),fields=schema.items.anyOf[0].properties;
 assert.equal(fields.badgeTitle.minLength,1);assert.equal(fields.awards,undefined);assert.equal(fields.repeatText,undefined);assert.equal(fields.imprint,undefined);
 const rows=normalizeOutcomeNarratives([{key:'death',text:'A fell.',badgeTitle:'Fall',badgeDescription:'Fell.'}]);validateOutcomeNarratives(death,rows);assert.deepEqual(rows[0].awards,[]);assert.throws(()=>validateOutcomeNarratives(death,normalizeOutcomeNarratives([{key:'death',text:'A fell.'}])),/achievement/);
});
test('challenge payload retains requirement and both outcomes without teleport coordinates',()=>{
 const c:Occurrences={...o,challenge:{kind:'challenge',requirement:{kind:'defining',value:'Wit'},present:{kind:'teleport',destination:{x:999,y:999}},absent:{kind:'none'}}};
 const p=encounterPrompt(c,{seed:'s',x:1,y:2},{}),input=JSON.parse(p.input);assert.equal(input.requirements[0].requirement.value,'Wit');assert.deepEqual(input.outcomeLeaves.map((l:any)=>l.key),['challenge:present','challenge:absent']);assert.doesNotMatch(p.input,/999/);assert.match(p.instructions,/requirement_name/);
});
test('setting poles are retained wherever a cell needs them',()=>{
 const c=(value:number)=>({x:0,y:0,fieldwork:[{id:'a',name:'A',category:'biome',type:'gradient',present:true,value,low:'Low',high:'High'}]}) as any;
 assert.deepEqual(settingInput([c(0)],[]).definitions[0],{index:0,name:'A',category:'biome',low:'Low'});assert.equal(settingInput([c(0),c(1)],[]).definitions[0].high,'High');assert.equal(settingInput([c(.5)],[]).definitions[0].low,'Low');
});
