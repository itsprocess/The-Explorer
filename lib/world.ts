import {world as configWorld} from '../explorer.config.json';
import {fieldworkAt,FIELDWORK_VERSION} from './fieldwork';
import {deriveRatings} from './fields';
import {hash} from './noise';
import {occurrencesFor} from './occurrences';
export {deriveRatings,recipes,type Rating} from './fields';
export const VERSION=FIELDWORK_VERSION;
export const LIMIT=configWorld.coordinateLimit;
export const directions={north:[0,-1],east:[1,0],south:[0,1],west:[-1,0]} as const;
export type Direction=keyof typeof directions;
export function checkCoordinate(x:number,y:number){if(!Number.isSafeInteger(x)||!Number.isSafeInteger(y)||Math.abs(x)>LIMIT||Math.abs(y)>LIMIT)throw Error('Coordinates must be integers within the world limits.');}
export function exists(seed:string,x:number,y:number){checkCoordinate(x,y);return x===0&&y===0||fieldworkAt(seed,x,y).explorable;}
export function connections(seed:string,x:number,y:number){const here=exists(seed,x,y);return Object.fromEntries(Object.entries(directions).map(([d,[dx,dy]])=>[d,Math.abs(x+dx)<=LIMIT&&Math.abs(y+dy)<=LIMIT&&here&&exists(seed,x+dx,y+dy)])) as Record<Direction,boolean>;}
export type RegionRef={id:string;kind:string;anchorX:number;anchorY:number;influence:number;band:number;enumId?:string};
export function broadTerrain(v:Record<string,number>){
 if(v['biome.void'])return 'the Void';if(v['biome.chasms'])return 'chasm';if(v['natural.ocean'])return 'ocean';if(v['biome.lakes_ponds']>0)return 'lake';
 if(v['civilization.inside'])return 'built interior';if(v['biome.underground'])return 'caverns';
 const trees=v['biome.large_foliage']??0,wet=v['biome.moisture']??0,cover=v['biome.groundcover']??0,rock=v['biome.exposed_rock']??0;
 const land=trees>.6?(wet>.65?'rainforest':'forest'):trees>.3?'woodland':rock>.6?'rocky uplands':cover>.45?'grassland':wet<.25?'arid scrubland':'open plains';
 return v['biome.river']>0?'river through '+land:land;
}
export function terrainPreview(s:string,x:number,y:number){return broadTerrain(fieldworkAt(s,x,y).values);}
export function blockedReason(terrain:string){return /ocean|lake|river/.test(terrain)?'Water blocks exploration here.':/void|chasm/i.test(terrain)?'An open gulf leaves no crossing.':'The biome provides no traversable route here.';}
export function regionalRefs(s:string,x:number,y:number):RegionRef[]{return fieldworkAt(s,x,y).fields.filter(f=>f.enumId&&f.present).map(f=>{const kind=f.id.split('.')[1],ax=Math.floor(x/96)*96,ay=Math.floor(y/96)*96;return {id:kind+':'+ax+':'+ay+':'+f.enumId,kind,anchorX:ax,anchorY:ay,influence:f.value,band:0,enumId:f.enumId};});}
export function contextFor(seed:string,x:number,y:number){
 checkCoordinate(x,y);const stack=fieldworkAt(seed,x,y),v=stack.values,ratings=deriveRatings(seed,x,y),open=connections(seed,x,y),refs=regionalRefs(seed,x,y),safe=x===0&&y===0;
 const surroundings=Object.entries(directions).map(([direction,[dx,dy]])=>{const nx=x+dx,ny=y+dy,within=Math.abs(nx)<=LIMIT&&Math.abs(ny)<=LIMIT;const values=within?fieldworkAt(seed,nx,ny).values:{};return {direction:direction as Direction,dx,dy,values,glimpse:within?broadTerrain(values):'world boundary',visibleFeatures:[]};});
 const occurrences=safe?null:occurrencesFor(seed,x,y,v,stack.fields);
 return {version:VERSION,seed,x,y,exists:exists(seed,x,y),distance:Math.hypot(x,y),protectedOrigin:safe,safeApproach:safe,connections:open,ratings,regions:refs,fieldwork:stack.fields,occurrences,
 hostilityPolicy:{enforcesForeignHonors:false,condition:'',originExempt:true},biome:broadTerrain(v),environment:{climate:'Interpret from biome fields',moisture:v['biome.moisture']>.5?'moist':'dry',landcover:broadTerrain(v),relief:v['natural.elevation']>.7?'high':'low'},situations:[] as {id:string;description:string}[],
 transport:occurrences?.teleport?{mechanism:'teleport',destination:occurrences.teleport}:null,stateRule:null as import('./traits').StateRule|null,
 features:{water:!!(v['natural.ocean']||v['biome.river']||v['biome.lakes_ponds']),built:!!v['civilization.footprint'],trap:!!occurrences?.death,treasure:!!occurrences?.gift,portal:!!occurrences?.teleport,transport:!!occurrences?.teleport},
 blocked:surroundings.filter(n=>!open[n.direction]).map(n=>({direction:n.direction,reason:blockedReason(n.glimpse)})),presentFeatures:ratings.filter(r=>r.applicable&&r.value>0).map(r=>({id:r.id,name:r.name,strength:r.value})),event:null as {id:string;kind:string;mode:string;cause:string|null;deathId:string|null;entityId:string|null;outcome?:string}|null,portalDestination:occurrences?.teleport??null,
 edges:surroundings.filter(n=>open[n.direction]).map(({direction,dx,dy,values,glimpse,visibleFeatures})=>{const id=JSON.stringify([[x,y],[x+dx,y+dy]].sort((a,b)=>a[0]-b[0]||a[1]-b[1]));const built=v['civilization.inside']||values['civilization.inside'],roof=v['biome.underground']||values['biome.underground'];return {id,direction,glimpse,visibleFeatures,material:['stone','earth','local material'][hash(seed+id)%3],opening:built?'doorway or architectural opening':roof?'natural cave opening':'open passage across the terrain'};})};
}
export type CellContext=ReturnType<typeof contextFor>;
