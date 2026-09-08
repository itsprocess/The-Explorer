import {readFileSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import {openStorage} from './storage.mjs';
import {accessGuard} from './access.mjs';
import {createHash} from 'node:crypto';
import {Server} from 'node:http';
import {worldAdmin} from './world-admin.mjs';

const passenger=globalThis.PhusionPassenger;
if(passenger)passenger.configure({autoInstall:false});

// Config has no secrets; credential values are injected by the hosting secret manager.
const config=JSON.parse(readFileSync(new URL('../explorer.config.json',import.meta.url),'utf8'));
const manifest=JSON.parse(readFileSync('dist/explorer-build.json','utf8'));
const compiledConfig={...config};delete compiledConfig.hosting;
if(manifest.target!=='node'||manifest.basePath!==config.hosting.basePath||manifest.configHash!==createHash('sha256').update(JSON.stringify(compiledConfig)).digest('hex'))
  throw Error('Configuration changed or wrong build target. Run npm run build:node before starting.');
try{process.loadEnvFile('.env.local');}catch(e){if(e.code!=='ENOENT')throw e;}
const guard=accessGuard(config);
const dataRoot=resolve(config.hosting.dataDirectory);
const inside=(parent,child)=>{const path=relative(parent,child);return path===''||(!path.startsWith('..')&&!isAbsolute(path));};
if(inside(dataRoot,process.cwd())||['public','dist','node_modules'].some(folder=>inside(resolve(folder),dataRoot)))
  throw Error('Keep dataDirectory in a dedicated private folder, outside public/dist/node_modules and not an ancestor of the application.');
process.env.VINEXT_TRUST_PROXY='1'; // The guard replaces, never forwards, client proxy headers.
const storage=openStorage(dataRoot);
const configuredSeed=process.env.WORLD_SEED?.trim()||config.world.seed;
const existingWorld=await storage.DB.prepare('SELECT 1 AS present FROM packages LIMIT 1').first();
const activeWorld=storage.worldState(existingWorld?config.world.seed:configuredSeed);
globalThis.__explorerBindings={...storage,
  OPENAI_API_KEY:process.env[config.provider.apiKeyEnv],
  OPENAI_MODEL:config.provider.textModel,OPENAI_IMAGE_MODEL:config.provider.imageModel,
  WORLD_SEED:activeWorld.seed,WORLD_EPOCH:activeWorld.epoch,ADMIN_EMAIL:config.hosting.adminEmail};
const administerWorld=worldAdmin(storage,globalThis.__explorerBindings,configuredSeed,config.hosting.basePath);
const {startProdServer}=await import('vinext/server/prod-server');
// Vinext creates and binds its server together. Intercept its first listen only
// to install the gate before any socket opens, then restore Node immediately.
// This avoids the former temporary loopback listener and close/rebind sequence.
const originalListen=Server.prototype.listen;
let attached=false;
Server.prototype.listen=function(...args){
  Server.prototype.listen=originalListen;
  const handlers=this.listeners('request');
  if(!handlers.length)throw Error('Expected the framework request handler before listen.');
  this.removeAllListeners('request');
  this.on('request',(req,res)=>guard(req,res,()=>administerWorld(req,res,()=>handlers.forEach(handler=>handler.call(this,req,res)))));
  attached=true;
  if(passenger)return originalListen.call(this,'passenger',args.at(-1));
  return originalListen.apply(this,args);
};
let server;
try{
  ({server}=await startProdServer({host:config.hosting.host,port:Number(process.env.PORT||config.hosting.port),outDir:resolve('dist'),silent:true}));
}finally{Server.prototype.listen=originalListen;}
if(!attached)throw Error('Framework startup did not attach the access guard.');
console.log('The Explorer is listening. Private prototype access is enabled.');
function stop(){server.close(()=>{storage.close();process.exit(0);});}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
