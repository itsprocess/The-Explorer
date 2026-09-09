"use client";
import {useEffect,useRef} from 'react';
export default function WelcomeDialog({onContinue,busy}:{onContinue:()=>void;busy:boolean}){
 const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close();},[]);
 return <dialog ref={ref} className="about-dialog" aria-labelledby="welcome-title" onCancel={e=>e.preventDefault()}><div className="about-content"><h2 id="welcome-title">Your first step</h2><p>Beyond the origin, every direction holds something new. Explore, make choices, and let your defining trait and discoveries shape the journey.</p><p>Mark places you want to find again—or avoid. Death ends a life, but your badges and history remain.</p><p>Good luck, explorer. See what’s over there.</p><button className="primary" disabled={busy} onClick={onContinue}>Set off</button></div></dialog>;
}
