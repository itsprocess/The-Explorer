import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const config=JSON.parse(readFileSync('explorer.config.json','utf8'));
const manifest=JSON.parse(readFileSync('dist/explorer-build.json','utf8'));
const basePath=config.hosting.basePath;delete config.hosting;
if(manifest.target!=='node'||manifest.basePath!==basePath||manifest.configHash!==createHash('sha256').update(JSON.stringify(config)).digest('hex'))
 throw Error('Run npm run build:node first; the compiled bundle must match the configuration.');
const result=spawnSync('tar',['-a','-cf',resolve('outputs/the-explorer-compiled.zip'),'dist'],{stdio:'inherit'});
if(result.status!==0)throw Error('Could not package compiled files.');
console.log('Created outputs/the-explorer-compiled.zip. Contains compiled files only; no world data or server credentials.');
