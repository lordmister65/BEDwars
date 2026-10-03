const fs=require('fs');
const p='public/game.js';
let s=fs.readFileSync(p,'utf8');
const legacy="DROP.forEach((o,id)=>{o.m.position.y+=Math.sin(now/250+id)*.0007;o.m.material.rotation=now/1200});";
if(!s.includes(legacy))throw new Error('legacy sprite drop animation not found');
s=s.replace(legacy,"// Drops 3D sao animados exclusivamente por updateDropVisuals(); nao usar material de Sprite aqui.");
fs.writeFileSync(p,s);console.log('removed legacy Sprite drop animation from tick');
