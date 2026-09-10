import {unlockPersonal} from './personal-locks';
import {endLife} from './give-up';
import {originTeleports} from './world';
import {worldSeed} from './server';
import {previewResult} from './dev-travel-state';
import {characterRow,snapshot} from './game';
import {db,AppError} from './server';
import {checkCoordinate,directions,devConnections} from './world';
import {devCell} from './dev-cell';
import {resolveArrival,type Character} from './rules';
import {resolveOccurrences} from './occurrence-resolution';
import {fillCharacter} from './character-text';
export async function devTravel(owner:string,id:string,body:any){
 const row=await characterRow(owner,id),real:Character=JSON.parse(row.value);
 if(real.devOperation===body.requestId)return snapshot(owner,id);
 if(body.action==='dev_exit'){delete real.devState;delete real.devEvent;}
 else{
  let c:Character=structuredClone(real.devState??real);delete c.devState;delete c.devEvent;delete c.devOperation;
  let result;
  if(body.action==='give_up'){result=endLife(c);}
  else if(body.action==='unlock'){result=unlockPersonal(c,await devCell(c.x,c.y),body.requestId);}
  else if(body.action==='option'){
   if(!Number.isInteger(body.choice)||body.choice<0)throw new AppError('Invalid preview choice.');
   if(c.pendingOption?.visit!==body.visit)throw new AppError('This preview choice is no longer available.',409);
   result=resolveOccurrences(c,await devCell(c.x,c.y),body.requestId,body.choice);
  }else{
   let x=c.x,y=c.y;
   if(body.action==='dev_warp'){x=body.x;y=body.y;c.alive=true;delete c.pendingOption;delete c.pendingTransport;}
   else if(body.action==='return'){x=0;y=0;c.alive=true;delete c.pendingOption;delete c.pendingTransport;}
   else if(body.action==='teleport'){if(!c.pendingTransport||c.pendingTransport.token!==body.token)throw new AppError('No matching preview teleport.',409);({x,y}=c.pendingTransport.destination);delete c.pendingTransport;}
   else if(body.action==='move'){
    if(c.pendingOption||c.pendingTransport)throw new AppError('Resolve the current preview encounter first.',409);
    const d=body.direction as keyof typeof directions;if(!directions[d]||!devConnections(c.x,c.y)[d])throw new AppError('No passage there.');const portal=originTeleports(worldSeed(),x,y).find(p=>p.direction===d);if(portal){x=portal.destination.x;y=portal.destination.y;}else{x+=directions[d][0];y+=directions[d][1];}c.alive=true;
   }else throw new AppError('Unknown preview action.');
   checkCoordinate(x,y);const p=await devCell(x,y);c.previousTile={x:c.x,y:c.y};c.x=x;c.y=y;
   result=p.context.exists?resolveArrival(c,p,false,body.requestId):{character:{...c,alive:false},event:{kind:'death',text:fillCharacter(p.scene.event_narrative,c.name),newBadge:null}};
  }
  // All experience is kept in the preview copy. No visits, claims, presence or shared marks are written.
  Object.assign(real,previewResult(real,result.character,result.event));
 }
 real.devOperation=body.requestId;
 const update=await db().prepare('UPDATE characters SET value=?,revision=revision+1 WHERE id=? AND owner=? AND revision=?').bind(JSON.stringify(real),id,owner,row.revision).run();
 if(!update.meta.changes)throw new AppError('Preview changed in another window. Refresh to continue.',409);
 return snapshot(owner,id);
}
