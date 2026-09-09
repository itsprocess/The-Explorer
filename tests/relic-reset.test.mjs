import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
for(const migration of ['0023_reset_relics','0024_reset_encounter_repair'])test(migration+' preserves credentials and sessions while clearing all progress',()=>{
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../runtime/schema.sql',import.meta.url),'utf8'));
 const old={id:'dev',name:'Explorer',definingTrait:'Wit',distanceTotal:99,relicsTotal:4};
 db.prepare('INSERT INTO characters(id,owner,value,revision,updated) VALUES(?,?,?,0,0)').run('dev','dev',JSON.stringify(old));
 db.exec("INSERT INTO character_credentials VALUES('dev','explorer','hash',0); INSERT INTO character_sessions VALUES('session','dev',999); INSERT INTO packages(key,kind,value,lease,updated) VALUES('old','cell','{}',0,0); INSERT INTO server_settings VALUES('old','value');");
 db.exec(readFileSync(new URL('../drizzle/'+migration+'.sql',import.meta.url),'utf8'));
 const c=JSON.parse(db.prepare('SELECT value FROM characters').get().value);
 assert.equal(c.name,'Explorer');assert.equal(c.definingTrait,'Wit');assert.equal(c.alive,true);
 for(const key of ['x','y','deaths','furthest','distanceLife','distanceTotal','relicsLife','relicsTotal'])assert.equal(c[key],0);
 assert.deepEqual(c.relicClaims,[]);
 assert.equal(db.prepare('SELECT password_hash FROM character_credentials').get().password_hash,'hash');
 assert.equal(db.prepare('SELECT token_hash FROM character_sessions').get().token_hash,'session');
 assert.equal(db.prepare('SELECT COUNT(*) n FROM packages').get().n,0);
 assert.equal(db.prepare("SELECT value FROM server_settings WHERE key='dev-image-reset-20260908'").get().value,'0');db.close();
});
