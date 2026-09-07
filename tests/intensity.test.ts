import {test} from 'node:test';
import assert from 'node:assert/strict';
import {distanceIntensity,distanceMultiplier} from '../lib/intensity';
import {deriveRatings} from '../lib/fields';
test('distance escalation is smooth, bounded, subtle nearby and continues into far lands',()=>{
 assert.equal(distanceIntensity(0,0),0);assert.equal(distanceIntensity(32,0),0);
 const values=[100,500,5000,50000,500000,1000000000].map(d=>distanceIntensity(d,0));
 assert.ok(values[0]>.01&&values[0]<.04);assert.ok(values[1]>.09&&values[1]<.15);
 for(let i=1;i<values.length;i++)assert.ok(values[i]>values[i-1]);assert.ok(values.at(-1)!<1);
 assert.equal(distanceIntensity(-300,-400),distanceIntensity(500,0));
 assert.ok(distanceMultiplier(500,0)>1.2&&distanceMultiplier(500,0)<1.3);
});
test('far lands actually increase danger frequency and strangeness without making every cell lethal',()=>{
 let near=0,far=0,nearOdd=0,farOdd=0;
 for(let i=0;i<2000;i++){
  const a=Object.fromEntries(deriveRatings('intensity'+i,20,0).map(r=>[r.id,r.value])),b=Object.fromEntries(deriveRatings('intensity'+i,200000,0).map(r=>[r.id,r.value]));
  near+=a['hazards.trap']>0?1:0;far+=b['hazards.trap']>0?1:0;nearOdd+=a['world.strangeness'];farOdd+=b['world.strangeness'];
 }
 assert.ok(near/2000>.035&&near/2000<.065);assert.ok(far>near*1.8&&far/2000<.16);assert.ok(farOdd>nearOdd*3);
});
