import {test} from 'node:test';
import assert from 'node:assert/strict';
import {feedbackFor} from '../app/event-feedback';
test('feedback includes new distance and death badges, but skips mundane arrivals and consumed encounters',()=>{
 const badge={id:'distance:10',title:'10 from origin'};
 assert.equal(feedbackFor({badges:[]},{badges:[],lastEvent:{kind:'arrival'}}),null);
 assert.equal(feedbackFor({badges:[badge]},{badges:[badge],lastEvent:{kind:'revisit'}}),null);
 const reward=feedbackFor({badges:[]},{badges:[badge],lastEvent:{kind:'arrival'},history:[{id:'visit:1'}]});assert.equal(reward?.badges.length,1);assert.equal(reward?.event,null);
 const death=feedbackFor({badges:[]},{badges:[badge,{id:'death:pit'}],lastEvent:{kind:'death',text:'A fall.'},history:[{id:'visit:2'}]});assert.equal(death?.badges.length,2);assert.equal(death?.event.text,'A fall.');
 assert.equal(feedbackFor({badges:[]},{badges:[],lastEvent:{kind:'interaction'},history:[{id:'visit:3'}]})?.id,'visit:3');
});
