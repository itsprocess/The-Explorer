"use client";
import {useEffect,useRef} from 'react';
import {Orbit} from 'lucide-react';
export default function TeleportDialog({pending,onConfirm}:{pending:{token:string;mechanism:string;narrative?:string};onConfirm:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{dialog.current?.showModal();return()=>dialog.current?.close();},[]);
 return <dialog ref={dialog} className="about-dialog teleport-dialog" aria-labelledby="teleport-title" onCancel={e=>e.preventDefault()}><div className="about-content"><Orbit size={40} aria-hidden="true"/><h2 id="teleport-title">An unexpected journey</h2>{pending.narrative&&<p>{pending.narrative}</p>}<p>You’ll be transported when you click OK.</p><button autoFocus className="primary" onClick={e=>{e.currentTarget.disabled=true;onConfirm();}}>Continue</button></div></dialog>;
}
