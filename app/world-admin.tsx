'use client';
import {useEffect,useState} from 'react';
import {appPath} from '../lib/app-path';
export default function WorldAdmin(){
 const [status,setStatus]=useState<any>(null),[confirm,setConfirm]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{fetch(appPath('/api/world-admin')).then(async r=>{if(r.ok)setStatus(await r.json());}).catch(()=>{});},[]);
 if(!status?.available)return null;
 async function reset(){setBusy(true);setMessage('');try{
  const r=await fetch(appPath('/api/world-admin'),{method:'POST',headers:{'X-Explorer-Confirm':confirm}});const d=await r.json() as {error?:string;cleanupWarning?:boolean};
  if(!r.ok)throw Error(d.error||'Reset failed.');
  setConfirm('');setStatus({...status,seedChangePending:false});
  setMessage('World reset. Accounts and logins preserved. Reload the page to return to the origin.'+(d.cleanupWarning?' Some obsolete image files could not be removed.':''));
 }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 return <section className="card"><h2>World Administration</h2><p>Set <code>WORLD_SEED</code> in your hosting environment variables, then restart. Reset the world below to apply it. No rebuild is needed.</p><p>{status.seedChangePending?'A different seed is ready for the next reset.':'A reset will use the current configured seed.'}</p><details><summary>Wipe World</summary><p>This permanently clears locations, images, history, badges, possessions, status, and world statistics. All characters return alive to the origin. Accounts, passwords, and login sessions are preserved.</p><label>Type WIPE WORLD to confirm <input value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="off"/></label><button disabled={busy||confirm!=='WIPE WORLD'} onClick={reset}>{busy?'Resetting…':'Wipe World — Keep Accounts'}</button></details>{message&&<p role="status">{message}</p>}</section>;
}
