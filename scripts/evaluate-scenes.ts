import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {contextFor,deriveRatings} from '../lib/world';
import {detailPrompt,scenePrompt,detailsSchema,sceneSchema,assertDetails,assertScene,type Details,type Scene,type Prompt} from '../lib/prompts';
const key=readFileSync('.dev.vars','utf8').match(/^OPENAI_API_KEY\s*=\s*"?([^"\r\n]+)/m)?.[1];
if(!key)throw Error('Local API key missing');
async function complete<T>(name:string,schema:unknown,prompt:Prompt):Promise<T>{
 const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-5.6-luna',store:false,instructions:prompt.instructions,input:prompt.input,max_output_tokens:2600,reasoning:{effort:'low'},text:{verbosity:'low',format:{type:'json_schema',name,strict:true,schema}}}),signal:AbortSignal.timeout(90000)});
 const d:any=await r.json();assert.equal(r.status,200,'OpenAI HTTP '+r.status);assert.equal(d.status,'completed');assert.equal(d.model,'gpt-5.6-luna');
 return JSON.parse(d.output.flatMap((o:any)=>o.content??[]).filter((c:any)=>c.type==='output_text').map((c:any)=>c.text).join(''));
}
const cases=[{name:'ordinary',id:null},{name:'forest',id:'vegetation.forest'},{name:'settlement',id:'civilization.settlement'},{name:'treasure',id:'encounters.treasure'},{name:'interaction',id:null}];
const results=[];
for(const sample of cases){
 let found:{x:number;y:number}|undefined;
 for(let i=1;i<100000;i++){
  const x=i*8,y=i%179-89,rs=deriveRatings('scene-evaluation',x,y);
  if(sample.name==='interaction'?contextFor('scene-evaluation',x,y).event?.kind==='interaction':sample.id?rs.find(r=>r.id===sample.id)!.value>0:!rs.some(r=>r.kind==='feature'&&r.value>0)){found={x,y};break;}
 }
 assert.ok(found,'Sample not found: '+sample.name);
 const c=contextFor('scene-evaluation',found.x,found.y);
 const details=await complete<Details>('details',detailsSchema,detailPrompt(c,[]));assertDetails(details,c);
 const neighbors=[{direction:'north',package:{title:'Cobalt Dragon Nursery',description:'Cobalt hatchlings guard the Sapphire Scepter beside a custodian named Zyranthel.',continuity_facts:['Zyranthel tends cobalt hatchlings.']}}];
 const scene=await complete<Scene>('scene',sceneSchema,scenePrompt(c,[],details,neighbors));assertScene(scene,c);
 const publicText=JSON.stringify({title:scene.title,description:scene.description,exits:scene.exits});
 assert.doesNotMatch(publicText,/Cobalt|hatchling|Sapphire Scepter|Zyranthel|nursery/i,'Neighbor contents leaked');
 results.push({case:sample.name,coordinate:found,model:'gpt-5.6-luna',features:c.presentFeatures,scene});
 console.log(sample.name+': '+scene.title+' ('+scene.description.split(/\s+/).length+' words, '+scene.exits.length+' exits)');
}
mkdirSync('outputs',{recursive:true});writeFileSync('outputs/scene-evaluation.json',JSON.stringify(results,null,2));
console.log('All sampled scenes passed brevity, exit coverage, and known-neighbor spoiler checks.');
