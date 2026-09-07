import {db} from './server';
import {generationScope} from './generation-scope';
import {tokenUsage,usageTotals} from './token-usage';
export async function providerFetch(lane:string,stage:string,model:string,url:string,init:RequestInit){
 const id=crypto.randomUUID(),started=Date.now();
 await db().prepare('INSERT INTO generation_usage(id,scope,lane,stage,model,status,created) VALUES(?,?,?,?,?,?,?)').bind(id,generationScope().scope,lane,stage,model,'requested',started).run();
 try{
  const response=await fetch(url,init),payload:any=await response.json();
  await db().prepare('UPDATE generation_usage SET model=?,status=?,usage=?,duration=?,response_id=? WHERE id=?').bind(payload.model??model,String(response.status)+':'+(payload.status??(response.ok?'completed':'failed')),payload.usage?JSON.stringify(payload.usage):null,Date.now()-started,payload.id??response.headers.get('x-request-id'),id).run();
  return {response,payload};
 }catch(e){await db().prepare("UPDATE generation_usage SET status='interrupted',duration=? WHERE id=?").bind(Date.now()-started,id).run();throw e;}
}
export async function usageForCell(cell:string,regions:string[]){
 const scopes=[cell,cell.replace(/cell:(-?\d+):(-?\d+)$/,'image:$1:$2'),...regions];
 const result=await db().prepare('SELECT lane,stage,model,status,usage,created,duration,scope FROM generation_usage WHERE scope IN ('+scopes.map(()=>'?').join(',')+') ORDER BY created').bind(...scopes).all<any>();
 const rows=result.results.map(r=>({...r,shared:regions.includes(r.scope),usage:tokenUsage(r.usage?JSON.parse(r.usage):null)}));
 const cellRows=rows.filter(r=>!r.shared),sharedRows=rows.filter(r=>r.shared);
 return {cell:usageTotals(cellRows),sharedRegions:usageTotals(sharedRows),rows};
}
