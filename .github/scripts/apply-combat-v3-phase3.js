const fs=require('fs');
function once(s,a,b,label){const n=s.split(a).length-1;if(n!==1)throw new Error(`${label}: expected 1 match, got ${n}`);return s.replace(a,b)}
function onceRe(s,re,b,label){const matches=s.match(new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g'))||[];if(matches.length!==1)throw new Error(`${label}: expected 1 match, got ${matches.length}`);return s.replace(re,b)}
let server=fs.readFileSync('server.js','utf8');
let game=fs.readFileSync('public/game.js','utf8');
let index=fs.readFileSync('public/index.html','utf8');

server=once(server,
`  HISTORY_BUFFER_MS:600,MAX_REWIND_MS:250,NOMINAL_REACH:3.55,HARD_REACH_LIMIT:4.00,
  COMBO_TIMEOUT_MS:1000
};`,
`  HISTORY_BUFFER_MS:600,MAX_REWIND_MS:250,NOMINAL_REACH:3.55,HARD_REACH_LIMIT:4.00,
  KB_HORIZONTAL:7.40,KB_VERTICAL:4.00,AIR_KB_MULTIPLIER_H:.92,AIR_KB_MULTIPLIER_V:.95,
  SPRINT_KB_MULTIPLIER:1.10,STICK_KB_MULTIPLIER:1.90,STICK_VERTICAL_MULTIPLIER:1.05,
  COMBO_TIMEOUT_MS:1000,COMBO_MAX:8,COMBO_KB_DECAY:.025,COMBO_KB_MIN:.90
};`,'phase3 combat config');

server=once(server,
`  token: crypto.randomBytes(18).toString('hex'), disconnected:false, disconnectedAt:0, reconnectDeadline:0, roomCode:'', spectator:false,spawnProtect:0,hspeed:0,grounded:false,wasGrounded:false,fallVyMin:0,envIh:0,lastCombatAt:0,comboTarget:0,comboCount:0,`,
`  token: crypto.randomBytes(18).toString('hex'), disconnected:false, disconnectedAt:0, reconnectDeadline:0, roomCode:'', spectator:false,spawnProtect:0,hspeed:0,grounded:false,wasGrounded:false,fallVyMin:0,envIh:0,lastCombatAt:0,lastComboHitAt:0,comboTarget:0,comboCount:0,`,'combo state field');

server=once(server,
`function resetCombatInput(p){
  const n=Date.now();p.attackQueue=[];p.attackNetTokens=COMBAT_CONFIG.NETWORK_BUCKET_CAPACITY;p.attackNetAt=n;p.attackUsefulTokens=COMBAT_CONFIG.USEFUL_BUCKET_CAPACITY;p.attackUsefulAt=n;p.combatHistory=[];resetComboState(p);recordCombatHistory(p,n);
}`,
`function resetComboState(p){if(!p)return;p.comboTarget=0;p.comboCount=0;p.lastComboHitAt=0}
function resetCombatInput(p){
  const n=Date.now();p.attackQueue=[];p.attackNetTokens=COMBAT_CONFIG.NETWORK_BUCKET_CAPACITY;p.attackNetAt=n;p.attackUsefulTokens=COMBAT_CONFIG.USEFUL_BUCKET_CAPACITY;p.attackUsefulAt=n;p.combatHistory=[];resetComboState(p);recordCombatHistory(p,n);
}
function meleeKnockbackV2(attacker,target,resolved,nextCombo,stick){
  const a=resolved.attackerState,t=resolved.targetState,hit=resolved.hit,dx=t.x-a.x,dz=t.z-a.z,L=Math.hypot(dx,dz),fallbackL=Math.hypot(hit.dir.x,hit.dir.z)||1,nx=L>.001?dx/L:hit.dir.x/fallbackL,nz=L>.001?dz/L:hit.dir.z/fallbackL;
  const airborne=!target.grounded||target.dy>1.2;let horizontal=COMBAT_CONFIG.KB_HORIZONTAL,vertical=COMBAT_CONFIG.KB_VERTICAL;
  if(attacker.hspeed>5.15)horizontal*=COMBAT_CONFIG.SPRINT_KB_MULTIPLIER;
  if(stick){horizontal*=COMBAT_CONFIG.STICK_KB_MULTIPLIER;vertical*=COMBAT_CONFIG.STICK_VERTICAL_MULTIPLIER}
  if(airborne){horizontal*=COMBAT_CONFIG.AIR_KB_MULTIPLIER_H;vertical*=COMBAT_CONFIG.AIR_KB_MULTIPLIER_V}
  const comboScale=Math.max(COMBAT_CONFIG.COMBO_KB_MIN,1-Math.max(0,nextCombo-1)*COMBAT_CONFIG.COMBO_KB_DECAY);horizontal*=comboScale;
  return{kx:nx*horizontal,kz:nz*horizontal,vy:vertical,h:horizontal,v:vertical,airborne,comboScale};
}`,'phase3 helpers');

server=onceRe(server,/function evaluateQueuedMeleeAttack\(R,p,a\)\{[\s\S]*?\n\}/,
`function evaluateQueuedMeleeAttack(R,p,a){
  const resolved=rewoundMeleeTarget(R,p,a);if(!resolved)return false;const q=resolved.q,hit=resolved.hit;
  const hk=heldKey(p),stick=hk==='knockbackStick'&&(p.inv.knockbackStick||0)>0;if(hk!=='sword'&&!stick){acFlag(p,'item','hit with '+hk);return false}
  const now=R.t,sameTarget=p.comboTarget===q.id,withinWindow=(now-(p.lastComboHitAt||0))*1000<COMBAT_CONFIG.COMBO_TIMEOUT_MS,nextCombo=sameTarget&&withinWindow?Math.min(COMBAT_CONFIG.COMBO_MAX,p.comboCount+1):1;
  const cr=!stick&&p.dy<-1,damage=stick?1.5:(DMG[p.sw]+2*p.up.sharp)*(cr?1.5:1),impulse=meleeKnockbackV2(p,q,resolved,nextCombo,stick);
  if(!hurt(R,q,damage,impulse.kx,impulse.kz,p,cr,'melee',impulse.vy,COMBAT_CONFIG.MELEE_IFRAME_SEC,'direct'))return false;
  p.comboCount=nextCombo;p.comboTarget=q.id;p.lastComboHitAt=now;p.lastCombatAt=now;
  tx(p,{t:'hitok',seq:a.seq,id:q.id,hp:Math.max(0,Math.ceil(q.hp)),cr:cr?1:0,combo:p.comboCount,rw:Math.round(resolved.rewindMs),dist:+hit.dist.toFixed(2),kbh:+impulse.h.toFixed(2),kbv:+impulse.v.toFixed(2)});bc(R,{t:'anim',id:p.id,k:'attack'});return true;
}`,'phase3 melee evaluator');

server=once(server,
`function hurt(R,q,d,kx,kz,src,cr,cause='combat',kbVy=4.5,iframeSec=GAMEPLAY.damageIFrames){
  if(!q.alive||q.admin)return false;
  if(q.spawnProtect>0&&src&&src!==q)return false;
  const environmental=cause==='fall'||cause==='collapse';
  if(environmental){if((q.envIh||0)>0)return false;q.envIh=.12}else{if(q.ih>0)return false;q.ih=iframeSec}
  d*=Math.max(.2,1-.25*q.ar-.1*q.up.prot);const dealt=Math.max(0,d);if(dealt<=0)return false;q.hp-=dealt;
  if(src){q.src=src;q.st=R.t;q.lastCombatAt=R.t}
  const airborne=!q.grounded||q.dy>1.2,airMul=airborne?.90:1,comboMul=src&&src.comboCount>=2?.96:1;
  const horiz=7.45*airMul*comboMul,vertical=kbVy*(airborne?.95:1);
  tx(q,{t:'kb',kx:kx*horiz,kz:kz*horiz,vy:vertical});sfx(q,'hurt');
  bc(R,{t:'fx',x:q.x,y:q.y+1,z:q.z,c:cr?0xffd23d:0xd23c3c});bc(R,{t:'hitfx',x:q.x,y:q.y+1,z:q.z,cr:cr?1:0,d:+dealt.toFixed(1),target:q.id,src:src?src.id:0});tx(q,{t:'hurtPulse',d:+dealt.toFixed(1),cr:cr?1:0});
  if(q.hp<=0)die(R,q,cause);return true;
}`,
`function hurt(R,q,d,kx,kz,src,cr,cause='combat',kbVy=4.5,iframeSec=GAMEPLAY.damageIFrames,kbMode='scaled'){
  if(!q.alive||q.admin)return false;
  if(q.spawnProtect>0&&src&&src!==q)return false;
  const environmental=cause==='fall'||cause==='collapse';
  if(environmental){if((q.envIh||0)>0)return false;q.envIh=.12}else{if(q.ih>0)return false;q.ih=iframeSec}
  d*=Math.max(.2,1-.25*q.ar-.1*q.up.prot);const dealt=Math.max(0,d);if(dealt<=0)return false;q.hp-=dealt;
  if(src){q.src=src;q.st=R.t;q.lastCombatAt=R.t}
  const melee=cause==='melee'&&!!src;if(melee)resetComboState(q);
  let outKx=kx,outKz=kz,vertical=kbVy;
  if(kbMode!=='direct'){
    const airborne=!q.grounded||q.dy>1.2,airMul=airborne?.90:1,horiz=7.45*airMul;outKx=kx*horiz;outKz=kz*horiz;vertical=kbVy*(airborne?.95:1);
  }
  tx(q,{t:'kb',kx:outKx,kz:outKz,vy:vertical,mode:melee?'melee':'generic'});sfx(q,'hurt');
  bc(R,{t:'fx',x:q.x,y:q.y+1,z:q.z,c:cr?0xffd23d:0xd23c3c});bc(R,{t:'hitfx',x:q.x,y:q.y+1,z:q.z,cr:cr?1:0,d:+dealt.toFixed(1),target:q.id,src:src?src.id:0});tx(q,{t:'hurtPulse',d:+dealt.toFixed(1),cr:cr?1:0,breakCombo:melee?1:0});
  if(q.hp<=0)die(R,q,cause);return true;
}`,'phase3 hurt pipeline');

game=once(game,
`case'hurtPulse':screenHurt(!!m.cr);break;`,
`case'hurtPulse':if(m.breakCombo){const c=$('comboHud');c.classList.remove('show');c.textContent='';comboHudUntil=0}screenHurt(!!m.cr);break;`,'client combo break feedback');

index=once(index,'/game.js?v=combat-v3-phase2-20261008','/game.js?v=combat-v3-phase3-20261008','phase3 cache bust');

fs.writeFileSync('server.js',server);fs.writeFileSync('public/game.js',game);fs.writeFileSync('public/index.html',index);console.log('Combat V3 phase 3 applied');
