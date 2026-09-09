import {constructedInterior,environmentPromptFields} from './prompt-environment';
import {encounterPrompt} from './encounter-prompt';
import {leavesMark} from './reward-direction';
import {keyedOutcomeNarrativeSchema,validateOutcomeNarratives,decodeOutcomeNarratives,type OutcomeNarrative} from './occurrence-narrative';
import {remember,namespace} from './server';
import {complete} from './openai';
import {interpretationInstructions} from './interpretation-policy';
import type {CellContext} from './world';
const text={type:'string'};
const object=(properties:Record<string,unknown>)=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
export type OccurrenceText={outcomes?:OutcomeNarrative[];death?:string;teleport?:string;gift?:string;challengePresent?:string;challengeAbsent?:string;setup?:string;badgeTitle?:string;badgeDescription?:string;awardName?:string;awardDescription?:string;choices:{label:string;result?:string;present?:string;absent?:string}[]};
export async function interpretPass(c:CellContext,category:string,prior:unknown){
 const fields=environmentPromptFields(c).filter(f=>f.category===category&&f.present&&(f.type==='gradient'||f.value>0));
 if(category==='civilization'&&!fields.some(f=>f.value>0))return {description:''};
 if(category==='variation'&&fields.every(f=>f.value<=.15))return {description:''};
 return remember(namespace()+(constructedInterior(c)?'interpret-interior-v1:':'interpret:')+c.x+':'+c.y+':'+category,'interpretation',async()=>{
 const response=await complete<{name?:string;description:string}>('interpret_'+category,object(category==='biome'||category==='civilization'?{name:text,description:text}:{description:text}),{instructions:interpretationInstructions(category),input:JSON.stringify({coordinate:[c.x,c.y],fields:fields.map(f=>({name:f.name,value:Math.round(f.value*1000)/1000,low:f.low,high:f.high})),prior})});
 return response.result;
 });
}
export async function occurrenceText(c:CellContext,setting:unknown):Promise<OccurrenceText|undefined>{
 const o=c.occurrences;if(!o||!o.relic&&!o.death&&!o.teleport&&!o.gift&&!o.challenge&&!o.option)return;
 return remember(namespace()+(constructedInterior(c)?'occurrence-text-interior-v7:':'occurrence-text-v7:')+c.x+':'+c.y,'occurrence',async()=>{
 const schema=object({outcomes:keyedOutcomeNarrativeSchema(o,leavesMark(c.seed,c.x,c.y)),setup:text,choices:{type:'array',items:object({label:text}),minItems:o.option?.choices.length??0,maxItems:o.option?.choices.length??0}});
 const prompt=encounterPrompt(o,c,setting);
 for(let attempt=0;attempt<2;attempt++){
 let draft:(Omit<OccurrenceText,'outcomes'>&{outcomes:Record<string,Partial<OutcomeNarrative>>})|undefined;
 try{
 const response=await complete<NonNullable<typeof draft>>('occurrence_narratives',schema,prompt,result=>{
 draft=result;
 if(!result.setup?.trim()||result.choices.some(c=>!c.label.trim()))throw Error('Missing encounter setup or option label.');
 if(result.choices.length!==(o.option?.choices.length??0))throw Error('Incorrect option choice count.');
 validateOutcomeNarratives(o,decodeOutcomeNarratives(result.outcomes));
 });
 return {...response.result,outcomes:decodeOutcomeNarratives(response.result.outcomes)};
 }catch(error){if(attempt===1||!draft)throw error;prompt.instructions+=' Repair the previous invalid response. Preserve its incident and all valid prose; correct the assigned victim, outcome and any missing metadata. Validation: '+(error as Error).message;prompt.input=JSON.stringify({request:JSON.parse(prompt.input),draft});}
 }
 throw Error('Encounter narration could not be completed.');
 });
}
