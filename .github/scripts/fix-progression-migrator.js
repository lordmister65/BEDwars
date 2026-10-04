const fs=require('fs');
const p='.github/scripts/apply-progression-pack.js';
let s=fs.readFileSync(p,'utf8');
// Escape client-side template expressions that belong to game.js replacement text.
const marker=s.indexOf('// ---------------- client state + compass ----------------');
if(marker<0)throw new Error('client marker not found');
const head=s.slice(0,marker),tail=s.slice(marker);
// Within the client migration section every ${...} is intended for the generated browser code,
// not for this Node migration script. Escape interpolation so it survives verbatim.
const fixedTail=tail.replace(/(?<!\\)\$\{/g,'\\${');
s=head+fixedTail;
fs.writeFileSync(p,s);
console.log('progression migrator client templates escaped');
