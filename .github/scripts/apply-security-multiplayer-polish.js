const fs=require('fs');
function once(s,a,b,l){const n=s.split(a).length-1;if(n!==1)throw new Error(`${l}: expected 1 match, got ${n}`);return s.replace(a,b)}
function rex(s,r,b,l){if(!r.test(s))throw new Error(`${l}: no match`);r.lastIndex=0;return s.replace(r,b)}
let server=fs.readFileSync('server.js','utf8');
let game=fs.readFileSync('public/game.js','utf8');
let style=fs.readFileSync('public/style.css','utf8');
let index=fs.readFileSync('public/index.html','utf8');

// ---------------- SERVER AUTHORITY / LIGHT ANTI-CHEAT ----------------
server=once(server,
"const GAMEPLAY={spawnProtect:1.25,hitCooldownMs:135,damageIFrames:.26,suddenDeathAt:12*60,collapseAt:15*60,collapseEvery:5};",
`const GAMEPLAY={spawnProtect:1.25,hitCooldownMs:135,damageIFrames:.26,suddenDeathAt:12*60,collapseAt:15*60,collapseEvery:5};
const HELD_KEYS=[null,'wool','planks','endstone','glass','obsidian','tnt','apple','bow','fireball','snowball','pearl','speedPotion','jumpPotion','invisPotion','compass','magicMilk','bridgeEgg','popupTower','knockbackStick'];
const TNT_KEYS=new Set(['tnt','tntImpulse','tntSlow','tntDamage']);
function heldKey(p){if(p.held===0)return'sword';return HELD_KEYS[p.held]||null}
function heldAllows(p,k){const h=heldKey(p);if(k==='sword')return h==='sword';if(TNT_KEYS.has(k))return h==='tnt'&&(p.inv[k]||0)>0;return h===k}
function acFlag(p,type,detail=''){
 if(!p||p.admin)return false;
 p.ac=p.ac||{total:0,movement:0,reach:0,rate:0,item:0,resource:0,projectile:0,place:0,last:''};
 p.ac.total++;p.ac[type]=(p.ac[type]||0)+1;p.ac.last=type+(detail?': '+String(detail).slice(0,70):'');p.acAt=Date.now();
 console.warn('[AC]',p.name,p.roomCode,type,detail);
 try{tx(p,{t:'ac',type,total:p.ac.total,last:p.ac.last})}catch(e){}
 return true
}
function sanitizeInventory(p){
 for(const k of Object.keys(p.inv||{})){
  let v=Number(p.inv[k]);
  if(!Number.isFinite(v)||v<0||v>9999){acFlag(p,'resource',k+'='+v);v=Math.max(0,Math.min(9999,Number.isFinite(v)?Math.floor(v):0))}
  p.inv[k]=Math.floor(v)
 }
 if(p.inv.bow>1)p.inv.bow=1
}
`,
'security helpers');

server=once(server,
"const mkp = (ws, name, team, profileId) => ({ ws, name, team, profileId, x: 0, y: 11.02, z: 0, px:0, py:11.02, pz:0, yaw: 0, pitch: 0, hp: 20, alive: 1, out: 0, rt: 0, ih: 0, dy: 0, lt: Date.now(), src: null, st: -99, k: 0, sw: 0, ar: 0, held:1, admin:false, invSeq:0,",
"const mkp = (ws, name, team, profileId) => ({ ws, name, team, profileId, x: 0, y: 11.02, z: 0, px:0, py:11.02, pz:0, yaw: 0, pitch: 0, hp: 20, alive: 1, out: 0, rt: 0, ih: 0, dy: 0, lt: Date.now(), src: null, st: -99, k: 0, sw: 0, ar: 0, held:1, admin:false, invSeq:0, openChestKind:'', ac:{total:0,movement:0,reach:0,rate:0,item:0,resource:0,projectile:0,place:0,last:''},",
'player security state');

server=once(server,
"const pinv=p=>{p.invSeq=(p.invSeq||0)+1;return tx(p,{t:'inv',i:p.inv,sw:p.sw,ar:p.ar,up:p.up,tools:p.tools,fx:p.fx,traps:p.trapQueue||[],seq:p.invSeq})};",
"const pinv=p=>{sanitizeInventory(p);p.invSeq=(p.invSeq||0)+1;return tx(p,{t:'inv',i:p.inv,sw:p.sw,ar:p.ar,up:p.up,tools:p.tools,fx:p.fx,traps:p.trapQueue||[],seq:p.invSeq})};",
'inventory sanity');

server=once(server,
"function chestState(R,p,kind){const items=kind==='team'?R.teamChest[p.team]:p.enderChest,gi=kind==='team'?generatorUpgradeInfo(R,p.team):null;tx(p,{t:'chestState',kind,items,genTier:gi?.tier??0,genNext:gi?.next||null,genCurrent:gi?.current||''})}",
`function chestState(R,p,kind){const items=kind==='team'?R.teamChest[p.team]:p.enderChest,gi=kind==='team'?generatorUpgradeInfo(R,p.team):null;tx(p,{t:'chestState',kind,items,genTier:gi?.tier??0,genNext:gi?.next||null,genCurrent:gi?.current||''})}
function broadcastTeamChest(R,t){teamPlayers(R,t).forEach(q=>{if(q.openChestKind==='team'&&nearChest(R,q,'team'))chestState(R,q,'team')})}
`,
'team chest broadcast');

server=once(server,
"case 'netPing': tx(p,{t:'netPong',at:Number(m.at)||0,serverAt:Date.now(),buffer:p.ws?.bufferedAmount||0}); break;",
"case 'netPing': tx(p,{t:'netPong',at:Number(m.at)||0,serverAt:Date.now(),buffer:p.ws?.bufferedAmount||0,ac:p.ac||null}); break;",
'ac net diagnostics');

server=rex(server,/      case 'chestOpen': \{[\s\S]*?\n      case 'genUpgrade': \{/,
`      case 'chestOpen': {const kind=m.kind==='ender'?'ender':'team';if(!play||!nearChest(R,p,kind))break;p.openChestKind=kind;chestState(R,p,kind);break}
      case 'chestClose': p.openChestKind='';break;
      case 'chestMove': {
        const kind=m.kind==='ender'?'ender':'team',key=String(m.key||'');if(!play||!CHEST_KEYS.includes(key)||!nearChest(R,p,kind))break;
        p.openChestKind=kind;const box=kind==='team'?R.teamChest[p.team]:p.enderChest,dir=m.dir==='withdraw'?'withdraw':'deposit';
        let n=m.n==='all'?Infinity:Math.max(1,Math.min(999,Math.floor(Number(m.n)||1)));
        if(dir==='deposit'){n=Math.min(n,p.inv[key]||0);if(n>0){p.inv[key]-=n;box[key]=(box[key]||0)+n}}
        else{n=Math.min(n,box[key]||0);if(n>0){box[key]-=n;p.inv[key]=(p.inv[key]||0)+n}}
        pinv(p);if(kind==='team')broadcastTeamChest(R,p.team);else chestState(R,p,kind);break
      }
      case 'genUpgrade': {`,
'live chest cases');

server=once(server,
"        chestState(R,p,'team');break;\n      }\n      case 'team': {",
"        broadcastTeamChest(R,p.team);break;\n      }\n      case 'team': {",
'generator live chest broadcast');

server=once(server,
"      case 'ranking': tx(p,{t:'ranking',ranking:rankingPayload(),profile:publicProfile(ensureProfile(p.profileId,p.name))}); break;",
`      case 'ranking': tx(p,{t:'ranking',ranking:rankingPayload(),profile:publicProfile(ensureProfile(p.profileId,p.name))}); break;
      case 'replay': {
        if(R.st!=='ended')break;
        const g=S.gen(R.mapId,true);R.B=g.B;R.BD=g.BD;R.SHOP=g.SHOP;R.GEN=g.GEN;R.SPAWN=g.SPAWN;R.DIGEN=g.DIGEN;R.EMGEN=g.EMGEN;R.activeChunks=g.activeChunks;R.pf=new Uint8Array(g.B.length);R.ed.clear();R.q=[];R.drops=[];R.tnt=[];R.projectiles=[];R.blockSeq=0;R.final=null;R.st='lobby';R.t=0;R.suddenDeath=false;R.collapseAt=0;R.lastCollapse=0;
        R.ps.forEach((q,i)=>{q.out=0;q.spectator=false;q.alive=1;q.hp=20;q.breaking=null;q.openChestKind='';q.stats={kills:0,finalKills:0,bedsDestroyed:0,deaths:0,resourcesCollected:0};q.roomShop=R.SHOP[q.team];q.roomSpawn=R.SPAWN?.[q.team];spawnLobby(q,i);tx(q,{t:'replay'})});
        bc(R,{t:'map',mapId:R.mapId,activeChunks:R.activeChunks});lobby(R);break
      }`,
'replay same room');

server=once(server,
"    setTimeout(() => { if (rooms.get(R.code) === R) rooms.delete(R.code); }, 90000);",
"    setTimeout(() => { if (rooms.get(R.code) === R && R.st==='ended') rooms.delete(R.code); }, 90000);",
'replay room retention');

server=once(server,
"        if(![m.x,m.y,m.z,m.yaw,m.pitch].every(Number.isFinite)||d>maxH||Math.abs(m.y-p.y)>maxV||m.x<S.MIN_X-8||m.x>S.MAX_X+8||m.z<S.MIN_Z-8||m.z>S.MAX_Z+8||m.y>S.H+20||m.y<-30){tx(p,{t:'tp',x:p.x,y:p.y,z:p.z,hard:0});break}",
"        if(![m.x,m.y,m.z,m.yaw,m.pitch].every(Number.isFinite)||d>maxH||Math.abs(m.y-p.y)>maxV||m.x<S.MIN_X-8||m.x>S.MAX_X+8||m.z<S.MIN_Z-8||m.z>S.MAX_Z+8||m.y>S.H+20||m.y<-30){if(!p.admin&&!spectating)acFlag(p,'movement','d='+d.toFixed(2)+' dy='+Math.abs(Number(m.y)-p.y).toFixed(2));tx(p,{t:'tp',x:p.x,y:p.y,z:p.z,hard:0});break}",
'movement anti-cheat');

server=once(server,
"      case 'held': {\n        if (Number.isInteger(m.s) && m.s >= 0 && m.s <= 19) p.held = m.s;\n        break;\n      }",
`      case 'held': {
        if(Number.isInteger(m.s)&&m.s>=0&&m.s<=19)p.held=m.s;else acFlag(p,'item','held='+m.s);
        break;
      }`,
'held validation');

server=rex(server,/      case 'hit': \{[\s\S]*?\n      \}\n      case 'place': \{/,
`      case 'hit': {
        if(p.fx.invis>0){p.fx.invis=0;pinv(p)}
        if(!play||!Number.isInteger(m.id)||!Number.isFinite(m.yaw)||!Number.isFinite(m.pitch))break;
        if(!allow(p,'hit',GAMEPLAY.hitCooldownMs)){acFlag(p,'rate','hit');break}cancelSpawnProtection(p);
        const q=R.ps.get(m.id);if(!q||q===p||!q.alive||q.team===p.team||q.admin)break;
        const rawDist=Math.hypot(q.x-p.x,(q.y+1)-(p.y+1),q.z-p.z);if(rawDist>4.35){acFlag(p,'reach',rawDist.toFixed(2));break}
        const hit=meleeRayHit(R,p,q,m.yaw,m.pitch);if(!hit)break;
        const hk=heldKey(p),stick=hk==='knockbackStick'&&(p.inv.knockbackStick||0)>0;if(hk!=='sword'&&!stick){acFlag(p,'item','hit with '+hk);break}
        const d=[hit.dir.x,hit.dir.y,hit.dir.z],now=R.t;if(p.comboTarget===q.id&&now-p.lastCombatAt<1.05)p.comboCount=Math.min(8,p.comboCount+1);else p.comboCount=1;p.comboTarget=q.id;p.lastCombatAt=now;
        const cr=!stick&&p.dy<-1,sprintMul=p.hspeed>5.15?1.12:1,kb=(stick?1.9:1)*sprintMul,damage=stick?1.5:(DMG[p.sw]+2*p.up.sharp)*(cr?1.5:1);
        if(!hurt(R,q,damage,d[0]*kb,d[2]*kb,p,cr))break;
        tx(p,{t:'hitok',id:q.id,hp:Math.max(0,Math.ceil(q.hp)),cr:cr?1:0,combo:p.comboCount});bc(R,{t:'anim',id:p.id,k:'attack'});break
      }
      case 'place': {`,
'authoritative melee');

server=rex(server,/      case 'place': \{[\s\S]*?\n      \}\n      case 'breakStart': \{/,
`      case 'place': {
        const held=heldKey(p),item=['wool','planks','endstone','glass','obsidian'].includes(held)?held:'',x=m.x,y=m.y,z=m.z,k={wool:p.team+1,planks:5,endstone:12,glass:7,obsidian:16}[item];
        const placeResult=(ok,reason='')=>tx(p,{t:'placeResult',ok:ok?1:0,reason,k:item||String(m.k||''),x,y,z,remaining:Number(p.inv[item]||0)});
        if(!play){placeResult(false,'not_playing');break}if(!item||!k){acFlag(p,'item','place '+String(m.k||'')+' held='+held);placeResult(false,'wrong_item');break}
        if(m.k&&m.k!==item){acFlag(p,'item','place declared '+m.k+' held='+item);placeResult(false,'wrong_item');break}
        if(![x,y,z].every(Number.isInteger)||y<1||y>=S.H-2){placeResult(false,'invalid_pos');break}
        if(!allow(p,'place',62)){acFlag(p,'place','rate');placeResult(false,'cooldown');break}
        if(!(p.inv[item]>0)){placeResult(false,'no_item');break}if(get(R,x,y,z)){placeResult(false,'occupied');break}
        if(Math.hypot(x+.5-p.x,y+.5-p.y-1.45,z+.5-p.z)>6.45){acFlag(p,'reach','place');placeResult(false,'too_far');break}
        if(![[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].some(d=>get(R,x+d[0],y+d[1],z+d[2]))){placeResult(false,'no_support');break}
        if([...R.ps.values()].some(q=>playerHitsBlock(q,x,y,z))){sfx(p,'blocked');placeResult(false,'player_collision');break}
        cancelSpawnProtection(p);if(p.fx.invis>0){p.fx.invis=0;pinv(p)}setb(R,x,y,z,k,1);p.inv[item]--;placeResult(true);pinv(p);sfx(p,'place');sfxAt(R,'place',x+.5,y+.5,z+.5,6);break
      }
      case 'breakStart': {`,
'authoritative placement');

server=rex(server,/      case 'shoot': \{[\s\S]*?\n      \}\n      case 'use': \{/,
`      case 'shoot': {
        cancelSpawnProtection(p);if(p.fx.invis>0){p.fx.invis=0;pinv(p)}if(!play||!Number.isFinite(m.yaw)||!Number.isFinite(m.pitch))break;
        const kind=String(m.k||''),charge=Math.max(.2,Math.min(1,Number(m.charge)||1));
        if(!heldAllows(p,kind)){acFlag(p,'item','shoot '+kind+' held='+heldKey(p));break}
        const gap=kind==='bow'?220:kind==='fireball'?900:kind==='snowball'?300:TNT_KEYS.has(kind)?650:999999;
        if(!allow(p,'shoot_'+kind,gap)){acFlag(p,'projectile',kind);break}bc(R,{t:'anim',id:p.id,k:'attack'});
        if(kind==='bow'){if(p.inv.bow<1||p.inv.arrow<1)break;p.inv.arrow--;spawnProjectile(R,p,'arrow',m.yaw,m.pitch,22+22*charge,charge);pinv(p)}
        else if(kind==='fireball'){if(p.inv.fireball<1)break;p.inv.fireball--;spawnProjectile(R,p,'fireball',m.yaw,m.pitch,21,1);pinv(p)}
        else if(kind==='snowball'){if(p.inv.snowball<1)break;p.inv.snowball--;spawnProjectile(R,p,'snowball',m.yaw,m.pitch,26,1);pinv(p)}
        else if(TNT_KEYS.has(kind)){if((p.inv[kind]||0)<1)break;p.inv[kind]--;spawnProjectile(R,p,kind,m.yaw,m.pitch,13.5,1);pinv(p)}
        break
      }
      case 'use': {`,
'authoritative projectiles');

server=rex(server,/      case 'use': \{[\s\S]*?\n      \}\n      case 'apple':/,
`      case 'use': {
        cancelSpawnProtection(p);if(!play)break;if(!allow(p,'use',300)){acFlag(p,'rate','use');break}
        const k=String(m.k||'');if(!heldAllows(p,k)){acFlag(p,'item','use '+k+' held='+heldKey(p));break}
        if(k==='pearl'&&p.inv.pearl>0&&Number.isFinite(m.yaw)&&Number.isFinite(m.pitch)){p.inv.pearl--;spawnProjectile(R,p,'pearl',m.yaw,m.pitch,24,1);pinv(p)}
        else if(k==='speedPotion'&&p.inv.speedPotion>0){p.inv.speedPotion--;p.fx.speed=45;pinv(p)}
        else if(k==='jumpPotion'&&p.inv.jumpPotion>0){p.inv.jumpPotion--;p.fx.jump=45;pinv(p)}
        else if(k==='invisPotion'&&p.inv.invisPotion>0){p.inv.invisPotion--;p.fx.invis=30;pinv(p)}
        else if(k==='magicMilk'&&p.inv.magicMilk>0){p.inv.magicMilk--;p.fx.milk=60;pinv(p);sfx(p,'buy')}
        else if(k==='bridgeEgg'&&p.inv.bridgeEgg>0&&Number.isFinite(m.yaw)&&Number.isFinite(m.pitch)){p.inv.bridgeEgg--;spawnProjectile(R,p,'bridgeEgg',m.yaw,m.pitch,21,1);pinv(p)}
        else if(k==='popupTower'&&p.inv.popupTower>0&&buildPopupTower(R,p,Math.floor(m.x),Math.floor(m.y),Math.floor(m.z))){p.inv.popupTower--;pinv(p);sfx(p,'place')}
        break
      }
      case 'apple':`,
'authoritative utilities');

server=once(server,
"      case 'apple': if (play && allow(p, 'apple', 250) && p.inv.apple > 0 && p.hp < 20) { p.inv.apple--; p.hp = Math.min(20, p.hp + 10); pinv(p); } break;",
"      case 'apple': if(play&&heldAllows(p,'apple')&&allow(p,'apple',250)&&p.inv.apple>0&&p.hp<20){p.inv.apple--;p.hp=Math.min(20,p.hp+10);pinv(p)}else if(play&&!heldAllows(p,'apple'))acFlag(p,'item','apple held='+heldKey(p));break;",
'authoritative apple');

// More drop accumulation on server = fewer objects/broadcasts in busy generators.
server=once(server,
"  let d=R.drops.find(e=>e.k===k&&Math.hypot(e.x-x,e.z-z)<1.2&&e.n<max);",
"  max=Math.max(max,128);let d=R.drops.find(e=>e.k===k&&Math.hypot(e.x-x,e.z-z)<2.0&&e.n<max);",
'drop accumulation');

// ---------------- CLIENT UX / DIAGNOSTICS / PERFORMANCE ----------------
game=once(game,
"function closeChest(){chestOpen=0;scr(null);requestGameLock()}",
"function closeChest(){if(chestOpen)send({t:'chestClose'});chestOpen=0;scr(null);requestGameLock()}",
'chest close sync');

game=once(game,
"case'netPong':lastNetMessageAt=Date.now();diag.ping=Math.max(0,Date.now()-(Number(m.at)||Date.now()));diag.serverBuffer=Number(m.buffer)||0;break;",
"case'netPong':lastNetMessageAt=Date.now();diag.ping=Math.max(0,Date.now()-(Number(m.at)||Date.now()));diag.serverBuffer=Number(m.buffer)||0;if(m.ac)diag.ac=m.ac;break;\ncase'ac':diag.ac=diag.ac||{};diag.ac.total=m.total||diag.ac.total||0;diag.ac.last=m.last||m.type||'';console.warn('[AC blocked]',m.type,m.last||'');break;",
'client ac diagnostics');

game=once(game,
"const diag={show:false,ping:0,fps:60,frames:0,lastFpsAt:performance.now(),resyncs:0,serverBuffer:0,qualityChanges:0};",
"const diag={show:false,ping:0,fps:60,frames:0,lastFpsAt:performance.now(),resyncs:0,serverBuffer:0,qualityChanges:0,ac:{total:0,last:''}};",
'diag ac state');

game=once(game,
"<span>Predições '+BRIDGE_PRED.size+' · Resyncs '+diag.resyncs+'</span><span>Chunks '+activeChunks.size+' · Drops '+DROP.size+' · Proj '+PROJ.size+'</span>'}",
"<span>Predições '+BRIDGE_PRED.size+' · Resyncs '+diag.resyncs+'</span><span>AC bloqueios '+((diag.ac&&diag.ac.total)||0)+(diag.ac&&diag.ac.last?' · '+diag.ac.last:'')+'</span><span>Chunks '+activeChunks.size+' · Drops '+DROP.size+' · Proj '+PROJ.size+'</span>'}",
'diag ac display');

game=once(game,
"case'buyResult':if(!m.ok){msg(m.text||'Compra não realizada.');sfx('blocked')}break;",
"case'buyResult':{const el=$('shop');el.classList.remove('purchase-ok','purchase-no');void el.offsetWidth;if(m.ok){el.classList.add('purchase-ok');tone(760,.055,'square',.03,120)}else{el.classList.add('purchase-no');msg(m.text||'Compra não realizada.');sfx('blocked')}setTimeout(()=>el.classList.remove('purchase-ok','purchase-no'),220);break}",
'shop purchase feedback');

game=once(game,
" html('shopWallet',`<span class=\"wallet iron\"><img src=\"${RI.iron}\"> ${inv.iron}</span><span class=\"wallet gold\"><img src=\"${RI.gold}\"> ${inv.gold}</span><span class=\"wallet dia\"><img src=\"${RI.dia}\"> ${inv.dia}</span><span class=\"wallet em\"><img src=\"${RI.em}\"> ${inv.em}</span>`);",
" html('shopWallet',`<b class=\"wallet-title\">VOCÊ TEM</b><span class=\"wallet iron\"><img src=\"${RI.iron}\"> ${inv.iron}</span><span class=\"wallet gold\"><img src=\"${RI.gold}\"> ${inv.gold}</span><span class=\"wallet dia\"><img src=\"${RI.dia}\"> ${inv.dia}</span><span class=\"wallet em\"><img src=\"${RI.em}\"> ${inv.em}</span>${shopCat==='Compra Rápida'?'<small class=\"quick-hint\">★ Favoritos: use a estrela dos itens para personalizar</small>':''}`);",
'shop wallet clarity');

game=once(game,
"function leaveToLobby(){clearReconnect();location.reload()}",
"function leaveToLobby(){clearReconnect();location.reload()}\nfunction replaySameRoom(){send({t:'replay'});$('endSub').textContent='Preparando nova partida na mesma sala...'}",
'replay client action');

game=once(game,
"case'reconnectFail':{reconnectFailCount++;",
"case'replay':over=0;started=0;clearRespawn();scr('lobby');break;\ncase'reconnectFail':{reconnectFailCount++;",
'replay client packet');

// Mobile quick item navigation buttons.
game=once(game,
"if(touchMode){\n const joy=$('joy'),kn=$('knob'),look=$('look');",
`if(touchMode){
 const joy=$('joy'),kn=$('knob'),look=$('look');
 const mobileStep=dir=>{for(let n=1;n<=SL.length;n++){const i=(cur+dir*n+SL.length)%SL.length,key=slotKey(i),ci=canonicalSlot(i),owned=ci===0||(ci===8?inv.bow>0:(inv[key]||0)>0);if(owned){pick(i);const el=$('bar').children[i];if(el&&el.scrollIntoView)el.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});break}}};
 $('prevItemBtn').ontouchstart=e=>{e.preventDefault();mobileStep(-1)};$('nextItemBtn').ontouchstart=e=>{e.preventDefault();mobileStep(1)};
`,
'mobile hotbar nav');

// Particle pooling.
game=once(game,
"const FX_GEO=new THREE.BoxGeometry(.15,.15,.15),FX_MAT=new Map(),PROJ=new Map();",
"const FX_GEO=new THREE.BoxGeometry(.15,.15,.15),FX_MAT=new Map(),PROJ=new Map(),PT_POOL=[];",
'particle pool state');

game=rex(game,/function fx\(x,y,z,c,n=8\)\{[^\n]*\}/,
`function fx(x,y,z,c,n=8){let mm=FX_MAT.get(c);if(!mm){mm=new THREE.MeshBasicMaterial({color:c});FX_MAT.set(c,mm)}const cap=lowEnd?Math.min(n,8):Math.min(n,20);for(let i=0;i<cap;i++){let m=PT_POOL.pop();if(!m){m=new THREE.Mesh(FX_GEO,mm);sc.add(m)}m.material=mm;m.visible=true;m.position.set(x,y,z);PT.push({m,vx:(Math.random()-.5)*8,vy:Math.random()*6,vz:(Math.random()-.5)*8,t:.6})}}`,
'particle pooling');

game=once(game,
"for(let i=PT.length;i--;){const p=PT[i];p.t-=dt;p.vy-=20*dt;p.m.position.x+=p.vx*dt;p.m.position.y+=p.vy*dt;p.m.position.z+=p.vz*dt;if(p.t<=0){sc.remove(p.m);PT.splice(i,1)}}",
"for(let i=PT.length;i--;){const p=PT[i];p.t-=dt;p.vy-=20*dt;p.m.position.x+=p.vx*dt;p.m.position.y+=p.vy*dt;p.m.position.z+=p.vz*dt;if(p.t<=0){p.m.visible=false;PT_POOL.push(p.m);PT.splice(i,1)}}",
'particle pool release');

// Drop pooling, instead of disposing/recreating every pickup.
game=once(game,"const DROP=new Map();","const DROP=new Map(),DROP_POOL=new Map();\nfunction acquireDrop(k){const pool=DROP_POOL.get(k)||[];if(pool.length){const m=pool.pop();m.visible=true;return m}return resourceModel(k,k==='iron'||k==='gold'?.82:.95)}\nfunction releaseDrop(k,m){m.visible=false;const pool=DROP_POOL.get(k)||[];if(pool.length<24)pool.push(m);else{sc.remove(m);m.traverse(x=>{if(x.geometry)x.geometry.dispose();if(x.material)x.material.dispose&&x.material.dispose()})}DROP_POOL.set(k,pool)}");

game=rex(game,/function syncDrops\(l\)\{[^\n]*\}/,
`function syncDrops(l){const seen=new Set();l.forEach(d=>{seen.add(d.id);let o=DROP.get(d.id);if(!o){const m=acquireDrop(d.k);if(!m.parent)sc.add(m);o={m,k:d.k,baseY:d.y,phase:(d.id%17)*.37};DROP.set(d.id,o)}o.baseY=d.y;o.m.position.set(d.x,d.y,d.z);o.n=d.n});DROP.forEach((o,id)=>{if(!seen.has(id)){releaseDrop(o.k,o.m);DROP.delete(id)}})}`,
'drop pooling');

// Quality-aware drop animation frequency and player render distance.
game=once(game,
"let dropVisualAt=0,dropVisualDisabled=false;function updateDropVisuals(now){if(dropVisualDisabled||now-dropVisualAt<33)return;",
"let dropVisualAt=0,dropVisualDisabled=false;function updateDropVisuals(now){const gap=lowEnd?66:qualityMode==='medium'?44:33;if(dropVisualDisabled||now-dropVisualAt<gap)return;",
'drop animation cadence');

game=once(game,
"PL.forEach(r=>{const p=r.m.position;p.x+=(r.tx-p.x)*lerpA;p.y+=(r.ty-p.y)*lerpA;p.z+=(r.tz-p.z)*lerpA;r.m.rotation.y=r.yaw;const rd=Math.hypot(p.x-pl.x,p.z-pl.z),renderRange=lowEnd?58:92;r.m.visible=!!r.al&&!r.iv&&rd<renderRange;",
"PL.forEach(r=>{const p=r.m.position;p.x+=(r.tx-p.x)*lerpA;p.y+=(r.ty-p.y)*lerpA;p.z+=(r.tz-p.z)*lerpA;r.m.rotation.y=r.yaw;const rd=Math.hypot(p.x-pl.x,p.z-pl.z),renderRange=lowEnd?48:qualityMode==='medium'?72:(diag.fps<45?68:96);r.m.visible=!!r.al&&!r.iv&&rd<renderRange;",
'adaptive player range');

// Render FPS targets: low=30, medium=45, high/auto healthy=60.
game=once(game,
"let last=performance.now(),ls=0,acc=0,lodAcc=0,bobPhase=0,bobX=0,bobY=0,targetFov=70;hud();",
"let last=performance.now(),ls=0,acc=0,lodAcc=0,bobPhase=0,bobX=0,bobY=0,targetFov=70,lastRenderAt=0;hud();",
'render target state');

game=once(game,
"try{R.render(sc,cam)}catch(err){if(!window.__renderErr){window.__renderErr=1;console.error('Render recuperável',err)}}}",
"const targetRenderFps=lowEnd?30:qualityMode==='medium'?45:60;if(now-lastRenderAt>=1000/targetRenderFps-1){lastRenderAt=now;try{R.render(sc,cam)}catch(err){if(!window.__renderErr){window.__renderErr=1;console.error('Render recuperável',err)}}}}",
'render fps target');

// ---------------- HTML / CSS ----------------
index=once(index,
"<div id=\"mobile\"><div id=\"joy\"><div id=\"knob\"></div></div><div id=\"look\"></div><button class=\"mb\" id=\"jumpBtn\">PULAR</button><button class=\"mb\" id=\"actBtn\">ATACAR</button><button class=\"mb\" id=\"useBtn\">USAR</button><button class=\"mb\" id=\"placeBtn\">COLOCAR</button><button class=\"mb settings-btn\" id=\"mobileSettingsBtn\">⚙</button>",
"<div id=\"mobile\"><div id=\"joy\"><div id=\"knob\"></div></div><div id=\"look\"></div><button class=\"mb\" id=\"jumpBtn\">PULAR</button><button class=\"mb\" id=\"actBtn\">ATACAR</button><button class=\"mb\" id=\"useBtn\">USAR</button><button class=\"mb\" id=\"placeBtn\">COLOCAR</button><button class=\"mb hotbar-nav\" id=\"prevItemBtn\">◀</button><button class=\"mb hotbar-nav\" id=\"nextItemBtn\">▶</button><button class=\"mb settings-btn\" id=\"mobileSettingsBtn\">⚙</button>",
'mobile nav html');

index=once(index,
"<div class=\"ov\" id=\"end\"><div class=\"end-panel\"><h1 id=\"et\"></h1><p id=\"endSub\"></p><div id=\"endStats\"></div><button onclick=\"leaveToLobby()\">Voltar ao lobby / nova sala</button></div></div>",
"<div class=\"ov\" id=\"end\"><div class=\"end-panel\"><h1 id=\"et\"></h1><p id=\"endSub\"></p><div id=\"endStats\"></div><div class=\"end-actions\"><button onclick=\"replaySameRoom()\">Jogar novamente</button><button onclick=\"leaveToLobby()\">Sair da sala</button></div></div></div>",
'replay button html');

index=index.replace(/href=\"\/style\.css(?:\?v=[^\"]+)?\"/,'href="/style.css?v=security-polish-20261005"');
index=index.replace(/src=\"\/game\.js\?v=[^\"]+\"/,'src="/game.js?v=security-polish-20261005"');

style+=`\n/* Security & Multiplayer Polish Pack */\n.wallet-title{color:#fff;font-size:8px;margin-right:4px}.quick-hint{width:100%;text-align:right;color:#e7e7e7;font-size:7px}.purchase-ok>div{animation:shopOk .18s ease-out}.purchase-no>div{animation:shopNo .18s ease-out}@keyframes shopOk{50%{box-shadow:0 0 0 4px #55ff8899,0 14px 50px #0008}}@keyframes shopNo{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}.end-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.end-actions button{text-align:center}.hotbar-nav{display:none!important}\n/* HUD cleanup: kill feed stays below scoreboard; notifications remain clear */\n#killFeed{top:170px;right:12px;width:min(340px,36vw)}#msg{top:19%}\n@media (pointer:coarse),(max-width:800px){\n #killFeed{top:132px;right:6px;width:48vw}\n #bar{bottom:6px;width:56vw;max-width:56vw;overflow-x:auto;touch-action:pan-x;scroll-snap-type:x proximity;padding:3px 22px}.s{scroll-snap-align:center}.s.on{transform:translateY(-3px) scale(1.10)}\n .hotbar-nav{display:block!important;width:34px!important;height:34px!important;padding:0!important;text-align:center!important;bottom:10px!important;z-index:18!important}.hotbar-nav#prevItemBtn{left:18%!important}.hotbar-nav#nextItemBtn{right:18%!important}\n #res{left:6px;bottom:150px;min-width:108px;background:rgba(0,0,0,.42)}#hp{bottom:58px;min-width:210px}.effectline{font-size:7px;max-width:70vw;margin:auto}.hearts{font-size:16px}\n #chatLog{width:58vw!important}.end-actions{grid-template-columns:1fr}\n}\n`;

fs.writeFileSync('server.js',server);fs.writeFileSync('public/game.js',game);fs.writeFileSync('public/style.css',style);fs.writeFileSync('public/index.html',index);
console.log('Security & Multiplayer Polish Pack applied');
