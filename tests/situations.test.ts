import {test} from 'node:test';
import assert from 'node:assert/strict';
import {environmentFor,deriveSituations} from '../lib/situations';
import {transportFor} from '../lib/transport';
import {exists,deriveRatings} from '../lib/world';
test('climate combinations produce snow, jungle, desert and alpine terrain',()=>{
 const env=(t:number,h:number,e:number,f=0)=>environmentFor({'climate.temperature':t,'climate.humidity':h,'terrain.elevation':e,'vegetation.forest':f});
 assert.equal(env(.1,.6,.5).landcover,'snowfields');assert.equal(env(.8,.8,.4,.8).landcover,'dense tropical jungle');assert.equal(env(.9,.1,.4).landcover,'hot desert');assert.equal(env(.4,.4,.9).landcover,'alpine rock and scree');
});
test('layered terrain uses exit geometry without adding a route or event',()=>{
 const v={'terrain.elevation':.9,'climate.temperature':.2,'climate.humidity':.8,'terrain.enclosure':.2};
 const s=deriveSituations(v,{north:true,east:true,south:false,west:false});assert.ok(s.some(s=>s.id==='turning-ledge'));assert.ok(s.some(s=>s.id==='alpine-freeze'));
 assert.ok(deriveSituations(v,{north:true,east:false,south:true,west:false}).some(s=>s.id==='ridge-traverse'));
});
test('transport is frequent, deterministic, nonlethal and always lands on the connected map',()=>{
 let count=0;const forms=new Set();for(let x=10;x<6010;x++){
  const v={'terrain.enclosure':0,'water.river':1};const t=transportFor('transport-test'+x,20,9,v);if(!t)continue;count++;forms.add(t.mechanism);assert.deepEqual(t,transportFor('transport-test'+x,20,9,v));assert.ok(exists('transport-test',t.destination.x,t.destination.y));assert.notDeepEqual(t.destination,{x:20,y:9});
 }
 assert.ok(count/6000>.05&&count/6000<.075);assert.ok(forms.size>=8);
 assert.equal(transportFor('transport-test',0,0,{}),null);assert.equal(transportFor('transport-test',10,8,{'hazards.trap':1}),null);
});
test('climate gradients reach both ends of the spectrum',()=>{
 const values=[[],[],[]] as number[][];for(let i=0;i<1500;i++){const r=deriveRatings('climate-range',i*43-20000,i*71-40000);['terrain.elevation','climate.temperature','climate.humidity'].forEach((id,j)=>values[j].push(r.find(r=>r.id===id)!.value));}
 for(const v of values){assert.ok(Math.min(...v)<.1);assert.ok(Math.max(...v)>.9);}
});
