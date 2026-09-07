import {intensity as configIntensity} from '../explorer.config.json';
// Smooth, asymptotic escalation: perceptible within hundreds, still growing far beyond them.
// Keep the first 32 cells unchanged. Never move the topology or replace regional climate.
export function distanceIntensity(x:number,y:number){
 const d=Math.max(0,Math.hypot(x,y)-configIntensity.quietRadius);
 return configIntensity.weights.reduce((sum,w,i)=>sum+w*d/(d+configIntensity.distances[i]),0);
}
export function distanceMultiplier(x:number,y:number,maximum=3){return 1+(maximum-1)*distanceIntensity(x,y);}
