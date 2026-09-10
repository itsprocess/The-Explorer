"use client";
import {useRef} from 'react';
import {Compass,Footprints,Sparkles,Heart} from 'lucide-react';
export default function About(){
 const dialog=useRef<HTMLDialogElement>(null);
 return <><button onClick={()=>dialog.current?.showModal()}>About</button><dialog className="about-dialog game-guide" ref={dialog} aria-labelledby="about-title" onClick={e=>{if(e.target===dialog.current)dialog.current.close();}}><div className="about-content">
 <div className="dialog-heading"><div><small>A shared world. Your own journey.</small><h2 id="about-title">The Explorer</h2></div><button aria-label="Close About" onClick={()=>dialog.current?.close()}>×</button></div>
 <p className="guide-intro">Every direction holds another place to discover. AI brings the world to life, and the places you find are remembered for everyone.</p>
 <section><h3><Compass aria-hidden="true" size={19}/> Follow your curiosity</h3><p>Peek along an open route, then step through. Places grow stranger farther from the origin. Teleports wait for your confirmation; their destination may be dangerous.</p></section>
 <section><h3><Sparkles aria-hidden="true" size={19}/> Meet the unexpected</h3><p>Choices pause travel until you answer. Two choices are available by default. An item or affiliation can unlock a bonus choice. Your defining trait also shapes outcomes. Items are single-use; Common, Rare and Legendary tiers determine what they can unlock. Discover relics, earn badges, and leave a story others may find.</p></section>
 <section><h3><Footprints aria-hidden="true" size={19}/> Make your own map</h3><p>Use private markers to remember places worth finding—or avoiding. The minimap distinguishes unexplored ground, places others discovered, and places you have visited. Shared location links let others look without moving.</p></section>
 <section><h3><Heart aria-hidden="true" size={19}/> Begin again</h3><p>Death ends a life, not your history. Return to the sanctuary with your defining trait, badges, standings and lifetime records intact. Most unused items are lost; those marked Survives Death remain. Personal locks stay unlocked, and deaths are recorded separately from badges. If stranded, choose “Give up this life” from your profile.</p></section>
 <button className="primary guide-close" onClick={()=>dialog.current?.close()}>Back to exploring</button>
 </div></dialog></>;
}
