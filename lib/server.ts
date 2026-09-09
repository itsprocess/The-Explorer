import {timing as configTiming, world as configWorld} from '../explorer.config.json';
import {env,waitUntil} from 'cloudflare:workers';
import {VERSION} from './world';
export type Bindings={DB:D1Database;IMAGES:R2Bucket;OPENAI_API_KEY?:string;OPENAI_MODEL?:string;OPENAI_IMAGE_MODEL?:string;ADMIN_EMAIL?:string;DEV_PASSWORD?:string;WORLD_SEED?:string};
export const bindings=()=>env as unknown as Bindings;
export const background=(job:Promise<unknown>)=>waitUntil(job.catch(()=>{}));
export const db=()=>bindings().DB;
export const worldSeed=()=>bindings().WORLD_SEED||configWorld.seed;
import {AppError} from './app-error';
export {AppError} from './app-error';
// Deployment migration queues retired images. Idempotent deletion survives interrupted requests.
export async function removeRetiredImages(){
 const rows=await db().prepare("SELECT key,value FROM server_settings WHERE key LIKE 'retired-image:%' LIMIT 1000").all<{key:string;value:string}>();
 if(!rows.results.length)return;
 const retired=rows.results.filter(r=>r.value.startsWith(r.key.slice('retired-image:'.length).replace(/image:-?\d+:-?\d+$/, 'illustrations/'))&&r.value.includes(':illustrations/'));
 if(retired.length!==rows.results.length)throw Error('Invalid retired image reference.');
 await bindings().IMAGES.delete(retired.map(r=>r.value));
 await db().batch(retired.map(r=>db().prepare('DELETE FROM server_settings WHERE key=? AND value=?').bind(r.key,r.value)));
 if(rows.results.length===1000)await removeRetiredImages();
}
export async function readPackage<T=any>(key:string):Promise<T|null>{
 await finishDevImageReset();
 await removeRetiredImages();
 const row=await db().prepare('SELECT value FROM packages WHERE key=?').bind(key).first<{value:string|null}>();if(row?.value)return JSON.parse(row.value);
 return null;
}
// Cross-isolate lease and compare-and-swap publication. A crashed stage can be retried.
export async function remember<T>(key:string,kind:string,make:()=>Promise<T>):Promise<T>{
 const old=await readPackage<T>(key);if(old)return old;
 const token=crypto.randomUUID(),now=Date.now();
 await db().prepare('INSERT INTO packages(key,kind,value,token,lease,updated) VALUES(?,?,NULL,?,?,?) ON CONFLICT(key) DO UPDATE SET token=excluded.token,lease=excluded.lease,updated=excluded.updated WHERE packages.value IS NULL AND (packages.lease < ? OR packages.updated < ?)').bind(key,kind,token,now+configTiming.packageLeaseMs,now,now,now-configTiming.packageLeaseMs).run();
 const lock=await db().prepare('SELECT token,value FROM packages WHERE key=?').bind(key).first<{token:string;value:string|null}>();
 if(lock?.value)return JSON.parse(lock.value);
 if(lock?.token!==token)throw new AppError('Loading this location…',409,'generation_pending');
 const heartbeat=setInterval(()=>{const now=Date.now();void db().prepare('UPDATE packages SET lease=?,updated=? WHERE key=? AND token=? AND value IS NULL').bind(now+configTiming.packageLeaseMs,now,key,token).run().catch(()=>{});},configTiming.packageHeartbeatMs);
 try{const value=await make();const result=await db().prepare('UPDATE packages SET value=?,token=NULL,lease=0,updated=? WHERE key=? AND token=? AND value IS NULL').bind(JSON.stringify(value),Date.now(),key,token).run();if(!result.meta.changes){const winner=await readPackage<T>(key);if(winner)return winner;throw new AppError('Loading this location…',409,'generation_pending');}return value;}
 catch(e){await db().prepare('UPDATE packages SET token=NULL,lease=0 WHERE key=? AND token=?').bind(key,token).run();throw e;}
 finally{clearInterval(heartbeat);}
}
export const namespace=()=>worldSeed()+':'+VERSION+':'+((bindings() as Bindings&{WORLD_EPOCH?:string}).WORLD_EPOCH?((bindings() as Bindings&{WORLD_EPOCH?:string}).WORLD_EPOCH+':'):'');

// A one-time owner-requested bucket purge. Block new generation until it is complete.
export async function finishDevImageReset(){
 const key='dev-image-reset-20260908',now=Date.now(),lease=String(now+60000);
 const row=await db().prepare('SELECT value FROM server_settings WHERE key=?').bind(key).first<{value:string}>();if(!row)return;
 const claimed=await db().prepare('UPDATE server_settings SET value=? WHERE key=? AND CAST(value AS INTEGER)<?').bind(lease,key,now).run();
 if(!claimed.meta.changes)throw new AppError('Finishing the dev reset…',409,'generation_pending');
 try{
  for(let page=0;page<20;page++){
   const objects=await bindings().IMAGES.list({limit:1000});
   if(!objects.objects.length){await db().prepare('DELETE FROM server_settings WHERE key=? AND value=?').bind(key,lease).run();return;}
   await bindings().IMAGES.delete(objects.objects.map(o=>o.key));
  }
  throw new AppError('Finishing the dev reset…',409,'generation_pending');
 }finally{await db().prepare('UPDATE server_settings SET value=0 WHERE key=? AND value=?').bind(key,lease).run();}
}
