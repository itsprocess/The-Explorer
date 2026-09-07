import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
process.loadEnvFile(fileURLToPath(new URL('../../.env.local',import.meta.url)));
if(!process.env.OPENAI_API_KEY)throw Error('OPENAI_API_KEY missing from root .env.local');
writeFileSync(new URL('../.dev.vars',import.meta.url),[
  'OPENAI_API_KEY='+JSON.stringify(process.env.OPENAI_API_KEY),
  'OPENAI_MODEL='+JSON.stringify(process.env.OPENAI_MODEL||'gpt-5.6-luna'),
  'WORLD_SEED='+JSON.stringify(process.env.WORLD_SEED||'the-explorer-first-world'),
].join('\n')+'\n');
console.log('Local server secret configured; key not displayed.');
