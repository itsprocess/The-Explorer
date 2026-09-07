import {stateRuleFor} from './traits';
import {deriveRatings,oceanStrength} from './fields';
export {deriveRatings,recipes,type Rating} from './fields';
import {hash,random,fbm,cellular,band,clamp,oi,mix} from './noise';
import {interactionFor} from './encounters';
import {prominentFeatures} from './visibility';
import {environmentFor,deriveSituations} from './situations';
import {transportFor} from './transport';
export const VERSION='world-7';
export const LIMIT=1_000_000_000;
export const directions={north:[0,-1],east:[1,0],south:[0,1],west:[-1,0]} as const;
export type Direction=keyof typeof directions;
export function checkCoordinate(x:number,y:number){if(!Number.isSafeInteger(x)||!Number.isSafeInteger(y)||Math.abs(x)>LIMIT||Math.abs(y)>LIMIT)throw Error('Coordinates must be integers within ±1,000,000,000.');}
// Grid backbone guarantees origin connectivity; optional chambers create sprawl.
export function exists(seed:string,x:number,y:number){checkCoordinate(x,y);return x%8===0||y%8===0||Math.abs(x)+Math.abs(y)<=2||(oceanStrength(seed,x,y)<.25&&fbm(seed,'topology',x,y,13,3)>.49);}
export function connections(seed:string,x:number,y:number){return Object.fromEntries(Object.entries(directions).map(([d,[dx,dy]])=>[d,Math.abs(x+dx)<=LIMIT&&Math.abs(y+dy)<=LIMIT&&exists(seed,x,y)&&exists(seed,x+dx,y+dy)])) as Record<Direction,boolean>;}
export type RegionRef={id:string;kind:string;anchorX:number;anchorY:number;influence:number;band:number};
export function broadTerrain(v:Record<string,number>){
 return v['water.archipelago']>0?'islands and open water':v['water.ocean']>.1?'open ocean':v['water.coast']>0?'coast':v['terrain.glacier']>0?'glacier':v['terrain.dunes']>0?'sand dunes':v['water.marsh']>0?'wetlands':v['terrain.chasm']>0?'chasm':v['geology.lava']>0?'lava field':v['water.river']>0?'river':v['water.lake']>0?'lake':v['vegetation.forest']>0?environmentFor(v).landcover:v['terrain.mesa']>0?'rocky plateau':v['terrain.enclosure']>.5?'cave':environmentFor(v).landcover;
}
export function terrainPreview(seed:string,x:number,y:number){return broadTerrain(Object.fromEntries(deriveRatings(seed,x,y).map(r=>[r.id,r.value])));}
export function blockedReason(terrain:string){
 if(/ocean|water|lake|coast/.test(terrain))return 'Open water has no crossing in this direction.';
 if(/chasm|plateau/.test(terrain))return 'A sheer rock face and drop leave no crossing.';
 if(/forest|jungle|woodland/.test(terrain))return 'Roots and a solid bank of rock leave no passable gap.';
 if(/glacier|frozen|snow|polar/.test(terrain))return 'A wall of ice closes off this direction.';
 if(terrain==='lava field')return 'An unbroken lava channel cuts off the route.';
 if(terrain==='wetlands')return 'Deep mud and water leave no firm route.';
 if(terrain==='sand dunes')return 'A steep sand face and buried rock block the route.';
 return 'An unbroken rock face blocks the way.';
}
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
 const surroundings=Object.entries(directions).map(([direction,[dx,dy]])=>{
  const nx=x+dx,ny=y+dy,inside=Math.abs(nx)<=LIMIT&&Math.abs(ny)<=LIMIT;
  const neighbor=inside?deriveRatings(seed,nx,ny):[];
  const values=Object.fromEntries(neighbor.map(r=>[r.id,r.value]));
  return {direction,dx,dy,values,glimpse:inside?[broadTerrain(values),...prominentFeatures(neighbor).map(r=>r.name.toLowerCase())].filter((v,i,a)=>a.indexOf(v)===i).join('; '):'rock wall',visibleFeatures:prominentFeatures(neighbor)};
 });
 const pick=random(seed,'event-selection',x,y);
 const transport=transportFor(seed,x,y,v);
 const portal=!!transport,treasure=!safe&&!portal&&v['encounters.treasure']>0,trap=!safe&&!portal&&!treasure&&v['hazards.trap']>0;
 const election=!safe&&!trap&&!treasure&&!portal&&v['civilization.settlement']>.5&&pick>.95;
 const honor=!safe&&!trap&&!treasure&&!portal&&!election&&v['encounters.patrol']>0&&pick>.9;
 const causes=v['supernatural.haunting']>0||v['supernatural.marvel']>0?['hungry staircase','bell of unmaking','glass spores']:['concealed pit','falling slab','poison needle','spear trap','snapping deadfall','rockfall','crushing counterweight','rotten footbridge'];
 const cause=causes[hash(seed+':cause:'+x+':'+y)%causes.length];
 const event=trap?{id:'trap',kind:'death',mode:'every_visit',cause,deathId:'death:'+cause,entityId:null}:portal?{id:'transport',kind:'portal',mode:'every_visit',cause:transport!.mechanism,deathId:null,entityId:null}:treasure?{id:'treasure',kind:'treasure',mode:'once_per_character',cause:null,deathId:null,entityId:null}:election?{id:'election',kind:'honor',mode:'once_ever',cause:null,deathId:null,entityId:refs[0].id}:honor?{id:'faction-honor',kind:'honor',mode:'once_per_character',cause:null,deathId:null,entityId:refs[1].id}:interactionFor(seed,x,y,v);
 const stateRule=stateRuleFor(seed,x,y,event,v);
 if(stateRule?.kind==='grant'&&event){event.mode='every_visit';if('outcome' in event)event.outcome='Grant exactly context.stateRule.spec, with its app-owned lifetime. No other reward, death, travel or choice.';}
 const portalDestination=transport?.destination??null;
 return {version:VERSION,seed,x,y,exists:exists(seed,x,y),distance:Math.hypot(x,y),protectedOrigin:x===0&&y===0,safeApproach:safe,connections:open,ratings,regions:refs,
 hostilityPolicy:{enforcesForeignHonors:!safe&&v['encounters.patrol']>0&&hash(seed+':enforcement:'+refs[0].id)%3===0,condition:'honored by a faction other than the locally represented faction',originExempt:true},
 biome:broadTerrain(v),environment:environmentFor(v),situations:deriveSituations(v,open),transport,stateRule,
 features:{water:v['water.ocean']>0||v['water.river']>0||v['water.lake']>0,built:v['civilization.settlement']>0||v['history.ruins']>0,trap,treasure,portal:v['supernatural.portal']>0,transport:!!transport},
 blocked:surroundings.filter(n=>!open[n.direction as Direction]).map(n=>({direction:n.direction as Direction,reason:blockedReason(broadTerrain(n.values))})),
 presentFeatures:ratings.filter(r=>r.kind==='feature'&&r.value>0).map(r=>({id:r.id,name:r.name,strength:r.value})),event,portalDestination,
 edges:surroundings.filter(n=>open[n.direction as Direction]).map(({direction,dx,dy,values,glimpse,visibleFeatures})=>{const ends=[[x,y],[x+dx,y+dy]].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const id=JSON.stringify(ends);const roof=Math.max(v['terrain.enclosure'],values['terrain.enclosure']);const water=Math.max(v['water.ocean'],values['water.ocean'])>.1;const openings=water?['raised stone causeway','narrow stone walkway above water','linked rocky shoals']:roof>.5?['wide cleft','narrow rock passage','low stone opening','rough-cut doorway','sloping tunnel mouth']:['gravel track','gap between boulders','worn earth path','shallow rocky notch','open stone steps'];return {id,direction,glimpse,visibleFeatures,material:['basalt','limestone','granite'][hash(seed+id)%3],opening:openings[hash(seed+':opening'+id)%openings.length]};})};
}
export type CellContext=ReturnType<typeof contextFor>;
