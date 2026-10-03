const fs=require('fs');
const p='scripts/apply-match-feedback.js';
let s=fs.readFileSync(p,'utf8');
const lines=s.split('\n');
let changed=false;
for(let i=0;i<lines.length;i++){
  if(lines[i].includes("'end respawn clear'")){
    lines[i]="game=game.replace(\"over=1;started=0;clearReconnect();\",\"over=1;started=0;clearRespawn();clearReconnect();\");";
    changed=true;
  }
}
if(!changed)throw new Error('end-state migration line not found');
fs.writeFileSync(p,lines.join('\n'));
console.log('migration fixed');
