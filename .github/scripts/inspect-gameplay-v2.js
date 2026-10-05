const fs=require('fs');
for(const file of ['server.js','public/game.js','public/index.html','public/style.css']){
  const s=fs.readFileSync(file,'utf8');
  console.log('\n===== '+file+' =====');
  const pats=file==='server.js'?['function hurt','const hurt','function die','const die','function spawnProjectile','function tickProjectiles','function feed','fallVyMin','case \'mv\'','case \'hit\'','case \'place\'','killBed','CENTRAL_GEN']:
    file==='public/game.js'?['case\'hitok\'','case\'hurt\'','case\'feed\'','case\'projHit\'','function addFeed','function updateGenerators','bowCharging','const diag=','function hud()','function renderScoreboard','function bridgeTarget','function predictPlace','case\'placeResult\'']:
    file==='public/index.html'?['killFeed','bowCharge','diagPanel','hp','bar']:['#killFeed','#bowCharge','#diagPanel','#hp'];
  for(const p of pats){
    const i=s.indexOf(p);console.log('\n--- '+p+' @ '+i+' ---');if(i>=0)console.log(s.slice(Math.max(0,i-900),Math.min(s.length,i+2600)));
  }
}
