import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateNoise, adjustNoise, blend, classify, evaluator, issues, newLayer, newVariable, parseProject, starter } from '../sandbox/model';
import {CATEGORIES,loadProject, proposalProject, refreshBiomeRecipes,simplifyRiverStudy,STORAGE_KEY} from '../sandbox/project-defaults';
import {gateOcean} from '../sandbox/ocean-gate';
import {expandBiomes} from '../sandbox/biome-expansion';

test('reference fades are smooth, monotonic, bounded and serializable',()=>{
  const l={...newLayer(),source:'variable' as const,referenceMode:'fade-below' as const,fadeLow:.55,fadeHigh:.85};
  assert.equal(adjustNoise(.4,l),1);assert.equal(adjustNoise(.55,l),1);
  assert.ok(Math.abs(adjustNoise(.7,l)-.5)<1e-12);assert.equal(adjustNoise(.85,l),0);assert.equal(adjustNoise(.95,l),0);
  assert.ok(adjustNoise(.6,l)>adjustNoise(.65,l));
  assert.ok(Math.abs(adjustNoise(.6,{...l,referenceMode:'fade-above'})+adjustNoise(.6,l)-1)<1e-12);
  assert.throws(()=>adjustNoise(.6,{...l,fadeHigh:.55}),/greater than/);
  const p=starter();p.variables[0].layers=[l];assert.deepEqual(parseProject(JSON.stringify(p)),p);
  l.fadeHigh=.5;assert.match(issues(p).join(' '),/fade end/);
});

test('biome expansion preserves the existing noise recipes and runs only once',()=>{
  const p=proposalProject(),river=p.variables[2];
  river.layers.splice(1,0,{...newLayer(),name:'User detail',source:'perlin',scaleX:6,scaleY:6,blend:'subtract',weight:.6});
  const oldIds=new Set(river.layers.map(l=>l.id));const result=expandBiomes(p);
  assert.deepEqual(result.variables.slice(0,2),p.variables.slice(0,2));
  assert.deepEqual(result.variables[2].layers.filter(l=>oldIds.has(l.id)),river.layers);
  const layers=result.variables[2].layers;
  assert.ok(layers.findIndex(l=>l.referenceMode==='fade-below')<layers.findIndex(l=>l.blend==='subtract'));
  assert.deepEqual(result.variables.slice(3).map(v=>v.naturalName),['Void','Groundcover','Trees / Large Foliage']);
  assert.deepEqual(issues(result),[]);assert.deepEqual(parseProject(JSON.stringify(result)),result);
  assert.equal(expandBiomes(result),result);assert.equal(p.variables.length,3);
});

test('river fading before erosion removes high channels; Ocean and Void exclude growth',()=>{
  const p=proposalProject(),alt=p.variables[0],ocean=p.variables[1],river=p.variables[2];
  alt.layers=[{...newLayer(),source:'constant',constant:.4}];
  ocean.layers=[{...newLayer(),source:'constant',constant:0}];
  river.layers=[{...newLayer(),source:'constant',constant:.8},{...newLayer(),source:'constant',constant:.4,blend:'subtract'}];
  const result=expandBiomes(p),voidField=result.variables.find(v=>v.appName==='biome.void')!;
  voidField.layers=[{...newLayer(),source:'constant',constant:0}];
  const value=(id:string)=>evaluator(result)(id,17,-23).value;
  assert.equal(value(river.id),.4);
  alt.layers[0].constant=.6;assert.ok(value(river.id)>0&&value(river.id)<.4);
  alt.layers[0].constant=.8;assert.equal(value(river.id),0);
  alt.layers[0].constant=.4;voidField.layers[0].constant=1;
  for(const id of [river.id,'biome.groundcover','biome.large_foliage'])assert.equal(value(id),0);
  voidField.layers[0].constant=0;ocean.layers[0].constant=1;
  for(const id of ['biome.groundcover','biome.large_foliage'])assert.equal(value(id),0);
});

test('ocean requires both its independent footprint and low altitude, including equality',()=>{
  const p=proposalProject(),alt=p.variables[0],ocean=p.variables[1];
  alt.layers=[{...newLayer(),source:'constant',constant:.42}];
  const footprint={...newLayer(),source:'constant' as const,constant:.8};
  ocean.layers=[footprint];const riverBefore=JSON.stringify(p.variables[2]);
  const fixed=gateOcean(p),run=()=>evaluator(fixed)(ocean.id,0,0).value;
  assert.equal(run(),1);alt.layers[0].constant=.420001;assert.equal(run(),0);
  alt.layers[0].constant=.2;footprint.constant=.3;assert.equal(run(),0);
  footprint.constant=.8;assert.equal(run(),1);
  assert.equal(JSON.stringify(fixed.variables[2]),riverBefore);
  assert.equal(gateOcean(fixed),fixed);assert.deepEqual(issues(fixed),[]);
  assert.deepEqual(parseProject(JSON.stringify(fixed)),fixed);
});

test('contour band selects original-field bounds and keeps gain/offset before its only clamp',()=>{
  const l={...newLayer(),source:'perlin' as const,noiseTransform:'band' as const,bandLow:.4,bandHigh:.6};
  assert.equal(adjustNoise(.4,l),0);assert.equal(adjustNoise(.6,l),0);
  assert.equal(adjustNoise(.5,l),1);assert.equal(adjustNoise(.2,l),0);
  assert.ok(Math.abs(adjustNoise(.45,l)-.5)<1e-12);
  l.bandLow=.49;l.bandHigh=.51;assert.equal(adjustNoise(.45,l),0);
  l.bandLow=.4;l.bandHigh=.6;l.gain=2;l.bias=-.25;
  assert.ok(Math.abs(adjustNoise(.45,l)-.75)<1e-12);
  l.gain=1;l.bias=.5;assert.equal(adjustNoise(.2,l),0); // would leak .5 if ridge were clamped too early
  l.bandHigh=l.bandLow;assert.throws(()=>adjustNoise(.5,l),/greater than/);
});
test('simplification reuses the authored River field and preserves its output rule',()=>{
  const p=proposalProject();delete p.riverStudyRevision;
  const river=p.variables[2];river.naturalName='Rivers';river.layers[0].scaleX=3000;river.layers[0].channel='authored';
  river.type='boolean';river.cutoff=.7;
  const extra=newVariable(10);p.variables.push(extra);
  const result=simplifyRiverStudy(p);
  assert.equal(result.variables.length,3);assert.deepEqual(result.variables.map(v=>v.naturalName),['Altitude','Ocean','River']);
  assert.equal(result.variables[2].id,river.id);assert.equal(result.variables[2].layers[0].channel,'authored');
  assert.equal(result.variables[2].layers[0].scaleX,3000);assert.equal(result.variables[2].layers[0].noiseTransform,'band');
  assert.equal(result.variables[2].type,'boolean');assert.equal(result.variables[2].cutoff,.7);
  assert.deepEqual(issues(result),[]);assert.deepEqual(parseProject(JSON.stringify(result)),result);
  assert.equal(p.variables.length,4);
});

test('Perlin and fBm proximity follows gain and offset, precedes clamp and blend',()=>{
  for(const source of ['perlin','fbm'] as const){
    const p=starter(),v=p.variables[0];v.layers=[{...newLayer(),source}];
    const l=v.layers[0],run=()=>evaluator(p)(v.id,17,-23);
    const n=run().trace[0].source;
    l.noiseTransform='distance';l.noiseTarget=n;assert.equal(run().trace[0].adjusted,1);
    l.gain=3;l.bias=-2;l.noiseTarget=.4;
    const expected=Math.max(0,1-Math.abs(n*3-2-.4));
    assert.equal(run().trace[0].source,n);assert.equal(run().trace[0].adjusted,expected);
    l.weight=.25;assert.equal(run().raw,expected*.25);
    l.invert=true;
    assert.equal(run().raw,Math.max(0,1-Math.abs((1-n)*3-2-.4))*.25);
    v.type='boolean';v.cutoff=.2;assert.equal(run().value,run().raw>=.2?1:0);
    assert.deepEqual(parseProject(JSON.stringify(p)),p);
  }
});
test('noise-distance settings validate targets and do not affect reference layers',()=>{
  const p=starter(),v=p.variables[0];v.layers=[{...newLayer(),source:'constant',constant:.7,noiseTransform:'distance',noiseTarget:.5}];
  assert.equal(evaluator(p)(v.id,0,0).raw,.7);
  v.layers[0].noiseTarget=-.1;assert.throws(()=>parseProject(JSON.stringify(p)),/Invalid/);
  v.layers[0].noiseTarget=1.1;assert.throws(()=>parseProject(JSON.stringify(p)),/Invalid/);
});

test('v2 civilization migration preserves recipe and category order includes variation',()=>{
  const p:any=starter();p.version=2;p.variables[0].category='man-made';
  const result=parseProject(JSON.stringify(p));assert.equal(result.variables[0].category,'civilization');
  assert.deepEqual(result.variables[0].layers,p.variables[0].layers);
  assert.deepEqual(Object.keys(CATEGORIES),['biome','civilization','variation','occurrences']);
});
test('ocean reference recipe matches supplied controls',()=>{
  const ocean=proposalProject().variables.find(v=>v.id==='natural.ocean')!;
  const [noise,influence]=ocean.layers;
  assert.deepEqual([noise.source,noise.scaleX,noise.scaleY,noise.offsetX,noise.offsetY,noise.gain,noise.bias,noise.weight],['perlin',3000,2000,345234,0,1,0,1]);
  assert.deepEqual([influence.blend,influence.weight,influence.gain,influence.invert,influence.referenceMode,influence.referenceCutoff],['multiply',1,1,false,'at-most',.42]);
  assert.equal(ocean.cutoff,.58);
});
test('saved recipe refresh is backed up, preserves authored ocean and runs once',()=>{
  const p=proposalProject();delete p.biomeRecipeRevision;
  const ocean=p.variables.find(v=>v.id==='natural.ocean')!;ocean.layers[0].offsetX=12345;ocean.cutoff=.57;
  p.variables[0].layers[0].scaleX=110;
  const custom=newVariable(20);custom.category='civilization';p.variables.push(custom);
  const values:Record<string,string>={[STORAGE_KEY]:JSON.stringify(p)};
  const migrated=loadProject({getItem:key=>values[key]??null,setItem:(key,value)=>{values[key]=value;}});
  assert.equal(values[STORAGE_KEY+'-before-scale-update'],JSON.stringify(p));
  assert.deepEqual(migrated.variables.find(v=>v.id===ocean.id)!.layers,ocean.layers);
  assert.equal(migrated.variables.find(v=>v.id===ocean.id)!.cutoff,.57);
  assert.equal(migrated.variables[0].layers[0].scaleX,3200);
  assert.deepEqual(migrated.variables.find(v=>v.id===custom.id),custom);
  migrated.variables[0].layers[0].scaleX=777;
  assert.equal(refreshBiomeRecipes(migrated).variables[0].layers[0].scaleX,777);
  assert.deepEqual(issues(migrated),[]);
});

test('biome proposals are ordinary valid sandbox data',()=>{const p=proposalProject();assert.deepEqual(issues(p),[]);assert.ok(p.variables.every(v=>v.category==='biome'));assert.deepEqual(parseProject(JSON.stringify(p)),p);});

test('legacy imports migrate to categories and preserve recipes',()=>{const p:any=starter();p.version=1;for(const v of p.variables)delete v.category;const migrated=parseProject(JSON.stringify(p));assert.equal(migrated.version,3);assert.equal(migrated.variables[0].category,'biome');assert.deepEqual(migrated.variables[0].layers,p.variables[0].layers);});

test('legacy drafts combine without losing edited variables',()=>{const a=starter(),b=proposalProject();a.variables[0].low='Edited';const values:Record<string,string>={'explorer-fieldwork-v1':JSON.stringify(a),'explorer-fieldwork-natural-v1':JSON.stringify(b)};const p=loadProject({getItem:key=>values[key]??null});assert.equal(p.variables.length,a.variables.length+b.variables.length);assert.deepEqual(issues(p),[]);});

test('project round-trip retains the full recipe and language', () => {
  const p = starter(); p.variables[0].low = 'A dry, low basin.';
  assert.deepEqual(parseProject(JSON.stringify(p)), p);
});
test('boolean cutoff equality is on, even at zero and one', () => {
  const v = newVariable(1); v.type = 'boolean'; v.cutoff = .5;
  assert.equal(classify(v,.4999).value,0); assert.equal(classify(v,.5).value,1);
  v.cutoff=0; assert.equal(classify(v,0).value,1);
  v.cutoff=1; assert.equal(classify(v,1).value,1); assert.equal(classify(v,.9999).value,0);
});
test('enum evaluation uses cutoff order and returns the associated language', () => {
  const v = newVariable(1); v.type = 'enum'; v.steps.reverse();
  assert.equal(classify(v,0).label,'Low'); assert.equal(classify(v,.4).label,'Medium');
  assert.equal(classify(v,.65).label,'High'); assert.equal(classify(v,1).value,1);
  assert.equal(classify(v,.4).description,'A moderate amount.');
});
test('enum gaps, ambiguous cutoffs and duplicate app names are reported', () => {
  const p=starter(); const v=p.variables[0]; v.type='enum'; v.steps[0].cutoff=.1;
  assert.match(issues(p).join(' '),/lowest enum cutoff/);
  v.steps[0].cutoff=0;v.steps[1].cutoff=0;assert.match(issues(p).join(' '),/distinct/);
  const second=newVariable(2);second.appName=v.appName;p.variables.push(second);
  assert.match(issues(p).join(' '),/app names must be unique/);
});
test('blend weighting occurs before clamping and mask semantics are explicit', () => {
  assert.equal(blend(.8,.8,'add',.5),1);
  assert.equal(blend(.2,.8,'replace',.5),.5);
  assert.equal(blend(.8,0,'multiply',1),0);
  assert.equal(blend(.8,0,'multiply',0),.8);
  assert.equal(blend(.5,.5,'screen',1),.75);
});
test('boolean references gate other variables through their interpreted output', () => {
  const p=starter(),gate=p.variables[0];gate.type='boolean';gate.cutoff=.5;
  gate.layers[0]={...newLayer(),source:'constant',constant:.4};
  const v=newVariable(2);v.layers=[{...newLayer(),source:'constant',constant:.8},
    {...newLayer(),source:'variable',reference:gate.id,blend:'multiply'}];p.variables.push(v);
  assert.equal(evaluator(p)(v.id,9,-2).value,0);
  gate.layers[0].constant=.5;assert.equal(evaluator(p)(v.id,9,-2).value,.8);
});
test('stack order changes the result and disabled layers leave no trace', () => {
  const p=starter(),v=p.variables[0];
  const base={...newLayer(),source:'constant' as const,constant:.8};
  const mask={...newLayer(),source:'constant' as const,constant:.5,blend:'multiply' as const};
  v.layers=[base,mask];assert.equal(evaluator(p)(v.id,0,0).value,.4);
  v.layers=[mask,base];assert.equal(evaluator(p)(v.id,0,0).value,.8);
  base.enabled=false;const r=evaluator(p)(v.id,0,0);assert.equal(r.value,0);assert.equal(r.trace.length,1);
});
test('source, adjustment and accumulation remain separately inspectable', () => {
  const p=starter(),v=p.variables[0];
  v.layers=[{...newLayer(),source:'constant',constant:.2,invert:true,gain:.5,bias:.1,weight:.5}];
  const r=evaluator(p)(v.id,0,0);assert.equal(r.trace[0].source,.2);
  assert.equal(r.trace[0].adjusted,.5);assert.equal(r.trace[0].accumulated,.25);
});
test('circular and missing dependencies fail cleanly, including disabled references', () => {
  const p=starter(),a=p.variables[0],b=newVariable(2);p.variables.push(b);
  a.layers=[{...newLayer(),source:'variable',reference:b.id}];b.layers=[{...newLayer(),source:'variable',reference:a.id}];
  assert.match(issues(p).join(' '),/Circular/);assert.throws(()=>evaluator(p)(a.id,0,0),/Circular/);
  b.layers[0].enabled=false;assert.match(issues(p).join(' '),/Circular/);
  b.layers=[];a.layers[0].reference='missing';assert.match(issues(p).join(' '),/existing source/);
});
test('noise is deterministic, independent of display names, and sensitive to seed and transforms', () => {
  const p=starter(),v=p.variables[0];const before=evaluator(p)(v.id,13,-9);
  assert.deepEqual(evaluator(p)(v.id,13,-9),before);
  v.naturalName='Renamed';v.appName='renamed';assert.deepEqual(evaluator(p)(v.id,13,-9),before);
  v.layers[0].offsetX=19;assert.notEqual(evaluator(p)(v.id,13,-9).raw,before.raw);
  v.layers[0].offsetX=0;p.seed='another';assert.notEqual(evaluator(p)(v.id,13,-9).raw,before.raw);
});
test('all primitive families produce bounded finite values at a fixed negative coordinate', () => {
  const p=starter(),v=p.variables[0];
  for(const source of ['perlin','fbm','ridged','cellular','white','constant'] as const){
    v.layers=[{...newLayer(),source}];const r=evaluator(p)(v.id,-17,23);
    assert.ok(Number.isFinite(r.raw)&&r.raw>=0&&r.raw<=1,source);
  }
});
test('imports reject invalid versions, duplicate IDs, nonfinite and out-of-range settings', () => {
  for(const mutate of [
    (p:any)=>p.version=9,
    (p:any)=>p.variables[0].layers[0].scaleX=0,
    (p:any)=>p.variables[0].layers[0].octaves=10000,
    (p:any)=>p.variables[0].layers[0].gain=null,
    (p:any)=>p.variables[0].layers[0].id=p.variables[0].id,
    (p:any)=>p.variables[0].layers[0].source='execute-code',
  ]) {const p=starter();mutate(p);assert.throws(()=>parseProject(JSON.stringify(p)),/Invalid sandbox project/);}
  assert.throws(()=>parseProject('null'),/Invalid/);
  assert.throws(()=>parseProject('x'.repeat(2000001)),/2 MB/);
});

import {expandClimate} from '../sandbox/climate-expansion';

test('climate additions preserve authored recipes and round-trip without duplicating',()=>{
 const p=expandBiomes(proposalProject());p.variables[0].layers[0].gain=3.7;
 const q=expandClimate(p);assert.deepEqual(q.variables.slice(0,p.variables.length),p.variables);
 assert.equal(q.variables.length,p.variables.length+3);assert.equal(expandClimate(q),q);
 assert.deepEqual(parseProject(JSON.stringify(q)),q);assert.deepEqual(issues(q),[]);
});
test('moisture decreases and rock increases with altitude, with ground masks respected',()=>{
 const p=expandClimate(expandBiomes(proposalProject()));
 const altitude=p.variables.find(v=>v.naturalName==='Altitude')!;
 const moisture=p.variables.find(v=>v.appName==='biome.moisture')!;
 const rock=p.variables.find(v=>v.appName==='biome.exposed_rock')!;
 const ocean=p.variables.find(v=>v.naturalName==='Ocean')!,voidVar=p.variables.find(v=>v.naturalName==='Void')!;
 for(const v of [ocean,voidVar])v.layers=[{...newLayer(),source:'constant',constant:0}];
 for(const v of [moisture,rock])for(const l of v.layers)if(l.source!=='variable'){l.source='constant';l.constant=.8;l.gain=1;l.bias=0;}
 let previousMoisture=2,previousRock=-1;
 for(const height of [0,.2,.4,.6,.8,1]){
  altitude.layers=[{...newLayer(),source:'constant',constant:height}];
  const ev=evaluator(p),m=ev(moisture.id,0,0).raw,r=ev(rock.id,0,0).raw;
  assert.ok(m<previousMoisture);assert.ok(r>previousRock);previousMoisture=m;previousRock=r;
 }
 ocean.layers[0].constant=1;assert.equal(evaluator(p)(rock.id,0,0).raw,0);
 ocean.layers[0].constant=0;voidVar.layers[0].constant=1;assert.equal(evaluator(p)(rock.id,0,0).raw,0);
});
test('severe weather has compact 5–8 cell patches and background capped at 30 percent',()=>{
 const p=expandClimate(expandBiomes(proposalProject())),v=p.variables.find(v=>v.appName==='biome.weather_severity')!;
 const patch=v.layers[1],ev=evaluator(p),blocks=new Map<string,number[][]>();let severe=0,mild=0;
 // One 96 by 96 cell viewport, including negative coordinates and seams.
 for(let y=-48;y<48;y++)for(let x=-48;x<48;x++){
  const source=generateNoise(p.seed,patch,x,y),value=ev(v.id,x,y).raw;
  assert.equal(generateNoise(p.seed,patch,x,y),source);
  if(source===0){assert.ok(value<=.3);mild++;}
  if(value>.3)severe++;
  if(source>0){const key=Math.floor((x+.5)/32)+','+Math.floor((y+.5)/32);const cells=blocks.get(key)??[];cells.push([x,y]);blocks.set(key,cells);}
 }
 assert.ok(severe>0);assert.ok(mild>9000);
 for(const cells of blocks.values())for(const axis of [0,1])assert.ok(Math.max(...cells.map(c=>c[axis]))-Math.min(...cells.map(c=>c[axis]))+1<=8);
 patch.patchChance=0;assert.equal(generateNoise(p.seed,patch,0,0),0);
 patch.patchSpacing=8;assert.throws(()=>parseProject(JSON.stringify(p)),/Invalid/);
});

import {expandWaterFissures} from '../sandbox/water-fissure-expansion';
test('lakes and chasms append once, preserve existing recipes and serialize',()=>{
 const p=expandClimate(expandBiomes(proposalProject())),q=expandWaterFissures(p);
 assert.deepEqual(q.variables.slice(0,p.variables.length),p.variables);assert.equal(q.variables.length,p.variables.length+2);
 assert.equal(expandWaterFissures(q),q);assert.deepEqual(parseProject(JSON.stringify(q)),q);assert.deepEqual(issues(q),[]);
});
test('lake coverage declines uphill while some ponds survive at maximum altitude',()=>{
 const p=expandWaterFissures(expandBiomes(proposalProject()));
 const lake=p.variables.find(v=>v.appName==='biome.lakes_ponds')!;
 const altitude=p.variables.find(v=>v.naturalName==='Altitude')!;
 const ocean=p.variables.find(v=>v.naturalName==='Ocean')!,voidVar=p.variables.find(v=>v.naturalName==='Void')!;
 for(const v of [ocean,voidVar])v.layers=[{...newLayer(),source:'constant',constant:0}];
 const counts:number[]=[];let previous:number[]|undefined;
 for(const height of [0,.5,1]){
  altitude.layers=[{...newLayer(),source:'constant',constant:height}];const ev=evaluator(p),values:number[]=[];
  for(let y=-48;y<48;y++)for(let x=-48;x<48;x++)values.push(ev(lake.id,x,y).raw);
  if(previous)values.forEach((value,i)=>assert.ok(value<=previous![i]));
  counts.push(values.filter(v=>v>0).length);previous=values;
 }
 assert.ok(counts[0]>counts[1]&&counts[1]>counts[2]&&counts[2]>0,JSON.stringify(counts));
 ocean.layers[0].constant=1;assert.equal(evaluator(p)(lake.id,0,0).raw,0);
});
test('chasms retain contour-band construction and regional suppression',()=>{
 const p=expandWaterFissures(expandBiomes(proposalProject()));
 const v=p.variables.find(v=>v.appName==='biome.chasms')!;
 assert.equal(v.layers[0].noiseTransform,'band');assert.equal(v.layers[1].blend,'multiply');
 v.layers[1]={...v.layers[1],source:'constant',constant:0,gain:1,bias:0};
 assert.equal(evaluator(p)(v.id,19,23).raw,0);
});

import {configureTraversal,blocksExploration,traversalEvaluator,biomeContext} from '../sandbox/traversal';
test('traversal defaults preserve all noise recipes and make chasms binary once',()=>{
 const p=expandWaterFissures(expandClimate(expandBiomes(proposalProject()))),q=configureTraversal(p);
 assert.deepEqual(q.variables.map(v=>v.layers),p.variables.map(v=>v.layers));
 assert.equal(q.variables.find(v=>v.appName==='biome.chasms')!.type,'boolean');
 assert.equal(q.variables.filter(v=>v.traversal?.mode==='positive').length,4);
 assert.equal(q.variables.find(v=>v.appName==='biome.river')!.traversal!.mode,'passable');
 assert.deepEqual(parseProject(JSON.stringify(q)),q);assert.equal(configureTraversal(q),q);
});
test('blocking uses interpreted output, including boolean and enum cutoff equality',()=>{
 const v=newVariable(1);v.traversal={mode:'positive'};v.type='boolean';v.cutoff=.5;
 assert.equal(blocksExploration(v,classify(v,.49).value),false);
 assert.equal(blocksExploration(v,classify(v,.5).value),true);
 v.type='gradient';assert.equal(blocksExploration(v,0),false);assert.equal(blocksExploration(v,.000001),true);
 v.traversal={mode:'threshold',cutoff:.5};assert.equal(blocksExploration(v,.4999),false);assert.equal(blocksExploration(v,.5),true);
 v.type='enum';assert.equal(blocksExploration(v,classify(v,.4).value),true);
 v.traversal.cutoff=0;assert.equal(blocksExploration(v,0),true);
});
test('all blockers are reported and passable fields cannot override them',()=>{
 const p=starter(),a=p.variables[0];a.traversal={mode:'positive'};a.layers=[{...newLayer(),source:'constant',constant:1}];
 const b=newVariable(2);b.traversal={mode:'threshold',cutoff:.5};b.layers=[{...newLayer(),source:'constant',constant:.5}];
 const c=newVariable(3);c.traversal={mode:'passable'};c.layers=[{...newLayer(),source:'constant',constant:1}];p.variables.push(b,c);
 assert.deepEqual(traversalEvaluator(p)(0,0).blockedBy.map(v=>v.id),[a.id,b.id]);
 a.layers[0].constant=0;b.layers[0].constant=0;assert.equal(traversalEvaluator(p)(0,0).explorable,true);
 assert.equal(traversalEvaluator({...p,variables:[]})(0,0).explorable,true);
});
test('non-biome rules are ignored and indirect non-biome influence is rejected',()=>{
 const p=starter(),a=p.variables[0];a.traversal={mode:'positive'};a.layers=[{...newLayer(),source:'constant',constant:1}];
 for(const category of ['civilization','variation','occurrences'] as const){a.category=category;assert.equal(traversalEvaluator(p)(0,0).explorable,true);}
 a.category='biome';const b=newVariable(2),c=newVariable(3);c.category='civilization';
 a.layers=[{...newLayer(),source:'variable',reference:b.id}];b.layers=[{...newLayer(),source:'variable',reference:c.id}];p.variables.push(b,c);
 assert.match(issues(p).join(' '),/Traversal can only depend on Biome/);assert.throws(()=>traversalEvaluator(p),/Traversal can only/);
 c.category='biome';assert.deepEqual(issues(p),[]);
});
test('compiled context includes biome descriptors and authoritative traversal only',()=>{
 const p=starter();p.variables[0].traversal={mode:'positive'};p.variables[0].layers=[{...newLayer(),source:'constant',constant:.8}];
 const other=newVariable(2);other.category='civilization';p.variables.push(other);
 const context=biomeContext(p,4,-7);assert.equal(context.biome.length,1);assert.equal(context.x,4);assert.equal(context.y,-7);
 assert.equal(context.traversal.explorable,false);assert.equal(context.biome[0].low,p.variables[0].low);
});
test('invalid traversal data is rejected on import',()=>{
 for(const traversal of [null,{mode:'allow-all'},{mode:'threshold',cutoff:2},{mode:'threshold',cutoff:null}]){
  const p=starter();(p.variables[0] as any).traversal=traversal;assert.throws(()=>parseProject(JSON.stringify(p)),/Invalid/);
 }
});

import {expandCivilization} from '../sandbox/civilization-expansion';
test('civilization recipes preserve the baseline and resolve cross-category and internal references',()=>{
 const p=configureTraversal(expandWaterFissures(expandClimate(expandBiomes(proposalProject()))));
 p.variables[0].id='custom-altitude';
 for(const v of p.variables)for(const l of v.layers)if(l.reference==='natural.elevation')l.reference='custom-altitude';
 const q=expandCivilization(p);
 assert.deepEqual(q.variables.slice(0,p.variables.length),p.variables);assert.equal(q.variables.length,p.variables.length+10);
 assert.equal(expandCivilization(q),q);assert.deepEqual(issues(q),[]);assert.deepEqual(parseProject(JSON.stringify(q)),q);
 const density=q.variables.find(v=>v.appName==='civilization.density')!;
 assert.ok(density.layers.some(l=>l.reference==='custom-altitude'));
 assert.ok(q.variables.find(v=>v.appName==='civilization.commerce')!.layers.some(l=>l.reference===density.id));
 const partial={...q,civilizationRevision:undefined,variables:q.variables.filter(v=>!['civilization.commerce','civilization.wealth'].includes(v.appName))};
 const completed=expandCivilization(partial);assert.equal(completed.variables.filter(v=>v.appName==='civilization.density').length,1);
 assert.deepEqual(issues(completed),[]);
});
test('civilization fields are finite and cannot change traversal',()=>{
 const p=configureTraversal(expandWaterFissures(expandClimate(expandBiomes(proposalProject())))),q=expandCivilization(p);
 const before=traversalEvaluator(p),after=traversalEvaluator(q),ev=evaluator(q);
 for(const [x,y] of [[0,0],[-37,18],[420,-310]]){
  assert.deepEqual(after(x,y),before(x,y));
  for(const v of q.variables.filter(v=>v.category==='civilization')){
   const result=ev(v.id,x,y);assert.ok(Number.isFinite(result.value)&&result.value>=0&&result.value<=1);
  }
 }
});
test('affiliation arrays are abstract editable enums with no traversal rules',()=>{
 const q=expandCivilization(configureTraversal(expandWaterFissures(expandClimate(expandBiomes(proposalProject())))));
 for(const v of q.variables.filter(v=>v.category==='civilization'&&v.type==='enum')){
  assert.equal(v.steps.length,8);assert.equal(v.traversal,undefined);
  v.steps.forEach(s=>assert.equal(classify(v,s.cutoff).label,s.name));
 }
 const faction=q.variables.find(v=>v.appName==='civilization.faction')!;
 faction.steps[0].name='Affiliation A';faction.steps[0].description='A locally named affiliation.';
 assert.equal(classify(faction,0).description,'A locally named affiliation.');
 assert.deepEqual(parseProject(JSON.stringify(q)),q);
});

import {expandInfrastructure} from '../sandbox/infrastructure-expansion';
test('infrastructure is independent and preserves authored civilization recipes',()=>{
 const p=expandCivilization(configureTraversal(expandWaterFissures(expandClimate(expandBiomes(proposalProject())))));
 p.variables.find(v=>v.appName==='civilization.advancement')!.description='Authored description';
 const q=expandInfrastructure(p),v=q.variables.find(v=>v.appName==='civilization.infrastructure')!;
 assert.deepEqual(q.variables.slice(0,p.variables.length),p.variables);assert.equal(expandInfrastructure(q),q);
 assert.equal(v.category,'civilization');assert.ok(v.layers.every(l=>l.source!=='variable'));assert.equal(v.traversal,undefined);
 assert.deepEqual(parseProject(JSON.stringify(q)),q);assert.deepEqual(issues(q),[]);
});

import {shapeCivilization} from '../sandbox/civilization-shapes';
import {civilizationEvaluator} from '../sandbox/civilization-view';
test('presence preserves full traits and distinguishes absent from zero and enum slot one',()=>{
 const p=starter(),mask=p.variables[0],v=newVariable(2);p.variables.push(v);
 mask.layers=[{...newLayer(),source:'constant',constant:.001}];
 v.layers=[{...newLayer(),source:'constant',constant:1}];v.presenceReference=mask.id;
 assert.equal(evaluator(p)(v.id,0,0).value,1);
 v.type='enum';v.layers[0].constant=0;assert.equal(evaluator(p)(v.id,0,0).label,'Low');assert.equal(evaluator(p)(v.id,0,0).present,true);
 mask.layers[0].constant=0;assert.equal(evaluator(p)(v.id,0,0).label,'Absent');assert.equal(evaluator(p)(v.id,0,0).present,false);
 v.traversal={mode:'threshold',cutoff:0};assert.equal(traversalEvaluator(p)(0,0).explorable,true);
 mask.presenceReference=v.id;assert.match(issues(p).join(' '),/Circular/);
});
test('civilization shaping preserves biome, keeps independent traits, and round trips',()=>{
 const p=expandInfrastructure(expandCivilization(configureTraversal(expandWaterFissures(expandClimate(expandBiomes(proposalProject()))))));
 const q=shapeCivilization(p);assert.equal(shapeCivilization(q),q);assert.deepEqual(issues(q),[]);assert.deepEqual(parseProject(JSON.stringify(q)),JSON.parse(JSON.stringify(q)));
 assert.deepEqual(q.variables.filter(v=>v.category==='biome'),p.variables.filter(v=>v.category==='biome'));
 for(const key of ['wealth','commerce','advancement','age','aggression']){
  const v=q.variables.find(v=>v.appName==='civilization.'+key)!;assert.ok(v.presenceReference);assert.ok(v.layers.every(l=>l.source!=='variable'));
 }
 const density=q.variables.find(v=>v.appName==='civilization.density')!;const built=q.variables.find(v=>v.appName==='civilization.infrastructure')!;
 density.layers=[{...newLayer(),source:'constant',constant:0}];built.layers=[{...newLayer(),source:'constant',constant:0}];
 let r=civilizationEvaluator(q)(0,0);assert.equal(r.footprint,0);assert.equal(r.fields.find(f=>f.appName==='civilization.faction')!.present,false);
 built.layers[0].constant=1;r=civilizationEvaluator(q)(0,0);assert.equal(r.density,0);assert.equal(r.infrastructure,1);assert.equal(r.fields.find(f=>f.appName==='civilization.age')!.present,true);
 density.layers[0].constant=.001;const wealth=q.variables.find(v=>v.appName==='civilization.wealth')!;wealth.layers=[{...newLayer(),source:'constant',constant:1}];assert.equal(evaluator(q)(wealth.id,0,0).value,1);
});
test('traversal cannot acquire non-biome influences through a presence footprint',()=>{
 const p=starter(),other=newVariable(2);other.category='civilization';p.variables.push(other);
 p.variables[0].traversal={mode:'positive'};p.variables[0].presenceReference=other.id;
 assert.match(issues(p).join(' '),/Traversal can only depend/);
});

import {expandCivilizationImpact} from '../sandbox/civilization-impact';
test('impact footprint includes habitation and independently masks all cultural traits',()=>{
 const p=shapeCivilization(expandInfrastructure(expandCivilization(configureTraversal(expandWaterFissures(expandClimate(expandBiomes(proposalProject())))))));
 const q=expandCivilizationImpact(p);assert.equal(expandCivilizationImpact(q),q);assert.deepEqual(issues(q),[]);
 assert.deepEqual(q.variables.filter(v=>v.category==='biome'),p.variables.filter(v=>v.category==='biome'));
 const density=q.variables.find(v=>v.appName==='civilization.density')!,foot=q.variables.find(v=>v.appName==='civilization.footprint')!,age=q.variables.find(v=>v.appName==='civilization.age')!;
 const infra=q.variables.find(v=>v.appName==='civilization.infrastructure')!;
 for(const v of q.variables.filter(v=>v.category==='civilization'&&![density.id,foot.id].includes(v.id)&&!v.appName.startsWith('civilization.animal_')))assert.equal(v.presenceReference,foot.id);
 density.layers=[{...newLayer(),source:'constant',constant:1}];assert.equal(evaluator(q)(foot.id,0,0).value,1);
 density.layers[0].constant=0;foot.layers=[{...newLayer(),source:'constant',constant:1}];
 age.layers=[{...newLayer(),source:'constant',constant:0}];infra.layers=[{...newLayer(),source:'constant',constant:1}];
 assert.equal(evaluator(q)(age.id,0,0).present,true);assert.equal(evaluator(q)(infra.id,0,0).value,1);
 age.layers[0].constant=1;assert.equal(evaluator(q)(age.id,0,0).value,1);
 foot.layers[0].constant=0;assert.equal(evaluator(q)(infra.id,0,0).present,false);
 const animal=q.variables.find(v=>v.appName==='civilization.animal_population')!;animal.layers=[{...newLayer(),source:'constant',constant:1}];
 assert.equal(evaluator(q)(animal.id,0,0).value,1);assert.equal(civilizationEvaluator(q)(0,0).footprint,0);
 assert.deepEqual(parseProject(JSON.stringify(q)),JSON.parse(JSON.stringify(q)));
});

import {configureRiverCrossings} from '../sandbox/river-crossings';
test('river barriers preserve river shape, increase with strength, and have frequent gaps',()=>{
 const p=configureTraversal(expandWaterFissures(expandBiomes(proposalProject()))),q=configureRiverCrossings(p);
 const river=q.variables.find(v=>v.appName==='biome.river')!,barrier=q.variables.find(v=>v.appName==='biome.river_barrier')!;
 assert.deepEqual(river.layers,p.variables.find(v=>v.id===river.id)!.layers);assert.equal(configureRiverCrossings(q),q);
 const counts:number[]=[];
 for(const strength of [0,.2,.5,1]){
  river.layers=[{...newLayer(),source:'constant',constant:strength}];const ev=evaluator(q);let count=0;
  for(let y=-24;y<24;y++)for(let x=-24;x<24;x++)count+=ev(barrier.id,x,y).value;
  counts.push(count);
 }
 assert.equal(counts[0],0);assert.ok(counts[1]<counts[2]&&counts[2]<counts[3]);assert.ok(counts[3]>48*48*.5&&counts[3]<48*48,JSON.stringify(counts));
 assert.deepEqual(parseProject(JSON.stringify(q)),q);
});
test('global traversal mask applies to all civilization outputs and preserves raw inspection',()=>{
 const p=starter(),block=p.variables[0];block.traversal={mode:'positive'};block.layers=[{...newLayer(),source:'constant',constant:1}];p.civilizationObeysTraversal=true;
 const v=newVariable(2);v.category='civilization';v.type='enum';v.layers=[{...newLayer(),source:'constant',constant:1}];p.variables.push(v);
 let r=evaluator(p)(v.id,0,0);assert.equal(r.present,false);assert.equal(r.value,0);assert.equal(r.raw,1);assert.match(r.description,/traversability/);
 block.layers[0].constant=0;r=evaluator(p)(v.id,0,0);assert.equal(r.present,true);assert.equal(r.value,1);
 block.layers[0].constant=1;p.civilizationObeysTraversal=false;assert.equal(evaluator(p)(v.id,0,0).present,true);
});

test('rivers block by default and relief alone opens exceptions, including weakest positive water',()=>{
 const q=configureRiverCrossings(configureTraversal(expandWaterFissures(expandBiomes(proposalProject()))));
 const river=q.variables.find(v=>v.appName==='biome.river')!,relief=q.variables.find(v=>v.appName==='biome.river_relief')!,barrier=q.variables.find(v=>v.appName==='biome.river_barrier')!;
 river.layers=[{...newLayer(),source:'constant',constant:.0000001}];
 relief.layers=[{...newLayer(),source:'constant',constant:0}];assert.equal(evaluator(q)(barrier.id,0,0).value,1);
 relief.layers[0].constant=1;assert.equal(evaluator(q)(barrier.id,0,0).value,0);
 river.layers[0].constant=0;assert.equal(evaluator(q)(barrier.id,0,0).value,0);
});

import {overallMapEvaluator} from '../sandbox/overall-map';
test('overall map chasms are black, while civilization toggles presentation only',()=>{
 const p=starter(),block=p.variables[0];block.appName='biome.chasms';block.traversal={mode:'positive'};block.layers=[{...newLayer(),source:'constant',constant:1}];
 const density=newVariable(2);density.category='civilization';density.appName='civilization.density';density.layers=[{...newLayer(),source:'constant',constant:1}];p.variables.push(density);
 for(const show of [true,false])assert.deepEqual(overallMapEvaluator(p,show)(0,0),{rgb:[0,0,0],explorable:false});
 block.layers[0].constant=0;const before=JSON.stringify(p);
 assert.notDeepEqual(overallMapEvaluator(p,true)(0,0).rgb,overallMapEvaluator(p,false)(0,0).rgb);
 assert.equal(JSON.stringify(p),before);assert.equal(overallMapEvaluator(p,false)(0,0).explorable,true);
});

test('overall map shows blocked water in blue; lakes remain nontraversable',()=>{
 for(const appName of ['natural.ocean','biome.lakes_ponds','biome.river_barrier']){
  const p=starter(),v=p.variables[0];v.appName=appName;v.color='#478bda';v.traversal={mode:'positive'};
  v.layers=[{...newLayer(),source:'constant',constant:1}];
  const r=overallMapEvaluator(p,true)(0,0);assert.equal(r.explorable,false);assert.notDeepEqual(r.rgb,[0,0,0]);
  if(appName!=='biome.river_barrier')assert.ok(r.rgb[2]>r.rgb[0]);
 }
});

import {organicCivilization} from '../sandbox/organic-civilization';
test('organic patch boundaries are deterministic and stay inside the old envelope',()=>{
 const l={...newLayer(),source:'patches' as const,channel:'organic-test',patchSpacing:40,patchChance:1,patchMinDiameter:30,patchMaxDiameter:30};let changed=0;
 for(let y=0;y<40;y++)for(let x=0;x<40;x++){
  const old=generateNoise('test',l,x,y),n=generateNoise('test',{...l,patchRoughness:.85},x,y);
  assert.ok(n<=old+1e-12);assert.equal(n,generateNoise('test',{...l,patchRoughness:.85},x,y));if(old>0&&n===0)changed++;
 }
 assert.ok(changed>20);
});
test('organic civilization update preserves non-civilization recipes and patch frequency',()=>{
 const p=expandCivilizationImpact(shapeCivilization(expandInfrastructure(expandCivilization(configureTraversal(expandWaterFissures(expandClimate(expandBiomes(proposalProject()))))))));
 const q=organicCivilization(p);assert.equal(organicCivilization(q),q);
 for(let i=0;i<p.variables.length;i++){
  if(!['civilization.density','civilization.footprint'].includes(p.variables[i].appName))assert.deepEqual(q.variables[i],p.variables[i]);
  else for(let j=0;j<p.variables[i].layers.length;j++){const old=p.variables[i].layers[j],n=q.variables[i].layers[j];assert.equal(n.patchChance,old.patchChance);assert.equal(n.patchSpacing,old.patchSpacing);}
 }
 assert.deepEqual(parseProject(JSON.stringify(q)),JSON.parse(JSON.stringify(q)));
});

import {uniquenessDrive,growUniqueness,MAX_VARIABLES} from '../sandbox/model';
import {expandUniqueness} from '../sandbox/uniqueness-expansion';
test('uniqueness escalation is radial, calibrated, bounded and preserves zero',()=>{
 const p=starter();p.uniquenessEscalation={enabled:true,reach:200,power:.5};
 assert.equal(uniquenessDrive(p,0,0),1);assert.equal(uniquenessDrive(p,60,80),uniquenessDrive(p,-100,0));
 const values=[0,100,1000,10000].map(d=>growUniqueness(.1,uniquenessDrive(p,d,0)));
 assert.ok(values[1]>.15&&values[1]<.16);assert.ok(values[2]>.39&&values[2]<.4);assert.ok(values[3]>.72&&values[3]<.73);
 assert.equal(growUniqueness(0,1e6),0);assert.ok(growUniqueness(.1,1e6)<1);
 p.uniquenessEscalation.enabled=false;assert.equal(uniquenessDrive(p,10000,0),1);
});
test('single-cell sparks are isolated, deterministic, and become more frequent with drive',()=>{
 const l={...newLayer(),source:'sparks' as const,channel:'sparks-test',sparkCutoff:.998,sparkFloor:1};let near=0,far=0;
 for(let y=-48;y<48;y++)for(let x=-48;x<48;x++){
  const a=generateNoise('test',l,x,y,1),b=generateNoise('test',l,x,y,7.14);near+=a;far+=b;assert.ok(b>=a);
  if(b)for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)if(i||j)assert.equal(generateNoise('test',l,x+i,y+j,7.14),0);
 }
 assert.ok(near>0&&far>near);
});
test('uniqueness and occurrences add twelve fields without changing earlier categories or traversal',()=>{
 const p=organicCivilization(expandCivilizationImpact(shapeCivilization(expandInfrastructure(expandCivilization(configureTraversal(expandWaterFissures(expandClimate(expandBiomes(proposalProject())))))))));
 const q=expandUniqueness(p);assert.equal(q.variables.length,p.variables.length+12);assert.ok(q.variables.length<=MAX_VARIABLES);
 assert.deepEqual(q.variables.slice(0,p.variables.length),p.variables);assert.equal(expandUniqueness(q),q);assert.deepEqual(issues(q),[]);
 assert.deepEqual(parseProject(JSON.stringify(q)),JSON.parse(JSON.stringify(q)));
 assert.deepEqual(traversalEvaluator(q)(1000,0),traversalEvaluator(p)(1000,0));
 for(const v of q.variables.filter(v=>v.category==='variation'))assert.equal(v.traversal,undefined);
 const biomeBefore=evaluator(q)(q.variables[0].id,10,20);q.uniquenessEscalation!.power=1.5;assert.deepEqual(evaluator(q)(q.variables[0].id,10,20),biomeBefore);
});

test('uniqueness refinement migrates eight quiet gradients while preserving certain death and authored settings',()=>{
 const p=expandUniqueness(starter());p.uniquenessRevision=1;p.uniquenessEscalation={enabled:false,reach:333,power:.7};
 for(const v of p.variables.filter(v=>v.category==='variation'&&v.type==='gradient')){
  v.layers[0].weight=.2;
  if(['variation.opportunity','variation.danger'].includes(v.appName)){v.type='boolean';v.layers=[{...newLayer(),source:'sparks',sparkCutoff:.998,sparkFloor:1}];}
 }
 const q=expandUniqueness(p),fields=q.variables.filter(v=>v.category==='variation');
 assert.equal(fields.filter(v=>v.type==='gradient').length,8);assert.equal(fields.filter(v=>v.type==='boolean').length,0);
 assert.deepEqual(q.variables.find(v=>v.appName==='occurrences.certain_death'),p.variables.find(v=>v.appName==='occurrences.certain_death'));
 assert.deepEqual(q.uniquenessEscalation,p.uniquenessEscalation);assert.equal(expandUniqueness(q),q);
 for(const v of fields.filter(v=>v.type==='gradient')){
  assert.equal(v.layers[0].weight,.12);assert.equal(v.layers[1].sparkFloor,.5);
  const quiet={...q,variables:q.variables.map(w=>w.id===v.id?{...w,layers:[w.layers[0]]}:w)};
  const value=evaluator(quiet)(v.id,0,0).value;assert.ok(value>0&&value<=.12);
 }
 assert.deepEqual(q.variables.filter(v=>v.category!=='variation'),p.variables.filter(v=>v.category!=='variation'));
});

test('occurrences move Certain Death without reshaping it and preserve refined variation',()=>{
 const p=expandUniqueness(starter());p.uniquenessRevision=2;
 p.variables=p.variables.filter(v=>!['occurrences.teleport','occurrences.gift','occurrences.challenge'].includes(v.appName));
 const death=p.variables.find(v=>v.appName==='occurrences.certain_death')!;death.appName='variation.certain_death';death.category='variation';
 const q=expandUniqueness(p),moved=q.variables.find(v=>v.appName==='occurrences.certain_death')!;
 assert.equal(moved.id,death.id);assert.deepEqual(moved.layers,death.layers);assert.equal(moved.category,'occurrences');
 assert.deepEqual(q.variables.filter(v=>v.category==='variation'),p.variables.filter(v=>v.category==='variation'&&v.id!==death.id));
 for(const key of ['teleport','gift','challenge']){const v=q.variables.find(v=>v.appName==='occurrences.'+key)!;assert.equal(v.type,'boolean');assert.equal(v.layers[0].sparkCutoff,key==='teleport'?.995:.996);assert.equal(v.layers[0].sparkFloor,1);}
 assert.equal(q.variables.filter(v=>v.category==='occurrences').length,4);assert.equal(expandUniqueness(q),q);
 assert.deepEqual(parseProject(JSON.stringify(q)),JSON.parse(JSON.stringify(q)));
});

import {expandInteriorOptions} from '../sandbox/interior-options';
test('interior masks separate built and natural enclosure without changing traversal',()=>{
 const p=starter();
 for(const appName of ['civilization.footprint','civilization.infrastructure']){const v=newVariable(p.variables.length);v.category='civilization';v.appName=appName;v.layers=[{...newLayer(),source:'constant',constant:1}];p.variables.push(v);}
 const q=expandInteriorOptions(p);assert.equal(expandInteriorOptions(q),q);assert.deepEqual(q.variables.slice(0,p.variables.length),p.variables);
 const inside=q.variables.find(v=>v.appName==='civilization.inside')!,under=q.variables.find(v=>v.appName==='biome.underground')!,foot=q.variables.find(v=>v.appName==='civilization.footprint')!,built=q.variables.find(v=>v.appName==='civilization.infrastructure')!;
 for(const v of [inside,under])v.layers=[{...newLayer(),source:'constant',constant:1},v.layers.at(-1)!];
 for(const [f,b,i,u] of [[1,1,1,0],[1,0,0,0],[0,1,0,1],[0,0,0,1]]){foot.layers[0].constant=f;built.layers[0].constant=b;const e=evaluator(q);assert.equal(e(inside.id,0,0).value,i);assert.equal(e(under.id,0,0).value,u);assert.deepEqual(traversalEvaluator(q)(0,0),traversalEvaluator(p)(0,0));}
 assert.equal(q.variables.find(v=>v.appName==='occurrences.option')!.layers[0].sparkCutoff,.996);assert.deepEqual(issues(q),[]);assert.deepEqual(parseProject(JSON.stringify(q)),JSON.parse(JSON.stringify(q)));
});
