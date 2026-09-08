import {blocksExploration,evaluator,traversalIssues,type Project,type Variable} from './model';

export {blocksExploration} from './model';

/** Deterministic authority for exploration; language generation cannot override it. */
export function traversalEvaluator(project:Project) {
  const errors=traversalIssues(project);if(errors.length)throw Error(errors.join(' '));
  const evaluate=evaluator(project);
  const blockers=project.variables.filter(v=>v.category==='biome'&&v.traversal&&v.traversal.mode!=='passable');
  return (x:number,y:number)=>{
    const blockedBy=blockers.flatMap(v=>{
      const result=evaluate(v.id,x,y);
      return result.present!==false&&blocksExploration(v,result.value)?[{id:v.id,appName:v.appName,name:v.naturalName,value:result.value}]:[];
    });
    return {explorable:blockedBy.length===0,blockedBy};
  };
}

/** Structured natural-setting input for a later prompt composition pass. */
export function biomeContext(project:Project,x:number,y:number) {
  const evaluate=evaluator(project);
  return {x,y,traversal:traversalEvaluator(project)(x,y),biome:project.variables.filter(v=>v.category==='biome').map(v=>{
    const r=evaluate(v.id,x,y);
    return {appName:v.appName,name:v.naturalName,type:v.type,value:r.value,state:r.label,definition:v.description,description:r.description,
      ...(v.type==='gradient'?{low:v.low,high:v.high}:{}),present:r.present!==false,blocksExploration:r.present!==false&&blocksExploration(v,r.value)};
  })};
}

/** Initial editable defaults only; later edits and deletions are retained. */
export function configureTraversal(project:Project):Project {
  if(project.traversalRevision===1)return project;
  const blocking=new Set(['natural.ocean','biome.ocean','biome.void','biome.lakes_ponds','biome.chasms']);
  return {...project,traversalRevision:1,variables:project.variables.map(v=>{
    if(v.category!=='biome')return v;
    const chasm=v.appName==='biome.chasms';
    return {...v,...(chasm?{type:'boolean' as const,on:'An open chasm cuts through the ground.',off:'No open chasm is present.'}:{}),
      traversal:v.traversal??{mode:blocking.has(v.appName)?'positive' as const:'passable' as const}};
  })};
}
