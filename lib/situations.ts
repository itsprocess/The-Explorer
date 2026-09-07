export function environmentFor(v:Record<string,number>){
 const t=v['climate.temperature'],h=v['climate.humidity'],e=v['terrain.elevation'],f=v['vegetation.forest'];
 const climate=t<.18?'snowbound':t<.32?'cold':t>.78?'hot':t>.62?'warm':'temperate';
 const moisture=h<.2?'arid':h<.4?'dry':h>.75?'saturated':h>.6?'humid':'moderate';
 const cover=v['water.ocean']>.1?(t<.18?'sea ice and open water':'open water'):v['terrain.enclosure']>.75&&!(f>0)?(t<.18?'frost-lined cavern':h>.65?'damp cavern':'dry cavern'):f>0?(t<.32?'snowy conifer forest':t>.62&&h>.65?'dense tropical jungle':h<.4?'dry woodland':f>.55?'dense broadleaf forest':'mixed woodland'):t<.18?(h>.4?'snowfields':'polar gravel desert'):e>.78?'alpine rock and scree':t>.68&&h<.25?'hot desert':h<.25?'dry steppe':h>.75?'lush meadow and reeds':'grassland and scrub';
 return {climate,moisture,landcover:cover,relief:e>.78?'high mountain country':e>.62?'rocky uplands and plateaus':e<.22?'low basin':'rolling terrain'};
}
export function deriveSituations(v:Record<string,number>,open:Record<string,boolean>){
 const out:{id:string;description:string}[]=[],add=(id:string,description:string)=>out.push({id,description});
 const e=v['terrain.elevation'],t=v['climate.temperature'],h=v['climate.humidity'],roof=v['terrain.enclosure'];
 const count=Object.values(open).filter(Boolean).length,opposite=(open.north&&open.south)||(open.east&&open.west);
 if(e>.68&&count===2)add(opposite?'ridge-traverse':'turning-ledge',opposite?'A narrow elevated traverse connects the two exits.':'The two exits turn around a high rock shoulder; a bent ledge or narrow passage fits the geometry.');
 if(count===1)add('sheltered-pocket','One opening makes a sheltered pocket or cul-de-sac, with no additional paths.');
 if((v['terrain.chasm']>0||v['water.river']>0)&&count>=2)add('natural-crossing','Traversable footing threads across the fissure or channel: use a natural rock span, ledge or stepping stones, without inventing another exit or constructed bridge.');
 if(e>.72&&t<.3)add('alpine-freeze','Exposed high ground supports snow, ice crust and frost-shattered rock.');
 if(t>.62&&h>.65&&v['vegetation.forest']>0)add('layered-canopy','Warmth, sustained moisture and trees support a dense layered canopy, broad leaves and climbing growth.');
 if(h>.68&&roof>.55)add('wet-cavern','Water beads or seeps along enclosed rock; damp mineral surfaces and soft echoes suit the shelter.');
 if(h<.25&&v['climate.wind']>.15&&roof<.5)add('wind-polished','Dry exposed ground is scoured into ripples, polished faces or wind-aligned debris.');
 if(e<.3&&h>.7&&roof<.5)add('seasonal-basin','Low wet ground collects shallow standing water between patches of firm footing.');
 if(v['civilization.settlement']>0&&t<.3)add('winter-settlement','Buildings and routine work adapt to snow, frost and keeping warm.');
 if(v['history.ruins']>0&&v['vegetation.forest']>.3)add('reclaimed-masonry','Tree growth and surviving masonry interleave, with roots following cracks.');
 if(v['water.coast']>0&&e>.6)add('sea-cliffs','Elevated coastal ground forms cliff-backed shore and exposed stone shelves.');
 return out.slice(0,4);
}
