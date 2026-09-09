import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
process.loadEnvFile(fileURLToPath(new URL('../../.env.local',import.meta.url)));
if(!process.env.OPENAI_API_KEY)throw Error('OPENAI_API_KEY missing from root .env.local');
const config=JSON.parse(readFileSync(new URL('../explorer.config.json',import.meta.url),'utf8'));
writeFileSync(new URL('../.dev.vars',import.meta.url),[
  'OPENAI_API_KEY='+JSON.stringify(process.env.OPENAI_API_KEY),
  'ADMIN_EMAIL='+JSON.stringify(process.env.ADMIN_EMAIL||'seedy@sites.test'),
  'OPENAI_MODEL='+JSON.stringify(process.env.OPENAI_MODEL||config.provider.textModel),
  'OPENAI_IMAGE_MODEL='+JSON.stringify(process.env.OPENAI_IMAGE_MODEL||config.provider.imageModel),
  ...(process.env.DEV_PASSWORD?['DEV_PASSWORD='+JSON.stringify(process.env.DEV_PASSWORD)]:[]),
  'WORLD_SEED='+JSON.stringify(process.env.WORLD_SEED||config.world.seed),
].join('\n')+'\n');
console.log('Local server secret configured; key not displayed.');
