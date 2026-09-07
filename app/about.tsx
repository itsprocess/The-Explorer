"use client";
import {useRef} from 'react';
export default function About(){
 const dialog=useRef<HTMLDialogElement>(null);
 return <><button onClick={()=>dialog.current?.showModal()}>About</button><dialog className="about-dialog" ref={dialog} aria-labelledby="about-title" onClick={e=>{if(e.target===dialog.current)dialog.current.close();}}>
 <div className="about-content"><div className="dialog-heading"><h2 id="about-title">The Explorer</h2><button aria-label="Close About" onClick={()=>dialog.current?.close()}>×</button></div>
 <p>A shared, endless world shaped by a seed and brought to life by AI. Each place is generated once, then remembered for everyone.</p>
 <p>Choose an open direction to explore. Encounters happen automatically. Teleports wait for your OK before taking you away. There are no stats, combat controls, or dialogue choices.</p>
 <p>Discover rare places, collect badges, and leave your misadventures in the world’s history. Death returns your next journey to the safe origin; your character keeps their badges and record.</p>
 <p>Share a location to let others view it without moving their character. Create another character to start a separate story.</p></div></dialog></>;
}
