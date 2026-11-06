'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const BW=require('../public/shared.js');
test('somente mapas competitivos são apresentados',()=>{
 assert.deepEqual(Object.keys(BW.MAPS).sort(),['classic','castle','volcano','jungle'].sort());
});
test('mapas competitivos possuem bases, camas e geradores',()=>{
 for(const name of Object.keys(BW.MAPS)){
  const m=BW.gen(name,false);
  assert.ok(m.SPAWN.length>=2,name+' sem bases');
  assert.ok(m.BD.length>=2,name+' sem camas');
  assert.ok(m.GEN.length>=2,name+' sem geradores');
 }
});
