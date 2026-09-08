import palette from './language-palette.json';
import type {Project} from './model';

/** Change prose only; retain authored signals, identities and interpretation thresholds. */
export function enrichLanguage(project:Project):Project {
  const language:Record<string,{description:string;low?:string;high?:string}>=palette;
  return {...project,variables:project.variables.map(v=>{
    const wording=language[v.appName];if(!wording)return v;
    const low=wording.low??v.low,high=wording.high??v.high;
    return {...v,description:wording.description,low,high,
      ...(v.type==='boolean'?{off:low,on:high}:{}),
      steps:v.steps.map((step,i)=>({...step,description:v.type==='enum'
        ?`Abstract ${v.naturalName} identity slot ${i+1}. Create a richly specific local identity through names, symbols, practices and history, grounded in the other fields. This slot implies no fixed temperament, morality or rank; preserve its mechanical identity.`
        :i===0?low:i===v.steps.length-1?high:`A balanced intermediate expression of ${v.naturalName.toLowerCase()}, between its two poles; preserve the local context.`}))};
  })};
}
