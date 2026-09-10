import {test} from 'node:test';
import assert from 'node:assert/strict';
import baseline from '../lib/fieldwork-baseline.json';
import {rarityForRoll,findTrait,useTrait,deathTraits,validTrait} from '../lib/traits';
import {resolveOccurrences} from '../lib/occurrence-resolution';
import {availableOptions,lockState,unlockPersonal} from '../lib/personal-locks';
import {environmentPromptFields} from '../lib/prompt-environment';
const item=(id='key',purpose='key',rarity='rare',survivesDeath=false):any=>({id,kind:'possession',purpose,rarity,survivesDeath,affinity:'ordinary',material:'mixed',lifetime:'single_use',name:id,description:'A useful object.',source:{world:'s',x:0,y:0,title:'Home',visitId:'a'}});
const player=():any=>({id:'a',name:'A',x:2,y:3,alive:true,deaths:0,furthest:4,badges:[],consumed:[],traits:[],pendingOption:{key:'s:fieldwork-1:2:3',visit:'v'}});
const packet=():any=>({context:{seed:'s',version:'fieldwork-1',x:2,y:3,distance:4,regions:[],occurrences:{death:false,gift:null,teleport:null,challenge:null,option:{policy:'character',bonusRequirement:{kind:'possession',purpose:'tools',rarity:'rare'},choices:[{kind:'none'},{kind:'none'},{kind:'give',awards:[item('reward','valuables','common')],badge:false}]}}},regions:[],scene:{title:'Cage'},occurrenceText:{choices:[{label:'Leave'},{label:'Try the mechanism'},{label:'Use the tool'}],outcomes:[{key:'option-0',text:'{character_name} left.',awards:[]},{key:'option-1',text:'{character_name} examined the mechanism.',awards:[]},{key:'option-2',text:'{character_name} traded {requirement_name} for a gem.',awards:[{name:'Gem',description:'Received in trade.'}],repeatText:'{character_name} found the trade completed.'}]}});
test('rarity boundaries are 82/14/4, higher tiers work, and every modern item is consumed once',()=>{
 for(const [roll,expected] of [[0,'common'],[.819999,'common'],[.82,'rare'],[.959999,'rare'],[.96,'legendary'],[.999999,'legendary']] as const)assert.equal(rarityForRoll(roll),expected);
 const common=item('c','tools','common'),rare=item('r','tools','rare'),legend=item('l','tools','legendary',true);
 assert.equal(findTrait([legend,common,rare],{kind:'possession',purpose:'tools',rarity:'rare'})?.id,'r');
 assert.equal(findTrait([rare],{kind:'possession',purpose:'tools',rarity:'legendary'}),undefined);
 assert.ok(validTrait(legend));assert.equal(useTrait([legend],legend).traits.length,0);assert.equal(deathTraits([common,legend]).traits[0].id,'l');
});
test('two default options; eligible bonus is labeled, enforced, and consumed only on selection',()=>{
 const p=packet(),c=player();assert.equal(availableOptions(c,p)?.length,2);assert.throws(()=>resolveOccurrences(c,p,'v',2),/bonus option/);
 c.traits=[item('Rare wrench','tools')];const choices=availableOptions(c,p)!;assert.equal(choices.length,3);assert.equal(choices[2].bonus,true);assert.match(choices[2].hint!,/Uses Rare wrench/);assert.equal(c.traits.length,1);
 const r=resolveOccurrences(c,p,'v',2);assert.equal(r.character.traits!.some(t=>t.id==='Rare wrench'),false);assert.equal(r.character.traits!.length,1);assert.equal(r.event.stateChanges.filter(c=>c.type==='consumed').length,1);
 r.character.pendingOption=c.pendingOption;assert.throws(()=>resolveOccurrences(r.character,p,'again',2),/already resolved/);
});
test('locks are personal, tiered, permanent through death, and gate all encounters',()=>{
 const p=packet();p.context.occurrences.lock={kind:'tile',rarity:'rare'};
 const c=player();c.traits=[item('Common key','key','common')];assert.equal(lockState(c,p)?.canUnlock,false);assert.throws(()=>unlockPersonal(c,p,'v'),/key is required/);
 assert.equal(resolveOccurrences(c,p,'arrival').event.kind,'locked');
 c.traits=[item('Legendary key','key','legendary')];const r=unlockPersonal(c,p,'unlock');assert.equal(lockState(r.character,p),null);assert.equal(r.character.traits!.length,0);assert.ok(r.character.pendingOption);
 r.character.deaths++;assert.equal(lockState(r.character,p),null);assert.notEqual(lockState(player(),p),null);assert.throws(()=>unlockPersonal(r.character,p,'again'),/not available/);
});
test('successful automatic item checks consume once and cannot farm rewards; death awards no badge',()=>{
 const p=packet();p.context.occurrences.option=null;p.context.occurrences.challenge={kind:'challenge',requirement:{kind:'possession',purpose:'tools'},present:{kind:'give',awards:[item('reward','key','rare')],badge:false},absent:{kind:'kill'}};
 p.occurrenceText.outcomes=[{key:'challenge:present',text:'{character_name} spent {requirement_name} and earned a key.',awards:[{name:'Rare key',description:'Earned by repairing the gate.'}],repeatText:'Already repaired.'},{key:'challenge:absent',text:'{character_name} died beneath the gate.',rescueText:'{protection_name} saved {character_name}.',awards:[]}];
 const c=player();c.traits=[item('Tool','tools','common')];const first=resolveOccurrences(c,p,'one');first.character.traits!.push(item('Spare','tools','common'));const again=resolveOccurrences(first.character,p,'two');assert.ok(again.character.traits!.some(t=>t.id==='Spare'));assert.equal(again.event.stateChanges.length,0);
 const dead=resolveOccurrences(player(),p,'death');assert.equal(dead.character.alive,false);assert.equal(dead.event.newBadge,null);assert.equal(dead.character.badges.length,0);
});
test('three identities in each affiliation family and no weather in enclosed locations',()=>{
 for(const f of ['faction','kingdom','religion'])assert.equal(baseline.variables.find(v=>v.appName==='civilization.'+f)!.steps.length,3);
 for(const enclosure of ['civilization.inside','biome.underground']){const c:any={fieldwork:[{id:enclosure,present:true,value:1},{id:'biome.weather_severity',present:true,value:1},{id:'biome.groundcover',present:true,value:1}]};const fields=environmentPromptFields(c);assert.ok(!fields.some(f=>f.id==='biome.weather_severity'));assert.equal(fields.some(f=>f.id==='biome.groundcover'),enclosure==='biome.underground');}
});
