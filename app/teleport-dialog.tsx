"use client";
import {useEffect,useRef} from 'react';
export default function TeleportDialog({pending,onConfirm}:{pending:{token:string;mechanism:string};onConfirm:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{dialog.current?.showModal();return()=>dialog.current?.close();},[]);
 return <dialog ref={dialog} className="about-dialog teleport-dialog" aria-labelledby="teleport-title" onCancel={e=>e.preventDefault()}><div className="about-content"><h2 id="teleport-title">An unexpected journey</h2><p>{pending.mechanism[0].toUpperCase()+pending.mechanism.slice(1)} awaits.</p><p>You’ll be transported when you click OK.</p><button autoFocus className="primary" onClick={e=>{e.currentTarget.disabled=true;onConfirm();}}>OK</button></div></dialog>;
}
