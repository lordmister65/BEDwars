// Servidor autoritativo do Bed Wars: blocos, dano, camas, recursos e loja são decididos aqui.
const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const S = require('./public/shared.js');
const PORT = process.env.PORT || 3000, DMG = [2, 4, 6, 8], rooms = new Map();
const MAX_SOCKET_BUFFER = 256 * 1024;
let uid = 0;

// Arquivos pequenos ficam em memória para evitar fs.readFile a cada acesso.
const STATIC = {};
for (const f of ['index.html','shared.js','game.js','style.css']) STATIC[f]=fs.readFileSync(path.join(__dirname,'public',f));
const srv = http.createServer((q, r) => {
  const clean=(q.url||'/').split('?')[0], f=clean==='/'?'index.html':clean.slice(1);
  if(!STATIC[f]){r.writeHead(404);return r.end('não encontrado')}
  const type=f.endsWith('.js')?'text/javascript; charset=utf-8':f.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8';
  r.writeHead(200, {'Content-Type':type,'Cache-Control':f==='index.html'?'no-cache':'public, max-age=300'});
  r.end(STATIC[f]);
});
const wss = new WebSocketServer({ server: srv, perMessageDeflate: false });
const canSend = ws => ws.readyState === 1 && ws.bufferedAmount < MAX_SOCKET_BUFFER;
const tx = (p, o) => { if (canSend(p.ws)) p.ws.send(JSON.stringify(o)); };
const bc = (R, o) => {
  const data = JSON.stringify(o);
  R.ps.forEach(p => { if (canSend(p.ws)) p.ws.send(data); });
};
const msg = (R, s) => bc(R, { t: 'm', s });
const get = (R, x, y, z) => (y < 0 || x < 0 || z < 0 || x >= S.W || z >= S.D || y >= S.H) ? 0 : R.B[S.ix(x, y, z)];
function setb(R, x, y, z, v, f = 0) {
  if (x < 0 || z < 0 || y < 0 || x >= S.W || z >= S.D || y >= S.H) return;
  const i = S.ix(x, y, z); R.B[i] = v; R.pf[i] = f; R.ed.set(i, [x, y, z, v, f]); R.q.push([x, y, z, v, f]);
}
function room(code) {
  let R = rooms.get(code);
  if (!R) {
    const g = S.gen();
    R = { code, B: g.B, BD: g.BD, pf: new Uint8Array(g.B.length), ps: new Map(), ed: new Map(), q: [], tnt: [], drops: [], dropSeq: 0, snapAcc: 0, pickupAcc: 0, bed: [0, 0, 0, 0], st: 'lobby', t: 0, host: null,
      g: {
        base: [0,1,2,3].map(() => ({ iron:0, gold:0 })),
        dia: S.DI.map(() => ({ t:0 })),
        em: { t:0 }
      } };
    rooms.set(code, R);
  }
  return R;
}
const mkp = (ws, name, team) => ({ ws, name, team, x: 0, y: 11.02, z: 0, px:0, py:11.02, pz:0, yaw: 0, pitch: 0, hp: 20, alive: 1, out: 0, rt: 0, ih: 0, dy: 0, lt: Date.now(), src: null, st: -99, k: 0, sw: 0, ar: 0,
  rl: Object.create(null), breaking: null, tools: { pick:0, axe:0, shears:0 }, fx:{speed:0,jump:0,invis:0}, up: { sharp: 0, prot: 0, forge: 0, regen:0, trap:0 }, inv: { wool: 24, planks: 0, endstone:0, glass:0, obsidian:0, tnt: 0, apple: 0, bow: 0, arrow: 0, fireball: 0, snowball: 0, pearl:0, speedPotion:0, jumpPotion:0, invisPotion:0, iron: 0, gold: 0, dia: 0, em: 0 } });
const allow = (p, key, gap) => {
  const n = Date.now(), last = p.rl[key] || 0;
  if (n - last < gap) return false;
  p.rl[key] = n; return true;
};
const nearBase = p => Math.hypot(p.x - (S.IS[p.team][0] + .5), p.z - (S.IS[p.team][1] + .5)) <= 6 && Math.abs(p.y - 11) < 4;
const pinv = p => tx(p, { t: 'inv', i: p.inv, sw: p.sw, ar: p.ar, up: p.up, tools:p.tools, fx:p.fx });
const sfx = (p,k) => tx(p,{t:'sfx',k});
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
    const horizontal=px+.34>x&&px-.34<x+1&&pz+.34>z&&pz-.34<z+1;
    const vertical=py+.03<y+1&&py+1.77>y;
    return horizontal&&vertical;
  });
}
function spawn(p) { p.x = S.IS[p.team][0] + .5; p.z = S.IS[p.team][1] + .5; p.y = 11.02; p.px=p.x;p.py=p.y;p.pz=p.z; p.hp = 20; p.alive = 1; p.breaking=null; p.lt = Date.now(); tx(p, { t: 'tp', x: p.x, y: p.y, z: p.z }); }
const lobby = R => bc(R, { t: 'lobby', host: R.host, l: [...R.ps.values()].map(q => [q.id, q.name, q.team]) });

function win(R) {
  if (R.st !== 'play') return;
  const live = [...R.ps.values()].filter(q => !q.out), teams = new Set(live.map(q => q.team));
  if (teams.size <= 1) { R.st = 'over'; bc(R, { t: 'end', w: live[0] ? live[0].name : 'ninguém' }); setTimeout(() => { if (rooms.get(R.code) === R) rooms.delete(R.code); }, 60000); }
}
function die(R, q) {
  q.alive = 0; q.hp = 0; q.rt = 3; q.breaking=null; q.tools.pick=Math.max(0,q.tools.pick-1); q.tools.axe=Math.max(0,q.tools.axe-1); pinv(q); sfx(q,'death');
  const k = q.src && R.t - q.st < 5 ? q.src : null; if (k) k.k++;
  msg(R, q.name + (k ? ' foi derrubado por ' + k.name : ' morreu'));
  if (!R.bed[q.team]) { q.out = 1; msg(R, q.name + ' foi eliminado!'); win(R); }
}
function hurt(R, q, d, kx, kz, src, cr) {
  if (!q.alive || q.ih > 0) return;
  q.ih = .35; d *= 1 - .25 * q.ar - .1 * q.up.prot; q.hp -= d;
  if (src) { q.src = src; q.st = R.t; }
  tx(q, { t: 'kb', kx: kx * 7, kz: kz * 7, vy: 4.5 }); sfx(q,'hurt');
  bc(R, { t: 'fx', x: q.x, y: q.y + 1, z: q.z, c: cr ? 0xffd23d : 0xd23c3c });
  if (q.hp <= 0) die(R, q);
}
function killBed(R, t, src) {
  if (!R.bed[t]) return;
  const b = R.BD[t]; setb(R, b[0], b[1], b[2], 0); R.bed[t] = 0;
  msg(R, 'A cama do time ' + S.TN[t] + ' foi destruída' + (src ? ' por ' + src.name : '') + '!');
  bc(R, { t: 'bed', bed: R.bed });
  R.ps.forEach(q => { if (q.team === t && !q.alive && !q.out) { q.out = 1; msg(R, q.name + ' foi eliminado!'); } });
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
    if (L < 5) hurt(R, e, 9 * (1 - L / 5), dx / (L || 1), dz / (L || 1), q.o);
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
function fireballBoom(R, x, y, z, owner) {
  const r = 2;
  for (let a=-r;a<=r;a++) for (let b=-r;b<=r;b++) for (let c=-r;c<=r;c++) {
    if (a*a+b*b+c*c>r*r) continue;
    const X=Math.floor(x)+a,Y=Math.floor(y)+b,Z=Math.floor(z)+c;
    if(get(R,X,Y,Z)&&R.pf[S.ix(X,Y,Z)]&&![7,16].includes(get(R,X,Y,Z))) setb(R,X,Y,Z,0);
  }
  bc(R,{t:'fx',x,y,z,c:0xff6a00});
  R.ps.forEach(q=>{
    if(!q.alive)return;
    const dx=q.x-x,dy=q.y+.9-y,dz=q.z-z,L=Math.hypot(dx,dy,dz);
    if(L<4.5) hurt(R,q,7*(1-L/4.5),dx/(L||1),dz/(L||1),owner);
  });
}

function breakTime(p, b) {
  const m=S.BLOCKS[b]||{hard:.7,tool:null}, lv=m.tool?p.tools[m.tool]||0:0;
  let mult=1;
  if(m.tool==='shears'&&lv) mult=.28;
  else if(m.tool==='pick'&&lv) mult=lv===1?.55:.32;
  else if(m.tool==='axe'&&lv) mult=lv===1?.55:.32;
  return Math.max(.18,m.hard*mult);
}
function addDrop(R,k,n,x,y,z,max=64){
  let d=R.drops.find(e=>e.k===k&&Math.hypot(e.x-x,e.z-z)<1.2&&e.n<max);
  if(d){d.n=Math.min(max,d.n+n);} else {d={id:++R.dropSeq,k,n:Math.min(max,n),x,y,z};R.drops.push(d);}
  if(['iron','gold','dia','em'].includes(k)) sfxAt(R,'resource_'+k,x,y,z,k==='iron'?4.5:6);
  bc(R,{t:'drops',l:R.drops});
}
function pickupDrops(R, players){
  let changed=false;
  for(let i=R.drops.length-1;i>=0;i--){
    const d=R.drops[i], p=players.find(q=>q.alive&&Math.hypot(q.x-d.x,q.z-d.z)<1.25&&Math.abs(q.y-d.y)<2.5);
    if(!p) continue;
    p.inv[d.k]=(p.inv[d.k]||0)+d.n;p.dirty=1;
    if(['iron','gold','dia','em'].includes(d.k)) sfxAt(R,'pickup_'+d.k,d.x,d.y,d.z,6);
    else sfx(p,'pickup');
    R.drops.splice(i,1);changed=true;
  }
  if(changed)bc(R,{t:'drops',l:R.drops});
}
function nearOwnBase(p){return Math.hypot(p.x-(S.IS[p.team][0]+.5),p.z-(S.IS[p.team][1]+.5))<5.5&&Math.abs(p.y-11)<4;}
function enemyInBase(R,p){return [...R.ps.values()].find(q=>q.alive&&q.team!==p.team&&Math.hypot(q.x-(S.IS[p.team][0]+.5),q.z-(S.IS[p.team][1]+.5))<5.5);}


wss.on('connection', ws => {
  let R, p;
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', raw => {
    if(raw.length>4096){try{ws.close(1009,'mensagem muito grande')}catch(e){}return}
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (m.t === 'join' && !p) {
      const code = String(m.room || 'sala').slice(0, 12).toLowerCase(); R = room(code);
      if (R.st !== 'lobby') return tx({ ws }, { t: 'err', s: 'Partida em andamento nessa sala.' });
      const free = [0, 1, 2, 3].filter(t => ![...R.ps.values()].some(q => q.team === t));
      if (!free.length) return tx({ ws }, { t: 'err', s: 'Sala cheia (4 jogadores).' });
      p = mkp(ws, String(m.name || 'Jogador').slice(0, 14), free[0]); p.id = ++uid; spawn(p);
      R.ps.set(p.id, p); if (!R.host) R.host = p.id;
      tx(p, { t: 'init', id: p.id, team: p.team, ed: [...R.ed.values()], drops:R.drops }); lobby(R); return;
    }
    if (!p) return;
    const play = R.st === 'play' && p.alive;
    switch (m.t) {
      case 'start':
        if (R.st !== 'lobby' || p.id !== R.host || R.ps.size < 2) break;
        R.st = 'play';
        for (let t = 0; t < 4; t++) {
          R.bed[t] = [...R.ps.values()].some(q => q.team === t) ? 1 : 0;
          if (!R.bed[t]) { const b = R.BD[t]; setb(R, b[0], b[1], b[2], 0); }
        }
        R.ps.forEach(spawn); R.ps.forEach(pinv); bc(R, { t: 'start', bed: R.bed }); break;
      case 'mv': {
        if (!p.alive || !allow(p, 'mv', 15)) break;
        const n = Date.now(), dt = Math.max(.02, Math.min(.5, (n - p.lt) / 1000)); p.lt = n;
        const d = Math.hypot(m.x - p.x, m.z - p.z);
        if (![m.x, m.y, m.z, m.yaw, m.pitch].every(Number.isFinite) || d > dt * 12 + 1.5 || m.y - p.y > dt * 11 + 1.2 || m.x < -5 || m.x > S.W + 5 || m.z < -5 || m.z > S.D + 5 || m.y > 45) { tx(p, { t: 'tp', x: p.x, y: p.y, z: p.z }); break; }
        p.dy = (m.y - p.y) / dt; p.px=p.x;p.py=p.y;p.pz=p.z; p.x = m.x; p.y = m.y; p.z = m.z; p.yaw = m.yaw; p.pitch = m.pitch; break;
      }
      case 'hit': {
        if(p.fx.invis>0){p.fx.invis=0;pinv(p)}
        if (!play || !allow(p, 'hit', 90) || !Number.isInteger(m.id) || !Number.isFinite(m.yaw) || !Number.isFinite(m.pitch)) break;
        const q = R.ps.get(m.id);
        if (!q || q === p || !q.alive || q.team === p.team) break;
        const cy = Math.cos(m.pitch), d = [-Math.sin(m.yaw) * cy, Math.sin(m.pitch), -Math.cos(m.yaw) * cy];
        const dx = q.x - p.x, dy = q.y + .9 - (p.y + 1.62), dz = q.z - p.z, L = Math.hypot(dx, dy, dz);
        if (L > 3.8 || L < .01 || (dx * d[0] + dy * d[1] + dz * d[2]) / L < .9) break;
        const cr = p.dy < -1;
        hurt(R, q, (DMG[p.sw] + 2 * p.up.sharp) * (cr ? 1.5 : 1), d[0], d[2], p, cr);
        tx(p, { t:'hitok', id:q.id, hp:Math.max(0,Math.ceil(q.hp)), cr:cr?1:0 });
        break;
      }
      case 'place': {
        if(p.fx.invis>0){p.fx.invis=0;pinv(p)}
        if (!allow(p, 'place', 45)) break;
        const k = { wool: p.team + 1, planks: 5, endstone:12, glass:7, obsidian:16, tnt: 13 }[m.k], { x, y, z } = m;
        if (!play || !k || !(p.inv[m.k] > 0) || ![x, y, z].every(Number.isInteger) || y < 1 || y > 27 || get(R, x, y, z)) break;
        if (Math.hypot(x + .5 - p.x, y + .5 - p.y - 1.6, z + .5 - p.z) > 7) break;
        if (![[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].some(d => get(R, x + d[0], y + d[1], z + d[2]))) break;
        if ([...R.ps.values()].some(q => playerHitsBlock(q,x,y,z))) { sfx(p,'blocked'); break; }
        setb(R, x, y, z, k, 1); p.inv[m.k]--; if (k === 13) R.tnt.push({ x, y, z, t: 3.2, o: p }); pinv(p); sfx(p,'place'); break;
      }
      case 'breakStart': {
        if(p.fx.invis>0){p.fx.invis=0;pinv(p)}
        const {x,y,z}=m;
        if(!play||![x,y,z].every(Number.isInteger)||Math.hypot(x+.5-p.x,y+.5-p.y-1.6,z+.5-p.z)>7)break;
        const b=get(R,x,y,z); if(!b)break;
        if(b>=8&&b<=11){
          if(b-8===p.team){tx(p,{t:'m',s:'Essa é a sua cama!'});break;}
          p.breaking={x,y,z,b,need:.9,at:R.t};tx(p,{t:'breakp',x,y,z,d:.9});break;
        }
        if(!R.pf[S.ix(x,y,z)])break;
        const need=breakTime(p,b);p.breaking={x,y,z,b,need,at:R.t};tx(p,{t:'breakp',x,y,z,d:need});break;
      }
      case 'breakStop': p.breaking=null; break;
      case 'buy': {
        const s = S.SH[m.i]; if (!play || !allow(p, 'buy', 120) || !nearBase(p) || !s || p.inv[s[1]] < s[2]) break;
        let ok = 1;
        if (s[3] === 'inv' && s[4] === 'bow') { if (p.inv.bow > 0) ok = 0; else p.inv.bow = 1; }
        else if (s[3] === 'inv') p.inv[s[4]] += s[5];
        else if (s[3] === 'sw' && p.sw < s[5]) p.sw = s[5];
        else if (s[3] === 'ar' && p.ar < s[5]) p.ar = s[5];
        else if (s[3] === 'tool' && (p.tools[s[4]]||0) < s[5]) p.tools[s[4]] = s[5];
        else if (s[3] === 'up' && p.up[s[4]] === s[5] - 1) p.up[s[4]] = s[5];
        else ok = 0;
        if (ok) { p.inv[s[1]] -= s[2]; pinv(p); sfx(p,'buy'); } else tx(p, { t: 'm', s: 'Você já tem algo melhor' });
        break;
      }
      case 'shoot': {
        if(p.fx.invis>0){p.fx.invis=0;pinv(p)}
        if (!play || !Number.isFinite(m.yaw) || !Number.isFinite(m.pitch)) break;
        const kind = m.k;
        const gap = kind === 'bow' ? 500 : kind === 'fireball' ? 900 : kind === 'snowball' ? 300 : 999999;
        if (!allow(p, 'shoot_' + kind, gap)) break;
        if (kind === 'bow') {
          if (p.inv.bow < 1 || p.inv.arrow < 1) break;
          p.inv.arrow--;
          const r = aimRay(R, p, m.yaw, m.pitch, 28);
          bc(R,{t:'proj',k:'arrow',x:p.x,y:p.y+1.55,z:p.z,tx:r.x,ty:r.y,tz:r.z});
          if (r.best) hurt(R, r.best, 5, r.dx, r.dz, p);
          pinv(p);
        } else if (kind === 'fireball') {
          if (p.inv.fireball < 1) break;
          p.inv.fireball--;
          const r = aimRay(R, p, m.yaw, m.pitch, 24);
          bc(R,{t:'proj',k:'fireball',x:p.x,y:p.y+1.55,z:p.z,tx:r.x,ty:r.y,tz:r.z});
          fireballBoom(R, r.x, r.y, r.z, p);
          pinv(p);
        } else if (kind === 'snowball') {
          if (p.inv.snowball < 1) break;
          p.inv.snowball--;
          const r = aimRay(R, p, m.yaw, m.pitch, 20);
          bc(R,{t:'proj',k:'snowball',x:p.x,y:p.y+1.55,z:p.z,tx:r.x,ty:r.y,tz:r.z});
          if (r.best) hurt(R, r.best, 1, r.dx * 1.15, r.dz * 1.15, p);
          pinv(p);
        }
        break;
      }
      case 'use': {
        if(!play||!allow(p,'use',300))break;
        const k=m.k;
        if(k==='pearl'&&p.inv.pearl>0&&Number.isFinite(m.yaw)&&Number.isFinite(m.pitch)){
          p.inv.pearl--;const r=aimRay(R,p,m.yaw,m.pitch,30);
          bc(R,{t:'proj',k:'pearl',x:p.x,y:p.y+1.55,z:p.z,tx:r.x,ty:r.y,tz:r.z});
          p.x=r.x-r.dx*.7;p.y=Math.max(1,r.y);p.z=r.z-r.dz*.7;p.hp=Math.max(1,p.hp-2);tx(p,{t:'tp',x:p.x,y:p.y,z:p.z});pinv(p);
        } else if(k==='speedPotion'&&p.inv.speedPotion>0){p.inv.speedPotion--;p.fx.speed=45;pinv(p);}
        else if(k==='jumpPotion'&&p.inv.jumpPotion>0){p.inv.jumpPotion--;p.fx.jump=45;pinv(p);}
        else if(k==='invisPotion'&&p.inv.invisPotion>0){p.inv.invisPotion--;p.fx.invis=30;pinv(p);}
        break;
      }
      case 'apple': if (play && allow(p, 'apple', 250) && p.inv.apple > 0 && p.hp < 20) { p.inv.apple--; p.hp = Math.min(20, p.hp + 10); pinv(p); } break;
    }
  });
  ws.on('close', () => {
    if (!p) return;
    R.ps.delete(p.id); if (R.host === p.id) R.host = [...R.ps.keys()][0] || null;
    if (!R.ps.size) { rooms.delete(R.code); return; }
    if (R.st === 'lobby') lobby(R);
    else { msg(R, p.name + ' saiu da partida'); if (R.bed[p.team]) killBed(R, p.team); win(R); }
  });
});

setInterval(() => {
  const dt = .05;
  rooms.forEach(R => {
    R.t += dt;
    if (R.st === 'play') {
      const players = [...R.ps.values()];
      R.ps.forEach(p => {
        p.ih = Math.max(0, p.ih - dt);
        p.fx.speed=Math.max(0,p.fx.speed-dt);p.fx.jump=Math.max(0,p.fx.jump-dt);p.fx.invis=Math.max(0,p.fx.invis-dt);
        if (p.alive) {
          p.hp = Math.min(20, p.hp + .4 * dt);
          if(p.up.regen&&nearOwnBase(p))p.hp=Math.min(20,p.hp+.8*dt);
          if(p.up.trap&&enemyInBase(R,p)){p.up.trap=0;tx(p,{t:'m',s:'ARMADILHA! Inimigo na sua base!'});pinv(p);}
          if(p.breaking){
            const br=p.breaking, same=get(R,br.x,br.y,br.z)===br.b, near=Math.hypot(br.x+.5-p.x,br.y+.5-p.y-1.6,br.z+.5-p.z)<=7;
            const cy=Math.cos(p.pitch),dx=-Math.sin(p.yaw)*cy,dy=Math.sin(p.pitch),dz=-Math.cos(p.yaw)*cy,bx=br.x+.5-p.x,by=br.y+.5-(p.y+1.62),bz=br.z+.5-p.z,bl=Math.hypot(bx,by,bz)||1,looking=(bx*dx+by*dy+bz*dz)/bl>.82;
            if(!same||!near||!looking){p.breaking=null;tx(p,{t:'breakCancel'});}
            else if(R.t-br.at>=br.need){if(br.b>=8&&br.b<=11)killBed(R,br.b-8,p);else if(R.pf[S.ix(br.x,br.y,br.z)]){setb(R,br.x,br.y,br.z,0);sfx(p,'break');}p.breaking=null;}
          }
          if (p.y < -8) die(R, p);
        } else if (!p.out && (p.rt -= dt) <= 0) { spawn(p); }
      });
      R.g.base.forEach((g, i) => {
        const gx = S.IS[i][0] + .5, gz = S.IS[i][1] + .5;
        const near = players.filter(q => q.alive && q.team === i && Math.hypot(q.x - gx, q.z - gz) < 3.2 && Math.abs(q.y - 11) < 3);
        const o = players.find(q => q.team === i), fm = 1 + .5 * (o ? o.up.forge : 0);
        g.iron += dt; g.gold += dt;
        if (g.iron > 1.2 / fm) { g.iron = 0; addDrop(R,'iron',1,gx,11.25,gz,48); }
        if (g.gold > 5 / fm) { g.gold = 0; addDrop(R,'gold',1,gx+1,11.25,gz,12); }
      });
      R.g.dia.forEach((g, i) => {
        g.t += dt;
        if (g.t <= 12) return;
        g.t = 0;
        const [gx,gz] = S.DI[i];addDrop(R,'dia',1,gx+.5,11.35,gz+.5,4);
      });
      R.g.em.t += dt;
      if (R.g.em.t > 22) {
        R.g.em.t = 0;
        const [gx,gz] = S.EM;
        addDrop(R,'em',1,gx+.5,12.35,gz+.5,2);
      }
      R.pickupAcc+=dt;if(R.pickupAcc>=.1){R.pickupAcc=0;pickupDrops(R,players);}
      R.ps.forEach(p => { if (p.dirty) { p.dirty = 0; pinv(p); } });
      for (let i = R.tnt.length; i--;) { const q = R.tnt[i]; if ((q.t -= dt) <= 0) { R.tnt.splice(i, 1); boom(R, q); } }
    }
    if (R.q.length) { bc(R, { t: 'bb', l: R.q }); R.q = []; }
    if (R.st === 'play') {R.snapAcc+=dt;if(R.snapAcc>=.066){R.snapAcc=0;bc(R,{t:'s',p:[...R.ps.values()].map(p=>[p.id,+p.x.toFixed(2),+p.y.toFixed(2),+p.z.toFixed(2),+p.yaw.toFixed(2),+p.pitch.toFixed(2),Math.ceil(p.hp),p.alive,p.team,p.fx.invis>0?1:0])});}}
  });
}, 50);

const heartbeat = setInterval(() => {
  wss.clients.forEach(ws => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    try { ws.ping(); } catch (e) {}
  });
}, 30000);
wss.on('close', () => clearInterval(heartbeat));

srv.listen(PORT, () => console.log('Bed Wars online na porta ' + PORT));
