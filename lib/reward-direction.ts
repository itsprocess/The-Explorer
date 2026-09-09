import {random} from './noise';
import type {TraitSpec} from './traits';
// Presentation families, not generated item names or mechanical capabilities.
export const itemForms=['hand tool','key or lockpick','coin or trade token','potion or bottled preparation','piece of armor','small instrument','container or useful vessel','jewelry or keepsake','map or written aid','rope or fastening device','carved trinket','practical wearable'] as const;
export function rewardDirection(seed:string,x:number,y:number,key:string,index:number,spec:TraitSpec){
 return spec.kind==='possession'?{form:itemForms[Math.floor(random(seed,'reward-form:'+key+':'+index,x,y)*itemForms.length)],guidance:'Invent a recognizable usable object in this family. Affinity is a mechanical compatibility tag, not a demand for ethereal imagery. Material may describe one component. Explain its acquisition and distinctive construction; claim only supplied capabilities.'}:{guidance:'Name a specific condition, recognition or affiliation. Explain the incident that caused it and its felt or visible expression; claim only supplied capabilities.'};
}
export const leavesMark=(seed:string,x:number,y:number)=>random(seed,'shared-aftermath',x,y)<.25;
