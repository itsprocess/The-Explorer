import {test} from 'node:test';
import assert from 'node:assert/strict';
import {interactionFor,interactionCategories} from '../lib/encounters';
import {prominentFeatures} from '../lib/visibility';

test('interactions remain sparse, favor occupied sites and span categories and repeat modes',()=>{
 let ordinary=0,occupied=0;const categories=new Set(),modes=new Set();
 for(let x=10;x<10010;x++){
  const a=interactionFor('test'+x,20,6,{}),b=interactionFor('test'+x,20,6,{'civilization.settlement':1});
  if(a){ordinary++;categories.add(a.category);modes.add(a.mode);assert.deepEqual(a,interactionFor('test'+x,20,6,{}));}
  if(b)occupied++;
 }
 assert.ok(ordinary>2300&&ordinary<2700);assert.ok(occupied>3500&&occupied<4100);
 assert.equal(categories.size,interactionCategories.length);assert.equal(modes.size,3);
 assert.equal(interactionFor('test',0,0,{'civilization.settlement':1}),null);
});
test('prominent previews show construction and landscape, never small or surprise fields',()=>{
 const ids=['civilization.settlement','civilization.fortress','vegetation.forest','encounters.treasure','hazards.trap','supernatural.portal','supernatural.marvel','encounters.traveler'];
 const visible=prominentFeatures(ids.map(id=>({id,name:id,value:1}))).map(r=>r.id);
 assert.deepEqual(visible,['civilization.fortress','civilization.settlement','vegetation.forest']);
});
