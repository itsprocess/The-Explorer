import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deferTransport,transferCharacter} from '../lib/teleport';
import type {Character} from '../lib/rules';
import type {CellPackage} from '../lib/generation';
test('teleport entry persists at its source; confirmation alone changes position',()=>{
 const c:Character={id:'a',name:'A',x:6,y:0,alive:true,deaths:0,furthest:6,badges:[],consumed:[]};
 const p={context:{portalDestination:{x:80,y:0},transport:{mechanism:'a great crow'}},scene:{title:'Clearing'}} as CellPackage;
 const waiting=deferTransport({character:c,event:{kind:'portal',text:'A flew with a crow.',newBadge:null}},p,'visit-token');
 assert.equal(waiting.character.x,6);assert.equal(waiting.character.furthest,6);assert.equal(waiting.event.kind,'transport_pending');
 const restored=JSON.parse(JSON.stringify(waiting.character));
 assert.throws(()=>transferCharacter(restored,'wrong',{x:80,y:0,distance:80,title:'Hills'}),/matching/);
 const landed=transferCharacter(restored,'visit-token',{x:80,y:0,distance:80,title:'Hills'});
 assert.equal(landed.character.x,80);assert.equal(landed.character.furthest,80);assert.equal(landed.character.pendingTransport,undefined);
 assert.equal(restored.x,6);assert.equal(landed.event.kind,'portal');assert.match(landed.event.text,/flew with a crow/);
 assert.throws(()=>transferCharacter(landed.character,'visit-token',{x:80,y:0,distance:80,title:'Hills'}));
});
