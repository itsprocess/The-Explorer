import {checkOrigin,errorResponse,requireSiteOwner} from '../../../../lib/auth';
import {requireCharacter,cookieToken,throttle} from '../../../../lib/character-auth';
import {bindings,db,AppError} from '../../../../lib/server';
import {tokenHash} from '../../../../lib/passwords';
export async function POST(request:Request){try{
 checkOrigin(request);await requireSiteOwner();const session=await requireCharacter(request);
 await throttle(request,'dev-unlock:'+session.id);
 const raw=await request.text();if(raw.length>512)throw new AppError('Request too large.',413);
 let body;try{body=JSON.parse(raw);}catch{throw new AppError('Invalid request.');}
 const secret=bindings().DEV_PASSWORD;if(!secret)throw new AppError('Dev unlock is not configured.',503);
 if(typeof body?.password!=='string'||body.password.length>128)throw new AppError('Incorrect Dev password.',403);
 const a=await tokenHash(body.password),b=await tokenHash(secret);let difference=0;for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);
 if(difference)throw new AppError('Incorrect Dev password.',403);
 await db().prepare('UPDATE character_sessions SET dev_unlocked=1 WHERE token_hash=? AND expires>?').bind(await tokenHash(cookieToken(request)),Date.now()).run();
 return Response.json({unlocked:true},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return errorResponse(e);}}
