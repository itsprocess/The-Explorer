import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
test('authorized dev reset deletes accounts and generated data while retaining schema and one-time image purge',()=>{
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../runtime/schema.sql',import.meta.url),'utf8'));
 db.exec("INSERT INTO characters(id,owner,value,revision,updated) VALUES('dev','dev','{}',0,0); INSERT INTO character_credentials(character,name_key,password_hash,created) VALUES('dev','dev','hash',0); INSERT INTO character_sessions(token_hash,character,expires) VALUES('session','dev',999); INSERT INTO packages(key,kind,value,lease,updated) VALUES('old','cell','{}',0,0); INSERT INTO server_settings(key,value) VALUES('old-setting','old');");
 db.exec(readFileSync(new URL('../drizzle/0015_reset_dev_fieldwork.sql',import.meta.url),'utf8'));
 for(const table of ['characters','character_credentials','character_sessions','packages','visits','claims','generation_jobs','generation_usage','auth_attempts','character_presence'])assert.equal(db.prepare('SELECT COUNT(*) AS n FROM '+table).get().n,0);
 assert.equal(db.prepare("SELECT value FROM server_settings WHERE key='dev-image-reset-20260908'").get().value,'0');
 assert.equal(db.prepare("SELECT value FROM server_settings WHERE key='old-setting'").get(),undefined);db.close();
});
