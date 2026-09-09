import {world as configWorld} from '../explorer.config.json';
import {fieldworkAt,FIELDWORK_VERSION} from './fieldwork';
import {deriveRatings} from './fields';
import {hash} from './noise';
import {occurrencesFor,teleportDestination} from './occurrences';
export {deriveRatings,recipes,type Rating} from './fields';
export const VERSION=FIELDWORK_VERSION;
export const LIMIT=configWorld.coordinateLimit;
export const directions={north:[0,-1],east:[1,0],south:[0,1],west:[-1,0]} as const;
export type Direction=keyof typeof directions;
export function checkCoordinate(x:number,y:number){if(!Number.isSafeInteger(x)||!Number.isSafeInteger(y)||Math.abs(x)>LIMIT||Math.abs(y)>LIMIT)throw Error('Coordinates must be integers within the world limits.');}
export function exists(seed:string,x:number,y:number){checkCoordinate(x,y);return x===0&&y===0||fieldworkAt(seed,x,y).explorable;}
export function devConnections(x:number,y:number){return Object.fromEntries(Object.entries(directions).map(([d,[dx,dy]])=>[d,Math.abs(x+dx)<=LIMIT&&Math.abs(y+dy)<=LIMIT])) as Record<Direction,boolean>;}
export function boundaryTerrain(values:Record<string,number>){return [['natural.ocean','ocean'],['biome.void','void'],['biome.chasms','chasm'],['biome.lakes_ponds','lake'],['biome.river','river']].filter(([id])=>values[id]>0).map(([id,kind])=>({kind,strength:values[id]}));}
export function connections(seed:string,x:number,y:number){const here=exists(seed,x,y);return Object.fromEntries(Object.entries(directions).map(([d,[dx,dy]])=>[d,Math.abs(x+dx)<=LIMIT&&Math.abs(y+dy)<=LIMIT&&here&&exists(seed,x+dx,y+dy)])) as Record<Direction,boolean>;}
export function originTeleports(seed:string,x:number,y:number){if(x!==0||y!==0||Object.values(connections(seed,x,y)).some(Boolean))return [];return Object.keys(directions).map(direction=>({direction:direction as Direction,destination:teleportDestination(seed,x,y,'origin-exit-'+direction)}));}
export type RegionRef={id:string;kind:string;anchorX:number;anchorY:number;influence:number;band:number;enumId?:string};
// No procedural prose: labels are authored by the interpretation model.
export function broadTerrain(_v:Record<string,number>){return '';}
export function terrainPreview(_s:string,_x:number,_y:number){return '';}
export function blockedReason(_terrain:string){return 'Not traversable.';}
export function regionalRefs(s:string,x:number,y:number):RegionRef[]{return fieldworkAt(s,x,y).fields.filter(f=>f.enumId&&f.present).map(f=>{const kind=f.id.split('.')[1],ax=Math.floor(x/96)*96,ay=Math.floor(y/96)*96;return {id:kind+':'+ax+':'+ay+':'+f.enumId,kind,anchorX:ax,anchorY:ay,influence:f.value,band:0,enumId:f.enumId};});}
export function contextFor(seed:string,x:number,y:number){
 checkCoordinate(x,y);const stack=fieldworkAt(seed,x,y),v=stack.values,ratings=deriveRatings(seed,x,y),open=connections(seed,x,y),refs=regionalRefs(seed,x,y),safe=x===0&&y===0;
 const surroundings=Object.entries(directions).map(([direction,[dx,dy]])=>{const nx=x+dx,ny=y+dy,within=Math.abs(nx)<=LIMIT&&Math.abs(ny)<=LIMIT;const values=within?fieldworkAt(seed,nx,ny).values:{};return {direction:direction as Direction,dx,dy,values,glimpse:within?broadTerrain(values):'world boundary',visibleFeatures:[]};});
 const portalExits=originTeleports(seed,x,y);
 const occurrences=safe?null:occurrencesFor(seed,x,y,v,stack.fields);
 return {version:VERSION,seed,x,y,exists:exists(seed,x,y),distance:Math.hypot(x,y),protectedOrigin:safe,safeApproach:safe,connections:open,portalExits,adjacentTerrain:surroundings.map(n=>({direction:n.direction,terrain:boundaryTerrain(n.values)})).filter(n=>n.terrain.length>0),ratings,regions:refs,fieldwork:stack.fields,occurrences,
 hostilityPolicy:{enforcesForeignHonors:false,condition:'',originExempt:true},biome:broadTerrain(v),environment:{climate:'',moisture:'',landcover:'',relief:''},situations:[] as {id:string;description:string}[],
 transport:occurrences?.teleport?{mechanism:'teleport',destination:occurrences.teleport}:null,stateRule:null as import('./traits').StateRule|null,
 features:{water:!!(v['natural.ocean']||v['biome.river']||v['biome.lakes_ponds']),built:!!v['civilization.footprint'],trap:!!occurrences?.death,treasure:!!occurrences?.gift,portal:!!occurrences?.teleport,transport:!!occurrences?.teleport},
 blocked:surroundings.filter(n=>!open[n.direction]&&!portalExits.some(p=>p.direction===n.direction)).map(n=>({direction:n.direction,reason:blockedReason(n.glimpse),terrain:boundaryTerrain(n.values)})),presentFeatures:ratings.filter(r=>r.applicable&&r.value>0).map(r=>({id:r.id,name:r.name,strength:r.value})),event:null as {id:string;kind:string;mode:string;cause:string|null;deathId:string|null;entityId:string|null;outcome?:string}|null,portalDestination:occurrences?.teleport??null,
 edges:surroundings.filter(n=>open[n.direction]).map(({direction,dx,dy,values,glimpse,visibleFeatures})=>{const id=JSON.stringify([[x,y],[x+dx,y+dy]].sort((a,b)=>a[0]-b[0]||a[1]-b[1]));const built=v['civilization.inside']||values['civilization.inside'],roof=v['biome.underground']||values['biome.underground'];return {id,direction,glimpse,visibleFeatures,material:['stone','earth','local material'][hash(seed+id)%3],opening:built?'doorway or architectural opening':roof?'natural cave opening':'open passage across the terrain'};}).concat(portalExits.map(p=>({id:'origin-portal:'+p.direction,direction:p.direction,glimpse:'',visibleFeatures:[],material:'local material',opening:'teleporter to a nonadjacent destination'})))};
}
export type CellContext=ReturnType<typeof contextFor>;
