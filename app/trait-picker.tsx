"use client";
import {definingTraits} from '../lib/occurrences';
const icons=['◆','♡','✧','➤','♞','☀','⛰','✦'];
export default function TraitPicker({value,onChange,disabled=false}:{value:string;onChange:(value:string)=>void;disabled?:boolean}){return <fieldset className="trait-picker" disabled={disabled}><legend>Defining trait</legend><p>Choose once for your account. This trait stays with you through every life.</p><div className="trait-choices">{definingTraits.map((trait,i)=><label key={trait} className={value===trait?'selected':''}><input type="radio" name="defining-trait" value={trait} checked={value===trait} onChange={()=>onChange(trait)}/><span aria-hidden="true">{icons[i]}</span><strong>{trait}</strong>{value===trait&&<small>Selected</small>}</label>)}</div></fieldset>;}
