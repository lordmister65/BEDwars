const fs=require('fs');
const path='public/game.js';
let s=fs.readFileSync(path,'utf8');
function rep(from,to,label){const n=s.split(from).length-1;if(n!==1)throw new Error(`${label}: expected 1 match, found ${n}`);s=s.replace(from,to)}
rep(
"const mat=new THREE.MeshBasicMaterial({map:tex,vertexColors:true,side:THREE.FrontSide,transparent:true,alphaTest:.08}),M={},dirty=new Set();\nfunction build(cx,cz){const p=[],c=[],i=[],u=[],col=new THREE.Color();let n=0;",
`const mat=new THREE.MeshBasicMaterial({map:tex,vertexColors:true,side:THREE.FrontSide,transparent:true,alphaTest:.08}),M={},dirty=new Set();\n\n// Camas visuais: o bloco 8-11 continua existindo no voxel para colisão e destruição,\n// mas não é mais desenhado como cubo. O modelo abaixo é apenas visual.\nconst BED_VIS=[];\nfunction bedPart(g,w,h,d,color,x,y,z){\n const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({color}));\n m.position.set(x,y,z);g.add(m);return m\n}\nfunction removeBedVisual(team){\n const g=BED_VIS[team];if(!g)return;sc.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose&&o.material.dispose()});BED_VIS[team]=null\n}\nfunction clearBedVisuals(){for(let t=0;t<BED_VIS.length;t++)removeBedVisual(t)}\nfunction createBedVisual(team,pos,spawn){\n const g=new THREE.Group(),wood=0x75472c,darkWood=0x4d2f20,linen=0xf3f0e8,teamColor=TC[team]||0xffffff;\n // Estrado e pés.\n bedPart(g,.96,.16,1.62,wood,0,.24,0);\n for(const x of[-.39,.39])for(const z of[-.68,.68])bedPart(g,.14,.34,.14,darkWood,x,.17,z);\n // Colchão, cobertor e travesseiro.\n bedPart(g,.88,.22,1.48,linen,0,.42,0);\n bedPart(g,.90,.12,.88,teamColor,0,.59,-.27);\n bedPart(g,.62,.14,.32,0xffffff,0,.60,.52);\n // Cabeceira com travessa, deixando a silhueta claramente parecida com cama.\n for(const x of[-.42,.42])bedPart(g,.13,.82,.13,darkWood,x,.43,.79);\n bedPart(g,.98,.16,.13,wood,0,.70,.79);\n bedPart(g,.78,.11,.10,teamColor,0,.48,.79);\n const sx=spawn?.[0]??pos[0]+.5,sz=spawn?.[2]??pos[2]-.5,dx=pos[0]+.5-sx,dz=pos[2]+.5-sz;\n g.rotation.y=Math.atan2(dx,dz);g.position.set(pos[0]+.5,pos[1],pos[2]+.5);g.userData={bedTeam:team,bedPos:pos};\n sc.add(g);BED_VIS[team]=g\n}\nfunction syncBedVisuals(meta=worldMeta,state=null){\n clearBedVisuals();(meta?.BD||[]).forEach((pos,t)=>{if(!pos)return;if(state&&state[t]===0)return;if(B[ix(pos[0],pos[1],pos[2])]!==8+t)return;createBedVisual(t,pos,meta.SPAWN?.[t])})\n}\n\nfunction build(cx,cz){const p=[],c=[],i=[],u=[],col=new THREE.Color();let n=0;`,
'insert bed visuals');
rep(
"for(let x=cx*CS;x<cx*CS+CS;x++)for(let z=cz*CS;z<cz*CS+CS;z++){if(!inXZ(x,z))continue;for(let y=0;y<H;y++){const b=B[ix(x,y,z)];if(!b)continue;\nconst v=.96+((x*73856093^y*19349663^z*83492791)>>>0)%100/2200;\nfor(const f of F){const d=f[0];if(get(x+d[0],y+d[1],z+d[2]))continue;col.setHex(blockTint(b,f[6])).multiplyScalar(f[5]*v);",
"for(let x=cx*CS;x<cx*CS+CS;x++)for(let z=cz*CS;z<cz*CS+CS;z++){if(!inXZ(x,z))continue;for(let y=0;y<H;y++){const b=B[ix(x,y,z)];if(!b||b>=8&&b<=11)continue;\nconst v=.96+((x*73856093^y*19349663^z*83492791)>>>0)%100/2200;\nfor(const f of F){const d=f[0],nb=get(x+d[0],y+d[1],z+d[2]);if(nb&&!(nb>=8&&nb<=11))continue;col.setHex(blockTint(b,f[6])).multiplyScalar(f[5]*v);",
'hide voxel bed cubes');
rep(
"function sb(x,y,z,v,f){if(!inXZ(x,z)||y<0||y>=H)return;B[ix(x,y,z)]=v;pf[ix(x,y,z)]=f;const a=Math.floor(x/CS),b=Math.floor(z/CS),mx=((x%CS)+CS)%CS,mz=((z%CS)+CS)%CS;dirty.add(a+','+b);activeChunks.add(a+','+b);",
"function sb(x,y,z,v,f){if(!inXZ(x,z)||y<0||y>=H)return;const bi=ix(x,y,z),old=B[bi];B[bi]=v;pf[bi]=f;if(old>=8&&old<=11&&old!==v)removeBedVisual(old-8);const a=Math.floor(x/CS),b=Math.floor(z/CS),mx=((x%CS)+CS)%CS,mz=((z%CS)+CS)%CS;dirty.add(a+','+b);activeChunks.add(a+','+b);",
'sync removed bed blocks');
rep(
"activeChunks=new Set(serverChunks||g.activeChunks||[]);dirty.clear();\n Object.keys(M).forEach(k=>{if(!activeChunks.has(k)){sc.remove(M[k]);M[k].geometry.dispose();delete M[k]}});\n activeChunks.forEach(k=>dirty.add(k));updateGeneratorIcons(g);updateVendors(g,lobby);flush(999);",
"activeChunks=new Set(serverChunks||g.activeChunks||[]);dirty.clear();\n Object.keys(M).forEach(k=>{if(!activeChunks.has(k)){sc.remove(M[k]);M[k].geometry.dispose();delete M[k]}});\n activeChunks.forEach(k=>dirty.add(k));updateGeneratorIcons(g);updateVendors(g,lobby);syncBedVisuals(g);flush(999);",
'load map beds');
rep(
"case'start':currentMode=m.modeId||currentMode;loadMap(m.mapId||currentMap,false,m.activeChunks);started=1;bed=m.bed;matchTime=0;",
"case'start':currentMode=m.modeId||currentMode;loadMap(m.mapId||currentMap,false,m.activeChunks);started=1;bed=m.bed;syncBedVisuals(worldMeta,bed);matchTime=0;",
'start bed state');
rep(
"inv=m.inv||inv;sw=m.sw??sw;ar=m.ar??ar;tools=m.tools||tools;up=m.up||up;fxs=m.fx||fxs;started=m.st==='play';over=m.st==='ended';if(m.admin)setAdminMode(true,m.adminPlayers||[]);hud();scr(started?null:'lobby');break;",
"syncBedVisuals(worldMeta,bed);inv=m.inv||inv;sw=m.sw??sw;ar=m.ar??ar;tools=m.tools||tools;up=m.up||up;fxs=m.fx||fxs;started=m.st==='play';over=m.st==='ended';if(m.admin)setAdminMode(true,m.adminPlayers||[]);hud();scr(started?null:'lobby');break;",
'reconnect bed state');
rep(
"case'bed':bed=m.bed;sfx('bed');bedBurst(m.team,m.pos);hud();renderScoreboard(true);break;",
"case'bed':bed=m.bed;removeBedVisual(m.team);sfx('bed');bedBurst(m.team,m.pos);hud();renderScoreboard(true);break;",
'bed event visual removal');
fs.writeFileSync(path,s);console.log('Bed visual model applied');
