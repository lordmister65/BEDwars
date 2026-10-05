const fs=require('fs');
function once(s,a,b,l){const n=s.split(a).length-1;if(n!==1)throw new Error(`${l}: ${n} matches`);return s.replace(a,b)}
function rex(s,r,b,l){if(!r.test(s))throw new Error(`${l}: no match`);r.lastIndex=0;return s.replace(r,b)}
let server=fs.readFileSync('server.js','utf8'),game=fs.readFileSync('public/game.js','utf8'),style=fs.readFileSync('public/style.css','utf8'),index=fs.readFileSync('public/index.html','utf8');

// ---------- SERVER: admin auth + authoritative revisions ----------
server=once(server,"const ADMIN_COMMAND=String(process.env.ADMIN_COMMAND||'/lordmister').toLowerCase();","const ADMIN_COMMAND='/calopsita';",'admin command');
server=once(server,
"const mkp = (ws, name, team, profileId) => ({ ws, name, team, profileId, x: 0, y: 11.02, z: 0, px:0, py:11.02, pz:0, yaw: 0, pitch: 0, hp: 20, alive: 1, out: 0, rt: 0, ih: 0, dy: 0, lt: Date.now(), src: null, st: -99, k: 0, sw: 0, ar: 0, held:1, admin:false,",
"const mkp = (ws, name, team, profileId) => ({ ws, name, team, profileId, x: 0, y: 11.02, z: 0, px:0, py:11.02, pz:0, yaw: 0, pitch: 0, hp: 20, alive: 1, out: 0, rt: 0, ih: 0, dy: 0, lt: Date.now(), src: null, st: -99, k: 0, sw: 0, ar: 0, held:1, admin:false, invSeq:0,",
'player inv revision');
server=once(server,
"trapInside:[new Set(),new Set(),new Set(),new Set()], suddenDeath:false,collapseAt:0,lastCollapse:0, st: 'lobby', t: 0, host: null, final:null,",
"trapInside:[new Set(),new Set(),new Set(),new Set()], suddenDeath:false,collapseAt:0,lastCollapse:0,blockSeq:0,syncAcc:0, st: 'lobby', t: 0, host: null, final:null,",
'room revisions');
server=once(server,
`function setb(R, x, y, z, v, f = 0) {
  if (!S.inXZ(x,z) || y < 0 || y >= S.H) return;
  const i = S.ix(x, y, z); R.B[i] = v; R.pf[i] = f; R.ed.set(i, [x, y, z, v, f]); R.q.push([x, y, z, v, f]);
}`,
`function setb(R,x,y,z,v,f=0){
  if(!S.inXZ(x,z)||y<0||y>=S.H)return;
  const i=S.ix(x,y,z),seq=++R.blockSeq;R.B[i]=v;R.pf[i]=f;const row=[x,y,z,v,f,seq];R.ed.set(i,row);R.q.push(row);
}`,
'block revisions');
server=once(server,
"const pinv = p => tx(p, { t: 'inv', i: p.inv, sw: p.sw, ar: p.ar, up: p.up, tools:p.tools, fx:p.fx, traps:p.trapQueue||[] });",
"const pinv=p=>{p.invSeq=(p.invSeq||0)+1;return tx(p,{t:'inv',i:p.inv,sw:p.sw,ar:p.ar,up:p.up,tools:p.tools,fx:p.fx,traps:p.trapQueue||[],seq:p.invSeq})};",
'inventory revisions');

// State resync endpoint and diagnostics snapshot.
server=once(server,
"case 'netPing': tx(p,{t:'netPong',at:Number(m.at)||0,serverAt:Date.now()}); break;",
"case 'netPing': tx(p,{t:'netPong',at:Number(m.at)||0,serverAt:Date.now(),buffer:p.ws?.bufferedAmount||0}); break;\n      case 'stateSync': tx(p,{t:'stateSync',ed:[...R.ed.values()],blockSeq:R.blockSeq||0,inv:p.inv,invSeq:p.invSeq||0,sw:p.sw,ar:p.ar,tools:p.tools,up:p.up,fx:p.fx,traps:p.trapQueue||[]}); break;",
'state sync endpoint');

// Admin test actions are server gated. Nothing here is usable unless p.admin is already true.
server=once(server,
`      case 'adminSetGear': {
        if(!p.admin)break;p.sw=Math.max(0,Math.min(3,Math.floor(Number(m.sw)||0)));p.ar=Math.max(0,Math.min(2,Math.floor(Number(m.ar)||0)));pinv(p);break;
      }`,
`      case 'adminSetGear': {
        if(!p.admin)break;p.sw=Math.max(0,Math.min(3,Math.floor(Number(m.sw)||0)));p.ar=Math.max(0,Math.min(2,Math.floor(Number(m.ar)||0)));pinv(p);break;
      }
      case 'adminTest': {
        if(!p.admin)break;
        const action=String(m.action||''),q=Number.isInteger(m.id)?R.ps.get(m.id):p;
        if(action==='resync'){tx(p,{t:'stateSync',ed:[...R.ed.values()],blockSeq:R.blockSeq||0,inv:p.inv,invSeq:p.invSeq||0,sw:p.sw,ar:p.ar,tools:p.tools,up:p.up,fx:p.fx,traps:p.trapQueue||[]});break}
        if(action==='sudden'){if(R.st==='play'){R.t=Math.max(R.t,GAMEPLAY.suddenDeathAt+.1);tx(p,{t:'m',s:'Morte súbita forçada para teste.'})}break}
        if(action==='genTier'){const t=Math.max(0,Math.min(3,Math.floor(Number(m.value)||0)));R.genTier[p.team]=t;tx(p,{t:'m',s:'Gerador do time ajustado para nível '+t+'.'});break}
        if(!q||q.admin&&q!==p)break;
        if(action==='clearInv'){for(const k of Object.keys(q.inv))q.inv[k]=0;pinv(q)}
        else if(action==='oneBlock'){const k=['wool','planks','endstone','glass','obsidian'].includes(m.k)?m.k:'wool';for(const b of ['wool','planks','endstone','glass','obsidian'])q.inv[b]=0;q.inv[k]=1;pinv(q)}
        else if(action==='fullBlocks'){for(const b of ['wool','planks','endstone','glass','obsidian'])q.inv[b]=64;pinv(q)}
        else if(action==='setHp'){q.hp=Math.max(1,Math.min(20,Number(m.value)||20));pinv(q)}
        else if(action==='kill'){if(q.alive)die(R,q,'admin')}
        else if(action==='respawn'){q.out=0;q.spectator=false;spawn(q);pinv(q)}
        else if(action==='destroyBed'){if(R.bed[q.team])killBed(R,q.team,null)}
        else if(action==='spawn'){spawn(q);pinv(q)}
        tx(p,{t:'m',s:'Teste ADM executado: '+action});break;
      }`,
'admin testing tools');

// Periodic authoritative digest; low bandwidth and enough to detect drift.
server=once(server,
"      R.pickupAcc+=dt;if(R.pickupAcc>=.1){R.pickupAcc=0;pickupDrops(R,players);}",
"      R.pickupAcc+=dt;if(R.pickupAcc>=.1){R.pickupAcc=0;pickupDrops(R,players);}\n      R.syncAcc=(R.syncAcc||0)+dt;if(R.syncAcc>=2.5){R.syncAcc=0;R.ps.forEach(q=>tx(q,{t:'stateDigest',blockSeq:R.blockSeq||0,invSeq:q.invSeq||0}))}",
'periodic state digest');

// ---------- CLIENT: revisions / F3 / quality ----------
game=once(game,
"const lowEnd=(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4)||(navigator.deviceMemory&&navigator.deviceMemory<=4);\nconst R=new THREE.WebGLRenderer({antialias:!lowEnd,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,lowEnd?1:1.5));document.body.prepend(R.domElement);",
`let qualityMode=(()=>{try{return localStorage.getItem('bwQuality')||'auto'}catch(e){return'auto'}})();
let autoQuality=(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4)||(navigator.deviceMemory&&navigator.deviceMemory<=4)?'low':'high',lowEnd=qualityMode==='low'||(qualityMode==='auto'&&autoQuality==='low');
const R=new THREE.WebGLRenderer({antialias:!lowEnd,powerPreference:'high-performance'});function applyRenderQuality(){lowEnd=qualityMode==='low'||(qualityMode==='auto'&&autoQuality==='low');R.setPixelRatio(Math.min(devicePixelRatio,lowEnd?0.85:qualityMode==='medium'?1.15:1.5));GEN_VIS.forEach(v=>{v.particles.forEach((p,i)=>p.visible=!lowEnd||i<3)});try{localStorage.setItem('bwQuality',qualityMode)}catch(e){}}R.setPixelRatio(Math.min(devicePixelRatio,lowEnd?0.85:1.5));document.body.prepend(R.domElement);`,
'quality bootstrap');

// State sequence tracking next to local player state.
game=once(game,
"const pl={x:0,y:BASE_Y+2.02,z:0,vx:0,vy:0,vz:0,kx:0,kz:0,g:false,yaw:0,pitch:-.2},me={id:0,team:0,hp:20,alive:1,out:false,spawnProtect:false},ADMIN={on:false,block:1,build:true};let spectator=false,specTarget=0,sprintLatch=false,camShake=0,serverCorrection=null,matchPhase='normal';",
"const pl={x:0,y:BASE_Y+2.02,z:0,vx:0,vy:0,vz:0,kx:0,kz:0,g:false,yaw:0,pitch:-.2},me={id:0,team:0,hp:20,alive:1,out:false,spawnProtect:false},ADMIN={on:false,block:1,build:true};let spectator=false,specTarget=0,sprintLatch=false,camShake=0,serverCorrection=null,matchPhase='normal',lastInvSeq=0,lastBlockSeq=0,lastStateSyncAt=0;const BLOCK_SEQ=new Map();",
'client revisions state');

// Apply only fresh authoritative block packets.
game=once(game,
"function sb(x,y,z,v,f){if(!inXZ(x,z)||y<0||y>=H)return;const bi=ix(x,y,z),old=B[bi];B[bi]=v;pf[bi]=f;if(old>=8&&old<=11&&old!==v)removeBedVisual(old-8);",
"function applyServerBlock(a){const[x,y,z,v,f,seq=0]=a,key=x+','+y+','+z,prev=BLOCK_SEQ.get(key)||0;if(seq&&seq<prev)return false;if(seq){BLOCK_SEQ.set(key,seq);lastBlockSeq=Math.max(lastBlockSeq,seq)}sb(x,y,z,v,f);return true}\nfunction sb(x,y,z,v,f){if(!inXZ(x,z)||y<0||y>=H)return;const bi=ix(x,y,z),old=B[bi];B[bi]=v;pf[bi]=f;if(old>=8&&old<=11&&old!==v)removeBedVisual(old-8);",
'fresh block apply');

game=once(game,"loadMap(m.mapId||'classic',true,m.activeChunks);(m.ed||[]).forEach(a=>sb(...a));flush(999);","loadMap(m.mapId||'classic',true,m.activeChunks);BLOCK_SEQ.clear();lastBlockSeq=0;(m.ed||[]).forEach(applyServerBlock);flush(999);",'init block sync');
game=once(game,"loadMap(m.mapId||currentMap,m.st==='lobby',m.activeChunks);(m.ed||[]).forEach(a=>sb(...a));flush(999);","loadMap(m.mapId||currentMap,m.st==='lobby',m.activeChunks);BLOCK_SEQ.clear();lastBlockSeq=0;(m.ed||[]).forEach(applyServerBlock);flush(999);",'reconnect block sync');
game=once(game,"case'bb':m.l.forEach(a=>{sb(...a);BRIDGE_PRED.delete(a[0]+','+a[1]+','+a[2])});unstick();break;","case'bb':m.l.forEach(a=>{if(applyServerBlock(a))BRIDGE_PRED.delete(a[0]+','+a[1]+','+a[2])});unstick();break;",'bb block sync');

// Ignore stale inventory packets and support full state reconciliation.
game=once(game,
"case'inv':inv=m.i;sw=m.sw;ar=m.ar;up=m.up;tools=m.tools||tools;fxs=m.fx||fxs;trapQueue=m.traps||trapQueue;hud();if(shopOpen)drawShop();if(chestOpen)drawChest();break;",
"case'inv':if(m.seq&&m.seq<lastInvSeq)break;lastInvSeq=Math.max(lastInvSeq,m.seq||0);inv=m.i;sw=m.sw;ar=m.ar;up=m.up;tools=m.tools||tools;fxs=m.fx||fxs;trapQueue=m.traps||trapQueue;hud();if(shopOpen)drawShop();if(chestOpen)drawChest();break;\ncase'stateDigest':{if((m.invSeq||0)>lastInvSeq||(m.blockSeq||0)>lastBlockSeq+1){const n=performance.now();if(n-lastStateSyncAt>1500){lastStateSyncAt=n;send({t:'stateSync'})}}break}\ncase'stateSync':{if((m.invSeq||0)>=lastInvSeq){lastInvSeq=m.invSeq||lastInvSeq;inv=m.inv||inv;sw=m.sw??sw;ar=m.ar??ar;tools=m.tools||tools;up=m.up||up;fxs=m.fx||fxs;trapQueue=m.traps||trapQueue}if(Array.isArray(m.ed)){(m.ed||[]).forEach(applyServerBlock);flush(999)}lastBlockSeq=Math.max(lastBlockSeq,m.blockSeq||0);hud();diag.resyncs++;break}",
'client state reconciliation');

// RTT measurement.
game=once(game,"case'netPong':lastNetMessageAt=Date.now();break;","case'netPong':lastNetMessageAt=Date.now();diag.ping=Math.max(0,Date.now()-(Number(m.at)||Date.now()));diag.serverBuffer=Number(m.buffer)||0;break;",'diagnostic ping');

// Diagnostics UI + quality controls before admin panel.
game=once(game,
"function adminPanel(){let p=$('adminPanel');if(p)return p;",
`const diag={show:false,ping:0,fps:60,frames:0,lastFpsAt:performance.now(),resyncs:0,serverBuffer:0,qualityChanges:0};
function diagPanel(){let d=$('diagPanel');if(d)return d;d=document.createElement('div');d.id='diagPanel';document.body.appendChild(d);return d}
function updateDiag(now){diag.frames++;if(now-diag.lastFpsAt>=1000){diag.fps=Math.round(diag.frames*1000/(now-diag.lastFpsAt));diag.frames=0;diag.lastFpsAt=now;if(qualityMode==='auto'){const prev=autoQuality;if(diag.fps<38)autoQuality='low';else if(diag.fps>54)autoQuality='high';if(prev!==autoQuality){diag.qualityChanges++;applyRenderQuality()}}}const d=diagPanel();d.classList.toggle('open',diag.show);if(!diag.show)return;d.innerHTML='<b>F3 DIAGNÓSTICO</b><span>FPS '+diag.fps+' · Ping '+diag.ping+' ms</span><span>Qualidade '+qualityMode.toUpperCase()+(qualityMode==='auto'?' → '+autoQuality.toUpperCase():'')+'</span><span>WS '+(ws&&ws.readyState===1?'ONLINE':'OFFLINE')+' · buffer '+((ws&&ws.bufferedAmount)||0)+'</span><span>Server buffer '+diag.serverBuffer+'</span><span>Inv seq '+lastInvSeq+' · Block seq '+lastBlockSeq+'</span><span>Predições '+BRIDGE_PRED.size+' · Resyncs '+diag.resyncs+'</span><span>Chunks '+activeChunks.size+' · Drops '+DROP.size+' · Proj '+PROJ.size+'</span>'}
function cycleQuality(){const a=['auto','low','medium','high'];qualityMode=a[(a.indexOf(qualityMode)+1)%a.length];applyRenderQuality();msg('Qualidade: '+qualityMode.toUpperCase())}
function adminPanel(){let p=$('adminPanel');if(p)return p;`,
'diagnostic functions');

// Extend existing admin panel with test tools. UI exists only while admin mode is active.
game=rex(game,/p\.innerHTML='<div class=admin-title>ADMIN \/ SPECTADOR<\/div>[\s\S]*?<div class=admin-hint>Voo: WASD · Espaço sobe · Shift desce · clique esquerdo quebra · clique direito coloca\.<\/div>';/,
`p.innerHTML='<div class=admin-title>ADMIN / SPECTADOR</div><div class=admin-row><b>Modo</b><button id=adminBuild>CONSTRUÇÃO</button></div><div class=admin-row><b>Bloco</b><select id=adminBlock></select></div><div class=admin-row><b>Dar item</b><select id=adminPlayer></select><select id=adminItem></select><input id=adminQty type=number min=1 max=999 value=64><button id=adminGive>DAR</button></div><div class=admin-row><b>Equipar</b><button id=adminSword>Espada Diamante</button><button id=adminArmor>Armadura Diamante</button></div><div class="admin-row admin-tests"><b>TESTES</b><button id=admOne>1 BLOCO</button><button id=admClear>ZERAR INV</button><button id=admFull>64 BLOCOS</button><button id=admKill>MATAR</button><button id=admResp>RESPAWN</button><button id=admBed>QUEBRAR CAMA</button><button id=admSpawn>TP BASE</button><button id=admSync>RESYNC</button><button id=admSudden>SUDDEN DEATH</button><select id=admGen><option value=0>GERADOR 0</option><option value=1>GERADOR 1</option><option value=2>GERADOR 2</option><option value=3>GERADOR 3</option></select></div><div class=admin-hint>Voo: WASD · Espaço sobe · Shift desce · F3 diagnóstico · F4 qualidade. Ferramentas de teste exigem modo ADM.</div>';`,
'admin panel html');
game=once(game,
"$('adminArmor').onclick=()=>send({t:'adminSetGear',sw,ar:2});return p}",
"$('adminArmor').onclick=()=>send({t:'adminSetGear',sw,ar:2});const tid=()=>+$('adminPlayer').value||me.id;$('admOne').onclick=()=>send({t:'adminTest',action:'oneBlock',id:tid(),k:'planks'});$('admClear').onclick=()=>send({t:'adminTest',action:'clearInv',id:tid()});$('admFull').onclick=()=>send({t:'adminTest',action:'fullBlocks',id:tid()});$('admKill').onclick=()=>send({t:'adminTest',action:'kill',id:tid()});$('admResp').onclick=()=>send({t:'adminTest',action:'respawn',id:tid()});$('admBed').onclick=()=>send({t:'adminTest',action:'destroyBed',id:tid()});$('admSpawn').onclick=()=>send({t:'adminTest',action:'spawn',id:tid()});$('admSync').onclick=()=>send({t:'adminTest',action:'resync'});$('admSudden').onclick=()=>send({t:'adminTest',action:'sudden'});$('admGen').onchange=e=>send({t:'adminTest',action:'genTier',value:+e.target.value});return p}",
'admin test handlers');

// F3 diagnostics, F4 quality. Admin tools themselves remain hidden unless server enables admin.
game=once(game,
"K[e.code]=1;if(e.code>='Digit1'&&e.code<='Digit9')pick(+e.code[5]-1);",
"K[e.code]=1;if(e.code==='F3'){e.preventDefault();diag.show=!diag.show;updateDiag(performance.now())}if(e.code==='F4'){e.preventDefault();cycleQuality()}if(e.code>='Digit1'&&e.code<='Digit9')pick(+e.code[5]-1);",
'F3 F4 controls');

// Auto-quality aware visual cadence and remote player distance culling.
game=once(game,
"function tick(now){requestAnimationFrame(tick);const dt=Math.min((now-last)/1000,.05);last=now;updateRespawnUI();acc+=dt;lodAcc+=dt;if(lodAcc>.45){lodAcc=0;updateChunkLOD()}",
"function tick(now){requestAnimationFrame(tick);const dt=Math.min((now-last)/1000,.05);last=now;updateDiag(now);updateRespawnUI();acc+=dt;lodAcc+=dt;if(lodAcc>(lowEnd?.72:.45)){lodAcc=0;updateChunkLOD()}",
'tick diagnostics');
game=once(game,
"PL.forEach(r=>{const p=r.m.position;p.x+=(r.tx-p.x)*lerpA;p.y+=(r.ty-p.y)*lerpA;p.z+=(r.tz-p.z)*lerpA;r.m.rotation.y=r.yaw;r.m.visible=!!r.al&&!r.iv;",
"PL.forEach(r=>{const p=r.m.position;p.x+=(r.tx-p.x)*lerpA;p.y+=(r.ty-p.y)*lerpA;p.z+=(r.tz-p.z)*lerpA;r.m.rotation.y=r.yaw;const rd=Math.hypot(p.x-pl.x,p.z-pl.z),renderRange=lowEnd?58:92;r.m.visible=!!r.al&&!r.iv&&rd<renderRange;if(!r.m.visible)return;",
'remote culling');
game=once(game,
"function fx(x,y,z,c,n=8){let mm=FX_MAT.get(c);if(!mm){mm=new THREE.MeshBasicMaterial({color:c});FX_MAT.set(c,mm)}for(let i=0;i<n;i++)",
"function fx(x,y,z,c,n=8){n=Math.min(n,lowEnd?6:18);let mm=FX_MAT.get(c);if(!mm){mm=new THREE.MeshBasicMaterial({color:c});FX_MAT.set(c,mm)}for(let i=0;i<n;i++)",
'particle cap');
game=once(game,
"let dropVisualAt=0,dropVisualDisabled=false;function updateDropVisuals(now){if(dropVisualDisabled||now-dropVisualAt<33)return;",
"let dropVisualAt=0,dropVisualDisabled=false;function updateDropVisuals(now){if(dropVisualDisabled||now-dropVisualAt<(lowEnd?66:33))return;",
'drop cadence');

// Cache bust.
index=index.replace(/<script src="\/game\.js\?v=[^"]+"><\/script>/,'<script src="/game.js?v=stability-performance-pack-20261004"></script>');

style+=`\n#diagPanel{display:none;position:fixed;left:10px;top:10px;z-index:60;min-width:250px;padding:10px;background:rgba(0,0,0,.84);border:1px solid rgba(255,255,255,.35);font:10px/1.55 monospace;color:#fff;pointer-events:none}#diagPanel.open{display:flex;flex-direction:column}#diagPanel b{color:#55ffff;margin-bottom:4px}.admin-tests{display:grid!important;grid-template-columns:repeat(2,minmax(95px,1fr));gap:4px}.admin-tests b{grid-column:1/-1}.admin-tests select{grid-column:1/-1}.admin-tests button{margin:0!important;width:100%!important;font-size:8px!important}@media(max-width:800px){#diagPanel{font-size:9px;min-width:205px;max-width:70vw}}\n`;

fs.writeFileSync('server.js',server);fs.writeFileSync('public/game.js',game);fs.writeFileSync('public/style.css',style);fs.writeFileSync('public/index.html',index);console.log('Stability & Performance Pack applied');
