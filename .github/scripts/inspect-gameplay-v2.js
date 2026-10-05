const fs=require('fs');
for(const file of ['server.js','public/game.js']){
  const s=fs.readFileSync(file,'utf8');
  console.log('\n===== '+file+' =====');
  const pats=file==='server.js'?['function genSnapshot','const genSnapshot','function fireballBoom','function throwableTntBoom','function bridgeEggTrail','function safePearlPos','function segmentHitsBlock','function projectileImpact','case \'shoot\'','R.g.dia.forEach','R.g.em.t += dt']:
  ['function beginBow','function releaseBow','case\'projSpawn\'','case\'projHit\'','function ensureProjectile','function updateGenerators','let genState','genState='];
  for(const p of pats){const i=s.indexOf(p);console.log('\n--- '+p+' @ '+i+' ---');if(i>=0)console.log(s.slice(Math.max(0,i-700),Math.min(s.length,i+3000)));}
}
