import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {serverStatsSQL,localPlayersSQL} from '../lib/community';
test('community counts unique visited places and excludes origin-only characters from explorers',()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE characters(id TEXT,value TEXT);CREATE TABLE visits(x INTEGER,y INTEGER);CREATE TABLE character_presence(character TEXT,seen INTEGER);');
 const add=(id:string,x:number,deaths:number,furthest:number,seen:number)=>{db.prepare('INSERT INTO characters VALUES(?,?)').run(id,JSON.stringify({name:id,x,y:0,deaths,furthest}));db.prepare('INSERT INTO character_presence VALUES(?,?)').run(id,seen);};
 add('self',3,2,30,1000);add('here',3,1,40,1000);add('neighbor',4,0,4,1000);add('offline',3,0,3,1);add('origin',0,0,0,1000);
 db.exec('INSERT INTO visits VALUES(0,0),(0,0),(3,0),(4,0);');
 const stats=db.prepare(serverStatsSQL).get();assert.deepEqual({...stats},{locations:3,deaths:3,furthest:40,explorers:4});
 assert.deepEqual(db.prepare(localPlayersSQL).all(900,'self',3,0).map(p=>p.id),['here']);db.close();
});
