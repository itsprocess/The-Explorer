import type {Character} from './rules';
export const affiliationFamilies=['faction','kingdom','religion'] as const;
export type AffiliationFamily=typeof affiliationFamilies[number];
export type Standing={family:AffiliationFamily;value:string;score:number;names:string[]};
export type StandingShift={family:AffiliationFamily;value:string;delta:number};
export function standingScore(c:Character,family:AffiliationFamily,value:string){return c.standings?.find(s=>s.family===family&&s.value===value)?.score??0;}
export function changeStanding(c:Character,shift:StandingShift,names:string[]=[]){
 c.standings??=[];let s=c.standings.find(s=>s.family===shift.family&&s.value===shift.value);
 if(!s){s={family:shift.family,value:shift.value,score:0,names:[]};c.standings.push(s);}
 s.score=Math.max(-100,Math.min(100,s.score+shift.delta));s.names=[...new Set([...s.names,...names])];return s;
}
