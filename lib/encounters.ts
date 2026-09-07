import {random} from './noise';

// Broad situations, not scripts: the author supplies participants, form and history.
export const interactionCategories = ['reciprocity', 'recognition', 'miscommunication', 'ritual', 'mutual aid', 'rivalry', 'delivery', 'public information', 'migration', 'ecological interdependence', 'automated response', 'reuse', 'investigation', 'hospitality', 'disruption', 'serendipity', 'social obligation', 'performance', 'identity', 'navigation', 'coincidence', 'labor', 'negotiation', 'parting', 'refuge', 'maintenance', 'communication across distance', 'learned behavior', 'wayfinding', 'seasonality', 'containment', 'rumor', 'access and permission', 'coordination', 'improvisation', 'sustenance', 'play', 'rest', 'restitution', 'oral tradition', 'adaptation', 'craftsmanship', 'disputed knowledge', 'remembrance', 'preparation', 'classification', 'impermanence', 'cultural change', 'territorial coexistence', 'system failure', 'ingenuity', 'nonverbal expression', 'shared responsibility', 'scarcity', 'teaching', 'self-organization'] as const;

export function interactionFor(seed:string,x:number,y:number,v:Record<string,number>){
 const social=['encounters.traveler','encounters.patrol','encounters.caravan','civilization.camp','economy.market','civilization.settlement'].some(id=>v[id]>0);
 const active=['wildlife.herd','wildlife.nest','infrastructure.machine','culture.shrine','supernatural.haunting','culture.arena'].some(id=>v[id]>0);
 if(Math.abs(x)+Math.abs(y)<=2||random(seed,'interaction-occurrence',x,y)> (social?.38:active?.30:.25))return null;
 const category=interactionCategories[Math.floor(random(seed,'interaction-category',x,y)*interactionCategories.length)];
 const modeRoll=random(seed,'interaction-repeat',x,y);
 return {id:'interaction',kind:'interaction',mode:modeRoll<.08?'once_ever':modeRoll<.65?'once_per_character':'every_visit',cause:null,deathId:null,entityId:null,category,
  interpretation:random(seed,'interaction-interpretation',x,y)<.12?'unusual but grounded in the present features':'small, concrete and matter-of-fact',
  outcome:'A brief automatic experience recorded in history. No death, travel, badge, inventory, choice, payment, or lasting world mutation.'};
}
