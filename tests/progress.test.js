import test from 'node:test';
import assert from 'node:assert/strict';
import {summarize,recordResult,readRecords} from '../src/progress.js';
const attempt=(extra={})=>({status:'won',duration:420,remaining:140,mode:'standard',difficulty:'normal',hits:9,mistakes:1,maxMistakes:5,grade:'A',stats:{shots:20,accurateShots:12,contacts:4,evasions:8,setups:new Set(['counter','trap','crossfire'])},...extra});
test('report uses encounter duration and accurate pellets including interceptions, excluding knife contacts',()=>{
 const r=summarize(attempt());assert.equal(r.seconds,280);assert.equal(r.accuracy,60);assert.equal(r.variety,3);assert.equal(r.evasions,8);assert.equal(r.grade,'A');
 assert.equal(summarize(attempt({stats:{shots:0,contacts:0}})).accuracy,0);
});
test('only successful attempts set best time; records are separate by difficulty',()=>{
 let records=recordResult({},summarize(attempt()));records=recordResult(records,summarize(attempt({status:'lost',remaining:400})));
 assert.equal(records['standard:normal'].bestTime,280);assert.equal(records['standard:normal'].attempts,2);
 records=recordResult(records,summarize(attempt({remaining:200,difficulty:'hard'})));assert.equal(records['standard:hard'].bestTime,220);
 records=recordResult(records,summarize(attempt({remaining:180})));assert.equal(records['standard:normal'].bestTime,240);
});
test('unavailable or corrupt storage does not stop a retry',()=>{assert.deepEqual(readRecords({getItem(){throw Error('blocked');}}),{});assert.deepEqual(readRecords({getItem(){return '{bad';}}),{});});
