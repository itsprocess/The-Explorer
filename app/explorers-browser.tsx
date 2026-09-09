"use client";
import {useEffect,useState} from 'react';
import {appPath} from '../lib/app-path';
export default function ExplorersBrowser(){
 const [offset,setOffset]=useState(0),[data,setData]=useState<{explorers:{id:string;name:string;trait:string|null}[];hasMore:boolean}|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(true);
 useEffect(()=>{const control=new AbortController();setBusy(true);setError('');fetch(appPath('/api/explorers?offset=')+offset,{signal:control.signal}).then(async r=>{const d:any=await r.json();if(!r.ok)throw Error(d.error);setData(d);}).catch(e=>{if(!control.signal.aborted)setError(e.message);}).finally(()=>{if(!control.signal.aborted)setBusy(false);});return()=>control.abort();},[offset]);
 return <section><h1>Explorers</h1>{error&&<p role="alert">{error}</p>}{busy&&<p className="muted">Loading explorers…</p>}<ul className="explorers-list" aria-busy={busy}>{data?.explorers.map(c=><li key={c.id}><a href={appPath('/profile/')+c.id}><strong>{c.name}</strong>{c.trait&&<span className="muted">{c.trait}</span>}</a></li>)}</ul>{!busy&&data&&!data.explorers.length&&<p>No explorers yet.</p>}<div className="buttons">{offset>0&&<button disabled={busy} onClick={()=>setOffset(n=>Math.max(0,n-50))}>Previous</button>}{data?.hasMore&&<button disabled={busy} onClick={()=>setOffset(n=>n+50)}>Next</button>}</div></section>;
}
