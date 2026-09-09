import {test} from 'node:test';
import assert from 'node:assert/strict';
import {encounterPrompt} from '../lib/encounter-prompt';
import {validateOutcomeNarratives,needsDeathNarrativeRepair,outcomeNarrativeSchema} from '../lib/occurrence-narrative';
import {resolveOccurrences} from '../lib/occurrence-resolution';
const o:any={death:false,option:{policy:'life',choices:[{kind:'none'},{kind:'kill'}]}};
const killedBoar={key:'option-1',text:'{character_name} killed the boar with a fallen stone before freeing the trapped naturalist.',badgeTitle:'Boar Slayer',badgeDescription:'Killed the boar.',awards:[],rescueText:'{protection_name} carried {character_name} away.'};
const declined={key:'option-0',text:'{character_name} left the clearing.',awards:[],badgeTitle:'',badgeDescription:''};
test('AI receives player as death victim for direct and nested outcomes',()=>{
 const prompt=encounterPrompt({...o,challenge:{kind:'challenge',requirement:{kind:'defining',value:'Strength'},present:{kind:'none'},absent:{kind:'kill'}}},{seed:'fixture',x:1,y:1},{});
 const leaves=JSON.parse(prompt.input).outcomeLeaves;
 for(const key of ['option-1','challenge:absent'])assert.deepEqual(leaves.find((l:any)=>l.key===key).outcome,{kind:'player_death',victim:'{character_name}'});
 assert.match(prompt.instructions,/never guaranteed success/);assert.match(prompt.instructions,/same victim in any imprint/);
});
test('reported boar narration is rejected and flagged for cached repair',()=>{
 assert.throws(()=>validateOutcomeNarratives(o,[declined,killedBoar]),/Player death/);
 assert.equal(needsDeathNarrativeRepair(o,[declined,killedBoar]),true);
 const corrected={...killedBoar,text:'{character_name} died when the boar charged beneath the raised stone.',badgeTitle:'Under the Tusks',badgeDescription:'Died attempting to rescue the naturalist.'};
 assert.doesNotThrow(()=>validateOutcomeNarratives(o,[declined,corrected]));
 assert.equal(needsDeathNarrativeRepair(o,[declined,corrected]),false);
});
test('runtime cannot kill player from an opponent-killing history, even with protection',()=>{
 const p:any={context:{seed:'s',version:'v',x:1,y:1,distance:1,occurrences:o},scene:{title:'Clearing'},occurrenceText:{choices:[{label:'Leave'},{label:'Strike the boar'}],outcomes:[declined,killedBoar]}};
 const c:any={id:'p',name:'Player',x:1,y:1,alive:true,deaths:0,furthest:1,badges:[],pendingOption:{key:'s:v:1:1',visit:'v'},traits:[]};
 assert.throws(()=>resolveOccurrences(c,p,'choice',1),/Player death/);
 assert.equal(c.alive,true);assert.equal(c.deaths,0);
 c.traits=[{kind:'status',family:'death_protection',value:'reprieve'}];assert.throws(()=>resolveOccurrences(c,p,'protected-choice',1),/Player death/);assert.equal(c.traits.length,1);
});

test('provider schema stays simple while local validation enforces the victim',()=>{
 const schema=outcomeNarrativeSchema(o) as any;
 const death=schema.items.anyOf.find((l:any)=>l.properties.key.enum[0]==='option-1');
 assert.deepEqual(death.properties.text,{type:'string',minLength:1});
 assert.throws(()=>validateOutcomeNarratives(o,[declined,killedBoar]),/Player death/);
});
