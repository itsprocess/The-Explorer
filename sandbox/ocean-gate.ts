import {newLayer,type Project} from './model';

/** Recipe editing only; the evaluator has no ocean-specific rules. */
export function gateOcean(project:Project):Project {
  const altitude=project.variables.find(v=>/altitude|elevation/i.test(v.naturalName+' '+v.appName));
  const ocean=project.variables.find(v=>/^oceans?$/i.test(v.naturalName)||/(^|\.)ocean$/.test(v.appName));
  if(!altitude||!ocean)return project;
  if(ocean.layers.some(l=>l.enabled&&l.source==='variable'&&l.reference===altitude.id&&l.referenceMode==='at-most'&&l.blend==='multiply'&&l.weight===1))return project;
  const previous=ocean.layers.find(l=>l.source==='variable'&&l.reference===altitude.id);
  const mask={...newLayer(),...previous,name:'Below sea level · hard gate',enabled:true,source:'variable' as const,reference:altitude.id,
    referenceMode:'at-most' as const,referenceCutoff:.42,blend:'multiply' as const,weight:1,gain:1,bias:0,invert:false};
  return {...project,variables:project.variables.map(v=>v.id!==ocean.id?v:{...v,
    description:'Ocean follows its own noise-shaped footprint, but only where Altitude is at or below the editable sea-level gate. Low terrain outside the footprint remains ocean-free.',
    off:'No ocean here: outside its footprint or above sea level.',on:'Ocean occupies this low-altitude cell within its footprint.',
    layers:[...v.layers.filter(l=>!(l.source==='variable'&&l.reference===altitude.id)),mask],
  })};
}
