import {requireCharacter} from '../../../lib/character-auth';
import {errorResponse} from '../../../lib/auth';
import {db,AppError} from '../../../lib/server';
import {explorersQuery} from '../../../lib/community';
export async function GET(request:Request){try{
 await requireCharacter(request);
 const offset=Number(new URL(request.url).searchParams.get('offset')||0);
 let query;try{query=explorersQuery(offset);}catch{throw new AppError('Invalid explorer page.');}
 const rows=(await db().prepare(query.sql).bind(...query.params).all<{id:string;name:string;trait:string|null}>()).results;
 return Response.json({explorers:rows.slice(0,50),hasMore:rows.length>50},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return errorResponse(e);}}
