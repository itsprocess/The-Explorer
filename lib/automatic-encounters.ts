import type {CellPackage} from './generation';
/** Preserve cached incidents and claim keys, but require consent before legacy inventory checks. */
export function makeLegacyItemEncounterOptional(p:CellPackage){
 const o=p.context.occurrences,r=o?.challenge;
 if(!o||!r||r.requirement.kind!=='possession'||o.option)return false;
 const requirement=r.requirement;
 o.option={legacyAutomatic:true,policy:'character',choices:[{kind:'none'},r]};o.challenge=null;
 p.occurrenceText??={choices:[]};
 p.occurrenceText.choices=[{label:'Leave it alone'},{label:'Attempt using a '+(requirement.rarity??'common')+' '+requirement.purpose}];
 p.occurrenceText.outcomes??=[];
 p.occurrenceText.outcomes.push({key:'option-0',text:'{character_name} left the request unanswered.',badgeTitle:'',badgeDescription:'',awards:[]});
 // Older absent narratives sometimes reference an item the player does not own.
 for(const n of p.occurrenceText.outcomes)if(n.key==='challenge:absent')n.text=n.text.replaceAll('{requirement_name}','the required '+requirement.purpose);
 return true;
}
