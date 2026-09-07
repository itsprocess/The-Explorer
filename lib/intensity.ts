// Smooth, asymptotic escalation: perceptible within hundreds, still growing far beyond them.
// Keep the first 32 cells unchanged. Never move the topology or replace regional climate.
export function distanceIntensity(x:number,y:number){
 const d=Math.max(0,Math.hypot(x,y)-32);
 return .22*d/(d+600)+.38*d/(d+8000)+.40*d/(d+100000);
}
export function distanceMultiplier(x:number,y:number,maximum=3){return 1+(maximum-1)*distanceIntensity(x,y);}
