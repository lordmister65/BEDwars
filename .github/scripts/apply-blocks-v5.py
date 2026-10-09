from pathlib import Path
import re


def once(text, old, new, label):
    n=text.count(old)
    if n!=1:
        raise RuntimeError(f'{label}: expected 1 match, got {n}')
    return text.replace(old,new,1)


def sub_once(text, pattern, repl, label, flags=0):
    out,n=re.subn(pattern,repl,text,count=1,flags=flags)
    if n!=1:
        raise RuntimeError(f'{label}: expected 1 match, got {n}')
    return out

server=Path('server.js').read_text()
game=Path('public/game.js').read_text()
index=Path('public/index.html').read_text()

# -----------------------------------------------------------------------------
# SERVER — Blocks V5: batching, queue, token buckets, rewind and tolerant AABB.
# -----------------------------------------------------------------------------
server=once(server,
"const BLOCKS_V4={MAX_PENDING_PER_PLAYER:16,RESULT_SEQ_TTL_MS:2500};",
"const PLACEMENT_V5={NETWORK_CPS:30,NETWORK_CAPACITY:8,USEFUL_CPS:16,USEFUL_CAPACITY:4,BATCH_MAX:6,QUEUE_MAX:24,MAX_AGE_MS:350,HISTORY_MS:600,MAX_REWIND_MS:200,MAX_REACH:6.00,HARD_REACH:6.35,AUTO_HORIZONTAL:2.35,AUTO_VERTICAL:2.35,ALLOW_INTERSECTION_OFFSET:.12,BLOCK_AABB_SHRINK:.03,RESULT_TTL_MS:2500,MAX_PROCESS_PER_TICK:6};",
'placement config')

server=once(server,
"blockV4:{lastOpSeq:0,pending:new Map()},",
"blockV5:{lastOpSeq:0,pending:new Map(),queue:[],recentResults:new Map(),networkTokens:PLACEMENT_V5.NETWORK_CAPACITY,networkAt:Date.now(),usefulTokens:PLACEMENT_V5.USEFUL_CAPACITY,usefulAt:Date.now(),autoY:null,autoAt:0,metrics:{accepted:0,rejected:0,lastReason:'',lastRewind:0,lastDist:0}},",
'player placement state')

validated_attack="""function validatedAttackTime(a){
  const arrival=a.arrivalTime||Date.now(),min=arrival-COMBAT_CONFIG.MAX_REWIND_MS,claimed=Number(a.serverTimeEstimate),rtt=Math.max(0,Math.min(500,Number(a.rtt)||0));
  if(Number.isFinite(claimed)&&Math.abs(claimed-arrival)<=1000)return Math.max(min,Math.min(arrival,claimed));
  return Math.max(min,arrival-Math.min(COMBAT_CONFIG.MAX_REWIND_MS,rtt*.5));
}"""
placement_helpers=r"""
const PLACEABLE_KEYS=new Set(['wool','planks','endstone','glass','obsidian']);
const PLACE_FACES=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
function ensurePlacementV5(p){return p.blockV5||(p.blockV5={lastOpSeq:0,pending:new Map(),queue:[],recentResults:new Map(),networkTokens:PLACEMENT_V5.NETWORK_CAPACITY,networkAt:Date.now(),usefulTokens:PLACEMENT_V5.USEFUL_CAPACITY,usefulAt:Date.now(),autoY:null,autoAt:0,metrics:{accepted:0,rejected:0,lastReason:'',lastRewind:0,lastDist:0}})}
function resetPlacementInput(p){const s=ensurePlacementV5(p);s.queue.length=0;s.pending.clear();s.recentResults.clear();s.networkTokens=PLACEMENT_V5.NETWORK_CAPACITY;s.usefulTokens=PLACEMENT_V5.USEFUL_CAPACITY;s.networkAt=s.usefulAt=Date.now();s.autoY=null;s.autoAt=0}
function consumePlacementBucket(s,kind,rate,capacity,now){const tk=kind==='network'?'networkTokens':'usefulTokens',ak=kind==='network'?'networkAt':'usefulAt',prev=Number.isFinite(s[ak])?s[ak]:now,tokens=Number.isFinite(s[tk])?s[tk]:capacity;s[tk]=Math.min(capacity,tokens+Math.max(0,now-prev)*rate/1000);s[ak]=now;if(s[tk]<1)return false;s[tk]-=1;return true}
function placementTime(c){const arrival=c.arrivalTime||Date.now(),min=arrival-PLACEMENT_V5.MAX_REWIND_MS,claimed=Number(c.serverTimeEstimate),rtt=Math.max(0,Math.min(450,Number(c.rtt)||0));if(Number.isFinite(claimed)&&Math.abs(claimed-arrival)<=800)return Math.max(min,Math.min(arrival,claimed));return Math.max(min,arrival-Math.min(PLACEMENT_V5.MAX_REWIND_MS,rtt*.5))}
function placementFaceValid(fx,fy,fz){return [fx,fy,fz].every(Number.isInteger)&&Math.abs(fx)+Math.abs(fy)+Math.abs(fz)===1}
function supportFacePoint(sx,sy,sz,fx,fy,fz){return{x:sx+.5+fx*.499,y:sy+.5+fy*.499,z:sz+.5+fz*.499}}
function firstSolidPlacementBlock(R,ox,oy,oz,ex,ey,ez){const L=Math.hypot(ex-ox,ey-oy,ez-oz),steps=Math.max(1,Math.ceil(L/.08));let last='';for(let i=1;i<=steps;i++){const a=i/steps,x=ox+(ex-ox)*a,y=oy+(ey-oy)*a,z=oz+(ez-oz)*a,X=Math.floor(x),Y=Math.floor(y),Z=Math.floor(z),key=X+','+Y+','+Z;if(key===last)continue;last=key;if(get(R,X,Y,Z))return{x:X,y:Y,z:Z}}return null}
function placementBlockAabb(x,y,z,shrink=PLACEMENT_V5.BLOCK_AABB_SHRINK){return{minX:x+shrink,maxX:x+1-shrink,minY:y,maxY:y+1,minZ:z+shrink,maxZ:z+1-shrink}}
function placementPlayerAabb(pose){const r=.34;return{minX:pose.x-r,maxX:pose.x+r,minY:pose.y+.03,maxY:pose.y+1.77,minZ:pose.z-r,maxZ:pose.z+r}}
function aabbOverlapDepth(a,b){return{x:Math.min(a.maxX,b.maxX)-Math.max(a.minX,b.minX),y:Math.min(a.maxY,b.maxY)-Math.max(a.minY,b.minY),z:Math.min(a.maxZ,b.maxZ)-Math.max(a.minZ,b.minZ)}}
function placementPoseHitsBlock(pose,x,y,z,feetTolerance=0){const pa=placementPlayerAabb(pose),ba=placementBlockAabb(x,y,z),o=aabbOverlapDepth(pa,ba);if(o.x<=0||o.y<=0||o.z<=0)return false;if(feetTolerance>0&&ba.maxY<=pa.minY+feetTolerance)return false;return true}
function placementOtherPlayerHits(q,x,y,z){if(!q||!q.alive||q.out||q.admin||q.disconnected)return false;return placementPoseHitsBlock({x:q.x,y:q.y,z:q.z},x,y,z,.035)}
function placementResultObject(R,p,c,ok,reason='',extra={}){const item=c.item||String(c.k||''),r={opSeq:c.opSeq||0,ok:ok?1:0,reason,k:item,x:c.x,y:c.y,z:c.z,remaining:Number(p.inv[item]||0),blockSeq:R.blockSeq||0};if(Number.isFinite(extra.blockId))r.blockId=extra.blockId;if(Number.isFinite(extra.rw))r.rw=Math.round(extra.rw);if(Number.isFinite(extra.dist))r.dist=+extra.dist.toFixed(2);return r}
function cachePlacementResult(p,c,result){const s=ensurePlacementV5(p),now=Date.now();s.pending.delete(c.opSeq);if(c.opSeq)s.recentResults.set(c.opSeq,{at:now,result});for(const[seq,row]of s.recentResults)if(now-row.at>PLACEMENT_V5.RESULT_TTL_MS)s.recentResults.delete(seq);if(result.ok)s.metrics.accepted++;else{s.metrics.rejected++;s.metrics.lastReason=result.reason||'rejected'}if(Number.isFinite(result.rw))s.metrics.lastRewind=result.rw;if(Number.isFinite(result.dist))s.metrics.lastDist=result.dist}
function immediatePlacementResult(R,p,c,reason){const r=placementResultObject(R,p,c,false,reason);cachePlacementResult(p,c,r);return r}
function legacyPlacementSupport(R,x,y,z){for(const d of PLACE_FACES){const sx=x-d[0],sy=y-d[1],sz=z-d[2];if(get(R,sx,sy,sz))return{sx,sy,sz,fx:d[0],fy:d[1],fz:d[2]}}return null}
function validatePlacementCommand(R,p,c,now){
  const s=ensurePlacementV5(p);if(R.st!=='play'||!p.alive)return placementResultObject(R,p,c,false,'not_playing');
  if(now-c.arrivalTime>PLACEMENT_V5.MAX_AGE_MS)return placementResultObject(R,p,c,false,'expired');
  const item=c.item,k={wool:teamWoolBlock(p.team),planks:5,endstone:12,glass:7,obsidian:16}[item];if(!item||!k)return placementResultObject(R,p,c,false,'wrong_item');
  if(![c.x,c.y,c.z].every(Number.isInteger)||c.y<1||c.y>=S.H-2)return placementResultObject(R,p,c,false,'invalid_pos');
  if(!(p.inv[item]>0))return placementResultObject(R,p,c,false,'no_item');if(get(R,c.x,c.y,c.z))return placementResultObject(R,p,c,false,'occupied');
  let sx=c.sx,sy=c.sy,sz=c.sz,fx=c.fx,fy=c.fy,fz=c.fz;if(c.legacyTarget){const sup=legacyPlacementSupport(R,c.x,c.y,c.z);if(!sup)return placementResultObject(R,p,c,false,'no_support');({sx,sy,sz,fx,fy,fz}=sup)}
  if(![sx,sy,sz].every(Number.isInteger)||!placementFaceValid(fx,fy,fz)||sx+fx!==c.x||sy+fy!==c.y||sz+fz!==c.z)return placementResultObject(R,p,c,false,'target_mismatch');
  if(!get(R,sx,sy,sz))return placementResultObject(R,p,c,false,'no_support');
  if(c.dep){const dep=s.recentResults.get(c.dep);if(dep&&!dep.result.ok)return placementResultObject(R,p,c,false,'dependency_rejected');if(!dep&&c.dep>=c.opSeq)return placementResultObject(R,p,c,false,'bad_dependency')}
  const protectedKind=protectedPlacement(R,c.x,c.y,c.z);if(protectedKind)return placementResultObject(R,p,c,false,'protected_'+protectedKind);
  const targetTime=placementTime(c),pose=interpolatedCombatState(p,targetTime),rw=Math.max(0,(c.arrivalTime||now)-targetTime),eye={x:pose.x,y:pose.y+1.62,z:pose.z},fp=supportFacePoint(sx,sy,sz,fx,fy,fz),dist=Math.hypot(fp.x-eye.x,fp.y-eye.y,fp.z-eye.z);
  if(c.auto){if(now-(s.autoAt||0)>500)s.autoY=c.y;if(s.autoY!==c.y)return placementResultObject(R,p,c,false,'auto_vertical',{rw,dist});const hd=Math.hypot(c.x+.5-pose.x,c.z+.5-pose.z),vd=Math.abs((c.y+1.15)-pose.y);if(hd>PLACEMENT_V5.AUTO_HORIZONTAL||vd>PLACEMENT_V5.AUTO_VERTICAL)return placementResultObject(R,p,c,false,'too_far',{rw,dist});s.autoAt=now}
  else{if(dist>PLACEMENT_V5.HARD_REACH){acFlag(p,'reach','place='+dist.toFixed(2));return placementResultObject(R,p,c,false,'too_far',{rw,dist})}if(dist>PLACEMENT_V5.MAX_REACH)return placementResultObject(R,p,c,false,'too_far',{rw,dist});const first=firstSolidPlacementBlock(R,eye.x,eye.y,eye.z,fp.x,fp.y,fp.z);if(!first||first.x!==sx||first.y!==sy||first.z!==sz)return placementResultObject(R,p,c,false,'occluded',{rw,dist})}
  if(placementPoseHitsBlock(pose,c.x,c.y,c.z,PLACEMENT_V5.ALLOW_INTERSECTION_OFFSET))return placementResultObject(R,p,c,false,'player_collision',{rw,dist});
  for(const q of R.ps.values())if(q!==p&&placementOtherPlayerHits(q,c.x,c.y,c.z))return placementResultObject(R,p,c,false,'player_collision',{rw,dist});
  cancelSpawnProtection(p);if(p.fx.invis>0){p.fx.invis=0;pinv(p)}setb(R,c.x,c.y,c.z,k,1);p.inv[item]--;pinv(p);const placeSfx=item==='wool'?'place_cloth':item==='planks'?'place_wood':'place_stone';sfxAt(R,placeSfx,c.x+.5,c.y+.5,c.z+.5,6);return placementResultObject(R,p,c,true,'',{blockId:k,rw,dist});
}
function enqueuePlacement(R,p,a,arrivalTime=Date.now(),legacy=false){
  const s=ensurePlacementV5(p),declared=String(a.k||''),held=heldKey(p),seq=Number.isInteger(a.opSeq)&&a.opSeq>0?a.opSeq:s.lastOpSeq+1,c={opSeq:seq,k:declared,item:declared,x:a.x,y:a.y,z:a.z,sx:a.sx,sy:a.sy,sz:a.sz,fx:a.fx,fy:a.fy,fz:a.fz,dep:Number.isInteger(a.dep)&&a.dep>0?a.dep:0,auto:a.auto===1,clientTime:Number(a.clientTime)||0,serverTimeEstimate:Number(a.serverTimeEstimate),rtt:Number(a.rtt)||0,yaw:Number(a.yaw)||0,pitch:Number(a.pitch)||0,arrivalTime,legacy,legacyTarget:legacy&&!placementFaceValid(a.fx,a.fy,a.fz)};
  const cached=s.recentResults.get(seq);if(cached)return{immediate:cached.result,legacy};if(s.pending.has(seq))return{queued:true};if(seq<=s.lastOpSeq){return{immediate:placementResultObject(R,p,c,false,'stale_op'),legacy}}s.lastOpSeq=seq;
  if(!PLACEABLE_KEYS.has(declared)||held!==declared){acFlag(p,'item','place '+declared+' held='+held);const r=immediatePlacementResult(R,p,c,'wrong_item');return{immediate:r,legacy}}
  if(!consumePlacementBucket(s,'network',PLACEMENT_V5.NETWORK_CPS,PLACEMENT_V5.NETWORK_CAPACITY,arrivalTime)){acFlag(p,'place','network_rate');const r=immediatePlacementResult(R,p,c,'network_rate');return{immediate:r,legacy}}
  if(s.queue.length>=PLACEMENT_V5.QUEUE_MAX){const r=immediatePlacementResult(R,p,c,'queue_full');return{immediate:r,legacy}}s.pending.set(seq,arrivalTime);s.queue.push(c);return{queued:true};
}
function processPlacementQueue(R,p,now=Date.now()){
  const s=ensurePlacementV5(p),batch=[];let processed=0;
  while(s.queue.length&&processed<PLACEMENT_V5.MAX_PROCESS_PER_TICK){const c=s.queue[0];if(now-c.arrivalTime>PLACEMENT_V5.MAX_AGE_MS){s.queue.shift();const r=placementResultObject(R,p,c,false,'expired');cachePlacementResult(p,c,r);if(c.legacy)tx(p,{t:'placeResult',...r});else batch.push(r);processed++;continue}if(!consumePlacementBucket(s,'useful',PLACEMENT_V5.USEFUL_CPS,PLACEMENT_V5.USEFUL_CAPACITY,now))break;s.queue.shift();const r=validatePlacementCommand(R,p,c,now);cachePlacementResult(p,c,r);if(c.legacy)tx(p,{t:'placeResult',...r});else batch.push(r);processed++}
  if(batch.length)tx(p,{t:'placeBatchResult',results:batch});
}
"""
server=once(server,validated_attack,validated_attack+placement_helpers,'placement helpers')

# Reset queue on spawn and reconnect, while preserving sequence monotonicity.
server=once(server,
"p.lt = Date.now();resetCombatInput(p);resetMovementV2(p); tx(p, { t: 'tp', x: p.x, y: p.y, z: p.z, hard:1 });",
"p.lt = Date.now();resetCombatInput(p);resetMovementV2(p);resetPlacementInput(p); tx(p, { t: 'tp', x: p.x, y: p.y, z: p.z, hard:1 });",
'spawn placement reset')
server=once(server,
"p.ws=ws;p.disconnected=false;p.disconnectedAt=0;p.reconnectDeadline=0;p.lt=Date.now();resetMovementV2(p);recordCombatHistory(p,Date.now());ws.playerId=p.id;",
"p.ws=ws;p.disconnected=false;p.disconnectedAt=0;p.reconnectDeadline=0;p.lt=Date.now();resetMovementV2(p);resetPlacementInput(p);recordCombatHistory(p,Date.now());ws.playerId=p.id;",
'reconnect placement reset')

# Include sequence in init/reconnect so a reloaded client never restarts at opSeq 1.
server=once(server,
"quick:m.quick?1:0, activeChunks:R.activeChunks, ed:[...R.ed.values()], drops:R.drops, profile:",
"quick:m.quick?1:0, placeOpSeq:p.blockV5?.lastOpSeq||0, activeChunks:R.activeChunks, ed:[...R.ed.values()], drops:R.drops, profile:",
'init placement sequence')
server=once(server,
"inv:p.inv,invSeq:p.invSeq||0,blockSeq:R.blockSeq||0,sw:p.sw",
"inv:p.inv,invSeq:p.invSeq||0,blockSeq:R.blockSeq||0,placeOpSeq:p.blockV5?.lastOpSeq||0,sw:p.sw",
'reconnect placement sequence')

# Replace immediate placement handler with input queue + batch compatibility.
server=sub_once(server,
r"      case 'place': \{[\s\S]*?\n      \}\n      case 'breakStart': \{",
"""      case 'placeBatch': {
        if(!Array.isArray(m.placements))break;if(m.placements.length>PLACEMENT_V5.BATCH_MAX){acFlag(p,'place','batch='+m.placements.length);break}const arrival=Date.now(),immediate=[];for(const a of m.placements){const q=enqueuePlacement(R,p,a,arrival,false);if(q.immediate)immediate.push(q.immediate)}if(immediate.length)tx(p,{t:'placeBatchResult',results:immediate});break;
      }
      case 'place': {
        const q=enqueuePlacement(R,p,m,Date.now(),true);if(q.immediate)tx(p,{t:'placeResult',...q.immediate});break;
      }
      case 'breakStart': {""",
'placement handler',flags=re.S)

# Placement queue runs inside the same 30 Hz authoritative loop as combat.
server=once(server,
"if(p.alive&&!p.disconnected){const combatNow=Date.now();recordCombatHistory(p,combatNow);processMeleeAttackQueue(R,p,combatNow);}",
"if(p.alive&&!p.disconnected){const combatNow=Date.now();recordCombatHistory(p,combatNow);processMeleeAttackQueue(R,p,combatNow);processPlacementQueue(R,p,combatNow);}",
'placement tick processing')

# -----------------------------------------------------------------------------
# CLIENT — queue + batching + chained predicted supports + deterministic rollback.
# -----------------------------------------------------------------------------
server = server.replace('BLOCKS_V4','PLACEMENT_V5')

# Make the local pre-check match the server foot tolerance instead of rejecting tiny grazes.
game=once(game,
"const playerIntersectsBlock=(x,y,z,px=pl.x,py=pl.y,pz=pl.z)=>px+.34>x&&px-.34<x+1&&pz+.34>z&&pz-.34<z+1&&py+.03<y+1&&py+1.77>y;\nfunction safePlaceTarget(x,y,z){\n  if(playerIntersectsBlock(x,y,z))return false;\n  const nx=pl.x+(pl.vx||0)*.10,nz=pl.z+(pl.vz||0)*.10,ny=pl.y+Math.max(0,pl.vy||0)*.10;\n  return !playerIntersectsBlock(x,y,z,nx,ny,nz);\n}",
"const CLIENT_PLACE_FEET_TOL=.12,CLIENT_BLOCK_SHRINK=.025;\nconst playerIntersectsBlock=(x,y,z,px=pl.x,py=pl.y,pz=pl.z,feetTol=CLIENT_PLACE_FEET_TOL)=>{const minX=x+CLIENT_BLOCK_SHRINK,maxX=x+1-CLIENT_BLOCK_SHRINK,minZ=z+CLIENT_BLOCK_SHRINK,maxZ=z+1-CLIENT_BLOCK_SHRINK,pMinY=py+.03,pMaxY=py+1.77;if(!(px+.34>minX&&px-.34<maxX&&pz+.34>minZ&&pz-.34<maxZ&&pMinY<y+1&&pMaxY>y))return false;if(feetTol>0&&y+1<=pMinY+feetTol)return false;return true};\nfunction safePlaceTarget(x,y,z){if(playerIntersectsBlock(x,y,z))return false;const nx=pl.x+(pl.vx||0)*.10,nz=pl.z+(pl.vz||0)*.10,ny=pl.y+Math.max(0,pl.vy||0)*.10;return !playerIntersectsBlock(x,y,z,nx,ny,nz)}",
'client tolerant collision')

# Diagnostics for the new queue.
game=once(game,
"serverRss:0,moveCorrections:0,moveSuspicion:0,snapshotSeq:0,qualityChanges:0,placePing:0,placeRejected:0,placeAccepted:0,ac:",
"serverRss:0,moveCorrections:0,moveSuspicion:0,snapshotSeq:0,qualityChanges:0,placePing:0,placeRejected:0,placeAccepted:0,placeRewind:0,placeDistance:0,placeLastReason:'',ac:",
'placement diagnostics state')
game=once(game,
"<span>Blocos pendentes '+BRIDGE_PRED.size+' · Rejeitados '+diag.placeRejected+'</span><span>Colocar ping '+diag.placePing+' ms · Aceitos '+diag.placeAccepted+'</span>",
"<span>Place fila '+placementQueue.length+' · Preditos '+BRIDGE_PRED.size+' · Rejeitados '+diag.placeRejected+'</span><span>Place ACK '+diag.placePing+' ms · rewind '+diag.placeRewind+' ms · dist '+diag.placeDistance+' · Aceitos '+diag.placeAccepted+'</span><span>Último reject '+(diag.placeLastReason||'—')+'</span>",
'placement diagnostics panel')

# Replace the bridge prediction core with batching/chained support. Keep the existing
# single voxel array for predicted physics, but make server ACK/rollback deterministic.
bridge_pattern=r"const PLACEABLE=new Set\(\['wool','planks','endstone','glass','obsidian'\]\);[\s\S]*?function clutchTarget\(\)\{"
bridge_repl=r"""const PLACEABLE=new Set(['wool','planks','endstone','glass','obsidian']);
const PLACE_DIRS=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],PLACE_BATCH_MS=18,PLACE_BATCH_MAX=6,PLACE_QUEUE_MAX=24,PLACE_AUTO_INTERVAL_MS=70;let placementQueue=[],placementFlushTimer=0;
function availableBlockCount(k){return Math.max(0,Math.floor(inv[k]||0))}
function predictionAt(x,y,z){return BRIDGE_PRED.get(x+','+y+','+z)||null}
function confirmedBlock(x,y,z){if(!get(x,y,z))return false;const b=predictionAt(x,y,z);return !b||!!b.acked||!!b.serverConfirmed}
function confirmedSupport(x,y,z){return PLACE_DIRS.some(d=>confirmedBlock(x+d[0],y+d[1],z+d[2]))}
function placementSupportInfo(x,y,z){let predicted=null;for(const d of PLACE_DIRS){const sx=x+d[0],sy=y+d[1],sz=z+d[2];if(!get(sx,sy,sz))continue;const pred=predictionAt(sx,sy,sz),info={sx,sy,sz,fx:x-sx,fy:y-sy,fz:z-sz,dep:pred&&!pred.acked&&!pred.serverConfirmed?pred.opSeq:0};if(!info.dep)return info;if(!predicted||info.dep>predicted.dep)predicted=info}return predicted}
function rollbackPrediction(key,restore=false){const b=BRIDGE_PRED.get(key);if(!b)return;BRIDGE_PRED.delete(key);if(!b.serverConfirmed&&get(b.x,b.y,b.z)&&pf[ix(b.x,b.y,b.z)]){sb(b.x,b.y,b.z,0,0);flush(lowEnd?2:4)}if(restore&&b.reserved){inv[b.k]=(inv[b.k]||0)+1;hud()}}
function flushPlacementQueue(){clearTimeout(placementFlushTimer);placementFlushTimer=0;if(!placementQueue.length)return;const placements=placementQueue.splice(0,PLACE_BATCH_MAX);if(!send({t:'placeBatch',placements})){placements.forEach(c=>rollbackPrediction(c.x+','+c.y+','+c.z,true));return}if(placementQueue.length)placementFlushTimer=setTimeout(flushPlacementQueue,PLACE_BATCH_MS)}
function queuePlacementCommand(cmd){if(placementQueue.length>=PLACE_QUEUE_MAX||BRIDGE_PRED.size>PLACE_QUEUE_MAX){sfx('blocked');return false}placementQueue.push(cmd);if(placementQueue.length>=PLACE_BATCH_MAX)flushPlacementQueue();else if(!placementFlushTimer)placementFlushTimer=setTimeout(flushPlacementQueue,PLACE_BATCH_MS);return true}
function handlePlacementResult(m){const key=m.x+','+m.y+','+m.z,b=BRIDGE_PRED.get(key);if(b&&m.opSeq&&b.opSeq&&m.opSeq!==b.opSeq)return;if(Number.isFinite(m.blockSeq))lastBlockSeq=Math.max(lastBlockSeq,m.blockSeq||0);if(b)diag.placePing=Math.round(performance.now()-b.at);if(Number.isFinite(m.rw))diag.placeRewind=Math.round(m.rw);if(Number.isFinite(m.dist))diag.placeDistance=m.dist;if(PLACEABLE.has(m.k)&&Number.isFinite(m.remaining))inv[m.k]=Math.max(0,Math.floor(m.remaining));if(m.ok){diag.placeAccepted++;if(b){b.acked=true;BRIDGE_PRED.delete(key)}}else{diag.placeRejected++;diag.placeLastReason=m.reason||'rejected';if(b)rollbackPrediction(key,false);if(m.reason==='stale_op'||m.reason==='occupied'||m.reason==='dependency_rejected'){const n=performance.now();if(n-lastStateSyncAt>800){lastStateSyncAt=n;send({t:'stateSync'})}}}hud()}
function bridgeTarget(){
 const k=slotKey(cur);if(!PLACEABLE.has(k)||availableBlockCount(k)<=0||bridgeHoldY==null)return null;
 const speed=Math.hypot(pl.vx||0,pl.vz||0);if(speed<.55)return null;
 const dx=pl.vx/speed,dz=pl.vz/speed,currentY=Math.floor(pl.y-.08)-1;
 if(Math.abs(currentY-bridgeHoldY)>1)return null;
 const px=pl.x+dx*.66,pz=pl.z+dz*.66,y=bridgeHoldY,bx=Math.floor(px),bz=Math.floor(pz),cands=[[bx,bz]];
 if(Math.abs(dx)>.28&&Math.abs(dz)>.28){cands.push([Math.floor(px+Math.sign(dx)*.32),bz],[bx,Math.floor(pz+Math.sign(dz)*.32)])}
 let best=null,bestScore=Infinity;for(const [x,z] of cands){if(!inXZ(x,z)||y<1||y>=H-2||get(x,y,z)||!safePlaceTarget(x,y,z))continue;const support=placementSupportInfo(x,y,z);if(!support)continue;const forward=(x+.5-pl.x)*dx+(z+.5-pl.z)*dz;if(forward<-.12||forward>1.72)continue;const lateral=Math.abs((x+.5-pl.x)*(-dz)+(z+.5-pl.z)*dx),score=lateral+Math.abs(forward-.72)*.22;if(score<bestScore){bestScore=score;best={x,y,z,k,auto:1,...support}}}return best;
}
function predictPlace(p){
 if(!p||!PLACEABLE.has(p.k)||availableBlockCount(p.k)<=0||get(p.x,p.y,p.z))return false;const support=(Number.isInteger(p.sx)&&Number.isInteger(p.fx))?p:placementSupportInfo(p.x,p.y,p.z);if(!support)return false;
 const blockId=p.k==='wool'?teamWoolBlock(me.team):p.k==='planks'?5:p.k==='endstone'?12:p.k==='glass'?7:16,key=p.x+','+p.y+','+p.z,opSeq=++blockOpSeq,now=Date.now(),cmd={opSeq,k:p.k,x:p.x,y:p.y,z:p.z,sx:support.sx,sy:support.sy,sz:support.sz,fx:support.fx,fy:support.fy,fz:support.fz,dep:support.dep||0,auto:p.auto?1:0,clientTime:now,serverTimeEstimate:combatClockSynced?+(now+combatClockOffsetMs).toFixed(2):null,rtt:+combatNetRttMs.toFixed(1),yaw:pl.yaw,pitch:pl.pitch};
 inv[p.k]=Math.max(0,(inv[p.k]||0)-1);BRIDGE_PRED.set(key,{x:p.x,y:p.y,z:p.z,k:p.k,at:performance.now(),acked:false,serverConfirmed:false,reserved:true,auto:!!p.auto,opSeq,dependsOn:cmd.dep});sb(p.x,p.y,p.z,blockId,1);flush(lowEnd?2:4);hud();if(!queuePlacementCommand(cmd)){rollbackPrediction(key,true);return false}return true
}
function clutchTarget(){"""
game=sub_once(game,bridge_pattern,bridge_repl,'client bridge core',flags=re.S)

# Clutch placements now carry support metadata and use the near-feet validation path.
game=sub_once(game,
r"function clutchTarget\(\)\{const k=slotKey\(cur\);.*?\}\nfunction autoBridge",
"""function clutchTarget(){const k=slotKey(cur);if(!PLACEABLE.has(k)||availableBlockCount(k)<=0)return null;const y=Math.floor(pl.y-.05)-1,cands=[];for(let ox=-1;ox<=1;ox++)for(let oz=-1;oz<=1;oz++){const x=Math.floor(pl.x+ox*.55),z=Math.floor(pl.z+oz*.55);if(!inXZ(x,z)||get(x,y,z)||!safePlaceTarget(x,y,z))continue;const support=placementSupportInfo(x,y,z);if(!support)continue;cands.push({x,y,z,k,auto:1,...support,d:Math.hypot(x+.5-pl.x,z+.5-pl.z)})}return cands.sort((a,b)=>a.d-b.d)[0]||null}
function autoBridge""",
'clutch support metadata',flags=re.S)

game=once(game,
"if(!bridgeHeld||!started||!me.alive||now-lastBridgeAt<95)return;",
"if(!bridgeHeld||!started||!me.alive||now-lastBridgeAt<PLACE_AUTO_INTERVAL_MS)return;",
'auto bridge cps')

# Manual placement sends the exact support block + face selected by the raycast.
game=once(game,
"const p=tg&&tg.p?{x:tg.p[0],y:tg.p[1],z:tg.p[2],k}:clutchTarget();",
"const p=tg&&tg.p&&tg.h?{x:tg.p[0],y:tg.p[1],z:tg.p[2],k,sx:tg.h[0],sy:tg.h[1],sz:tg.h[2],fx:tg.p[0]-tg.h[0],fy:tg.p[1]-tg.h[1],fz:tg.p[2]-tg.h[2],dep:0,auto:0}:clutchTarget();",
'manual support face')

# Do not erase prediction state just because block broadcast raced ahead of the ACK.
game=once(game,
"case'bb':m.l.forEach(a=>{if(applyServerBlock(a))BRIDGE_PRED.delete(a[0]+','+a[1]+','+a[2])});unstick();break;",
"case'bb':m.l.forEach(a=>{if(applyServerBlock(a)){const b=BRIDGE_PRED.get(a[0]+','+a[1]+','+a[2]);if(b)b.serverConfirmed=true}});unstick();break;",
'block broadcast reconciliation')

# Single-result compatibility plus batch ACKs.
game=sub_once(game,
r"case'placeResult':\{.*?hud\(\);break\}",
"case'placeResult':handlePlacementResult(m);break\ncase'placeBatchResult':(m.results||[]).forEach(handlePlacementResult);break",
'placement result handlers',flags=re.S)

# Sync placement sequence across join/reconnect, and clear stale local predictions on world reload.
game=once(game,
"case'init':me.id=m.id;me.team=m.team;roomCode=m.room||roomCode;",
"case'init':me.id=m.id;me.team=m.team;roomCode=m.room||roomCode;blockOpSeq=Math.max(blockOpSeq,Number(m.placeOpSeq)||0);placementQueue.length=0;BRIDGE_PRED.clear();",
'client init sequence')
game=once(game,
"finishReconnect();me.id=m.id;me.team=m.team;roomCode=m.room;currentMode=m.modeId||currentMode;reconnectToken=m.token;",
"finishReconnect();me.id=m.id;me.team=m.team;roomCode=m.room;currentMode=m.modeId||currentMode;reconnectToken=m.token;blockOpSeq=Math.max(blockOpSeq,Number(m.placeOpSeq)||0);placementQueue.length=0;BRIDGE_PRED.clear();",
'client reconnect sequence')

# Cache bust.
index=index.replace('/game.js?v=maps-v3-ffa8-20261009','/game.js?v=blocks-v5-bridge-20261009')

Path('server.js').write_text(server)
Path('public/game.js').write_text(game)
Path('public/index.html').write_text(index)
print('Blocks V5 bridge migration applied')
