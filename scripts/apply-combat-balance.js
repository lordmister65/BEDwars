const fs=require('fs');
const p='server.js';
let s=fs.readFileSync(p,'utf8');
const reps=[
  ["const PORT = process.env.PORT || 3000, DMG = [2, 4, 6, 8], rooms = new Map();","const PORT = process.env.PORT || 3000, DMG = [3, 5, 7, 9], rooms = new Map();"],
  ["if(L<4.5) hurt(R,q,7*(1-L/4.5),dx/(L||1),dz/(L||1),owner,false,'explosion');","if(L<4.5) hurt(R,q,9*(1-L/4.5),dx/(L||1)*1.35,dz/(L||1)*1.35,owner,false,'explosion');"],
  ["tnt:{radius:3.2,damage:7,knock:8,breakR:2.7,color:0xff4b32},","tnt:{radius:3.4,damage:7.5,knock:11,breakR:2.7,color:0xff4b32},"],
  ["tntImpulse:{radius:5.0,damage:1.5,knock:14,breakR:1.2,color:0xddeeff},","tntImpulse:{radius:5.4,damage:1.5,knock:18,breakR:1.2,color:0xddeeff},"],
  ["tntSlow:{radius:4.4,damage:2.5,knock:4.5,breakR:.8,color:0x78bfff},","tntSlow:{radius:4.6,damage:2.5,knock:7,breakR:.8,color:0x78bfff},"],
  ["tntDamage:{radius:4.3,damage:13,knock:6.5,breakR:1.5,color:0xff2448}","tntDamage:{radius:4.5,damage:13,knock:9,breakR:1.5,color:0xff2448}"],
  ["tx(q,{t:'kb',kx:nx*cfg.knock*f,kz:nz*cfg.knock*f,vy:Math.max(4.8,8.5*f)});","tx(q,{t:'kb',kx:nx*cfg.knock*f,kz:nz*cfg.knock*f,vy:Math.max(5.5,10.5*f)});"],
  ["if(pr.k==='arrow'&&target)hurt(R,target,3+4*pr.charge,pr.vx/(Math.hypot(pr.vx,pr.vz)||1),pr.vz/(Math.hypot(pr.vx,pr.vz)||1),owner);","if(pr.k==='arrow'&&target)hurt(R,target,4+5*pr.charge,pr.vx/(Math.hypot(pr.vx,pr.vz)||1)*1.12,pr.vz/(Math.hypot(pr.vx,pr.vz)||1)*1.12,owner);"],
  ["else if(pr.k==='snowball'&&target)hurt(R,target,1,pr.vx/(Math.hypot(pr.vx,pr.vz)||1)*1.15,pr.vz/(Math.hypot(pr.vx,pr.vz)||1)*1.15,owner);","else if(pr.k==='snowball'&&target)hurt(R,target,2.5,pr.vx/(Math.hypot(pr.vx,pr.vz)||1)*1.45,pr.vz/(Math.hypot(pr.vx,pr.vz)||1)*1.45,owner);"],
  ["if (L < 5) hurt(R, e, 9 * (1 - L / 5), dx / (L || 1), dz / (L || 1), q.o, false, 'explosion');","if (L < 5) hurt(R, e, 9 * (1 - L / 5), dx / (L || 1)*1.25, dz / (L || 1)*1.25, q.o, false, 'explosion');"]
];
for(const [a,b] of reps){if(!s.includes(a))throw new Error('Pattern not found: '+a);s=s.replace(a,b)}
fs.writeFileSync(p,s);
console.log('Combat balance applied:',reps.length,'replacements');
