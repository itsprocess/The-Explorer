import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canCauseDeath,limitLethalChoices,type Outcome} from '../lib/occurrences';
import {readFileSync} from 'node:fs';
test('only one option can be fatal, including conditional deaths and unsafe teleports',()=>{
 const choices:Outcome[]=[{kind:'challenge',requirement:{kind:'defining',value:'Wit'},present:{kind:'none'},absent:{kind:'kill'}},{kind:'teleport',destination:{x:8,y:9}},{kind:'kill'}];
 const limited=limitLethalChoices(choices);assert.equal(limited.filter(canCauseDeath).length,1);assert.deepEqual(limited[0],choices[0]);assert.deepEqual(limitLethalChoices(limited),limited);
 assert.deepEqual(limitLethalChoices([{kind:'badge'},{kind:'none'}]),[{kind:'badge'},{kind:'none'}]);
});
test('pending choices block server travel and modal dismissal',()=>{
 const game=readFileSync(new URL('../lib/game.ts',import.meta.url),'utf8');assert.match(game,/if\(original.pendingOption\)throw/);
 const modal=readFileSync(new URL('../app/option-dialog.tsx',import.meta.url),'utf8');assert.match(modal,/showModal/);assert.match(modal,/onCancel=\{e=>e.preventDefault\(\)\}/);
 const prompts=readFileSync(new URL('../lib/interpretation.ts',import.meta.url),'utf8');assert.doesNotMatch(prompts,/signpost lethal stakes/);
});
