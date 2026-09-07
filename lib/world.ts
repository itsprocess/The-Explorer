import {deriveRatings} from './fields';
export {deriveRatings,recipes,type Rating} from './fields';
import {hash,random,fbm,cellular,band,clamp,oi,mix} from './noise';
export const VERSION='world-2';
export const LIMIT=1_000_000_000;
export const directions={north:[0,-1],east:[1,0],south:[0,1],west:[-1,0]} as const;
export type Direction=keyof typeof directions;
export function checkCoordinate(x:number,y:number){if(!Number.isSafeInteger(x)||!Number.isSafeInteger(y)||Math.abs(x)>LIMIT||Math.abs(y)>LIMIT)throw Error('Coordinates must be integers within ±1,000,000,000.');}
// Grid backbone guarantees origin connectivity; optional chambers create sprawl.
export function exists(seed:string,x:number,y:number){checkCoordinate(x,y);return x%8===0||y%8===0||Math.abs(x)+Math.abs(y)<=2||fbm(seed,'topology',x,y,13,3)>.45;}
export function connections(seed:string,x:number,y:number){return Object.fromEntries(Object.entries(directions).map(([d,[dx,dy]])=>[d,Math.abs(x+dx)<=LIMIT&&Math.abs(y+dy)<=LIMIT&&exists(seed,x,y)&&exists(seed,x+dx,y+dy)])) as Record<Direction,boolean>;}
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
 const portal=!safe&&v['supernatural.portal']>0,treasure=!safe&&!portal&&v['encounters.treasure']>0,trap=!safe&&!portal&&!treasure&&v['hazards.trap']>0;
 const election=!safe&&!trap&&!treasure&&!portal&&v['civilization.settlement']>.5&&pick>.95;
 const honor=!safe&&!trap&&!treasure&&!portal&&!election&&v['encounters.patrol']>0&&pick>.9;
 const causes=v['supernatural.haunting']>0||v['supernatural.marvel']>0?['hungry staircase','bell of unmaking','glass spores']:['concealed pit','falling slab','poison needle','spear trap','snapping deadfall','rockfall','crushing counterweight','rotten footbridge'];
 const cause=causes[hash(seed+':cause:'+x+':'+y)%causes.length];
 const event=trap?{id:'trap',kind:'death',mode:'every_visit',cause,deathId:'death:'+cause,entityId:null}:portal?{id:'portal',kind:'portal',mode:'every_visit',cause:null,deathId:null,entityId:null}:treasure?{id:'treasure',kind:'treasure',mode:'once_per_character',cause:null,deathId:null,entityId:null}:election?{id:'election',kind:'honor',mode:'once_ever',cause:null,deathId:null,entityId:refs[0].id}:honor?{id:'faction-honor',kind:'honor',mode:'once_per_character',cause:null,deathId:null,entityId:refs[1].id}:null;
 const portalDestination=portal?{x:(Math.floor(random(seed,'portal-x',x,y)*1000)-500)*8,y:(Math.floor(random(seed,'portal-y',x,y)*1000)-500)*8}:null;
 return {version:VERSION,seed,x,y,exists:exists(seed,x,y),distance:Math.hypot(x,y),protectedOrigin:x===0&&y===0,safeApproach:safe,connections:open,ratings,regions:refs,
 hostilityPolicy:{enforcesForeignHonors:!safe&&v['encounters.patrol']>0&&hash(seed+':enforcement:'+refs[0].id)%3===0,condition:'honored by a faction other than the locally represented faction',originExempt:true},
 biome:v['geology.lava']>0?'lava fissure':v['water.river']>0?'river crossing':v['water.lake']>0?'lakeshore':v['civilization.settlement']>0?'small settlement':v['vegetation.forest']>0?'woodland':v['history.ruins']>0?'ruined site':v['terrain.enclosure']>.5?'plain cave or tunnel':v['climate.temperature']<.28?'cold open ground':'open scrub or grassland',
 features:{water:v['water.river']>0||v['water.lake']>0,built:v['civilization.settlement']>0||v['history.ruins']>0,trap,treasure,portal},
 presentFeatures:ratings.filter(r=>r.kind==='feature'&&r.value>0).map(r=>({id:r.id,name:r.name,strength:r.value})),event,portalDestination,
 edges:Object.entries(directions).filter(([d])=>open[d as Direction]).map(([direction,[dx,dy]])=>{const ends=[[x,y],[x+dx,y+dy]].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const id=JSON.stringify(ends);const neighborRoof=deriveRatings(seed,x+dx,y+dy).find(r=>r.id==='terrain.enclosure')!.value;const roof=Math.max(v['terrain.enclosure'],neighborRoof);const openings=roof>.5?['wide cleft','narrow rock passage','low stone opening','rough-cut doorway','sloping tunnel mouth']:['gravel track','gap between boulders','worn earth path','shallow rocky notch','open stone steps'];return {id,direction,material:['basalt','limestone','granite'][hash(seed+id)%3],opening:openings[hash(seed+':opening'+id)%openings.length]};})};
}
export type CellContext=ReturnType<typeof contextFor>;
