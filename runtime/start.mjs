import {readFileSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import {openStorage} from './storage.mjs';
import {accessGuard} from './access.mjs';
import {createHash} from 'node:crypto';

// Config has no secrets; credential values are injected by the hosting secret manager.
const config=JSON.parse(readFileSync(new URL('../explorer.config.json',import.meta.url),'utf8'));
const manifest=JSON.parse(readFileSync('dist/explorer-build.json','utf8'));
const compiledConfig={...config};delete compiledConfig.hosting;
if(manifest.target!=='node'||manifest.configHash!==createHash('sha256').update(JSON.stringify(compiledConfig)).digest('hex'))
  throw Error('Configuration changed or wrong build target. Run npm run build:node before starting.');
try{process.loadEnvFile('.env.local');}catch(e){if(e.code!=='ENOENT')throw e;}
const guard=accessGuard(config);
const dataRoot=resolve(config.hosting.dataDirectory);
const inside=(parent,child)=>{const path=relative(parent,child);return path===''||(!path.startsWith('..')&&!isAbsolute(path));};
if(inside(dataRoot,process.cwd())||['public','dist','node_modules'].some(folder=>inside(resolve(folder),dataRoot)))
  throw Error('Keep dataDirectory in a dedicated private folder, outside public/dist/node_modules and not an ancestor of the application.');
process.env.VINEXT_TRUST_PROXY='1'; // The guard replaces, never forwards, client proxy headers.
const storage=openStorage(dataRoot);
globalThis.__explorerBindings={...storage,
  OPENAI_API_KEY:process.env[config.provider.apiKeyEnv],
  OPENAI_MODEL:config.provider.textModel,OPENAI_IMAGE_MODEL:config.provider.imageModel,
  WORLD_SEED:config.world.seed,ADMIN_EMAIL:config.hosting.adminEmail};
// Resolve from the installed, locked Vinext version; this internal API is covered by release smoke tests.
const prodModule=new URL('./server/prod-server.js',import.meta.resolve('vinext'));
const {startProdServer}=await import(prodModule.href);
const {server}=await startProdServer({host:'127.0.0.1',port:0,outDir:resolve('dist'),silent:true});
const handlers=server.listeners('request');server.removeAllListeners('request');
server.on('request',(req,res)=>guard(req,res,()=>handlers.forEach(handler=>handler(req,res))));
await new Promise(resolve=>server.close(resolve));
server.listen(Number(process.env.PORT||config.hosting.port),config.hosting.host,()=>console.log('The Explorer is listening. Private prototype access is enabled.'));
function stop(){server.close(()=>{storage.close();process.exit(0);});}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
