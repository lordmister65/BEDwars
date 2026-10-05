const fs=require('fs');
function once(s,a,b,label){const n=s.split(a).length-1;if(n!==1)throw new Error(`${label}: expected 1 match, got ${n}`);return s.replace(a,b)}
function rex(s,r,b,label){if(!r.test(s))throw new Error(label+': no match');r.lastIndex=0;return s.replace(r,b)}
let game=fs.readFileSync('public/game.js','utf8');
let server=fs.readFileSync('server.js','utf8');
let index=fs.readFileSync('public/index.html','utf8');

game=rex(game,/function pendingBlockCount\(k\)[\s\S]*?function clutchTarget\(/,
`function availableBlockCount(k){return Math.max(0,Math.floor(inv[k]||0))}
function predictionAt(x,y,z){return BRIDGE_PRED.get(x+','+y+','+z)||null}
function confirmedBlock(x,y,z){if(!get(x,y,z))return false;const b=predictionAt(x,y,z);return !b||!!b.acked}
function confirmedSupport(x,y,z){return [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].some(d=>confirmedBlock(x+d[0],y+d[1],z+d[2]))}
function rollbackPrediction(key,restore=false){const b=BRIDGE_PRED.get(key);if(!b)return;BRIDGE_PRED.delete(key);if(get(b.x,b.y,b.z)&&pf[ix(b.x,b.y,b.z)]){sb(b.x,b.y,b.z,0,0);flush(lowEnd?2:4)}if(restore&&b.reserved){inv[b.k]=(inv[b.k]||0)+1;hud()}}
function bridgeTarget(){
 const k=slotKey(cur);if(!PLACEABLE.has(k)||availableBlockCount(k)<=0||bridgeHoldY==null)return null;
 const speed=Math.hypot(pl.vx||0,pl.vz||0);if(speed<.55)return null;
 const dx=pl.vx/speed,dz=pl.vz/speed,currentY=Math.floor(pl.y-.08)-1;
 if(Math.abs(currentY-bridgeHoldY)>1)return null;
 const px=pl.x+dx*.62,pz=pl.z+dz*.62,y=bridgeHoldY,x=Math.floor(px),z=Math.floor(pz);
 if(!inXZ(x,z)||y<1||y>=H-2||get(x,y,z)||!safePlaceTarget(x,y,z))return null;
 const forward=(x+.5-pl.x)*dx+(z+.5-pl.z)*dz;if(forward<-.12||forward>1.55)return null;
 if(!confirmedSupport(x,y,z))return null;
 return{x,y,z,k,auto:1};
}
function predictPlace(p){
 if(!p||!PLACEABLE.has(p.k)||availableBlockCount(p.k)<=0||get(p.x,p.y,p.z))return false;
 const blockId=p.k==='wool'?me.team+1:p.k==='planks'?5:p.k==='endstone'?12:p.k==='glass'?7:16,key=p.x+','+p.y+','+p.z;
 inv[p.k]=Math.max(0,(inv[p.k]||0)-1);
 BRIDGE_PRED.set(key,{x:p.x,y:p.y,z:p.z,k:p.k,at:performance.now(),acked:false,reserved:true,auto:!!p.auto});
 sb(p.x,p.y,p.z,blockId,1);flush(lowEnd?2:4);hud();
 if(!send({t:'place',k:p.k,x:p.x,y:p.y,z:p.z,auto:p.auto?1:0})){rollbackPrediction(key,true);return false}
 return true
}
function clutchTarget(`,'prediction bridge block');

game=once(game,
"function autoBridge(now=performance.now()){\n if(!bridgeHeld||!started||!me.alive||now-lastBridgeAt<72)return;\n const p=bridgeTarget();if(!p)return;\n lastBridgeAt=now;useAnim=1;\n // Predição visual local: mostra o bloco imediatamente; o servidor continua autoritativo.\n predictPlace(p);\n}",
"function autoBridge(now=performance.now()){\n if(!bridgeHeld||!started||!me.alive||now-lastBridgeAt<95)return;\n const p=bridgeTarget();if(!p)return;\n lastBridgeAt=now;useAnim=1;predictPlace(p);\n}",
'auto bridge');

game=once(game,
"const touchMode=matchMedia('(pointer:coarse)').matches&&Math.min(innerWidth,innerHeight)<900;let mx=0,my=0,mLook=null,mJoy=null,lastWTap=0,doubleSprint=false,bridgeHeld=false,lastBridgeAt=0,dragLook=false,lastDragX=0,lastDragY=0;",
"const touchMode=matchMedia('(pointer:coarse)').matches&&Math.min(innerWidth,innerHeight)<900;let mx=0,my=0,mLook=null,mJoy=null,lastWTap=0,doubleSprint=false,bridgeHeld=false,bridgeHoldY=null,lastBridgeAt=0,dragLook=false,lastDragX=0,lastDragY=0;",
'bridge hold state');

game=once(game,
"addEventListener('mousedown',e=>{if(!(document.pointerLockElement||touchMode))return;if(e.button===0){if(slotKey(cur)==='bow')beginBow();else primary()}else if(e.button===2){bridgeHeld=PLACEABLE.has(slotKey(cur));secondary()}});",
"addEventListener('mousedown',e=>{if(!(document.pointerLockElement||touchMode))return;if(e.button===0){if(slotKey(cur)==='bow')beginBow();else primary()}else if(e.button===2){bridgeHeld=PLACEABLE.has(slotKey(cur));bridgeHoldY=bridgeHeld?Math.floor(pl.y-.08)-1:null;lastBridgeAt=performance.now();secondary()}});",
'mouse down');
game=once(game,
"addEventListener('mouseup',e=>{if(e.button===0){if(bowCharging)releaseBow();else stopBreak()}if(e.button===2)bridgeHeld=false});",
"addEventListener('mouseup',e=>{if(e.button===0){if(bowCharging)releaseBow();else stopBreak()}if(e.button===2){bridgeHeld=false;bridgeHoldY=null}});",
'mouse up');

game=once(game,
"$('placeBtn').ontouchstart=e=>{e.preventDefault();bridgeHeld=PLACEABLE.has(slotKey(cur));secondary()};$('placeBtn').ontouchend=e=>{e.preventDefault();bridgeHeld=false};",
"$('placeBtn').ontouchstart=e=>{e.preventDefault();bridgeHeld=PLACEABLE.has(slotKey(cur));bridgeHoldY=bridgeHeld?Math.floor(pl.y-.08)-1:null;lastBridgeAt=performance.now();secondary()};$('placeBtn').ontouchend=e=>{e.preventDefault();bridgeHeld=false;bridgeHoldY=null};",
'mobile bridge hold');

game=once(game,
"case'placeResult':{const key=m.x+','+m.y+','+m.z,b=BRIDGE_PRED.get(key);if(PLACEABLE.has(m.k)&&Number.isFinite(m.remaining))inv[m.k]=Math.max(0,Math.floor(m.remaining));if(m.ok){if(b)b.acked=true}else if(b)rollbackPrediction(key);hud();break}",
"case'placeResult':{const key=m.x+','+m.y+','+m.z,b=BRIDGE_PRED.get(key);if(PLACEABLE.has(m.k)&&Number.isFinite(m.remaining))inv[m.k]=Math.max(0,Math.floor(m.remaining));if(m.ok){if(b)b.acked=true}else if(b)rollbackPrediction(key,false);hud();break}",
'place result');

game=once(game,
"BRIDGE_PRED.forEach((b,key)=>{const age=now-b.at;if(!b.acked&&age>550)rollbackPrediction(key);else if(b.acked&&age>1800)BRIDGE_PRED.delete(key)});",
"BRIDGE_PRED.forEach((b,key)=>{const age=now-b.at;if(!b.acked&&age>650){rollbackPrediction(key,false);if(now-lastStateSyncAt>1200){lastStateSyncAt=now;send({t:'stateSync'})}}else if(b.acked&&age>1800)BRIDGE_PRED.delete(key)});",
'prediction timeout');

server=once(server,
"        const held=heldKey(p),item=['wool','planks','endstone','glass','obsidian'].includes(held)?held:'',x=m.x,y=m.y,z=m.z,k={wool:p.team+1,planks:5,endstone:12,glass:7,obsidian:16}[item];",
"        const held=heldKey(p),item=['wool','planks','endstone','glass','obsidian'].includes(held)?held:'',x=m.x,y=m.y,z=m.z,auto=m.auto===1,k={wool:p.team+1,planks:5,endstone:12,glass:7,obsidian:16}[item];",
'server auto flag');
server=once(server,
"        if(!allow(p,'place',62)){acFlag(p,'place','rate');placeResult(false,'cooldown');break}\n        if(!(p.inv[item]>0)){placeResult(false,'no_item');break}if(get(R,x,y,z)){placeResult(false,'occupied');break}\n        if(Math.hypot(x+.5-p.x,y+.5-p.y-1.45,z+.5-p.z)>6.45){acFlag(p,'reach','place');placeResult(false,'too_far');break}\n        if(![[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].some(d=>get(R,x+d[0],y+d[1],z+d[2]))){placeResult(false,'no_support');break}",
`        if(!allow(p,'place',auto?90:62)){acFlag(p,'place','rate');placeResult(false,'cooldown');break}
        if(!(p.inv[item]>0)){placeResult(false,'no_item');break}if(get(R,x,y,z)){placeResult(false,'occupied');break}
        if(Math.hypot(x+.5-p.x,y+.5-p.y-1.45,z+.5-p.z)>6.45){acFlag(p,'reach','place');placeResult(false,'too_far');break}
        if(auto){
          const now=Date.now(),idle=now-(p.autoBridgeAt||0);if(idle>500)p.autoBridgeY=y;
          if(p.hspeed<.35){placeResult(false,'auto_stationary');break}
          if(p.autoBridgeY!==y){acFlag(p,'place','auto_vertical');placeResult(false,'auto_vertical');break}
          const hd=Math.hypot(x+.5-p.x,z+.5-p.z);if(hd>2.15||Math.abs((y+1.15)-p.y)>2.25){acFlag(p,'place','auto_range');placeResult(false,'too_far');break}
          p.autoBridgeAt=now;
        }
        if(![[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].some(d=>get(R,x+d[0],y+d[1],z+d[2]))){placeResult(false,'no_support');break}`,
'server validation');

index=index.replace(/\/game\.js\?v=[^\"]+/, '/game.js?v=auto-bridge-ghost-v2-20261005');
fs.writeFileSync('public/game.js',game);fs.writeFileSync('server.js',server);fs.writeFileSync('public/index.html',index);
console.log('Focused auto bridge fix applied');
