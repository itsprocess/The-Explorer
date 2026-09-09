import {test} from 'node:test';
import assert from 'node:assert/strict';
import {changeStanding,standingScore} from '../lib/affiliations';
import {requirementPresent,resolveOccurrences} from '../lib/occurrence-resolution';
import {beginLife} from '../lib/progress';
import {previewResult} from '../lib/dev-travel-state';
import {occurrencesFor} from '../lib/occurrences';
import baseline from '../lib/fieldwork-baseline.json';
import type {Character} from '../lib/rules';
const player=():Character=>({id:'p',name:'P',x:0,y:0,alive:true,deaths:0,furthest:0,badges:[],consumed:[]});
test('standing groups names, clamps both poles, persists through rebirth and gates challenges',()=>{
 const c=player();changeStanding(c,{family:'religion',value:'a',delta:30},['First']);changeStanding(c,{family:'religion',value:'a',delta:10},['Second']);assert.equal(c.standings!.length,1);assert.deepEqual(c.standings![0].names,['First','Second']);
 assert.equal(requirementPresent(c,{kind:'affiliation',family:'religion',value:'a',minimum:40}),true);assert.equal(requirementPresent(c,{kind:'affiliation',family:'religion',value:'a',minimum:41}),false);
 assert.equal(standingScore(beginLife(c),'religion','a'),40);changeStanding(c,{family:'religion',value:'a',delta:500});assert.equal(standingScore(c,'religion','a'),100);changeStanding(c,{family:'religion',value:'a',delta:-500});assert.equal(standingScore(c,'religion','a'),-100);
});
test('resolved encounter shifts once per life and dev previews preserve real standings',()=>{
 const c=player(),o=occurrencesFor('fixture',1,0,{},[]);o.gift={kind:'give',awards:[],badge:false,standing:{family:'faction',value:'a',delta:10}};
 const p:any={context:{x:1,y:0,seed:'fixture',version:'1',distance:1,occurrences:o,regions:[]},regions:[],scene:{title:'T'},occurrenceText:{choices:[],outcomes:[{key:'gift',text:'{character_name} helped.',repeatText:'Returned.',awards:[]}]}};
 const first=resolveOccurrences(c,p,'v');assert.equal(standingScore(first.character,'faction','a'),10);const again=resolveOccurrences(first.character,p,'v2');assert.equal(standingScore(again.character,'faction','a'),10);assert.deepEqual(previewResult(c,first.character,first.event).devState.standings,[]);
});
test('devoutness has independent coherent noise masked by civilization footprint',()=>{
 const v=baseline.variables.find(v=>v.appName==='civilization.devoutness')!,wealth=baseline.variables.find(v=>v.appName==='civilization.wealth')!;
 assert.equal(v.presenceReference,wealth.presenceReference);assert.equal(v.category,'civilization');assert.notEqual(v.layers[0].channel,wealth.layers[0].channel);
});

test('authorized full wipe removes account credentials and sessions as well as world state',async()=>{
 const {DatabaseSync}=await import('node:sqlite');const {readFileSync}=await import('node:fs');const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../runtime/schema.sql',import.meta.url),'utf8'));db.prepare('INSERT INTO characters(id,owner,value,revision,updated) VALUES(?,?,?,0,0)').run('p','p',JSON.stringify(player()));db.exec("INSERT INTO character_credentials VALUES('p','p','hash',0); INSERT INTO character_sessions VALUES('token','p',999);");db.exec(readFileSync(new URL('../drizzle/0025_reset_sanctuary.sql',import.meta.url),'utf8'));for(const table of ['characters','character_credentials','character_sessions','packages','visits'])assert.equal(db.prepare('SELECT COUNT(*) n FROM '+table).get()!.n,0);db.close();
});
