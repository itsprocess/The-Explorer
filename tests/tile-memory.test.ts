import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {discoveryQuery,imprintQuery} from '../lib/tile-memory-queries';
test('first decision trace is shared; automatic outcomes and empty traces are ignored',()=>{
 const db=new DatabaseSync(':memory:');
 db.exec('CREATE TABLE visits(id TEXT PRIMARY KEY,character TEXT,x INTEGER,y INTEGER,value TEXT,at INTEGER); CREATE TABLE characters(id TEXT PRIMARY KEY,value TEXT);');
 db.prepare('INSERT INTO characters VALUES(?,?)').run('a',JSON.stringify({name:'First'}));db.prepare('INSERT INTO characters VALUES(?,?)').run('b',JSON.stringify({name:'Second'}));
 const add=(id:string,character:string,at:number,kind:string,imprint?:string,choice?:string)=>db.prepare('INSERT OR IGNORE INTO visits VALUES(?,?,1,2,?,?)').run(id,character,JSON.stringify({event:{kind,imprint,choice}}),at);
 add('arrival','a',1,'arrival');add('automatic','a',1.5,'interaction','Unchanged marker.');add('first','a',2,'interaction','A chipped lintel remains.','Repair the lintel');add('first','a',2,'interaction','Retry');add('later','b',3,'death','A later trace');
 assert.equal((db.prepare(discoveryQuery).get(1,2) as any).name,'First');assert.equal((db.prepare(imprintQuery).get(1,2) as any).imprint,'A chipped lintel remains.');
 db.prepare('UPDATE visits SET value=? WHERE id=?').run(JSON.stringify({event:{kind:'interaction'}}),'first');
 assert.equal(db.prepare(imprintQuery).get(1,2),undefined);db.close();
});
