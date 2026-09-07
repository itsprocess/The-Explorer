import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {historyQuery} from '../lib/history-search';
test('search finds provenance through every lifecycle change, escapes wildcards, and isolates profiles',()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE visits(id TEXT,character TEXT,x INTEGER,y INTEGER,value TEXT,at INTEGER);');
 const insert=(id:string,who:string,type:string,kind:string)=>db.prepare('INSERT INTO visits VALUES(?,?,8,0,?,1)').run(id,who,JSON.stringify({event:{kind,text:'A historical incident.',stateChanges:[{type,trait:{name:'Reed_Queen 100% Favor',source:{title:'Stone Path'}}}]}}));
 insert('1','a','acquired','acquisition');insert('2','a','lost','death');insert('3','b','acquired','acquisition');
 const search=(text:string,filter='all')=>{const q=historyQuery('a',text,filter);return db.prepare(q.sql).all(...q.params);};
 assert.equal(search('Reed_Queen').length,2);assert.equal(search('Stone Path','acquisitions').length,1);assert.equal(search('Favor','losses').length,1);assert.equal(search('100%').length,2);assert.equal(search("' OR 1=1 --").length,0);assert.equal(search('8, 0').length,2);
 assert.throws(()=>historyQuery('a','','arbitrary'));assert.throws(()=>historyQuery('a','','all',-1));db.close();
});
