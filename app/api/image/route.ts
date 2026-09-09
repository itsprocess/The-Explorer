import {generationStream} from '../../../lib/generation-stream';
import {checkOrigin,requireOwner,errorResponse} from '../../../lib/auth';
import {requireCharacter} from '../../../lib/character-auth';
import {characterRow} from '../../../lib/game';
import {readPackage,AppError,db} from '../../../lib/server';
import {cellKey,type CellPackage} from '../../../lib/generation';
import {ensureImage,imageStatus,imageKey} from '../../../lib/location-images';
export async function GET(request:Request){try{
 const session=await requireCharacter(request),c=JSON.parse((await characterRow(session.owner,session.id)).value);
 const url=new URL(request.url);if(Number(url.searchParams.get('x'))!==c.x||Number(url.searchParams.get('y'))!==c.y)throw new AppError('Only your current location can be checked.',403);
 return Response.json(await imageStatus(c.x,c.y),{headers:{'Cache-Control':'no-store'}});
}catch(e){return errorResponse(e);}}
export async function POST(request:Request){try{
 checkOrigin(request);await requireOwner();const session=await requireCharacter(request);
 const body:any=await request.json(),c=JSON.parse((await characterRow(session.owner,session.id)).value);
 if(body.force!==true||body.x!==c.x||body.y!==c.y)throw new AppError('Explicit Dev regeneration for the current cell is required.',403);
 const p=await readPackage<CellPackage>(cellKey(c.x,c.y));if(!p)throw new AppError('Load the location first.',409);
 const lock=imageKey(c.x,c.y)+':dev-lock',now=Date.now();
 const claimed=await db().prepare('INSERT INTO server_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value WHERE CAST(server_settings.value AS INTEGER)<?').bind(lock,String(now+300000),now).run();
 if(!claimed.meta.changes)throw new AppError('Image regeneration is already pending.',409);
 return generationStream(async()=>{try{return {status:'ready',url:(await ensureImage(p,true)).url};}finally{await db().prepare('DELETE FROM server_settings WHERE key=? AND value=?').bind(lock,String(now+300000)).run();}},request);
}catch(e){return errorResponse(e);}}
