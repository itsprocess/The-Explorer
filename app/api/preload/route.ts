import {checkOrigin,errorResponse} from '../../../lib/auth';
import {requireCharacter} from '../../../lib/character-auth';
import {characterRow} from '../../../lib/game';
import {AppError,readPackage,worldSeed} from '../../../lib/server';
import {cellKey,ensureCell,type CellPackage} from '../../../lib/generation';
import {directions,connections,type Direction} from '../../../lib/world';
import {ensureImage} from '../../../lib/location-images';

export async function POST(request:Request){try{
 checkOrigin(request);const session=await requireCharacter(request);
 if(!request.headers.get('content-type')?.includes('application/json'))throw new AppError('JSON required.',415);
 const raw=await request.text();if(raw.length>1024)throw new AppError('Request too large.',413);
 let body:any;try{body=JSON.parse(raw);}catch{throw new AppError('Invalid JSON.');}
 const c=JSON.parse((await characterRow(session.owner,session.id)).value);
 if(!body||body.x!==c.x||body.y!==c.y||!c.alive)throw new AppError('The character has moved.',409);
 if(!Object.hasOwn(directions,body.direction)||!['text','image'].includes(body.stage))throw new AppError('Invalid preload.');
 const direction=body.direction as Direction;
 if(!connections(worldSeed(),c.x,c.y)[direction])throw new AppError('No passage.',403);
 if(!await readPackage(cellKey(c.x,c.y)))throw new AppError('Load the current location first.',409);
 const [dx,dy]=directions[direction],x=c.x+dx,y=c.y+dy;
 // Generation writes packages only. No movement, visit, global claim, or badge is resolved here.
 if(body.stage==='text')await ensureCell(x,y);
 else{const p=await readPackage<CellPackage>(cellKey(x,y));if(!p)throw new AppError('Text is not ready.',409);await ensureImage(p);}
 return Response.json({ready:true},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return errorResponse(e);}}
