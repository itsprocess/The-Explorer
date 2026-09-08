import {MAX_VARIABLES} from './model';
import {newLayer,newVariable,uid,issues,type Project,type Layer} from './model';

/** Proposed recipes, applied once. Presence gates retain independent trait strength. */
export function shapeCivilization(p:Project):Project {
  if(p.civilizationShapeRevision===1)return p;
  const density=p.variables.find(v=>v.appName==='civilization.density'),infrastructure=p.variables.find(v=>v.appName==='civilization.infrastructure');
  if(!density||!infrastructure)throw Error('Civilization shapes need Density and Infrastructure.');
  const l=(name:string,channel:string,settings:Partial<Layer>={}):Layer=>({...newLayer(),name,channel,...settings});
  const patches=(name:string,channel:string,min:number,max:number,spacing:number,chance:number,blend:Layer['blend']='replace')=>l(name,channel,{source:'patches',patchMinDiameter:min,patchMaxDiameter:max,patchSpacing:spacing,patchChance:chance,blend,weight:1});
  const ref=(name:string,reference:string,settings:Partial<Layer>={})=>l(name,'unused-reference',{source:'variable',reference,blend:'multiply',weight:1,...settings});
  const masks=()=>['natural.ocean','biome.ocean','biome.void','biome.lakes_ponds','biome.chasms'].flatMap(app=>{
    const v=p.variables.find(v=>v.appName===app);return v?[ref('Outside '+v.naturalName,v.id,{referenceMode:'at-most',referenceCutoff:0})]:[];
  });
  const existing=p.variables.find(v=>v.appName==='civilization.footprint');
  const footprint=existing??{...newVariable(24),id:uid(),appName:'civilization.footprint',naturalName:'Civilization Footprint',category:'civilization' as const,
    description:'Union of habitation and physical infrastructure. Presence only; a zero trait within this footprint is still a valid trait value.',low:'No habitation or constructed footprint',high:'Strong habitation or constructed footprint',
    layers:[ref('Habitation footprint',density.id,{blend:'replace'}),ref('Built footprint',infrastructure.id,{blend:'max'})]};
  const variables=p.variables.map(v=>{
    if(v.category!=='civilization')return v;
    if(v.id===density.id)return {...v,presenceReference:undefined,description:'Sparse habitation pods from tiny sites to approximately 30-cell settlements. Independent of infrastructure, advancement and age. Broad uninhabited expanses separate clusters.',layers:[
      patches('Settlements · 8–32 cell envelopes','civ-settlement-pods-v2',8,32,100,.42),
      patches('Hamlets · 2–9 cell envelopes','civ-hamlet-pods-v2',2,9,38,.22,'max'),
      patches('Tiny sites · 1–3 cell envelopes','civ-tiny-pods-v2',1,3,17,.1,'max'),
      l('Irregular pod margins','civ-pod-margins-v2',{source:'perlin',scaleX:3,scaleY:4,blend:'subtract',weight:.06}),
      l('Regional settlement gaps','civ-settlement-gaps-v2',{source:'perlin',scaleX:500,scaleY:400,blend:'multiply',gain:2.5,bias:-.65}),...masks()]};
    if(v.id===infrastructure.id)return {...v,presenceReference:undefined,description:'Built concentrations can accompany habitation or exist independently as abandoned sites. Extent is independent of technological capability.',layers:[
      patches('Independent built sites · 3–30 cells','civ-built-pods-v2',3,30,90,.3),
      ref('Potential built space at inhabited sites',density.id,{blend:'max',referenceMode:'at-least',referenceCutoff:.000001}),
      l('Independent built intensity','civ-built-intensity-v2',{source:'fbm',scaleX:45,scaleY:35,octaves:2,gain:3.6,bias:-1.3,blend:'multiply'}),...masks()]};
    if(v.id===footprint.id)return v;
    const inhabited=['civilization.commerce','civilization.aggression','civilization.species_homogeneity'].includes(v.appName);
    const affiliation=v.type==='enum';
    const scale= v.appName==='civilization.age'?180:v.appName==='civilization.advancement'?85:v.appName==='civilization.wealth'?60:45;
    // Discard the former density→commerce→wealth coupling: presence does not set intensity.
    const layers=v.layers.filter(a=>a.source!=='variable').map((a,i)=>({...a,
      ...(affiliation?{}:{scaleX:i?9:scale,scaleY:i?7:scale*.8,gain:3.6,bias:-1.3}),
    }));
    const definition=v.appName==='civilization.commerce'?'Current exchange and trade intensity, independently varied within inhabited sites. A small community can have intense commerce.':v.appName==='civilization.wealth'?'Relative local material abundance, independently varied within inhabited or built sites. Wealth does not follow density, commerce, age or advancement.':v.description;
    return {...v,presenceReference:inhabited?density.id:footprint.id,layers,description: definition+' Presence is limited to '+(inhabited?'inhabited sites':'inhabited or built sites')+'; trait intensity is independent of footprint strength.'};
  });
  if(!existing)variables.push(footprint);
  if(variables.length>MAX_VARIABLES)throw Error('Civilization footprint needs one available variable slot.');
  const q={...p,civilizationShapeRevision:1,variables};const errors=issues(q);if(errors.length)throw Error(errors.join(' '));return q;
}
