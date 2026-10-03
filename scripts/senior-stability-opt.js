const fs=require('fs');
function rep(s,a,b,label){if(!s.includes(a))throw new Error('missing '+label);return s.replace(a,b)}

let server=fs.readFileSync('server.js','utf8');
server=rep(server,
"const bc = (R, o) => {\n  const data = JSON.stringify(o);\n  R.ps.forEach(p => { if (canSend(p.ws)) p.ws.send(data); });\n};",
"const bc = (R, o) => {\n  let data;try{data=JSON.stringify(o)}catch(e){console.warn('Falha ao serializar broadcast',e);return}\n  R.ps.forEach(p=>{const ws=p.ws;if(!canSend(ws))return;try{ws.send(data)}catch(e){p.disconnected=true;p.ws=null}});\n};",'broadcast');
server=rep(server,"  ws.on('message', raw => {\n    if(raw.length>4096){try{ws.close(1009,'mensagem muito grande')}catch(e){}return}\n    let m; try { m = JSON.parse(raw); } catch (e) { return; }",
"  ws.on('message', raw => {\n    try{\n    if(raw.length>4096){try{ws.close(1009,'mensagem muito grande')}catch(e){}return}\n    let m; try { m = JSON.parse(raw); } catch (e) { return; }",'message start');
server=rep(server,"      case 'apple': if (play && allow(p, 'apple', 250) && p.inv.apple > 0 && p.hp < 20) { p.inv.apple--; p.hp = Math.min(20, p.hp + 10); pinv(p); } break;\n    }\n  });",
"      case 'apple': if (play && allow(p, 'apple', 250) && p.inv.apple > 0 && p.hp < 20) { p.inv.apple--; p.hp = Math.min(20, p.hp + 10); pinv(p); } break;\n    }\n    }catch(err){console.error('Erro isolado em mensagem WebSocket',err);try{tx(p||{ws},{t:'err',s:'Ação ignorada por segurança. Tente novamente.'})}catch(e){}}\n  });",'message end');
server=rep(server,"      const code = String(m.room || 'sala').slice(0, 12).toLowerCase(); R = room(code);\n      if (R.st !== 'lobby') return tx({ ws }, { t: 'err', s: 'Partida em andamento nessa sala.' });\n      const mc=modeCfg(R);\n      if (R.ps.size>=mc.maxPlayers)",
"      const code = String(m.room || 'sala').trim().slice(0,12).toLowerCase()||'sala'; R = room(code);\n      if (R.st !== 'lobby') return tx({ ws }, { t: 'err', s: 'Partida em andamento nessa sala.' });\n      for(const [id,q] of R.ps){if(!q.ws||q.ws.readyState!==1)R.ps.delete(id)}\n      if(R.host&&!R.ps.has(R.host))R.host=[...R.ps.keys()][0]||null;\n      const mc=modeCfg(R);\n      if (R.ps.size>=mc.maxPlayers)",'join hardening');
server=server.replace("p = mkp(ws, String(m.name || 'Jogador').slice(0, 14), team);","p = mkp(ws, (String(m.name || 'Jogador').trim()||'Jogador').slice(0,14), team);");
server=server.replace("if(R.snapAcc>=.066){","if(R.snapAcc>=.10){");
fs.writeFileSync('server.js',server);

let game=fs.readFileSync('public/game.js','utf8');
game=game.replace("const cv=document.createElement('canvas'),ctx=cv.getContext('2d'),lines=String(text).split('\\\n');","const cv=document.createElement('canvas'),ctx=cv.getContext('2d'),lines=String(text).split('\\n');");
game=game.replace("setHologram(v,'FERRO / OURO\\\nFe '+Number(r[0]||0).toFixed(1)+'s · Au '+Number(r[1]||0).toFixed(1)+'s','#ffd85a')","setHologram(v,'FERRO / OURO\\nFe '+Math.ceil(Number(r[0]||0))+'s · Au '+Math.ceil(Number(r[1]||0))+'s','#ffd85a')");
game=game.replace("setHologram(v,'DIAMANTE\\\n'+Number(genState.dia[v.index]||0).toFixed(1)+'s','#67f3ff')","setHologram(v,'DIAMANTE\\n'+Math.ceil(Number(genState.dia[v.index]||0))+'s','#67f3ff')");
game=game.replace("setHologram(v,'ESMERALDA\\\n'+Number(genState.em||0).toFixed(1)+'s','#55ff88')","setHologram(v,'ESMERALDA\\n'+Math.ceil(Number(genState.em||0))+'s','#55ff88')");
const gs=game.indexOf('function updateGenerators(now){'),ge=game.indexOf('\nupdateGeneratorIcons(gn);',gs);
if(gs<0||ge<0)throw new Error('generator updater not found');
const newGen=`let genVisualAt=0,genLabelAt=0,genVisualDisabled=false;\nfunction updateGenerators(now){\n if(genVisualDisabled||now-genVisualAt<40)return;genVisualAt=now;const t=now*.001,doLabel=now-genLabelAt>=250;if(doLabel)genLabelAt=now;\n try{GEN_VIS.forEach(v=>{v.core.rotation.y=t*1.25+v.phase;v.core.position.y=.83+Math.sin(t*2+v.phase)*.09;v.particles.forEach((p,i)=>{const q=p.userData,a=t*q.s+q.phase,up=(t*q.s+i*.17)%1.25;p.position.set(Math.cos(a)*q.r,.58+up,Math.sin(a)*q.r);p.material.opacity=.25+.55*(1-up/1.25)});if(!doLabel)return;if(v.type==='base'){const r=genState.base[v.index]||[0,0];setHologram(v,'FERRO / OURO\\nFe '+Math.ceil(Number(r[0]||0))+'s · Au '+Math.ceil(Number(r[1]||0))+'s','#ffd85a')}else if(v.type==='dia'){setHologram(v,'DIAMANTE\\n'+Math.ceil(Number(genState.dia[v.index]||0))+'s','#67f3ff')}else setHologram(v,'ESMERALDA\\n'+Math.ceil(Number(genState.em||0))+'s','#55ff88')})}catch(err){genVisualDisabled=true;console.warn('Geradores visuais desativados para preservar gameplay',err)}\n}`;
game=game.slice(0,gs)+newGen+game.slice(ge);
game=game.replace("function updateDropVisuals(now){const t=now*.001;DROP.forEach(o=>{o.m.rotation.y=t*1.8+o.phase;o.m.rotation.z=Math.sin(t*.9+o.phase)*.08;o.m.position.y=o.baseY+.15+Math.sin(t*2.6+o.phase)*.08})}",
"let dropVisualAt=0,dropVisualDisabled=false;function updateDropVisuals(now){if(dropVisualDisabled||now-dropVisualAt<33)return;dropVisualAt=now;const t=now*.001;try{DROP.forEach(o=>{o.m.rotation.y=t*1.8+o.phase;o.m.rotation.z=Math.sin(t*.9+o.phase)*.08;o.m.position.y=o.baseY+.15+Math.sin(t*2.6+o.phase)*.08})}catch(err){dropVisualDisabled=true;console.warn('Drops visuais desativados para preservar gameplay',err)}}");
game=rep(game,"  ws.onmessage=e=>on(JSON.parse(e.data));",
"  ws.onmessage=e=>{try{const m=JSON.parse(e.data);on(m)}catch(err){console.error('Pacote de rede ignorado sem travar o jogo',err);msg('Sincronização recuperada automaticamente')}};",'client ws handler');
game=rep(game,"hand.visible=started&&me.alive;updateGenerators(now);updateDropVisuals(now);\nflush(lowEnd?1:2);","hand.visible=started&&me.alive;\nflush(lowEnd?1:2);",'old cosmetic hook');
game=rep(game,"const vf=me.alive&&started?vendorTarget():null;tg=me.alive&&started&&!vf?ray():null;sel.visible=!!tg;if(tg)sel.position.set(tg.h[0]+.5,tg.h[1]+.5,tg.h[2]+.5);$('cross').style.filter=vf?'drop-shadow(0 0 4px #fff55c)':'drop-shadow(1px 1px 0 #000)';\nR.render(sc,cam)}",
"const vf=me.alive&&started?vendorTarget():null;tg=me.alive&&started&&!vf?ray():null;sel.visible=!!tg;if(tg)sel.position.set(tg.h[0]+.5,tg.h[1]+.5,tg.h[2]+.5);$('cross').style.filter=vf?'drop-shadow(0 0 4px #fff55c)':'drop-shadow(1px 1px 0 #000)';\ntry{updateGenerators(now);updateDropVisuals(now)}catch(e){}\ntry{R.render(sc,cam)}catch(err){if(!window.__renderErr){window.__renderErr=1;console.error('Render recuperável',err)}}}", 'render hook');
game="window.addEventListener('error',e=>{console.error('Runtime error:',e.error||e.message)});\nwindow.addEventListener('unhandledrejection',e=>console.error('Unhandled promise:',e.reason));\n"+game;
fs.writeFileSync('public/game.js',game);

let html=fs.readFileSync('public/index.html','utf8');
html=html.replace(/<script>\n\/\* Hotfix de runtime:[\s\S]*?<\/script><\/body><\/html>/,"</body></html>");
fs.writeFileSync('public/index.html',html);
console.log('senior stability optimization applied');
