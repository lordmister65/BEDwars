const fs=require('fs');
function once(s,a,b,l){const n=s.split(a).length-1;if(n!==1)throw new Error(`${l}: expected 1 match, got ${n}`);return s.replace(a,b)}
function rex(s,r,b,l){if(!r.test(s))throw new Error(`${l}: no match`);r.lastIndex=0;return s.replace(r,b)}
let server=fs.readFileSync('server.js','utf8');
let game=fs.readFileSync('public/game.js','utf8');
let style=fs.readFileSync('public/style.css','utf8');
let index=fs.readFileSync('public/index.html','utf8');

// ---- SERVER AUTHORITY / LIGHT ANTI-CHEAT ----
server=once(server,
"const GAMEPLAY={spawnProtect:1.25,hitCooldownMs:135,damageIFrames:.26,suddenDeathAt:12*60,collapseAt:15*60,collapseEvery:5};",
`const GAMEPLAY={spawnProtect:1.25,hitCooldownMs:135,damageIFrames:.26,suddenDeathAt:12*60,collapseAt:15*60,collapseEvery:5};
const HELD_KEYS=[null,'wool','planks','endstone','glass','obsidian','tnt','apple','bow','fireball','snowball','pearl','speedPotion','jumpPotion','invisPotion','compass','magicMilk','bridgeEgg','popupTower','knockbackStick'];
const TNT_KEYS=new Set(['tnt','tntImpulse','tntSlow','tntDamage']);
function heldKey(p){if(p.held===0)return'sword';return HELD_KEYS[p.held]||null}
function heldAllows(p,k){const h=heldKey(p);if(k==='sword')return h==='sword';if(TNT_KEYS.has(k))return h==='tnt'&&(p.inv[k]||0)>0;return h===k}
function acFlag(p,type,detail=''){
 if(!p||p.admin)return false;const now=Date.now();p.ac=p.ac||{total:0,movement:0,reach:0,rate:0,item:0,resource:0,projectile:0,place:0,last:''};p.ac.total++;p.ac[type]=(p.ac[type]||0)+1;p.ac.last=type+(detail?': '+String(detail).slice(0,70):'');p.acAt=now;console.warn('[AC]',p.name,p.roomCode,type,detail);try{tx(p,{t:'ac',type,total:p.ac.total,last:p.ac.last})}catch(e){}return true
}
function sanitizeInventory(p){for(const k of Object.keys(p.inv||{})){let v=Number(p.inv[k]);if(!Number.isFinite(v)||v<0||v>9999){acFlag(p,'resource',k+'='+v);v=Math.max(0,Math.min(9999,Number.isFinite(v)?Math.floor(v):0));p.inv[k]=v}else p.inv[k]=Math.floor(v)}if(p.inv.bow>1)p.inv.bow=1}
`,
'security helpers');

server=once(server,
"const mkp = (ws, name, team, profileId) => ({ ws, name, team, profileId, x: 0, y: 11.02, z: 0, px:0, py:11.02, pz:0, yaw: 0, pitch: 0, hp: 20, alive: 1, out: 0, rt: 0, ih: 0, dy: 0, lt: Date.now(), src: null, st: -99, k: 0, sw: 0, ar: 0, held:1, admin:false, invSeq:0,",
"const mkp = (ws, name, team, profileId) => ({ ws, name, team, profileId, x: 0, y: 11.02, z: 0, px:0, py:11.02, pz:0, yaw: 0, pitch: 0, hp: 20, alive: 1, out: 0, rt: 0, ih: 0, dy: 0, lt: Date.now(), src: null, st: -99, k: 0, sw: 0, ar: 0, held:1, admin:false, invSeq:0, openChestKind:'', ac:{total:0,movement:0,reach:0,rate:0,item:0,resource:0,projectile:0,place:0,last:''},",
'player security state');

server=once(server,
"const pinv=p=>{p.invSeq=(p.invSeq||0)+1;return tx(p,{t:'inv',i:p.inv,sw:p.sw,ar:p.ar,up:p.up,tools:p.tools,fx:p.fx,traps:p.trapQueue||[],seq:p.invSeq})};",
"const pinv=p=>{sanitizeInventory(p);p.invSeq=(p.invSeq||0)+1;return tx(p,{t:'inv',i:p.inv,sw:p.sw,ar:p.ar,up:p.up,tools:p.tools,fx:p.fx,traps:p.trapQueue||[],seq:p.invSeq})};",
'inventory sanity');

server=once(server,
"function chestState(R,p,kind){const items=kind==='team'?R.teamChest[p.team]:p.enderChest,gi=kind==='team'?generatorUpgradeInfo(R,p.team):null;tx(p,{t:'chestState',kind,items,genTier:gi?.tier??0,genNext:gi?.next||null,genCurrent:gi?.current||''})}",
`function chestState(R,p,kind){const items=kind==='team'?R.teamChest[p.team]:p.enderChest,gi=kind==='team'?generatorUpgradeInfo(R,p.team):null;tx(p,{t:'chestState',kind,items,genTier:gi?.tier??0,genNext:gi?.next||null,genCurrent:gi?.current||''})}
function broadcastTeamChest(R,t){teamPlayers(R,t).forEach(q=>{if(q.openChestKind==='team'&&nearChest(R,q,'team'))chestState(R,q,'team')})}
`,
'team chest live sync');

server=once(server,
"case 'netPing': tx(p,{t:'netPong',at:Number(m.at)||0,serverAt:Date.now(),buffer:p.ws?.bufferedAmount||0}); break;",
"case 'netPing': tx(p,{t:'netPong',at:Number(m.at)||0,serverAt:Date.now(),buffer:p.ws?.bufferedAmount||0,ac:p.ac||null}); break;",
'ac diagnostics');

server=once(server,
"case 'chestOpen': {const kind=m.kind==='ender'?'ender':'team';if(!play||!nearChest(R,p,kind))break;chestState(R,p,kind);break}\n      case 'chestMove': {const kind=m.kind==='ender'?'ender':'team',key=String(m.key||'');if(!play||!CHEST_KEYS.includes(key)||!nearChest(R,p,kind))break;const box=kind==='team'?R.teamChest[p.team]:p.enderChest,dir=m.dir==='withdraw'?'withdraw':'deposit';let n=m.n==='all'?Infinity:Math.max(1,Math.min(999,Math.floor(Number(m.n)||1));if(dir==='deposit')",
"__NO_MATCH__",
'dummy chest replace');
