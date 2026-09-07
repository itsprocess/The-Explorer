import {random} from './noise';
export function transportFor(seed:string,x:number,y:number,v:Record<string,number>){
 if(Math.abs(x)+Math.abs(y)<=2||v['hazards.trap']>0||v['encounters.treasure']>0)return null;
 const magical=v['supernatural.portal']>0;
 if(!magical&&random(seed,'transport-occurrence',x,y)>=.062)return null;
 const modes=['an unexpected ride with a passing caravan','an involuntary slide through a winding underground chute','animals hauling the visitor with their cargo','a moving platform completing its journey','a brief fold in space'];
 if(v['terrain.enclosure']<.55)modes.push('a great crow carrying the visitor away','a drifting aerial conveyance following an old route');
 if(v['water.ocean']>0||v['water.river']>0||v['water.lake']>0)modes.push('a current carrying the visitor along a watercourse','a small ferry departing with the visitor aboard');
 // Presence of a transport incident authorizes its incidental carrier, not a permanent settlement.
 const mechanism=magical?'a spatial portal':modes[Math.floor(random(seed,'transport-form',x,y)*modes.length)];
 const radius=[8,32,128,512][Math.floor(random(seed,'transport-reach',x,y)*4)];
 let dx=Math.round((random(seed,'transport-x',x,y)*2-1)*radius),dy=Math.round((random(seed,'transport-y',x,y)*2-1)*radius);
 let tx=Math.max(-999999992,Math.min(999999992,Math.round((x+dx)/8)*8)),ty=Math.max(-999999992,Math.min(999999992,Math.round((y+dy)/8)*8));
 if(tx===x&&ty===y)tx=x<999999992?x+8:x-8;
 return {mechanism,destination:{x:tx,y:ty}};
}
