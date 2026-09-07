import {requireCharacter} from '../../../lib/character-auth';
import {errorResponse} from '../../../lib/auth';
import {db,AppError} from '../../../lib/server';
import {historyQuery} from '../../../lib/history-search';
export async function GET(request:Request){try{
 const url=new URL(request.url);
 // Explicit character IDs expose only the same history already public on shared profiles.
 const character=url.searchParams.get('character')||(await requireCharacter(request)).id;
 if(!/^[a-zA-Z0-9-]{1,80}$/.test(character))throw new AppError('Invalid character.');
 const offset=Number(url.searchParams.get('offset')||0),q=url.searchParams.get('q')||'',filter=url.searchParams.get('filter')||'all';
 let query;try{query=historyQuery(character,q,filter,offset);}catch{throw new AppError('Invalid history search.');}
 const rows=(await db().prepare(query.sql).bind(...query.params).all<{id:string;x:number;y:number;value:string;at:number}>()).results;
 return Response.json({history:rows.slice(0,25).map(r=>({id:r.id,x:r.x,y:r.y,at:r.at,...JSON.parse(r.value).event})),hasMore:rows.length>25,offset},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return errorResponse(e);}}
