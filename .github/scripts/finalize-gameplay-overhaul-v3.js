const fs=require('fs');
function once(s,a,b,l){const n=s.split(a).length-1;if(n!==1)throw new Error(`${l}: ${n} matches`);return s.replace(a,b)}
let server=fs.readFileSync('server.js','utf8'),game=fs.readFileSync('public/game.js','utf8');

server=once(server,
"R.ps.forEach(q => { if (q.team === t && !q.alive && !q.out) { q.out = 1; tx(q,{t:'eliminated',reason:'Sua cama foi destruída durante o respawn.'}); msg(R, q.name + ' foi eliminado!'); } });",
"R.ps.forEach(q=>{if(q.team===t&&!q.alive&&!q.out){q.out=1;q.spectator=true;tx(q,{t:'eliminated',reason:'Sua cama foi destruída durante o respawn.'});msg(R,q.name+' foi eliminado!')}});",
'spectator during respawn elimination');

// Reconnect carries elimination/spectator state so final-killed players can continue spectating.
server=once(server,
"admin:p.admin?1:0,adminPlayers:[...R.ps.values()]",
"admin:p.admin?1:0,alive:p.alive?1:0,out:p.out?1:0,spectator:p.spectator?1:0,adminPlayers:[...R.ps.values()]",
'reconnect spectator payload');

game=once(game,
"finishReconnect();me.id=m.id;me.team=m.team;roomCode=m.room;currentMode=m.modeId||currentMode;reconnectToken=m.token;saveReconnect();",
"finishReconnect();me.id=m.id;me.team=m.team;roomCode=m.room;currentMode=m.modeId||currentMode;reconnectToken=m.token;me.alive=m.alive??me.alive;me.out=!!m.out;spectator=!!m.spectator;saveReconnect();",
'reconnect spectator client');

// Remote positional footsteps.
game=once(game,
"if(r.action>now){r.limbs.ra.rotation.x=-1.35+Math.sin(now/45)*.18;r.held.rotation.x=-.7}else r.held.rotation.x=.1;if(r.flashUntil&&now>r.flashUntil)",
"if(r.action>now){r.limbs.ra.rotation.x=-1.35+Math.sin(now/45)*.18;r.held.rotation.x=-.7}else r.held.rotation.x=.1;if(moving&&r.al&&now-(r.lastStepSound||0)>(run?280:370)){r.lastStepSound=now;const g=positionalGain(p.x,p.y,p.z,8);if(g>.035)noise(.028,.012*g,700)}if(r.flashUntil&&now>r.flashUntil)",
'remote footsteps');

// Projectile launch sounds become positional for remote shots.
game=once(game,
"case'projSpawn':{const p=m.p;ensureProjectile(p.id,p.k,p.x,p.y,p.z);sfx(p.k==='fireball'||String(p.k).startsWith('tnt')?'fireball':p.k==='arrow'?'arrow':p.k==='pearl'?'pearl':'snowball');break}",
"case'projSpawn':{const p=m.p;ensureProjectile(p.id,p.k,p.x,p.y,p.z);const g=positionalGain(p.x,p.y,p.z,12),k=p.k==='fireball'||String(p.k).startsWith('tnt')?'fireball':p.k==='arrow'?'arrow':p.k==='pearl'?'pearl':'snowball';if(g>.02){if(k==='arrow')tone(440,.055,'triangle',.025*g,-180);else if(k==='fireball'){tone(85,.16,'sawtooth',.06*g,-45);noise(.12,.035*g,500)}else sfx(k)}break}",
'positional projectile launch');

// Follow spectator actually points at the followed player.
game=once(game,
"if(!respawnCamera(dt)){const shake=camShake>0?(Math.random()-.5)*camShake:0;camShake=Math.max(0,camShake-dt*.65);cam.position.set(pl.x+bobX+shake,pl.y+(K.ShiftLeft?1.42:1.62)-bobY+shake*.4,pl.z+shake);cam.rotation.set(pl.pitch+Math.sin(bobPhase*.5)*.003*bobStrength+shake*.06,pl.yaw+shake*.04,0)}",
"if(!respawnCamera(dt)){const shake=camShake>0?(Math.random()-.5)*camShake:0;camShake=Math.max(0,camShake-dt*.65);cam.position.set(pl.x+bobX+shake,pl.y+(K.ShiftLeft?1.42:1.62)-bobY+shake*.4,pl.z+shake);cam.rotation.set(pl.pitch+Math.sin(bobPhase*.5)*.003*bobStrength+shake*.06,pl.yaw+shake*.04,0);if(spectator&&specTarget){const r=PL.get(specTarget);if(r)cam.lookAt(r.m.position.x,r.m.position.y+1,r.m.position.z)}}",
'spectator camera look');

fs.writeFileSync('server.js',server);fs.writeFileSync('public/game.js',game);console.log('Gameplay Overhaul V3 final fixes applied');