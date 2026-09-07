import {readGenerationPackets} from './generation-packets';
type RetryOptions={signal?:AbortSignal;maxWaitMs?:number};
function pause(ms:number,signal?:AbortSignal){return new Promise<void>((resolve,reject)=>{
 const stop=()=>{clearTimeout(timer);signal?.removeEventListener('abort',stop);reject(new DOMException('Canceled','AbortError'));};
 const timer=setTimeout(()=>{signal?.removeEventListener('abort',stop);resolve();},ms);
 if(signal?.aborted)stop();else signal?.addEventListener('abort',stop,{once:true});
});}
// Reuse the movement body/id. Cancel retry loops when their view is gone, while an active request may finish caching.
export async function generationRequest(url:string,init?:RequestInit,afterPending?:string,options:RetryOptions={}){
 const deadline=Date.now()+(options.maxWaitMs??240000);let target=url,request=init,attempt=0;
 for(;;){
  options.signal?.throwIfAborted();
  const headers=new Headers(request?.headers);headers.set("Accept","application/x-ndjson");
  let response:Response,data:any;
  const controller=new AbortController(),abort=()=>controller.abort(options.signal?.reason);
  options.signal?.addEventListener('abort',abort,{once:true});
  const timer=setTimeout(()=>controller.abort(new Error('This location is taking too long. Retry to continue from its saved progress.')),Math.max(1,deadline-Date.now()));
  try{response=await fetch(target,{...request,headers,signal:controller.signal});data=await readGenerationPackets(response,undefined,controller.signal);}
  finally{clearTimeout(timer);options.signal?.removeEventListener('abort',abort);}
  options.signal?.throwIfAborted();
  if(data.code!=='generation_pending'){if(response.ok&&!data.error)return data;throw Object.assign(Error(data.error||'Request failed.'),{code:data.code});}
  if(Date.now()>=deadline)throw Error('This location is taking too long. Retry to continue from its saved progress.');
  if(afterPending&&target!==afterPending){target=afterPending;request=undefined;continue;}
  await pause(Math.min(10000,3000+attempt++*1000),options.signal);
 }
}
