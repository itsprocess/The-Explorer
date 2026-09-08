import {MAX_VARIABLES} from './model';
import recipes from './water-fissure-recipes.json';
import {issues,parseProject,uid,type Project} from './model';

/** Append editable examples once without changing any authored variables. */
export function expandWaterFissures(project:Project):Project {
  if(project.waterFissureRevision===1)return project;
  const templates=parseProject(JSON.stringify(recipes)).variables;
  const altitude=project.variables.find(v=>/altitude|elevation/i.test(v.naturalName+' '+v.appName));
  const ocean=project.variables.find(v=>/^ocean$/i.test(v.naturalName));
  const voidVariable=project.variables.find(v=>/^void$/i.test(v.naturalName));
  if(!altitude||!ocean||!voidVariable)throw Error('Lake and chasm examples need Altitude, Ocean and Void.');
  const links=new Map([['natural.elevation',altitude.id],['natural.ocean',ocean.id],['biome.void',voidVariable.id]]);
  const added=templates.filter(t=>!project.variables.some(v=>v.appName===t.appName||v.naturalName===t.naturalName));
  if(project.variables.length+added.length>MAX_VARIABLES)throw Error('Lake and chasm examples exceed the 48 variable limit.');
  const result:Project={...project,waterFissureRevision:1,variables:[...project.variables,...added.map(t=>({...t,id:uid(),layers:t.layers.map(l=>({...l,id:uid(),reference:links.get(l.reference)??l.reference}))}))]};
  const errors=issues(result);if(errors.length)throw Error(errors.join(' '));
  return result;
}
