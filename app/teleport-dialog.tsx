"use client";
import {useEffect,useRef} from 'react';
import {Orbit} from 'lucide-react';
export default function TeleportDialog({setup,pending,onConfirm,onWait,busy,error}:{setup?:string;pending:{token:string;mechanism:string;narrative?:string};onWait:()=>void;busy:boolean;error?:string;onConfirm:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{dialog.current?.showModal();return()=>dialog.current?.close();},[]);
 return <dialog ref={dialog} className="about-dialog teleport-dialog" aria-labelledby="teleport-title" onCancel={e=>e.preventDefault()}><div className="about-content"><Orbit size={40} aria-hidden="true"/><h2 id="teleport-title">An unexpected journey</h2>{(pending.narrative||setup)&&<p>{pending.narrative||setup}</p>}<div className="buttons"><button autoFocus className="primary" disabled={busy} onClick={onConfirm}>Continue</button><button disabled={busy} onClick={onWait}>Wait</button></div>{error&&<p role="alert">{error}</p>}</div></dialog>;
}
