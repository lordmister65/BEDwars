from pathlib import Path


def once(text, old, new, label):
    n=text.count(old)
    if n!=1: raise RuntimeError(f'{label}: expected 1, got {n}')
    return text.replace(old,new,1)

server=Path('server.js').read_text()
game=Path('public/game.js').read_text()

# Legacy clients did not send exact support/face. Preserve their old permissive
# visibility behavior while new V5 clients get strict support-face occlusion.
server=once(server,
"const first=firstSolidPlacementBlock(R,eye.x,eye.y,eye.z,fp.x,fp.y,fp.z);if(!first||first.x!==sx||first.y!==sy||first.z!==sz)return placementResultObject(R,p,c,false,'occluded',{rw,dist})",
"if(!c.legacyTarget){const first=firstSolidPlacementBlock(R,eye.x,eye.y,eye.z,fp.x,fp.y,fp.z);if(!first||first.x!==sx||first.y!==sy||first.z!==sz)return placementResultObject(R,p,c,false,'occluded',{rw,dist})}",
'legacy visibility compatibility')

# Roll back predicted descendants immediately when their support placement fails.
game=once(game,
"function rollbackPrediction(key,restore=false){const b=BRIDGE_PRED.get(key);if(!b)return;BRIDGE_PRED.delete(key);if(!b.serverConfirmed&&get(b.x,b.y,b.z)&&pf[ix(b.x,b.y,b.z)]){sb(b.x,b.y,b.z,0,0);flush(lowEnd?2:4)}if(restore&&b.reserved){inv[b.k]=(inv[b.k]||0)+1;hud()}}",
"function rollbackPrediction(key,restore=false){const b=BRIDGE_PRED.get(key);if(!b)return;BRIDGE_PRED.delete(key);if(!b.serverConfirmed&&get(b.x,b.y,b.z)&&pf[ix(b.x,b.y,b.z)]){sb(b.x,b.y,b.z,0,0);flush(lowEnd?2:4)}if(restore&&b.reserved){inv[b.k]=(inv[b.k]||0)+1;hud()}}\nfunction rollbackPlacementDependents(opSeq){if(!opSeq)return;const doomed=[];BRIDGE_PRED.forEach((b,key)=>{if(b.dependsOn===opSeq)doomed.push([key,b])});for(const[key,b]of doomed){placementQueue=placementQueue.filter(c=>c.opSeq!==b.opSeq);rollbackPrediction(key,false);rollbackPlacementDependents(b.opSeq)}}",
'client dependency rollback helper')

game=once(game,
"if(m.ok){diag.placeAccepted++;if(b){b.acked=true;BRIDGE_PRED.delete(key)}}else{diag.placeRejected++;diag.placeLastReason=m.reason||'rejected';if(b)rollbackPrediction(key,false);",
"if(m.ok){diag.placeAccepted++;if(b){b.acked=true;BRIDGE_PRED.delete(key)}}else{diag.placeRejected++;diag.placeLastReason=m.reason||'rejected';if(b){const failedSeq=b.opSeq;rollbackPrediction(key,false);rollbackPlacementDependents(failedSeq)}}",
'cascade rollback on reject')

# If a manual click lands on an unacknowledged predicted support, carry the
# dependency exactly like automatic Ninja bridge does.
game=once(game,
"const p=tg&&tg.p&&tg.h?{x:tg.p[0],y:tg.p[1],z:tg.p[2],k,sx:tg.h[0],sy:tg.h[1],sz:tg.h[2],fx:tg.p[0]-tg.h[0],fy:tg.p[1]-tg.h[1],fz:tg.p[2]-tg.h[2],dep:0,auto:0}:clutchTarget();",
"const p=tg&&tg.p&&tg.h?(()=>{const sp=predictionAt(tg.h[0],tg.h[1],tg.h[2]);return{x:tg.p[0],y:tg.p[1],z:tg.p[2],k,sx:tg.h[0],sy:tg.h[1],sz:tg.h[2],fx:tg.p[0]-tg.h[0],fy:tg.p[1]-tg.h[1],fz:tg.p[2]-tg.h[2],dep:sp&&!sp.acked&&!sp.serverConfirmed?sp.opSeq:0,auto:0}})():clutchTarget();",
'manual predicted support dependency')

Path('server.js').write_text(server)
Path('public/game.js').write_text(game)
print('Blocks V5 polish applied')
