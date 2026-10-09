const fs=require('fs');
function once(s,a,b,label){const n=s.split(a).length-1;if(n!==1)throw new Error(`${label}: expected 1 match, got ${n}`);return s.replace(a,b)}
let server=fs.readFileSync('server.js','utf8');
let game=fs.readFileSync('public/game.js','utf8');
let index=fs.readFileSync('public/index.html','utf8');

server=once(server,
"const modeCfg=R=>MODES[R.modeId]||MODES['2v2'];",
`const modeCfg=R=>MODES[R.modeId]||MODES['2v2'];
const PARTY_MATCH_ROOMS=new Map();
const sanitizePartyCode=v=>String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
function quickMatchRoom(modeId,partyCode=''){
  const mode=MODES[modeId]||MODES['2v2'],party=sanitizePartyCode(partyCode),remembered=party&&PARTY_MATCH_ROOMS.get(party);
  if(remembered){const rr=rooms.get(remembered);if(rr&&rr.st==='lobby'&&rr.modeId===mode.id&&rr.ps.size<mode.maxPlayers)return rr;PARTY_MATCH_ROOMS.delete(party)}
  let best=null;for(const R of rooms.values()){if(R.st!=='lobby'||R.modeId!==mode.id||!String(R.code).startsWith('mm'))continue;if(R.ps.size>=mode.maxPlayers)continue;if(!best||R.ps.size>best.ps.size)best=R}
  if(!best){let code;do{code=('mm'+Math.random().toString(36).slice(2,9)).slice(0,12)}while(rooms.has(code));best=room(code);best.modeId=mode.id}
  if(party)PARTY_MATCH_ROOMS.set(party,best.code);return best;
}`,
'matchmaking helpers');

server=once(server,
"token: crypto.randomBytes(18).toString('hex'), disconnected:false, disconnectedAt:0, reconnectDeadline:0, roomCode:'', spectator:false,spawnProtect:0,hspeed:0,grounded:false,wasGrounded:false,fallVyMin:0,envIh:0,lastCombatAt:0,lastComboHitAt:0,comboTarget:0,comboCount:0,",
"token: crypto.randomBytes(18).toString('hex'), disconnected:false, disconnectedAt:0, reconnectDeadline:0, roomCode:'', partyId:'', spectator:false,spawnProtect:0,hspeed:0,grounded:false,wasGrounded:false,fallVyMin:0,envIh:0,lastCombatAt:0,lastComboHitAt:0,comboTarget:0,comboCount:0,",
'party player state');

server=once(server,
`    if (m.t === 'join' && !p) {
      const code = String(m.room || 'sala').trim().slice(0,12).toLowerCase()||'sala'; R = room(code);`,
`    if (m.t === 'matchmake' && !p) {
      const modeId=MODES[m.modeId]?m.modeId:'2v2',party=sanitizePartyCode(m.party),rr=quickMatchRoom(modeId,party);m.t='join';m.room=rr.code;m.party=party;m.quick=1;
    }
    if (m.t === 'join' && !p) {
      const code = String(m.room || 'sala').trim().slice(0,12).toLowerCase()||'sala'; R = room(code);`,
'matchmake routing');

server=once(server,
`      const counts=[0,0,0,0];R.ps.forEach(q=>counts[q.team]++);
      let team=mc.activeTeams.reduce((best,t)=>counts[t]<counts[best]?t:best,mc.activeTeams[0]);
      if(counts[team]>=mc.teamCap)return tx({ws},{t:'err',s:'Os dois times estão cheios.'});`,
`      const counts=[0,0,0,0];R.ps.forEach(q=>counts[q.team]++);const partyId=sanitizePartyCode(m.party);
      let team=mc.activeTeams.reduce((best,t)=>counts[t]<counts[best]?t:best,mc.activeTeams[0]);
      if(partyId&&!mc.solo){const mate=[...R.ps.values()].find(q=>q.partyId===partyId&&mc.activeTeams.includes(q.team)&&counts[q.team]<mc.teamCap);if(mate)team=mate.team}
      if(counts[team]>=mc.teamCap)return tx({ws},{t:'err',s:'Os dois times estão cheios.'});`,
'party team preference');

server=once(server,
`      p = mkp(ws, safePlayerName(m.name), team, safeProfile); p.id = ++uid;p.roomCode=R.code;ws.playerId=p.id;ensureProfile(safeProfile,p.name);`,
`      p = mkp(ws, safePlayerName(m.name), team, safeProfile); p.id = ++uid;p.roomCode=R.code;p.partyId=partyId||'';ws.playerId=p.id;ensureProfile(safeProfile,p.name);`,
'party assign');

server=once(server,
`      tx(p, { t:'init', id:p.id, team:p.team, token:p.token, room:R.code, mapId:R.mapId, modeId:R.modeId, activeChunks:R.activeChunks, ed:[...R.ed.values()], drops:R.drops, profile:publicProfile(ensureProfile(p.profileId,p.name)), ranking:rankingPayload() }); lobby(R); return;`,
`      tx(p, { t:'init', id:p.id, team:p.team, token:p.token, room:R.code, mapId:R.mapId, modeId:R.modeId, party:p.partyId||'', quick:m.quick?1:0, activeChunks:R.activeChunks, ed:[...R.ed.values()], drops:R.drops, profile:publicProfile(ensureProfile(p.profileId,p.name)), ranking:rankingPayload() }); lobby(R); return;`,
'init quick party');

server=once(server,
`      R=rr;p=found;const downtime=p.disconnectedAt?Date.now()-p.disconnectedAt:0;p.ws=ws;p.disconnected=false;p.disconnectedAt=0;p.reconnectDeadline=0;p.lt=Date.now();ws.playerId=p.id;p.roomCode=R.code;netLog(p,'reconectado',\`downtime=${downtime}ms\`);
      tx(p,{t:'reconnected',id:p.id,team:p.team,token:p.token,room:R.code,mapId:R.mapId,modeId:R.modeId,activeChunks:R.activeChunks,ed:[...R.ed.values()],drops:R.drops,bed:R.bed,st:R.st,inv:p.inv,sw:p.sw,ar:p.ar,tools:p.tools,up:p.up,fx:p.fx,traps:p.trapQueue||[],admin:p.admin?1:0,alive:p.alive?1:0,out:p.out?1:0,spectator:p.spectator?1:0,adminPlayers:[...R.ps.values()].filter(q=>q!==p&&!q.admin).map(q=>[q.id,q.name,q.team]),roster:[...R.ps.values()].map(q=>[q.id,q.name,q.team]),final:R.final});`,
`      R=rr;p=found;const downtime=p.disconnectedAt?Date.now()-p.disconnectedAt:0;p.ws=ws;p.disconnected=false;p.disconnectedAt=0;p.reconnectDeadline=0;p.lt=Date.now();resetMovementV2(p);recordCombatHistory(p,Date.now());ws.playerId=p.id;p.roomCode=R.code;netLog(p,'reconectado',\`downtime=${downtime}ms\`);
      tx(p,{t:'reconnected',id:p.id,team:p.team,token:p.token,room:R.code,mapId:R.mapId,modeId:R.modeId,party:p.partyId||'',activeChunks:R.activeChunks,ed:[...R.ed.values()],drops:R.drops,bed:R.bed,st:R.st,inv:p.inv,invSeq:p.invSeq||0,blockSeq:R.blockSeq||0,sw:p.sw,ar:p.ar,tools:p.tools,up:p.up,fx:p.fx,traps:p.trapQueue||[],admin:p.admin?1:0,alive:p.alive?1:0,out:p.out?1:0,spectator:p.spectator?1:0,x:p.x,y:p.y,z:p.z,yaw:p.yaw,pitch:p.pitch,hp:p.hp,rt:p.rt||0,time:+R.t.toFixed(2),phase:R.suddenDeath?'sudden':'normal',gen:genSnapshot(R),projectiles:R.projectiles.map(q=>[q.id,q.k,+q.x.toFixed(2),+q.y.toFixed(2),+q.z.toFixed(2),+q.vx.toFixed(2),+q.vy.toFixed(2),+q.vz.toFixed(2)]),adminPlayers:[...R.ps.values()].filter(q=>q!==p&&!q.admin).map(q=>[q.id,q.name,q.team]),roster:[...R.ps.values()].map(q=>[q.id,q.name,q.team]),final:R.final});`,
'reconnect v2 payload');

// Client matchmaking + party + reconnect restore.
game=once(game,
`function connectSocket(mode='join'){
  const seq=++netSeq,sock=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host);`,
`function connectSocket(mode='join'){
  const seq=++netSeq,sock=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host);`,
'connect anchor');

game=once(game,
`    if(mode==='reconnect')send({t:'reconnect',room:roomCode,token:reconnectToken});
    else{roomCode=($('rm').value||'sala').slice(0,12).toLowerCase();$('rc').textContent=roomCode;send({t:'join',name:$('nm').value||'Jogador',room:roomCode,profileId:localProfileId})}`,
`    if(mode==='reconnect')send({t:'reconnect',room:roomCode,token:reconnectToken});
    else if(mode==='matchmake'){const modeId=$('quickMode')?.value||'2v2',party=String($('partyCode')?.value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);send({t:'matchmake',name:$('nm').value||'Jogador',modeId,party,profileId:localProfileId})}
    else{roomCode=($('rm').value||'sala').slice(0,12).toLowerCase();$('rc').textContent=roomCode;send({t:'join',name:$('nm').value||'Jogador',room:roomCode,profileId:localProfileId})}`,
'client matchmake open');

game=once(game,
`function finishReconnect(){reconnecting=false;clearTimeout(reconnectTimer);reconnectTimer=null;stopConnectTimeout();reconnectFailCount=0;lastNetMessageAt=Date.now();setReconnectBanner('')}`,
`function quickPlay(){audioInit();$('er').textContent='Procurando partida...';connectSocket('matchmake')}
function createPartyCode(){const code=Math.random().toString(36).slice(2,8).toUpperCase();if($('partyCode')){$('partyCode').value=code;try{localStorage.setItem('bwPartyCode',code)}catch(e){}}msg('Party criada: '+code)}
function finishReconnect(){reconnecting=false;clearTimeout(reconnectTimer);reconnectTimer=null;stopConnectTimeout();reconnectFailCount=0;lastNetMessageAt=Date.now();setReconnectBanner('')}`,
'quick play helpers');

game=once(game,
`case'init':me.id=m.id;me.team=m.team;roomCode=m.room||roomCode;reconnectToken=m.token||reconnectToken;myProfile=m.profile||myProfile;rankingData=m.ranking||rankingData;drawProfile();drawRanking();saveReconnect();loadMap(m.mapId||'classic',true,m.activeChunks);BLOCK_SEQ.clear();lastBlockSeq=0;(m.ed||[]).forEach(applyServerBlock);flush(999);syncDrops(m.drops||[]);pl.yaw=0;break;`,
`case'init':me.id=m.id;me.team=m.team;roomCode=m.room||roomCode;reconnectToken=m.token||reconnectToken;if($('rc'))$('rc').textContent=roomCode;if(m.party&&$('partyCode'))$('partyCode').value=m.party;myProfile=m.profile||myProfile;rankingData=m.ranking||rankingData;drawProfile();drawRanking();saveReconnect();loadMap(m.mapId||'classic',true,m.activeChunks);BLOCK_SEQ.clear();lastBlockSeq=0;(m.ed||[]).forEach(applyServerBlock);flush(999);syncDrops(m.drops||[]);pl.yaw=0;$('er').textContent=m.quick?'Partida encontrada!':'';break;`,
'init matchmaking feedback');

game=once(game,
`case'reconnected':
 finishReconnect();me.id=m.id;me.team=m.team;roomCode=m.room;currentMode=m.modeId||currentMode;reconnectToken=m.token;me.alive=m.alive??me.alive;me.out=!!m.out;spectator=!!m.spectator;saveReconnect();
 INFO={};(m.roster||[]).forEach(([id,n,t])=>INFO[id]={n,t});loadMap(m.mapId||currentMap,m.st==='lobby',m.activeChunks);BLOCK_SEQ.clear();lastBlockSeq=0;(m.ed||[]).forEach(applyServerBlock);flush(999);syncDrops(m.drops||[]);bed=m.bed||bed;
 syncBedVisuals(worldMeta,bed);inv=m.inv||inv;sw=m.sw??sw;ar=m.ar??ar;tools=m.tools||tools;up=m.up||up;fxs=m.fx||fxs;trapQueue=m.traps||trapQueue;started=m.st==='play';over=m.st==='ended';if(m.admin)setAdminMode(true,m.adminPlayers||[]);hud();scr(started?null:'lobby');break;`,
`case'reconnected':
 finishReconnect();me.id=m.id;me.team=m.team;roomCode=m.room;currentMode=m.modeId||currentMode;reconnectToken=m.token;me.alive=m.alive??me.alive;me.out=!!m.out;me.hp=Number.isFinite(m.hp)?m.hp:me.hp;spectator=!!m.spectator;saveReconnect();
 INFO={};(m.roster||[]).forEach(([id,n,t])=>INFO[id]={n,t});loadMap(m.mapId||currentMap,m.st==='lobby',m.activeChunks);BLOCK_SEQ.clear();lastBlockSeq=0;(m.ed||[]).forEach(applyServerBlock);flush(999);syncDrops(m.drops||[]);bed=m.bed||bed;
 if([m.x,m.y,m.z].every(Number.isFinite)){pl.x=m.x;pl.y=m.y;pl.z=m.z;pl.vx=pl.vy=pl.vz=pl.kx=pl.kz=0}if(Number.isFinite(m.yaw))pl.yaw=m.yaw;if(Number.isFinite(m.pitch))pl.pitch=m.pitch;
 syncBedVisuals(worldMeta,bed);inv=m.inv||inv;lastInvSeq=Math.max(lastInvSeq,m.invSeq||0);lastBlockSeq=Math.max(lastBlockSeq,m.blockSeq||0);sw=m.sw??sw;ar=m.ar??ar;tools=m.tools||tools;up=m.up||up;fxs=m.fx||fxs;trapQueue=m.traps||trapQueue;matchTime=Number.isFinite(m.time)?m.time:matchTime;matchPhase=m.phase||matchPhase;if(m.gen)genState=m.gen;syncProjectiles(m.projectiles||[]);started=m.st==='play';over=m.st==='ended';if(started&&!me.alive&&!me.out)setRespawn(false,Number(m.rt)||0,'Reconectado à partida.');if(m.admin)setAdminMode(true,m.adminPlayers||[]);hud();renderScoreboard(true);scr(started?null:'lobby');break;`,
'reconnect v2 client');

index=once(index,
`<p>Código da sala (todos digitam o mesmo)</p><input id="rm" maxlength="12" value="sala1">
<button id="go" style="text-align:center;margin-top:12px">Entrar</button><p id="er"></p></div></div>`,
`<p>Código da sala (todos digitam o mesmo)</p><input id="rm" maxlength="12" value="sala1">
<button id="go" style="text-align:center;margin-top:12px">Entrar na sala</button>
<hr><p><b>PARTIDA RÁPIDA</b></p><select id="quickMode"><option value="2v2">2v2</option><option value="4v4">4v4</option><option value="solo">Solo</option></select><input id="partyCode" maxlength="8" placeholder="Código da Party (opcional)"><div class="meta-actions"><button type="button" onclick="quickPlay()">Jogar agora</button><button type="button" onclick="createPartyCode()">Criar Party</button></div><p id="er"></p></div></div>`,
'matchmaking UI');
index=once(index,'/game.js?v=core-v2-block-b-20261009','/game.js?v=core-v2-block-c-20261009','cache bust block c');

fs.writeFileSync('server.js',server);fs.writeFileSync('public/game.js',game);fs.writeFileSync('public/index.html',index);console.log('Core V2 block C applied');
