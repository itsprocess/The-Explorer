import {challengeFailure} from './occurrences';
import type {Occurrences,Outcome} from './occurrences';
export type OutcomeNarrative={key:string;text:string;rescueText?:string;imprint?:string;repeatText?:string;badgeTitle:string;badgeDescription:string;awards:{name:string;description:string}[]};
export function narrativeOutcomes(o:Occurrences){
 const results:{key:string;outcome:Outcome}[]=[];
 const add=(key:string,outcome:Outcome)=>{if(outcome.kind==='challenge'){add(key+':present',outcome.present);add(key+':absent',challengeFailure(outcome.absent));}else results.push({key,outcome});};
 if(o.relic)add('relic',{kind:'relic'});
 if(o.death)add('death',{kind:'kill'});
 if(o.teleport)add('teleport',{kind:'teleport',destination:o.teleport});
 if(o.gift)add('gift',o.gift);
 if(o.challenge)add('challenge',o.challenge);
 o.option?.choices.forEach((r,i)=>add('option-'+i,r));
 return results;
}
export function outcomeNarrativeSchema(o:Occurrences,sharedMark=true){
 const text={type:'string'},nonempty={type:'string',minLength:1};
 const object=(properties:Record<string,unknown>)=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
 const leaves=narrativeOutcomes(o);
 return {type:'array',minItems:leaves.length,maxItems:leaves.length,items:{anyOf:leaves.map(({key,outcome})=>{
  const badge=outcome.kind==='kill'||outcome.kind==='badge'||outcome.kind==='give'&&outcome.badge;
  const count=outcome.kind==='give'?outcome.awards.length:0;
  return object({...(outcome.kind==='kill'?{rescueText:nonempty}:{}),...(sharedMark?{imprint:text}:{}),key:{type:'string',enum:[key]},text:nonempty,...(outcome.kind==='give'||outcome.kind==='badge'||outcome.kind==='relic'?{repeatText:nonempty}:{}),...(badge?{badgeTitle:nonempty,badgeDescription:nonempty}:{}),...(count?{awards:{type:'array',minItems:count,maxItems:count,items:object({name:nonempty,description:nonempty})}}:{})});
 })}};
}
export function validateOutcomeNarratives(o:Occurrences,rows:OutcomeNarrative[]){
 const expected=narrativeOutcomes(o);
 if(rows.length!==expected.length||new Set(rows.map(r=>r.key)).size!==rows.length)throw Error('Incomplete encounter narratives.');
 for(const {key,outcome} of expected){
  const r=rows.find(r=>r.key===key);
  if(!r?.text.trim())throw Error('Missing outcome narrative: '+key);
  const badge=outcome.kind==='kill'||outcome.kind==='badge'||outcome.kind==='give'&&outcome.badge;
  if(badge&&(!r.badgeTitle.trim()||!r.badgeDescription.trim()))throw Error('Missing achievement description: '+key);
  if((outcome.kind==='give'||outcome.kind==='badge'||outcome.kind==='relic')&&!r.repeatText?.trim())throw Error('Missing repeat encounter narrative: '+key);
  const count=outcome.kind==='give'?outcome.awards.length:0;
  if(r.awards.length!==count||r.awards.some(a=>!a.name.trim()||!a.description.trim()))throw Error('Missing reward description: '+key);
 }
}

export function normalizeOutcomeNarratives(rows:Partial<OutcomeNarrative>[]):OutcomeNarrative[]{return rows.map(r=>({key:'',text:'',imprint:'',repeatText:'',badgeTitle:'',badgeDescription:'',awards:[],...r}));}
