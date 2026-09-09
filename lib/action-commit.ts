import type {Character} from './rules';
export type ActionResult={character:Character;event:{kind:string;text:string;newBadge:string|null;relic?:{text:string}}};
/** Execute together in one D1 batch: claim, character CAS and visit are one transaction. */
export function actionStatements(database:Pick<D1Database,'prepare'>,a:{id:string;owner:string;revision:number;op:string;now:number;x:number;y:number;winner:ActionResult;loser?:ActionResult;claim?:{key:string;relic?:boolean}}){
 const {id,owner,revision,op,now,x,y,winner,claim}=a,loser=a.loser??winner;
 const queries:D1PreparedStatement[]=[];
 if(claim){
  // Existing discoveries remain authoritative even if they predate global claims.
  const legacy=claim.relic?" AND NOT EXISTS(SELECT 1 FROM visits WHERE x=? AND y=? AND json_extract(value,'$.event.relic.text') IS NOT NULL)":'';
  queries.push(database.prepare('INSERT OR IGNORE INTO claims(key,character,operation,at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM characters WHERE id=? AND owner=? AND revision=?)'+legacy).bind(claim.key,id,op,now,id,owner,revision,...(claim.relic?[x,y]:[])));
 }
 const condition=claim?'EXISTS(SELECT 1 FROM claims WHERE key=? AND operation=?)':'1=1',params=claim?[claim.key,op]:[];
 queries.push(database.prepare('UPDATE characters SET value=CASE WHEN '+condition+' THEN ? ELSE ? END,revision=revision+1,last_op=?,updated=? WHERE id=? AND owner=? AND revision=?').bind(...params,JSON.stringify(winner.character),JSON.stringify(loser.character),op,now,id,owner,revision));
 queries.push(database.prepare('INSERT OR IGNORE INTO visits(id,character,x,y,value,at) SELECT ?,?,?,?,CASE WHEN '+condition+' THEN ? ELSE ? END,? WHERE EXISTS(SELECT 1 FROM characters WHERE id=? AND last_op=? AND revision=?)').bind(op,id,x,y,...params,JSON.stringify({event:winner.event}),JSON.stringify({event:loser.event}),now,id,op,revision+1));
 return {queries,updateIndex:claim?1:0};
}
