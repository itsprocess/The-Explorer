import {fillCharacter} from './character-text';
import {findTrait,grantTrait,deathTraits,type StateChange} from './traits';
import {awardDistanceBadges,type Character,type Badge} from './rules';
import type {CellPackage} from './generation';
import type {Outcome,Requirement} from './occurrences';
export function requirementPresent(c:Character,r:Requirement){return r.kind==='defining'?c.definingTrait===r.value:r.kind==='affiliation'?!!findTrait(c.traits??[],{kind:'status',family:r.family,value:r.value}):!!findTrait(c.traits??[],r);}
export function resolveOccurrences(original:Character,p:CellPackage,visit:string,selected?:number){
 const c=structuredClone(original);c.traits??=[];c.optionConsumed??=[];c.x=p.context.x;c.y=p.context.y;c.furthest=Math.max(c.furthest,p.context.distance);
 const o=p.context.occurrences!,t=p.occurrenceText,key=p.context.seed+':'+p.context.version+':'+c.x+':'+c.y;
 const event:{text:string;newBadge:string|null;kind:string;stateChanges:StateChange[]}={text:c.name+' arrived at '+p.scene.title+'.',newBadge:null,kind:'arrival',stateChanges:[]};
 const say=(s?:string)=>{if(s)event.text=fillCharacter(s,c.name);};
 const badge=(id:string,kind:Badge['kind'])=>{if(!c.badges.some(b=>b.id===id)){const b={id,title:fillCharacter(t?.badgeTitle||'A story to carry',c.name),description:fillCharacter(t?.badgeDescription||'Remembered at '+p.scene.title,c.name),kind};c.badges.push(b);event.newBadge=b.title;}};
 const kill=()=>{if(!c.alive)return;c.alive=false;c.deaths++;c.optionConsumed=[];delete c.pendingOption;delete c.pendingTransport;const lost=deathTraits(c.traits!);c.traits=lost.traits;event.stateChanges.push(...lost.changes);event.kind='death';badge('death:'+key,'death');};
 const apply=(r:Outcome,label:string,yes?:string,no?:string)=>{
  if(!c.alive)return;
  if(r.kind==='challenge'){const matched=requirementPresent(c,r.requirement);say(matched?yes:no);apply(matched?r.present:r.absent,label);return;}
  if(r.kind==='kill'){kill();return;}
  if(r.kind==='teleport'){c.pendingTransport={token:visit+':'+label,destination:r.destination,narrative:event.text,mechanism:'teleport'};event.kind='transport_pending';return;}
  if(r.kind==='badge'){badge(key+':'+label,'honor');event.kind='honor';return;}
  if(r.kind==='give'){
   r.awards.forEach((spec,i)=>{const granted=grantTrait(c.traits!,{...spec,id:key+':'+label+':'+i+':'+c.deaths,name:fillCharacter(t?.awardName||'A gift',c.name),description:fillCharacter(t?.awardDescription||'Received at '+p.scene.title,c.name),source:{world:p.context.seed,x:c.x,y:c.y,title:p.scene.title,visitId:visit}});c.traits=granted.traits;event.stateChanges.push(...granted.changes);});if(r.badge)badge(key+':'+label,'treasure');event.kind='acquisition';
  }
 };
 if(selected!==undefined){
  if(!o.option||!c.pendingOption||c.pendingOption.key!==key||!Number.isInteger(selected)||selected<0||selected>=o.option.choices.length)throw Error('This option is not available.');
  const choice=t?.choices[selected];say(choice?.result);apply(o.option.choices[selected],'option-'+selected,choice?.present,choice?.absent);if(c.alive&&o.option.policy==='life')c.optionConsumed.push(key);delete c.pendingOption;
 }else{
  delete c.pendingOption;
  if(o.death){say(t?.death);kill();}
  else{
   const passes=!o.challenge||requirementPresent(c,o.challenge.requirement);
   if(o.challenge)apply(o.challenge,'challenge',t?.challengePresent,t?.challengeAbsent);
   if(c.alive&&passes&&o.gift){const previous=o.challenge?event.text+' ':'';say(t?.gift);event.text=previous+event.text;apply(o.gift,'gift');}
   if(c.alive&&!c.pendingTransport&&o.teleport){say(t?.teleport);apply({kind:'teleport',destination:o.teleport},'teleport');}
   if(c.alive&&!c.pendingTransport&&o.option&&(o.option.policy==='visit'||!c.optionConsumed.includes(key)))c.pendingOption={key,visit};
  }
 }
 awardDistanceBadges(c);return {character:c,event};
}
