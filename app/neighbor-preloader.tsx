"use client";
import {useEffect,useState} from 'react';
import {generationRequest} from '../lib/generation-request';
export default function NeighborPreloader({x,y,connections,imageReady}:{x:number;y:number;connections:Record<string,boolean>;imageReady:boolean}){
 const [ready,setReady]=useState<string[]>([]);
 const exits=Object.keys(connections).filter(d=>connections[d]).join(',');
 useEffect(()=>{let active=true;const controller=new AbortController();setReady([]);
  const directions=exits.split(',').filter(Boolean);
  void Promise.allSettled(directions.map(direction=>generationRequest('/api/preload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({x,y,direction,stage:'text'})},undefined,{signal:controller.signal,maxWaitMs:120000}))).then(results=>{if(active)setReady(directions.filter((_,i)=>results[i].status==='fulfilled'));});
  return()=>{active=false;controller.abort();};
 },[x,y,exits]);
 useEffect(()=>{if(!imageReady)return;let active=true;const controller=new AbortController();
  // Two background illustration requests at most; all text passes start immediately.
  const queue=[...ready];async function worker(){while(active&&queue.length){const direction=queue.shift();try{await generationRequest('/api/preload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({x,y,direction,stage:'image'})},undefined,{signal:controller.signal,maxWaitMs:180000});}catch{}}}
  void worker();void worker();return()=>{active=false;controller.abort();};
 },[x,y,imageReady,ready]);
 return null;
}
