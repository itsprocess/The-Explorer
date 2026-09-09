import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {serverStatsSQL,localPlayersSQL,explorersQuery} from '../lib/community';
test('community counts unique visited places and excludes origin-only characters from explorers',()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE characters(id TEXT,value TEXT);CREATE TABLE visits(x INTEGER,y INTEGER);CREATE TABLE character_presence(character TEXT,seen INTEGER);');
 const add=(id:string,x:number,deaths:number,furthest:number,seen:number)=>{db.prepare('INSERT INTO characters VALUES(?,?)').run(id,JSON.stringify({name:id,x,y:0,deaths,furthest,relicsTotal:deaths,distanceTotal:10}));db.prepare('INSERT INTO character_presence VALUES(?,?)').run(id,seen);};
 add('self',3,2,30,1000);add('here',3,1,40,1000);add('neighbor',4,0,4,1000);add('offline',3,0,3,1);add('origin',0,0,0,1000);
 db.exec('INSERT INTO visits VALUES(0,0),(0,0),(3,0),(4,0);');
 const stats=db.prepare(serverStatsSQL).get();assert.deepEqual({...stats},{locations:3,relics:3,deaths:3,moves:50,furthest:40,explorers:4});
 assert.deepEqual(db.prepare(localPlayersSQL).all(900,'self',3,0).map(p=>p.id),['here']);db.close();
});

test('explorer directory pages all characters without exposing private data',()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE characters(id TEXT,value TEXT)');
 for(let i=0;i<53;i++)db.prepare('INSERT INTO characters VALUES(?,?)').run(String(i).padStart(2,'0'),JSON.stringify({name:'Explorer',definingTrait:'Wit',passwordHash:'private',x:80,history:['private']}));
 const page=(offset:number)=>{const q=explorersQuery(offset);return db.prepare(q.sql).all(...q.params);};
 assert.equal(page(0).length,51);assert.equal(page(50).length,3);assert.equal(page(50)[0].id,'50');
 assert.deepEqual(Object.keys(page(0)[0]).sort(),['id','name','trait']);
 assert.throws(()=>explorersQuery(-1));assert.throws(()=>explorersQuery(1.5));db.close();
});
