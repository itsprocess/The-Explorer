import {test} from 'node:test';
import assert from 'node:assert/strict';
import {imageThreat} from '../lib/image-threat';
import type {CellPackage} from '../lib/generation';
const cell=(event:any,safe=false)=>({context:{event,safeApproach:safe,protectedOrigin:safe},scene:{event_narrative:'{character_name} fell through a rotten bridge.'}} as CellPackage);
test('preloaded lethal art shows its threat without inventing a prior death',()=>{
 const p=cell({kind:'death',cause:'rotten footbridge',mode:'once_ever'}),before=JSON.stringify(p);
 const art=imageThreat(p);
 assert.equal(art?.threat,'rotten footbridge');assert.equal(art?.confirmedDeath,false);
 assert.match(art!.direction,/No body or remains/);assert.equal(JSON.stringify(p),before);
});
test('confirmed death adds art-only historical context, including conditional hostility',()=>{
 const art=imageThreat(cell(null),'The Architect fell to the patrol.');
 assert.equal(art?.confirmedDeath,true);assert.match(art!.incident!,/The Architect/);
 assert.match(art!.direction,/No blood, gore/);
 assert.equal(imageThreat(cell(null)),null);
 assert.equal(imageThreat(cell({kind:'death'},true),'An invalid death.'),null);
});
