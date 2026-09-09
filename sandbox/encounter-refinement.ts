import type {Project} from './model';
/** Independent interleaved site fields double candidates without widening existing sites. */
export function enrichEncounters(p:Project):Project{return {...p,occurrenceCivilizationBoost:3,variables:p.variables.map(v=>({...v,layers:v.layers.flatMap(l=>{
 if(v.category==='civilization'&&l.source==='patches')return [l,{...l,id:l.id+'-extra-sites',name:l.name+' · additional sites',channel:l.channel+'-extra-sites',offsetX:l.offsetX+(l.patchSpacing??32)*.5,offsetY:l.offsetY+(l.patchSpacing??32)*.37,blend:'max' as const}];
 if(v.category==='occurrences'&&l.source==='sparks')return [{...l,sparkCutoff:Math.max(0,1-2*(1-(l.sparkCutoff??.998)))}];
 return [l];
})}))};}
export function civilizationEventDrive(values:number[],maximum=3){return 1+(maximum-1)*Math.max(0,Math.min(1,Math.max(0,...values)));}
