const fs=require('fs');
function once(s,a,b,label){const n=s.split(a).length-1;if(n!==1)throw new Error(`${label}: expected 1 match, got ${n}`);return s.replace(a,b)}
function onceRe(s,re,b,label){const flags=re.flags.includes('g')?re.flags:re.flags+'g',m=s.match(new RegExp(re.source,flags))||[];if(m.length!==1)throw new Error(`${label}: expected 1 match, got ${m.length}`);return s.replace(re,b)}
let server=fs.readFileSync('server.js','utf8');
let game=fs.readFileSync('public/game.js','utf8');
let index=fs.readFileSync('public/index.html','utf8');

server=once(server,
"const MOVEMENT_CONFIG={WALK_SPEED:4.3,SPRINT_SPEED:5.7,SNEAK_SPEED:1.3,SPEED_MULTIPLIER:1.28,SLOW_MULTIPLIER:.55,GROUND_ACCEL:36,AIR_ACCEL:15,POSITION_GRACE:.55,HARD_POSITION_FACTOR:1.65,MAX_UP_SPEED:13.5,MAX_DOWN_SPEED:42,KB_GRACE_MS:500,SOFT_FLAG_SCORE:6,FLAG_COOLDOWN_MS:2500};",
"const MOVEMENT_CONFIG={WALK_SPEED:4.3,SPRINT_SPEED:5.7,SNEAK_SPEED:1.3,SPEED_MULTIPLIER:1.28,SLOW_MULTIPLIER:.55,GROUND_ACCEL:36,AIR_ACCEL:15,POSITION_GRACE:.55,HARD_POSITION_FACTOR:1.65,MAX_UP_SPEED:13.5,MAX_DOWN_SPEED:42,KB_GRACE_MS:500,SOFT_FLAG_SCORE:6,FLAG_COOLDOWN_MS:2500};\nconst BLOCKS_V4={MAX_PENDING_PER_PLAYER:16,RESULT_SEQ_TTL_MS:2500};\nconst PROJECTILE_V2={MAX_LAG_COMP_MS:180,DECAY_MS:220};",
'block projectile config');

server=once(server,
"moveV2:{vx:0,vy:0,vz:0,speed:0,lastSeq:0,lastAt:Date.now(),suspicion:0,corrections:0,lastFlagAt:0,kbUntil:0,kbH:0,kbV:0,clientError:0},",
"moveV2:{vx:0,vy:0,vz:0,speed:0,lastSeq:0,lastAt:Date.now(),suspicion:0,corrections:0,lastFlagAt:0,kbUntil:0,kbH:0,kbV:0,clientError:0},blockV4:{lastOpSeq:0,pending:new Map()},",
'block state');

server=once(server,
"function spawnProjectile(R,p,k,yaw,pitch,speed,charge=1){\n  const d=projectileDir(yaw,pitch), id=++R.projSeq;\n  const pr={id,k,o:p.id,team:p.team,x:p.x,y:p.y+1.55,z:p.z,vx:d.x*speed,vy:d.y*speed,vz:d.z*speed,age:0,charge};\n  R.projectiles.push(pr);bc(R,{t:'projSpawn',p:pr});return pr;\n}",
"function spawnProjectile(R,p,k,yaw,pitch,speed,charge=1,rtt=0){\n  const d=projectileDir(yaw,pitch), id=++R.projSeq,lagCompMs=Math.max(0,Math.min(PROJECTILE_V2.MAX_LAG_COMP_MS,(Number(rtt)||0)*.5));\n  const pr={id,k,o:p.id,team:p.team,x:p.x,y:p.y+1.55,z:p.z,vx:d.x*speed,vy:d.y*speed,vz:d.z*speed,age:0,charge,lagCompMs};\n  R.projectiles.push(pr);bc(R,{t:'projSpawn',p:pr});return pr;\n}",
'projectile spawn lag');

server=once(server,
"function segmentHitPlayer(R,pr,nx,ny,nz){\n  let best=null,bestT=Infinity;\n  const pad=pr.k==='fireball'?.18:pr.k==='snowball'?.11:pr.k==='arrow'?.045:pr.k==='pearl'?.08:pr.k.startsWith('tnt')?.15:.07;\n  for(const q of R.ps.values()){\n    if(!q.alive||q.team===pr.team||q.out||q.admin)continue;\n    const t=segmentAabbT(pr.x,pr.y,pr.z,nx,ny,nz,sweptCombatBounds(q,pad));\n    if(t!=null&&t<bestT){best=q;bestT=t}\n  }\n  pr._hitT=best?bestT:null;\n  return best;\n}",
"function segmentHitPlayer(R,pr,nx,ny,nz){\n  let best=null,bestT=Infinity;\n  const pad=pr.k==='fireball'?.18:pr.k==='snowball'?.11:pr.k==='arrow'?.045:pr.k==='pearl'?.08:pr.k.startsWith('tnt')?.15:.07,remainingComp=Math.max(0,Math.min(PROJECTILE_V2.MAX_LAG_COMP_MS,(pr.lagCompMs||0)-Math.max(0,pr.age*1000-PROJECTILE_V2.DECAY_MS*.25))),targetTime=Date.now()-remainingComp;\n  for(const q of R.ps.values()){\n    if(!q.alive||q.team===pr.team||q.out||q.admin)continue;\n    const state=remainingComp>0?interpolatedCombatState(q,targetTime):null,bounds=state?combatAabbAt(state,pad):sweptCombatBounds(q,pad);\n    const t=segmentAabbT(pr.x,pr.y,pr.z,nx,ny,nz,bounds);\n    if(t!=null&&t<bestT){best=q;bestT=t}\n  }\n  pr._hitT=best?bestT:null;pr._lagCompMs=remainingComp;\n  return best;\n}",
'projectile rewind');

server=once(server,
"const placeResult=(ok,reason='')=>tx(p,{t:'placeResult',ok:ok?1:0,reason,k:item||String(m.k||''),x,y,z,remaining:Number(p.inv[item]||0)});",
"const opSeq=Number.isInteger(m.opSeq)&&m.opSeq>0?m.opSeq:0,bv=p.blockV4||(p.blockV4={lastOpSeq:0,pending:new Map()}),placeResult=(ok,reason='')=>tx(p,{t:'placeResult',ok:ok?1:0,reason,k:item||String(m.k||''),x,y,z,remaining:Number(p.inv[item]||0),opSeq,blockSeq:R.blockSeq||0});if(opSeq&&opSeq<=bv.lastOpSeq){placeResult(false,'stale_op');break}if(opSeq){bv.lastOpSeq=opSeq;bv.pending.set(opSeq,Date.now());while(bv.pending.size>BLOCKS_V4.MAX_PENDING_PER_PLAYER)bv.pending.delete(bv.pending.keys().next().value)}",
'place result sequence');

server=once(server,
"if(kind==='bow'){if(p.inv.bow<1||p.inv.arrow<1)break;p.inv.arrow--;spawnProjectile(R,p,'arrow',m.yaw,m.pitch,22+22*charge,charge);pinv(p)}\n        else if(kind==='fireball'){if(p.inv.fireball<1)break;p.inv.fireball--;spawnProjectile(R,p,'fireball',m.yaw,m.pitch,21,1);pinv(p)}\n        else if(kind==='snowball'){if(p.inv.snowball<1)break;p.inv.snowball--;spawnProjectile(R,p,'snowball',m.yaw,m.pitch,26,1);pinv(p)}\n        else if(TNT_KEYS.has(kind)){if((p.inv[kind]||0)<1)break;p.inv[kind]--;spawnProjectile(R,p,kind,m.yaw,m.pitch,13.5,1);pinv(p)}",
"if(kind==='bow'){if(p.inv.bow<1||p.inv.arrow<1)break;p.inv.arrow--;spawnProjectile(R,p,'arrow',m.yaw,m.pitch,22+22*charge,charge,m.rtt);pinv(p)}\n        else if(kind==='fireball'){if(p.inv.fireball<1)break;p.inv.fireball--;spawnProjectile(R,p,'fireball',m.yaw,m.pitch,21,1,m.rtt);pinv(p)}\n        else if(kind==='snowball'){if(p.inv.snowball<1)break;p.inv.snowball--;spawnProjectile(R,p,'snowball',m.yaw,m.pitch,26,1,m.rtt);pinv(p)}\n        else if(TNT_KEYS.has(kind)){if((p.inv[kind]||0)<1)break;p.inv[kind]--;spawnProjectile(R,p,kind,m.yaw,m.pitch,13.5,1,m.rtt);pinv(p)}",
'shoot rtt');
server=once(server,
"if(k==='pearl'&&p.inv.pearl>0&&Number.isFinite(m.yaw)&&Number.isFinite(m.pitch)){p.inv.pearl--;spawnProjectile(R,p,'pearl',m.yaw,m.pitch,24,1);pinv(p)}",
"if(k==='pearl'&&p.inv.pearl>0&&Number.isFinite(m.yaw)&&Number.isFinite(m.pitch)){p.inv.pearl--;spawnProjectile(R,p,'pearl',m.yaw,m.pitch,24,1,m.rtt);pinv(p)}",
'pearl rtt');
server=once(server,
"else if(k==='bridgeEgg'&&p.inv.bridgeEgg>0&&Number.isFinite(m.yaw)&&Number.isFinite(m.pitch)){p.inv.bridgeEgg--;spawnProjectile(R,p,'bridgeEgg',m.yaw,m.pitch,21,1);pinv(p)}",
"else if(k==='bridgeEgg'&&p.inv.bridgeEgg>0&&Number.isFinite(m.yaw)&&Number.isFinite(m.pitch)){p.inv.bridgeEgg--;spawnProjectile(R,p,'bridgeEgg',m.yaw,m.pitch,21,1,m.rtt);pinv(p)}",
'bridge egg rtt');

// Client Blocks V4 operation IDs and projectile RTT hints.
game=once(game,
"let spectator=false,specTarget=0,sprintLatch=false,camShake=0,serverCorrection=null,matchPhase='normal',lastInvSeq=0,lastBlockSeq=0,lastStateSyncAt=0,lastSnapshotSeq=0,moveSeq=0;const BLOCK_SEQ=new Map();",
"let spectator=false,specTarget=0,sprintLatch=false,camShake=0,serverCorrection=null,matchPhase='normal',lastInvSeq=0,lastBlockSeq=0,lastStateSyncAt=0,lastSnapshotSeq=0,moveSeq=0,blockOpSeq=0;const BLOCK_SEQ=new Map();",
'block op seq state');
game=once(game,
"BRIDGE_PRED.set(key,{x:p.x,y:p.y,z:p.z,k:p.k,at:performance.now(),acked:false,reserved:true,auto:!!p.auto});",
"const opSeq=++blockOpSeq;BRIDGE_PRED.set(key,{x:p.x,y:p.y,z:p.z,k:p.k,at:performance.now(),acked:false,reserved:true,auto:!!p.auto,opSeq});",
'prediction op seq');
game=once(game,
"if(!send({t:'place',k:p.k,x:p.x,y:p.y,z:p.z,auto:p.auto?1:0})){rollbackPrediction(key,true);return false}",
"if(!send({t:'place',k:p.k,x:p.x,y:p.y,z:p.z,auto:p.auto?1:0,opSeq})){rollbackPrediction(key,true);return false}",
'place send op seq');
game=once(game,
"case'placeResult':{const key=m.x+','+m.y+','+m.z,b=BRIDGE_PRED.get(key);if(b)diag.placePing=Math.round(performance.now()-b.at);if(PLACEABLE.has(m.k)&&Number.isFinite(m.remaining))inv[m.k]=Math.max(0,Math.floor(m.remaining));if(m.ok){diag.placeAccepted++;if(b)b.acked=true}else{diag.placeRejected++;if(b)rollbackPrediction(key,false)}hud();break}",
"case'placeResult':{const key=m.x+','+m.y+','+m.z,b=BRIDGE_PRED.get(key);if(b&&m.opSeq&&b.opSeq&&m.opSeq!==b.opSeq)break;if(Number.isFinite(m.blockSeq))lastBlockSeq=Math.max(lastBlockSeq,m.blockSeq||0);if(b)diag.placePing=Math.round(performance.now()-b.at);if(PLACEABLE.has(m.k)&&Number.isFinite(m.remaining))inv[m.k]=Math.max(0,Math.floor(m.remaining));if(m.ok){diag.placeAccepted++;if(b)b.acked=true}else{diag.placeRejected++;if(b)rollbackPrediction(key,false);if(m.reason==='stale_op'||m.reason==='occupied'){const n=performance.now();if(n-lastStateSyncAt>800){lastStateSyncAt=n;send({t:'stateSync'})}}}hud();break}",
'place result reconcile');

game=once(game,
"send({t:'shoot',k:'bow',yaw:pl.yaw,pitch:pl.pitch,charge:ratio})",
"send({t:'shoot',k:'bow',yaw:pl.yaw,pitch:pl.pitch,charge:ratio,rtt:combatNetRttMs})",
'bow rtt');
game=once(game,
"send({t:'shoot',k,yaw:pl.yaw,pitch:pl.pitch})",
"send({t:'shoot',k,yaw:pl.yaw,pitch:pl.pitch,rtt:combatNetRttMs})",
'generic shoot rtt');
game=once(game,
"send({t:'use',k,yaw:pl.yaw,pitch:pl.pitch})",
"send({t:'use',k,yaw:pl.yaw,pitch:pl.pitch,rtt:combatNetRttMs})",
'projectile use rtt');

index=once(index,'/game.js?v=core-v2-block-a-20261009','/game.js?v=core-v2-block-b-20261009','cache bust block b');

fs.writeFileSync('server.js',server);fs.writeFileSync('public/game.js',game);fs.writeFileSync('public/index.html',index);console.log('Core V2 block B applied');
