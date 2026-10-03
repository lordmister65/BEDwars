const fs=require('fs');
const p='public/game.js';
let s=fs.readFileSync(p,'utf8');
const old=`function heldView(slot,mining=false){
 const k=mining?miningTool:slotKey(slot);let v={x:.69,y:-.43,z:-1.03,rx:.02,ry:0,rz:0,scale:1};
 if(slot===0&&!mining)v={x:.78,y:-.53,z:-1.08,rx:.02,ry:-.08,rz:.02,scale:.93};
 else if(mining)v={x:.76,y:-.50,z:-1.05,rx:.03,ry:-.06,rz:0,scale:.96};
 else if(['wool','planks','endstone','glass','obsidian'].includes(k))v={x:.72,y:-.47,z:-1.00,rx:.02,ry:-.08,rz:0,scale:.88};
 else if(k==='bow')v={x:.76,y:-.44,z:-1.08,rx:.03,ry:-.12,rz:.04,scale:.96};
 else if(['speedPotion','jumpPotion','invisPotion','apple'].includes(k))v={x:.73,y:-.49,z:-.95,rx:.04,ry:-.06,rz:.02,scale:.92};
 else if(['fireball','snowball','pearl'].includes(k))v={x:.73,y:-.46,z:-.96,rx:0,ry:-.05,rz:0,scale:.92};
 else if(String(k).startsWith('tnt'))v={x:.72,y:-.47,z:-1.00,rx:.02,ry:-.08,rz:0,scale:.88};
 return v
}`;
const neu=`function heldView(slot,mining=false){
 const k=mining?miningTool:slotKey(slot);let v={x:.69,y:-.33,z:-1.03,rx:.02,ry:0,rz:0,scale:1};
 if(slot===0&&!mining)v={x:.78,y:-.42,z:-1.08,rx:.02,ry:-.08,rz:.02,scale:.93};
 else if(mining)v={x:.76,y:-.39,z:-1.05,rx:.03,ry:-.06,rz:0,scale:.96};
 else if(['wool','planks','endstone','glass','obsidian'].includes(k))v={x:.72,y:-.37,z:-1.00,rx:.02,ry:-.08,rz:0,scale:.88};
 else if(k==='bow')v={x:.76,y:-.34,z:-1.08,rx:.03,ry:-.12,rz:.04,scale:.96};
 else if(['speedPotion','jumpPotion','invisPotion','apple'].includes(k))v={x:.73,y:-.38,z:-.95,rx:.04,ry:-.06,rz:.02,scale:.92};
 else if(['fireball','snowball','pearl'].includes(k))v={x:.73,y:-.35,z:-.96,rx:0,ry:-.05,rz:0,scale:.92};
 else if(String(k).startsWith('tnt'))v={x:.72,y:-.37,z:-1.00,rx:.02,ry:-.08,rz:0,scale:.88};
 return v
}`;
if(!s.includes(old))throw new Error('heldView block not found');
s=s.replace(old,neu);
s=s.replace("const heldRoot=new THREE.Group();const heldViewBase={x:.68,y:-.42,z:-1.02,rx:0,ry:0,rz:0};","const heldRoot=new THREE.Group();const heldViewBase={x:.68,y:-.32,z:-1.02,rx:0,ry:0,rz:0};");
fs.writeFileSync(p,s);
console.log('raised held items');
