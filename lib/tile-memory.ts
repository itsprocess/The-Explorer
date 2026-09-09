import {discoveryQuery,imprintQuery} from './tile-memory-queries';
import {db} from './server';
/** Resolved visits are the ledger: retries cannot duplicate a visit or its shared trace. */
export async function tileMemory(x:number,y:number){
 const discovery=await db().prepare(discoveryQuery).bind(x,y).first<{character:string;name:string|null}>();
 // Only the first resolved interesting encounter gets the chance to mark a tile.
 const first=await db().prepare(imprintQuery).bind(x,y).first<{imprint:string|null}>();
 return {discoverer:discovery?.name?{id:discovery.character,name:discovery.name}:null,imprint:first?.imprint??null};
}
