import {fbm,random,cellular,band,clamp,oi} from './noise';
type Sample={s:string;x:number;y:number;v:Record<string,number>};
type Field={id:string;name:string;kind:'baseline'|'feature';low:string;high:string;recipe:string;derive:(p:Sample)=>number};
const noise=(p:Sample,id:string,size:number,octaves=3)=>fbm(p.s,id,p.x,p.y,size,octaves);
const roll=(p:Sample,id:string,chance:number)=>random(p.s,id,p.x,p.y)<chance?1:0;
const tail=(n:number,start:number)=>clamp((n-start)/(1-start));
export function oceanStrength(s:string,x:number,y:number){
 const warp=70*(fbm(s,'ocean-warp',x,y,170)-.5);
 const n=.75*fbm(s,'ocean-basin',x+warp,y,650,4)+.25*fbm(s,'coast-roughness',x,y,95,2);
 return oi(tail(n-.25*clamp(1-Math.hypot(x,y)/60),.59)*4);
}
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
 field('terrain.enclosure','Enclosure','baseline','open sky','underground','thresholded 90-cell rock roof with eroded margins',p=>oceanStrength(p.s,p.x,p.y)>.1?0:clamp((noise(p,'roof',90)-.34)*4)),
 field('architecture.structural_integrity','Stability','baseline','broken ground or masonry','sound ground or masonry','inverse fourth-power fracture field, usually high',p=>1-noise(p,'fracture',19)**4),
 field('world.age','Visible age','baseline','recently formed or made','ancient and weathered','180-cell age provinces with squared antiquity tail',p=>noise(p,'age',180)**2),
 field('light.level','Light','baseline','dim','bright','roof-dependent daylight plus sparse subterranean glow',p=>clamp((1-p.v['terrain.enclosure'])*(.5+.5*noise(p,'daylight',200))+.08*noise(p,'glow',17))),
 field('climate.wind','Wind','baseline','still','strong wind','squared 65-cell gust field attenuated by enclosure',p=>noise(p,'wind',65)**2*(1-.9*p.v['terrain.enclosure'])),
 field('physics.gravity','Gravity','baseline','light pull','heavy pull','usually normal; rare broad gravity-distortion lobes',p=>.5+(noise(p,'gravity-region',300)>.69?(noise(p,'gravity-pull',40)-.5)*1.6:0)),
 field('culture.wildness','Human imprint','baseline','untouched','long-shaped by people','cubic 210-cell historical influence field',p=>noise(p,'human-imprint',210)**3),
 field('world.strangeness','Strangeness','baseline','ordinary','unfamiliar forms and materials','sixth-power 110-cell anomaly field, usually near zero',p=>noise(p,'strangeness',110)**6),
 field('water.ocean','Ocean','feature','absent','deep open ocean','warped 650-cell basins with 95-cell coastal roughness; dry origin buffer',p=>oceanStrength(p.s,p.x,p.y)),
 field('water.coast','Coast','feature','absent','wide tidal shore','narrow shoreline band around the ocean threshold',p=>band(p.v['water.ocean'],.01,.1,.01)),
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
 field('civilization.camp','Camp','feature','absent','occupied camp','1-in-130 single-cell camps, biased toward roads',p=>roll(p,'camp',1/130+p.v['civilization.road']*.03)),
 field('civilization.farm','Farm','feature','absent','cultivated plot','small agricultural halo around settlement centers, broken into plots',p=>centers(p,'town',48,.18,6)>.15&&p.v['civilization.settlement']===0&&random(p.s,'plots',p.x,p.y)>.4?.7:0),
 field('culture.shrine','Shrine','feature','absent','maintained shrine','isolated shrines with extra sites along roads',p=>roll(p,'shrine',.003+p.v['civilization.road']*.012)),
 field('economy.mine','Mine','feature','absent','working mine','single entrances gated by regional ore veins',p=>noise(p,'ore',75)>.55?roll(p,'mine',.015):0),
 field('economy.workshop','Workshop','feature','absent','working craft shop','settlement-only occupancy roll',p=>p.v['civilization.settlement']>0?roll(p,'workshop',.35):0),
 field('economy.market','Market','feature','absent','busy market','town centers only, excluding small outposts',p=>p.v['civilization.settlement']>.5?roll(p,'market',.6):0),
 field('history.ruins','Ruins','feature','absent','substantial ruined buildings','eroded 5-cell archaeological clusters',p=>centers(p,'ruins',45,.3,5)*(noise(p,'ruin-erosion',3)>.4?1:0)),
 field('history.battlefield','Battlefield','feature','absent','visible battlefield remains','rare elongated scar with finite length',p=>centers({...p,x:p.x/3},'battlefield',90,.2,3)),
 field('history.burial','Burial site','feature','absent','cemetery','isolated graves plus sparse ruin-associated burials',p=>roll(p,'burial',.002+p.v['history.ruins']*.08)),
 field('infrastructure.machine','Machinery','feature','absent','large functional machine','1-in-600 points, independent of weather',p=>roll(p,'machine',1/600)),
 field('encounters.traveler','Traveler','feature','absent','traveling group','rare single-cell encounter boosted by roads',p=>roll(p,'traveler',.006+p.v['civilization.road']*.07)),
 field('encounters.patrol','Patrol','feature','absent','armed patrol','settlement or road gate AND independent patrol roll',p=>Math.max(p.v['civilization.settlement'],p.v['civilization.road'])>0?roll(p,'patrol',.045):0),
 field('hazards.trap','Lethal trap','feature','absent','active trap','independent roll, 2% nearby rising toward 6% far away; safe-origin override',p=>Math.abs(p.x)+Math.abs(p.y)<=2?0:roll(p,'trap',.02+.04*Math.hypot(p.x,p.y)/(Math.hypot(p.x,p.y)+1500))),
 field('encounters.treasure','Treasure chest','feature','absent','rare treasure chest','independent 1-in-2000 point, safe-origin override',p=>Math.abs(p.x)+Math.abs(p.y)<=2?0:roll(p,'treasure',1/2000)),
 field('supernatural.haunting','Haunting','feature','absent','visible haunting','burial/ruin gate AND 1-in-80 spectral roll',p=>Math.max(p.v['history.ruins'],p.v['history.burial'])>0?roll(p,'haunting',1/80):0),
 field('supernatural.portal','Portal','feature','absent','active portal','independent 1-in-a-million point, safe-origin override',p=>Math.abs(p.x)+Math.abs(p.y)<=2?0:roll(p,'portal',1/1_000_000)),
 field('supernatural.marvel','Impossible landmark','feature','absent','impossible landmark','independent 1-in-a-million landmark; no implied reward',p=>roll(p,'marvel',1/1_000_000)),
 field('terrain.dunes','Dunes','feature','absent','large dune field','dry-climate gate, threshold desert provinces with directional ripples',p=>p.v['climate.humidity']<.44?tail(noise(p,'desert',100),.56)*(1+noise({...p,x:p.x*3},'dune-ripple',18)):0),
 field('terrain.glacier','Glacier','feature','absent','thick glacier','cold-climate upper tail stretched along mountain valleys',p=>p.v['climate.temperature']<.34?tail(noise({...p,y:p.y/3},'glacier',70),.57)*3:0),
 field('water.marsh','Marsh','feature','absent','deep wetland','wet lowland mask with cellular dry islands',p=>p.v['climate.humidity']>.55&&p.v['terrain.elevation']<.5?tail(noise(p,'marsh',30)-.2*cellular(p.s,'marsh-islands',p.x,p.y,7),.5)*3:0),
 field('terrain.mesa','Mesa','feature','absent','flat-topped plateau','terraced highland lobes with sharp threshold edges',p=>p.v['terrain.elevation']>.55?tail(noise(p,'mesa',37),.64)*4:0),
 field('water.archipelago','Archipelago','feature','absent','cluster of islands','cellular island clusters inside ocean basins',p=>p.v['water.ocean']>.08?centers(p,'islands',70,.65,13):0),
 field('water.reef','Reef','feature','absent','extensive reef','shallow ocean band AND broken cellular reef rim',p=>band(p.v['water.ocean'],.03,.2,.015)*band(cellular(p.s,'reef',p.x,p.y,14),.22,.32,.03)),
 field('water.waterfall','Waterfall','feature','absent','high waterfall','river presence AND steep local elevation gradient',p=>p.v['water.river']>0?clamp((Math.abs(fbm(p.s,'elevation',p.x+2,p.y,600)-fbm(p.s,'elevation',p.x-2,p.y,600))-.002)*80):0),
 field('terrain.saltflat','Salt flat','feature','absent','broad salt pan','dry lowland basins, flattened threshold interiors',p=>p.v['climate.humidity']<.4&&p.v['terrain.elevation']<.45?tail(noise(p,'salt-pan',60),.6)*5:0),
 field('geology.geyser','Geyser','feature','absent','active geyser field','rare geothermal centers with short 2-cell radii',p=>noise(p,'geothermal',150)>.57?centers(p,'geyser',35,.2,2):0),
 field('geology.crystal','Crystal formation','feature','absent','large crystal formations','underground mineral veins cut by a narrow contour mask',p=>p.v['terrain.enclosure']>.55&&noise(p,'crystal-province',80)>.6?band(noise(p,'crystal-vein',12),.48,.52,.01):0),
 field('geology.columns','Columnar rock','feature','absent','columnar rock formation','volcanic district AND cellular outcrop cores',p=>noise(p,'volcanic-region',180)>.6?tail(1-cellular(p.s,'columns',p.x,p.y,22),.84)*5:0),
 field('vegetation.bamboo','Reed or bamboo grove','feature','absent','tall cane grove','warm wet pockets with fine subtractive gaps',p=>p.v['climate.humidity']>.56&&p.v['climate.temperature']>.53?tail(noise(p,'cane',18)-.15*noise(p,'cane-gap',4),.55)*3:0),
 field('vegetation.giant_growth','Giant growth','feature','absent','oversized local flora','forest gate AND 1-in-700 botanical exception',p=>p.v['vegetation.forest']>0?roll(p,'giant-growth',1/700):0),
 field('civilization.orchard','Orchard','feature','absent','old cultivated grove','settlement hinterland rings with broken planted plots',p=>centers(p,'town',48,.18,9)>.1&&p.v['civilization.settlement']===0?roll(p,'orchard-plot',.12):0),
 field('civilization.fortress','Fortification','feature','absent','substantial fortification','rare 2-cell defensive sites along road districts',p=>noise(p,'road-district',200)>.5?centers(p,'fort',110,.3,2):0),
 field('culture.library','Archive or library','feature','absent','collection of preserved knowledge','inhabited/ruined site gate AND independent 1-in-25 roll',p=>Math.max(p.v['civilization.settlement'],p.v['history.ruins'])>0?roll(p,'library',1/25):0),
 field('culture.observatory','Observatory','feature','absent','astronomical structure','rare exposed highland point sites',p=>p.v['terrain.enclosure']<.4&&p.v['terrain.elevation']>.5?roll(p,'observatory',1/900):0),
 field('civilization.harbor','Harbor','feature','absent','working harbor','coastal gate AND sparse dockyard clusters',p=>p.v['water.coast']>0?centers(p,'harbor',24,.3,3):0),
 field('economy.quarry','Quarry','feature','absent','worked excavation','isolated industrial basins with 3-cell footprints',p=>centers(p,'quarry',75,.25,3)*(noise(p,'quarry-cuts',4)>.35?1:0)),
 field('infrastructure.aqueduct','Aqueduct','feature','absent','raised water conduit','thin contour arcs confined to developed provinces',p=>noise(p,'human-imprint',210)>.63?band(noise(p,'aqueduct',55),.498,.502,.002):0),
 field('infrastructure.bridge','Bridge remains','feature','absent','substantial bridge structure','river/chasm gate AND local independent construction roll',p=>Math.max(p.v['water.river'],p.v['terrain.chasm'])>0?roll(p,'bridge',.08):0),
 field('culture.garden','Designed garden','feature','absent','formal or abandoned garden','rare courtyard-scale oases with irregular edges',p=>centers(p,'garden',90,.2,2)*(noise(p,'garden-edge',3)>.3?1:0)),
 field('culture.arena','Arena','feature','absent','gathering or contest ground','rare human-imprint point, independent of weather',p=>p.v['culture.wildness']>.12?roll(p,'arena',1/1800):0),
 field('civilization.prison','Confinement site','feature','absent','old or active confinement structure','fortification-associated sites plus exceptionally isolated cells',p=>roll(p,'prison',p.v['civilization.fortress']>0?.2:1/6000)),
 field('encounters.caravan','Caravan','feature','absent','traveling convoy','road-only 1-in-48 procession sites',p=>p.v['civilization.road']>0?roll(p,'caravan',1/48):0),
 field('history.wreck','Wreckage','feature','absent','substantial wreckage','coastal/deep-water rare points, smaller land chance',p=>roll(p,'wreck',p.v['water.ocean']>0?1/140:1/2000)),
 field('history.fossils','Fossil bed','feature','absent','exposed ancient remains','old terrain gate AND small sedimentary clusters',p=>p.v['world.age']>.3?centers(p,'fossils',65,.2,3):0),
 field('wildlife.megafauna','Great creature','feature','absent','very large creature','independent 1-in-2500 sighting, form left to the setting',p=>roll(p,'great-creature',1/2500)),
 field('supernatural.levitation','Suspended matter','feature','absent','floating rocks or structures','gravity-distortion gate AND rare 2-cell anomaly core',p=>p.v['physics.gravity']!==.5?centers(p,'levitation',30,.2,2):0),
 field('terrain.glassland','Vitrified ground','feature','absent','glasslike landscape','rare heat-scar provinces with subtractive erosion',p=>noise(p,'glass-province',150)>.68?tail(noise(p,'glass-scar',25)-.15*noise(p,'glass-erosion',6),.56)*4:0),
 field('geology.meteor','Impact site','feature','absent','impact crater','isolated 4-cell circular impact basins',p=>centers(p,'impact',170,.12,4)),
 field('supernatural.mirage','Persistent mirage','feature','absent','unusual visual phenomenon','dry district AND narrow heat-band AND rare local roll',p=>p.v['climate.humidity']<.42?band(noise(p,'heat-shimmer',35),.49,.51,.005)*roll(p,'mirage',.04):0),
 field('culture.monolith','Standing monument','feature','absent','large standing monument','rare point monuments in ancient provinces',p=>p.v['world.age']>.25?roll(p,'monolith',1/1400):0),
];
export type Rating={id:string;name:string;kind:Field['kind'];value:number;label:string;applicable:boolean;low:string;high:string;recipe:string};
export function deriveRatings(s:string,x:number,y:number):Rating[]{
 const v:Record<string,number>={};
 const marine=new Set(['water.ocean','water.coast','water.archipelago','water.reef','civilization.harbor','history.wreck','wildlife.megafauna','supernatural.portal','supernatural.marvel']);
 return recipes.map(r=>{let value=oi(r.derive({s,x,y,v}));
  if(r.kind==='feature'&&(v['water.ocean']??0)>.15&&!marine.has(r.id))value=0;
  v[r.id]=value;
  return {id:r.id,name:r.name,kind:r.kind,value,label:value===0?r.low:value===1?r.high:Math.round(value*100)+'%',applicable:r.kind==='baseline'||value>0,low:r.low,high:r.high,recipe:r.recipe};
 });
}
