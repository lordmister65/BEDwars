'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const game=fs.readFileSync(path.join(__dirname,'../public/game.js'),'utf8');
const section=(start,end)=>game.slice(game.indexOf(start),game.indexOf(end,game.indexOf(start)));
test('spatial audio connects gain through stereo panner',()=>{
 const f=section('function nrSound(kind','function nrActionFeedback(');
 assert.match(f,/panner=nrAmbientAudio\.createStereoPanner\(\)/);
 assert.match(f,/gain\.connect\(panner\);panner\.connect\(nrAmbientAudio\.destination\)/);
 assert.match(f,/if\(source&&dist>28\)return/);
 assert.match(f,/osc\.onended=.*panner\.disconnect\(\)/);
});
test('background tab skips ambient audio and visual updates',()=>{
 for(const fn of ['function nrSound(kind','function nrAmbientSound(now)','function animateSafetyStations(now)','function animateNrBeacons(now)']){
  const body=game.slice(game.indexOf(fn),game.indexOf(fn)+280);
  assert.match(body,/document\.hidden/,fn);
 }
});
test('industrial effects remain opt-in to safety game type',()=>{
 for(const fn of ['function nrSound(kind','function nrAmbientSound(now)','function animateSafetyStations(now)','function animateNrBeacons(now)']){
  const body=game.slice(game.indexOf(fn),game.indexOf(fn)+280);
  assert.match(body,/safetyGameType!=='safety'/,fn);
 }
});
