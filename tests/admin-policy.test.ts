import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isAdminEmail} from '../lib/admin-policy';
test('admin controls fail closed and accept only the configured platform identity',()=>{
 assert.equal(isAdminEmail(undefined,'owner@example.test'),false);assert.equal(isAdminEmail('visitor@example.test','owner@example.test'),false);assert.equal(isAdminEmail('owner@example.test',undefined),false);assert.equal(isAdminEmail('OWNER@example.test','owner@example.test'),true);
});
