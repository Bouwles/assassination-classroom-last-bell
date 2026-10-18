import test from 'node:test';
import assert from 'node:assert/strict';
import {formatTime,targetSide} from '../src/display.js';
test('clock carries fractional seconds through minute boundaries',()=>{assert.equal(formatTime(239.5),'4:00');assert.equal(formatTime(179.5),'3:00');assert.equal(formatTime(178.2),'2:59');assert.equal(formatTime(0),'0:00');});
test('offscreen direction follows camera rotation',()=>{assert.equal(targetSide({x:0,z:0,yaw:Math.PI/2},{x:0,z:7}),'left');assert.equal(targetSide({x:0,z:0,yaw:0},{x:7,z:0}),'right');assert.equal(targetSide({x:0,z:0,yaw:-Math.PI/2},{x:0,z:7}),'right');});
