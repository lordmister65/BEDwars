const $=id=>document.getElementById(id),{W,H,D,TC,TN,IS,DI,EM,ix,SH,BLOCKS}=BW,gn=BW.gen(),B=gn.B,pf=new Uint8Array(B.length),CS=16,hex=c=>c.toString(16).padStart(6,'0');
const RI={
  iron:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAAxElEQVR4nO3ZsRWCMBSG0afHiVzB2kFkIByEmhVYSVsL0Sr54/HekoZHvtAkVQAAAAAAAAAAAAAAAAAAAAD8ikN6gFe3aXok33+f5+7rEQmwt9Dny7X3KFVVta3L2+c9gpxav+Cb1KJ/mmEvSAuxACMs/AiO6QFG1HNzCBAmQJgAYQKECRAmQJgAYQKECRAmQJgAYQKExQJs69L12HdU8fuA0fTeFPEAex/c4kh4xD/uL++EE3e/AAAAAAAAAAAAAADQ0BPsQyBuy/khFgAAAABJRU5ErkJggg==',
  gold:'data:image/png;base64,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',
  dia:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAACEUlEQVR4nO3bMVLDMBSE4YWh5AKUXCX3yAwtJ6JlxvfIVSi5QHpo7GA7kWMnkt5q+L+KDIkt9j3JxnYkAAAAAAAAAAAAAAAAAEBWD9EDWPLy9vWz9Pvvz1fr8a9h9wfMQ9+9X37f4WP6utVi2Ax6HHwq9JRxMVorRPhgJx2/l3bPt23ncJTU/b1upRCPkTvPFb7Uf3af2LaxsC45BdSHdk/4Y4dj/0M/G9xnQsgMKBX+ZFv72b5MVS/A2VlOxvBT23QuQtUC5Fzzr2nlmFCtAPPwqzEvQuhZECoV4FL3l1x+BvMD8tlYDDADghUvgFvHSV5jqjsDah58nfa9gCUoWNECOE31OZexhc2A0zWbxvdxL5agYBQgWN0CdNOXJZeIs213F98WLnwGlChCC2v/ILwAUt7AWgpfiihAYinIEVxyG6bLj1S4AFtvB95ThK2fdblVGbMELXTkLUVY/Ixx90vSU9ieOyWvz4wDTV22XlUo8/ClSk9FJP/tL32BLFEAl+VHij4LKtmhDXS/VPG5oKsXv3LNhivBO3W/FD0DxnJ0bCNdP1a1G1ZfAt46G1YG79b9UsCjiZuvw6eKsbHbHcOXgp4NrX0zxDV8KegYUDMQ5/ClwINwjWDcw5eCz4JKBtRC+JLBN2QGuY4LrQQ/sBvsrYVoLfiB9aD/w9dUAQAAAAAAAAAAAAAAAAAAAADI4Bew1Z/VhHiMKQAAAABJRU5ErkJggg==',
  em:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAADyklEQVR4nO3ZS28bVRjG8f+Zi+NL6lAqURMhIRQJIbrNGgk2WfBdgCWfg4+CxKKwY80GhKKqamlRq8QpwkmcZOx4xnNYjC9jewhImdhnqucXRbKPZ/H6fc6ZOTMGEREREREREREREREREREREREREREREZFbM5su4P/aO2ja/Puvv/9896utH443VU9ZnA+gsx/Yg28/Xhn//afXnL1MeP44cv473MTp4qfN3/5gtczL1/atCMHZwvPND9vzcd/3AYgvIDq2PPn5iOPfBpUNIdh0AUXyza+1wW9k457nLxzXxPDJZ7vAEYCtYghOBvDFN3sLzffC1eZP5UN4/jhab6ElcC6Azn5g73242PztVnvluIir2evm5Ey6d9Cs3CrwNl1Aka13bm4+QLPRwgvBr0N4bz7+3fWX76+nynI4twIePmrgN7Pmt5pZZ/NT2kzeWaDV2GZgIiBde51lcW4F1Hd8/DCb4RgwhiwBA8aY+evJ8Y16k6DmMejHmyv6FpwLwK8ZTMCk0fOZbZZ3zLkQUpPSaIfrKrFUzgVgvKytUdIHwGJXmz87GAbJZXY+Apr3a+sosVTOBYBhVtXVaB5CkSi5XFNRd8e5AO4/mpz3J6L4AlvwV9T86HS0xkrL4dwuqLm7OhbFFwB4pvhmjBRdhMtS24Fe9Kbws9SOVwcNdE9O7riqu+NcAH4jO98XhVC0AnrRicOPFP+bcwFgLTYFbBbCdNYXNb8/7BGYkLg/H6vajzTOBRBfpNgxCyEU6Q97YCFNYHyWbT+v/tZF+NZO/xjzsB3gTbb0YRByeX0OgO/lyp00P674TtS5FdA7HJMMIB2BT4hPmN1oWRiPk9lrkwbEl9kPM6NhtgNqPdCN2K39+WPC6aEhGYA3DrEpC/9JkhCPEob9hPgC+q8Szp5U9yrs3CkIoPeroVYPaXxa/Pn4Opv5wzeGwasQmybrLbBETgZQC2ucHVpqW4b23upjiGnzz59lq6IWVPNBHDgawLDrU++MOX8KYGi8txhCvvn22jD8y+fsZTVXgZMBgGXY9YExPPXpP1s9x+ebP30cqm1oSayxGMsshMaD1ZuwheYbW8nmg6MBjK5iaq1wIYT69mKp+eafHw02UmcZnNy/dfYD2/no3UkI098kob6TD2He/O6LHgDdXxInv89NnFwBAN0XPeYhZGPD8/kjZ2sso6t41vyqcnbGdPYDC8xCWLbc/CrOfnA4AFgMYdnb0HxwPACYh/Bvqtx8qEAAU8tBVL3xIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIl+gdHQ3kWOO7ouQAAAABJRU5ErkJggg=='
};
const get=(x,y,z)=>(y<0||x<0||z<0||x>=W||z>=D||y>=H)?0:B[ix(x,y,z)];
const P={5:[0xb58a4e],6:[0xddd6a0],7:[0xddeeff],12:[0xe8dfb0],13:[0xd9d9d9,0xd83030],14:[0xffd23d],15:[0x4de8e0],16:[0x2c2036]};TC.forEach((c,i)=>{P[i+1]=[c];P[8+i]=[c,0xe8e4d8,0x7a4a2b]});
const F=[[[1,0,0],[1,0,0],[1,1,0],[1,1,1],[1,0,1],.8,1],[[-1,0,0],[0,0,0],[0,0,1],[0,1,1],[0,1,0],.8,1],[[0,1,0],[0,1,0],[0,1,1],[1,1,1],[1,1,0],1,0],[[0,-1,0],[0,0,0],[1,0,0],[1,0,1],[0,0,1],.5,2],[[0,0,1],[0,0,1],[1,0,1],[1,1,1],[0,1,1],.65,1],[[0,0,-1],[0,0,0],[0,1,0],[1,1,0],[1,0,0],.65,1]];
const lowEnd=(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4)||(navigator.deviceMemory&&navigator.deviceMemory<=4);
const R=new THREE.WebGLRenderer({antialias:!lowEnd,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,lowEnd?1:1.5));document.body.prepend(R.domElement);
const sky=0x8fc8ee,sc=new THREE.Scene();sc.background=new THREE.Color(sky);sc.fog=new THREE.Fog(sky,40,120);
const cam=new THREE.PerspectiveCamera(72,1,.05,200);cam.rotation.order='YXZ';sc.add(cam);
const hand=new THREE.Group(),handMat=new THREE.MeshBasicMaterial({color:0xe8b98a}),swordMat=new THREE.MeshBasicMaterial({color:0xc9c9c9});
const arm=new THREE.Mesh(new THREE.BoxGeometry(.18,.18,.55),handMat);arm.position.set(.52,-.42,-.78);arm.rotation.x=-.35;
const blade=new THREE.Mesh(new THREE.BoxGeometry(.10,.58,.10),swordMat);blade.position.set(.55,-.18,-.94);blade.rotation.z=-.28;
const guard=new THREE.Mesh(new THREE.BoxGeometry(.28,.06,.08),new THREE.MeshBasicMaterial({color:0x755438}));guard.position.set(.55,-.46,-.89);guard.rotation.z=-.28;
hand.add(arm,blade,guard);cam.add(hand);let swing=0;
const iconTex={};
for(const k of Object.keys(RI)){const t=new THREE.TextureLoader().load(RI[k]);t.magFilter=t.minFilter=THREE.NearestFilter;iconTex[k]=t}
const genSprites=[];
function genIcon(k,x,y,z,scale=1.25){
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:iconTex[k],transparent:true,depthWrite:false}));
  sp.position.set(x,y,z);sp.scale.set(scale,scale,1);sc.add(sp);genSprites.push(sp);return sp;
}
IS.forEach(([x,z])=>{genIcon('iron',x-.45,12.15,z+.5,.9);genIcon('gold',x+1.35,12.15,z+.5,.9)});
DI.forEach(([x,z])=>genIcon('dia',x+.5,12.2,z+.5,1.1));
genIcon('em',EM[0]+.5,13.2,EM[1]+.5,1.25);
const cvT=document.createElement('canvas');cvT.width=128;cvT.height=16;const c2=cvT.getContext('2d');let sd=3;const rn=()=>(sd=(sd*16807)%2147483647)/2147483647;
for(let t=0;t<5;t++)for(let x=0;x<16;x++)for(let y=0;y<16;y++){let v=.84+rn()*.16;
if(t===0)v=(x+y)%4<2?v:v-.09;if(t===1)v=y%5===0?.62:(x+(y/5|0)*7)%16===0?.7:v;if(t===2)v=rn()<.16?.66:v;if(t===3)v=y<3?.72:v;if(t===4)v=(y>5&&y<11)?.97:v;
c2.fillStyle=`rgb(${v*255|0},${v*255|0},${v*255|0})`;c2.fillRect(t*16+x,y,1,1)}
const tex=new THREE.CanvasTexture(cvT);tex.magFilter=tex.minFilter=THREE.NearestFilter;
const tl=b=>b<5?0:b===5?1:b===13?4:b>=8&&b<=11?3:2,mat=new THREE.MeshBasicMaterial({map:tex,vertexColors:true,side:THREE.FrontSide}),M={},dirty=new Set();
function build(cx,cz){const p=[],c=[],i=[],u=[],col=new THREE.Color();let n=0;
for(let x=cx*CS;x<cx*CS+CS;x++)for(let z=cz*CS;z<cz*CS+CS;z++)for(let y=0;y<H;y++){const b=B[ix(x,y,z)];if(!b)continue;
const v=.94+((x*73856093^y*19349663^z*83492791)>>>0)%100/1600,pp=P[b];
for(const f of F){const d=f[0];if(get(x+d[0],y+d[1],z+d[2]))continue;col.setHex(pp[f[6]]??pp[0]).multiplyScalar(f[5]*v);
for(let k=1;k<5;k++){p.push(x+f[k][0],y+f[k][1],z+f[k][2]);c.push(col.r,col.g,col.b);u.push((tl(b)+.02+.96*[0,1,1,0][k-1])/8,.02+.96*[0,0,1,1][k-1])}
i.push(n,n+1,n+2,n,n+2,n+3);n+=4}}
const k=cx+','+cz;if(M[k]){sc.remove(M[k]);M[k].geometry.dispose()}
const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(u,2));g.setIndex(i);
M[k]=new THREE.Mesh(g,mat);sc.add(M[k])}
function sb(x,y,z,v,f){if(x<0||z<0||y<0||x>=W||z>=D||y>=H)return;B[ix(x,y,z)]=v;pf[ix(x,y,z)]=f;const a=Math.floor(x/CS),b=Math.floor(z/CS);dirty.add(a+','+b);
if(x%CS==0)dirty.add((a-1)+','+b);if(x%CS==CS-1)dirty.add((a+1)+','+b);if(z%CS==0)dirty.add(a+','+(b-1));if(z%CS==CS-1)dirty.add(a+','+(b+1))}
function flush(max=2){let n=0;for(const q of [...dirty]){if(n++>=max)break;dirty.delete(q);const[u,w]=q.split(',').map(Number);if(u>=0&&w>=0&&u<W/CS&&w<D/CS)build(u,w)}}
for(let a=0;a<W/CS;a++)for(let b=0;b<D/CS;b++)build(a,b);
const sel=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01,1.01,1.01)),new THREE.LineBasicMaterial({color:0}));sel.visible=false;sc.add(sel);
// jogador local
const pl={x:0,y:11.02,z:0,vx:0,vy:0,vz:0,kx:0,kz:0,g:false,yaw:0,pitch:-.2},me={id:0,team:0,hp:20,alive:1};
const hit=(x,y,z)=>{for(let a=Math.floor(x-.3);a<=Math.floor(x+.3);a++)for(let b=Math.floor(y);b<=Math.floor(y+1.75);b++)for(let c=Math.floor(z-.3);c<=Math.floor(z+.3);c++)if(get(a,b,c))return true;return false};
const playerIntersectsBlock=(x,y,z,px=pl.x,py=pl.y,pz=pl.z)=>px+.34>x&&px-.34<x+1&&pz+.34>z&&pz-.34<z+1&&py+.03<y+1&&py+1.77>y;
function safePlaceTarget(x,y,z){
  if(playerIntersectsBlock(x,y,z))return false;
  const nx=pl.x+(pl.vx||0)*.10,nz=pl.z+(pl.vz||0)*.10,ny=pl.y+Math.max(0,pl.vy||0)*.10;
  return !playerIntersectsBlock(x,y,z,nx,ny,nz);
}
function unstick(){
  if(!hit(pl.x,pl.y,pl.z))return;
  for(const dy of [.25,.5,.75,1,1.25,1.5,2]){if(!hit(pl.x,pl.y+dy,pl.z)){pl.y+=dy;pl.vy=Math.max(0,pl.vy);send({t:'mv',x:pl.x,y:pl.y,z:pl.z,yaw:pl.yaw,pitch:pl.pitch});return}}
  const dirs=[[.55,0],[-.55,0],[0,.55],[0,-.55]];
  for(const [dx,dz] of dirs){if(!hit(pl.x+dx,pl.y,pl.z+dz)){pl.x+=dx;pl.z+=dz;return}}
}
function step(e,dt){const k=Math.max(0,1-5*dt),vx=e.vx+e.kx,vz=e.vz+e.kz;e.kx*=k;e.kz*=k;
let n=e.x+vx*dt;if(!hit(n,e.y,e.z))e.x=n;n=e.z+vz*dt;if(!hit(e.x,e.y,n))e.z=n;
e.vy-=28*dt;n=e.y+e.vy*dt;e.g=false;if(!hit(e.x,n,e.z))e.y=n;else{if(e.vy<0)e.g=true;e.vy=0}}
// estado
const K={},SL=['Espada','Lã','Tábuas','End Stone','Vidro','Obsidiana','TNT','Maçã','Arco','B. Fogo','B. Neve','Pérola','Veloc.','Salto','Invis.'],KY=[0,'wool','planks','endstone','glass','obsidian','tnt','apple','bow','fireball','snowball','pearl','speedPotion','jumpPotion','invisPotion'],SC=['#ccc','#3d6fe0','#b58a4e','#e8dfb0','#ddecff','#2c2036','#d83030','#ffd23d','#8b5a2b','#ff7a20','#eef6ff','#7b3fc6','#55ddff','#aaff55','#bbbbff'],SN=['Punho','Pedra','Ferro','Diamante'],AN=['nenhuma','ferro','diamante'],CN={iron:'ferro',gold:'ouro',dia:'diamante',em:'esmeralda'};
let inv={wool:0,planks:0,endstone:0,glass:0,obsidian:0,tnt:0,apple:0,bow:0,arrow:0,fireball:0,snowball:0,pearl:0,speedPotion:0,jumpPotion:0,invisPotion:0,iron:0,gold:0,dia:0,em:0},sw=0,ar=0,tools={pick:0,axe:0,shears:0},fxs={speed:0,jump:0,invis:0},up={sharp:0,prot:0,forge:0,regen:0,trap:0},cur=1,started=0,over=0,shopOpen=0,bed=[1,1,1,1],INFO={},tg=null,ws;const clk=[],PL=new Map(),PT=[];
let AC,masterGain,lastStep=0,lastPickup=0;
const audioInit=()=>{try{if(!AC){AC=new AudioContext();masterGain=AC.createGain();masterGain.gain.value=.55;masterGain.connect(AC.destination)}if(AC.state==='suspended')AC.resume()}catch(e){}};
const tone=(f,d=.1,ty='square',v=.05,slide=0)=>{try{audioInit();const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;o.type=ty;o.frequency.setValueAtTime(Math.max(20,f),t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f+slide),t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(masterGain);o.start();o.stop(t+d)}catch(e){}};
const noise=(d=.08,v=.035,cut=1200)=>{try{audioInit();const n=Math.max(1,Math.floor(AC.sampleRate*d)),buf=AC.createBuffer(1,n,AC.sampleRate),a=buf.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);const src=AC.createBufferSource(),g=AC.createGain(),lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=cut;g.gain.value=v;src.buffer=buf;src.connect(lp);lp.connect(g);g.connect(masterGain);src.start()}catch(e){}};
const sfx=k=>{
  if(k==='place'){noise(.045,.025,900);tone(165,.045,'square',.022,-35)}
  else if(k==='break'){noise(.09,.04,1450);tone(110,.06,'triangle',.025,-45)}
  else if(k==='blocked'){tone(95,.06,'square',.035,-15)}
  else if(k==='buy'){tone(660,.055,'square',.035,220);setTimeout(()=>tone(880,.065,'square',.025,120),45)}
  else if(k==='pickup'){const n=performance.now();if(n-lastPickup<65)return;lastPickup=n;tone(780,.04,'sine',.025,180)}
  else if(k==='hurt'){noise(.05,.03,700);tone(130,.08,'sawtooth',.045,-55)}
  else if(k==='death'){tone(180,.12,'sawtooth',.05,-100);setTimeout(()=>tone(90,.22,'sawtooth',.04,-40),80)}
  else if(k==='hit'){tone(310,.045,'square',.035,-70)}
  else if(k==='crit'){tone(520,.055,'square',.045,120)}
  else if(k==='arrow'){tone(440,.055,'triangle',.025,-180)}
  else if(k==='snowball'){noise(.035,.02,1800);tone(240,.035,'sine',.018,-40)}
  else if(k==='fireball'){tone(85,.16,'sawtooth',.06,-45);noise(.12,.035,500)}
  else if(k==='pearl'){tone(210,.12,'sine',.04,260)}
  else if(k==='bed'){tone(160,.14,'square',.05,-80);setTimeout(()=>tone(80,.32,'sawtooth',.045,-30),90)}
  else if(k==='victory'){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,.16,'square',.035,40),i*90))}
  else if(k==='step'){noise(.035,.014,650)}
  else if(k==='jump'){tone(190,.05,'triangle',.018,60)}
};
const snd=(f,d=.1,ty='square',v=.05)=>tone(f,d,ty,v,0);
let mt;const msg=t=>{$('msg').textContent=t;clearTimeout(mt);mt=setTimeout(()=>$('msg').textContent='',2600)};
const uiCache=Object.create(null);const html=(id,v)=>{if(uiCache[id]!==v){uiCache[id]=v;$(id).innerHTML=v}};
function hud(){html('bar',SL.map((s,i)=>{let q=i?inv[KY[i]]:'';if(i===8)q=inv.bow?('F'+inv.arrow):0;return `<div class="s${i===cur?' on':''}" title="${s}" onclick="pick(${i})"><i style="background:${SC[i]}"></i><em>${i<9?i+1:''}</em><b>${q}</b></div>`}).join(''));
html('res',`<img class="ri" src="${RI.iron}">Ferro ${inv.iron}<br><img class="ri" src="${RI.gold}">Ouro ${inv.gold}<br><img class="ri" src="${RI.dia}">Diamante ${inv.dia}<br><img class="ri" src="${RI.em}">Esmeralda ${inv.em}`);
swordMat.color.setHex([0xc9c9c9,0x8f8f8f,0xd9d9d9,0x56e6ef][sw]||0xc9c9c9);html('hp',`Vida ${me.hp}/20<br>Espada: ${SN[sw]} · Armadura: ${AN[ar]}<br>Pic. ${tools.pick} · Machado ${tools.axe} · Tesoura ${tools.shears?'sim':'não'}<br>Afiação ${up.sharp} · Prot. ${up.prot} · Forja ${up.forge}${up.regen?' · Regen':''}${up.trap?' · Armadilha':''}<br>${fxs.speed>0?'⚡Veloc. ':''}${fxs.jump>0?'↥Salto ':''}${fxs.invis>0?'◌Invis. ':''}<br>CPS ${clk.filter(t=>performance.now()-t<1000).length}`);
html('tm',TN.map((n,t)=>{const o=Object.values(INFO).find(i=>i.t===t);return `<span style="color:#${hex(TC[t])}">■</span> ${o?o.n:'vazio'}: ${!o?'—':bed[t]?'cama':'sem cama'}`}).join('<br>'))}
const pick=n=>{cur=(n+SL.length)%SL.length;hud()};
let shopCat='Blocos';const cats=[...new Set(SH.map(s=>s[6]||'Outros'))];
function drawShop(){html('shopTabs',cats.map(c=>`<button onclick="shopCat='${c}';drawShop()">${c}</button>`).join(''));html('sl',SH.map((s,i)=>({s,i})).filter(o=>(o.s[6]||'Outros')===shopCat).map(o=>`<button onclick="send({t:'buy',i:${o.i}})"><img class="shopri" src="${RI[o.s[1]]||RI.iron}">${o.s[0]} — ${o.s[2]} ${CN[o.s[1]]}</button>`).join(''))}drawShop();
const scr=n=>['menu','lobby','ov','shop','end'].forEach(k=>$(k).style.display=k===n?'flex':'none'),cv=R.domElement;
function closeShop(){shopOpen=0;if(!touchMode)cv.requestPointerLock();else scr(null)}
document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement)scr(null);else if(started&&!over)scr(shopOpen?'shop':'ov')});
$('ov').onclick=()=>{audioInit();if(!touchMode)cv.requestPointerLock();else scr(null)};
// rede
const send=o=>{if(ws&&ws.readyState===1)ws.send(JSON.stringify(o))};
$('go').onclick=()=>{ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host);$('er').textContent='Conectando…';
ws.onopen=()=>{$('rc').textContent=$('rm').value;send({t:'join',name:$('nm').value||'Jogador',room:$('rm').value||'sala'})};
ws.onmessage=e=>on(JSON.parse(e.data));ws.onerror=()=>$('er').textContent='Não consegui conectar ao servidor.';ws.onclose=()=>{if(!over)msg('Conexão perdida')}};
$('st').onclick=()=>{send({t:'start'});if(!touchMode)cv.requestPointerLock()};
function mkp(id,t){const g=new THREE.Group(),m=c=>new THREE.MeshBasicMaterial({color:c}),info=INFO[id]||{n:'?'};
const bd=new THREE.Mesh(new THREE.BoxGeometry(.6,.6,.35),m(TC[t]));bd.position.y=.9;const hd=new THREE.Mesh(new THREE.BoxGeometry(.45,.45,.45),m(0xe8b98a));hd.position.y=1.5;g.add(bd,hd);
const lm=(x,y,w,h,c)=>{const q=new THREE.Mesh(new THREE.BoxGeometry(w,h,w).translate(0,-h/2,0),m(c));q.position.set(x,y,0);g.add(q)};
lm(-.15,.6,.25,.6,0x333366);lm(.15,.6,.25,.6,0x333366);lm(-.4,1.2,.2,.6,0xe8b98a);lm(.4,1.2,.2,.6,0xe8b98a);
const c=document.createElement('canvas');c.width=256;c.height=48;const x=c.getContext('2d');x.font='bold 30px monospace';x.textAlign='center';x.lineWidth=5;x.strokeStyle='#000';x.fillStyle='#fff';x.strokeText(info.n,128,34);x.fillText(info.n,128,34);
const lb=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false}));lb.scale.set(2,.38,1);lb.position.y=2.4;g.add(lb);
sc.add(g);return{m:g,tx:0,ty:0,tz:0,yaw:0,al:1,init:0}}
const FX_GEO=new THREE.BoxGeometry(.15,.15,.15),FX_MAT=new Map(),PJ=[];
const PJ_GEO={arrow:new THREE.BoxGeometry(.06,.06,.5),fireball:new THREE.SphereGeometry(.18,6,6),snowball:new THREE.SphereGeometry(.13,6,6),pearl:new THREE.SphereGeometry(.15,7,7)};
const PJ_MAT={arrow:new THREE.MeshBasicMaterial({color:0x9b6a3c}),fireball:new THREE.MeshBasicMaterial({color:0xff6a00}),snowball:new THREE.MeshBasicMaterial({color:0xffffff}),pearl:new THREE.MeshBasicMaterial({color:0x8b4bc7})};
function fx(x,y,z,c,n=8){let mm=FX_MAT.get(c);if(!mm){mm=new THREE.MeshBasicMaterial({color:c});FX_MAT.set(c,mm)}for(let i=0;i<n;i++){const m=new THREE.Mesh(FX_GEO,mm);m.position.set(x,y,z);sc.add(m);PT.push({m,vx:(Math.random()-.5)*8,vy:Math.random()*6,vz:(Math.random()-.5)*8,t:.6})}}
function projectile(m){const q=new THREE.Mesh(PJ_GEO[m.k]||PJ_GEO.snowball,PJ_MAT[m.k]||PJ_MAT.snowball);q.position.set(m.x,m.y,m.z);sc.add(q);PJ.push({m:q,x:m.x,y:m.y,z:m.z,tx:m.tx,ty:m.ty,tz:m.tz,t:0,d:m.k==='arrow'?.16:m.k==='fireball'?.28:.2});}
const DROP=new Map();
function syncDrops(l){const seen=new Set();l.forEach(d=>{seen.add(d.id);let o=DROP.get(d.id);if(!o){const tex=iconTex[d.k]||iconTex.iron,m=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));m.scale.set(.55,.55,1);sc.add(m);o={m};DROP.set(d.id,o)}o.m.position.set(d.x,d.y,d.z)});DROP.forEach((o,id)=>{if(!seen.has(id)){sc.remove(o.m);DROP.delete(id)}})}
function on(m){switch(m.t){
case'init':me.id=m.id;me.team=m.team;m.ed.forEach(a=>sb(...a));flush(999);syncDrops(m.drops||[]);pl.yaw=Math.atan2(IS[m.team][0]-32,IS[m.team][1]-32);break;
case'lobby':INFO={};m.l.forEach(([id,n,t])=>INFO[id]={n,t});
$('pl').innerHTML=m.l.map(([id,n,t])=>`<p style="color:#${hex(TC[t])}">■ ${n}${id===me.id?' (você)':''}${id===m.host?' ★ anfitrião':''}</p>`).join('');
$('st').style.display=me.id===m.host?'block':'none';$('wt').textContent=me.id===m.host?'Precisa de 2 ou mais jogadores.':'Aguardando o anfitrião iniciar.';scr('lobby');hud();break;
case'start':started=1;bed=m.bed;scr(touchMode||document.pointerLockElement?null:'ov');hud();break;
case's':{const seen=new Set();m.p.forEach(([id,x,y,z,yw,pt,hp,al,tm,iv])=>{seen.add(id);if(id===me.id){if(started&&me.alive&&!al)msg('Você morreu');me.hp=hp;me.alive=al;return}
let r=PL.get(id);if(!r)PL.set(id,r=mkp(id,tm));r.tx=x;r.ty=y;r.tz=z;r.yaw=yw;r.al=al;r.iv=iv;if(!r.init){r.init=1;r.m.position.set(x,y,z)}});
PL.forEach((r,id)=>{if(!seen.has(id)){sc.remove(r.m);PL.delete(id)}});break}
case'bb':m.l.forEach(a=>sb(...a));unstick();break;
case'breakp':breakDur=m.d;breakAt=performance.now();$('breakBox').style.display='block';break;
case'breakCancel':breaking=null;breakDur=0;$('breakBox').style.display='none';break;
case'drops':syncDrops(m.l);break;
case'tp':pl.x=m.x;pl.y=m.y;pl.z=m.z;pl.vy=0;pl.kx=pl.kz=0;break;
case'kb':pl.kx+=m.kx;pl.kz+=m.kz;pl.vy=Math.max(pl.vy,m.vy);sfx('hurt');break;
case'hitok':$('cross').style.transform='scale(1.9)';setTimeout(()=>$('cross').style.transform='',70);sfx(m.cr?'crit':'hit');msg((m.cr?'CRÍTICO · ':'')+'Vida inimiga: '+m.hp);break;
case'proj':projectile(m);sfx(m.k==='fireball'?'fireball':m.k==='arrow'?'arrow':m.k==='pearl'?'pearl':'snowball');break;
case'inv':inv=m.i;sw=m.sw;ar=m.ar;up=m.up;tools=m.tools||tools;fxs=m.fx||fxs;hud();break;
case'bed':bed=m.bed;sfx('bed');hud();break;
case'm':msg(m.s);break;case'sfx':sfx(m.k);break;case'fx':fx(m.x,m.y,m.z,m.c);if(m.c===0xff8a2a||m.c===0xff6a00)sfx('fireball');break;
case'err':$('er').textContent=m.s;scr('menu');break;
case'end':over=1;sfx('victory');document.exitPointerLock();$('et').textContent='Fim de jogo — venceu: '+m.w;scr('end');break}}
// entrada
const touchMode=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;let mx=0,my=0,mLook=null,mJoy=null;
addEventListener('keydown',e=>{K[e.code]=1;if(e.code>='Digit1'&&e.code<='Digit9')pick(+e.code[5]-1);
if(e.code==='KeyB'&&started&&!over){if(shopOpen)closeShop();else{const bx=IS[me.team][0]+.5,bz=IS[me.team][1]+.5;if(Math.hypot(pl.x-bx,pl.z-bz)>6||Math.abs(pl.y-11)>=4){msg('A loja só pode ser usada na sua base');return}shopOpen=1;document.exitPointerLock()}}});
addEventListener('keyup',e=>K[e.code]=0);addEventListener('wheel',e=>pick(cur+(e.deltaY>0?1:-1)));
addEventListener('mousemove',e=>{if(!document.pointerLockElement)return;pl.yaw-=e.movementX*.0023;pl.pitch=Math.max(-1.55,Math.min(1.55,pl.pitch-e.movementY*.0023))});
addEventListener('contextmenu',e=>e.preventDefault());
function ray(){
 const d=new THREE.Vector3();cam.getWorldDirection(d);let x=Math.floor(cam.position.x),y=Math.floor(cam.position.y),z=Math.floor(cam.position.z),prev=[x,y,z];
 const sx=d.x>0?1:-1,sy=d.y>0?1:-1,sz=d.z>0?1:-1,adx=Math.abs(1/(d.x||1e-9)),ady=Math.abs(1/(d.y||1e-9)),adz=Math.abs(1/(d.z||1e-9));
 let tx=((d.x>0?x+1:x)-cam.position.x)/(d.x||1e-9),ty=((d.y>0?y+1:y)-cam.position.y)/(d.y||1e-9),tz=((d.z>0?z+1:z)-cam.position.z)/(d.z||1e-9),dist=0;
 for(let n=0;n<20&&dist<=6;n++){if(get(x,y,z))return{h:[x,y,z],p:prev};prev=[x,y,z];if(tx<ty&&tx<tz){x+=sx;dist=tx;tx+=adx}else if(ty<tz){y+=sy;dist=ty;ty+=ady}else{z+=sz;dist=tz;tz+=adz}}
 return null
}
function playerTarget(){
  const d=new THREE.Vector3();cam.getWorldDirection(d);let best=null,bd=3.8;
  PL.forEach((r,id)=>{
    if(!r.al)return;
    const p=r.m.position,dx=p.x-pl.x,dy=p.y+.9-(pl.y+1.62),dz=p.z-pl.z,L=Math.hypot(dx,dy,dz);
    if(L>.01&&L<bd&&(dx*d.x+dy*d.y+dz*d.z)/L>.9){best=id;bd=L}
  });
  return best;
}
let breaking=null,breakAt=0,breakDur=0;
function primary(){if(!started||!me.alive)return;audioInit();swing=1;clk.push(performance.now());while(clk.length>40)clk.shift();const enemy=playerTarget();if(enemy!==null){send({t:'hit',id:enemy,yaw:pl.yaw,pitch:pl.pitch});return}if(tg){breaking=tg.h.join(',');breakAt=performance.now();breakDur=0;$('breakBox').style.display='none';send({t:'breakStart',x:tg.h[0],y:tg.h[1],z:tg.h[2]})}}
function stopBreak(){if(breaking){breaking=null;send({t:'breakStop'});$('breakBox').style.display='none'}}
function secondary(){if(!started||!me.alive)return;audioInit();const k=KY[cur];if(k==='apple')send({t:'apple'});else if(k==='bow')send({t:'shoot',k:'bow',yaw:pl.yaw,pitch:pl.pitch});else if(k==='fireball'||k==='snowball')send({t:'shoot',k,yaw:pl.yaw,pitch:pl.pitch});else if(['pearl','speedPotion','jumpPotion','invisPotion'].includes(k))send({t:'use',k,yaw:pl.yaw,pitch:pl.pitch});else if(cur>0&&tg&&tg.p){const[x,y,z]=tg.p;if(!safePlaceTarget(x,y,z)){sfx('blocked');msg('Não é possível colocar um bloco dentro do jogador');return}send({t:'place',k,x,y,z})}}
addEventListener('mousedown',e=>{if(!(document.pointerLockElement||touchMode))return;if(e.button===0)primary();else if(e.button===2)secondary()});
addEventListener('mouseup',e=>{if(e.button===0)stopBreak()});
if(touchMode){
 const joy=$('joy'),kn=$('knob'),look=$('look');
 const jmove=e=>{const t=[...e.touches].find(t=>t.identifier===mJoy);if(!t)return;const r=joy.getBoundingClientRect(),dx=t.clientX-(r.left+r.width/2),dy=t.clientY-(r.top+r.height/2),L=Math.max(1,Math.hypot(dx,dy)),k=Math.min(1,50/L);mx=dx/50*k;my=-dy/50*k;kn.style.transform=`translate(${mx*36}px,${-my*36}px)`};
 joy.addEventListener('touchstart',e=>{mJoy=e.changedTouches[0].identifier;jmove(e)},{passive:false});joy.addEventListener('touchmove',e=>{e.preventDefault();jmove(e)},{passive:false});joy.addEventListener('touchend',()=>{mx=my=0;mJoy=null;kn.style.transform=''},{passive:false});
 look.addEventListener('touchstart',e=>{const t=e.changedTouches[0];mLook={id:t.identifier,x:t.clientX,y:t.clientY}},{passive:false});look.addEventListener('touchmove',e=>{e.preventDefault();const t=[...e.touches].find(t=>mLook&&t.identifier===mLook.id);if(!t)return;pl.yaw-=(t.clientX-mLook.x)*.006;pl.pitch=Math.max(-1.55,Math.min(1.55,pl.pitch-(t.clientY-mLook.y)*.006));mLook.x=t.clientX;mLook.y=t.clientY},{passive:false});
 $('jumpBtn').ontouchstart=e=>{e.preventDefault();audioInit();if(pl.g){pl.vy=fxs.jump>0?10.5:8.2;pl.g=false;sfx('jump')}};$('actBtn').ontouchstart=e=>{e.preventDefault();primary()};$('actBtn').ontouchend=e=>{e.preventDefault();stopBreak()};$('useBtn').ontouchstart=e=>{e.preventDefault();secondary()};$('shopBtn').ontouchstart=e=>{e.preventDefault();if(shopOpen)closeShop();else{const bx=IS[me.team][0]+.5,bz=IS[me.team][1]+.5;if(Math.hypot(pl.x-bx,pl.z-bz)>6||Math.abs(pl.y-11)>=4){msg('A loja só pode ser usada na sua base');return}shopOpen=1;scr('shop')}};
}
const size=()=>{R.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()};addEventListener('resize',size);size();
let last=performance.now(),ls=0,acc=0;hud();
function tick(now){requestAnimationFrame(tick);const dt=Math.min((now-last)/1000,.05);last=now;acc+=dt;fxs.speed=Math.max(0,fxs.speed-dt);fxs.jump=Math.max(0,fxs.jump-dt);fxs.invis=Math.max(0,fxs.invis-dt);
if(started&&!over&&(document.pointerLockElement||touchMode)&&me.alive){
const fx_=-Math.sin(pl.yaw),fz=-Math.cos(pl.yaw),rx=Math.cos(pl.yaw),rz=-Math.sin(pl.yaw),mf=((K.KeyW?1:0)-(K.KeyS?1:0))+my,mr=((K.KeyD?1:0)-(K.KeyA?1:0))+mx,l=Math.hypot(mf,mr)||1,cr=!!K.ShiftLeft,sp=cr?1.8:(fxs.speed>0?6.2:4.6);
pl.vx=(fx_*mf+rx*mr)/l*sp;pl.vz=(fz*mf+rz*mr)/l*sp;
if(cr&&pl.g){const gr=(x,z)=>hit(x,pl.y-.15,z);if(!gr(pl.x+pl.vx*.12,pl.z))pl.vx=0;if(!gr(pl.x,pl.z+pl.vz*.12))pl.vz=0}
if(K.Space&&pl.g){pl.vy=fxs.jump>0?10.5:8.2;pl.g=false;sfx('jump')}step(pl,dt);
if(pl.g&&Math.hypot(pl.vx,pl.vz)>.8&&now-lastStep>(cr?430:300)){lastStep=now;sfx('step')}
if(now-ls>50){ls=now;send({t:'mv',x:pl.x,y:pl.y,z:pl.z,yaw:pl.yaw,pitch:pl.pitch})}}
const lerpA=1-Math.exp(-12*dt);
PL.forEach(r=>{const p=r.m.position;p.x+=(r.tx-p.x)*lerpA;p.y+=(r.ty-p.y)*lerpA;p.z+=(r.tz-p.z)*lerpA;r.m.rotation.y=r.yaw;r.m.visible=!!r.al&&!r.iv;
const mv=Math.hypot(r.tx-p.x,r.tz-p.z)>.05?Math.sin(now/90)*.7:0;const c=r.m.children;c[2].rotation.x=mv;c[3].rotation.x=-mv;c[4].rotation.x=-mv;c[5].rotation.x=mv});
for(let i=PT.length;i--;){const p=PT[i];p.t-=dt;p.vy-=20*dt;p.m.position.x+=p.vx*dt;p.m.position.y+=p.vy*dt;p.m.position.z+=p.vz*dt;if(p.t<=0){sc.remove(p.m);PT.splice(i,1)}}
for(let i=PJ.length;i--;){const p=PJ[i];p.t+=dt;const a=Math.min(1,p.t/p.d);p.m.position.set(p.x+(p.tx-p.x)*a,p.y+(p.ty-p.y)*a,p.z+(p.tz-p.z)*a);if(a>=1){sc.remove(p.m);PJ.splice(i,1)}}
DROP.forEach((o,id)=>{o.m.position.y+=Math.sin(now/250+id)*.0007;o.m.material.rotation=now/1200});
swing=Math.max(0,swing-dt*5);hand.rotation.z=-Math.sin((1-swing)*Math.PI)*.75;hand.rotation.x=Math.sin((1-swing)*Math.PI)*.28;hand.visible=started&&me.alive&&cur===0;
flush(lowEnd?1:2);if(breaking&&breakDur){const a=Math.min(1,(performance.now()-breakAt)/1000/breakDur);$('breakFill').style.width=(a*100)+'%';if(a>=1){breaking=null;$('breakBox').style.display='none'}}if(acc>.25){acc=0;hud()}
cam.position.set(pl.x,pl.y+(K.ShiftLeft?1.42:1.62),pl.z);cam.rotation.set(pl.pitch,pl.yaw,0);
tg=me.alive&&started?ray():null;sel.visible=!!tg;if(tg)sel.position.set(tg.h[0]+.5,tg.h[1]+.5,tg.h[2]+.5);
R.render(sc,cam)}
requestAnimationFrame(tick);
