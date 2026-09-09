import {checkOrigin,errorResponse} from '../../../lib/auth';
import {requireCharacter} from '../../../lib/character-auth';
import {characterRow} from '../../../lib/game';
import {db,AppError} from '../../../lib/server';
import {serverStatsSQL,localPlayersSQL} from '../../../lib/community';
export async function POST(request:Request){try{
 checkOrigin(request);const session=await requireCharacter(request),raw=await request.text();
 if(raw.length>256)throw new AppError('Request too large.',413);
 let body:any;try{body=JSON.parse(raw);}catch{throw new AppError('Invalid request.');}
 const c=JSON.parse((await characterRow(session.owner,session.id)).value);
 if(c.devState){await db().prepare('DELETE FROM character_presence WHERE character=?').bind(c.id).run();return Response.json({x:c.devState.x,y:c.devState.y,nearby:[],stats:await db().prepare(serverStatsSQL).first()},{headers:{'Cache-Control':'no-store'}});}
 if(body?.x!==c.x||body?.y!==c.y)throw new AppError('The character has moved.',409);
 const now=Date.now();await db().prepare('INSERT INTO character_presence(character,seen) VALUES(?,?) ON CONFLICT(character) DO UPDATE SET seen=excluded.seen').bind(c.id,now).run();
 const [nearby,stats]=await Promise.all([
  db().prepare(localPlayersSQL).bind(now-90000,c.id,c.x,c.y).all(),
  db().prepare(serverStatsSQL).first(),
 ]);
 return Response.json({x:c.x,y:c.y,nearby:nearby.results,stats},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return errorResponse(e);}}
