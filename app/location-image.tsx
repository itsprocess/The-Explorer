"use client";
import {generationRequest} from '../lib/generation-request';
import {useEffect,useState} from 'react';
export default function LocationImage({x,y,title,savedUrl,pending,onReady,onFailure,retry=0}:{x:number;y:number;title:string;savedUrl?:string|null;pending?:boolean;onReady?:()=>void;onFailure?:(message:string)=>void;retry?:number}){
 const [url,setUrl]=useState(savedUrl||''),[error,setError]=useState(''),[attempt,setAttempt]=useState(0),[loaded,setLoaded]=useState(false);
 useEffect(()=>{const control=new AbortController();setUrl(savedUrl||'');setLoaded(false);setError('');
  // Retrying delivery reuses the saved image; it never asks for a second illustration.
  if(!savedUrl||attempt||retry)void generationRequest('/api/image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({x,y})},undefined,{signal:control.signal}).then(d=>{if(!control.signal.aborted)setUrl(d.url+(d.url.includes('?')?'&':'?')+'delivery='+attempt+'-'+retry);}).catch(e=>{if(!control.signal.aborted)setError(e.message);});
  return()=>control.abort();
 },[x,y,savedUrl,attempt,retry]);
 useEffect(()=>{if(error)onFailure?.(error);},[error,onFailure]);
 useEffect(()=>{if(loaded&&!error)onReady?.();},[loaded,error,onReady]);
 return <div className="image-frame">
  {url&&!error&&<img className="location-image" style={{display:loaded&&!pending?'block':'none'}} src={url} alt={title} onLoad={()=>setLoaded(true)} onError={()=>{setLoaded(false);setError('The image could not be loaded.');}}/>}
  {(pending||!loaded||error)&&<div className="image-placeholder">{error&&!pending?<><span>{error}</span><button onClick={()=>setAttempt(n=>n+1)}>Retry image</button></>:<span role="status"><span className="spinner" aria-hidden="true"/>Loading…</span>}</div>}
 </div>;
}
