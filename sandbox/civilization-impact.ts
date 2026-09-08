import {MAX_VARIABLES} from './model';
import {newLayer,newVariable,issues,type Project,type Layer} from './model';

export function expandCivilizationImpact(p:Project):Project {
  if(p.civilizationImpactRevision===1)return p;
  const density=p.variables.find(v=>v.appName==='civilization.density');
  const footprint=p.variables.find(v=>v.appName==='civilization.footprint');
  if(!density||!footprint)throw Error('Civilization impact needs Density and Footprint.');
  const layer=(name:string,channel:string,settings:Partial<Layer>={}):Layer=>({...newLayer(),name,channel,...settings});
  const ref=(name:string,reference:string,settings:Partial<Layer>={})=>layer(name,'reference',{source:'variable',reference,blend:'multiply',weight:1,...settings});
  const patches=(name:string,channel:string,low:number,high:number,spacing:number,chance:number,blend:Layer['blend']='replace')=>layer(name,channel,{source:'patches',patchMinDiameter:low,patchMaxDiameter:high,patchSpacing:spacing,patchChance:chance,blend});
  const groundMasks=()=>['natural.ocean','biome.ocean','biome.void','biome.lakes_ponds','biome.chasms'].flatMap(app=>{
    const v=p.variables.find(v=>v.appName===app);return v?[ref('Outside '+v.naturalName,v.id,{referenceMode:'at-most',referenceCutoff:0})]:[];
  });
  const animal=p.variables.find(v=>v.appName==='civilization.animal_population')??{...newVariable(25),category:'civilization' as const,appName:'civilization.animal_population',naturalName:'Animal Population',
    description:'Independent concentrations of terrestrial wildlife. Wolves and other animals can occur away from civilization; their presence does not imply buildings, culture or affiliation. Aquatic and flying populations are not modeled by this first land-animal recipe.',low:'No or very few land animals',high:'A dense local animal population',
    layers:[patches('Animal ranges','animal-ranges-v1',4,26,42,.65),layer('Population variation','animal-intensity-v1',{source:'fbm',scaleX:60,scaleY:45,blend:'multiply',gain:2.4,bias:-.7}),...groundMasks()]};
  const animalMix=p.variables.find(v=>v.appName==='civilization.animal_homogeneity')??{...newVariable(26),category:'civilization' as const,appName:'civilization.animal_homogeneity',naturalName:'Animal Species Homogeneity',presenceReference:animal.id,
    description:'Species mixture within the independent animal population. High can mean only wolves; low means intermingled animal species. Actual species names come from narrative context.',low:'Mixed animal species',high:'One dominant animal species',
    layers:[layer('Wildlife mixture','animal-mixture-v1',{source:'perlin',scaleX:55,scaleY:45,gain:3.6,bias:-1.3})]};
  const variables=p.variables.map(v=>{
    if(v.category!=='civilization'||v.id===animal.id||v.id===animalMix.id)return v;
    if(v.id===density.id)return {...v,description:'Current organized habitation by any species, human or non-human. More frequent settlement, hamlet and tiny-site pods, independent of historical age and built intensity.',layers:[
      patches('Settlements · 8–32 cells','civ-settlement-pods-v2',8,32,48,.75),
      patches('Hamlets · 2–9 cells','civ-hamlet-pods-v2',2,9,20,.5,'max'),
      patches('Tiny sites · 1–3 cells','civ-tiny-pods-v2',1,3,10,.25,'max'),
      layer('Irregular margins','civ-pod-margins-v2',{source:'perlin',scaleX:3,scaleY:4,blend:'subtract',weight:.04}),...groundMasks()]};
    if(v.id===footprint.id)return {...v,naturalName:'Civilization Impact Footprint',presenceReference:undefined,description:'Union of every currently inhabited site and independent blotches of prior civilization impact. Presence only: impact age and infrastructure are independent traits inside it.',layers:[
      patches('Independent past-impact sites · 6–38 cells','civ-impact-sites-v1',6,38,60,.65),
      layer('Textured impact margins','civ-impact-margins-v1',{source:'fbm',scaleX:5,scaleY:7,blend:'subtract',weight:.07}),...groundMasks(),
      ref('Include all current habitation',density.id,{blend:'max'})]};
    if(v.appName==='civilization.age')return {...v,naturalName:'Civilization Impact Age',presenceReference:footprint.id,
      description:'How far back civilization impact at this site reaches, independent of current habitation and infrastructure. Low means recent origins; high means ancient origins. This is not time since abandonment or a measure of remaining condition.',low:'Recent civilization impact',high:'Civilization impact reaches into the distant past'};
    if(v.appName==='civilization.infrastructure')return {...v,presenceReference:footprint.id,description:'Amount of physically present buildings, roads and constructed systems within the combined civilization-impact footprint. Independent of impact age and current habitation; can be low or high at old or recent, inhabited or uninhabited sites.',layers:[
      layer('Independent built intensity','civ-built-intensity-v2',{source:'fbm',scaleX:45,scaleY:35,octaves:2,gain:3.6,bias:-1.3})]};
    return {...v,presenceReference:footprint.id,description:v.description.replace(/ Presence is limited to .*$/, '')+' Defined within the combined civilization-impact footprint, independently of current density. At uninhabited sites, culture and affiliation describe associated or former inhabitants; activity describes potential or traces, not proof of current residents.'};
  });
  if(!variables.some(v=>v.id===animal.id))variables.push(animal);
  if(!variables.some(v=>v.id===animalMix.id))variables.push(animalMix);
  if(variables.length>MAX_VARIABLES)throw Error('Animal population examples need two available variable slots.');
  const q={...p,civilizationImpactRevision:1,variables};const errors=issues(q);if(errors.length)throw Error(errors.join(' '));return q;
}
