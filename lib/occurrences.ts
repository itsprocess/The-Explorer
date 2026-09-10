import {affiliationFamilies,type StandingShift} from './affiliations';
import {random} from './noise';
import {statusFamilies,possessionDimensions,type TraitSpec,type TraitCondition} from './traits';
export const definingTraits=['Strength','Kindness','Wit','Speed','Cunning','Charisma','Resolve','Faith'] as const;
export type DefiningTrait=typeof definingTraits[number];
export type Requirement=TraitCondition|{kind:'defining';value:DefiningTrait}|{kind:'affiliation';family:'faction'|'kingdom'|'religion';value:string;minimum?:number};
export type Outcome=({kind:'give';awards:TraitSpec[];badge:boolean}|{kind:'challenge';requirement:Requirement;present:SimpleOutcome;absent:SimpleOutcome}|SimpleOutcome)&{standing?:StandingShift};
export type SimpleOutcome=({kind:'kill'}|{kind:'teleport';destination:{x:number;y:number}}|{kind:'badge'}|{kind:'none'}|{kind:'relic'})&{standing?:StandingShift};
export type Occurrences={relic?:boolean;death:boolean;teleport:{x:number;y:number}|null;gift:Extract<Outcome,{kind:'give'}>|null;challenge:Extract<Outcome,{kind:'challenge'}>|null;option:{policy:'visit'|'life';choices:Outcome[]}|null};
export const standingResultChance=(devotion:number)=>Math.min(1,2*(.15+.7*Math.max(0,Math.min(1,devotion))));
export const optionPortalAllowed=(roll:number)=>roll<1/20;
export const teleportRange=(x:number,y:number)=>Math.max(50,5*Math.hypot(x,y));
export function teleportDestination(seed:string,x:number,y:number,channel='teleport'){
 const radius=teleportRange(x,y),angle=random(seed,channel+':angle',x,y)*Math.PI*2,reach=Math.sqrt(random(seed,channel+':radius',x,y))*radius;
 return {x:Math.round(x+Math.cos(angle)*reach),y:Math.round(y+Math.sin(angle)*reach)};
}
export function occurrencesFor(seed:string,x:number,y:number,v:Record<string,number>,fields:{id:string;enumId?:string}[]):Occurrences{
 const pick=<T>(key:string,a:readonly T[])=>a[Math.floor(random(seed,key,x,y)*a.length)];
 const social=fields.filter(f=>f.enumId&&affiliationFamilies.includes(f.id.split('.')[1] as any));
 const devotion=Math.max(0,Math.min(1,v['civilization.devoutness']??0));
 const shift=(key:string):StandingShift|undefined=>{if(!social.length||random(seed,key+'standing-chance',x,y)>standingResultChance(devotion))return;const f=pick(key+'standing-target',social);return {family:f.id.split('.')[1] as StandingShift['family'],value:f.enumId!,delta:pick(key+'standing-sign',[-1,1])*(5+Math.round(15*devotion))};};
 const statusSpec=(key:string):TraitSpec=>{const family=pick(key+'family',Object.keys(statusFamilies).filter(f=>!affiliationFamilies.includes(f as any)) as (keyof typeof statusFamilies)[]);return {kind:'status',family,value:pick(key+'v',statusFamilies[family]),lifetime:family==='death_protection'?'single_use':pick(key+'l',['until_death','single_use','permanent'] as const)};};
 const spec=(key:string):TraitSpec=>random(seed,key,x,y)<.5?{kind:'possession',purpose:pick(key+'p',possessionDimensions.purpose),affinity:pick(key+'a',possessionDimensions.affinity),material:pick(key+'m',possessionDimensions.material),lifetime:pick(key+'l',['until_death','single_use','permanent'] as const)}:statusSpec(key);
 const gift=(key:string):Extract<Outcome,{kind:'give'}>=>({kind:'give',awards:random(seed,key+'double',x,y)<.3?[spec(key),spec(key+'second')]:[spec(key)],badge:random(seed,key+'badge',x,y)<.3,standing:shift(key)});
 const simple=(key:string,allowTeleport=true):SimpleOutcome=>{const kind=allowTeleport&&random(seed,key+'portal-chance',x,y)<.05?'teleport':pick(key,['none','badge','kill'] as const);return kind==='teleport'?{kind,destination:teleportDestination(seed,x,y,key)}:{kind};};
 const challenge=(key:string,allowTeleport=true):Extract<Outcome,{kind:'challenge'}>=>{
  const rolled=spec(key),t=rolled.kind==='status'&&rolled.family==='death_protection'?{...rolled,family:'blessing' as const,value:'ward'}:rolled,mode=social.length&&random(seed,key+'devotion-check',x,y)<.15+.7*devotion?'affiliation':pick(key+'require',['trait','state'] as const);
  const requirement:Requirement=mode==='trait'?{kind:'defining',value:pick(key+'trait',definingTraits)}:mode==='affiliation'&&social.length?{kind:'affiliation',family:pick(key+'social',social).id.split('.')[1] as 'faction'|'kingdom'|'religion',value:pick(key+'social',social).enumId!,minimum:10+Math.round(devotion*40)}:t.kind==='status'?{kind:'status',family:t.family,value:t.value}:{kind:'possession',purpose:t.purpose,affinity:t.affinity};
  return {kind:'challenge',requirement,present:{...simple(key+'yes',allowTeleport),standing:shift(key+'yes')},absent:challengeFailure({...simple(key+'no',allowTeleport),standing:shift(key+'no')})};
 };
 const outcome=(key:string):Outcome=>{const kind=pick(key,['give','challenge','badge','kill'] as const);return kind==='give'?gift(key):kind==='challenge'?challenge(key,false):{kind,standing:shift(key)};};
 return {relic:v['occurrences.relic']>0,death:v['occurrences.certain_death']>0,teleport:v['occurrences.teleport']>0?teleportDestination(seed,x,y):null,gift:v['occurrences.gift']>0?gift('gift'):null,challenge:v['occurrences.challenge']>0?challenge('challenge'):null,option:v['occurrences.option']>0?{policy:pick('option-policy',['visit','life'] as const),choices:limitLethalChoices(Array.from({length:pick('option-count',[2,3])},(_,i)=>i===0?{kind:'none'}:i===1&&optionPortalAllowed(random(seed,'option-portal-chance',x,y))?{kind:'teleport',destination:teleportDestination(seed,x,y,'option-1'),standing:shift('option-1')}:outcome('option-'+i)))}:null};
}

// Teleport can be fatal on arrival, so it counts toward the same one-choice limit.
export function canCauseDeath(outcome:Outcome):boolean{return outcome.kind==='kill'||outcome.kind==='teleport'||outcome.kind==='challenge'&&(canCauseDeath(outcome.present)||canCauseDeath(outcome.absent));}
export function limitLethalChoices(choices:Outcome[]):Outcome[]{let retained=false;return choices.map(choice=>{if(!canCauseDeath(choice))return choice;if(!retained){retained=true;return choice;}return {kind:'badge'};});}

export function challengeFailure(outcome:SimpleOutcome):SimpleOutcome{return outcome.kind==='badge'?{...outcome,kind:'none'}:outcome;}

/** Refresh destinations only; preserve cached encounter assignments and their authored prose. */
export function retargetTeleports(o:Occurrences,seed:string,x:number,y:number):Occurrences{
 const next=structuredClone(o);
 const update=(outcome:Outcome,channel:string)=>{
  if(outcome.kind==='teleport')outcome.destination=teleportDestination(seed,x,y,channel);
  if(outcome.kind==='challenge'){update(outcome.present,channel+'yes');update(outcome.absent,channel+'no');}
 };
 if(next.teleport)next.teleport=teleportDestination(seed,x,y);
 if(next.challenge)update(next.challenge,'challenge');
 next.option?.choices.forEach((choice,i)=>update(choice,'option-'+i));
 return next;
}
