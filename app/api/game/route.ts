import {requireOwner,checkOrigin,errorResponse} from '../../../lib/auth';
import {AppError} from '../../../lib/server';
import {snapshot,createCharacter,moveCharacter} from '../../../lib/game';
import {directions,type Direction} from '../../../lib/world';
export async function GET(request:Request){try{const owner=await requireOwner(),url=new URL(request.url);const offset=Number(url.searchParams.get('offset')||0);if(!Number.isInteger(offset)||offset<0)throw new AppError('Invalid history offset.');return Response.json(await snapshot(owner,url.searchParams.get('character')||undefined,offset));}catch(e){return errorResponse(e);}}
export async function POST(request:Request){try{checkOrigin(request);const owner=await requireOwner();if(!request.headers.get('content-type')?.includes('application/json'))throw new AppError('JSON input required.',415);const raw=await request.text();if(raw.length>4096)throw new AppError('Request too large.',413);const body=JSON.parse(raw);if(typeof body.requestId!=='string'||!/^[-a-zA-Z0-9_]{8,80}$/.test(body.requestId))throw new AppError('A valid request ID is required.');
 if(body.action==='create'){const name=String(body.name||'').trim();if(!name||name.length>40||/[\x00-\x1f]/.test(name))throw new AppError('Choose a name between 1 and 40 characters.');return Response.json(await createCharacter(owner,name,body.requestId));}
 if(typeof body.character!=='string')throw new AppError('Choose a character first.');
 if(body.action==='return')return Response.json(await moveCharacter(owner,body.character,body.requestId,'return'));
 if(body.action==='move'&&Object.hasOwn(directions,body.direction))return Response.json(await moveCharacter(owner,body.character,body.requestId,body.direction as Direction));
 throw new AppError('Unknown journey action.');}catch(e){return errorResponse(e);}}
