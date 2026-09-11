"use client";
import {useState} from 'react';
import {appPath} from '../lib/app-path';
type Record={id:string;at:number;text:string;choice?:string};
export default function DeathRecords({character,count}:{character:string;count:number}){
 const [rows,setRows]=useState<Record[]>([]),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[more,setMore]=useState(false),[error,setError]=useState('');
 async function load(){if(busy)return;setBusy(true);setError('');try{
 const response=await fetch(appPath('/api/deaths')+'?character='+encodeURIComponent(character)+'&offset='+rows.length);
 if(!response.ok)throw Error('Could not load death records.');const data=await response.json() as {records:Record[];hasMore:boolean};
 setRows(old=>[...old,...data.records]);setMore(data.hasMore);setLoaded(true);
 }catch{setError('Could not load death records.');}finally{setBusy(false);}}
 return <details className="death-records" onToggle={e=>{if(e.currentTarget.open&&!loaded&&!busy)void load();}}>
 <summary>Deaths ({count})</summary>
 {rows.map(r=><article className="death-record" key={r.id}><time dateTime={new Date(r.at).toISOString()}>{new Date(r.at).toLocaleDateString()}</time>{r.choice&&<p className="muted">Choice: {r.choice}</p>}<p>{r.text}</p></article>)}
 {loaded&&!rows.length&&<p className="muted">No deaths recorded.</p>}{error&&<p role="alert">{error}</p>}
 {busy&&<p className="muted">Loading deaths…</p>}{!busy&&(more||error)&&<button onClick={()=>void load()}>{error?'Retry':'Show more'}</button>}
 </details>;
}
