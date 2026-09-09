import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(name:string)=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('ordinary image status refresh cannot invoke a provider',()=>{
 const route=read('app/api/image/route.ts'),get=route.slice(route.indexOf('export async function GET'),route.indexOf('export async function POST'));
 assert.doesNotMatch(get,/ensureImage|providerFetch/);assert.match(route,/await requireOwner\(\)/);assert.match(route,/body.force!==true/);
 const client=read('app/location-image.tsx');assert.doesNotMatch(client,/method:'POST'|generationRequest/);assert.match(client,/data.status==='pending'/);
});
test('saved image lookup precedes provider readiness and uses deterministic file fallback',()=>{
 const code=read('lib/location-images.ts');assert.ok(code.indexOf('if(cached&&!force)return cached')<code.indexOf('await assertProviderReady()'));
 assert.match(code,/IMAGES.head\(objectKey\)/);assert.match(code,/objectKey=imageObjectKey\(x,y\)/);
 assert.doesNotMatch(read('lib/game.ts'),/background\(ensureImage/);
 assert.match(read('lib/generation.ts'),/await scheduleInitialImage\(packet\)/);
});
