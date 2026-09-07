import {fbm,random,cellular,band,clamp,oi} from './noise';
type Sample={s:string;x:number;y:number;v:Record<string,number>};
type Field={id:string;name:string;kind:'baseline'|'feature';low:string;high:string;recipe:string;derive:(p:Sample)=>number};
const noise=(p:Sample,id:string,size:number,octaves=3)=>fbm(p.s,id,p.x,p.y,size,octaves);
const roll=(p:Sample,id:string,chance:number)=>random(p.s,id,p.x,p.y)<chance?1:0;
const tail=(n:number,start:number)=>clamp((n-start)/(1-start));
// Sparse occupied centers with bounded footprints, not a ubiquitous civilization field.
function centers(p:Sample,id:string,size:number,chance:number,radius:number){
 let value=0;const ax=Math.floor(p.x/size),ay=Math.floor(p.y/size);
 for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
  const a=ax+dx,b=ay+dy;if(random(p.s,id+':occupied',a,b)>=chance)continue;
  const x=(a+random(p.s,id+':x',a,b))*size,y=(b+random(p.s,id+':y',a,b))*size;
  value=Math.max(value,clamp(1-Math.hypot(p.x-x,p.y-y)/radius));
 }return value;
}
const field=(id:string,name:string,kind:Field['kind'],low:string,high:string,recipe:string,derive:Field['derive']):Field=>({id,name,kind,low,high,recipe,derive});
export const recipes:Field[]=[
 field('terrain.elevation','Elevation','baseline','low basin','high ridge','continental fBm, 600-cell wavelength',p=>noise(p,'elevation',600)),
 field('climate.temperature','Temperature','baseline','freezing','hot','400-cell climate gradient minus elevation lapse',p=>clamp(noise(p,'temperature',400)-.25*(p.v['terrain.elevation']-.5))),
 field('climate.humidity','Moisture','baseline','dry','wet','warped 230-cell moisture field',p=>fbm(p.s,'moisture',p.x+45*(noise(p,'moisture-warp',90)-.5),p.y,230)),
 field('terrain.space_extent','Space','baseline','tight passage','wide clearing or hall','squared local fBm, mostly modest spaces',p=>noise(p,'space',15)**2),
 field('terrain.enclosure','Enclosure','baseline','open sky','underground','thresholded 90-cell rock roof with eroded margins',p=>clamp((noise(p,'roof',90)-.34)*4)),
 field('architecture.structural_integrity','Stability','baseline','broken ground or masonry','sound ground or masonry','inverse fourth-power fracture field, usually high',p=>1-noise(p,'fracture',19)**4),
 field('vegetation.forest','Forest','feature','absent','dense trees','warped threshold islands minus cellular clearings; temperature gate',p=>{
  const warped={...p,x:p.x+18*(noise(p,'forest-warp',31)-.5)};
  return p.v['climate.temperature']<.25?0:tail(noise(warped,'forest',42),.56)*2*(cellular(p.s,'clearings',p.x,p.y,9)>.19?1:0);
 }),
 field('water.river','River','feature','absent','wide river channel','thin contour of blended 120/47-cell fields, sparse watershed mask',p=>band(.7*noise(p,'river-a',120,4)+.3*noise(p,'river-b',47),.495,.505,.006)*(noise(p,'watershed',300)>.51?1:0)),
 field('water.lake','Lake','feature','absent','deep pool or lake','rare 6-cell basins in low terrain',p=>p.v['terrain.elevation']<.5?centers(p,'lakes',80,.3,6):0),
 field('geology.lava','Lava','feature','absent','exposed lava','high volcanic tail AND narrow fissure contour',p=>noise(p,'volcanic-region',180)>.66?band(noise(p,'lava-fissure',24),.49,.51,.01):0),
 field('terrain.chasm','Chasm','feature','absent','deep fissure','ridged fault line restricted to fractured districts',p=>noise(p,'fault-district',140)>.6?band(noise(p,'fault',36),.498,.502,.004):0),
 field('vegetation.fungi','Fungal colony','feature','absent','large fungal colony','moist underground pockets with subtractive local noise',p=>p.v['climate.humidity']>.53&&p.v['terrain.enclosure']>.5?tail(noise(p,'fungi',8)-.2*noise(p,'fungi-cut',3),.55)*3:0),
 field('wildlife.herd','Herd','feature','absent','large herd','small occupied grazing clusters outside forest',p=>p.v['vegetation.forest']===0?centers(p,'herd',28,.2,2):0),
 field('wildlife.nest','Nest','feature','absent','large occupied nest','isolated 1-in-90 sites, amplified by tree cover',p=>roll(p,'nest',1/90)*(.25+.75*p.v['vegetation.forest'])),
 field('civilization.settlement','Settlement','feature','absent','compact town','isolated 1-in-400 outposts plus rare 3-cell settlement centers',p=>Math.max(roll(p,'outpost',1/400)*.35,centers(p,'town',48,.18,3))),
 field('civilization.road','Road','feature','absent','paved route','broken contour routes across inhabited districts',p=>noise(p,'road-district',200)>.55&&noise(p,'road-erosion',9)>.35?band(noise(p,'road',65),.49,.51,.005):0),
 field('civilization.camp','Camp','feature','absent','occupied camp','1-in-150 single-cell camps, biased toward roads',p=>roll(p,'camp',1/150+p.v['civilization.road']*.025)),
 field('civilization.farm','Farm','feature','absent','cultivated plot','small agricultural halo around settlement centers, broken into plots',p=>centers(p,'town',48,.18,6)>.15&&p.v['civilization.settlement']===0&&random(p.s,'plots',p.x,p.y)>.4?.7:0),
 field('culture.shrine','Shrine','feature','absent','maintained shrine','isolated shrines with extra sites along roads',p=>roll(p,'shrine',.003+p.v['civilization.road']*.012)),
 field('economy.mine','Mine','feature','absent','working mine','single entrances gated by regional ore veins',p=>noise(p,'ore',75)>.55?roll(p,'mine',.015):0),
 field('economy.workshop','Workshop','feature','absent','working craft shop','settlement-only occupancy roll',p=>p.v['civilization.settlement']>0?roll(p,'workshop',.35):0),
 field('economy.market','Market','feature','absent','busy market','town centers only, excluding small outposts',p=>p.v['civilization.settlement']>.5?roll(p,'market',.6):0),
 field('history.ruins','Ruins','feature','absent','substantial ruined buildings','eroded 5-cell archaeological clusters',p=>centers(p,'ruins',45,.3,5)*(noise(p,'ruin-erosion',3)>.4?1:0)),
 field('history.battlefield','Battlefield','feature','absent','visible battlefield remains','rare elongated scar with finite length',p=>centers({...p,x:p.x/3},'battlefield',90,.2,3)),
 field('history.burial','Burial site','feature','absent','cemetery','isolated graves plus sparse ruin-associated burials',p=>roll(p,'burial',.002+p.v['history.ruins']*.08)),
 field('infrastructure.machine','Machinery','feature','absent','large functional machine','1-in-600 points, independent of weather',p=>roll(p,'machine',1/600)),
 field('encounters.traveler','Traveler','feature','absent','traveling group','rare single-cell encounter boosted by roads',p=>roll(p,'traveler',.005+p.v['civilization.road']*.06)),
 field('encounters.patrol','Patrol','feature','absent','armed patrol','settlement or road gate AND independent patrol roll',p=>Math.max(p.v['civilization.settlement'],p.v['civilization.road'])>0?roll(p,'patrol',.04):0),
 field('hazards.trap','Lethal trap','feature','absent','active trap','independent roll, 2% nearby rising toward 6% far away; safe-origin override',p=>Math.abs(p.x)+Math.abs(p.y)<=2?0:roll(p,'trap',.02+.04*Math.hypot(p.x,p.y)/(Math.hypot(p.x,p.y)+1500))),
 field('encounters.treasure','Treasure chest','feature','absent','rare treasure chest','independent 1-in-2000 point, safe-origin override',p=>Math.abs(p.x)+Math.abs(p.y)<=2?0:roll(p,'treasure',1/2000)),
 field('supernatural.haunting','Haunting','feature','absent','visible haunting','burial/ruin gate AND 1-in-80 spectral roll',p=>Math.max(p.v['history.ruins'],p.v['history.burial'])>0?roll(p,'haunting',1/80):0),
 field('supernatural.portal','Portal','feature','absent','active portal','independent 1-in-a-million point, safe-origin override',p=>Math.abs(p.x)+Math.abs(p.y)<=2?0:roll(p,'portal',1/1_000_000)),
 field('supernatural.marvel','Impossible landmark','feature','absent','impossible landmark','independent 1-in-a-million landmark; no implied reward',p=>roll(p,'marvel',1/1_000_000)),
];
export type Rating={id:string;name:string;kind:Field['kind'];value:number;label:string;applicable:boolean;low:string;high:string;recipe:string};
export function deriveRatings(s:string,x:number,y:number):Rating[]{
 const v:Record<string,number>={};
 return recipes.map(r=>{const value=oi(r.derive({s,x,y,v}));v[r.id]=value;
  return {id:r.id,name:r.name,kind:r.kind,value,label:value===0?r.low:value===1?r.high:Math.round(value*100)+'%',applicable:r.kind==='baseline'||value>0,low:r.low,high:r.high,recipe:r.recipe};
 });
}
