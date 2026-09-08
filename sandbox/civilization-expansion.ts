import {MAX_VARIABLES} from './model';
import recipes from './civilization-recipes.json';
import {issues,parseProject,uid,type Project} from './model';

export function expandCivilization(project:Project):Project {
  if(project.civilizationRevision===1)return project;
  const templates=parseProject(JSON.stringify(recipes)).variables;
  const links=new Map(project.variables.map(v=>[v.appName,v.id]));
  const altitude=project.variables.find(v=>/altitude|elevation/i.test(v.naturalName+' '+v.appName));
  const ocean=project.variables.find(v=>v.naturalName==='Ocean');
  if(altitude)links.set('natural.elevation',altitude.id);
  if(ocean)links.set('natural.ocean',ocean.id);
  const added=templates.filter(t=>!project.variables.some(v=>v.appName===t.appName));
  for(const t of added)links.set(t.id,uid());
  if(project.variables.length+added.length>MAX_VARIABLES)throw Error('Civilization examples exceed the 48 variable limit.');
  const result:Project={...project,civilizationRevision:1,variables:[...project.variables,...added.map(t=>({...t,id:links.get(t.id)!,
    layers:t.layers.map(l=>({...l,id:uid(),reference:links.get(l.reference)??l.reference})),steps:t.steps.map(s=>({...s,id:uid()}))}))]};
  const errors=issues(result);if(errors.length)throw Error(errors.join(' '));
  return result;
}
