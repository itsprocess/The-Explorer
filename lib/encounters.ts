import {encounters as configEncounters} from '../explorer.config.json';
import {distanceMultiplier,distanceIntensity} from './intensity';
import {random} from './noise';

// Broad situations, not scripts: the author supplies participants, form and history.
export const interactionCategories = configEncounters.categories;

export function interactionFor(seed:string,x:number,y:number,v:Record<string,number>){
 const social=['encounters.traveler','encounters.patrol','encounters.caravan','civilization.camp','economy.market','civilization.settlement'].some(id=>v[id]>0);
 const active=['wildlife.herd','wildlife.nest','infrastructure.machine','culture.shrine','supernatural.haunting','culture.arena'].some(id=>v[id]>0);
 if(Math.abs(x)+Math.abs(y)<=2||random(seed,'interaction-occurrence',x,y)> Math.min(configEncounters.maximumChance,(social?configEncounters.socialChance:active?configEncounters.activeChance:configEncounters.quietChance)*distanceMultiplier(x,y,2)))return null;
 const category=interactionCategories[Math.floor(random(seed,'interaction-category',x,y)*interactionCategories.length)];
 const modeRoll=random(seed,'interaction-repeat',x,y);
 return {id:'interaction',kind:'interaction',mode:modeRoll<configEncounters.onceEverChance?'once_ever':modeRoll<configEncounters.oncePerCharacterCutoff?'once_per_character':'every_visit',cause:null,deathId:null,entityId:null,category,
  interpretation:random(seed,'interaction-interpretation',x,y)<Math.min(configEncounters.whimsyMaximum,configEncounters.whimsyChance+configEncounters.whimsyDistanceGain*distanceIntensity(x,y))?'surprising, colorful or gently whimsical; use local features, and let supplied strangeness justify the uncanny':'concrete and distinctive; give the incident a specific action and memorable consequence, even when harmless',
  outcome:'Describe one specific harmless thing the visitor experienced: who or what acted, what physically changed, and how the visitor responded. Resolve the incident in the sentence. No death, travel, badge, inventory, choice, payment, or lasting world mutation.'};
}
