const fs=require('fs');
function once(s,a,b,l){const n=s.split(a).length-1;if(n!==1)throw new Error(`${l}: ${n} matches`);return s.replace(a,b)}
function rex(s,r,b,l){if(!r.test(s))throw new Error(`${l}: no match`);r.lastIndex=0;return s.replace(r,b)}
let server=fs.readFileSync('server.js','utf8'),game=fs.readFileSync('public/game.js','utf8'),index=fs.readFileSync('public/index.html','utf8'),style=fs.readFileSync('public/style.css','utf8');

// ---------------- SERVER: combat / movement state ----------------
server=once(server,
"const COMBAT_HITBOX={radius:.36,height:1.80,feetPad:.05,historyMax:.60,meleePad:.055,meleeReach:3.80};",
"const COMBAT_HITBOX={radius:.36,height:1.80,feetPad:.05,historyMax:.60,meleePad:.055,meleeReach:3.80};\nconst GAMEPLAY={spawnProtect:1.25,hitCooldownMs:135,damageIFrames:.26,suddenDeathAt:12*60,collapseAt:15*60,collapseEvery:5};",
'gameplay constants');
server=once(server,
"token: crypto.randomBytes(18).toString('hex'), disconnected:false, disconnectedAt:0, reconnectDeadline:0, roomCode:'',",
"token: crypto.randomBytes(18).toString('hex'), disconnected:false, disconnectedAt:0, reconnectDeadline:0, roomCode:'', spectator:false,spawnProtect:0,hspeed:0,grounded:false,wasGrounded:false,fallVyMin:0,lastCombatAt:0,comboTarget:0,comboCount:0,",
'player gameplay state');
server=once(server,
"function spawn(p) { const sp=p.roomSpawn||[S.IS[p.team][0]+.5,S.BASE_Y+2.02,S.IS[p.team][1]+.5];p.x=sp[0];p.y=sp[1];p.z=sp[2]; p.px=p.x;p.py=p.y;p.pz=p.z; p.hp = 20; p.alive = 1; p.breaking=null;p.fx.blind=0;p.fx.fatigue=0;p.fx.slow=0; p.lt = Date.now(); tx(p, { t: 'tp', x: p.x, y: p.y, z: p.z }); }",
"function spawn(p) { const sp=p.roomSpawn||[S.IS[p.team][0]+.5,S.BASE_Y+2.02,S.IS[p.team][1]+.5];p.x=sp[0];p.y=sp[1];p.z=sp[2]; p.px=p.x;p.py=p.y;p.pz=p.z; p.hp = 20; p.alive = 1;p.spectator=false;p.spawnProtect=GAMEPLAY.spawnProtect;p.fallVyMin=0;p.grounded=false;p.wasGrounded=false; p.breaking=null;p.fx.blind=0;p.fx.fatigue=0;p.fx.slow=0; p.lt = Date.now(); tx(p, { t: 'tp', x: p.x, y: p.y, z: p.z, hard:1 }); }",
'spawn protection');

server=once(server,
"function die(R, q, cause='combat') {",
"function cancelSpawnProtection(p){if(p&&p.spawnProtect>0){p.spawnProtect=0;tx(p,{t:'spawnProtect',v:0})}}\nfunction die(R, q, cause='combat') {",
'cancel protection helper');
server=once(server,
"q.alive = 0; q.hp = 0; q.rt = 5; q.breaking=null;",
"q.alive = 0; q.hp = 0; q.rt = 5; q.breaking=null;q.spawnProtect=0;",
'death clears protection');
server=once(server,
"const final = !R.bed[q.team];",
"const final = !R.bed[q.team];if(final)q.spectator=true;",
'final spectator state');
server=once(server,
"const verb=cause==='void'?'derrubou':cause==='explosion'?'explodiu':'eliminou';",
"const verb=cause==='void'?'derrubou':cause==='explosion'?'explodiu':cause==='fall'?'fez cair':'eliminou';",
'death fall verb');
server=once(server,
"feed(R,`${q.name} morreu${cause==='void'?' no vazio':cause==='explosion'?' em uma explosão':''}`,-1,q.team,'death');",
"feed(R,`${q.name} morreu${cause==='void'?' no vazio':cause==='explosion'?' em uma explosão':cause==='fall'?' por queda':''}`,-1,q.team,'death');",
'fall death feed');

server=rex(server,/function hurt\(R, q, d, kx, kz, src, cr, cause='combat'\) \{[\s\S]*?\n\}/,
`function hurt(R,q,d,kx,kz,src,cr,cause='combat',kbVy=4.5){
  if(!q.alive||q.admin)return false;
  if(q.spawnProtect>0&&src&&src!==q)return false;
  if(q.ih>0)return false;
  q.ih=GAMEPLAY.damageIFrames;d*=Math.max(.2,1-.25*q.ar-.1*q.up.prot);const dealt=Math.max(0,d);q.hp-=dealt;
  if(src){q.src=src;q.st=R.t;q.lastCombatAt=R.t}
  const airborne=!q.grounded||q.dy>1.2,airMul=airborne?.84:1,comboMul=src&&src.comboCount>=2?.92:1;
  tx(q,{t:'kb',kx:kx*7*airMul*comboMul,kz:kz*7*airMul*comboMul,vy:kbVy*(airborne?.90:1)});sfx(q,'hurt');
  bc(R,{t:'fx',x:q.x,y:q.y+1,z:q.z,c:cr?0xffd23d:0xd23c3c});bc(R,{t:'hitfx',x:q.x,y:q.y+1,z:q.z,cr:cr?1:0,d:+dealt.toFixed(1),target:q.id,src:src?src.id:0});tx(q,{t:'hurtPulse',d:+dealt.toFixed(1),cr:cr?1:0});
  if(q.hp<=0)die(R,q,cause);return true;
}`,'hurt overhaul');

// Fireball jump tuning.
server=rex(server,/function fireballBoom\(R, x, y, z, owner\) \{[\s\S]*?\n\}/,
`function fireballBoom(R,x,y,z,owner){
  const r=2;for(let a=-r;a<=r;a++)for(let b=-r;b<=r;b++)for(let c=-r;c<=r;c++){if(a*a+b*b+c*c>r*r)continue;const X=Math.floor(x)+a,Y=Math.floor(y)+b,Z=Math.floor(z)+c;if(get(R,X,Y,Z)&&R.pf[S.ix(X,Y,Z)]&&![7,16].includes(get(R,X,Y,Z)))setb(R,X,Y,Z,0)}
  bc(R,{t:'fx',x,y,z,c:0xff6a00});sfxAt(R,'fireball',x,y,z,9);
  R.ps.forEach(q=>{if(!q.alive)return;const dx=q.x-x,dy=q.y+.9-y,dz=q.z-z,L=Math.hypot(dx,dy,dz);if(L>=4.5)return;const f=Math.max(.08,1-L/4.5),self=q===owner,nx=dx/(L||1),nz=dz/(L||1),h=self?1.55:1.32,vy=self?5.8+5.0*f:4.8+3.0*f;hurt(R,q,9*f,nx*h,nz*h,owner,false,'explosion',vy)})
}`,'fireball jump');

// Safe pearl destination.
server=once(server,
"function projectileImpact(R,pr,x,y,z,target){",
`function safePearlPos(R,pr,x,y,z){
 const h=Math.hypot(pr.vx,pr.vz)||1,back=[-pr.vx/h*.48,-pr.vz/h*.48],tries=[[x+back[0],y,z+back[1]],[x+back[0],y+.7,z+back[1]],[x+back[0]*1.8,y+.2,z+back[1]*1.8],[x,y+1.2,z]];
 for(const [X,Y,Z] of tries){if(Y<1||Y>S.H-3)continue;const solid=(yy)=>get(R,Math.floor(X),Math.floor(yy),Math.floor(Z));if(!solid(Y+.05)&&!solid(Y+1.05)&&!solid(Y+1.72))return[X,Math.max(1,Y),Z]}
 return null
}
function projectileImpact(R,pr,x,y,z,target){`,'safe pearl helper');
server=once(server,
"else if(pr.k==='pearl'&&owner&&owner.alive){owner.x=x-pr.vx/(Math.hypot(pr.vx,pr.vz)||1)*.4;owner.y=Math.max(1,y);owner.z=z-pr.vz/(Math.hypot(pr.vx,pr.vz)||1)*.4;owner.hp=Math.max(1,owner.hp-2);tx(owner,{t:'tp',x:owner.x,y:owner.y,z:owner.z});}",
"else if(pr.k==='pearl'&&owner&&owner.alive){const pos=safePearlPos(R,pr,x,y,z);if(pos){owner.x=pos[0];owner.y=pos[1];owner.z=pos[2];owner.hp=Math.max(1,owner.hp-2);owner.px=owner.x;owner.py=owner.y;owner.pz=owner.z;tx(owner,{t:'tp',x:owner.x,y:owner.y,z:owner.z,hard:1})}else tx(owner,{t:'m',s:'A pérola não encontrou um local seguro.'});}",
'pearl safe teleport');

// Pickup responsiveness.
server=once(server,
"const d=R.drops[i], p=players.find(q=>q.alive&&Math.hypot(q.x-d.x,q.z-d.z)<1.25&&Math.abs(q.y-d.y)<2.5);",
"const d=R.drops[i], p=players.find(q=>q.alive&&Math.hypot(q.x-d.x,q.z-d.z)<1.55&&Math.abs(q.y-d.y)<2.6);",
'pickup radius');
server=once(server,
"p.inv[d.k]=(p.inv[d.k]||0)+d.n;p.stats.resourcesCollected+=d.n;p.dirty=1;",
"p.inv[d.k]=(p.inv[d.k]||0)+d.n;p.stats.resourcesCollected+=d.n;p.dirty=0;pinv(p);",
'immediate pickup inventory');

// Sudden death room state.
server=once(server,
"trapInside:[new Set(),new Set(),new Set(),new Set()], st: 'lobby', t: 0, host: null, final:null,",
"trapInside:[new Set(),new Set(),new Set(),new Set()], suddenDeath:false,collapseAt:0,lastCollapse:0, st: 'lobby', t: 0, host: null, final:null,",
'room sudden death state');
server=once(server,
"R.st = 'play';",
"R.st = 'play';R.t=0;R.suddenDeath=false;R.collapseAt=0;R.lastCollapse=0;",
'reset match timer state');

// Movement packet: spectators, smooth corrections, grounded/fall damage.
server=rex(server,/      case 'mv': \{[\s\S]*?        p\.dy = \(m\.y - p\.y\) \/ dt; p\.px=p\.x;p\.py=p\.y;p\.pz=p\.z; p\.x = m\.x; p\.y = m\.y; p\.z = m\.z; p\.yaw = m\.yaw; p\.pitch = m\.pitch; break;\n      \}/,
`      case 'mv': {
        const spectating=!!p.spectator&&p.out;if((!p.alive&&!spectating)||!allow(p,'mv',15))break;
        const n=Date.now(),dt=Math.max(.02,Math.min(.5,(n-p.lt)/1000));p.lt=n;
        const d=Math.hypot(m.x-p.x,m.z-p.z),maxH=(p.admin||spectating)?dt*24+3:dt*12+1.5,maxV=(p.admin||spectating)?dt*24+3:dt*11+1.2;
        if(![m.x,m.y,m.z,m.yaw,m.pitch].every(Number.isFinite)||d>maxH||Math.abs(m.y-p.y)>maxV||m.x<S.MIN_X-8||m.x>S.MAX_X+8||m.z<S.MIN_Z-8||m.z>S.MAX_Z+8||m.y>S.H+20||m.y<-30){tx(p,{t:'tp',x:p.x,y:p.y,z:p.z,hard:0});break}
        const oldY=p.y,newDy=(m.y-p.y)/dt;p.hspeed=Math.min(20,d/dt);p.dy=newDy;p.px=p.x;p.py=p.y;p.pz=p.z;p.x=m.x;p.y=m.y;p.z=m.z;p.yaw=m.yaw;p.pitch=m.pitch;
        if(!spectating&&!p.admin){const below=get(R,Math.floor(p.x),Math.floor(p.y-.08),Math.floor(p.z))||get(R,Math.floor(p.x+.25),Math.floor(p.y-.08),Math.floor(p.z));p.wasGrounded=p.grounded;p.grounded=!!below;if(newDy<p.fallVyMin)p.fallVyMin=newDy;if(p.grounded&&!p.wasGrounded){const impact=Math.abs(Math.min(0,p.fallVyMin));if(impact>10.8)hurt(R,p,Math.min(12,(impact-10.8)*.78),0,0,null,false,'fall',0);p.fallVyMin=0}else if(p.grounded)p.fallVyMin=0}
        break;
      }`,'movement authority');

// Combat: spawn protection cancel, consistent combo, valid hit ack only.
server=once(server,
"if (!play || !allow(p, 'hit', 90) || !Number.isInteger(m.id) || !Number.isFinite(m.yaw) || !Number.isFinite(m.pitch)) break;",
"if (!play || !allow(p, 'hit', GAMEPLAY.hitCooldownMs) || !Number.isInteger(m.id) || !Number.isFinite(m.yaw) || !Number.isFinite(m.pitch)) break;cancelSpawnProtection(p);",
'hit cooldown and protection');
server=once(server,
"const d=[hit.dir.x,hit.dir.y,hit.dir.z],stick=m.k==='knockbackStick'&&(p.inv.knockbackStick||0)>0,cr=!stick&&p.dy<-1,kb=stick?1.9:1,damage=stick?1.5:(DMG[p.sw]+2*p.up.sharp)*(cr?1.5:1);\n        hurt(R,q,damage,d[0]*kb,d[2]*kb,p,cr);\n        tx(p, { t:'hitok', id:q.id, hp:Math.max(0,Math.ceil(q.hp)), cr:cr?1:0 });bc(R,{t:'anim',id:p.id,k:'attack'});",
"const d=[hit.dir.x,hit.dir.y,hit.dir.z],now=R.t;if(p.comboTarget===q.id&&now-p.lastCombatAt<1.05)p.comboCount=Math.min(8,p.comboCount+1);else p.comboCount=1;p.comboTarget=q.id;p.lastCombatAt=now;const stick=m.k==='knockbackStick'&&(p.inv.knockbackStick||0)>0,cr=!stick&&p.dy<-1,sprintMul=p.hspeed>5.15?1.12:1,kb=(stick?1.9:1)*sprintMul,damage=stick?1.5:(DMG[p.sw]+2*p.up.sharp)*(cr?1.5:1);\n        if(!hurt(R,q,damage,d[0]*kb,d[2]*kb,p,cr))break;\n        tx(p,{t:'hitok',id:q.id,hp:Math.max(0,Math.ceil(q.hp)),cr:cr?1:0,combo:p.comboCount});bc(R,{t:'anim',id:p.id,k:'attack'});",
'combo combat');

// Cancel spawn protection on active actions.
for(const [needle,label] of [
["case 'place': {\n        if(p.fx.invis>0)",'place protection'],
["case 'breakStart': {\n        if(p.fx.invis>0)",'break protection'],
["case 'shoot': {\n        if(p.fx.invis>0)",'shoot protection'],
["case 'use': {\n        if(!play",'use protection']]){
 if(label==='use protection')server=once(server,needle,"case 'use': {\n        cancelSpawnProtection(p);if(!play",label);
 else server=once(server,needle,needle.replace("if(p.fx.invis>0)","cancelSpawnProtection(p);if(p.fx.invis>0)"),label);
}

// Placement slightly more tolerant for clutch without changing build reach.
server=once(server,
"if (!allow(p, 'place', 70)) break;",
"if (!allow(p, 'place', 62)) break;",
'placement cadence');
server=once(server,
"if (Math.hypot(x + .5 - p.x, y + .5 - p.y - 1.6, z + .5 - p.z) > 6.4) break;",
"if (Math.hypot(x+.5-p.x,y+.5-p.y-1.45,z+.5-p.z)>6.45) break;",
'clutch reach tolerance');
server=once(server,
"setb(R, x, y, z, k, 1); p.inv[m.k]--; pinv(p); sfx(p,'place'); break;",
"setb(R,x,y,z,k,1);p.inv[m.k]--;pinv(p);sfx(p,'place');sfxAt(R,'place',x+.5,y+.5,z+.5,6);break;",
'place sound 3d');
server=once(server,
"{setb(R,br.x,br.y,br.z,0);sfx(p,'break');}",
"{setb(R,br.x,br.y,br.z,0);sfx(p,'break');sfxAt(R,'break',br.x+.5,br.y+.5,br.z+.5,6);}",
'break sound 3d');

// Tick: spawn protection, sudden death, collapse.
server=once(server,
"p.ih = Math.max(0, p.ih - dt);",
"p.ih=Math.max(0,p.ih-dt);p.spawnProtect=Math.max(0,(p.spawnProtect||0)-dt);",
'spawn protect tick');
server=once(server,
"triggerTeamTraps(R);",
`if(!R.suddenDeath&&R.t>=GAMEPLAY.suddenDeathAt){R.suddenDeath=true;R.collapseAt=R.t+3*60;for(let t=0;t<4;t++)if(R.bed[t])killBed(R,t,null);feed(R,'☠ MORTE SÚBITA! Todas as camas foram destruídas.','-1','-1','sudden');bc(R,{t:'phase',phase:'sudden',at:R.t})}
      if(R.suddenDeath&&R.t>=R.collapseAt&&R.t-R.lastCollapse>=GAMEPLAY.collapseEvery){R.lastCollapse=R.t;feed(R,'⚡ COLAPSO: jogadores restantes estão recebendo dano.','-1','-1','sudden');R.ps.forEach(q=>{if(q.alive&&!q.admin)hurt(R,q,1,0,0,null,false,'collapse',0)})}
      triggerTeamTraps(R);`,
'sudden death tick');

// Snapshot exposes spawn protection + phase.
server=once(server,
"p.stats.kills,p.stats.finalKills]),pr:R.projectiles.map",
"p.stats.kills,p.stats.finalKills,p.spawnProtect>0?1:0]),phase:R.suddenDeath?'sudden':'normal',pr:R.projectiles.map",
'snapshot protection phase');

// ---------------- CLIENT: movement / combat feel ----------------
game=once(game,
"const pl={x:0,y:BASE_Y+2.02,z:0,vx:0,vy:0,vz:0,kx:0,kz:0,g:false,yaw:0,pitch:-.2},me={id:0,team:0,hp:20,alive:1},ADMIN={on:false,block:1,build:true};",
"const pl={x:0,y:BASE_Y+2.02,z:0,vx:0,vy:0,vz:0,kx:0,kz:0,g:false,yaw:0,pitch:-.2},me={id:0,team:0,hp:20,alive:1,out:false,spawnProtect:false},ADMIN={on:false,block:1,build:true};let spectator=false,specTarget=0,sprintLatch=false,camShake=0,serverCorrection=null,matchPhase='normal';",
'client gameplay state');

game=rex(game,/function step\(e,dt\)\{[\s\S]*?\}\n\/\/ estado/,
`function approach(v,t,a){return v<t?Math.min(t,v+a):Math.max(t,v-a)}
function step(e,dt){const k=Math.max(0,1-6.5*dt),vx=e.vx+e.kx,vz=e.vz+e.kz;e.kx*=k;e.kz*=k;let n=e.x+vx*dt,blockedX=hit(n,e.y,e.z);if(!blockedX)e.x=n;n=e.z+vz*dt;let blockedZ=hit(e.x,e.y,n);if(!blockedZ)e.z=n;if((blockedX||blockedZ)&&e.g){for(const up of [.18,.34,.5]){const nx=e.x+vx*dt,nz=e.z+vz*dt;if(!hit(e.x,e.y+up,e.z)&&!hit(nx,e.y+up,nz)){e.y+=up;e.x=nx;e.z=nz;break}}}e.vy-=28*dt;n=e.y+e.vy*dt;e.g=false;if(!hit(e.x,n,e.z))e.y=n;else{if(e.vy<0)e.g=true;e.vy=0}}
// estado`,'movement step');

// Respawn audio and camera helpers.
game=once(game,
"function updateRespawnUI(){if(respawnFinal||!respawnEnds)return;const n=Math.max(0,Math.ceil((respawnEnds-performance.now())/1000));$('respawnText').textContent=n>0?'Renascer em '+n+'...':'Renascendo...'}",
"let lastRespawnBeep=-1;function updateRespawnUI(){if(respawnFinal||!respawnEnds)return;const n=Math.max(0,Math.ceil((respawnEnds-performance.now())/1000));$('respawnText').textContent=n>0?'Renascer em '+n+'...':'Renascendo...';if(n>0&&n<=3&&n!==lastRespawnBeep){lastRespawnBeep=n;tone(n===1?820:620,.08,'square',.035,120)}}\nfunction respawnCamera(dt){if(!respawnEnds||respawnFinal)return false;const sp=worldMeta.SPAWN?.[me.team];if(!sp)return false;const a=1-Math.exp(-3.6*dt),tx=sp[0],ty=sp[1]+3.2,tz=sp[2]+5;cam.position.x+=(tx-cam.position.x)*a;cam.position.y+=(ty-cam.position.y)*a;cam.position.z+=(tz-cam.position.z)*a;cam.lookAt(sp[0],sp[1]+1,sp[2]);return true}",
'respawn flow');

// Hit feedback: shake + flash remote target + combo.
game=once(game,
"case'hitok':$('cross').style.transform='scale(1.9)';setTimeout(()=>$('cross').style.transform='',70);sfx(m.cr?'crit':'hit');break;",
"case'hitok':$('cross').style.transform='scale(1.9)';$('cross').classList.add('hit');setTimeout(()=>{$('cross').style.transform='';$('cross').classList.remove('hit')},85);camShake=Math.max(camShake,m.cr?.085:.052);sfx(m.cr?'crit':'hit');{const r=PL.get(m.id);if(r){r.flashUntil=performance.now()+95;r.m.traverse(o=>{if(o.material&&o.material.color){o.userData.baseColor=o.userData.baseColor??o.material.color.getHex();o.material.color.setHex(0xffffff)}})}}if(m.combo>1)msg('COMBO x'+m.combo);break;",
'hit feedback');
game=once(game,
"case'tp':pl.x=m.x;pl.y=m.y;pl.z=m.z;pl.vy=0;pl.kx=pl.kz=0;break;",
"case'tp':{const d=Math.hypot(m.x-pl.x,m.y-pl.y,m.z-pl.z);if(!m.hard&&d<3&&me.alive)serverCorrection={x:m.x,y:m.y,z:m.z,t:.16};else{pl.x=m.x;pl.y=m.y;pl.z=m.z;pl.vy=0;pl.kx=pl.kz=0;serverCorrection=null}break}",
'smooth correction');
game=once(game,
"case'deathState':setRespawn(!!m.final,m.respawn||0,m.final?'Você foi eliminado.':'');break;",
"case'deathState':setRespawn(!!m.final,m.respawn||0,m.final?'Você foi eliminado.':'');if(m.final){spectator=true;me.out=true;setTimeout(()=>msg('Modo espectador · Q/E troca alvo · F voo livre'),250)}break;",
'spectator death state');
game=once(game,
"case'eliminated':setRespawn(true,0,m.reason||'Você foi eliminado.');break;",
"case'eliminated':setRespawn(true,0,m.reason||'Você foi eliminado.');spectator=true;me.out=true;break;",
'spectator eliminated');
game=once(game,
"case'respawn':clearRespawn();break;",
"case'respawn':spectator=false;me.out=false;lastRespawnBeep=-1;clearRespawn();break;\ncase'spawnProtect':me.spawnProtect=!!m.v;break;\ncase'phase':matchPhase=m.phase||'normal';if(matchPhase==='sudden')msg('☠ MORTE SÚBITA — todas as camas foram destruídas!');break;",
'respawn and phase');

// Snapshot fields expanded.
game=once(game,
"case's':{syncProjectiles(m.pr||[]);if(m.time!=null)matchTime=m.time;if(m.bed)bed=m.bed;if(m.gen)genState=m.gen;const seen=new Set();m.p.forEach(([id,x,y,z,yw,pt,hp,al,tm,iv,hs,rsw,rar,disc,radmin,out,rt,kills,finalKills])=>{seen.add(id);matchPlayers.set(id,{id,team:tm,alive:!!al,out:!!out,admin:!!radmin,kills:kills||0,finalKills:finalKills||0,rt:rt||0});if(id===me.id){me.hp=hp;me.alive=al;me.out=!!out;myMatchStats={kills:kills||0,finalKills:finalKills||0};return}",
"case's':{syncProjectiles(m.pr||[]);if(m.time!=null)matchTime=m.time;if(m.bed)bed=m.bed;if(m.gen)genState=m.gen;if(m.phase)matchPhase=m.phase;const seen=new Set();m.p.forEach(([id,x,y,z,yw,pt,hp,al,tm,iv,hs,rsw,rar,disc,radmin,out,rt,kills,finalKills,spawnProt])=>{seen.add(id);matchPlayers.set(id,{id,team:tm,alive:!!al,out:!!out,admin:!!radmin,kills:kills||0,finalKills:finalKills||0,rt:rt||0});if(id===me.id){me.hp=hp;me.alive=al;me.out=!!out;me.spawnProtect=!!spawnProt;myMatchStats={kills:kills||0,finalKills:finalKills||0};return}",
'snapshot fields client');

// Quick buy customization.
game=once(game,
"const QUICK_KEYS=['wool','planks','endstone','sw1','ar1','pick1','bow','arrow','tnt','fireball','apple','pearl','compass','magicMilk','bridgeEgg','popupTower','knockbackStick','speedPotion','jumpPotion'];",
"const QUICK_DEFAULT=['wool','planks','endstone','sw1','ar1','pick1','bow','arrow','tnt','fireball','apple','pearl','compass','magicMilk','bridgeEgg','popupTower','knockbackStick','speedPotion','jumpPotion'];let QUICK_KEYS=(()=>{try{const q=JSON.parse(localStorage.getItem('bwQuickBuy')||'null');if(Array.isArray(q)&&q.length)return q}catch(e){}return [...QUICK_DEFAULT]})();function toggleQuick(k){const i=QUICK_KEYS.indexOf(k);if(i>=0)QUICK_KEYS.splice(i,1);else QUICK_KEYS.push(k);try{localStorage.setItem('bwQuickBuy',JSON.stringify(QUICK_KEYS))}catch(e){}lastShopSig='';drawShop(true)}",
'custom quick buy');
game=once(game,
"return `<button class=\"shop-card ${state}\" onclick=\"buyItem(${o.i})\" ${owned?'disabled':''}>\n     <span class=\"slot-icon\">${icon}</span>",
"return `<button class=\"shop-card ${state}\" onclick=\"buyItem(${o.i})\" ${owned?'disabled':''}>\n     <span class=\"quick-star ${QUICK_KEYS.includes(o.key)?'on':''}\" onclick=\"event.stopPropagation();toggleQuick('${o.key}')\">★</span><span class=\"slot-icon\">${icon}</span>",
'quick buy star');

// Held model caching / preloading.
game=once(game,
"function refreshHeld(){\n const sig=miningTool?'tool:'+miningTool:'slot:'+cur+':'+slotKey(cur)+':'+sw+':'+me.team;",
"const HELD_CACHE=new Map();function cachedHeld(ci){const key=ci+':'+canonicalKey(ci)+':'+sw+':'+me.team;if(!HELD_CACHE.has(key))HELD_CACHE.set(key,heldModel(ci));return HELD_CACHE.get(key).clone(true)}\nfunction preloadHeld(){for(let i=0;i<SL.length;i++){try{cachedHeld(i)}catch(e){}}}\nfunction refreshHeld(){\n const sig=miningTool?'tool:'+miningTool:'slot:'+cur+':'+slotKey(cur)+':'+sw+':'+me.team;",
'held cache');
game=once(game,
"const ci=canonicalSlot(cur);heldRoot.add(miningTool?toolModel(miningTool):heldModel(ci));applyHeldView();",
"const ci=canonicalSlot(cur);heldRoot.add(miningTool?toolModel(miningTool):cachedHeld(ci));applyHeldView();",
'use held cache');
game=once(game,"case'start':currentMode=", "case'start':HELD_CACHE.clear();setTimeout(preloadHeld,50);currentMode=",'preload at start');

// Placement prediction and clutch target.
game=once(game,
"function autoBridge(now=performance.now()){",
`function predictPlace(p){if(!p||get(p.x,p.y,p.z))return;const blockId=p.k==='wool'?me.team+1:p.k==='planks'?5:p.k==='endstone'?12:p.k==='glass'?7:16,key=p.x+','+p.y+','+p.z;BRIDGE_PRED.set(key,{x:p.x,y:p.y,z:p.z,at:performance.now()});sb(p.x,p.y,p.z,blockId,1);flush(lowEnd?2:4);send({t:'place',k:p.k,x:p.x,y:p.y,z:p.z})}\nfunction clutchTarget(){const k=slotKey(cur);if(!PLACEABLE.has(k)||(inv[k]||0)<=0)return null;const y=Math.floor(pl.y-.05)-1,cands=[];for(let ox=-1;ox<=1;ox++)for(let oz=-1;oz<=1;oz++){const x=Math.floor(pl.x+ox*.55),z=Math.floor(pl.z+oz*.55);if(!inXZ(x,z)||get(x,y,z)||!safePlaceTarget(x,y,z))continue;const adj=[[1,0,0],[-1,0,0],[0,-1,0],[0,0,1],[0,0,-1]].some(d=>get(x+d[0],y+d[1],z+d[2]));if(adj)cands.push({x,y,z,k,d:Math.hypot(x+.5-pl.x,z+.5-pl.z)})}return cands.sort((a,b)=>a.d-b.d)[0]||null}\nfunction autoBridge(now=performance.now()){`,
'prediction helper');
game=once(game,
"const blockId=p.k==='wool'?me.team+1:p.k==='planks'?5:p.k==='endstone'?12:p.k==='glass'?7:16,key=p.x+','+p.y+','+p.z;\n BRIDGE_PRED.set(key,{x:p.x,y:p.y,z:p.z,at:now});\n sb(p.x,p.y,p.z,blockId,1);flush(lowEnd?2:4);\n send({t:'place',k:p.k,x:p.x,y:p.y,z:p.z});",
"predictPlace(p);",
'auto bridge prediction reuse');
game=once(game,
"else if(PLACEABLE.has(k)&&tg&&tg.p){const[x,y,z]=tg.p;if(!safePlaceTarget(x,y,z)){sfx('blocked');msg('Não é possível colocar um bloco dentro do jogador');return}send({t:'place',k,x,y,z})}",
"else if(PLACEABLE.has(k)){const p=tg&&tg.p?{x:tg.p[0],y:tg.p[1],z:tg.p[2],k}:clutchTarget();if(!p){sfx('blocked');return}if(!safePlaceTarget(p.x,p.y,p.z)){sfx('blocked');msg('Não é possível colocar um bloco dentro do jogador');return}predictPlace(p)}",
'normal place prediction clutch');

// Spectator controls.
game=once(game,
"if(e.code==='KeyL'&&!started&&me.id){e.preventDefault();lobbyExplore?showLobby():exploreLobby();return}",
"if(e.code==='KeyL'&&!started&&me.id){e.preventDefault();lobbyExplore?showLobby():exploreLobby();return}if(spectator&&e.code==='KeyF'){specTarget=0;msg('Espectador: voo livre')}if(spectator&&(e.code==='KeyQ'||e.code==='KeyE')){const ids=[...matchPlayers.values()].filter(q=>q.alive&&!q.out&&!q.admin).map(q=>q.id);if(ids.length){let i=ids.indexOf(specTarget);i=(i+(e.code==='KeyE'?1:-1)+ids.length)%ids.length;specTarget=ids[i];msg('Observando '+(INFO[specTarget]?.n||'jogador'))}}",
'spectator keys');

// Mobile sensitivity settings.
game=once(game,
"const touchMode=matchMedia('(pointer:coarse)').matches&&Math.min(innerWidth,innerHeight)<900;let mx=0,my=0,mLook=null,mJoy=null,lastWTap=0,doubleSprint=false,bridgeHeld=false,lastBridgeAt=0,dragLook=false,lastDragX=0,lastDragY=0;const BRIDGE_PRED=new Map();",
"const touchMode=matchMedia('(pointer:coarse)').matches&&Math.min(innerWidth,innerHeight)<900;let mx=0,my=0,mLook=null,mJoy=null,lastWTap=0,doubleSprint=false,bridgeHeld=false,lastBridgeAt=0,dragLook=false,lastDragX=0,lastDragY=0;const BRIDGE_PRED=new Map();let mobileCfg=(()=>{try{return Object.assign({sx:.006,sy:.006,size:1,opacity:.78},JSON.parse(localStorage.getItem('bwMobileCfg')||'{}'))}catch(e){return{sx:.006,sy:.006,size:1,opacity:.78}}})();function applyMobileCfg(){document.documentElement.style.setProperty('--mobile-scale',mobileCfg.size);document.documentElement.style.setProperty('--mobile-opacity',mobileCfg.opacity)}function saveMobileCfg(){try{localStorage.setItem('bwMobileCfg',JSON.stringify(mobileCfg))}catch(e){}applyMobileCfg()}applyMobileCfg();",
'mobile settings state');
game=once(game,
"pl.yaw-=(t.clientX-mLook.x)*.006;pl.pitch=Math.max(-1.55,Math.min(1.55,pl.pitch-(t.clientY-mLook.y)*.006));",
"pl.yaw-=(t.clientX-mLook.x)*mobileCfg.sx;pl.pitch=Math.max(-1.55,Math.min(1.55,pl.pitch-(t.clientY-mLook.y)*mobileCfg.sy));",
'mobile sensitivity');

// Tick movement acceleration, air control, spectator, corrections, FOV.
game=once(game,
"if((started||lobbyExplore)&&!over&&me.alive){",
"if(serverCorrection&&me.alive){const a=Math.min(1,dt/Math.max(.001,serverCorrection.t));pl.x+=(serverCorrection.x-pl.x)*a;pl.y+=(serverCorrection.y-pl.y)*a;pl.z+=(serverCorrection.z-pl.z)*a;serverCorrection.t-=dt;if(serverCorrection.t<=0)serverCorrection=null}\nif((started||lobbyExplore)&&!over&&(me.alive||spectator)){",
'tick allow spectator');
game=once(game,
"if(ADMIN.on){const sp=10;pl.vx=(fx_*mf+rx*mr)/l*sp;pl.vz=(fz*mf+rz*mr)/l*sp;pl.vy=(K.Space?8:0)-(K.ShiftLeft?8:0);pl.x+=pl.vx*dt;pl.y+=pl.vy*dt;pl.z+=pl.vz*dt;pl.g=false}else{\nsneak=!!K.ShiftLeft;sprinting=!sneak&&(!!K.ControlLeft||doubleSprint)&&mf>.15;const baseSp=sneak?1.3:(sprinting?5.7:4.3),sp=baseSp*(fxs.speed>0?1.28:1)*(fxs.slow>0?.55:1);\npl.vx=(fx_*mf+rx*mr)/l*sp;pl.vz=(fz*mf+rz*mr)/l*sp;",
"if(ADMIN.on||spectator){const sp=ADMIN.on?10:8.5;if(spectator&&specTarget){const r=PL.get(specTarget);if(r){pl.x=r.m.position.x;pl.y=r.m.position.y+2.2;pl.z=r.m.position.z+4;pl.vx=pl.vy=pl.vz=0}else specTarget=0}else{pl.vx=(fx_*mf+rx*mr)/l*sp;pl.vz=(fz*mf+rz*mr)/l*sp;pl.vy=(K.Space?8:0)-(K.ShiftLeft?8:0);pl.x+=pl.vx*dt;pl.y+=pl.vy*dt;pl.z+=pl.vz*dt}pl.g=false}else{\nsneak=!!K.ShiftLeft;if(sneak||mf<=.05)sprintLatch=false;else if((K.ControlLeft||doubleSprint)&&mf>.15)sprintLatch=true;sprinting=sprintLatch&&mf>.15;const baseSp=sneak?1.3:(sprinting?5.7:4.3),sp=baseSp*(fxs.speed>0?1.28:1)*(fxs.slow>0?.55:1),tvx=(fx_*mf+rx*mr)/l*sp,tvz=(fz*mf+rz*mr)/l*sp,accel=pl.g?30:9.5,decel=pl.g?24:7;pl.vx=approach(pl.vx,tvx,(Math.abs(tvx)>Math.abs(pl.vx)?accel:decel)*dt);pl.vz=approach(pl.vz,tvz,(Math.abs(tvz)>Math.abs(pl.vz)?accel:decel)*dt);",
'movement acceleration');
game=once(game,
"targetFov=ADMIN.on?76:(sprinting?78:(fxs.speed>0?75:70));",
"targetFov=(ADMIN.on||spectator)?78:(sprinting&&fxs.speed>0?84:sprinting?80:fxs.speed>0?77:70);",
'fov refinement');

// Remote flash restore and crosshair dynamic.
game=once(game,
"if(r.action>now){r.limbs.ra.rotation.x=-1.35+Math.sin(now/45)*.18;r.held.rotation.x=-.7}else r.held.rotation.x=.1});",
"if(r.action>now){r.limbs.ra.rotation.x=-1.35+Math.sin(now/45)*.18;r.held.rotation.x=-.7}else r.held.rotation.x=.1;if(r.flashUntil&&now>r.flashUntil){r.flashUntil=0;r.m.traverse(o=>{if(o.material&&o.material.color&&o.userData.baseColor!=null)o.material.color.setHex(o.userData.baseColor)})}});",
'restore hit flash');
game=once(game,
"cam.position.set(pl.x+bobX,pl.y+(K.ShiftLeft?1.42:1.62)-bobY,pl.z);cam.rotation.set(pl.pitch+Math.sin(bobPhase*.5)*.003*bobStrength,pl.yaw,0);",
"if(!respawnCamera(dt)){const shake=camShake>0?(Math.random()-.5)*camShake:0;camShake=Math.max(0,camShake-dt*.65);cam.position.set(pl.x+bobX+shake,pl.y+(K.ShiftLeft?1.42:1.62)-bobY+shake*.4,pl.z+shake);cam.rotation.set(pl.pitch+Math.sin(bobPhase*.5)*.003*bobStrength+shake*.06,pl.yaw+shake*.04,0)}",
'camera shake respawn');
game=once(game,
"$('cross').style.filter=(vf||cf)?'drop-shadow(0 0 4px #fff55c)':'drop-shadow(1px 1px 0 #000)';updateCompass();",
"const enemyAim=me.alive&&started?playerTarget():null;$('cross').classList.toggle('enemy',enemyAim!==null);$('cross').style.filter=(vf||cf)?'drop-shadow(0 0 4px #fff55c)':'drop-shadow(1px 1px 0 #000)';updateCompass();",
'dynamic crosshair');

// Drop magnet visual.
game=once(game,
"let dropVisualAt=0,dropVisualDisabled=false;function updateDropVisuals(now){if(dropVisualDisabled||now-dropVisualAt<33)return;dropVisualAt=now;const t=now*.001;try{DROP.forEach(o=>{o.m.rotation.y=t*1.8+o.phase;o.m.rotation.z=Math.sin(t*.9+o.phase)*.08;o.m.position.y=o.baseY+.15+Math.sin(t*2.6+o.phase)*.08})}catch(err){dropVisualDisabled=true;console.warn('Drops visuais desativados para preservar gameplay',err)}}",
"let dropVisualAt=0,dropVisualDisabled=false;function updateDropVisuals(now){if(dropVisualDisabled||now-dropVisualAt<33)return;dropVisualAt=now;const t=now*.001;try{DROP.forEach(o=>{o.m.rotation.y=t*1.8+o.phase;o.m.rotation.z=Math.sin(t*.9+o.phase)*.08;const d=Math.hypot(o.m.position.x-pl.x,o.m.position.z-pl.z);if(me.alive&&d<3.2){const a=(3.2-d)/3.2*.14;o.m.position.x+=(pl.x-o.m.position.x)*a;o.m.position.z+=(pl.z-o.m.position.z)*a;o.baseY+=(pl.y+.65-o.baseY)*a}o.m.position.y=o.baseY+.15+Math.sin(t*2.6+o.phase)*.08})}catch(err){dropVisualDisabled=true;console.warn('Drops visuais desativados para preservar gameplay',err)}}",
'drop magnet');

// 3D world sound handler.
game=once(game,
"case'sfx3d':{const g=positionalGain(m.x,m.y,m.z,m.r||7);if(g>0)resourceSfx(m.k,g);break}",
"case'sfx3d':{const g=positionalGain(m.x,m.y,m.z,m.r||7);if(g>0){if(String(m.k).startsWith('resource_')||String(m.k).startsWith('pickup_'))resourceSfx(m.k,g);else if(m.k==='place'){noise(.04,.02*g,900);tone(165,.04,'square',.018*g,-30)}else if(m.k==='break'){noise(.08,.03*g,1400)}else if(m.k==='fireball'){tone(85,.14,'sawtooth',.05*g,-40);noise(.1,.03*g,500)}else sfx(m.k)}break}",
'world sfx');

// HUD spawn/sudden info.
game=once(game,
"${fxs.milk>0?'🥛 MAGIC MILK ':''}</div>",
"${fxs.milk>0?'🥛 MAGIC MILK ':''}${me.spawnProtect?'🛡 PROTEÇÃO DE SPAWN ':''}${matchPhase==='sudden'?'☠ MORTE SÚBITA ':''}</div>",
'hud phase protection');

// Bow charge text.
game=once(game,
"if(bowCharging){const br=Math.max(.2,Math.min(1,(now-bowChargeAt)/1200));$('bowChargeFill').style.width=(br*100)+'%';heldRoot.position.z=heldViewBase.z-br*.08;heldRoot.rotation.y=heldViewBase.ry-br*.18}",
"if(bowCharging){const br=Math.max(.2,Math.min(1,(now-bowChargeAt)/1200));$('bowChargeFill').style.width=(br*100)+'%';$('bowChargeText').textContent=Math.round(br*100)+'% · '+(br>.82?'FORTE':br>.5?'MÉDIO':'FRACO');heldRoot.position.z=heldViewBase.z-br*.08;heldRoot.rotation.y=heldViewBase.ry-br*.18}",
'bow charge text');

// ---------------- HTML / CSS ----------------
index=once(index,
"<div id=\"bowCharge\"><div id=\"bowChargeFill\"></div></div>",
"<div id=\"bowCharge\"><div id=\"bowChargeFill\"></div><span id=\"bowChargeText\"></span></div>",
'bow text html');
index=once(index,
"<div id=\"mobile\"><div id=\"joy\"><div id=\"knob\"></div></div><div id=\"look\"></div><button class=\"mb\" id=\"jumpBtn\">PULAR</button><button class=\"mb\" id=\"actBtn\">ATACAR</button><button class=\"mb\" id=\"useBtn\">USAR</button><button class=\"mb\" id=\"placeBtn\">COLOCAR</button></div>",
"<div id=\"mobile\"><div id=\"joy\"><div id=\"knob\"></div></div><div id=\"look\"></div><button class=\"mb\" id=\"jumpBtn\">PULAR</button><button class=\"mb\" id=\"actBtn\">ATACAR</button><button class=\"mb\" id=\"useBtn\">USAR</button><button class=\"mb\" id=\"placeBtn\">COLOCAR</button><button class=\"mb settings-btn\" id=\"mobileSettingsBtn\">⚙</button><div id=\"mobileSettings\"><b>CONTROLES</b><label>Sens. horizontal<input id=\"msx\" type=\"range\" min=\"3\" max=\"10\" value=\"6\"></label><label>Sens. vertical<input id=\"msy\" type=\"range\" min=\"3\" max=\"10\" value=\"6\"></label><label>Tamanho<input id=\"msize\" type=\"range\" min=\"80\" max=\"135\" value=\"100\"></label><label>Opacidade<input id=\"mopacity\" type=\"range\" min=\"35\" max=\"100\" value=\"78\"></label></div></div>",
'mobile settings html');
index=index.replace(/<script src="\/game\.js\?v=[^"]+"><\/script>/,'<script src="/game.js?v=gameplay-overhaul-v3-20261004"></script>');

game=once(game,
"if(touchMode){\n const joy=$('joy'),kn=$('knob'),look=$('look');",
"if(touchMode){\n const joy=$('joy'),kn=$('knob'),look=$('look');$('msx').value=Math.round(mobileCfg.sx*1000);$('msy').value=Math.round(mobileCfg.sy*1000);$('msize').value=Math.round(mobileCfg.size*100);$('mopacity').value=Math.round(mobileCfg.opacity*100);$('mobileSettingsBtn').onclick=()=>$('mobileSettings').classList.toggle('open');$('msx').oninput=e=>{mobileCfg.sx=+e.target.value/1000;saveMobileCfg()};$('msy').oninput=e=>{mobileCfg.sy=+e.target.value/1000;saveMobileCfg()};$('msize').oninput=e=>{mobileCfg.size=+e.target.value/100;saveMobileCfg()};$('mopacity').oninput=e=>{mobileCfg.opacity=+e.target.value/100;saveMobileCfg()};",
'mobile settings wire');

style += `\n/* Gameplay Overhaul V3 */\n#cross.enemy:before,#cross.enemy:after{background:#ff5b5b;box-shadow:0 0 5px #ff3a3a}#cross.hit:before,#cross.hit:after{background:#fff55c}.quick-star{position:absolute;left:4px;top:2px;font-size:12px;color:#777;z-index:2}.quick-star.on{color:#ffd84f;text-shadow:1px 1px #5a4700}#bowCharge{height:18px}#bowChargeText{position:absolute;top:12px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:8px;color:#fff;text-shadow:1px 1px #000}.feed-item.sudden{border-left-color:#c96cff;color:#ffd7ff}.settings-btn{right:178px!important;bottom:28px!important;width:48px!important}.mb{opacity:var(--mobile-opacity,.78);transform:scale(var(--mobile-scale,1));transform-origin:center}#mobileSettings{display:none;position:absolute;right:12px;top:12px;width:210px;padding:10px;background:#111d;border:2px solid #fff5;pointer-events:auto;color:#fff;font-size:9px}#mobileSettings.open{display:block}#mobileSettings label{display:block;margin:8px 0}#mobileSettings input{width:100%}@media(pointer:coarse),(max-width:800px){#actBtn{width:82px!important;height:60px!important}.settings-btn{display:block!important}}\n`;

fs.writeFileSync('server.js',server);fs.writeFileSync('public/game.js',game);fs.writeFileSync('public/index.html',index);fs.writeFileSync('public/style.css',style);console.log('Gameplay Overhaul V3 applied');
