import {findTrait,useTrait,traitLabel} from './traits';
import type {Character} from './rules';
import type {CellPackage} from './generation';
import {resolveOccurrences,requirementPresent} from './occurrence-resolution';
import type {Requirement} from './occurrences';
export const personalLocationKey=(p:CellPackage)=>p.context.seed+':'+p.context.version+':'+p.context.x+':'+p.context.y;
export function lockState(c:Character,p:CellPackage){
 const lock=p.context.occurrences?.lock;if(!lock||c.unlocked?.includes(personalLocationKey(p)))return null;
 const item=findTrait(c.traits??[],{kind:'possession',purpose:'key',rarity:lock.rarity});
 return {...lock,keyName:item?.name??null,canUnlock:!!item&&c.alive};
}
export function unlockPersonal(original:Character,p:CellPackage,visit:string,relicClaimed=false){
 const lock=lockState(original,p);if(!lock||!original.alive)throw Error('This lock is not available.');
 const item=findTrait(original.traits??[],{kind:'possession',purpose:'key',rarity:lock.rarity});if(!item)throw Error('A '+traitLabel(lock.rarity)+' or higher key is required.');
 const c=structuredClone(original),used=useTrait(c.traits??[],item);c.traits=used.traits;c.unlocked??=[];c.unlocked.push(personalLocationKey(p));
 const result=resolveOccurrences(c,p,visit,undefined,relicClaimed);result.event.stateChanges.unshift(...used.changes);result.event.text=c.name+' unlocked the '+(lock.kind==='tile'?'location':'discovery')+' with '+item.name+'. '+result.event.text;return result;
}
export function requirementHint(c:Character,r:Requirement){
 if(r.kind==='possession'){const item=findTrait(c.traits??[],r);return item?'Uses '+item.name:traitLabel(r.rarity??'common')+' '+traitLabel(r.purpose)+' required';}
 if(r.kind==='affiliation'){const name=c.standings?.find(s=>s.family===r.family&&s.value===r.value)?.names.join(' · ')||r.family;return 'Unlocked by standing with '+name;}
 return r.kind==='defining'?r.value:'Requirement';
}
export function availableOptions(c:Character,p:CellPackage){
 const o=p.context.occurrences?.option;if(!o||!c.pendingOption)return undefined;
 return p.occurrenceText?.choices.flatMap((choice,index)=>{
  if(index===2&&(!o.bonusRequirement||!requirementPresent(c,o.bonusRequirement)))return [];
  const r=index===2?o.bonusRequirement:o.choices[index]?.kind==='challenge'?(o.choices[index] as Extract<typeof o.choices[number],{kind:'challenge'}>).requirement:undefined;
  return [{index,label:choice.label,bonus:index===2,hint:r&&(index===2||r.kind==='possession'&&requirementPresent(c,r))?requirementHint(c,r):undefined}];
 });
}
