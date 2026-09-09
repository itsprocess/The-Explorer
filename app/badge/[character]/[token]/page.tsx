import {bindings,namespace} from '../../../../lib/server';
import {notFound} from 'next/navigation';
import {badgeDetail} from '../../../../lib/badge-detail';
import {badgeProse} from '../../../../lib/badge-link';
import {appPath} from '../../../../lib/app-path';
import BadgeShare from '../../../badge-share';
export const dynamic='force-dynamic';
export default async function BadgePage({params}:{params:Promise<{character:string;token:string}>}){
 const {character,token}=await params,d=await badgeDetail(character,token);if(!d)return notFound();const hasImage=d.x!==undefined&&d.y!==undefined&&!!await bindings().IMAGES.head(namespace()+'illustrations/'+d.x+'/'+d.y+'.webp');
 return <main className="public-page badge-story"><a href={appPath('/')}>The Explorer</a><header><small>Earned by {d.name}</small><h1>{badgeProse(d.badge.title)}</h1><p>{badgeProse(d.badge.description)}</p></header>{hasImage&&<img className="badge-story-image" src={appPath('/api/badge-image/')+character+'/'+token} alt="The place where this achievement was earned"/>}<section>{d.title&&<h2>{badgeProse(d.title)}</h2>}{d.setup&&<p>{badgeProse(d.setup)}</p>}{d.choice&&<p><strong>Chosen action:</strong> {badgeProse(d.choice)}</p>}<p>{badgeProse(d.narrative)}</p></section><BadgeShare title={badgeProse(d.badge.title)}/></main>;
}
