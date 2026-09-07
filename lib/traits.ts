import {random} from './noise';
export const statusFamilies={social_rank:['commoner','artisan','noble','royalty'],blessing:['speed','ward','luck'],burden:['exposure','illness','haunting'],reputation:['trusted','feared','disgraced'],attunement:['flame','tide','stone','wind']} as const;
export const possessionDimensions={purpose:['protection','passage','perception','craft'],affinity:['stone','water','air','spirit'],material:['mineral','organic','metal','woven']} as const;
export const lifetimes=['permanent','until_death','single_use'] as const;
export type Lifetime=typeof lifetimes[number];
export type TraitSpec={kind:'status';family:keyof typeof statusFamilies;value:string;lifetime:Lifetime}|{kind:'possession';purpose:string;affinity:string;material:string;lifetime:Lifetime};
export type Trait=TraitSpec&{id:string;name:string;description:string;source:{x:number;y:number;title:string;world:string;visitId:string}};
export type TraitCondition={kind:'status';family:keyof typeof statusFamilies;value:string}|{kind:'possession';purpose:string;affinity:string};
export type StateRule={kind:'grant';spec:TraitSpec}|{kind:'check';condition:TraitCondition;onMatch:'avoid_death'|'alternate'};
export type StateChange={type:'acquired'|'replaced'|'consumed'|'lost';trait:Trait;reason:string};
export function validTrait(spec:TraitSpec){return lifetimes.includes(spec.lifetime)&&(spec.kind==='status'?(statusFamilies[spec.family] as readonly string[]|undefined)?.includes(spec.value):spec.kind==='possession'&&Object.entries(possessionDimensions).every(([k,v])=>(v as readonly string[]).includes((spec as any)[k])));}
const choose=<T>(seed:string,id:string,x:number,y:number,values:readonly T[])=>values[Math.floor(random(seed,id,x,y)*values.length)];
export function stateRuleFor(seed:string,x:number,y:number,event:{kind:string;cause?:string|null}|null,v:Record<string,number>):StateRule|null{
 if(Math.abs(x)+Math.abs(y)<=2||!event)return null;
 const physical=!/unmaking|spores|staircase/.test(event.cause??'');
 if(event.kind==='death')return {kind:'check',onMatch:'avoid_death',condition:random(seed,'protection-family',x,y)<.55?{kind:'status',family:'blessing',value:random(seed,'protection-aspect',x,y)<.15?'luck':physical?'speed':'ward'}:{kind:'possession',purpose:'protection',affinity:physical?'stone':'spirit'}};
 if(event.kind!=='interaction')return null;
 const roll=random(seed,'state-encounter',x,y);
 if(roll<.22){
  const lifetime=choose(seed,'state-lifetime',x,y,['until_death','until_death','single_use','single_use','permanent'] as const);
  if(random(seed,'state-kind',x,y)<.45)return {kind:'grant',spec:{kind:'possession',purpose:choose(seed,'item-purpose',x,y,possessionDimensions.purpose),affinity:choose(seed,'item-affinity',x,y,possessionDimensions.affinity),material:choose(seed,'item-material',x,y,possessionDimensions.material),lifetime}};
  const social=Math.max(v['civilization.settlement']??0,v['civilization.camp']??0,v['encounters.traveler']??0)>0;
  const family=choose(seed,'status-family',x,y,social?Object.keys(statusFamilies) as (keyof typeof statusFamilies)[]:['blessing','burden','attunement'] as const);
  return {kind:'grant',spec:{kind:'status',family,value:choose(seed,'status-value',x,y,statusFamilies[family] as readonly string[]),lifetime}};
 }
 if(roll<.42){const condition:TraitCondition=random(seed,'check-kind',x,y)<.5?{kind:'status',family:choose(seed,'check-family',x,y,['social_rank','reputation','attunement','burden','blessing'] as const),value:''}:{kind:'possession',purpose:choose(seed,'check-purpose',x,y,possessionDimensions.purpose),affinity:choose(seed,'check-affinity',x,y,possessionDimensions.affinity)};
  if(condition.kind==='status')condition.value=choose(seed,'check-value',x,y,statusFamilies[condition.family] as readonly string[]);
  return {kind:'check',condition,onMatch:'alternate'};
 }
 return null;
}
export function findTrait(traits:Trait[],condition:TraitCondition){return traits.find(t=>t.kind===condition.kind&&(t.kind==='status'&&condition.kind==='status'?t.family===condition.family&&t.value===condition.value:t.kind==='possession'&&condition.kind==='possession'&&t.purpose===condition.purpose&&t.affinity===condition.affinity));}
export function grantTrait(traits:Trait[],trait:Trait):{traits:Trait[];changes:StateChange[]}{
 if(!validTrait(trait))throw Error('Invalid trait specification.');
 if(traits.some(t=>t.id===trait.id))return {traits,changes:[]};
 const replaced=trait.kind==='status'?traits.filter(t=>t.kind==='status'&&t.family===trait.family):[];
 return {traits:[...traits.filter(t=>!replaced.includes(t)),trait],changes:[...replaced.map(t=>({type:'replaced' as const,trait:t,reason:'Replaced by '+trait.name})),{type:'acquired',trait,reason:'Acquired at '+trait.source.title}]};
}
export function useTrait(traits:Trait[],trait:Trait){return trait.lifetime==='single_use'?{traits:traits.filter(t=>t.id!==trait.id),changes:[{type:'consumed' as const,trait,reason:'Used by an encounter'}]}:{traits,changes:[]};}
export function deathTraits(traits:Trait[]){return {traits:traits.filter(t=>t.lifetime==='permanent'),changes:traits.filter(t=>t.lifetime!=='permanent').map(trait=>({type:'lost' as const,trait,reason:'Lost on death'}))};}
export const traitLabel=(s:string)=>s.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
