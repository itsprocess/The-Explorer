import {timing as configTiming,queue as configQueue} from '../explorer.config.json';
import {publicFailure} from './app-error';
type Packet={type:string;[key:string]:unknown};
// Keep the response alive while provider calls await I/O; no detached waitUntil job.
export function generationStream(run:(send:(packet:Packet)=>void)=>Promise<unknown>,request?:Request){
 if(request&&!request.headers.get('accept')?.includes('application/x-ndjson'))return run(()=>{}).then(data=>Response.json(data,{headers:{'Cache-Control':'no-store'}})).catch(e=>{const failure=publicFailure(e);return Response.json(failure,{status:failure.status,headers:{'Cache-Control':'no-store'}});});
 const encoder=new TextEncoder();let closed=false,timer:ReturnType<typeof setInterval>;
 const body=new ReadableStream<Uint8Array>({
  start(controller){
   const send=(packet:Packet)=>{if(!closed)controller.enqueue(encoder.encode(JSON.stringify(packet)+'\n'));};
   send({type:'accepted'});timer=setInterval(()=>send({type:'heartbeat'}),10000);
   void run(send).then(data=>send({type:'complete',data})).catch(e=>send({type:'error',data:publicFailure(e)})).finally(()=>{clearInterval(timer);if(!closed){closed=true;controller.close();}});
  },
  cancel(){closed=true;clearInterval(timer);}
 });
 return new Response(body,{headers:{'Content-Type':'application/x-ndjson','Cache-Control':'no-store, no-transform','X-Content-Type-Options':'nosniff'}});
}
export async function awaitGenerated<T>(make:()=>Promise<T>){
 const deadline=Date.now()+configQueue.waitTimeoutMs;
 for(;;){try{return await make();}catch(e:any){if(e.code!=='generation_pending'||Date.now()>deadline)throw e;await new Promise(r=>setTimeout(r,700+Math.random()*500));}}
}
