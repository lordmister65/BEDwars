from pathlib import Path
import re

ROOT=Path('.')

def once(text, old, new, label):
    n=text.count(old)
    if n!=1:
        raise RuntimeError(f'{label}: expected 1 match, found {n}')
    return text.replace(old,new,1)

def rex(text, pattern, repl, label, flags=0):
    out,n=re.subn(pattern,repl,text,count=1,flags=flags)
    if n!=1:
        raise RuntimeError(f'{label}: expected 1 regex match, found {n}')
    return out

server=(ROOT/'server.js').read_text()
game=(ROOT/'public/game.js').read_text()
shared=(ROOT/'public/shared.js').read_text()
index=(ROOT/'public/index.html').read_text()
style=(ROOT/'public/style.css').read_text()

# ---------------- shared shop ----------------
shared=once(shared,
"['Bússola Rastreadora','em',2,'inv','compass',1,'Utilidades','🧭'],['Afiação','dia',4,'up','sharp',1,'Melhorias','⚔️']",
"['Bússola Rastreadora','em',2,'inv','compass',1,'Utilidades','🧭'],['Magic Milk','gold',4,'inv','magicMilk',1,'Utilidades','🥛'],['Bridge Egg','em',3,'inv','bridgeEgg',1,'Utilidades','🥚',{'4v4':2}],['Pop-up Tower','iron',24,'inv','popupTower',1,'Utilidades','🏰'],['Knockback Stick','gold',5,'inv','knockbackStick',1,'Utilidades','🪄'],['Afiação','dia',4,'up','sharp',1,'Melhorias','⚔️']",
'utility shop items')
shared=once(shared,
"['Armadilha de Fadiga','dia',1,'up','trapMiner',1,'Melhorias','⛏️'],['Armadilha de Lentidão','dia',1,'up','trapSlow',1,'Melhorias','🐌'],['Contra-Ataque','dia',2,'up','trapCounter',1,'Melhorias','⚡']",
"['Armadilha de Fadiga','dia',1,'trap','trapMiner',1,'Melhorias','⛏️'],['É uma Armadilha!','dia',1,'trap','trapBlind',1,'Melhorias','🌑'],['Alarme / Revelação','dia',1,'trap','trapAlarm',1,'Melhorias','🔔'],['Contra-Ataque','dia',1,'trap','trapCounter',1,'Melhorias','⚡']",
'trap shop queue')

# ---------------- server inventory/state ----------------
server=once(server,
"const ADMIN_ITEMS=new Set(['wool','planks','endstone','glass','obsidian','tnt','tntImpulse','tntSlow','tntDamage','apple','bow','arrow','fireball','snowball','pearl','speedPotion','jumpPotion','invisPotion','iron','gold','dia','em']);",
"const ADMIN_ITEMS=new Set(['wool','planks','endstone','glass','obsidian','tnt','tntImpulse','tntSlow','tntDamage','apple','bow','arrow','fireball','snowball','pearl','speedPotion','jumpPotion','invisPotion','compass','magicMilk','bridgeEgg','popupTower','knockbackStick','iron','gold','dia','em']);",
'admin utility keys')
server=once(server,
"const CHEST_KEYS=['iron','gold','dia','em','wool','planks','endstone','glass','obsidian','tnt','tntImpulse','tntSlow','tntDamage','apple','bow','arrow','fireball','snowball','pearl','speedPotion','jumpPotion','invisPotion','compass'];",
"const CHEST_KEYS=['iron','gold','dia','em','wool','planks','endstone','glass','obsidian','tnt','tntImpulse','tntSlow','tntDamage','apple','bow','arrow','fireball','snowball','pearl','speedPotion','jumpPotion','invisPotion','compass','magicMilk','bridgeEgg','popupTower','knockbackStick'];",
'chest utility keys')
server=once(server,
"bed: [0, 0, 0, 0], teamChest:[emptyChest(),emptyChest(),emptyChest(),emptyChest()], trapAt:[0,0,0,0], st: 'lobby'",
"bed: [0, 0, 0, 0], teamChest:[emptyChest(),emptyChest(),emptyChest(),emptyChest()], traps:[[],[],[],[]], trapInside:[new Set(),new Set(),new Set(),new Set()], st: 'lobby'",
'room trap queue state')
server=once(server,
"rl: Object.create(null), breaking: null, enderChest:emptyChest(), tools: { pick:0, axe:0, shears:0 }, fx:{speed:0,jump:0,invis:0,slow:0,fatigue:0}, up: { sharp:0, prot:0, forge:0, haste:0, regen:0, trap:0, trapMiner:0, trapSlow:0, trapCounter:0 }, inv: { wool:24, planks:0, endstone:0, glass:0, obsidian:0, tnt:0, tntImpulse:0, tntSlow:0, tntDamage:0, apple:0, bow:0, arrow:0, fireball:0, snowball:0, pearl:0, speedPotion:0, jumpPotion:0, invisPotion:0, compass:0, iron:0, gold:0, dia:0, em:0 } });",
"rl: Object.create(null), breaking: null, trapQueue:[], enderChest:emptyChest(), tools: { pick:0, axe:0, shears:0 }, fx:{speed:0,jump:0,invis:0,slow:0,fatigue:0,blind:0,milk:0}, up: { sharp:0, prot:0, forge:0, haste:0, regen:0, trap:0, trapMiner:0, trapSlow:0, trapCounter:0 }, inv: { wool:24, planks:0, endstone:0, glass:0, obsidian:0, tnt:0, tntImpulse:0, tntSlow:0, tntDamage:0, apple:0, bow:0, arrow:0, fireball:0, snowball:0, pearl:0, speedPotion:0, jumpPotion:0, invisPotion:0, compass:0, magicMilk:0, bridgeEgg:0, popupTower:0, knockbackStick:0, iron:0, gold:0, dia:0, em:0 } });",
'player utility state')
server=once(server,
"const pinv = p => tx(p, { t: 'inv', i: p.inv, sw: p.sw, ar: p.ar, up: p.up, tools:p.tools, fx:p.fx });",
"const pinv = p => tx(p, { t: 'inv', i: p.inv, sw: p.sw, ar: p.ar, up: p.up, tools:p.tools, fx:p.fx, traps:p.trapQueue||[] });",
'inventory trap payload')
server=once(server,
"function spawn(p) { const sp=p.roomSpawn||[S.IS[p.team][0]+.5,S.BASE_Y+2.02,S.IS[p.team][1]+.5];p.x=sp[0];p.y=sp[1];p.z=sp[2]; p.px=p.x;p.py=p.y;p.pz=p.z; p.hp = 20; p.alive = 1; p.breaking=null; p.lt = Date.now(); tx(p, { t: 'tp', x: p.x, y: p.y, z: p.z }); }",
"function spawn(p) { const sp=p.roomSpawn||[S.IS[p.team][0]+.5,S.BASE_Y+2.02,S.IS[p.team][1]+.5];p.x=sp[0];p.y=sp[1];p.z=sp[2]; p.px=p.x;p.py=p.y;p.pz=p.z; p.hp = 20; p.alive = 1; p.breaking=null;p.fx.blind=0;p.fx.fatigue=0;p.fx.slow=0; p.lt = Date.now(); tx(p, { t: 'tp', x: p.x, y: p.y, z: p.z }); }",
'spawn clears negative trap fx')
server=once(server,
"q.alive = 0; q.hp = 0; q.rt = 5; q.breaking=null; q.tools.pick=Math.max(0,q.tools.pick-1); q.tools.axe=Math.max(0,q.tools.axe-1); pinv(q); sfx(q,'death');",
"q.alive = 0; q.hp = 0; q.rt = 5; q.breaking=null;q.fx.blind=0;q.fx.fatigue=0;q.fx.slow=0;q.fx.milk=0; q.tools.pick=Math.max(0,q.tools.pick-1); q.tools.axe=Math.max(0,q.tools.axe-1); pinv(q); sfx(q,'death');",
'death clears utility fx')

# ---------------- complete trap queue ----------------
old_traps=re.search(r"function teamPlayers\(R,t\)\{[^\n]+\}\nfunction setTeamUp\(R,t,key,value\)\{[^\n]+\}\nfunction triggerTeamTraps\(R\)\{[^\n]+\}",server)
if not old_traps:
    raise RuntimeError('trap helpers block not found')
new_traps=r'''function teamPlayers(R,t){return [...R.ps.values()].filter(q=>q.team===t&&!q.admin)}
function setTeamUp(R,t,key,value){teamPlayers(R,t).forEach(q=>{q.up[key]=value;pinv(q)})}
const TRAP_NAME={trapMiner:'Fadiga de Mineração',trapBlind:'É uma Armadilha!',trapAlarm:'Alarme / Revelação',trapCounter:'Contra-Ataque'};
function syncTeamTraps(R,t){const queue=[...(R.traps?.[t]||[])];teamPlayers(R,t).forEach(q=>{q.trapQueue=queue;pinv(q)})}
function teamTrapAlert(R,t,text,enemyTeam=-1){teamPlayers(R,t).forEach(q=>tx(q,{t:'feed',text,aTeam:t,bTeam:enemyTeam,kind:'trap'}))}
function triggerTeamTraps(R){
  if(!R.traps)return;
  for(const t of modeCfg(R).activeTeams){
    const defenders=teamPlayers(R,t),anchor=defenders.find(q=>q.alive)||defenders[0];
    if(!anchor||!R.bed[t])continue;
    const b=anchor.roomSpawn||[S.IS[t][0]+.5,S.BASE_Y+2.02,S.IS[t][1]+.5];
    const inside=new Set([...R.ps.values()].filter(q=>q.alive&&!q.out&&!q.admin&&q.team!==t&&Math.hypot(q.x-b[0],q.z-b[2])<20).map(q=>q.id));
    const prev=R.trapInside[t]||new Set(),enemy=[...inside].map(id=>R.ps.get(id)).find(q=>q&&!prev.has(q.id));
    R.trapInside[t]=inside;
    if(!enemy||!R.traps[t].length)continue;
    const trap=R.traps[t].shift(),milk=(enemy.fx.milk||0)>0,name=TRAP_NAME[trap]||'Armadilha';
    syncTeamTraps(R,t);
    teamTrapAlert(R,t,`⚠ ${enemy.name} ativou ${name}!`,enemy.team);
    if(milk){teamTrapAlert(R,t,`🥛 Magic Milk neutralizou o efeito da armadilha, mas o invasor foi detectado.`,enemy.team);continue}
    if(trap==='trapMiner')enemy.fx.fatigue=Math.max(enemy.fx.fatigue||0,10);
    else if(trap==='trapBlind'){enemy.fx.blind=Math.max(enemy.fx.blind||0,8);enemy.fx.slow=Math.max(enemy.fx.slow||0,8)}
    else if(trap==='trapAlarm')enemy.fx.invis=0;
    else if(trap==='trapCounter')defenders.filter(nearOwnBase).forEach(q=>{q.fx.speed=Math.max(q.fx.speed||0,10);q.fx.jump=Math.max(q.fx.jump||0,10);pinv(q)});
    pinv(enemy);
  }
}'''
server=server[:old_traps.start()]+new_traps+server[old_traps.end():]

# ---------------- bridge egg + pop-up tower ----------------
server=once(server,
"function projectileImpact(R,pr,x,y,z,target){",
r'''function bridgeEggTrail(R,pr,nx,ny,nz){
  const L=Math.hypot(nx-pr.x,ny-pr.y,nz-pr.z),steps=Math.max(1,Math.ceil(L/.32));
  for(let i=1;i<=steps;i++){
    const a=i/steps,x=Math.floor(pr.x+(nx-pr.x)*a),y=Math.floor(pr.y+(ny-pr.y)*a-1.45),z=Math.floor(pr.z+(nz-pr.z)*a);
    if(!S.inXZ(x,z)||y<1||y>=S.H-2||get(R,x,y,z))continue;
    if([...R.ps.values()].some(q=>playerHitsBlock(q,x,y,z)))continue;
    setb(R,x,y,z,pr.team+1,1);
  }
}
function buildPopupTower(R,p,x,y,z){
  if(![x,y,z].every(Number.isInteger)||!S.inXZ(x,z)||y<1||y>=S.H-6||Math.hypot(x+.5-p.x,y+.5-p.y,z+.5-p.z)>6.5||!get(R,x,y-1,z))return false;
  const blocks=[],dx=p.x-(x+.5),dz=p.z-(z+.5),doorAxis=Math.abs(dx)>Math.abs(dz)?'x':'z',doorSign=doorAxis==='x'?(dx>=0?1:-1):(dz>=0?1:-1);
  for(let h=0;h<4;h++)for(let ox=-2;ox<=2;ox++)for(let oz=-2;oz<=2;oz++){
    if(Math.abs(ox)!==2&&Math.abs(oz)!==2)continue;
    const door=doorAxis==='x'?ox===2*doorSign&&oz===0:oz===2*doorSign&&ox===0;
    if(door&&h<2)continue;blocks.push([x+ox,y+h,z+oz]);
  }
  for(let ox=-2;ox<=2;ox++)for(let oz=-2;oz<=2;oz++)if((Math.abs(ox)===2||Math.abs(oz)===2)&&((ox+oz)&1)===0)blocks.push([x+ox,y+4,z+oz]);
  [[-1,-1,0],[0,-1,1],[0,0,2],[1,0,3]].forEach(([ox,oz,h])=>blocks.push([x+ox,y+h,z+oz]));
  const free=blocks.filter(([X,Y,Z])=>!get(R,X,Y,Z)&&![...R.ps.values()].some(q=>playerHitsBlock(q,X,Y,Z)));
  if(free.length<18)return false;
  free.forEach(([X,Y,Z])=>setb(R,X,Y,Z,p.team+1,1));return true;
}
function projectileImpact(R,pr,x,y,z,target){''',
'bridge and tower helpers')
server=once(server,
"    const grav=pr.k==='fireball'?0:pr.k==='arrow'?7.2:pr.k==='pearl'?6.2:pr.k.startsWith('tnt')?9.2:7.5;",
"    const grav=pr.k==='fireball'?0:pr.k==='bridgeEgg'?1.8:pr.k==='arrow'?7.2:pr.k==='pearl'?6.2:pr.k.startsWith('tnt')?9.2:7.5;",
'bridge egg gravity')
server=once(server,
"    const nx=pr.x+pr.vx*dt,ny=pr.y+pr.vy*dt,nz=pr.z+pr.vz*dt;\n    let target=segmentHitPlayer(R,pr,nx,ny,nz),block=segmentHitsBlock(R,pr.x,pr.y,pr.z,nx,ny,nz);",
"    const nx=pr.x+pr.vx*dt,ny=pr.y+pr.vy*dt,nz=pr.z+pr.vz*dt;\n    if(pr.k==='bridgeEgg')bridgeEggTrail(R,pr,nx,ny,nz);\n    let target=pr.k==='bridgeEgg'?null:segmentHitPlayer(R,pr,nx,ny,nz),block=segmentHitsBlock(R,pr.x,pr.y,pr.z,nx,ny,nz);",
'bridge egg trail tick')
server=once(server,
"    const maxAge=pr.k==='arrow'?14:pr.k==='pearl'?10:pr.k==='snowball'?9:pr.k.startsWith('tnt')?1.35:8;",
"    const maxAge=pr.k==='arrow'?14:pr.k==='pearl'?10:pr.k==='bridgeEgg'?5:pr.k==='snowball'?9:pr.k.startsWith('tnt')?1.35:8;",
'bridge egg lifetime')

# reconnect trap queue
server=once(server,
"up:p.up,fx:p.fx,admin:p.admin?1:0",
"up:p.up,fx:p.fx,traps:p.trapQueue||[],admin:p.admin?1:0",
'reconnect trap queue')

# match start resets queue
server=once(server,
"const gg=S.gen(R.mapId,false);R.B=gg.B;R.BD=gg.BD;R.SHOP=gg.SHOP;R.GEN=gg.GEN;R.SPAWN=gg.SPAWN;R.DIGEN=gg.DIGEN;R.EMGEN=gg.EMGEN;R.activeChunks=gg.activeChunks;R.pf=new Uint8Array(gg.B.length);R.ed.clear();R.q=[];R.drops=[];R.tnt=[];R.projectiles=[];\n        R.st = 'play';",
"const gg=S.gen(R.mapId,false);R.B=gg.B;R.BD=gg.BD;R.SHOP=gg.SHOP;R.GEN=gg.GEN;R.SPAWN=gg.SPAWN;R.DIGEN=gg.DIGEN;R.EMGEN=gg.EMGEN;R.activeChunks=gg.activeChunks;R.pf=new Uint8Array(gg.B.length);R.ed.clear();R.q=[];R.drops=[];R.tnt=[];R.projectiles=[];R.traps=[[],[],[],[]];R.trapInside=[new Set(),new Set(),new Set(),new Set()];R.ps.forEach(q=>q.trapQueue=[]);\n        R.st = 'play';",
'reset trap queue on start')

# held slot range
server=once(server,
"if (Number.isInteger(m.s) && m.s >= 0 && m.s <= 15) p.held = m.s;",
"if (Number.isInteger(m.s) && m.s >= 0 && m.s <= 19) p.held = m.s;",
'held range')

# knockback stick combat
server=once(server,
"const cr = p.dy < -1;\n        hurt(R, q, (DMG[p.sw] + 2 * p.up.sharp) * (cr ? 1.5 : 1), d[0], d[2], p, cr);",
"const stick=m.k==='knockbackStick'&&(p.inv.knockbackStick||0)>0,cr = !stick&&p.dy < -1,kb=stick?1.9:1,damage=stick?1.5:(DMG[p.sw] + 2 * p.up.sharp) * (cr ? 1.5 : 1);\n        hurt(R, q, damage, d[0]*kb, d[2]*kb, p, cr);",
'knockback stick combat')

# trap-aware dynamic buy
server=once(server,
"const [name,currency,basePrice,type,key,value]=item,modePrices=item[8]||null,price=modePrices&&modePrices[R.modeId]!=null?modePrices[R.modeId]:basePrice;\n        if((p.inv[currency]||0)<price){buyFail(p,'no_resource',`Recursos insuficientes para ${name}.`);break}\n        let ok=1,teamUpgrade=false;",
"const [name,currency,basePrice,type,key,value]=item,modePrices=item[8]||null,trapQueue=R.traps[p.team]||[],price=type==='trap'?([1,2,4][trapQueue.length]??4):(modePrices&&modePrices[R.modeId]!=null?modePrices[R.modeId]:basePrice);\n        if(type==='trap'&&(!R.bed[p.team]||trapQueue.length>=3)){buyFail(p,'trap_full',!R.bed[p.team]?'Seu time não possui mais cama.':'A fila de traps está cheia (3/3).');break}\n        if((p.inv[currency]||0)<price){buyFail(p,'no_resource',`Recursos insuficientes para ${name}.`);break}\n        let ok=1,teamUpgrade=false,trapBought=false;",
'dynamic trap buy price')
server=once(server,
"else if(type==='up'&&(p.up[key]||0)===value-1){setTeamUp(R,p.team,key,value);teamUpgrade=true}\n        else ok=0;",
"else if(type==='up'&&(p.up[key]||0)===value-1){setTeamUp(R,p.team,key,value);teamUpgrade=true}\n        else if(type==='trap'){trapQueue.push(key);p.trapQueue=[...trapQueue];trapBought=true}\n        else ok=0;",
'trap buy branch')
server=once(server,
"p.inv[currency]-=price;\n        if(!teamUpgrade)pinv(p);buyOk(p);sfx(p,'buy');",
"p.inv[currency]-=price;\n        if(trapBought)syncTeamTraps(R,p.team);else if(teamUpgrade)teamPlayers(R,p.team).forEach(pinv);else pinv(p);buyOk(p);sfx(p,'buy');",
'buy inventory resync')

# use new utility items
server=once(server,
"else if(k==='invisPotion'&&p.inv.invisPotion>0){p.inv.invisPotion--;p.fx.invis=30;pinv(p);}\n        break;",
"else if(k==='invisPotion'&&p.inv.invisPotion>0){p.inv.invisPotion--;p.fx.invis=30;pinv(p);}\n        else if(k==='magicMilk'&&p.inv.magicMilk>0){p.inv.magicMilk--;p.fx.milk=60;pinv(p);sfx(p,'buy');}\n        else if(k==='bridgeEgg'&&p.inv.bridgeEgg>0&&Number.isFinite(m.yaw)&&Number.isFinite(m.pitch)){p.inv.bridgeEgg--;spawnProjectile(R,p,'bridgeEgg',m.yaw,m.pitch,21,1);pinv(p);}\n        else if(k==='popupTower'&&p.inv.popupTower>0&&buildPopupTower(R,p,Math.floor(m.x),Math.floor(m.y),Math.floor(m.z))){p.inv.popupTower--;pinv(p);sfx(p,'place');}\n        break;",
'utility use cases')

# effect ticks
server=once(server,
"p.fx.speed=Math.max(0,p.fx.speed-dt);p.fx.jump=Math.max(0,p.fx.jump-dt);p.fx.invis=Math.max(0,p.fx.invis-dt);p.fx.slow=Math.max(0,(p.fx.slow||0)-dt);p.fx.fatigue=Math.max(0,(p.fx.fatigue||0)-dt);",
"p.fx.speed=Math.max(0,p.fx.speed-dt);p.fx.jump=Math.max(0,p.fx.jump-dt);p.fx.invis=Math.max(0,p.fx.invis-dt);p.fx.slow=Math.max(0,(p.fx.slow||0)-dt);p.fx.fatigue=Math.max(0,(p.fx.fatigue||0)-dt);p.fx.blind=Math.max(0,(p.fx.blind||0)-dt);p.fx.milk=Math.max(0,(p.fx.milk||0)-dt);",
'utility effect tick')

# ---------------- client hotbar + utility state ----------------
game=once(game,
"const K={},SL=['Espada','Lã','Tábuas','End Stone','Vidro','Obsidiana','TNT','Maçã','Arco','B. Fogo','B. Neve','Pérola','Veloc.','Salto','Invis.','Bússola'],KY=[0,'wool','planks','endstone','glass','obsidian','tnt','apple','bow','fireball','snowball','pearl','speedPotion','jumpPotion','invisPotion','compass'],SC=['#ccc','#3d6fe0','#b58a4e','#e8dfb0','#ddecff','#2c2036','#d83030','#ffd23d','#8b5a2b','#ff7a20','#eef6ff','#7b3fc6','#55ddff','#aaff55','#bbbbff','#d9b85f'],SN=['Punho','Pedra','Ferro','Diamante'],AN=['nenhuma','ferro','diamante'],CN={iron:'ferro',gold:'ouro',dia:'diamante',em:'esmeralda'};",
"const K={},SL=['Espada','Lã','Tábuas','End Stone','Vidro','Obsidiana','TNT','Maçã','Arco','B. Fogo','B. Neve','Pérola','Veloc.','Salto','Invis.','Bússola','Magic Milk','Bridge Egg','Pop-up Tower','Knockback Stick'],KY=[0,'wool','planks','endstone','glass','obsidian','tnt','apple','bow','fireball','snowball','pearl','speedPotion','jumpPotion','invisPotion','compass','magicMilk','bridgeEgg','popupTower','knockbackStick'],SC=['#ccc','#3d6fe0','#b58a4e','#e8dfb0','#ddecff','#2c2036','#d83030','#ffd23d','#8b5a2b','#ff7a20','#eef6ff','#7b3fc6','#55ddff','#aaff55','#bbbbff','#d9b85f','#f6f2df','#ffe07b','#d55353','#8b5a32'],SN=['Punho','Pedra','Ferro','Diamante'],AN=['nenhuma','ferro','diamante'],CN={iron:'ferro',gold:'ouro',dia:'diamante',em:'esmeralda'};",
'extended hotbar constants')
game=once(game,
"let inv={wool:0,planks:0,endstone:0,glass:0,obsidian:0,tnt:0,tntImpulse:0,tntSlow:0,tntDamage:0,apple:0,bow:0,arrow:0,fireball:0,snowball:0,pearl:0,speedPotion:0,jumpPotion:0,invisPotion:0,compass:0,iron:0,gold:0,dia:0,em:0},sw=0,ar=0,tools={pick:0,axe:0,shears:0},fxs={speed:0,jump:0,invis:0,slow:0,fatigue:0},up={sharp:0,prot:0,forge:0,haste:0,regen:0,trap:0,trapMiner:0,trapSlow:0,trapCounter:0},cur=1,started=0,over=0,shopOpen=0,chestOpen=0,chestKind='team',chestData={},bed=[1,1,1,1],INFO={},tg=null,ws;",
"let inv={wool:0,planks:0,endstone:0,glass:0,obsidian:0,tnt:0,tntImpulse:0,tntSlow:0,tntDamage:0,apple:0,bow:0,arrow:0,fireball:0,snowball:0,pearl:0,speedPotion:0,jumpPotion:0,invisPotion:0,compass:0,magicMilk:0,bridgeEgg:0,popupTower:0,knockbackStick:0,iron:0,gold:0,dia:0,em:0},sw=0,ar=0,tools={pick:0,axe:0,shears:0},fxs={speed:0,jump:0,invis:0,slow:0,fatigue:0,blind:0,milk:0},up={sharp:0,prot:0,forge:0,haste:0,regen:0,trap:0,trapMiner:0,trapSlow:0,trapCounter:0},trapQueue=[],cur=1,started=0,over=0,shopOpen=0,chestOpen=0,chestKind='team',chestData={},bed=[1,1,1,1],INFO={},tg=null,ws;",
'client utility state')
game=once(game,
"let myProfile=null,rankingData=[];const CHEST_KEYS=['iron','gold','dia','em','wool','planks','endstone','glass','obsidian','tnt','tntImpulse','tntSlow','tntDamage','apple','bow','arrow','fireball','snowball','pearl','speedPotion','jumpPotion','invisPotion','compass'];const CHEST_LABEL={iron:'Ferro',gold:'Ouro',dia:'Diamante',em:'Esmeralda',wool:'Lã',planks:'Tábuas',endstone:'End Stone',glass:'Vidro',obsidian:'Obsidiana',tnt:'TNT',tntImpulse:'TNT Impulso',tntSlow:'TNT Lentidão',tntDamage:'TNT Dano',apple:'Maçã',bow:'Arco',arrow:'Flechas',fireball:'Bola de Fogo',snowball:'Bola de Neve',pearl:'Pérola',speedPotion:'Velocidade',jumpPotion:'Salto',invisPotion:'Invisibilidade',compass:'Bússola'};",
"let myProfile=null,rankingData=[];const CHEST_KEYS=['iron','gold','dia','em','wool','planks','endstone','glass','obsidian','tnt','tntImpulse','tntSlow','tntDamage','apple','bow','arrow','fireball','snowball','pearl','speedPotion','jumpPotion','invisPotion','compass','magicMilk','bridgeEgg','popupTower','knockbackStick'];const CHEST_LABEL={iron:'Ferro',gold:'Ouro',dia:'Diamante',em:'Esmeralda',wool:'Lã',planks:'Tábuas',endstone:'End Stone',glass:'Vidro',obsidian:'Obsidiana',tnt:'TNT',tntImpulse:'TNT Impulso',tntSlow:'TNT Lentidão',tntDamage:'TNT Dano',apple:'Maçã',bow:'Arco',arrow:'Flechas',fireball:'Bola de Fogo',snowball:'Bola de Neve',pearl:'Pérola',speedPotion:'Velocidade',jumpPotion:'Salto',invisPotion:'Invisibilidade',compass:'Bússola',magicMilk:'Magic Milk',bridgeEgg:'Bridge Egg',popupTower:'Pop-up Tower',knockbackStick:'Knockback Stick'};",
'client chest utility keys')

# hotbar canonical order helpers
old_slots="""function slotKey(i){return i===6?activeTnt()[0]:KY[i]}
function slotName(i){return i===6?'TNT '+activeTnt()[1]:SL[i]}
function cycleTnt(){const owned=ownedTnts();if(owned.length<2)return;const key=activeTnt()[0],i=owned.findIndex(t=>t[0]===key),next=owned[(i+1)%owned.length];tntSel=TNT_TYPES.findIndex(t=>t[0]===next[0]);lastHeldSig='';refreshHeld();hud();msg('TNT: '+next[1])}"""
new_slots="""const HOTBAR_DEFAULT=SL.map((_,i)=>i);
let hotbarOrder=(()=>{try{const a=JSON.parse(localStorage.getItem('bwHotbarOrder')||'null');if(Array.isArray(a)&&a.length===SL.length&&new Set(a).size===SL.length&&a.every(x=>Number.isInteger(x)&&x>=0&&x<SL.length))return a}catch(e){}return [...HOTBAR_DEFAULT]})();
const canonicalSlot=i=>hotbarOrder[i]??i;
const canonicalKey=c=>c===6?activeTnt()[0]:KY[c];
function slotKey(i){return canonicalKey(canonicalSlot(i))}
function slotName(i){const c=canonicalSlot(i);return c===6?'TNT '+activeTnt()[1]:SL[c]}
function cycleTnt(){const owned=ownedTnts();if(owned.length<2)return;const key=activeTnt()[0],i=owned.findIndex(t=>t[0]===key),next=owned[(i+1)%owned.length];tntSel=TNT_TYPES.findIndex(t=>t[0]===next[0]);lastHeldSig='';refreshHeld();hud();msg('TNT: '+next[1])}"""
game=once(game,old_slots,new_slots,'hotbar canonical helpers')

# utility held models
game=once(game,
"function compassModel(){const g=new THREE.Group(),rim=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.07,16),hmat(0xb89343)),face=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.075,16),hmat(0xf1e2b5)),needle=box(.035,.025,.27,0xd84242);rim.rotation.x=face.rotation.x=Math.PI/2;needle.position.z=.01;needle.rotation.y=.35;g.add(rim,face,needle);g.rotation.z=-.18;return g}",
"function compassModel(){const g=new THREE.Group(),rim=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.07,16),hmat(0xb89343)),face=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.075,16),hmat(0xf1e2b5)),needle=box(.035,.025,.27,0xd84242);rim.rotation.x=face.rotation.x=Math.PI/2;needle.position.z=.01;needle.rotation.y=.35;g.add(rim,face,needle);g.rotation.z=-.18;return g}\nfunction milkModel(){const g=new THREE.Group(),cup=box(.26,.30,.22,0xece8df),milk=box(.21,.045,.17,0xffffff),rim=box(.30,.045,.26,0xc9c5bd);milk.position.y=.13;rim.position.y=.17;g.add(cup,milk,rim);g.rotation.z=.12;return g}\nfunction eggModel(){const g=new THREE.Group(),e=new THREE.Mesh(new THREE.SphereGeometry(.17,8,6),hmat(0xffe6a2));e.scale.set(.82,1.12,.82);g.add(e);return g}\nfunction popupTowerModel(){const g=new THREE.Group();for(const [x,y,z] of [[-.15,0,0],[.15,0,0],[0,.18,0],[0,.36,0]]){const b=box(.22,.22,.22,TC[me.team]||0x3d6fe0);b.position.set(x,y,z);g.add(b)}g.rotation.set(.1,.4,.05);return g}\nfunction stickModel(){const g=new THREE.Group(),s=box(.075,.62,.075,0x8b5a32);s.rotation.z=-.38;g.add(s);return g}",
'utility held models')

old_held=re.search(r"function heldModel\(slot,team=me\.team,swordLevel=sw\)\{[\s\S]*?\n\}\nfunction heldView",game)
if not old_held: raise RuntimeError('heldModel block not found')
new_held=r'''function heldModel(canonical,team=me.team,swordLevel=sw){
 const k=canonicalKey(canonical);
 if(canonical===0)return swordModel(swordLevel);
 if(['wool','planks','endstone','glass','obsidian'].includes(k))return heldBlockModel(k,team);
 if(['tnt','tntImpulse','tntSlow','tntDamage'].includes(k)){const t=TNT_TYPES.find(x=>x[0]===k);return tntModel(t?t[2]:0xd7352f)}
 if(k==='apple')return appleModel();if(k==='bow')return bowModel();if(k==='fireball')return fireballModel();if(k==='snowball')return snowballModel();if(k==='pearl')return pearlModel();if(k==='compass')return compassModel();
 if(k==='magicMilk')return milkModel();if(k==='bridgeEgg')return eggModel();if(k==='popupTower')return popupTowerModel();if(k==='knockbackStick')return stickModel();
 if(k==='speedPotion')return potionModel(0x55ddff);if(k==='jumpPotion')return potionModel(0xaaff55);if(k==='invisPotion')return potionModel(0xbbbbff);return new THREE.Group()
}
function heldView'''
game=game[:old_held.start()]+new_held+game[old_held.end():]
game=once(game,"if(slot===0&&!mining)","if(canonicalSlot(slot)===0&&!mining)",'held view sword canonical')
game=once(game,
"heldRoot.add(miningTool?toolModel(miningTool):heldModel(cur));applyHeldView();\n if(!miningTool)send({t:'held',s:cur});",
"const ci=canonicalSlot(cur);heldRoot.add(miningTool?toolModel(miningTool):heldModel(ci));applyHeldView();\n if(!miningTool)send({t:'held',s:ci});",
'refresh held canonical')

# projectile visual
game=once(game,
"pearl:new THREE.SphereGeometry(.15,7,7),tnt:new THREE.BoxGeometry(.32,.32,.32)",
"pearl:new THREE.SphereGeometry(.15,7,7),bridgeEgg:new THREE.SphereGeometry(.16,8,6),tnt:new THREE.BoxGeometry(.32,.32,.32)",
'bridge egg projectile geometry')
game=once(game,
"pearl:new THREE.MeshBasicMaterial({color:0x8b4bc7}),tnt:new THREE.MeshBasicMaterial({color:0xd7352f})",
"pearl:new THREE.MeshBasicMaterial({color:0x8b4bc7}),bridgeEgg:new THREE.MeshBasicMaterial({color:0xffe6a2}),tnt:new THREE.MeshBasicMaterial({color:0xd7352f})",
'bridge egg projectile material')

# hotbar editor UI helpers
marker="function drawChest(){"
editor=r'''let hotbarEditSelected=-1;
function saveHotbarOrder(){try{localStorage.setItem('bwHotbarOrder',JSON.stringify(hotbarOrder))}catch(e){}}
function drawHotbarEditor(){html('hotbarEditorGrid',hotbarOrder.map((ci,i)=>`<button class="hotbar-edit-slot${hotbarEditSelected===i?' selected':''}" onclick="editHotbarSlot(${i})"><b>${i<9?i+1:'↕'}</b><span>${SL[ci]}</span><small>${i<9?'tecla '+(i+1):'roda do mouse'}</small></button>`).join(''))}
function editHotbarSlot(i){if(hotbarEditSelected<0){hotbarEditSelected=i;drawHotbarEditor();return}if(hotbarEditSelected===i){hotbarEditSelected=-1;drawHotbarEditor();return}const a=hotbarEditSelected,t=hotbarOrder[a];hotbarOrder[a]=hotbarOrder[i];hotbarOrder[i]=t;hotbarEditSelected=-1;saveHotbarOrder();lastHeldSig='';drawHotbarEditor();refreshHeld();hud()}
function resetHotbarEditor(){hotbarOrder=[...HOTBAR_DEFAULT];hotbarEditSelected=-1;saveHotbarOrder();lastHeldSig='';drawHotbarEditor();refreshHeld();hud()}
function openHotbarEditor(){hotbarEditSelected=-1;drawHotbarEditor();scr('hotbarEditor')}
'''+marker
game=once(game,marker,editor,'hotbar editor functions')

# HUD reorder
game=rex(game,r"html\('bar',SL\.map\(\(name,i\)=>\{[\s\S]*?\}\)\.join\('\'\)\);",r'''html('bar',SL.map((_,i)=>{
 const ci=canonicalSlot(i),key=ci?slotKey(i):0;let q=ci?(inv[key]||0):'';if(ci===8)q=inv.bow?('F'+inv.arrow):0;
 const owned=ci===0||(ci===8?inv.bow>0:(q||0)>0),was=ownedState[i],reveal=owned&&was===false;ownedState[i]=owned;
 const label=slotName(i),clr=ci===6?(activeTnt()[2]||0xd7352f):SC[ci];
 return `<div class="s${i===cur?' on':''}${owned?'':' empty'}${reveal?' reveal':''}" title="${owned?label:''}" onclick="pick(${i})"><i style="background:${typeof clr==='number'?'#'+hex(clr):clr}"></i><em>${i<9?i+1:''}</em><b>${owned?q:''}</b><span class="slot-label">${ci===6&&owned?activeTnt()[1]:''}</span></div>`
}).join(''));''','hotbar hud reorder')
game=once(game,
"const pick=n=>{if(bowCharging){bowCharging=false;$('bowCharge').style.display='none'}const next=(n+SL.length)%SL.length;if(next===6&&cur===6){cycleTnt();return}cur=next;lastHeldSig='';refreshHeld();hud()};",
"const pick=n=>{if(bowCharging){bowCharging=false;$('bowCharge').style.display='none'}const next=(n+SL.length)%SL.length;if(next===cur&&canonicalSlot(next)===6){cycleTnt();return}cur=next;lastHeldSig='';refreshHeld();hud()};",
'pick canonical TNT')

# shop utility + trap queue
game=once(game,
"const QUICK_KEYS=['wool','planks','endstone','sw1','ar1','pick1','bow','arrow','tnt','fireball','apple','pearl','compass','speedPotion','jumpPotion'];",
"const QUICK_KEYS=['wool','planks','endstone','sw1','ar1','pick1','bow','arrow','tnt','fireball','apple','pearl','compass','magicMilk','bridgeEgg','popupTower','knockbackStick','speedPotion','jumpPotion'];\nconst TRAP_LABEL={trapMiner:'Fadiga de Mineração',trapBlind:'É uma Armadilha!',trapAlarm:'Alarme / Revelação',trapCounter:'Contra-Ataque'};",
'quick utilities and trap labels')
game=once(game,
"function shopPrice(s){const modes=s[8]||null;return modes&&modes[currentMode]!=null?modes[currentMode]:s[2]}",
"function shopPrice(s){if(s[3]==='trap')return [1,2,4][Math.min(2,trapQueue.length)]||4;const modes=s[8]||null;return modes&&modes[currentMode]!=null?modes[currentMode]:s[2]}",
'dynamic trap client price')
game=once(game,
"if(s[3]==='up')return (up[s[4]]||0)>=s[5];\n if(s[3]==='inv'&&s[4]==='bow')return (inv.bow||0)>0;",
"if(s[3]==='up')return (up[s[4]]||0)>=s[5];\n if(s[3]==='trap')return false;\n if(s[3]==='inv'&&['bow','compass','knockbackStick'].includes(s[4]))return (inv[s[4]]||0)>0;",
'shop owned trap utility')
game=rex(game,r"function shopSig\(\)\{return \[[^\n]+\]\.(?:join\('\|'\)|join\(\"\|\"\))\}","function shopSig(){return [shopCat,currentMode,inv.iron,inv.gold,inv.dia,inv.em,inv.bow,inv.compass,inv.magicMilk,inv.bridgeEgg,inv.popupTower,inv.knockbackStick,sw,ar,tools.pick,tools.axe,tools.shears,up.sharp,up.prot,up.forge,up.haste,up.regen,trapQueue.join(',')].join('|')}",'shop signature')
game=once(game,
"const s=o.s,price=shopPrice(s),currency=s[1],cant=(inv[currency]||0)<price,owned=shopOwned(s),icon=s[7]||'□';\n   const state=owned?'owned':cant?'cant':'';\n   const costText=owned?'COMPRADO':price+' '+(CN[currency]||currency);",
"const s=o.s,price=shopPrice(s),currency=s[1],trapFull=s[3]==='trap'&&trapQueue.length>=3,trapDead=s[3]==='trap'&&!bed[me.team],cant=(inv[currency]||0)<price||trapFull||trapDead,owned=shopOwned(s),icon=s[7]||'□';\n   const state=owned?'owned':cant?'cant':'';\n   const costText=trapFull?'FILA CHEIA':trapDead?'SEM CAMA':owned?'COMPRADO':price+' '+(CN[currency]||currency);",
'shop trap card state')
game=once(game,
"${cant&&!owned?'<span class=\"cant-mark\">✕</span>':''}\n   </button>`",
"${cant&&!owned?'<span class=\"cant-mark\">✕</span>':''}\n   </button>`",
'shop template preserved')
game=once(game,
"html('shopWallet',`<span class=\"wallet iron\"><img src=\"${RI.iron}\"> ${inv.iron}</span>",
"html('trapQueue',shopCat==='Melhorias'?`<div class=\"trap-queue\"><b>Fila de traps (${trapQueue.length}/3)</b>${trapQueue.length?trapQueue.map((k,i)=>`<span>${i+1}. ${TRAP_LABEL[k]||k}</span>`).join(''):'<span>Vazia</span>'}<small>Próxima: ${[1,2,4][Math.min(2,trapQueue.length)]||4} diamante(s)</small></div>`:'');\n html('shopWallet',`<span class=\"wallet iron\"><img src=\"${RI.iron}\"> ${inv.iron}</span>",
'trap queue UI')

# screen registry includes editor
game=once(game,
"const scr=n=>['menu','lobby','ov','shop','chest','profile','ranking','end'].forEach(k=>$(k).style.display=k===n?'flex':'none'),cv=R.domElement;",
"const scr=n=>['menu','lobby','ov','shop','chest','profile','ranking','hotbarEditor','end'].forEach(k=>$(k).style.display=k===n?'flex':'none'),cv=R.domElement;",
'screen registry editor')

# inventory messages/reconnect traps
game=once(game,
"up=m.up||up;fxs=m.fx||fxs;started=m.st==='play';",
"up=m.up||up;fxs=m.fx||fxs;trapQueue=m.traps||trapQueue;started=m.st==='play';",
'reconnect trap state')
game=once(game,
"case'inv':inv=m.i;sw=m.sw;ar=m.ar;up=m.up;tools=m.tools||tools;fxs=m.fx||fxs;hud();if(shopOpen)drawShop();if(chestOpen)drawChest();break;",
"case'inv':inv=m.i;sw=m.sw;ar=m.ar;up=m.up;tools=m.tools||tools;fxs=m.fx||fxs;trapQueue=m.traps||trapQueue;hud();if(shopOpen)drawShop();if(chestOpen)drawChest();break;",
'inventory trap state client')

# HUD effects
old_effect="${fxs.fatigue>0?'⛏ FADIGA ':''}</div>"
new_effect="${fxs.fatigue>0?'⛏ FADIGA ':''}${fxs.blind>0?'🌑 CEGUEIRA ':''}${fxs.milk>0?'🥛 MAGIC MILK ':''}</div>"
game=once(game,old_effect,new_effect,'utility HUD effects')

# hit selected utility
game=once(game,
"send({t:'hit',id:enemy,yaw:pl.yaw,pitch:pl.pitch});return",
"send({t:'hit',id:enemy,yaw:pl.yaw,pitch:pl.pitch,k:slotKey(cur)});return",
'knockback stick hit key')

# secondary utility handling
old_secondary=re.search(r"function secondary\(\)\{[^\n]+\}\naddEventListener\('mousedown'",game)
if not old_secondary: raise RuntimeError('secondary handler not found')
new_secondary=r'''function secondary(){if(!started||!me.alive)return;audioInit();useAnim=1;if(ADMIN.on&&ADMIN.build){const r=ray();if(r){const f=r.f||[0,1,0],x=r.h[0]+f[0],y=r.h[1]+f[1],z=r.h[2]+f[2];send({t:'adminPlace',x,y,z,b:ADMIN.block})}return}const k=slotKey(cur);if(k==='bow')return;if(k==='apple')send({t:'apple'});else if(k==='fireball'||k==='snowball'||['tnt','tntImpulse','tntSlow','tntDamage'].includes(k))send({t:'shoot',k,yaw:pl.yaw,pitch:pl.pitch});else if(['pearl','speedPotion','jumpPotion','invisPotion','magicMilk','bridgeEgg'].includes(k))send({t:'use',k,yaw:pl.yaw,pitch:pl.pitch});else if(k==='popupTower'){if(tg&&tg.p){const[x,y,z]=tg.p;send({t:'use',k,x,y,z})}else{msg('Mire no chão para colocar a Pop-up Tower');sfx('blocked')}}else if(PLACEABLE.has(k)&&tg&&tg.p){const[x,y,z]=tg.p;if(!safePlaceTarget(x,y,z)){sfx('blocked');msg('Não é possível colocar um bloco dentro do jogador');return}send({t:'place',k,x,y,z})}}
addEventListener('mousedown'''
game=game[:old_secondary.start()]+new_secondary+game[old_secondary.end():]

# local effects tick + blindness overlay
game=once(game,
"fxs.speed=Math.max(0,fxs.speed-dt);fxs.jump=Math.max(0,fxs.jump-dt);fxs.invis=Math.max(0,fxs.invis-dt);fxs.slow=Math.max(0,(fxs.slow||0)-dt);",
"fxs.speed=Math.max(0,fxs.speed-dt);fxs.jump=Math.max(0,fxs.jump-dt);fxs.invis=Math.max(0,fxs.invis-dt);fxs.slow=Math.max(0,(fxs.slow||0)-dt);fxs.fatigue=Math.max(0,(fxs.fatigue||0)-dt);fxs.blind=Math.max(0,(fxs.blind||0)-dt);fxs.milk=Math.max(0,(fxs.milk||0)-dt);$('blindOverlay').style.opacity=fxs.blind>0?String(Math.min(.82,.38+fxs.blind*.055)):'0';",
'client effect tick')

# ---------------- HTML ----------------
index=once(index,
"<div class=\"meta-actions\"><button onclick=\"openProfile()\">Meu Perfil / XP</button><button onclick=\"openRanking()\">Ranking</button></div>",
"<div class=\"meta-actions\"><button onclick=\"openProfile()\">Meu Perfil / XP</button><button onclick=\"openRanking()\">Ranking</button><button onclick=\"openHotbarEditor()\">Editor da Hotbar</button></div>",
'hotbar editor lobby button')
index=once(index,
"<div class=\"ov\" id=\"shop\"><div><h1>Loja de Itens</h1><div id=\"shopTabs\"></div><div id=\"sl\"></div><div class=\"shop-wallet\" id=\"shopWallet\"></div>",
"<div class=\"ov\" id=\"shop\"><div><h1>Loja de Itens</h1><div id=\"shopTabs\"></div><div id=\"sl\"></div><div id=\"trapQueue\"></div><div class=\"shop-wallet\" id=\"shopWallet\"></div>",
'shop trap queue container')
index=once(index,
"<div class=\"ov\" id=\"ranking\"><div class=\"meta-panel ranking-panel\"><h1>RANKING</h1><div id=\"rankingBody\"></div><button onclick=\"scr('lobby')\">Voltar</button></div></div>\n<div id=\"compassHud\"></div>",
"<div class=\"ov\" id=\"ranking\"><div class=\"meta-panel ranking-panel\"><h1>RANKING</h1><div id=\"rankingBody\"></div><button onclick=\"scr('lobby')\">Voltar</button></div></div>\n<div class=\"ov\" id=\"hotbarEditor\"><div class=\"meta-panel hotbar-editor-panel\"><h1>EDITOR DA HOTBAR</h1><p>Selecione um slot e depois outro para trocar de posição. Os 9 primeiros respondem às teclas 1–9.</p><div id=\"hotbarEditorGrid\"></div><div class=\"meta-actions\"><button onclick=\"resetHotbarEditor()\">Restaurar padrão</button><button onclick=\"scr('lobby')\">Concluir</button></div></div></div>\n<div id=\"blindOverlay\"></div><div id=\"compassHud\"></div>",
hotbar editor overlay')
index=re.sub(r'<script src="/game\.js\?v=[^"]+"></script>','<script src="/game.js?v=gameplay-pack-20261004"></script>',index,count=1)

# ---------------- CSS ----------------
if '/* gameplay pack hotbar traps */' not in style:
    style += r'''
/* gameplay pack hotbar traps */
#hotbarEditorGrid{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:8px;margin:14px 0}.hotbar-edit-slot{min-height:70px;display:flex;flex-direction:column;gap:4px;align-items:flex-start;justify-content:center}.hotbar-edit-slot b{font-size:18px;color:#ffd65a}.hotbar-edit-slot small{opacity:.65}.hotbar-edit-slot.selected{outline:3px solid #67d8ff;background:#17334a}.trap-queue{display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#111827;border:1px solid #ffffff22;border-radius:9px;padding:9px;margin:8px 0}.trap-queue span{background:#ffffff0d;padding:5px 8px;border-radius:7px}.trap-queue small{opacity:.7;margin-left:auto}#blindOverlay{position:fixed;inset:0;background:radial-gradient(circle at center,rgba(0,0,0,.25) 0%,rgba(0,0,0,.92) 72%,#000 100%);opacity:0;pointer-events:none;z-index:11;transition:opacity .18s}.hotbar-editor-panel{width:min(820px,94vw)}
@media(max-width:700px){#hotbarEditorGrid{grid-template-columns:repeat(2,minmax(120px,1fr))}.trap-queue small{width:100%;margin-left:0}}
'''

(ROOT/'server.js').write_text(server)
(ROOT/'public/game.js').write_text(game)
(ROOT/'public/shared.js').write_text(shared)
(ROOT/'public/index.html').write_text(index)
(ROOT/'public/style.css').write_text(style)
print('Gameplay pack migration applied')
