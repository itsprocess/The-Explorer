import {generationStream,awaitGenerated} from '../../../lib/generation-stream';
import {checkOrigin,errorResponse} from '../../../lib/auth';
import {requireCharacter} from '../../../lib/character-auth';
import {characterRow} from '../../../lib/game';
import {readPackage,AppError} from '../../../lib/server';
import {cellKey,type CellPackage} from '../../../lib/generation';
import {ensureImage} from '../../../lib/location-images';
export async function POST(request:Request){try{
 checkOrigin(request);const session=await requireCharacter(request);
 if(!request.headers.get('content-type')?.includes('application/json'))throw new AppError('JSON required.',415);
 const raw=await request.text();if(raw.length>1024)throw new AppError('Request too large.',413);
 let body:any;try{body=JSON.parse(raw);}catch{throw new AppError('Invalid JSON.');}
 const c=JSON.parse((await characterRow(session.owner,session.id)).value);
 if(!body||body.x!==c.x||body.y!==c.y)throw new AppError('Only your current location can request an illustration.',403);
 const p=await readPackage<CellPackage>(cellKey(c.x,c.y));if(!p)throw new AppError('Load the location first.',409);
 return generationStream(async()=>({url:(await awaitGenerated(()=>ensureImage(p))).url}),request);
 }catch(e){return errorResponse(e);}}
