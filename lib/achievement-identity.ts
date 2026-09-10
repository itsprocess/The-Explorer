import type {Badge} from './rules';
/** Legacy shared metadata could award the same achievement through different choices. */
export function deduplicateBadges(badges:Badge[]){
 const seen=new Set<string>();
 return badges.filter(b=>{
  if(b.kind==='death')return false;
  // Earlier challenge assignments incorrectly awarded honor on the failed branch.
  if(b.kind==='honor'&&/:absent$/.test(b.id))return false;
  const cell=b.id.match(/^(?:death:)?(.+?:fieldwork-\d+:-?\d+:-?\d+)(?::|$)/)?.[1];
  const key=cell?JSON.stringify([cell,b.kind,b.title,b.description]):b.id;
  if(seen.has(key))return false;seen.add(key);return true;
 });
}
