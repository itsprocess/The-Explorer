import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {openStorage} from '../runtime/storage.mjs';
test('world reset preserves credentials and sessions, rejects active generation, and persists the new seed',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'explorer-reset-'));let store=openStorage(folder);
 try{
  const q=sql=>store.DB.prepare(sql);
  store.worldState('old');
  await q('INSERT INTO character_credentials VALUES(?,?,?,?)').bind('player','alice','password-hash',1).run();
  await q('INSERT INTO character_sessions VALUES(?,?,?)').bind('session-hash','player',9999999999999).run();
  await q('INSERT INTO characters(id,owner,value,revision,updated) VALUES(?,?,?,?,?)').bind('player','owner',JSON.stringify({name:'Alice',x:55,y:19,alive:false,badges:['old'],traits:['old']}),7,1).run();
  await q('INSERT INTO visits VALUES(?,?,?,?,?,?)').bind('visit','player',55,19,'{}',1).run();
  await q('INSERT INTO packages VALUES(?,?,?,?,?,?)').bind('old-cell','cell','{}','busy',Date.now()+10000,1).run();
  await store.IMAGES.put('old-image',new Uint8Array([1]));
  assert.throws(()=>store.resetWorld('new'),/active/);
  assert.equal((await q('SELECT revision FROM characters').first()).revision,7);
  await q('UPDATE packages SET token=NULL,lease=0').run();
  const reset=store.resetWorld('new');assert.ok(reset.epoch);assert.equal(reset.cleanupWarning,false);
  assert.equal((await q('SELECT password_hash FROM character_credentials').first()).password_hash,'password-hash');
  assert.equal((await q('SELECT token_hash FROM character_sessions').first()).token_hash,'session-hash');
  const row=await q('SELECT * FROM characters').first(),character=JSON.parse(row.value);
  assert.equal(row.owner,'owner');assert.equal(row.revision,8);assert.equal(character.name,'Alice');assert.equal(character.x,0);assert.equal(character.alive,true);assert.deepEqual(character.traits,[]);
  assert.equal(await q('SELECT * FROM visits').first(),null);assert.equal(await q('SELECT * FROM packages').first(),null);assert.equal(await store.IMAGES.get('old-image'),null);
  store.close();store=openStorage(folder);assert.deepEqual(store.worldState('ignored'),{seed:'new',epoch:reset.epoch});
 }finally{store.close();await rm(folder,{recursive:true,force:true});}
});
