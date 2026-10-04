const fs=require('fs');

function replaceOnce(src,from,to,label){
  const n=src.split(from).length-1;
  if(n!==1)throw new Error(`${label}: expected 1 match, found ${n}`);
  return src.replace(from,to);
}
function replaceRegexOnce(src,re,to,label){
  const m=src.match(re);
  if(!m)throw new Error(`${label}: no match`);
  const probe=src.replace(re,'__MATCH__');
  if((probe.match(/__MATCH__/g)||[]).length!==1)throw new Error(`${label}: ambiguous match`);
  return src.replace(re,to);
}

let server=fs.readFileSync('server.js','utf8');
let game=fs.readFileSync('public/game.js','utf8');
let index=fs.readFileSync('public/index.html','utf8');

server=replaceOnce(server,
`const MAX_SOCKET_BUFFER = 256 * 1024;\nlet uid = 0;`,
`const SOFT_SOCKET_BUFFER = 512 * 1024;\nconst HARD_SOCKET_BUFFER = 2 * 1024 * 1024;\nconst RECONNECT_GRACE_MS = 60000;\nconst HEARTBEAT_INTERVAL_MS = 20000;\nconst HEARTBEAT_TIMEOUT_MS = 70000;\nlet uid = 0;`,
'network constants');

server=replaceOnce(server,
`const wss = new WebSocketServer({ server: srv, perMessageDeflate: false });\nconst canSend = ws => !!ws && ws.readyState === 1 && ws.bufferedAmount < MAX_SOCKET_BUFFER;\nconst tx = (p, o) => { if (canSend(p.ws)) p.ws.send(JSON.stringify(o)); };\nconst bc = (R, o) => {\n  let data;try{data=JSON.stringify(o)}catch(e){console.warn('Falha ao serializar broadcast',e);return}\n  R.ps.forEach(p=>{const ws=p.ws;if(!canSend(ws))return;try{ws.send(data)}catch(e){p.disconnected=true;p.ws=null}});\n};`,
`const wss = new WebSocketServer({ server: srv, perMessageDeflate: false });\nconst netReason = v => String(v||'').slice(0,120);\nfunction netLog(p,event,extra=''){\n  const who=p?\`id=\${p.id||'?'} name=\${p.name||'?'} room=\${p.roomCode||'?'}\`:'socket sem jogador';\n  console.log(\`[NET] \${event} | \${who}\${extra?' | '+extra:''}\`);\n}\nfunction terminateSocket(ws,reason='network_error'){\n  if(!ws)return;ws._terminateReason=reason;\n  try{ws.terminate()}catch(e){try{ws.close(1011,reason.slice(0,120))}catch(_){}}\n}\nconst socketOpen = ws => !!ws && ws.readyState === 1;\nfunction sendSocket(ws,data,{droppable=false}={}){\n  if(!socketOpen(ws))return false;\n  if(ws.bufferedAmount>=HARD_SOCKET_BUFFER){\n    console.warn('[NET] buffer crítico; encerrando socket',ws.bufferedAmount);terminateSocket(ws,'buffer_overflow');return false;\n  }\n  if(droppable&&ws.bufferedAmount>=SOFT_SOCKET_BUFFER)return false;\n  try{ws.send(data);return true}catch(err){console.warn('[NET] falha ao enviar pacote',err?.message||err);terminateSocket(ws,'send_error');return false}\n}\nconst tx = (p,o) => {\n  let data;try{data=JSON.stringify(o)}catch(e){console.warn('Falha ao serializar pacote',e);return false}\n  return sendSocket(p&&p.ws,data);\n};\nconst bc = (R,o) => {\n  let data;try{data=JSON.stringify(o)}catch(e){console.warn('Falha ao serializar broadcast',e);return}\n  const droppable=o&&o.t==='s';\n  R.ps.forEach(p=>sendSocket(p.ws,data,{droppable}));\n};\nfunction markDisconnected(R,p,ws,code=1006,reason=''){\n  if(!R||!p)return;\n  if(p.ws!==ws){netLog(p,'close ignorado de socket antigo',\`code=\${code} reason=\${netReason(reason)}\`);return}\n  p.ws=null;\n  if(R.st==='play'){\n    const first=!p.disconnected;p.disconnected=true;p.disconnectedAt=Date.now();p.reconnectDeadline=Date.now()+RECONNECT_GRACE_MS;\n    netLog(p,'desconectado',\`code=\${code} reason=\${netReason(reason)||ws?._terminateReason||'sem motivo'} grace=\${RECONNECT_GRACE_MS}ms\`);\n    if(first)feed(R,\`\${p.name} desconectou. Aguardando reconexão por 60s...\`,p.team,-1,'disconnect');\n    return;\n  }\n  netLog(p,'saiu do lobby',\`code=\${code} reason=\${netReason(reason)}\`);\n  R.ps.delete(p.id);if(R.host===p.id)R.host=[...R.ps.keys()][0]||null;\n  if(!R.ps.size){rooms.delete(R.code);return}\n  if(R.st==='lobby')lobby(R);\n}`,
'socket send layer');

server=replaceOnce(server,
`token: crypto.randomBytes(18).toString('hex'), disconnected:false, reconnectDeadline:0,`,
`token: crypto.randomBytes(18).toString('hex'), disconnected:false, disconnectedAt:0, reconnectDeadline:0, roomCode:'',`,
'player network state');

server=replaceOnce(server,
`wss.on('connection', ws => {\n  let R, p;\n  ws.isAlive = true;\n  ws.on('pong', () => { ws.isAlive = true; });`,
`wss.on('connection', ws => {\n  let R, p;\n  ws.connectedAt=Date.now();ws.lastPongAt=Date.now();\n  ws.on('pong', () => { ws.lastPongAt=Date.now(); });\n  ws.on('error',err=>{netLog(p,'erro de socket',netReason(err&&err.message));if(ws.readyState!==3)terminateSocket(ws,'socket_error')});`,
'connection heartbeat state');

server=replaceOnce(server,
`      R=rr;p=found;p.ws=ws;p.disconnected=false;p.reconnectDeadline=0;p.lt=Date.now();`,
`      R=rr;p=found;const downtime=p.disconnectedAt?Date.now()-p.disconnectedAt:0;p.ws=ws;p.disconnected=false;p.disconnectedAt=0;p.reconnectDeadline=0;p.lt=Date.now();ws.playerId=p.id;p.roomCode=R.code;netLog(p,'reconectado',\`downtime=\${downtime}ms\`);`,
'reconnect attach');

server=replaceOnce(server,
`      p = mkp(ws, (String(m.name || 'Jogador').trim()||'Jogador').slice(0,14), team); p.id = ++uid;\n      p.roomShop=R.SHOP[p.team];p.roomSpawn=R.SPAWN?.[p.team];R.ps.set(p.id, p); if (!R.host) R.host = p.id; spawnLobby(p,R.ps.size-1);`,
`      p = mkp(ws, (String(m.name || 'Jogador').trim()||'Jogador').slice(0,14), team); p.id = ++uid;p.roomCode=R.code;ws.playerId=p.id;\n      p.roomShop=R.SHOP[p.team];p.roomSpawn=R.SPAWN?.[p.team];R.ps.set(p.id, p); if (!R.host) R.host = p.id; spawnLobby(p,R.ps.size-1);netLog(p,'conectado ao lobby');`,
'join attach');

server=replaceOnce(server,
`    switch (m.t) {\n      case 'team': {`,
`    switch (m.t) {\n      case 'netPing': tx(p,{t:'netPong',at:Number(m.at)||0,serverAt:Date.now()}); break;\n      case 'team': {`,
'app ping');

server=replaceRegexOnce(server,
/  ws\.on\('close', \(\) => \{[\s\S]*?\n  \}\);\n\}\);\n\nsetInterval\(\(\) => \{/,
`  ws.on('close',(code,reasonBuf)=>{\n    if(!p)return;\n    const reason=reasonBuf&&reasonBuf.length?reasonBuf.toString():ws._terminateReason||'';\n    markDisconnected(R,p,ws,code,reason);\n  });\n});\n\nsetInterval(() => {`,
'central close handler');

server=replaceOnce(server,
`        if(p.disconnected&&p.reconnectDeadline&&Date.now()>=p.reconnectDeadline){\n          p.disconnected=false;p.reconnectDeadline=0;`,
`        if(p.disconnected&&p.reconnectDeadline&&Date.now()>=p.reconnectDeadline){\n          netLog(p,'prazo de reconexão expirou',\`offline=\${Date.now()-(p.disconnectedAt||Date.now())}ms\`);\n          p.disconnected=false;p.disconnectedAt=0;p.reconnectDeadline=0;`,
'reconnect expiry log');

server=replaceOnce(server,
`  rooms.forEach(R => {\n    R.t += dt;`,
`  rooms.forEach(R => {\n    try{\n    R.t += dt;`,
'room tick try start');

server=replaceRegexOnce(server,
/(    if \(R\.st === 'play'\) \{R\.snapAcc\+=dt;if\(R\.snapAcc>=\.10\)\{R\.snapAcc=0;bc\(R,\{t:'s',[\s\S]*?\}\);\}\}\n)  \}\);\n\}, 50\);/,
`$1    }catch(err){console.error(\`[TICK] erro isolado na sala \${R.code}\`,err);}\n  });\n}, 50);`,
'room tick try end');

server=replaceRegexOnce(server,
/const heartbeat = setInterval\(\(\) => \{[\s\S]*?\n\}, 30000\);/,
`const heartbeat = setInterval(() => {\n  const now=Date.now();\n  wss.clients.forEach(ws => {\n    if(ws.readyState!==1)return;\n    const idle=now-(ws.lastPongAt||ws.connectedAt||now);\n    if(idle>HEARTBEAT_TIMEOUT_MS){\n      console.warn(\`[NET] heartbeat timeout | player=\${ws.playerId||'?'} idle=\${idle}ms\`);\n      return terminateSocket(ws,'heartbeat_timeout');\n    }\n    try{ws.ping()}catch(err){console.warn('[NET] falha no ping',err?.message||err);terminateSocket(ws,'ping_error')}\n  });\n}, HEARTBEAT_INTERVAL_MS);`,
'heartbeat hardening');

// Client: replace the entire network/reconnect block.
game=replaceRegexOnce(game,
/\/\/ rede e reconexão\n[\s\S]*?\n\$\('go'\)\.onclick=/,
`// rede e reconexão\nconst NET_RECONNECT_MS=60000,NET_CONNECT_TIMEOUT_MS=8000,NET_STALE_MS=25000,NET_PING_MS=10000;\nlet netSeq=0,netAttemptAt=0,socketOpenedAt=0,lastNetMessageAt=Date.now(),connectTimeout=null,reconnectFailCount=0;\nconst send=o=>{\n const sock=ws;if(!sock||sock.readyState!==1)return false;\n try{sock.send(JSON.stringify(o));return true}catch(err){console.warn('[NET] falha ao enviar',err);try{sock.close(4003,'send error')}catch(e){}return false}\n};\nfunction saveReconnect(){if(roomCode&&reconnectToken)sessionStorage.setItem('bwReconnect',JSON.stringify({room:roomCode,token:reconnectToken,name:$('nm').value||'Jogador'}))}\nfunction clearReconnect(){sessionStorage.removeItem('bwReconnect');reconnectToken='';roomCode=''}\nfunction setReconnectBanner(text){$('reconnectBanner').textContent=text;$('reconnectBanner').style.display=text?'block':'none'}\nfunction stopConnectTimeout(){if(connectTimeout){clearTimeout(connectTimeout);connectTimeout=null}}\nfunction connectSocket(mode='join'){\n  const seq=++netSeq,sock=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host);\n  ws=sock;netAttemptAt=Date.now();socketOpenedAt=0;stopConnectTimeout();\n  connectTimeout=setTimeout(()=>{if(ws===sock&&sock.readyState===0){console.warn('[NET] timeout em CONNECTING');try{sock.close(4000,'connect timeout')}catch(e){}}},NET_CONNECT_TIMEOUT_MS);\n  sock.onopen=()=>{\n    if(ws!==sock||seq!==netSeq)return;stopConnectTimeout();socketOpenedAt=Date.now();lastNetMessageAt=Date.now();\n    if(mode==='reconnect')send({t:'reconnect',room:roomCode,token:reconnectToken});\n    else{roomCode=($('rm').value||'sala').slice(0,12).toLowerCase();$('rc').textContent=roomCode;send({t:'join',name:$('nm').value||'Jogador',room:roomCode})}\n  };\n  sock.onmessage=e=>{if(ws!==sock||seq!==netSeq)return;lastNetMessageAt=Date.now();try{const m=JSON.parse(e.data);on(m)}catch(err){console.error('Pacote de rede ignorado sem travar o jogo',err);msg('Sincronização recuperada automaticamente')}};\n  sock.onerror=e=>{if(ws!==sock)return;console.warn('[NET] WebSocket error',e);if(!reconnecting)$('er').textContent='Não consegui conectar ao servidor.'};\n  sock.onclose=e=>{\n    stopConnectTimeout();\n    if(ws!==sock||seq!==netSeq){console.debug('[NET] fechamento de socket antigo ignorado',e.code,e.reason);return}\n    console.warn('[NET] socket fechado',e.code,e.reason||'sem motivo');\n    if(over)return;\n    if(started&&reconnectToken){startReconnect()}else if(!reconnecting)msg('Conexão perdida');\n  };\n}\nfunction finishReconnect(){reconnecting=false;clearTimeout(reconnectTimer);reconnectTimer=null;stopConnectTimeout();reconnectFailCount=0;lastNetMessageAt=Date.now();setReconnectBanner('')}\nfunction startReconnect(){\n  if(!reconnectToken)return;\n  if(!reconnecting){reconnecting=true;reconnectUntil=Date.now()+NET_RECONNECT_MS;reconnectFailCount=0}\n  try{document.exitPointerLock()}catch(e){}\n  const attempt=()=>{\n    if(!reconnecting)return;\n    const now=Date.now(),left=Math.max(0,Math.ceil((reconnectUntil-now)/1000));\n    if(!left){reconnecting=false;setReconnectBanner('Reconexão não foi possível.');clearReconnect();setTimeout(()=>location.reload(),1200);return}\n    setReconnectBanner('Conexão perdida. Tentando reconectar... ('+left+'s)');\n    const state=ws?ws.readyState:3,age=now-netAttemptAt;\n    if(state===0&&age>NET_CONNECT_TIMEOUT_MS){try{ws.close(4000,'connect timeout')}catch(e){}}\n    else if(state===1&&socketOpenedAt&&now-socketOpenedAt>NET_CONNECT_TIMEOUT_MS&&now-lastNetMessageAt>NET_CONNECT_TIMEOUT_MS){try{ws.close(4001,'reconnect handshake timeout')}catch(e){}}\n    else if(state===2&&age>3000)connectSocket('reconnect');\n    else if(!ws||state===3)connectSocket('reconnect');\n    reconnectTimer=setTimeout(attempt,1500);\n  };\n  clearTimeout(reconnectTimer);attempt();\n}\nsetInterval(()=>{\n  if(over||!ws)return;\n  const now=Date.now();\n  if(ws.readyState===1){\n    send({t:'netPing',at:now});\n    if(started&&now-lastNetMessageAt>NET_STALE_MS){console.warn('[NET] conexão sem pacotes por '+(now-lastNetMessageAt)+'ms');try{ws.close(4002,'stale connection')}catch(e){}}\n  }else if(started&&reconnectToken&&!reconnecting)startReconnect();\n},NET_PING_MS);\ndocument.addEventListener('visibilitychange',()=>{if(!document.hidden&&started&&reconnectToken&&(!ws||ws.readyState!==1))startReconnect()});\naddEventListener('online',()=>{if(started&&reconnectToken&&(!ws||ws.readyState!==1))startReconnect()});\n$('go').onclick=`,
'client network block');

game=replaceOnce(game,
`case'reconnected':\n reconnecting=false;clearTimeout(reconnectTimer);setReconnectBanner('');me.id=m.id;`,
`case'reconnected':\n finishReconnect();me.id=m.id;`,
'reconnected finish');

game=replaceOnce(game,
`case'reconnectFail':reconnecting=false;clearTimeout(reconnectTimer);setReconnectBanner('Sessão expirada.');clearReconnect();setTimeout(()=>location.reload(),1000);break;`,
`case'reconnectFail':{reconnectFailCount++;if(reconnecting&&Date.now()<reconnectUntil&&reconnectFailCount<3){setReconnectBanner('Servidor ainda não confirmou a sessão. Nova tentativa...');try{if(ws&&ws.readyState<=1)ws.close(4004,'retry reconnect')}catch(e){}break}reconnecting=false;clearTimeout(reconnectTimer);setReconnectBanner('Sessão expirada.');clearReconnect();setTimeout(()=>location.reload(),1000);break}`,
'reconnect failure tolerance');

game=replaceOnce(game,
`case'lobby':{`,
`case'netPong':lastNetMessageAt=Date.now();break;\ncase'lobby':{`,
'client pong handler');

index=index.replace(/<script src="\/game\.js[^\"]*"><\/script>/,'<script src="/game.js?v=net-hardening-20261003"></script>');

fs.writeFileSync('server.js',server);
fs.writeFileSync('public/game.js',game);
fs.writeFileSync('public/index.html',index);
console.log('Network hardening applied');
