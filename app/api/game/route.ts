import {definingTraits} from '../../../lib/occurrences';
import {generationStream,awaitGenerated} from '../../../lib/generation-stream';
import {checkOrigin,errorResponse,canInspect} from '../../../lib/auth';
import {characterSession,requireCharacter} from '../../../lib/character-auth';
import {AppError} from '../../../lib/server';
import {snapshot,moveCharacter,confirmTransport,chooseOption,selectDefiningTrait} from '../../../lib/game';
import {directions,type Direction} from '../../../lib/world';
export async function GET(request:Request){try{
 const inspect=await canInspect();
 const session=await characterSession(request),url=new URL(request.url),offset=Number(url.searchParams.get('offset')||0);
 if(!Number.isInteger(offset)||offset<0)throw new AppError('Invalid history offset.');
 if(url.searchParams.has('character')&&url.searchParams.get('character')!==session?.id)throw new AppError('Log in to that character.',403);
 return generationStream(()=>awaitGenerated(()=>snapshot(session?.owner??'__guest__',session?.id,offset)).then(data=>({...data,canInspect:inspect})),request);
 }catch(e){return errorResponse(e);}}
export async function POST(request:Request){try{
 const inspect=await canInspect();
 checkOrigin(request);const session=await requireCharacter(request);
 if(!request.headers.get('content-type')?.includes('application/json'))throw new AppError('JSON required.',415);
 const raw=await request.text();if(raw.length>4096)throw new AppError('Request too large.',413);let body:any;try{body=JSON.parse(raw);}catch{throw new AppError('Invalid JSON.');}
 if(!body||typeof body!=='object'||Array.isArray(body))throw new AppError('Invalid request.');
 if(typeof body.requestId!=='string'||!/^[-a-zA-Z0-9_]{8,80}$/.test(body.requestId))throw new AppError('A valid request ID is required.');
 if(body.character&&body.character!==session.id)throw new AppError('Log in to that character.',403);
 if(body.action==='trait'){if(!definingTraits.includes(body.trait))throw new AppError('Choose a valid defining trait.');return generationStream(()=>selectDefiningTrait(session.owner,session.id,body.trait),request);}
 if(body.action==='option'){if(typeof body.visit!=='string'||body.visit.length>200||!Number.isInteger(body.choice))throw new AppError('Invalid option request.');return generationStream(()=>awaitGenerated(()=>chooseOption(session.owner,session.id,body.requestId,body.visit,body.choice)).then(data=>({...data,canInspect:inspect})),request);}
 if(body.action==='teleport'){if(typeof body.token!=='string'||body.token.length>200)throw new AppError('A teleport token is required.');return generationStream(()=>awaitGenerated(()=>confirmTransport(session.owner,session.id,body.requestId,body.token)).then(data=>({...data,canInspect:inspect})),request);}
 const direction=body.action==='return'?'return':body.action==='move'&&Object.hasOwn(directions,body.direction)?body.direction as Direction:null;
 if(!direction)throw new AppError('Unknown action.');
 return generationStream(()=>awaitGenerated(()=>moveCharacter(session.owner,session.id,body.requestId,direction)).then(data=>({...data,canInspect:inspect})),request);
 }catch(e){return errorResponse(e);}}
