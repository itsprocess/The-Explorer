import {type Project} from './model';
export function organicCivilization(p:Project):Project {
  if(p.organicCivilizationRevision===1)return p;
  return {...p,organicCivilizationRevision:1,variables:p.variables.map(v=>
    ['civilization.density','civilization.footprint'].includes(v.appName)?{...v,layers:v.layers.map(l=>l.source==='patches'?{...l,patchRoughness:.85}:l)}:v)};
}
