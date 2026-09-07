import {random,fbm} from '../lib/noise';
import {deriveRatings,exists,contextFor} from '../lib/world';
import {oceanStrength} from '../lib/fields';
let open=0,oldOpen=0,dead=0,unique=0,total=0,nearOpen=0,nearDead=0;
for(let i=0;i<16000;i++){
 const s='audit-v5-'+i%4,x=Math.floor(random(s,'x',i,0)*20000)-10000,y=Math.floor(random(s,'y',i,0)*20000)-10000;
 const previous=x%8===0||y%8===0||Math.abs(x)+Math.abs(y)<=2||(oceanStrength(s,x,y)<.25&&fbm(s,'topology',x,y,13,3)>.45);
 if(previous)oldOpen++;
 if(exists(s,x,y)){open++;const c=contextFor(s,x,y);if(c.event?.kind==='death')dead++;if(c.ratings.find(r=>r.id==='scenery.unique_features')!.value>0)unique++;}
 const nx=i%201-100,ny=Math.floor(i/201)-40;
 if(Math.abs(nx)+Math.abs(ny)>2&&exists(s,nx,ny)){nearOpen++;if(contextFor(s,nx,ny).event?.kind==='death')nearDead++;}total++;
}
console.log(JSON.stringify({blockedBefore:1-oldOpen/total,blockedAfter:1-open/total,deathsAmongOpen:dead/open,deathsNearOrigin:nearDead/nearOpen,uniqueAmongOpen:unique/open}));
