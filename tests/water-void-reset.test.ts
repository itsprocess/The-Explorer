import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import baseline from '../lib/fieldwork-baseline.json';
import {parseProject,evaluator,blocksExploration} from '../sandbox/model';

test('lake candidates increase 2.5x without changing basin sizes; masks remain last',()=>{
 const p=parseProject(JSON.stringify(baseline)),v=p.variables.find(v=>v.appName==='biome.lakes_ponds')!;
 const patches=v.layers.filter(l=>l.source==='patches');assert.equal(patches.length,3);
 assert.ok(Math.abs(patches.reduce((n,l)=>n+l.patchChance!,0)/patches[0].patchChance!-2.5)<1e-9);
 for(const l of patches){assert.equal(l.patchMinDiameter,12);assert.equal(l.patchMaxDiameter,44);assert.equal(l.patchSpacing,patches[0].patchSpacing);}
 assert.equal(v.layers.at(-1)!.reference,'biome.void');assert.equal(v.traversal!.mode,'positive');
});
test('void pockets block movement and stay excluded from ocean',()=>{
 const p=parseProject(JSON.stringify(baseline)),v=p.variables.find(v=>v.appName==='biome.void')!;
 assert.ok(Math.abs(v.layers[0].scaleX-300/Math.sqrt(2))<1e-9);
 const pocket=v.layers.find(l=>l.source==='patches')!;assert.equal(pocket.patchMinDiameter,3);assert.equal(pocket.patchMaxDiameter,9);
 // Controlled values verify union order and masking without sampling a procedural map.
 for(const l of v.layers)if(l.source!=='variable'){l.source='constant';l.constant=l===pocket?1:0;l.gain=1;l.bias=0;l.invert=false;}
 const ocean=p.variables.find(v=>v.id==='natural.ocean')!;ocean.layers=[{...pocket,id:'ocean-fixture',source:'constant',constant:0,blend:'replace'}];
 assert.equal(blocksExploration(v,evaluator(p)(v.id,0,0).value),true);
 ocean.layers[0].constant=1;assert.equal(evaluator(p)(v.id,0,0).value,0);
});
test('requested reset clears progress, preserves credentials/session/trait, and queues old image removal',()=>{
 const db=new DatabaseSync(':memory:');
 db.exec('CREATE TABLE characters(id TEXT PRIMARY KEY,owner TEXT,value TEXT,revision INTEGER,last_op TEXT);CREATE TABLE server_settings(key TEXT PRIMARY KEY,value TEXT);');
 for(const t of ['visits','claims','generation_jobs','generation_usage','packages','character_presence','character_credentials','character_sessions']){db.exec(`CREATE TABLE ${t}(id TEXT);INSERT INTO ${t} VALUES('keep-or-clear');`);}
 db.prepare('INSERT INTO characters VALUES(?,?,?,?,?)').run('p','p',JSON.stringify({id:'p',name:'Ari',definingTrait:'Faith',deaths:9,standings:[{}],devState:{},pendingOption:{},traits:[{}],relicsTotal:8}),4,'old');
 db.exec(readFileSync(new URL('../drizzle/0030_reset_water_void.sql',import.meta.url),'utf8'));
 const c=JSON.parse(db.prepare('SELECT value FROM characters').get()!.value as string);assert.equal(c.name,'Ari');assert.equal(c.definingTrait,'Faith');assert.equal(c.deaths,0);assert.equal(c.relicsTotal,0);assert.equal(c.devState,undefined);assert.equal(c.pendingOption,undefined);assert.equal(c.standings,undefined);
 for(const t of ['visits','claims','generation_jobs','generation_usage','packages','character_presence'])assert.equal(db.prepare(`SELECT count(*) n FROM ${t}`).get()!.n,0);
 for(const t of ['character_credentials','character_sessions'])assert.equal(db.prepare(`SELECT count(*) n FROM ${t}`).get()!.n,1);
 assert.equal(db.prepare("SELECT value FROM server_settings WHERE key='dev-image-reset-20260908'").get()!.value,'0');db.close();
});
