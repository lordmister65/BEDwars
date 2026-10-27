'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const NAV=require('../safety-navigation.js'),S=require('../public/shared.js');
function scene(){
 const B=new Uint8Array(S.W*S.H*S.D);
 const set=(x,y,z,v=28)=>{B[S.ix(x,y,z)]=v};
 for(let x=-15;x<=15;x++)for(let z=-15;z<=15;z++)set(x,35,z);
 return {B,shared:S,safety:{npcs:NAV.create()} ,gameType:'safety'};
}
test('NPC route stays supported by voxel floor',()=>{
 const R=scene();
 for(let i=0;i<80;i++)NAV.tick(R,.05);
 for(const n of R.safety.npcs)assert.ok(NAV.floorAt(R,n.x,n.z,n.y)!==null);
});
test('NPC climbs one block but avoids two-high obstacles',()=>{
 const R=scene();
 R.B[S.ix(1,36,0)]=28;
 assert.equal(NAV.floorAt(R,1,0,36.05),37);
 R.B[S.ix(1,37,0)]=28;
 assert.equal(NAV.floorAt(R,1,0,36.05),null);
});
