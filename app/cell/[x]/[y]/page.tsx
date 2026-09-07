import {readPackage,db} from '../../../../lib/server';
import {cellKey,type CellPackage} from '../../../../lib/generation';
import {checkCoordinate} from '../../../../lib/world';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function CellPage({params}:{params:Promise<{x:string;y:string}>}){
 const raw=await params,x=Number(raw.x),y=Number(raw.y);try{checkCoordinate(x,y);}catch{return notFound();}
 const cell=await readPackage<CellPackage>(cellKey(x,y));if(!cell)return <main className="public-page"><a href="/">← The Explorer</a><h1>Not generated</h1><p></p></main>;
 const marks=(await db().prepare('SELECT v.character,v.value,v.at,c.value AS character_value FROM visits v JOIN characters c ON c.id=v.character WHERE v.x=? AND v.y=? ORDER BY v.at DESC LIMIT 30').bind(x,y).all<{character:string;value:string;at:number;character_value:string}>()).results;
 return <main className="public-page"><a href="/">← The Explorer</a><div className="eyebrow" style={{marginTop:40}}>{x} / {y}</div><h1>{cell.scene.title}</h1><div className="region-line">{cell.regions.map(r=><span key={r.id}>{r.name}</span>)}</div><div className="rule"/>{cell.scene.description.split('\n').filter(Boolean).map((p,i)=><p key={i}>{p}</p>)}<h2>Visits</h2>{marks.map((m,i)=><article className="encounter" key={i}><a href={'/profile/'+m.character}>{JSON.parse(m.character_value).name}</a><p>{JSON.parse(m.value).event.text}</p></article>)}</main>;
}
