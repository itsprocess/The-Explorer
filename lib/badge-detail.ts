import {db,namespace} from './server';
import {badgeToken} from './badge-link';
import {deduplicateBadges} from './achievement-identity';
import {fillCharacter} from './character-text';
import type {Character} from './rules';
import type {CellPackage} from './generation';
export async function badgeDetail(character:string,token:string){
 if(!/^[a-zA-Z0-9-]{1,80}$/.test(character)||!/^[a-f0-9]{64}$/.test(token))return null;
 const row=await db().prepare('SELECT value FROM characters WHERE id=?').bind(character).first<{value:string}>();if(!row)return null;
 const c:Character=JSON.parse(row.value),badge=deduplicateBadges(c.badges).find(b=>badgeToken(b.id)===token);if(!badge)return null;
 const location=badge.id.match(/:fieldwork-\d+:(-?\d+):(-?\d+)(?::|$)/);
 let visit: {x:number;y:number;value:string}|null=null;
 if(location)visit=await db().prepare("SELECT x,y,value FROM visits WHERE character=? AND x=? AND y=? AND json_extract(value,'$.event.newBadge')=? ORDER BY at LIMIT 1").bind(character,Number(location[1]),Number(location[2]),badge.title).first();
 else visit=await db().prepare("SELECT x,y,value FROM visits WHERE character=? AND json_extract(value,'$.event.newBadge')=? ORDER BY at LIMIT 1").bind(character,badge.title).first();
 if(!visit&&badge.kind==='distance'){const distance=Number(badge.id.split(':')[1]);if(Number.isFinite(distance))visit=await db().prepare('SELECT x,y,value FROM visits WHERE character=? AND x*x+y*y>=? ORDER BY at LIMIT 1').bind(character,distance*distance).first();}
 const x=location?Number(location[1]):visit?.x,y=location?Number(location[2]):visit?.y;
 const saved=x!==undefined&&y!==undefined?await db().prepare('SELECT value FROM packages WHERE key=?').bind(namespace()+'cell:'+x+':'+y).first<{value:string}>():null;
 const p:CellPackage|null=saved?.value?JSON.parse(saved.value):null;
 const choiceIndex=badge.id.match(/:option-(\d+)/)?.[1];
 const choice=(visit?JSON.parse(visit.value).event?.choice:undefined)??(choiceIndex!==undefined?p?.occurrenceText?.choices[Number(choiceIndex)]?.label:undefined);
 return {badge,name:c.name,x,y,title:p?.scene.title,setup:p?.occurrenceText?.setup,choice:choice?fillCharacter(choice,c.name):undefined,narrative:visit?JSON.parse(visit.value).event?.text:badge.description};
}
