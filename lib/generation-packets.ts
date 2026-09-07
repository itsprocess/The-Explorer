export async function readGenerationPackets(response:Response,onPacket?:(packet:any)=>void,signal?:AbortSignal){
 if(!response.headers.get('content-type')?.includes('application/x-ndjson'))return response.json();
 if(!response.body)throw Error('Generation connection was interrupted. Retry to resume.');
 const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
 const abort=()=>{void reader.cancel().catch(()=>{});};signal?.addEventListener('abort',abort,{once:true});
 try{for(;;){signal?.throwIfAborted();const {done,value}=await reader.read();signal?.throwIfAborted();buffer+=decoder.decode(value,{stream:!done});
  let split:number;
  while((split=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,split);buffer=buffer.slice(split+1);if(!line.trim())continue;
   const packet=JSON.parse(line);onPacket?.(packet);
   if(packet.type==='complete'||packet.type==='error')return packet.data;
  }
  if(done)throw Error('Generation connection was interrupted. Retry to resume.');
 }}finally{signal?.removeEventListener('abort',abort);reader.releaseLock();}
}
