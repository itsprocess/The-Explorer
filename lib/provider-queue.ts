import {queue as configQueue} from '../explorer.config.json';
import {assertProviderReady} from './provider-health';
import {db,namespace,AppError} from './server';
import {generationScope} from './generation-scope';
import {claimJobSQL,queueCapacity} from './queue-store';
const pause=(ms:number)=>new Promise(r=>setTimeout(r,ms));
type Job={status:string;result:string|null;lease:number;available:number;attempts:number;error:string|null;priority:number};
export async function promoteGeneration(scope:string){
 if(generationScope().priority>=10)await db().prepare("UPDATE generation_jobs SET priority=10 WHERE scope=? AND status!='complete'").bind(scope).run();
}
export async function queuedProvider<T>(lane:'text'|'image',request:unknown,make:()=>Promise<T>):Promise<T>{
 const signature=JSON.stringify(request),digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(signature));
 const id=namespace()+lane+':'+Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
 const {priority,scope}=generationScope(),start=Date.now(),token=crypto.randomUUID();
 await db().prepare(`INSERT INTO generation_jobs(id,lane,scope,request,status,priority,created,touched) VALUES(?,?,?,?,'queued',?,?,?)
 ON CONFLICT(id) DO UPDATE SET priority=MAX(priority,excluded.priority),touched=excluded.touched`).bind(id,lane,scope,signature,priority,start,start).run();
 while(Date.now()-start<configQueue.waitTimeoutMs){
  const now=Date.now();
  const row=await db().prepare('SELECT status,result,lease,available,attempts,error,priority FROM generation_jobs WHERE id=?').bind(id).first<Job>();
  if(!row)throw new AppError('The world changed. Refresh to continue.',409);
  if(row.status==='complete')return JSON.parse(row.result!);
  await assertProviderReady();
  if(row.status==='failed'&&row.available>now)throw new AppError(row.error||'Generation will retry shortly.',502);
  await db().prepare("UPDATE generation_jobs SET status='queued',touched=? WHERE id=? AND status!='complete' AND lease<?").bind(now,id,now).run();
  const claim=await db().prepare(claimJobSQL).bind(token,now+configQueue.leaseMs,now,id,now,now,lane,now,queueCapacity(lane,row.priority),now,now-10000).run();
  if(!claim.meta.changes){await pause(800+Math.random()*400);continue;}
  const heartbeat=setInterval(()=>{void db().prepare("UPDATE generation_jobs SET lease=?,touched=? WHERE id=? AND token=? AND status='running'").bind(Date.now()+configQueue.leaseMs,Date.now(),id,token).run().catch(()=>{});},configQueue.heartbeatMs);
  try{
   await assertProviderReady();
   const result=await make();
   const saved=await db().prepare("UPDATE generation_jobs SET result=?,status='complete',token=NULL,lease=0,error=NULL,touched=? WHERE id=? AND token=?").bind(JSON.stringify(result),Date.now(),id,token).run();
   if(saved.meta.changes)return result;
  }catch(e){
   // Do not fan out retries during provider errors. A later request resumes this receipt.
   const message=e instanceof AppError?e.message:'Generation interrupted. Retry shortly.';
   await db().prepare("UPDATE generation_jobs SET status='failed',token=NULL,lease=0,available=?,error=?,touched=? WHERE id=? AND token=?").bind(Date.now()+configQueue.failureCooldownMs,message,Date.now(),id,token).run();
   throw e;
  }finally{clearInterval(heartbeat);}
 }
 throw new AppError('Generation is queued. Please retry shortly.',409,'generation_pending');
}
