import {test} from 'node:test';
import assert from 'node:assert/strict';
import {teleportRange,teleportDestination,retargetTeleports,type Occurrences} from '../lib/occurrences';
test('portal radius starts at 100 and scales to ten times origin distance',()=>{
 assert.equal(teleportRange(0,0),100);assert.equal(teleportRange(3,4),100);assert.equal(teleportRange(30,40),500);assert.equal(teleportRange(600,800),10000);
 for(const [x,y] of [[0,0],[3,4],[30,40],[600,800]]){const d=teleportDestination('fixture',x,y);assert.ok(Math.hypot(d.x-x,d.y-y)<=teleportRange(x,y)+Math.SQRT1_2);assert.deepEqual(d,teleportDestination('fixture',x,y));}
});
test('cached direct, option and challenge portals use their original random channels',()=>{
 const old:Occurrences={death:false,gift:null,teleport:{x:1,y:2},challenge:{kind:'challenge',requirement:{kind:'defining',value:'Faith'},present:{kind:'teleport',destination:{x:1,y:2}},absent:{kind:'none'}},option:{policy:'life',choices:[{kind:'none'},{kind:'teleport',destination:{x:1,y:2}},{kind:'challenge',requirement:{kind:'defining',value:'Wit'},present:{kind:'none'},absent:{kind:'teleport',destination:{x:1,y:2}}}]}};
 const next=retargetTeleports(old,'fixture',30,40);
 assert.deepEqual(next.teleport,teleportDestination('fixture',30,40));
 assert.deepEqual((next.challenge!.present as any).destination,teleportDestination('fixture',30,40,'challengeyes'));
 assert.deepEqual((next.option!.choices[1] as any).destination,teleportDestination('fixture',30,40,'option-1'));
 assert.deepEqual((next.option!.choices[2] as any).absent.destination,teleportDestination('fixture',30,40,'option-2no'));
 assert.deepEqual(next.challenge!.requirement,old.challenge!.requirement);assert.deepEqual(next.option!.choices[0],old.option!.choices[0]);assert.equal(next.option!.policy,'life');assert.deepEqual(old.teleport,{x:1,y:2});assert.deepEqual(retargetTeleports(next,'fixture',30,40),next);
});
