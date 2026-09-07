import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const result=spawnSync(process.execPath,['node_modules/vinext/dist/cli.js','build'],{
  stdio:'inherit',env:{...process.env,EXPLORER_BUILD_TARGET:'node'}
});
if(result.status===0){
 const config=JSON.parse(readFileSync('explorer.config.json','utf8'));delete config.hosting;
 writeFileSync('dist/explorer-build.json',JSON.stringify({target:'node',configHash:createHash('sha256').update(JSON.stringify(config)).digest('hex')}));
}
process.exit(result.status??1);
