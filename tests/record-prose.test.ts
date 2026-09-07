import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import TraitDisplay,{PublicStateChanges,StateChanges} from '../app/trait-display';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {assertScene,compileScene} from '../lib/prompts';
import {contextFor} from '../lib/world';
const trait:any={id:'a',kind:'status',family:'burden',value:'exposure',name:'Exposure',description:'Burden status; value exposure; lasts until death.',lifetime:'until_death',source:{x:1,y:2,title:'Ground',visitId:'a',world:'old'}};
test('trait cards omit mechanical descriptions and public deaths omit changes while private history retains them',()=>{
 const card=renderToStaticMarkup(createElement(TraitDisplay,{traits:[trait],character:'c'}));assert.ok(!card.includes('Burden status;'));assert.ok(card.includes('Until Death'));
 const changes:any=[{type:'lost',trait,reason:'Lost on death'}];assert.equal(renderToStaticMarkup(createElement(PublicStateChanges,{kind:'death',changes})), '');assert.ok(renderToStaticMarkup(createElement(StateChanges,{changes})).includes('Exposure'));
});
test('Riverglass reset preserves identity credentials and sessions while removing all old-world progress',()=>{
 const db=new DatabaseSync(':memory:');for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')&&!f.startsWith('0014')).sort())db.exec(readFileSync('drizzle/'+f,'utf8'));
 db.prepare('INSERT INTO characters(id,owner,value,updated) VALUES(?,?,?,1)').run('c','owner',JSON.stringify({id:'c',name:'Explorer',x:50,y:9,alive:false,deaths:4,furthest:99,badges:[1],consumed:[1],traits:[trait],pendingTransport:{token:'old'}}));
 db.exec("INSERT INTO character_credentials VALUES('c','explorer','hash',1);INSERT INTO character_sessions VALUES('session','c',9999999999999)");
 db.exec(readFileSync('drizzle/0014_riverglass_world.sql','utf8'));
 const row=db.prepare('SELECT * FROM characters').get() as any,c=JSON.parse(row.value);assert.equal(c.name,'Explorer');assert.equal(row.owner,'owner');assert.equal(c.x,0);assert.equal(c.alive,true);assert.equal(c.deaths,0);assert.deepEqual(c.traits,[]);assert.equal(c.pendingTransport,undefined);
 assert.equal((db.prepare('SELECT password_hash FROM character_credentials').get() as any).password_hash,'hash');assert.equal((db.prepare('SELECT token_hash FROM character_sessions').get() as any).token_hash,'session');db.close();
});

test('system bookkeeping is rejected instead of published as encounter prose',()=>{
 const c=contextFor('prose',0,0);const s=compileScene({title:'Clearing',description:'An ordinary grassy clearing.',exits:Object.fromEntries(c.edges.map(e=>[e.direction,'A firm route leads onward.'])),event_narrative:'experienced a small automatic incident later recorded in history.'});
 assert.throws(()=>assertScene(s,c),/specific physical incident/);
});
