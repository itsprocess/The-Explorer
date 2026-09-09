import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {serverStatsSQL} from '../lib/community';
test('historical movement conversion excludes choices/returns and sums all characters',()=>{
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../runtime/schema.sql',import.meta.url),'utf8'));
 for(const id of ['a','b'])db.prepare('INSERT INTO characters(id,owner,value,revision,updated) VALUES(?,?,?,0,0)').run(id,id,JSON.stringify({distanceLife:157.7,distanceTotal:346.5,deaths:1,furthest:50}));
 const entries=[['a',0,0,'arrival'],['a',1,0,'transport_pending'],['a',100,0,'portal'],['a',100,0,'interaction'],['a',101,0,'death'],['a',0,0,'return'],['a',1,0,'arrival'],['b',0,0,'arrival'],['b',1,0,'arrival']];
 entries.forEach(([c,x,y,kind],i)=>db.prepare('INSERT INTO visits VALUES(?,?,?,?,?,?)').run(String(i),c,x,y,JSON.stringify({event:{kind}}),i));
 db.exec(readFileSync(new URL('../drizzle/0029_move_counts.sql',import.meta.url),'utf8'));
 const a=JSON.parse(db.prepare("SELECT value FROM characters WHERE id='a'").get()!.value as string);assert.equal(a.distanceTotal,4);assert.equal(a.distanceLife,1);assert.equal(a.legacyDistanceTotal,346.5);assert.equal(a.furthest,50);assert.equal(db.prepare(serverStatsSQL).get()!.moves,5);assert.equal(db.prepare('SELECT COUNT(*) n FROM visits').get()!.n,9);db.close();
});
