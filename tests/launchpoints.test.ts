import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contextFor,originTeleports,connections} from '../lib/world';
import {endLife} from '../lib/give-up';
import {beginLife} from '../lib/progress';
import {sceneSchemaFor} from '../lib/prompts';
import type {Character} from '../lib/rules';
test('Nadir Hearth has four physically blocked neighbors and four portal exits without changing topology',()=>{
 const seed='the-sanctuary-is-run-by-otters',c=contextFor(seed,0,0);
 assert.equal(Object.values(connections(seed,0,0)).some(Boolean),false);assert.equal(c.portalExits.length,4);assert.equal(c.edges.length,4);assert.equal(c.blocked.length,0);assert.deepEqual(originTeleports(seed,0,0),c.portalExits);assert.equal(c.occurrences,null);
 assert.deepEqual(Object.keys((sceneSchemaFor(c) as any).properties.exits.properties),['north','east','south','west']);
 for(const p of c.portalExits){assert.ok(p.destination.x!==0||p.destination.y!==0);assert.ok(Math.hypot(p.destination.x,p.destination.y)<=51);}
 assert.ok(c.adjacentTerrain.every(n=>n.terrain.some(t=>t.kind==='void')));
});
test('replacement origin has normal exits and fallback never adds portals to other cells',()=>{
 assert.deepEqual(connections('the-compass-has-a-snack-pocket',0,0),{north:true,east:true,south:true,west:true});assert.deepEqual(originTeleports('the-compass-has-a-snack-pocket',0,0),[]);assert.deepEqual(originTeleports('the-sanctuary-is-run-by-otters',1,0),[]);
});
test('giving up clears pending encounters, preserves permanent progress, and cannot be repeated while dead',()=>{
 const c:Character={id:'p',name:'P',x:7,y:8,alive:true,deaths:2,furthest:12,badges:[],consumed:[],distanceTotal:20,standings:[{family:'faction',value:'x',score:40,names:['A']}],pendingOption:{key:'k',visit:'v'},pendingTransport:{token:'t',destination:{x:10,y:10},narrative:'',mechanism:'teleport'}};
 const r=endLife(c);assert.equal(r.character.alive,false);assert.equal(r.character.deaths,3);assert.equal(r.character.pendingTransport,undefined);assert.equal(r.character.pendingOption,undefined);assert.equal(r.character.standings![0].score,40);assert.equal(r.character.distanceTotal,20);assert.equal(c.alive,true);assert.equal(r.event.newBadge,null);assert.throws(()=>endLife(r.character));assert.equal(beginLife(r.character).alive,true);
});
