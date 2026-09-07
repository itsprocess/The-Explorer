import {readPackage,db} from '../../../../lib/server';
import {cellKey,type CellPackage} from '../../../../lib/generation';
import {savedImage} from '../../../../lib/location-images';
import {checkCoordinate} from '../../../../lib/world';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function CellPage({params}:{params:Promise<{x:string;y:string}>}){
 const raw=await params,x=Number(raw.x),y=Number(raw.y);try{checkCoordinate(x,y);}catch{return notFound();}
 const cell=await readPackage<CellPackage>(cellKey(x,y));
 if(!cell)return <main className="public-page"><a href="/">Return to game</a><p className="view-only">Location record · View only</p><h1>Not generated</h1></main>;
 const image=await savedImage(x,y);
 const marks=(await db().prepare('SELECT v.character,v.value,c.value AS character_value FROM visits v JOIN characters c ON c.id=v.character WHERE v.x=? AND v.y=? ORDER BY v.at DESC LIMIT 30').bind(x,y).all<{character:string;value:string;character_value:string}>()).results;
 return <main className="public-page"><a href="/">Return to game</a><p className="view-only">Location record · View only. Viewing this page does not move your character.</p><h1>{cell.scene.title}</h1><div className="coordinates">{x}, {y}</div>
 {image&&<img className="location-image" src={image.url} alt={cell.scene.title}/>}
 <p>{cell.scene.description}</p><ul className="exits">{cell.scene.exits.map(e=><li key={e.direction}><strong>{e.direction[0].toUpperCase()+e.direction.slice(1)}</strong> — {e.description} <span className="glimpse">{cell.context.edges.find(n=>n.direction===e.direction)?.glimpse}</span></li>)}</ul>
 <ul className="blocked">{cell.context.blocked.map(b=><li key={b.direction}><strong>{b.direction}</strong> — {b.reason}</li>)}</ul>
 <details><summary>Visits</summary>{marks.map((m,i)=><article className="encounter" key={i}><a href={'/profile/'+m.character}>{JSON.parse(m.character_value).name}</a><p>{JSON.parse(m.value).event.text}</p></article>)}</details></main>;
}
