import {test} from 'node:test';
import assert from 'node:assert/strict';
import {locationConcealed as hidden} from '../lib/location-reveal';
test('text readiness reveals the cell independently of image completion',()=>{
 assert.equal(hidden(true,true,true,'a:0:0','a:0:0'),true);
 assert.equal(hidden(true,false,true,'a:1:0','a:0:0'),false);
 assert.equal(hidden(true,false,false,'a:1:0','a:1:0'),true);
 assert.equal(hidden(true,false,true,'a:1:0','a:1:0'),false);
 assert.equal(hidden(false,true,false,'',''),false);
});
