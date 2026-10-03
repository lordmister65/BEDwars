const fs = require('fs');
const path = 'server.js';
let s = fs.readFileSync(path, 'utf8');

function replaceOnce(from, to, label) {
  const count = s.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`);
  s = s.replace(from, to);
}

replaceOnce(
  "const modeCfg=R=>MODES[R.modeId]||MODES['2v2'];",
  `// Economia inspirada no ritmo do BedWars: base mais lenta no início e geradores\n// centrais acelerando por tiers ao longo da partida.\nconst GEN_BALANCE={\n  iron:2.0,\n  gold:6.0,\n  diamond:[30,24,12],\n  diamondMarks:[360,1080],\n  emerald:{\n    solo:[65,50,35],\n    '2v2':[65,50,35],\n    '4v4':[56,40,28]\n  },\n  emeraldMarks:{\n    solo:[720,1440],\n    '2v2':[720,1440],\n    '4v4':[360,1080]\n  },\n  diamondCaps:[4,6,8],\n  emeraldCaps:[4,6,8]\n};\nconst generatorTier=(time,marks)=>time>=marks[1]?2:time>=marks[0]?1:0;\nfunction generatorRates(R){\n  const diaTier=generatorTier(R.t,GEN_BALANCE.diamondMarks);\n  const emMarks=GEN_BALANCE.emeraldMarks[R.modeId]||GEN_BALANCE.emeraldMarks['2v2'];\n  const emTier=generatorTier(R.t,emMarks);\n  const emRates=GEN_BALANCE.emerald[R.modeId]||GEN_BALANCE.emerald['2v2'];\n  return {\n    iron:GEN_BALANCE.iron,gold:GEN_BALANCE.gold,\n    dia:GEN_BALANCE.diamond[diaTier],em:emRates[emTier],\n    diaCap:GEN_BALANCE.diamondCaps[diaTier],emCap:GEN_BALANCE.emeraldCaps[emTier],\n    diaTier,emTier\n  };\n}\nconst modeCfg=R=>MODES[R.modeId]||MODES['2v2'];`,
  'generator balance constants'
);

replaceOnce(
  `function genSnapshot(R){\n  const players=[...R.ps.values()];\n  const base=R.g.base.map((g,i)=>{const o=players.find(q=>q.team===i),fm=1+.5*(o?o.up.forge:0);return [+(Math.max(0,1.2/fm-g.iron)).toFixed(2),+(Math.max(0,5/fm-g.gold)).toFixed(2)]});\n  const dia=R.g.dia.map(g=>+(Math.max(0,12-g.t)).toFixed(2));\n  return {base,dia,em:+Math.max(0,22-R.g.em.t).toFixed(2)};\n}`,
  `function genSnapshot(R){\n  const players=[...R.ps.values()],rates=generatorRates(R);\n  const base=R.g.base.map((g,i)=>{\n    const o=players.find(q=>q.team===i),fm=1+.5*(o?o.up.forge:0);\n    return [+(Math.max(0,rates.iron/fm-g.iron)).toFixed(2),+(Math.max(0,rates.gold/fm-g.gold)).toFixed(2)];\n  });\n  const dia=R.g.dia.map(g=>+(Math.max(0,rates.dia-g.t)).toFixed(2));\n  return {base,dia,em:+Math.max(0,rates.em-R.g.em.t).toFixed(2),diaTier:rates.diaTier+1,emTier:rates.emTier+1};\n}`,
  'generator snapshot'
);

replaceOnce(
  `      R.g.base.forEach((g, i) => {\n        if(!modeCfg(R).activeTeams.includes(i))return;\n        const bp=R.GEN[i]||[S.IS[i][0]+.5,S.BASE_Y+2,S.IS[i][1]+.5],gx=bp[0],gy=bp[1],gz=bp[2];\n        const o = players.find(q => q.team === i), fm = 1 + .5 * (o ? o.up.forge : 0);\n        g.iron += dt; g.gold += dt;\n        if (g.iron > 1.2 / fm) { g.iron = 0; addDrop(R,'iron',1,gx,gy+.2,gz,48); }\n        if (g.gold > 5 / fm) { g.gold = 0; addDrop(R,'gold',1,gx+1,gy+.2,gz,12); }\n      });\n      R.g.dia.forEach((g, i) => {\n        g.t += dt;\n        if (g.t <= 12) return;\n        g.t = 0;\n        const [gx,gy,gz]=R.DIGEN[i];addDrop(R,'dia',1,gx,gy,gz,4);\n      });\n      R.g.em.t += dt;\n      if (R.g.em.t > 22) {\n        R.g.em.t = 0;\n        const [gx,gy,gz]=R.EMGEN;\n        addDrop(R,'em',1,gx,gy,gz,2);\n      }`,
  `      const rates=generatorRates(R);\n      R.g.base.forEach((g, i) => {\n        if(!modeCfg(R).activeTeams.includes(i))return;\n        const bp=R.GEN[i]||[S.IS[i][0]+.5,S.BASE_Y+2,S.IS[i][1]+.5],gx=bp[0],gy=bp[1],gz=bp[2];\n        const o = players.find(q => q.team === i), fm = 1 + .5 * (o ? o.up.forge : 0);\n        const ironEvery=rates.iron/fm,goldEvery=rates.gold/fm;\n        g.iron += dt; g.gold += dt;\n        if (g.iron >= ironEvery) { g.iron -= ironEvery; addDrop(R,'iron',1,gx,gy+.2,gz,48); }\n        if (g.gold >= goldEvery) { g.gold -= goldEvery; addDrop(R,'gold',1,gx+1,gy+.2,gz,12); }\n      });\n      R.g.dia.forEach((g, i) => {\n        g.t += dt;\n        if (g.t < rates.dia) return;\n        g.t -= rates.dia;\n        const [gx,gy,gz]=R.DIGEN[i];addDrop(R,'dia',1,gx,gy,gz,rates.diaCap);\n      });\n      R.g.em.t += dt;\n      if (R.g.em.t >= rates.em) {\n        R.g.em.t -= rates.em;\n        const [gx,gy,gz]=R.EMGEN;\n        addDrop(R,'em',1,gx,gy,gz,rates.emCap);\n      }`,
  'generator loop'
);

fs.writeFileSync(path, s);
console.log('Generator balance applied.');
