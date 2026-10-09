from pathlib import Path


def once(text, old, new, label):
    n=text.count(old)
    if n!=1: raise RuntimeError(f'{label}: expected 1, got {n}')
    return text.replace(old,new,1)

server=Path('server.js').read_text()
game=Path('public/game.js').read_text()

server=once(server,
"const first=firstSolidPlacementBlock(R,eye.x,eye.y,eye.z,fp.x,fp.y,fp.z);if(!first||first.x!==sx||first.y!==sy||first.z!==sz)return placementResultObject(R,p,c,false,'occluded',{rw,dist})",
"if(!c.legacyTarget){const first=firstSolidPlacementBlock(R,eye.x,eye.y,eye.z,fp.x,fp.y,fp.z);if(!first||first.x!==sx||first.y!==sy||first.z!==sz)return placementResultObject(R,p,c,false,'occluded',{rw,dist})}",
'legacy visibility compatibility')

game=once(game,
"function rollbackPrediction(key,restore=false){const b=BRIDGE_PRED.get(key);if(!b)return;BRIDGE_PRED.delete(key);if(!b.serverConfirmed&&get(b.x,b.y,b.z)&&pf[ix(b.x,b.y,b.z)]){sb(b.x,b.y,b.z,0,0);flush(lowEnd?2:4)}if(restore&&b.reserved){inv[b.k]=(inv[b.k]||0)+1;hud()}}",
"function rollbackPrediction(key,restore=false){const b=BRIDGE_PRED.get(key);if(!b)return;BRIDGE_PRED.delete(key);if(!b.serverConfirmed&&get(b.x,b.y,b.z)&&pf[ix(b.x,b.y,b.z)]){sb(b.x,b.y,b.z,0,0);flush(lowEnd?2:4)}if(restore&&b.reserved){inv[b.k]=(inv[b.k]||0)+1;hud()}}\nfunction rollbackPlacementDependents(opSeq){if(!opSeq)return;const doomed=[];BRIDGE_PRED.forEach((b,key)=>{if(b.dependsOn===opSeq)doomed.push([key,b])});for(const[key,b]of doomed){placementQueue=placementQueue.filter(c=>c.opSeq!==b.opSeq);rollbackPrediction(key,false);rollbackPlacementDependents(b.opSeq)}}",
'client dependency rollback helper')

old_handle="function handlePlacementResult(m){const key=m.x+','+m.y+','+m.z,b=BRIDGE_PRED.get(key);if(b&&m.opSeq&&b.opSeq&&m.opSeq!==b.opSeq)return;if(Number.isFinite(m.blockSeq))lastBlockSeq=Math.max(lastBlockSeq,m.blockSeq||0);if(b)diag.placePing=Math.round(performance.now()-b.at);if(Number.isFinite(m.rw))diag.placeRewind=Math.round(m.rw);if(Number.isFinite(m.dist))diag.placeDistance=m.dist;if(PLACEABLE.has(m.k)&&Number.isFinite(m.remaining))inv[m.k]=Math.max(0,Math.floor(m.remaining));if(m.ok){diag.placeAccepted++;if(b){b.acked=true;BRIDGE_PRED.delete(key)}}else{diag.placeRejected++;diag.placeLastReason=m.reason||'rejected';if(b)rollbackPrediction(key,false);if(m.reason==='stale_op'||m.reason==='occupied'||m.reason==='dependency_rejected'){const n=performance.now();if(n-lastStateSyncAt>800){lastStateSyncAt=n;send({t:'stateSync'})}}}hud()}"
new_handle="function handlePlacementResult(m){const key=m.x+','+m.y+','+m.z,b=BRIDGE_PRED.get(key);if(b&&m.opSeq&&b.opSeq&&m.opSeq!==b.opSeq)return;if(Number.isFinite(m.blockSeq))lastBlockSeq=Math.max(lastBlockSeq,m.blockSeq||0);if(b)diag.placePing=Math.round(performance.now()-b.at);if(Number.isFinite(m.rw))diag.placeRewind=Math.round(m.rw);if(Number.isFinite(m.dist))diag.placeDistance=m.dist;if(PLACEABLE.has(m.k)&&Number.isFinite(m.remaining))inv[m.k]=Math.max(0,Math.floor(m.remaining));if(m.ok){diag.placeAccepted++;if(b){b.acked=true;BRIDGE_PRED.delete(key)}}else{diag.placeRejected++;diag.placeLastReason=m.reason||'rejected';if(b){const failedSeq=b.opSeq;rollbackPrediction(key,false);rollbackPlacementDependents(failedSeq)}if(m.reason==='stale_op'||m.reason==='occupied'||m.reason==='dependency_rejected'){const n=performance.now();if(n-lastStateSyncAt>800){lastStateSyncAt=n;send({t:'stateSync'})}}}hud()}"
game=once(game,old_handle,new_handle,'cascade rollback on reject')

game=once(game,
"const p=tg&&tg.p&&tg.h?{x:tg.p[0],y:tg.p[1],z:tg.p[2],k,sx:tg.h[0],sy:tg.h[1],sz:tg.h[2],fx:tg.p[0]-tg.h[0],fy:tg.p[1]-tg.h[1],fz:tg.p[2]-tg.h[2],dep:0,auto:0}:clutchTarget();",
"const p=tg&&tg.p&&tg.h?(()=>{const sp=predictionAt(tg.h[0],tg.h[1],tg.h[2]);return{x:tg.p[0],y:tg.p[1],z:tg.p[2],k,sx:tg.h[0],sy:tg.h[1],sz:tg.h[2],fx:tg.p[0]-tg.h[0],fy:tg.p[1]-tg.h[1],fz:tg.p[2]-tg.h[2],dep:sp&&!sp.acked&&!sp.serverConfirmed?sp.opSeq:0,auto:0}})():clutchTarget();",
'manual predicted support dependency')

Path('server.js').write_text(server)
Path('public/game.js').write_text(game)
print('Blocks V5 polish applied')
