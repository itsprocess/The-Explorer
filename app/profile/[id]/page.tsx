import TraitDisplay from '../../trait-display';
import HistoryBrowser from '../../history-browser';
import {db} from '../../../lib/server';
import type {Character} from '../../../lib/game';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function ProfilePage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{page?:string;q?:string}>}){
 const {id}=await params,query=await searchParams,page=Math.max(0,Math.min(100000,Math.floor(Number(query.page)||0)));
 const row=await db().prepare('SELECT value FROM characters WHERE id=?').bind(id).first<{value:string}>();if(!row)return notFound();const c:Character=JSON.parse(row.value);
 return <main className="public-page"><a href="/">Return to game</a><h1>{c.name}</h1>
 <h2>Badges</h2>{!c.badges.length&&<p className="muted">No badges yet.</p>}<div className="badges">{c.badges.map(b=><article className="badge" key={b.id}><strong>{b.title}</strong><p>{b.description}</p></article>)}</div>
 <div className="stats"><div><span>Deaths</span><strong>{c.deaths}</strong></div><div><span>Furthest Distance</span><strong>{c.furthest.toFixed(1)}</strong></div><div><span>Badges</span><strong>{c.badges.length}</strong></div></div>
 <TraitDisplay traits={c.traits??[]} character={id}/><HistoryBrowser character={id} initialQuery={query.q?.slice(0,160)??''} initialOffset={page*25}/></main>;
}
