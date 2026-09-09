import {badgeLink} from '../../../lib/badge-link';
import AffiliationDisplay from '../../affiliation-display';
import ProgressStats from '../../progress-stats';
import {deduplicateBadges} from '../../../lib/achievement-identity';
import {appPath} from '../../../lib/app-path';
import TraitDisplay from '../../trait-display';
import {db} from '../../../lib/server';
import type {Character} from '../../../lib/game';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function ProfilePage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const row=await db().prepare('SELECT value FROM characters WHERE id=?').bind(id).first<{value:string}>();if(!row)return notFound();const c:Character=JSON.parse(row.value);c.badges=deduplicateBadges(c.badges);
 return <main className="public-page"><a href={appPath('/')}>Return to game</a><h1>{c.name}</h1>
 <h2>Badges</h2>{!c.badges.length&&<p className="muted">No badges yet.</p>}<div className="badges">{c.badges.map(b=><a className="badge" key={b.id} href={badgeLink(id,b.id)}><strong>{b.title}</strong><p>{b.description}</p></a>)}</div>
 <ProgressStats character={c} badges={c.badges.length}/>
 <AffiliationDisplay standings={c.standings}/><TraitDisplay traits={c.traits??[]} character={id}/></main>;
}
