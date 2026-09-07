import {auth as configAuth} from '../explorer.config.json';
import {db,AppError} from './server';
import {tokenHash,characterName} from './passwords';
const COOKIE='explorer_character';
const TTL=configAuth.sessionDays*24*60*60*1000;
export async function reserveLegacyNames(){
 const rows=(await db().prepare('SELECT c.id,c.value FROM characters c LEFT JOIN character_credentials a ON a.character=c.id WHERE a.character IS NULL ORDER BY c.id').all<{id:string;value:string}>()).results;
 for(const row of rows){const original=JSON.parse(row.value).name;let key:string;try{key=characterName(original).key;}catch{key=original.trim().toLowerCase();}
  await db().prepare('INSERT OR IGNORE INTO character_credentials(character,name_key,password_hash,created) VALUES(?,?,NULL,?)').bind(row.id,key,Date.now()).run();
 }
}
function cookieToken(request:Request){return request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';}
export async function characterSession(request:Request){
 const token=cookieToken(request);if(!/^[0-9a-f]{64}$/.test(token))return null;
 return db().prepare('SELECT c.id,c.owner FROM character_sessions s JOIN characters c ON c.id=s.character WHERE s.token_hash=? AND s.expires>?').bind(await tokenHash(token),Date.now()).first<{id:string;owner:string}>();
}
export async function requireCharacter(request:Request){const session=await characterSession(request);if(!session)throw new AppError('Log in to a character.',401);return session;}
export async function newSession(character:string,request:Request){
 const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
 await db().prepare('INSERT INTO character_sessions(token_hash,character,expires) VALUES(?,?,?)').bind(await tokenHash(token),character,Date.now()+TTL).run();
 return COOKIE+'='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age='+TTL/1000+(new URL(request.url).protocol==='https:'?'; Secure':'');
}
export async function logout(request:Request){const token=cookieToken(request);if(token)await db().prepare('DELETE FROM character_sessions WHERE token_hash=?').bind(await tokenHash(token)).run();return COOKIE+'=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'+(new URL(request.url).protocol==='https:'?'; Secure':'');}
export async function throttle(request:Request,nameKey:string){
 const now=Date.now(),window=Math.floor(now/configAuth.attemptWindowMs),ip=request.headers.get('cf-connecting-ip')||'local';
 const keys=[['name:'+await tokenHash(nameKey),configAuth.nameAttempts],['ip:'+await tokenHash(ip),configAuth.ipAttempts]] as const;
 for(const [key,limit] of keys){const bucket=key+':'+window;const row=await db().prepare('INSERT INTO auth_attempts(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(bucket,(window+1)*configAuth.attemptWindowMs).first<{count:number}>();if((row?.count??0)>limit)throw new AppError('Too many attempts. Try again in 10 minutes.',429);}
 await db().batch([db().prepare('DELETE FROM auth_attempts WHERE expires<?').bind(now),db().prepare('DELETE FROM character_sessions WHERE expires<?').bind(now)]);
}
