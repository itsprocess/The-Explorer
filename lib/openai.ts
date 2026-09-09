import {provider as configProvider} from '../explorer.config.json';
import {providerFetch} from './usage';
import {exhausted} from './token-usage';
import {pauseForCredit,pauseForRateLimit} from './provider-health';
import {queuedProvider} from './provider-queue';
import {bindings,AppError} from './server';
import type {Prompt} from './prompts';
export async function complete<T>(name:string,schema:Record<string,any>,prompt:Prompt,validate?:(result:T)=>void):Promise<{result:T;model:string;usage:unknown;responseId:string}>{
 const {OPENAI_API_KEY:key,OPENAI_MODEL:model=configProvider.textModel}=bindings();
 if(!key)throw new AppError('The server’s OpenAI key has not been configured.',503);
 const response=await queuedProvider('text',{model,name,schema,prompt},async()=>{
 const {response,payload}=await providerFetch('text',name,model,'https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model,store:false,instructions:prompt.instructions,input:prompt.input,max_output_tokens:name==='regional_entity'?configProvider.regionOutputTokens:configProvider.textOutputTokens,reasoning:{effort:'low'},text:{verbosity:'low',format:{type:'json_schema',name,strict:true,schema}}}),signal:AbortSignal.timeout(configProvider.textTimeoutMs)});
 if(!response.ok){if(exhausted(payload))throw await pauseForCredit();if(response.status===429)await pauseForRateLimit();const code=payload.error?.code;throw new AppError((code==='insufficient_quota'||code==='credit_balance_exhausted'||payload.error?.type==='insufficient_quota')?'The OpenAI account needs API credit before this place can be written.':response.status===401?'OpenAI rejected the server key.':response.status===429?'OpenAI is busy. Please retry shortly.':'OpenAI could not write this stage (HTTP '+response.status+').',502);}
 if(payload.status!=='completed'){console.error('text_generation_incomplete',JSON.stringify({stage:name,responseId:payload.id,status:payload.status,reason:payload.incomplete_details?.reason??null,errorCode:payload.error?.code??null,outputTokens:payload.usage?.output_tokens??null}));throw new AppError('The writing pass was incomplete. Its saved earlier stages are safe; please retry.',502);}
 const content=payload.output?.flatMap((item:any)=>item.content??[])??[];
 if(content.some((item:any)=>item.type==='refusal'))throw new AppError('The writing pass declined this context. Please review it in the workshop.',502);
 const text=content.filter((item:any)=>item.type==='output_text').map((item:any)=>item.text).join('');
 let result:T;try{result=JSON.parse(text) as T;}catch{throw new AppError('OpenAI returned an unreadable stage. Please retry.',502);}
 validate?.(result);
 return {result,model:payload.model,usage:payload.usage,responseId:payload.id};
 });
 validate?.(response.result);
 return response;
}
