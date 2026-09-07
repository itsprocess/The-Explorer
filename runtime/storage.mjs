import {DatabaseSync} from 'node:sqlite';
import {mkdirSync, readFileSync} from 'node:fs';
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
  return {DB,IMAGES,close:()=>sqlite.close()};
}
