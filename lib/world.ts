import canon from './canon.json';
import {hash,random,fbm,cellular,band,clamp,oi,mix} from './noise';
export const VERSION='world-1';
export const LIMIT=1_000_000_000;
export const directions={north:[0,-1],east:[1,0],south:[0,1],west:[-1,0]} as const;
export type Direction=keyof typeof directions;
export type Rating={id:string;value:number;label:string;applicable:boolean;low:string;high:string;recipe:string};
export function checkCoordinate(x:number,y:number){if(!Number.isSafeInteger(x)||!Number.isSafeInteger(y)||Math.abs(x)>LIMIT||Math.abs(y)>LIMIT)throw Error('Coordinates must be integers within ±1,000,000,000.');}
// Grid backbone guarantees origin connectivity; optional chambers create sprawl.
export function exists(seed:string,x:number,y:number){checkCoordinate(x,y);return x%8===0||y%8===0||Math.abs(x)+Math.abs(y)<=2||fbm(seed,'topology',x,y,13,3)>.45;}
export function connections(seed:string,x:number,y:number){return Object.fromEntries(Object.entries(directions).map(([d,[dx,dy]])=>[d,Math.abs(x+dx)<=LIMIT&&Math.abs(y+dy)<=LIMIT&&exists(seed,x,y)&&exists(seed,x+dx,y+dy)])) as Record<Direction,boolean>;}
const inverseKeys=new Set(['visibility','structural_integrity','preservation','water_clarity']);
const ridgedKeys=new Set(['ruggedness','fracturing','chasm_affinity','vertical_relief','mineral_abundance','crystal_growth','conflict_scarring','disaster_scarring']);
const cellularKeys=new Set(['settlement_density','territorial_control','ruin_density','nesting_density','memorial_density','religious_presence']);
const cutoutKeys=new Set(['foliage_density','canopy_cover','undergrowth_density','moss_coverage','vine_coverage','ice_cover','abandonment']);
const bandKeys=new Set(['surface_water','waterfall_affinity','frost_affinity','haunting_affinity','portal_affinity']);
export const recipes=canon.map(c=>{
  const h=hash(c.id);const algo=c.scale.endsWith('/H')?'detail':ridgedKeys.has(c.key)?'ridged':cellularKeys.has(c.key)?'cellular':cutoutKeys.has(c.key)?'subtractive':bandKeys.has(c.key)?'band':inverseKeys.has(c.key)?'inverse':'fbm';
  const base=c.scale.startsWith('M')?700:c.scale.startsWith('R')?100:18;
  return {...c,algo,wavelength:base*(.7+(h%71)/100),octaves:2+h%3,gain:.35+(h%25)/100,detailWeight:.08+(h%17)/100};
});
export function deriveRatings(seed:string,x:number,y:number):Rating[]{
 const values:Record<string,number>={};
 for(const r of recipes){const a=fbm(seed,r.id,x,y,r.wavelength,r.octaves,r.gain),b=fbm(seed,r.id+':secondary',x,y,r.wavelength/2,2);
 let v=a;
 if(r.algo==='ridged')v=1-Math.abs(2*a-1);
 if(r.algo==='cellular')v=1-cellular(seed,r.id,x,y,r.wavelength);
 if(r.algo==='subtractive')v=clamp(a-.45*cellular(seed,r.id+':cut',x,y,r.wavelength/3));
 if(r.algo==='band')v=band(mix(a,b,.35),.44,.53,.09);
 if(r.algo==='detail')v=mix(a,random(seed,r.id+':detail',x,y),r.detailWeight);
 if(r.algo==='inverse')v=1-a;
 values[r.id]=clamp((v-.5)*1.45+.5);
 }
 const get=(id:string)=>values[id],set=(id:string,v:number)=>{values[id]=clamp(v);};
 set('climate.temperature',get('climate.temperature')-.22*(get('terrain.elevation')-.5)+.15*get('geology.volcanic_influence'));
 set('climate.aridity',1-get('climate.precipitation_baseline'));
 set('climate.frost_affinity',band(get('climate.temperature'),0,.23,.18));
 set('terrain.slope',Math.abs(fbm(seed,'terrain.elevation',x+1,y,700)-fbm(seed,'terrain.elevation',x-1,y,700))*35);
 set('water.ground_saturation',mix(get('climate.precipitation_baseline'),get('climate.humidity'),.4)*(1-.35*get('terrain.slope')));
 const riverField=mix(fbm(seed,'river:a',x,y,110,4),fbm(seed,'river:b',x,y,47,3),.3);
 set('water.surface_water',band(riverField,.485,.515,.016));
 set('water.flow_speed',mix(get('water.flow_speed'),get('terrain.slope'),.7));
 set('water.ice_cover',get('water.surface_water')*get('climate.frost_affinity'));
 set('weather.precipitation_intensity',get('weather.precipitation_intensity')*get('climate.precipitation_baseline'));
 set('weather.snowfall_intensity',get('weather.precipitation_intensity')*get('climate.frost_affinity'));
 set('weather.fog_density',get('climate.humidity')*get('water.ground_saturation'));
 set('weather.visibility',1-.7*get('weather.fog_density')-.3*get('weather.dust_load'));
 set('vegetation.foliage_density',get('vegetation.foliage_density')*band(get('climate.temperature'),.2,.78,.15)*(.35+.65*get('water.ground_saturation'))*(.4+.6*get('geology.soil_fertility')));
 set('vegetation.fungal_density',mix(get('vegetation.fungal_density'),get('climate.humidity')*(1-.5*get('climate.sunlight_availability')),.65));
 set('architecture.structural_integrity',mix(get('architecture.maintenance'),1-get('geology.fracturing'),.4));
 set('hazards.collapse_affinity',get('geology.fracturing')*(1-get('architecture.structural_integrity')));
 set('hazards.drowning_exposure',get('water.surface_water')*get('water.water_depth'));
 set('hazards.predation_exposure',get('wildlife.predator_pressure')*get('wildlife.territoriality'));
 set('encounters.ceremony_affinity',get('civilization.population_activity')*get('culture.ceremonial_rank'));
 set('supernatural.portal_affinity',get('supernatural.magic_saturation')*get('supernatural.spatial_anomaly_affinity'));
 const distance=Math.hypot(x,y)/(Math.hypot(x,y)+500);
 set('hazards.environmental_extremity',mix(get('hazards.environmental_extremity'),.9,distance*.4));
 set('atmosphere.reverberation',get('terrain.enclosure')*get('terrain.space_extent')*(.5+.5*get('geology.rock_hardness')));
 set('atmosphere.illumination',get('climate.sunlight_availability')*(1-.7*get('terrain.enclosure'))+.15*get('supernatural.magic_saturation'));
 const water=get('water.surface_water')>.3,built=get('architecture.construction_affinity')>.42;
 return recipes.map(r=>{const value=oi(get(r.id));const label=value<.2?'very low':value<.4?'low':value<.6?'moderate':value<.8?'high':'very high';return {id:r.id,value,label,low:r.low,high:r.high,applicable:r.family==='water'?water:r.family==='architecture'?built:true,recipe:r.id+':'+r.algo+':v1'};});
}
export type RegionRef={id:string;kind:string;anchorX:number;anchorY:number;influence:number;band:number};
export function regionalRefs(seed:string,x:number,y:number):RegionRef[]{
 return ['kingdom','faction','religion'].map((kind,index)=>{
  const size=[96,64,160][index];const wx=x+24*(fbm(seed,kind+':warpX',x,y,180)-.5),wy=y+24*(fbm(seed,kind+':warpY',x,y,180)-.5);
  let best={d:Infinity,x:0,y:0};const qx=Math.floor(wx/size),qy=Math.floor(wy/size);
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const a=qx+dx,b=qy+dy;const px=(a+.2+.6*random(seed,kind+':ax',a,b))*size,py=(b+.2+.6*random(seed,kind+':ay',a,b))*size;const d=Math.hypot(wx-px,wy-py);if(d<best.d)best={d,x:a,y:b};}
  const influence=oi(mix(1-clamp(best.d/size),fbm(seed,kind+':influence',x,y,size*2),.45));
  const bandId=Math.floor(fbm(seed,kind+':band',best.x*size,best.y*size,300)*4);
  return {id:kind+':'+best.x+':'+best.y+':'+bandId,kind,anchorX:best.x*size,anchorY:best.y*size,influence,band:bandId};
 });
}
export function contextFor(seed:string,x:number,y:number){
 checkCoordinate(x,y);const ratings=deriveRatings(seed,x,y),v=Object.fromEntries(ratings.map(r=>[r.id,r.value])),safe=Math.abs(x)+Math.abs(y)<=2;
 const open=connections(seed,x,y),refs=regionalRefs(seed,x,y);
 const pick=random(seed,'event-selection',x,y);
 const trap=!safe&&pick<.18,treasure=!safe&&random(seed,'treasure-presence',x,y)<.002,portal=!safe&&random(seed,'portal-presence',x,y)<.00001;
 const election=!safe&&!trap&&!treasure&&!portal&&pick>.965;
 const honor=!safe&&!trap&&!treasure&&!portal&&!election&&pick>.92;
 const cause=['archival press','glass spores','hungry staircase','bell of unmaking','drowned lantern'][hash(seed+':cause:'+x+':'+y)%5];
 const event=trap?{id:'trap',kind:'death',mode:'every_visit',cause,deathId:'death:'+cause,entityId:null}:portal?{id:'portal',kind:'portal',mode:'every_visit',cause:null,deathId:null,entityId:null}:treasure?{id:'treasure',kind:'treasure',mode:'once_per_character',cause:null,deathId:null,entityId:null}:election?{id:'election',kind:'honor',mode:'once_ever',cause:null,deathId:null,entityId:refs[0].id}:honor?{id:'faction-honor',kind:'honor',mode:'once_per_character',cause:null,deathId:null,entityId:refs[1].id}:null;
 const portalDestination=portal?{x:(Math.floor(random(seed,'portal-x',x,y)*1000)-500)*8,y:(Math.floor(random(seed,'portal-y',x,y)*1000)-500)*8}:null;
 return {version:VERSION,seed,x,y,exists:exists(seed,x,y),distance:Math.hypot(x,y),protectedOrigin:x===0&&y===0,safeApproach:safe,connections:open,ratings,regions:refs,
 hostilityPolicy:{enforcesForeignHonors:hash(seed+':enforcement:'+refs[0].id)%3===0,condition:'honored by a faction other than the locally represented faction',originExempt:true},
 biome:v['water.surface_water']>.6?'flooded passages':v['climate.temperature']<.28?'frost chambers':v['geology.volcanic_influence']>.75?'volcanic galleries':v['vegetation.fungal_density']>.5?'fungal ruins':v['architecture.construction_affinity']>.42?'inhabited stonework':'weathered caverns',
 features:{water:v['water.surface_water']>.3,built:v['architecture.construction_affinity']>.42,trap,treasure,portal},event,portalDestination,
 edges:Object.entries(directions).filter(([d])=>open[d as Direction]).map(([direction,[dx,dy]])=>{const ends=[[x,y],[x+dx,y+dy]].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const id=JSON.stringify(ends);return {id,direction,material:['basalt','limestone','granite'][hash(seed+id)%3],opening:['broad stone arch','narrow passage','low vaulted opening'][hash(seed+':opening'+id)%3]};})};
}
export type CellContext=ReturnType<typeof contextFor>;
