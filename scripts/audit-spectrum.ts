import {contextFor,exists,deriveRatings} from '../lib/world';
import {random} from '../lib/noise';
import {writeFileSync} from 'node:fs';
const ranges:Record<string,number[]>={'terrain.elevation':[],'climate.temperature':[],'climate.humidity':[]};const climates:Record<string,number>={},covers:Record<string,number>={},situations:Record<string,number>={};let open=0,moved=0,dead=0;
for(let i=0;i<6000;i++){
 const seed='spectrum-'+i%3,x=Math.floor(random(seed,'x',i,0)*20000)-10000,y=Math.floor(random(seed,'y',i,0)*20000)-10000;
 const rs=deriveRatings(seed,x,y);for(const id of Object.keys(ranges))ranges[id].push(rs.find(r=>r.id===id)!.value);
 if(!exists(seed,x,y))continue;const c=contextFor(seed,x,y);open++;
 climates[c.environment.climate]=(climates[c.environment.climate]??0)+1;covers[c.environment.landcover]=(covers[c.environment.landcover]??0)+1;
 for(const s of c.situations)situations[s.id]=(situations[s.id]??0)+1;
 if(c.event?.kind==='portal'){moved++;if(!c.portalDestination||!exists(seed,c.portalDestination.x,c.portalDestination.y))throw Error('Invalid landing');}
 if(c.event?.kind==='death')dead++;
}
const report={ranges:Object.fromEntries(Object.entries(ranges).map(([id,a])=>{a.sort((a,b)=>a-b);return[id,{min:a[0],p10:a[600],median:a[3000],p90:a[5400],max:a[5999]}];})),open,transportPercent:100*moved/open,deathPercent:100*dead/open,climates,covers,situations};
writeFileSync('outputs/spectrum-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
