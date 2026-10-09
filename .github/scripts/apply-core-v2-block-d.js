const fs=require('fs');
function once(s,a,b,label){const n=s.split(a).length-1;if(n!==1)throw new Error(`${label}: expected 1 match, got ${n}`);return s.replace(a,b)}
let game=fs.readFileSync('public/game.js','utf8');
let index=fs.readFileSync('public/index.html','utf8');
let style=fs.readFileSync('public/style.css','utf8');

game=once(game,
`function combatBurst(m){fx(m.x,m.y,m.z,m.cr?0xffe45c:0xff4545,m.cr?20:12);if(m.cr)fx(m.x,m.y+.08,m.z,0xffffff,8);floatingDamage(m.x,m.y+.45,m.z,m.d,m.cr);if(m.target===me.id)screenHurt(!!m.cr)};
function hud(){`,
`function combatBurst(m){fx(m.x,m.y,m.z,m.cr?0xffe45c:0xff4545,m.cr?20:12);if(m.cr)fx(m.x,m.y+.08,m.z,0xffffff,8);floatingDamage(m.x,m.y+.45,m.z,m.d,m.cr);if(m.target===me.id)screenHurt(!!m.cr)};
function formatMatchClock(sec){const s=Math.max(0,Math.floor(Number(sec)||0)),m=Math.floor(s/60);return m+':'+String(s%60).padStart(2,'0')}
function showEventBanner(text,kind='info',ms=1600){const el=$('eventBanner');if(!el)return;el.textContent=text;el.className='show '+kind;clearTimeout(el._hide);el._hide=setTimeout(()=>{el.className=''},ms)}
function renderMatchStatus(){const el=$('matchStatus');if(!el)return;if(!started||over){el.classList.remove('show');return}const ownBed=bed[me.team]?'🛏':'☠',phase=matchPhase==='sudden'?'MORTE SÚBITA':'BED WARS';el.innerHTML='<b>'+phase+'</b><span>'+formatMatchClock(matchTime)+'</span><span>'+String(currentMode||'').toUpperCase()+'</span><span>'+ownBed+'</span>';el.classList.add('show')}
function hud(){`,
'game feel helpers');

game=once(game,
`if(started)renderScoreboard(true);else html('tm',TN.map((n,t)=>{const o=Object.values(INFO).find(i=>i.t===t),alive=o&&bed[t];return \`<div class="team-row"><span class="team-dot" style="background:#${hex(TC[t])}"></span><span>${n}</span><span>${o?o.n:'vazio'}</span><span class="team-bed ${alive?'alive':'dead'}">${!o?'—':bed[t]?'CAMA':'SEM CAMA'}</span></div>\`}).join(''));
}`,
`if(started)renderScoreboard(true);else html('tm',TN.map((n,t)=>{const o=Object.values(INFO).find(i=>i.t===t),alive=o&&bed[t];return \`<div class="team-row"><span class="team-dot" style="background:#${hex(TC[t])}"></span><span>${n}</span><span>${o?o.n:'vazio'}</span><span class="team-bed ${alive?'alive':'dead'}">${!o?'—':bed[t]?'CAMA':'SEM CAMA'}</span></div>\`}).join(''));renderMatchStatus();
}`,
'hud status update');

game=once(game,
`case'start':HELD_CACHE.clear();setTimeout(preloadHeld,50);currentMode=m.modeId||currentMode;loadMap(m.mapId||currentMap,false,m.activeChunks);started=1;bed=m.bed;syncBedVisuals(worldMeta,bed);matchTime=0;matchPlayers.clear();myMatchStats={kills:0,finalKills:0};clearRespawn();scr(touchMode||document.pointerLockElement?null:'ov');hud();renderScoreboard(true);break;`,
`case'start':HELD_CACHE.clear();setTimeout(preloadHeld,50);currentMode=m.modeId||currentMode;loadMap(m.mapId||currentMap,false,m.activeChunks);started=1;bed=m.bed;syncBedVisuals(worldMeta,bed);matchTime=0;matchPlayers.clear();myMatchStats={kills:0,finalKills:0};clearRespawn();showEventBanner('⚔ PARTIDA INICIADA','start',1800);scr(touchMode||document.pointerLockElement?null:'ov');hud();renderScoreboard(true);break;`,
'start banner');

game=once(game,
`case'bed':bed=m.bed;removeBedVisual(m.team);sfx('bed');bedBurst(m.team,m.pos);hud();renderScoreboard(true);break;`,
`case'bed':bed=m.bed;removeBedVisual(m.team);sfx('bed');bedBurst(m.team,m.pos);camShake=Math.max(camShake,m.team===me.team?.18:.08);showEventBanner(m.team===me.team?'☠ SUA CAMA FOI DESTRUÍDA!':'🛏 CAMA '+(TN[m.team]||'')+' DESTRUÍDA',m.team===me.team?'danger':'bed',m.team===me.team?2600:1800);hud();renderScoreboard(true);break;`,
'bed feel');

game=once(game,
`case'deathState':setRespawn(!!m.final,m.respawn||0,m.final?'Você foi eliminado.':'');if(m.final){spectator=true;me.out=true;setTimeout(()=>msg('Modo espectador · Q/E troca alvo · F voo livre'),250)}break;`,
`case'deathState':showEventBanner(m.final?'☠ ELIMINADO':'VOCÊ MORREU',m.final?'danger':'death',m.final?2200:1300);setRespawn(!!m.final,m.respawn||0,m.final?'Você foi eliminado.':'');if(m.final){spectator=true;me.out=true;setTimeout(()=>msg('Modo espectador · Q/E troca alvo · F voo livre'),250)}break;`,
'death feel');

game=once(game,
`case'respawn':spectator=false;me.out=false;lastRespawnBeep=-1;clearRespawn();break;`,
`case'respawn':spectator=false;me.out=false;lastRespawnBeep=-1;clearRespawn();showEventBanner('✓ DE VOLTA À PARTIDA','respawn',1100);break;`,
'respawn feel');

game=once(game,
`case'phase':matchPhase=m.phase||'normal';if(matchPhase==='sudden')msg('☠ MORTE SÚBITA — todas as camas foram destruídas!');break;`,
`case'phase':matchPhase=m.phase||'normal';if(matchPhase==='sudden'){showEventBanner('☠ MORTE SÚBITA','danger',3200);msg('☠ MORTE SÚBITA — todas as camas foram destruídas!')}renderMatchStatus();break;`,
'phase feel');

game=once(game,
`function tick(now){requestAnimationFrame(tick);const dt=Math.min((now-last)/1000,.05);last=now;updateDiag(now);updateRespawnUI();`,
`function tick(now){requestAnimationFrame(tick);const dt=Math.min((now-last)/1000,.05);last=now;updateDiag(now);updateRespawnUI();if(started&&!over&&((now|0)%500<17))renderMatchStatus();`,
'tick status');

index=once(index,
`<div id="cross"></div><div id="msg"></div><div id="comboHud"></div><div id="killFeed"></div><div id="bar"></div><div id="bowTrajectory"></div>`,
`<div id="cross"></div><div id="msg"></div><div id="comboHud"></div><div id="eventBanner"></div><div id="matchStatus"></div><div id="killFeed"></div><div id="bar"></div><div id="bowTrajectory"></div>`,
'feel hud markup');
index=once(index,'/style.css?v=mobile-experience-v2-20261005','/style.css?v=game-feel-v2-20261009','style cache bust');
index=once(index,'/game.js?v=core-v2-block-c-20261009','/game.js?v=core-v2-block-d-20261009','game cache bust');

style += `\n/* Game Feel V2 + HUD V2 */\n#matchStatus{position:fixed;z-index:12;top:10px;left:50%;transform:translateX(-50%) translateY(-8px);display:flex;align-items:center;gap:10px;padding:6px 10px;background:rgba(0,0,0,.56);border:1px solid rgba(255,255,255,.22);box-shadow:0 2px 0 rgba(0,0,0,.45);font-size:9px;text-shadow:1px 1px #000;opacity:0;pointer-events:none;transition:opacity .18s,transform .18s}#matchStatus.show{opacity:1;transform:translateX(-50%) translateY(0)}#matchStatus b{color:#fff55c}#matchStatus span{color:#fff}\n#eventBanner{position:fixed;z-index:19;left:50%;top:18%;transform:translate(-50%,-12px) scale(.96);min-width:220px;max-width:78vw;padding:11px 16px;text-align:center;font-size:13px;font-weight:700;color:#fff;background:rgba(0,0,0,.74);border:2px solid #ddd;text-shadow:2px 2px #000;box-shadow:0 4px 0 rgba(0,0,0,.45);opacity:0;pointer-events:none;transition:opacity .15s,transform .15s}#eventBanner.show{opacity:1;transform:translate(-50%,0) scale(1)}#eventBanner.start{border-color:#55ff55}#eventBanner.bed{border-color:#55ffff}#eventBanner.death{border-color:#ff9b55}#eventBanner.danger{border-color:#ff4040;color:#fff0f0;animation:eventPulse .45s ease-in-out 2}#eventBanner.respawn{border-color:#55ff55;color:#dffff0}@keyframes eventPulse{50%{transform:translate(-50%,0) scale(1.045)}}\n@media (pointer:coarse),(max-width:800px){#matchStatus{top:6px;gap:6px;padding:4px 7px;font-size:7px;max-width:56vw;white-space:nowrap}#eventBanner{top:12%;min-width:180px;font-size:10px;padding:8px 10px}}\n`;

fs.writeFileSync('public/game.js',game);fs.writeFileSync('public/index.html',index);fs.writeFileSync('public/style.css',style);console.log('Core V2 block D applied');
