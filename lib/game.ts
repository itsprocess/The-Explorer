import {canInspect} from './auth';
import {deferTransport,transferCharacter} from './teleport';
import {savedImage} from './location-images';
import {db,readPackage,namespace,worldSeed,AppError} from './server';
import {ensureCell,cellKey,publicCell,type CellPackage} from './generation';
import {connections,directions,exists,LIMIT,type Direction} from './world';

import {resolveArrival,awardDistanceBadges,type Character} from './rules';
export type {Character} from './rules';

export async function createCharacter(name:string,nameKey:string,passwordHash:string){
 const id=crypto.randomUUID(),now=Date.now();
 const character:Character={id,name,x:0,y:0,alive:true,deaths:0,furthest:0,badges:[],consumed:[]};
 try{await db().batch([
  db().prepare('INSERT INTO character_credentials(character,name_key,password_hash,created) VALUES(?,?,?,?)').bind(id,nameKey,passwordHash,now),
  db().prepare('INSERT INTO characters(id,owner,value,revision,updated) VALUES(?,?,?,0,?)').bind(id,id,JSON.stringify(character),now),
  db().prepare('INSERT INTO visits(id,character,x,y,value,at) VALUES(?,?,0,0,?,?)').bind(crypto.randomUUID(),id,JSON.stringify({event:{text:name+' arrived at the origin.',kind:'arrival',newBadge:null}}),now),
 ]);}catch(e){if(await db().prepare('SELECT character FROM character_credentials WHERE name_key=?').bind(nameKey).first())throw new AppError('That character name is already taken.',409);throw e;}
 return {id,owner:id};
}
type CharacterRow={id:string;owner:string;value:string;revision:number;last_op:string|null};
export async function characterRow(owner:string,id:string){const row=await db().prepare('SELECT * FROM characters WHERE id=? AND owner=?').bind(id,owner).first<CharacterRow>();if(!row)throw new AppError('That character could not be found.',404);return row;}
export async function snapshot(owner:string,id?:string,offset=0){
 const rows=(await db().prepare('SELECT id,value FROM characters WHERE owner=? ORDER BY updated DESC').bind(owner).all<{id:string;value:string}>()).results;
 const row=id?await characterRow(owner,id):rows[0];const c:Character|null=row?JSON.parse(row.value):null;
 const x=c?.x??0,y=c?.y??0;
 const saved=c?await ensureCell(x,y):await readPackage<CellPackage>(cellKey(x,y));
 // A reset preserves the character at origin but clears visits. Re-establish the actual arrival.
 if(c&&saved&&x===0&&y===0)await db().prepare('INSERT OR IGNORE INTO visits(id,character,x,y,value,at) SELECT ?,?,0,0,?,? WHERE NOT EXISTS(SELECT 1 FROM visits WHERE character=?)').bind(namespace()+'initial:'+c.id,c.id,JSON.stringify({event:{text:c.name+' arrived at '+saved.scene.title+'.',kind:'arrival',newBadge:null}}),Date.now(),c.id).run();
 const known=(await db().prepare('SELECT DISTINCT x,y FROM visits WHERE x BETWEEN ? AND ? AND y BETWEEN ? AND ?').bind(x-5,x+5,y-5,y+5).all<{x:number;y:number}>()).results;
 const knownSet=new Set(known.map(r=>cellKey(r.x,r.y)));const map=[];
 for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){const a=x+dx,b=y+dy;map.push({x:a,y:b,exists:Math.abs(a)<=LIMIT&&Math.abs(b)<=LIMIT&&exists(worldSeed(),a,b),generated:knownSet.has(cellKey(a,b))});}
 const history=c?(await db().prepare('SELECT id,x,y,value,at FROM visits WHERE character=? ORDER BY at DESC,id DESC LIMIT 26 OFFSET ?').bind(c.id,offset).all<{id:string;x:number;y:number;value:string;at:number}>()).results:[];
 const first=c?await db().prepare('SELECT value FROM visits WHERE character=? ORDER BY at DESC,id DESC LIMIT 1').bind(c.id).first<{value:string}>():null;
 const lastEvent=first?JSON.parse(first.value).event:null;
 return {canInspect:await canInspect(),character:c?{id:c.id,name:c.name,x:c.x,y:c.y,alive:c.alive,deaths:c.deaths,furthest:c.furthest,pendingTransport:c.pendingTransport?{token:c.pendingTransport.token,mechanism:c.pendingTransport.mechanism}:null}:null,characters:rows.map(r=>({id:r.id,name:JSON.parse(r.value).name})),cell:publicCell(saved,(await savedImage(x,y))?.url),map,connections:connections(worldSeed(),x,y),badges:c?.badges??[],traits:c?.traits??[],history:history.slice(0,25).map(h=>({id:h.id,x:h.x,y:h.y,at:h.at,...JSON.parse(h.value).event})),historyHasMore:history.length>25,historyOffset:offset,lastEvent};
}
export async function moveCharacter(owner:string,id:string,requestId:string,direction:Direction|'return'){
 const op=owner+':'+requestId;
 const prior=await db().prepare('SELECT character FROM visits WHERE id=?').bind(op).first<{character:string}>();if(prior){if(prior.character!==id)throw new AppError('This request belongs to another character.',409);return snapshot(owner,id);}
 const row=await characterRow(owner,id),original:Character=JSON.parse(row.value);if(original.pendingTransport)throw new AppError('Confirm your teleport before moving.',409);let x=0,y=0;
 if(direction==='return'){if(original.alive)throw new AppError('Only a fallen character returns this way.');}
 else{if(!original.alive)throw new AppError('Return to the origin before exploring again.');if(!connections(worldSeed(),original.x,original.y)[direction])throw new AppError('There is no passage in that direction.');const delta=directions[direction];x=original.x+delta[0];y=original.y+delta[1];}
 const p=await ensureCell(x,y);const base=direction==='return'?{...original,alive:true}:original;
 let winner=resolveArrival(base,p,false,op),loser=resolveArrival(base,p,true,op);
 if(direction==='return'){winner.event={text:original.name+' returned to '+p.scene.title+', carrying every story.',kind:'return',newBadge:null};loser=winner;}
 // Enter and record the source first. Only an explicit confirmation can transfer position.
 winner=deferTransport(winner,p,op);loser=deferTransport(loser,p,op);
 const isGlobal=p.context.event?.mode==='once_ever'&&winner.event.kind!=='death';const claimKey=cellKey(x,y)+':'+p.context.event?.id;
 const now=Date.now(),queries:D1PreparedStatement[]=[];
 if(isGlobal)queries.push(db().prepare('INSERT OR IGNORE INTO claims(key,character,operation,at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM characters WHERE id=? AND owner=? AND revision=?)').bind(claimKey,id,op,now,id,owner,row.revision));
 const condition=isGlobal?'EXISTS(SELECT 1 FROM claims WHERE key=? AND operation=?)':'1=1';
 const params=isGlobal?[claimKey,op]:[];
 queries.push(db().prepare('UPDATE characters SET value=CASE WHEN '+condition+' THEN ? ELSE ? END,revision=revision+1,last_op=?,updated=? WHERE id=? AND owner=? AND revision=?').bind(...params,JSON.stringify(winner.character),JSON.stringify(loser.character),op,now,id,owner,row.revision));
 queries.push(db().prepare('INSERT OR IGNORE INTO visits(id,character,x,y,value,at) SELECT ?,?,?,?,CASE WHEN '+condition+' THEN ? ELSE ? END,? WHERE EXISTS(SELECT 1 FROM characters WHERE id=? AND last_op=? AND revision=?)').bind(op,id,x,y,...params,JSON.stringify({event:winner.event}),JSON.stringify({event:loser.event}),now,id,op,row.revision+1));
 const results=await db().batch(queries);const updated=results[isGlobal?1:0];
 if(!updated.meta.changes){const applied=await db().prepare('SELECT id FROM visits WHERE id=?').bind(op).first();if(!applied)throw new AppError('This character moved in another window. Refresh before taking another step.',409);}
 return snapshot(owner,id);
}

export async function confirmTransport(owner:string,id:string,requestId:string,token:string){
 const op=owner+':'+requestId;
 const prior=await db().prepare('SELECT character FROM visits WHERE id=?').bind(op).first<{character:string}>();
 if(prior){if(prior.character!==id)throw new AppError('Request belongs to another character.',409);return snapshot(owner,id);}
 const row=await characterRow(owner,id),original:Character=JSON.parse(row.value);
 if(!original.pendingTransport||original.pendingTransport.token!==token)throw new AppError('This teleport is no longer waiting. Refresh the page.',409);
 const d=original.pendingTransport.destination,p=await ensureCell(d.x,d.y);
 const result=transferCharacter(original,token,{x:d.x,y:d.y,distance:p.context.distance,title:p.scene.title});
 awardDistanceBadges(result.character);const now=Date.now();
 const results=await db().batch([
  db().prepare('UPDATE characters SET value=?,revision=revision+1,last_op=?,updated=? WHERE id=? AND owner=? AND revision=?').bind(JSON.stringify(result.character),op,now,id,owner,row.revision),
  db().prepare('INSERT OR IGNORE INTO visits(id,character,x,y,value,at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM characters WHERE id=? AND last_op=? AND revision=?)').bind(op,id,original.x,original.y,JSON.stringify({event:result.event}),now,id,op,row.revision+1),
  db().prepare('INSERT OR IGNORE INTO visits(id,character,x,y,value,at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM characters WHERE id=? AND last_op=? AND revision=?)').bind(op+':landing',id,d.x,d.y,JSON.stringify({event:{kind:'arrival',text:original.name+' arrived after an unexpected journey.',newBadge:null}}),now-1,id,op,row.revision+1),
 ]);
 if(!results[0].meta.changes&&!await db().prepare('SELECT id FROM visits WHERE id=?').bind(op).first())throw new AppError('This character moved in another window. Refresh to continue.',409);
 return snapshot(owner,id);
}
