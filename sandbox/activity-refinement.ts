import type {Project} from './model';
/** Twice the spatial change; twice the point/site density, retaining bounded patch diameters. */
export function refineActivity(p:Project):Project{return {...p,variables:p.variables.map(v=>({...v,layers:v.layers.map(l=>{
 if(l.source==='sparks')return {...l,sparkCutoff:Math.max(0,1-2*(1-(l.sparkCutoff??.998)))};
 if(l.source==='patches'){const spacing=l.patchSpacing??32,next=Math.max((l.patchMaxDiameter??8)+2,spacing/Math.SQRT2);return {...l,patchSpacing:next,patchChance:Math.min(1,(l.patchChance??.25)*2*(next/spacing)**2)};}
 if(['perlin','fbm','ridged','cellular','white'].includes(l.source))return {...l,scaleX:l.scaleX/2,scaleY:l.scaleY/2};
 return l;
})}))};}
