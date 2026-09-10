import {affiliationFamilies,type StandingShift} from './affiliations';
import {random} from './noise';
import {itemTypes,rarityForRoll,type TraitSpec,type TraitCondition} from './traits';
export const definingTraits=['Strength','Kindness','Wit','Speed','Cunning','Charisma','Resolve','Faith'] as const;
export type DefiningTrait=typeof definingTraits[number];
export type Requirement=TraitCondition|{kind:'defining';value:DefiningTrait}|{kind:'affiliation';family:'faction'|'kingdom'|'religion';value:string;minimum?:number};
export type SimpleOutcome=({kind:'give';awards:TraitSpec[];badge:boolean}|{kind:'kill'}|{kind:'teleport';destination:{x:number;y:number}}|{kind:'badge'}|{kind:'none'}|{kind:'relic'})&{standing?:StandingShift};
export type Outcome=SimpleOutcome|({kind:'challenge';requirement:Requirement;present:SimpleOutcome;absent:SimpleOutcome}&{standing?:StandingShift});
export type Occurrences={lock?:{rarity:import('./traits').Rarity;kind:'tile'|'object'};relic?:boolean;death:boolean;teleport:{x:number;y:number}|null;gift:Extract<Outcome,{kind:'give'}>|null;challenge:Extract<Outcome,{kind:'challenge'}>|null;option:{policy:'visit'|'life'|'character';choices:Outcome[];bonusRequirement?:Requirement}|null};
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
 const spec=(key:string):TraitSpec=>random(seed,key+'protection',x,y)<.015?{kind:'status',family:'death_protection',value:'reprieve',lifetime:'single_use'}:{kind:'possession',purpose:pick(key+'type',itemTypes),affinity:'ordinary',material:'mixed',rarity:rarityForRoll(random(seed,key+'rarity',x,y)),survivesDeath:random(seed,key+'persistent',x,y)<.2,lifetime:'single_use'};
 const gift=(key:string,earned=false,rarity:import('./traits').Rarity='common'):Extract<Outcome,{kind:'give'}>=>({kind:'give',awards:[spec(key)],badge:earned&&random(seed,key+'badge',x,y)<({common:.04,rare:.15,legendary:.4}[rarity]),standing:shift(key)});
 const requirement=(key:string,bonus=false):Requirement=>{
  const f=social.length?pick(key+'social',social):undefined;
  if(f&&random(seed,key+'social-check',x,y)<.3)return {kind:'affiliation',family:f.id.split('.')[1] as StandingShift['family'],value:f.enumId!,minimum:10+Math.round(devotion*30)};
  if(!bonus&&random(seed,key+'trait-check',x,y)<.25)return {kind:'defining',value:pick(key+'trait',definingTraits)};
  return {kind:'possession',purpose:pick(key+'type',itemTypes),rarity:random(seed,key+'tier-check',x,y)<.5?'common':rarityForRoll(random(seed,key+'rarity',x,y))};
 };
 const success=(key:string,r:Requirement,allowPortal=true):SimpleOutcome=>{
  if(allowPortal&&optionPortalAllowed(random(seed,key+'portal',x,y)))return {kind:'teleport',destination:teleportDestination(seed,x,y,key),standing:shift(key)};
  const result=gift(key,true,r.kind==='possession'?r.rarity??'common':'common');
  if(result.standing)result.standing.delta=Math.abs(result.standing.delta);return result;
 };
 const challenge=(key:string):Extract<Outcome,{kind:'challenge'}>=>{const r=requirement(key),loss=shift(key+'failure');if(loss)loss.delta=-Math.abs(loss.delta);return {kind:'challenge',requirement:r,present:success(key+'yes',r,!key.startsWith('option-')),absent:{kind:random(seed,key+'fatal',x,y)<.18?'kill':'none',standing:loss}};};
 const option=v['occurrences.option']>0;
 const bonus=requirement('bonus',true);
 const lock=option&&random(seed,'personal-lock',x,y)<.2?{rarity:rarityForRoll(random(seed,'lock-tier',x,y)),kind:random(seed,'lock-kind',x,y)<.4?'tile' as const:'object' as const}:undefined;
 return {lock,relic:v['occurrences.relic']>0,death:!lock&&v['occurrences.certain_death']>0,teleport:v['occurrences.teleport']>0?teleportDestination(seed,x,y):null,gift:lock?gift('lock-reward',true,lock.rarity):v['occurrences.gift']>0?gift('gift'):null,challenge:!option&&v['occurrences.challenge']>0?challenge('challenge'):null,option:option&&!lock?{policy:'character',bonusRequirement:bonus,choices:[{kind:'none'},challenge('option-1'),success('option-2',bonus)]}:null};
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
