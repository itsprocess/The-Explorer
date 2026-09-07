"use client";
import {useEffect,useState,useRef,useCallback} from 'react';
import {locationConcealed} from '../lib/location-reveal';
import {generationRequest} from '../lib/generation-request';
import {useEventFeedback} from './event-feedback';
import NeighborPreloader from './neighbor-preloader';
import LocationImage from './location-image';
import {registerExplorerTools} from '../lib/webmcp';
export default function Explorer(){
 const feedback=useEventFeedback();
 const pendingFeedback=useRef<any>(null);
 const [state,setState]=useState<any>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[tab,setTab]=useState('explore'),[name,setName]=useState(''),[password,setPassword]=useState(''),[inspect,setInspect]=useState<any>(null);
 async function load(){const d:any=await generationRequest('/api/game');setState(d);return d;}
 useEffect(()=>{setBusy(true);load().catch(e=>setError(e.message)).finally(()=>setBusy(false));},[]);
 async function act(action:string,extra:Record<string,unknown>={}){
  feedback.unlock();feedback.clear();pendingFeedback.current=null;setTab('explore');
  setBusy(true);setError('');
  try{const d:any=await generationRequest('/api/game',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,requestId:crypto.randomUUID(),...extra})});pendingFeedback.current={before:state,after:d};setState(d);setInspect(null);return d;}
  catch(e:any){setError(e.message);}finally{setBusy(false);}
 }
 async function auth(action:string){
  setBusy(true);setError('');
  try{const d:any=await generationRequest('/api/character',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,name,password})},'/api/game');setState(d);setPassword('');setInspect(null);setTab('explore');}
  catch(e:any){setError(e.message);}finally{setBusy(false);}
 }
 async function workshop(){setTab('dev');setInspect(null);try{const r=await fetch('/api/workshop?x='+(state?.character?.x??0)+'&y='+(state?.character?.y??0));const d:any=await r.json();if(!r.ok)throw Error(d.error);setInspect(d);}catch(e:any){setError(e.message);}}
 const actions=useRef({load,act});actions.current={load,act};
 useEffect(()=>registerExplorerTools(async()=>{const s=await actions.current.load();return {character:s.character,location:s.cell?.scene,connections:s.connections};},async direction=>{const s=await actions.current.act('move',{direction});if(!s)throw Error('Move failed.');return {character:s.character,location:s.cell?.scene,event:s.lastEvent};}),[]);
 async function historyPage(offset:number){try{const r=await fetch('/api/game?offset='+offset);const d:any=await r.json();if(!r.ok)throw Error(d.error);setState(d);}catch(e:any){setError(e.message);}}
 const c=state?.character,cell=state?.cell,scene=cell?.scene;
 const locationKey=c?c.id+':'+c.x+':'+c.y:'';
 const [readyImage,setReadyImage]=useState(''),[imageFailure,setImageFailure]=useState<{key:string;message:string}|null>(null),[imageRetry,setImageRetry]=useState(0);
 const markImageReady=useCallback(()=>{setReadyImage(locationKey);setImageFailure(null);},[locationKey]);
 const markImageError=useCallback((message:string)=>setImageFailure({key:locationKey,message}),[locationKey]);
 const concealed=locationConcealed(!!c,busy,!!cell,locationKey,readyImage);
 useEffect(()=>{if(!concealed&&pendingFeedback.current){const {before,after}=pendingFeedback.current;pendingFeedback.current=null;feedback.show(before,after);}},[concealed,state]);
 return <main>{!concealed&&feedback.popup}{c?.alive&&cell&&<NeighborPreloader key={locationKey} x={c.x} y={c.y} connections={state.connections} imageReady={readyImage===locationKey}/>}
  <header className="masthead"><a className="brand" href="/">The Explorer</a><nav aria-label="Main" inert={concealed}><button className={tab==='explore'?'active':''} onClick={()=>{if(tab!=='explore')setReadyImage('');setTab('explore');}}>Explore</button>{c&&<button className={tab==='profile'?'active':''} onClick={()=>setTab('profile')}>Profile</button>}<button className={tab==='dev'?'active':''} onClick={workshop}>Dev</button></nav>{feedback.soundButton}{c&&<button disabled={busy} onClick={()=>auth('logout')}>Log out</button>}</header>
  {error&&<div className="error" role="alert">{error}{error.includes("Sign in with ChatGPT")&&<> <a href="/signin-with-chatgpt?return_to=/">Sign in</a></>}</div>}
  {!state&&!error?<div className="workspace"><section className="reading-pane"><div className="image-placeholder"><span role="status"><span className="spinner" aria-hidden="true"/>Loading…</span></div></section></div>:!c&&tab!=='dev'?<form className="auth" onSubmit={e=>{e.preventDefault();auth('login');}}>
   <h1>Character</h1><label htmlFor="name">Name</label><input id="name" autoComplete="username" minLength={2} maxLength={40} required value={name} onChange={e=>setName(e.target.value)}/>
   <label htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" minLength={8} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)}/>
   <div className="buttons"><button className="primary" disabled={busy}>Log in</button><button type="button" disabled={busy||name.trim().length<2||password.length<8} onClick={()=>auth('create')}>Create character</button></div>
  </form>:<div className={"workspace play-workspace"+(concealed?" is-loading":"")} aria-busy={concealed}>
   {concealed&&<div className="cell-loading-panel">{imageFailure?.key===locationKey&&!busy?<><p role="alert">{imageFailure.message}</p><button onClick={()=>{setImageFailure(null);setImageRetry(n=>n+1);}}>Retry image</button></>:<span role="status"><span className="spinner" aria-hidden="true"/>Loading…</span>}</div>}
   <div className="workspace-content" inert={concealed} aria-hidden={concealed}>
   {c&&<aside className="atlas"><div className="map" aria-label="Nearby cells">{Array.from({length:121},(_,i)=>{const x=c.x+i%11-5,y=c.y+Math.floor(i/11)-5;const m=state?.map?.find((p:any)=>p.x===x&&p.y===y);return <span key={i} title={x+', '+y} className={['map-cell',m?.exists?'open':'',m?.generated?'known':'',i===60?'current':''].join(' ')}>{i===60?<i className="map-dot"/>:x===0&&y===0?<i className="map-home"/>:null}</span>;})}</div><div className="coordinates">{c.x}, {c.y}</div>
   {c.alive?<nav className="directions" aria-label="Movement">{['north','west','east','south'].map(d=>state?.connections?.[d]?<button key={d} className={d} disabled={busy} onClick={()=>act('move',{direction:d})}>{d[0].toUpperCase()+d.slice(1)}</button>:<span key={d} className={d}/>)}</nav>:<button className="primary" disabled={busy} onClick={()=>act('return')}>Return to origin</button>}
   <a className="character-link" href={'/profile/'+c.id}>{c.name}</a></aside>}
   <section className="reading-pane" aria-busy={busy}>
    {tab==='explore'&&<><div className="location-heading"><h1>{scene?.title??''}</h1><div className="region-line">{cell?.regions?.map((r:any)=><span key={r.id}><span className="region-label">{r.kind[0].toUpperCase()+r.kind.slice(1)}: </span>{r.name}</span>)}</div></div>{cell&&<LocationImage key={c.id+":"+c.x+":"+c.y} x={c.x} y={c.y} title={scene?.title} savedUrl={cell.imageUrl} pending={busy} onReady={markImageReady} onFailure={markImageError} retry={imageRetry}/>}<div className="scene">{scene?.description?.split('\n').filter(Boolean).map((p:string,i:number)=><p key={i}>{p}</p>)}</div><div className="passages-card"><ul className="exits">{scene?.exits?.map((e:any)=><li key={e.direction}><strong>{e.direction[0].toUpperCase()+e.direction.slice(1)}</strong> — {e.description} <span className="glimpse">{e.glimpse}</span></li>)}</ul>{scene?.blocked?.length>0&&<ul className="blocked">{scene.blocked.map((b:any)=><li key={b.direction}><strong>{b.direction[0].toUpperCase()+b.direction.slice(1)}</strong> — {b.reason}</li>)}</ul>}</div>{state?.lastEvent&&state.lastEvent.kind!=="arrival"&&<div className={'encounter '+(!c?.alive?'death':'')}><p>{state.lastEvent.text}</p>{state.lastEvent.newBadge&&<small>Badge: {state.lastEvent.newBadge}</small>}</div>}{cell&&<a href={'/cell/'+c.x+'/'+c.y}>Share this location ↗</a>}</>}
    {tab==='profile'&&c&&<><h1>{c.name}</h1><h2>Badges</h2>{!state?.badges?.length&&<p className="muted">No badges yet.</p>}<div className="badges">{state.badges?.map((b:any)=><article className="badge" key={b.id}><strong>{b.title}</strong><p>{b.description}</p></article>)}</div><div className="stats"><div><span>Deaths</span><strong>{c.deaths}</strong></div><div><span>Furthest distance</span><strong>{c.furthest.toFixed(1)}</strong></div><div><span>Badges</span><strong>{state.badges?.length??0}</strong></div></div><details className="profile-history"><summary>History</summary>{state.history?.map((h:any)=><article className="encounter" key={h.id}><a href={'/cell/'+h.x+'/'+h.y}>{h.x}, {h.y}</a><p>{h.text}</p></article>)}<div className="buttons">{state.historyOffset>0&&<button onClick={()=>historyPage(state.historyOffset-25)}>Newer</button>}{state.historyHasMore&&<button onClick={()=>historyPage(state.historyOffset+25)}>Older</button>}</div></details><a href={'/profile/'+c.id}>Share profile ↗</a></>}
    {tab==='dev'&&<><h1>Generation</h1>{inspect?<>{Object.entries({pass1Prompt:'Pass 1 prompt',pass1Result:'Pass 1 result',pass2Prompt:'Pass 2 prompt',pass2Result:'Pass 2 result'}).map(([k,label])=><details key={k}><summary>{label}</summary><pre>{JSON.stringify(inspect[k],null,2)??'Not generated'}</pre></details>)}<h2>{inspect.context?.biome}</h2><div className="field-list">{inspect.ratings?.filter((r:any)=>r.kind==="feature"&&r.value>0).map((r:any)=><article key={r.id}><strong>{r.name}</strong><span>{r.value===1?"Present":Math.round(r.value*100)+"% strength"}</span><small>{r.recipe}</small></article>)}</div>{!inspect.ratings?.some((r:any)=>r.kind==="feature"&&r.value>0)&&<p>No special features.</p>}<details><summary>Baseline conditions</summary><div className="field-list">{inspect.ratings?.filter((r:any)=>r.kind==="baseline").map((r:any)=><article key={r.id}><strong>{r.name}</strong><span>{Math.round(r.value*100)}% · {r.low} → {r.high}</span><small>{r.recipe}</small></article>)}</div></details><details><summary>Absent features ({inspect.ratings?.filter((r:any)=>r.kind==="feature"&&r.value===0).length})</summary><div className="field-list">{inspect.ratings?.filter((r:any)=>r.kind==="feature"&&r.value===0).map((r:any)=><article key={r.id}><strong>{r.name}</strong><span>Absent</span><small>{r.recipe}</small></article>)}</div></details></>:null}</>}
   </section>
   </div>
  </div>}
 </main>;
}
