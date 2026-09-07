import {execFileSync} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
import {contextFor,directions} from '../lib/world';
import {scenePrompt,sceneSchemaFor,preparedDetails} from '../lib/prompts';
mkdirSync('outputs',{recursive:true});
writeFileSync('outputs/prompts-before.ts',execFileSync('git',['show','bfeb4e6:lib/prompts.ts'],{encoding:'utf8'}).replace("from './world'","from '../lib/world'"));
const beforePath='../outputs/prompts-before.ts';const before=await import(beforePath);
const size=(p:any,s:any)=>p.instructions.length+p.input.length+JSON.stringify(s).length;
let old=0,now=0,cells=0;
for(let i=0;i<60;i++){
 const c=contextFor('the-explorer-crosscurrents-20260907',i*8-160,0);
 const regions=c.regions.map(r=>({id:r.id,kind:r.kind,name:'Sample Regional Name',lore:'A shared regional identity with practical local history and traditions.'}));
 const details={details:before.descriptiveIds(c).map((id:string)=>({rating_id:id,description:'A modest concrete physical detail of this place.'})),regional_texture:''};
 const oldNeighbors=Object.entries(directions).filter(([d])=>c.connections[d as keyof typeof directions]).map(([direction,[dx,dy]])=>{const n=contextFor(c.seed,c.x+dx,c.y+dy);return {direction,x:n.x,y:n.y,numerical_context:{biome:n.biome,ratings:n.ratings},package:{title:'Sample Place',description:'An ordinary stretch of ground lies beneath a broad sky.',continuity_facts:['Weathered stone'],regions,edges:n.edges,exits:n.edges.map(e=>({direction:e.direction,description:'A weathered stone path leads onward.'})),shared_exit:{description:'A weathered stone path leads onward.'}}};});
 const neighbors=oldNeighbors.map(n=>({direction:n.direction,description:n.package.description,continuity_facts:n.package.continuity_facts,shared_exit:n.package.shared_exit.description}));
 old+=size(before.detailPrompt(c,regions),before.detailsSchema)+size(before.scenePrompt(c,regions,details,oldNeighbors),before.sceneSchema);
 now+=size(scenePrompt(c,regions,preparedDetails(c),neighbors),sceneSchemaFor(c));cells++;
}
console.log(JSON.stringify({cells,beforeMeanPromptCharacters:Math.round(old/cells),afterMeanPromptCharacters:Math.round(now/cells),reductionPercent:Math.round(100*(1-now/old)),note:'Offline prompt+schema characters, not token billing. Same 60 cells with saved neighbor context; excludes regional/image requests.'},null,2));
