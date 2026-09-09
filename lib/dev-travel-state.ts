import type {Character} from './rules';
export function previewResult(real:Character,simulated:Character,event:{text:string;kind:string;newBadge:string|null}){
 const devState=structuredClone(simulated);delete devState.devState;delete devState.devEvent;delete devState.devOperation;
 devState.badges=structuredClone(real.badges);devState.deaths=real.deaths;devState.furthest=real.furthest;
 devState.distanceLife=real.distanceLife;devState.distanceTotal=real.distanceTotal;devState.relicsLife=real.relicsLife;devState.relicsTotal=real.relicsTotal;
 return {devState,devEvent:{...event,newBadge:null}};
}
