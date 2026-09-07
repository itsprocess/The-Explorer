"use client";
import {useEffect,useRef,useState} from 'react';
export function feedbackFor(before:any,after:any){
 const ids=new Set((before?.badges??[]).map((b:any)=>b.id));
 const badges=(after?.badges??[]).filter((b:any)=>!ids.has(b.id));
 const event=after?.lastEvent;
 const notable=event&&!['arrival','return','revisit','transport_pending'].includes(event.kind);
 return notable||badges.length?{id:after.history?.[0]?.id,event:notable?event:null,badges}:null;
}
export function useEventFeedback(){
 const [notice,setNotice]=useState<any>(null),[muted,setMuted]=useState(false);
 const audio=useRef<AudioContext|null>(null),last=useRef<string|undefined>(undefined);
 useEffect(()=>{try{setMuted(localStorage.getItem('explorer-muted')==='1');}catch{}return ()=>{void audio.current?.close();};},[]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(null),9000);const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')setNotice(null);};window.addEventListener('keydown',escape);return()=>{clearTimeout(timer);window.removeEventListener('keydown',escape);};},[notice]);
 function unlock(){if(muted)return;try{audio.current??=new AudioContext();void audio.current.resume().catch(()=>{});}catch{}}
 function toggle(){const next=!muted;setMuted(next);try{localStorage.setItem('explorer-muted',next?'1':'0');}catch{}if(next)void audio.current?.suspend();}
 function show(before:any,after:any){const next=feedbackFor(before,after);if(!next||!next.id||last.current===next.id)return;last.current=next.id;setNotice(next);
  const ctx=audio.current;if(muted||!ctx||ctx.state!=='running')return;
  const notes=next.event?.kind==='death'?[330,247,165]:next.badges.length?[523,659,784,1047]:[440,659];
  notes.forEach((hz,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+i*.095;osc.type='sine';osc.frequency.value=hz;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.065,start+.012);gain.gain.exponentialRampToValueAtTime(.001,start+.24);osc.connect(gain);gain.connect(ctx.destination);osc.start(start);osc.stop(start+.25);osc.onended=()=>{osc.disconnect();gain.disconnect();};});
 }
 const popup=notice&&<aside className={'event-popup '+(notice.event?.kind==='death'?'fallen':'')} role="status" aria-live="polite" aria-atomic="true"><button className="popup-close" aria-label="Dismiss notification" onClick={()=>setNotice(null)}>×</button><strong>{notice.event?.kind==='death'?'Journey ended':notice.badges.length?'Badge earned':'Encounter'}</strong>{notice.event&&<p>{notice.event.text}</p>}{notice.badges.map((b:any)=><div className="popup-badge" key={b.id}><span aria-hidden="true">◆</span><div><b>{b.title}</b><small>{b.description}</small></div></div>)}</aside>;
 return {unlock,show,clear:()=>setNotice(null),popup,soundButton:<button type="button" aria-pressed={muted} aria-label={muted?'Unmute event sounds':'Mute event sounds'} onClick={toggle}>{muted?'Sound off':'Sound on'}</button>};
}
