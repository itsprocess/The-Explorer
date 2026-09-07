import {test} from 'node:test';
import assert from 'node:assert/strict';
import {locationConcealed as hidden} from '../lib/location-reveal';
test('the whole cell stays concealed through movement and stale image completions',()=>{
 assert.equal(hidden(true,true,true,'a:0:0','a:0:0'),true);
 assert.equal(hidden(true,false,true,'a:1:0','a:0:0'),true);
 assert.equal(hidden(true,false,false,'a:1:0','a:1:0'),true);
 assert.equal(hidden(true,false,true,'a:1:0','a:1:0'),false);
 assert.equal(hidden(false,true,false,'',''),false);
});
