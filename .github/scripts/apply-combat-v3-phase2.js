const fs=require('fs');
function once(s,a,b,label){const n=s.split(a).length-1;if(n!==1)throw new Error(`${label}: expected 1 match, got ${n}`);return s.replace(a,b)}
function onceRe(s,re,b,label){const m=s.match(re);if(!m)throw new Error(`${label}: pattern not found`);if((s.match(new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g'))||[]).length!==1)throw new Error(`${label}: pattern not unique`);return s.replace(re,b)}
let server=fs.readFileSync('server.js','utf8');
let game=fs.readFileSync('public/game.js','utf8');
let index=fs.readFileSync('public/index.html','utf8');

server=once(server,
`const COMBAT_HITBOX={radius:.36,height:1.80,feetPad:.05,historyMax:.60,meleePad:.055,meleeReach:3.80};
const COMBAT_CONFIG={
  MAX_NETWORK_CPS:25,NETWORK_BUCKET_CAPACITY:8,
  MAX_USEFUL_CPS:15,USEFUL_BUCKET_CAPACITY:2,
  MELEE_IFRAME_SEC:.22,MAX_ATTACK_BATCH:6,MAX_ATTACK_QUEUE:8,MAX_ATTACK_AGE_MS:300,
  COMBO_TIMEOUT_MS:1000
};`,
`const COMBAT_HITBOX={radius:.36,height:1.80,feetPad:.05,historyMax:.60,meleePad:.055,meleeReach:3.55};
const COMBAT_CONFIG={
  MAX_NETWORK_CPS:25,NETWORK_BUCKET_CAPACITY:8,
  MAX_USEFUL_CPS:15,USEFUL_BUCKET_CAPACITY:2,
  MELEE_IFRAME_SEC:.22,MAX_ATTACK_BATCH:6,MAX_ATTACK_QUEUE:8,MAX_ATTACK_AGE_MS:300,
  HISTORY_BUFFER_MS:600,MAX_REWIND_MS:250,NOMINAL_REACH:3.55,HARD_REACH_LIMIT:4.00,
  COMBO_TIMEOUT_MS:1000
};`,'combat phase2 config');

server=once(server,
`  attackQueue:[],lastAttackSeq:0,legacyAttackSeq:0,attackNetTokens:COMBAT_CONFIG.NETWORK_BUCKET_CAPACITY,attackNetAt:Date.now(),attackUsefulTokens:COMBAT_CONFIG.USEFUL_BUCKET_CAPACITY,attackUsefulAt:Date.now(),`,
`  attackQueue:[],lastAttackSeq:0,legacyAttackSeq:0,attackNetTokens:COMBAT_CONFIG.NETWORK_BUCKET_CAPACITY,attackNetAt:Date.now(),attackUsefulTokens:COMBAT_CONFIG.USEFUL_BUCKET_CAPACITY,attackUsefulAt:Date.now(),combatHistory:[],`,'player history state');

server=once(server,
`function resetCombatInput(p){
  p.attackQueue=[];p.attackNetTokens=COMBAT_CONFIG.NETWORK_BUCKET_CAPACITY;p.attackNetAt=Date.now();p.attackUsefulTokens=COMBAT_CONFIG.USEFUL_BUCKET_CAPACITY;p.attackUsefulAt=Date.now();
}
function enqueueMeleeAttack(R,p,a,arrivalTime=Date.now()){`,
`function combatSnapshot(p,t=Date.now()){return{t,x:p.x,y:p.y,z:p.z,yaw:p.yaw,pitch:p.pitch}}
function recordCombatHistory(p,t=Date.now()){
  if(!p)return;const h=p.combatHistory||(p.combatHistory=[]),snap=combatSnapshot(p,t),last=h[h.length-1];
  if(last&&t<=last.t){h[h.length-1]=snap}else h.push(snap);
  const cutoff=t-COMBAT_CONFIG.HISTORY_BUFFER_MS;while(h.length>2&&h[1].t<cutoff)h.shift();
}
function interpolatedCombatState(p,targetTime){
  const h=p.combatHistory;if(!h||!h.length)return combatSnapshot(p,targetTime);
  if(targetTime<=h[0].t)return h[0];const last=h[h.length-1];if(targetTime>=last.t)return last;
  let lo=0,hi=h.length-1;while(lo+1<hi){const mid=(lo+hi)>>1;if(h[mid].t<=targetTime)lo=mid;else hi=mid}
  const a=h[lo],b=h[hi],span=Math.max(1,b.t-a.t),u=Math.max(0,Math.min(1,(targetTime-a.t)/span));
  return{t:targetTime,x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,z:a.z+(b.z-a.z)*u,yaw:a.yaw+(b.yaw-a.yaw)*u,pitch:a.pitch+(b.pitch-a.pitch)*u};
}
function validatedAttackTime(a){
  const arrival=a.arrivalTime||Date.now(),min=arrival-COMBAT_CONFIG.MAX_REWIND_MS,claimed=Number(a.serverTimeEstimate),rtt=Math.max(0,Math.min(500,Number(a.rtt)||0));
  if(Number.isFinite(claimed)&&Math.abs(claimed-arrival)<=1000)return Math.max(min,Math.min(arrival,claimed));
  return Math.max(min,arrival-Math.min(COMBAT_CONFIG.MAX_REWIND_MS,rtt*.5));
}
function combatAabbAt(s,pad=0){const r=COMBAT_HITBOX.radius+pad;return{minX:s.x-r,maxX:s.x+r,minY:s.y-COMBAT_HITBOX.feetPad-pad,maxY:s.y+COMBAT_HITBOX.height+pad,minZ:s.z-r,maxZ:s.z+r}}
function rewoundMeleeTarget(R,p,a){
  const attackTime=validatedAttackTime(a),attackerState=interpolatedCombatState(p,attackTime),cy=Math.cos(a.pitch),dir={x:-Math.sin(a.yaw)*cy,y:Math.sin(a.pitch),z:-Math.cos(a.yaw)*cy};
  const ox=attackerState.x,oy=attackerState.y+1.62,oz=attackerState.z,reach=COMBAT_CONFIG.HARD_REACH_LIMIT,ex=ox+dir.x*reach,ey=oy+dir.y*reach,ez=oz+dir.z*reach;let best=null;
  for(const q of R.ps.values()){
    if(q===p||!q.alive||q.out||q.admin||q.team===p.team)continue;
    const targetState=interpolatedCombatState(q,attackTime),centerDist=Math.hypot(targetState.x-attackerState.x,targetState.y-attackerState.y,targetState.z-attackerState.z);
    if(centerDist>COMBAT_CONFIG.HARD_REACH_LIMIT+COMBAT_HITBOX.radius+COMBAT_HITBOX.meleePad+.35)continue;
    const t=segmentAabbT(ox,oy,oz,ex,ey,ez,combatAabbAt(targetState,COMBAT_HITBOX.meleePad));if(t==null)continue;
    const dist=t*reach;if(dist>COMBAT_CONFIG.NOMINAL_REACH)continue;
    const hx=ox+(ex-ox)*t,hy=oy+(ey-oy)*t,hz=oz+(ez-oz)*t;
    if(segmentHitsBlock(R,ox,oy,oz,hx-dir.x*.035,hy-dir.y*.035,hz-dir.z*.035))continue;
    if(!best||dist<best.hit.dist)best={q,targetState,attackerState,attackTime,rewindMs:Math.max(0,(a.arrivalTime||Date.now())-attackTime),hit:{dir,dist,hx,hy,hz}};
  }
  return best;
}
function resetCombatInput(p){
  const n=Date.now();p.attackQueue=[];p.attackNetTokens=COMBAT_CONFIG.NETWORK_BUCKET_CAPACITY;p.attackNetAt=n;p.attackUsefulTokens=COMBAT_CONFIG.USEFUL_BUCKET_CAPACITY;p.attackUsefulAt=n;p.combatHistory=[];recordCombatHistory(p,n);
}
function enqueueMeleeAttack(R,p,a,arrivalTime=Date.now()){`,'history helpers');

server=once(server,
`  p.attackQueue.push({seq:a.seq,id:a.id,yaw:a.yaw,pitch:a.pitch,clientTime:Number.isFinite(a.clientTime)?a.clientTime:0,arrivalTime});`,
`  p.attackQueue.push({seq:a.seq,id:a.id,yaw:a.yaw,pitch:a.pitch,clientTime:Number.isFinite(a.clientTime)?a.clientTime:0,serverTimeEstimate:Number.isFinite(a.serverTimeEstimate)?a.serverTimeEstimate:NaN,rtt:Number.isFinite(a.rtt)?a.rtt:0,arrivalTime});`,'queued timing fields');

server=onceRe(server,/function evaluateQueuedMeleeAttack\(R,p,a\)\{[\s\S]*?\n\}/,
`function evaluateQueuedMeleeAttack(R,p,a){
  const resolved=rewoundMeleeTarget(R,p,a);if(!resolved)return false;const q=resolved.q,hit=resolved.hit;
  const hk=heldKey(p),stick=hk==='knockbackStick'&&(p.inv.knockbackStick||0)>0;if(hk!=='sword'&&!stick){acFlag(p,'item','hit with '+hk);return false}
  const d=[hit.dir.x,hit.dir.y,hit.dir.z],now=R.t,nextCombo=p.comboTarget===q.id&&(now-p.lastCombatAt)*1000<COMBAT_CONFIG.COMBO_TIMEOUT_MS?Math.min(8,p.comboCount+1):1;
  const cr=!stick&&p.dy<-1,sprintMul=p.hspeed>5.15?1.14:1,kb=(stick?1.9:1)*sprintMul,damage=stick?1.5:(DMG[p.sw]+2*p.up.sharp)*(cr?1.5:1);
  if(!hurt(R,q,damage,d[0]*kb,d[2]*kb,p,cr,'combat',4.5,COMBAT_CONFIG.MELEE_IFRAME_SEC))return false;
  p.comboCount=nextCombo;p.comboTarget=q.id;p.lastCombatAt=now;
  tx(p,{t:'hitok',seq:a.seq,id:q.id,hp:Math.max(0,Math.ceil(q.hp)),cr:cr?1:0,combo:p.comboCount,rw:Math.round(resolved.rewindMs),dist:+hit.dist.toFixed(2)});bc(R,{t:'anim',id:p.id,k:'attack'});return true;
}`,'rewound evaluator');

server=once(server,
`        const oldY=p.y,newDy=(m.y-p.y)/dt;p.hspeed=Math.min(20,d/dt);p.dy=newDy;p.px=p.x;p.py=p.y;p.pz=p.z;p.x=m.x;p.y=m.y;p.z=m.z;p.yaw=m.yaw;p.pitch=m.pitch;`,
`        const oldY=p.y,newDy=(m.y-p.y)/dt;p.hspeed=Math.min(20,d/dt);p.dy=newDy;p.px=p.x;p.py=p.y;p.pz=p.z;p.x=m.x;p.y=m.y;p.z=m.z;p.yaw=m.yaw;p.pitch=m.pitch;recordCombatHistory(p,n);`,'record movement history');

server=once(server,
`        if(p.alive&&!p.disconnected)processMeleeAttackQueue(R,p,Date.now());`,
`        if(p.alive&&!p.disconnected){const combatNow=Date.now();recordCombatHistory(p,combatNow);processMeleeAttackQueue(R,p,combatNow);}`,'tick history before queue');

server=once(server,
`        enqueueMeleeAttack(R,p,{seq,id:m.id,yaw:m.yaw,pitch:m.pitch,clientTime:Number(m.clientTime)||0},Date.now());break;`,
`        enqueueMeleeAttack(R,p,{seq,id:m.id,yaw:m.yaw,pitch:m.pitch,clientTime:Number(m.clientTime)||0,serverTimeEstimate:Number(m.serverTimeEstimate),rtt:Number(m.rtt)||0},Date.now());break;`,'legacy timing bridge');

// Client: derive a smoothed clock offset from the existing ping/pong exchange.
game=once(game,
`case'netPong':lastNetMessageAt=Date.now();diag.ping=Math.max(0,Date.now()-(Number(m.at)||Date.now()));diag.serverBuffer=Number(m.buffer)||0;if(m.ac)diag.ac=m.ac;break;`,
`case'netPong':{const recv=Date.now(),sent=Number(m.at)||recv,rtt=Math.max(0,recv-sent),serverAt=Number(m.serverAt);lastNetMessageAt=recv;diag.ping=rtt;combatNetRttMs=combatNetRttMs?combatNetRttMs*.8+rtt*.2:rtt;if(Number.isFinite(serverAt)){const off=serverAt-(sent+recv)/2;combatClockOffsetMs=combatClockSynced?combatClockOffsetMs*.8+off*.2:off;combatClockSynced=true}diag.serverBuffer=Number(m.buffer)||0;if(m.ac)diag.ac=m.ac;break}`, 'client clock sync');

game=once(game,
`const ATTACK_BATCH_MS=20,ATTACK_BATCH_MAX=6;let attackSequence=0,attackFlushTimer=0,pendingAttacks=[];
function flushAttackBatch(){clearTimeout(attackFlushTimer);attackFlushTimer=0;if(!pendingAttacks.length)return;const attacks=pendingAttacks.splice(0,ATTACK_BATCH_MAX);send({t:'attackBatch',attacks});if(pendingAttacks.length)attackFlushTimer=setTimeout(flushAttackBatch,ATTACK_BATCH_MS)}
function queueMeleeAttack(id){const now=performance.now();pendingAttacks.push({seq:++attackSequence,id,clientTime:+now.toFixed(2),yaw:pl.yaw,pitch:pl.pitch});if(pendingAttacks.length>=ATTACK_BATCH_MAX)flushAttackBatch();else if(!attackFlushTimer)attackFlushTimer=setTimeout(flushAttackBatch,ATTACK_BATCH_MS)}`,
`const ATTACK_BATCH_MS=20,ATTACK_BATCH_MAX=6;let attackSequence=0,attackFlushTimer=0,pendingAttacks=[],combatNetRttMs=0,combatClockOffsetMs=0,combatClockSynced=false;
function flushAttackBatch(){clearTimeout(attackFlushTimer);attackFlushTimer=0;if(!pendingAttacks.length)return;const attacks=pendingAttacks.splice(0,ATTACK_BATCH_MAX);send({t:'attackBatch',attacks});if(pendingAttacks.length)attackFlushTimer=setTimeout(flushAttackBatch,ATTACK_BATCH_MS)}
function queueMeleeAttack(id){const now=Date.now();pendingAttacks.push({seq:++attackSequence,id,clientTime:now,serverTimeEstimate:combatClockSynced?+(now+combatClockOffsetMs).toFixed(2):NaN,rtt:+combatNetRttMs.toFixed(1),yaw:pl.yaw,pitch:pl.pitch});if(pendingAttacks.length>=ATTACK_BATCH_MAX)flushAttackBatch();else if(!attackFlushTimer)attackFlushTimer=setTimeout(flushAttackBatch,ATTACK_BATCH_MS)}`,'client rewind timestamps');

index=once(index,'/game.js?v=combat-v3-phase1-20261008','/game.js?v=combat-v3-phase2-20261008','phase2 cache bust');

fs.writeFileSync('server.js',server);fs.writeFileSync('public/game.js',game);fs.writeFileSync('public/index.html',index);console.log('Combat V3 phase 2 applied');
