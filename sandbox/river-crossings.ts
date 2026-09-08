import {MAX_VARIABLES} from './model';
import {newVariable,newLayer,issues,type Project} from './model';

export function configureRiverCrossings(p:Project):Project {
  if(p.riverCrossingRevision===3)return p;
  if(p.riverCrossingRevision===2){
    const variables=p.variables.map(v=>{
      if(v.appName!=='biome.river_relief')return v;
      const layers=v.layers.map(l=>l.source==='patches'?{...l,
        patchMinDiameter:Math.min(10000,2*(l.patchMinDiameter??8)),patchMaxDiameter:Math.min(10000,2*(l.patchMaxDiameter??14)),
        patchSpacing:Math.max(l.patchSpacing??20,Math.min(10000,2*(l.patchMaxDiameter??14))+2),
      }:l);
      const patchIndex=layers.findIndex(l=>l.source==='patches');
      if(patchIndex>=0)layers.splice(patchIndex+1,0,{...newLayer(),name:'Subtle relief edge texture',source:'perlin',channel:'river-relief-texture-v3',scaleX:3,scaleY:4,blend:'subtract',weight:.04});
      return {...v,layers};
    });
    const q={...p,riverCrossingRevision:3,variables};const errors=issues(q);if(errors.length)throw Error(errors.join(' '));return q;
  }
  const river=p.variables.find(v=>v.appName==='biome.river'||/^rivers?$/i.test(v.naturalName));
  if(!river)throw Error('River crossings need a River variable.');
  const existing=p.variables.find(v=>v.appName==='biome.river_barrier');
  const existingRelief=p.variables.find(v=>v.appName==='biome.river_relief');
  const relief={...newVariable(28),...(existingRelief??{}),appName:'biome.river_relief',naturalName:'River Crossing Relief',category:'biome' as const,type:'boolean' as const,cutoff:.25,presenceReference:river.id,
    description:'Isolated noise-driven relief points within the river. Relief strength is multiplied by 1 - 0.65 × River, so weaker river sections open more readily. Without relief, all nonzero river cells block.',
    off:'No crossing relief here.',on:'A local ford or crossing opportunity.',traversal:{mode:'passable' as const},layers:[
      {...newLayer(),name:'Potential relief points',source:'patches' as const,channel:'river-relief-points-v2',patchMinDiameter:16,patchMaxDiameter:28,patchSpacing:30,patchChance:.9},
      {...newLayer(),name:'Subtle relief edge texture',source:'perlin' as const,channel:'river-relief-texture-v3',scaleX:3,scaleY:4,blend:'subtract' as const,weight:.04},
      {...newLayer(),name:'Weaker water permits more relief',source:'variable' as const,reference:river.id,channel:'river-strength',blend:'multiply' as const,invert:true,gain:.65,bias:.35},
    ]};
  const barrier={...newVariable(27),...(existing??{}),appName:'biome.river_barrier',naturalName:'River Crossing Barrier',category:'biome' as const,type:'boolean' as const,cutoff:.5,presenceReference:river.id,
    description:'Every nonzero river cell is blocked by default. The separate River Crossing Relief field opens local exceptions; weaker river values produce more relief. River geometry is unchanged.',
    off:'Not blocked by river water here.',on:'River blocks exploration here.',traversal:{mode:'positive' as const},layers:[
      {...newLayer(),name:'Blocked by default',source:'constant' as const,constant:1,channel:'river-default-blocked'},
      {...newLayer(),name:'Open the relief points',source:'variable' as const,reference:relief.id,blend:'subtract' as const,channel:'river-relief'},
    ]};
  const variables=p.variables.map(v=>v.id===river.id?{...v,traversal:{mode:'passable' as const}}:v.id===existing?.id?barrier:v.id===existingRelief?.id?relief:v);
  if(!existingRelief)variables.push(relief);
  if(!existing)variables.push(barrier);
  if(variables.length>MAX_VARIABLES)throw Error('River relief needs an available variable slot.');
  const q={...p,riverCrossingRevision:3,civilizationObeysTraversal:p.civilizationObeysTraversal??true,variables};const errors=issues(q);if(errors.length)throw Error(errors.join(' '));return q;
}
