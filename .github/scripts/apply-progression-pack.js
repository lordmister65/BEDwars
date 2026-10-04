const fs=require('fs');

function once(src,from,to,label){
  const n=src.split(from).length-1;
  if(n!==1)throw new Error(`${label}: expected 1, found ${n}`);
  return src.replace(from,to);
}
function rex(src,re,to,label){
  const m=src.match(re);if(!m)throw new Error(`${label}: no match`);return src.replace(re,to);
}

let shared=fs.readFileSync('public/shared.js','utf8');
let server=fs.readFileSync('server.js','utf8');
let game=fs.readFileSync('public/game.js','utf8');
let index=fs.readFileSync('public/index.html','utf8');
let style=fs.readFileSync('public/style.css','utf8');

// ---------------- shared shop ----------------
shared=once(shared,
`['Afiação','dia',4,'up','sharp',1,'Melhorias','⚔️'],['Proteção I','dia',3,'up','prot',1,'Melhorias','🛡️'],['Proteção II','dia',6,'up','prot',2,'Melhorias','🛡️'],['Forja I (+50%)','dia',2,'up','forge',1,'Melhorias','⚙️'],['Forja II (+100%)','dia',4,'up','forge',2,'Melhorias','⚙️'],['Regeneração na Base','dia',4,'up','regen',1,'Melhorias','❤'],['Armadilha','dia',2,'up','trap',1,'Melhorias','⚠️']`,
`['Bússola Rastreadora','em',2,'inv','compass',1,'Utilidades','🧭'],['Afiação','dia',4,'up','sharp',1,'Melhorias','⚔️'],['Proteção I','dia',3,'up','prot',1,'Melhorias','🛡️'],['Proteção II','dia',6,'up','prot',2,'Melhorias','🛡️'],['Proteção III','dia',8,'up','prot',3,'Melhorias','🛡️'],['Proteção IV','dia',12,'up','prot',4,'Melhorias','🛡️'],['Forja I (+50%)','dia',2,'up','forge',1,'Melhorias','⚙️'],['Forja II (+100%)','dia',4,'up','forge',2,'Melhorias','⚙️'],['Forja III (+150%)','dia',6,'up','forge',3,'Melhorias','⚙️'],['Forja IV (+200%)','dia',8,'up','forge',4,'Melhorias','⚙️'],['Pressa I','dia',2,'up','haste',1,'Melhorias','⛏️'],['Pressa II','dia',4,'up','haste',2,'Melhorias','⛏️'],['Regeneração na Base','dia',4,'up','regen',1,'Melhorias','❤'],['Armadilha de Fadiga','dia',1,'up','trapMiner',1,'Melhorias','⛏️'],['Armadilha de Lentidão','dia',1,'up','trapSlow',1,'Melhorias','🐌'],['Contra-Ataque','dia',2,'up','trapCounter',1,'Melhorias','⚡']`,
'shop upgrades');

// ---------------- server persistence/profile ----------------
server=once(server,
`const ADMIN_BLOCK_MIN=1,ADMIN_BLOCK_MAX=34;`,
`const ADMIN_BLOCK_MIN=1,ADMIN_BLOCK_MAX=34;\nconst STATS_FILE=process.env.BW_STATS_FILE||path.join(__dirname,'data','stats.json');\nconst CHEST_KEYS=['iron','gold','dia','em','wool','planks','endstone','glass','obsidian','tnt','tntImpulse','tntSlow','tntDamage','apple','bow','arrow','fireball','snowball','pearl','speedPotion','jumpPotion','invisPotion','compass'];\nlet PROFILE_DB={};\ntry{PROFILE_DB=JSON.parse(fs.readFileSync(STATS_FILE,'utf8'))||{}}catch(e){PROFILE_DB={}}\nfunction saveProfiles(){try{fs.mkdirSync(path.dirname(STATS_FILE),{recursive:true});const tmp=STATS_FILE+'.tmp';fs.writeFileSync(tmp,JSON.stringify(PROFILE_DB,null,2));fs.renameSync(tmp,STATS_FILE)}catch(e){console.warn('[STATS] não foi possível salvar',e.message)}}\nconst profileLevel=xp=>1+Math.floor(Math.max(0,Number(xp)||0)/500);\nfunction ensureProfile(id,name='Jogador'){const k=String(id||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,64)||crypto.randomBytes(12).toString('hex');let p=PROFILE_DB[k];if(!p)p=PROFILE_DB[k]={id:k,name:String(name||'Jogador').slice(0,14),xp:0,matches:0,wins:0,losses:0,kills:0,finalKills:0,bedsDestroyed:0,deaths:0,resourcesCollected:0};p.name=String(name||p.name||'Jogador').slice(0,14);return p}\nfunction publicProfile(p){return{id:p.id,name:p.name,xp:p.xp||0,level:profileLevel(p.xp),matches:p.matches||0,wins:p.wins||0,losses:p.losses||0,kills:p.kills||0,finalKills:p.finalKills||0,bedsDestroyed:p.bedsDestroyed||0,deaths:p.deaths||0,resourcesCollected:p.resourcesCollected||0}}\nfunction rankingPayload(limit=20){return Object.values(PROFILE_DB).sort((a,b)=>(b.xp||0)-(a.xp||0)||(b.wins||0)-(a.wins||0)||(b.finalKills||0)-(a.finalKills||0)).slice(0,limit).map(publicProfile)}\nfunction emptyChest(){return Object.fromEntries(CHEST_KEYS.map(k=>[k,0]))}`,
'stats helpers');

server=once(server,
`R = { code, mapId:'classic', modeId:'2v2', B: g.B, BD: g.BD, SHOP:g.SHOP, GEN:g.GEN, SPAWN:g.SPAWN, DIGEN:g.DIGEN, EMGEN:g.EMGEN, activeChunks:g.activeChunks, pf: new Uint8Array(g.B.length), ps: new Map(), ed: new Map(), q: [], tnt: [], drops: [], dropSeq: 0, projectiles: [], projSeq: 0, snapAcc: 0, pickupAcc: 0, bed: [0, 0, 0, 0], st: 'lobby', t: 0, host: null, final:null,`,
`R = { code, mapId:'classic', modeId:'2v2', B: g.B, BD: g.BD, SHOP:g.SHOP, GEN:g.GEN, SPAWN:g.SPAWN, DIGEN:g.DIGEN, EMGEN:g.EMGEN, activeChunks:g.activeChunks, pf: new Uint8Array(g.B.length), ps: new Map(), ed: new Map(), q: [], tnt: [], drops: [], dropSeq: 0, projectiles: [], projSeq: 0, snapAcc: 0, pickupAcc: 0, bed: [0, 0, 0, 0], teamChest:[emptyChest(),emptyChest(),emptyChest(),emptyChest()], trapAt:[0,0,0,0], st: 'lobby', t: 0, host: null, final:null,`,
'room chest state');

server=once(server,
`const mkp = (ws, name, team) => ({ ws, name, team, x: 0, y: 11.02, z: 0, px:0, py:11.02, pz:0, yaw: 0, pitch: 0, hp: 20, alive: 1, out: 0, rt: 0, ih: 0, dy: 0, lt: Date.now(), src: null, st: -99, k: 0, sw: 0, ar: 0, held:1, admin:false,`,
`const mkp = (ws, name, team, profileId) => ({ ws, name, team, profileId, x: 0, y: 11.02, z: 0, px:0, py:11.02, pz:0, yaw: 0, pitch: 0, hp: 20, alive: 1, out: 0, rt: 0, ih: 0, dy: 0, lt: Date.now(), src: null, st: -99, k: 0, sw: 0, ar: 0, held:1, admin:false,`,
'mkp profile');
server=once(server,
`rl: Object.create(null), breaking: null, tools: { pick:0, axe:0, shears:0 }, fx:{speed:0,jump:0,invis:0,slow:0}, up: { sharp: 0, prot: 0, forge: 0, regen:0, trap:0 }, inv: { wool: 24, planks: 0, endstone:0, glass:0, obsidian:0, tnt: 0, tntImpulse:0, tntSlow:0, tntDamage:0, apple: 0, bow: 0, arrow: 0, fireball: 0, snowball: 0, pearl:0, speedPotion:0, jumpPotion:0, invisPotion:0, iron: 0, gold: 0, dia: 0, em: 0 } });`,
`rl: Object.create(null), breaking: null, enderChest:emptyChest(), tools: { pick:0, axe:0, shears:0 }, fx:{speed:0,jump:0,invis:0,slow:0,fatigue:0}, up: { sharp:0, prot:0, forge:0, haste:0, regen:0, trap:0, trapMiner:0, trapSlow:0, trapCounter:0 }, inv: { wool:24, planks:0, endstone:0, glass:0, obsidian:0, tnt:0, tntImpulse:0, tntSlow:0, tntDamage:0, apple:0, bow:0, arrow:0, fireball:0, snowball:0, pearl:0, speedPotion:0, jumpPotion:0, invisPotion:0, compass:0, iron:0, gold:0, dia:0, em:0 } });`,
'player expanded state');

server=once(server,
`function win(R) {\n  if (R.st !== 'play') return;`,
`function finalizeProfiles(R,winnerTeam,winnerId){\n  const progress={};\n  R.ps.forEach(p=>{if(p.admin||!p.profileId)return;const rec=ensureProfile(p.profileId,p.name),won=R.modeId==='solo'?p.id===winnerId:p.team===winnerTeam,xpGain=25+(won?100:0)+(p.stats.kills||0)*10+(p.stats.finalKills||0)*25+(p.stats.bedsDestroyed||0)*40;rec.matches=(rec.matches||0)+1;rec.wins=(rec.wins||0)+(won?1:0);rec.losses=(rec.losses||0)+(won?0:1);for(const k of ['kills','finalKills','bedsDestroyed','deaths','resourcesCollected'])rec[k]=(rec[k]||0)+(p.stats[k]||0);rec.xp=(rec.xp||0)+xpGain;progress[p.id]={xpGain,profile:publicProfile(rec)};tx(p,{t:'profileUpdate',xpGain,profile:progress[p.id].profile})});saveProfiles();return progress\n}\nfunction win(R) {\n  if (R.st !== 'play') return;`,
'profile finalizer');
server=once(server,
`R.st = 'ended';\n    R.final={t:'end',winnerTeam,winnerId,winnerName,modeId:R.modeId,stats:statsPayload(R),time:+R.t.toFixed(1)};`,
`R.st = 'ended';\n    const progress=finalizeProfiles(R,winnerTeam,winnerId);\n    R.final={t:'end',winnerTeam,winnerId,winnerName,modeId:R.modeId,stats:statsPayload(R),time:+R.t.toFixed(1),progress,ranking:rankingPayload()};`,
'final progress payload');

server=once(server,
`q.ih = .35; d *= 1 - .25 * q.ar - .1 * q.up.prot; const dealt=Math.max(0,d);q.hp -= dealt;`,
`q.ih = .35; d *= Math.max(.2,1 - .25 * q.ar - .1 * q.up.prot); const dealt=Math.max(0,d);q.hp -= dealt;`,
'protection cap');

server=once(server,
`  if(m.tool==='shears'&&lv) mult=.28;\n  else if(m.tool==='pick'&&lv) mult=lv===1?.55:.32;\n  else if(m.tool==='axe'&&lv) mult=lv===1?.55:.32;\n  return Math.max(.18,m.hard*mult);`,
`  if(m.tool==='shears'&&lv) mult=.28;\n  else if(m.tool==='pick'&&lv) mult=lv===1?.55:.32;\n  else if(m.tool==='axe'&&lv) mult=lv===1?.55:.32;\n  const haste=p.up.haste>=2?.68:p.up.haste===1?.82:1,fatigue=p.fx.fatigue>0?1.65:1;\n  return Math.max(.14,m.hard*mult*haste*fatigue);`,
'haste break time');

server=once(server,
`function enemyInBase(R,p){const b=p.roomSpawn||[S.IS[p.team][0]+.5,S.BASE_Y+2.02,S.IS[p.team][1]+.5];return [...R.ps.values()].find(q=>q.alive&&q.team!==p.team&&Math.hypot(q.x-b[0],q.z-b[2])<20);}`, 
`function enemyInBase(R,p){const b=p.roomSpawn||[S.IS[p.team][0]+.5,S.BASE_Y+2.02,S.IS[p.team][1]+.5];return [...R.ps.values()].find(q=>q.alive&&q.team!==p.team&&Math.hypot(q.x-b[0],q.z-b[2])<20)}\nfunction teamPlayers(R,t){return [...R.ps.values()].filter(q=>q.team===t&&!q.admin)}\nfunction setTeamUp(R,t,key,value){teamPlayers(R,t).forEach(q=>{q.up[key]=value;pinv(q)})}\nfunction triggerTeamTraps(R){for(const t of modeCfg(R).activeTeams){if(R.t-(R.trapAt[t]||0)<2.5)continue;const defenders=teamPlayers(R,t),anchor=defenders.find(q=>q.alive)||defenders[0];if(!anchor)continue;const enemy=enemyInBase(R,anchor);if(!enemy)continue;const has=k=>defenders.some(q=>(q.up[k]||0)>0),consume=k=>setTeamUp(R,t,k,0);if(has('trapMiner')){consume('trapMiner');enemy.fx.fatigue=Math.max(enemy.fx.fatigue||0,10);pinv(enemy);feed(R,\`Armadilha de Fadiga do Time \${S.TN[t]} ativada!\`,t,enemy.team,'trap')}else if(has('trapSlow')){consume('trapSlow');enemy.fx.slow=Math.max(enemy.fx.slow||0,8);pinv(enemy);feed(R,\`Armadilha de Lentidão do Time \${S.TN[t]} ativada!\`,t,enemy.team,'trap')}else if(has('trapCounter')){consume('trapCounter');defenders.forEach(q=>{q.fx.speed=Math.max(q.fx.speed||0,10);pinv(q)});feed(R,\`Contra-Ataque do Time \${S.TN[t]} ativado!\`,t,enemy.team,'trap')}else if(has('trap')){consume('trap');enemy.fx.slow=Math.max(enemy.fx.slow||0,5);pinv(enemy);feed(R,\`Armadilha do Time \${S.TN[t]} ativada!\`,t,enemy.team,'trap')}else continue;R.trapAt[t]=R.t;defenders.forEach(q=>tx(q,{t:'m',s:'⚠ INIMIGO NA BASE!'}))}}\nfunction chestPos(meta,t,kind){const sp=meta.SPAWN?.[t];if(!sp)return null;const [cx,cz]=S.IS[t],L=Math.hypot(cx,cz)||1,ix=-cx/L,iz=-cz/L,txv=-iz,tz=ix,side=kind==='team'?4:-4;return[sp[0]+txv*side+ix*1.5,sp[1],sp[2]+tz*side+iz*1.5]}\nfunction nearChest(R,p,kind){const a=chestPos(R,p.team,kind);return !!a&&Math.hypot(p.x-a[0],p.z-a[2])<4.8&&Math.abs(p.y-a[1])<4}\nfunction chestState(R,p,kind){const items=kind==='team'?R.teamChest[p.team]:p.enderChest;tx(p,{t:'chestState',kind,items})}`, 
'helpers traps chests');

server=once(server,
`p.fx.speed=Math.max(0,p.fx.speed-dt);p.fx.jump=Math.max(0,p.fx.jump-dt);p.fx.invis=Math.max(0,p.fx.invis-dt);p.fx.slow=Math.max(0,(p.fx.slow||0)-dt);`,
`p.fx.speed=Math.max(0,p.fx.speed-dt);p.fx.jump=Math.max(0,p.fx.jump-dt);p.fx.invis=Math.max(0,p.fx.invis-dt);p.fx.slow=Math.max(0,(p.fx.slow||0)-dt);p.fx.fatigue=Math.max(0,(p.fx.fatigue||0)-dt);`,
'fatigue tick');
server=once(server,
`if(p.up.trap&&enemyInBase(R,p)){p.up.trap=0;tx(p,{t:'m',s:'ARMADILHA! Inimigo na sua base!'});pinv(p);}`,
``,
'remove old trap loop');
server=once(server,
`      R.g.base.forEach((g, i) => {`,
`      triggerTeamTraps(R);\n      R.g.base.forEach((g, i) => {`,
'trap tick');

server=once(server,
`p = mkp(ws, (String(m.name || 'Jogador').trim()||'Jogador').slice(0,14), team); p.id = ++uid;p.roomCode=R.code;ws.playerId=p.id;`,
`const safeProfile=String(m.profileId||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,64)||crypto.randomBytes(12).toString('hex');\n      p = mkp(ws, (String(m.name || 'Jogador').trim()||'Jogador').slice(0,14), team, safeProfile); p.id = ++uid;p.roomCode=R.code;ws.playerId=p.id;ensureProfile(safeProfile,p.name);`,
'join profile id');
server=once(server,
`tx(p, { t:'init', id:p.id, team:p.team, token:p.token, room:R.code, mapId:R.mapId, modeId:R.modeId, activeChunks:R.activeChunks, ed:[...R.ed.values()], drops:R.drops });`,
`tx(p, { t:'init', id:p.id, team:p.team, token:p.token, room:R.code, mapId:R.mapId, modeId:R.modeId, activeChunks:R.activeChunks, ed:[...R.ed.values()], drops:R.drops, profile:publicProfile(ensureProfile(p.profileId,p.name)), ranking:rankingPayload() });`,
'init profile payload');
server=once(server,
`    switch (m.t) {\n      case 'netPing': tx(p,{t:'netPong',at:Number(m.at)||0,serverAt:Date.now()}); break;`,
`    switch (m.t) {\n      case 'netPing': tx(p,{t:'netPong',at:Number(m.at)||0,serverAt:Date.now()}); break;\n      case 'ranking': tx(p,{t:'ranking',ranking:rankingPayload(),profile:publicProfile(ensureProfile(p.profileId,p.name))}); break;\n      case 'chestOpen': {const kind=m.kind==='ender'?'ender':'team';if(!play||!nearChest(R,p,kind))break;chestState(R,p,kind);break}\n      case 'chestMove': {const kind=m.kind==='ender'?'ender':'team',key=String(m.key||'');if(!play||!CHEST_KEYS.includes(key)||!nearChest(R,p,kind))break;const box=kind==='team'?R.teamChest[p.team]:p.enderChest,dir=m.dir==='withdraw'?'withdraw':'deposit';let n=m.n==='all'?Infinity:Math.max(1,Math.min(999,Math.floor(Number(m.n)||1)));if(dir==='deposit'){n=Math.min(n,p.inv[key]||0);if(n>0){p.inv[key]-=n;box[key]=(box[key]||0)+n}}else{n=Math.min(n,box[key]||0);if(n>0){box[key]-=n;p.inv[key]=(p.inv[key]||0)+n}}pinv(p);chestState(R,p,kind);break}`, 
'network feature cases');

server=once(server,
`        let ok=1;\n        if(type==='inv'&&key==='bow'){if(p.inv.bow>0)ok=0;else p.inv.bow=1}\n        else if(type==='inv')p.inv[key]=(p.inv[key]||0)+value;\n        else if(type==='sw'&&p.sw<value)p.sw=value;\n        else if(type==='ar'&&p.ar<value)p.ar=value;\n        else if(type==='tool'&&(p.tools[key]||0)<value)p.tools[key]=value;\n        else if(type==='up'&&p.up[key]===value-1)p.up[key]=value;\n        else ok=0;\n        if(!ok){buyFail(p,'already_owned','Você já possui esse item ou uma versão melhor.');break}\n        p.inv[currency]-=price;\n        pinv(p);buyOk(p);sfx(p,'buy');`,
`        let ok=1,teamUpgrade=false;\n        if(type==='inv'&&key==='bow'){if(p.inv.bow>0)ok=0;else p.inv.bow=1}\n        else if(type==='inv')p.inv[key]=(p.inv[key]||0)+value;\n        else if(type==='sw'&&p.sw<value)p.sw=value;\n        else if(type==='ar'&&p.ar<value)p.ar=value;\n        else if(type==='tool'&&(p.tools[key]||0)<value)p.tools[key]=value;\n        else if(type==='up'&&(p.up[key]||0)===value-1){setTeamUp(R,p.team,key,value);teamUpgrade=true}\n        else ok=0;\n        if(!ok){buyFail(p,'already_owned','Você já possui esse item ou uma versão melhor.');break}\n        p.inv[currency]-=price;\n        if(!teamUpgrade)pinv(p);buyOk(p);sfx(p,'buy');`,
'team upgrades buy');
server=once(server,
`if (Number.isInteger(m.s) && m.s >= 0 && m.s <= 14) p.held = m.s;`,
`if (Number.isInteger(m.s) && m.s >= 0 && m.s <= 15) p.held = m.s;`,
'held compass slot');

// ---------------- client state + compass ----------------
game=once(game,
`const K={},SL=['Espada','Lã','Tábuas','End Stone','Vidro','Obsidiana','TNT','Maçã','Arco','B. Fogo','B. Neve','Pérola','Veloc.','Salto','Invis.'],KY=[0,'wool','planks','endstone','glass','obsidian','tnt','apple','bow','fireball','snowball','pearl','speedPotion','jumpPotion','invisPotion'],SC=['#ccc','#3d6fe0','#b58a4e','#e8dfb0','#ddecff','#2c2036','#d83030','#ffd23d','#8b5a2b','#ff7a20','#eef6ff','#7b3fc6','#55ddff','#aaff55','#bbbbff'],SN=['Punho','Pedra','Ferro','Diamante'],AN=['nenhuma','ferro','diamante'],CN={iron:'ferro',gold:'ouro',dia:'diamante',em:'esmeralda'};`,
`const K={},SL=['Espada','Lã','Tábuas','End Stone','Vidro','Obsidiana','TNT','Maçã','Arco','B. Fogo','B. Neve','Pérola','Veloc.','Salto','Invis.','Bússola'],KY=[0,'wool','planks','endstone','glass','obsidian','tnt','apple','bow','fireball','snowball','pearl','speedPotion','jumpPotion','invisPotion','compass'],SC=['#ccc','#3d6fe0','#b58a4e','#e8dfb0','#ddecff','#2c2036','#d83030','#ffd23d','#8b5a2b','#ff7a20','#eef6ff','#7b3fc6','#55ddff','#aaff55','#bbbbff','#d9b85f'],SN=['Punho','Pedra','Ferro','Diamante'],AN=['nenhuma','ferro','diamante'],CN={iron:'ferro',gold:'ouro',dia:'diamante',em:'esmeralda'};`,
'client compass slot');
game=once(game,
`let inv={wool:0,planks:0,endstone:0,glass:0,obsidian:0,tnt:0,tntImpulse:0,tntSlow:0,tntDamage:0,apple:0,bow:0,arrow:0,fireball:0,snowball:0,pearl:0,speedPotion:0,jumpPotion:0,invisPotion:0,iron:0,gold:0,dia:0,em:0},sw=0,ar=0,tools={pick:0,axe:0,shears:0},fxs={speed:0,jump:0,invis:0,slow:0},up={sharp:0,prot:0,forge:0,regen:0,trap:0},cur=1,started=0,over=0,shopOpen=0,bed=[1,1,1,1],INFO={},tg=null,ws;`,
`let inv={wool:0,planks:0,endstone:0,glass:0,obsidian:0,tnt:0,tntImpulse:0,tntSlow:0,tntDamage:0,apple:0,bow:0,arrow:0,fireball:0,snowball:0,pearl:0,speedPotion:0,jumpPotion:0,invisPotion:0,compass:0,iron:0,gold:0,dia:0,em:0},sw=0,ar=0,tools={pick:0,axe:0,shears:0},fxs={speed:0,jump:0,invis:0,slow:0,fatigue:0},up={sharp:0,prot:0,forge:0,haste:0,regen:0,trap:0,trapMiner:0,trapSlow:0,trapCounter:0},cur=1,started=0,over=0,shopOpen=0,chestOpen=0,chestKind='team',chestData={},bed=[1,1,1,1],INFO={},tg=null,ws;\nlet myProfile=null,rankingData=[];const CHEST_KEYS=['iron','gold','dia','em','wool','planks','endstone','glass','obsidian','tnt','tntImpulse','tntSlow','tntDamage','apple','bow','arrow','fireball','snowball','pearl','speedPotion','jumpPotion','invisPotion','compass'];const CHEST_LABEL={iron:'Ferro',gold:'Ouro',dia:'Diamante',em:'Esmeralda',wool:'Lã',planks:'Tábuas',endstone:'End Stone',glass:'Vidro',obsidian:'Obsidiana',tnt:'TNT',tntImpulse:'TNT Impulso',tntSlow:'TNT Lentidão',tntDamage:'TNT Dano',apple:'Maçã',bow:'Arco',arrow:'Flechas',fireball:'Bola de Fogo',snowball:'Bola de Neve',pearl:'Pérola',speedPotion:'Velocidade',jumpPotion:'Salto',invisPotion:'Invisibilidade',compass:'Bússola'};`,
'client expanded state');

game=once(game,
`function pearlModel(){const g=new THREE.Group(),core=sphere(.145,0x6d34a6),inner=sphere(.095,0xb66df2);g.add(core,inner);const ring=box(.34,.035,.035,0xd59cff);ring.rotation.z=.55;g.add(ring);return g}`, 
`function pearlModel(){const g=new THREE.Group(),core=sphere(.145,0x6d34a6),inner=sphere(.095,0xb66df2);g.add(core,inner);const ring=box(.34,.035,.035,0xd59cff);ring.rotation.z=.55;g.add(ring);return g}\nfunction compassModel(){const g=new THREE.Group(),rim=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.07,16),hmat(0xb89343)),face=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.075,16),hmat(0xf1e2b5)),needle=box(.035,.025,.27,0xd84242);rim.rotation.x=face.rotation.x=Math.PI/2;needle.position.z=.01;needle.rotation.y=.35;g.add(rim,face,needle);g.rotation.z=-.18;return g}`, 
'compass model');
game=once(game,
` if(k==='pearl')return pearlModel();\n if(k==='speedPotion')return potionModel(0x55ddff);`,
` if(k==='pearl')return pearlModel();\n if(k==='compass')return compassModel();\n if(k==='speedPotion')return potionModel(0x55ddff);`,
'held compass');

// ---------------- chest visuals ----------------
game=once(game,
`function vendorTarget(){\n if(!started||!VENDORS.length)return null;`,
`const CHESTS=[];\nfunction chestWorldPos(meta,t,kind){const sp=meta?.SPAWN?.[t];if(!sp)return null;const[cx,cz]=IS[t],L=Math.hypot(cx,cz)||1,ix=-cx/L,iz=-cz/L,txv=-iz,tz=ix,side=kind==='team'?4:-4;return[sp[0]+txv*side+ix*1.5,sp[1],sp[2]+tz*side+iz*1.5]}\nfunction chestModel(kind,team){const g=new THREE.Group(),body=box(1.02,.58,.70,kind==='ender'?0x342347:0x8a5a2f),lid=box(1.02,.22,.72,kind==='ender'?0x55346f:0xa86d36),lock=box(.16,.20,.06,kind==='ender'?0xb85cff:0xe7c55f);body.position.y=.31;lid.position.y=.70;lock.position.set(0,.48,.38);g.add(body,lid,lock);g.userData.chestKind=kind;g.userData.chestTeam=team;g.traverse(o=>{o.userData.chestKind=kind;o.userData.chestTeam=team});return g}\nfunction clearChests(){while(CHESTS.length){const c=CHESTS.pop();sc.remove(c.root);c.root.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose&&o.material.dispose()})}}\nfunction updateChests(meta,lobby=false){clearChests();if(lobby||!meta?.SPAWN)return;meta.SPAWN.forEach((_,team)=>{for(const kind of ['team','ender']){const pos=chestWorldPos(meta,team,kind);if(!pos)continue;const root=chestModel(kind,team);root.position.set(pos[0],pos[1],pos[2]);root.rotation.y=Math.atan2(-pos[0],-pos[2]);sc.add(root);CHESTS.push({root,team,kind,pos})}})}\nconst chestRay=new THREE.Raycaster(),chestDir=new THREE.Vector3();\nfunction chestTarget(){if(!started||!CHESTS.length)return null;cam.getWorldDirection(chestDir);chestRay.set(cam.position,chestDir);chestRay.far=5.2;const hits=chestRay.intersectObjects(CHESTS.map(c=>c.root),true);if(!hits.length)return null;const hit=hits[0];for(let d=.18;d<hit.distance-.12;d+=.18){const x=Math.floor(cam.position.x+chestDir.x*d),y=Math.floor(cam.position.y+chestDir.y*d),z=Math.floor(cam.position.z+chestDir.z*d);if(get(x,y,z))return null}const kind=hit.object.userData.chestKind,team=hit.object.userData.chestTeam;return CHESTS.find(c=>c.kind===kind&&c.team===team)||null}\nfunction vendorTarget(){\n if(!started||!VENDORS.length)return null;`,
'chest visuals insert');
game=once(game,
`activeChunks.forEach(k=>dirty.add(k));updateGeneratorIcons(g);updateVendors(g,lobby);syncBedVisuals(g);flush(999);`,
`activeChunks.forEach(k=>dirty.add(k));updateGeneratorIcons(g);updateVendors(g,lobby);updateChests(g,lobby);syncBedVisuals(g);flush(999);`,
'load map chests');

// ---------------- client profile/chest UI helpers ----------------
game=once(game,
`const uiCache=Object.create(null);const html=(id,v)=>{if(uiCache[id]!==v){uiCache[id]=v;$(id).innerHTML=v}};`,
`const uiCache=Object.create(null);const html=(id,v)=>{if(uiCache[id]!==v){uiCache[id]=v;$(id).innerHTML=v}};\nconst localProfileId=(()=>{let id='';try{id=localStorage.getItem('bwProfileId')||'';if(!id){id=(crypto.randomUUID?crypto.randomUUID():('p-'+Date.now()+'-'+Math.random().toString(36).slice(2))).replace(/[^a-zA-Z0-9_-]/g,'');localStorage.setItem('bwProfileId',id)}}catch(e){id='p-'+Date.now()+'-'+Math.random().toString(36).slice(2)}return id})();\nfunction drawProfile(){if(!myProfile)return;const p=myProfile,next=500-(p.xp%500||0);html('profileBody',\`<div class="profile-level">NÍVEL \${p.level}</div><div class="xpbar"><i style="width:\${((p.xp%500)/5).toFixed(1)}%"></i></div><p><b>XP:</b> \${p.xp} · próximo nível em \${next===500?0:next} XP</p><div class="profile-grid"><span>Partidas<b>\${p.matches}</b></span><span>Vitórias<b>\${p.wins}</b></span><span>Derrotas<b>\${p.losses}</b></span><span>Kills<b>\${p.kills}</b></span><span>Final Kills<b>\${p.finalKills}</b></span><span>Camas<b>\${p.bedsDestroyed}</b></span></div>\`)}\nfunction openProfile(){drawProfile();scr('profile')}\nfunction drawRanking(){html('rankingBody',(rankingData||[]).map((p,i)=>\`<div class="rank-row"><b>#\${i+1}</b><span>\${p.name}</span><em>Nv. \${p.level}</em><strong>\${p.xp} XP</strong><small>\${p.wins} vitórias · \${p.finalKills} finais</small></div>\`).join('')||'<p>Ainda não há partidas registradas.</p>')}\nfunction openRanking(){send({t:'ranking'});drawRanking();scr('ranking')}\nfunction drawChest(){const box=chestData||{};html('chestTitle',chestKind==='ender'?'ENDER CHEST':'BAÚ DO TIME');html('chestGrid',CHEST_KEYS.filter(k=>(box[k]||0)>0||(inv[k]||0)>0).map(k=>\`<div class="chest-row"><span>\${CHEST_LABEL[k]||k}</span><b>Você: \${inv[k]||0}</b><b>Baú: \${box[k]||0}</b><button onclick="chestMove('deposit','\${k}',1)">+1</button><button onclick="chestMove('deposit','\${k}','all')">+Tudo</button><button onclick="chestMove('withdraw','\${k}',1)">-1</button><button onclick="chestMove('withdraw','\${k}','all')">-Tudo</button></div>\`).join('')||'<p>Baú vazio. Leve recursos ou itens para guardar.</p>')}\nfunction chestMove(dir,key,n){send({t:'chestMove',kind:chestKind,dir,key,n})}\nfunction openChest(kind){chestKind=kind;send({t:'chestOpen',kind})}\nfunction closeChest(){chestOpen=0;scr(null);requestGameLock()}\nfunction nearestEnemy(){let best=null,bd=Infinity;PL.forEach((r,id)=>{const mp=matchPlayers.get(id);if(!mp||mp.team===me.team||mp.out||!mp.alive||mp.admin)return;const x=r.tx||r.m.position.x,z=r.tz||r.m.position.z,d=Math.hypot(x-pl.x,z-pl.z);if(d<bd){bd=d;best={id,r,mp,x,z,d}}});return best}\nfunction updateCompass(){const el=$('compassHud');if(!el)return;if(!started||slotKey(cur)!=='compass'||!(inv.compass>0)){el.style.display='none';return}const q=nearestEnemy();el.style.display='block';if(!q){el.innerHTML='🧭 Nenhum inimigo ativo';return}const dx=q.x-pl.x,dz=q.z-pl.z,world=Math.atan2(-dx,-dz),rel=world-pl.yaw,name=INFO[q.id]?.n||('Jogador '+q.id);el.innerHTML=\`<span class="compass-arrow" style="transform:rotate(\${rel}rad)">▲</span><b>\${name}</b><small>\${Math.round(q.d)} blocos</small>\`}`, 
'UI helpers');

game=once(game,
`const scr=n=>['menu','lobby','ov','shop','end'].forEach(k=>$(k).style.display=k===n?'flex':'none'),cv=R.domElement;`,
`const scr=n=>['menu','lobby','ov','shop','chest','profile','ranking','end'].forEach(k=>$(k).style.display=k===n?'flex':'none'),cv=R.domElement;`,
'overlay registry');

game=once(game,
`else{roomCode=($('rm').value||'sala').slice(0,12).toLowerCase();$('rc').textContent=roomCode;send({t:'join',name:$('nm').value||'Jogador',room:roomCode})}`, 
`else{roomCode=($('rm').value||'sala').slice(0,12).toLowerCase();$('rc').textContent=roomCode;send({t:'join',name:$('nm').value||'Jogador',room:roomCode,profileId:localProfileId})}`, 
'join profile client');

game=once(game,
`case'init':me.id=m.id;me.team=m.team;roomCode=m.room||roomCode;reconnectToken=m.token||reconnectToken;saveReconnect();loadMap(m.mapId||'classic',true,m.activeChunks);(m.ed||[]).forEach(a=>sb(...a));flush(999);syncDrops(m.drops||[]);pl.yaw=0;break;`,
`case'init':me.id=m.id;me.team=m.team;roomCode=m.room||roomCode;reconnectToken=m.token||reconnectToken;myProfile=m.profile||myProfile;rankingData=m.ranking||rankingData;drawProfile();drawRanking();saveReconnect();loadMap(m.mapId||'classic',true,m.activeChunks);(m.ed||[]).forEach(a=>sb(...a));flush(999);syncDrops(m.drops||[]);pl.yaw=0;break;`,
'init profile client');
game=once(game,
`case'netPong':lastNetMessageAt=Date.now();break;`,
`case'netPong':lastNetMessageAt=Date.now();break;\ncase'profileUpdate':myProfile=m.profile||myProfile;drawProfile();if(m.xpGain)msg('+'+m.xpGain+' XP');break;\ncase'ranking':rankingData=m.ranking||[];if(m.profile)myProfile=m.profile;drawProfile();drawRanking();break;\ncase'chestState':chestKind=m.kind||'team';chestData=m.items||{};chestOpen=1;drawChest();scr('chest');try{document.exitPointerLock()}catch(e){}break;`,
'profile chest messages');
game=once(game,
`case'inv':inv=m.i;sw=m.sw;ar=m.ar;up=m.up;tools=m.tools||tools;fxs=m.fx||fxs;hud();if(shopOpen)drawShop();break;`,
`case'inv':inv=m.i;sw=m.sw;ar=m.ar;up=m.up;tools=m.tools||tools;fxs=m.fx||fxs;hud();if(shopOpen)drawShop();if(chestOpen)drawChest();break;`,
'inv chest redraw');
game=once(game,
` const rows=[...(m.stats||[])].sort((a,b)=>b.finalKills-a.finalKills||b.bedsDestroyed-a.bedsDestroyed||b.kills-a.kills);`,
` const mine=m.progress&&m.progress[me.id];if(mine){myProfile=mine.profile||myProfile;drawProfile();$('endSub').textContent+=' · +'+(mine.xpGain||0)+' XP'}rankingData=m.ranking||rankingData;drawRanking();\n const rows=[...(m.stats||[])].sort((a,b)=>b.finalKills-a.finalKills||b.bedsDestroyed-a.bedsDestroyed||b.kills-a.kills);`,
'end XP');

game=once(game,
`function shopSig(){return [shopCat,currentMode,inv.iron,inv.gold,inv.dia,inv.em,inv.bow,sw,ar,tools.pick,tools.axe,tools.shears,up.sharp,up.prot,up.forge,up.regen,up.trap].join('|')}`, 
`function shopSig(){return [shopCat,currentMode,inv.iron,inv.gold,inv.dia,inv.em,inv.bow,inv.compass,sw,ar,tools.pick,tools.axe,tools.shears,up.sharp,up.prot,up.forge,up.haste,up.regen,up.trapMiner,up.trapSlow,up.trapCounter].join('|')}`, 
'shop state expanded');
game=once(game,
`const QUICK_KEYS=['wool','planks','endstone','sw1','ar1','pick1','bow','arrow','tnt','fireball','apple','pearl','speedPotion','jumpPotion'];`,
`const QUICK_KEYS=['wool','planks','endstone','sw1','ar1','pick1','bow','arrow','tnt','fireball','apple','pearl','compass','speedPotion','jumpPotion'];`,
'quick compass');

game=once(game,
`<div class="effectline">\${fxs.speed>0?'⚡ VELOCIDADE ':''}\${fxs.jump>0?'↥ SALTO ':''}\${fxs.invis>0?'◌ INVISÍVEL ':''}\${fxs.slow>0?'🐌 LENTIDÃO ':''}</div>`,
`<div class="effectline">\${fxs.speed>0?'⚡ VELOCIDADE ':''}\${fxs.jump>0?'↥ SALTO ':''}\${fxs.invis>0?'◌ INVISÍVEL ':''}\${fxs.slow>0?'🐌 LENTIDÃO ':''}\${fxs.fatigue>0?'⛏ FADIGA ':''}</div>`,
'fatigue HUD');

// world interactions
game=once(game,
` const vendor=vendorTarget();if(vendor){if(vendor.team!==me.team){msg('Este vendedor pertence a outro time.');sfx('blocked');return}openShop();return}`, 
` const chest=chestTarget();if(chest){if(chest.team!==me.team){msg('Esse baú pertence a outro time.');sfx('blocked');return}openChest(chest.kind);return}\n const vendor=vendorTarget();if(vendor){if(vendor.team!==me.team){msg('Este vendedor pertence a outro time.');sfx('blocked');return}openShop();return}`, 
'primary chest interaction');
game=once(game,
`const vf=me.alive&&started?vendorTarget():null;tg=me.alive&&started&&!vf?ray():null;sel.visible=!!tg;if(tg)sel.position.set(tg.h[0]+.5,tg.h[1]+.5,tg.h[2]+.5);$('cross').style.filter=vf?'drop-shadow(0 0 4px #fff55c)':'drop-shadow(1px 1px 0 #000)';`,
`const cf=me.alive&&started?chestTarget():null,vf=me.alive&&started&&!cf?vendorTarget():null;tg=me.alive&&started&&!vf&&!cf?ray():null;sel.visible=!!tg;if(tg)sel.position.set(tg.h[0]+.5,tg.h[1]+.5,tg.h[2]+.5);$('cross').style.filter=(vf||cf)?'drop-shadow(0 0 4px #fff55c)':'drop-shadow(1px 1px 0 #000)';updateCompass();`,
'cross chest compass');

// ---------------- index overlays ----------------
index=once(index,
`<button id="st" style="display:none;text-align:center;margin-top:10px">Iniciar partida</button><button onclick="exploreLobby()" style="text-align:center">Explorar ilha de espera (L)</button><p id="wt"></p></div></div>`,
`<button id="st" style="display:none;text-align:center;margin-top:10px">Iniciar partida</button><button onclick="exploreLobby()" style="text-align:center">Explorar ilha de espera (L)</button><div class="meta-actions"><button onclick="openProfile()">Meu Perfil / XP</button><button onclick="openRanking()">Ranking</button></div><p id="wt"></p></div></div>`,
'lobby profile buttons');
index=once(index,
`<div class="ov" id="end"><div class="end-panel"><h1 id="et"></h1><p id="endSub"></p><div id="endStats"></div><button onclick="leaveToLobby()">Voltar ao lobby / nova sala</button></div></div>`,
`<div class="ov" id="chest"><div class="chest-panel"><h1 id="chestTitle">BAÚ</h1><div id="chestGrid"></div><button onclick="closeChest()">Fechar</button></div></div>\n<div class="ov" id="profile"><div class="meta-panel"><h1>MEU PERFIL</h1><div id="profileBody"></div><button onclick="scr('lobby')">Voltar</button></div></div>\n<div class="ov" id="ranking"><div class="meta-panel ranking-panel"><h1>RANKING</h1><div id="rankingBody"></div><button onclick="scr('lobby')">Voltar</button></div></div>\n<div id="compassHud"></div>\n<div class="ov" id="end"><div class="end-panel"><h1 id="et"></h1><p id="endSub"></p><div id="endStats"></div><button onclick="leaveToLobby()">Voltar ao lobby / nova sala</button></div></div>`,
'overlays');
index=index.replace(/<script src="\/game\.js[^\"]*"><\/script>/,'<script src="/game.js?v=progression-pack-20261004"></script>');

// ---------------- styles ----------------
if(!style.includes('/* progression pack */'))style+=`\n/* progression pack */\n.meta-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.meta-actions button{flex:1}.chest-panel,.meta-panel{width:min(760px,92vw);max-height:82vh;overflow:auto;background:#121826;border:2px solid #3d4a63;border-radius:14px;padding:18px;box-shadow:0 20px 80px #000a}.chest-row{display:grid;grid-template-columns:minmax(120px,1.5fr) 1fr 1fr repeat(4,auto);gap:6px;align-items:center;padding:7px;border-bottom:1px solid #ffffff18}.chest-row button{padding:6px 8px}.profile-level{font-size:28px;font-weight:700}.xpbar{height:14px;background:#ffffff18;border-radius:10px;overflow:hidden}.xpbar i{display:block;height:100%;background:linear-gradient(90deg,#43c6ff,#8b5cff)}.profile-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.profile-grid span{background:#ffffff0c;padding:12px;border-radius:8px}.profile-grid b{display:block;font-size:22px}.rank-row{display:grid;grid-template-columns:48px 1.3fr 80px 100px 1.5fr;gap:8px;align-items:center;padding:9px;border-bottom:1px solid #ffffff18}.rank-row small{opacity:.75}.rank-row em{font-style:normal}.rank-row strong{text-align:right}#compassHud{display:none;position:fixed;left:50%;top:72px;transform:translateX(-50%);z-index:12;background:#111d;border:1px solid #ffffff33;border-radius:10px;padding:9px 14px;pointer-events:none;text-align:center;min-width:200px}.compass-arrow{display:inline-block;margin-right:10px;color:#ffda63;font-size:22px}.compassHud b{margin:0 6px}@media(max-width:700px){.chest-row{grid-template-columns:1fr 1fr 1fr}.chest-row span{grid-column:1/-1}.rank-row{grid-template-columns:42px 1fr 70px}.rank-row strong,.rank-row small{grid-column:2/-1;text-align:left}.profile-grid{grid-template-columns:repeat(2,1fr)}}\n`;

fs.writeFileSync('public/shared.js',shared);
fs.writeFileSync('server.js',server);
fs.writeFileSync('public/game.js',game);
fs.writeFileSync('public/index.html',index);
fs.writeFileSync('public/style.css',style);
console.log('Progression pack applied');
