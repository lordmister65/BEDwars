const fs=require('fs');
function once(s,a,b,label){const n=s.split(a).length-1;if(n!==1)throw new Error(`${label}: expected 1 match, got ${n}`);return s.replace(a,b)}
function rex(s,r,b,label){if(!r.test(s))throw new Error(`${label}: no match`);r.lastIndex=0;return s.replace(r,b)}
let server=fs.readFileSync('server.js','utf8');
let game=fs.readFileSync('public/game.js','utf8');
let index=fs.readFileSync('public/index.html','utf8');

// Server: every predicted placement gets an explicit authoritative result.
server=rex(server,/      case 'place': \{[\s\S]*?\n      \}\n      case 'breakStart': \{/,
`      case 'place': {
        const item=String(m.k||''),{x,y,z}=m,k={wool:p.team+1,planks:5,endstone:12,glass:7,obsidian:16}[item];
        const placeResult=(ok,reason='')=>tx(p,{t:'placeResult',ok:ok?1:0,reason,k:item,x,y,z,remaining:Number(p.inv[item]||0)});
        if(!play){placeResult(false,'not_playing');break}
        if(!k){placeResult(false,'invalid_item');break}
        if(![x,y,z].every(Number.isInteger)||y<1||y>=S.H-2){placeResult(false,'invalid_pos');break}
        if(!allow(p,'place',62)){placeResult(false,'cooldown');break}
        if(!(p.inv[item]>0)){placeResult(false,'no_item');break}
        if(get(R,x,y,z)){placeResult(false,'occupied');break}
        if(Math.hypot(x+.5-p.x,y+.5-p.y-1.45,z+.5-p.z)>6.45){placeResult(false,'too_far');break}
        if(![[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].some(d=>get(R,x+d[0],y+d[1],z+d[2]))){placeResult(false,'no_support');break}
        if([...R.ps.values()].some(q=>playerHitsBlock(q,x,y,z))){sfx(p,'blocked');placeResult(false,'player_collision');break}
        cancelSpawnProtection(p);if(p.fx.invis>0){p.fx.invis=0;pinv(p)}
        setb(R,x,y,z,k,1);p.inv[item]--;placeResult(true);pinv(p);sfx(p,'place');sfxAt(R,'place',x+.5,y+.5,z+.5,6);break;
      }
      case 'breakStart': {`,
'authoritative place result');

// Client: reserve predicted stock so one real block can never create multiple ghost placements.
game=once(game,
`const PLACEABLE=new Set(['wool','planks','endstone','glass','obsidian']);\nfunction bridgeTarget(){\n const k=slotKey(cur);if(!PLACEABLE.has(k)||(inv[k]||0)<=0)return null;`,
`const PLACEABLE=new Set(['wool','planks','endstone','glass','obsidian']);
function pendingBlockCount(k){let n=0;BRIDGE_PRED.forEach(b=>{if(b.k===k&&!b.acked)n++});return n}
function availableBlockCount(k){return Math.max(0,(inv[k]||0)-pendingBlockCount(k))}
function rollbackPrediction(key){const b=BRIDGE_PRED.get(key);if(!b)return;BRIDGE_PRED.delete(key);if(get(b.x,b.y,b.z)&&pf[ix(b.x,b.y,b.z)]){sb(b.x,b.y,b.z,0,0);flush(lowEnd?2:4)}}
function bridgeTarget(){
 const k=slotKey(cur);if(!PLACEABLE.has(k)||availableBlockCount(k)<=0)return null;`,
'pending placement stock');

game=rex(game,/function predictPlace\(p\)\{[^\n]*\}\nfunction clutchTarget\(\)\{[^\n]*\}/,
`function predictPlace(p){
 if(!p||!PLACEABLE.has(p.k)||availableBlockCount(p.k)<=0||get(p.x,p.y,p.z))return false;
 const blockId=p.k==='wool'?me.team+1:p.k==='planks'?5:p.k==='endstone'?12:p.k==='glass'?7:16,key=p.x+','+p.y+','+p.z;
 BRIDGE_PRED.set(key,{x:p.x,y:p.y,z:p.z,k:p.k,at:performance.now(),acked:false});sb(p.x,p.y,p.z,blockId,1);flush(lowEnd?2:4);
 if(!send({t:'place',k:p.k,x:p.x,y:p.y,z:p.z})){rollbackPrediction(key);return false}
 return true
}
function clutchTarget(){const k=slotKey(cur);if(!PLACEABLE.has(k)||availableBlockCount(k)<=0)return null;const y=Math.floor(pl.y-.05)-1,cands=[];for(let ox=-1;ox<=1;ox++)for(let oz=-1;oz<=1;oz++){const x=Math.floor(pl.x+ox*.55),z=Math.floor(pl.z+oz*.55);if(!inXZ(x,z)||get(x,y,z)||!safePlaceTarget(x,y,z))continue;const adj=[[1,0,0],[-1,0,0],[0,-1,0],[0,0,1],[0,0,-1]].some(d=>get(x+d[0],y+d[1],z+d[2]));if(adj)cands.push({x,y,z,k,d:Math.hypot(x+.5-pl.x,z+.5-pl.z)})}return cands.sort((a,b)=>a.d-b.d)[0]||null}`,
'prediction guard and clutch stock');

game=once(game,
`else if(PLACEABLE.has(k)){const p=tg&&tg.p?{x:tg.p[0],y:tg.p[1],z:tg.p[2],k}:clutchTarget();if(!p){sfx('blocked');return}if(!safePlaceTarget(p.x,p.y,p.z)){sfx('blocked');msg('Não é possível colocar um bloco dentro do jogador');return}predictPlace(p)}}`,
`else if(PLACEABLE.has(k)){if(availableBlockCount(k)<=0){sfx('blocked');msg('Você não possui mais '+slotName(cur)+'.');return}const p=tg&&tg.p?{x:tg.p[0],y:tg.p[1],z:tg.p[2],k}:clutchTarget();if(!p){sfx('blocked');return}if(!safePlaceTarget(p.x,p.y,p.z)){sfx('blocked');msg('Não é possível colocar um bloco dentro do jogador');return}predictPlace(p)}}`,
'manual placement no-stock guard');

// Immediate accept/reject reconciliation instead of waiting for the old timeout.
game=once(game,
`case'bb':m.l.forEach(a=>{sb(...a);BRIDGE_PRED.delete(a[0]+','+a[1]+','+a[2])});unstick();break;\ncase'breakp':`,
`case'bb':m.l.forEach(a=>{sb(...a);BRIDGE_PRED.delete(a[0]+','+a[1]+','+a[2])});unstick();break;
case'placeResult':{const key=m.x+','+m.y+','+m.z,b=BRIDGE_PRED.get(key);if(PLACEABLE.has(m.k)&&Number.isFinite(m.remaining))inv[m.k]=Math.max(0,Math.floor(m.remaining));if(m.ok){if(b)b.acked=true}else if(b)rollbackPrediction(key);hud();break}
case'breakp':`,
'place result client handler');

game=once(game,
`BRIDGE_PRED.forEach((b,key)=>{if(now-b.at>320){BRIDGE_PRED.delete(key);if(get(b.x,b.y,b.z)&&pf[ix(b.x,b.y,b.z)]){sb(b.x,b.y,b.z,0,0);flush(lowEnd?2:4)}}});`,
`BRIDGE_PRED.forEach((b,key)=>{const age=now-b.at;if(!b.acked&&age>550)rollbackPrediction(key);else if(b.acked&&age>1800)BRIDGE_PRED.delete(key)});`,
'timeout reconciliation');

// Cache bust so browsers do not keep the buggy predictor.
index=index.replace(/<script src="\/game\.js\?v=[^"]+"><\/script>/,'<script src="/game.js?v=ghost-block-fix-v1-20261004"></script>');

fs.writeFileSync('server.js',server);fs.writeFileSync('public/game.js',game);fs.writeFileSync('public/index.html',index);
console.log('Ghost block prediction fix applied');
