type Values=Record<string,number>;
export const enclosureFor=(v:Values)=>({inside:(v['civilization.inside']??0)>0,underground:(v['biome.underground']??0)>0});
export function passageOpening(from:Values,to:Values){
 const a=enclosureFor(from),b=enclosureFor(to);
 if(a.underground&&b.underground){
  if(a.inside&&b.inside)return 'interior doorway or corridor connecting constructed underground rooms; enclosed on both sides';
  if(a.inside||b.inside)return 'underground threshold between constructed space and natural cavern; rock overhead on both sides';
  return 'continuous underground tunnel between cave chambers; rock overhead on both sides';
 }
 if(a.inside&&b.inside)return a.underground!==b.underground?'enclosed stairs or passage connecting surface and subterranean rooms; indoors on both sides':'interior doorway or corridor connecting rooms of a building; indoors on both sides';
 if(a.underground!==b.underground)return a.inside||b.inside?'threshold between subterranean space and the surface, retaining architecture on the constructed side':'cave entrance between underground and outdoor terrain';
 if(a.inside!==b.inside)return 'building entrance between an interior and outdoor terrain';
 return 'open passage across the terrain';
}
