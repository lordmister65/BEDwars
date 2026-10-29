'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const S=require('../safety-mode');
function setup(){
 const p={id:7,team:0,x:0,z:0,alive:1,safety:S.newPlayer()};
 const R={gameType:'safety',GEN:[[-24,36,-6]],SPAWN:[[0.5,36,15.5]],safety:S.newRoom()};
 return {p,R};
}
test('NR6: mission, EPI and distance are required',()=>{
 const {p,R}=setup();p.x=-24;p.z=-6;
 assert.equal(S.extract(p,R,15000).ok,false);
 p.safety.mission='nr6';S.equipment(p,'goggles',true);
 assert.equal(S.extract(p,R,15000).ok,false);
 S.equipment(p,'gloves',true);
 assert.equal(S.extract(p,R,15000).ok,true);
 assert.equal(S.extract(p,R,15001).ok,false);
 p.x=200;assert.equal(S.extract(p,R,28000).ok,false);
});
test('NR6: invalid equipment rejected',()=>{
 const {p}=setup();assert.equal(S.equipment(p,'arbitrary',true).ok,false);
 assert.equal(S.equipment(p,'gloves','true').ok,false);
});
test('NR10: ordered steps and proximity',()=>{
 const {p,R}=setup();p.safety.mission='nr10';p.x=24;p.z=-6;
 assert.equal(S.electrical(p,R,'lock').ok,false);
 for(const step of S.STEPS)assert.equal(S.electrical(p,R,step).ok,true);
 assert.equal(R.safety.electrical.completed,true);
 assert.equal(S.electrical(p,R,'isolate').ok,false);
});
test('NR12: guard, stop and reset required',()=>{
 const {p,R}=setup();p.safety.mission='nr12';p.x=0;p.z=-25;
 assert.equal(S.machine(p,R,'start').ok,false);
 assert.equal(S.machine(p,R,'guard').ok,true);
 assert.equal(S.machine(p,R,'stop').ok,true);
 assert.equal(S.machine(p,R,'release').ok,true);
 assert.equal(S.machine(p,R,'reset').ok,true);
 assert.equal(S.machine(p,R,'start').ok,true);
 assert.equal(S.completeCurrent(p,R),false);
 assert.equal(p.safety.completed.nr12,true);
});
test('NPC patrol and mission assignment use server distance',()=>{
 const {p}=setup();const pos=S.npcPosition('nr6',12000);
 assert.equal(S.interact(p,'nr6',12000).ok,false);
 p.x=pos.x;p.z=pos.z;assert.equal(S.interact(p,'nr6',12000).ok,true);
 assert.equal(p.safety.mission,'nr6');
});
