const fs=require('fs');
function once(s,a,b,label){const n=s.split(a).length-1;if(n!==1)throw new Error(`${label}: expected 1 match, got ${n}`);return s.replace(a,b)}
let server=fs.readFileSync('server.js','utf8');
let game=fs.readFileSync('public/game.js','utf8');
let index=fs.readFileSync('public/index.html','utf8');
let style=fs.readFileSync('public/style.css','utf8');

// ---------- SERVER: combat / fall / void / feed ----------
server=once(server,
"const CENTRAL_GEN={diamond:24,emerald:40};",
`const CENTRAL_GEN={diamond:24,emerald:40};
const CENTRAL_GEN_TIERS=[
  {at:0,diamond:24,emerald:40,label:'I'},
  {at:6*60,diamond:18,emerald:32,label:'II'},
  {at:12*60,diamond:12,emerald:24,label:'III'}
];
function centralGenCfg(R){let c=CENTRAL_GEN_TIERS[0];for(const q of CENTRAL_GEN_TIERS)if((R.t||0)>=q.at)c=q;return c}`,
'central tiers');

server=once(server,
"spectator:false,spawnProtect:0,hspeed:0,grounded:false,wasGrounded:false,fallVyMin:0,lastCombatAt:0,comboTarget:0,comboCount:0,",
"spectator:false,spawnProtect:0,hspeed:0,grounded:false,wasGrounded:false,fallVyMin:0,envIh:0,lastCombatAt:0,comboTarget:0,comboCount:0,",
'player env iframe');

server=once(server,
"const feed = (R, text, aTeam=-1, bTeam=-1, kind='info') => bc(R,{t:'feed',text,aTeam,bTeam,kind,at:Date.now()});",
`const feed = (R, text, aTeam=-1, bTeam=-1, kind='info',parts=null) => bc(R,{t:'feed',text,aTeam,bTeam,kind,parts,at:Date.now()});
const feedParts=(...p)=>p.filter(Boolean);`,
'feed structured');

server=once(server,
`  const killer = q.src && R.t - q.st < 5 && q.src!==q ? q.src : null;
  const final = !R.bed[q.team];if(final)q.spectator=true;
  tx(q,{t:'deathState',final:final?1:0,respawn:final?0:5,cause,killer:killer?killer.name:''});
  if(killer){
    if(final) killer.stats.finalKills++; else killer.stats.kills++;
    killer.k++;
    const verb=cause==='void'?'derrubou':cause==='explosion'?'explodiu':cause==='fall'?'fez cair':'eliminou';
    feed(R,\`${'${killer.name} ${verb} ${q.name}${final?\' DEFINITIVAMENTE!\':\'\'}'}\`,killer.team,q.team,final?'final':'kill');
  } else {
    feed(R,\`${'${q.name} morreu${cause===\'void\'?\' no vazio\':cause===\'explosion\'?\' em uma explosão\':cause===\'fall\'?\' por queda\':\'\'}'}\`,-1,q.team,'death');
  }`,
`  const creditWindow=(cause==='void'||cause==='fall')?8:5;
  const killer = q.src && R.t - q.st < creditWindow && q.src!==q ? q.src : null;
  const final = !R.bed[q.team];if(final)q.spectator=true;
  tx(q,{t:'deathState',final:final?1:0,respawn:final?0:5,cause,killer:killer?killer.name:''});
  if(killer){
    if(final) killer.stats.finalKills++; else killer.stats.kills++;
    killer.k++;
    let icon='⚔',middle=' matou ';
    if(cause==='void'){icon='☠';middle=' foi jogado no vazio por ';}
    else if(cause==='explosion'){icon='🔥';middle=' morreu para Fireball de ';}
    else if(cause==='fall'){icon='☠';middle=' caiu por causa de ';}
    const text=cause==='void'?\`${'${icon} ${q.name}${middle}${killer.name}${final?\' · FINAL!\':\'\'}'}\`:cause==='explosion'?\`${'${icon} ${q.name}${middle}${killer.name}${final?\' · FINAL!\':\'\'}'}\`:\`${'${icon} ${killer.name}${middle}${q.name}${final?\' · FINAL!\':\'\'}'}\`;
    const parts=cause==='void'||cause==='explosion'?feedParts({text:icon+' '},{text:q.name,team:q.team},{text:middle},{text:killer.name,team:killer.team},{text:final?' · FINAL!':''}):feedParts({text:icon+' '},{text:killer.name,team:killer.team},{text:middle},{text:q.name,team:q.team},{text:final?' · FINAL!':''});
    feed(R,text,killer.team,q.team,final?'final':'kill',parts);
  } else {
    const icon=cause==='void'?'☠':cause==='explosion'?'🔥':cause==='fall'?'☠':'☠',middle=cause==='void'?' caiu no vazio':cause==='explosion'?' morreu em uma explosão':cause==='fall'?' morreu por queda':' morreu';
    feed(R,icon+' '+q.name+middle,-1,q.team,'death',feedParts({text:icon+' '},{text:q.name,team:q.team},{text:middle}));
  }`,
'death feed and credit');

server=once(server,
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
}`,
`function hurt(R,q,d,kx,kz,src,cr,cause='combat',kbVy=4.5){
  if(!q.alive||q.admin)return false;
  if(q.spawnProtect>0&&src&&src!==q)return false;
  const environmental=cause==='fall'||cause==='collapse';
  if(environmental){if((q.envIh||0)>0)return false;q.envIh=.12}else{if(q.ih>0)return false;q.ih=GAMEPLAY.damageIFrames}
  d*=Math.max(.2,1-.25*q.ar-.1*q.up.prot);const dealt=Math.max(0,d);if(dealt<=0)return false;q.hp-=dealt;
  if(src){q.src=src;q.st=R.t;q.lastCombatAt=R.t}
  const airborne=!q.grounded||q.dy>1.2,airMul=airborne?.90:1,comboMul=src&&src.comboCount>=2?.96:1;
  const horiz=7.45*airMul*comboMul,vertical=kbVy*(airborne?.95:1);
  tx(q,{t:'kb',kx:kx*horiz,kz:kz*horiz,vy:vertical});sfx(q,'hurt');
  bc(R,{t:'fx',x:q.x,y:q.y+1,z:q.z,c:cr?0xffd23d:0xd23c3c});bc(R,{t:'hitfx',x:q.x,y:q.y+1,z:q.z,cr:cr?1:0,d:+dealt.toFixed(1),target:q.id,src:src?src.id:0});tx(q,{t:'hurtPulse',d:+dealt.toFixed(1),cr:cr?1:0});
  if(q.hp<=0)die(R,q,cause);return true;
}`,
'hurt split iframe and kb');

server=once(server,
`        const d=[hit.dir.x,hit.dir.y,hit.dir.z],now=R.t;if(p.comboTarget===q.id&&now-p.lastCombatAt<1.05)p.comboCount=Math.min(8,p.comboCount+1);else p.comboCount=1;p.comboTarget=q.id;p.lastCombatAt=now;
        const cr=!stick&&p.dy<-1,sprintMul=p.hspeed>5.15?1.12:1,kb=(stick?1.9:1)*sprintMul,damage=stick?1.5:(DMG[p.sw]+2*p.up.sharp)*(cr?1.5:1);
        if(!hurt(R,q,damage,d[0]*kb,d[2]*kb,p,cr))break;
        tx(p,{t:'hitok',id:q.id,hp:Math.max(0,Math.ceil(q.hp)),cr:cr?1:0,combo:p.comboCount});bc(R,{t:'anim',id:p.id,k:'attack'});break`,
`        const d=[hit.dir.x,hit.dir.y,hit.dir.z],now=R.t,nextCombo=p.comboTarget===q.id&&now-p.lastCombatAt<1.05?Math.min(8,p.comboCount+1):1;
        const cr=!stick&&p.dy<-1,sprintMul=p.hspeed>5.15?1.14:1,kb=(stick?1.9:1)*sprintMul,damage=stick?1.5:(DMG[p.sw]+2*p.up.sharp)*(cr?1.5:1);
        if(!hurt(R,q,damage,d[0]*kb,d[2]*kb,p,cr))break;
        p.comboCount=nextCombo;p.comboTarget=q.id;p.lastCombatAt=now;
        tx(p,{t:'hitok',id:q.id,hp:Math.max(0,Math.ceil(q.hp)),cr:cr?1:0,combo:p.comboCount});bc(R,{t:'anim',id:p.id,k:'attack'});break`,
'combo after damage');

server=once(server,
`if(!spectating&&!p.admin){const below=get(R,Math.floor(p.x),Math.floor(p.y-.08),Math.floor(p.z))||get(R,Math.floor(p.x+.25),Math.floor(p.y-.08),Math.floor(p.z));p.wasGrounded=p.grounded;p.grounded=!!below;if(newDy<p.fallVyMin)p.fallVyMin=newDy;if(p.grounded&&!p.wasGrounded){const impact=Math.abs(Math.min(0,p.fallVyMin));if(impact>10.8)hurt(R,p,Math.min(12,(impact-10.8)*.78),0,0,null,false,'fall',0);p.fallVyMin=0}else if(p.grounded)p.fallVyMin=0}`,
`if(!spectating&&!p.admin){const fy=Math.floor(p.y-.09),feet=[[0,0],[.28,0],[-.28,0],[0,.28],[0,-.28],[.22,.22],[-.22,.22],[.22,-.22],[-.22,-.22]],below=feet.some(([ox,oz])=>get(R,Math.floor(p.x+ox),fy,Math.floor(p.z+oz)));p.wasGrounded=p.grounded;p.grounded=!!below;if(!p.grounded&&newDy<p.fallVyMin)p.fallVyMin=newDy;if(p.grounded&&!p.wasGrounded){const impact=Math.abs(Math.min(0,p.fallVyMin));if(impact>10.2)hurt(R,p,Math.min(14,(impact-10.2)*.82),0,0,null,false,'fall',0);p.fallVyMin=0}else if(p.grounded&&Math.abs(newDy)<1.5)p.fallVyMin=0}`,
'fall edge detection');

server=once(server,
"        p.ih=Math.max(0,p.ih-dt);p.spawnProtect=Math.max(0,(p.spawnProtect||0)-dt);",
"        p.ih=Math.max(0,p.ih-dt);p.envIh=Math.max(0,(p.envIh||0)-dt);p.spawnProtect=Math.max(0,(p.spawnProtect||0)-dt);",
'env iframe tick');

server=once(server,
"  if(src){src.stats.bedsDestroyed++;feed(R,`${src.name} destruiu a cama do Time ${S.TN[t]}!`,src.team,t,'bed');}",
"  if(src){src.stats.bedsDestroyed++;feed(R,`🛏 ${src.name} destruiu a cama ${S.TN[t]}!`,src.team,t,'bed',feedParts({text:'🛏 '},{text:src.name,team:src.team},{text:' destruiu a cama '},{text:S.TN[t],team:t},{text:'!'}));}",
'bed feed');

// ---------- SERVER: protected placement and smart placement cadence ----------
server=once(server,
"function spawn(p) { const sp=p.roomSpawn||[S.IS[p.team][0]+.5,S.BASE_Y+2.02,S.IS[p.team][1]+.5];",
`function protectedPlacement(R,x,y,z){
  for(const t of modeCfg(R).activeTeams){
    const b=R.BD?.[t];if(b&&x===b[0]&&y===b[1]&&z===b[2])return 'bed';
    const sh=R.SHOP?.[t];if(sh&&Math.hypot(x+.5-sh[0],z+.5-sh[2])<1.3&&Math.abs(y+.5-sh[1])<2.4)return 'shop';
    for(const kind of ['team','ender']){const c=chestPos(R,t,kind);if(c&&Math.hypot(x+.5-c[0],z+.5-c[2])<1.05&&Math.abs(y+.5-c[1])<1.8)return 'chest'}
  }
  return '';
}
function spawn(p) { const sp=p.roomSpawn||[S.IS[p.team][0]+.5,S.BASE_Y+2.02,S.IS[p.team][1]+.5];`,
'protected placement helper');

server=once(server,
"        if(!allow(p,'place',auto?90:62)){acFlag(p,'place','rate');placeResult(false,'cooldown');break}",
"        const placeGap=auto?(p.hspeed>5.2?82:p.hspeed>3?90:105):64;if(!allow(p,'place',placeGap)){acFlag(p,'place','rate');placeResult(false,'cooldown');break}",
'smart placement cps');

server=once(server,
"        if(![[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].some(d=>get(R,x+d[0],y+d[1],z+d[2]))){placeResult(false,'no_support');break}\n        if([...R.ps.values()].some(q=>playerHitsBlock(q,x,y,z))){sfx(p,'blocked');placeResult(false,'player_collision');break}",
"        if(![[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].some(d=>get(R,x+d[0],y+d[1],z+d[2]))){placeResult(false,'no_support');break}\n        const protectedKind=protectedPlacement(R,x,y,z);if(protectedKind){sfx(p,'blocked');placeResult(false,'protected_'+protectedKind);break}\n        if([...R.ps.values()].some(q=>playerHitsBlock(q,x,y,z))){sfx(p,'blocked');placeResult(false,'player_collision');break}",
'placement protected structures');

// ---------- SERVER: projectiles ----------
server=once(server,
`function projectileImpact(R,pr,x,y,z,target){
  const owner=R.ps.get(pr.o);
  if(pr.k==='arrow'&&target)hurt(R,target,4+5*pr.charge,pr.vx/(Math.hypot(pr.vx,pr.vz)||1)*1.12,pr.vz/(Math.hypot(pr.vx,pr.vz)||1)*1.12,owner);
  else if(pr.k==='snowball'&&target)hurt(R,target,2.5,pr.vx/(Math.hypot(pr.vx,pr.vz)||1)*1.45,pr.vz/(Math.hypot(pr.vx,pr.vz)||1)*1.45,owner);
  else if(pr.k==='fireball')fireballBoom(R,x,y,z,owner);
  else if(['tnt','tntImpulse','tntSlow','tntDamage'].includes(pr.k))throwableTntBoom(R,pr.k,x,y,z,owner);
  else if(pr.k==='pearl'&&owner&&owner.alive){const pos=safePearlPos(R,pr,x,y,z);if(pos){owner.x=pos[0];owner.y=pos[1];owner.z=pos[2];owner.hp=Math.max(1,owner.hp-2);owner.px=owner.x;owner.py=owner.y;owner.pz=owner.z;tx(owner,{t:'tp',x:owner.x,y:owner.y,z:owner.z,hard:1})}else tx(owner,{t:'m',s:'A pérola não encontrou um local seguro.'});}
  bc(R,{t:'projHit',id:pr.id,k:pr.k,x,y,z});
}`,
`function projectileImpact(R,pr,x,y,z,target){
  const owner=R.ps.get(pr.o);let dealt=false;
  if(pr.k==='arrow'&&target)dealt=hurt(R,target,4+5*pr.charge,pr.vx/(Math.hypot(pr.vx,pr.vz)||1)*1.18,pr.vz/(Math.hypot(pr.vx,pr.vz)||1)*1.18,owner,false,'projectile',4.0);
  else if(pr.k==='snowball'&&target)dealt=hurt(R,target,1.5,pr.vx/(Math.hypot(pr.vx,pr.vz)||1)*1.62,pr.vz/(Math.hypot(pr.vx,pr.vz)||1)*1.62,owner,false,'projectile',3.2);
  else if(pr.k==='fireball')fireballBoom(R,x,y,z,owner);
  else if(['tnt','tntImpulse','tntSlow','tntDamage'].includes(pr.k))throwableTntBoom(R,pr.k,x,y,z,owner);
  else if(pr.k==='pearl'&&owner&&owner.alive){const pos=safePearlPos(R,pr,x,y,z);if(pos){owner.x=pos[0];owner.y=pos[1];owner.z=pos[2];owner.hp=Math.max(1,owner.hp-2);owner.px=owner.x;owner.py=owner.y;owner.pz=owner.z;tx(owner,{t:'tp',x:owner.x,y:owner.y,z:owner.z,hard:1})}else tx(owner,{t:'m',s:'A pérola não encontrou um local seguro.'});}
  if(dealt&&owner)tx(owner,{t:'projectileHit',k:pr.k,id:target?.id||0});
  bc(R,{t:'projHit',id:pr.id,k:pr.k,x,y,z,target:target?.id||0,vx:pr.vx,vy:pr.vy,vz:pr.vz});
}`,
'projectile hitmarker and impact');

server=once(server,
"    const grav=pr.k==='fireball'?0:pr.k==='bridgeEgg'?1.8:pr.k==='arrow'?7.2:pr.k==='pearl'?6.2:pr.k.startsWith('tnt')?9.2:7.5;",
"    const grav=pr.k==='fireball'?.35:pr.k==='bridgeEgg'?3.0:pr.k==='arrow'?8.2:pr.k==='pearl'?7.4:pr.k.startsWith('tnt')?10.2:8.8;",
'projectile gravity');

server=once(server,
"    if(!S.inXZ(x,z)||y<1||y>=S.H-2||get(R,x,y,z))continue;\n    if([...R.ps.values()].some(q=>playerHitsBlock(q,x,y,z)))continue;",
"    if(!S.inXZ(x,z)||y<1||y>=S.H-2||get(R,x,y,z)||protectedPlacement(R,x,y,z))continue;\n    if([...R.ps.values()].some(q=>playerHitsBlock(q,x,y,z)))continue;",
'bridge egg protected');

// ---------- SERVER: generator tiers ----------
server=once(server,
`function genSnapshot(R){
  const base=R.g.base.map((g,i)=>{const tier=Math.max(0,Math.min(3,R.genTier?.[i]||0)),cfg=BASE_GEN_TIERS[tier];return [+(Math.max(0,cfg.iron-g.iron)).toFixed(2),cfg.gold?+(Math.max(0,cfg.gold-g.gold)).toFixed(2):-1,cfg.dia?+(Math.max(0,cfg.dia-g.dia)).toFixed(2):-1,tier]});
  const dia=R.g.dia.map(g=>+(Math.max(0,CENTRAL_GEN.diamond-g.t)).toFixed(2));
  return {base,dia,em:+Math.max(0,CENTRAL_GEN.emerald-R.g.em.t).toFixed(2),tiers:[...(R.genTier||[])]};
}`,
`function genSnapshot(R){
  const base=R.g.base.map((g,i)=>{const tier=Math.max(0,Math.min(3,R.genTier?.[i]||0)),cfg=BASE_GEN_TIERS[tier];return [+(Math.max(0,cfg.iron-g.iron)).toFixed(2),cfg.gold?+(Math.max(0,cfg.gold-g.gold)).toFixed(2):-1,cfg.dia?+(Math.max(0,cfg.dia-g.dia)).toFixed(2):-1,tier]});
  const cg=centralGenCfg(R),dia=R.g.dia.map(g=>+(Math.max(0,cg.diamond-g.t)).toFixed(2));
  return {base,dia,em:+Math.max(0,cg.emerald-R.g.em.t).toFixed(2),tiers:[...(R.genTier||[])],centralTier:cg.label};
}`,
'generator snapshot tier');

server=once(server,
`      R.g.dia.forEach((g, i) => {
        g.t += dt;
        if(g.t<CENTRAL_GEN.diamond)return;
        g.t-=CENTRAL_GEN.diamond;
        const [gx,gy,gz]=R.DIGEN[i];addDrop(R,'dia',1,gx,gy,gz,4);
      });
      R.g.em.t += dt;
      if(R.g.em.t>=CENTRAL_GEN.emerald){
        R.g.em.t-=CENTRAL_GEN.emerald;
        const [gx,gy,gz]=R.EMGEN;addDrop(R,'em',1,gx,gy,gz,2);
      }`,
`      const centralCfg=centralGenCfg(R);
      R.g.dia.forEach((g, i) => {
        g.t += dt;
        if(g.t<centralCfg.diamond)return;
        g.t-=centralCfg.diamond;
        const [gx,gy,gz]=R.DIGEN[i];addDrop(R,'dia',1,gx,gy,gz,4);
      });
      R.g.em.t += dt;
      if(R.g.em.t>=centralCfg.emerald){
        R.g.em.t-=centralCfg.emerald;
        const [gx,gy,gz]=R.EMGEN;addDrop(R,'em',1,gx,gy,gz,2);
      }`,
'generator tick tiers');

// ---------- CLIENT: HUD, feed, F3 ----------
index=once(index,
"<div id=\"cross\"></div><div id=\"msg\"></div><div id=\"killFeed\"></div><div id=\"bar\"></div>",
"<div id=\"cross\"></div><div id=\"msg\"></div><div id=\"comboHud\"></div><div id=\"killFeed\"></div><div id=\"bar\"></div><div id=\"bowTrajectory\"></div>",
'combo and bow trajectory ui');

game=once(game,
"let matchTime=0,respawnEnds=0,respawnFinal=false,lastScoreboardAt=0;const matchPlayers=new Map();let myMatchStats={kills:0,finalKills:0};",
"let matchTime=0,respawnEnds=0,respawnFinal=false,lastScoreboardAt=0,comboHudUntil=0;const matchPlayers=new Map();let myMatchStats={kills:0,finalKills:0};",
'combo state');

game=once(game,
`function addFeed(m){
 const el=document.createElement('div');el.className='feed-item '+(m.kind||'info');el.textContent=m.text;const tc=m.aTeam>=0?TC[m.aTeam]:m.bTeam>=0?TC[m.bTeam]:null;if(tc!=null)el.style.borderLeftColor='#'+hex(tc);
 $('killFeed').appendChild(el);setTimeout(()=>el.remove(),5100);
}`,
`function addFeed(m){
 const el=document.createElement('div');el.className='feed-item '+(m.kind||'info');
 if(Array.isArray(m.parts)&&m.parts.length){m.parts.forEach(p=>{const s=document.createElement('span');s.textContent=String(p.text||'');if(Number.isInteger(p.team)&&p.team>=0&&TC[p.team]!=null){s.style.color='#'+hex(TC[p.team]);s.style.fontWeight='700'}el.appendChild(s)})}else el.textContent=m.text;
 const tc=m.aTeam>=0?TC[m.aTeam]:m.bTeam>=0?TC[m.bTeam]:null;if(tc!=null)el.style.borderLeftColor='#'+hex(tc);
 $('killFeed').appendChild(el);while($('killFeed').children.length>6)$('killFeed').firstChild.remove();setTimeout(()=>el.remove(),5100);
}`,
'colored kill feed');

game=once(game,
"const diag={show:false,ping:0,fps:60,frames:0,lastFpsAt:performance.now(),resyncs:0,serverBuffer:0,qualityChanges:0,ac:{total:0,last:''}};",
"const diag={show:false,ping:0,fps:60,frames:0,lastFpsAt:performance.now(),resyncs:0,serverBuffer:0,qualityChanges:0,placePing:0,placeRejected:0,placeAccepted:0,ac:{total:0,last:''}};",
'diag placement');

game=once(game,
"<span>Predições '+BRIDGE_PRED.size+' · Resyncs '+diag.resyncs+'</span><span>AC bloqueios ",
"<span>Blocos pendentes '+BRIDGE_PRED.size+' · Rejeitados '+diag.placeRejected+'</span><span>Colocar ping '+diag.placePing+' ms · Aceitos '+diag.placeAccepted+'</span><span>Resyncs '+diag.resyncs+'</span><span>AC bloqueios ",
'diag f3 text');

game=once(game,
"case'placeResult':{const key=m.x+','+m.y+','+m.z,b=BRIDGE_PRED.get(key);if(PLACEABLE.has(m.k)&&Number.isFinite(m.remaining))inv[m.k]=Math.max(0,Math.floor(m.remaining));if(m.ok){if(b)b.acked=true}else if(b)rollbackPrediction(key,false);hud();break}",
"case'placeResult':{const key=m.x+','+m.y+','+m.z,b=BRIDGE_PRED.get(key);if(b)diag.placePing=Math.round(performance.now()-b.at);if(PLACEABLE.has(m.k)&&Number.isFinite(m.remaining))inv[m.k]=Math.max(0,Math.floor(m.remaining));if(m.ok){diag.placeAccepted++;if(b)b.acked=true}else{diag.placeRejected++;if(b)rollbackPrediction(key,false)}hud();break}",
'place result diag');

// Combo HUD and improved critical feedback
game=once(game,
"case'hitok':$('cross').style.transform='scale(1.9)';$('cross').classList.add('hit');setTimeout(()=>{$('cross').style.transform='';$('cross').classList.remove('hit')},85);camShake=Math.max(camShake,m.cr?.085:.052);sfx(m.cr?'crit':'hit');{const r=PL.get(m.id);if(r){r.flashUntil=performance.now()+95;r.m.traverse(o=>{if(o.material&&o.material.color){o.userData.baseColor=o.userData.baseColor??o.material.color.getHex();o.material.color.setHex(0xffffff)}})}}if(m.combo>1)msg('COMBO x'+m.combo);break;",
"case'hitok':$('cross').style.transform='scale(1.9)';$('cross').classList.add('hit');setTimeout(()=>{$('cross').style.transform='';$('cross').classList.remove('hit')},85);camShake=Math.max(camShake,m.cr?.10:.055);sfx(m.cr?'crit':'hit');{const r=PL.get(m.id);if(r){r.flashUntil=performance.now()+(m.cr?145:105);r.m.traverse(o=>{if(o.material&&o.material.color){o.userData.baseColor=o.userData.baseColor??o.material.color.getHex();o.material.color.setHex(m.cr?0xfff2a8:0xffffff)}})}}{const c=$('comboHud');if(m.combo>1){c.textContent='COMBO x'+m.combo;c.classList.add('show');comboHudUntil=performance.now()+900}else{c.classList.remove('show');comboHudUntil=0}}break;",
'combo hud hit');

game=once(game,
"  else if(k==='crit'){tone(520,.055,'square',.045,120)}",
"  else if(k==='crit'){tone(720,.045,'square',.055,190);setTimeout(()=>tone(1040,.055,'triangle',.045,240),28);noise(.045,.018,2400)}",
'critical sound');

// ---------- CLIENT: bow preview and projectiles ----------
game=once(game,
"function beginBow(){if(!started||!me.alive||!inv.bow||inv.arrow<1)return;bowCharging=true;bowChargeAt=performance.now();$('bowCharge').style.display='block';$('bowChargeFill').style.width='0%'}",
"function beginBow(){if(!started||!me.alive||!inv.bow||inv.arrow<1)return;bowCharging=true;bowChargeAt=performance.now();$('bowCharge').style.display='block';$('bowChargeFill').style.width='0%';$('bowTrajectory').classList.add('show')}\nfunction drawBowTrajectory(){const el=$('bowTrajectory');if(!bowCharging){el.innerHTML='';el.classList.remove('show');return}const ratio=Math.max(.2,Math.min(1,(performance.now()-bowChargeAt)/1200)),speed=22+22*ratio,cy=Math.cos(pl.pitch),vx=-Math.sin(pl.yaw)*cy*speed,vy=Math.sin(pl.pitch)*speed,vz=-Math.cos(pl.yaw)*cy*speed,pts=[];for(let i=1;i<=13;i++){const t=i*.075,x=cam.position.x+vx*t,y=cam.position.y+vy*t-.5*8.2*t*t,z=cam.position.z+vz*t,v=new THREE.Vector3(x,y,z).project(cam);if(v.z<-1||v.z>1)continue;pts.push(`<i style=\"left:${'${(v.x*.5+.5)*100}'}%;top:${'${(-v.y*.5+.5)*100}'}%;opacity:${'${Math.max(.18,1-i/16)}'}\"></i>`)}el.innerHTML=pts.join('')}",
'bow preview function');

game=once(game,
"function releaseBow(){if(!bowCharging)return;bowCharging=false;const ratio=Math.max(.2,Math.min(1,(performance.now()-bowChargeAt)/1200));$('bowCharge').style.display='none';useAnim=1;send({t:'shoot',k:'bow',yaw:pl.yaw,pitch:pl.pitch,charge:ratio})}",
"function releaseBow(){if(!bowCharging)return;bowCharging=false;const ratio=Math.max(.2,Math.min(1,(performance.now()-bowChargeAt)/1200));$('bowCharge').style.display='none';$('bowTrajectory').classList.remove('show');$('bowTrajectory').innerHTML='';useAnim=1;send({t:'shoot',k:'bow',yaw:pl.yaw,pitch:pl.pitch,charge:ratio})}",
'bow release preview');

game=once(game,
"case'projHit':{const p=PROJ.get(m.id);if(p){sc.remove(p.m);PROJ.delete(m.id)}break}",
"case'projHit':{const p=PROJ.get(m.id);if(p){PROJ.delete(m.id);if(m.k==='arrow'&&!m.target){p.m.position.set(m.x,m.y,m.z);p.m.lookAt(m.x-(m.vx||0),m.y-(m.vy||0),m.z-(m.vz||0));setTimeout(()=>releaseProjectileMesh(p.k,p.m),1200)}else releaseProjectileMesh(p.k,p.m)}if(m.k==='arrow')sfx(m.target?'hit':'arrowImpact');break}\ncase'projectileHit':{$('cross').style.transform='scale(1.75)';$('cross').classList.add('hit');setTimeout(()=>{$('cross').style.transform='';$('cross').classList.remove('hit')},90);camShake=Math.max(camShake,.035);sfx('projectileHit');break}",
'projectile hit and stuck arrow');

game=once(game,
"  else if(k==='arrow'){tone(440,.055,'triangle',.025,-180)}",
"  else if(k==='arrow'){tone(440,.055,'triangle',.025,-180)}\n  else if(k==='arrowImpact'){noise(.04,.018,1500);tone(260,.035,'triangle',.018,-70)}\n  else if(k==='projectileHit'){tone(880,.045,'square',.035,140)}",
'projectile sfx');

// diagonal bridge candidate selection
game=once(game,
` const px=pl.x+dx*.62,pz=pl.z+dz*.62,y=bridgeHoldY,x=Math.floor(px),z=Math.floor(pz);
 if(!inXZ(x,z)||y<1||y>=H-2||get(x,y,z)||!safePlaceTarget(x,y,z))return null;
 const forward=(x+.5-pl.x)*dx+(z+.5-pl.z)*dz;if(forward<-.12||forward>1.55)return null;
 if(!confirmedSupport(x,y,z))return null;
 return{x,y,z,k,auto:1};`,
` const px=pl.x+dx*.66,pz=pl.z+dz*.66,y=bridgeHoldY,bx=Math.floor(px),bz=Math.floor(pz),cands=[[bx,bz]];
 if(Math.abs(dx)>.28&&Math.abs(dz)>.28){cands.push([Math.floor(px+Math.sign(dx)*.32),bz],[bx,Math.floor(pz+Math.sign(dz)*.32)])}
 let best=null,bestScore=Infinity;for(const [x,z] of cands){if(!inXZ(x,z)||y<1||y>=H-2||get(x,y,z)||!safePlaceTarget(x,y,z)||!confirmedSupport(x,y,z))continue;const forward=(x+.5-pl.x)*dx+(z+.5-pl.z)*dz;if(forward<-.12||forward>1.65)continue;const lateral=Math.abs((x+.5-pl.x)*(-dz)+(z+.5-pl.z)*dx),score=lateral+Math.abs(forward-.72)*.22;if(score<bestScore){bestScore=score;best={x,y,z,k,auto:1}}}return best;`,
'diagonal bridge');

// generator labels
game=once(game,
"const GEN_VIS=[];let genState={base:[],dia:[],em:0};",
"const GEN_VIS=[];let genState={base:[],dia:[],em:0,centralTier:'I'};",
'gen state tier');

game=once(game,
"else if(v.type==='dia'){setHologram(v,'DIAMANTE\\n'+Math.ceil(Number(genState.dia[v.index]||0))+'s','#67f3ff')}else setHologram(v,'ESMERALDA\\n'+Math.ceil(Number(genState.em||0))+'s','#55ff88')",
"else if(v.type==='dia'){setHologram(v,'DIAMANTE '+(genState.centralTier||'I')+'\\nNasce em '+Math.ceil(Number(genState.dia[v.index]||0))+'s','#67f3ff')}else setHologram(v,'ESMERALDA '+(genState.centralTier||'I')+'\\nNasce em '+Math.ceil(Number(genState.em||0))+'s','#55ff88')",
'generator hologram text');

// ensure combo expires and trajectory updates per frame
game=once(game,
"function tick(now){requestAnimationFrame(tick);const dt=Math.min((now-last)/1000,.05);last=now;updateDiag(now);updateRespawnUI();",
"function tick(now){requestAnimationFrame(tick);const dt=Math.min((now-last)/1000,.05);last=now;updateDiag(now);updateRespawnUI();if(comboHudUntil&&now>comboHudUntil){comboHudUntil=0;$('comboHud').classList.remove('show')}if(bowCharging)drawBowTrajectory();",
'tick combat/bow ui');

// cache bust
index=index.replace(/\/style\.css\?v=[^\"]+/, '/style.css?v=gameplay-v2-20261005');
index=index.replace(/\/game\.js\?v=[^\"]+/, '/game.js?v=gameplay-v2-20261005');

style += `

/* Gameplay V2 */
#comboHud{position:fixed;left:50%;top:56%;transform:translate(-50%,-50%) scale(.82);z-index:15;pointer-events:none;opacity:0;color:#fff55c;font-size:15px;font-weight:700;text-shadow:2px 2px #000;transition:opacity .08s,transform .08s}
#comboHud.show{opacity:1;transform:translate(-50%,-50%) scale(1)}
#bowTrajectory{display:none;position:fixed;inset:0;z-index:12;pointer-events:none}
#bowTrajectory.show{display:block}
#bowTrajectory i{position:absolute;width:5px;height:5px;margin:-2px;border-radius:50%;background:#fff;box-shadow:0 0 4px #fff,1px 1px #000}
.feed-item span{white-space:pre-wrap}
@media(pointer:coarse),(max-width:800px){#comboHud{top:52%;font-size:12px}#bowTrajectory i{width:4px;height:4px}}
`;

fs.writeFileSync('server.js',server);
fs.writeFileSync('public/game.js',game);
fs.writeFileSync('public/index.html',index);
fs.writeFileSync('public/style.css',style);
console.log('Gameplay V2 applied');
