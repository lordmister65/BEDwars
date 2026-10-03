const fs=require('fs');
const must=(src,a,label)=>{if(!src.includes(a))throw new Error('missing '+label)};
let server=fs.readFileSync('server.js','utf8');
const pickupAnchor="function pickupDrops(R, players){";
must(server,pickupAnchor,'pickupDrops');
server=server.replace(pickupAnchor,`function genSnapshot(R){
  const players=[...R.ps.values()];
  const base=R.g.base.map((g,i)=>{const o=players.find(q=>q.team===i),fm=1+.5*(o?o.up.forge:0);return [+(Math.max(0,1.2/fm-g.iron)).toFixed(2),+(Math.max(0,5/fm-g.gold)).toFixed(2)]});
  const dia=R.g.dia.map(g=>+(Math.max(0,12-g.t)).toFixed(2));
  return {base,dia,em:+Math.max(0,22-R.g.em.t).toFixed(2)};
}
function pickupDrops(R, players){`);
const snapNeed="bc(R,{t:'s',time:+R.t.toFixed(1),bed:R.bed,mapId:R.mapId,modeId:R.modeId,p:";
must(server,snapNeed,'snapshot');
server=server.replace(snapNeed,"bc(R,{t:'s',time:+R.t.toFixed(1),bed:R.bed,mapId:R.mapId,modeId:R.modeId,gen:genSnapshot(R),p:");
fs.writeFileSync('server.js',server);

let game=fs.readFileSync('public/game.js','utf8');
const genStart=game.indexOf('const genSprites=[],genPlatforms=[];');
const genEnd=game.indexOf('updateGeneratorIcons(gn);',genStart);
if(genStart<0||genEnd<0)throw new Error('generator block not found');
const genAfter=genEnd+'updateGeneratorIcons(gn);'.length;
const genCode=`const GEN_VIS=[];let genState={base:[],dia:[],em:0};
const RES_COLOR={iron:0xd7dde2,gold:0xffd33d,dia:0x55e7ef,em:0x42dc7a};
function resourceModel(k,scale=1){
 const g=new THREE.Group(),c=RES_COLOR[k]||0xffffff;
 if(k==='iron'||k==='gold'){
  const base=box(.42,.12,.24,k==='gold'?0xe3aa26:0xaeb8c0),top=box(.31,.08,.18,c),shine=box(.18,.025,.12,0xffffff);
  base.position.y=-.03;top.position.y=.065;shine.position.set(-.04,.115,.025);shine.material=shine.material.clone();shine.material.transparent=true;shine.material.opacity=.38;g.add(base,top,shine);
 }else{
  const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.22,0),hmat(c)),core=new THREE.Mesh(new THREE.OctahedronGeometry(.13,0),hmat(k==='dia'?0x1c9aa8:0x18884b));crystal.scale.set(1,.9,.72);core.scale.set(1,.9,.72);core.rotation.y=Math.PI/4;g.add(crystal,core);
 }
 g.scale.setScalar(scale);return g
}
function holoTexture(text,color='#fff'){
 const cv=document.createElement('canvas'),ctx=cv.getContext('2d'),lines=String(text).split('\\n');cv.width=512;cv.height=Math.max(96,52*lines.length);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 28px Silkscreen, monospace';ctx.lineWidth=6;ctx.strokeStyle='#000';lines.forEach((line,i)=>{const y=30+i*46;ctx.strokeText(line,256,y);ctx.fillStyle=i===0?color:'#fff';ctx.fillText(line,256,y)});const t=new THREE.CanvasTexture(cv);t.minFilter=t.magFilter=THREE.NearestFilter;return t
}
function setHologram(v,text,color){if(v.labelText===text)return;v.labelText=text;if(v.label.material.map)v.label.material.map.dispose();v.label.material.map=holoTexture(text,color);v.label.material.needsUpdate=true}
function newGenerator(x,y,z,type,size=7){
 const g=new THREE.Group(),accent=RES_COLOR[type==='base'?'gold':type]||0xffffff;
 const bottom=new THREE.Mesh(new THREE.CylinderGeometry(size*.46,size*.50,.24,8),hmat(0x43484e));bottom.position.y=.12;g.add(bottom);
 const mid=new THREE.Mesh(new THREE.CylinderGeometry(size*.39,size*.44,.13,8),hmat(0x767e86));mid.position.y=.305;g.add(mid);
 const plate=new THREE.Mesh(new THREE.CylinderGeometry(size*.31,size*.34,.065,8),hmat(0x252a2f));plate.position.y=.405;g.add(plate);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(size*.28,.045,6,24),hmat(accent));ring.rotation.x=Math.PI/2;ring.position.y=.455;g.add(ring);
 for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2,p=box(.22,.34,.22,0x9aa2aa);p.position.set(Math.cos(a)*size*.32,.29,Math.sin(a)*size*.32);p.rotation.y=-a;g.add(p)}
 const core=new THREE.Group();core.position.y=.83;g.add(core);
 if(type==='base'){const a=resourceModel('iron',.9),b=resourceModel('gold',.9);a.position.x=-.34;b.position.x=.34;core.add(a,b)}else core.add(resourceModel(type,1.18));
 const label=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthWrite:false}));label.position.set(0,2.0,0);label.scale.set(4.4,1.15,1);g.add(label);
 const particles=[];for(let i=0;i<(lowEnd?4:8);i++){const p=sphere(.035+(i%3)*.008,accent);p.material=p.material.clone();p.material.transparent=true;p.material.opacity=.72;p.userData={phase:i*.78,r:.5+(i%3)*.22,s:.6+(i%4)*.13};g.add(p);particles.push(p)}
 g.position.set(x,y,z);sc.add(g);const v={g,core,label,particles,type,labelText:'',phase:Math.random()*10};GEN_VIS.push(v);return v
}
function clearGeneratorVisuals(){while(GEN_VIS.length){const v=GEN_VIS.pop();sc.remove(v.g);v.g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const mm=Array.isArray(o.material)?o.material:[o.material];mm.forEach(m=>{if(m.map)m.map.dispose();m.dispose&&m.dispose()})}})}}
function updateGeneratorIcons(meta){clearGeneratorVisuals();(meta.GEN||[]).forEach(([x,y,z],i)=>{const v=newGenerator(x,y-.02,z,'base',7);v.index=i});(meta.DIGEN||[]).forEach(([x,y,z],i)=>{const v=newGenerator(x,y-.02,z,'dia',5);v.index=i});if(meta.EMGEN){const v=newGenerator(meta.EMGEN[0],meta.EMGEN[1]-.02,meta.EMGEN[2],'em',7);v.index=0}}
function updateGenerators(now){const t=now*.001;GEN_VIS.forEach(v=>{v.core.rotation.y=t*1.25+v.phase;v.core.position.y=.83+Math.sin(t*2+v.phase)*.09;v.particles.forEach((p,i)=>{const q=p.userData,a=t*q.s+q.phase,up=(t*q.s+i*.17)%1.25;p.position.set(Math.cos(a)*q.r,.58+up,Math.sin(a)*q.r);p.material.opacity=.25+.55*(1-up/1.25)});if(v.type==='base'){const r=genState.base[v.index]||[0,0];setHologram(v,'FERRO / OURO\\nFe '+Number(r[0]||0).toFixed(1)+'s · Au '+Number(r[1]||0).toFixed(1)+'s','#ffd85a')}else if(v.type==='dia'){setHologram(v,'DIAMANTE\\n'+Number(genState.dia[v.index]||0).toFixed(1)+'s','#67f3ff')}else setHologram(v,'ESMERALDA\\n'+Number(genState.em||0).toFixed(1)+'s','#55ff88')})}
updateGeneratorIcons(gn);`;
game=game.slice(0,genStart)+genCode+game.slice(genAfter);

const armorStart=game.indexOf('function syncRemoteArmor(r,tier){');
const armorEnd=game.indexOf('\nconst DROP=new Map();',armorStart);
if(armorStart<0||armorEnd<0)throw new Error('armor block not found');
const armorCode=`function armorPieceBox(w,h,d,c,x,y,z){const m=box(w,h,d,c);m.position.set(x,y,z);return m}
function makeVoxelArmor(tier){const g=new THREE.Group(),main=tier===2?0x54dfe9:0xd8dde2,edge=tier===2?0xb6ffff:0xffffff,dark=tier===2?0x1f8f9c:0x8b9299;const helm=new THREE.Group();helm.add(armorPieceBox(.62,.16,.58,main,0,.18,0),armorPieceBox(.12,.28,.58,dark,-.25,.02,0),armorPieceBox(.12,.28,.58,dark,.25,.02,0),armorPieceBox(.60,.08,.10,edge,0,.04,.27));helm.position.y=1.48;g.add(helm);g.add(armorPieceBox(.66,.55,.30,main,0,.92,0),armorPieceBox(.48,.14,.34,edge,0,1.18,0),armorPieceBox(.18,.18,.38,dark,-.40,1.12,0),armorPieceBox(.18,.18,.38,dark,.40,1.12,0),armorPieceBox(.58,.12,.31,dark,0,.60,0),armorPieceBox(.44,.18,.27,main,0,.47,0));for(const x of [-.17,.17])g.add(armorPieceBox(.22,.38,.25,main,x,.20,0),armorPieceBox(.25,.13,.34,dark,x,-.03,.055),armorPieceBox(.19,.05,.36,edge,x,.02,.08));if(tier===2){const gem=sphere(.065,0xc8ffff);gem.position.set(0,1.02,.19);g.add(gem)}return g}
function syncRemoteArmor(r,tier){if(r.armorTier===tier)return;r.armorTier=tier;while(r.armorRoot.children.length)r.armorRoot.remove(r.armorRoot.children[0]);if(!tier)return;r.armorRoot.add(makeVoxelArmor(tier))}`;
game=game.slice(0,armorStart)+armorCode+game.slice(armorEnd);

const dropStart=game.indexOf('const DROP=new Map();');
const dropEnd=game.indexOf('\nfunction on(m){',dropStart);
if(dropStart<0||dropEnd<0)throw new Error('drop block not found');
const dropCode=`const DROP=new Map();
function syncDrops(l){const seen=new Set();l.forEach(d=>{seen.add(d.id);let o=DROP.get(d.id);if(!o){const m=resourceModel(d.k,d.k==='iron'||d.k==='gold'?.82:.95);sc.add(m);o={m,k:d.k,baseY:d.y,phase:(d.id%17)*.37};DROP.set(d.id,o)}o.baseY=d.y;o.m.position.set(d.x,d.y,d.z);o.n=d.n});DROP.forEach((o,id)=>{if(!seen.has(id)){sc.remove(o.m);o.m.traverse(x=>{if(x.geometry)x.geometry.dispose();if(x.material)x.material.dispose&&x.material.dispose()});DROP.delete(id)}})}
function updateDropVisuals(now){const t=now*.001;DROP.forEach(o=>{o.m.rotation.y=t*1.8+o.phase;o.m.rotation.z=Math.sin(t*.9+o.phase)*.08;o.m.position.y=o.baseY+.15+Math.sin(t*2.6+o.phase)*.08})}`;
game=game.slice(0,dropStart)+dropCode+game.slice(dropEnd);

const snapAnchor="case's':{syncProjectiles(m.pr||[]);if(m.time!=null)matchTime=m.time;if(m.bed)bed=m.bed;";
must(game,snapAnchor,'client snapshot');
game=game.replace(snapAnchor,snapAnchor+"if(m.gen)genState=m.gen;");
const animAnchor="hand.visible=started&&me.alive;\nflush(lowEnd?1:2);";
must(game,animAnchor,'animation hook');
game=game.replace(animAnchor,"hand.visible=started&&me.alive;updateGenerators(now);updateDropVisuals(now);\nflush(lowEnd?1:2);");
fs.writeFileSync('public/game.js',game);
console.log('generator + armor overhaul applied');
