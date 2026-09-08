import recipes from './uniqueness-recipes.json';
import {issues,parseProject,uid,MAX_VARIABLES,type Project} from './model';
export function expandUniqueness(p:Project):Project {
  if(p.uniquenessRevision===3)return p;
  const templates=parseProject(JSON.stringify(recipes)).variables;
  const variables=p.variables.map(v=>{
    if(v.appName==='variation.certain_death')return {...v,appName:'occurrences.certain_death',category:'occurrences' as const,description:templates.find(t=>t.appName==='occurrences.certain_death')!.description};
    if((p.uniquenessRevision??0)>=2)return v;
    const template=templates.find(t=>t.appName===v.appName);
    if(!template||template.type!=='gradient')return v;
    if(['variation.opportunity','variation.danger'].includes(v.appName)&&v.type==='boolean'){
      return {...v,type:template.type,cutoff:template.cutoff,off:template.off,on:template.on,low:template.low,high:template.high,description:template.description,steps:[],layers:template.layers.map(l=>({...l,id:uid()}))};
    }
    return {...v,layers:v.layers.map(l=>l.channel===template.layers[0].channel?{...l,weight:.12,name:template.layers[0].name}:l)};
  });
  const added=templates.filter(t=>!variables.some(v=>v.appName===t.appName));
  if(p.variables.length+added.length>MAX_VARIABLES)throw Error('Uniqueness examples exceed the variable limit.');
  const q:Project={...p,uniquenessRevision:3,uniquenessEscalation:p.uniquenessEscalation??{enabled:true,reach:200,power:.5},variables:[...variables,...added.map(v=>({...v,id:uid(),layers:v.layers.map(l=>({...l,id:uid()}))}))]};
  const errors=issues(q);if(errors.length)throw Error(errors.join(' '));return q;
}
