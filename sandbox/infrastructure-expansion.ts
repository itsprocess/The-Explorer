import {MAX_VARIABLES} from './model';
import recipe from './infrastructure-recipe.json';
import {issues,parseProject,uid,type Project} from './model';

export function expandInfrastructure(project:Project):Project {
  if(project.infrastructureRevision===1)return project;
  const template=parseProject(JSON.stringify(recipe)).variables[0];
  const exists=project.variables.some(v=>v.appName===template.appName);
  if(!exists&&project.variables.length>=MAX_VARIABLES)throw Error('Infrastructure needs an available variable slot.');
  // Only refine the original proposal wording; retain any authored descriptions.
  const variables=project.variables.map(v=>v.appName==='civilization.advancement'?{...v,
    description:v.description==='Relative technological and infrastructural capability. Independent of age, wealth, aggression and species composition; the narrative supplies its local expression.'?'Relative technological knowledge and capability, independent of the amount of infrastructure physically present. Independent of age, wealth, aggression and species composition; the narrative supplies its local expression.':v.description,
    low:v.low==='Simple tools and limited infrastructure'?'Simple tools and limited technological capability':v.low,
    high:v.high==='Highly developed technology and infrastructure'?'Highly developed technology and technical capability':v.high,
  }:v);
  const result:Project={...project,infrastructureRevision:1,variables:exists?variables:[...variables,{...template,id:uid(),layers:template.layers.map(l=>({...l,id:uid()}))}]};
  const errors=issues(result);if(errors.length)throw Error(errors.join(' '));
  return result;
}
