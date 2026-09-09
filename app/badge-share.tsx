"use client";
import {useState} from 'react';
export default function BadgeShare({title}:{title:string}){const [message,setMessage]=useState('');return <div><button onClick={async()=>{try{if(navigator.share)await navigator.share({title,url:location.href});else{await navigator.clipboard.writeText(location.href);setMessage('Link copied.');}}catch(e){if((e as Error).name!=='AbortError')setMessage('Copy this page’s address to share it.');}}}>Share achievement</button><span role="status">{message}</span></div>;}
