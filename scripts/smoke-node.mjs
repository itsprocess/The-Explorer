// HTTP and persistence plumbing only. No character creation or generation requests.
import {mkdtemp,cp,writeFile,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {createServer} from 'node:net';
import assert from 'node:assert/strict';
import config from '../explorer.config.json' with {type:'json'};
const socket=createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));
const folder=await mkdtemp(join(tmpdir(),'explorer-http-'));
let child,log='';
try {
 await cp('dist',join(folder,'dist'),{recursive:true});await cp('runtime',join(folder,'runtime'),{recursive:true});
 await symlink(resolve('node_modules'),join(folder,'node_modules'),'junction');
 await writeFile(join(folder,'package.json'),'{"type":"module"}');
 config.hosting.publicOrigin='http://localhost:'+port;config.hosting.port=port;
 await writeFile(join(folder,'explorer.config.json'),JSON.stringify(config));
 const friend=randomBytes(32).toString('hex'),admin=randomBytes(32).toString('hex');
 const env={...process.env,PORT:String(port),[config.provider.apiKeyEnv]:'',[config.hosting.accessPasswordEnv]:friend,[config.hosting.adminPasswordEnv]:admin};
 child=spawn(process.execPath,['runtime/start.mjs'],{cwd:folder,env,stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',v=>log+=v);child.stderr.on('data',v=>log+=v);
 const origin='http://127.0.0.1:'+port;
 let ready=false;
 for(let i=0;i<80;i++){try{const r=await fetch(origin);if(r.status===401){ready=true;break;}}catch{}if(child.exitCode!==null)break;await new Promise(r=>setTimeout(r,100));}
 assert.ok(ready,'Server failed to start: '+log);
 const auth=who=>'Basic '+Buffer.from(who+':'+(who==='admin'?admin:friend)).toString('base64');
 let r=await fetch(origin,{headers:{authorization:auth('friend')}});assert.equal(r.status,200);assert.match(r.headers.get('x-robots-tag'),/noindex/);
 r=await fetch(origin+'/api/workshop?x=0&y=0',{headers:{authorization:auth('friend'),'oai-authenticated-user-id':'portable-owner','oai-authenticated-user-email':config.hosting.adminEmail}});assert.equal(r.status,401);
 r=await fetch(origin+'/api/game',{method:'POST',headers:{authorization:auth('friend'),'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,401);
 r=await fetch(origin+'/world-data/explorer.sqlite',{headers:{authorization:auth('admin')}});assert.equal(r.status,404);
 r=await fetch(origin+'/robots.txt');assert.match(await r.text(),/Disallow: \//);
 console.log('Portable HTTP checks passed: gated root, forged admin rejected, game session required, private storage hidden, crawler exclusions. No generation requested.');
} finally {
 if(child&&child.exitCode===null){child.kill();await new Promise(r=>child.once('exit',r));}
 await rm(folder,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}
