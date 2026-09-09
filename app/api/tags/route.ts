import {requireCharacter} from '../../../lib/character-auth';
import {checkOrigin,errorResponse} from '../../../lib/auth';
import {db,AppError} from '../../../lib/server';
import {checkCoordinate} from '../../../lib/world';
import {tileIcons,tileTagPrefix} from '../../../lib/tile-tags';
export async function GET(request:Request){try{
 const c=await requireCharacter(request);
 const rows=(await db().prepare('SELECT value FROM server_settings WHERE key >= ? AND key < ?').bind(tileTagPrefix(c.id),tileTagPrefix(c.id)+'~').all<{value:string}>()).results;
 return Response.json({tags:rows.map(r=>JSON.parse(r.value))},{headers:{'Cache-Control':'private, no-store'}});
}catch(e){return errorResponse(e);}}
export async function POST(request:Request){try{
 checkOrigin(request);const c=await requireCharacter(request),raw=await request.text();if(raw.length>256)throw new AppError('Request too large.',413);
 const {x,y,icon}=JSON.parse(raw);checkCoordinate(x,y);if(icon!==null&&!tileIcons.some(i=>i.id===icon))throw new AppError('Choose a valid marker.');
 const key=tileTagPrefix(c.id)+x+':'+y;
 if(icon===null)await db().prepare('DELETE FROM server_settings WHERE key=?').bind(key).run();
 else await db().prepare('INSERT INTO server_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key,JSON.stringify({x,y,icon})).run();
 return Response.json({x,y,icon},{headers:{'Cache-Control':'private, no-store'}});
}catch(e){return errorResponse(e);}}
