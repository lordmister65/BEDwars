'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const S=require('../safety-mode');
function setup(){const p={id:7,team:0,x:0,z:0,alive:1,safety:S.newPlayer()};const R={GEN:[[0,0,0]],SPAWN:[[0,0,0]],safety:S.newRoom()};return {p,R};}
test('NR6: extraction blocked without both EPIs',()=>{const {p,R}=setup();assert.equal(S.extract(p,R,15000).ok,false);S.equipment(p,'goggles',true);assert.equal(S.extract(p,R,15000).ok,false);S.equipment(p,'gloves',true);assert.equal(S.extract(p,R,15000).ok,true)});
test('NR6: cooldown and server-side distance',()=>{const {p,R}=setup();S.equipment(p,'goggles',true);S.equipment(p,'gloves',true);assert.equal(S.extract(p,R,15000).iron,3);assert.equal(S.extract(p,R,15001).ok,false);p.x=500;assert.equal(S.extract(p,R,28000).ok,false)});
test('NR6: invalid equipment rejected',()=>{const {p}=setup();assert.equal(S.equipment(p,'arbitrary',true).ok,false);assert.equal(S.equipment(p,'gloves','true').ok,false)});
test('NR10: requires ordered steps and single owner',()=>{const {p,R}=setup();assert.equal(S.electrical(p,R,'lock').ok,false);for(const step of S.STEPS)assert.equal(S.electrical(p,R,step).ok,true);assert.equal(R.safety.electrical.completed,true);assert.equal(S.electrical(p,R,'isolate').ok,false)});
test('NR12: guard and reset required, stop interrupts',()=>{const {p,R}=setup();assert.equal(S.machine(p,R,'start').ok,false);S.machine(p,R,'guard');assert.equal(S.machine(p,R,'start').ok,false);S.machine(p,R,'reset');assert.equal(S.machine(p,R,'start').ok,true);S.machine(p,R,'stop');assert.equal(R.safety.machine.running,false);assert.equal(S.machine(p,R,'start').ok,false)});
