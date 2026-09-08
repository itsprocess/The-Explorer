import {evaluator,type Project} from './model';
import {traversalEvaluator} from './traversal';
import {civilizationEvaluator} from './civilization-view';

/** Display composition only: no generation or traversal rules are imposed here. */
export function overallMapEvaluator(p:Project,showCivilization:boolean){
  const evaluate=evaluator(p),traversal=traversalEvaluator(p),civ=showCivilization?civilizationEvaluator(p,false):null;
  const vars=new Map(p.variables.map(v=>[v.appName,v]));
  const mix=(a:number[],b:number[],t:number)=>a.map((n,i)=>n+(b[i]-n)*Math.max(0,Math.min(1,t)));
  return (x:number,y:number)=>{
    const pass=traversal(x,y);
    const read=(...keys:string[])=>{const v=keys.map(k=>vars.get(k)).find(Boolean);return v?evaluate(v.id,x,y).value:0;};
    if(read('biome.chasms')>0||read('biome.void')>0)return {rgb:[0,0,0],explorable:pass.explorable};
    const color=(key:string,fallback:number[])=>{const v=vars.get(key);return v?[1,3,5].map(i=>parseInt(v.color.slice(i,i+2),16)):fallback;};
    const altitude=read('natural.elevation','biome.elevation');
    let rgb=mix([107,98,72],[207,197,163],altitude);
    rgb=mix(rgb,color('biome.groundcover',[139,170,77]),read('biome.groundcover')*.85);
    rgb=mix(rgb,color('biome.large_foliage',[38,94,54]),read('biome.large_foliage')*.9);
    rgb=mix(rgb,color('biome.exposed_rock',[159,163,167]),Math.min(1,read('biome.exposed_rock')*2));
    for(const [key,fallback] of [['natural.ocean',[38,101,151]],['biome.ocean',[38,101,151]],['biome.lakes_ponds',[68,151,189]],['biome.river',[67,178,213]]] as [string,number[]][]){
      const value=read(key);if(value>0)rgb=mix(rgb,color(key,fallback),.65+.35*value);
    }
    if(civ&&pass.explorable){const c=civ(x,y);if(c.footprint>0){
      const hue=c.density>0?(c.infrastructure>0?[255,224,157]:[244,157,66]):[183,144,223];
      rgb=mix(rgb,hue,.65+.25*Math.sqrt(c.footprint));
    }}
    return {rgb:rgb.map(Math.round),explorable:pass.explorable};
  };
}
