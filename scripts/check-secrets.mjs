import {readFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
process.loadEnvFile('../.env.local');
const key=process.env.OPENAI_API_KEY;if(!key)throw Error('Server key unavailable for leak check.');
const tracked=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):[dir+'/'+e.name]);
const leaked=[...tracked,...walk('dist/client')].filter(p=>readFileSync(p).includes(Buffer.from(key)));
if(leaked.length)throw Error('Secret found in '+leaked.join(', '));
console.log('Verified server key absent from tracked source and public build.');
