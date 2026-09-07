"use client";
import {useEffect,useState} from 'react';
export default function LocationImage({x,y,title,savedUrl}:{x:number;y:number;title:string;savedUrl?:string|null}){
 const [url,setUrl]=useState(savedUrl||''),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;setUrl(savedUrl||'');setError('');
  if(!savedUrl)fetch('/api/image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({x,y})}).then(async r=>{const d:any=await r.json();if(!r.ok)throw Error(d.error||'Image unavailable.');if(active)setUrl(d.url);}).catch(e=>{if(active)setError(e.message);});
  return ()=>{active=false;};
 },[x,y,savedUrl,attempt]);
 return url?<img className="location-image" src={url} alt={title}/>:<div className="image-placeholder">{error?<><span>{error}</span><button onClick={()=>setAttempt(n=>n+1)}>Retry image</button></>:<span role="status"><span className="spinner" aria-hidden="true"/>Illustrating…</span>}</div>;
}
