import {assertPlayerDeath} from './occurrence-narrative';
import {changeStanding,standingScore,affiliationFamilies} from './affiliations';
import {leavesMark} from './reward-direction';
import {deduplicateBadges} from './achievement-identity';
import {fillCharacter} from './character-text';
import {findTrait,grantTrait,deathTraits,useTrait,type StateChange} from './traits';
import {awardDistanceBadges,type Character,type Badge} from './rules';
import type {CellPackage} from './generation';
import {challengeFailure} from './occurrences';
import type {Outcome,Requirement} from './occurrences';
export function requirementPresent(c:Character,r:Requirement){return r.kind==='defining'?c.definingTrait===r.value:r.kind==='affiliation'?standingScore(c,r.family,r.value)>=(r.minimum??1):!!findTrait(c.traits??[],r);}
export function resolveOccurrences(original:Character,p:CellPackage,visit:string,selected?:number,relicClaimed=false){
 const c=structuredClone(original);c.badges=deduplicateBadges(c.badges);c.awardClaims??=[];c.traits??=[];c.optionConsumed??=[];c.x=p.context.x;c.y=p.context.y;c.furthest=Math.max(c.furthest,p.context.distance);
 for(const ref of p.context.regions??[]){if(ref.enumId&&affiliationFamilies.includes(ref.kind as any)){const name=p.regions?.find(r=>r.id===ref.id)?.name;changeStanding(c,{family:ref.kind as any,value:ref.enumId,delta:0},name?[name]:[]);}}
 const o=p.context.occurrences!,t=p.occurrenceText,key=p.context.seed+':'+p.context.version+':'+c.x+':'+c.y;
 if(o.lock&&!c.unlocked?.includes(key))return {character:c,event:{text:c.name+' reached a personally locked '+(o.lock.kind==='tile'?'location':'discovery')+'.',newBadge:null,kind:'locked',stateChanges:[] as StateChange[]}};
 const event:{text:string;newBadge:string|null;kind:string;choice?:string;relic?:{text:string};imprint?:string;stateChanges:StateChange[]}={text:c.name+' arrived at '+p.scene.title+'.',newBadge:null,kind:'arrival',stateChanges:[]};
 const say=(s?:string)=>{if(s)event.text=fillCharacter(s,c.name);};
 let requirementName='',narrative=t?.outcomes?.find(n=>n.key==='death');
 const badge=(id:string,kind:Badge['kind'])=>{if(!c.badges.some(b=>b.id===id)){const b={id,title:fillCharacter(narrative?.badgeTitle||t?.badgeTitle||p.scene.title,c.name),description:fillCharacter(narrative?.badgeDescription||t?.badgeDescription||event.text,c.name),kind};const unique=deduplicateBadges([...c.badges,b]);if(unique.length>c.badges.length){c.badges=unique;event.newBadge=b.title;}}};
 let rescued=false;
 const rescue=()=>{
  const protection=c.traits!.find(t=>t.kind==='status'&&t.family==='death_protection'&&t.value==='reprieve');if(!protection)return false;
  const departure=original.previousTile??{x:original.x,y:original.y};c.traits=c.traits!.filter(t=>!(t.kind==='status'&&t.family==='death_protection'));c.x=departure.x;c.y=departure.y;delete c.pendingOption;delete c.pendingTransport;
  rescued=true;event.kind='rescued';event.text=fillCharacter(narrative?.rescueText||'{character_name} was saved from death by {protection_name}, which was spent returning them to the place they came from.',c.name).replaceAll('{protection_name}',()=>protection.name).replaceAll('{requirement_name}',()=>requirementName);
  event.stateChanges.push({type:'consumed',trait:protection,reason:'Spent preventing death'});return true;
 };
 const kill=()=>{if(!c.alive)return;assertPlayerDeath(narrative?.text||t?.death);if(rescue())return;c.alive=false;c.deaths++;delete c.pendingOption;delete c.pendingTransport;const lost=deathTraits(c.traits!);c.traits=lost.traits;event.stateChanges.push(...lost.changes);event.kind='death';};
 const apply=(r:Outcome,label:string,yes?:string,no?:string)=>{
  if(!c.alive||rescued)return;
  if(r.kind==='challenge'){if(selected===undefined&&r.requirement.kind==='possession')throw Error('Item encounters require an explicit choice.');if(c.consumed.includes(key+':'+label)){event.kind='revisit';return;}const matched=requirementPresent(c,r.requirement);requirementName=r.requirement.kind==='defining'?r.requirement.value:r.requirement.kind==='affiliation'?(c.standings?.find(s=>s.family===(r.requirement as Extract<Requirement,{kind:'affiliation'}>).family&&s.value===(r.requirement as Extract<Requirement,{kind:'affiliation'}>).value)?.names.join(', ')||r.requirement.family):findTrait(c.traits!,r.requirement)?.name??'';if(matched)c.consumed.push(key+':'+label);if(matched&&r.requirement.kind==='possession'){const item=findTrait(c.traits!,r.requirement)!;const used=useTrait(c.traits!,item);c.traits=used.traits;event.stateChanges.push(...used.changes);}say(matched?yes:no);apply(matched?r.present:challengeFailure(r.absent),label+(matched?':present':':absent'));return;}
  narrative=t?.outcomes?.find(n=>n.key===label);say(narrative?.text?.replaceAll('{requirement_name}',()=>requirementName));
  if(r.standing){c.standingClaims??=[];const claim=key+':'+label;if(!c.standingClaims.includes(claim)){changeStanding(c,r.standing);c.standingClaims.push(claim);}}
  if(r.kind==='kill'){kill();return;}
  if(r.kind==='teleport'){c.pendingTransport={token:visit+':'+label,destination:r.destination,narrative:event.text,mechanism:'teleport'};event.kind='transport_pending';return;}
  if(r.kind==='badge'){const count=c.badges.length;badge(key+':'+label,'honor');event.kind=c.badges.length>count?'honor':'revisit';if(event.kind==='revisit')say(narrative?.repeatText);return;}
  if(r.kind==='relic'){c.relicClaims??=[];if(relicClaimed||c.relicClaims.includes(key)){event.kind='revisit';say(narrative?.repeatText);return;}c.relicClaims.push(key);c.relicsLife=(c.relicsLife??0)+1;c.relicsTotal=(c.relicsTotal??0)+1;event.kind='relic';event.relic={text:event.text};return;}
  if(r.kind==='none'){event.kind='interaction';return;}
  if(r.kind==='give'){const changes=event.stateChanges.length,badges=c.badges.length;
   r.awards.forEach((spec,i)=>{const awardKey=key+':'+label+':'+i,claim=awardKey;if(c.awardClaims!.includes(claim)||c.traits!.some(t=>t.id===claim||t.id.startsWith(awardKey+':')&&(spec.lifetime==='permanent'||t.id===awardKey+':'+c.deaths)))return;const description=narrative?.awards[i];const granted=grantTrait(c.traits!,{...spec,id:claim,name:fillCharacter(description?.name||t?.awardName||p.scene.title,c.name),description:fillCharacter(description?.description||t?.awardDescription||event.text,c.name),source:{world:p.context.seed,x:c.x,y:c.y,title:p.scene.title,visitId:visit}});c.awardClaims!.push(claim);c.traits=granted.traits;event.stateChanges.push(...granted.changes);});if(r.badge)badge(key+':'+label,'treasure');event.kind=event.stateChanges.length>changes||c.badges.length>badges?'acquisition':'revisit';if(event.kind==='revisit')say(narrative?.repeatText);
  }
 };
 if(selected!==undefined){
  if(!o.option||!c.pendingOption||c.pendingOption.key!==key||!Number.isInteger(selected)||selected<0||selected>=o.option.choices.length)throw Error('This option is not available.');
  if(c.optionConsumed.includes(key))throw Error('This encounter is already resolved.');
  if(selected===2){const r=o.option.bonusRequirement;if(!r||!requirementPresent(c,r))throw Error('The bonus option is not unlocked.');if(r.kind==='possession'){const item=findTrait(c.traits!,r)!;requirementName=item.name;const used=useTrait(c.traits!,item);c.traits=used.traits;event.stateChanges.push(...used.changes);}}
  const choice=t?.choices[selected];if(choice?.label)event.choice=fillCharacter(choice.label,c.name);say(choice?.result);apply(o.option.choices[selected],o.option.legacyAutomatic&&selected===1?'challenge':'option-'+selected,choice?.present,choice?.absent);if(o.option.legacyAutomatic&&selected===1&&c.alive&&!rescued&&o.gift&&c.consumed.includes(key+':challenge')){const prior=event.text;apply(o.gift,'gift');event.text=prior+' '+event.text;}if(c.alive&&selected!==0)c.optionConsumed.push(key);delete c.pendingOption;
 }else{
  delete c.pendingOption;
  if(o.death){say(narrative?.text||t?.death);kill();}

  else{
   if(o.relic)apply({kind:'relic'},'relic');
   const relicText=event.relic?.text;
   const passes=!o.challenge||requirementPresent(c,o.challenge.requirement);
   if(o.challenge)apply(o.challenge,'challenge',t?.challengePresent,t?.challengeAbsent);
   if(c.alive&&!rescued&&passes&&o.gift&&!o.option?.legacyAutomatic){const previous=o.challenge?event.text+' ':'';say(t?.gift);apply(o.gift,'gift');event.text=previous+event.text;}
   if(c.alive&&!rescued&&!c.pendingTransport&&o.teleport){say(t?.teleport);apply({kind:'teleport',destination:o.teleport},'teleport');}
   if(relicText&&event.text!==relicText)event.text=relicText+' '+event.text;
   if(c.alive&&!rescued&&!c.pendingTransport&&o.option&&(o.option.policy==='visit'||!c.optionConsumed.includes(key)))c.pendingOption={key,visit};
  }
 }
 if(selected!==undefined&&!rescued&&leavesMark(p.context.seed,c.x,c.y)&&narrative?.imprint&&event.kind!=='revisit'&&event.kind!=='arrival'&&event.kind!=='transport_pending')event.imprint=fillCharacter(narrative.imprint.replaceAll('{requirement_name}',()=>requirementName),c.name);
 awardDistanceBadges(c);return {character:c,event};
}
