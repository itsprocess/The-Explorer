import {recordTravel} from './progress';
import type {Character} from './rules';
import type {CellPackage} from './generation';
export function deferTransport(arrival:ReturnType<typeof import('./rules').resolveArrival>,p:CellPackage,token:string){
 if(!arrival.character.alive||arrival.event.kind!=='portal'||!p.context.portalDestination)return arrival;
 arrival.character.pendingTransport={token,destination:p.context.portalDestination,narrative:arrival.event.text,mechanism:p.context.transport?.mechanism??'an unexpected passage'};
 arrival.event={kind:'transport_pending',text:arrival.character.name+' reached an unexpected departure at '+p.scene.title+'.',newBadge:null};
 return arrival;
}
export function transferCharacter(original:Character,token:string,destination:{x:number;y:number;distance:number;title:string}){
 if(!original.pendingTransport||original.pendingTransport.token!==token||!original.alive)throw Error('No matching teleport is waiting.');
 const c=structuredClone(original),pending=c.pendingTransport!;
 if(destination.x!==pending.destination.x||destination.y!==pending.destination.y)throw Error('Teleport destination mismatch.');
 recordTravel(c,destination.x,destination.y);delete c.pendingTransport;c.x=destination.x;c.y=destination.y;c.furthest=Math.max(c.furthest,destination.distance);
 return {character:c,event:{kind:'portal',text:pending.narrative+' '+c.name+' arrived at '+destination.title+'.',newBadge:null}};
}
