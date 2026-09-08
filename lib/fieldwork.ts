import baseline from './fieldwork-baseline.json';
import {evaluator,parseProject,blocksExploration} from '../sandbox/model';
export const FIELDWORK_VERSION='fieldwork-1';
const project=parseProject(JSON.stringify(baseline));
const cache=new Map<string,ReturnType<typeof sample>>();
export function fieldworkAt(seed:string,x:number,y:number){const key=JSON.stringify([seed,x,y]);const saved=cache.get(key);if(saved)return saved;const result=sample(seed,x,y);if(cache.size>=512)cache.delete(cache.keys().next().value!);cache.set(key,result);return result;}
function sample(seed:string,x:number,y:number){
 const evaluate=evaluator({...project,seed});
 const fields=project.variables.map(v=>{const r=evaluate(v.id,x,y);return {id:v.appName,name:v.naturalName,category:v.category,type:v.type,value:r.value,present:r.present!==false,description:r.description,low:v.type==='boolean'?v.off:v.low,high:v.type==='boolean'?v.on:v.high,enumId:v.type==='enum'&&r.present!==false?v.steps.filter(s=>r.raw>=s.cutoff).at(-1)?.id:undefined,blocked:blocksExploration(v,r.value)};});
 return {fields,explorable:!fields.some(f=>f.present&&f.blocked),values:Object.fromEntries(fields.map(f=>[f.id,f.value]))};
}
export const fieldworkDefinitions=project.variables;
