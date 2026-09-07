import {distanceIntensity,distanceMultiplier} from './intensity';
import {perlin,fbm,random,cellular,band,clamp,oi} from './noise';
type Sample={s:string;x:number;y:number;v:Record<string,number>};
type Field={id:string;name:string;kind:'baseline'|'feature';low:string;high:string;recipe:string;derive:(p:Sample)=>number};
const noise=(p:Sample,id:string,size:number,octaves=3)=>fbm(p.s,id,p.x,p.y,size,octaves);
const roll=(p:Sample,id:string,chance:number)=>random(p.s,id,p.x,p.y)<Math.min(.8,chance*distanceMultiplier(p.x,p.y,id==='marvel'||id==='portal'?100:id==='treasure'?6:3))?1:0;
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
  const a=ax+dx,b=ay+dy;if(random(p.s,id+':occupied',a,b)>=chance*distanceMultiplier(p.x,p.y,1.8))continue;
  const x=(a+random(p.s,id+':x',a,b))*size,y=(b+random(p.s,id+':y',a,b))*size;
  value=Math.max(value,clamp(1-Math.hypot(p.x-x,p.y-y)/radius));
 }return value;
}
const field=(id:string,name:string,kind:Field['kind'],low:string,high:string,recipe:string,derive:Field['derive']):Field=>({id,name,kind,low,high,recipe,derive});
export const recipes:Field[]=[
 field('terrain.elevation','Elevation','baseline','low basin','high ridge','expanded continental fBm, 72-cell wavelength',p=>clamp(.5+3*(noise(p,'elevation',72)-.5))),
 field('climate.temperature','Temperature','baseline','freezing','hot','expanded 32-cell thermal gradient minus elevation lapse',p=>clamp(.5+3.4*(noise(p,'temperature',32)-.5)-.22*(p.v['terrain.elevation']-.5))),
 field('climate.humidity','Moisture','baseline','dry','wet','expanded warped 27-cell moisture field',p=>clamp(.5+3.5*(fbm(p.s,'moisture',p.x+9*(noise(p,'moisture-warp',23)-.5),p.y,27)-.5))),
 field('terrain.space_extent','Space','baseline','tight passage','wide clearing or hall','squared local fBm, mostly modest spaces',p=>noise(p,'space',15)**2),
 field('terrain.enclosure','Enclosure','baseline','open sky','underground','thresholded 20-cell rock roof with eroded margins',p=>oceanStrength(p.s,p.x,p.y)>.1?0:clamp((noise(p,'roof',20)-.34)*4)),
 field('architecture.structural_integrity','Stability','baseline','broken ground or masonry','sound ground or masonry','inverse fourth-power fracture field, usually high',p=>1-noise(p,'fracture',19)**4),
 field('world.age','Visible age','baseline','recently formed or made','ancient and weathered','180-cell age provinces with squared antiquity tail',p=>noise(p,'age',180)**2),
 field('light.level','Light','baseline','dim','bright','roof-dependent daylight plus sparse subterranean glow',p=>clamp((1-p.v['terrain.enclosure'])*(.5+.5*noise(p,'daylight',200))+.08*noise(p,'glow',17))),
 field('climate.wind','Wind','baseline','still','strong wind','squared 65-cell gust field attenuated by enclosure',p=>noise(p,'wind',65)**2*(1-.9*p.v['terrain.enclosure'])),
 field('physics.gravity','Gravity','baseline','light pull','heavy pull','usually normal; rare broad gravity-distortion lobes',p=>.5+(noise(p,'gravity-region',300)>.69-.1*distanceIntensity(p.x,p.y)?(noise(p,'gravity-pull',40)-.5)*1.6:0)),
 field('culture.wildness','Human imprint','baseline','untouched','long-shaped by people','cubic 210-cell historical influence field',p=>noise(p,'human-imprint',210)**3),
 field('world.strangeness','Strangeness','baseline','ordinary','unfamiliar forms and materials','thresholded 23-cell oddity patches, usually quiet',p=>tail(noise(p,'strangeness',23),.48)*1.4),
 field('water.ocean','Ocean','feature','absent','deep open ocean','warped 650-cell basins with 95-cell coastal roughness; dry origin buffer',p=>oceanStrength(p.s,p.x,p.y)),
 field('water.coast','Shoreline','feature','absent','a transition between land and open water','narrow shoreline band around the ocean threshold',p=>band(p.v['water.ocean'],.01,.1,.01)),
 field('vegetation.forest','Forest','feature','absent','dense trees','warped threshold islands minus cellular clearings; temperature gate',p=>{
  const warped={...p,x:p.x+6*(noise(p,'forest-warp',11)-.5)};
  const t=p.v['climate.temperature'],h=p.v['climate.humidity'],n=noise(warped,'forest',14);
  if(t<.12||h<.2)return 0;
  const canopy=t>.62&&h>.65&&n>.43?.65+.35*tail(n,.43):tail(n,.55)*4;
  return canopy*(cellular(p.s,'clearings',p.x,p.y,9)>.19?1:0);
 }),
 field('water.river','River','feature','absent','wide river channel','thin contour of blended 120/47-cell fields, sparse watershed mask',p=>band(.7*noise(p,'river-a',120,4)+.3*noise(p,'river-b',47),.495,.505,.006)*(noise(p,'watershed',300)>.51?1:0)),
 field('water.lake','Lake','feature','absent','deep pool or lake','rare 6-cell basins in low terrain',p=>p.v['terrain.elevation']<.5?centers(p,'lakes',80,.3,6):0),
 field('geology.lava','Exposed molten material','feature','absent','molten geology exposed at the surface','high volcanic tail AND narrow fissure contour',p=>noise(p,'volcanic-region',180)>.66?band(noise(p,'lava-fissure',24),.49,.51,.01):0),
 field('terrain.chasm','Chasm','feature','absent','deep fissure','ridged fault line restricted to fractured districts',p=>noise(p,'fault-district',140)>.6?band(noise(p,'fault',36),.498,.502,.004):0),
 field('vegetation.fungi','Decomposer growth','feature','absent','a colony of decomposing life adapted to this climate','moist underground pockets with subtractive local noise',p=>p.v['climate.humidity']>.53&&p.v['terrain.enclosure']>.5?tail(noise(p,'fungi',8)-.2*noise(p,'fungi-cut',3),.55)*3:0),
 field('wildlife.herd','Animal aggregation','feature','absent','a gathering of local animal life','small occupied grazing clusters outside forest',p=>p.v['vegetation.forest']===0?centers(p,'herd',28,.2,2):0),
 field('wildlife.nest','Breeding habitat','feature','absent','a place where local life reproduces or raises young','isolated 1-in-90 sites, amplified by tree cover',p=>roll(p,'nest',1/90)*(.25+.75*p.v['vegetation.forest'])),
 field('civilization.settlement','Habitation','feature','absent','a permanent community adapted to this place','isolated 1-in-400 outposts plus rare 3-cell settlement centers',p=>Math.max(roll(p,'outpost',1/400)*.35,centers(p,'town',48,.18,3))),
 field('civilization.road','Overland route','feature','absent','a maintained route for overland movement','broken contour routes across inhabited districts',p=>noise(p,'road-district',200)>.55&&noise(p,'road-erosion',9)>.35?band(noise(p,'road',65),.49,.51,.005):0),
 field('civilization.camp','Temporary occupation','feature','absent','a temporary inhabited site','1-in-130 single-cell camps, biased toward roads',p=>roll(p,'camp',1/130+p.v['civilization.road']*.03)),
 field('civilization.farm','Food production','feature','absent','land or structures used to produce food','small agricultural halo around settlement centers, broken into plots',p=>centers(p,'town',48,.18,6)>.15&&p.v['civilization.settlement']===0&&random(p.s,'plots',p.x,p.y)>.4?.7:0),
 field('culture.shrine','Devotion','feature','absent','a place devoted to worship or spiritual practice','isolated shrines with extra sites along roads',p=>roll(p,'shrine',.003+p.v['civilization.road']*.012)),
 field('economy.mine','Resource extraction','feature','absent','a site where useful raw material is removed','single entrances gated by regional ore veins',p=>noise(p,'ore',75)>.55?roll(p,'mine',.015):0),
 field('economy.workshop','Fabrication','feature','absent','a site where materials are transformed into useful things','settlement-only occupancy roll',p=>p.v['civilization.settlement']>0?roll(p,'workshop',.35):0),
 field('economy.market','Commerce','feature','absent','a place organized around trade and exchange','town centers only, excluding small outposts',p=>p.v['civilization.settlement']>.5?roll(p,'market',.6):0),
 field('history.ruins','Abandoned habitation','feature','absent','physical remains of a former inhabited place','eroded 5-cell archaeological clusters',p=>centers(p,'ruins',45,.3,5)*(noise(p,'ruin-erosion',3)>.4?1:0)),
 field('history.battlefield','Conflict legacy','feature','absent','landscape-scale evidence of past conflict','rare elongated scar with finite length',p=>centers({...p,x:p.x/3},'battlefield',90,.2,3)),
 field('history.burial','Care of the dead','feature','absent','a place where a culture tends or houses its dead','isolated graves plus sparse ruin-associated burials',p=>roll(p,'burial',.002+p.v['history.ruins']*.08)),
 field('infrastructure.machine','Automation','feature','absent','a functional apparatus working without constant manual effort','1-in-600 points, independent of weather',p=>roll(p,'machine',1/600)),
 field('encounters.traveler','Independent wayfarers','feature','absent','one or more beings traveling independently','rare single-cell encounter boosted by roads',p=>roll(p,'traveler',.006+p.v['civilization.road']*.07)),
 field('encounters.patrol','Enforcement','feature','absent','local agents enforcing territorial rules','settlement or road gate AND independent patrol roll',p=>Math.max(p.v['civilization.settlement'],p.v['civilization.road'])>0?roll(p,'patrol',.045):0),
 field('hazards.trap','Lethal danger','feature','absent','a lethal mechanism or environmental threat','independent roll, 5% independent lethal cells at every distance; safe-origin override',p=>Math.abs(p.x)+Math.abs(p.y)<=2?0:roll(p,'trap',.05)),
 field('encounters.treasure','Windfall','feature','absent','a very rare concentration of unclaimed wealth','independent 1-in-2000 point, safe-origin override',p=>Math.abs(p.x)+Math.abs(p.y)<=2?0:roll(p,'treasure',1/2000)),
 field('supernatural.haunting','Lingering presence','feature','absent','a trace of past life that remains perceptible','burial/ruin gate AND 1-in-80 spectral roll',p=>Math.max(p.v['history.ruins'],p.v['history.burial'])>0?roll(p,'haunting',1/80):0),
 field('supernatural.portal','Spatial connection','feature','absent','a connection between otherwise distant places','independent 1-in-a-million point, safe-origin override',p=>Math.abs(p.x)+Math.abs(p.y)<=2?0:roll(p,'portal',1/1_000_000)),
 field('supernatural.marvel','Physical impossibility','feature','absent','a striking exception to the ordinary laws of this world','independent 1-in-a-million landmark; no implied reward',p=>roll(p,'marvel',1/1_000_000)),
 field('terrain.dunes','Drifting terrain','feature','absent','loose ground shaped into migrating ridges','dry-climate gate, threshold desert provinces with directional ripples',p=>p.v['climate.humidity']<.44?tail(noise(p,'desert',100),.56)*(1+noise({...p,x:p.x*3},'dune-ripple',18)):0),
 field('terrain.glacier','Moving ice','feature','absent','a persistent mass of slowly moving ice','cold-climate upper tail stretched along mountain valleys',p=>p.v['climate.temperature']<.34?tail(noise({...p,y:p.y/3},'glacier',70),.57)*3:0),
 field('water.marsh','Wetland','feature','absent','waterlogged terrain with climate-appropriate life','wet lowland mask with cellular dry islands',p=>p.v['climate.humidity']>.55&&p.v['terrain.elevation']<.5?tail(noise(p,'marsh',30)-.2*cellular(p.s,'marsh-islands',p.x,p.y,7),.5)*3:0),
 field('terrain.mesa','Elevated tableland','feature','absent','a raised level expanse with steep margins','terraced highland lobes with sharp threshold edges',p=>p.v['terrain.elevation']>.55?tail(noise(p,'mesa',37),.64)*4:0),
 field('water.archipelago','Island mosaic','feature','absent','broken land distributed through open water','cellular island clusters inside ocean basins',p=>p.v['water.ocean']>.08?centers(p,'islands',70,.65,13):0),
 field('water.reef','Underwater habitat','feature','absent','a prominent living or accumulated structure beneath shallow water','shallow ocean band AND broken cellular reef rim',p=>band(p.v['water.ocean'],.03,.2,.015)*band(cellular(p.s,'reef',p.x,p.y,14),.22,.32,.03)),
 field('water.waterfall','Falling water','feature','absent','water descending over an abrupt terrain change','river presence AND steep local elevation gradient',p=>p.v['water.river']>0?clamp((Math.abs(fbm(p.s,'elevation',p.x+2,p.y,600)-fbm(p.s,'elevation',p.x-2,p.y,600))-.002)*80):0),
 field('terrain.saltflat','Evaporative deposits','feature','absent','flat mineral-rich ground left by vanished water','dry lowland basins, flattened threshold interiors',p=>p.v['climate.humidity']<.4&&p.v['terrain.elevation']<.45?tail(noise(p,'salt-pan',60),.6)*5:0),
 field('geology.geyser','Geothermal activity','feature','absent','heated groundwater emerging at the surface','rare geothermal centers with short 2-cell radii',p=>noise(p,'geothermal',150)>.57?centers(p,'geyser',35,.2,2):0),
 field('geology.crystal','Mineral growth','feature','absent','conspicuous naturally grown mineral structures','underground mineral veins cut by a narrow contour mask',p=>p.v['terrain.enclosure']>.55&&noise(p,'crystal-province',80)>.6?band(noise(p,'crystal-vein',12),.48,.52,.01):0),
 field('geology.columns','Sculpted outcrop','feature','absent','large exposed rock shaped into distinctive repeated forms','volcanic district AND cellular outcrop cores',p=>noise(p,'volcanic-region',180)>.6?tail(1-cellular(p.s,'columns',p.x,p.y,22),.84)*5:0),
 field('vegetation.bamboo','Dense understory','feature','absent','a patch of dense tall non-tree vegetation','warm wet pockets with fine subtractive gaps',p=>p.v['climate.humidity']>.56&&p.v['climate.temperature']>.53?tail(noise(p,'cane',18)-.15*noise(p,'cane-gap',4),.55)*3:0),
 field('vegetation.giant_growth','Botanical disproportion','feature','absent','local plant life with unusual scale or proportions','forest gate AND 1-in-700 botanical exception',p=>p.v['vegetation.forest']>0?roll(p,'giant-growth',1/700):0),
 field('civilization.orchard','Managed perennial growth','feature','absent','long-lived cultivated vegetation beyond a community','settlement hinterland rings with broken planted plots',p=>centers(p,'town',48,.18,9)>.1&&p.v['civilization.settlement']===0?roll(p,'orchard-plot',.12):0),
 field('civilization.fortress','Defense','feature','absent','structures intended to protect a place from intrusion','rare 2-cell defensive sites along road districts',p=>noise(p,'road-district',200)>.5?centers(p,'fort',110,.3,2):0),
 field('culture.library','Knowledge preservation','feature','absent','a place devoted to retaining and transmitting knowledge','inhabited/ruined site gate AND independent 1-in-25 roll',p=>Math.max(p.v['civilization.settlement'],p.v['history.ruins'])>0?roll(p,'library',1/25):0),
 field('culture.observatory','Measurement','feature','absent','a place built to observe and measure natural phenomena','rare exposed highland point sites',p=>p.v['terrain.enclosure']<.4&&p.v['terrain.elevation']>.5?roll(p,'observatory',1/900):0),
 field('civilization.harbor','Waterborne transit','feature','absent','an interface for movement between land and water','coastal gate AND sparse dockyard clusters',p=>p.v['water.coast']>0?centers(p,'harbor',24,.3,3):0),
 field('economy.quarry','Material storage','feature','absent','a substantial site where bulk materials are held','isolated industrial basins with 3-cell footprints',p=>centers(p,'quarry',75,.25,3)*(noise(p,'quarry-cuts',4)>.35?1:0)),
 field('infrastructure.aqueduct','Utility distribution','feature','absent','a linear system carrying a useful resource across a district','thin contour arcs confined to developed provinces',p=>noise(p,'human-imprint',210)>.63?band(noise(p,'aqueduct',55),.498,.502,.002):0),
 field('infrastructure.bridge','Engineered crossing','feature','absent','a structure spanning a physical obstacle','river/chasm gate AND local independent construction roll',p=>Math.max(p.v['water.river'],p.v['terrain.chasm'])>0?roll(p,'bridge',.08):0),
 field('culture.garden','Aesthetic cultivation','feature','absent','a place where living things are arranged for beauty','rare courtyard-scale oases with irregular edges',p=>centers(p,'garden',90,.2,2)*(noise(p,'garden-edge',3)>.3?1:0)),
 field('culture.arena','Public assembly','feature','absent','a place designed to bring a community together','rare human-imprint point, independent of weather',p=>p.v['culture.wildness']>.12?roll(p,'arena',1/1800):0),
 field('civilization.prison','Confinement','feature','absent','a place intended to contain or isolate its occupants','fortification-associated sites plus exceptionally isolated cells',p=>roll(p,'prison',p.v['civilization.fortress']>0?.2:1/6000)),
 field('encounters.caravan','Coordinated migration','feature','absent','a group moving together along an established route','road-only 1-in-48 procession sites',p=>p.v['civilization.road']>0?roll(p,'caravan',1/48):0),
 field('history.wreck','Failed journey','feature','absent','substantial remains of a journey that did not finish','coastal/deep-water rare points, smaller land chance',p=>roll(p,'wreck',p.v['water.ocean']>0?1/140:1/2000)),
 field('history.fossils','Deep-time life','feature','absent','visible preserved evidence of ancient organisms','old terrain gate AND small sedimentary clusters',p=>p.v['world.age']>.3?centers(p,'fossils',65,.2,3):0),
 field('wildlife.megafauna','Exceptional organism','feature','absent','a single conspicuously large form of local life','independent 1-in-2500 sighting, form left to the setting',p=>roll(p,'great-creature',1/2500)),
 field('supernatural.levitation','Defiance of weight','feature','absent','matter supported in a way ordinary gravity cannot explain','gravity-distortion gate AND rare 2-cell anomaly core',p=>p.v['physics.gravity']!==.5?centers(p,'levitation',30,.2,2):0),
 field('terrain.glassland','Transformed surface','feature','absent','terrain visibly altered by an extreme past process','rare heat-scar provinces with subtractive erosion',p=>noise(p,'glass-province',150)>.68?tail(noise(p,'glass-scar',25)-.15*noise(p,'glass-erosion',6),.56)*4:0),
 field('geology.meteor','Sudden impact','feature','absent','a landscape scar left by a violent external collision','isolated 4-cell circular impact basins',p=>centers(p,'impact',170,.12,4)),
 field('supernatural.mirage','Optical anomaly','feature','absent','a persistent local distortion of visible appearance','dry district AND narrow heat-band AND rare local roll',p=>p.v['climate.humidity']<.42?band(noise(p,'heat-shimmer',35),.49,.51,.005)*roll(p,'mirage',.04):0),
 field('scenery.unique_features','Unique features','feature','absent','one modest distinctive detail','single 17-cell Perlin field, upper fifth only; scenery without events',p=>{const n=perlin(p.s,'unique-scenery',p.x/17+.371,p.y/17+.619);const threshold=.63-.12*distanceIntensity(p.x,p.y);return n>threshold?.35+.65*tail(n,threshold):0;}),
 field('culture.monolith','Commemoration','feature','absent','a prominent work intended to preserve a memory','rare point monuments in ancient provinces',p=>p.v['world.age']>.25?roll(p,'monolith',1/1400):0),
 field('scenery.color_burst','Unexpected color','feature','absent','a localized vivid color accent whose source fits the place','3-cell pigment islands cut by local noise',p=>centers(p,'color-burst',15,.65,3)*(noise(p,'pigment-cut',4)>.4?1:0)),
 field('scenery.resonance','Resonant landscape','feature','absent','a physical place shaped by vibration, rhythm or sound','thin acoustic contour broken by an independent occupancy mask',p=>band(noise(p,'resonance',13),.48,.52,.01)*roll(p,'resonance-on',.2)),
 field('scenery.interlacing','Interlaced forms','feature','absent','distinct materials or living forms visibly woven together','small braided patches with cellular gaps',p=>tail(noise(p,'interlace',9),.61)*4*(cellular(p.s,'interlace-gap',p.x,p.y,4)>.2?1:0)),
 field('scenery.inversion','Reversed expectation','feature','absent','one small, playful reversal of an everyday physical expectation; no mechanical reward','isolated oddities increasingly common in the far lands',p=>roll(p,'inversion',.012)),
 field('scenery.repurposing','Unexpected reuse','feature','absent','something used in a strikingly different way from its original purpose','small occupied reuse sites near historical influence',p=>centers(p,'repurpose',19,.35,2)),
 field('scenery.symbiosis','Unlikely partnership','feature','absent','two visibly different forms of life or matter supporting one another','moisture-gated clusters with a separate occupancy roll',p=>p.v['climate.humidity']>.3?centers(p,'symbiosis',16,.4,2):0),
 field('scenery.miniature','Worlds within worlds','feature','absent','a small intricate habitat or constructed environment within the larger scene','independent intimate-scale points',p=>roll(p,'miniature',.025)),
 field('scenery.process','Visible transformation','feature','absent','an unusual material visibly changing state or taking form','short reaction fronts within active districts',p=>noise(p,'process-district',33)>.54?band(noise(p,'process-front',7),.47,.53,.01):0),
 field('scenery.play','Signs of play','feature','absent','physical evidence of inventive play by local beings, with no required encounter','scattered play sites with a broken two-cell footprint',p=>centers(p,'play-sites',17,.45,2)*(noise(p,'play-wear',3)>.3?1:0)),
 field('scenery.improbable_balance','Precarious harmony','feature','absent','a surprising arrangement that appears delicately balanced; no implied trap','sparse ridged outcrops in exposed terrain',p=>p.v['terrain.enclosure']<.6?tail(noise(p,'balance',8),.67)*5:0),
 field('scenery.echoes','Traces of another setting','feature','absent','one small remnant whose origin contrasts with its present surroundings','independent displaced fragments, stronger with distance',p=>roll(p,'echo-fragment',.022)),
 field('scenery.light_behavior','Strange light','feature','absent','a localized unusual reflection, glow or shadow appropriate to the setting','thresholded luminous pockets eroded by fine noise',p=>tail(noise(p,'light-pocket',12)-.1*noise(p,'light-cut',3),.59)*4),

];
export type Rating={id:string;name:string;kind:Field['kind'];value:number;label:string;applicable:boolean;low:string;high:string;recipe:string};
export function deriveRatings(s:string,x:number,y:number):Rating[]{
 const v:Record<string,number>={};
 const marine=new Set(['scenery.unique_features','hazards.trap','water.ocean','water.coast','water.archipelago','water.reef','civilization.harbor','history.wreck','wildlife.megafauna','supernatural.portal','supernatural.marvel','scenery.color_burst','scenery.resonance','scenery.inversion','scenery.symbiosis','scenery.miniature','scenery.process','scenery.play','scenery.echoes','scenery.light_behavior']);
 return recipes.map(r=>{let value=oi(r.derive({s,x,y,v}));
  const intensity=distanceIntensity(x,y);
  if(r.id==='world.strangeness')value=oi(value+.75*intensity*(.55+.45*fbm(s,'strangeness',x,y,110)));
  else if(r.id==='climate.temperature'||r.id==='climate.humidity')value=oi(.5+(value-.5)*(1+.25*intensity));
  else if(r.kind==='feature'&&value>0&&value<1)value=oi(value*(1+.5*intensity));
  if(r.kind==='feature'&&(v['water.ocean']??0)>.15&&!marine.has(r.id))value=0;
  v[r.id]=value;
  return {id:r.id,name:r.name,kind:r.kind,value,label:value===0?r.low:value===1?r.high:Math.round(value*100)+'%',applicable:r.kind==='baseline'||value>0,low:r.low,high:r.high,recipe:r.recipe};
 });
}
