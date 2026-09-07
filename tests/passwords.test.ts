import {test} from 'node:test';
import assert from 'node:assert/strict';
import {characterName,hashPassword,verifyPassword,tokenHash} from '../lib/passwords';
test('names normalize to one global case-insensitive identity',()=>{
 assert.equal(characterName('  River Walker ').key,characterName('RIVER WALKER').key);
 assert.equal(characterName('Ｒiver').key,'river');
 for(const name of ['', 'a', '<script>', 'x'.repeat(41)])assert.throws(()=>characterName(name));
});
test('passwords use independent salts and reject incorrect or malformed credentials',async()=>{
 const a=await hashPassword('correct horse battery'),b=await hashPassword('correct horse battery');
 assert.notEqual(a,b);assert.ok(!a.includes('correct horse'));
 assert.equal(await verifyPassword('correct horse battery',a),true);
 assert.equal(await verifyPassword('incorrect horse battery',a),false);
 assert.equal(await verifyPassword('correct horse battery','malformed'),false);
 await assert.rejects(hashPassword('short'));
 assert.equal((await tokenHash('session-token')).length,64);
});
