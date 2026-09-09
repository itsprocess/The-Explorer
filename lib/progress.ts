import type {Character} from './rules';

/** Cell units along the route, including displacement through a teleport. */
export function recordTravel(c:Character,x:number,y:number){
 const distance=Math.hypot(x-c.x,y-c.y);
 c.distanceLife=(c.distanceLife??0)+distance;
 c.distanceTotal=(c.distanceTotal??0)+distance;
}
export function beginLife(c:Character):Character{
 return {...c,alive:true,distanceLife:0,relicsLife:0};
}
