// HTTP and persistence plumbing only. No character creation or generation requests.
import {mkdtemp,cp,readFile,writeFile,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {createServer} from 'node:net';
import assert from 'node:assert/strict';
const source=resolve(process.env.EXPLORER_SMOKE_ROOT||'.');
const config=JSON.parse(await readFile(join(source,'explorer.config.json'),'utf8'));
const socket=createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));
const folder=await mkdtemp(join(tmpdir(),'explorer-http-'));
let child,log='';
try {
 await cp(join(source,'app.js'),join(folder,'app.js'));
 await cp(join(source,'dist'),join(folder,'dist'),{recursive:true});await cp(join(source,'runtime'),join(folder,'runtime'),{recursive:true});
 await symlink(resolve(process.env.EXPLORER_SMOKE_MODULES||'node_modules'),join(folder,'node_modules'),'junction');
 await writeFile(join(folder,'package.json'),'{"type":"module"}');
 config.hosting.dataDirectory=join(folder,'world-data');
 config.hosting.publicOrigin='';config.hosting.port=port;
 await writeFile(join(folder,'explorer.config.json'),JSON.stringify(config));
 const friend=randomBytes(32).toString('hex'),admin=randomBytes(32).toString('hex');
 const env={...process.env,PORT:String(port),[config.hosting.publicOriginEnv||'EXPLORER_PUBLIC_ORIGIN']:'http://localhost:'+port,[config.provider.apiKeyEnv]:'',[config.hosting.accessPasswordEnv]:friend,[config.hosting.adminPasswordEnv]:admin};
 await writeFile(join(folder,'listen-check.cjs'),`const http=require('node:http');const original=http.Server.prototype.listen;http.Server.prototype.listen=function(...args){console.log('LISTEN_CHECK '+JSON.stringify(args.filter(v=>typeof v!=='function')));return original.apply(this,args);};`);
 child=spawn(process.execPath,['--require','./listen-check.cjs','--eval',"require('./app.js')"],{cwd:folder,env,stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',v=>log+=v);child.stderr.on('data',v=>log+=v);
 const origin='http://127.0.0.1:'+port+config.hosting.basePath;
 let ready=false;
 for(let i=0;i<80;i++){try{const r=await fetch(origin);if(r.status===401){ready=true;break;}}catch{}if(child.exitCode!==null)break;await new Promise(r=>setTimeout(r,100));}
 assert.ok(ready,'Server failed to start: '+log);
 const healthUrl='http://127.0.0.1:'+port+'/healthz';
 const landing=await fetch('http://127.0.0.1:'+port+'/');assert.equal(landing.status,200);assert.ok((await landing.text()).includes('href="'+config.hosting.basePath+'/"'));
 assert.equal((await fetch('http://127.0.0.1:'+port+'/',{method:'HEAD'})).status,200);
 assert.equal((await fetch(origin)).status,401);
 const health=await fetch(healthUrl);assert.equal(health.status,200);assert.deepEqual(await health.json(),{status:'ok'});
 assert.equal((await fetch(healthUrl,{method:'HEAD'})).status,200);
 assert.equal((await fetch(healthUrl,{method:'POST'})).status,405);
 assert.equal((await fetch(origin+'/api/world-admin')).status,401);
 const listens=log.split('\n').filter(line=>line.startsWith('LISTEN_CHECK '));
 assert.equal(listens.length,1,'Startup must bind only once');
 assert.deepEqual(JSON.parse(listens[0].slice('LISTEN_CHECK '.length)),[port,config.hosting.host],'Bind directly to the assigned port and configured interface');
 const auth=who=>'Basic '+Buffer.from(who+':'+(who==='admin'?admin:friend)).toString('base64');
 // Guest snapshots exercise the async stream without creating characters/cells.
 for(const who of ['friend','admin']){
  const streamed=await fetch(origin+'/api/game',{headers:{authorization:auth(who),Accept:'application/x-ndjson','oai-authenticated-user-email':config.hosting.adminEmail,'oai-authenticated-user-id':'spoofed'}});
  const packets=(await streamed.text()).trim().split('\n').map(line=>JSON.parse(line));
  assert.ok(!packets.some(p=>p.type==='error'),'Streamed snapshot must not lose request context');
  const completed=packets.find(p=>p.type==='complete');assert.ok(completed,'Stream completed');
  assert.equal(completed.data.canInspect,who==='admin');assert.equal(completed.data.character,null);
 }
 let r=await fetch(origin,{headers:{authorization:auth('friend')}});assert.equal(r.status,200);assert.match(r.headers.get('x-robots-tag'),/noindex/);
 const html=await r.text();assert.ok(html.includes(config.hosting.basePath+'/_next/'),'Framework assets must use the mount path');
 const asset=html.match(/src="([^"]+\.js[^"]*)"/);assert.ok(asset,'script asset exists');
 const assetResponse=await fetch('http://127.0.0.1:'+port+asset[1],{headers:{authorization:auth('friend')}});assert.equal(assetResponse.status,200);
 let share=await fetch(origin+'/cell/123/456',{headers:{authorization:auth('friend')}});assert.equal(share.status,200);assert.ok((await share.text()).includes('href="'+config.hosting.basePath+'/"'),'Share return link must use the mount path');
 r=await fetch(origin+'/api/workshop?x=0&y=0',{headers:{authorization:auth('friend'),'oai-authenticated-user-id':'portable-owner','oai-authenticated-user-email':config.hosting.adminEmail}});assert.equal(r.status,401);
 r=await fetch(origin+'/api/game',{method:'POST',headers:{authorization:auth('friend'),'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,401);
 r=await fetch(origin+'/world-data/explorer.sqlite',{headers:{authorization:auth('admin')}});assert.equal(r.status,404);
 r=await fetch('http://127.0.0.1:'+port+'/robots.txt');assert.match(await r.text(),/Disallow: \//);
 r=await fetch(origin+'/api/world-admin',{method:'POST',headers:{authorization:auth('friend'),'X-Explorer-Confirm':'WIPE WORLD'}});assert.equal(r.status,403);
 r=await fetch(origin+'/api/world-admin',{method:'POST',headers:{authorization:auth('admin')}});assert.equal(r.status,400);
 r=await fetch(origin+'/api/world-admin',{method:'POST',headers:{authorization:auth('admin'),'X-Explorer-Confirm':'WIPE WORLD',Origin:'https://foreign.example'}});assert.equal(r.status,403);
 r=await fetch(origin+'/api/world-admin',{headers:{authorization:auth('admin')}});assert.equal(r.status,200);assert.equal((await r.json()).available,true);
 r=await fetch(origin+'/api/world-admin',{method:'POST',headers:{authorization:auth('admin'),'X-Explorer-Confirm':'WIPE WORLD'}});assert.equal(r.status,200);assert.equal((await r.json()).accountsPreserved,true);
 console.log('Portable HTTP checks passed: gated root, forged admin rejected, game session required, private storage hidden, crawler exclusions. No generation requested.');
} finally {
 if(child&&child.exitCode===null){child.kill();await new Promise(r=>child.once('exit',r));}
 await rm(folder,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}
