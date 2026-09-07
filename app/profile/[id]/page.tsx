import {db} from '../../../lib/server';
import type {Character} from '../../../lib/game';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function ProfilePage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{page?:string}>}){
 const {id}=await params,query=await searchParams,page=Math.max(0,Math.min(100000,Math.floor(Number(query.page)||0)));
 const row=await db().prepare('SELECT value FROM characters WHERE id=?').bind(id).first<{value:string}>();if(!row)return notFound();const c:Character=JSON.parse(row.value);
 const history=(await db().prepare('SELECT x,y,value,at FROM visits WHERE character=? ORDER BY at DESC,id DESC LIMIT 26 OFFSET ?').bind(id,page*25).all<{x:number;y:number;value:string;at:number}>()).results;
 return <main className="public-page"><a href="/">← The Explorer</a><h1>{c.name}</h1><div className="stats"><div><span>Total deaths</span><strong>{c.deaths}</strong></div><div><span>Furthest distance</span><strong>{c.furthest.toFixed(1)}</strong></div><div><span>Badges</span><strong>{c.badges.length}</strong></div></div><div className="badges">{c.badges.map(b=><article className="badge" key={b.id}><strong>{b.title}</strong><span>{b.description}</span></article>)}</div><h2>History</h2>{history.slice(0,25).map((h,i)=><article className="encounter" key={i}><a href={'/cell/'+h.x+'/'+h.y}>{h.x} / {h.y}</a><p>{JSON.parse(h.value).event.text}</p></article>)}<div className="passage-buttons">{page>0&&<a href={'?page='+(page-1)}>← Newer entries</a>}{history.length>25&&<a href={'?page='+(page+1)}>Older entries →</a>}</div></main>;
}
