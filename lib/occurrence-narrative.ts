import type {Occurrences,Outcome} from './occurrences';
export type OutcomeNarrative={key:string;text:string;repeatText?:string;badgeTitle:string;badgeDescription:string;awards:{name:string;description:string}[]};
export function narrativeOutcomes(o:Occurrences){
 const results:{key:string;outcome:Outcome}[]=[];
 const add=(key:string,outcome:Outcome)=>{if(outcome.kind==='challenge'){add(key+':present',outcome.present);add(key+':absent',outcome.absent);}else results.push({key,outcome});};
 if(o.death)add('death',{kind:'kill'});
 if(o.teleport)add('teleport',{kind:'teleport',destination:o.teleport});
 if(o.gift)add('gift',o.gift);
 if(o.challenge)add('challenge',o.challenge);
 o.option?.choices.forEach((r,i)=>add('option-'+i,r));
 return results;
}
export function validateOutcomeNarratives(o:Occurrences,rows:OutcomeNarrative[]){
 const expected=narrativeOutcomes(o);
 if(rows.length!==expected.length||new Set(rows.map(r=>r.key)).size!==rows.length)throw Error('Incomplete encounter narratives.');
 for(const {key,outcome} of expected){
  const r=rows.find(r=>r.key===key);
  if(!r?.text.trim())throw Error('Missing outcome narrative: '+key);
  const badge=outcome.kind==='kill'||outcome.kind==='badge'||outcome.kind==='give'&&outcome.badge;
  if(badge&&(!r.badgeTitle.trim()||!r.badgeDescription.trim()))throw Error('Missing achievement description: '+key);
  if((outcome.kind==='give'||outcome.kind==='badge')&&!r.repeatText?.trim())throw Error('Missing repeat encounter narrative: '+key);
  const count=outcome.kind==='give'?outcome.awards.length:0;
  if(r.awards.length!==count||r.awards.some(a=>!a.name.trim()||!a.description.trim()))throw Error('Missing reward description: '+key);
 }
}
