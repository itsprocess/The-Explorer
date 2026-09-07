import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openStorage} from '../runtime/storage.mjs';
import {accessGuard} from '../runtime/access.mjs';
import config from '../explorer.config.json' with {type:'json'};

test('SQLite persists, enforces unique names, rolls back atomic batches; images stay under root',async()=>{
 const root=await mkdtemp(join(tmpdir(),'explorer-storage-'));let store=openStorage(root);
 try{
  const q=store.DB.prepare;
  await q('INSERT INTO character_credentials VALUES(?,?,?,?)').bind('a','alice','hash',0).run();
  await assert.rejects(q('INSERT INTO character_credentials VALUES(?,?,?,?)').bind('b','alice','hash',0).run());
  await assert.rejects(store.DB.batch([q("INSERT INTO server_settings VALUES('rollback','x')"),q("INSERT INTO character_credentials VALUES('b','alice','x',0)")]));
  assert.equal(await q("SELECT value FROM server_settings WHERE key='rollback'").first(),null);
  const results=await store.DB.batch([q("INSERT INTO server_settings VALUES('kept','yes')"),q("UPDATE server_settings SET value='changed' WHERE key='kept' RETURNING value")]);
  assert.equal(results[1].results[0].value,'changed');assert.equal(results[1].meta.changes,1);
  await store.IMAGES.put('../../outside',new Uint8Array([1,2,3]));
  store.close();store=openStorage(root);
  assert.equal((await store.DB.prepare("SELECT value FROM server_settings WHERE key='kept'").first()).value,'changed');
  assert.deepEqual((await store.IMAGES.get('../../outside')).body,new Uint8Array([1,2,3]));
  await store.IMAGES.delete('../../outside');assert.equal(await store.IMAGES.get('../../outside'),null);
 }finally{store.close();await rm(root,{recursive:true,force:true});}
});
test('private gate fails closed and strips forged administrator headers',()=>{
 const friend='friend-secret-that-is-long-and-random',admin='admin-secret-that-is-long-and-random';
 const env={[config.hosting.accessPasswordEnv]:friend,[config.hosting.adminPasswordEnv]:admin};
 assert.throws(()=>accessGuard(config,{}));
 const guard=accessGuard(config,env);
 const attempt=(user,password,url='/')=>{
  let passed=false;const response={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},end(){}};
  const req={url,method:'GET',socket:{remoteAddress:'127.0.0.1'},headers:{authorization:'Basic '+Buffer.from(user+':'+password).toString('base64'),'oai-authenticated-user-email':config.hosting.adminEmail,'oai-authenticated-user-id':'spoofed','x-forwarded-proto':'https'}};
  guard(req,response,()=>passed=true);return {passed,req,response};
 };
 assert.equal(attempt('friend','wrong').response.statusCode,401);
 const visitor=attempt('friend',friend);assert.ok(visitor.passed);assert.equal(visitor.req.headers['oai-authenticated-user-id'],undefined);
 assert.equal(attempt('admin',admin).req.headers['oai-authenticated-user-id'],'portable-owner');
 assert.equal(attempt('friend',friend,'/explorer.config.json').response.statusCode,404);
 assert.match(visitor.response.headers['X-Robots-Tag'],/noindex/);
});
