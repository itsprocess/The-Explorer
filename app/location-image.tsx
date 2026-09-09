"use client";
import {appPath} from '../lib/app-path';
import {useEffect,useRef,useState} from 'react';
export default function LocationImage({x,y,title,savedUrl,onReady,onFailure,retry=0}:{x:number;y:number;title:string;savedUrl?:string|null;pending?:boolean;onReady?:()=>void;onFailure?:(message:string)=>void;retry?:number}){
 const [url,setUrl]=useState(savedUrl||''),[status,setStatus]=useState('checking'),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 const img=useRef<HTMLImageElement>(null);
 useEffect(()=>{let active=true,timer:ReturnType<typeof setTimeout>|undefined;const control=new AbortController();setError('');setUrl(savedUrl||'');
  if(savedUrl){setStatus('ready');return;}
  const check=async()=>{try{const r=await fetch(appPath(`/api/image?x=${x}&y=${y}`),{signal:control.signal,cache:'no-store'});const data:any=await r.json();if(!r.ok)throw Error(data.error||'Could not check image.');if(!active)return;setStatus(data.status);if(data.url)setUrl(data.url);else if(data.status==='pending')timer=setTimeout(check,2500);}catch(e){if(active){setStatus('missing');setError((e as Error).message);}}};
  void check();return()=>{active=false;control.abort();if(timer)clearTimeout(timer);};
 },[x,y,savedUrl,attempt,retry]);
 useEffect(()=>{if(url&&img.current?.complete&&img.current.naturalWidth)onReady?.();},[url,onReady]);
 return <div className="image-frame">{url&&!error?<img ref={img} className="location-image" src={appPath(url)} alt={title} onLoad={()=>onReady?.()} onError={()=>{setError('Image delivery failed.');onFailure?.('Image delivery failed.');}}/>:<div className="image-placeholder">{status==='pending'?<span role="status"><span className="spinner" aria-hidden="true"/>Illustration is being generated…</span>:<><span>{error||'No illustration available yet.'}</span><button onClick={()=>setAttempt(n=>n+1)}>Refresh image status</button></>}</div>}</div>;
}
