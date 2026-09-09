import {test} from 'node:test';
import assert from 'node:assert/strict';
import {previewResult} from '../lib/dev-travel-state';
import {tileTagPrefix,tileIcons} from '../lib/tile-tags';
import type {Character} from '../lib/rules';
import {readFileSync} from 'node:fs';
test('Dev experience changes only the preview, retaining actual run and no milestone awards',()=>{
 const real:Character={id:'a',name:'A',x:1,y:2,alive:true,deaths:2,furthest:5,badges:[],consumed:[]};
 const before=JSON.stringify(real),simulated={...structuredClone(real),x:100,y:-200,alive:false,deaths:3,furthest:224,badges:[{id:'new',kind:'death' as const,title:'x',description:'x'}]};
 const preview=previewResult(real,simulated,{kind:'death',text:'A fell.',newBadge:'x'});
 assert.equal(JSON.stringify(real),before);assert.equal(preview.devState.x,100);assert.equal(preview.devState.alive,false);assert.equal(preview.devState.deaths,2);assert.equal(preview.devState.furthest,5);assert.deepEqual(preview.devState.badges,[]);assert.equal(preview.devEvent.newBadge,null);
});
test('private marker keys separate characters and the API obtains ownership exclusively from authentication',()=>{
 assert.notEqual(tileTagPrefix('a')+'1:2',tileTagPrefix('b')+'1:2');assert.equal(new Set(tileIcons.map(i=>i.id)).size,6);
 const code=readFileSync(new URL('../app/api/tags/route.ts',import.meta.url),'utf8');assert.match(code,/requireCharacter\(request\)/);assert.match(code,/tileTagPrefix\(c.id\)/);assert.match(code,/private, no-store/);assert.doesNotMatch(code,/body.character|body.owner|searchParams.get\('character'\)/);
 const dev=readFileSync(new URL('../lib/dev-travel.ts',import.meta.url),'utf8');assert.doesNotMatch(dev,/INSERT.*(?:visits|claims|presence)/);
 const route=readFileSync(new URL('../app/api/game/route.ts',import.meta.url),'utf8');assert.match(route,/await requireOwner\(\);return generationStream\(\(\)=>awaitGenerated\(\(\)=>devTravel/);
});
