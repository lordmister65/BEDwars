const fs=require('fs');
function once(s,a,b,label){const n=s.split(a).length-1;if(n!==1)throw new Error(`${label}: expected 1 match, got ${n}`);return s.replace(a,b)}
let server=fs.readFileSync('server.js','utf8');

server=once(server,
`  SPRINT_KB_MULTIPLIER:1.10,STICK_KB_MULTIPLIER:1.90,STICK_VERTICAL_MULTIPLIER:1.05,
  COMBO_TIMEOUT_MS:1000,COMBO_MAX:8,COMBO_KB_DECAY:.025,COMBO_KB_MIN:.90
};`,
`  SPRINT_KB_MULTIPLIER:1.10,STICK_KB_MULTIPLIER:1.90,STICK_VERTICAL_MULTIPLIER:1.05,
  COMBO_TIMEOUT_MS:1000,COMBO_MAX:8,COMBO_KB_DECAY:.025,COMBO_KB_MIN:.90,
  CLICK_SAMPLE_MAX:120,CLICK_ANALYZE_MIN:50,CLICK_ANALYZE_EVERY:10,CLICK_FLAG_SCORE:12,CLICK_FLAG_COOLDOWN_MS:15000
};`,'phase4 config');

server=once(server,
`const mkp = (ws, name, team, profileId) => ({ ws, name, team, profileId, x: 0, y: 11.02, z: 0, px:0, py:11.02, pz:0, yaw: 0, pitch: 0, hp: 20, alive: 1, out: 0, rt: 0, ih: 0, dy: 0, lt: Date.now(), src: null, st: -99, k: 0, sw: 0, ar: 0, held:1, admin:false, invSeq:0, openChestKind:'', ac:{total:0,movement:0,reach:0,rate:0,item:0,resource:0,projectile:0,place:0,last:''},
  attackQueue:[],lastAttackSeq:0,legacyAttackSeq:0,attackNetTokens:COMBAT_CONFIG.NETWORK_BUCKET_CAPACITY,attackNetAt:Date.now(),attackUsefulTokens:COMBAT_CONFIG.USEFUL_BUCKET_CAPACITY,attackUsefulAt:Date.now(),combatHistory:[],`,
`const mkp = (ws, name, team, profileId) => ({ ws, name, team, profileId, x: 0, y: 11.02, z: 0, px:0, py:11.02, pz:0, yaw: 0, pitch: 0, hp: 20, alive: 1, out: 0, rt: 0, ih: 0, dy: 0, lt: Date.now(), src: null, st: -99, k: 0, sw: 0, ar: 0, held:1, admin:false, invSeq:0, openChestKind:'', ac:{total:0,movement:0,reach:0,rate:0,item:0,resource:0,projectile:0,place:0,autoclick:0,last:'',click:{cps:0,score:0,cv:0,dup:0,entropy:0,samples:0}},
  attackQueue:[],lastAttackSeq:0,legacyAttackSeq:0,attackNetTokens:COMBAT_CONFIG.NETWORK_BUCKET_CAPACITY,attackNetAt:Date.now(),attackUsefulTokens:COMBAT_CONFIG.USEFUL_BUCKET_CAPACITY,attackUsefulAt:Date.now(),combatHistory:[],clickAc:{iats:[],score:0,lastEventTime:0,lastFlagAt:0,lastEvalSize:0,total:0},`,'player click telemetry state');

server=once(server,
`function validatedAttackTime(a){
  const arrival=a.arrivalTime||Date.now(),min=arrival-COMBAT_CONFIG.MAX_REWIND_MS,claimed=Number(a.serverTimeEstimate),rtt=Math.max(0,Math.min(500,Number(a.rtt)||0));
  if(Number.isFinite(claimed)&&Math.abs(claimed-arrival)<=1000)return Math.max(min,Math.min(arrival,claimed));
  return Math.max(min,arrival-Math.min(COMBAT_CONFIG.MAX_REWIND_MS,rtt*.5));
}
function combatAabbAt(s,pad=0){`,
`function validatedAttackTime(a){
  const arrival=a.arrivalTime||Date.now(),min=arrival-COMBAT_CONFIG.MAX_REWIND_MS,claimed=Number(a.serverTimeEstimate),rtt=Math.max(0,Math.min(500,Number(a.rtt)||0));
  if(Number.isFinite(claimed)&&Math.abs(claimed-arrival)<=1000)return Math.max(min,Math.min(arrival,claimed));
  return Math.max(min,arrival-Math.min(COMBAT_CONFIG.MAX_REWIND_MS,rtt*.5));
}
function clickPatternEntropy(iats,binMs=4){
  if(!iats.length)return 0;const bins=new Map();for(const v of iats){const k=Math.round(v/binMs);bins.set(k,(bins.get(k)||0)+1)}let h=0;for(const n of bins.values()){const p=n/iats.length;h-=p*Math.log2(p)}return h;
}
function analyzeCombatClicks(p,now=Date.now()){
  const s=p.clickAc;if(!s||s.iats.length<COMBAT_CONFIG.CLICK_ANALYZE_MIN)return;
  if(s.iats.length-s.lastEvalSize<COMBAT_CONFIG.CLICK_ANALYZE_EVERY)return;s.lastEvalSize=s.iats.length;
  const a=s.iats.slice(-100),mean=a.reduce((x,y)=>x+y,0)/a.length;if(!(mean>0))return;
  const variance=a.reduce((sum,v)=>sum+(v-mean)*(v-mean),0)/a.length,std=Math.sqrt(variance),cv=std/mean,cps=1000/mean;
  let duplicates=0;for(let i=1;i<a.length;i++)if(Math.abs(a[i]-a[i-1])<=1)duplicates++;const dup=a.length>1?duplicates/(a.length-1):0,entropy=clickPatternEntropy(a);
  let frame=0;if(cps>20)frame+=1;if(cps>12&&cv<.035)frame+=2;if(cps>12&&dup>.60)frame+=2;if(cps>12&&entropy<1.60)frame+=1.5;if(cps>12&&cv<.020&&dup>.75)frame+=2;
  s.score=s.score*.82+frame;
  p.ac.click={cps:+cps.toFixed(2),score:+s.score.toFixed(2),cv:+cv.toFixed(4),dup:+dup.toFixed(3),entropy:+entropy.toFixed(3),samples:a.length};
  if(s.score>=COMBAT_CONFIG.CLICK_FLAG_SCORE&&now-s.lastFlagAt>=COMBAT_CONFIG.CLICK_FLAG_COOLDOWN_MS){
    s.lastFlagAt=now;const detail='cps='+cps.toFixed(1)+' cv='+cv.toFixed(3)+' dup='+dup.toFixed(2)+' h='+entropy.toFixed(2)+' score='+s.score.toFixed(1);acFlag(p,'autoclick',detail);console.warn('[AC-CLICK]',p.name,p.roomCode,detail);
  }
}
function registerCombatClick(p,a){
  const s=p.clickAc||(p.clickAc={iats:[],score:0,lastEventTime:0,lastFlagAt:0,lastEvalSize:0,total:0}),t=validatedAttackTime(a);s.total++;
  if(s.lastEventTime){const dt=t-s.lastEventTime;if(dt>1500){s.iats=[];s.lastEvalSize=0;s.score*=.65}else if(dt>0&&dt<=1000){s.iats.push(dt);if(s.iats.length>COMBAT_CONFIG.CLICK_SAMPLE_MAX){const drop=s.iats.length-COMBAT_CONFIG.CLICK_SAMPLE_MAX;s.iats.splice(0,drop);s.lastEvalSize=Math.max(0,s.lastEvalSize-drop)}}}
  if(t>s.lastEventTime)s.lastEventTime=t;analyzeCombatClicks(p,a.arrivalTime||Date.now());
}
function combatAabbAt(s,pad=0){`,'click analyzer helpers');

server=once(server,
`  p.attackQueue.push({seq:a.seq,id:a.id,yaw:a.yaw,pitch:a.pitch,clientTime:Number.isFinite(a.clientTime)?a.clientTime:0,serverTimeEstimate:Number.isFinite(a.serverTimeEstimate)?a.serverTimeEstimate:NaN,rtt:Number.isFinite(a.rtt)?a.rtt:0,arrivalTime});
  cancelSpawnProtection(p);if(p.fx.invis>0){p.fx.invis=0;pinv(p)}`,
`  const queued={seq:a.seq,id:a.id,yaw:a.yaw,pitch:a.pitch,clientTime:Number.isFinite(a.clientTime)?a.clientTime:0,serverTimeEstimate:Number.isFinite(a.serverTimeEstimate)?a.serverTimeEstimate:NaN,rtt:Number.isFinite(a.rtt)?a.rtt:0,arrivalTime};
  registerCombatClick(p,queued);p.attackQueue.push(queued);
  cancelSpawnProtection(p);if(p.fx.invis>0){p.fx.invis=0;pinv(p)}`,'register raw accepted clicks');

fs.writeFileSync('server.js',server);console.log('Combat V3 phase 4 applied');
