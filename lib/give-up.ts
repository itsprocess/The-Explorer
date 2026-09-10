import type {Character} from './rules';
import {deathTraits} from './traits';
export function endLife(original:Character){
 if(!original.alive)throw Error('This life has already ended.');
 const c=structuredClone(original);c.alive=false;c.deaths++;delete c.pendingOption;delete c.pendingTransport;const lost=deathTraits(c.traits??[]);c.traits=lost.traits;
 return {character:c,event:{kind:'death',text:c.name+' chose to end this life and return to the sanctuary.',newBadge:null,stateChanges:lost.changes}};
}
