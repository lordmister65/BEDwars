'use strict';
// Server-authoritative voxel navigation for the three training instructors.
const START=[['nr6',-24,10],['nr10',24,10],['nr12',0,-13]];
function create(){return START.map(([id,x,z],i)=>({id,x,z,y:36.05,homeX:x,homeZ:z,heading:i*2.1,turn:1,wait:0,phase:i*1.7}));}
function floorAt(R,x,z,hint){
 const gx=Math.floor(x),gz=Math.floor(z);
 if(!Number.isFinite(x)||!Number.isFinite(z)||gx<=-199||gx>=199||gz<=-199||gz>=199)return null;
 const B=R.B,S=R.shared||require('./public/shared.js');
 const block=(xx,yy,zz)=> yy<0||yy>=S.H||!S.inXZ(xx,zz)?1:B[S.ix(xx,yy,zz)];
 const foot=Math.floor(hint);
 // Same-level walking, climbing a one-block step, or descending one block.
 for(const level of [foot,foot+1,foot-1]){
  if(!block(gx,level-1,gz)||block(gx,level,gz)||block(gx,level+1,gz))continue;
  return level;
 }
 return null;
}
function tick(R,dt){
 const npcs=R.safety.npcs||(R.safety.npcs=create());
 for(const n of npcs){
  if(n.wait>0){n.wait=Math.max(0,n.wait-dt);continue;}
  let targetX=n.homeX+Math.sin(n.phase)*2.2,targetZ=n.homeZ+Math.cos(n.phase)*1.8;
  const desired=Math.atan2(targetX-n.x,targetZ-n.z);
  const directions=[desired,desired+.65,desired-.65,desired+1.25,desired-1.25,desired+Math.PI];
  const step=Math.min(.09,dt*1.05);let moved=false;
  for(const direction of directions){
   const x=n.x+Math.sin(direction)*step,z=n.z+Math.cos(direction)*step;
   const level=floorAt(R,x,z,n.y);
   if(level===null)continue;
   n.x=x;n.z=z;n.y=level;n.heading=direction;moved=true;break;
  }
  if(!moved){n.wait=.25;n.phase+=.55;}else n.phase+=dt*.30;
 }
 return npcs;
}
function snapshot(R){return (R.safety.npcs||[]).map(n=>[n.id,+n.x.toFixed(2),+n.y.toFixed(2),+n.z.toFixed(2),+n.heading.toFixed(3)]);}
module.exports={create,tick,snapshot,floorAt};
