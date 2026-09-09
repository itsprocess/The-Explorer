"use client";
import {appPath} from '../lib/app-path';
import {useEffect,useState} from 'react';
import PlayerMark from './player-mark';
export default function CommunityPanel({x,y}:{x:number;y:number}){
 const [data,setData]=useState<any>(null);
 useEffect(()=>{let live=true;const control=new AbortController();let timer:ReturnType<typeof setTimeout>;
  async function update(){try{if(document.visibilityState==='hidden')return;const r=await fetch(appPath('/api/community'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({x,y}),signal:control.signal});if(r.ok){const d=await r.json();if(live)setData(d);}}catch{}finally{if(live)timer=setTimeout(update,20000);}}
  void update();return()=>{live=false;control.abort();clearTimeout(timer);};
 },[x,y]);
 const number=(v:number|undefined)=>v==null?'—':v.toLocaleString(undefined,{maximumFractionDigits:1});
 return <aside className="community-panel"><section className="community-card"><h2>Players Here</h2>{data?data.nearby.length?<ul>{data.nearby.map((p:any)=><li key={p.id}><PlayerMark/><a href={appPath('/profile/')+p.id}>{p.name}</a></li>)}</ul>:<p className="muted">No other players here.</p>:<p className="muted">—</p>}</section>
 <section className="community-card"><h2>World</h2><dl>{[['Locations Visited',data?.stats.locations],['Total Moves',data?.stats.moves],['Total Deaths',data?.stats.deaths],['Furthest Distance',data?.stats.furthest],['Explorers',data?.stats.explorers??(data?0:undefined)]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{number(value)}</dd></div>)}</dl></section></aside>;
}
