import type {Badge} from './rules';
/** Legacy shared metadata could award the same achievement through different choices. */
export function deduplicateBadges(badges:Badge[]){
 const seen=new Set<string>();
 return badges.filter(b=>{
  const cell=b.id.match(/^(?:death:)?(.+?:fieldwork-\d+:-?\d+:-?\d+)(?::|$)/)?.[1];
  const key=cell?JSON.stringify([cell,b.kind,b.title,b.description]):b.id;
  if(seen.has(key))return false;seen.add(key);return true;
 });
}
