import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {deathRecordsQuery} from '../lib/death-records';
test('death archive includes only the selected explorer deaths, newest first, without coordinates',()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE visits(id TEXT,character TEXT,x INTEGER,y INTEGER,value TEXT,at INTEGER)');
 const add=(id:string,who:string,kind:string,at:number)=>db.prepare('INSERT INTO visits VALUES(?,?,3,-3,?,?)').run(id,who,JSON.stringify({event:{kind,text:id,choice:'Attempt rescue'}}),at);
 add('old','a','death',1);add('new','a','death',3);add('saved','a','rescued',4);add('other','b','death',5);add('gift','a','acquisition',6);
 const q=deathRecordsQuery('a');const rows=db.prepare(q.sql).all(...q.params);
 assert.deepEqual(rows.map(r=>r.id),['new','old']);assert.deepEqual(Object.keys(rows[0]).sort(),['at','choice','id','text']);
 const next=deathRecordsQuery('a',1);assert.equal(db.prepare(next.sql).all(...next.params).length,1);
 assert.throws(()=>deathRecordsQuery('a',-1));assert.throws(()=>deathRecordsQuery("x' OR 1=1"));db.close();
});
