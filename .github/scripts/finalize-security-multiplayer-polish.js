const fs=require('fs');
function once(s,a,b,l){const n=s.split(a).length-1;if(n!==1)throw new Error(`${l}: ${n} matches`);return s.replace(a,b)}
let server=fs.readFileSync('server.js','utf8'),game=fs.readFileSync('public/game.js','utf8');

server=once(server,
"p.ac.total++;p.ac[type]=(p.ac[type]||0)+1;p.ac.last=type+(detail?': '+String(detail).slice(0,70):'');p.acAt=Date.now();",
"p.ac.total++;p.ac[type]=(p.ac[type]||0)+1;p.ac.last=type+(detail?': '+String(detail).replace(/[<>]/g,'').slice(0,70):'');p.acAt=Date.now();",
'ac log sanitize');

server=once(server,
"const g=S.gen(R.mapId,true);R.B=g.B;R.BD=g.BD;R.SHOP=g.SHOP;R.GEN=g.GEN;R.SPAWN=g.SPAWN;R.DIGEN=g.DIGEN;R.EMGEN=g.EMGEN;R.activeChunks=g.activeChunks;R.pf=new Uint8Array(g.B.length);R.ed.clear();R.q=[];R.drops=[];R.tnt=[];R.projectiles=[];R.blockSeq=0;R.final=null;R.st='lobby';R.t=0;R.suddenDeath=false;R.collapseAt=0;R.lastCollapse=0;",
"const g=S.gen(R.mapId,true);R.B=g.B;R.BD=g.BD;R.SHOP=g.SHOP;R.GEN=g.GEN;R.SPAWN=g.SPAWN;R.DIGEN=g.DIGEN;R.EMGEN=g.EMGEN;R.activeChunks=g.activeChunks;R.pf=new Uint8Array(g.B.length);R.ed.clear();R.q=[];R.drops=[];R.tnt=[];R.projectiles=[];R.blockSeq=0;R.final=null;R.st='lobby';R.t=0;R.suddenDeath=false;R.collapseAt=0;R.lastCollapse=0;R.teamChest=[emptyChest(),emptyChest(),emptyChest(),emptyChest()];R.genTier=[0,0,0,0];R.traps=[[],[],[],[]];R.trapInside=[new Set(),new Set(),new Set(),new Set()];R.g={base:[0,1,2,3].map(()=>({iron:0,gold:0,dia:0})),dia:S.DI.map(()=>({t:0})),em:{t:0}};",
'replay room reset');

server=once(server,
"R.ps.forEach((q,i)=>{q.out=0;q.spectator=false;q.alive=1;q.hp=20;q.breaking=null;q.openChestKind='';q.stats={kills:0,finalKills:0,bedsDestroyed:0,deaths:0,resourcesCollected:0};q.roomShop=R.SHOP[q.team];q.roomSpawn=R.SPAWN?.[q.team];spawnLobby(q,i);tx(q,{t:'replay'})});",
`R.ps.forEach((q,i)=>{
 q.out=0;q.spectator=false;q.alive=1;q.hp=20;q.breaking=null;q.openChestKind='';q.stats={kills:0,finalKills:0,bedsDestroyed:0,deaths:0,resourcesCollected:0};q.trapQueue=[];q.enderChest=emptyChest();
 if(!q.admin){q.sw=0;q.ar=0;q.tools={pick:0,axe:0,shears:0};q.fx={speed:0,jump:0,invis:0,slow:0,fatigue:0,blind:0,milk:0};q.up={sharp:0,prot:0,forge:0,haste:0,regen:0,trap:0,trapMiner:0,trapSlow:0,trapCounter:0};q.inv={wool:24,planks:0,endstone:0,glass:0,obsidian:0,tnt:0,tntImpulse:0,tntSlow:0,tntDamage:0,apple:0,bow:0,arrow:0,fireball:0,snowball:0,pearl:0,speedPotion:0,jumpPotion:0,invisPotion:0,compass:0,magicMilk:0,bridgeEgg:0,popupTower:0,knockbackStick:0,iron:0,gold:0,dia:0,em:0}}
 q.roomShop=R.SHOP[q.team];q.roomSpawn=R.SPAWN?.[q.team];spawnLobby(q,i);pinv(q);tx(q,{t:'replay'})
});`,
'replay player reset');

// Projectile mesh pooling.
game=once(game,
"const PJ_MAT={arrow:new THREE.MeshBasicMaterial({color:0x9b6a3c}),fireball:new THREE.MeshBasicMaterial({color:0xff6a00}),snowball:new THREE.MeshBasicMaterial({color:0xffffff}),pearl:new THREE.MeshBasicMaterial({color:0x8b4bc7}),bridgeEgg:new THREE.MeshBasicMaterial({color:0xffe6a2}),tnt:new THREE.MeshBasicMaterial({color:0xd7352f}),tntImpulse:new THREE.MeshBasicMaterial({color:0xe8f4ff}),tntSlow:new THREE.MeshBasicMaterial({color:0x4f9dff}),tntDamage:new THREE.MeshBasicMaterial({color:0xff3154})};",
"const PJ_MAT={arrow:new THREE.MeshBasicMaterial({color:0x9b6a3c}),fireball:new THREE.MeshBasicMaterial({color:0xff6a00}),snowball:new THREE.MeshBasicMaterial({color:0xffffff}),pearl:new THREE.MeshBasicMaterial({color:0x8b4bc7}),bridgeEgg:new THREE.MeshBasicMaterial({color:0xffe6a2}),tnt:new THREE.MeshBasicMaterial({color:0xd7352f}),tntImpulse:new THREE.MeshBasicMaterial({color:0xe8f4ff}),tntSlow:new THREE.MeshBasicMaterial({color:0x4f9dff}),tntDamage:new THREE.MeshBasicMaterial({color:0xff3154})};\nconst PJ_POOL=new Map();function acquireProjectileMesh(k){const a=PJ_POOL.get(k)||[];if(a.length){const m=a.pop();m.visible=true;return m}const m=new THREE.Mesh(PJ_GEO[k]||PJ_GEO.snowball,PJ_MAT[k]||PJ_MAT.snowball);sc.add(m);return m}function releaseProjectileMesh(k,m){m.visible=false;const a=PJ_POOL.get(k)||[];if(a.length<18)a.push(m);else sc.remove(m);PJ_POOL.set(k,a)}",
'projectile pool helpers');

game=once(game,
"function ensureProjectile(id,k,x,y,z){let p=PROJ.get(id);if(!p){const mesh=new THREE.Mesh(PJ_GEO[k]||PJ_GEO.snowball,PJ_MAT[k]||PJ_MAT.snowball);mesh.position.set(x,y,z);sc.add(mesh);p={m:mesh,k,tx:x,ty:y,tz:z,vx:0,vy:0,vz:0,snapAt:performance.now()};PROJ.set(id,p)}return p}",
"function ensureProjectile(id,k,x,y,z){let p=PROJ.get(id);if(!p){const mesh=acquireProjectileMesh(k);mesh.position.set(x,y,z);p={m:mesh,k,tx:x,ty:y,tz:z,vx:0,vy:0,vz:0,snapAt:performance.now()};PROJ.set(id,p)}return p}",
'projectile acquire');

game=once(game,
"function syncProjectiles(list){const seen=new Set();(list||[]).forEach(([id,k,x,y,z,vx=0,vy=0,vz=0])=>{seen.add(id);const p=ensureProjectile(id,k,x,y,z);p.tx=x;p.ty=y;p.tz=z;p.vx=vx;p.vy=vy;p.vz=vz;p.snapAt=performance.now()});PROJ.forEach((p,id)=>{if(!seen.has(id)){sc.remove(p.m);PROJ.delete(id)}})}",
"function syncProjectiles(list){const seen=new Set();(list||[]).forEach(([id,k,x,y,z,vx=0,vy=0,vz=0])=>{seen.add(id);const p=ensureProjectile(id,k,x,y,z);p.tx=x;p.ty=y;p.tz=z;p.vx=vx;p.vy=vy;p.vz=vz;p.snapAt=performance.now()});PROJ.forEach((p,id)=>{if(!seen.has(id)){releaseProjectileMesh(p.k,p.m);PROJ.delete(id)}})}",
'projectile release');

fs.writeFileSync('server.js',server);fs.writeFileSync('public/game.js',game);console.log('Final polish applied');
