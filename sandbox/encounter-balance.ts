import type {Project} from './model';
export function tuneEncounterBalance(p:Project):Project{return {...p,variables:p.variables.map(v=>({...v,layers:v.layers.map(l=>{
 if(['civilization.density','civilization.footprint'].includes(v.appName)&&l.source==='patches')return {...l,patchChance:(l.patchChance??.25)/2};
 const multiplier=v.appName==='occurrences.option'||v.appName==='occurrences.challenge'?3:v.appName==='occurrences.certain_death'?2:1;
 return l.source==='sparks'&&multiplier>1?{...l,sparkCutoff:Math.max(0,1-multiplier*(1-(l.sparkCutoff??.998)))}:l;
})}))};}
