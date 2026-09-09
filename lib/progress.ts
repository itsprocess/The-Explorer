import type {Character} from './rules';

/** One completed travel operation, regardless of displacement. Respawn and Dev travel do not count. */
export function recordTravel(c:Character,_x:number,_y:number){
 c.previousTile={x:c.x,y:c.y};
 const distance=1;
 c.distanceLife=(c.distanceLife??0)+distance;
 c.distanceTotal=(c.distanceTotal??0)+distance;
}
export function beginLife(c:Character):Character{
 return {...c,alive:true,distanceLife:0,relicsLife:0};
}
