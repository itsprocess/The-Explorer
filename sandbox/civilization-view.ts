import {evaluator,type Project} from './model';
export function civilizationEvaluator(p:Project,includeFields=true){
  const evaluate=evaluator(p),variables=p.variables.filter(v=>v.category==='civilization'&&(includeFields||['civilization.density','civilization.infrastructure','civilization.footprint'].includes(v.appName)));
  return (x:number,y:number)=>{
    const fields=variables.map(v=>{const r=evaluate(v.id,x,y);return {id:v.id,name:v.naturalName,appName:v.appName,value:r.value,present:r.present!==false,label:r.label,description:r.description};});
    const density=fields.find(v=>v.appName==='civilization.density')?.value??0;
    const infrastructure=fields.find(v=>v.appName==='civilization.infrastructure')?.value??0;
    const footprint=fields.find(v=>v.appName==='civilization.footprint')?.value??Math.max(density,infrastructure);
    const base=density>0&&infrastructure>0?[240,224,185]:density>0?[232,160,69]:[100,158,223];
    const rgb=footprint===0?[13,25,36]:base.map(c=>Math.round(c*(.35+.65*Math.sqrt(footprint))));
    return {density,infrastructure,footprint,rgb,fields};
  };
}
