"use client";
import {useEffect} from 'react';
import {generationRequest} from '../lib/generation-request';
export default function NeighborPreloader({x,y,connections,pendingTransport}:{x:number;y:number;connections:Record<string,boolean>;imageReady?:boolean;pendingTransport?:string}){
 const exits=Object.keys(connections).filter(d=>connections[d]).join(',');
 useEffect(()=>{
  const controller=new AbortController();
  // Each neighbor independently advances text → art. No slow sibling barrier.
  for(const direction of (pendingTransport?['transport']:exits.split(',').filter(Boolean))){
   void generationRequest('/api/preload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({x,y,direction,stage:'all'})},undefined,{signal:controller.signal,maxWaitMs:360000}).catch(()=>{});
  }
  // An already-started stream may finish caching after movement; never discovers it.
  return()=>controller.abort();
 },[x,y,exits,pendingTransport]);
 return null;
}
