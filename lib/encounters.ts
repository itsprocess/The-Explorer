import {random} from './noise';

// Broad situations, not scripts: the author supplies participants, form and history.
export const interactionCategories = ['an exchange without currency','an unexpected welcome','a misunderstanding resolved on arrival','a ceremony already in progress','a brief act of assistance','a contest whose result is witnessed','an unusual delivery','a public announcement','a migration crossing the route','a natural process briefly involving the visitor','a machine responding to a presence','a remnant of history put to ordinary use','a curious inspection','a moment of hospitality','a harmless disruption','an accidental discovery with no material reward','a local custom applied to the visitor','a fleeting performance','a mistaken identity','an object or creature completing a small journey','an improbable coincidence','a practical task completed in passing','a disagreement ending unexpectedly','an unusual farewell'] as const;

export function interactionFor(seed:string,x:number,y:number,v:Record<string,number>){
 const social=['encounters.traveler','encounters.patrol','encounters.caravan','civilization.camp','economy.market','civilization.settlement'].some(id=>v[id]>0);
 const active=['wildlife.herd','wildlife.nest','infrastructure.machine','culture.shrine','supernatural.haunting','culture.arena'].some(id=>v[id]>0);
 if(Math.abs(x)+Math.abs(y)<=2||random(seed,'interaction-occurrence',x,y)> (social?.38:active?.20:.045))return null;
 const category=interactionCategories[Math.floor(random(seed,'interaction-category',x,y)*interactionCategories.length)];
 const modeRoll=random(seed,'interaction-repeat',x,y);
 return {id:'interaction',kind:'interaction',mode:modeRoll<.08?'once_ever':modeRoll<.65?'once_per_character':'every_visit',cause:null,deathId:null,entityId:null,category,
  interpretation:random(seed,'interaction-interpretation',x,y)<.12?'unusual but grounded in the present features':'small, concrete and matter-of-fact',
  outcome:'A brief automatic experience recorded in history. No death, travel, badge, inventory, choice, payment, or lasting world mutation.'};
}
