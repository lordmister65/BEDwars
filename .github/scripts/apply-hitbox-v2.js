const fs=require('fs');

function once(src,oldv,newv,label){
  const n=src.split(oldv).length-1;
  if(n!==1)throw new Error(`${label}: expected 1 match, found ${n}`);
  return src.replace(oldv,newv);
}
function rex(src,re,repl,label){
  const m=src.match(re);if(!m)throw new Error(`${label}: no match`);
  const out=src.replace(re,repl);
  if(out===src)throw new Error(`${label}: unchanged`);
  return out;
}

let server=fs.readFileSync('server.js','utf8');
let game=fs.readFileSync('public/game.js','utf8');
let index=fs.readFileSync('public/index.html','utf8');

server=once(server,
`const CENTRAL_GEN={diamond:24,emerald:40};`,
`const CENTRAL_GEN={diamond:24,emerald:40};
// Hitbox de combate centralizada. A caixa é levemente maior que a colisão física
// para compensar interpolação e até um snapshot curto de movimento, sem aumentar o alcance.
const COMBAT_HITBOX={radius:.36,height:1.80,feetPad:.05,historyMax:.60,meleePad:.055,meleeReach:3.80};`,
'hitbox constants');

// Alinha a colisão usada para impedir bloco dentro do jogador com o tamanho físico real.
server=once(server,
`    const horizontal=px+.34>x&&px-.34<x+1&&pz+.34>z&&pz-.34<z+1;
    const vertical=py+.03<y+1&&py+1.77>y;`,
`    const horizontal=px+.36>x&&px-.36<x+1&&pz+.36>z&&pz-.36<z+1;
    const vertical=py+.03<y+1&&py+1.80>y;`,
'physical player bounds');

server=rex(server,
/function segmentHitPlayer\(R,pr,nx,ny,nz\)\{[\s\S]*?\n\}\nfunction segmentHitsBlock/,
`function clampHistory(now,prev){
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
function segmentHitsBlock`,
'combat hitbox helpers');

server=once(server,
`    if(block&&target){
      const db=Math.hypot(block.x-pr.x,block.y-pr.y,block.z-pr.z),dtar=Math.hypot(target.x-pr.x,target.y+.9-pr.y,target.z-pr.z);
      if(db<dtar)target=null;
    }`,
`    if(block&&target){
      const db=Math.hypot(block.x-pr.x,block.y-pr.y,block.z-pr.z),travel=Math.hypot(nx-pr.x,ny-pr.y,nz-pr.z),dtar=(pr._hitT??1)*travel;
      if(db+.03<dtar)target=null;
    }`,
'projectile wall ordering');

server=once(server,
`        const cy = Math.cos(m.pitch), d = [-Math.sin(m.yaw) * cy, Math.sin(m.pitch), -Math.cos(m.yaw) * cy];
        const dx = q.x - p.x, dy = q.y + .9 - (p.y + 1.62), dz = q.z - p.z, L = Math.hypot(dx, dy, dz);
        if (L > 3.8 || L < .01 || (dx * d[0] + dy * d[1] + dz * d[2]) / L < .9) break;
        const stick=m.k==='knockbackStick'&&(p.inv.knockbackStick||0)>0,cr = !stick&&p.dy < -1,kb=stick?1.9:1,damage=stick?1.5:(DMG[p.sw] + 2 * p.up.sharp) * (cr ? 1.5 : 1);
        hurt(R, q, damage, d[0]*kb, d[2]*kb, p, cr);`,
`        const hit=meleeRayHit(R,p,q,m.yaw,m.pitch);if(!hit)break;
        const d=[hit.dir.x,hit.dir.y,hit.dir.z],stick=m.k==='knockbackStick'&&(p.inv.knockbackStick||0)>0,cr=!stick&&p.dy<-1,kb=stick?1.9:1,damage=stick?1.5:(DMG[p.sw]+2*p.up.sharp)*(cr?1.5:1);
        hurt(R,q,damage,d[0]*kb,d[2]*kb,p,cr);`,
'melee center cone replacement');

// -------- Cliente: seleção usa a mesma caixa 3D em vez do centro do personagem --------
game=rex(game,
/function playerTarget\(\)\{[\s\S]*?\n\}\nlet breaking=/,
`function viewAabbDistance(ox,oy,oz,dx,dy,dz,b,maxDist){
 let t0=0,t1=maxDist;
 for(const [s,d,min,max] of [[ox,dx,b.minX,b.maxX],[oy,dy,b.minY,b.maxY],[oz,dz,b.minZ,b.maxZ]]){
  if(Math.abs(d)<1e-8){if(s<min||s>max)return null;continue}
  let a=(min-s)/d,c=(max-s)/d;if(a>c){const tmp=a;a=c;c=tmp}t0=Math.max(t0,a);t1=Math.min(t1,c);if(t0>t1)return null;
 }
 return t0>=0&&t0<=maxDist?t0:null
}
function viewBlocked(dist,d){
 const ox=cam.position.x,oy=cam.position.y,oz=cam.position.z,end=Math.max(0,dist-.05);
 for(let t=.12;t<end;t+=.08){const x=Math.floor(ox+d.x*t),y=Math.floor(oy+d.y*t),z=Math.floor(oz+d.z*t);if(get(x,y,z))return true}
 return false
}
function playerTarget(){
 const d=new THREE.Vector3();cam.getWorldDirection(d);let best=null,bd=3.8;
 PL.forEach((r,id)=>{
  if(!r.al)return;const mp=matchPlayers.get(id);if(mp&&(mp.team===me.team||mp.out||mp.admin))return;
  const p=r.m.position,b={minX:p.x-.415,maxX:p.x+.415,minY:p.y-.07,maxY:p.y+1.87,minZ:p.z-.415,maxZ:p.z+.415},t=viewAabbDistance(cam.position.x,cam.position.y,cam.position.z,d.x,d.y,d.z,b,3.8);
  if(t!=null&&t<bd){best=id;bd=t}
 });
 if(best!==null&&viewBlocked(bd,d))return null;
 return best;
}
let breaking=`,
'client playerTarget hitbox');

index=index.replace(/<script src="\/game\.js\?v=[^"]+"><\/script>/,'<script src="/game.js?v=hitbox-v2-20261004"></script>');

fs.writeFileSync('server.js',server);
fs.writeFileSync('public/game.js',game);
fs.writeFileSync('public/index.html',index);
console.log('hitbox v2 applied');
