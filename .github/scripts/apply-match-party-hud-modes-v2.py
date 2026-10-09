from pathlib import Path


def once(text, old, new, label):
    n = text.count(old)
    if n != 1:
        raise RuntimeError(f"{label}: expected 1 match, got {n}")
    return text.replace(old, new, 1)


def between(text, start, end, replacement, label):
    i = text.find(start)
    if i < 0:
        raise RuntimeError(f"{label}: start marker not found")
    j = text.find(end, i)
    if j < 0:
        raise RuntimeError(f"{label}: end marker not found")
    return text[:i] + replacement + text[j:]

server_p = Path('server.js')
game_p = Path('public/game.js')
index_p = Path('public/index.html')
style_p = Path('public/style.css')
server = server_p.read_text()
game = game_p.read_text()
index = index_p.read_text()
style = style_p.read_text()

server = once(server, """const MODES={
  '2v2':{id:'2v2',name:'2v2',teamCap:2,maxPlayers:4,activeTeams:[0,1],description:'Azul x Vermelho · até 2 jogadores por time'},
  '4v4':{id:'4v4',name:'4v4',teamCap:4,maxPlayers:8,activeTeams:[0,1],description:'Azul x Vermelho · até 4 jogadores por time'},
  'solo':{id:'solo',name:'Solo / FFA',teamCap:1,maxPlayers:4,activeTeams:[0,1,2,3],solo:true,description:'Todos contra todos · 2 a 4 jogadores · uma base por jogador'}
};
const modeCfg=R=>MODES[R.modeId]||MODES['2v2'];
""", """const MODES={
  '1v1':{id:'1v1',name:'Duelo 1v1',teamCap:1,maxPlayers:2,minPlayers:2,quickMinPlayers:2,activeTeams:[0,1],description:'Duelo direto · um jogador por time'},
  '2v2':{id:'2v2',name:'2v2',teamCap:2,maxPlayers:4,minPlayers:2,quickMinPlayers:2,activeTeams:[0,1],description:'Azul x Vermelho · até 2 jogadores por time'},
  '3v3':{id:'3v3',name:'3v3',teamCap:3,maxPlayers:6,minPlayers:2,quickMinPlayers:4,activeTeams:[0,1],description:'Azul x Vermelho · até 3 jogadores por time'},
  '4v4':{id:'4v4',name:'4v4',teamCap:4,maxPlayers:8,minPlayers:2,quickMinPlayers:4,activeTeams:[0,1],description:'Azul x Vermelho · até 4 jogadores por time'},
  'solo':{id:'solo',name:'Solo / FFA',teamCap:1,maxPlayers:4,minPlayers:2,quickMinPlayers:2,activeTeams:[0,1,2,3],solo:true,description:'Todos contra todos · 2 a 4 jogadores · uma base por jogador'}
};
const modeCfg=R=>MODES[R.modeId]||MODES['2v2'];
const QUICK_MATCH_CONFIG={READY_COUNTDOWN_MS:12000,FULL_COUNTDOWN_MS:4000,LOBBY_BROADCAST_MS:900};
""", 'expand modes')

server = once(server, """function quickMatchRoom(modeId,partyCode=''){
  const mode=MODES[modeId]||MODES['2v2'],party=sanitizePartyCode(partyCode),remembered=party&&PARTY_MATCH_ROOMS.get(party);
  if(remembered){const rr=rooms.get(remembered);if(rr&&rr.st==='lobby'&&rr.modeId===mode.id&&rr.ps.size<mode.maxPlayers)return rr;PARTY_MATCH_ROOMS.delete(party)}
  let best=null;for(const R of rooms.values()){if(R.st!=='lobby'||R.modeId!==mode.id||!String(R.code).startsWith('mm'))continue;if(R.ps.size>=mode.maxPlayers)continue;if(!best||R.ps.size>best.ps.size)best=R}
  if(!best){let code;do{code=('mm'+Math.random().toString(36).slice(2,9)).slice(0,12)}while(rooms.has(code));best=room(code);best.modeId=mode.id}
  if(party)PARTY_MATCH_ROOMS.set(party,best.code);return best;
}
""", """function quickMatchRoom(modeId,partyCode=''){
  const mode=MODES[modeId]||MODES['2v2'],party=sanitizePartyCode(partyCode),remembered=party&&PARTY_MATCH_ROOMS.get(party);
  if(remembered){const rr=rooms.get(remembered);if(rr&&rr.st==='lobby'&&rr.modeId===mode.id&&rr.ps.size<mode.maxPlayers){rr.quickMatch=true;return rr}PARTY_MATCH_ROOMS.delete(party)}
  let best=null;for(const R of rooms.values()){if(R.st!=='lobby'||R.modeId!==mode.id||!String(R.code).startsWith('mm'))continue;if(R.ps.size>=mode.maxPlayers)continue;if(!best||R.ps.size>best.ps.size)best=R}
  if(!best){let code;do{code=('mm'+Math.random().toString(36).slice(2,9)).slice(0,12)}while(rooms.has(code));best=room(code);best.modeId=mode.id;best.quickMatch=true;const ids=Object.keys(S.MAPS),pick=ids[(Math.random()*ids.length)|0];if(pick&&pick!==best.mapId)applyLobbyMap(best,pick,false)}
  best.quickMatch=true;if(party)PARTY_MATCH_ROOMS.set(party,best.code);return best;
}
""", 'quick match room v2')

server = once(server, """function rebalanceForMode(R,mc){
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
""", """function rebalanceForMode(R,mc){
  const players=[...R.ps.values()];
  if(mc.solo){
    players.forEach((q,i)=>{q.team=mc.activeTeams[i%mc.activeTeams.length]});
  }else{
    const counts=[0,0,0,0],groups=new Map();
    for(const q of players){const key=q.partyId?('party:'+q.partyId):('player:'+q.id);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(q)}
    const ordered=[...groups.values()].sort((a,b)=>b.length-a.length);
    for(const group of ordered){
      let choices=mc.activeTeams.filter(t=>counts[t]+group.length<=mc.teamCap).sort((a,b)=>counts[a]-counts[b]);
      if(choices.length){const t=choices[0];group.forEach(q=>q.team=t);counts[t]+=group.length;continue}
      for(const q of group){const t=mc.activeTeams.filter(x=>counts[x]<mc.teamCap).sort((a,b)=>counts[a]-counts[b])[0]??mc.activeTeams[0];q.team=t;counts[t]++}
    }
  }
  players.forEach(q=>{q.roomShop=R.SHOP[q.team];q.roomSpawn=R.SPAWN?.[q.team]});
}
""", 'party aware rebalance')

server = once(server, """R.ps.delete(p.id);if(R.host===p.id)R.host=[...R.ps.keys()][0]||null;
  if(!R.ps.size){rooms.delete(R.code);return}
""", """R.ps.delete(p.id);if(R.mapVotes)R.mapVotes.delete(p.id);if(R.host===p.id)R.host=[...R.ps.keys()][0]||null;
  if(!R.ps.size){rooms.delete(R.code);return}
""", 'lobby disconnect vote cleanup')

server = once(server, """R = { code, mapId:'classic', modeId:'2v2', B: g.B, BD: g.BD, SHOP:g.SHOP, GEN:g.GEN, SPAWN:g.SPAWN, DIGEN:g.DIGEN, EMGEN:g.EMGEN, activeChunks:g.activeChunks, pf: new Uint8Array(g.B.length), ps: new Map(), ed: new Map(), q: [], tnt: [], drops: [], dropSeq: 0, projectiles: [], projSeq: 0, snapAcc: 0, pickupAcc: 0, netSeq:0, bed: [0, 0, 0, 0], teamChest:[emptyChest(),emptyChest(),emptyChest(),emptyChest()], genTier:[0,0,0,0], traps:[[],[],[],[]], trapInside:[new Set(),new Set(),new Set(),new Set()], suddenDeath:false,collapseAt:0,lastCollapse:0,blockSeq:0,syncAcc:0, st: 'lobby', t: 0, host: null, final:null,
""", """R = { code, mapId:'classic', modeId:'2v2', B: g.B, BD: g.BD, SHOP:g.SHOP, GEN:g.GEN, SPAWN:g.SPAWN, DIGEN:g.DIGEN, EMGEN:g.EMGEN, activeChunks:g.activeChunks, pf: new Uint8Array(g.B.length), ps: new Map(), ed: new Map(), q: [], tnt: [], drops: [], dropSeq: 0, projectiles: [], projSeq: 0, snapAcc: 0, pickupAcc: 0, netSeq:0, bed: [0, 0, 0, 0], teamChest:[emptyChest(),emptyChest(),emptyChest(),emptyChest()], genTier:[0,0,0,0], traps:[[],[],[],[]], trapInside:[new Set(),new Set(),new Set(),new Set()], suddenDeath:false,collapseAt:0,lastCollapse:0,blockSeq:0,syncAcc:0, st: 'lobby', t: 0, host: null, final:null, quickMatch:false,quickReadyAt:0,lastLobbyBroadcast:0,mapVotes:new Map(),
""", 'room lobby v2 state')

old_lobby = """const lobby = R => { const mc=modeCfg(R); bc(R, { t:'lobby', host:R.host, mapId:R.mapId, maps:Object.values(S.MAPS), modeId:R.modeId, modes:Object.values(MODES), teamCap:mc.teamCap, activeTeams:mc.activeTeams, solo:!!mc.solo, l:[...R.ps.values()].map(q=>[q.id,q.name,q.team,q.disconnected?1:0]) }); };
"""
new_lobby = """function mapVoteSummary(R){const votes=R.mapVotes||(R.mapVotes=new Map()),counts={};for(const [id,mapId] of votes){if(!R.ps.has(id)||!S.MAPS[mapId])continue;counts[mapId]=(counts[mapId]||0)+1}return counts}
function resolveMapVote(R){const counts=mapVoteSummary(R),ids=Object.keys(S.MAPS),top=Math.max(0,...ids.map(id=>counts[id]||0));if(top<=0)return S.MAPS[R.mapId]?R.mapId:ids[0];const tied=ids.filter(id=>(counts[id]||0)===top),hostVote=R.mapVotes?.get(R.host);if(hostVote&&tied.includes(hostVote))return hostVote;if(tied.includes(R.mapId))return R.mapId;return tied[0]}
const lobby = R => { const mc=modeCfg(R),votes=mapVoteSummary(R),players=[...R.ps.values()],now=Date.now(),count=players.filter(q=>!q.admin).length,min=R.quickMatch?(mc.quickMinPlayers||mc.minPlayers||2):(mc.minPlayers||2),countdown=R.quickReadyAt?Math.max(0,Math.ceil((R.quickReadyAt-now)/1000)):0;R.lastLobbyBroadcast=now;R.ps.forEach(viewer=>tx(viewer,{t:'lobby',host:R.host,mapId:R.mapId,maps:Object.values(S.MAPS),modeId:R.modeId,modes:Object.values(MODES),teamCap:mc.teamCap,activeTeams:mc.activeTeams,solo:!!mc.solo,quick:!!R.quickMatch,party:viewer.partyId||'',myVote:R.mapVotes?.get(viewer.id)||'',votes,queue:{count,min,max:mc.maxPlayers,countdown,ready:count>=min?1:0},l:players.map(q=>[q.id,q.name,q.team,q.disconnected?1:0,viewer.partyId&&q.partyId===viewer.partyId?1:0])})) };
function applyLobbyMap(R,mapId,announce=true){if(R.st!=='lobby'||!S.MAPS[mapId])return false;R.mapId=mapId;const g=S.gen(R.mapId,true);R.B=g.B;R.BD=g.BD;R.SHOP=g.SHOP;R.GEN=g.GEN;R.SPAWN=g.SPAWN;R.DIGEN=g.DIGEN;R.EMGEN=g.EMGEN;R.activeChunks=g.activeChunks;R.pf=new Uint8Array(g.B.length);R.ed.clear();R.q=[];R.drops=[];R.tnt=[];R.projectiles=[];if(announce){bc(R,{t:'map',mapId:R.mapId,activeChunks:R.activeChunks});R.ps.forEach((q,i)=>{q.roomShop=R.SHOP[q.team];q.roomSpawn=R.SPAWN?.[q.team];spawnLobby(q,i)});lobby(R)}return true}
function matchStartError(requester,text){if(requester)tx(requester,{t:'m',s:text});return false}
function startMatch(R,requester=null){
  if(R.st!=='lobby')return false;const mc=modeCfg(R),active=[...R.ps.values()].filter(q=>!q.admin&&mc.activeTeams.includes(q.team)),teams=new Set(active.map(q=>q.team)),needed=requester?(mc.minPlayers||2):(mc.quickMinPlayers||mc.minPlayers||2);
  if(active.length<needed)return matchStartError(requester,'Este modo precisa de pelo menos '+needed+' jogadores.');
  if(mc.solo){if(teams.size!==active.length)return matchStartError(requester,'Cada jogador precisa estar em uma base diferente no Solo.')}else{if(teams.size<2)return matchStartError(requester,'É necessário ter jogadores nos times Azul e Vermelho.');if(active.some(q=>active.filter(x=>x.team===q.team).length>mc.teamCap))return matchStartError(requester,'Um time excede a capacidade do modo escolhido.')}
  R.mapId=resolveMapVote(R);const gg=S.gen(R.mapId,false);R.B=gg.B;R.BD=gg.BD;R.SHOP=gg.SHOP;R.GEN=gg.GEN;R.SPAWN=gg.SPAWN;R.DIGEN=gg.DIGEN;R.EMGEN=gg.EMGEN;R.activeChunks=gg.activeChunks;R.pf=new Uint8Array(gg.B.length);R.ed.clear();R.q=[];R.drops=[];R.tnt=[];R.projectiles=[];R.traps=[[],[],[],[]];R.trapInside=[new Set(),new Set(),new Set(),new Set()];R.genTier=[0,0,0,0];R.g={base:[0,1,2,3].map(()=>({iron:0,gold:0,dia:0})),dia:S.DI.map(()=>({t:0})),em:{t:0}};R.ps.forEach(q=>q.trapQueue=[]);
  R.st='play';R.t=0;R.suddenDeath=false;R.collapseAt=0;R.lastCollapse=0;R.quickReadyAt=0;R.mapVotes=new Map();
  for(let t=0;t<4;t++){R.bed[t]=[...R.ps.values()].some(q=>!q.admin&&q.team===t)?1:0;if(!R.bed[t]){const b=R.BD[t];setb(R,b[0],b[1],b[2],0)}}
  R.ps.forEach(q=>{q.roomShop=R.SHOP[q.team];q.roomSpawn=R.SPAWN?.[q.team];spawn(q)});R.ps.forEach(pinv);bc(R,{t:'start',bed:R.bed,mapId:R.mapId,modeId:R.modeId,activeChunks:R.activeChunks,quick:R.quickMatch?1:0});return true
}
function quickStartEligible(R){const mc=modeCfg(R),active=[...R.ps.values()].filter(q=>!q.admin&&mc.activeTeams.includes(q.team)),min=mc.quickMinPlayers||mc.minPlayers||2;if(active.length<min)return false;if(mc.solo)return new Set(active.map(q=>q.team)).size===active.length;return mc.activeTeams.filter(t=>active.some(q=>q.team===t)).length>=2}
function updateQuickCountdown(R,now=Date.now()){
  if(!R.quickMatch||R.st!=='lobby')return;const mc=modeCfg(R),count=[...R.ps.values()].filter(q=>!q.admin).length,eligible=quickStartEligible(R);
  if(!eligible){if(R.quickReadyAt){R.quickReadyAt=0;lobby(R)}else if(now-(R.lastLobbyBroadcast||0)>=QUICK_MATCH_CONFIG.LOBBY_BROADCAST_MS)lobby(R);return}
  const full=count>=mc.maxPlayers,delay=full?QUICK_MATCH_CONFIG.FULL_COUNTDOWN_MS:QUICK_MATCH_CONFIG.READY_COUNTDOWN_MS,target=now+delay;if(!R.quickReadyAt||(full&&R.quickReadyAt>target)){R.quickReadyAt=target;lobby(R)}
  if(now>=R.quickReadyAt){startMatch(R,null);return}if(now-(R.lastLobbyBroadcast||0)>=QUICK_MATCH_CONFIG.LOBBY_BROADCAST_MS)lobby(R)
}
"""
server = once(server, old_lobby, new_lobby, 'lobby matchmaking helpers')

old_join = """      const mc=modeCfg(R);
      if (R.ps.size>=mc.maxPlayers) return tx({ws},{t:'err',s:`Sala cheia para o modo ${mc.name} (${mc.maxPlayers} jogadores).`});
      const counts=[0,0,0,0];R.ps.forEach(q=>counts[q.team]++);const partyId=sanitizePartyCode(m.party);
      let team=mc.activeTeams.reduce((best,t)=>counts[t]<counts[best]?t:best,mc.activeTeams[0]);
      if(partyId&&!mc.solo){const mate=[...R.ps.values()].find(q=>q.partyId===partyId&&mc.activeTeams.includes(q.team)&&counts[q.team]<mc.teamCap);if(mate)team=mate.team}
      if(counts[team]>=mc.teamCap)return tx({ws},{t:'err',s:'Os dois times estão cheios.'});
"""
new_join = """      if(m.quick)R.quickMatch=true;const mc=modeCfg(R);
      if (R.ps.size>=mc.maxPlayers) return tx({ws},{t:'err',s:`Sala cheia para o modo ${mc.name} (${mc.maxPlayers} jogadores).`});
      const counts=[0,0,0,0];R.ps.forEach(q=>counts[q.team]++);const partyId=sanitizePartyCode(m.party),partyMembers=partyId?[...R.ps.values()].filter(q=>q.partyId===partyId):[];
      if(partyId&&!mc.solo&&mc.teamCap>1&&partyMembers.length>=mc.teamCap)return tx({ws},{t:'err',s:`A Party já atingiu o limite de ${mc.teamCap} jogador(es) para ${mc.name}.`});
      let team=mc.activeTeams.reduce((best,t)=>counts[t]<counts[best]?t:best,mc.activeTeams[0]);
      if(partyId&&!mc.solo&&mc.teamCap>1){const mate=partyMembers.find(q=>mc.activeTeams.includes(q.team)&&counts[q.team]<mc.teamCap);if(mate)team=mate.team}
      if(counts[team]>=mc.teamCap)return tx({ws},{t:'err',s:'Os times desse modo estão cheios.'});
"""
server = once(server, old_join, new_join, 'join party v2')

server = once(server, """      case 'team': {
        const mc=modeCfg(R);
        if(R.st!=='lobby'||!Number.isInteger(m.team)||!mc.activeTeams.includes(m.team))break;
        const count=[...R.ps.values()].filter(q=>q!==p&&q.team===m.team).length;
        if(count>=mc.teamCap){tx(p,{t:'m',s:`Esse time já está cheio (${mc.teamCap}/${mc.teamCap}).`});break}
        p.team=m.team;p.roomShop=R.SHOP[p.team];p.roomSpawn=R.SPAWN?.[p.team];spawnLobby(p,[...R.ps.keys()].indexOf(p.id));lobby(R);break;
      }
""", """      case 'team': {
        const mc=modeCfg(R);
        if(R.st!=='lobby'||!Number.isInteger(m.team)||!mc.activeTeams.includes(m.team))break;if(R.quickMatch){tx(p,{t:'m',s:'Na Partida Rápida os times são organizados automaticamente.'});break}
        const moving=p.partyId&&!mc.solo&&mc.teamCap>1?[...R.ps.values()].filter(q=>q.partyId===p.partyId):[p],movingIds=new Set(moving.map(q=>q.id)),count=[...R.ps.values()].filter(q=>!movingIds.has(q.id)&&q.team===m.team).length;
        if(count+moving.length>mc.teamCap){tx(p,{t:'m',s:`Não há espaço para sua Party nesse time (${mc.teamCap} vagas).`});break}
        moving.forEach(q=>{q.team=m.team;q.roomShop=R.SHOP[q.team];q.roomSpawn=R.SPAWN?.[q.team]});R.ps.forEach((q,i)=>spawnLobby(q,i));lobby(R);break;
      }
""", 'party team move')

server = once(server, """      case 'mode': {
        if(R.st!=='lobby'||p.id!==R.host||!MODES[m.mode])break;
        const next=MODES[m.mode];
        if(R.ps.size>next.maxPlayers){tx(p,{t:'m',s:`Não é possível mudar para ${next.name}: há ${R.ps.size} jogadores na sala.`});break}
        R.modeId=next.id;rebalanceForMode(R,next);
        R.ps.forEach((q,i)=>spawnLobby(q,i));lobby(R);break;
      }
""", """      case 'mode': {
        if(R.st!=='lobby'||p.id!==R.host||!MODES[m.mode])break;if(R.quickMatch){tx(p,{t:'m',s:'O modo da Partida Rápida fica travado durante a busca.'});break}
        const next=MODES[m.mode];
        if(R.ps.size>next.maxPlayers){tx(p,{t:'m',s:`Não é possível mudar para ${next.name}: há ${R.ps.size} jogadores na sala.`});break}
        if(!next.solo&&next.teamCap>1){const partySizes={};for(const q of R.ps.values())if(q.partyId)partySizes[q.partyId]=(partySizes[q.partyId]||0)+1;if(Object.values(partySizes).some(n=>n>next.teamCap)){tx(p,{t:'m',s:'Existe uma Party maior que a capacidade de um time nesse modo.'});break}}
        R.modeId=next.id;R.quickReadyAt=0;rebalanceForMode(R,next);
        R.ps.forEach((q,i)=>spawnLobby(q,i));lobby(R);break;
      }
""", 'mode v2')

server = once(server, """      case 'map': {
        if(R.st!=='lobby'||p.id!==R.host||!S.MAPS[m.map])break;
        R.mapId=m.map;const g=S.gen(R.mapId,true);R.B=g.B;R.BD=g.BD;R.SHOP=g.SHOP;R.GEN=g.GEN;R.SPAWN=g.SPAWN;R.DIGEN=g.DIGEN;R.EMGEN=g.EMGEN;R.activeChunks=g.activeChunks;R.pf=new Uint8Array(g.B.length);R.ed.clear();R.q=[];R.drops=[];R.tnt=[];R.projectiles=[];
        bc(R,{t:'map',mapId:R.mapId,activeChunks:R.activeChunks});R.ps.forEach((q,i)=>{q.roomShop=R.SHOP[q.team];q.roomSpawn=R.SPAWN?.[q.team];spawnLobby(q,i)});lobby(R);break;
      }
""", """      case 'map': {
        if(R.st!=='lobby'||p.id!==R.host||!S.MAPS[m.map])break;R.mapVotes=new Map();applyLobbyMap(R,m.map,true);break;
      }
      case 'mapVote': {
        if(R.st!=='lobby'||!S.MAPS[m.map])break;R.mapVotes=R.mapVotes||new Map();R.mapVotes.set(p.id,m.map);const winner=resolveMapVote(R);if(winner!==R.mapId)applyLobbyMap(R,winner,true);else lobby(R);break;
      }
      case 'party': {
        if(R.st!=='lobby')break;const next=sanitizePartyCode(m.code),old=p.partyId||'',mc=modeCfg(R),members=next?[...R.ps.values()].filter(q=>q!==p&&q.partyId===next):[];
        if(next&&!mc.solo&&mc.teamCap>1&&members.length>=mc.teamCap){tx(p,{t:'m',s:`Essa Party já atingiu ${mc.teamCap} jogador(es) para ${mc.name}.`});break}
        p.partyId=next;if(old&&PARTY_MATCH_ROOMS.get(old)===R.code&&![...R.ps.values()].some(q=>q!==p&&q.partyId===old))PARTY_MATCH_ROOMS.delete(old);if(next&&R.quickMatch)PARTY_MATCH_ROOMS.set(next,R.code);
        if(next&&!mc.solo&&mc.teamCap>1&&members.length){const target=members[0].team,count=[...R.ps.values()].filter(q=>q!==p&&q.team===target).length;if(count<mc.teamCap)p.team=target}else if(!next&&!mc.solo)rebalanceForMode(R,mc);
        p.roomShop=R.SHOP[p.team];p.roomSpawn=R.SPAWN?.[p.team];R.ps.forEach((q,i)=>spawnLobby(q,i));R.quickReadyAt=0;lobby(R);break;
      }
""", 'map vote and party actions')

server = between(server, "      case 'start':\n", "      case 'mv': {\n", """      case 'start':
        if(R.st!=='lobby'||p.id!==R.host)break;if(R.quickMatch){tx(p,{t:'m',s:'A Partida Rápida inicia automaticamente quando estiver pronta.'});break}startMatch(R,p);break;
""", 'replace start with helper')

server = once(server, """R.projectiles=[];R.blockSeq=0;R.final=null;R.st='lobby';R.t=0;R.suddenDeath=false;""", """R.projectiles=[];R.blockSeq=0;R.mapVotes=new Map();R.quickReadyAt=0;R.final=null;R.st='lobby';R.t=0;R.suddenDeath=false;""", 'replay reset votes')

server = once(server, """  rooms.forEach(R => {
    try{
    R.t += dt;
""", """  rooms.forEach(R => {
    try{
    if(R.st==='lobby'&&R.quickMatch)updateQuickCountdown(R,Date.now());
    R.t += dt;
""", 'quick countdown tick')

# Client party state, richer match status and lobby voting UI.
game = once(game, """let roomCode='',reconnectToken='',reconnectUntil=0,reconnectTimer=null,reconnecting=false,bowCharging=false,bowChargeAt=0,lobbyExplore=false;
let matchTime=0,respawnEnds=0,respawnFinal=false,lastScoreboardAt=0,comboHudUntil=0;const matchPlayers=new Map();let myMatchStats={kills:0,finalKills:0};
""", """let roomCode='',reconnectToken='',reconnectUntil=0,reconnectTimer=null,reconnecting=false,bowCharging=false,bowChargeAt=0,lobbyExplore=false,myPartyCode='';
let queueState={quick:false,count:0,min:0,max:0,countdown:0},matchTime=0,respawnEnds=0,respawnFinal=false,lastScoreboardAt=0,comboHudUntil=0;const matchPlayers=new Map();let myMatchStats={kills:0,finalKills:0};
""", 'client party state')

game = once(game, """function renderMatchStatus(){const el=$('matchStatus');if(!el)return;if(!started||over){el.classList.remove('show');return}const ownBed=bed[me.team]?'🛏':'☠',phase=matchPhase==='sudden'?'MORTE SÚBITA':'BED WARS';el.innerHTML='<b>'+phase+'</b><span>'+formatMatchClock(matchTime)+'</span><span>'+String(currentMode||'').toUpperCase()+'</span><span>'+ownBed+'</span>';el.classList.add('show')}
""", """function renderMatchStatus(){const el=$('matchStatus');if(!el)return;if(!started||over){el.classList.remove('show');document.body.classList.remove('low-health');return}const ownBed=bed[me.team]?'🛏 CAMA':'☠ SEM CAMA',phase=matchPhase==='sudden'?'MORTE SÚBITA':'BED WARS',allies=[...matchPlayers.values()].filter(q=>q.team===me.team&&!q.out&&q.alive&&!q.admin).length,enemies=[...matchPlayers.values()].filter(q=>q.team!==me.team&&!q.out&&q.alive&&!q.admin).length,next=matchTime<1800?'☠ '+formatMatchClock(1800-matchTime):matchTime<1980?'⚡ '+formatMatchClock(1980-matchTime):'⚡ COLAPSO';document.body.classList.toggle('low-health',!!me.alive&&me.hp<=6);el.innerHTML='<b>'+phase+'</b><span>'+formatMatchClock(matchTime)+'</span><span>'+String(currentMode||'').toUpperCase()+'</span><span>'+ownBed+'</span><span>👥 '+allies+' · ⚔ '+enemies+'</span><span class="next-event">'+next+'</span>';el.classList.add('show')}
""", 'match status v3')

old_party = """function quickPlay(){audioInit();$('er').textContent='Procurando partida...';connectSocket('matchmake')}
function createPartyCode(){const code=Math.random().toString(36).slice(2,8).toUpperCase();if($('partyCode')){$('partyCode').value=code;try{localStorage.setItem('bwPartyCode',code)}catch(e){}}msg('Party criada: '+code)}
"""
new_party = """function sanitizePartyLocal(v){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8)}
function renderPartyStatus(){const el=$('partyStatus');if(!el)return;el.textContent=myPartyCode?'🤝 Party '+myPartyCode+' · compartilhe o código com seus amigos':'Sem Party · você pode jogar sozinho ou criar um grupo.';el.classList.toggle('active',!!myPartyCode)}
function setPartyCode(code,sync=true){code=sanitizePartyLocal(code);myPartyCode=code;const input=$('partyCode');if(input&&input.value!==code)input.value=code;try{if(code)localStorage.setItem('bwPartyCode',code);else localStorage.removeItem('bwPartyCode')}catch(e){}renderPartyStatus();if(sync&&ws&&ws.readyState===1&&!started)send({t:'party',code})}
function quickPlay(){audioInit();setPartyCode($('partyCode')?.value||myPartyCode,false);$('er').textContent='Procurando partida...';connectSocket('matchmake')}
function createPartyCode(){const code=Math.random().toString(36).slice(2,8).toUpperCase();setPartyCode(code,true);msg('Party criada: '+code)}
async function copyPartyCode(){const code=sanitizePartyLocal($('partyCode')?.value||myPartyCode);if(!code){msg('Crie ou informe uma Party primeiro.');return}setPartyCode(code,false);try{await navigator.clipboard.writeText(code);msg('Código da Party copiado: '+code)}catch(e){msg('Party: '+code)}}
function leavePartyCode(){setPartyCode('',true);msg('Você saiu da Party.')}
try{const saved=sanitizePartyLocal(localStorage.getItem('bwPartyCode')||'');if(saved)setPartyCode(saved,false)}catch(e){}if($('partyCode'))$('partyCode').onchange=e=>setPartyCode(e.target.value,true);renderPartyStatus();
"""
game = once(game, old_party, new_party, 'client party v2 functions')

game = once(game, """if(m.party&&$('partyCode'))$('partyCode').value=m.party;""", """if(m.party!=null)setPartyCode(m.party,false);""", 'init party sync')
game = once(game, """currentMode=m.modeId||currentMode;reconnectToken=m.token;me.alive=m.alive??me.alive;""", """currentMode=m.modeId||currentMode;reconnectToken=m.token;if(m.party!=null)setPartyCode(m.party,false);me.alive=m.alive??me.alive;""", 'reconnect party sync')

new_lobby_client = """case'lobby':{
 INFO={};m.l.forEach(([id,n,t,d,partyMate])=>INFO[id]={n,t,d,partyMate});const mine=m.l.find(q=>q[0]===me.id);if(mine)me.team=mine[2];if(m.party!=null)setPartyCode(m.party,false);
 currentMode=m.modeId||currentMode;queueState={quick:!!m.quick,...(m.queue||{})};
 if(m.mapId&&m.mapId!==currentMap)loadMap(m.mapId,true,m.activeChunks);
 const activeTeams=m.activeTeams||[0,1],teamCap=m.teamCap||2,soloMode=!!m.solo,counts=[0,0,0,0],votes=m.votes||{},myVote=m.myVote||'';m.l.forEach(q=>counts[q[2]]++);
 $('pl').innerHTML=m.l.map(([id,n,t,d,partyMate])=>`<p style="color:#${hex(TC[t])}">■ ${n}${id===me.id?' (você)':''}${id===m.host?' ★ anfitrião':''}${partyMate&&id!==me.id?' 🤝 Party':''}${d?' · desconectado':''}</p>`).join('');
 $('modePick').innerHTML=(m.modes||[]).map(md=>`<button class="map-card${md.id===currentMode?' active':''}" ${(m.quick||me.id!==m.host)?'disabled':''} onclick="send({t:'mode',mode:'${md.id}'})"><b>${md.name}</b><small>${md.description||''}</small></button>`).join('');
 $('teamPick').innerHTML=activeTeams.map(t=>`<button class="team-btn${me.team===t?' active':''}" ${(m.quick?'disabled':'')} style="background:#${hex(TC[t])}" onclick="send({t:'team',team:${t}})">${soloMode?'Base ':''}${TN[t]} (${counts[t]}/${teamCap})</button>`).join('');
 $('mapPick').innerHTML=(m.maps||Object.values(MAPS)).map(mp=>`<button class="map-card${mp.id===m.mapId?' active':''}${myVote===mp.id?' voted':''}" onclick="send({t:'mapVote',map:'${mp.id}'})"><b>${mp.name}</b><small>${mp.description||''}</small><em class="map-votes">🗳 ${votes[mp.id]||0}${myVote===mp.id?' · SEU VOTO':''}</em></button>`).join('');
 $('st').style.display=m.quick?'none':me.id===m.host?'block':'none';if(m.quick){const q=m.queue||{},cd=q.countdown>0?' · inicia em '+q.countdown+'s':q.ready?' · preparando partida':' · mínimo '+(q.min||2)+' jogadores';$('wt').textContent='⚡ PARTIDA RÁPIDA · '+(q.count||m.l.length)+'/'+(q.max||'?')+cd}else $('wt').textContent=me.id===m.host?(soloMode?`Modo SOLO · cada jogador ocupa uma base diferente · vote no mapa.`:`Modo ${currentMode.toUpperCase()} · organize os times e vote no mapa.`):'Aguardando o anfitrião · você já pode votar no mapa.';renderPartyStatus();scr('lobby');hud();break}
"""
game = between(game, "case'lobby':{\n", "case'map':", new_lobby_client, 'client lobby v2')

game = once(game, """case'start':HELD_CACHE.clear();setTimeout(preloadHeld,50);currentMode=m.modeId||currentMode;loadMap(m.mapId||currentMap,false,m.activeChunks);started=1;bed=m.bed;syncBedVisuals(worldMeta,bed);matchTime=0;matchPlayers.clear();myMatchStats={kills:0,finalKills:0};clearRespawn();showEventBanner('⚔ PARTIDA INICIADA','start',1800);scr(touchMode||document.pointerLockElement?null:'ov');hud();renderScoreboard(true);break;
""", """case'start':HELD_CACHE.clear();setTimeout(preloadHeld,50);currentMode=m.modeId||currentMode;loadMap(m.mapId||currentMap,false,m.activeChunks);started=1;queueState={quick:false,count:0,min:0,max:0,countdown:0};bed=m.bed;syncBedVisuals(worldMeta,bed);matchTime=0;matchPlayers.clear();myMatchStats={kills:0,finalKills:0};clearRespawn();showEventBanner('⚔ '+String(currentMode||'BED WARS').toUpperCase()+' · '+((MAPS[currentMap]||{}).name||currentMap),'start',2100);scr(touchMode||document.pointerLockElement?null:'ov');hud();renderScoreboard(true);renderMatchStatus();break;
""", 'start banner v3')

# Menu modes and party controls.
index = once(index, """<hr><p><b>PARTIDA RÁPIDA</b></p><select id="quickMode"><option value="2v2">2v2</option><option value="4v4">4v4</option><option value="solo">Solo</option></select><input id="partyCode" maxlength="8" placeholder="Código da Party (opcional)"><div class="meta-actions"><button type="button" onclick="quickPlay()">Jogar agora</button><button type="button" onclick="createPartyCode()">Criar Party</button></div><p id="er"></p></div></div>
""", """<hr><p><b>PARTIDA RÁPIDA</b></p><select id="quickMode"><option value="1v1">Duelo 1v1</option><option value="2v2" selected>2v2</option><option value="3v3">3v3</option><option value="4v4">4v4</option><option value="solo">Solo / FFA</option></select><input id="partyCode" maxlength="8" placeholder="Código da Party (opcional)"><div class="meta-actions party-tools"><button type="button" onclick="quickPlay()">⚡ Jogar agora</button><button type="button" onclick="createPartyCode()">Criar Party</button><button type="button" onclick="copyPartyCode()">Copiar código</button><button type="button" onclick="leavePartyCode()">Sair da Party</button></div><p id="partyStatus" class="party-status"></p><p id="er"></p></div></div>
""", 'menu matchmaking v2')

index = index.replace('/style.css?v=game-feel-v2-20261009','/style.css?v=match-party-hud-modes-v2-20261009')
index = index.replace('/game.js?v=core-v2-block-d-20261009','/game.js?v=match-party-hud-modes-v2-20261009')

style += """

/* Matchmaking / Party V2 + HUD / Game Feel V3 */
.party-tools{display:grid!important;grid-template-columns:1fr 1fr;gap:5px}.party-tools button{margin:0!important;text-align:center!important}.party-status{margin:7px 0!important;padding:7px 8px;background:#9e9e9e;border:2px solid #666;color:#333!important;font-size:8px}.party-status.active{background:#b8d8b1;border-color:#4d7048;color:#173516!important}
.map-card{position:relative}.map-card.voted{outline:3px solid #fff55c;outline-offset:-3px}.map-votes{display:block;margin-top:5px;font-style:normal;font-size:7px;color:#313131;text-shadow:none}.map-card.active .map-votes{color:#fff}
#matchStatus .next-event{color:#fff55c;font-weight:700}body.low-health:before{content:"";position:fixed;inset:0;z-index:8;pointer-events:none;box-shadow:inset 0 0 90px rgba(190,0,0,.42);animation:lowHealthPulse 1.05s ease-in-out infinite}@keyframes lowHealthPulse{50%{box-shadow:inset 0 0 45px rgba(190,0,0,.18)}}
#wt{padding:7px 8px;background:rgba(0,0,0,.08);border-left:3px solid #777}
@media (pointer:coarse),(max-width:800px){.party-tools{grid-template-columns:1fr 1fr}#matchStatus{max-width:78vw;overflow:hidden}#matchStatus .next-event{display:none}.map-votes{font-size:6px}}
"""

server_p.write_text(server)
game_p.write_text(game)
index_p.write_text(index)
style_p.write_text(style)
print('Matchmaking/Party V2 + HUD/Game Feel V3 + Maps/Modes V2 applied')
