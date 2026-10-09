// Servidor autoritativo do Bed Wars: blocos, dano, camas, recursos e loja são decididos aqui.
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const { WebSocketServer } = require('ws');
const S = require('./public/shared.js');
const PORT = process.env.PORT || 3000, DMG = [3, 5, 7, 9], rooms = new Map();
const ADMIN_COMMAND='/calopsita';
const ADMIN_ITEMS=new Set(['wool','planks','endstone','glass','obsidian','tnt','tntImpulse','tntSlow','tntDamage','apple','bow','arrow','fireball','snowball','pearl','speedPotion','jumpPotion','invisPotion','compass','magicMilk','bridgeEgg','popupTower','knockbackStick','iron','gold','dia','em']);
const ADMIN_BLOCK_MIN=1,ADMIN_BLOCK_MAX=34;
const STATS_FILE=process.env.BW_STATS_FILE||path.join(__dirname,'data','stats.json');
const CHEST_KEYS=['iron','gold','dia','em','wool','planks','endstone','glass','obsidian','tnt','tntImpulse','tntSlow','tntDamage','apple','bow','arrow','fireball','snowball','pearl','speedPotion','jumpPotion','invisPotion','compass','magicMilk','bridgeEgg','popupTower','knockbackStick'];
let PROFILE_DB={};
try{PROFILE_DB=JSON.parse(fs.readFileSync(STATS_FILE,'utf8'))||{}}catch(e){PROFILE_DB={}}
function saveProfiles(){try{fs.mkdirSync(path.dirname(STATS_FILE),{recursive:true});const tmp=STATS_FILE+'.tmp';fs.writeFileSync(tmp,JSON.stringify(PROFILE_DB,null,2));fs.renameSync(tmp,STATS_FILE)}catch(e){console.warn('[STATS] não foi possível salvar',e.message)}}
const profileLevel=xp=>1+Math.floor(Math.max(0,Number(xp)||0)/500);
const safePlayerName=v=>{const s=String(v||'Jogador').replace(/[<>\u0000-\u001f\u007f]/g,'').replace(/\s+/g,' ').trim().slice(0,14);return s||'Jogador'};
function ensureProfile(id,name='Jogador'){const k=String(id||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,64)||crypto.randomBytes(12).toString('hex');let p=PROFILE_DB[k];if(!p)p=PROFILE_DB[k]={id:k,name:safePlayerName(name),xp:0,matches:0,wins:0,losses:0,kills:0,finalKills:0,bedsDestroyed:0,deaths:0,resourcesCollected:0};p.name=safePlayerName(name||p.name);return p}
function publicProfile(p){return{name:safePlayerName(p.name),xp:p.xp||0,level:profileLevel(p.xp),matches:p.matches||0,wins:p.wins||0,losses:p.losses||0,kills:p.kills||0,finalKills:p.finalKills||0,bedsDestroyed:p.bedsDestroyed||0,deaths:p.deaths||0,resourcesCollected:p.resourcesCollected||0}}
function rankingPayload(limit=20){return Object.values(PROFILE_DB).sort((a,b)=>(b.xp||0)-(a.xp||0)||(b.wins||0)-(a.wins||0)||(b.finalKills||0)-(a.finalKills||0)).slice(0,limit).map(publicProfile)}
function emptyChest(){return Object.fromEntries(CHEST_KEYS.map(k=>[k,0]))}
const MODES={
  '2v2':{id:'2v2',name:'2v2',teamCap:2,maxPlayers:4,activeTeams:[0,1],description:'Azul x Vermelho · até 2 jogadores por time'},
  '4v4':{id:'4v4',name:'4v4',teamCap:4,maxPlayers:8,activeTeams:[0,1],description:'Azul x Vermelho · até 4 jogadores por time'},
  'solo':{id:'solo',name:'Solo / FFA',teamCap:1,maxPlayers:4,activeTeams:[0,1,2,3],solo:true,description:'Todos contra todos · 2 a 4 jogadores · uma base por jogador'}
};
const modeCfg=R=>MODES[R.modeId]||MODES['2v2'];
const BASE_GEN_TIERS=[
  {iron:3.0,gold:0,dia:0,name:'Ferro básico'},
  {iron:2.8,gold:8.0,dia:0,name:'Ouro desbloqueado'},
  {iron:2.25,gold:6.0,dia:0,name:'Gerador eficiente'},
  {iron:2.05,gold:5.5,dia:18.0,name:'Diamante desbloqueado'}
];
const GEN_UPGRADE_COSTS=[
  {key:'dia',n:5,label:'5 diamantes',name:'Desbloquear ouro'},
  {key:'gold',n:15,label:'15 ouros',name:'Aumentar eficiência'},
  {key:'em',n:5,label:'5 esmeraldas',name:'Desbloquear diamantes'}
];
const CENTRAL_GEN={diamond:24,emerald:40};
const CENTRAL_GEN_TIERS=[
  {at:0,diamond:24,emerald:40,label:'I'},
  {at:6*60,diamond:18,emerald:32,label:'II'},
  {at:12*60,diamond:12,emerald:24,label:'III'}
];
function centralGenCfg(R){let c=CENTRAL_GEN_TIERS[0];for(const q of CENTRAL_GEN_TIERS)if((R.t||0)>=q.at)c=q;return c}
// Hitbox de combate centralizada. A caixa é levemente maior que a colisão física
// para compensar interpolação e até um snapshot curto de movimento, sem aumentar o alcance.
const COMBAT_HITBOX={radius:.36,height:1.80,feetPad:.05,historyMax:.60,meleePad:.055,meleeReach:3.55};
const COMBAT_CONFIG={
  MAX_NETWORK_CPS:25,NETWORK_BUCKET_CAPACITY:8,
  MAX_USEFUL_CPS:15,USEFUL_BUCKET_CAPACITY:2,
  MELEE_IFRAME_SEC:.22,MAX_ATTACK_BATCH:6,MAX_ATTACK_QUEUE:8,MAX_ATTACK_AGE_MS:300,
  HISTORY_BUFFER_MS:600,MAX_REWIND_MS:250,NOMINAL_REACH:3.55,HARD_REACH_LIMIT:4.00,
  KB_HORIZONTAL:7.40,KB_VERTICAL:4.00,AIR_KB_MULTIPLIER_H:.92,AIR_KB_MULTIPLIER_V:.95,
  SPRINT_KB_MULTIPLIER:1.10,STICK_KB_MULTIPLIER:1.90,STICK_VERTICAL_MULTIPLIER:1.05,
  COMBO_TIMEOUT_MS:1000,COMBO_MAX:8,COMBO_KB_DECAY:.025,COMBO_KB_MIN:.90,
  CLICK_SAMPLE_MAX:120,CLICK_ANALYZE_MIN:50,CLICK_ANALYZE_EVERY:10,CLICK_FLAG_SCORE:12,CLICK_FLAG_COOLDOWN_MS:15000
};
const GAMEPLAY={spawnProtect:1.25,damageIFrames:.26,suddenDeathAt:30*60,collapseAt:33*60,collapseEvery:5};
const SERVER_TICK_HZ=30,SERVER_TICK_MS=1000/SERVER_TICK_HZ,SERVER_TICK_SEC=1/SERVER_TICK_HZ,SNAPSHOT_HZ=15,SNAPSHOT_SEC=1/SNAPSHOT_HZ;
const MOVEMENT_CONFIG={WALK_SPEED:4.3,SPRINT_SPEED:5.7,SNEAK_SPEED:1.3,SPEED_MULTIPLIER:1.28,SLOW_MULTIPLIER:.55,GROUND_ACCEL:36,AIR_ACCEL:15,POSITION_GRACE:.55,HARD_POSITION_FACTOR:1.65,MAX_UP_SPEED:13.5,MAX_DOWN_SPEED:42,KB_GRACE_MS:500,SOFT_FLAG_SCORE:6,FLAG_COOLDOWN_MS:2500};
const SERVER_METRICS={tickHz:SERVER_TICK_HZ,lastTickMs:0,avgTickMs:0,maxTickMs:0,lastWallMs:SERVER_TICK_MS,overruns:0,ticks:0,snapshots:0,sentPackets:0,sentBytes:0,droppedPackets:0,rooms:0,players:0};
function serverMetricsSnapshot(p){const mem=process.memoryUsage(),mv=p&&p.moveV2?p.moveV2:null;return{tickHz:SERVER_METRICS.tickHz,lastTickMs:+SERVER_METRICS.lastTickMs.toFixed(2),avgTickMs:+SERVER_METRICS.avgTickMs.toFixed(2),maxTickMs:+SERVER_METRICS.maxTickMs.toFixed(2),wallMs:+SERVER_METRICS.lastWallMs.toFixed(2),overruns:SERVER_METRICS.overruns,ticks:SERVER_METRICS.ticks,snapshots:SERVER_METRICS.snapshots,rooms:SERVER_METRICS.rooms,players:SERVER_METRICS.players,sentPackets:SERVER_METRICS.sentPackets,droppedPackets:SERVER_METRICS.droppedPackets,rssMB:+(mem.rss/1048576).toFixed(1),heapMB:+(mem.heapUsed/1048576).toFixed(1),move:mv?{corrections:mv.corrections||0,suspicion:+(mv.suspicion||0).toFixed(1),speed:+(mv.speed||0).toFixed(2),clientError:+(mv.clientError||0).toFixed(2)}:null}};
const HELD_KEYS=[null,'wool','planks','endstone','glass','obsidian','tnt','apple','bow','fireball','snowball','pearl','speedPotion','jumpPotion','invisPotion','compass','magicMilk','bridgeEgg','popupTower','knockbackStick'];
const TNT_KEYS=new Set(['tnt','tntImpulse','tntSlow','tntDamage']);
function heldKey(p){if(p.held===0)return'sword';return HELD_KEYS[p.held]||null}
function heldAllows(p,k){const h=heldKey(p);if(k==='sword')return h==='sword';if(TNT_KEYS.has(k))return h==='tnt'&&(p.inv[k]||0)>0;return h===k}
function acFlag(p,type,detail=''){
 if(!p||p.admin)return false;
 p.ac=p.ac||{total:0,movement:0,reach:0,rate:0,item:0,resource:0,projectile:0,place:0,last:''};
 p.ac.total++;p.ac[type]=(p.ac[type]||0)+1;p.ac.last=type+(detail?': '+String(detail).replace(/[<>]/g,'').slice(0,70):'');p.acAt=Date.now();
 console.warn('[AC]',p.name,p.roomCode,type,detail);
 try{tx(p,{t:'ac',type,total:p.ac.total,last:p.ac.last})}catch(e){}
 return true
}
function sanitizeInventory(p){
 for(const k of Object.keys(p.inv||{})){
  let v=Number(p.inv[k]);
  if(!Number.isFinite(v)||v<0||v>9999){acFlag(p,'resource',k+'='+v);v=Math.max(0,Math.min(9999,Number.isFinite(v)?Math.floor(v):0))}
  p.inv[k]=Math.floor(v)
 }
 if(p.inv.bow>1)p.inv.bow=1
}

function rebalanceForMode(R,mc){
  const players=[...R.ps.values()];
  if(mc.solo){
    players.forEach((q,i)=>{q.team=mc.activeTeams[i%mc.activeTeams.length]});
  }else{
    const counts=[0,0,0,0];
    players.forEach(q=>{
      const t=mc.activeTeams.reduce((best,x)=>counts[x]<counts[best]?x:best,mc.activeTeams[0]);
      q.team=t;counts[t]++;
    });
  }
  players.forEach(q=>{q.roomShop=R.SHOP[q.team];q.roomSpawn=R.SPAWN?.[q.team]});
}
const SOFT_SOCKET_BUFFER = 512 * 1024;
const HARD_SOCKET_BUFFER = 2 * 1024 * 1024;
const RECONNECT_GRACE_MS = 60000;
const HEARTBEAT_INTERVAL_MS = 20000;
const HEARTBEAT_TIMEOUT_MS = 70000;
let uid = 0;

// Arquivos pequenos ficam em memória para evitar fs.readFile a cada acesso.
const STATIC = {}, PUBLIC_ROOT=path.join(__dirname,'public');
const cacheStaticFile=f=>{const abs=path.join(PUBLIC_ROOT,f);if(fs.existsSync(abs)&&fs.statSync(abs).isFile())STATIC[f]=fs.readFileSync(abs)};
function getStaticFile(f){
  if(STATIC[f])return STATIC[f];
  const abs=path.resolve(PUBLIC_ROOT,f);
  if(abs!==PUBLIC_ROOT&&!abs.startsWith(PUBLIC_ROOT+path.sep))return null;
  try{if(fs.statSync(abs).isFile()){const data=fs.readFileSync(abs);STATIC[f]=data;return data}}catch(e){}
  return null;
}
for (const f of ['index.html','shared.js','blockbench-models.js','game.js','style.css','mobile-minecraft-controls.css','assets/vendor_blue_atlas.png','assets/kai_hive_bedwars_atlas.png']) cacheStaticFile(f);
function cacheStaticDir(rel){const abs=path.join(__dirname,'public',rel);if(!fs.existsSync(abs))return;for(const ent of fs.readdirSync(abs,{withFileTypes:true})){const child=(rel+'/'+ent.name).replace(/\\/g,'/');if(ent.isDirectory())cacheStaticDir(child);else cacheStaticFile(child)}}
cacheStaticDir('assets/sounds');
const srv = http.createServer((q, r) => {
  const clean=(q.url||'/').split('?')[0], f=clean==='/'?'index.html':clean.slice(1);
  const data=getStaticFile(f);if(!data){r.writeHead(404);return r.end('não encontrado')}
  const type=f.endsWith('.js')?'text/javascript; charset=utf-8':f.endsWith('.css')?'text/css; charset=utf-8':f.endsWith('.png')?'image/png':f.endsWith('.ogg')?'audio/ogg':f.endsWith('.txt')?'text/plain; charset=utf-8':f.endsWith('.mcmeta')?'application/json; charset=utf-8':'text/html; charset=utf-8';
  r.writeHead(200, {'Content-Type':type,'Cache-Control':f==='index.html'?'no-cache':'public, max-age=300'});
  r.end(data);
});
const wss = new WebSocketServer({ server: srv, perMessageDeflate: false });
const netReason = v => String(v||'').slice(0,120);
function netLog(p,event,extra=''){
  const who=p?`id=${p.id||'?'} name=${p.name||'?'} room=${p.roomCode||'?'}`:'socket sem jogador';
  console.log(`[NET] ${event} | ${who}${extra?' | '+extra:''}`);
}
function terminateSocket(ws,reason='network_error'){
  if(!ws)return;ws._terminateReason=reason;
  try{ws.terminate()}catch(e){try{ws.close(1011,reason.slice(0,120))}catch(_){}}
}
const socketOpen = ws => !!ws && ws.readyState === 1;
function sendSocket(ws,data,{droppable=false}={}){
  if(!socketOpen(ws))return false;
  if(ws.bufferedAmount>=HARD_SOCKET_BUFFER){
    console.warn('[NET] buffer crítico; encerrando socket',ws.bufferedAmount);terminateSocket(ws,'buffer_overflow');return false;
  }
  if(droppable&&ws.bufferedAmount>=SOFT_SOCKET_BUFFER){SERVER_METRICS.droppedPackets++;return false}
  try{ws.send(data);SERVER_METRICS.sentPackets++;SERVER_METRICS.sentBytes+=Buffer.byteLength(String(data));return true}catch(err){console.warn('[NET] falha ao enviar pacote',err?.message||err);terminateSocket(ws,'send_error');return false}
}
const tx = (p,o) => {
  let data;try{data=JSON.stringify(o)}catch(e){console.warn('Falha ao serializar pacote',e);return false}
  return sendSocket(p&&p.ws,data);
};
const bc = (R,o) => {
  let data;try{data=JSON.stringify(o)}catch(e){console.warn('Falha ao serializar broadcast',e);return}
  const droppable=o&&o.t==='s';
  R.ps.forEach(p=>sendSocket(p.ws,data,{droppable}));
};
function markDisconnected(R,p,ws,code=1006,reason=''){
  if(!R||!p)return;
  if(p.ws!==ws){netLog(p,'close ignorado de socket antigo',`code=${code} reason=${netReason(reason)}`);return}
  p.ws=null;
  if(R.st==='play'){
    const first=!p.disconnected;p.disconnected=true;p.disconnectedAt=Date.now();p.reconnectDeadline=Date.now()+RECONNECT_GRACE_MS;
    netLog(p,'desconectado',`code=${code} reason=${netReason(reason)||ws?._terminateReason||'sem motivo'} grace=${RECONNECT_GRACE_MS}ms`);
    if(first)feed(R,`${p.name} desconectou. Aguardando reconexão por 60s...`,p.team,-1,'disconnect');
    return;
  }
  netLog(p,'saiu do lobby',`code=${code} reason=${netReason(reason)}`);
  R.ps.delete(p.id);if(R.host===p.id)R.host=[...R.ps.keys()][0]||null;
  if(!R.ps.size){rooms.delete(R.code);return}
  if(R.st==='lobby')lobby(R);
}
const msg = (R, s) => bc(R, { t: 'm', s });
const get = (R, x, y, z) => (y < 0 || !S.inXZ(x,z) || y >= S.H) ? 0 : R.B[S.ix(x, y, z)];
function setb(R,x,y,z,v,f=0){
  if(!S.inXZ(x,z)||y<0||y>=S.H)return;
  const i=S.ix(x,y,z),seq=++R.blockSeq;R.B[i]=v;R.pf[i]=f;const row=[x,y,z,v,f,seq];R.ed.set(i,row);R.q.push(row);
}
function room(code) {
  let R = rooms.get(code);
  if (!R) {
    const g = S.gen('classic',true);
    R = { code, mapId:'classic', modeId:'2v2', B: g.B, BD: g.BD, SHOP:g.SHOP, GEN:g.GEN, SPAWN:g.SPAWN, DIGEN:g.DIGEN, EMGEN:g.EMGEN, activeChunks:g.activeChunks, pf: new Uint8Array(g.B.length), ps: new Map(), ed: new Map(), q: [], tnt: [], drops: [], dropSeq: 0, projectiles: [], projSeq: 0, snapAcc: 0, pickupAcc: 0, netSeq:0, bed: [0, 0, 0, 0], teamChest:[emptyChest(),emptyChest(),emptyChest(),emptyChest()], genTier:[0,0,0,0], traps:[[],[],[],[]], trapInside:[new Set(),new Set(),new Set(),new Set()], suddenDeath:false,collapseAt:0,lastCollapse:0,blockSeq:0,syncAcc:0, st: 'lobby', t: 0, host: null, final:null,
      g: {
        base: [0,1,2,3].map(() => ({ iron:0, gold:0, dia:0 })),
        dia: S.DI.map(() => ({ t:0 })),
        em: { t:0 }
      } };
    rooms.set(code, R);
  }
  return R;
}
const mkp = (ws, name, team, profileId) => ({ ws, name, team, profileId, x: 0, y: 11.02, z: 0, px:0, py:11.02, pz:0, yaw: 0, pitch: 0, hp: 20, alive: 1, out: 0, rt: 0, ih: 0, dy: 0, lt: Date.now(), src: null, st: -99, k: 0, sw: 0, ar: 0, held:1, admin:false, invSeq:0, openChestKind:'', ac:{total:0,movement:0,reach:0,rate:0,item:0,resource:0,projectile:0,place:0,autoclick:0,last:'',click:{cps:0,score:0,cv:0,dup:0,entropy:0,samples:0}},
  attackQueue:[],lastAttackSeq:0,legacyAttackSeq:0,attackNetTokens:COMBAT_CONFIG.NETWORK_BUCKET_CAPACITY,attackNetAt:Date.now(),attackUsefulTokens:COMBAT_CONFIG.USEFUL_BUCKET_CAPACITY,attackUsefulAt:Date.now(),combatHistory:[],clickAc:{iats:[],score:0,lastEventTime:0,lastFlagAt:0,lastEvalSize:0,total:0},moveV2:{vx:0,vy:0,vz:0,speed:0,lastSeq:0,lastAt:Date.now(),suspicion:0,corrections:0,lastFlagAt:0,kbUntil:0,kbH:0,kbV:0,clientError:0},
  token: crypto.randomBytes(18).toString('hex'), disconnected:false, disconnectedAt:0, reconnectDeadline:0, roomCode:'', spectator:false,spawnProtect:0,hspeed:0,grounded:false,wasGrounded:false,fallVyMin:0,envIh:0,lastCombatAt:0,lastComboHitAt:0,comboTarget:0,comboCount:0,
  stats:{kills:0,finalKills:0,bedsDestroyed:0,deaths:0,resourcesCollected:0},
  rl: Object.create(null), breaking: null, trapQueue:[], enderChest:emptyChest(), tools: { pick:0, axe:0, shears:0 }, fx:{speed:0,jump:0,invis:0,slow:0,fatigue:0,blind:0,milk:0}, up: { sharp:0, prot:0, forge:0, haste:0, regen:0, trap:0, trapMiner:0, trapSlow:0, trapCounter:0 }, inv: { wool:24, planks:0, endstone:0, glass:0, obsidian:0, tnt:0, tntImpulse:0, tntSlow:0, tntDamage:0, apple:0, bow:0, arrow:0, fireball:0, snowball:0, pearl:0, speedPotion:0, jumpPotion:0, invisPotion:0, compass:0, magicMilk:0, bridgeEgg:0, popupTower:0, knockbackStick:0, iron:0, gold:0, dia:0, em:0 } });
const allow = (p, key, gap) => {
  const n = Date.now(), last = p.rl[key] || 0;
  if (n - last < gap) return false;
  p.rl[key] = n; return true;
};
function consumeAttackBucket(p,kind,rate,capacity,now=Date.now()){
  const tokenKey=kind==='network'?'attackNetTokens':'attackUsefulTokens',timeKey=kind==='network'?'attackNetAt':'attackUsefulAt';
  const prevTime=Number.isFinite(p[timeKey])?p[timeKey]:now,prevTokens=Number.isFinite(p[tokenKey])?p[tokenKey]:capacity;
  p[tokenKey]=Math.min(capacity,prevTokens+Math.max(0,now-prevTime)*rate/1000);p[timeKey]=now;
  if(p[tokenKey]<1)return false;p[tokenKey]-=1;return true;
}
function ensureMoveV2(p){return p.moveV2||(p.moveV2={vx:0,vy:0,vz:0,speed:0,lastSeq:0,lastAt:Date.now(),suspicion:0,corrections:0,lastFlagAt:0,kbUntil:0,kbH:0,kbV:0,clientError:0})}
function noteServerKnockback(p,kx,kz,vy){if(!p)return;const s=ensureMoveV2(p),h=Math.hypot(Number(kx)||0,Number(kz)||0);s.kbUntil=Date.now()+MOVEMENT_CONFIG.KB_GRACE_MS;s.kbH=Math.max(s.kbH||0,h);s.kbV=Math.max(s.kbV||0,Math.max(0,Number(vy)||0))}
function sendKnockback(p,kx,kz,vy,mode='generic'){noteServerKnockback(p,kx,kz,vy);return tx(p,{t:'kb',kx,kz,vy,mode})}
function movementSpeedLimit(p,m){let base=m&&m.sn?MOVEMENT_CONFIG.SNEAK_SPEED:(m&&m.sp===0?MOVEMENT_CONFIG.WALK_SPEED:MOVEMENT_CONFIG.SPRINT_SPEED);if(p.fx&&p.fx.speed>0)base*=MOVEMENT_CONFIG.SPEED_MULTIPLIER;if(p.fx&&p.fx.slow>0)base*=MOVEMENT_CONFIG.SLOW_MULTIPLIER;return base}
function inspectMovementPacket(p,m,dt,now,spectating){
  const s=ensureMoveV2(p);if(Number.isInteger(m.seq)){if(m.seq<=s.lastSeq)return{drop:true};s.lastSeq=m.seq}
  if(![m.x,m.y,m.z,m.yaw,m.pitch].every(Number.isFinite))return{ok:false,detail:'nonfinite'};
  if(m.x<S.MIN_X-8||m.x>S.MAX_X+8||m.z<S.MIN_Z-8||m.z>S.MAX_Z+8||m.y>S.H+20||m.y<-30)return{ok:false,detail:'bounds'};
  const dx=m.x-p.x,dy=m.y-p.y,dz=m.z-p.z,h=Math.hypot(dx,dz),obsVx=dx/dt,obsVz=dz/dt,obsVy=dy/dt,speed=Math.hypot(obsVx,obsVz);
  if(p.admin||spectating)return{ok:true,obsVx,obsVz,obsVy,speed};
  const kb=now<=(s.kbUntil||0),base=movementSpeedLimit(p,m),kbBonus=kb?Math.min(18,(s.kbH||0)*1.15):0,envelope=base+kbBonus+1.1,posCap=envelope*dt+MOVEMENT_CONFIG.POSITION_GRACE;
  const upCap=kb?Math.max(MOVEMENT_CONFIG.MAX_UP_SPEED,(s.kbV||0)+4):MOVEMENT_CONFIG.MAX_UP_SPEED,hardH=h>posCap*MOVEMENT_CONFIG.HARD_POSITION_FACTOR,hardV=obsVy>upCap||obsVy<-MOVEMENT_CONFIG.MAX_DOWN_SPEED;
  const accel=Math.hypot(obsVx-(s.vx||0),obsVz-(s.vz||0))/Math.max(.02,dt),accelCap=(p.grounded?MOVEMENT_CONFIG.GROUND_ACCEL:MOVEMENT_CONFIG.AIR_ACCEL)+(kb?90:0),soft=h>posCap||(speed>base+1.4&&accel>accelCap);
  if(soft)s.suspicion=Math.min(20,(s.suspicion||0)+1);else s.suspicion=Math.max(0,(s.suspicion||0)-.35);
  if(soft&&s.suspicion>=MOVEMENT_CONFIG.SOFT_FLAG_SCORE&&now-(s.lastFlagAt||0)>=MOVEMENT_CONFIG.FLAG_COOLDOWN_MS){s.lastFlagAt=now;acFlag(p,'movement','v2 soft speed='+speed.toFixed(2)+' accel='+accel.toFixed(1))}
  if(Number.isFinite(m.vx)&&Number.isFinite(m.vz))s.clientError=Math.hypot(m.vx-obsVx,m.vz-obsVz);
  return{ok:!hardH&&!hardV,detail:hardH?'speed='+speed.toFixed(2):hardV?'vy='+obsVy.toFixed(2):'',obsVx,obsVz,obsVy,speed};
}
function acceptMovementState(p,r,now){const s=ensureMoveV2(p);s.vx=r.obsVx||0;s.vy=r.obsVy||0;s.vz=r.obsVz||0;s.speed=r.speed||0;s.lastAt=now;if(now>(s.kbUntil||0)){s.kbH=0;s.kbV=0}}
function resetMovementV2(p){const s=ensureMoveV2(p);s.vx=s.vy=s.vz=s.speed=0;s.suspicion=0;s.kbUntil=0;s.kbH=s.kbV=0;s.clientError=0;s.lastAt=Date.now()}
function combatSnapshot(p,t=Date.now()){return{t,x:p.x,y:p.y,z:p.z,yaw:p.yaw,pitch:p.pitch}}
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
function resetComboState(p){if(!p)return;p.comboTarget=0;p.comboCount=0;p.lastComboHitAt=0}
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
}
function enqueueMeleeAttack(R,p,a,arrivalTime=Date.now()){
  if(R.st!=='play'||!p.alive)return false;
  if(!a||!Number.isInteger(a.seq)||a.seq<=0||a.seq>2147483647||!Number.isInteger(a.id)||!Number.isFinite(a.yaw)||!Number.isFinite(a.pitch))return false;
  if(a.seq<=p.lastAttackSeq)return false;p.lastAttackSeq=a.seq;
  if(!consumeAttackBucket(p,'network',COMBAT_CONFIG.MAX_NETWORK_CPS,COMBAT_CONFIG.NETWORK_BUCKET_CAPACITY,arrivalTime)){acFlag(p,'rate','attack_network');return false}
  if(p.attackQueue.length>=COMBAT_CONFIG.MAX_ATTACK_QUEUE){p.attackQueue.shift();acFlag(p,'rate','attack_queue')}
  const queued={seq:a.seq,id:a.id,yaw:a.yaw,pitch:a.pitch,clientTime:Number.isFinite(a.clientTime)?a.clientTime:0,serverTimeEstimate:Number.isFinite(a.serverTimeEstimate)?a.serverTimeEstimate:NaN,rtt:Number.isFinite(a.rtt)?a.rtt:0,arrivalTime};
  registerCombatClick(p,queued);p.attackQueue.push(queued);
  cancelSpawnProtection(p);if(p.fx.invis>0){p.fx.invis=0;pinv(p)}
  return true;
}
function evaluateQueuedMeleeAttack(R,p,a){
  const resolved=rewoundMeleeTarget(R,p,a);if(!resolved)return false;const q=resolved.q,hit=resolved.hit;
  const hk=heldKey(p),stick=hk==='knockbackStick'&&(p.inv.knockbackStick||0)>0;if(hk!=='sword'&&!stick){acFlag(p,'item','hit with '+hk);return false}
  const now=R.t,sameTarget=p.comboTarget===q.id,withinWindow=(now-(p.lastComboHitAt||0))*1000<COMBAT_CONFIG.COMBO_TIMEOUT_MS,nextCombo=sameTarget&&withinWindow?Math.min(COMBAT_CONFIG.COMBO_MAX,p.comboCount+1):1;
  const cr=!stick&&p.dy<-1,damage=stick?1.5:(DMG[p.sw]+2*p.up.sharp)*(cr?1.5:1),impulse=meleeKnockbackV2(p,q,resolved,nextCombo,stick);
  if(!hurt(R,q,damage,impulse.kx,impulse.kz,p,cr,'melee',impulse.vy,COMBAT_CONFIG.MELEE_IFRAME_SEC,'direct'))return false;
  p.comboCount=nextCombo;p.comboTarget=q.id;p.lastComboHitAt=now;p.lastCombatAt=now;
  tx(p,{t:'hitok',seq:a.seq,id:q.id,hp:Math.max(0,Math.ceil(q.hp)),cr:cr?1:0,combo:p.comboCount,rw:Math.round(resolved.rewindMs),dist:+hit.dist.toFixed(2),kbh:+impulse.h.toFixed(2),kbv:+impulse.v.toFixed(2)});bc(R,{t:'anim',id:p.id,k:'attack'});return true;
}
function processMeleeAttackQueue(R,p,now=Date.now()){
  while(p.attackQueue&&p.attackQueue.length){
    const a=p.attackQueue.shift();if(now-a.arrivalTime>COMBAT_CONFIG.MAX_ATTACK_AGE_MS)continue;
    if(!consumeAttackBucket(p,'useful',COMBAT_CONFIG.MAX_USEFUL_CPS,COMBAT_CONFIG.USEFUL_BUCKET_CAPACITY,now))continue;
    evaluateQueuedMeleeAttack(R,p,a);
  }
}
const SHOP_RADIUS=10;
const nearBase = p => {
  const q=p.roomShop||null, x=q?q[0]:S.IS[p.team][0]+.5, y=q?q[1]:S.BASE_Y+2, z=q?q[2]:S.IS[p.team][1]+.5;
  return Math.hypot(p.x-x,p.z-z)<=SHOP_RADIUS&&Math.abs(p.y-y)<6;
};
const buyFail=(p,code,text)=>tx(p,{t:'buyResult',ok:0,code,text});
const buyOk=p=>tx(p,{t:'buyResult',ok:1});
const pinv=p=>{sanitizeInventory(p);p.invSeq=(p.invSeq||0)+1;return tx(p,{t:'inv',i:p.inv,sw:p.sw,ar:p.ar,up:p.up,tools:p.tools,fx:p.fx,traps:p.trapQueue||[],seq:p.invSeq})};
const sfx = (p,k) => tx(p,{t:'sfx',k});
const feed = (R, text, aTeam=-1, bTeam=-1, kind='info',parts=null) => bc(R,{t:'feed',text,aTeam,bTeam,kind,parts,at:Date.now()});
const feedParts=(...p)=>p.filter(Boolean);
const statsPayload = R => [...R.ps.values()].map(p=>({
  id:p.id,name:p.name,team:p.team,disconnected:!!p.disconnected,
  kills:p.stats.kills,finalKills:p.stats.finalKills,bedsDestroyed:p.stats.bedsDestroyed,
  deaths:p.stats.deaths,resourcesCollected:p.stats.resourcesCollected
}));
const sfxAt = (R,k,x,y,z,r=7) => {
  R.ps.forEach(p => {
    if (!p.alive) return;
    if (Math.hypot(p.x-x,p.y-y,p.z-z) <= r) tx(p,{t:'sfx3d',k,x,y,z,r});
  });
};
function playerHitsBlock(q,x,y,z){
  if(!q.alive)return false;
  const samples=[[q.x,q.y,q.z],[q.px??q.x,q.py??q.y,q.pz??q.z]];
  // Também verifica o trecho entre o último snapshot e a posição atual.
  for(let i=1;i<=2;i++){
    const a=i/3;samples.push([
      (q.px??q.x)+(q.x-(q.px??q.x))*a,
      (q.py??q.y)+(q.y-(q.py??q.y))*a,
      (q.pz??q.z)+(q.z-(q.pz??q.z))*a
    ]);
  }
  return samples.some(([px,py,pz])=>{
    const horizontal=px+.36>x&&px-.36<x+1&&pz+.36>z&&pz-.36<z+1;
    const vertical=py+.03<y+1&&py+1.80>y;
    return horizontal&&vertical;
  });
}
function protectedPlacement(R,x,y,z){
  for(const t of modeCfg(R).activeTeams){
    const b=R.BD?.[t];if(b&&x===b[0]&&y===b[1]&&z===b[2])return 'bed';
    const sh=R.SHOP?.[t];if(sh&&Math.hypot(x+.5-sh[0],z+.5-sh[2])<1.3&&Math.abs(y+.5-sh[1])<2.4)return 'shop';
    for(const kind of ['team','ender']){const c=chestPos(R,t,kind);if(c&&Math.hypot(x+.5-c[0],z+.5-c[2])<1.05&&Math.abs(y+.5-c[1])<1.8)return 'chest'}
  }
  return '';
}
function spawn(p) { const sp=p.roomSpawn||[S.IS[p.team][0]+.5,S.BASE_Y+2.02,S.IS[p.team][1]+.5];p.x=sp[0];p.y=sp[1];p.z=sp[2]; p.px=p.x;p.py=p.y;p.pz=p.z; p.hp = 20; p.alive = 1;p.spectator=false;p.spawnProtect=GAMEPLAY.spawnProtect;p.fallVyMin=0;p.grounded=false;p.wasGrounded=false; p.breaking=null;p.fx.blind=0;p.fx.fatigue=0;p.fx.slow=0; p.lt = Date.now();resetCombatInput(p);resetMovementV2(p); tx(p, { t: 'tp', x: p.x, y: p.y, z: p.z, hard:1 }); }
function spawnLobby(p,i=0){const a=(i%8)/8*Math.PI*2,r=5.2;p.x=S.LOBBY[0]+.5+Math.cos(a)*r;p.z=S.LOBBY[2]+.5+Math.sin(a)*r;p.y=S.LOBBY[1]+1.02;p.px=p.x;p.py=p.y;p.pz=p.z;p.hp=20;p.alive=1;p.out=0;p.lt=Date.now();tx(p,{t:'tp',x:p.x,y:p.y,z:p.z});}
const lobby = R => { const mc=modeCfg(R); bc(R, { t:'lobby', host:R.host, mapId:R.mapId, maps:Object.values(S.MAPS), modeId:R.modeId, modes:Object.values(MODES), teamCap:mc.teamCap, activeTeams:mc.activeTeams, solo:!!mc.solo, l:[...R.ps.values()].map(q=>[q.id,q.name,q.team,q.disconnected?1:0]) }); };

function finalizeProfiles(R,winnerTeam,winnerId){
  const progress={};
  R.ps.forEach(p=>{if(p.admin||!p.profileId)return;const rec=ensureProfile(p.profileId,p.name),won=R.modeId==='solo'?p.id===winnerId:p.team===winnerTeam,xpGain=25+(won?100:0)+(p.stats.kills||0)*10+(p.stats.finalKills||0)*25+(p.stats.bedsDestroyed||0)*40;rec.matches=(rec.matches||0)+1;rec.wins=(rec.wins||0)+(won?1:0);rec.losses=(rec.losses||0)+(won?0:1);for(const k of ['kills','finalKills','bedsDestroyed','deaths','resourcesCollected'])rec[k]=(rec[k]||0)+(p.stats[k]||0);rec.xp=(rec.xp||0)+xpGain;progress[p.id]={xpGain,profile:publicProfile(rec)};tx(p,{t:'profileUpdate',xpGain,profile:progress[p.id].profile})});saveProfiles();return progress
}
function win(R) {
  if (R.st !== 'play') return;
  const live = [...R.ps.values()].filter(q => !q.out&&!q.admin), teams = new Set(live.map(q => q.team));
  if (teams.size <= 1) {
    const winnerTeam=live[0]?.team ?? -1,winnerId=live[0]?.id??-1,winnerName=live[0]?.name||'';
    R.st = 'ended';
    const progress=finalizeProfiles(R,winnerTeam,winnerId);
    R.final={t:'end',winnerTeam,winnerId,winnerName,modeId:R.modeId,stats:statsPayload(R),time:+R.t.toFixed(1),progress,ranking:rankingPayload()};
    bc(R,R.final);
    setTimeout(() => { if (rooms.get(R.code) === R && R.st==='ended') rooms.delete(R.code); }, 90000);
  }
}
function cancelSpawnProtection(p){if(p&&p.spawnProtect>0){p.spawnProtect=0;tx(p,{t:'spawnProtect',v:0})}}
function die(R, q, cause='combat') {
  if(!q.alive)return;
  q.stats.deaths++;
  q.alive = 0; q.hp = 0; q.rt = 5; q.breaking=null;q.spawnProtect=0;q.fx.blind=0;q.fx.fatigue=0;q.fx.slow=0;q.fx.milk=0; q.tools.pick=Math.max(0,q.tools.pick-1); q.tools.axe=Math.max(0,q.tools.axe-1); pinv(q); sfx(q,'death');
  const creditWindow=(cause==='void'||cause==='fall')?8:5;
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
    const text=cause==='void'?`${icon} ${q.name}${middle}${killer.name}${final?' · FINAL!':''}`:cause==='explosion'?`${icon} ${q.name}${middle}${killer.name}${final?' · FINAL!':''}`:`${icon} ${killer.name}${middle}${q.name}${final?' · FINAL!':''}`;
    const parts=cause==='void'||cause==='explosion'?feedParts({text:icon+' '},{text:q.name,team:q.team},{text:middle},{text:killer.name,team:killer.team},{text:final?' · FINAL!':''}):feedParts({text:icon+' '},{text:killer.name,team:killer.team},{text:middle},{text:q.name,team:q.team},{text:final?' · FINAL!':''});
    feed(R,text,killer.team,q.team,final?'final':'kill',parts);
  } else {
    const icon=cause==='void'?'☠':cause==='explosion'?'🔥':cause==='fall'?'☠':'☠',middle=cause==='void'?' caiu no vazio':cause==='explosion'?' morreu em uma explosão':cause==='fall'?' morreu por queda':' morreu';
    feed(R,icon+' '+q.name+middle,-1,q.team,'death',feedParts({text:icon+' '},{text:q.name,team:q.team},{text:middle}));
  }
  if (final) { q.out = 1; win(R); }
}
function hurt(R,q,d,kx,kz,src,cr,cause='combat',kbVy=4.5,iframeSec=GAMEPLAY.damageIFrames,kbMode='scaled'){
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
  sendKnockback(q,outKx,outKz,vertical,melee?'melee':'generic');sfx(q,'hurt');
  bc(R,{t:'fx',x:q.x,y:q.y+1,z:q.z,c:cr?0xffd23d:0xd23c3c});bc(R,{t:'hitfx',x:q.x,y:q.y+1,z:q.z,cr:cr?1:0,d:+dealt.toFixed(1),target:q.id,src:src?src.id:0});tx(q,{t:'hurtPulse',d:+dealt.toFixed(1),cr:cr?1:0,breakCombo:melee?1:0});
  if(q.hp<=0)die(R,q,cause);return true;
}
function killBed(R, t, src) {
  if (!R.bed[t]) return;
  const b = R.BD[t]; setb(R, b[0], b[1], b[2], 0); R.bed[t] = 0;
  if(src){src.stats.bedsDestroyed++;feed(R,`🛏 ${src.name} destruiu a cama ${S.TN[t]}!`,src.team,t,'bed',feedParts({text:'🛏 '},{text:src.name,team:src.team},{text:' destruiu a cama '},{text:S.TN[t],team:t},{text:'!'}));}
  else feed(R,`A cama do Time ${S.TN[t]} foi destruída!`,-1,t,'bed');
  bc(R, { t:'bed', bed:R.bed, team:t, pos:R.BD[t] });
  R.ps.forEach(q=>{if(q.team===t&&!q.alive&&!q.out){q.out=1;q.spectator=true;tx(q,{t:'eliminated',reason:'Sua cama foi destruída durante o respawn.'});msg(R,q.name+' foi eliminado!')}});
  win(R);
}
function boom(R, q) {
  const r = 3;
  for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) for (let c = -r; c <= r; c++)
    if (a * a + b * b + c * c <= r * r) { const X = q.x + a, Y = q.y + b, Z = q.z + c; if (get(R, X, Y, Z) && R.pf[S.ix(X, Y, Z)] && ![7,16].includes(get(R,X,Y,Z))) setb(R, X, Y, Z, 0); }
  bc(R, { t: 'fx', x: q.x + .5, y: q.y + .5, z: q.z + .5, c: 0xff8a2a });
  R.ps.forEach(e => {
    if (!e.alive) return;
    const dx = e.x - q.x - .5, dy = e.y + .9 - q.y - .5, dz = e.z - q.z - .5, L = Math.hypot(dx, dy, dz);
    if (L < 5) hurt(R, e, 9 * (1 - L / 5), dx / (L || 1)*1.25, dz / (L || 1)*1.25, q.o, false, 'explosion');
  });
}

function aimRay(R, p, yaw, pitch, range) {
  const cy = Math.cos(pitch), dx = -Math.sin(yaw) * cy, dy = Math.sin(pitch), dz = -Math.cos(yaw) * cy;
  let best = null, bd = range;
  R.ps.forEach(q => {
    if (q === p || !q.alive || q.team === p.team) return;
    const x = q.x - p.x, y = q.y + .9 - (p.y + 1.62), z = q.z - p.z, L = Math.hypot(x, y, z);
    if (L < bd && L > .01 && (x * dx + y * dy + z * dz) / L > .985) { best = q; bd = L; }
  });
  let bx = p.x + dx * range, by = p.y + 1.62 + dy * range, bz = p.z + dz * range;
  for (let t = .25; t <= range; t += .2) {
    const x = p.x + dx * t, y = p.y + 1.62 + dy * t, z = p.z + dz * t;
    if (get(R, Math.floor(x), Math.floor(y), Math.floor(z))) {
      bx = x; by = y; bz = z;
      if (t < bd) { bd = t; best = null; }
      break;
    }
  }
  return { dx, dy, dz, best, dist: bd, x: p.x + dx * bd, y: p.y + 1.62 + dy * bd, z: p.z + dz * bd, bx, by, bz };
}
function fireballBoom(R,x,y,z,owner){
  const r=2;for(let a=-r;a<=r;a++)for(let b=-r;b<=r;b++)for(let c=-r;c<=r;c++){if(a*a+b*b+c*c>r*r)continue;const X=Math.floor(x)+a,Y=Math.floor(y)+b,Z=Math.floor(z)+c;if(get(R,X,Y,Z)&&R.pf[S.ix(X,Y,Z)]&&![7,16].includes(get(R,X,Y,Z)))setb(R,X,Y,Z,0)}
  bc(R,{t:'fx',x,y,z,c:0xff6a00});sfxAt(R,'fireball',x,y,z,9);
  R.ps.forEach(q=>{if(!q.alive)return;const dx=q.x-x,dy=q.y+.9-y,dz=q.z-z,L=Math.hypot(dx,dy,dz);if(L>=4.5)return;const f=Math.max(.08,1-L/4.5),self=q===owner,nx=dx/(L||1),nz=dz/(L||1),h=self?1.55:1.32,vy=self?5.8+5.0*f:4.8+3.0*f;hurt(R,q,9*f,nx*h,nz*h,owner,false,'explosion',vy)})
}

function throwableTntBoom(R,kind,x,y,z,owner){
  const cfg={
    tnt:{radius:3.4,damage:7.5,knock:11,breakR:2.7,color:0xff4b32},
    tntImpulse:{radius:5.4,damage:1.5,knock:18,breakR:1.2,color:0xddeeff},
    tntSlow:{radius:4.6,damage:2.5,knock:7,breakR:.8,color:0x78bfff},
    tntDamage:{radius:4.5,damage:13,knock:9,breakR:1.5,color:0xff2448}
  }[kind]||null;
  if(!cfg)return;
  if(cfg.breakR>0){
    const r=Math.ceil(cfg.breakR);
    for(let a=-r;a<=r;a++)for(let b=-r;b<=r;b++)for(let c=-r;c<=r;c++){
      if(a*a+b*b+c*c>cfg.breakR*cfg.breakR)continue;
      const X=Math.floor(x)+a,Y=Math.floor(y)+b,Z=Math.floor(z)+c;
      if(get(R,X,Y,Z)&&R.pf[S.ix(X,Y,Z)]&&![7,16].includes(get(R,X,Y,Z)))setb(R,X,Y,Z,0);
    }
  }
  bc(R,{t:'fx',x,y,z,c:cfg.color});
  sfxAt(R,'fireball',x,y,z,8);
  R.ps.forEach(q=>{
    if(!q.alive)return;
    const dx=q.x-x,dy=q.y+.9-y,dz=q.z-z,L=Math.hypot(dx,dy,dz);
    if(L>=cfg.radius)return;
    const f=1-L/cfg.radius,nx=dx/(L||1),nz=dz/(L||1);
    if(kind==='tntImpulse'){
      sendKnockback(q,nx*cfg.knock*f,nz*cfg.knock*f,Math.max(5.5,10.5*f),'tntImpulse');
      if(q!==owner)hurt(R,q,cfg.damage*f,nx*.45,nz*.45,owner,false,'explosion');
    }else{
      hurt(R,q,cfg.damage*f,nx*(cfg.knock/7),nz*(cfg.knock/7),owner,false,'explosion');
      if(kind==='tntSlow'&&q!==owner){q.fx.slow=Math.max(q.fx.slow||0,7);pinv(q)}
    }
  });
}

function breakTime(p, b) {
  const m=S.BLOCKS[b]||{hard:.7,tool:null}, lv=m.tool?p.tools[m.tool]||0:0;
  let mult=1;
  if(m.tool==='shears'&&lv) mult=.28;
  else if(m.tool==='pick'&&lv) mult=lv===1?.55:.32;
  else if(m.tool==='axe'&&lv) mult=lv===1?.55:.32;
  const haste=p.up.haste>=2?.68:p.up.haste===1?.82:1,fatigue=p.fx.fatigue>0?1.65:1;
  return Math.max(.14,m.hard*mult*haste*fatigue);
}
function addDrop(R,k,n,x,y,z,max=64){
  max=Math.max(max,128);let d=R.drops.find(e=>e.k===k&&Math.hypot(e.x-x,e.z-z)<2.0&&e.n<max);
  if(d){d.n=Math.min(max,d.n+n);} else {d={id:++R.dropSeq,k,n:Math.min(max,n),x,y,z};R.drops.push(d);}
  if(['iron','gold','dia','em'].includes(k)) sfxAt(R,'resource_'+k,x,y,z,k==='iron'?4.5:6);
  bc(R,{t:'drops',l:R.drops});
}
function genSnapshot(R){
  const base=R.g.base.map((g,i)=>{const tier=Math.max(0,Math.min(3,R.genTier?.[i]||0)),cfg=BASE_GEN_TIERS[tier];return [+(Math.max(0,cfg.iron-g.iron)).toFixed(2),cfg.gold?+(Math.max(0,cfg.gold-g.gold)).toFixed(2):-1,cfg.dia?+(Math.max(0,cfg.dia-g.dia)).toFixed(2):-1,tier]});
  const cg=centralGenCfg(R),dia=R.g.dia.map(g=>+(Math.max(0,cg.diamond-g.t)).toFixed(2));
  return {base,dia,em:+Math.max(0,cg.emerald-R.g.em.t).toFixed(2),tiers:[...(R.genTier||[])],centralTier:cg.label};
}
function pickupDrops(R, players){
  let changed=false;
  for(let i=R.drops.length-1;i>=0;i--){
    const d=R.drops[i], p=players.find(q=>q.alive&&Math.hypot(q.x-d.x,q.z-d.z)<1.55&&Math.abs(q.y-d.y)<2.6);
    if(!p) continue;
    p.inv[d.k]=(p.inv[d.k]||0)+d.n;p.stats.resourcesCollected+=d.n;p.dirty=0;pinv(p);
    if(['iron','gold','dia','em'].includes(d.k)) sfxAt(R,'pickup_'+d.k,d.x,d.y,d.z,6);
    else sfx(p,'pickup');
    R.drops.splice(i,1);changed=true;
  }
  if(changed)bc(R,{t:'drops',l:R.drops});
}
function nearOwnBase(p){const b=p.roomSpawn||[S.IS[p.team][0]+.5,S.BASE_Y+2.02,S.IS[p.team][1]+.5];return Math.hypot(p.x-b[0],p.z-b[2])<20&&Math.abs(p.y-b[1])<9;}
function enemyInBase(R,p){const b=p.roomSpawn||[S.IS[p.team][0]+.5,S.BASE_Y+2.02,S.IS[p.team][1]+.5];return [...R.ps.values()].find(q=>q.alive&&q.team!==p.team&&Math.hypot(q.x-b[0],q.z-b[2])<20)}
function teamPlayers(R,t){return [...R.ps.values()].filter(q=>q.team===t&&!q.admin)}
function setTeamUp(R,t,key,value){teamPlayers(R,t).forEach(q=>{q.up[key]=value;pinv(q)})}
const TRAP_NAME={trapMiner:'Fadiga de Mineração',trapBlind:'É uma Armadilha!',trapAlarm:'Alarme / Revelação',trapCounter:'Contra-Ataque'};
function syncTeamTraps(R,t){const queue=[...(R.traps?.[t]||[])];teamPlayers(R,t).forEach(q=>{q.trapQueue=queue;pinv(q)})}
function teamTrapAlert(R,t,text,enemyTeam=-1){teamPlayers(R,t).forEach(q=>tx(q,{t:'feed',text,aTeam:t,bTeam:enemyTeam,kind:'trap'}))}
function triggerTeamTraps(R){
  if(!R.traps)return;
  for(const t of modeCfg(R).activeTeams){
    const defenders=teamPlayers(R,t),anchor=defenders.find(q=>q.alive)||defenders[0];
    if(!anchor||!R.bed[t])continue;
    const b=anchor.roomSpawn||[S.IS[t][0]+.5,S.BASE_Y+2.02,S.IS[t][1]+.5];
    const inside=new Set([...R.ps.values()].filter(q=>q.alive&&!q.out&&!q.admin&&q.team!==t&&Math.hypot(q.x-b[0],q.z-b[2])<20).map(q=>q.id));
    const prev=R.trapInside[t]||new Set(),enemy=[...inside].map(id=>R.ps.get(id)).find(q=>q&&!prev.has(q.id));
    R.trapInside[t]=inside;
    if(!enemy||!R.traps[t].length)continue;
    const trap=R.traps[t].shift(),milk=(enemy.fx.milk||0)>0,name=TRAP_NAME[trap]||'Armadilha';
    syncTeamTraps(R,t);
    teamTrapAlert(R,t,`⚠ ${enemy.name} ativou ${name}!`,enemy.team);
    if(milk){teamTrapAlert(R,t,`🥛 Magic Milk neutralizou o efeito da armadilha, mas o invasor foi detectado.`,enemy.team);continue}
    if(trap==='trapMiner')enemy.fx.fatigue=Math.max(enemy.fx.fatigue||0,10);
    else if(trap==='trapBlind'){enemy.fx.blind=Math.max(enemy.fx.blind||0,8);enemy.fx.slow=Math.max(enemy.fx.slow||0,8)}
    else if(trap==='trapAlarm')enemy.fx.invis=0;
    else if(trap==='trapCounter')defenders.filter(nearOwnBase).forEach(q=>{q.fx.speed=Math.max(q.fx.speed||0,10);q.fx.jump=Math.max(q.fx.jump||0,10);pinv(q)});
    pinv(enemy);
  }
}
function chestPos(meta,t,kind){const sp=meta.SPAWN?.[t];if(!sp)return null;const [cx,cz]=S.IS[t],L=Math.hypot(cx,cz)||1,ix=-cx/L,iz=-cz/L,txv=-iz,tz=ix,side=kind==='team'?4:-4;return[sp[0]+txv*side+ix*1.5,sp[1],sp[2]+tz*side+iz*1.5]}
function nearChest(R,p,kind){const a=chestPos(R,p.team,kind);return !!a&&Math.hypot(p.x-a[0],p.z-a[2])<4.8&&Math.abs(p.y-a[1])<4}
function generatorUpgradeInfo(R,t){
  const tier=Math.max(0,Math.min(3,R.genTier?.[t]||0)),next=GEN_UPGRADE_COSTS[tier]||null;
  return{tier,next:next?{key:next.key,n:next.n,label:next.label,name:next.name}:null,current:BASE_GEN_TIERS[tier].name};
}
function chestState(R,p,kind){const items=kind==='team'?R.teamChest[p.team]:p.enderChest,gi=kind==='team'?generatorUpgradeInfo(R,p.team):null;tx(p,{t:'chestState',kind,items,genTier:gi?.tier??0,genNext:gi?.next||null,genCurrent:gi?.current||''})}
function broadcastTeamChest(R,t){teamPlayers(R,t).forEach(q=>{if(q.openChestKind==='team'&&nearChest(R,q,'team'))chestState(R,q,'team')})}

function projectileDir(yaw,pitch){const c=Math.cos(pitch);return{x:-Math.sin(yaw)*c,y:Math.sin(pitch),z:-Math.cos(yaw)*c};}
function spawnProjectile(R,p,k,yaw,pitch,speed,charge=1){
  const d=projectileDir(yaw,pitch), id=++R.projSeq;
  const pr={id,k,o:p.id,team:p.team,x:p.x,y:p.y+1.55,z:p.z,vx:d.x*speed,vy:d.y*speed,vz:d.z*speed,age:0,charge};
  R.projectiles.push(pr);bc(R,{t:'projSpawn',p:pr});return pr;
}
function clampHistory(now,prev){
  const d=(prev??now)-now,m=COMBAT_HITBOX.historyMax;
  return now+Math.max(-m,Math.min(m,d));
}
function sweptCombatBounds(q,pad=0){
  const px=clampHistory(q.x,q.px),py=clampHistory(q.y,q.py),pz=clampHistory(q.z,q.pz),r=COMBAT_HITBOX.radius+pad;
  return{minX:Math.min(q.x,px)-r,maxX:Math.max(q.x,px)+r,minY:Math.min(q.y,py)-COMBAT_HITBOX.feetPad-pad,maxY:Math.max(q.y,py)+COMBAT_HITBOX.height+pad,minZ:Math.min(q.z,pz)-r,maxZ:Math.max(q.z,pz)+r};
}
function segmentAabbT(x0,y0,z0,x1,y1,z1,b){
  const dx=x1-x0,dy=y1-y0,dz=z1-z0;let t0=0,t1=1;
  for(const [s,d,min,max] of [[x0,dx,b.minX,b.maxX],[y0,dy,b.minY,b.maxY],[z0,dz,b.minZ,b.maxZ]]){
    if(Math.abs(d)<1e-8){if(s<min||s>max)return null;continue}
    let a=(min-s)/d,c=(max-s)/d;if(a>c){const tmp=a;a=c;c=tmp}
    t0=Math.max(t0,a);t1=Math.min(t1,c);if(t0>t1)return null;
  }
  return t0>=0&&t0<=1?t0:null;
}
function meleeRayHit(R,p,q,yaw,pitch){
  const cy=Math.cos(pitch),dir={x:-Math.sin(yaw)*cy,y:Math.sin(pitch),z:-Math.cos(yaw)*cy},reach=COMBAT_HITBOX.meleeReach,b=sweptCombatBounds(q,COMBAT_HITBOX.meleePad);
  // Testa posição atual e uma posição anterior curta do atacante. Isso compensa um único
  // snapshot de rede sem permitir alcançar além do limite real de 3.8 blocos.
  const px=clampHistory(p.x,p.px),py=clampHistory(p.y,p.py),pz=clampHistory(p.z,p.pz),origins=[[p.x,p.y+1.62,p.z],[px,py+1.62,pz]];
  let best=null;
  for(const [ox,oy,oz] of origins){
    const ex=ox+dir.x*reach,ey=oy+dir.y*reach,ez=oz+dir.z*reach,t=segmentAabbT(ox,oy,oz,ex,ey,ez,b);
    if(t==null)continue;
    const dist=t*reach,hx=ox+(ex-ox)*t,hy=oy+(ey-oy)*t,hz=oz+(ez-oz)*t;
    // Parede ou bloco sólido antes da superfície do jogador cancela o golpe.
    const wall=segmentHitsBlock(R,ox,oy,oz,hx-dir.x*.035,hy-dir.y*.035,hz-dir.z*.035);
    if(wall)continue;
    if(!best||dist<best.dist)best={dir,dist,hx,hy,hz};
  }
  return best;
}
function segmentHitPlayer(R,pr,nx,ny,nz){
  let best=null,bestT=Infinity;
  const pad=pr.k==='fireball'?.18:pr.k==='snowball'?.11:pr.k==='arrow'?.045:pr.k==='pearl'?.08:pr.k.startsWith('tnt')?.15:.07;
  for(const q of R.ps.values()){
    if(!q.alive||q.team===pr.team||q.out||q.admin)continue;
    const t=segmentAabbT(pr.x,pr.y,pr.z,nx,ny,nz,sweptCombatBounds(q,pad));
    if(t!=null&&t<bestT){best=q;bestT=t}
  }
  pr._hitT=best?bestT:null;
  return best;
}
function segmentHitsBlock(R,x0,y0,z0,x1,y1,z1){
  const L=Math.hypot(x1-x0,y1-y0,z1-z0),steps=Math.max(1,Math.ceil(L/.18));
  for(let i=1;i<=steps;i++){const a=i/steps,x=x0+(x1-x0)*a,y=y0+(y1-y0)*a,z=z0+(z1-z0)*a;if(get(R,Math.floor(x),Math.floor(y),Math.floor(z)))return{x,y,z}}
  return null;
}
function bridgeEggTrail(R,pr,nx,ny,nz){
  const L=Math.hypot(nx-pr.x,ny-pr.y,nz-pr.z),steps=Math.max(1,Math.ceil(L/.32));
  for(let i=1;i<=steps;i++){
    const a=i/steps,x=Math.floor(pr.x+(nx-pr.x)*a),y=Math.floor(pr.y+(ny-pr.y)*a-1.45),z=Math.floor(pr.z+(nz-pr.z)*a);
    if(!S.inXZ(x,z)||y<1||y>=S.H-2||get(R,x,y,z)||protectedPlacement(R,x,y,z))continue;
    if([...R.ps.values()].some(q=>playerHitsBlock(q,x,y,z)))continue;
    setb(R,x,y,z,pr.team+1,1);
  }
}
function buildPopupTower(R,p,x,y,z){
  if(![x,y,z].every(Number.isInteger)||!S.inXZ(x,z)||y<1||y>=S.H-6||Math.hypot(x+.5-p.x,y+.5-p.y,z+.5-p.z)>6.5||!get(R,x,y-1,z))return false;
  const blocks=[],dx=p.x-(x+.5),dz=p.z-(z+.5),doorAxis=Math.abs(dx)>Math.abs(dz)?'x':'z',doorSign=doorAxis==='x'?(dx>=0?1:-1):(dz>=0?1:-1);
  for(let h=0;h<4;h++)for(let ox=-2;ox<=2;ox++)for(let oz=-2;oz<=2;oz++){
    if(Math.abs(ox)!==2&&Math.abs(oz)!==2)continue;
    const door=doorAxis==='x'?ox===2*doorSign&&oz===0:oz===2*doorSign&&ox===0;
    if(door&&h<2)continue;blocks.push([x+ox,y+h,z+oz]);
  }
  for(let ox=-2;ox<=2;ox++)for(let oz=-2;oz<=2;oz++)if((Math.abs(ox)===2||Math.abs(oz)===2)&&((ox+oz)&1)===0)blocks.push([x+ox,y+4,z+oz]);
  [[-1,-1,0],[0,-1,1],[0,0,2],[1,0,3]].forEach(([ox,oz,h])=>blocks.push([x+ox,y+h,z+oz]));
  const free=blocks.filter(([X,Y,Z])=>!get(R,X,Y,Z)&&![...R.ps.values()].some(q=>playerHitsBlock(q,X,Y,Z)));
  if(free.length<18)return false;
  free.forEach(([X,Y,Z])=>setb(R,X,Y,Z,p.team+1,1));return true;
}
function safePearlPos(R,pr,x,y,z){
 const h=Math.hypot(pr.vx,pr.vz)||1,back=[-pr.vx/h*.48,-pr.vz/h*.48],tries=[[x+back[0],y,z+back[1]],[x+back[0],y+.7,z+back[1]],[x+back[0]*1.8,y+.2,z+back[1]*1.8],[x,y+1.2,z]];
 for(const [X,Y,Z] of tries){if(Y<1||Y>S.H-3)continue;const solid=(yy)=>get(R,Math.floor(X),Math.floor(yy),Math.floor(Z));if(!solid(Y+.05)&&!solid(Y+1.05)&&!solid(Y+1.72))return[X,Math.max(1,Y),Z]}
 return null
}
function projectileImpact(R,pr,x,y,z,target){
  const owner=R.ps.get(pr.o);let dealt=false;
  if(pr.k==='arrow'&&target)dealt=hurt(R,target,4+5*pr.charge,pr.vx/(Math.hypot(pr.vx,pr.vz)||1)*1.18,pr.vz/(Math.hypot(pr.vx,pr.vz)||1)*1.18,owner,false,'projectile',4.0);
  else if(pr.k==='snowball'&&target)dealt=hurt(R,target,1.5,pr.vx/(Math.hypot(pr.vx,pr.vz)||1)*1.62,pr.vz/(Math.hypot(pr.vx,pr.vz)||1)*1.62,owner,false,'projectile',3.2);
  else if(pr.k==='fireball')fireballBoom(R,x,y,z,owner);
  else if(['tnt','tntImpulse','tntSlow','tntDamage'].includes(pr.k))throwableTntBoom(R,pr.k,x,y,z,owner);
  else if(pr.k==='pearl'&&owner&&owner.alive){const pos=safePearlPos(R,pr,x,y,z);if(pos){owner.x=pos[0];owner.y=pos[1];owner.z=pos[2];owner.hp=Math.max(1,owner.hp-2);owner.px=owner.x;owner.py=owner.y;owner.pz=owner.z;tx(owner,{t:'tp',x:owner.x,y:owner.y,z:owner.z,hard:1})}else tx(owner,{t:'m',s:'A pérola não encontrou um local seguro.'});}
  if(dealt&&owner)tx(owner,{t:'projectileHit',k:pr.k,id:target?.id||0});
  bc(R,{t:'projHit',id:pr.id,k:pr.k,x,y,z,target:target?.id||0,vx:pr.vx,vy:pr.vy,vz:pr.vz});
}
function tickProjectiles(R,dt){
  for(let i=R.projectiles.length-1;i>=0;i--){
    const pr=R.projectiles[i];pr.age+=dt;
    const grav=pr.k==='fireball'?.35:pr.k==='bridgeEgg'?3.0:pr.k==='arrow'?8.2:pr.k==='pearl'?7.4:pr.k.startsWith('tnt')?10.2:8.8;
    pr.vy-=grav*dt;
    const nx=pr.x+pr.vx*dt,ny=pr.y+pr.vy*dt,nz=pr.z+pr.vz*dt;
    if(pr.k==='bridgeEgg')bridgeEggTrail(R,pr,nx,ny,nz);
    let target=pr.k==='bridgeEgg'?null:segmentHitPlayer(R,pr,nx,ny,nz),block=segmentHitsBlock(R,pr.x,pr.y,pr.z,nx,ny,nz);
    if(block&&target){
      const db=Math.hypot(block.x-pr.x,block.y-pr.y,block.z-pr.z),travel=Math.hypot(nx-pr.x,ny-pr.y,nz-pr.z),dtar=(pr._hitT??1)*travel;
      if(db+.03<dtar)target=null;
    }
    const outside=nx<S.MIN_X-8||nx>S.MAX_X+8||nz<S.MIN_Z-8||nz>S.MAX_Z+8;
    const maxAge=pr.k==='arrow'?14:pr.k==='pearl'?10:pr.k==='bridgeEgg'?5:pr.k==='snowball'?9:pr.k.startsWith('tnt')?1.35:8;
    if(ny<=-20||outside||pr.age>maxAge){
      if(pr.k.startsWith('tnt'))throwableTntBoom(R,pr.k,nx,ny,nz,R.ps.get(pr.o));
      bc(R,{t:'projHit',id:pr.id,k:pr.k,x:nx,y:ny,z:nz});R.projectiles.splice(i,1);continue;
    }
    if(target||block){projectileImpact(R,pr,block?.x??nx,block?.y??ny,block?.z??nz,target);R.projectiles.splice(i,1);continue}
    pr.x=nx;pr.y=ny;pr.z=nz;
  }
}


wss.on('connection', ws => {
  let R, p;
  ws.connectedAt=Date.now();ws.lastPongAt=Date.now();
  ws.on('pong', () => { ws.lastPongAt=Date.now(); });
  ws.on('error',err=>{netLog(p,'erro de socket',netReason(err&&err.message));if(ws.readyState!==3)terminateSocket(ws,'socket_error')});
  ws.on('message', raw => {
    try{
    if(raw.length>4096){try{ws.close(1009,'mensagem muito grande')}catch(e){}return}
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (m.t === 'reconnect' && !p) {
      const code=String(m.room||'').slice(0,12).toLowerCase(), rr=rooms.get(code);
      const found=rr&&[...rr.ps.values()].find(q=>q.token===m.token&&q.disconnected&&Date.now()<q.reconnectDeadline);
      if(!found)return tx({ws},{t:'reconnectFail'});
      R=rr;p=found;const downtime=p.disconnectedAt?Date.now()-p.disconnectedAt:0;p.ws=ws;p.disconnected=false;p.disconnectedAt=0;p.reconnectDeadline=0;p.lt=Date.now();ws.playerId=p.id;p.roomCode=R.code;netLog(p,'reconectado',`downtime=${downtime}ms`);
      tx(p,{t:'reconnected',id:p.id,team:p.team,token:p.token,room:R.code,mapId:R.mapId,modeId:R.modeId,activeChunks:R.activeChunks,ed:[...R.ed.values()],drops:R.drops,bed:R.bed,st:R.st,inv:p.inv,sw:p.sw,ar:p.ar,tools:p.tools,up:p.up,fx:p.fx,traps:p.trapQueue||[],admin:p.admin?1:0,alive:p.alive?1:0,out:p.out?1:0,spectator:p.spectator?1:0,adminPlayers:[...R.ps.values()].filter(q=>q!==p&&!q.admin).map(q=>[q.id,q.name,q.team]),roster:[...R.ps.values()].map(q=>[q.id,q.name,q.team]),final:R.final});
      if(R.final)tx(p,R.final);
      feed(R,`${p.name} reconectou.`,p.team,-1,'reconnect');return;
    }
    if (m.t === 'join' && !p) {
      const code = String(m.room || 'sala').trim().slice(0,12).toLowerCase()||'sala'; R = room(code);
      if (R.st !== 'lobby') return tx({ ws }, { t: 'err', s: 'Partida em andamento nessa sala.' });
      for(const [id,q] of R.ps){if(!q.ws||q.ws.readyState!==1)R.ps.delete(id)}
      if(R.host&&!R.ps.has(R.host))R.host=[...R.ps.keys()][0]||null;
      const mc=modeCfg(R);
      if (R.ps.size>=mc.maxPlayers) return tx({ws},{t:'err',s:`Sala cheia para o modo ${mc.name} (${mc.maxPlayers} jogadores).`});
      const counts=[0,0,0,0];R.ps.forEach(q=>counts[q.team]++);
      let team=mc.activeTeams.reduce((best,t)=>counts[t]<counts[best]?t:best,mc.activeTeams[0]);
      if(counts[team]>=mc.teamCap)return tx({ws},{t:'err',s:'Os dois times estão cheios.'});
      const safeProfile=String(m.profileId||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,64)||crypto.randomBytes(12).toString('hex');
      p = mkp(ws, safePlayerName(m.name), team, safeProfile); p.id = ++uid;p.roomCode=R.code;ws.playerId=p.id;ensureProfile(safeProfile,p.name);
      p.roomShop=R.SHOP[p.team];p.roomSpawn=R.SPAWN?.[p.team];R.ps.set(p.id, p); if (!R.host) R.host = p.id; spawnLobby(p,R.ps.size-1);netLog(p,'conectado ao lobby');
      tx(p, { t:'init', id:p.id, team:p.team, token:p.token, room:R.code, mapId:R.mapId, modeId:R.modeId, activeChunks:R.activeChunks, ed:[...R.ed.values()], drops:R.drops, profile:publicProfile(ensureProfile(p.profileId,p.name)), ranking:rankingPayload() }); lobby(R); return;
    }
    if (!p) return;
    const play = R.st === 'play' && p.alive;
    switch (m.t) {
      case 'netPing': tx(p,{t:'netPong',at:Number(m.at)||0,serverAt:Date.now(),buffer:p.ws?.bufferedAmount||0,ac:p.ac||null,metrics:serverMetricsSnapshot(p)}); break;
      case 'stateSync': tx(p,{t:'stateSync',ed:[...R.ed.values()],blockSeq:R.blockSeq||0,inv:p.inv,invSeq:p.invSeq||0,sw:p.sw,ar:p.ar,tools:p.tools,up:p.up,fx:p.fx,traps:p.trapQueue||[]}); break;
      case 'ranking': tx(p,{t:'ranking',ranking:rankingPayload(),profile:publicProfile(ensureProfile(p.profileId,p.name))}); break;
      case 'replay': {
        if(R.st!=='ended')break;
        const g=S.gen(R.mapId,true);R.B=g.B;R.BD=g.BD;R.SHOP=g.SHOP;R.GEN=g.GEN;R.SPAWN=g.SPAWN;R.DIGEN=g.DIGEN;R.EMGEN=g.EMGEN;R.activeChunks=g.activeChunks;R.pf=new Uint8Array(g.B.length);R.ed.clear();R.q=[];R.drops=[];R.tnt=[];R.projectiles=[];R.blockSeq=0;R.final=null;R.st='lobby';R.t=0;R.suddenDeath=false;R.collapseAt=0;R.lastCollapse=0;R.teamChest=[emptyChest(),emptyChest(),emptyChest(),emptyChest()];R.genTier=[0,0,0,0];R.traps=[[],[],[],[]];R.trapInside=[new Set(),new Set(),new Set(),new Set()];R.g={base:[0,1,2,3].map(()=>({iron:0,gold:0,dia:0})),dia:S.DI.map(()=>({t:0})),em:{t:0}};
        R.ps.forEach((q,i)=>{
 q.out=0;q.spectator=false;q.alive=1;q.hp=20;q.breaking=null;q.openChestKind='';q.stats={kills:0,finalKills:0,bedsDestroyed:0,deaths:0,resourcesCollected:0};q.trapQueue=[];q.enderChest=emptyChest();
 if(!q.admin){q.sw=0;q.ar=0;q.tools={pick:0,axe:0,shears:0};q.fx={speed:0,jump:0,invis:0,slow:0,fatigue:0,blind:0,milk:0};q.up={sharp:0,prot:0,forge:0,haste:0,regen:0,trap:0,trapMiner:0,trapSlow:0,trapCounter:0};q.inv={wool:24,planks:0,endstone:0,glass:0,obsidian:0,tnt:0,tntImpulse:0,tntSlow:0,tntDamage:0,apple:0,bow:0,arrow:0,fireball:0,snowball:0,pearl:0,speedPotion:0,jumpPotion:0,invisPotion:0,compass:0,magicMilk:0,bridgeEgg:0,popupTower:0,knockbackStick:0,iron:0,gold:0,dia:0,em:0}}
 q.roomShop=R.SHOP[q.team];q.roomSpawn=R.SPAWN?.[q.team];spawnLobby(q,i);pinv(q);tx(q,{t:'replay'})
});
        bc(R,{t:'map',mapId:R.mapId,activeChunks:R.activeChunks});lobby(R);break
      }
      case 'chestOpen': {const kind=m.kind==='ender'?'ender':'team';if(!play||!nearChest(R,p,kind))break;p.openChestKind=kind;chestState(R,p,kind);break}
      case 'chestClose': p.openChestKind='';break;
      case 'chestMove': {
        const kind=m.kind==='ender'?'ender':'team',key=String(m.key||'');if(!play||!CHEST_KEYS.includes(key)||!nearChest(R,p,kind))break;
        p.openChestKind=kind;const box=kind==='team'?R.teamChest[p.team]:p.enderChest,dir=m.dir==='withdraw'?'withdraw':'deposit';
        let n=m.n==='all'?Infinity:Math.max(1,Math.min(999,Math.floor(Number(m.n)||1)));
        if(dir==='deposit'){n=Math.min(n,p.inv[key]||0);if(n>0){p.inv[key]-=n;box[key]=(box[key]||0)+n}}
        else{n=Math.min(n,box[key]||0);if(n>0){box[key]-=n;p.inv[key]=(p.inv[key]||0)+n}}
        pinv(p);if(kind==='team')broadcastTeamChest(R,p.team);else chestState(R,p,kind);break
      }
      case 'genUpgrade': {
        if(!play||!nearChest(R,p,'team'))break;
        const tier=Math.max(0,Math.min(3,R.genTier?.[p.team]||0)),cost=GEN_UPGRADE_COSTS[tier],box=R.teamChest[p.team];
        if(!cost){tx(p,{t:'m',s:'O gerador da sua base já está no nível máximo.'});chestState(R,p,'team');break}
        if((box[cost.key]||0)<cost.n){tx(p,{t:'m',s:'Deposite '+cost.label+' no baú do time para essa melhoria.'});chestState(R,p,'team');break}
        box[cost.key]-=cost.n;R.genTier[p.team]=tier+1;
        const bg=R.g.base[p.team];if(bg){if(tier===0)bg.gold=0;if(tier===2)bg.dia=0}
        teamPlayers(R,p.team).forEach(q=>tx(q,{t:'feed',text:'⚙ Gerador da base evoluiu para Nível '+(tier+1)+' — '+BASE_GEN_TIERS[tier+1].name+'.',aTeam:p.team,bTeam:-1,kind:'upgrade'}));
        broadcastTeamChest(R,p.team);break;
      }
      case 'team': {
        const mc=modeCfg(R);
        if(R.st!=='lobby'||!Number.isInteger(m.team)||!mc.activeTeams.includes(m.team))break;
        const count=[...R.ps.values()].filter(q=>q!==p&&q.team===m.team).length;
        if(count>=mc.teamCap){tx(p,{t:'m',s:`Esse time já está cheio (${mc.teamCap}/${mc.teamCap}).`});break}
        p.team=m.team;p.roomShop=R.SHOP[p.team];p.roomSpawn=R.SPAWN?.[p.team];spawnLobby(p,[...R.ps.keys()].indexOf(p.id));lobby(R);break;
      }
      case 'mode': {
        if(R.st!=='lobby'||p.id!==R.host||!MODES[m.mode])break;
        const next=MODES[m.mode];
        if(R.ps.size>next.maxPlayers){tx(p,{t:'m',s:`Não é possível mudar para ${next.name}: há ${R.ps.size} jogadores na sala.`});break}
        R.modeId=next.id;rebalanceForMode(R,next);
        R.ps.forEach((q,i)=>spawnLobby(q,i));lobby(R);break;
      }
      case 'map': {
        if(R.st!=='lobby'||p.id!==R.host||!S.MAPS[m.map])break;
        R.mapId=m.map;const g=S.gen(R.mapId,true);R.B=g.B;R.BD=g.BD;R.SHOP=g.SHOP;R.GEN=g.GEN;R.SPAWN=g.SPAWN;R.DIGEN=g.DIGEN;R.EMGEN=g.EMGEN;R.activeChunks=g.activeChunks;R.pf=new Uint8Array(g.B.length);R.ed.clear();R.q=[];R.drops=[];R.tnt=[];R.projectiles=[];
        bc(R,{t:'map',mapId:R.mapId,activeChunks:R.activeChunks});R.ps.forEach((q,i)=>{q.roomShop=R.SHOP[q.team];q.roomSpawn=R.SPAWN?.[q.team];spawnLobby(q,i)});lobby(R);break;
      }
      case 'chat': {
        const rawText=String(m.text||'').trim();
        if(rawText.toLowerCase()===ADMIN_COMMAND){
          if(!p.admin){
            p.adminBackup={inv:{...p.inv},sw:p.sw,ar:p.ar,tools:{...p.tools},up:{...p.up}};p.admin=true;
            for(const k of ADMIN_ITEMS)p.inv[k]=k==='bow'?1:999;p.sw=3;p.ar=2;p.tools={pick:2,axe:2,shears:1};
          }else{
            p.admin=false;const b=p.adminBackup;if(b){p.inv={...b.inv};p.sw=b.sw;p.ar=b.ar;p.tools={...b.tools};p.up={...b.up}}p.adminBackup=null;spawn(p);
          }
          p.alive=1;p.hp=20;p.out=0;p.breaking=null;p.ih=0;pinv(p);
          tx(p,{t:'adminMode',enabled:p.admin?1:0,players:[...R.ps.values()].filter(q=>q!==p&&!q.admin).map(q=>[q.id,q.name,q.team])});
          tx(p,{t:'m',s:p.admin?'Modo ADMIN ativado.':'Modo ADMIN desativado.'});win(R);break;
        }
        if(!allow(p,'chat',650))break;
        const text=rawText.replace(/[<>]/g,'').slice(0,120);if(!text)break;
        const mc=modeCfg(R),scope=(m.scope==='team'&&!mc.solo)?'team':'global',payload={t:'chat',scope,id:p.id,name:p.name,team:p.team,text};
        if(scope==='team'){const data=JSON.stringify(payload);R.ps.forEach(q=>{if(q.team===p.team)sendSocket(q.ws,data)})}else bc(R,payload);
        break;
      }
      case 'start':
        if (R.st !== 'lobby' || p.id !== R.host || [...R.ps.values()].filter(q=>!q.admin).length < 2) break;
        { const mc=modeCfg(R),active=[...R.ps.values()].filter(q=>!q.admin&&mc.activeTeams.includes(q.team)),teams=new Set(active.map(q=>q.team));
          if(mc.solo){
            if(active.length<2){tx(p,{t:'m',s:'O modo Solo precisa de pelo menos 2 jogadores.'});break}
            if(teams.size!==active.length){tx(p,{t:'m',s:'Cada jogador precisa estar em uma base diferente no Solo.'});break}
          }else{
            if(teams.size<2){tx(p,{t:'m',s:'É necessário ter jogadores nos times Azul e Vermelho.'});break}
            if(active.some(q=>[...R.ps.values()].filter(x=>!x.admin&&x.team===q.team).length>mc.teamCap)){tx(p,{t:'m',s:'Um time excede a capacidade do modo escolhido.'});break}
          }
        }
        const gg=S.gen(R.mapId,false);R.B=gg.B;R.BD=gg.BD;R.SHOP=gg.SHOP;R.GEN=gg.GEN;R.SPAWN=gg.SPAWN;R.DIGEN=gg.DIGEN;R.EMGEN=gg.EMGEN;R.activeChunks=gg.activeChunks;R.pf=new Uint8Array(gg.B.length);R.ed.clear();R.q=[];R.drops=[];R.tnt=[];R.projectiles=[];R.traps=[[],[],[],[]];R.trapInside=[new Set(),new Set(),new Set(),new Set()];R.genTier=[0,0,0,0];R.g={base:[0,1,2,3].map(()=>({iron:0,gold:0,dia:0})),dia:S.DI.map(()=>({t:0})),em:{t:0}};R.ps.forEach(q=>q.trapQueue=[]);
        R.st = 'play';R.t=0;R.suddenDeath=false;R.collapseAt=0;R.lastCollapse=0;
        for (let t = 0; t < 4; t++) {
          R.bed[t] = [...R.ps.values()].some(q => !q.admin&&q.team === t) ? 1 : 0;
          if (!R.bed[t]) { const b = R.BD[t]; setb(R, b[0], b[1], b[2], 0); }
        }
        R.ps.forEach(q=>{q.roomShop=R.SHOP[q.team];q.roomSpawn=R.SPAWN?.[q.team];spawn(q)}); R.ps.forEach(pinv); bc(R, { t:'start', bed:R.bed, mapId:R.mapId, modeId:R.modeId, activeChunks:R.activeChunks }); break;
      case 'mv': {
        const spectating=!!p.spectator&&p.out;if((!p.alive&&!spectating)||!allow(p,'mv',15))break;
        const n=Date.now(),dt=Math.max(.02,Math.min(.5,(n-p.lt)/1000));p.lt=n,check=inspectMovementPacket(p,m,dt,n,spectating);if(check.drop)break;
        if(!check.ok){const ms=ensureMoveV2(p);ms.corrections++;if(!p.admin&&!spectating&&n-(ms.lastFlagAt||0)>=MOVEMENT_CONFIG.FLAG_COOLDOWN_MS){ms.lastFlagAt=n;acFlag(p,'movement','v2 hard '+check.detail)}tx(p,{t:'tp',x:p.x,y:p.y,z:p.z,hard:0,reason:'movement'});break}
        const oldY=p.y,newDy=(m.y-p.y)/dt;p.hspeed=Math.min(24,check.speed||0);p.dy=newDy;p.px=p.x;p.py=p.y;p.pz=p.z;p.x=m.x;p.y=m.y;p.z=m.z;p.yaw=m.yaw;p.pitch=m.pitch;acceptMovementState(p,check,n);recordCombatHistory(p,n);
        if(!spectating&&!p.admin){const fy=Math.floor(p.y-.09),feet=[[0,0],[.28,0],[-.28,0],[0,.28],[0,-.28],[.22,.22],[-.22,.22],[.22,-.22],[-.22,-.22]],below=feet.some(([ox,oz])=>get(R,Math.floor(p.x+ox),fy,Math.floor(p.z+oz)));p.wasGrounded=p.grounded;p.grounded=!!below;if(!p.grounded&&newDy<p.fallVyMin)p.fallVyMin=newDy;if(p.grounded&&!p.wasGrounded){const impact=Math.abs(Math.min(0,p.fallVyMin));if(impact>10.2)hurt(R,p,Math.min(14,(impact-10.2)*.82),0,0,null,false,'fall',0);p.fallVyMin=0}else if(p.grounded&&Math.abs(newDy)<1.5)p.fallVyMin=0}
        break;
      }
      case 'adminPlace': {
        if(!p.admin)break;const x=Math.floor(m.x),y=Math.floor(m.y),z=Math.floor(m.z),b=Math.floor(m.b);
        if(![x,y,z,b].every(Number.isInteger)||b<ADMIN_BLOCK_MIN||b>ADMIN_BLOCK_MAX||!S.inXZ(x,z)||y<1||y>=S.H-1)break;
        if(Math.hypot(x+.5-p.x,y+.5-(p.y+1.2),z+.5-p.z)>12)break;setb(R,x,y,z,b,1);break;
      }
      case 'adminBreak': {
        if(!p.admin)break;const x=Math.floor(m.x),y=Math.floor(m.y),z=Math.floor(m.z);
        if(![x,y,z].every(Number.isInteger)||!S.inXZ(x,z)||y<0||y>=S.H)break;
        if(Math.hypot(x+.5-p.x,y+.5-(p.y+1.2),z+.5-p.z)>12)break;const b=get(R,x,y,z);if(b>=8&&b<=11)killBed(R,b-8,p);else setb(R,x,y,z,0,0);break;
      }
      case 'adminGive': {
        if(!p.admin||!Number.isInteger(m.id))break;const q=R.ps.get(m.id),k=String(m.k||''),n=Math.max(1,Math.min(999,Math.floor(Number(m.n)||1)));
        if(!q||q.admin||!ADMIN_ITEMS.has(k))break;
        if(k==='bow')q.inv.bow=1;else q.inv[k]=(q.inv[k]||0)+n;pinv(q);tx(p,{t:'m',s:'Itens entregues para '+q.name+'.'});break;
      }
      case 'adminSetGear': {
        if(!p.admin)break;p.sw=Math.max(0,Math.min(3,Math.floor(Number(m.sw)||0)));p.ar=Math.max(0,Math.min(2,Math.floor(Number(m.ar)||0)));pinv(p);break;
      }
      case 'adminTest': {
        if(!p.admin)break;
        const action=String(m.action||''),q=Number.isInteger(m.id)?R.ps.get(m.id):p;
        if(action==='resync'){tx(p,{t:'stateSync',ed:[...R.ed.values()],blockSeq:R.blockSeq||0,inv:p.inv,invSeq:p.invSeq||0,sw:p.sw,ar:p.ar,tools:p.tools,up:p.up,fx:p.fx,traps:p.trapQueue||[]});break}
        if(action==='sudden'){if(R.st==='play'){R.t=Math.max(R.t,GAMEPLAY.suddenDeathAt+.1);tx(p,{t:'m',s:'Morte súbita forçada para teste.'})}break}
        if(action==='genTier'){const t=Math.max(0,Math.min(3,Math.floor(Number(m.value)||0)));R.genTier[p.team]=t;tx(p,{t:'m',s:'Gerador do time ajustado para nível '+t+'.'});break}
        if(!q||q.admin&&q!==p)break;
        if(action==='clearInv'){for(const k of Object.keys(q.inv))q.inv[k]=0;pinv(q)}
        else if(action==='oneBlock'){const k=['wool','planks','endstone','glass','obsidian'].includes(m.k)?m.k:'wool';for(const b of ['wool','planks','endstone','glass','obsidian'])q.inv[b]=0;q.inv[k]=1;pinv(q)}
        else if(action==='fullBlocks'){for(const b of ['wool','planks','endstone','glass','obsidian'])q.inv[b]=64;pinv(q)}
        else if(action==='setHp'){q.hp=Math.max(1,Math.min(20,Number(m.value)||20));pinv(q)}
        else if(action==='kill'){if(q.alive)die(R,q,'admin')}
        else if(action==='respawn'){q.out=0;q.spectator=false;spawn(q);pinv(q)}
        else if(action==='destroyBed'){if(R.bed[q.team])killBed(R,q.team,null)}
        else if(action==='spawn'){spawn(q);pinv(q)}
        tx(p,{t:'m',s:'Teste ADM executado: '+action});break;
      }
      case 'held': {
        if(Number.isInteger(m.s)&&m.s>=0&&m.s<=19)p.held=m.s;else acFlag(p,'item','held='+m.s);
        break;
      }
      case 'attackBatch': {
        if(!play||!Array.isArray(m.attacks))break;
        if(m.attacks.length>COMBAT_CONFIG.MAX_ATTACK_BATCH){acFlag(p,'rate','attack_batch='+m.attacks.length);break}
        const arrival=Date.now();for(const a of m.attacks)enqueueMeleeAttack(R,p,a,arrival);break;
      }
      case 'hit': {
        if(!play)break;const seq=Number.isInteger(m.seq)&&m.seq>0?m.seq:++p.legacyAttackSeq;
        enqueueMeleeAttack(R,p,{seq,id:m.id,yaw:m.yaw,pitch:m.pitch,clientTime:Number(m.clientTime)||0,serverTimeEstimate:Number(m.serverTimeEstimate),rtt:Number(m.rtt)||0},Date.now());break;
      }
      case 'place': {
        const held=heldKey(p),item=['wool','planks','endstone','glass','obsidian'].includes(held)?held:'',x=m.x,y=m.y,z=m.z,auto=m.auto===1,k={wool:p.team+1,planks:5,endstone:12,glass:7,obsidian:16}[item];
        const placeResult=(ok,reason='')=>tx(p,{t:'placeResult',ok:ok?1:0,reason,k:item||String(m.k||''),x,y,z,remaining:Number(p.inv[item]||0)});
        if(!play){placeResult(false,'not_playing');break}if(!item||!k){acFlag(p,'item','place '+String(m.k||'')+' held='+held);placeResult(false,'wrong_item');break}
        if(m.k&&m.k!==item){acFlag(p,'item','place declared '+m.k+' held='+item);placeResult(false,'wrong_item');break}
        if(![x,y,z].every(Number.isInteger)||y<1||y>=S.H-2){placeResult(false,'invalid_pos');break}
        const placeGap=auto?(p.hspeed>5.2?82:p.hspeed>3?90:105):64;if(!allow(p,'place',placeGap)){acFlag(p,'place','rate');placeResult(false,'cooldown');break}
        if(!(p.inv[item]>0)){placeResult(false,'no_item');break}if(get(R,x,y,z)){placeResult(false,'occupied');break}
        if(Math.hypot(x+.5-p.x,y+.5-p.y-1.45,z+.5-p.z)>6.45){acFlag(p,'reach','place');placeResult(false,'too_far');break}
        if(auto){
          const now=Date.now(),idle=now-(p.autoBridgeAt||0);if(idle>500)p.autoBridgeY=y;
          if(p.hspeed<.35){placeResult(false,'auto_stationary');break}
          if(p.autoBridgeY!==y){acFlag(p,'place','auto_vertical');placeResult(false,'auto_vertical');break}
          const hd=Math.hypot(x+.5-p.x,z+.5-p.z);if(hd>2.15||Math.abs((y+1.15)-p.y)>2.25){acFlag(p,'place','auto_range');placeResult(false,'too_far');break}
          p.autoBridgeAt=now;
        }
        if(![[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].some(d=>get(R,x+d[0],y+d[1],z+d[2]))){placeResult(false,'no_support');break}
        const protectedKind=protectedPlacement(R,x,y,z);if(protectedKind){sfx(p,'blocked');placeResult(false,'protected_'+protectedKind);break}
        if([...R.ps.values()].some(q=>playerHitsBlock(q,x,y,z))){sfx(p,'blocked');placeResult(false,'player_collision');break}
        cancelSpawnProtection(p);if(p.fx.invis>0){p.fx.invis=0;pinv(p)}setb(R,x,y,z,k,1);p.inv[item]--;placeResult(true);pinv(p);const placeSfx=item==='wool'?'place_cloth':item==='planks'?'place_wood':'place_stone';sfxAt(R,placeSfx,x+.5,y+.5,z+.5,6);break
      }
      case 'breakStart': {
        cancelSpawnProtection(p);if(p.fx.invis>0){p.fx.invis=0;pinv(p)}
        const {x,y,z}=m;
        if(!play||![x,y,z].every(Number.isInteger)||Math.hypot(x+.5-p.x,y+.5-p.y-1.6,z+.5-p.z)>7)break;
        const b=get(R,x,y,z); if(!b)break;
        if(b>=8&&b<=11){
          if(b-8===p.team){tx(p,{t:'m',s:'Essa é a sua cama!'});break;}
          p.breaking={x,y,z,b,need:.9,at:R.t};tx(p,{t:'breakp',x,y,z,d:.9});break;
        }
        if(!R.pf[S.ix(x,y,z)])break;
        const need=breakTime(p,b);p.breaking={x,y,z,b,need,at:R.t};tx(p,{t:'breakp',x,y,z,d:need});bc(R,{t:'anim',id:p.id,k:'mine'});break;
      }
      case 'breakStop': p.breaking=null; break;
      case 'buy': {
        if(!play){buyFail(p,'not_playing','A loja só funciona durante a partida.');break}
        if(!allow(p,'buy',120)){buyFail(p,'cooldown','Aguarde um instante para comprar novamente.');break}
        const item=S.SH[m.i];
        if(!item){buyFail(p,'invalid_item','Item inválido.');break}
        if(!nearBase(p)){buyFail(p,'too_far','Chegue mais perto da loja do seu time.');break}
        const [name,currency,basePrice,type,key,value]=item,modePrices=item[8]||null,trapQueue=R.traps[p.team]||[],price=type==='trap'?([1,2,4][trapQueue.length]??4):(modePrices&&modePrices[R.modeId]!=null?modePrices[R.modeId]:basePrice),diamondArmor=type==='ar'&&value===2;
        if(type==='trap'&&(!R.bed[p.team]||trapQueue.length>=3)){buyFail(p,'trap_full',!R.bed[p.team]?'Seu time não possui mais cama.':'A fila de traps está cheia (3/3).');break}
        if(diamondArmor&&((p.inv.em||0)<4||(p.inv.dia||0)<32)){buyFail(p,'no_resource','Armadura de Diamante custa 4 esmeraldas + 32 diamantes.');break}
        if(!diamondArmor&&(p.inv[currency]||0)<price){buyFail(p,'no_resource',`Recursos insuficientes para ${name}.`);break}
        let ok=1,teamUpgrade=false,trapBought=false;
        if(type==='inv'&&key==='bow'){if(p.inv.bow>0)ok=0;else p.inv.bow=1}
        else if(type==='inv')p.inv[key]=(p.inv[key]||0)+value;
        else if(type==='sw'&&p.sw<value)p.sw=value;
        else if(type==='ar'&&p.ar<value)p.ar=value;
        else if(type==='tool'&&(p.tools[key]||0)<value)p.tools[key]=value;
        else if(type==='up'&&(p.up[key]||0)===value-1){setTeamUp(R,p.team,key,value);teamUpgrade=true}
        else if(type==='trap'){trapQueue.push(key);p.trapQueue=[...trapQueue];trapBought=true}
        else ok=0;
        if(!ok){buyFail(p,'already_owned','Você já possui esse item ou uma versão melhor.');break}
        p.inv[currency]-=price;if(diamondArmor)p.inv.dia-=32;
        if(trapBought)syncTeamTraps(R,p.team);else if(teamUpgrade)teamPlayers(R,p.team).forEach(pinv);else pinv(p);buyOk(p);sfx(p,'buy');
        break;
      }
      case 'shoot': {
        cancelSpawnProtection(p);if(p.fx.invis>0){p.fx.invis=0;pinv(p)}if(!play||!Number.isFinite(m.yaw)||!Number.isFinite(m.pitch))break;
        const kind=String(m.k||''),charge=Math.max(.2,Math.min(1,Number(m.charge)||1));
        if(!heldAllows(p,kind)){acFlag(p,'item','shoot '+kind+' held='+heldKey(p));break}
        const gap=kind==='bow'?220:kind==='fireball'?900:kind==='snowball'?300:TNT_KEYS.has(kind)?650:999999;
        if(!allow(p,'shoot_'+kind,gap)){acFlag(p,'projectile',kind);break}bc(R,{t:'anim',id:p.id,k:'attack'});
        if(kind==='bow'){if(p.inv.bow<1||p.inv.arrow<1)break;p.inv.arrow--;spawnProjectile(R,p,'arrow',m.yaw,m.pitch,22+22*charge,charge);pinv(p)}
        else if(kind==='fireball'){if(p.inv.fireball<1)break;p.inv.fireball--;spawnProjectile(R,p,'fireball',m.yaw,m.pitch,21,1);pinv(p)}
        else if(kind==='snowball'){if(p.inv.snowball<1)break;p.inv.snowball--;spawnProjectile(R,p,'snowball',m.yaw,m.pitch,26,1);pinv(p)}
        else if(TNT_KEYS.has(kind)){if((p.inv[kind]||0)<1)break;p.inv[kind]--;spawnProjectile(R,p,kind,m.yaw,m.pitch,13.5,1);pinv(p)}
        break
      }
      case 'use': {
        cancelSpawnProtection(p);if(!play)break;if(!allow(p,'use',300)){acFlag(p,'rate','use');break}
        const k=String(m.k||'');if(!heldAllows(p,k)){acFlag(p,'item','use '+k+' held='+heldKey(p));break}
        if(k==='pearl'&&p.inv.pearl>0&&Number.isFinite(m.yaw)&&Number.isFinite(m.pitch)){p.inv.pearl--;spawnProjectile(R,p,'pearl',m.yaw,m.pitch,24,1);pinv(p)}
        else if(k==='speedPotion'&&p.inv.speedPotion>0){p.inv.speedPotion--;p.fx.speed=45;pinv(p)}
        else if(k==='jumpPotion'&&p.inv.jumpPotion>0){p.inv.jumpPotion--;p.fx.jump=45;pinv(p)}
        else if(k==='invisPotion'&&p.inv.invisPotion>0){p.inv.invisPotion--;p.fx.invis=30;pinv(p)}
        else if(k==='magicMilk'&&p.inv.magicMilk>0){p.inv.magicMilk--;p.fx.milk=60;pinv(p);sfx(p,'buy')}
        else if(k==='bridgeEgg'&&p.inv.bridgeEgg>0&&Number.isFinite(m.yaw)&&Number.isFinite(m.pitch)){p.inv.bridgeEgg--;spawnProjectile(R,p,'bridgeEgg',m.yaw,m.pitch,21,1);pinv(p)}
        else if(k==='popupTower'&&p.inv.popupTower>0&&buildPopupTower(R,p,Math.floor(m.x),Math.floor(m.y),Math.floor(m.z))){p.inv.popupTower--;pinv(p);sfx(p,'place')}
        break
      }
      case 'apple': if(play&&heldAllows(p,'apple')&&allow(p,'apple',250)&&p.inv.apple>0&&p.hp<20){p.inv.apple--;p.hp=Math.min(20,p.hp+10);pinv(p);sfx(p,'eat')}else if(play&&!heldAllows(p,'apple'))acFlag(p,'item','apple held='+heldKey(p));break;
    }
    }catch(err){console.error('Erro isolado em mensagem WebSocket',err);try{tx(p||{ws},{t:'err',s:'Ação ignorada por segurança. Tente novamente.'})}catch(e){}}
  });
  ws.on('close',(code,reasonBuf)=>{
    if(!p)return;
    const reason=reasonBuf&&reasonBuf.length?reasonBuf.toString():ws._terminateReason||'';
    markDisconnected(R,p,ws,code,reason);
  });
});

let lastServerTickAt=performance.now();
setInterval(() => {
  const tickStarted=performance.now(),wallMs=Math.max(1,tickStarted-lastServerTickAt);lastServerTickAt=tickStarted;const dt=Math.max(.005,Math.min(.10,wallMs/1000));SERVER_METRICS.lastWallMs=wallMs;
  rooms.forEach(R => {
    try{
    R.t += dt;
    if (R.st === 'play') {
      const players = [...R.ps.values()];
      R.ps.forEach(p => {
        p.ih=Math.max(0,p.ih-dt);p.envIh=Math.max(0,(p.envIh||0)-dt);p.spawnProtect=Math.max(0,(p.spawnProtect||0)-dt);
        if(p.alive&&!p.disconnected){const combatNow=Date.now();recordCombatHistory(p,combatNow);processMeleeAttackQueue(R,p,combatNow);}
        p.fx.speed=Math.max(0,p.fx.speed-dt);p.fx.jump=Math.max(0,p.fx.jump-dt);p.fx.invis=Math.max(0,p.fx.invis-dt);p.fx.slow=Math.max(0,(p.fx.slow||0)-dt);p.fx.fatigue=Math.max(0,(p.fx.fatigue||0)-dt);p.fx.blind=Math.max(0,(p.fx.blind||0)-dt);p.fx.milk=Math.max(0,(p.fx.milk||0)-dt);
        if(p.disconnected&&p.reconnectDeadline&&Date.now()>=p.reconnectDeadline){
          netLog(p,'prazo de reconexão expirou',`offline=${Date.now()-(p.disconnectedAt||Date.now())}ms`);
          p.disconnected=false;p.disconnectedAt=0;p.reconnectDeadline=0;
          for(const k of ['iron','gold','dia','em']){const n=p.inv[k]||0;if(n>0){addDrop(R,k,n,p.x,p.y+.25,p.z,k==='iron'?48:k==='gold'?12:8);p.inv[k]=0;}}
          if(p.alive)die(R,p,'disconnect');
          p.out=1;feed(R,`${p.name} não reconectou a tempo e foi eliminado.`,-1,p.team,'disconnect');win(R);return;
        }
        if (p.alive) {
          p.hp = Math.min(20, p.hp + .4 * dt);
          if(p.up.regen&&nearOwnBase(p))p.hp=Math.min(20,p.hp+.8*dt);
          
          if(p.breaking){
            const br=p.breaking, same=get(R,br.x,br.y,br.z)===br.b, near=Math.hypot(br.x+.5-p.x,br.y+.5-p.y-1.6,br.z+.5-p.z)<=7;
            const cy=Math.cos(p.pitch),dx=-Math.sin(p.yaw)*cy,dy=Math.sin(p.pitch),dz=-Math.cos(p.yaw)*cy,bx=br.x+.5-p.x,by=br.y+.5-(p.y+1.62),bz=br.z+.5-p.z,bl=Math.hypot(bx,by,bz)||1,looking=(bx*dx+by*dy+bz*dz)/bl>.82;
            if(!same||!near||!looking){p.breaking=null;tx(p,{t:'breakCancel'});}
            else if(R.t-br.at>=br.need){if(br.b>=8&&br.b<=11)killBed(R,br.b-8,p);else if(R.pf[S.ix(br.x,br.y,br.z)]){const breakSfx=br.b>=1&&br.b<=4?'break_cloth':br.b===5?'break_wood':'break_stone';setb(R,br.x,br.y,br.z,0);sfxAt(R,breakSfx,br.x+.5,br.y+.5,br.z+.5,6);}p.breaking=null;}
          }
          if (p.y <= -20 && !p.admin) die(R, p, 'void');
        } else if (!p.out && (p.rt -= dt) <= 0) { spawn(p);tx(p,{t:'respawn'}); }
      });
      if(!R.suddenDeath&&R.t>=GAMEPLAY.suddenDeathAt){R.suddenDeath=true;R.collapseAt=R.t+3*60;for(let t=0;t<4;t++)if(R.bed[t])killBed(R,t,null);feed(R,'☠ MORTE SÚBITA! Todas as camas foram destruídas.','-1','-1','sudden');bc(R,{t:'phase',phase:'sudden',at:R.t})}
      if(R.suddenDeath&&R.t>=R.collapseAt&&R.t-R.lastCollapse>=GAMEPLAY.collapseEvery){R.lastCollapse=R.t;feed(R,'⚡ COLAPSO: jogadores restantes estão recebendo dano.','-1','-1','sudden');R.ps.forEach(q=>{if(q.alive&&!q.admin)hurt(R,q,1,0,0,null,false,'collapse',0)})}
      triggerTeamTraps(R);
      R.g.base.forEach((g, i) => {
        if(!modeCfg(R).activeTeams.includes(i))return;
        const bp=R.GEN[i]||[S.IS[i][0]+.5,S.BASE_Y+2,S.IS[i][1]+.5],gx=bp[0],gy=bp[1],gz=bp[2];
        const tier=Math.max(0,Math.min(3,R.genTier?.[i]||0)),cfg=BASE_GEN_TIERS[tier];
        g.iron+=dt;
        if(cfg.gold)g.gold+=dt;else g.gold=0;
        if(cfg.dia)g.dia+=dt;else g.dia=0;
        if(g.iron>=cfg.iron){g.iron-=cfg.iron;addDrop(R,'iron',1,gx,gy+.2,gz,32)}
        if(cfg.gold&&g.gold>=cfg.gold){g.gold-=cfg.gold;addDrop(R,'gold',1,gx+1,gy+.2,gz,10)}
        if(cfg.dia&&g.dia>=cfg.dia){g.dia-=cfg.dia;addDrop(R,'dia',1,gx-1,gy+.2,gz,4)}
      });
      const centralCfg=centralGenCfg(R);
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
      }
      R.pickupAcc+=dt;if(R.pickupAcc>=.1){R.pickupAcc=0;pickupDrops(R,players);}
      R.syncAcc=(R.syncAcc||0)+dt;if(R.syncAcc>=2.5){R.syncAcc=0;R.ps.forEach(q=>tx(q,{t:'stateDigest',blockSeq:R.blockSeq||0,invSeq:q.invSeq||0}))}
      R.ps.forEach(p => { if (p.dirty) { p.dirty = 0; pinv(p); } });
      for (let i = R.tnt.length; i--;) { const q = R.tnt[i]; if ((q.t -= dt) <= 0) { R.tnt.splice(i, 1); boom(R, q); } }
      tickProjectiles(R,dt);
    }
    if (R.q.length) { bc(R, { t: 'bb', l: R.q }); R.q = []; }
    if (R.st === 'play') {R.snapAcc+=dt;if(R.snapAcc>=SNAPSHOT_SEC){R.snapAcc%=SNAPSHOT_SEC;SERVER_METRICS.snapshots++;bc(R,{t:'s',seq:++R.netSeq,serverAt:Date.now(),time:+R.t.toFixed(1),bed:R.bed,mapId:R.mapId,modeId:R.modeId,gen:genSnapshot(R),p:[...R.ps.values()].map(p=>[p.id,+p.x.toFixed(2),+p.y.toFixed(2),+p.z.toFixed(2),+p.yaw.toFixed(2),+p.pitch.toFixed(2),Math.ceil(p.hp),p.alive,p.team,p.fx.invis>0?1:0,p.held,p.sw,p.ar,p.disconnected?1:0,p.admin?1:0,p.out?1:0,+Math.max(0,p.rt||0).toFixed(1),p.stats.kills,p.stats.finalKills,p.spawnProtect>0?1:0]),phase:R.suddenDeath?'sudden':'normal',pr:R.projectiles.map(q=>[q.id,q.k,+q.x.toFixed(2),+q.y.toFixed(2),+q.z.toFixed(2),+q.vx.toFixed(2),+q.vy.toFixed(2),+q.vz.toFixed(2)])});}}
    }catch(err){console.error(`[TICK] erro isolado na sala ${R.code}`,err);}
  });
  const tickCost=performance.now()-tickStarted;SERVER_METRICS.ticks++;SERVER_METRICS.lastTickMs=tickCost;SERVER_METRICS.avgTickMs=SERVER_METRICS.avgTickMs?SERVER_METRICS.avgTickMs*.92+tickCost*.08:tickCost;SERVER_METRICS.maxTickMs=Math.max(tickCost,SERVER_METRICS.maxTickMs*.995);if(tickCost>SERVER_TICK_MS)SERVER_METRICS.overruns++;SERVER_METRICS.rooms=rooms.size;let playerCount=0;rooms.forEach(R=>playerCount+=R.ps.size);SERVER_METRICS.players=playerCount;
}, SERVER_TICK_MS);

const heartbeat = setInterval(() => {
  const now=Date.now();
  wss.clients.forEach(ws => {
    if(ws.readyState!==1)return;
    const idle=now-(ws.lastPongAt||ws.connectedAt||now);
    if(idle>HEARTBEAT_TIMEOUT_MS){
      console.warn(`[NET] heartbeat timeout | player=${ws.playerId||'?'} idle=${idle}ms`);
      return terminateSocket(ws,'heartbeat_timeout');
    }
    try{ws.ping()}catch(err){console.warn('[NET] falha no ping',err?.message||err);terminateSocket(ws,'ping_error')}
  });
}, HEARTBEAT_INTERVAL_MS);
wss.on('close', () => clearInterval(heartbeat));

srv.listen(PORT, () => console.log('Bed Wars online na porta ' + PORT));
