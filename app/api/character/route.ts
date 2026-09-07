import {db,AppError} from '../../../lib/server';
import {checkOrigin,errorResponse} from '../../../lib/auth';
import {characterName,checkPassword,hashPassword,verifyPassword} from '../../../lib/passwords';
import {newSession,logout,throttle,reserveLegacyNames} from '../../../lib/character-auth';
import {createCharacter,snapshot} from '../../../lib/game';
import {getChatGPTUser} from '../../chatgpt-auth';
export async function POST(request:Request){try{
 checkOrigin(request);if(!request.headers.get('content-type')?.includes('application/json'))throw new AppError('JSON required.',415);
 const raw=await request.text();if(raw.length>4096)throw new AppError('Request too large.',413);let body:any;try{body=JSON.parse(raw);}catch{throw new AppError('Invalid JSON.');}
 if(!body||typeof body!=='object'||Array.isArray(body))throw new AppError('Invalid request.');
 if(body.action==='logout')return Response.json(await snapshot('__guest__'),{headers:{'Set-Cookie':await logout(request),'Cache-Control':'no-store'}});
 if(!['login','create'].includes(body.action))throw new AppError('Unknown action.');
 let identity:{name:string;key:string};try{identity=characterName(body.name);checkPassword(body.password);}catch(e){throw new AppError((e as Error).message);}
 await throttle(request,identity.key);await reserveLegacyNames();
 const credential=await db().prepare('SELECT a.character,a.password_hash,c.owner FROM character_credentials a JOIN characters c ON c.id=a.character WHERE a.name_key=?').bind(identity.key).first<{character:string;password_hash:string|null;owner:string}>();
 let account:{id:string;owner:string};
 if(body.action==='create'){
  if(credential){
   // A pre-password character can only be secured by its original platform owner.
   const platform=await getChatGPTUser();
   if(credential.password_hash||platform?.userId!==credential.owner)throw new AppError('That character name is already taken.',409);
   const update=await db().prepare('UPDATE character_credentials SET password_hash=? WHERE character=? AND password_hash IS NULL').bind(await hashPassword(body.password),credential.character).run();if(!update.meta.changes)throw new AppError('That character name is already taken.',409);
   account={id:credential.character,owner:credential.owner};
  }else account=await createCharacter(identity.name,identity.key,await hashPassword(body.password));
 }else{
  if(!credential?.password_hash){if(credential&&!credential.password_hash&&(await getChatGPTUser())?.userId===credential.owner)throw new AppError('This existing character needs a password. Use Create with this name to set one.',409);throw new AppError('Incorrect name or password.',401);}
  if(!await verifyPassword(body.password,credential.password_hash))throw new AppError('Incorrect name or password.',401);
  account={id:credential.character,owner:credential.owner};
 }
 const cookie=await newSession(account.id,request);
 try{return Response.json(await snapshot(account.owner,account.id),{headers:{'Set-Cookie':cookie,'Cache-Control':'no-store'}});}
 catch(e){const response=errorResponse(e);response.headers.set('Set-Cookie',cookie);return response;}
 }catch(e){return errorResponse(e);}}
