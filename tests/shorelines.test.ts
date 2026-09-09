import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {boundaryTerrain,devConnections,LIMIT,contextFor} from '../lib/world';
import {settingInput} from '../lib/lean-generation';
import {compactContext} from '../lib/prompts';
import {previewResult} from '../lib/dev-travel-state';

test('shore context carries physical water and abyss neighbors into both interpretation and scene',()=>{
 assert.deepEqual(boundaryTerrain({'natural.ocean':1,'biome.void':0,'biome.chasms':1,'biome.river':.4}),[{kind:'ocean',strength:1},{kind:'chasm',strength:1},{kind:'river',strength:.4}]);
 const c=contextFor('shore-fixture',0,0);c.adjacentTerrain=[{direction:'east',terrain:boundaryTerrain({'natural.ocean':1})}];
 assert.deepEqual(settingInput([c],[]).cells[0].adjacentTerrain,c.adjacentTerrain);
 assert.deepEqual(compactContext(c).adjacentTerrain,c.adjacentTerrain);
});
test('Dev compass remains available independent of simulated death, bounded by coordinate limits',()=>{
 assert.deepEqual(devConnections(100,100),{north:true,east:true,south:true,west:true});
 assert.deepEqual(devConnections(LIMIT,-LIMIT),{north:false,east:false,south:true,west:true});
 const real={id:'a',name:'A',x:0,y:0,alive:true,deaths:0,furthest:0,badges:[],consumed:[]};
 const dead=previewResult(real,{...real,x:100,alive:false},{kind:'death',text:'Fell.',newBadge:null});
 const continued=previewResult(real,{...dead.devState,x:101,alive:true},{kind:'arrival',text:'Arrived.',newBadge:null});
 assert.equal(continued.devState.x,101);assert.equal(real.x,0);assert.deepEqual(real.badges,[]);
});
test('shoreline wipe preserves identity, trait and sessions but removes preview and world progress',()=>{
 const db=new DatabaseSync(':memory:');
 for(const table of ['packages','visits','claims','character_presence','generation_jobs','generation_usage'])db.exec(`CREATE TABLE ${table}(id TEXT); INSERT INTO ${table} VALUES ('old');`);
 db.exec('CREATE TABLE server_settings(key TEXT PRIMARY KEY,value TEXT); CREATE TABLE characters(id TEXT,value TEXT,revision INTEGER,last_op TEXT); CREATE TABLE character_sessions(id TEXT); INSERT INTO character_sessions VALUES (\'session\');');
 db.prepare('INSERT INTO characters VALUES (?,?,0,NULL)').run('a',JSON.stringify({id:'a',name:'A',definingTrait:'Wit',x:300,devState:{x:100},badges:[{id:'old'}],pendingTransport:{token:'old'}}));
 db.exec(readFileSync(new URL('../drizzle/0022_reset_shorelines.sql',import.meta.url),'utf8'));
 const c=JSON.parse(db.prepare('SELECT value FROM characters').get()!.value as string);assert.equal(c.name,'A');assert.equal(c.definingTrait,'Wit');assert.equal(c.x,0);assert.equal(c.devState,undefined);assert.equal(c.pendingTransport,undefined);assert.deepEqual(c.badges,[]);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM character_sessions').get()!.n,1);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM packages').get()!.n,0);db.close();
});
