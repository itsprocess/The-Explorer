import {test} from 'node:test';
import assert from 'node:assert/strict';
import baseline from '../lib/fieldwork-baseline.json';
import {recordTravel,beginLife} from '../lib/progress';
import {transferCharacter} from '../lib/teleport';
import {resolveOccurrences} from '../lib/occurrence-resolution';
import {occurrencesFor} from '../lib/occurrences';
import {narrativeOutcomes,validateOutcomeNarratives} from '../lib/occurrence-narrative';
import {settingInput} from '../lib/lean-generation';
import type {Character} from '../lib/rules';
import type {CellPackage} from '../lib/generation';
const player=():Character=>({id:'a',name:'Ari',x:0,y:0,alive:true,deaths:0,furthest:0,badges:[],consumed:[]});
const cell=():CellPackage=>({context:{seed:'fixture',version:'1',x:1,y:0,distance:1,occurrences:{relic:true,death:false,teleport:null,gift:null,challenge:null,option:null}},scene:{title:'Hollow'},occurrenceText:{choices:[],outcomes:[{key:'relic',text:'{character_name} uncovered a memory singing in the stone.',repeatText:'{character_name} heard the familiar memory again.',badgeTitle:'',badgeDescription:'',awards:[]}]}} as unknown as CellPackage);
test('travel accumulates route length and teleport displacement; rebirth excludes the return jump',()=>{
 const c=player();recordTravel(c,1,0);c.x=1;recordTravel(c,0,0);c.x=0;
 c.pendingTransport={token:'t',destination:{x:3,y:4},narrative:'Departed.',mechanism:'teleport'};
 const moved=transferCharacter(c,'t',{x:3,y:4,distance:5,title:'Hill'}).character;
 assert.equal(moved.distanceLife,7);assert.equal(moved.distanceTotal,7);
 const reborn=beginLife({...moved,alive:false,relicsLife:2,relicsTotal:3});
 assert.equal(reborn.distanceLife,0);assert.equal(reborn.distanceTotal,7);assert.equal(reborn.relicsLife,0);assert.equal(reborn.relicsTotal,3);
 assert.equal(c.distanceTotal,2);
});
test('relic discovery counts once per character across lives without awarding an item or badge',()=>{
 const p=cell(),first=resolveOccurrences(player(),p,'first');
 assert.equal(first.character.relicsLife,1);assert.equal(first.character.relicsTotal,1);
 assert.deepEqual(first.character.badges,[]);assert.deepEqual(first.character.traits,[]);
 assert.match(first.event.relic!.text,/Ari uncovered/);
 const repeated=resolveOccurrences(first.character,p,'again');
 assert.equal(repeated.character.relicsTotal,1);assert.equal(repeated.event.relic,undefined);assert.equal(repeated.event.kind,'revisit');
 const nextLife=resolveOccurrences(beginLife(first.character),p,'new-life');
 assert.equal(nextLife.character.relicsTotal,1);assert.equal(nextLife.character.relicsLife,0);
 assert.equal(resolveOccurrences({...player(),id:'b'},p,'other').character.relicsTotal,1);
});
test('relic remains recorded alongside a co-located encounter; certain death prevents discovery',()=>{
 const p=cell();p.context.occurrences!.teleport={x:10,y:10};
 const result=resolveOccurrences(player(),p,'both');
 assert.ok(result.character.pendingTransport);assert.ok(result.event.relic);
 p.context.occurrences!.death=true;
 assert.equal(resolveOccurrences(player(),p,'fatal').character.relicsTotal,undefined);
});
test('relic narratives require an explicit repeat and no award metadata',()=>{
 const p=cell(),o=p.context.occurrences!;
 assert.deepEqual(narrativeOutcomes(o),[{key:'relic',outcome:{kind:'relic'}}]);
 validateOutcomeNarratives(o,p.occurrenceText!.outcomes!);
 assert.throws(()=>validateOutcomeNarratives(o,[{...p.occurrenceText!.outcomes![0],repeatText:''}]),/repeat/);
});
test('relic sparks have half the expected teleport density after the nine-cell maximum filter',()=>{
 const cutoff=(id:string)=>(baseline.variables.find(v=>v.appName===id)!.layers[0] as {sparkCutoff:number}).sparkCutoff;
 const rate=(c:number)=>(1-c**9)/9;
 assert.ok(Math.abs(rate(cutoff('occurrences.relic'))/rate(cutoff('occurrences.teleport'))-.5)<1e-12);
});
test('a choice always includes one neutral refusal and relics are excluded from peek input',()=>{
 const o=occurrencesFor('fixture',1,2,{'occurrences.option':1},[]);
 assert.equal(o.option!.choices[0].kind,'none');
 const input=settingInput([{x:1,y:2,fieldwork:[{id:'occurrences.relic',category:'occurrences',present:true,value:1}]} as any],[]);
 assert.doesNotMatch(JSON.stringify(input),/relic/);
});
