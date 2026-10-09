from pathlib import Path
import re


def once(text, old, new, label):
    n = text.count(old)
    if n != 1:
        raise RuntimeError(f"{label}: expected 1 match, got {n}")
    return text.replace(old, new, 1)


def sub_once(text, pattern, repl, label, flags=0):
    out, n = re.subn(pattern, repl, text, count=1, flags=flags)
    if n != 1:
        raise RuntimeError(f"{label}: expected 1 match, got {n}")
    return out

shared = Path('public/shared.js').read_text()
server = Path('server.js').read_text()
game = Path('public/game.js').read_text()
index = Path('public/index.html').read_text()
style = Path('public/style.css').read_text()

# -----------------------
# Shared world / maps V3
# -----------------------
shared = once(shared,
"""  const TEAM_COLORS=[0x3d6fe0,0xd23c3c,0x3fae4a,0xe6c53a];
  const TEAM_NAMES=['Azul','Vermelho','Verde','Amarelo'];
  const BASES=[[0,148],[-148,0],[0,-148],[148,0]];
  const DIAMONDS=[[0,82],[-82,0],[0,-82],[82,0]];
  const EMERALD=[0,0];""",
"""  const TEAM_COLORS=[0x3d6fe0,0xd23c3c,0x3fae4a,0xe6c53a,0x36c9c9,0xf2f2f2,0xf06cab,0x9b5de5];
  const TEAM_NAMES=['Azul','Vermelho','Verde','Amarelo','Ciano','Branco','Rosa','Roxo'];
  // As quatro primeiras bases continuam exatamente nas posições antigas para preservar 1v1/2v2/3v3/4v4.
  // As quatro diagonais entram no Solo/FFA 8 e também funcionam como ilhas extras nos modos de equipe.
  const BASES=[[0,148],[-148,0],[0,-148],[148,0],[105,105],[-105,105],[-105,-105],[105,-105]];
  const TEAM_WOOL_BLOCKS=[1,2,3,4,39,40,41,42];
  const TEAM_BED_BLOCKS=[8,9,10,11,35,36,37,38];
  const TEAM_DECOR=[17,18,19,20,26,34,31,33];
  const DIAMONDS=[[0,82],[-82,0],[0,-82],[82,0]];
  const SIDE_ISLANDS=[[58,58],[-58,58],[-58,-58],[58,-58]];
  const EMERALD=[0,0];""",
'expand team/base constants')

shared = once(shared,
"classic:{id:'classic',name:'Clássico',description:'Ilhas-jardim com base organizada, pavilhões, árvores e centro em dois níveis.',theme:'classic',baseRadius:23,centerRadius:32},",
"classic:{id:'classic',name:'Clássico',description:'Jardins suspensos ampliados, oito bases, ilhas satélite, pavilhões e centro em dois níveis.',theme:'classic',baseRadius:23,centerRadius:32},",
'classic description')
shared = once(shared,
"castle:{id:'castle',name:'Castelo',description:'Fortalezas suspensas com pátios arborizados, torres, muralhas e centro fortificado.',theme:'castle',baseRadius:24,centerRadius:34},",
"castle:{id:'castle',name:'Castelo',description:'Oito fortalezas suspensas com muralhas, torres, postos avançados e cidadela central.',theme:'castle',baseRadius:24,centerRadius:34},",
'castle description')
shared = once(shared,
"volcano:{id:'volcano',name:'Vulcão',description:'Ilhas de pedra negra com santuários, árvores queimadas, magma e vulcão central.',theme:'volcano',baseRadius:23,centerRadius:35},",
"volcano:{id:'volcano',name:'Vulcão',description:'Arquipélago vulcânico com oito bases, rochedos, fissuras de magma e cratera central.',theme:'volcano',baseRadius:23,centerRadius:35},",
'volcano description')
shared = once(shared,
"jungle:{id:'jungle',name:'Jungle Temple',description:'Ruínas de selva reorganizadas, bases arborizadas, ilhas externas e templo central.',theme:'jungle',baseRadius:22,centerRadius:36}",
"jungle:{id:'jungle',name:'Jungle Temple',description:'Oito ruínas de selva, ilhas menores, pontes naturais, pilares e grande templo central.',theme:'jungle',baseRadius:22,centerRadius:36}",
'jungle description')

shared = once(shared,
"Object.assign(E,{MIN_X,MAX_X,MIN_Z,MAX_Z,W,D,H,BASE_Y,TC:TEAM_COLORS,TN:TEAM_NAMES,IS:BASES,DI:DIAMONDS,EM:EMERALD,LOBBY,MAPS,ix,inXZ,BLOCKS:{",
"Object.assign(E,{MIN_X,MAX_X,MIN_Z,MAX_Z,W,D,H,BASE_Y,TC:TEAM_COLORS,TN:TEAM_NAMES,IS:BASES,TW:TEAM_WOOL_BLOCKS,TB:TEAM_BED_BLOCKS,SI:SIDE_ISLANDS,DI:DIAMONDS,EM:EMERALD,LOBBY,MAPS,ix,inXZ,BLOCKS:{",
'export 8-team metadata')

shared = once(shared,
"34:{name:'Lanterna do Mar',kind:'decor',hard:1.6,tool:'pick'}",
"34:{name:'Lanterna do Mar',kind:'decor',hard:1.6,tool:'pick'},35:{name:'Cama Ciano',kind:'bed',hard:.9,tool:null},36:{name:'Cama Branca',kind:'bed',hard:.9,tool:null},37:{name:'Cama Rosa',kind:'bed',hard:.9,tool:null},38:{name:'Cama Roxa',kind:'bed',hard:.9,tool:null},39:{name:'Lã Ciano',kind:'wool',hard:.45,tool:'shears'},40:{name:'Lã Branca',kind:'wool',hard:.45,tool:'shears'},41:{name:'Lã Rosa',kind:'wool',hard:.45,tool:'shears'},42:{name:'Lã Roxa',kind:'wool',hard:.45,tool:'shears'}",
'new team blocks')

shared = once(shared,
"function baseAxes(cx,cz){let ox=0,oz=0;if(Math.abs(cx)>=Math.abs(cz))ox=Math.sign(cx)||1;else oz=Math.sign(cz)||1;return{ox,oz,tx:-oz,tz:ox}}",
"function baseAxes(cx,cz){const L=Math.hypot(cx,cz)||1,ox=cx/L,oz=cz/L;return{ox,oz,tx:-oz,tz:ox}}",
'radial base orientation')

shared = once(shared,
"  function lamp(set,x,y,z,post=28){for(let i=0;i<3;i++)set(x,y+i,z,post);set(x,y+3,z,34)}",
"""  function lamp(set,x,y,z,post=28){for(let i=0;i<3;i++)set(x,y+i,z,post);set(x,y+3,z,34)}
  function rockCluster(set,x,y,z,block=6,accent=28,seed=0){const pts=[[0,0,0],[1,0,0],[-1,0,1],[0,1,0],[1,0,-1],[-1,0,-1]];pts.forEach((p,i)=>set(x+p[0],y+p[1],z+p[2],(i+seed)%4===0?accent:block))}
  function decorateBase(set,cx,cz,a,cfg,t,r){const accent=TEAM_DECOR[t]||28;if(cfg.theme==='classic'){for(const side of[-1,1]){const[rx,rz]=localPoint(cx,cz,a,-10,side*13);rockCluster(set,rx,BASE_Y+1,rz,24,19,t+side);const[lx,lz]=localPoint(cx,cz,a,-7,side*10);lamp(set,lx,BASE_Y+1,lz,28)}for(const s of[-17,-13,13,17]){const[x,z]=localPoint(cx,cz,a,7,s);set(x,BASE_Y+1,z,24);set(x,BASE_Y+2,z,29)}}else if(cfg.theme==='castle'){for(const side of[-1,1]){const[x,z]=localPoint(cx,cz,a,-14,side*11);tower(set,x,z,BASE_Y+1,28,5);set(x,BASE_Y+6,z,accent)}for(let s=-16;s<=16;s+=4){localBlock(set,cx,cz,a,-18,s,BASE_Y+1,28);if(Math.abs(s)%8===0)localBlock(set,cx,cz,a,-18,s,BASE_Y+2,accent)}}else{for(const side of[-1,1]){const[x,z]=localPoint(cx,cz,a,-11,side*13);rockCluster(set,x,BASE_Y+1,z,21,22,t+side);for(let h=0;h<4;h++)localBlock(set,cx,cz,a,-16,side*8,BASE_Y+1+h,h===3?22:21)}for(const s of[-16,-12,12,16])localBlock(set,cx,cz,a,8,s,BASE_Y+1,22)}}""",
'detail helpers')

shared = once(shared,
"function teamBase(set,BD,SHOP,GEN,SPAWN,t,cfg){const[cx,cz]=BASES[t],decor=17+t,teamBlock=t+1,r=cfg.baseRadius,a=baseAxes(cx,cz),surface=cfg.theme==='classic'?27:cfg.theme==='castle'?28:21,under=cfg.theme==='classic'?24:cfg.theme==='castle'?6:21;",
"function teamBase(set,BD,SHOP,GEN,SPAWN,t,cfg){const[cx,cz]=BASES[t],decor=TEAM_DECOR[t]||28,teamBlock=TEAM_WOOL_BLOCKS[t],r=cfg.baseRadius,a=baseAxes(cx,cz),surface=cfg.theme==='classic'?27:cfg.theme==='castle'?28:21,under=cfg.theme==='classic'?24:cfg.theme==='castle'?6:21;",
'team base new colors')
shared = once(shared,
"    pathLocal(set,cx,cz,a,BASE_Y+1,-12,13,-1,1,cfg.theme==='volcano'?21:12);",
"    decorateBase(set,cx,cz,a,cfg,t,r);pathLocal(set,cx,cz,a,BASE_Y+1,-12,13,-1,1,cfg.theme==='volcano'?21:12);",
'detail every base')
shared = once(shared,
"BD[t]=[bx,BASE_Y+2,bz];set(bx,BASE_Y+2,bz,8+t);",
"BD[t]=[bx,BASE_Y+2,bz];set(bx,BASE_Y+2,bz,TEAM_BED_BLOCKS[t]);",
'team bed blocks')

# More detailed resource islands and four new satellite islands.
shared = sub_once(shared,
r"  function diamondIsland\(set,x,z,i,cfg\)\{.*?\}\n  function classicCenter",
"""  function diamondIsland(set,x,z,i,cfg){const surface=cfg.theme==='classic'?27:cfg.theme==='castle'?28:21,under=cfg.theme==='classic'?24:cfg.theme==='castle'?6:21,rad=cfg.theme==='castle'?12:11;island(set,x,z,BASE_Y-1,rad,surface,under,200+i+(cfg.theme==='castle'?20:cfg.theme==='volcano'?40:0));disk(set,x,BASE_Y,z,4,12);ring(set,x,BASE_Y,z,5,cfg.theme==='volcano'?21:28,1);clearBox(set,x,z,BASE_Y+1,BASE_Y+6,2,2);if(cfg.theme==='classic'){tree(set,x+7,BASE_Y,z+1,5);tree(set,x-6,BASE_Y,z+5,4);lamp(set,x-7,BASE_Y,z-2,28);rockCluster(set,x+5,BASE_Y,z-6,24,19,i)}else if(cfg.theme==='castle'){for(const[dx,dz]of[[-7,-7],[7,7],[-7,7]])tower(set,x+dx,z+dz,BASE_Y,28,5);tree(set,x+7,BASE_Y,z-5,5);const L=Math.hypot(x,z)||1,dx=-x/L,dz=-z/L;for(let n=8;n<=18;n++)for(let w=-2;w<=2;w++)set(Math.round(x+dx*n-dz*w),BASE_Y,Math.round(z+dz*n+dx*w),28);ring(set,x,BASE_Y+1,z,8,28,1)}else{ashTree(set,x+7,BASE_Y,z+1,5);rockCluster(set,x-6,BASE_Y,z+5,21,22,i);for(const[dx,dz]of[[-7,-4],[-7,4],[7,0]]){tower(set,x+dx,z+dz,BASE_Y,21,4);set(x+dx,BASE_Y+4,z+dz,22)}}}
  function sideIsland(set,x,z,i,cfg){const surface=cfg.theme==='classic'?27:cfg.theme==='castle'?28:21,under=cfg.theme==='classic'?24:cfg.theme==='castle'?6:21;island(set,x,z,BASE_Y-2,10,surface,under,260+i+(cfg.theme==='castle'?30:cfg.theme==='volcano'?60:0));disk(set,x,BASE_Y-1,z,5,cfg.theme==='volcano'?21:cfg.theme==='castle'?28:24);if(cfg.theme==='classic'){tree(set,x+4,BASE_Y,z+3,5);lamp(set,x-4,BASE_Y,z-3,28);rockCluster(set,x+2,BASE_Y,z-5,24,19,i)}else if(cfg.theme==='castle'){tower(set,x-4,z-4,BASE_Y-1,28,6);tower(set,x+4,z+4,BASE_Y-1,28,4);ring(set,x,BASE_Y,z,6,28,1)}else{for(const[dx,dz,h]of[[-4,-3,5],[4,3,4],[3,-4,3]]){for(let y=0;y<h;y++)set(x+dx,BASE_Y-1+y,z+dz,y===h-1?22:21)}rockCluster(set,x-3,BASE_Y,z+4,21,22,i)}}
  function classicCenter""",
'resource and satellite islands', flags=re.S)

# Enrich the three centerpieces without blocking main lanes.
shared = once(shared,
"function classicCenter(set){island(set,0,0,BASE_Y-1,32,27,24,310);disk(set,0,BASE_Y,0,15,28);island(set,0,0,BASE_Y+5,18,28,6,311);",
"function classicCenter(set){island(set,0,0,BASE_Y-1,32,27,24,310);disk(set,0,BASE_Y,0,15,28);ring(set,0,BASE_Y,0,27,19,1);island(set,0,0,BASE_Y+5,18,28,6,311);",
'classic center detail')
shared = once(shared,
"for(const[dx,dz]of[[-17,-17],[17,-17],[-17,17],[17,17]])lamp(set,dx,BASE_Y,dz,28);",
"for(const[dx,dz]of[[-17,-17],[17,-17],[-17,17],[17,17]])lamp(set,dx,BASE_Y,dz,28);for(const[dx,dz]of[[-27,0],[27,0],[0,-27],[0,27]])rockCluster(set,dx,BASE_Y,dz,24,19,dx+dz);",
'classic center rocks')
shared = once(shared,
"function castleCenter(set){island(set,0,0,BASE_Y-1,34,28,6,320);island(set,0,0,BASE_Y+4,21,28,6,321);",
"function castleCenter(set){island(set,0,0,BASE_Y-1,34,28,6,320);ring(set,0,BASE_Y,0,29,28,2);island(set,0,0,BASE_Y+4,21,28,6,321);",
'castle center detail')
shared = once(shared,
"function volcanoCenter(set){island(set,0,0,BASE_Y-2,35,21,6,333);",
"function volcanoCenter(set){island(set,0,0,BASE_Y-2,35,21,6,333);ring(set,0,BASE_Y-1,0,30,22,1);",
'volcano center detail')

shared = once(shared,
"const J_BASES=[[-90,30],[-30,-90],[90,-30],[30,90]],J_EXTRA=[[-90,-30],[-30,90],[90,30],[30,-90]],J_DI=[[-58,59],[59,58],[-59,-58],[58,-59]];",
"const J_BASES=[[0,108],[-76,76],[-108,0],[-76,-76],[0,-108],[76,-76],[108,0],[76,76]],J_EXTRA=[[24,58],[-24,58],[-58,24],[-58,-24],[-24,-58],[24,-58],[58,-24],[58,24]],J_DI=[[-58,59],[59,58],[-59,-58],[58,-59]];",
'jungle 8-base layout')

shared = once(shared,
"disk(set,bx,22,bz,4,t+1);SPAWN[t]=[px+.5,23.02,pz+.5];BD[t]=[bx,23,bz];set(bx,23,bz,8+t);",
"disk(set,bx,22,bz,4,TEAM_WOOL_BLOCKS[t]);for(const side of[-1,1]){const[rx,rz]=localPoint(cx,cz,a,-10,side*14);rockCluster(set,rx,22,rz,19,28,t+side)}SPAWN[t]=[px+.5,23.02,pz+.5];BD[t]=[bx,23,bz];set(bx,23,bz,TEAM_BED_BLOCKS[t]);",
'jungle 8-team blocks and detail')
shared = once(shared,
"function jungleRuinIsland(set,cx,cz,i){jungleCone(set,cx,cz,21,19,560+i);",
"function jungleRuinIsland(set,cx,cz,i){jungleCone(set,cx,cz,21,15,560+i);",
'jungle extra island sizing')
shared = once(shared,
"for(const[f,s]of[[9,-8],[9,8],[-7,-10],[-7,10]]){const[x,z]=localPoint(cx,cz,a,f,s);junglePillar(set,x,22,z,6)}",
"for(const[f,s]of[[9,-8],[9,8],[-7,-10],[-7,10]]){const[x,z]=localPoint(cx,cz,a,f,s);junglePillar(set,x,22,z,6)}for(const side of[-1,1]){const[x,z]=localPoint(cx,cz,a,-4,side*9);lamp(set,x,22,z,30)}",
'jungle ruins lanterns')
shared = once(shared,
"function jungleDiamond(set,cx,cz,i){jungleCone(set,cx,cz,22,11,620+i);disk(set,cx,23,cz,4,28);disk(set,cx,24,cz,2,32);",
"function jungleDiamond(set,cx,cz,i){jungleCone(set,cx,cz,22,11,620+i);disk(set,cx,23,cz,4,28);ring(set,cx,23,cz,6,19,1);disk(set,cx,24,cz,2,32);",
'jungle diamond detail')
shared = once(shared,
"function buildJungle(set,BD,SHOP,GEN,SPAWN){J_BASES.forEach(([x,z],t)=>jungleActiveBase(set,BD,SHOP,GEN,SPAWN,t,x,z));J_EXTRA.forEach(([x,z],i)=>jungleRuinIsland(set,x,z,i));J_DI.forEach(([x,z],i)=>jungleDiamond(set,x,z,i));jungleTemple(set);return{DIGEN:J_DI.map(([x,z])=>[x+.5,25.2,z+.5]),EMGEN:[.5,55.2,.5]}}",
"function buildJungle(set,BD,SHOP,GEN,SPAWN,withCenter=true){J_BASES.forEach(([x,z],t)=>jungleActiveBase(set,BD,SHOP,GEN,SPAWN,t,x,z));J_EXTRA.forEach(([x,z],i)=>jungleRuinIsland(set,x,z,i));J_DI.forEach(([x,z],i)=>jungleDiamond(set,x,z,i));if(withCenter)jungleTemple(set);return{DIGEN:J_DI.map(([x,z])=>[x+.5,25.2,z+.5]),EMGEN:[.5,55.2,.5],BASEPOS:J_BASES}}",
'jungle builder metadata')

shared = sub_once(shared,
r"  E\.gen=\(mapId='classic',includeLobby=false\)=>\{.*?return\{B,BD,SHOP,GEN,SPAWN,DIGEN,EMGEN,mapId:cfg\.id,activeChunks:\[\.\.\.active\]\}\}\n",
"""  E.gen=(mapId='classic',includeLobby=false)=>{const cfg=MAPS[mapId]||MAPS.classic,B=new Uint8Array(W*H*D),BD=[],SHOP=[],GEN=[],SPAWN=[],active=new Set(),set=(x,y,z,v)=>{x=Math.round(x);y=Math.round(y);z=Math.round(z);if(!inXZ(x,z)||y<0||y>=H)return;B[ix(x,y,z)]=v;if(v)active.add(Math.floor(x/16)+','+Math.floor(z/16))};let DIGEN,EMGEN,BASEPOS;if(cfg.theme==='jungle'){const j=buildJungle(set,BD,SHOP,GEN,SPAWN,!includeLobby);DIGEN=j.DIGEN;EMGEN=j.EMGEN;BASEPOS=j.BASEPOS}else{BASEPOS=BASES;BASES.forEach(([x,z],t)=>teamBase(set,BD,SHOP,GEN,SPAWN,t,cfg));DIAMONDS.forEach(([x,z],i)=>diamondIsland(set,x,z,i,cfg));SIDE_ISLANDS.forEach(([x,z],i)=>sideIsland(set,x,z,i,cfg));centerIsland(set,cfg)}if(includeLobby){island(set,LOBBY[0],LOBBY[2],LOBBY[1]-1,13,12,6,900);ring(set,LOBBY[0],LOBBY[1],LOBBY[2],10,23,1);for(const[dx,dz]of[[-7,-7],[7,-7],[-7,7],[7,7]])tower(set,LOBBY[0]+dx,LOBBY[2]+dz,LOBBY[1],12,6)}if(!DIGEN)DIGEN=DIAMONDS.map(([x,z])=>[x+.5,BASE_Y+1.35,z+.5]);if(!EMGEN){const EMY=cfg.theme==='volcano'?BASE_Y+10.35:BASE_Y+6.35;EMGEN=[EMERALD[0]+.5,EMY,EMERALD[1]+.5]}return{B,BD,SHOP,GEN,SPAWN,DIGEN,EMGEN,BASEPOS:[...(BASEPOS||BASES)],mapId:cfg.id,activeChunks:[...active]}}
""",
'generator V3', flags=re.S)

# -----------------------
# Server: true 8-team FFA
# -----------------------
server = once(server,
"function emptyChest(){return Object.fromEntries(CHEST_KEYS.map(k=>[k,0]))}\nconst MODES={",
"""function emptyChest(){return Object.fromEntries(CHEST_KEYS.map(k=>[k,0]))}
const TEAM_COUNT=S.TN.length;
const teamArray=f=>Array.from({length:TEAM_COUNT},(_,i)=>f(i));
const teamWoolBlock=t=>(S.TW&&S.TW[t])||(t+1);
const teamBedBlock=t=>(S.TB&&S.TB[t])||(8+t);
const bedTeamFromBlock=b=>(S.TB||[8,9,10,11]).indexOf(b);
const isTeamBedBlock=b=>bedTeamFromBlock(b)>=0;
const isTeamWoolBlock=b=>(S.TW||[1,2,3,4]).includes(b);
const MODES={""",
'server team helpers')
server = once(server,
"'solo':{id:'solo',name:'Solo / FFA',teamCap:1,maxPlayers:4,minPlayers:2,quickMinPlayers:2,activeTeams:[0,1,2,3],solo:true,description:'Todos contra todos · 2 a 4 jogadores · uma base por jogador'}",
"'solo':{id:'solo',name:'Solo / FFA 8',teamCap:1,maxPlayers:8,minPlayers:2,quickMinPlayers:2,activeTeams:[0,1,2,3,4,5,6,7],solo:true,description:'Todos contra todos · 2 a 8 jogadores · oito bases independentes'}",
'FFA8 mode')
server = once(server,"const counts=[0,0,0,0],groups=new Map();","const counts=Array(TEAM_COUNT).fill(0),groups=new Map();",'rebalance counts')

server = sub_once(server,
r"R = \{ code, mapId:'classic', modeId:'2v2', B: g\.B, BD: g\.BD, SHOP:g\.SHOP, GEN:g\.GEN, SPAWN:g\.SPAWN, DIGEN:g\.DIGEN, EMGEN:g\.EMGEN, activeChunks:g\.activeChunks, pf: new Uint8Array\(g\.B\.length\), ps: new Map\(\), ed: new Map\(\), q: \[\], tnt: \[\], drops: \[\], dropSeq: 0, projectiles: \[\], projSeq: 0, snapAcc: 0, pickupAcc: 0, netSeq:0, bed: \[0, 0, 0, 0\], teamChest:\[emptyChest\(\),emptyChest\(\),emptyChest\(\),emptyChest\(\)\], genTier:\[0,0,0,0\], traps:\[\[\],\[\],\[\],\[\]\], trapInside:\[new Set\(\),new Set\(\),new Set\(\),new Set\(\)\],",
"R = { code, mapId:'classic', modeId:'2v2', B: g.B, BD: g.BD, SHOP:g.SHOP, GEN:g.GEN, SPAWN:g.SPAWN, BASEPOS:g.BASEPOS, DIGEN:g.DIGEN, EMGEN:g.EMGEN, activeChunks:g.activeChunks, pf: new Uint8Array(g.B.length), ps: new Map(), ed: new Map(), q: [], tnt: [], drops: [], dropSeq: 0, projectiles: [], projSeq: 0, snapAcc: 0, pickupAcc: 0, netSeq:0, bed: teamArray(()=>0), teamChest:teamArray(()=>emptyChest()), genTier:teamArray(()=>0), traps:teamArray(()=>[]), trapInside:teamArray(()=>new Set()),",
'room 8-team state')
server = once(server,"base: [0,1,2,3].map(() => ({ iron:0, gold:0, dia:0 })),","base: teamArray(() => ({ iron:0, gold:0, dia:0 })),",'room generators')

server = once(server,
"const [cx,cz]=S.IS[t],L=Math.hypot(cx,cz)||1,ix=-cx/L,iz=-cz/L,txv=-iz,tz=ix,side=kind==='team'?4:-4;",
"const base=(meta.BASEPOS&&meta.BASEPOS[t])||S.IS[t]||[0,0],[cx,cz]=base,L=Math.hypot(cx,cz)||1,ix=-cx/L,iz=-cz/L,txv=-iz,tz=ix,side=kind==='team'?4:-4;",
'server chest orientation')

server = once(server,
"R.mapId=mapId;const g=S.gen(R.mapId,true);R.B=g.B;R.BD=g.BD;R.SHOP=g.SHOP;R.GEN=g.GEN;R.SPAWN=g.SPAWN;R.DIGEN=g.DIGEN;R.EMGEN=g.EMGEN;R.activeChunks=g.activeChunks;",
"R.mapId=mapId;const g=S.gen(R.mapId,true);R.B=g.B;R.BD=g.BD;R.SHOP=g.SHOP;R.GEN=g.GEN;R.SPAWN=g.SPAWN;R.BASEPOS=g.BASEPOS;R.DIGEN=g.DIGEN;R.EMGEN=g.EMGEN;R.activeChunks=g.activeChunks;",
'apply map base positions')

server = once(server,
"R.mapId=resolveMapVote(R);const gg=S.gen(R.mapId,false);R.B=gg.B;R.BD=gg.BD;R.SHOP=gg.SHOP;R.GEN=gg.GEN;R.SPAWN=gg.SPAWN;R.DIGEN=gg.DIGEN;R.EMGEN=gg.EMGEN;R.activeChunks=gg.activeChunks;R.pf=new Uint8Array(gg.B.length);R.ed.clear();R.q=[];R.drops=[];R.tnt=[];R.projectiles=[];R.traps=[[],[],[],[]];R.trapInside=[new Set(),new Set(),new Set(),new Set()];R.genTier=[0,0,0,0];R.g={base:[0,1,2,3].map(()=>({iron:0,gold:0,dia:0})),dia:S.DI.map(()=>({t:0})),em:{t:0}};",
"R.mapId=resolveMapVote(R);const gg=S.gen(R.mapId,false);R.B=gg.B;R.BD=gg.BD;R.SHOP=gg.SHOP;R.GEN=gg.GEN;R.SPAWN=gg.SPAWN;R.BASEPOS=gg.BASEPOS;R.DIGEN=gg.DIGEN;R.EMGEN=gg.EMGEN;R.activeChunks=gg.activeChunks;R.pf=new Uint8Array(gg.B.length);R.ed.clear();R.q=[];R.drops=[];R.tnt=[];R.projectiles=[];R.traps=teamArray(()=>[]);R.trapInside=teamArray(()=>new Set());R.genTier=teamArray(()=>0);R.teamChest=teamArray(()=>emptyChest());R.g={base:teamArray(()=>({iron:0,gold:0,dia:0})),dia:gg.DIGEN.map(()=>({t:0})),em:{t:0}};",
'start match 8-team reset')
server = once(server,
"for(let t=0;t<4;t++){R.bed[t]=[...R.ps.values()].some(q=>!q.admin&&q.team===t)?1:0;if(!R.bed[t]){const b=R.BD[t];setb(R,b[0],b[1],b[2],0)}}",
"for(let t=0;t<TEAM_COUNT;t++){R.bed[t]=[...R.ps.values()].some(q=>!q.admin&&q.team===t)?1:0;if(!R.bed[t]){const b=R.BD[t];if(b)setb(R,b[0],b[1],b[2],0)}}",
'start beds 8')

server = once(server,
"const g=S.gen(R.mapId,true);R.B=g.B;R.BD=g.BD;R.SHOP=g.SHOP;R.GEN=g.GEN;R.SPAWN=g.SPAWN;R.DIGEN=g.DIGEN;R.EMGEN=g.EMGEN;R.activeChunks=g.activeChunks;",
"const g=S.gen(R.mapId,true);R.B=g.B;R.BD=g.BD;R.SHOP=g.SHOP;R.GEN=g.GEN;R.SPAWN=g.SPAWN;R.BASEPOS=g.BASEPOS;R.DIGEN=g.DIGEN;R.EMGEN=g.EMGEN;R.activeChunks=g.activeChunks;",
'replay map base positions')
server = once(server,
"R.teamChest=[emptyChest(),emptyChest(),emptyChest(),emptyChest()];R.genTier=[0,0,0,0];R.traps=[[],[],[],[]];R.trapInside=[new Set(),new Set(),new Set(),new Set()];R.g={base:[0,1,2,3].map(()=>({iron:0,gold:0,dia:0})),dia:S.DI.map(()=>({t:0})),em:{t:0}};",
"R.teamChest=teamArray(()=>emptyChest());R.genTier=teamArray(()=>0);R.traps=teamArray(()=>[]);R.trapInside=teamArray(()=>new Set());R.bed=teamArray(()=>0);R.g={base:teamArray(()=>({iron:0,gold:0,dia:0})),dia:g.DIGEN.map(()=>({t:0})),em:{t:0}};",
'replay 8-team state')

server = once(server,"const counts=[0,0,0,0];R.ps.forEach(q=>counts[q.team]++);","const counts=Array(TEAM_COUNT).fill(0);R.ps.forEach(q=>counts[q.team]=(counts[q.team]||0)+1);",'join counts 8')

server = once(server,"setb(R,x,y,z,pr.team+1,1);","setb(R,x,y,z,teamWoolBlock(pr.team),1);",'bridge egg team wool')
server = once(server,"free.forEach(([X,Y,Z])=>setb(R,X,Y,Z,p.team+1,1));return true;","free.forEach(([X,Y,Z])=>setb(R,X,Y,Z,teamWoolBlock(p.team),1));return true;",'popup tower team wool')
server = once(server,"k={wool:p.team+1,planks:5,endstone:12,glass:7,obsidian:16}[item];","k={wool:teamWoolBlock(p.team),planks:5,endstone:12,glass:7,obsidian:16}[item];",'placement team wool')

server = once(server,
"const b=get(R,x,y,z);if(b>=8&&b<=11)killBed(R,b-8,p);else setb(R,x,y,z,0,0);",
"const b=get(R,x,y,z),bt=bedTeamFromBlock(b);if(bt>=0)killBed(R,bt,p);else setb(R,x,y,z,0,0);",
'admin break all beds')
server = once(server,
"if(b>=8&&b<=11){\n          if(b-8===p.team){tx(p,{t:'m',s:'Essa é a sua cama!'});break;}\n          p.breaking={x,y,z,b,need:.9,at:R.t};tx(p,{t:'breakp',x,y,z,d:.9});break;\n        }",
"if(isTeamBedBlock(b)){\n          const bt=bedTeamFromBlock(b);if(bt===p.team){tx(p,{t:'m',s:'Essa é a sua cama!'});break;}\n          p.breaking={x,y,z,b,need:.9,at:R.t};tx(p,{t:'breakp',x,y,z,d:.9});break;\n        }",
'break start all beds')
server = once(server,
"if(br.b>=8&&br.b<=11)killBed(R,br.b-8,p);else if(R.pf[S.ix(br.x,br.y,br.z)]){const breakSfx=br.b>=1&&br.b<=4?'break_cloth':br.b===5?'break_wood':'break_stone';",
"if(isTeamBedBlock(br.b))killBed(R,bedTeamFromBlock(br.b),p);else if(R.pf[S.ix(br.x,br.y,br.z)]){const breakSfx=isTeamWoolBlock(br.b)?'break_cloth':br.b===5?'break_wood':'break_stone';",
'finish break all beds/wool')
server = once(server,"for(let t=0;t<4;t++)if(R.bed[t])killBed(R,t,null);","for(let t=0;t<TEAM_COUNT;t++)if(R.bed[t])killBed(R,t,null);",'sudden death all beds')

# -----------------------
# Client: 8 colors / beds / wool / base orientation
# -----------------------
game = once(game,
"{W,H,D,MIN_X,MAX_X,MIN_Z,MAX_Z,BASE_Y,TC,TN,IS,DI,EM,LOBBY,MAPS,ix,SH,BLOCKS,inXZ}=BW,",
"{W,H,D,MIN_X,MAX_X,MIN_Z,MAX_Z,BASE_Y,TC,TN,IS,TW,TB,DI,EM,LOBBY,MAPS,ix,SH,BLOCKS,inXZ}=BW,",
'client team metadata')
game = once(game,
"const RI={",
"const teamWoolBlock=t=>(TW&&TW[t])||(t+1),bedTeamFromBlock=b=>(TB||[8,9,10,11]).indexOf(b),isBedBlock=b=>bedTeamFromBlock(b)>=0,isTeamWoolBlock=b=>(TW||[1,2,3,4]).includes(b);\nconst RI={",
'client team helpers')
game = once(game,
"TC.forEach((c,i)=>{P[i+1]=[c];P[8+i]=[c,0xe8e4d8,0x7a4a2b]});",
"TC.forEach((c,i)=>{P[teamWoolBlock(i)]=[c];P[(TB&&TB[i])||(8+i)]=[c,0xe8e4d8,0x7a4a2b]});",
'client palette 8')
game = once(game,
"const tl=b=>b>=1&&b<=4?0:b===5?1:b===6?7:b===7?6:b>=8&&b<=11?0:",
"const tl=b=>isTeamWoolBlock(b)?0:b===5?1:b===6?7:b===7?6:isBedBlock(b)?0:",
'client texture team blocks')
game = once(game,
"if(B[ix(pos[0],pos[1],pos[2])]!==8+t)return;",
"if(B[ix(pos[0],pos[1],pos[2])]!==((TB&&TB[t])||(8+t)))return;",
'bed visual 8')
game = once(game,
"if(!b||b>=8&&b<=11)continue;",
"if(!b||isBedBlock(b))continue;",
'hide all bed voxels')
game = once(game,
"if(nb&&!(nb>=8&&nb<=11))continue;",
"if(nb&&!isBedBlock(nb))continue;",
'bed neighbor visibility')
game = once(game,
"if(old>=8&&old<=11&&old!==v)removeBedVisual(old-8);",
"if(isBedBlock(old)&&old!==v)removeBedVisual(bedTeamFromBlock(old));",
'remove any bed visual')
game = once(game,
"const[cx,cz]=IS[t],L=Math.hypot(cx,cz)||1,ix=-cx/L,iz=-cz/L,txv=-iz,tz=ix,side=kind==='team'?4:-4;",
"const base=(meta.BASEPOS&&meta.BASEPOS[t])||IS[t]||[0,0],[cx,cz]=base,L=Math.hypot(cx,cz)||1,ix=-cx/L,iz=-cz/L,txv=-iz,tz=ix,side=kind==='team'?4:-4;",
'client chest orientation')
game = once(game,
"const blockId=p.k==='wool'?me.team+1:p.k==='planks'?5:p.k==='endstone'?12:p.k==='glass'?7:16,",
"const blockId=p.k==='wool'?teamWoolBlock(me.team):p.k==='planks'?5:p.k==='endstone'?12:p.k==='glass'?7:16,",
'client wool prediction')
game = once(game,
"const label=slotName(i),clr=ci===6?(activeTnt()[2]||0xd7352f):SC[ci];",
"const label=slotName(i),clr=ci===1?(TC[me.team]||SC[ci]):ci===6?(activeTnt()[2]||0xd7352f):SC[ci];",
'hotbar team wool color')

# More compact scoreboard when all eight FFA bases are in use.
style += """

/* Maps V3 / FFA 8 */
#tm{max-height:78vh;overflow:hidden}.score-teams{display:flex;flex-direction:column;gap:1px}.score-team{min-height:14px}.score-team .score-name{min-width:62px}.score-team .score-count{margin-left:auto}
@media (pointer:coarse),(max-width:800px){#tm{max-height:62vh;overflow:hidden}.score-team{font-size:6px;line-height:1.25;min-height:10px}.score-team .score-name{min-width:44px}.score-bed{font-size:6px}}
"""

# Cache bust shared/game/style so map topology cannot be mixed between versions.
index = index.replace('/style.css?v=match-party-hud-modes-v2-20261009','/style.css?v=maps-v3-ffa8-20261009')
index = index.replace('/shared.js?v=match-party-hud-modes-v2-20261009','/shared.js?v=maps-v3-ffa8-20261009')
index = index.replace('/game.js?v=match-party-hud-modes-v2-20261009','/game.js?v=maps-v3-ffa8-20261009')
# Fall back for older cache tags if shared did not previously have the same tag.
index = re.sub(r'/shared\.js\?v=[^"\']+', '/shared.js?v=maps-v3-ffa8-20261009', index)
index = re.sub(r'/game\.js\?v=[^"\']+', '/game.js?v=maps-v3-ffa8-20261009', index)
index = re.sub(r'/style\.css\?v=[^"\']+', '/style.css?v=maps-v3-ffa8-20261009', index)

Path('public/shared.js').write_text(shared)
Path('server.js').write_text(server)
Path('public/game.js').write_text(game)
Path('public/index.html').write_text(index)
Path('public/style.css').write_text(style)
print('Maps V3 / FFA8 migration applied')
