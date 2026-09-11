import {db,AppError} from '../../../lib/server';
import {errorResponse} from '../../../lib/auth';
import {deathRecordsQuery} from '../../../lib/death-records';
export async function GET(request:Request){try{
 const url=new URL(request.url),id=url.searchParams.get('character')??'',offset=Number(url.searchParams.get('offset')??0);
 let query;try{query=deathRecordsQuery(id,offset);}catch{throw new AppError('Invalid death record request.');}
 if(!await db().prepare('SELECT id FROM characters WHERE id=?').bind(id).first())throw new AppError('Explorer not found.',404);
 const rows=(await db().prepare(query.sql).bind(...query.params).all()).results;
 return Response.json({records:rows.slice(0,25),hasMore:rows.length>25},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return errorResponse(e);}}
