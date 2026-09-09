import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {actionStatements} from '../lib/action-commit';
import {resolveArrival} from '../lib/rules';
const player=(id:string):any=>({id,name:id,x:0,y:0,alive:true,deaths:0,furthest:0,badges:[],consumed:[]});
const p:any={context:{seed:'s',version:'v',x:1,y:1,distance:1,regions:[],occurrences:{relic:true,death:false}},scene:{title:'Ruins'},regions:[],occurrenceText:{choices:[],outcomes:[{key:'relic',text:'{character_name} uncovered a lost star chart.',repeatText:'{character_name} examined the already uncovered star chart.',awards:[]}]}};
function setup(){const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE characters(id TEXT PRIMARY KEY,owner TEXT,value TEXT,revision INTEGER,last_op TEXT,updated INTEGER);CREATE TABLE visits(id TEXT PRIMARY KEY,character TEXT,x INTEGER,y INTEGER,value TEXT,at INTEGER);CREATE TABLE claims(key TEXT PRIMARY KEY,character TEXT,operation TEXT,at INTEGER);');for(const id of ['a','b'])db.prepare('INSERT INTO characters VALUES(?,?,?,0,NULL,0)').run(id,id,JSON.stringify(player(id)));return db;}
function commit(db:DatabaseSync,id:string,revision=0,op=id){
 const winner=resolveArrival(player(id),p,false,op),loser=resolveArrival(player(id),p,true,op);
 const adapter:any={prepare:(sql:string)=>({bind:(...params:any[])=>({sql,params})})};
 const plan=actionStatements(adapter,{id,owner:id,revision,op,now:1,x:1,y:1,winner,loser,claim:{key:'s:v:cell:1:1:relic',relic:true}});
 db.exec('BEGIN');try{for(const q of plan.queries as any[])db.prepare(q.sql).run(...q.params);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
}
test('two contenders computed before commit produce only one global discovery and counter',()=>{
 const db=setup();commit(db,'a');commit(db,'b');
 const a=JSON.parse(db.prepare("SELECT value FROM characters WHERE id='a'").get()!.value as string),b=JSON.parse(db.prepare("SELECT value FROM characters WHERE id='b'").get()!.value as string);
 assert.equal(a.relicsTotal,1);assert.equal(b.relicsTotal??0,0);assert.equal(b.relicClaims.length,0);
 const later=JSON.parse(db.prepare("SELECT value FROM visits WHERE character='b'").get()!.value as string).event;
 assert.equal(later.kind,'revisit');assert.equal(later.relic,undefined);assert.match(later.text,/already uncovered/);
 assert.equal(db.prepare('SELECT count(*) n FROM claims').get()!.n,1);
 commit(db,'a',0,'stale');assert.equal(db.prepare("SELECT count(*) n FROM visits WHERE id='stale'").get()!.n,0);db.close();
});
test('pre-update discovery history blocks a new claim without changing the old history',()=>{
 const db=setup();db.prepare('INSERT INTO visits VALUES(?,?,?,?,?,?)').run('old','a',1,1,JSON.stringify({event:{relic:{text:'Found long ago'}}}),0);commit(db,'b');
 assert.equal(db.prepare('SELECT count(*) n FROM claims').get()!.n,0);const b=JSON.parse(db.prepare("SELECT value FROM characters WHERE id='b'").get()!.value as string);assert.equal(b.relicsTotal??0,0);assert.equal(db.prepare('SELECT count(*) n FROM visits').get()!.n,2);db.close();
});
test('a stale character cannot reserve an undiscovered relic',()=>{
 const db=setup();db.prepare("UPDATE characters SET revision=1 WHERE id='a'").run();commit(db,'a');assert.equal(db.prepare('SELECT count(*) n FROM claims').get()!.n,0);commit(db,'b');assert.equal(db.prepare('SELECT character FROM claims').get()!.character,'b');db.close();
});
