import type {CellPackage} from './generation';

// Art-only input: never fed back into either canonical text pass or arrival rules.
export function imageThreat(p:CellPackage,recordedDeath?:string|null){
 if(p.context.protectedOrigin||p.context.safeApproach)return null;
 const lethal=p.context.event?.kind==='death';
 if(!lethal&&!recordedDeath)return null;
 return {
  threat:lethal?p.context.event?.cause:null,
  incident:recordedDeath||(lethal?p.scene.event_narrative.replaceAll('{character_name}','an explorer'):null),
  confirmedDeath:!!recordedDeath,
  direction:'Show the physical threat or its mechanism as part of this location, consistent with its terrain and incident. Do not depict an attack in progress. No blood, gore, wounds, or gruesome details. '+(recordedDeath?'A small abandoned pack, fallen cloak, or discreet covered resting figure may mark the recorded loss; keep the landscape primary.':'No body or remains: this is a potential threat, not evidence that anyone has died here.')
 };
}
