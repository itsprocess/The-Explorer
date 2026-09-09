export const historyFilters=['all','acquisitions','replacements','losses','uses','deaths','escapes','transport','relics','encounters'] as const;
export function historyQuery(character:string,query='',filter='all',offset=0){
 if(query.length>160||!historyFilters.includes(filter as any)||!Number.isSafeInteger(offset)||offset<0||offset>100000)throw Error('Invalid history search.');
 const params:(string|number)[]=[character];let where='character=?';
 const coordinate=query.trim().match(/^(-?\d{1,10})\s*,\s*(-?\d{1,10})$/);
 if(coordinate){where+=' AND x=? AND y=?';params.push(Number(coordinate[1]),Number(coordinate[2]));}
 else if(query.trim()){
  where+=" AND (value LIKE ? ESCAPE '\\' OR CAST(x AS TEXT)||', '||CAST(y AS TEXT) LIKE ? ESCAPE '\\')";
  const term='%'+query.trim().replace(/[\\%_]/g,c=>'\\'+c)+'%';params.push(term,term);
 }
 const change={acquisitions:'acquired',replacements:'replaced',losses:'lost',uses:'consumed'}[filter];
 if(change){where+=" AND EXISTS(SELECT 1 FROM json_each(COALESCE(json_extract(visits.value,'$.event.stateChanges'),'[]')) changes WHERE json_extract(changes.value,'$.type')=?)";params.push(change);}
 else if(filter==='relics'){where+=" AND json_extract(value,'$.event.relic.text') IS NOT NULL";}
 else if(filter!=='all'){const kinds={deaths:['death'],escapes:['escape'],transport:['portal','transport_pending'],encounters:['interaction','honor','treasure','acquisition']}[filter]!;where+=" AND json_extract(value,'$.event.kind') IN ("+kinds.map(()=>'?').join(',')+')';params.push(...kinds);}
 return {sql:'SELECT id,x,y,value,at FROM visits WHERE '+where+' ORDER BY at DESC,id DESC LIMIT 26 OFFSET ?',params:[...params,offset]};
}
