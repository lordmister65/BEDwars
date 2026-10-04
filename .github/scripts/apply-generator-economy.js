const fs=require('fs');

function once(src,oldv,newv,label){
  const n=src.split(oldv).length-1;
  if(n!==1) throw new Error(`${label}: expected 1 match, found ${n}`);
  return src.replace(oldv,newv);
}
function regexOnce(src,re,repl,label){
  const m=src.match(re);
  if(!m) throw new Error(`${label}: pattern not found`);
  const rest=src.slice((m.index||0)+m[0].length);
  if(rest.match(re)) throw new Error(`${label}: pattern matched more than once`);
  return src.replace(re,repl);
}

let server=fs.readFileSync('server.js','utf8');
let game=fs.readFileSync('public/game.js','utf8');
let shared=fs.readFileSync('public/shared.js','utf8');
let style=fs.readFileSync('public/style.css','utf8');

// ---- Loja: armadura composta e remoção das antigas Forjas ----
shared=once(shared,
  "['Armadura de Diamante','em',6,'ar',0,2,'Armadura','💠']",
  "['Armadura de Diamante','em',4,'ar',0,2,'Armadura','💠']",
  'diamond armor base price');
shared=once(shared,
  "['Forja I (+50%)','dia',2,'up','forge',1,'Melhorias','⚙️'],['Forja II (+100%)','dia',4,'up','forge',2,'Melhorias','⚙️'],['Forja III (+150%)','dia',6,'up','forge',3,'Melhorias','⚙️'],['Forja IV (+200%)','dia',8,'up','forge',4,'Melhorias','⚙️'],",
  '',
  'remove old forge upgrades');

// ---- Configuração de economia ----
server=once(server,
  "const modeCfg=R=>MODES[R.modeId]||MODES['2v2'];",
  `const modeCfg=R=>MODES[R.modeId]||MODES['2v2'];
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
const CENTRAL_GEN={diamond:24,emerald:40};`,
  'generator economy constants');

server=once(server,
  "teamChest:[emptyChest(),emptyChest(),emptyChest(),emptyChest()], traps:[[],[],[],[]],",
  "teamChest:[emptyChest(),emptyChest(),emptyChest(),emptyChest()], genTier:[0,0,0,0], traps:[[],[],[],[]],",
  'room generator tiers');
server=once(server,
  "base: [0,1,2,3].map(() => ({ iron:0, gold:0 })),",
  "base: [0,1,2,3].map(() => ({ iron:0, gold:0, dia:0 })),",
  'base generator timers');

server=once(server,
  "function chestState(R,p,kind){const items=kind==='team'?R.teamChest[p.team]:p.enderChest;tx(p,{t:'chestState',kind,items})}",
  `function generatorUpgradeInfo(R,t){
  const tier=Math.max(0,Math.min(3,R.genTier?.[t]||0)),next=GEN_UPGRADE_COSTS[tier]||null;
  return{tier,next:next?{key:next.key,n:next.n,label:next.label,name:next.name}:null,current:BASE_GEN_TIERS[tier].name};
}
function chestState(R,p,kind){const items=kind==='team'?R.teamChest[p.team]:p.enderChest,gi=kind==='team'?generatorUpgradeInfo(R,p.team):null;tx(p,{t:'chestState',kind,items,genTier:gi?.tier??0,genNext:gi?.next||null,genCurrent:gi?.current||''})}`,
  'chest generator state');

server=once(server,
  "case 'chestMove': {const kind=m.kind==='ender'?'ender':'team',key=String(m.key||'');if(!play||!CHEST_KEYS.includes(key)||!nearChest(R,p,kind))break;const box=kind==='team'?R.teamChest[p.team]:p.enderChest,dir=m.dir==='withdraw'?'withdraw':'deposit';let n=m.n==='all'?Infinity:Math.max(1,Math.min(999,Math.floor(Number(m.n)||1)));if(dir==='deposit'){n=Math.min(n,p.inv[key]||0);if(n>0){p.inv[key]-=n;box[key]=(box[key]||0)+n}}else{n=Math.min(n,box[key]||0);if(n>0){box[key]-=n;p.inv[key]=(p.inv[key]||0)+n}}pinv(p);chestState(R,p,kind);break}\n      case 'team': {",
  `case 'chestMove': {const kind=m.kind==='ender'?'ender':'team',key=String(m.key||'');if(!play||!CHEST_KEYS.includes(key)||!nearChest(R,p,kind))break;const box=kind==='team'?R.teamChest[p.team]:p.enderChest,dir=m.dir==='withdraw'?'withdraw':'deposit';let n=m.n==='all'?Infinity:Math.max(1,Math.min(999,Math.floor(Number(m.n)||1)));if(dir==='deposit'){n=Math.min(n,p.inv[key]||0);if(n>0){p.inv[key]-=n;box[key]=(box[key]||0)+n}}else{n=Math.min(n,box[key]||0);if(n>0){box[key]-=n;p.inv[key]=(p.inv[key]||0)+n}}pinv(p);chestState(R,p,kind);break}
      case 'genUpgrade': {
        if(!play||!nearChest(R,p,'team'))break;
        const tier=Math.max(0,Math.min(3,R.genTier?.[p.team]||0)),cost=GEN_UPGRADE_COSTS[tier],box=R.teamChest[p.team];
        if(!cost){tx(p,{t:'m',s:'O gerador da sua base já está no nível máximo.'});chestState(R,p,'team');break}
        if((box[cost.key]||0)<cost.n){tx(p,{t:'m',s:'Deposite '+cost.label+' no baú do time para essa melhoria.'});chestState(R,p,'team');break}
        box[cost.key]-=cost.n;R.genTier[p.team]=tier+1;
        const bg=R.g.base[p.team];if(bg){if(tier===0)bg.gold=0;if(tier===2)bg.dia=0}
        teamPlayers(R,p.team).forEach(q=>tx(q,{t:'feed',text:'⚙ Gerador da base evoluiu para Nível '+(tier+1)+' — '+BASE_GEN_TIERS[tier+1].name+'.',aTeam:p.team,bTeam:-1,kind:'upgrade'}));
        chestState(R,p,'team');break;
      }
      case 'team': {`,
  'generator upgrade action');

server=once(server,
  `function genSnapshot(R){
  const players=[...R.ps.values()];
  const base=R.g.base.map((g,i)=>{const o=players.find(q=>q.team===i),fm=1+.5*(o?o.up.forge:0);return [+(Math.max(0,1.2/fm-g.iron)).toFixed(2),+(Math.max(0,5/fm-g.gold)).toFixed(2)]});
  const dia=R.g.dia.map(g=>+(Math.max(0,12-g.t)).toFixed(2));
  return {base,dia,em:+Math.max(0,22-R.g.em.t).toFixed(2)};
}`,
  `function genSnapshot(R){
  const base=R.g.base.map((g,i)=>{const tier=Math.max(0,Math.min(3,R.genTier?.[i]||0)),cfg=BASE_GEN_TIERS[tier];return [+(Math.max(0,cfg.iron-g.iron)).toFixed(2),cfg.gold?+(Math.max(0,cfg.gold-g.gold)).toFixed(2):-1,cfg.dia?+(Math.max(0,cfg.dia-g.dia)).toFixed(2):-1,tier]});
  const dia=R.g.dia.map(g=>+(Math.max(0,CENTRAL_GEN.diamond-g.t)).toFixed(2));
  return {base,dia,em:+Math.max(0,CENTRAL_GEN.emerald-R.g.em.t).toFixed(2),tiers:[...(R.genTier||[])]};
}`,
  'generator snapshot');

server=regexOnce(server,
  /      R\.g\.base\.forEach\(\(g, i\) => \{[\s\S]*?      if \(R\.g\.em\.t > 22\) \{[\s\S]*?      \}\n      R\.pickupAcc/,
  `      R.g.base.forEach((g, i) => {
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
      R.g.dia.forEach((g, i) => {
        g.t += dt;
        if(g.t<CENTRAL_GEN.diamond)return;
        g.t-=CENTRAL_GEN.diamond;
        const [gx,gy,gz]=R.DIGEN[i];addDrop(R,'dia',1,gx,gy,gz,4);
      });
      R.g.em.t += dt;
      if(R.g.em.t>=CENTRAL_GEN.emerald){
        R.g.em.t-=CENTRAL_GEN.emerald;
        const [gx,gy,gz]=R.EMGEN;addDrop(R,'em',1,gx,gy,gz,2);
      }
      R.pickupAcc`,
  'generator tick rates');

server=once(server,
  "R.traps=[[],[],[],[]];R.trapInside=[new Set(),new Set(),new Set(),new Set()];R.ps.forEach(q=>q.trapQueue=[]);",
  "R.traps=[[],[],[],[]];R.trapInside=[new Set(),new Set(),new Set(),new Set()];R.genTier=[0,0,0,0];R.g={base:[0,1,2,3].map(()=>({iron:0,gold:0,dia:0})),dia:S.DI.map(()=>({t:0})),em:{t:0}};R.ps.forEach(q=>q.trapQueue=[]);",
  'reset generator progression on match start');

// ---- Armadura de diamante: 4 esmeraldas + 32 diamantes ----
server=once(server,
  "const [name,currency,basePrice,type,key,value]=item,modePrices=item[8]||null,trapQueue=R.traps[p.team]||[],price=type==='trap'?([1,2,4][trapQueue.length]??4):(modePrices&&modePrices[R.modeId]!=null?modePrices[R.modeId]:basePrice);\n        if(type==='trap'&&(!R.bed[p.team]||trapQueue.length>=3)){buyFail(p,'trap_full',!R.bed[p.team]?'Seu time não possui mais cama.':'A fila de traps está cheia (3/3).');break}\n        if((p.inv[currency]||0)<price){buyFail(p,'no_resource',`Recursos insuficientes para ${name}.`);break}\n        let ok=1,teamUpgrade=false,trapBought=false;",
  "const [name,currency,basePrice,type,key,value]=item,modePrices=item[8]||null,trapQueue=R.traps[p.team]||[],price=type==='trap'?([1,2,4][trapQueue.length]??4):(modePrices&&modePrices[R.modeId]!=null?modePrices[R.modeId]:basePrice),diamondArmor=type==='ar'&&value===2;\n        if(type==='trap'&&(!R.bed[p.team]||trapQueue.length>=3)){buyFail(p,'trap_full',!R.bed[p.team]?'Seu time não possui mais cama.':'A fila de traps está cheia (3/3).');break}\n        if(diamondArmor&&((p.inv.em||0)<4||(p.inv.dia||0)<32)){buyFail(p,'no_resource','Armadura de Diamante custa 4 esmeraldas + 32 diamantes.');break}\n        if(!diamondArmor&&(p.inv[currency]||0)<price){buyFail(p,'no_resource',`Recursos insuficientes para ${name}.`);break}\n        let ok=1,teamUpgrade=false,trapBought=false;",
  'diamond armor compound precheck');
server=once(server,
  "p.inv[currency]-=price;\n        if(trapBought)syncTeamTraps(R,p.team);else if(teamUpgrade)teamPlayers(R,p.team).forEach(pinv);else pinv(p);",
  "p.inv[currency]-=price;if(diamondArmor)p.inv.dia-=32;\n        if(trapBought)syncTeamTraps(R,p.team);else if(teamUpgrade)teamPlayers(R,p.team).forEach(pinv);else pinv(p);",
  'diamond armor diamond deduction');

// ---- Cliente: baú como central de evolução ----
game=once(game,
  "let inv={wool:0,planks:0,endstone:0,glass:0,obsidian:0,tnt:0,tntImpulse:0,tntSlow:0,tntDamage:0,apple:0,bow:0,arrow:0,fireball:0,snowball:0,pearl:0,speedPotion:0,jumpPotion:0,invisPotion:0,compass:0,magicMilk:0,bridgeEgg:0,popupTower:0,knockbackStick:0,iron:0,gold:0,dia:0,em:0},sw=0,ar=0,tools={pick:0,axe:0,shears:0},fxs={speed:0,jump:0,invis:0,slow:0,fatigue:0,blind:0,milk:0},up={sharp:0,prot:0,forge:0,haste:0,regen:0,trap:0,trapMiner:0,trapSlow:0,trapCounter:0},trapQueue=[],cur=1,started=0,over=0,shopOpen=0,chestOpen=0,chestKind='team',chestData={},bed=[1,1,1,1],INFO={},tg=null,ws;",
  "let inv={wool:0,planks:0,endstone:0,glass:0,obsidian:0,tnt:0,tntImpulse:0,tntSlow:0,tntDamage:0,apple:0,bow:0,arrow:0,fireball:0,snowball:0,pearl:0,speedPotion:0,jumpPotion:0,invisPotion:0,compass:0,magicMilk:0,bridgeEgg:0,popupTower:0,knockbackStick:0,iron:0,gold:0,dia:0,em:0},sw=0,ar=0,tools={pick:0,axe:0,shears:0},fxs={speed:0,jump:0,invis:0,slow:0,fatigue:0,blind:0,milk:0},up={sharp:0,prot:0,forge:0,haste:0,regen:0,trap:0,trapMiner:0,trapSlow:0,trapCounter:0},trapQueue=[],cur=1,started=0,over=0,shopOpen=0,chestOpen=0,chestKind='team',chestData={},chestGenTier=0,chestGenNext=null,chestGenCurrent='',bed=[1,1,1,1],INFO={},tg=null,ws;",
  'client chest generator state');

game=once(game,
  "function drawChest(){const box=chestData||{};html('chestTitle',chestKind==='ender'?'ENDER CHEST':'BAÚ DO TIME');html('chestGrid',CHEST_KEYS.filter(k=>(box[k]||0)>0||(inv[k]||0)>0).map(k=>`<div class=\"chest-row\"><span>${CHEST_LABEL[k]||k}</span><b>Você: ${inv[k]||0}</b><b>Baú: ${box[k]||0}</b><button onclick=\"chestMove('deposit','${k}',1)\">+1</button><button onclick=\"chestMove('deposit','${k}','all')\">+Tudo</button><button onclick=\"chestMove('withdraw','${k}',1)\">-1</button><button onclick=\"chestMove('withdraw','${k}','all')\">-Tudo</button></div>`).join('')||'<p>Baú vazio. Leve recursos ou itens para guardar.</p>')}\nfunction chestMove(dir,key,n){send({t:'chestMove',kind:chestKind,dir,key,n})}",
  `function drawChest(){const box=chestData||{};html('chestTitle',chestKind==='ender'?'ENDER CHEST':'BAÚ DO TIME');const rows=CHEST_KEYS.filter(k=>(box[k]||0)>0||(inv[k]||0)>0).map(k=>\`<div class="chest-row"><span>\${CHEST_LABEL[k]||k}</span><b>Você: \${inv[k]||0}</b><b>Baú: \${box[k]||0}</b><button onclick="chestMove('deposit','\${k}',1)">+1</button><button onclick="chestMove('deposit','\${k}','all')">+Tudo</button><button onclick="chestMove('withdraw','\${k}',1)">-1</button><button onclick="chestMove('withdraw','\${k}','all')">-Tudo</button></div>\`).join('');const gen=chestKind==='team'?\`<div class="gen-upgrade-card"><div><strong>⚙ GERADOR DA BASE · NÍVEL \${chestGenTier}/3</strong><span>\${chestGenCurrent||'Ferro básico'}</span></div>\${chestGenNext?\`<button onclick="upgradeGenerator()">\${chestGenNext.name}<small>\${chestGenNext.label} do baú</small></button>\`:'<b class="gen-max">NÍVEL MÁXIMO</b>'}</div>\`:'';html('chestGrid',gen+(rows||'<p>Baú vazio. Deposite recursos para guardar ou evoluir o gerador.</p>'))}
function upgradeGenerator(){if(chestKind==='team')send({t:'genUpgrade'})}
function chestMove(dir,key,n){send({t:'chestMove',kind:chestKind,dir,key,n})}`,
  'generator upgrade chest UI');

game=once(game,
  "case'chestState':chestKind=m.kind||'team';chestData=m.items||{};chestOpen=1;drawChest();scr('chest');try{document.exitPointerLock()}catch(e){}break;",
  "case'chestState':chestKind=m.kind||'team';chestData=m.items||{};chestGenTier=m.genTier||0;chestGenNext=m.genNext||null;chestGenCurrent=m.genCurrent||'';chestOpen=1;drawChest();scr('chest');try{document.exitPointerLock()}catch(e){}break;",
  'chest state response');

// ---- Cliente: custo composto da armadura ----
game=once(game,
  "const s=o.s,price=shopPrice(s),currency=s[1],trapFull=s[3]==='trap'&&trapQueue.length>=3,trapDead=s[3]==='trap'&&!bed[me.team],cant=(inv[currency]||0)<price||trapFull||trapDead,owned=shopOwned(s),icon=s[7]||'□';\n   const state=owned?'owned':cant?'cant':'';\n   const costText=trapFull?'FILA CHEIA':trapDead?'SEM CAMA':owned?'COMPRADO':price+' '+(CN[currency]||currency);",
  "const s=o.s,price=shopPrice(s),currency=s[1],trapFull=s[3]==='trap'&&trapQueue.length>=3,trapDead=s[3]==='trap'&&!bed[me.team],diamondArmor=s[3]==='ar'&&s[5]===2,cant=(diamondArmor?((inv.em||0)<4||(inv.dia||0)<32):(inv[currency]||0)<price)||trapFull||trapDead,owned=shopOwned(s),icon=s[7]||'□';\n   const state=owned?'owned':cant?'cant':'';\n   const costText=trapFull?'FILA CHEIA':trapDead?'SEM CAMA':owned?'COMPRADO':diamondArmor?'4 esmeraldas + 32 diamantes':price+' '+(CN[currency]||currency);",
  'diamond armor shop display');

// ---- Cliente: holograma dos geradores ----
game=regexOnce(game,
  /if\(v\.type==='base'\)\{const r=genState\.base\[v\.index\]\|\|\[0,0\];[\s\S]*?\}else if\(v\.type==='dia'\)/,
  `if(v.type==='base'){const r=genState.base[v.index]||[0,-1,-1,0],tier=Number(r[3]||0),au=Number(r[1]),di=Number(r[2]),line2='Fe '+Math.ceil(Number(r[0]||0))+'s · Au '+(au<0?'BLOQ':Math.ceil(au)+'s'),line3=tier>=3?'Di '+Math.ceil(Math.max(0,di))+'s':'Nível '+tier+'/3';setHologram(v,'GERADOR BASE · NV '+tier+'\\n'+line2+'\\n'+line3,tier>=3?'#67f3ff':'#ffd85a')}else if(v.type==='dia')`,
  'base generator hologram');

if(!style.includes('/* base generator progression */')) style += `
/* base generator progression */
.gen-upgrade-card{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;margin:0 0 12px;border:1px solid #67d8ff55;background:#102432;border-radius:10px}.gen-upgrade-card>div{display:flex;flex-direction:column;gap:4px}.gen-upgrade-card strong{color:#7de7ff}.gen-upgrade-card span{opacity:.78;font-size:12px}.gen-upgrade-card button{width:auto;min-width:180px}.gen-upgrade-card button small{display:block;opacity:.75;margin-top:3px}.gen-max{color:#72f59b}.chest-row{grid-template-columns:minmax(100px,1.4fr) 1fr 1fr repeat(4,auto)}
@media(max-width:700px){.gen-upgrade-card{align-items:stretch;flex-direction:column}.gen-upgrade-card button{width:100%}.chest-row{grid-template-columns:1fr 1fr;gap:6px}.chest-row span{grid-column:1/-1}}
`;

fs.writeFileSync('server.js',server);
fs.writeFileSync('public/game.js',game);
fs.writeFileSync('public/shared.js',shared);
fs.writeFileSync('public/style.css',style);
console.log('generator economy migration applied');
