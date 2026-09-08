import {DatabaseSync} from 'node:sqlite';
import {mkdirSync, readFileSync, rmSync} from 'node:fs';
import {writeFile, readFile, rename, rm, mkdir} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {createHash, randomUUID} from 'node:crypto';

// D1-compatible prepared statements. batch() is a synchronous SQLite transaction:
// no other request can interleave between its compare-and-swap and dependent writes.
export function openStorage(root) {
  const folder = resolve(root);
  mkdirSync(folder, {recursive:true});
  const sqlite = new DatabaseSync(join(folder, 'explorer.sqlite'));
  sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  sqlite.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  class Statement {
    constructor(sql, args=[]) { this.sql=sql; this.args=args; }
    bind(...args) { return new Statement(this.sql,args); }
    execute() {
      const stmt=sqlite.prepare(this.sql);
      const rows=stmt.columns().length ? stmt.all(...this.args) : (stmt.run(...this.args), []);
      const meta=sqlite.prepare('SELECT changes() AS changes, last_insert_rowid() AS last_row_id').get();
      return {success:true, results:rows, meta};
    }
    async all() { return this.execute(); }
    async run() { return this.execute(); }
    async first(column) { const row=this.execute().results[0]??null; return column ? row?.[column]??null : row; }
  }
  const DB={prepare:sql=>new Statement(sql), async batch(statements) {
    sqlite.exec('BEGIN IMMEDIATE');
    try { const results=statements.map(s=>s.execute()); sqlite.exec('COMMIT'); return results; }
    catch(error) { sqlite.exec('ROLLBACK'); throw error; }
  }};
  // Hash object keys so neither coordinates nor untrusted keys can escape the root.
  const pathFor=key=>join(folder,'images',createHash('sha256').update(key).digest('hex')+'.webp');
  const IMAGES={async put(key,bytes) {
    await mkdir(join(folder,'images'),{recursive:true});
    const target=pathFor(key), temp=target+'.'+randomUUID()+'.tmp';
    try { await writeFile(temp,bytes); await rename(temp,target); }
    finally { await rm(temp,{force:true}); }
  },async get(key) {
    try { return {body:new Uint8Array(await readFile(pathFor(key)))}; }
    catch(e) { if(e.code==='ENOENT')return null; throw e; }
  },async delete(keys) { await Promise.all((Array.isArray(keys)?keys:[keys]).map(key=>rm(pathFor(key),{force:true}))); }};
  function worldState(seed){
    sqlite.prepare("INSERT OR IGNORE INTO server_settings(key,value) VALUES('world:seed',?)").run(seed);
    return {seed:sqlite.prepare("SELECT value FROM server_settings WHERE key='world:seed'").get().value,
      epoch:sqlite.prepare("SELECT value FROM server_settings WHERE key='world:epoch'").get()?.value||''};
  }
  function resetWorld(seed){
    const epoch=randomUUID(),now=Date.now();
    sqlite.exec('BEGIN IMMEDIATE');
    try{
      if(sqlite.prepare("SELECT 1 FROM packages WHERE token IS NOT NULL AND lease>? LIMIT 1").get(now)||sqlite.prepare("SELECT 1 FROM generation_jobs WHERE status='running' AND lease>? LIMIT 1").get(now))throw Error('Generation is still active. Wait for it to finish before resetting.');
      const update=sqlite.prepare('UPDATE characters SET value=?,revision=revision+1,last_op=NULL,updated=? WHERE id=?');
      for(const row of sqlite.prepare('SELECT id,value FROM characters').all()){
        const old=JSON.parse(row.value);
        update.run(JSON.stringify({id:row.id,name:old.name,x:0,y:0,alive:true,deaths:0,furthest:0,badges:[],consumed:[],traits:[]}),now,row.id);
      }
      // Credentials, sessions and login throttles are intentionally untouched.
      for(const table of ['claims','packages','visits','generation_jobs','generation_usage','character_presence','server_settings'])sqlite.exec('DELETE FROM '+table);
      const save=sqlite.prepare('INSERT INTO server_settings(key,value) VALUES(?,?)');
      save.run('world:seed',seed);save.run('world:epoch',epoch);
      sqlite.exec('COMMIT');
    }catch(e){sqlite.exec('ROLLBACK');throw e;}
    let cleanupWarning=false;
    try{rmSync(join(folder,'images'),{recursive:true,force:true});}catch{cleanupWarning=true;}
    return {seed,epoch,cleanupWarning};
  }
  return {DB,IMAGES,worldState,resetWorld,close:()=>sqlite.close()};
}
