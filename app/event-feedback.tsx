"use client";
import {useEffect,useRef,useState} from 'react';
import {Gift,Sparkles,Award,Skull,Orbit} from 'lucide-react';
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

 function unlock(){if(muted)return;try{audio.current??=new AudioContext();void audio.current.resume().catch(()=>{});}catch{}}
 function toggle(){const next=!muted;setMuted(next);try{localStorage.setItem('explorer-muted',next?'1':'0');}catch{}if(next)void audio.current?.suspend();}
 function show(before:any,after:any){const next=feedbackFor(before,after);if(!next||!next.id||last.current===next.id)return;last.current=next.id;setNotice(next);
  const ctx=audio.current;if(muted||!ctx||ctx.state!=='running')return;
  const notes=next.event?.kind==='death'?[330,247,165]:next.badges.length?[523,659,784,1047]:[440,659];
  notes.forEach((hz,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+i*.095;osc.type='sine';osc.frequency.value=hz;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.065,start+.012);gain.gain.exponentialRampToValueAtTime(.001,start+.24);osc.connect(gain);gain.connect(ctx.destination);osc.start(start);osc.stop(start+.25);osc.onended=()=>{osc.disconnect();gain.disconnect();};});
 }
 const popup=notice&&<FeedbackDialog notice={notice} dismiss={()=>setNotice(null)}/>;
 return {unlock,show,clear:()=>setNotice(null),popup,soundButton:<button type="button" aria-pressed={muted} aria-label={muted?'Unmute event sounds':'Mute event sounds'} onClick={toggle}>{muted?'Sound off':'Sound on'}</button>};
}

function FeedbackDialog({notice,dismiss}:{notice:any;dismiss:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{dialog.current?.showModal();return()=>dialog.current?.close();},[]);
 const awards=(notice.event?.stateChanges??[]).filter((c:any)=>c.type==='acquired');
 const death=notice.event?.kind==='death',transport=notice.event?.kind==='teleport';
 const Icon=death?Skull:transport?Orbit:awards.some((a:any)=>a.trait.kind==='possession')?Gift:awards.length?Sparkles:Award;
 const title=death?'Journey ended':transport?'Through the unknown':awards.length?awards.some((a:any)=>a.trait.kind==='possession')?'Something to carry':'You have changed':notice.badges.length?'Achievement earned':'Encounter';
 return <dialog ref={dialog} className={'event-popup event-reveal '+(death?'fallen':'')} aria-labelledby="event-reveal-title" onCancel={dismiss}>
  <button className="popup-close" aria-label="Dismiss notification" onClick={dismiss}>×</button>
  <Icon size={38} aria-hidden="true"/><h2 id="event-reveal-title">{title}</h2>
  {notice.event&&<p>{notice.event.text}</p>}
  {awards.map((a:any)=><div className="popup-badge" key={a.trait.id}>{a.trait.kind==='possession'?<Gift aria-hidden="true"/>:<Sparkles aria-hidden="true"/>}<div><b>{a.trait.name}</b><small>{a.trait.description}</small></div></div>)}
  {notice.badges.map((b:any)=><div className="popup-badge" key={b.id}><Award aria-hidden="true"/><div><b>{b.title}</b><small>{b.description}</small></div></div>)}
  <button className="primary" onClick={dismiss}>Continue</button>
 </dialog>;
}
