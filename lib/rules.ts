import type {CellPackage} from './generation';
export type Badge={id:string;title:string;description:string;entityId?:string;kind:'death'|'honor'|'treasure'|'distance'};
export type Character={id:string;name:string;x:number;y:number;alive:boolean;deaths:number;furthest:number;badges:Badge[];consumed:string[];pendingTransport?:{token:string;destination:{x:number;y:number};narrative:string;mechanism:string}};

type EventRecord={text:string;newBadge:string|null;kind:string};
export const fill=(text:string,name:string)=>text.replaceAll('{character_name}',name);
export function awardDistanceBadges(c:Character){for(const mark of [10,50,100,500,1000,10000])if(c.furthest>=mark&&!c.badges.some(b=>b.id==='distance:'+mark))c.badges.push({id:'distance:'+mark,title:mark+' from the origin',description:'Reached a distance of '+mark+' cells.',kind:'distance'});}
export function resolveArrival(original:Character,p:CellPackage,globalConsumed=false){
 const c:Character=structuredClone(original);c.x=p.context.x;c.y=p.context.y;c.furthest=Math.max(c.furthest,p.context.distance);
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
   if(e.kind==='death'){c.alive=false;c.deaths++;award({id:e.deathId!,title:p.scene.death_badge_title,description:p.scene.death_badge_description,kind:'death'});}
   if(e.kind==='honor')award({id:'honor:'+consumption,title:p.scene.honor_badge_title||'A stranger honored',description:'Recognized at '+p.scene.title+'.',kind:'honor',entityId:e.entityId??undefined});
   if(e.kind==='treasure')award({id:'treasure:'+consumption,title:'A fortune at '+p.scene.title,description:'Encountered an extraordinary windfall.',kind:'treasure'});
   if(e.mode==='once_per_character')c.consumed.push(consumption);
  }
 }
 // Death and arrival records persist; distance milestones do not change player power.
 awardDistanceBadges(c);
 return {character:c,event};
}
