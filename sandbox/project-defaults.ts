import {MAX_VARIABLES} from './model';
import proposals from './biome-proposals.json';
import { parseProject, starter, uid, type Project } from './model';
export const CATEGORIES = {biome:'Biome', civilization:'Civilization', variation:'Uniqueness / Variation', occurrences:'Occurrences'} as const;
export const CATEGORY_DESCRIPTIONS = {
  biome:'Natural environmental components and the fields that shape them.',
  civilization:'Civilization variables can describe factions, religions, cities, infrastructure or any other authored social layer.',
  variation:'Uniqueness and variation variables shape distinctive regional or local differences before occurrences are applied.',
  occurrences:'Variables for things, interactions, encounters and other happenings.',
};
export const proposalProject = () => parseProject(JSON.stringify(proposals));
export const STORAGE_KEY='explorer-fieldwork';

// One active project. Legacy storage remains as an untouched backup only.
function loadPreviousProject(storage: Pick<Storage,'getItem'> & Partial<Pick<Storage,'setItem'>>): Project {
  const current=storage.getItem(STORAGE_KEY);if(current){
    const saved=parseProject(current);
    if(saved.biomeRecipeRevision!==1){
      if(!storage.getItem(STORAGE_KEY+'-before-scale-update'))storage.setItem?.(STORAGE_KEY+'-before-scale-update',current);
      return refreshBiomeRecipes(saved);
    }
    return saved;
  }
  const study=storage.getItem('explorer-fieldwork-natural-v1');
  const original=storage.getItem('explorer-fieldwork-v1');
  const project=study?parseProject(study):proposalProject();
  project.name='Variable sandbox';
  if(original){
    const old=parseProject(original);
    const withoutIds=(p:Project)=>JSON.stringify(p,(key,value)=>key==='id'?undefined:value);
    if(withoutIds(old)===withoutIds(starter()))return refreshBiomeRecipes(project);
    const remap=new Map(old.variables.map(v=>[v.id,project.variables.some(p=>p.id===v.id)?uid():v.id]));
    for(const v of old.variables){
      if(project.variables.length>=MAX_VARIABLES)throw Error('Legacy drafts exceed 32 variables. Export the old drafts before combining them.');
      const next={...v,id:remap.get(v.id)!,layers:v.layers.map(l=>({...l,id:uid(),reference:remap.get(l.reference)??l.reference})),steps:v.steps.map(s=>({...s,id:uid()}))};
      while(project.variables.some(p=>p.appName===next.appName))next.appName+='_saved';
      project.variables.push(next);
    }
  }
  return refreshBiomeRecipes(project);
}

export function simplifyRiverStudy(project:Project):Project {
  if(project.riverStudyRevision===2)return project;
  const defaults=proposalProject();
  const find=(pattern:RegExp)=>project.variables.find(v=>pattern.test(v.naturalName)||pattern.test(v.appName));
  const altitude={...(find(/altitude|elevation/i)??defaults.variables[0]),naturalName:'Altitude',category:'biome' as const};
  const ocean={...(find(/ocean/i)??defaults.variables[1]),category:'biome' as const};
  const originalRiver=find(/river/i),template=defaults.variables.find(v=>v.appName==='biome.river')!;
  if(!template)throw Error('River proposal is not yet available; reload after the update finishes.');
  const river={...(originalRiver??template),naturalName:'River',category:'biome' as const,description:template.description,
    appName:originalRiver&&/river/i.test(originalRiver.appName)?originalRiver.appName:'biome.river',low:template.low,high:template.high};
  const oldNoise=originalRiver?.layers.find(l=>l.source==='perlin'||l.source==='fbm');
  river.layers=template.layers.map(l=>({...l,id:uid(),
    ...(l.source==='variable'?{reference:ocean.id}:oldNoise?{
      source:oldNoise.source,channel:oldNoise.channel,scaleX:oldNoise.scaleX,scaleY:oldNoise.scaleY,
      offsetX:oldNoise.offsetX,offsetY:oldNoise.offsetY,rotation:oldNoise.rotation,
      octaves:oldNoise.octaves,persistence:oldNoise.persistence,lacunarity:oldNoise.lacunarity,
    }:{}),
  }));
  // Retain existing output choices; only a new River defaults to a gradient.
  const ids=new Set([altitude.id,ocean.id,river.id]);
  altitude.layers=altitude.layers.filter(l=>l.source!=='variable'||ids.has(l.reference));
  ocean.layers=ocean.layers.filter(l=>l.source!=='variable'||ids.has(l.reference));
  return {...project,riverStudyRevision:2,variables:[altitude,ocean,river]};
}

export function loadProject(storage: Pick<Storage,'getItem'> & Partial<Pick<Storage,'setItem'>>):Project {
  const previous=loadPreviousProject(storage);
  if(previous.riverStudyRevision===2)return previous;
  if(!storage.getItem(STORAGE_KEY+'-before-river-study'))storage.setItem?.(STORAGE_KEY+'-before-river-study',JSON.stringify(previous));
  return simplifyRiverStudy(previous);
}

// One-time, user-requested recipe update to the existing sandbox proposals.
// Evaluation remains generic; after this update the saved layers are the authority.
export function refreshBiomeRecipes(project:Project):Project {
  if(project.biomeRecipeRevision===1)return project;
  const proposed=proposalProject();
  const available=new Set(project.variables.map(v=>v.id));
  return {...project,biomeRecipeRevision:1,variables:project.variables.map(v=>{
    const next=proposed.variables.find(p=>p.id===v.id);
    if(!next||v.category!=='biome')return v;
    // Keep the user's already-authored Perlin ocean stack, cutoff and channel.
    if(v.id==='natural.ocean'&&v.layers.some(l=>l.source==='perlin'))return {...v,
      description:'Ocean regions follow this editable Perlin stack and its variable contributions. The final continuous signal is interpreted using the cutoff below; elevation does not independently determine sea level.',
      off:next.off,on:next.on};
    const layers=next.layers.filter(l=>l.source!=='variable'||available.has(l.reference)).map(l=>({...l,id:uid()}));
    return {...v,layers,description:next.description,
      ...(v.id==='natural.ocean'?{off:next.off,on:next.on}:{}),
      ...(v.id==='natural.vegetation'&&v.type==='enum'&&JSON.stringify(v.steps.map(s=>s.cutoff))==='[0,0.18,0.38,0.62]'?{steps:v.steps.map((s,i)=>({...s,cutoff:next.steps[i].cutoff}))}:{}),
    };
  })};
}
