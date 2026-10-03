const fs=require('fs');
const p='public/game.js';
let s=fs.readFileSync(p,'utf8');
const old=`function swordModel(level=sw){
 const g=new THREE.Group(),cols=[0xc7c7c7,0x898989,0xd9d9d9,0x57e8ee],b=box(.10,.62,.10,cols[level]||cols[0]),gr=box(.32,.07,.09,0x76513a),h=box(.09,.27,.09,0x5b3c2b);
 b.position.y=.22;gr.position.y=-.08;h.position.y=-.24;g.add(b,gr,h);g.rotation.z=-.35;return g
}`;
const neu=`function swordModel(level=sw){
 const g=new THREE.Group();
 const cfg=[
  {blade:0xb9b0a6,edge:0xe0d7cc,dark:0x77706b,guard:0x6e5a46,grip:0x4b3526,pommel:0x75604c,w:.13,len:.66},
  {blade:0x8d9298,edge:0xc5c9cd,dark:0x5e6268,guard:0x74624c,grip:0x493425,pommel:0x80705d,w:.12,len:.72},
  {blade:0xd6dbe0,edge:0xf7fbff,dark:0x9299a0,guard:0xb59a61,grip:0x4b3425,pommel:0xc5ad73,w:.115,len:.77},
  {blade:0x54e5ec,edge:0xb8fbff,dark:0x239da7,guard:0x2faab3,grip:0x23444a,pommel:0x75f5fb,w:.125,len:.82}
 ][Math.max(0,Math.min(3,level))];
 const add=(w,h,d,c,x,y,z,rx=0,ry=0,rz=0)=>{const m=box(w,h,d,c);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);g.add(m);return m};
 add(cfg.w,cfg.len,.085,cfg.blade,0,.26,0);
 add(.026,cfg.len*.94,.096,cfg.edge,-cfg.w*.46,.255,.002);
 add(.026,cfg.len*.94,.096,cfg.dark,cfg.w*.46,.255,-.002);
 add(cfg.w*.78,.12,.086,cfg.blade,0,.26+cfg.len*.53,0);
 add(cfg.w*.48,.10,.084,cfg.edge,0,.26+cfg.len*.64,0);
 add(cfg.w*.24,.08,.08,cfg.edge,0,.26+cfg.len*.73,0);
 add(.42,.075,.13,cfg.guard,0,-.105,0);
 add(.12,.10,.13,cfg.guard,-.205,-.075,0,0,0,-.18);
 add(.12,.10,.13,cfg.guard,.205,-.075,0,0,0,.18);
 add(.16,.095,.145,cfg.dark,0,-.105,-.005);
 add(.095,.30,.095,cfg.grip,0,-.295,0);
 for(let i=0;i<3;i++)add(.108,.035,.108,i%2?cfg.dark:cfg.guard,0,-.205-i*.085,0);
 add(.14,.085,.13,cfg.pommel,0,-.485,0);
 add(.09,.07,.09,cfg.dark,0,-.555,0);
 if(level===3){add(.055,.50,.105,0xd4ffff,0,.29,.006);add(.17,.035,.145,0x8fffff,0,-.105,.012)}
 g.rotation.z=-.37;g.rotation.x=.06;g.scale.setScalar(1.08);return g
}`;
if(!s.includes(old))throw new Error('swordModel block not found');
s=s.replace(old,neu);
const oldAnim=`hand.rotation.z=-sa*.72-ua*.22+ma+(movingGround?Math.sin(bobPhase*.5)*.025:0);\nhand.rotation.x=sa*.25+ua*.16+Math.abs(ma)*.18+(movingGround?Math.abs(Math.sin(bobPhase))*.025:0);\nheldRoot.rotation.x=-ua*.25;heldRoot.position.z=-.92+ua*.10;hand.position.x=bobX*.35;hand.position.y=-bobY*.5;`;
const newAnim=`hand.rotation.z=-sa*.86-ua*.24+ma+(movingGround?Math.sin(bobPhase*.5)*.025:0);\nhand.rotation.x=sa*.34+ua*.18+Math.abs(ma)*.18+(movingGround?Math.abs(Math.sin(bobPhase))*.025:0);\nhand.rotation.y=sa*.20;\nheldRoot.rotation.x=-ua*.28-sa*.10;heldRoot.position.z=-.90+ua*.10-sa*.045;heldRoot.position.x=sa*.045;hand.position.x=bobX*.35;hand.position.y=-bobY*.5-sa*.025;`;
if(!s.includes(oldAnim))throw new Error('sword animation block not found');
s=s.replace(oldAnim,newAnim);
const oldElse=`else heldRoot.rotation.y=0;`;
const newElse=`else heldRoot.rotation.y=0;if(!swing){hand.rotation.y*=Math.max(0,1-dt*14);heldRoot.position.x*=Math.max(0,1-dt*14)}`;
if(!s.includes(oldElse))throw new Error('held reset not found');
s=s.replace(oldElse,newElse);
fs.writeFileSync(p,s);
console.log('improved sword model applied');
