import {fieldworkAt,fieldworkDefinitions} from './fieldwork';
export type Rating={id:string;name:string;kind:'baseline'|'feature';value:number;label:string;applicable:boolean;low:string;high:string;recipe:string};
export const recipes=fieldworkDefinitions.map(v=>({id:v.appName,name:v.naturalName,kind:(v.type==='gradient'?'baseline':'feature') as Rating['kind'],low:v.low,high:v.high,recipe:v.layers.map(l=>l.name).join(' → ')}));
export function deriveRatings(s:string,x:number,y:number):Rating[]{return fieldworkAt(s,x,y).fields.map(f=>({id:f.id,name:f.name,kind:f.type==='gradient'?'baseline':'feature',value:f.value,label:f.description,applicable:f.present,low:f.low,high:f.high,recipe:recipes.find(r=>r.id===f.id)!.recipe}));}
export function oceanStrength(s:string,x:number,y:number){return fieldworkAt(s,x,y).values['natural.ocean'];}
