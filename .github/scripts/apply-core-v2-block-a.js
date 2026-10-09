const fs=require('fs');
function once(s,a,b,label){const n=s.split(a).length-1;if(n!==1)throw new Error(`${label}: expected 1 match, got ${n}`);return s.replace(a,b)}
function onceRe(s,re,b,label){const flags=re.flags.includes('g')?re.flags:re.flags+'g',m=s.match(new RegExp(re.source,flags))||[];if(m.length!==1)throw new Error(`${label}: expected 1 match, got ${m.length}`);return s.replace(re,b)}
let server=fs.readFileSync('server.js','utf8');
let game=fs.readFileSync('public/game.js','utf8');
let index=fs.readFileSync('public/index.html','utf8');

server=once(server,
"const GAMEPLAY={spawnProtect:1.25,damageIFrames:.26,suddenDeathAt:30*60,collapseAt:33*60,collapseEvery:5};",
`const GAMEPLAY={spawnProtect:1.25,damageIFrames:.26,suddenDeathAt:30*60,collapseAt:33*60,collapseEvery:5};
const SERVER_TICK_HZ=30,SERVER_TICK_MS=1000/SERVER_TICK_HZ,SERVER_TICK_SEC=1/SERVER_TICK_HZ,SNAPSHOT_HZ=15,SNAPSHOT_SEC=1/SNAPSHOT_HZ;
const MOVEMENT_CONFIG={WALK_SPEED:4.3,SPRINT_SPEED:5.7,SNEAK_SPEED:1.3,SPEED_MULTIPLIER:1.28,SLOW_MULTIPLIER:.55,GROUND_ACCEL:36,AIR_ACCEL:15,POSITION_GRACE:.55,HARD_POSITION_FACTOR:1.65,MAX_UP_SPEED:13.5,MAX_DOWN_SPEED:42,KB_GRACE_MS:500,SOFT_FLAG_SCORE:6,FLAG_COOLDOWN_MS:2500};
const SERVER_METRICS={tickHz:SERVER_TICK_HZ,lastTickMs:0,avgTickMs:0,maxTickMs:0,lastWallMs:SERVER_TICK_MS,overruns:0,ticks:0,snapshots:0,sentPackets:0,sentBytes:0,droppedPackets:0,rooms:0,players:0};
function serverMetricsSnapshot(p){const mem=process.memoryUsage(),mv=p&&p.moveV2?p.moveV2:null;return{tickHz:SERVER_METRICS.tickHz,lastTickMs:+SERVER_METRICS.lastTickMs.toFixed(2),avgTickMs:+SERVER_METRICS.avgTickMs.toFixed(2),maxTickMs:+SERVER_METRICS.maxTickMs.toFixed(2),wallMs:+SERVER_METRICS.lastWallMs.toFixed(2),overruns:SERVER_METRICS.overruns,ticks:SERVER_METRICS.ticks,snapshots:SERVER_METRICS.snapshots,rooms:SERVER_METRICS.rooms,players:SERVER_METRICS.players,sentPackets:SERVER_METRICS.sentPackets,droppedPackets:SERVER_METRICS.droppedPackets,rssMB:+(mem.rss/1048576).toFixed(1),heapMB:+(mem.heapUsed/1048576).toFixed(1),move:mv?{corrections:mv.corrections||0,suspicion:+(mv.suspicion||0).toFixed(1),speed:+(mv.speed||0).toFixed(2),clientError:+(mv.clientError||0).toFixed(2)}:null}};`,
'core constants');

server=once(server,
"if(droppable&&ws.bufferedAmount>=SOFT_SOCKET_BUFFER)return false;\n  try{ws.send(data);return true}catch(err){console.warn('[NET] falha ao enviar pacote',err?.message||err);terminateSocket(ws,'send_error');return false}",
"if(droppable&&ws.bufferedAmount>=SOFT_SOCKET_BUFFER){SERVER_METRICS.droppedPackets++;return false}\n  try{ws.send(data);SERVER_METRICS.sentPackets++;SERVER_METRICS.sentBytes+=Buffer.byteLength(String(data));return true}catch(err){console.warn('[NET] falha ao enviar pacote',err?.message||err);terminateSocket(ws,'send_error');return false}",
'network metrics');

server=once(server,
"projectiles: [], projSeq: 0, snapAcc: 0, pickupAcc: 0, bed:",
"projectiles: [], projSeq: 0, snapAcc: 0, pickupAcc: 0, netSeq:0, bed:",
'room network seq');

server=once(server,
"attackQueue:[],lastAttackSeq:0,legacyAttackSeq:0,attackNetTokens:COMBAT_CONFIG.NETWORK_BUCKET_CAPACITY,attackNetAt:Date.now(),attackUsefulTokens:COMBAT_CONFIG.USEFUL_BUCKET_CAPACITY,attackUsefulAt:Date.now(),combatHistory:[],clickAc:{iats:[],score:0,lastEventTime:0,lastFlagAt:0,lastEvalSize:0,total:0},",
"attackQueue:[],lastAttackSeq:0,legacyAttackSeq:0,attackNetTokens:COMBAT_CONFIG.NETWORK_BUCKET_CAPACITY,attackNetAt:Date.now(),attackUsefulTokens:COMBAT_CONFIG.USEFUL_BUCKET_CAPACITY,attackUsefulAt:Date.now(),combatHistory:[],clickAc:{iats:[],score:0,lastEventTime:0,lastFlagAt:0,lastEvalSize:0,total:0},moveV2:{vx:0,vy:0,vz:0,speed:0,lastSeq:0,lastAt:Date.now(),suspicion:0,corrections:0,lastFlagAt:0,kbUntil:0,kbH:0,kbV:0,clientError:0},",
'movement player state');

server=once(server,
`function consumeAttackBucket(p,kind,rate,capacity,now=Date.now()){
  const tokenKey=kind==='network'?'attackNetTokens':'attackUsefulTokens',timeKey=kind==='network'?'attackNetAt':'attackUsefulAt';
  const prevTime=Number.isFinite(p[timeKey])?p[timeKey]:now,prevTokens=Number.isFinite(p[tokenKey])?p[tokenKey]:capacity;
  p[tokenKey]=Math.min(capacity,prevTokens+Math.max(0,now-prevTime)*rate/1000);p[timeKey]=now;
  if(p[tokenKey]<1)return false;p[tokenKey]-=1;return true;
}`,
`function consumeAttackBucket(p,kind,rate,capacity,now=Date.now()){
  const tokenKey=kind==='network'?'attackNetTokens':'attackUsefulTokens',timeKey=kind==='network'?'attackNetAt':'attackUsefulAt';
  const prevTime=Number.isFinite(p[timeKey])?p[timeKey]:now,prevTokens=Number.isFinite(p[tokenKey])?p[tokenKey]:capacity;
  p[tokenKey]=Math.min(capacity,prevTokens+Math.max(0,now-prevTime)*rate/1000);p[timeKey]=now;
  if(p[tokenKey]<1)return false;p[tokenKey]-=1;return true;
}
function ensureMoveV2(p){return p.moveV2||(p.moveV2={vx:0,vy:0,vz:0,speed:0,lastSeq:0,lastAt:Date.now(),suspicion:0,corrections:0,lastFlagAt:0,kbUntil:0,kbH:0,kbV:0,clientError:0})}
function noteServerKnockback(p,kx,kz,vy){if(!p)return;const s=ensureMoveV2(p),h=Math.hypot(Number(kx)||0,Number(kz)||0);s.kbUntil=Date.now()+MOVEMENT_CONFIG.KB_GRACE_MS;s.kbH=Math.max(s.kbH||0,h);s.kbV=Math.max(s.kbV||0,Math.max(0,Number(vy)||0))}
function sendKnockback(p,kx,kz,vy,mode='generic'){noteServerKnockback(p,kx,kz,vy);return tx(p,{t:'kb',kx,kz,vy,mode})}
function movementSpeedLimit(p,m){let base=m&&m.sn?MOVEMENT_CONFIG.SNEAK_SPEED:(m&&m.sp===0?MOVEMENT_CONFIG.WALK_SPEED:MOVEMENT_CONFIG.SPRINT_SPEED);if(p.fx&&p.fx.speed>0)base*=MOVEMENT_CONFIG.SPEED_MULTIPLIER;if(p.fx&&p.fx.slow>0)base*=MOVEMENT_CONFIG.SLOW_MULTIPLIER;return base}
function inspectMovementPacket(p,m,dt,now,spectating){
  const s=ensureMoveV2(p);if(Number.isInteger(m.seq)){if(m.seq<=s.lastSeq)return{drop:true};s.lastSeq=m.seq}
  if(![m.x,m.y,m.z,m.yaw,m.pitch].every(Number.isFinite))return{ok:false,detail:'nonfinite'};
  if(m.x<S.MIN_X-8||m.x>S.MAX_X+8||m.z<S.MIN_Z-8||m.z>S.MAX_Z+8||m.y>S.H+20||m.y<-30)return{ok:false,detail:'bounds'};
  const dx=m.x-p.x,dy=m.y-p.y,dz=m.z-p.z,h=Math.hypot(dx,dz),obsVx=dx/dt,obsVz=dz/dt,obsVy=dy/dt,speed=Math.hypot(obsVx,obsVz);
  if(p.admin||spectating)return{ok:true,obsVx,obsVz,obsVy,speed};
  const kb=now<=(s.kbUntil||0),base=movementSpeedLimit(p,m),kbBonus=kb?Math.min(18,(s.kbH||0)*1.15):0,envelope=base+kbBonus+1.1,posCap=envelope*dt+MOVEMENT_CONFIG.POSITION_GRACE;
  const upCap=kb?Math.max(MOVEMENT_CONFIG.MAX_UP_SPEED,(s.kbV||0)+4):MOVEMENT_CONFIG.MAX_UP_SPEED,hardH=h>posCap*MOVEMENT_CONFIG.HARD_POSITION_FACTOR,hardV=obsVy>upCap||obsVy<-MOVEMENT_CONFIG.MAX_DOWN_SPEED;
  const accel=Math.hypot(obsVx-(s.vx||0),obsVz-(s.vz||0))/Math.max(.02,dt),accelCap=(p.grounded?MOVEMENT_CONFIG.GROUND_ACCEL:MOVEMENT_CONFIG.AIR_ACCEL)+(kb?90:0),soft=h>posCap||(speed>base+1.4&&accel>accelCap);
  if(soft)s.suspicion=Math.min(20,(s.suspicion||0)+1);else s.suspicion=Math.max(0,(s.suspicion||0)-.35);
  if(soft&&s.suspicion>=MOVEMENT_CONFIG.SOFT_FLAG_SCORE&&now-(s.lastFlagAt||0)>=MOVEMENT_CONFIG.FLAG_COOLDOWN_MS){s.lastFlagAt=now;acFlag(p,'movement','v2 soft speed='+speed.toFixed(2)+' accel='+accel.toFixed(1))}
  if(Number.isFinite(m.vx)&&Number.isFinite(m.vz))s.clientError=Math.hypot(m.vx-obsVx,m.vz-obsVz);
  return{ok:!hardH&&!hardV,detail:hardH?'speed='+speed.toFixed(2):hardV?'vy='+obsVy.toFixed(2):'',obsVx,obsVz,obsVy,speed};
}
function acceptMovementState(p,r,now){const s=ensureMoveV2(p);s.vx=r.obsVx||0;s.vy=r.obsVy||0;s.vz=r.obsVz||0;s.speed=r.speed||0;s.lastAt=now;if(now>(s.kbUntil||0)){s.kbH=0;s.kbV=0}}
function resetMovementV2(p){const s=ensureMoveV2(p);s.vx=s.vy=s.vz=s.speed=0;s.suspicion=0;s.kbUntil=0;s.kbH=s.kbV=0;s.clientError=0;s.lastAt=Date.now()}`,
'movement helpers');

server=once(server,
"tx(q,{t:'kb',kx:outKx,kz:outKz,vy:vertical,mode:melee?'melee':'generic'});sfx(q,'hurt');",
"sendKnockback(q,outKx,outKz,vertical,melee?'melee':'generic');sfx(q,'hurt');",
'hurt knockback envelope');
server=once(server,
"tx(q,{t:'kb',kx:nx*cfg.knock*f,kz:nz*cfg.knock*f,vy:Math.max(5.5,10.5*f)});",
"sendKnockback(q,nx*cfg.knock*f,nz*cfg.knock*f,Math.max(5.5,10.5*f),'tntImpulse');",
'impulse knockback envelope');
server=once(server,
"p.lt = Date.now();resetCombatInput(p); tx(p, { t: 'tp', x: p.x, y: p.y, z: p.z, hard:1 });",
"p.lt = Date.now();resetCombatInput(p);resetMovementV2(p); tx(p, { t: 'tp', x: p.x, y: p.y, z: p.z, hard:1 });",
'spawn movement reset');

server=onceRe(server,/      case 'mv': \{[\s\S]*?        break;\n      \}\n      case 'adminPlace': \{/,
`      case 'mv': {
        const spectating=!!p.spectator&&p.out;if((!p.alive&&!spectating)||!allow(p,'mv',15))break;
        const n=Date.now(),dt=Math.max(.02,Math.min(.5,(n-p.lt)/1000));p.lt=n,check=inspectMovementPacket(p,m,dt,n,spectating);if(check.drop)break;
        if(!check.ok){const ms=ensureMoveV2(p);ms.corrections++;if(!p.admin&&!spectating&&n-(ms.lastFlagAt||0)>=MOVEMENT_CONFIG.FLAG_COOLDOWN_MS){ms.lastFlagAt=n;acFlag(p,'movement','v2 hard '+check.detail)}tx(p,{t:'tp',x:p.x,y:p.y,z:p.z,hard:0,reason:'movement'});break}
        const oldY=p.y,newDy=(m.y-p.y)/dt;p.hspeed=Math.min(24,check.speed||0);p.dy=newDy;p.px=p.x;p.py=p.y;p.pz=p.z;p.x=m.x;p.y=m.y;p.z=m.z;p.yaw=m.yaw;p.pitch=m.pitch;acceptMovementState(p,check,n);recordCombatHistory(p,n);
        if(!spectating&&!p.admin){const fy=Math.floor(p.y-.09),feet=[[0,0],[.28,0],[-.28,0],[0,.28],[0,-.28],[.22,.22],[-.22,.22],[.22,-.22],[-.22,-.22]],below=feet.some(([ox,oz])=>get(R,Math.floor(p.x+ox),fy,Math.floor(p.z+oz)));p.wasGrounded=p.grounded;p.grounded=!!below;if(!p.grounded&&newDy<p.fallVyMin)p.fallVyMin=newDy;if(p.grounded&&!p.wasGrounded){const impact=Math.abs(Math.min(0,p.fallVyMin));if(impact>10.2)hurt(R,p,Math.min(14,(impact-10.2)*.82),0,0,null,false,'fall',0);p.fallVyMin=0}else if(p.grounded&&Math.abs(newDy)<1.5)p.fallVyMin=0}
        break;
      }
      case 'adminPlace': {`,
'movement v2 case');

server=once(server,
"case 'netPing': tx(p,{t:'netPong',at:Number(m.at)||0,serverAt:Date.now(),buffer:p.ws?.bufferedAmount||0,ac:p.ac||null}); break;",
"case 'netPing': tx(p,{t:'netPong',at:Number(m.at)||0,serverAt:Date.now(),buffer:p.ws?.bufferedAmount||0,ac:p.ac||null,metrics:serverMetricsSnapshot(p)}); break;",
'observability ping');

server=once(server,
`setInterval(() => {
  const dt = .05;
  rooms.forEach(R => {`,
`let lastServerTickAt=performance.now();
setInterval(() => {
  const tickStarted=performance.now(),wallMs=Math.max(1,tickStarted-lastServerTickAt);lastServerTickAt=tickStarted;const dt=Math.max(.005,Math.min(.10,wallMs/1000));SERVER_METRICS.lastWallMs=wallMs;
  rooms.forEach(R => {`,
'tick scheduler header');

server=onceRe(server,/    if \(R\.st === 'play'\) \{R\.snapAcc\+=dt;if\(R\.snapAcc>=\.10\)\{R\.snapAcc=0;bc\(R,\{t:'s',[\s\S]*?\}\);\}\}/,
`    if (R.st === 'play') {R.snapAcc+=dt;if(R.snapAcc>=SNAPSHOT_SEC){R.snapAcc%=SNAPSHOT_SEC;SERVER_METRICS.snapshots++;bc(R,{t:'s',seq:++R.netSeq,serverAt:Date.now(),time:+R.t.toFixed(1),bed:R.bed,mapId:R.mapId,modeId:R.modeId,gen:genSnapshot(R),p:[...R.ps.values()].map(p=>[p.id,+p.x.toFixed(2),+p.y.toFixed(2),+p.z.toFixed(2),+p.yaw.toFixed(2),+p.pitch.toFixed(2),Math.ceil(p.hp),p.alive,p.team,p.fx.invis>0?1:0,p.held,p.sw,p.ar,p.disconnected?1:0,p.admin?1:0,p.out?1:0,+Math.max(0,p.rt||0).toFixed(1),p.stats.kills,p.stats.finalKills,p.spawnProtect>0?1:0]),phase:R.suddenDeath?'sudden':'normal',pr:R.projectiles.map(q=>[q.id,q.k,+q.x.toFixed(2),+q.y.toFixed(2),+q.z.toFixed(2),+q.vx.toFixed(2),+q.vy.toFixed(2),+q.vz.toFixed(2)])});}}`,
'network v2 snapshots');

server=once(server,
`  });
}, 50);

const heartbeat`,
`  });
  const tickCost=performance.now()-tickStarted;SERVER_METRICS.ticks++;SERVER_METRICS.lastTickMs=tickCost;SERVER_METRICS.avgTickMs=SERVER_METRICS.avgTickMs?SERVER_METRICS.avgTickMs*.92+tickCost*.08:tickCost;SERVER_METRICS.maxTickMs=Math.max(tickCost,SERVER_METRICS.maxTickMs*.995);if(tickCost>SERVER_TICK_MS)SERVER_METRICS.overruns++;SERVER_METRICS.rooms=rooms.size;let playerCount=0;rooms.forEach(R=>playerCount+=R.ps.size);SERVER_METRICS.players=playerCount;
}, SERVER_TICK_MS);

const heartbeat`,
'tick scheduler footer');

// Client movement telemetry and sequence.
game=once(game,
"let spectator=false,specTarget=0,sprintLatch=false,camShake=0,serverCorrection=null,matchPhase='normal',lastInvSeq=0,lastBlockSeq=0,lastStateSyncAt=0;const BLOCK_SEQ=new Map();",
"let spectator=false,specTarget=0,sprintLatch=false,camShake=0,serverCorrection=null,matchPhase='normal',lastInvSeq=0,lastBlockSeq=0,lastStateSyncAt=0,lastSnapshotSeq=0,moveSeq=0;const BLOCK_SEQ=new Map();",
'client seq state');
game=once(game,
"if(now-ls>50){ls=now;send({t:'mv',x:pl.x,y:pl.y,z:pl.z,yaw:pl.yaw,pitch:pl.pitch})}}",
"if(now-ls>50){ls=now;send({t:'mv',seq:++moveSeq,x:pl.x,y:pl.y,z:pl.z,yaw:pl.yaw,pitch:pl.pitch,vx:pl.vx,vy:pl.vy,vz:pl.vz,g:pl.g?1:0,sp:sprinting?1:0,sn:sneak?1:0})}}",
'client movement packet');

game=once(game,
"const diag={show:false,ping:0,fps:60,frames:0,lastFpsAt:performance.now(),resyncs:0,serverBuffer:0,qualityChanges:0,placePing:0,placeRejected:0,placeAccepted:0,ac:{total:0,last:''}};",
"const diag={show:false,ping:0,fps:60,frames:0,lastFpsAt:performance.now(),resyncs:0,serverBuffer:0,serverTickMs:0,serverTickAvg:0,serverTickMax:0,serverOverruns:0,serverRooms:0,serverPlayers:0,serverRss:0,moveCorrections:0,moveSuspicion:0,snapshotSeq:0,qualityChanges:0,placePing:0,placeRejected:0,placeAccepted:0,ac:{total:0,last:''}};",
'diagnostic metrics state');
game=once(game,
"<span>Server buffer '+diag.serverBuffer+'</span><span>Inv seq '+lastInvSeq+' · Block seq '+lastBlockSeq+'</span>",
"<span>Server buffer '+diag.serverBuffer+'</span><span>Tick '+diag.serverTickMs+' ms · média '+diag.serverTickAvg+' · pico '+diag.serverTickMax+' · overruns '+diag.serverOverruns+'</span><span>Servidor '+diag.serverRooms+' salas · '+diag.serverPlayers+' jogadores · RSS '+diag.serverRss+' MB</span><span>Movement corr '+diag.moveCorrections+' · suspeita '+diag.moveSuspicion+' · Snap '+diag.snapshotSeq+'</span><span>Inv seq '+lastInvSeq+' · Block seq '+lastBlockSeq+'</span>",
'diagnostic panel metrics');

game=once(game,
"case'netPong':{const recv=Date.now(),sent=Number(m.at)||recv,rtt=Math.max(0,recv-sent),serverAt=Number(m.serverAt);lastNetMessageAt=recv;diag.ping=rtt;combatNetRttMs=combatNetRttMs?combatNetRttMs*.8+rtt*.2:rtt;if(Number.isFinite(serverAt)){const off=serverAt-(sent+recv)/2;combatClockOffsetMs=combatClockSynced?combatClockOffsetMs*.8+off*.2:off;combatClockSynced=true}diag.serverBuffer=Number(m.buffer)||0;if(m.ac)diag.ac=m.ac;break}",
"case'netPong':{const recv=Date.now(),sent=Number(m.at)||recv,rtt=Math.max(0,recv-sent),serverAt=Number(m.serverAt);lastNetMessageAt=recv;diag.ping=rtt;combatNetRttMs=combatNetRttMs?combatNetRttMs*.8+rtt*.2:rtt;if(Number.isFinite(serverAt)){const off=serverAt-(sent+recv)/2;combatClockOffsetMs=combatClockSynced?combatClockOffsetMs*.8+off*.2:off;combatClockSynced=true}diag.serverBuffer=Number(m.buffer)||0;if(m.metrics){const sm=m.metrics;diag.serverTickMs=sm.lastTickMs||0;diag.serverTickAvg=sm.avgTickMs||0;diag.serverTickMax=sm.maxTickMs||0;diag.serverOverruns=sm.overruns||0;diag.serverRooms=sm.rooms||0;diag.serverPlayers=sm.players||0;diag.serverRss=sm.rssMB||0;if(sm.move){diag.moveCorrections=sm.move.corrections||0;diag.moveSuspicion=sm.move.suspicion||0}}if(m.ac)diag.ac=m.ac;break}",
'client observability pong');

game=once(game,
"case's':{syncProjectiles(m.pr||[]);",
"case's':{if(Number.isInteger(m.seq)){if(m.seq<=lastSnapshotSeq)break;lastSnapshotSeq=m.seq;diag.snapshotSeq=m.seq}syncProjectiles(m.pr||[]);",
'client snapshot sequence');

index=once(index,"/game.js?v=combat-v3-phase3-20261008","/game.js?v=core-v2-block-a-20261009",'cache bust');

fs.writeFileSync('server.js',server);fs.writeFileSync('public/game.js',game);fs.writeFileSync('public/index.html',index);console.log('Core V2 block A applied');
