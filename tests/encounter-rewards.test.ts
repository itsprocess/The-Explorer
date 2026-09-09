import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveOccurrences} from '../lib/occurrence-resolution';
import {deduplicateBadges} from '../lib/achievement-identity';
import {validateOutcomeNarratives,narrativeOutcomes,outcomeNarrativeSchema} from '../lib/occurrence-narrative';
import type {CellPackage} from '../lib/generation';
import type {Character} from '../lib/rules';
const player=():Character=>({id:'a',name:'Ari',x:0,y:0,alive:true,deaths:0,furthest:0,badges:[],consumed:[]});
function cell():CellPackage{return {context:{seed:'fixture',version:'fieldwork-1',x:2,y:3,distance:4,occurrences:{death:false,teleport:null,challenge:null,option:null,gift:{kind:'give',awards:[{kind:'possession',purpose:'protection',affinity:'water',material:'metal',lifetime:'permanent'},{kind:'status',family:'blessing',value:'ward',lifetime:'until_death'}],badge:true}}},scene:{title:'Fixture'},occurrenceText:{choices:[],outcomes:[{key:'gift',repeatText:'{character_name} returned to the empty plinth.',text:'{character_name} caught the silver shard as it fell.',badgeTitle:'Catcher',badgeDescription:'Caught the falling shard.',awards:[{name:'Silver shard',description:'Cold silver with a water-blue edge.'},{name:'Tidal ward',description:'A cool pressure protects your skin.'}]}]}} as unknown as CellPackage;}
test('awards use individual AI descriptions; badges and permanent items never repeat after death',()=>{
 const p=cell(),first=resolveOccurrences(player(),p,'a');
 assert.match(first.event.text,/Ari caught/);assert.deepEqual(first.character.traits!.map(t=>t.name),['Silver shard','Tidal ward']);
 const again=resolveOccurrences(first.character,p,'b');assert.equal(again.character.badges.length,1);assert.equal(again.event.stateChanges.length,0);
 const reborn={...first.character,deaths:1,traits:first.character.traits!.filter(t=>t.lifetime==='permanent')};
 const next=resolveOccurrences(reborn,p,'c');assert.equal(next.character.badges.length,1);assert.deepEqual(next.event.stateChanges.map(s=>s.trait.name),['Tidal ward']);
});
test('replaced or consumed awards cannot be farmed within the same life',()=>{
 const p=cell(),first=resolveOccurrences(player(),p,'a').character;first.traits=[];
 assert.equal(resolveOccurrences(first,p,'b').event.stateChanges.length,0);
});
test('nested challenge death uses the selected leaf narration',()=>{
 const p=cell();p.context.occurrences!.gift=null;p.context.occurrences!.challenge={kind:'challenge',requirement:{kind:'defining',value:'Faith'},present:{kind:'none'},absent:{kind:'kill'}};
 p.occurrenceText!.outcomes=[{key:'challenge:absent',text:'The collapsing arch crushed {character_name}, ending their life.',badgeTitle:'Under the arch',badgeDescription:'Fell beneath the arch.',awards:[]}];
 const result=resolveOccurrences(player(),p,'a');assert.equal(result.character.alive,false);assert.match(result.event.text,/crushed Ari/);
});
test('missing nested award or death text is rejected before caching',()=>{
 const p=cell(),o=p.context.occurrences!;assert.deepEqual(narrativeOutcomes(o).map(r=>r.key),['gift']);
 assert.doesNotThrow(()=>validateOutcomeNarratives(o,p.occurrenceText!.outcomes!));
 assert.throws(()=>validateOutcomeNarratives(o,[{...p.occurrenceText!.outcomes![0],awards:[]}]));
 assert.throws(()=>validateOutcomeNarratives(o,[{...p.occurrenceText!.outcomes![0],text:''}]));
});
test('legacy duplicated cell achievements collapse without merging different cells',()=>{
 const b={kind:'honor' as const,title:'Memory',description:'Remembered here'};
 const list=[{...b,id:'seed:fieldwork-1:2:3:option-0'},{...b,id:'seed:fieldwork-1:2:3:option-1'},{...b,id:'seed:fieldwork-1:2:4:option-1'}];
 assert.equal(deduplicateBadges(list).length,2);
});

test('death and nested death require badge text in the provider schema itself',()=>{
 const o=cell().context.occurrences!;o.gift=null;o.death=true;o.challenge={kind:'challenge',requirement:{kind:'defining',value:'Faith'},present:{kind:'none'},absent:{kind:'kill'}};
 const schema=outcomeNarrativeSchema(o) as any;
 for(const key of ['death','challenge:absent']){
  const leaf=schema.items.anyOf.find((s:any)=>s.properties.key.enum[0]===key);
  assert.equal(leaf.properties.badgeTitle.minLength,1);assert.equal(leaf.properties.badgeDescription.minLength,1);
  assert.equal(leaf.properties.awards.maxItems,0);
 }
 const nonAward=schema.items.anyOf.find((s:any)=>s.properties.key.enum[0]==='challenge:present');
 assert.equal(nonAward.properties.badgeTitle.minLength,undefined);
});
