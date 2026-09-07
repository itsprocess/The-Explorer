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
  const response=await fetch(target,request),data:any=await response.json();
  options.signal?.throwIfAborted();
  if(data.code!=='generation_pending'){if(response.ok)return data;throw Error(data.error||'Request failed.');}
  if(Date.now()>=deadline)throw Error('This location is taking too long. Retry to continue from its saved progress.');
  if(afterPending){target=afterPending;request=undefined;}
  await pause(Math.min(10000,3000+attempt++*1000),options.signal);
 }
}
