import {env} from 'cloudflare:workers';
import {VERSION} from './world';
export type Bindings={DB:D1Database;IMAGES:R2Bucket;OPENAI_API_KEY?:string;OPENAI_MODEL?:string;OPENAI_IMAGE_MODEL?:string;WORLD_SEED?:string};
export const bindings=()=>env as unknown as Bindings;
export const db=()=>bindings().DB;
export const worldSeed=()=>bindings().WORLD_SEED||'the-explorer-first-world';
export class AppError extends Error{constructor(message:string,public status=400,public code?:string){super(message);}}
// Deployment migration queues retired images. Idempotent deletion survives interrupted requests.
export async function removeRetiredImages(){
 const rows=await db().prepare("SELECT key,value FROM server_settings WHERE key LIKE 'retired-image:%' LIMIT 1000").all<{key:string;value:string}>();
 if(!rows.results.length)return;
 const retired=rows.results.filter(r=>r.value.startsWith(worldSeed()+':world-')&&r.value.includes(':illustrations/')&&!r.value.startsWith(namespace()));
 if(retired.length!==rows.results.length)throw Error('Invalid retired image reference.');
 await bindings().IMAGES.delete(retired.map(r=>r.value));
 await db().batch(retired.map(r=>db().prepare('DELETE FROM server_settings WHERE key=? AND value=?').bind(r.key,r.value)));
 if(rows.results.length===1000)await removeRetiredImages();
}
export async function readPackage<T=any>(key:string):Promise<T|null>{
 await removeRetiredImages();
 const row=await db().prepare('SELECT value FROM packages WHERE key=?').bind(key).first<{value:string|null}>();if(row?.value)return JSON.parse(row.value);
 return null;
}
// Cross-isolate lease and compare-and-swap publication. A crashed stage can be retried.
export async function remember<T>(key:string,kind:string,make:()=>Promise<T>):Promise<T>{
 const old=await readPackage<T>(key);if(old)return old;
 const token=crypto.randomUUID(),now=Date.now();
 await db().prepare('INSERT INTO packages(key,kind,value,token,lease,updated) VALUES(?,?,NULL,?,?,?) ON CONFLICT(key) DO UPDATE SET token=excluded.token,lease=excluded.lease,updated=excluded.updated WHERE packages.value IS NULL AND packages.lease < ?').bind(key,kind,token,now+600000,now,now).run();
 const lock=await db().prepare('SELECT token,value FROM packages WHERE key=?').bind(key).first<{token:string;value:string|null}>();
 if(lock?.value)return JSON.parse(lock.value);
 if(lock?.token!==token)throw new AppError('Loading this location…',409,'generation_pending');
 try{const value=await make();const result=await db().prepare('UPDATE packages SET value=?,token=NULL,lease=0,updated=? WHERE key=? AND token=? AND value IS NULL').bind(JSON.stringify(value),Date.now(),key,token).run();if(!result.meta.changes){const winner=await readPackage<T>(key);if(winner)return winner;throw new AppError('Generation ownership changed. Please retry.',409);}return value;}
 catch(e){await db().prepare('UPDATE packages SET token=NULL,lease=0 WHERE key=? AND token=?').bind(key,token).run();throw e;}
}
export const namespace=()=>worldSeed()+':'+VERSION+':';
