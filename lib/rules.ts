import {fillCharacter} from './character-text';
import {resolveOccurrences} from './occurrence-resolution';
import {findTrait,grantTrait,useTrait,deathTraits,type Trait,type StateChange} from './traits';
import type {CellPackage} from './generation';
export type Badge={id:string;title:string;description:string;entityId?:string;kind:'death'|'honor'|'treasure'|'distance'};
export type Character={previousTile?:{x:number;y:number};standings?:import('./affiliations').Standing[];standingClaims?:string[];distanceLife?:number;distanceTotal?:number;relicsLife?:number;relicsTotal?:number;relicClaims?:string[];introSeen?:boolean;devState?:Character;devEvent?:{text:string;kind:string;newBadge:string|null};devOperation?:string;id:string;name:string;definingTrait?:import('./occurrences').DefiningTrait;optionConsumed?:string[];awardClaims?:string[];pendingOption?:{key:string;visit:string};affiliations?:Record<string,string[]>;x:number;y:number;alive:boolean;deaths:number;furthest:number;badges:Badge[];consumed:string[];traits?:Trait[];pendingTransport?:{token:string;destination:{x:number;y:number};narrative:string;mechanism:string}};

type EventRecord={text:string;newBadge:string|null;kind:string;stateChanges?:StateChange[]};
export const fill=(text:string,name:string)=>fillCharacter(text,name);
export function awardDistanceBadges(c:Character){for(const mark of [10,50,100,500,1000,10000])if(c.furthest>=mark&&!c.badges.some(b=>b.id==='distance:'+mark))c.badges.push({id:'distance:'+mark,title:mark+' from the origin',description:'Reached a distance of '+mark+' cells.',kind:'distance'});}
export function resolveArrival(original:Character,p:CellPackage,globalConsumed=false,visitId=''){
 if(p.context.occurrences&&!p.context.event)return resolveOccurrences(original,p,visitId,undefined,globalConsumed);
 const c:Character=structuredClone(original);delete c.pendingOption;c.traits??=[];c.x=p.context.x;c.y=p.context.y;c.furthest=Math.max(c.furthest,p.context.distance);
 let event:EventRecord={text:c.name+' arrived at '+p.scene.title+'.',newBadge:null,kind:'arrival'};
 const award=(b:Badge)=>{if(!c.badges.some(old=>old.id===b.id)){c.badges.push(b);event.newBadge=b.title;}};
 const region=p.regions.find(r=>r.kind==='kingdom'),faction=p.regions.find(r=>r.kind==='faction');
 const hostile=!p.context.safeApproach&&p.context.hostilityPolicy.enforcesForeignHonors&&c.badges.some(b=>b.kind==='honor'&&b.entityId?.startsWith('faction:')&&b.entityId!==faction?.id);
 if(hostile){c.alive=false;c.deaths++;event={text:fill(p.scene.hostility_narrative||'The kingdom’s sentries recognize a rival’s honor. Your journey ends here.',c.name),kind:'death',newBadge:null};award({id:'death:kos:'+region?.id,title:'Unwelcome in '+region?.name,description:'Executed for carrying a rival faction’s honor.',kind:'death'});}
 else if(!p.context.safeApproach&&p.context.event){
  const e=p.context.event,consumption=p.context.seed+':'+p.context.version+':cell:'+c.x+':'+c.y+':'+e.id;
  const consumed=e.mode==='once_ever'?globalConsumed:e.mode==='once_per_character'&&c.consumed.includes(consumption);
  if(consumed)event={text:fill(p.scene.consumed_narrative||'Only the memory of that event remains.',c.name),newBadge:null,kind:'revisit'};
  else{
   event={text:fill(p.scene.event_narrative,c.name),newBadge:null,kind:e.kind};
   const rule=p.context.stateRule,matched=rule?.kind==='check'?findTrait(c.traits,rule.condition):undefined;
   if(matched&&p.scene.conditional_narrative){
    event={text:fill(p.scene.conditional_narrative,c.name).replaceAll('{trait_name}',matched.name),newBadge:null,kind:rule?.kind==='check'&&rule.onMatch==='avoid_death'?'escape':'interaction'};
    const used=useTrait(c.traits,matched);c.traits=used.traits;event.stateChanges=used.changes;
   }
   if(e.kind==='death'&&event.kind!=='escape'){c.alive=false;c.deaths++;award({id:e.deathId!,title:p.scene.death_badge_title,description:p.scene.death_badge_description,kind:'death'});}
   if(e.kind==='honor')award({id:'honor:'+consumption,title:p.scene.honor_badge_title||'A stranger honored',description:'Recognized at '+p.scene.title+'.',kind:'honor',entityId:e.entityId??undefined});
   if(e.kind==='treasure')award({id:'treasure:'+consumption,title:'A fortune at '+p.scene.title,description:'Encountered an extraordinary windfall.',kind:'treasure'});
   if(rule?.kind==='grant'&&p.scene.trait_name&&p.scene.trait_description){
    const trait:Trait={...rule.spec,id:consumption+':trait',name:p.scene.trait_name,description:p.scene.trait_description,source:{world:p.context.seed+':'+p.context.version,x:c.x,y:c.y,title:p.scene.title,visitId}};
    const granted=grantTrait(c.traits,trait);c.traits=granted.traits;event.stateChanges=granted.changes;
    if(granted.changes.length)event.kind='acquisition';
    else event={kind:'revisit',text:c.name+' returned to '+p.scene.title+', still carrying '+trait.name+'.',newBadge:null,stateChanges:[]};
   }
   if(e.mode==='once_per_character')c.consumed.push(consumption);
  }
 }
 if(!c.alive){const lost=deathTraits(c.traits);c.traits=lost.traits;event.stateChanges=[...(event.stateChanges??[]),...lost.changes];}
 // Death and arrival records persist; distance milestones do not change player power.
 awardDistanceBadges(c);
 return {character:c,event};
}
