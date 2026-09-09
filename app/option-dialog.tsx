"use client";
import {useEffect,useRef} from 'react';
export default function OptionDialog({setup,choices,busy,error,onChoose,onWait}:{setup?:string;choices:{label:string}[];busy:boolean;error?:string;onWait?:()=>void;onChoose:(index:number)=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=ref.current;dialog?.showModal();return()=>dialog?.close();},[]);
 return <dialog ref={ref} className="about-dialog option-dialog" aria-labelledby="option-title" onCancel={e=>e.preventDefault()}><div className="about-content"><h2 id="option-title">Choose your action</h2>{setup&&<p className="encounter-setup">{setup}</p>}<div className="option-actions">{choices.map((choice,i)=><button key={i} disabled={busy} onClick={()=>onChoose(i)}>{choice.label}</button>)}</div>{onWait&&<button className="option-wait" disabled={busy} onClick={onWait}>Wait</button>}{busy&&<p role="status">Resolving your choice…</p>}{error&&<p role="alert">{error}</p>}</div></dialog>;
}
