import {discoveryQuery,imprintQuery} from './tile-memory-queries';
import {db} from './server';
/** Resolved visits are the ledger: retries cannot duplicate a visit or its shared trace. */
export async function tileMemory(x:number,y:number){
 const discovery=await db().prepare(discoveryQuery).bind(x,y).first<{character:string;name:string|null}>();
 // Only the first resolved interesting encounter gets the chance to mark a tile.
 const first=await db().prepare(imprintQuery).bind(x,y).first<{imprint:string|null}>();
 const relics=(await db().prepare("SELECT v.id,v.character,json_extract(c.value,'$.name') AS name,json_extract(v.value,'$.event.relic.text') AS text FROM visits v LEFT JOIN characters c ON c.id=v.character WHERE v.x=? AND v.y=? AND json_extract(v.value,'$.event.relic.text') IS NOT NULL ORDER BY v.at,v.id LIMIT 100").bind(x,y).all<{id:string;character:string;name:string|null;text:string}>()).results;
 return {relics,discoverer:discovery?.name?{id:discovery.character,name:discovery.name}:null,imprint:first?.imprint??null};
}
