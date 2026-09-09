"use client";
import TileMarker from './tile-marker';
import WelcomeDialog from './welcome-dialog';
import {tileIcons} from '../lib/tile-tags';
import {definingTraits} from '../lib/occurrences';
import {appPath} from '../lib/app-path';
import TokenUsagePanel from './token-usage-panel';
import CommunityPanel from './community-panel';
import OptionDialog from './option-dialog';
import TeleportDialog from './teleport-dialog';
import TraitDisplay,{PublicStateChanges} from './trait-display';
import HistoryBrowser from './history-browser';
import About from './about';
import PlayerMark from './player-mark';
import Passages from './passages';


import {useEffect,useState,useRef,useCallback} from 'react';
import {locationConcealed} from '../lib/location-reveal';
import {generationRequest} from '../lib/generation-request';
import {useEventFeedback} from './event-feedback';
import LocationImage from './location-image';
import {registerExplorerTools} from '../lib/webmcp';
export default function Explorer(){
 const feedback=useEventFeedback();
 const pendingFeedback=useRef<any>(null),retryAction=useRef<Record<string,unknown>|null>(null);
 const [warpX,setWarpX]=useState('0'),[warpY,setWarpY]=useState('0');
 const [definingTrait,setDefiningTrait]=useState<string>('');
 const [state,setState]=useState<any>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[tab,setTab]=useState('explore'),[name,setName]=useState(''),[password,setPassword]=useState(''),[inspect,setInspect]=useState<any>(null);
 async function load(){const d:any=await generationRequest(appPath('/api/game'));setState(d);return d;}
 useEffect(()=>{const changed=async()=>{try{const r=await fetch(appPath('/api/tags'));if(!r.ok)return;const d:any=await r.json();setState((old:any)=>old?{...old,map:old.map.map((m:any)=>({...m,icon:d.tags.find((t:any)=>t.x===m.x&&t.y===m.y)?.icon??null}))}:old);}catch{}};window.addEventListener('tile-tags-changed',changed);return()=>window.removeEventListener('tile-tags-changed',changed);},[]);
 useEffect(()=>{setBusy(true);load().catch(e=>setError(e.message)).finally(()=>setBusy(false));},[]);
 async function act(action:string,extra:Record<string,unknown>={}){
  feedback.unlock();feedback.clear();pendingFeedback.current=null;setTab('explore');
  setBusy(true);setError('');
  const body={action,requestId:crypto.randomUUID(),...extra};retryAction.current=body;
  try{const d:any=await generationRequest(appPath('/api/game'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});retryAction.current=null;pendingFeedback.current={before:state,after:d};setState(d);setInspect(null);return d;}
  catch(e:any){setError(e.message);}finally{setBusy(false);}
 }
 async function auth(action:string){
  retryAction.current=null;setBusy(true);setError('');
  try{const d:any=await generationRequest(appPath('/api/character'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,name,password,definingTrait})},appPath('/api/game'));setState(d);setPassword('');setInspect(null);setTab('explore');}
  catch(e:any){setError(e.message);}finally{setBusy(false);}
 }
 async function retryGeneration(forceResume=false){
  setBusy(true);const message=error||imageFailure?.message||'';setError('');setImageFailure(null);
  try{if(forceResume||(state?.canInspect&&/API credit|rate limited/.test(message))){const r=await fetch(appPath('/api/generation/retry'),{method:'POST'});if(!r.ok){const d:any=await r.json();throw Error(d.error);}}if(retryAction.current){const d=await generationRequest(appPath('/api/game'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(retryAction.current)});retryAction.current=null;pendingFeedback.current={before:state,after:d};setState(d);}else await load();setImageRetry(n=>n+1);if(tab==='dev')await workshop();}
  catch(e:any){setError(e.message);}finally{setBusy(false);}
 }
 async function workshop(){setTab('dev');setInspect(null);try{const r=await fetch(appPath('/api/workshop?x=')+(state?.character?.x??0)+'&y='+(state?.character?.y??0));const d:any=await r.json();if(!r.ok)throw Error(d.error);setInspect(d);}catch(e:any){setError(e.message);}}
 const actions=useRef({load,act});actions.current={load,act};
 useEffect(()=>registerExplorerTools(async()=>{const s=await actions.current.load();return {character:s.character,location:s.cell?.scene,connections:s.connections};},async direction=>{const s=await actions.current.act('move',{direction});if(!s)throw Error('Move failed.');return {character:s.character,location:s.cell?.scene,event:s.lastEvent};}),[]);
 async function historyPage(offset:number){try{const d:any=await generationRequest(appPath('/api/game?offset=')+offset);setState(d);}catch(e:any){setError(e.message);}}
 const c=state?.character,cell=state?.cell,scene=cell?.scene;
 useEffect(()=>{const key=c?.pendingTransport?.token||c?.pendingOption?.visit;if(key)feedback.curious(key);},[c?.pendingTransport?.token,c?.pendingOption?.visit]);
 const locationKey=c?c.id+':'+c.x+':'+c.y:'';
 const [readyImage,setReadyImage]=useState(''),[imageFailure,setImageFailure]=useState<{key:string;message:string}|null>(null),[imageRetry,setImageRetry]=useState(0);

 const markImageReady=useCallback(()=>{setReadyImage(locationKey);setImageFailure(null);},[locationKey]);
 const markImageError=useCallback((message:string)=>setImageFailure({key:locationKey,message}),[locationKey]);
 const concealed=tab==='explore'&&locationConcealed(!!c,busy,!!cell,locationKey,readyImage);
 useEffect(()=>{if(tab==='explore'&&!concealed&&pendingFeedback.current){const {before,after}=pendingFeedback.current;pendingFeedback.current=null;feedback.show(before,after);}},[concealed,state]);
 return <main>{state?.needsIntro&&cell&&!busy&&<WelcomeDialog busy={busy} onContinue={()=>act('intro')}/>} {tab==='explore'&&!concealed&&feedback.popup}{tab==='explore'&&!concealed&&c?.pendingTransport&&<TeleportDialog key={c.pendingTransport.token} pending={c.pendingTransport} setup={state.encounterSetup} onConfirm={()=>act('teleport',{token:c.pendingTransport.token})}/>}
  {c&&!c.definingTrait&&<section><h2>Choose your permanent defining trait</h2>{definingTraits.map(t=><button key={t} disabled={busy} onClick={()=>act('trait',{trait:t})}>{t}</button>)}</section>}{c?.pendingOption&&state?.optionChoices&&<OptionDialog key={c.pendingOption.visit} choices={state.optionChoices} setup={state.encounterSetup} busy={busy} error={error} onChoose={choice=>act('option',{choice,visit:c.pendingOption.visit})}/>}<header className="masthead"><a className="brand" href={appPath('/')}>The Explorer</a><nav aria-label="Main" inert={concealed&&!error&&!imageFailure}><button className={tab==='explore'?'active':''} onClick={()=>{if(tab!=='explore')setReadyImage('');setTab('explore');}}>Explore</button>{c&&<button className={tab==='profile'?'active':''} onClick={()=>setTab('profile')}>Profile</button>}{(!state||state.canInspect)&&<button className={tab==='dev'?'active':''} onClick={workshop}>Dev</button>}</nav>{feedback.soundButton}<About/>{c&&<button disabled={busy} onClick={()=>auth('logout')}>Log out</button>}</header>{state?.devMode&&<div className="dev-travel-banner">Dev travel: discoveries and your real run are unchanged. <button disabled={busy} onClick={()=>act('dev_exit')}>Return to normal</button></div>}
  {error&&!concealed&&<div className="error" role="alert">{error} <button disabled={busy} onClick={()=>retryGeneration()}>Retry generation</button>{error.includes("Sign in with ChatGPT")&&<> <a href="/signin-with-chatgpt?return_to=/">Sign in</a></>}</div>}
  {!state&&!error?<div className="workspace"><section className="reading-pane"><div className="image-placeholder"><span role="status"><span className="spinner" aria-hidden="true"/>Loading…</span></div></section></div>:!c&&tab!=='dev'?<form className="auth" onSubmit={e=>{e.preventDefault();auth('login');}}>
   <h1>Character</h1><label htmlFor="name">Name</label><input id="name" autoComplete="username" minLength={2} maxLength={40} required value={name} onChange={e=>setName(e.target.value)}/>
   <label htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" minLength={8} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)}/>
   <label>Defining trait (permanent for a new account)<select value={definingTrait} onChange={e=>setDefiningTrait(e.target.value)}><option value="" disabled>Choose once for this account</option>{definingTraits.map(t=><option key={t}>{t}</option>)}</select></label><div className="buttons"><button className="primary" disabled={busy}>Log in</button><button type="button" disabled={busy||!definingTrait||name.trim().length<2||password.length<8} onClick={()=>auth('create')}>Create character</button></div>
  </form>:<div className={"workspace play-workspace"+(concealed?" is-loading":"")} aria-busy={concealed}>
   {concealed&&<div className="cell-loading-panel">{!busy&&(error||imageFailure?.key===locationKey)?<><p role="alert">{error||imageFailure?.message}</p><button onClick={()=>retryGeneration()}>Retry generation</button></>:<span role="status"><span className="spinner" aria-hidden="true"/>Loading…</span>}</div>}
   <div className="workspace-content" inert={concealed} aria-hidden={concealed}>
   {c&&<aside className="atlas"><div className="map" aria-label="Nearby cells">{Array.from({length:121},(_,i)=>{const x=c.x+i%11-5,y=c.y+Math.floor(i/11)-5;const m=state?.map?.find((p:any)=>p.x===x&&p.y===y);return <span key={i} title={x+', '+y+' · '+(m?.visited?'Visited by you':m?.generated?'Discovered by others':'Unexplored')} className={['map-cell',m?.exists?'open':'',m?.generated?'known':'',m?.visited?'visited':'',i===60?'current':''].join(' ')}>{m?.icon&&<b className="map-tag" aria-label={tileIcons.find(t=>t.id===m.icon)?.label}>{tileIcons.find(t=>t.id===m.icon)?.icon}</b>}{i===60?<i className="map-dot"/>:x===0&&y===0?<i className="map-home"/>:null}</span>;})}</div><div className="map-legend"><span>Unexplored</span><span>Others</span><span>You</span></div><div className="coordinates">{c.x}, {c.y}</div><TileMarker x={c.x} y={c.y}/>
   {(c.alive||state?.devMode)?<nav className="directions" aria-label="Movement">{['north','west','east','south'].map(d=>state?.connections?.[d]?<button key={d} className={d} disabled={busy||!!c.pendingTransport} onClick={()=>act('move',{direction:d})}>{d[0].toUpperCase()+d.slice(1)}</button>:<span key={d} className={d}/>)}</nav>:<button className="primary" disabled={busy} onClick={()=>act('return')}>Return to origin</button>}
   <a className="character-link" href={appPath('/profile/')+c.id}>{c.name}</a></aside>}
   <section className="reading-pane" aria-busy={busy}>
    {tab==='explore'&&<><div className="location-heading"><h1>{scene?.title??''}</h1>{state?.tileMemory?.discoverer&&<small className="discovery-credit">Discovered by <a href={appPath('/profile/')+state.tileMemory.discoverer.id}>{state.tileMemory.discoverer.name}</a></small>}<div className="region-line">{cell?.regions?.map((r:any)=><span key={r.id}><span className="region-label">{r.kind[0].toUpperCase()+r.kind.slice(1)}: </span>{r.name}</span>)}</div></div>{cell&&<LocationImage key={c.id+":"+c.x+":"+c.y} x={c.x} y={c.y} title={scene?.title} savedUrl={cell.imageUrl} pending={busy} onReady={markImageReady} onFailure={markImageError} retry={imageRetry}/>}<div className="scene">{scene?.description?.split('\n').filter(Boolean).map((p:string,i:number)=><p key={i}>{p}</p>)}</div>{state?.tileMemory?.imprint&&<div className="scene shared-imprint"><small>A lasting trace</small><p>{state.tileMemory.imprint}</p></div>}<Passages exits={scene?.exits??[]} blocked={scene?.blocked??[]} onMove={c?.alive?direction=>act('move',{direction}):undefined} disabled={busy||!!c?.pendingTransport}/>{state?.lastEvent&&state.lastEvent.kind!=="arrival"&&<div className={'encounter player-record '+(!c?.alive?'death':'')}><PlayerMark/><p>{state.lastEvent.text}</p><PublicStateChanges kind={state.lastEvent.kind} changes={state.lastEvent.stateChanges}/>{state.lastEvent.newBadge&&<small>Badge: {state.lastEvent.newBadge}</small>}</div>}{cell&&<a href={appPath('/cell/')+c.x+'/'+c.y}>Share this location ↗</a>}</>}
    {tab==='profile'&&c&&<><h1>{c.name}</h1><p>Defining trait: {c.definingTrait??'Not yet selected'}</p><h2>Badges</h2>{!state?.badges?.length&&<p className="muted">No badges yet.</p>}<div className="badges">{state.badges?.map((b:any)=><article className="badge" key={b.id}><strong>{b.title}</strong><p>{b.description}</p></article>)}</div><div className="stats"><div><span>Deaths</span><strong>{c.deaths}</strong></div><div><span>Furthest Distance</span><strong>{c.furthest.toFixed(1)}</strong></div><div><span>Badges</span><strong>{state.badges?.length??0}</strong></div></div><TraitDisplay traits={state.traits} character={c.id}/><HistoryBrowser character={c.id}/><a href={appPath('/profile/')+c.id}>Share profile ↗</a></>}
    {tab==='dev'&&<><h1>Generation</h1><section className="dev-controls" aria-label="Developer travel and images">{tab==='dev'&&state?.canInspect&&<form className="warp-controls" onSubmit={e=>{e.preventDefault();act('dev_warp',{x:Number(warpX),y:Number(warpY)});}}><label><span>X coordinate</span><input type="number" step="1" required value={warpX} onChange={e=>setWarpX(e.target.value)}/></label><label><span>Y coordinate</span><input type="number" step="1" required value={warpY} onChange={e=>setWarpY(e.target.value)}/></label><button disabled={busy||!c}>Warp without discovery</button></form>}{tab==='dev'&&state?.canInspect&&c&&<button disabled={busy} onClick={async()=>{setBusy(true);setError('');try{const result:any=await generationRequest(appPath('/api/image'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({x:c.x,y:c.y,force:true})});setState((old:any)=>({...old,cell:{...old.cell,imageUrl:result.url}}));}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>Regenerate current image</button>}</section>{inspect?<><TokenUsagePanel data={inspect.usage}/>{inspect.providerPause&&<div className="error"><p>{inspect.providerPause.message}</p><button disabled={busy} onClick={()=>retryGeneration(true)}>Retry generation</button></div>}{inspect.diagnostic&&<details><summary>Generation diagnostics</summary><pre>{JSON.stringify(JSON.parse(inspect.diagnostic.value),null,2)}</pre></details>}{Object.entries({pass1Prompt:'Local preparation (no tokens)',pass2Prompt:'Scene prompt',pass2Result:'Scene result',imagePackage:'Image generation'}).map(([k,label])=><details key={k}><summary>{label}</summary><pre>{JSON.stringify(inspect[k],null,2)??'Not generated'}</pre></details>)}<h2>{inspect.context?.biome}</h2><div className="field-list">{inspect.ratings?.filter((r:any)=>r.kind==="feature"&&r.value>0).map((r:any)=><article key={r.id}><strong>{r.name}</strong><span>{r.value===1?"Present":Math.round(r.value*100)+"% strength"}</span><small>{r.recipe}</small></article>)}</div>{!inspect.ratings?.some((r:any)=>r.kind==="feature"&&r.value>0)&&<p>No special features.</p>}<details><summary>Baseline conditions</summary><div className="field-list">{inspect.ratings?.filter((r:any)=>r.kind==="baseline").map((r:any)=><article key={r.id}><strong>{r.name}</strong><span>{Math.round(r.value*100)}% · {r.low} → {r.high}</span><small>{r.recipe}</small></article>)}</div></details><details><summary>Absent features ({inspect.ratings?.filter((r:any)=>r.kind==="feature"&&r.value===0).length})</summary><div className="field-list">{inspect.ratings?.filter((r:any)=>r.kind==="feature"&&r.value===0).map((r:any)=><article key={r.id}><strong>{r.name}</strong><span>Absent</span><small>{r.recipe}</small></article>)}</div></details></>:null}</>}
   </section>
   {c&&tab==='explore'&&<CommunityPanel key={locationKey} x={c.x} y={c.y}/>}
   </div>
  </div>}
 </main>;
}
