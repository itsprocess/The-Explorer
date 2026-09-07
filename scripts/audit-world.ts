import {mkdirSync,writeFileSync} from 'node:fs';
import {deriveRatings,recipes} from '../lib/fields';
import {random} from '../lib/noise';
const count=12000,totals=Object.fromEntries(recipes.map(r=>[r.id,{present:0,sum:0}]));let ordinary=0;
for(let i=0;i<count;i++){
 const seed='distribution-audit-'+i%3,x=Math.floor(random(seed,'x',i,0)*200000)-100000,y=Math.floor(random(seed,'y',i,0)*200000)-100000;
 const ratings=deriveRatings(seed,x,y);
 if(!ratings.some(r=>r.kind==='feature'&&r.value>0))ordinary++;
 for(const r of ratings){totals[r.id].sum+=r.value;if(r.value>0)totals[r.id].present++;}
}
const report={sampleCount:count,seeds:3,ordinaryPercent:Math.round(ordinary/count*1000)/10,fields:recipes.map(r=>({id:r.id,name:r.name,kind:r.kind,presentPercent:Math.round(totals[r.id].present/count*10000)/100,mean:Math.round(totals[r.id].sum/count*1000)/1000,recipe:r.recipe}))};
mkdirSync('outputs',{recursive:true});writeFileSync('outputs/world-distribution.json',JSON.stringify(report,null,2));
mkdirSync('docs',{recursive:true});
writeFileSync('docs/world-fields.md',[
 '# World fields, version 2','',
 'The app computes 33 fields: six baseline conditions and 27 independently shaped features. Features can be exactly zero. Zero means absent, not an atmospheric hint. One means full strength, not a guarantee that a reward is available. Events and repeat rules remain app-owned. Each feature has its own recipe; sharing a noise primitive does not mean sharing a spatial distribution.','',
 'The deterministic audit samples '+count+' widely spaced coordinates across three seeds. **'+report.ordinaryPercent+'% have no special features.** Observed presence is a sample statistic, not a gameplay promise; very rare rolls can be absent from this sample. Roads and contour rivers are procedural shapes, not physical drainage or a road network solver.','',
 '| Field | Kind | Meaning, low → high | Observed presence | Derivation |',
 '| --- | --- | --- | --- | --- |',
 ...recipes.map((r,i)=>'| '+r.name+' | '+r.kind+' | '+r.low+' → '+r.high+' | '+(r.kind==='baseline'?'everywhere':report.fields[i].presentPercent+'%')+' | '+r.recipe+' |'),'',
 'The Dev view shows actual present features first, baseline conditions separately, and absent features collapsed. Percentages indicate feature strength or position between the stated baseline meanings. They are not probabilities.','',
 'Cell topology retains its connected grid backbone. Shared exits are determined symmetrically from both endpoints and describe openings, never the contents of the next cell. Shared kingdom/faction/religion identities cover larger territories but do not imply settlements or patrols in every cell. Foreign-badge enforcement requires an actual patrol.','',
 'Run npx tsx scripts/audit-world.ts to reproduce the report. Recipe changes require a world version change or an explicit development reset; saved prose is never silently regenerated.',''
].join('\n'));
console.log(JSON.stringify({ordinaryPercent:report.ordinaryPercent,features:report.fields.filter(r=>r.kind==='feature').map(r=>({name:r.name,presentPercent:r.presentPercent}))}));
