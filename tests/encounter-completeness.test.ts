import {test} from 'node:test';
import assert from 'node:assert/strict';
import {keyedOutcomeNarrativeSchema,decodeOutcomeNarratives,validateOutcomeNarratives,narrativeOutcomes} from '../lib/occurrence-narrative';
const challenge={kind:'challenge',requirement:{kind:'defining',value:'Wit'},present:{kind:'none'},absent:{kind:'none'}};
const occurrence:any={challenge,option:{choices:[{kind:'none'},{kind:'kill'},challenge]}};
test('six-branch canal encounter requires the omitted fatal option exactly once',()=>{
 const schema=keyedOutcomeNarrativeSchema(occurrence) as any;
 const keys=['challenge:present','challenge:absent','option-0','option-1','option-2:present','option-2:absent'];
 assert.deepEqual(schema.required,keys);assert.deepEqual(Object.keys(schema.properties),keys);
 assert.equal(schema.additionalProperties,false);
 assert.ok(schema.properties['option-1'].required.includes('rescueText'));
 const valid=Object.fromEntries(narrativeOutcomes(occurrence).map(({key})=>[key,key==='option-1'?{text:'{character_name} died in the broken canal.',rescueText:'{protection_name} returned {character_name} to safety.',badgeTitle:'Lost in the Canal',badgeDescription:'Died in the broken crossing.'}:{text:'{character_name} left the canal.'}]));
 assert.doesNotThrow(()=>validateOutcomeNarratives(occurrence,decodeOutcomeNarratives(valid)));
 const incomplete={...valid};delete incomplete['option-1'];
 assert.throws(()=>validateOutcomeNarratives(occurrence,decodeOutcomeNarratives(incomplete)),/Incomplete/);
 const duplicate=decodeOutcomeNarratives(incomplete);duplicate.push(duplicate.find(r=>r.key==='option-0')!);
 assert.throws(()=>validateOutcomeNarratives(occurrence,duplicate),/Incomplete/);
});
