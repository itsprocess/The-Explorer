import {newLayer,newVariable,issues,MAX_VARIABLES,type Project,type Layer,type Variable} from './model';

/** Add editable examples without replacing existing authored variables. */
export function expandInteriorOptions(p:Project):Project {
  const variables=[...p.variables];
  const find=(name:string)=>variables.find(v=>v.appName===name);
  const layer=(channel:string,settings:Partial<Layer>):Layer=>({...newLayer(),channel,...settings});
  const make=(appName:string,naturalName:string,category:Variable['category'],off:string,on:string):Variable=>({
    ...newVariable(variables.length),appName,naturalName,category,type:'boolean',cutoff:.5,steps:[],off,on,low:off,high:on,
  });
  const shapes=(key:string)=>[
    layer(key+'-veins',{name:'Winding enclosed regions',source:'perlin',scaleX:65,scaleY:45,noiseTransform:'band',bandLow:.43,bandHigh:.57,blend:'replace',weight:1}),
    layer(key+'-pockets',{name:'Tiny enclosed pockets · 1–4 cells',source:'patches',patchSpacing:12,patchChance:.4,patchMinDiameter:1,patchMaxDiameter:4,patchRoughness:.75,blend:'max',weight:1}),
  ];
  const footprint=find('civilization.footprint'),infrastructure=find('civilization.infrastructure');
  if(!find('civilization.inside')&&footprint&&infrastructure){
    const v=make('civilization.inside','Inside','civilization','Outside any enclosed built space; construction may still surround the traveler.','Within enclosing architecture or a constructed underground space: walls, ceilings and openings define the immediate world.');
    v.description='Built interior or constructed underground space. Veins and tiny pockets require both civilization footprint and positive infrastructure. Does not establish a separate floor or alter traversal.';
    v.color='#cd9bca';v.presenceReference=footprint.id;
    v.layers=[...shapes('civ-inside'),layer('civ-inside-built-mask',{name:'Require constructed infrastructure',source:'variable',reference:infrastructure.id,referenceMode:'at-most',referenceCutoff:0,invert:true,blend:'multiply',weight:1})];
    variables.push(v);
  }
  if(!find('biome.underground')&&footprint){
    const v=make('biome.underground','Underground','biome','Not below ground; interpret enclosure and elevation from the other fields.','Beneath the earth, with rock overhead. Natural caves and tunnels are possible; where infrastructure and Inside are present, the place may be a dungeon, mineshaft, cellar, crypt or constructed subterranean hall. Let the other fields determine its form.');
    v.description='Below-ground setting in veins and small pockets, independent of civilization and Inside. Descriptive only: does not make blocked terrain passable or create a separate vertical map.';
    v.color='#877b9d';v.traversal={mode:'passable'};
    v.layers=[...shapes('biome-underground')];variables.push(v);
  }
  if(!find('occurrences.option')){
    const v=make('occurrences.option','Option','occurrences','No structured choice occurrence is assigned here.','A distinct fork in possibility: two or three memorable choices offer app-assigned outcomes, expressed through the character of this place.');
    v.description='Isolated choice point. Planned app payload: seeded 2–3 choices and per-visit or once-per-life policy; outcomes use give, challenge, teleport, badge or kill. AI describes assigned results; death resets choice state.';
    v.color='#dfc27d';v.layers=[layer('occurrences-option-points',{name:'Isolated option points',source:'sparks',sparkCutoff:.996,sparkFloor:1,blend:'replace',weight:1})];variables.push(v);
  }
  if(variables.length===p.variables.length)return p;
  if(variables.length>MAX_VARIABLES)throw Error('Interior and Option examples exceed the variable limit.');
  const q={...p,variables};const errors=issues(q);if(errors.length)throw Error(errors.join(' '));return q;
}
