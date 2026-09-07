import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {claimJobSQL,queueCapacity} from '../lib/queue-store';
test('shared queue reserves foreground capacity and arbitrates duplicate/stale claims',()=>{
 const db=new DatabaseSync(':memory:');db.exec(readFileSync('drizzle/0009_generation_queue.sql','utf8').replaceAll('--> statement-breakpoint',''));
 const insert=(id:string,priority=1)=>db.prepare("INSERT INTO generation_jobs(id,lane,scope,request,status,priority,created,touched) VALUES(?,'image','test','{}','queued',?,1,1000)").run(id,priority);
 const claim=(id:string,priority=1,now=1000)=>db.prepare(claimJobSQL).run('owner-'+id,now+90000,now,id,now,now,'image',now,queueCapacity('image',priority),now,now-10000).changes;
 for(let i=0;i<4;i++){insert('bg'+i);assert.equal(claim('bg'+i),1);}
 insert('fifth');assert.equal(claim('fifth'),0);
 insert('foreground',10);assert.equal(claim('foreground',10),1);
 assert.equal(claim('foreground',10),0,'same job cannot be claimed twice');
 insert('foreground2',10);assert.equal(claim('foreground2',10),1);
 insert('foreground3',10);assert.equal(claim('foreground3',10),0);
 assert.equal(claim('foreground3',10,100000),1,'expired claims release capacity');
 db.close();
});
test('recent high-priority queued work wins before a background job',()=>{
 const db=new DatabaseSync(':memory:');db.exec(readFileSync('drizzle/0009_generation_queue.sql','utf8'));
 for(const [id,p] of [['high',10],['low',1]] as const)db.prepare("INSERT INTO generation_jobs(id,lane,scope,request,status,priority,created,touched) VALUES(?,'text','x','{}','queued',?,1,1000)").run(id,p);
 assert.equal(db.prepare(claimJobSQL).run('low-owner',91000,1000,'low',1000,1000,'text',1000,10,1000,-9000).changes,0);
 assert.equal(db.prepare(claimJobSQL).run('high-owner',91000,1000,'high',1000,1000,'text',1000,12,1000,-9000).changes,1);
 db.close();
});
