import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
const read=(p:string)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('unlock migration preserves accounts and isolates permission to a login session',()=>{
 const db=new DatabaseSync(':memory:');db.exec(read('runtime/schema.sql'));
 db.exec(`INSERT INTO characters(id,owner,value,revision,updated) VALUES('p','owner','{}',0,0); INSERT INTO character_sessions VALUES('first','p',999),('second','p',999);`);
 db.exec(read('drizzle/0028_dev_unlock.sql'));assert.equal(db.prepare('SELECT COUNT(*) n FROM characters').get()!.n,1);
 assert.equal(db.prepare('SELECT SUM(dev_unlocked) n FROM character_sessions').get()!.n,0);
 db.exec("UPDATE character_sessions SET dev_unlocked=1 WHERE token_hash='first'");assert.equal(db.prepare("SELECT dev_unlocked FROM character_sessions WHERE token_hash='second'").get()!.dev_unlocked,0);
 db.exec("DELETE FROM character_sessions WHERE token_hash='first'; INSERT INTO character_sessions(token_hash,character,expires) VALUES('new','p',999)");assert.equal(db.prepare("SELECT dev_unlocked FROM character_sessions WHERE token_hash='new'").get()!.dev_unlocked,0);db.close();
});
test('all privileged endpoints require the secondary session guard',()=>{
 for(const p of ['game','image','workshop','generation/retry'])assert.match(read('app/api/'+p+'/route.ts'),/requireOwner\(request\)/);
 assert.match(read('lib/auth.ts'),/requireSiteOwner\(\)[\s\S]*dev_unlocked/);
 assert.match(read('app/api/dev/unlock/route.ts'),/await requireSiteOwner\(\)/);assert.match(read('app/api/dev/unlock/route.ts'),/await throttle/);
});
test('waiting keeps server movement gates and provides a client reopen path',()=>{
 assert.match(read('lib/game.ts'),/if\(original.pendingTransport\)throw/);assert.match(read('lib/game.ts'),/if\(original.pendingOption\)throw/);
 const ui=read('app/explorer.tsx');assert.match(ui,/action==='move'.*pendingTransport.*setWaiting\(''\)/);assert.match(ui,/waiting!==pendingKey/);
 assert.doesNotMatch(read('app/teleport-dialog.tsx'),/Give up|currentTarget.disabled/);assert.match(read('app/teleport-dialog.tsx'),/>Wait</);
});
