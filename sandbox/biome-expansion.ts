import {MAX_VARIABLES} from './model';
import recipes from './biome-expansion.json';
import {issues,newLayer,parseProject,uid,type Project,type Variable} from './model';

/** Apply the requested editable recipe additions once; no special evaluator rules. */
export function expandBiomes(project:Project):Project {
  if(project.ecologyRevision===2)return project;
  if(project.ecologyRevision===1)return {...project,ecologyRevision:2,variables:project.variables.map(v=>
    v.appName==='biome.void'&&v.cutoff===.6&&v.layers.some(l=>l.channel==='void-districts-v1')?{...v,cutoff:.72}:v)};
  const altitude=project.variables.find(v=>/altitude|elevation/i.test(v.naturalName+' '+v.appName));
  const ocean=project.variables.find(v=>/^ocean$/i.test(v.naturalName)||/(^|\.)ocean$/.test(v.appName));
  const river=project.variables.find(v=>/^rivers?$/i.test(v.naturalName)||/(^|\.)rivers?$/.test(v.appName));
  if(!altitude||!ocean||!river)throw Error('The biome expansion needs Altitude, Ocean and River variables.');
  const templates=parseProject(JSON.stringify(recipes)).variables;
  const existing=(t:Variable)=>project.variables.find(v=>v.id===t.id||v.appName===t.appName||v.naturalName===t.naturalName);
  const added=templates.filter(t=>!existing(t));
  if(project.variables.length+added.length>MAX_VARIABLES)throw Error('There is not enough room for the three biome additions (48 variable limit).');
  const links=new Map([['natural.elevation',altitude.id],['natural.ocean',ocean.id],...templates.map(t=>[t.id,existing(t)?.id??t.id] as [string,string])]);
  const voidId=links.get('biome.void')!;
  const fade={...newLayer(),name:'Altitude fade · lowlands to uplands',source:'variable' as const,reference:altitude.id,
    referenceMode:'fade-below' as const,fadeLow:.55,fadeHigh:.85,blend:'multiply' as const,weight:1};
  const voidMask={...newLayer(),name:'Outside Void',source:'variable' as const,reference:voidId,blend:'multiply' as const,weight:1,invert:true};
  // Apply the fade before erosion: weaker highland channels are erased by the
  // existing subtractive detail, so both strength and coverage decline.
  const layers=river.layers.filter(l=>!(l.source==='variable'&&l.reference===altitude.id&&['at-most','fade-below'].includes(l.referenceMode??'')));
  const erosion=layers.findIndex(l=>l.enabled&&l.blend==='subtract');
  const mask=layers.findIndex(l=>l.enabled&&l.source==='variable'&&l.blend==='multiply');
  layers.splice(erosion>=0?erosion:mask>=0?mask:layers.length,0,fade);
  if(!layers.some(l=>l.source==='variable'&&l.reference===voidId))layers.push(voidMask);
  if(layers.length>24)throw Error('River needs two available layer slots for the biome expansion.');
  const revised={...river,layers,description:river.description+' River strength fades smoothly from altitude 0.55 to 0.85 before subtractive detail, thinning and erasing highland channels. River is also absent in Void.'};
  const result:Project={...project,ecologyRevision:2,variables:[...project.variables.map(v=>v.id===river.id?revised:v),...added.map(t=>({...t,
    layers:t.layers.map(l=>({...l,id:uid(),reference:links.get(l.reference)??l.reference})),steps:t.steps.map(s=>({...s,id:uid()})),
  }))]};
  const errors=issues(result);if(errors.length)throw Error(errors.join(' '));
  return result;
}
