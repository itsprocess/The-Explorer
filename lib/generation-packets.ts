export async function readGenerationPackets(response:Response,onPacket?:(packet:any)=>void){
 if(!response.headers.get('content-type')?.includes('application/x-ndjson'))return response.json();
 if(!response.body)throw Error('Generation connection was interrupted. Retry to resume.');
 const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
 try{for(;;){const {done,value}=await reader.read();buffer+=decoder.decode(value,{stream:!done});
  let split:number;
  while((split=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,split);buffer=buffer.slice(split+1);if(!line.trim())continue;
   const packet=JSON.parse(line);onPacket?.(packet);
   if(packet.type==='complete'||packet.type==='error')return packet.data;
  }
  if(done)throw Error('Generation connection was interrupted. Retry to resume.');
 }}finally{reader.releaseLock();}
}
