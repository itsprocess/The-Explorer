// Retry only a generation lease, keeping the original movement request ID/body.
export async function generationRequest(url:string,init?:RequestInit,afterPending?:string){
 const deadline=Date.now()+12*60_000;
 let target=url,options=init;
 for(;;){
  const response=await fetch(target,options),data:any=await response.json();
  if(response.ok)return data;
  if(data.code!=='generation_pending')throw Error(data.error||'Request failed.');
  if(Date.now()>=deadline)throw Error('This location is taking longer than expected. Please reload to continue.');
  if(afterPending){target=afterPending;options=undefined;}
  await new Promise(resolve=>setTimeout(resolve,3000));
 }
}
