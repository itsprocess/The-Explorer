import type {Project} from './model';
/** More changes and isolated sparks, preserving strength, output cutoffs and civilization boost. */
export function enlivenWorld(p:Project):Project{return {...p,variables:p.variables.map(v=>({...v,layers:v.layers.map(l=>{
 if(!['variation','occurrences'].includes(v.category))return l;
 if(l.source==='sparks')return {...l,sparkCutoff:Math.max(0,1-2*(1-(l.sparkCutoff??.998)))};
 if(['perlin','fbm','ridged','cellular','white'].includes(l.source))return {...l,scaleX:l.scaleX/2,scaleY:l.scaleY/2};
 return l;
})}))};}
