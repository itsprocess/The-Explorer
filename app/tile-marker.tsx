"use client";
import {useEffect,useState} from 'react';
import {tileIcons} from '../lib/tile-tags';
import {appPath} from '../lib/app-path';
let pending:Promise<any>|null=null;
function loadTags(){return pending??(pending=fetch(appPath('/api/tags')).then(async r=>{if(!r.ok)return null;return r.json();}).finally(()=>{pending=null;}));}
export default function TileMarker({x,y}:{x:number;y:number}){
 const [value,setValue]=useState(''),[available,setAvailable]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true;const load=async()=>{try{const d:any=await loadTags();if(!d)return;if(active){setAvailable(true);setValue(d.tags.find((t:any)=>t.x===x&&t.y===y)?.icon??'');}}catch{}};void load();window.addEventListener('tile-tags-changed',load);return()=>{active=false;window.removeEventListener('tile-tags-changed',load);};},[x,y]);
 if(!available)return null;
 return <label className="tile-marker">My marker <select aria-label={'Personal marker for '+x+', '+y} disabled={busy} value={value} onChange={async e=>{setBusy(true);setError('');try{const r=await fetch(appPath('/api/tags'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({x,y,icon:e.target.value||null})});const d:any=await r.json();if(!r.ok)throw Error(d.error);setValue(d.icon??'');window.dispatchEvent(new Event('tile-tags-changed'));}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}><option value="">None</option>{tileIcons.map(i=><option key={i.id} value={i.id}>{i.icon} {i.label}</option>)}</select>{error&&<small role="alert">{error}</small>}</label>;
}
