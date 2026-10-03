const fs=require('fs');
const p='public/game.js';
let s=fs.readFileSync(p,'utf8');
const rep=(a,b)=>{if(!s.includes(a))throw new Error('pattern not found: '+a.slice(0,120));s=s.replace(a,b)};

rep("const heldRoot=new THREE.Group();heldRoot.position.set(.52,-.26,-.92);hand.add(heldRoot);cam.add(hand);let swing=0,useAnim=0,lastHeldSig='',miningTool=null;",
"const heldRoot=new THREE.Group();const heldViewBase={x:.68,y:-.42,z:-1.02,rx:0,ry:0,rz:0};heldRoot.position.set(heldViewBase.x,heldViewBase.y,heldViewBase.z);hand.add(heldRoot);cam.add(hand);let swing=0,useAnim=0,lastHeldSig='',miningTool=null;");

const oldModels=`function blockModel(c,o=1){const g=new THREE.Group(),b=new THREE.Mesh(new THREE.BoxGeometry(.42,.42,.42),hmat(c,o));g.add(b);g.rotation.set(.15,.45,.05);return g}
function potionModel(c){const g=new THREE.Group(),body=box(.22,.28,.16,c),neck=box(.09,.10,.09,0xe9e9e9),cap=box(.12,.05,.12,0x7a5436);neck.position.y=.19;cap.position.y=.27;g.add(body,neck,cap);return g}
function bowModel(){const g=new THREE.Group();for(const y of [-.22,0,.22]){const b=box(.05,.25,.05,0x8a5a32);b.position.y=y;b.rotation.z=y?Math.sign(y)*.45:0;g.add(b)}const str=box(.018,.62,.018,0xe5e5e5);str.position.x=.10;g.add(str);g.rotation.z=-.25;return g}
function appleModel(){const g=new THREE.Group(),a=sphere(.18,0xffc928),st=box(.05,.12,.05,0x6d4828);st.position.y=.19;g.add(a,st);return g}
function tntModel(color=0xd7352f){const g=blockModel(color),band=box(.44,.13,.44,0xe8e0d2);band.position.y=0;g.add(band);return g}
function toolModel(k){const g=new THREE.Group(),h=box(.06,.48,.06,0x76513a);h.position.y=-.05;g.add(h);if(k==='pick'){const p=box(.42,.08,.08,0xbfc5c7);p.position.y=.22;g.add(p)}else if(k==='axe'){const p=box(.24,.26,.08,0xbfc5c7);p.position.set(.09,.18,0);g.add(p)}else{const a=box(.28,.05,.05,0xc7c7c7),b=a.clone();a.rotation.z=.5;b.rotation.z=-.5;a.position.y=b.position.y=.15;g.add(a,b)}g.rotation.z=-.45;return g}
function heldModel(slot,team=me.team,swordLevel=sw){
 const k=slotKey(slot);
 if(slot===0)return swordModel(swordLevel);
 if(k==='wool')return blockModel(TC[team]||0x3d6fe0);
 if(k==='planks')return blockModel(0xb58a4e);
 if(k==='endstone')return blockModel(0xe8dfb0);
 if(k==='glass')return blockModel(0xbfe9ff,.55);
 if(k==='obsidian')return blockModel(0x2c2036);
 if(['tnt','tntImpulse','tntSlow','tntDamage'].includes(k)){const t=TNT_TYPES.find(x=>x[0]===k);return tntModel(t?t[2]:0xd7352f)}
 if(k==='apple')return appleModel();
 if(k==='bow')return bowModel();
 if(k==='fireball')return sphere(.20,0xff6a00);
 if(k==='snowball')return sphere(.18,0xffffff);
 if(k==='pearl')return sphere(.18,0x8b4bc7);
 if(k==='speedPotion')return potionModel(0x55ddff);
 if(k==='jumpPotion')return potionModel(0xaaff55);
 if(k==='invisPotion')return potionModel(0xbbbbff);
 return new THREE.Group()
}
function refreshHeld(){
 const sig=miningTool?'tool:'+miningTool:'slot:'+cur+':'+slotKey(cur)+':'+sw+':'+me.team;
 if(lastHeldSig===sig)return;lastHeldSig=sig;
 while(heldRoot.children.length)heldRoot.remove(heldRoot.children[0]);
 heldRoot.add(miningTool?toolModel(miningTool):heldModel(cur));
 if(!miningTool)send({t:'held',s:cur});
}`;

const newModels=`function blockModel(c,o=1){const g=new THREE.Group(),core=new THREE.Mesh(new THREE.BoxGeometry(.40,.40,.40),hmat(c,o));g.add(core);const top=box(.31,.025,.31,0xffffff);top.material=top.material.clone();top.material.transparent=true;top.material.opacity=.13;top.position.y=.212;g.add(top);g.rotation.set(.15,.45,.05);return g}
function heldBlockModel(k,team){
 const c=k==='wool'?(TC[team]||0x3d6fe0):k==='planks'?0xb58a4e:k==='endstone'?0xe8dfb0:k==='glass'?0xbfe9ff:0x2c2036;
 const g=new THREE.Group();
 if(k==='planks'){for(let i=-1;i<=1;i++){const p=box(.42,.12,.38,i===0?0xc69a61:0xa87945);p.position.y=i*.13;g.add(p)}const band=box(.44,.035,.40,0x6f4b2d);g.add(band)}
 else if(k==='glass'){const core=box(.34,.34,.34,c);core.material=core.material.clone();core.material.transparent=true;core.material.opacity=.28;g.add(core);for(const [x,y,z,w,h,d] of [[0,.2,.2,.42,.035,.035],[0,.2,-.2,.42,.035,.035],[0,-.2,.2,.42,.035,.035],[0,-.2,-.2,.42,.035,.035],[.2,0,.2,.035,.42,.035],[-.2,0,.2,.035,.42,.035],[.2,0,-.2,.035,.42,.035],[-.2,0,-.2,.035,.42,.035]]){const e=box(w,h,d,0xdff8ff);e.position.set(x,y,z);g.add(e)}}
 else if(k==='obsidian'){const core=box(.36,.42,.36,c);g.add(core);for(const x of [-.18,.18]){const r=box(.045,.44,.32,0x49345d);r.position.x=x;g.add(r)}}
 else if(k==='endstone'){g.add(box(.40,.40,.40,c));for(const [x,y,z] of [[-.13,.21,-.08],[.12,.21,.11],[.21,.03,-.10]]){const n=box(.08,.035,.08,0xf4ecc2);n.position.set(x,y,z);g.add(n)}}
 else{g.add(box(.40,.40,.40,c));for(const y of [-.14,.14]){const seam=box(.415,.025,.415,0xffffff);seam.material=seam.material.clone();seam.material.transparent=true;seam.material.opacity=.10;seam.position.y=y;g.add(seam)}}
 g.rotation.set(.16,.48,.04);return g
}
function potionModel(c){const g=new THREE.Group(),liquid=box(.20,.20,.15,c),shoulder=box(.16,.08,.13,0xe7f5ff),neck=box(.085,.11,.085,0xe7f5ff),cap=box(.13,.055,.13,0x76513a);liquid.position.y=-.03;shoulder.position.y=.105;neck.position.y=.20;cap.position.y=.285;g.add(liquid,shoulder,neck,cap);for(const x of [-.095,.095]){const edge=box(.025,.20,.025,0xffffff);edge.material=edge.material.clone();edge.material.transparent=true;edge.material.opacity=.28;edge.position.set(x,-.03,.075);g.add(edge)}g.rotation.z=.12;return g}
function bowModel(){const g=new THREE.Group(),wood=0x8b5a32,dark=0x5b381f;for(const [x,y,rz] of [[0,.31,-.52],[.10,.14,-.22],[.10,-.14,.22],[0,-.31,.52]]){const b=box(.055,.25,.055,wood);b.position.set(x,y,0);b.rotation.z=rz;g.add(b)}const grip=box(.075,.20,.07,dark);grip.position.set(.12,0,0);g.add(grip);const str=box(.016,.75,.016,0xf0eee7);str.position.x=-.10;g.add(str);for(const y of [-.36,.36]){const tip=box(.07,.07,.07,0xc49a65);tip.position.set(-.02,y,0);g.add(tip)}g.rotation.z=-.30;return g}
function appleModel(){const g=new THREE.Group();for(const [x,y,z,s] of [[-.08,0,0,.24],[.08,0,0,.24],[0,.07,.04,.22],[0,-.07,-.02,.20]]){const a=box(s,s,s,0xffc928);a.position.set(x,y,z);g.add(a)}const st=box(.045,.14,.045,0x6d4828);st.position.y=.23;st.rotation.z=.18;const leaf=box(.13,.035,.07,0x55a33d);leaf.position.set(.075,.27,0);leaf.rotation.z=-.35;g.add(st,leaf);g.rotation.z=-.10;return g}
function tntModel(color=0xd7352f){const g=new THREE.Group(),core=box(.38,.42,.38,color);g.add(core);for(const y of [-.12,.12]){const band=box(.405,.085,.405,0xe8e0d2);band.position.y=y;g.add(band)}const cap=box(.22,.035,.22,0x5d4a3d);cap.position.y=.225;const fuse=box(.035,.16,.035,0x333333);fuse.position.set(.02,.31,0);fuse.rotation.z=.22;g.add(cap,fuse);return g}
function fireballModel(){const g=new THREE.Group(),core=sphere(.15,0xff6a00),inner=sphere(.10,0xffd24a);g.add(core,inner);for(let i=0;i<6;i++){const s=box(.05,.16,.05,i%2?0xff9b20:0xff3d12);const a=i*Math.PI/3;s.position.set(Math.cos(a)*.16,Math.sin(a)*.16,0);s.rotation.z=-a;g.add(s)}return g}
function snowballModel(){const g=new THREE.Group(),core=sphere(.17,0xf7fbff);g.add(core);for(const [x,y,z] of [[.08,.08,.12],[-.09,.04,.12],[.02,-.10,.13]]){const p=box(.045,.035,.02,0xd4e8f5);p.position.set(x,y,z);g.add(p)}return g}
function pearlModel(){const g=new THREE.Group(),core=sphere(.145,0x6d34a6),inner=sphere(.095,0xb66df2);g.add(core,inner);const ring=box(.34,.035,.035,0xd59cff);ring.rotation.z=.55;g.add(ring);return g}
function toolModel(k){const lvl=Math.max(1,tools[k]||1),metal=lvl>1?0xe5e8eb:0xbfc5c7,dark=lvl>1?0x90979e:0x7e8588,g=new THREE.Group(),h=box(.065,.52,.065,0x76513a);h.position.y=-.08;g.add(h);const grip=box(.085,.13,.085,0x4b3425);grip.position.y=-.30;g.add(grip);if(k==='pick'){const head=box(.44,.075,.09,metal);head.position.y=.22;g.add(head);for(const x of [-.22,.22]){const tip=box(.07,.15,.08,dark);tip.position.set(x,.17,0);tip.rotation.z=x<0?.32:-.32;g.add(tip)}}else if(k==='axe'){const head=box(.24,.25,.09,metal);head.position.set(.10,.16,0);g.add(head);const edge=box(.055,.29,.095,0xf3f6f7);edge.position.set(.23,.16,0);g.add(edge)}else{const a=box(.30,.045,.055,metal),b=a.clone();a.rotation.z=.55;b.rotation.z=-.55;a.position.y=b.position.y=.16;g.add(a,b);const pin=box(.07,.07,.07,dark);pin.position.y=.15;g.add(pin)}g.rotation.z=-.45;return g}
function heldModel(slot,team=me.team,swordLevel=sw){
 const k=slotKey(slot);
 if(slot===0)return swordModel(swordLevel);
 if(['wool','planks','endstone','glass','obsidian'].includes(k))return heldBlockModel(k,team);
 if(['tnt','tntImpulse','tntSlow','tntDamage'].includes(k)){const t=TNT_TYPES.find(x=>x[0]===k);return tntModel(t?t[2]:0xd7352f)}
 if(k==='apple')return appleModel();
 if(k==='bow')return bowModel();
 if(k==='fireball')return fireballModel();
 if(k==='snowball')return snowballModel();
 if(k==='pearl')return pearlModel();
 if(k==='speedPotion')return potionModel(0x55ddff);
 if(k==='jumpPotion')return potionModel(0xaaff55);
 if(k==='invisPotion')return potionModel(0xbbbbff);
 return new THREE.Group()
}
function heldView(slot,mining=false){
 const k=mining?miningTool:slotKey(slot);let v={x:.69,y:-.43,z:-1.03,rx:.02,ry:0,rz:0,scale:1};
 if(slot===0&&!mining)v={x:.78,y:-.53,z:-1.08,rx:.02,ry:-.08,rz:.02,scale:.93};
 else if(mining)v={x:.76,y:-.50,z:-1.05,rx:.03,ry:-.06,rz:0,scale:.96};
 else if(['wool','planks','endstone','glass','obsidian'].includes(k))v={x:.72,y:-.47,z:-1.00,rx:.02,ry:-.08,rz:0,scale:.88};
 else if(k==='bow')v={x:.76,y:-.44,z:-1.08,rx:.03,ry:-.12,rz:.04,scale:.96};
 else if(['speedPotion','jumpPotion','invisPotion','apple'].includes(k))v={x:.73,y:-.49,z:-.95,rx:.04,ry:-.06,rz:.02,scale:.92};
 else if(['fireball','snowball','pearl'].includes(k))v={x:.73,y:-.46,z:-.96,rx:0,ry:-.05,rz:0,scale:.92};
 else if(String(k).startsWith('tnt'))v={x:.72,y:-.47,z:-1.00,rx:.02,ry:-.08,rz:0,scale:.88};
 return v
}
function applyHeldView(){const v=heldView(cur,!!miningTool);Object.assign(heldViewBase,v);heldRoot.position.set(v.x,v.y,v.z);heldRoot.rotation.set(v.rx,v.ry,v.rz);heldRoot.scale.setScalar(v.scale)}
function refreshHeld(){
 const sig=miningTool?'tool:'+miningTool:'slot:'+cur+':'+slotKey(cur)+':'+sw+':'+me.team;
 if(lastHeldSig===sig)return;lastHeldSig=sig;
 while(heldRoot.children.length)heldRoot.remove(heldRoot.children[0]);
 heldRoot.add(miningTool?toolModel(miningTool):heldModel(cur));applyHeldView();
 if(!miningTool)send({t:'held',s:cur});
}`;
if(!s.includes(oldModels))throw new Error('model block not found');s=s.replace(oldModels,newModels);

const oldAnim=`hand.rotation.z=-sa*.86-ua*.24+ma+(movingGround?Math.sin(bobPhase*.5)*.025:0);
hand.rotation.x=sa*.34+ua*.18+Math.abs(ma)*.18+(movingGround?Math.abs(Math.sin(bobPhase))*.025:0);
hand.rotation.y=sa*.20;
heldRoot.rotation.x=-ua*.28-sa*.10;heldRoot.position.z=-.90+ua*.10-sa*.045;heldRoot.position.x=sa*.045;hand.position.x=bobX*.35;hand.position.y=-bobY*.5-sa*.025;
if(bowCharging){const br=Math.max(.2,Math.min(1,(now-bowChargeAt)/1200));$('bowChargeFill').style.width=(br*100)+'%';heldRoot.position.z=-.92-br*.08;heldRoot.rotation.y=-br*.18}
else heldRoot.rotation.y=0;if(!swing){hand.rotation.y*=Math.max(0,1-dt*14);heldRoot.position.x*=Math.max(0,1-dt*14)}`;
const newAnim=`hand.rotation.z=-sa*.86-ua*.24+ma+(movingGround?Math.sin(bobPhase*.5)*.025:0);
hand.rotation.x=sa*.34+ua*.18+Math.abs(ma)*.18+(movingGround?Math.abs(Math.sin(bobPhase))*.025:0);
hand.rotation.y=sa*.20;
heldRoot.rotation.x=heldViewBase.rx-ua*.28-sa*.10;heldRoot.rotation.z=heldViewBase.rz;heldRoot.position.z=heldViewBase.z+ua*.10-sa*.045;heldRoot.position.x=heldViewBase.x+sa*.045;heldRoot.position.y=heldViewBase.y;hand.position.x=bobX*.35;hand.position.y=-bobY*.5-sa*.025;
if(bowCharging){const br=Math.max(.2,Math.min(1,(now-bowChargeAt)/1200));$('bowChargeFill').style.width=(br*100)+'%';heldRoot.position.z=heldViewBase.z-br*.08;heldRoot.rotation.y=heldViewBase.ry-br*.18}
else heldRoot.rotation.y=heldViewBase.ry;if(!swing)hand.rotation.y*=Math.max(0,1-dt*14)`;
if(!s.includes(oldAnim))throw new Error('animation block not found');s=s.replace(oldAnim,newAnim);

fs.writeFileSync(p,s);console.log('held item overhaul applied');
