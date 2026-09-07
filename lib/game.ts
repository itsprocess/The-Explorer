import {db,readPackage,namespace,worldSeed,AppError} from './server';
import {ensureCell,cellKey,publicCell,type CellPackage} from './generation';
import {connections,directions,exists,type Direction} from './world';
import {hash} from './noise';
import {resolveArrival,type Character} from './rules';
export type {Character} from './rules';
type CharacterRow={id:string;owner:string;value:string;revision:number;last_op:string|null};
export async function characterRow(owner:string,id:string){const row=await db().prepare('SELECT * FROM characters WHERE id=? AND owner=?').bind(id,owner).first<CharacterRow>();if(!row)throw new AppError('That character could not be found.',404);return row;}
export async function snapshot(owner:string,id?:string,offset=0){
 const rows=(await db().prepare('SELECT id,value FROM characters WHERE owner=? ORDER BY updated DESC').bind(owner).all<{id:string;value:string}>()).results;
 const row=id?await characterRow(owner,id):rows[0];const c:Character|null=row?JSON.parse(row.value):null;
 const x=c?.x??0,y=c?.y??0;
 const saved=await readPackage<CellPackage>(cellKey(x,y));
 const known=(await db().prepare('SELECT key FROM packages WHERE kind=? AND value IS NOT NULL AND key LIKE ?').bind('cell',namespace()+'cell:%').all<{key:string}>()).results;
 const knownSet=new Set(known.map(r=>r.key));const map=[];
 for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){const a=x+dx,b=y+dy;map.push({x:a,y:b,exists:Math.abs(a)<=1e9&&Math.abs(b)<=1e9&&exists(worldSeed(),a,b),generated:knownSet.has(cellKey(a,b))});}
 const history=c?(await db().prepare('SELECT id,x,y,value,at FROM visits WHERE character=? ORDER BY at DESC,id DESC LIMIT 26 OFFSET ?').bind(c.id,offset).all<{id:string;x:number;y:number;value:string;at:number}>()).results:[];
 const first=c?await db().prepare('SELECT value FROM visits WHERE character=? ORDER BY at DESC,id DESC LIMIT 1').bind(c.id).first<{value:string}>():null;
 const lastEvent=first?JSON.parse(first.value).event:null;
 return {character:c?{id:c.id,name:c.name,x:c.x,y:c.y,alive:c.alive,deaths:c.deaths,furthest:c.furthest}:null,characters:rows.map(r=>({id:r.id,name:JSON.parse(r.value).name})),cell:publicCell(saved),map,connections:connections(worldSeed(),x,y),badges:c?.badges??[],history:history.slice(0,25).map(h=>({id:h.id,x:h.x,y:h.y,at:h.at,...JSON.parse(h.value).event})),historyHasMore:history.length>25,historyOffset:offset,lastEvent};
}
export async function createCharacter(owner:string,name:string,requestId:string){
 const id='c_'+hash(owner+':'+requestId).toString(16)+'_'+hash(requestId+':'+owner).toString(16);
 const found=await db().prepare('SELECT id FROM characters WHERE id=? AND owner=?').bind(id,owner).first();if(found)return snapshot(owner,id);
 const count=await db().prepare('SELECT count(*) as n FROM characters WHERE owner=?').bind(owner).first<{n:number}>();if((count?.n??0)>=30)throw new AppError('This first edition supports 30 characters per account.');
 const p=await ensureCell(0,0);const c:Character={id,name,x:0,y:0,alive:true,deaths:0,furthest:0,badges:[],consumed:[]};const now=Date.now();
 await db().batch([db().prepare('INSERT OR IGNORE INTO characters(id,owner,value,revision,last_op,updated) VALUES(?,?,?,0,?,?)').bind(id,owner,JSON.stringify(c),requestId,now),db().prepare('INSERT OR IGNORE INTO visits(id,character,x,y,value,at) VALUES(?,?,0,0,?,?)').bind(owner+':'+requestId,id,JSON.stringify({event:{text:name+' first arrived at '+p.scene.title+'.',kind:'arrival',newBadge:null}}),now)]);
 return snapshot(owner,id);
}
export async function moveCharacter(owner:string,id:string,requestId:string,direction:Direction|'return'){
 const op=owner+':'+requestId;
 const prior=await db().prepare('SELECT character FROM visits WHERE id=?').bind(op).first<{character:string}>();if(prior){if(prior.character!==id)throw new AppError('This request belongs to another character.',409);return snapshot(owner,id);}
 const row=await characterRow(owner,id),original:Character=JSON.parse(row.value);let x=0,y=0;
 if(direction==='return'){if(original.alive)throw new AppError('Only a fallen character returns this way.');}
 else{if(!original.alive)throw new AppError('Return to the origin before exploring again.');if(!connections(worldSeed(),original.x,original.y)[direction])throw new AppError('There is no passage in that direction.');const delta=directions[direction];x=original.x+delta[0];y=original.y+delta[1];}
 const p=await ensureCell(x,y);const base=direction==='return'?{...original,alive:true}:original;
 let winner=resolveArrival(base,p,false),loser=resolveArrival(base,p,true);
 if(direction==='return'){winner.event={text:original.name+' returned to '+p.scene.title+', carrying every story.',kind:'return',newBadge:null};loser=winner;}
 // A portal performs one committed transfer. Destination arrival events wait until a later entry.
 if(winner.character.alive&&winner.event.kind==='portal'&&p.context.portalDestination){const destination=await ensureCell(p.context.portalDestination.x,p.context.portalDestination.y);winner.character.x=destination.context.x;winner.character.y=destination.context.y;winner.character.furthest=Math.max(winner.character.furthest,destination.context.distance);winner.event.text+=' You emerge at '+destination.scene.title+'.';loser=winner;}
 const isGlobal=p.context.event?.mode==='once_ever'&&winner.event.kind!=='death';const claimKey=cellKey(x,y)+':'+p.context.event?.id;
 const now=Date.now(),queries:D1PreparedStatement[]=[];
 if(isGlobal)queries.push(db().prepare('INSERT OR IGNORE INTO claims(key,character,operation,at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM characters WHERE id=? AND owner=? AND revision=?)').bind(claimKey,id,op,now,id,owner,row.revision));
 const condition=isGlobal?'EXISTS(SELECT 1 FROM claims WHERE key=? AND operation=?)':'1=1';
 const params=isGlobal?[claimKey,op]:[];
 queries.push(db().prepare('UPDATE characters SET value=CASE WHEN '+condition+' THEN ? ELSE ? END,revision=revision+1,last_op=?,updated=? WHERE id=? AND owner=? AND revision=?').bind(...params,JSON.stringify(winner.character),JSON.stringify(loser.character),op,now,id,owner,row.revision));
 queries.push(db().prepare('INSERT OR IGNORE INTO visits(id,character,x,y,value,at) SELECT ?,?,?,?,CASE WHEN '+condition+' THEN ? ELSE ? END,? WHERE EXISTS(SELECT 1 FROM characters WHERE id=? AND last_op=? AND revision=?)').bind(op,id,winner.character.x,winner.character.y,...params,JSON.stringify({event:winner.event}),JSON.stringify({event:loser.event}),now,id,op,row.revision+1));
 const results=await db().batch(queries);const updated=results[isGlobal?1:0];
 if(!updated.meta.changes){const applied=await db().prepare('SELECT id FROM visits WHERE id=?').bind(op).first();if(!applied)throw new AppError('This character moved in another window. Refresh before taking another step.',409);}
 return snapshot(owner,id);
}
