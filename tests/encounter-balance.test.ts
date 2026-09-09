import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fillCharacter} from '../lib/character-text';
import {tuneEncounterBalance} from '../sandbox/encounter-balance';
import {parseProject} from '../sandbox/model';
import baseline from '../lib/fieldwork-baseline.json';
import {contextFor} from '../lib/world';
import {settingInput} from '../lib/lean-generation';
test('character tokens render in plain and Markdown-escaped forms with literal names',()=>{
 for(const token of ['{character_name}',String.raw`{character\_name}`,String.raw`\{character\_name\}`,'{ character_name }'])assert.equal(fillCharacter('Hello '+token,'A $& B'),'Hello A $& B');
});
test('city candidates halve without changing diameters; selected encounter candidates scale',()=>{
 const p=parseProject(JSON.stringify(baseline)),n=tuneEncounterBalance(p);
 p.variables.forEach((v,i)=>v.layers.forEach((l,j)=>{
  const r=n.variables[i].layers[j];
  if(['civilization.density','civilization.footprint'].includes(v.appName)&&l.source==='patches'){assert.equal(r.patchChance,l.patchChance!/2);assert.equal(r.patchMaxDiameter,l.patchMaxDiameter);}
  else if(['occurrences.option','occurrences.challenge','occurrences.certain_death'].includes(v.appName)&&l.source==='sparks'){const m=v.appName==='occurrences.certain_death'?2:3;assert.equal(r.sparkCutoff,Math.max(0,1-m*(1-l.sparkCutoff!)));}
  else assert.deepEqual(r,l);
 }));
});
test('peek definitions do not receive affiliations even when present',()=>{
 const c=contextFor('fixture',0,0);c.fieldwork=c.fieldwork.map(f=>f.id==='civilization.faction'?{...f,present:true,value:1}:f);
 const defs=settingInput([c],[]).definitions;assert.ok(!defs.some(f=>f.name===c.fieldwork.find(f=>f.id==='civilization.faction')!.name));
});
