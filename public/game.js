window.addEventListener('error',e=>{console.error('Runtime error:',e.error||e.message)});
window.addEventListener('unhandledrejection',e=>console.error('Unhandled promise:',e.reason));
const $=id=>document.getElementById(id),{W,H,D,MIN_X,MAX_X,MIN_Z,MAX_Z,BASE_Y,TC,TN,IS,DI,EM,LOBBY,MAPS,ix,SH,BLOCKS,inXZ}=BW,gn=BW.gen('classic',true),B=gn.B,pf=new Uint8Array(B.length),CS=16,hex=c=>c.toString(16).padStart(6,'0');let currentMap='classic',currentMode='2v2',activeChunks=new Set(gn.activeChunks||[]),worldMeta=gn;
const RI={
  iron:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAAxElEQVR4nO3ZsRWCMBSG0afHiVzB2kFkIByEmhVYSVsL0Sr54/HekoZHvtAkVQAAAAAAAAAAAAAAAAAAAAD8ikN6gFe3aXok33+f5+7rEQmwt9Dny7X3KFVVta3L2+c9gpxav+Cb1KJ/mmEvSAuxACMs/AiO6QFG1HNzCBAmQJgAYQKECRAmQJgAYQKECRAmQJgAYQKExQJs69L12HdU8fuA0fTeFPEAex/c4kh4xD/uL++EE3e/AAAAAAAAAAAAAADQ0BPsQyBuy/khFgAAAABJRU5ErkJggg==',
  gold:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAFqklEQVR4nO2azY7bRhKAv6omNRnHwCaH+JLJzSO/QPIIi30GA7nvbR8mt70HCBbIC1nyzfYluWQPi8mY7Ko9NJukNNIom5U546Q+gBAlkd1kVddfd0MQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBMHHiCzd4T+/+9T3f3v2RQLgp5/z0o9zlL//4z+LyKZZopNDPPsi8flnyjdfN4APR32cQ+/us9/reb3vLt//8P6sz/uhWETL81H/7csLQO/pul4qB347dN1xJfweDinuQ1rDohZQhC9U4ZpN/6nWs+ldp//vvr/79Okn5N/3Qs5CSk7TOG17/IZvX67G8yWsaHEXlLPgDjKTqcgkbLNBqHINgLIZ7gPVqjhHVTDz4T6hae4K1fwF2aDvXgOQ0vks5Vzo6UvOiePu5AxdB31fBe7jkbPT5efD/062a3I2wOj7cpg5fW8g12ha3+ml74UuF+EDNKvntK0dVNJDs7gFuDs2DPc6IvddUdKipPLdoVrHrJ254Mv5q9HVAGgDSac+3I4L/+ZG6TpF1bm4sHtd1Ll5kCzo1Eh025AGAYtvQHeVdIqUnCa9QnQ9trdPFTrsxpq+LwpcSgkPloaewm0zZpsiuzEDwPJmtALLG7Qpip0r95Dg+164uUmYFWurnzBY28I8CgUcG6nmkGaCV3XMZllSvivgU7isSa1At0V1yoh+a5Z0bhYOwnepwt8/73sZXURF78nGRdc79x+7JilcrIyLT54Dk9U8fZq5vFzW/8MjUMA+fS/c3uoYTGuOv++C5swD8r1KECHNbL4G3KWFPufBFeC2IWfhfSf8evN6FHxKfta8XUQQ35aaw4Xu/XawstJf103nS/IoYoDlDTYTfA2kNSP5LfenVAq3Q4EXQFUxg/72NSLQNIK70PdGu7rGXLG8WdwaHoUC9rOX38MxwRcSXVfcmerkztxBmzXIl0gSkgK84pxzS6d4FAo4N/OCrG1lnOqo6azqpIzUXNHbMzTVGaeqyD9xHVAFaCYIBvjOyN2nCht2i7y2lTHXb9vyW52Hqm31w9yTqJSUd5hb+lMrYE422QnGtRaoQjeTnQKq72XI5aughZSmST6R8mlWjtS8wZFBIe8owv8fyu7/k0elgBp0a0yo36vQ3Mv8jhs0VSnJkbQmJceHwqxUto7IlOQVoTs5F6uoE4GtbWlXigKWt4AsWhEvrgDRNehXYG92Aqf5C6S5IvfvuLnZ7lS9gpGSj26jWQ0ZT94gaQ16NboV8XkwLm30fa0nBDO4vYWUijWpCk3ajH25O10ni2VDy9YBMggfQL9C0ouSn+salyvcBdErRK+HOFBGaZ8Fqwsv88o5Te0JILVtwJFxlEOZ/jau0eb5UHzBkydC07BT9LkvWws8XCE2ZiSKJqVpZBiV7FSrwDCKdVREPcqfb4BhYdKLPy8jXYpypSzmpPaaJpX8/8nTNZeXPlpF6WNyc3/c6WjfgEkZ/f4W8bJShW2L305X4G9x33JxUUYtFFdRpyRytx2nHrrq89MQqH0LKE5xMe6lDdWyPiBS5pPcS3CfB+Xavt2zbvAhWH5BxjZgGxBBdGaAtkXZIuLoMAJVZViGrG6hfr7eXZbMG1QcVb2Tqo4ZUN6CXmMKdNsxZlQlQ7GU1Wq5DAgeMAuqK2OyJzH3ecopB9cCShElO0rYbwemfN+sWsKWlHZT0Von5Axtu/xs6KIK+P6H93z2l7IJ629/bcZ14EOIlHTwmGDdHZFqKU6z8yb1HkPVhsA6tVO7VGVMd1Xh8nLZ0Q8PYAG//Lss9rZtOnFl3Xx1av/QsT1D036h+6acu64Ubv/68fbE83wYlp9/ZX+j1uq+Sxdjfw/QH35rYuVj2UIYBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBMEj578I4LfzzTl9KQAAAABJRU5ErkJggg==',
  dia:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAACEUlEQVR4nO3bMVLDMBSE4YWh5AKUXCX3yAwtJ6JlxvfIVSi5QHpo7GA7kWMnkt5q+L+KDIkt9j3JxnYkAAAAAAAAAAAAAAAAAEBWD9EDWPLy9vWz9Pvvz1fr8a9h9wfMQ9+9X37f4WP6utVi2Ax6HHwq9JRxMVorRPhgJx2/l3bPt23ncJTU/b1upRCPkTvPFb7Uf3af2LaxsC45BdSHdk/4Y4dj/0M/G9xnQsgMKBX+ZFv72b5MVS/A2VlOxvBT23QuQtUC5Fzzr2nlmFCtAPPwqzEvQuhZECoV4FL3l1x+BvMD8tlYDDADghUvgFvHSV5jqjsDah58nfa9gCUoWNECOE31OZexhc2A0zWbxvdxL5agYBQgWN0CdNOXJZeIs213F98WLnwGlChCC2v/ILwAUt7AWgpfiihAYinIEVxyG6bLj1S4AFtvB95ThK2fdblVGbMELXTkLUVY/Ixx90vSU9ieOyWvz4wDTV22XlUo8/ClSk9FJP/tL32BLFEAl+VHij4LKtmhDXS/VPG5oKsXv3LNhivBO3W/FD0DxnJ0bCNdP1a1G1ZfAt46G1YG79b9UsCjiZuvw6eKsbHbHcOXgp4NrX0zxDV8KegYUDMQ5/ClwINwjWDcw5eCz4JKBtRC+JLBN2QGuY4LrQQ/sBvsrYVoLfiB9aD/w9dUAQAAAAAAAAAAAAAAAAAAAADI4Bew1Z/VhHiMKQAAAABJRU5ErkJggg==',
  em:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAADyklEQVR4nO3ZS28bVRjG8f+Zi+NL6lAqURMhIRQJIbrNGgk2WfBdgCWfg4+CxKKwY80GhKKqamlRq8QpwkmcZOx4xnNYjC9jewhImdhnqucXRbKPZ/H6fc6ZOTMGEREREREREREREREREREREREREREREZFbM5su4P/aO2ja/Puvv/9896utH443VU9ZnA+gsx/Yg28/Xhn//afXnL1MeP44cv473MTp4qfN3/5gtczL1/atCMHZwvPND9vzcd/3AYgvIDq2PPn5iOPfBpUNIdh0AUXyza+1wW9k457nLxzXxPDJZ7vAEYCtYghOBvDFN3sLzffC1eZP5UN4/jhab6ElcC6Azn5g73242PztVnvluIir2evm5Ey6d9Cs3CrwNl1Aka13bm4+QLPRwgvBr0N4bz7+3fWX76+nynI4twIePmrgN7Pmt5pZZ/NT2kzeWaDV2GZgIiBde51lcW4F1Hd8/DCb4RgwhiwBA8aY+evJ8Y16k6DmMejHmyv6FpwLwK8ZTMCk0fOZbZZ3zLkQUpPSaIfrKrFUzgVgvKytUdIHwGJXmz87GAbJZXY+Apr3a+sosVTOBYBhVtXVaB5CkSi5XFNRd8e5AO4/mpz3J6L4AlvwV9T86HS0xkrL4dwuqLm7OhbFFwB4pvhmjBRdhMtS24Fe9Kbws9SOVwcNdE9O7riqu+NcAH4jO98XhVC0AnrRicOPFP+bcwFgLTYFbBbCdNYXNb8/7BGYkLg/H6vajzTOBRBfpNgxCyEU6Q97YCFNYHyWbT+v/tZF+NZO/xjzsB3gTbb0YRByeX0OgO/lyp00P674TtS5FdA7HJMMIB2BT4hPmN1oWRiPk9lrkwbEl9kPM6NhtgNqPdCN2K39+WPC6aEhGYA3DrEpC/9JkhCPEob9hPgC+q8Szp5U9yrs3CkIoPeroVYPaXxa/Pn4Opv5wzeGwasQmybrLbBETgZQC2ucHVpqW4b23upjiGnzz59lq6IWVPNBHDgawLDrU++MOX8KYGi8txhCvvn22jD8y+fsZTVXgZMBgGXY9YExPPXpP1s9x+ebP30cqm1oSayxGMsshMaD1ZuwheYbW8nmg6MBjK5iaq1wIYT69mKp+eafHw02UmcZnNy/dfYD2/no3UkI098kob6TD2He/O6LHgDdXxInv89NnFwBAN0XPeYhZGPD8/kjZ2sso6t41vyqcnbGdPYDC8xCWLbc/CrOfnA4AFgMYdnb0HxwPACYh/Bvqtx8qEAAU8tBVL3xIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIl+gdHQ3kWOO7ouQAAAABJRU5ErkJggg=='
};
const get=(x,y,z)=>(y<0||!inXZ(x,z)||y>=H)?0:B[ix(x,y,z)];
const P={5:[0xb58a4e],6:[0xaaa6a0],7:[0xddeeff],12:[0xe8dfb0],13:[0xd9d9d9,0xd83030],14:[0xffd23d],15:[0x4de8e0],16:[0x2c2036],17:[0x3d6fe0],18:[0xb53838],19:[0x4f8f54],20:[0xd6b54a],21:[0x2a2530],22:[0xff5b20],23:[0xfff3a1],24:[0x73533a],25:[0x4c3a2d],26:[0x2f8f92],27:[0x5f9d43],28:[0x7d817a],29:[0x3f7d3c],30:[0x6f4a2e],31:[0xb45f77],32:[0x4fd8e9],33:[0x43cf75],34:[0xb9ffff]};TC.forEach((c,i)=>{P[i+1]=[c];P[8+i]=[c,0xe8e4d8,0x7a4a2b]});
const F=[[[1,0,0],[1,0,0],[1,1,0],[1,1,1],[1,0,1],.8,1],[[-1,0,0],[0,0,0],[0,0,1],[0,1,1],[0,1,0],.8,1],[[0,1,0],[0,1,0],[0,1,1],[1,1,1],[1,1,0],1,0],[[0,-1,0],[0,0,0],[1,0,0],[1,0,1],[0,0,1],.5,2],[[0,0,1],[0,0,1],[1,0,1],[1,1,1],[0,1,1],.65,1],[[0,0,-1],[0,0,0],[0,1,0],[1,1,0],[1,0,0],.65,1]];
let qualityMode=(()=>{try{return localStorage.getItem('bwQuality')||'auto'}catch(e){return'auto'}})();
let autoQuality=(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4)||(navigator.deviceMemory&&navigator.deviceMemory<=4)?'low':'high',lowEnd=qualityMode==='low'||(qualityMode==='auto'&&autoQuality==='low');
const R=new THREE.WebGLRenderer({antialias:!lowEnd,powerPreference:'high-performance'});function applyRenderQuality(){lowEnd=qualityMode==='low'||(qualityMode==='auto'&&autoQuality==='low');R.setPixelRatio(Math.min(devicePixelRatio,lowEnd?0.85:qualityMode==='medium'?1.15:1.5));GEN_VIS.forEach(v=>{v.particles.forEach((p,i)=>p.visible=!lowEnd||i<3)});try{localStorage.setItem('bwQuality',qualityMode)}catch(e){}}R.setPixelRatio(Math.min(devicePixelRatio,lowEnd?0.85:1.5));document.body.prepend(R.domElement);
const sky=0x8fc8ee,sc=new THREE.Scene();sc.background=new THREE.Color(sky);sc.fog=new THREE.Fog(sky,170,560);
const cam=new THREE.PerspectiveCamera(72,1,.05,1200);cam.rotation.order='YXZ';sc.add(cam);
const BB_CACHE=new Map(),BB_PENDING=new Map(),BB_LOADER=new THREE.GLTFLoader();
function cloneMaterial(mat,tint=null){
  const map=mat&&mat.map?mat.map:null;
  if(map){map.magFilter=map.minFilter=THREE.NearestFilter;map.generateMipmaps=false;map.needsUpdate=true}
  const m=new THREE.MeshBasicMaterial({
    map,
    color:tint==null?0xffffff:tint,
    transparent:!!(mat&&mat.transparent),
    opacity:mat&&Number.isFinite(mat.opacity)?mat.opacity:1,
    alphaTest:mat&&Number.isFinite(mat.alphaTest)?mat.alphaTest:.05,
    side:THREE.DoubleSide,
    depthWrite:mat?mat.depthWrite!==false:true
  });
  return m;
}
function prepareBB(root,tint=null){
  root.traverse(o=>{if(o.isMesh&&o.material){
    const src=Array.isArray(o.material)?o.material:[o.material];
    const out=src.map(m=>cloneMaterial(m,tint));
    o.material=Array.isArray(o.material)?out:out[0];
    o.frustumCulled=true;o.castShadow=false;o.receiveShadow=false;
  }});
  return root;
}
function normalizeBB(root,targetHeight,centerXZ=true){
  root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root),size=new THREE.Vector3();
  box.getSize(size);
  if(size.y>0&&targetHeight>0){const k=targetHeight/size.y;root.scale.multiplyScalar(k);root.updateMatrixWorld(true)}
  const box2=new THREE.Box3().setFromObject(root),center=new THREE.Vector3();box2.getCenter(center);
  if(centerXZ){root.position.x-=center.x;root.position.z-=center.z}
  root.position.y-=box2.min.y;
  root.updateMatrixWorld(true);
  return root;
}
function parseBB(key){
  if(BB_CACHE.has(key))return Promise.resolve(BB_CACHE.get(key).clone(true));
  if(!window.BB_MODELS||!BB_MODELS[key])return Promise.reject(new Error('Modelo Blockbench ausente: '+key));
  if(!BB_PENDING.has(key)){
    BB_PENDING.set(key,new Promise((ok,no)=>{
      BB_LOADER.parse(JSON.stringify(BB_MODELS[key]),'',gltf=>{
        const root=prepareBB(gltf.scene);
        BB_CACHE.set(key,root);
        BB_PENDING.delete(key);
        ok(root);
      },err=>{BB_PENDING.delete(key);no(err)});
    }));
  }
  return BB_PENDING.get(key).then(root=>root.clone(true));
}
function bbModel(key,tint=null){
  return parseBB(key).then(root=>prepareBB(root,tint));
}
['sword','helmet','chest','leggings','boots'].forEach(k=>parseBB(k).catch(()=>{}));
const hand=new THREE.Group(),handMat=new THREE.MeshBasicMaterial({color:0xe8b98a});
const arm=new THREE.Mesh(new THREE.BoxGeometry(.18,.18,.55),handMat);arm.position.set(.48,-.44,-.72);arm.rotation.x=-.35;hand.add(arm);
const heldRoot=new THREE.Group();const heldViewBase={x:.68,y:-.32,z:-1.02,rx:0,ry:0,rz:0};heldRoot.position.set(heldViewBase.x,heldViewBase.y,heldViewBase.z);hand.add(heldRoot);cam.add(hand);let swing=0,useAnim=0,lastHeldSig='',miningTool=null;
const HMAT=new Map();const hmat=(c,o=1)=>{const k=c+':'+o;if(!HMAT.has(k))HMAT.set(k,new THREE.MeshBasicMaterial({color:c,transparent:o<1,opacity:o}));return HMAT.get(k)};
const box=(w,h,d,c)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),hmat(c));
const sphere=(r,c,o=1)=>new THREE.Mesh(new THREE.SphereGeometry(r,7,6),hmat(c,o));
const vendorFaceBindings=[];
let vendorAtlasReady=false;
const vendorAtlas=new THREE.TextureLoader().load('/assets/vendor_blue_atlas.png',()=>{
  vendorAtlas.magFilter=vendorAtlas.minFilter=THREE.NearestFilter;vendorAtlas.generateMipmaps=false;vendorAtlasReady=true;
  vendorFaceBindings.forEach(({tex,mat})=>{tex.image=vendorAtlas.image;tex.needsUpdate=true;mat.map=tex;mat.color.setHex(0xffffff);mat.needsUpdate=true});
},undefined,err=>console.warn('Falha ao carregar textura do vendedor',err));
vendorAtlas.magFilter=vendorAtlas.minFilter=THREE.NearestFilter;vendorAtlas.generateMipmaps=false;
function vendorFace(row,col){
  const tex=vendorAtlas.clone();tex.wrapS=tex.wrapT=THREE.ClampToEdgeWrapping;tex.repeat.set(1/6,1/6);tex.offset.set(col/6,1-(row+1)/6);
  const fallback=[0xd8a070,0x24529d,0xe8dcc6,0x24529d,0x6b442d,0x4a3024][row]||0x8a5b3c;
  const mat=new THREE.MeshBasicMaterial({color:fallback,side:THREE.FrontSide});
  vendorFaceBindings.push({tex,mat});
  if(vendorAtlasReady&&vendorAtlas.image){tex.image=vendorAtlas.image;tex.needsUpdate=true;mat.map=tex;mat.color.setHex(0xffffff);mat.needsUpdate=true}
  return mat;
}
const VENDOR_MATERIAL_ROWS=new Map();
function vendorMaterials(row){
  if(VENDOR_MATERIAL_ROWS.has(row))return VENDOR_MATERIAL_ROWS.get(row);
  // BoxGeometry: direita, esquerda, topo, base, frente, costas.
  const m=[vendorFace(row,3),vendorFace(row,2),vendorFace(row,4),vendorFace(row,5),vendorFace(row,0),vendorFace(row,1)];
  VENDOR_MATERIAL_ROWS.set(row,m);return m;
}
function vendorPart(w,h,d,row){
  return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),vendorMaterials(row));
}
function swordModel(level=sw){
 const g=new THREE.Group();
 const cfg=[
  {blade:0xb9b0a6,edge:0xe0d7cc,dark:0x77706b,guard:0x6e5a46,grip:0x4b3526,pommel:0x75604c,w:.13,len:.66},
  {blade:0x8d9298,edge:0xc5c9cd,dark:0x5e6268,guard:0x74624c,grip:0x493425,pommel:0x80705d,w:.12,len:.72},
  {blade:0xd6dbe0,edge:0xf7fbff,dark:0x9299a0,guard:0xb59a61,grip:0x4b3425,pommel:0xc5ad73,w:.115,len:.77},
  {blade:0x54e5ec,edge:0xb8fbff,dark:0x239da7,guard:0x2faab3,grip:0x23444a,pommel:0x75f5fb,w:.125,len:.82}
 ][Math.max(0,Math.min(3,level))];
 const add=(w,h,d,c,x,y,z,rx=0,ry=0,rz=0)=>{const m=box(w,h,d,c);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);g.add(m);return m};
 add(cfg.w,cfg.len,.085,cfg.blade,0,.26,0);
 add(.026,cfg.len*.94,.096,cfg.edge,-cfg.w*.46,.255,.002);
 add(.026,cfg.len*.94,.096,cfg.dark,cfg.w*.46,.255,-.002);
 add(cfg.w*.78,.12,.086,cfg.blade,0,.26+cfg.len*.53,0);
 add(cfg.w*.48,.10,.084,cfg.edge,0,.26+cfg.len*.64,0);
 add(cfg.w*.24,.08,.08,cfg.edge,0,.26+cfg.len*.73,0);
 add(.42,.075,.13,cfg.guard,0,-.105,0);
 add(.12,.10,.13,cfg.guard,-.205,-.075,0,0,0,-.18);
 add(.12,.10,.13,cfg.guard,.205,-.075,0,0,0,.18);
 add(.16,.095,.145,cfg.dark,0,-.105,-.005);
 add(.095,.30,.095,cfg.grip,0,-.295,0);
 for(let i=0;i<3;i++)add(.108,.035,.108,i%2?cfg.dark:cfg.guard,0,-.205-i*.085,0);
 add(.14,.085,.13,cfg.pommel,0,-.485,0);
 add(.09,.07,.09,cfg.dark,0,-.555,0);
 if(level===3){add(.055,.50,.105,0xd4ffff,0,.29,.006);add(.17,.035,.145,0x8fffff,0,-.105,.012)}
 g.rotation.z=-.37;g.rotation.x=.06;g.scale.setScalar(1.08);return g
}
function blockbenchSword(target,sig,level=sw){
  const col=[0xffffff,0xb7b7b7,0xe6e6e6,0x8ff5ff][level]||0xffffff;
  bbModel('sword',col).then(m=>{
    if(lastHeldSig!==sig)return;
    while(target.children.length)target.remove(target.children[0]);
    normalizeBB(m,.78);m.rotation.set(0,0,-.42);m.position.add(new THREE.Vector3(0,-.24,0));
    target.add(m);
  }).catch(err=>console.warn('Falha ao carregar espada Blockbench',err));
}
function blockModel(c,o=1){const g=new THREE.Group(),core=new THREE.Mesh(new THREE.BoxGeometry(.40,.40,.40),hmat(c,o));g.add(core);const top=box(.31,.025,.31,0xffffff);top.material=top.material.clone();top.material.transparent=true;top.material.opacity=.13;top.position.y=.212;g.add(top);g.rotation.set(.15,.45,.05);return g}
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
function compassModel(){const g=new THREE.Group(),rim=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.07,16),hmat(0xb89343)),face=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.075,16),hmat(0xf1e2b5)),needle=box(.035,.025,.27,0xd84242);rim.rotation.x=face.rotation.x=Math.PI/2;needle.position.z=.01;needle.rotation.y=.35;g.add(rim,face,needle);g.rotation.z=-.18;return g}
function milkModel(){const g=new THREE.Group(),cup=box(.26,.30,.22,0xece8df),milk=box(.21,.045,.17,0xffffff),rim=box(.30,.045,.26,0xc9c5bd);milk.position.y=.13;rim.position.y=.17;g.add(cup,milk,rim);g.rotation.z=.12;return g}
function eggModel(){const g=new THREE.Group(),e=new THREE.Mesh(new THREE.SphereGeometry(.17,8,6),hmat(0xffe6a2));e.scale.set(.82,1.12,.82);g.add(e);return g}
function popupTowerModel(){const g=new THREE.Group();for(const [x,y,z] of [[-.15,0,0],[.15,0,0],[0,.18,0],[0,.36,0]]){const b=box(.22,.22,.22,TC[me.team]||0x3d6fe0);b.position.set(x,y,z);g.add(b)}g.rotation.set(.1,.4,.05);return g}
function stickModel(){const g=new THREE.Group(),s=box(.075,.62,.075,0x8b5a32);s.rotation.z=-.38;g.add(s);return g}
function toolModel(k){const lvl=Math.max(1,tools[k]||1),metal=lvl>1?0xe5e8eb:0xbfc5c7,dark=lvl>1?0x90979e:0x7e8588,g=new THREE.Group(),h=box(.065,.52,.065,0x76513a);h.position.y=-.08;g.add(h);const grip=box(.085,.13,.085,0x4b3425);grip.position.y=-.30;g.add(grip);if(k==='pick'){const head=box(.44,.075,.09,metal);head.position.y=.22;g.add(head);for(const x of [-.22,.22]){const tip=box(.07,.15,.08,dark);tip.position.set(x,.17,0);tip.rotation.z=x<0?.32:-.32;g.add(tip)}}else if(k==='axe'){const head=box(.24,.25,.09,metal);head.position.set(.10,.16,0);g.add(head);const edge=box(.055,.29,.095,0xf3f6f7);edge.position.set(.23,.16,0);g.add(edge)}else{const a=box(.30,.045,.055,metal),b=a.clone();a.rotation.z=.55;b.rotation.z=-.55;a.position.y=b.position.y=.16;g.add(a,b);const pin=box(.07,.07,.07,dark);pin.position.y=.15;g.add(pin)}g.rotation.z=-.45;return g}
function heldModel(canonical,team=me.team,swordLevel=sw){
 const k=canonicalKey(canonical);
 if(canonical===0)return swordModel(swordLevel);
 if(['wool','planks','endstone','glass','obsidian'].includes(k))return heldBlockModel(k,team);
 if(['tnt','tntImpulse','tntSlow','tntDamage'].includes(k)){const t=TNT_TYPES.find(x=>x[0]===k);return tntModel(t?t[2]:0xd7352f)}
 if(k==='apple')return appleModel();if(k==='bow')return bowModel();if(k==='fireball')return fireballModel();if(k==='snowball')return snowballModel();if(k==='pearl')return pearlModel();if(k==='compass')return compassModel();
 if(k==='magicMilk')return milkModel();if(k==='bridgeEgg')return eggModel();if(k==='popupTower')return popupTowerModel();if(k==='knockbackStick')return stickModel();
 if(k==='speedPotion')return potionModel(0x55ddff);if(k==='jumpPotion')return potionModel(0xaaff55);if(k==='invisPotion')return potionModel(0xbbbbff);return new THREE.Group()
}
function heldView(slot,mining=false){
 const k=mining?miningTool:slotKey(slot);let v={x:.69,y:-.33,z:-1.03,rx:.02,ry:0,rz:0,scale:1};
 if(canonicalSlot(slot)===0&&!mining)v={x:.78,y:-.42,z:-1.08,rx:.02,ry:-.08,rz:.02,scale:.93};
 else if(mining)v={x:.76,y:-.39,z:-1.05,rx:.03,ry:-.06,rz:0,scale:.96};
 else if(['wool','planks','endstone','glass','obsidian'].includes(k))v={x:.72,y:-.37,z:-1.00,rx:.02,ry:-.08,rz:0,scale:.88};
 else if(k==='bow')v={x:.76,y:-.34,z:-1.08,rx:.03,ry:-.12,rz:.04,scale:.96};
 else if(['speedPotion','jumpPotion','invisPotion','apple'].includes(k))v={x:.73,y:-.38,z:-.95,rx:.04,ry:-.06,rz:.02,scale:.92};
 else if(['fireball','snowball','pearl'].includes(k))v={x:.73,y:-.35,z:-.96,rx:0,ry:-.05,rz:0,scale:.92};
 else if(String(k).startsWith('tnt'))v={x:.72,y:-.37,z:-1.00,rx:.02,ry:-.08,rz:0,scale:.88};
 return v
}
function applyHeldView(){const v=heldView(cur,!!miningTool);Object.assign(heldViewBase,v);heldRoot.position.set(v.x,v.y,v.z);heldRoot.rotation.set(v.rx,v.ry,v.rz);heldRoot.scale.setScalar(v.scale)}
const HELD_CACHE=new Map();function cachedHeld(ci){const key=ci+':'+canonicalKey(ci)+':'+sw+':'+me.team;if(!HELD_CACHE.has(key))HELD_CACHE.set(key,heldModel(ci));return HELD_CACHE.get(key).clone(true)}
function preloadHeld(){for(let i=0;i<SL.length;i++){try{cachedHeld(i)}catch(e){}}}
function refreshHeld(){
 const sig=miningTool?'tool:'+miningTool:'slot:'+cur+':'+slotKey(cur)+':'+sw+':'+me.team;
 if(lastHeldSig===sig)return;lastHeldSig=sig;
 while(heldRoot.children.length)heldRoot.remove(heldRoot.children[0]);
 const ci=canonicalSlot(cur);heldRoot.add(miningTool?toolModel(miningTool):cachedHeld(ci));applyHeldView();
 if(!miningTool)send({t:'held',s:ci});
}
const iconTex={};
for(const k of Object.keys(RI)){const t=new THREE.TextureLoader().load(RI[k]);t.magFilter=t.minFilter=THREE.NearestFilter;iconTex[k]=t}
const GEN_VIS=[];let genState={base:[],dia:[],em:0,centralTier:'I'};
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
 const cv=document.createElement('canvas'),ctx=cv.getContext('2d'),lines=String(text).split('\n');cv.width=512;cv.height=Math.max(96,52*lines.length);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 28px Silkscreen, monospace';ctx.lineWidth=6;ctx.strokeStyle='#000';lines.forEach((line,i)=>{const y=30+i*46;ctx.strokeText(line,256,y);ctx.fillStyle=i===0?color:'#fff';ctx.fillText(line,256,y)});const t=new THREE.CanvasTexture(cv);t.minFilter=t.magFilter=THREE.NearestFilter;return t
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
let genVisualAt=0,genLabelAt=0,genVisualDisabled=false;
function updateGenerators(now){
 if(genVisualDisabled||now-genVisualAt<40)return;genVisualAt=now;const t=now*.001,doLabel=now-genLabelAt>=250;if(doLabel)genLabelAt=now;
 try{GEN_VIS.forEach(v=>{v.core.rotation.y=t*1.25+v.phase;v.core.position.y=.83+Math.sin(t*2+v.phase)*.09;v.particles.forEach((p,i)=>{const q=p.userData,a=t*q.s+q.phase,up=(t*q.s+i*.17)%1.25;p.position.set(Math.cos(a)*q.r,.58+up,Math.sin(a)*q.r);p.material.opacity=.25+.55*(1-up/1.25)});if(!doLabel)return;if(v.type==='base'){const r=genState.base[v.index]||[0,-1,-1,0],tier=Number(r[3]||0),au=Number(r[1]),di=Number(r[2]),line2='Fe '+Math.ceil(Number(r[0]||0))+'s · Au '+(au<0?'BLOQ':Math.ceil(au)+'s'),line3=tier>=3?'Di '+Math.ceil(Math.max(0,di))+'s':'Nível '+tier+'/3';setHologram(v,'GERADOR BASE · NV '+tier+'\n'+line2+'\n'+line3,tier>=3?'#67f3ff':'#ffd85a')}else if(v.type==='dia'){setHologram(v,'DIAMANTE '+(genState.centralTier||'I')+'\nNasce em '+Math.ceil(Number(genState.dia[v.index]||0))+'s','#67f3ff')}else setHologram(v,'ESMERALDA '+(genState.centralTier||'I')+'\nNasce em '+Math.ceil(Number(genState.em||0))+'s','#55ff88')})}catch(err){genVisualDisabled=true;console.warn('Geradores visuais desativados para preservar gameplay',err)}
}
updateGeneratorIcons(gn);
const tex=new THREE.TextureLoader().load('/assets/kai_hive_bedwars_atlas.png',()=>{dirty&&activeChunks&&activeChunks.forEach(k=>dirty.add(k))});
tex.magFilter=tex.minFilter=THREE.NearestFilter;tex.generateMipmaps=false;tex.wrapS=tex.wrapT=THREE.ClampToEdgeWrapping;
const PACK_NATIVE=new Set([5,6,7,12,13,15,16,23,24,26,27,28,30,31,32,33,34]);
const tl=b=>b>=1&&b<=4?0:b===5?1:b===6?7:b===7?6:b>=8&&b<=11?0:b===12?2:b===13?4:b===14?15:b===15?13:b===16?5:b>=17&&b<=19?3:b===20?2:b===21?7:b===22||b===23?15:b===24||b===25?8:b===26?11:b===27?9:b===28?3:b===29?9:b===30?10:b===31?12:b===32?13:b===33?14:b===34?15:7;
function blockTint(b,face){
  if(PACK_NATIVE.has(b))return 0xffffff;
  if(b===25)return 0xa58a72;
  if(b===29)return 0x5a9f45;
  const pp=P[b];return pp?(pp[face]??pp[0]):0xffffff;
}
const mat=new THREE.MeshBasicMaterial({map:tex,vertexColors:true,side:THREE.FrontSide,transparent:true,alphaTest:.08}),M={},dirty=new Set();

// Camas visuais: o bloco 8-11 continua existindo no voxel para colisão e destruição,
// mas não é mais desenhado como cubo. O modelo abaixo é apenas visual.
const BED_VIS=[];
function bedPart(g,w,h,d,color,x,y,z){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({color}));
 m.position.set(x,y,z);g.add(m);return m
}
function removeBedVisual(team){
 const g=BED_VIS[team];if(!g)return;sc.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose&&o.material.dispose()});BED_VIS[team]=null
}
function clearBedVisuals(){for(let t=0;t<BED_VIS.length;t++)removeBedVisual(t)}
function createBedVisual(team,pos,spawn){
 const g=new THREE.Group(),wood=0x75472c,darkWood=0x4d2f20,linen=0xf3f0e8,teamColor=TC[team]||0xffffff;
 // Estrado baixo e comprido: silhueta de cama de verdade, não de bloco.
 bedPart(g,1.02,.14,1.96,wood,0,.22,0);
 for(const x of[-.42,.42])for(const z of[-.82,.82])bedPart(g,.14,.32,.14,darkWood,x,.16,z);
 // Colchão e lençol.
 bedPart(g,.94,.20,1.84,linen,0,.39,0);
 // Cobertor na cor do time cobrindo a metade dos pés.
 bedPart(g,.96,.12,1.04,teamColor,0,.55,-.36);
 // Faixa decorativa no cobertor para quebrar o aspecto de cubo único.
 bedPart(g,.98,.035,.14,0xffffff,0,.625,-.14);
 // Travesseiro destacado na cabeceira.
 bedPart(g,.66,.16,.36,0xffffff,0,.58,.66);
 // Cabeceira em madeira com dois postes e duas travessas.
 for(const x of[-.43,.43])bedPart(g,.13,.82,.13,darkWood,x,.42,.96);
 bedPart(g,1.00,.15,.13,wood,0,.73,.96);
 bedPart(g,.78,.10,.10,teamColor,0,.50,.955);
 // Pequenas laterais do estrado deixam o perfil mais legível de lado.
 for(const x of[-.49,.49])bedPart(g,.06,.19,1.82,darkWood,x,.28,0);
 const sx=spawn?.[0]??pos[0]+.5,sz=spawn?.[2]??pos[2]-.5,dx=pos[0]+.5-sx,dz=pos[2]+.5-sz;
 g.rotation.y=Math.atan2(dx,dz);
 g.position.set(pos[0]+.5,pos[1]+.02,pos[2]+.5);
 g.userData={bedTeam:team,bedPos:pos};
 sc.add(g);BED_VIS[team]=g
}
function syncBedVisuals(meta=worldMeta,state=null){
 clearBedVisuals();(meta?.BD||[]).forEach((pos,t)=>{if(!pos)return;if(state&&state[t]===0)return;if(B[ix(pos[0],pos[1],pos[2])]!==8+t)return;createBedVisual(t,pos,meta.SPAWN?.[t])})
}

function build(cx,cz){const p=[],c=[],i=[],u=[],col=new THREE.Color();let n=0;
for(let x=cx*CS;x<cx*CS+CS;x++)for(let z=cz*CS;z<cz*CS+CS;z++){if(!inXZ(x,z))continue;for(let y=0;y<H;y++){const b=B[ix(x,y,z)];if(!b||b>=8&&b<=11)continue;
const v=.96+((x*73856093^y*19349663^z*83492791)>>>0)%100/2200;
for(const f of F){const d=f[0],nb=get(x+d[0],y+d[1],z+d[2]);if(nb&&!(nb>=8&&nb<=11))continue;col.setHex(blockTint(b,f[6])).multiplyScalar(f[5]*v);
for(let k=1;k<5;k++){p.push(x+f[k][0],y+f[k][1],z+f[k][2]);c.push(col.r,col.g,col.b);u.push((tl(b)+.02+.96*[0,1,1,0][k-1])/16,.02+.96*[0,0,1,1][k-1])}
i.push(n,n+1,n+2,n,n+2,n+3);n+=4}}}
const k=cx+','+cz;if(M[k]){sc.remove(M[k]);M[k].geometry.dispose()}
const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(u,2));g.setIndex(i);
M[k]=new THREE.Mesh(g,mat);sc.add(M[k])}
function applyServerBlock(a){const[x,y,z,v,f,seq=0]=a,key=x+','+y+','+z,prev=BLOCK_SEQ.get(key)||0;if(seq&&seq<prev)return false;if(seq){BLOCK_SEQ.set(key,seq);lastBlockSeq=Math.max(lastBlockSeq,seq)}sb(x,y,z,v,f);return true}
function sb(x,y,z,v,f){if(!inXZ(x,z)||y<0||y>=H)return;const bi=ix(x,y,z),old=B[bi];B[bi]=v;pf[bi]=f;if(old>=8&&old<=11&&old!==v)removeBedVisual(old-8);const a=Math.floor(x/CS),b=Math.floor(z/CS),mx=((x%CS)+CS)%CS,mz=((z%CS)+CS)%CS;dirty.add(a+','+b);activeChunks.add(a+','+b);
if(mx===0)dirty.add((a-1)+','+b);if(mx===CS-1)dirty.add((a+1)+','+b);if(mz===0)dirty.add(a+','+(b-1));if(mz===CS-1)dirty.add(a+','+(b+1))}
const CMIN_X=Math.floor(MIN_X/CS),CMAX_X=Math.floor(MAX_X/CS),CMIN_Z=Math.floor(MIN_Z/CS),CMAX_Z=Math.floor(MAX_Z/CS);
function validChunk(cx,cz){return cx>=CMIN_X&&cx<=CMAX_X&&cz>=CMIN_Z&&cz<=CMAX_Z}
function flush(max=2){let n=0;for(const q of [...dirty]){if(n++>=max)break;dirty.delete(q);const[u,w]=q.split(',').map(Number);if(validChunk(u,w))build(u,w)}}
const VENDORS=[];let vendorGeneration=0;
function clearVendors(){vendorGeneration++;while(VENDORS.length){const v=VENDORS.pop();sc.remove(v.root)}}
function fallbackVendor(team){
 const g=new THREE.Group();
 const head=vendorPart(.58,.58,.58,0),body=vendorPart(.72,.78,.36,1);
 const armR=vendorPart(.24,.72,.28,2),armL=vendorPart(.24,.72,.28,3);
 const legR=vendorPart(.28,.78,.30,4),legL=vendorPart(.28,.78,.30,5);
 legR.position.set(-.17,.39,0);legL.position.set(.17,.39,0);
 body.position.set(0,1.15,0);
 armR.position.set(-.49,1.16,0);armL.position.set(.49,1.16,0);
 head.position.set(0,1.83,0);
 g.add(legR,legL,body,armR,armL,head);
 const badge=box(.15,.15,.03,TC[team]||0xffffff);badge.position.set(0,1.19,.205);g.add(badge);
 g.userData.vendorTeam=team;return g;
}
function markVendor(root,team){root.userData.vendorTeam=team;root.traverse(o=>o.userData.vendorTeam=team)}
function vendorFacing(x,z){return Math.atan2(-x,-z)}
function updateVendors(g,lobby=false){
 clearVendors();if(lobby||!g||!g.SHOP)return;
 g.SHOP.forEach((pos,team)=>{
   const holder=new THREE.Group();holder.position.set(pos[0],pos[1],pos[2]);holder.rotation.y=vendorFacing(pos[0],pos[2]);
   const seller=fallbackVendor(team);markVendor(seller,team);holder.add(seller);markVendor(holder,team);
   sc.add(holder);VENDORS.push({root:holder,team,pos});
 });
}
const vendorRay=new THREE.Raycaster(),vendorDir=new THREE.Vector3();
const CHESTS=[];
function chestWorldPos(meta,t,kind){const sp=meta?.SPAWN?.[t];if(!sp)return null;const[cx,cz]=IS[t],L=Math.hypot(cx,cz)||1,ix=-cx/L,iz=-cz/L,txv=-iz,tz=ix,side=kind==='team'?4:-4;return[sp[0]+txv*side+ix*1.5,sp[1],sp[2]+tz*side+iz*1.5]}
function chestModel(kind,team){const g=new THREE.Group(),body=box(1.02,.58,.70,kind==='ender'?0x342347:0x8a5a2f),lid=box(1.02,.22,.72,kind==='ender'?0x55346f:0xa86d36),lock=box(.16,.20,.06,kind==='ender'?0xb85cff:0xe7c55f);body.position.y=.31;lid.position.y=.70;lock.position.set(0,.48,.38);g.add(body,lid,lock);g.userData.chestKind=kind;g.userData.chestTeam=team;g.traverse(o=>{o.userData.chestKind=kind;o.userData.chestTeam=team});return g}
function clearChests(){while(CHESTS.length){const c=CHESTS.pop();sc.remove(c.root);c.root.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose&&o.material.dispose()})}}
function updateChests(meta,lobby=false){clearChests();if(lobby||!meta?.SPAWN)return;meta.SPAWN.forEach((_,team)=>{for(const kind of ['team','ender']){const pos=chestWorldPos(meta,team,kind);if(!pos)continue;const root=chestModel(kind,team);root.position.set(pos[0],pos[1],pos[2]);root.rotation.y=Math.atan2(-pos[0],-pos[2]);sc.add(root);CHESTS.push({root,team,kind,pos})}})}
const chestRay=new THREE.Raycaster(),chestDir=new THREE.Vector3();
function chestTarget(){if(!started||!CHESTS.length)return null;cam.getWorldDirection(chestDir);chestRay.set(cam.position,chestDir);chestRay.far=5.2;const hits=chestRay.intersectObjects(CHESTS.map(c=>c.root),true);if(!hits.length)return null;const hit=hits[0];for(let d=.18;d<hit.distance-.12;d+=.18){const x=Math.floor(cam.position.x+chestDir.x*d),y=Math.floor(cam.position.y+chestDir.y*d),z=Math.floor(cam.position.z+chestDir.z*d);if(get(x,y,z))return null}const kind=hit.object.userData.chestKind,team=hit.object.userData.chestTeam;return CHESTS.find(c=>c.kind===kind&&c.team===team)||null}
function vendorTarget(){
 if(!started||!VENDORS.length)return null;
 cam.getWorldDirection(vendorDir);vendorRay.set(cam.position,vendorDir);vendorRay.far=5.2;
 const hits=vendorRay.intersectObjects(VENDORS.map(v=>v.root),true);
 if(!hits.length)return null;
 const hit=hits[0],step=.18;
 for(let d=.18;d<hit.distance-.12;d+=step){
   const x=Math.floor(cam.position.x+vendorDir.x*d),y=Math.floor(cam.position.y+vendorDir.y*d),z=Math.floor(cam.position.z+vendorDir.z*d);
   if(get(x,y,z))return null;
 }
 const team=hit.object.userData.vendorTeam;
 return VENDORS.find(v=>v.team===team)||null;
}
function loadMap(mapId,lobby=false,serverChunks=null){
 currentMap=MAPS[mapId]?mapId:'classic';const g=BW.gen(currentMap,lobby);worldMeta=g;B.set(g.B);pf.fill(0);
 activeChunks=new Set(serverChunks||g.activeChunks||[]);dirty.clear();
 Object.keys(M).forEach(k=>{if(!activeChunks.has(k)){sc.remove(M[k]);M[k].geometry.dispose();delete M[k]}});
 activeChunks.forEach(k=>dirty.add(k));updateGeneratorIcons(g);updateVendors(g,lobby);updateChests(g,lobby);syncBedVisuals(g);flush(999);
}
function updateChunkLOD(){const max=lowEnd?155:330;for(const [k,m] of Object.entries(M)){const [cx,cz]=k.split(',').map(Number),x=cx*CS+CS/2,z=cz*CS+CS/2;m.visible=Math.hypot(pl.x-x,pl.z-z)<max}}
activeChunks.forEach(k=>{const[a,b]=k.split(',').map(Number);build(a,b)});
const sel=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01,1.01,1.01)),new THREE.LineBasicMaterial({color:0}));sel.visible=false;sc.add(sel);
const crackMat=new THREE.MeshBasicMaterial({color:0x111111,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
const crackBox=new THREE.Mesh(new THREE.BoxGeometry(1.015,1.015,1.015),crackMat);crackBox.visible=false;sc.add(crackBox);
// jogador local
const pl={x:0,y:BASE_Y+2.02,z:0,vx:0,vy:0,vz:0,kx:0,kz:0,g:false,yaw:0,pitch:-.2},me={id:0,team:0,hp:20,alive:1,out:false,spawnProtect:false},ADMIN={on:false,block:1,build:true};let spectator=false,specTarget=0,sprintLatch=false,camShake=0,serverCorrection=null,matchPhase='normal',lastInvSeq=0,lastBlockSeq=0,lastStateSyncAt=0,lastSnapshotSeq=0,moveSeq=0,blockOpSeq=0;const BLOCK_SEQ=new Map();
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
function approach(v,t,a){return v<t?Math.min(t,v+a):Math.max(t,v-a)}
function step(e,dt){const k=Math.max(0,1-6.5*dt),vx=e.vx+e.kx,vz=e.vz+e.kz;e.kx*=k;e.kz*=k;let n=e.x+vx*dt,blockedX=hit(n,e.y,e.z);if(!blockedX)e.x=n;n=e.z+vz*dt;let blockedZ=hit(e.x,e.y,n);if(!blockedZ)e.z=n;if((blockedX||blockedZ)&&e.g){for(const up of [.18,.34,.5]){const nx=e.x+vx*dt,nz=e.z+vz*dt;if(!hit(e.x,e.y+up,e.z)&&!hit(nx,e.y+up,nz)){e.y+=up;e.x=nx;e.z=nz;break}}}e.vy-=28*dt;n=e.y+e.vy*dt;e.g=false;if(!hit(e.x,n,e.z))e.y=n;else{if(e.vy<0)e.g=true;e.vy=0}}
// estado
const K={},SL=['Espada','Lã','Tábuas','End Stone','Vidro','Obsidiana','TNT','Maçã','Arco','B. Fogo','B. Neve','Pérola','Veloc.','Salto','Invis.','Bússola','Magic Milk','Bridge Egg','Pop-up Tower','Knockback Stick'],KY=[0,'wool','planks','endstone','glass','obsidian','tnt','apple','bow','fireball','snowball','pearl','speedPotion','jumpPotion','invisPotion','compass','magicMilk','bridgeEgg','popupTower','knockbackStick'],SC=['#ccc','#3d6fe0','#b58a4e','#e8dfb0','#ddecff','#2c2036','#d83030','#ffd23d','#8b5a2b','#ff7a20','#eef6ff','#7b3fc6','#55ddff','#aaff55','#bbbbff','#d9b85f','#f6f2df','#ffe07b','#d55353','#8b5a32'],SN=['Punho','Pedra','Ferro','Diamante'],AN=['nenhuma','ferro','diamante'],CN={iron:'ferro',gold:'ouro',dia:'diamante',em:'esmeralda'};
const TNT_TYPES=[['tnt','Explosiva',0xd7352f],['tntImpulse','Impulso',0xe8f4ff],['tntSlow','Lentidão',0x4f9dff],['tntDamage','Dano',0xff3154]];
let tntSel=0;
let inv={wool:0,planks:0,endstone:0,glass:0,obsidian:0,tnt:0,tntImpulse:0,tntSlow:0,tntDamage:0,apple:0,bow:0,arrow:0,fireball:0,snowball:0,pearl:0,speedPotion:0,jumpPotion:0,invisPotion:0,compass:0,magicMilk:0,bridgeEgg:0,popupTower:0,knockbackStick:0,iron:0,gold:0,dia:0,em:0},sw=0,ar=0,tools={pick:0,axe:0,shears:0},fxs={speed:0,jump:0,invis:0,slow:0,fatigue:0,blind:0,milk:0},up={sharp:0,prot:0,forge:0,haste:0,regen:0,trap:0,trapMiner:0,trapSlow:0,trapCounter:0},trapQueue=[],cur=1,started=0,over=0,shopOpen=0,chestOpen=0,chestKind='team',chestData={},chestGenTier=0,chestGenNext=null,chestGenCurrent='',bed=[1,1,1,1],INFO={},tg=null,ws;
let myProfile=null,rankingData=[];const CHEST_KEYS=['iron','gold','dia','em','wool','planks','endstone','glass','obsidian','tnt','tntImpulse','tntSlow','tntDamage','apple','bow','arrow','fireball','snowball','pearl','speedPotion','jumpPotion','invisPotion','compass','magicMilk','bridgeEgg','popupTower','knockbackStick'];const CHEST_LABEL={iron:'Ferro',gold:'Ouro',dia:'Diamante',em:'Esmeralda',wool:'Lã',planks:'Tábuas',endstone:'End Stone',glass:'Vidro',obsidian:'Obsidiana',tnt:'TNT',tntImpulse:'TNT Impulso',tntSlow:'TNT Lentidão',tntDamage:'TNT Dano',apple:'Maçã',bow:'Arco',arrow:'Flechas',fireball:'Bola de Fogo',snowball:'Bola de Neve',pearl:'Pérola',speedPotion:'Velocidade',jumpPotion:'Salto',invisPotion:'Invisibilidade',compass:'Bússola',magicMilk:'Magic Milk',bridgeEgg:'Bridge Egg',popupTower:'Pop-up Tower',knockbackStick:'Knockback Stick'};
function ownedTnts(){return TNT_TYPES.filter(t=>(inv[t[0]]||0)>0)}
function activeTnt(){const owned=ownedTnts();if(!owned.length)return TNT_TYPES[tntSel%TNT_TYPES.length];const key=TNT_TYPES[tntSel%TNT_TYPES.length][0];return owned.find(t=>t[0]===key)||owned[0]}
const HOTBAR_DEFAULT=SL.map((_,i)=>i);
let hotbarOrder=(()=>{try{const a=JSON.parse(localStorage.getItem('bwHotbarOrder')||'null');if(Array.isArray(a)&&a.length===SL.length&&new Set(a).size===SL.length&&a.every(x=>Number.isInteger(x)&&x>=0&&x<SL.length))return a}catch(e){}return [...HOTBAR_DEFAULT]})();
const canonicalSlot=i=>hotbarOrder[i]??i;
const canonicalKey=c=>c===6?activeTnt()[0]:KY[c];
function slotKey(i){return canonicalKey(canonicalSlot(i))}
function slotName(i){const c=canonicalSlot(i);return c===6?'TNT '+activeTnt()[1]:SL[c]}
function cycleTnt(){const owned=ownedTnts();if(owned.length<2)return;const key=activeTnt()[0],i=owned.findIndex(t=>t[0]===key),next=owned[(i+1)%owned.length];tntSel=TNT_TYPES.findIndex(t=>t[0]===next[0]);lastHeldSig='';refreshHeld();hud();msg('TNT: '+next[1])}
let roomCode='',reconnectToken='',reconnectUntil=0,reconnectTimer=null,reconnecting=false,bowCharging=false,bowChargeAt=0,lobbyExplore=false;
let matchTime=0,respawnEnds=0,respawnFinal=false,lastScoreboardAt=0,comboHudUntil=0;const matchPlayers=new Map();let myMatchStats={kills:0,finalKills:0};
const clk=[],PL=new Map(),PT=[],ownedState={};
let AC,masterGain,audioLimiter,lastStep=0,lastPickup=0;
let gameVolume=(()=>{try{const v=Number(localStorage.getItem('bwGameVolume'));return Number.isFinite(v)&&v>=0&&v<=1.5?v:1}catch(e){return 1}})(),audioMuted=false,lastNonZeroVolume=gameVolume>0?gameVolume:1;
const currentGain=()=>audioMuted?0:gameVolume;
const audioInit=()=>{try{if(!AC){AC=new AudioContext();masterGain=AC.createGain();audioLimiter=AC.createDynamicsCompressor();audioLimiter.threshold.value=-10;audioLimiter.knee.value=18;audioLimiter.ratio.value=8;audioLimiter.attack.value=.003;audioLimiter.release.value=.18;masterGain.gain.value=currentGain();masterGain.connect(audioLimiter);audioLimiter.connect(AC.destination)}if(AC.state==='suspended')AC.resume()}catch(e){}};
function refreshAudioSettings(){const input=$('audioVolume'),value=$('audioVolumeValue'),mute=$('audioMuteBtn');if(input)input.value=String(Math.round(gameVolume*100));if(value)value.textContent=(audioMuted?'0':Math.round(gameVolume*100))+'%';if(mute)mute.textContent=audioMuted?'Ativar som':'Silenciar'}
function applyGameVolume(v,{persist=true,unmute=true}={}){gameVolume=Math.max(0,Math.min(1.5,Number(v)||0));if(gameVolume>0)lastNonZeroVolume=gameVolume;if(unmute)audioMuted=false;try{if(persist)localStorage.setItem('bwGameVolume',String(gameVolume))}catch(e){}audioInit();if(masterGain)masterGain.gain.setTargetAtTime(currentGain(),AC.currentTime,.015);refreshAudioSettings()}
function toggleGameMute(){audioMuted=!audioMuted;if(!audioMuted&&gameVolume<=0)gameVolume=lastNonZeroVolume||1;audioInit();if(masterGain)masterGain.gain.setTargetAtTime(currentGain(),AC.currentTime,.015);refreshAudioSettings()}
const tone=(f,d=.1,ty='square',v=.05,slide=0)=>{try{audioInit();const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;o.type=ty;o.frequency.setValueAtTime(Math.max(20,f),t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f+slide),t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(masterGain);o.start();o.stop(t+d)}catch(e){}};
const noise=(d=.08,v=.035,cut=1200)=>{try{audioInit();const n=Math.max(1,Math.floor(AC.sampleRate*d)),buf=AC.createBuffer(1,n,AC.sampleRate),a=buf.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);const src=AC.createBufferSource(),g=AC.createGain(),lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=cut;g.gain.value=v;src.buffer=buf;src.connect(lp);lp.connect(g);g.connect(masterGain);src.start()}catch(e){}};
const LEPTOKS_BASE='/assets/sounds/leptoks/';
const LEPTOKS_SOUND={
 cloth:['dig/cloth1.ogg','dig/cloth2.ogg','dig/cloth3.ogg','dig/cloth4.ogg'],
 stone:['dig/stone1.ogg','dig/stone2.ogg','dig/stone3.ogg','dig/stone4.ogg'],
 wood:['dig/wood1.ogg','dig/wood2.ogg','dig/wood3.ogg','dig/wood4.ogg'],
 eat:['random/eat1.ogg','random/eat2.ogg','random/eat3.ogg'],
 click:['random/click.ogg'],
 rain:['ambient/weather/rain1.ogg','ambient/weather/rain2.ogg','ambient/weather/rain3.ogg','ambient/weather/rain4.ogg'],
 wolf:['mob/wolf/bark1.ogg','mob/wolf/bark2.ogg','mob/wolf/bark3.ogg'],
 wolfPant:['mob/wolf/panting.ogg']
};
const LEPTOKS_BUFFERS=new Map(),LEPTOKS_LOADING=new Map();
function leptoksFile(group){const a=LEPTOKS_SOUND[group]||[];return a.length?a[(Math.random()*a.length)|0]:''}
async function loadLeptoks(file){if(!file)return null;if(LEPTOKS_BUFFERS.has(file))return LEPTOKS_BUFFERS.get(file);if(LEPTOKS_LOADING.has(file))return LEPTOKS_LOADING.get(file);const p=(async()=>{try{audioInit();const r=await fetch(LEPTOKS_BASE+file,{cache:'force-cache'});if(!r.ok)throw new Error('HTTP '+r.status);const ab=await r.arrayBuffer(),buf=await AC.decodeAudioData(ab.slice(0));LEPTOKS_BUFFERS.set(file,buf);return buf}catch(e){console.warn('Falha ao carregar som Leptoks',file,e);return null}finally{LEPTOKS_LOADING.delete(file)}})();LEPTOKS_LOADING.set(file,p);return p}
function leptoksSound(group,vol=.75,rate=1){const file=leptoksFile(group);if(!file)return false;loadLeptoks(file).then(buf=>{if(!buf)return;try{audioInit();const src=AC.createBufferSource(),g=AC.createGain();src.buffer=buf;src.playbackRate.value=rate;g.gain.value=Math.max(0,Math.min(1,vol));src.connect(g);g.connect(masterGain);src.start()}catch(e){}});return true}
function preloadLeptoks(){['random/click.ogg','dig/cloth1.ogg','dig/stone1.ogg','dig/wood1.ogg','random/eat1.ogg'].forEach(loadLeptoks)}
addEventListener('pointerdown',()=>{audioInit();preloadLeptoks()},{once:true,passive:true});
window.playLeptoksSound=(name,vol=.7)=>leptoksSound(name,vol,1);
function initAudioSettingsUI(){const btn=$('audioSettingsBtn'),panel=$('audioSettingsPanel'),slider=$('audioVolume'),mute=$('audioMuteBtn'),test=$('audioTestBtn');if(!btn||!panel||!slider)return;refreshAudioSettings();btn.onclick=e=>{e.stopPropagation();panel.classList.toggle('open');if(panel.classList.contains('open')){try{document.exitPointerLock()}catch(err){}audioInit()}};panel.onclick=e=>e.stopPropagation();slider.oninput=e=>applyGameVolume(+e.target.value/100);if(mute)mute.onclick=()=>toggleGameMute();if(test)test.onclick=()=>{audioInit();if(audioMuted)toggleGameMute();leptoksSound('click',1,1.05);setTimeout(()=>leptoksSound('wood',.95,1),90)};document.addEventListener('click',e=>{if(panel.classList.contains('open')&&!panel.contains(e.target)&&e.target!==btn)panel.classList.remove('open')})}
initAudioSettingsUI();

const positionalGain=(x,y,z,r=7)=>{
  const d=Math.hypot(pl.x-x,(pl.y+1)-y,pl.z-z);
  if(d>=r)return 0;
  const t=1-d/r;
  return Math.max(0,Math.min(1,t*t));
};
const sfx=k=>{
  if(k==='place'||k==='place_cloth'){leptoksSound('cloth',.72,1.03)}
  else if(k==='place_wood'){leptoksSound('wood',.72,1.03)}
  else if(k==='place_stone'){leptoksSound('stone',.72,1.03)}
  else if(k==='break'||k==='break_stone'){leptoksSound('stone',.82,.96)}
  else if(k==='break_wood'){leptoksSound('wood',.82,.96)}
  else if(k==='break_cloth'){leptoksSound('cloth',.82,.96)}
  else if(k==='eat'){leptoksSound('eat',.88,1)}
  else if(k==='blocked'){leptoksSound('click',.5,.78);tone(95,.06,'square',.028,-15)}
  else if(k==='buy'){leptoksSound('click',.72,1.08);tone(660,.05,'square',.022,220)}
  else if(k==='pickup'){const n=performance.now();if(n-lastPickup<65)return;lastPickup=n;tone(780,.04,'sine',.025,180)}
  else if(k==='hurt'){noise(.05,.03,700);tone(130,.08,'sawtooth',.045,-55)}
  else if(k==='death'){tone(180,.12,'sawtooth',.05,-100);setTimeout(()=>tone(90,.22,'sawtooth',.04,-40),80)}
  else if(k==='hit'){tone(310,.045,'square',.035,-70)}
  else if(k==='crit'){tone(720,.045,'square',.055,190);setTimeout(()=>tone(1040,.055,'triangle',.045,240),28);noise(.045,.018,2400)}
  else if(k==='arrow'){tone(440,.055,'triangle',.025,-180)}
  else if(k==='arrowImpact'){noise(.04,.018,1500);tone(260,.035,'triangle',.018,-70)}
  else if(k==='projectileHit'){tone(880,.045,'square',.035,140)}
  else if(k==='snowball'){noise(.035,.02,1800);tone(240,.035,'sine',.018,-40)}
  else if(k==='fireball'){tone(85,.16,'sawtooth',.06,-45);noise(.12,.035,500)}
  else if(k==='pearl'){tone(210,.12,'sine',.04,260)}
  else if(k==='bed'){tone(160,.14,'square',.05,-80);setTimeout(()=>tone(80,.32,'sawtooth',.045,-30),90)}
  else if(k==='victory'){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,.16,'square',.035,40),i*90))}
  else if(k==='step'){noise(.035,.014,650)}
  else if(k==='jump'){tone(190,.05,'triangle',.018,60)}
};
const resourceSfx=(k,g=1)=>{
  if(g<=0)return;
  const T=(f,d,ty,v,slide=0)=>tone(f,d,ty,v*g,slide);
  if(k==='resource_iron')T(390,.035,'triangle',.018,70);
  else if(k==='resource_gold')T(620,.045,'sine',.024,160);
  else if(k==='resource_dia')T(820,.05,'sine',.027,220);
  else if(k==='resource_em')T(520,.045,'triangle',.025,280);
  else if(k==='pickup_iron')T(520,.035,'sine',.023,120);
  else if(k==='pickup_gold')T(760,.04,'sine',.028,180);
  else if(k==='pickup_dia')T(940,.045,'sine',.03,240);
  else if(k==='pickup_em')T(660,.045,'triangle',.03,320);
};
const snd=(f,d=.1,ty='square',v=.05)=>tone(f,d,ty,v,0);
let mt;const msg=t=>{$('msg').textContent=t;clearTimeout(mt);mt=setTimeout(()=>$('msg').textContent='',2600)};
function addFeed(m){
 const el=document.createElement('div');el.className='feed-item '+(m.kind||'info');
 if(Array.isArray(m.parts)&&m.parts.length){m.parts.forEach(p=>{const s=document.createElement('span');s.textContent=String(p.text||'');if(Number.isInteger(p.team)&&p.team>=0&&TC[p.team]!=null){s.style.color='#'+hex(TC[p.team]);s.style.fontWeight='700'}el.appendChild(s)})}else el.textContent=m.text;
 const tc=m.aTeam>=0?TC[m.aTeam]:m.bTeam>=0?TC[m.bTeam]:null;if(tc!=null)el.style.borderLeftColor='#'+hex(tc);
 $('killFeed').appendChild(el);while($('killFeed').children.length>6)$('killFeed').firstChild.remove();setTimeout(()=>el.remove(),5100);
}
function addChat(m){
 const el=document.createElement('div');el.className='chat-line '+(m.scope==='team'?'team':'');
 const name=document.createElement('b');name.style.color='#'+hex(TC[m.team]||0xffffff);name.textContent=String(m.name||'Jogador')+':';
 el.append(name,document.createTextNode(' '+String(m.text||'')));
 $('chatLog').appendChild(el);while($('chatLog').children.length>8)$('chatLog').firstChild.remove();
 setTimeout(()=>{if(el.parentNode)el.remove()},10000);
}
function toggleChat(open=true){$('chatForm').classList.toggle('open',open);if(open){try{document.exitPointerLock()}catch(e){};$('chatInput').focus()}else $('chatInput').blur()}
$('chatForm').onsubmit=e=>{e.preventDefault();const text=$('chatInput').value.trim();if(text)send({t:'chat',scope:$('chatScope').value,text});$('chatInput').value='';toggleChat(false);if(started)requestGameLock()};
const diag={show:false,ping:0,fps:60,frames:0,lastFpsAt:performance.now(),resyncs:0,serverBuffer:0,serverTickMs:0,serverTickAvg:0,serverTickMax:0,serverOverruns:0,serverRooms:0,serverPlayers:0,serverRss:0,moveCorrections:0,moveSuspicion:0,snapshotSeq:0,qualityChanges:0,placePing:0,placeRejected:0,placeAccepted:0,ac:{total:0,last:''}};
function diagPanel(){let d=$('diagPanel');if(d)return d;d=document.createElement('div');d.id='diagPanel';document.body.appendChild(d);return d}
function updateDiag(now){diag.frames++;if(now-diag.lastFpsAt>=1000){diag.fps=Math.round(diag.frames*1000/(now-diag.lastFpsAt));diag.frames=0;diag.lastFpsAt=now;if(qualityMode==='auto'){const prev=autoQuality;if(diag.fps<38)autoQuality='low';else if(diag.fps>54)autoQuality='high';if(prev!==autoQuality){diag.qualityChanges++;applyRenderQuality()}}}const d=diagPanel();d.classList.toggle('open',diag.show);if(!diag.show)return;d.innerHTML='<b>F3 DIAGNÓSTICO</b><span>FPS '+diag.fps+' · Ping '+diag.ping+' ms</span><span>Qualidade '+qualityMode.toUpperCase()+(qualityMode==='auto'?' → '+autoQuality.toUpperCase():'')+'</span><span>WS '+(ws&&ws.readyState===1?'ONLINE':'OFFLINE')+' · buffer '+((ws&&ws.bufferedAmount)||0)+'</span><span>Server buffer '+diag.serverBuffer+'</span><span>Tick '+diag.serverTickMs+' ms · média '+diag.serverTickAvg+' · pico '+diag.serverTickMax+' · overruns '+diag.serverOverruns+'</span><span>Servidor '+diag.serverRooms+' salas · '+diag.serverPlayers+' jogadores · RSS '+diag.serverRss+' MB</span><span>Movement corr '+diag.moveCorrections+' · suspeita '+diag.moveSuspicion+' · Snap '+diag.snapshotSeq+'</span><span>Inv seq '+lastInvSeq+' · Block seq '+lastBlockSeq+'</span><span>Blocos pendentes '+BRIDGE_PRED.size+' · Rejeitados '+diag.placeRejected+'</span><span>Colocar ping '+diag.placePing+' ms · Aceitos '+diag.placeAccepted+'</span><span>Resyncs '+diag.resyncs+'</span><span>AC bloqueios '+((diag.ac&&diag.ac.total)||0)+(diag.ac&&diag.ac.last?' · '+diag.ac.last:'')+'</span><span>Chunks '+activeChunks.size+' · Drops '+DROP.size+' · Proj '+PROJ.size+'</span>'}
function cycleQuality(){const a=['auto','low','medium','high'];qualityMode=a[(a.indexOf(qualityMode)+1)%a.length];applyRenderQuality();msg('Qualidade: '+qualityMode.toUpperCase())}
function adminPanel(){let p=$('adminPanel');if(p)return p;p=document.createElement('div');p.id='adminPanel';p.innerHTML='<div class=admin-title>ADMIN / SPECTADOR</div><div class=admin-row><b>Modo</b><button id=adminBuild>CONSTRUÇÃO</button></div><div class=admin-row><b>Bloco</b><select id=adminBlock></select></div><div class=admin-row><b>Dar item</b><select id=adminPlayer></select><select id=adminItem></select><input id=adminQty type=number min=1 max=999 value=64><button id=adminGive>DAR</button></div><div class=admin-row><b>Equipar</b><button id=adminSword>Espada Diamante</button><button id=adminArmor>Armadura Diamante</button></div><div class="admin-row admin-tests"><b>TESTES</b><button id=admOne>1 BLOCO</button><button id=admClear>ZERAR INV</button><button id=admFull>64 BLOCOS</button><button id=admKill>MATAR</button><button id=admResp>RESPAWN</button><button id=admBed>QUEBRAR CAMA</button><button id=admSpawn>TP BASE</button><button id=admSync>RESYNC</button><button id=admSudden>SUDDEN DEATH</button><select id=admGen><option value=0>GERADOR 0</option><option value=1>GERADOR 1</option><option value=2>GERADOR 2</option><option value=3>GERADOR 3</option></select></div><div class=admin-hint>Voo: WASD · Espaço sobe · Shift desce · F3 diagnóstico · F4 qualidade. Ferramentas de teste exigem modo ADM.</div>';document.body.appendChild(p);const names=['Lã Azul','Lã Vermelha','Lã Verde','Lã Amarela','Madeira','Pedra','Vidro','Cama Azul','Cama Vermelha','Cama Verde','Cama Amarela','End Stone','TNT','Ouro','Diamante','Obsidiana','Bloco Azul','Bloco Vermelho','Bloco Verde','Bloco Amarelo','Pedra Escura','Lava','Luz','Terra','Solo','Terracota Ciano','Grama','Pedra Cinza','Musgo','Madeira Selva','Terracota Rosa','Diamante Brilhante','Esmeralda','Glow'];$('adminBlock').innerHTML=names.map((n,i)=>'<option value='+(i+1)+'>'+n+'</option>').join('');const items=['wool','planks','endstone','glass','obsidian','tnt','tntImpulse','tntSlow','tntDamage','apple','bow','arrow','fireball','snowball','pearl','speedPotion','jumpPotion','invisPotion','iron','gold','dia','em'];$('adminItem').innerHTML=items.map(k=>'<option>'+k+'</option>').join('');$('adminBlock').onchange=()=>ADMIN.block=+$('adminBlock').value;$('adminBuild').onclick=()=>{ADMIN.build=!ADMIN.build;$('adminBuild').textContent=ADMIN.build?'CONSTRUÇÃO':'ITENS'};$('adminGive').onclick=()=>send({t:'adminGive',id:+$('adminPlayer').value,k:$('adminItem').value,n:+$('adminQty').value});$('adminSword').onclick=()=>send({t:'adminSetGear',sw:3,ar});$('adminArmor').onclick=()=>send({t:'adminSetGear',sw,ar:2});const tid=()=>+$('adminPlayer').value||me.id;$('admOne').onclick=()=>send({t:'adminTest',action:'oneBlock',id:tid(),k:'planks'});$('admClear').onclick=()=>send({t:'adminTest',action:'clearInv',id:tid()});$('admFull').onclick=()=>send({t:'adminTest',action:'fullBlocks',id:tid()});$('admKill').onclick=()=>send({t:'adminTest',action:'kill',id:tid()});$('admResp').onclick=()=>send({t:'adminTest',action:'respawn',id:tid()});$('admBed').onclick=()=>send({t:'adminTest',action:'destroyBed',id:tid()});$('admSpawn').onclick=()=>send({t:'adminTest',action:'spawn',id:tid()});$('admSync').onclick=()=>send({t:'adminTest',action:'resync'});$('admSudden').onclick=()=>send({t:'adminTest',action:'sudden'});$('admGen').onchange=e=>send({t:'adminTest',action:'genTier',value:+e.target.value});return p}
function setAdminMode(on,players=[]){ADMIN.on=!!on;const p=adminPanel();p.classList.toggle('open',ADMIN.on);$('adminPlayer').innerHTML=(players||[]).map(q=>'<option value='+q[0]+'>'+q[1]+' · '+TN[q[2]]+'</option>').join('');if($('adminBuild'))$('adminBuild').textContent=ADMIN.build?'CONSTRUÇÃO':'ITENS';lastHeldSig='';hud()}
const uiCache=Object.create(null);const html=(id,v)=>{if(uiCache[id]!==v){uiCache[id]=v;$(id).innerHTML=v}};
const localProfileId=(()=>{let id='';try{id=localStorage.getItem('bwProfileId')||'';if(!id){id=(crypto.randomUUID?crypto.randomUUID():('p-'+Date.now()+'-'+Math.random().toString(36).slice(2))).replace(/[^a-zA-Z0-9_-]/g,'');localStorage.setItem('bwProfileId',id)}}catch(e){id='p-'+Date.now()+'-'+Math.random().toString(36).slice(2)}return id})();
function drawProfile(){if(!myProfile)return;const p=myProfile,next=500-(p.xp%500);html('profileBody',`<div class="profile-level">NÍVEL ${p.level}</div><div class="xpbar"><i style="width:${((p.xp%500)/5).toFixed(1)}%"></i></div><p><b>XP:</b> ${p.xp} · próximo nível em ${next} XP</p><div class="profile-grid"><span>Partidas<b>${p.matches}</b></span><span>Vitórias<b>${p.wins}</b></span><span>Derrotas<b>${p.losses}</b></span><span>Kills<b>${p.kills}</b></span><span>Final Kills<b>${p.finalKills}</b></span><span>Camas<b>${p.bedsDestroyed}</b></span></div>`)}
function openProfile(){drawProfile();scr('profile')}
function drawRanking(){html('rankingBody',(rankingData||[]).map((p,i)=>`<div class="rank-row"><b>#${i+1}</b><span>${p.name}</span><em>Nv. ${p.level}</em><strong>${p.xp} XP</strong><small>${p.wins} vitórias · ${p.finalKills} finais</small></div>`).join('')||'<p>Ainda não há partidas registradas.</p>')}
function openRanking(){send({t:'ranking'});drawRanking();scr('ranking')}
let hotbarEditSelected=-1;
function saveHotbarOrder(){try{localStorage.setItem('bwHotbarOrder',JSON.stringify(hotbarOrder))}catch(e){}}
function drawHotbarEditor(){html('hotbarEditorGrid',hotbarOrder.map((ci,i)=>`<button class="hotbar-edit-slot${hotbarEditSelected===i?' selected':''}" onclick="editHotbarSlot(${i})"><b>${i<9?i+1:'↕'}</b><span>${SL[ci]}</span><small>${i<9?'tecla '+(i+1):'roda do mouse'}</small></button>`).join(''))}
function editHotbarSlot(i){if(hotbarEditSelected<0){hotbarEditSelected=i;drawHotbarEditor();return}if(hotbarEditSelected===i){hotbarEditSelected=-1;drawHotbarEditor();return}const a=hotbarEditSelected,t=hotbarOrder[a];hotbarOrder[a]=hotbarOrder[i];hotbarOrder[i]=t;hotbarEditSelected=-1;saveHotbarOrder();lastHeldSig='';drawHotbarEditor();refreshHeld();hud()}
function resetHotbarEditor(){hotbarOrder=[...HOTBAR_DEFAULT];hotbarEditSelected=-1;saveHotbarOrder();lastHeldSig='';drawHotbarEditor();refreshHeld();hud()}
function openHotbarEditor(){hotbarEditSelected=-1;drawHotbarEditor();scr('hotbarEditor')}
function drawChest(){const box=chestData||{};html('chestTitle',chestKind==='ender'?'ENDER CHEST':'BAÚ DO TIME');const rows=CHEST_KEYS.filter(k=>(box[k]||0)>0||(inv[k]||0)>0).map(k=>`<div class="chest-row"><span>${CHEST_LABEL[k]||k}</span><b>Você: ${inv[k]||0}</b><b>Baú: ${box[k]||0}</b><button onclick="chestMove('deposit','${k}',1)">+1</button><button onclick="chestMove('deposit','${k}','all')">+Tudo</button><button onclick="chestMove('withdraw','${k}',1)">-1</button><button onclick="chestMove('withdraw','${k}','all')">-Tudo</button></div>`).join('');const gen=chestKind==='team'?`<div class="gen-upgrade-card"><div><strong>⚙ GERADOR DA BASE · NÍVEL ${chestGenTier}/3</strong><span>${chestGenCurrent||'Ferro básico'}</span></div>${chestGenNext?`<button onclick="upgradeGenerator()">${chestGenNext.name}<small>${chestGenNext.label} do baú</small></button>`:'<b class="gen-max">NÍVEL MÁXIMO</b>'}</div>`:'';html('chestGrid',gen+(rows||'<p>Baú vazio. Deposite recursos para guardar ou evoluir o gerador.</p>'))}
function upgradeGenerator(){if(chestKind==='team')send({t:'genUpgrade'})}
function chestMove(dir,key,n){send({t:'chestMove',kind:chestKind,dir,key,n})}
function openChest(kind){chestKind=kind;send({t:'chestOpen',kind})}
function closeChest(){if(chestOpen)send({t:'chestClose'});chestOpen=0;scr(null);requestGameLock()}
function nearestEnemy(){let best=null,bd=Infinity;PL.forEach((r,id)=>{const mp=matchPlayers.get(id);if(!mp||mp.team===me.team||mp.out||!mp.alive||mp.admin)return;const x=r.tx||r.m.position.x,z=r.tz||r.m.position.z,d=Math.hypot(x-pl.x,z-pl.z);if(d<bd){bd=d;best={id,r,mp,x,z,d}}});return best}
function updateCompass(){const el=$('compassHud');if(!el)return;if(!started||slotKey(cur)!=='compass'||!(inv.compass>0)){el.style.display='none';return}const q=nearestEnemy();el.style.display='block';if(!q){el.innerHTML='🧭 Nenhum inimigo ativo';return}const dx=q.x-pl.x,dz=q.z-pl.z,world=Math.atan2(-dx,-dz),rel=world-pl.yaw,name=INFO[q.id]?.n||('Jogador '+q.id);el.innerHTML=`<span class="compass-arrow" style="transform:rotate(${rel}rad)">▲</span><b>${name}</b><small>${Math.round(q.d)} blocos</small>`}
function fmtTime(v){v=Math.max(0,Math.floor(v||0));return String(Math.floor(v/60)).padStart(2,'0')+':'+String(v%60).padStart(2,'0')}
function renderScoreboard(force=false){
 if(!started){return}
 const now=performance.now();if(!force&&now-lastScoreboardAt<220)return;lastScoreboardAt=now;
 const cfg=MAPS[currentMap]||{},teams=TN.map((n,t)=>{const ps=[...matchPlayers.values()].filter(p=>p.team===t&&!p.admin),active=ps.filter(p=>!p.out).length;if(!ps.length&&!bed[t])return '';return '<div class="score-team"><span class="score-dot" style="background:#'+hex(TC[t])+'"></span><span class="score-name">'+n+'</span><span class="score-count">'+active+'/'+ps.length+'</span><span class="score-bed '+(bed[t]?'alive':'dead')+'">'+(bed[t]?'🛏':'✖')+'</span></div>'}).join('');
 html('tm','<div class="score-head">BEDWARS</div><div class="score-meta">'+(cfg.name||currentMap)+' · '+currentMode.toUpperCase()+'</div><div class="score-time">⏱ '+fmtTime(matchTime)+'</div><div class="score-teams">'+teams+'</div><div class="score-stats">⚔ Kills '+(myMatchStats.kills||0)+' &nbsp; ★ Finais '+(myMatchStats.finalKills||0)+'</div>')
}
function setRespawn(final=false,seconds=0,text=''){
 respawnFinal=!!final;respawnEnds=final?0:performance.now()+Math.max(0,seconds)*1000;
 const el=$('respawnOverlay');el.classList.add('show',''+(final?'final':''));$('respawnTitle').textContent=final?'ELIMINADO':'VOCÊ MORREU';$('respawnText').textContent=final?(text||'Sua cama foi destruída.'):('Renascer em '+Math.max(1,Math.ceil(seconds))+'...')
}
function clearRespawn(){respawnFinal=false;respawnEnds=0;$('respawnOverlay').className='';}
let lastRespawnBeep=-1;function updateRespawnUI(){if(respawnFinal||!respawnEnds)return;const n=Math.max(0,Math.ceil((respawnEnds-performance.now())/1000));$('respawnText').textContent=n>0?'Renascer em '+n+'...':'Renascendo...';if(n>0&&n<=3&&n!==lastRespawnBeep){lastRespawnBeep=n;tone(n===1?820:620,.08,'square',.035,120)}}
function respawnCamera(dt){if(!respawnEnds||respawnFinal)return false;const sp=worldMeta.SPAWN?.[me.team];if(!sp)return false;const a=1-Math.exp(-3.6*dt),tx=sp[0],ty=sp[1]+3.2,tz=sp[2]+5;cam.position.x+=(tx-cam.position.x)*a;cam.position.y+=(ty-cam.position.y)*a;cam.position.z+=(tz-cam.position.z)*a;cam.lookAt(sp[0],sp[1]+1,sp[2]);return true}
function screenHurt(cr=false){const el=$('damageFlash');el.className='show'+(cr?' crit':'');clearTimeout(el._t);el._t=setTimeout(()=>el.className='',150)}
function floatingDamage(x,y,z,d,cr){const v=new THREE.Vector3(x,y,z).project(cam);if(v.z<-1||v.z>1)return;const el=document.createElement('div');el.className='damage-number'+(cr?' crit':'');el.textContent=(cr?'✦ ':'-')+Number(d).toFixed(d>=10?0:1);el.style.left=((v.x*.5+.5)*innerWidth)+'px';el.style.top=((-v.y*.5+.5)*innerHeight)+'px';$('hitNumbers').appendChild(el);setTimeout(()=>el.remove(),720)}
function combatBurst(m){fx(m.x,m.y,m.z,m.cr?0xffe45c:0xff4545,m.cr?20:12);if(m.cr)fx(m.x,m.y+.08,m.z,0xffffff,8);floatingDamage(m.x,m.y+.45,m.z,m.d,m.cr);if(m.target===me.id)screenHurt(!!m.cr)};
function hud(){
html('bar',SL.map((_,i)=>{
 const ci=canonicalSlot(i),key=ci?slotKey(i):0;let q=ci?(inv[key]||0):'';if(ci===8)q=inv.bow?('F'+inv.arrow):0;
 const owned=ci===0||(ci===8?inv.bow>0:(q||0)>0),was=ownedState[i],reveal=owned&&was===false;ownedState[i]=owned;
 const label=slotName(i),clr=ci===6?(activeTnt()[2]||0xd7352f):SC[ci];
 return `<div class="s${i===cur?' on':''}${owned?'':' empty'}${reveal?' reveal':''}" title="${owned?label:''}" onclick="pick(${i})"><i style="background:${typeof clr==='number'?'#'+hex(clr):clr}"></i><em>${i<9?i+1:''}</em><b>${owned?q:''}</b><span class="slot-label">${ci===6&&owned?activeTnt()[1]:''}</span></div>`
}).join(''));
html('res',[
  ['iron','Ferro',inv.iron],['gold','Ouro',inv.gold],['dia','Diamante',inv.dia],['em','Esmeralda',inv.em]
].map(([k,n,v])=>`<div class="resource-row"><img class="ri" src="${RI[k]}"><span>${n}</span><strong>${v}</strong></div>`).join(''));
const hp=Math.max(0,Math.min(20,Math.ceil(me.hp))),hearts=Array.from({length:10},(_,i)=>`<span class="heart${hp<=i*2?' empty':''}">♥</span>`).join('');
html('hp',`<div class="hearts">${hearts}</div><div class="effectline">${fxs.speed>0?'⚡ VELOCIDADE ':''}${fxs.jump>0?'↥ SALTO ':''}${fxs.invis>0?'◌ INVISÍVEL ':''}${fxs.slow>0?'🐌 LENTIDÃO ':''}${fxs.fatigue>0?'⛏ FADIGA ':''}${fxs.blind>0?'🌑 CEGUEIRA ':''}${fxs.milk>0?'🥛 MAGIC MILK ':''}${me.spawnProtect?'🛡 PROTEÇÃO DE SPAWN ':''}${matchPhase==='sudden'?'☠ MORTE SÚBITA ':''}</div><div class="statline">Espada: ${SN[sw]} · Armadura: ${AN[ar]} · CPS ${clk.filter(t=>performance.now()-t<1000).length}</div>`);
if(started)renderScoreboard(true);else html('tm',TN.map((n,t)=>{const o=Object.values(INFO).find(i=>i.t===t),alive=o&&bed[t];return `<div class="team-row"><span class="team-dot" style="background:#${hex(TC[t])}"></span><span>${n}</span><span>${o?o.n:'vazio'}</span><span class="team-bed ${alive?'alive':'dead'}">${!o?'—':bed[t]?'CAMA':'SEM CAMA'}</span></div>`}).join(''));
}
const pick=n=>{if(bowCharging){bowCharging=false;$('bowCharge').style.display='none'}const next=(n+SL.length)%SL.length;if(next===cur&&canonicalSlot(next)===6){cycleTnt();return}cur=next;lastHeldSig='';refreshHeld();hud()};
let shopCat='Compra Rápida',lastBuyAt=0,lastShopSig='';
const SHOP_CATS=['Compra Rápida','Blocos','Combate','Armadura','Ferramentas','Arcos','Poções','Utilidades','Melhorias'];
const QUICK_DEFAULT=['wool','planks','endstone','sw1','ar1','pick1','bow','arrow','tnt','fireball','apple','pearl','compass','magicMilk','bridgeEgg','popupTower','knockbackStick','speedPotion','jumpPotion'];let QUICK_KEYS=(()=>{try{const q=JSON.parse(localStorage.getItem('bwQuickBuy')||'null');if(Array.isArray(q)&&q.length)return q}catch(e){}return [...QUICK_DEFAULT]})();function toggleQuick(k){const i=QUICK_KEYS.indexOf(k);if(i>=0)QUICK_KEYS.splice(i,1);else QUICK_KEYS.push(k);try{localStorage.setItem('bwQuickBuy',JSON.stringify(QUICK_KEYS))}catch(e){}lastShopSig='';drawShop(true)}
const TRAP_LABEL={trapMiner:'Fadiga de Mineração',trapBlind:'É uma Armadilha!',trapAlarm:'Alarme / Revelação',trapCounter:'Contra-Ataque'};
const CK={Blocos:'🧱',Combate:'⚔️',Armadura:'🛡️',Ferramentas:'⛏️',Arcos:'🏹',Poções:'🧪',Utilidades:'💥',Melhorias:'💎'};
function shopKey(s){if(s[3]==='sw')return 'sw'+s[5];if(s[3]==='ar')return 'ar'+s[5];if(s[3]==='tool')return s[4]+s[5];return String(s[4])}
function shopPrice(s){if(s[3]==='trap')return [1,2,4][Math.min(2,trapQueue.length)]||4;const modes=s[8]||null;return modes&&modes[currentMode]!=null?modes[currentMode]:s[2]}
function buyItem(i){const now=performance.now();if(now-lastBuyAt<120)return;lastBuyAt=now;send({t:'buy',i})}
function shopOwned(s){
 if(s[3]==='sw')return sw>=s[5];
 if(s[3]==='ar')return ar>=s[5];
 if(s[3]==='tool')return (tools[s[4]]||0)>=s[5];
 if(s[3]==='up')return (up[s[4]]||0)>=s[5];
 if(s[3]==='trap')return false;
 if(s[3]==='inv'&&['bow','compass','knockbackStick'].includes(s[4]))return (inv[s[4]]||0)>0;
 return false;
}
function shopSig(){return [shopCat,currentMode,inv.iron,inv.gold,inv.dia,inv.em,inv.bow,inv.compass,inv.magicMilk,inv.bridgeEgg,inv.popupTower,inv.knockbackStick,sw,ar,tools.pick,tools.axe,tools.shears,up.sharp,up.prot,up.forge,up.haste,up.regen,trapQueue.join(',')].join('|')}
function drawShop(force=false){
 const sig=shopSig();if(!force&&sig===lastShopSig)return;lastShopSig=sig;
 html('shopTabs',SHOP_CATS.map(c=>`<button class="shop-tab ${c===shopCat?'active':''}" onclick="shopCat='${c}';drawShop(true)"><span class="tab-icon">${c==='Compra Rápida'?'★':CK[c]||'•'}</span><span>${c}</span></button>`).join(''));
 const list=SH.map((s,i)=>({s,i,key:shopKey(s)})).filter(o=>shopCat==='Compra Rápida'?QUICK_KEYS.includes(o.key):(o.s[6]||'Outros')===shopCat);
 html('sl',list.map(o=>{
   const s=o.s,price=shopPrice(s),currency=s[1],trapFull=s[3]==='trap'&&trapQueue.length>=3,trapDead=s[3]==='trap'&&!bed[me.team],diamondArmor=s[3]==='ar'&&s[5]===2,cant=(diamondArmor?((inv.em||0)<4||(inv.dia||0)<32):(inv[currency]||0)<price)||trapFull||trapDead,owned=shopOwned(s),icon=s[7]||'□';
   const state=owned?'owned':cant?'cant':'';
   const costText=trapFull?'FILA CHEIA':trapDead?'SEM CAMA':owned?'COMPRADO':diamondArmor?'4 esmeraldas + 32 diamantes':price+' '+(CN[currency]||currency);
   return `<button class="shop-card ${state}" onclick="buyItem(${o.i})" ${owned?'disabled':''}>
     <span class="quick-star ${QUICK_KEYS.includes(o.key)?'on':''}" onclick="event.stopPropagation();toggleQuick('${o.key}')">★</span><span class="slot-icon">${icon}</span>
     <span class="item-name">${s[0]}</span>
     <span class="item-cost cur-${currency}">${costText}</span>
     ${cant&&!owned?'<span class="cant-mark">✕</span>':''}
   </button>`
 }).join(''));
 html('trapQueue',shopCat==='Melhorias'?`<div class="trap-queue"><b>Fila de traps (${trapQueue.length}/3)</b>${trapQueue.length?trapQueue.map((k,i)=>`<span>${i+1}. ${TRAP_LABEL[k]||k}</span>`).join(''):'<span>Vazia</span>'}<small>Próxima: ${[1,2,4][Math.min(2,trapQueue.length)]||4} diamante(s)</small></div>`:'');
 html('shopWallet',`<b class="wallet-title">VOCÊ TEM</b><span class="wallet iron"><img src="${RI.iron}"> ${inv.iron}</span><span class="wallet gold"><img src="${RI.gold}"> ${inv.gold}</span><span class="wallet dia"><img src="${RI.dia}"> ${inv.dia}</span><span class="wallet em"><img src="${RI.em}"> ${inv.em}</span>${shopCat==='Compra Rápida'?'<small class="quick-hint">★ Favoritos: use a estrela dos itens para personalizar</small>':''}`);
}
drawShop();
const scr=n=>['menu','lobby','ov','shop','chest','profile','ranking','hotbarEditor','end'].forEach(k=>$(k).style.display=k===n?'flex':'none'),cv=R.domElement;
const SHOP_RADIUS=10;
function shopPosition(){return worldMeta.SHOP&&worldMeta.SHOP[me.team]||[IS[me.team][0]+.5,BASE_Y+2,IS[me.team][1]+.5]}
function canUseShop(){const [x,y,z]=shopPosition();return Math.hypot(pl.x-x,pl.z-z)<=SHOP_RADIUS&&Math.abs(pl.y-y)<6}
function openShop(){
 if(!started||over)return;
 if(!canUseShop()){msg('Chegue mais perto da loja do seu time.');sfx('blocked');return}
 shopOpen=1;drawShop(true);try{document.exitPointerLock()}catch(e){};scr('shop')
}
function closeShop(){shopOpen=0;scr(null);requestGameLock()}
document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement)scr(null);else if(started&&!over)scr(chestOpen?'chest':shopOpen?'shop':'ov')});
$('ov').onclick=()=>{audioInit();scr(null);requestGameLock()};
// rede e reconexão
const NET_RECONNECT_MS=60000,NET_CONNECT_TIMEOUT_MS=8000,NET_STALE_MS=25000,NET_PING_MS=10000;
let netSeq=0,netAttemptAt=0,socketOpenedAt=0,lastNetMessageAt=Date.now(),connectTimeout=null,reconnectFailCount=0;
const send=o=>{
 const sock=ws;if(!sock||sock.readyState!==1)return false;
 try{sock.send(JSON.stringify(o));return true}catch(err){console.warn('[NET] falha ao enviar',err);try{sock.close(4003,'send error')}catch(e){}return false}
};
function saveReconnect(){if(roomCode&&reconnectToken)sessionStorage.setItem('bwReconnect',JSON.stringify({room:roomCode,token:reconnectToken,name:$('nm').value||'Jogador'}))}
function clearReconnect(){sessionStorage.removeItem('bwReconnect');reconnectToken='';roomCode=''}
function setReconnectBanner(text){$('reconnectBanner').textContent=text;$('reconnectBanner').style.display=text?'block':'none'}
function stopConnectTimeout(){if(connectTimeout){clearTimeout(connectTimeout);connectTimeout=null}}
function connectSocket(mode='join'){
  const seq=++netSeq,sock=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host);
  ws=sock;netAttemptAt=Date.now();socketOpenedAt=0;stopConnectTimeout();
  connectTimeout=setTimeout(()=>{if(ws===sock&&sock.readyState===0){console.warn('[NET] timeout em CONNECTING');try{sock.close(4000,'connect timeout')}catch(e){}}},NET_CONNECT_TIMEOUT_MS);
  sock.onopen=()=>{
    if(ws!==sock||seq!==netSeq)return;stopConnectTimeout();socketOpenedAt=Date.now();lastNetMessageAt=Date.now();
    if(mode==='reconnect')send({t:'reconnect',room:roomCode,token:reconnectToken});
    else{roomCode=($('rm').value||'sala').slice(0,12).toLowerCase();$('rc').textContent=roomCode;send({t:'join',name:$('nm').value||'Jogador',room:roomCode,profileId:localProfileId})}
  };
  sock.onmessage=e=>{if(ws!==sock||seq!==netSeq)return;lastNetMessageAt=Date.now();try{const m=JSON.parse(e.data);on(m)}catch(err){console.error('Pacote de rede ignorado sem travar o jogo',err);msg('Sincronização recuperada automaticamente')}};
  sock.onerror=e=>{if(ws!==sock)return;console.warn('[NET] WebSocket error',e);if(!reconnecting)$('er').textContent='Não consegui conectar ao servidor.'};
  sock.onclose=e=>{
    stopConnectTimeout();
    if(ws!==sock||seq!==netSeq){console.debug('[NET] fechamento de socket antigo ignorado',e.code,e.reason);return}
    console.warn('[NET] socket fechado',e.code,e.reason||'sem motivo');
    if(over)return;
    if(started&&reconnectToken){startReconnect()}else if(!reconnecting)msg('Conexão perdida');
  };
}
function finishReconnect(){reconnecting=false;clearTimeout(reconnectTimer);reconnectTimer=null;stopConnectTimeout();reconnectFailCount=0;lastNetMessageAt=Date.now();setReconnectBanner('')}
function startReconnect(){
  if(!reconnectToken)return;
  if(!reconnecting){reconnecting=true;reconnectUntil=Date.now()+NET_RECONNECT_MS;reconnectFailCount=0}
  try{document.exitPointerLock()}catch(e){}
  const attempt=()=>{
    if(!reconnecting)return;
    const now=Date.now(),left=Math.max(0,Math.ceil((reconnectUntil-now)/1000));
    if(!left){reconnecting=false;setReconnectBanner('Reconexão não foi possível.');clearReconnect();setTimeout(()=>location.reload(),1200);return}
    setReconnectBanner('Conexão perdida. Tentando reconectar... ('+left+'s)');
    const state=ws?ws.readyState:3,age=now-netAttemptAt;
    if(state===0&&age>NET_CONNECT_TIMEOUT_MS){try{ws.close(4000,'connect timeout')}catch(e){}}
    else if(state===1&&socketOpenedAt&&now-socketOpenedAt>NET_CONNECT_TIMEOUT_MS&&now-lastNetMessageAt>NET_CONNECT_TIMEOUT_MS){try{ws.close(4001,'reconnect handshake timeout')}catch(e){}}
    else if(state===2&&age>3000)connectSocket('reconnect');
    else if(!ws||state===3)connectSocket('reconnect');
    reconnectTimer=setTimeout(attempt,1500);
  };
  clearTimeout(reconnectTimer);attempt();
}
setInterval(()=>{
  if(over||!ws)return;
  const now=Date.now();
  if(ws.readyState===1){
    send({t:'netPing',at:now});
    if(started&&now-lastNetMessageAt>NET_STALE_MS){console.warn('[NET] conexão sem pacotes por '+(now-lastNetMessageAt)+'ms');try{ws.close(4002,'stale connection')}catch(e){}}
  }else if(started&&reconnectToken&&!reconnecting)startReconnect();
},NET_PING_MS);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&started&&reconnectToken&&(!ws||ws.readyState!==1))startReconnect()});
addEventListener('online',()=>{if(started&&reconnectToken&&(!ws||ws.readyState!==1))startReconnect()});
$('go').onclick=()=>{$('er').textContent='Conectando…';connectSocket('join')};
$('st').onclick=()=>{send({t:'start'});requestGameLock()};
function leaveToLobby(){clearReconnect();location.reload()}
function replaySameRoom(){send({t:'replay'});$('endSub').textContent='Preparando nova partida na mesma sala...'}
function exploreLobby(){if(started)return;lobbyExplore=true;scr(null);if(!touchMode)cv.requestPointerLock()}
function showLobby(){if(started)return;lobbyExplore=false;try{document.exitPointerLock()}catch(e){}scr('lobby')}
function mkp(id,t){const g=new THREE.Group(),m=c=>new THREE.MeshBasicMaterial({color:c}),info=INFO[id]||{n:'?'};
const bd=new THREE.Mesh(new THREE.BoxGeometry(.6,.6,.35),m(TC[t]));bd.position.y=.9;const hd=new THREE.Mesh(new THREE.BoxGeometry(.45,.45,.45),m(0xe8b98a));hd.position.y=1.5;g.add(bd,hd);
const lm=(x,y,w,h,c)=>{const q=new THREE.Mesh(new THREE.BoxGeometry(w,h,w).translate(0,-h/2,0),m(c));q.position.set(x,y,0);g.add(q);return q};
const ll=lm(-.15,.6,.25,.6,0x333366),rl=lm(.15,.6,.25,.6,0x333366),la=lm(-.4,1.2,.2,.6,0xe8b98a),ra=lm(.4,1.2,.2,.6,0xe8b98a);
const c=document.createElement('canvas');c.width=256;c.height=48;const x=c.getContext('2d');x.font='bold 30px monospace';x.textAlign='center';x.lineWidth=5;x.strokeStyle='#000';x.fillStyle='#fff';x.strokeText(info.n,128,34);x.fillText(info.n,128,34);
const lb=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false}));lb.scale.set(2,.38,1);lb.position.y=2.4;g.add(lb);
const held=new THREE.Group();held.position.set(.48,1.06,-.18);held.rotation.set(.1,0,-.35);g.add(held);
const armorRoot=new THREE.Group();g.add(armorRoot);
sc.add(g);return{m:g,held,armorRoot,armorTier:-1,limbs:{ll,rl,la,ra},hs:-1,tx:0,ty:0,tz:0,lx:0,lz:0,speed:0,yaw:0,al:1,init:0,action:0}}
const FX_GEO=new THREE.BoxGeometry(.15,.15,.15),FX_MAT=new Map(),PROJ=new Map(),PT_POOL=[];
const PJ_GEO={arrow:new THREE.BoxGeometry(.06,.06,.5),fireball:new THREE.SphereGeometry(.18,6,6),snowball:new THREE.SphereGeometry(.13,6,6),pearl:new THREE.SphereGeometry(.15,7,7),bridgeEgg:new THREE.SphereGeometry(.16,8,6),tnt:new THREE.BoxGeometry(.32,.32,.32),tntImpulse:new THREE.BoxGeometry(.32,.32,.32),tntSlow:new THREE.BoxGeometry(.32,.32,.32),tntDamage:new THREE.BoxGeometry(.32,.32,.32)};
const PJ_MAT={arrow:new THREE.MeshBasicMaterial({color:0x9b6a3c}),fireball:new THREE.MeshBasicMaterial({color:0xff6a00}),snowball:new THREE.MeshBasicMaterial({color:0xffffff}),pearl:new THREE.MeshBasicMaterial({color:0x8b4bc7}),bridgeEgg:new THREE.MeshBasicMaterial({color:0xffe6a2}),tnt:new THREE.MeshBasicMaterial({color:0xd7352f}),tntImpulse:new THREE.MeshBasicMaterial({color:0xe8f4ff}),tntSlow:new THREE.MeshBasicMaterial({color:0x4f9dff}),tntDamage:new THREE.MeshBasicMaterial({color:0xff3154})};
const PJ_POOL=new Map();function acquireProjectileMesh(k){const a=PJ_POOL.get(k)||[];if(a.length){const m=a.pop();m.visible=true;return m}const m=new THREE.Mesh(PJ_GEO[k]||PJ_GEO.snowball,PJ_MAT[k]||PJ_MAT.snowball);sc.add(m);return m}function releaseProjectileMesh(k,m){m.visible=false;const a=PJ_POOL.get(k)||[];if(a.length<18)a.push(m);else sc.remove(m);PJ_POOL.set(k,a)}
function fx(x,y,z,c,n=8){let mm=FX_MAT.get(c);if(!mm){mm=new THREE.MeshBasicMaterial({color:c});FX_MAT.set(c,mm)}const cap=lowEnd?Math.min(n,8):Math.min(n,20);for(let i=0;i<cap;i++){let m=PT_POOL.pop();if(!m){m=new THREE.Mesh(FX_GEO,mm);sc.add(m)}m.material=mm;m.visible=true;m.position.set(x,y,z);PT.push({m,vx:(Math.random()-.5)*8,vy:Math.random()*6,vz:(Math.random()-.5)*8,t:.6})}}
const BEDFX=[];
function bedBurst(team,pos){if(!pos)return;const c=TC[team]||0xffffff;fx(pos[0]+.5,pos[1]+.7,pos[2]+.5,c,26);const beam=new THREE.Mesh(new THREE.BoxGeometry(.16,18,.16),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.8}));beam.position.set(pos[0]+.5,pos[1]+9,pos[2]+.5);sc.add(beam);BEDFX.push({m:beam,t:1.35})}
function ensureProjectile(id,k,x,y,z){let p=PROJ.get(id);if(!p){const mesh=acquireProjectileMesh(k);mesh.position.set(x,y,z);p={m:mesh,k,tx:x,ty:y,tz:z,vx:0,vy:0,vz:0,snapAt:performance.now()};PROJ.set(id,p)}return p}
function syncProjectiles(list){const seen=new Set();(list||[]).forEach(([id,k,x,y,z,vx=0,vy=0,vz=0])=>{seen.add(id);const p=ensureProjectile(id,k,x,y,z);p.tx=x;p.ty=y;p.tz=z;p.vx=vx;p.vy=vy;p.vz=vz;p.snapAt=performance.now()});PROJ.forEach((p,id)=>{if(!seen.has(id)){releaseProjectileMesh(p.k,p.m);PROJ.delete(id)}})}
function remoteHeld(r,slot,team,swordLevel){
 const sig=slot+':'+team+':'+swordLevel;if(r.hs===sig)return;r.hs=sig;while(r.held.children.length)r.held.remove(r.held.children[0]);
 const model=heldModel(slot,team,swordLevel);model.scale.set(.65,.65,.65);r.held.add(model);
}
function armorPieceBox(w,h,d,c,x,y,z){const m=box(w,h,d,c);m.position.set(x,y,z);return m}
function makeVoxelArmor(tier){const g=new THREE.Group(),main=tier===2?0x54dfe9:0xd8dde2,edge=tier===2?0xb6ffff:0xffffff,dark=tier===2?0x1f8f9c:0x8b9299;const helm=new THREE.Group();helm.add(armorPieceBox(.62,.16,.58,main,0,.18,0),armorPieceBox(.12,.28,.58,dark,-.25,.02,0),armorPieceBox(.12,.28,.58,dark,.25,.02,0),armorPieceBox(.60,.08,.10,edge,0,.04,.27));helm.position.y=1.48;g.add(helm);g.add(armorPieceBox(.66,.55,.30,main,0,.92,0),armorPieceBox(.48,.14,.34,edge,0,1.18,0),armorPieceBox(.18,.18,.38,dark,-.40,1.12,0),armorPieceBox(.18,.18,.38,dark,.40,1.12,0),armorPieceBox(.58,.12,.31,dark,0,.60,0),armorPieceBox(.44,.18,.27,main,0,.47,0));for(const x of [-.17,.17])g.add(armorPieceBox(.22,.38,.25,main,x,.20,0),armorPieceBox(.25,.13,.34,dark,x,-.03,.055),armorPieceBox(.19,.05,.36,edge,x,.02,.08));if(tier===2){const gem=sphere(.065,0xc8ffff);gem.position.set(0,1.02,.19);g.add(gem)}return g}
function syncRemoteArmor(r,tier){if(r.armorTier===tier)return;r.armorTier=tier;while(r.armorRoot.children.length)r.armorRoot.remove(r.armorRoot.children[0]);if(!tier)return;r.armorRoot.add(makeVoxelArmor(tier))}
const DROP=new Map(),DROP_POOL=new Map();
function acquireDrop(k){const pool=DROP_POOL.get(k)||[];if(pool.length){const m=pool.pop();m.visible=true;return m}return resourceModel(k,k==='iron'||k==='gold'?.82:.95)}
function releaseDrop(k,m){m.visible=false;const pool=DROP_POOL.get(k)||[];if(pool.length<24)pool.push(m);else{sc.remove(m);m.traverse(x=>{if(x.geometry)x.geometry.dispose();if(x.material)x.material.dispose&&x.material.dispose()})}DROP_POOL.set(k,pool)}
function syncDrops(l){const seen=new Set();l.forEach(d=>{seen.add(d.id);let o=DROP.get(d.id);if(!o){const m=acquireDrop(d.k);if(!m.parent)sc.add(m);o={m,k:d.k,baseY:d.y,phase:(d.id%17)*.37};DROP.set(d.id,o)}o.baseY=d.y;o.m.position.set(d.x,d.y,d.z);o.n=d.n});DROP.forEach((o,id)=>{if(!seen.has(id)){releaseDrop(o.k,o.m);DROP.delete(id)}})}
let dropVisualAt=0,dropVisualDisabled=false;function updateDropVisuals(now){const gap=lowEnd?66:qualityMode==='medium'?44:33;if(dropVisualDisabled||now-dropVisualAt<gap)return;dropVisualAt=now;const t=now*.001;try{DROP.forEach(o=>{o.m.rotation.y=t*1.8+o.phase;o.m.rotation.z=Math.sin(t*.9+o.phase)*.08;const d=Math.hypot(o.m.position.x-pl.x,o.m.position.z-pl.z);if(me.alive&&d<3.2){const a=(3.2-d)/3.2*.14;o.m.position.x+=(pl.x-o.m.position.x)*a;o.m.position.z+=(pl.z-o.m.position.z)*a;o.baseY+=(pl.y+.65-o.baseY)*a}o.m.position.y=o.baseY+.15+Math.sin(t*2.6+o.phase)*.08})}catch(err){dropVisualDisabled=true;console.warn('Drops visuais desativados para preservar gameplay',err)}}
function on(m){switch(m.t){
case'init':me.id=m.id;me.team=m.team;roomCode=m.room||roomCode;reconnectToken=m.token||reconnectToken;myProfile=m.profile||myProfile;rankingData=m.ranking||rankingData;drawProfile();drawRanking();saveReconnect();loadMap(m.mapId||'classic',true,m.activeChunks);BLOCK_SEQ.clear();lastBlockSeq=0;(m.ed||[]).forEach(applyServerBlock);flush(999);syncDrops(m.drops||[]);pl.yaw=0;break;
case'reconnected':
 finishReconnect();me.id=m.id;me.team=m.team;roomCode=m.room;currentMode=m.modeId||currentMode;reconnectToken=m.token;me.alive=m.alive??me.alive;me.out=!!m.out;spectator=!!m.spectator;saveReconnect();
 INFO={};(m.roster||[]).forEach(([id,n,t])=>INFO[id]={n,t});loadMap(m.mapId||currentMap,m.st==='lobby',m.activeChunks);BLOCK_SEQ.clear();lastBlockSeq=0;(m.ed||[]).forEach(applyServerBlock);flush(999);syncDrops(m.drops||[]);bed=m.bed||bed;
 syncBedVisuals(worldMeta,bed);inv=m.inv||inv;sw=m.sw??sw;ar=m.ar??ar;tools=m.tools||tools;up=m.up||up;fxs=m.fx||fxs;trapQueue=m.traps||trapQueue;started=m.st==='play';over=m.st==='ended';if(m.admin)setAdminMode(true,m.adminPlayers||[]);hud();scr(started?null:'lobby');break;
case'replay':over=0;started=0;clearRespawn();scr('lobby');break;
case'reconnectFail':{reconnectFailCount++;if(reconnecting&&Date.now()<reconnectUntil&&reconnectFailCount<3){setReconnectBanner('Servidor ainda não confirmou a sessão. Nova tentativa...');try{if(ws&&ws.readyState<=1)ws.close(4004,'retry reconnect')}catch(e){}break}reconnecting=false;clearTimeout(reconnectTimer);setReconnectBanner('Sessão expirada.');clearReconnect();setTimeout(()=>location.reload(),1000);break}
case'netPong':{const recv=Date.now(),sent=Number(m.at)||recv,rtt=Math.max(0,recv-sent),serverAt=Number(m.serverAt);lastNetMessageAt=recv;diag.ping=rtt;combatNetRttMs=combatNetRttMs?combatNetRttMs*.8+rtt*.2:rtt;if(Number.isFinite(serverAt)){const off=serverAt-(sent+recv)/2;combatClockOffsetMs=combatClockSynced?combatClockOffsetMs*.8+off*.2:off;combatClockSynced=true}diag.serverBuffer=Number(m.buffer)||0;if(m.metrics){const sm=m.metrics;diag.serverTickMs=sm.lastTickMs||0;diag.serverTickAvg=sm.avgTickMs||0;diag.serverTickMax=sm.maxTickMs||0;diag.serverOverruns=sm.overruns||0;diag.serverRooms=sm.rooms||0;diag.serverPlayers=sm.players||0;diag.serverRss=sm.rssMB||0;if(sm.move){diag.moveCorrections=sm.move.corrections||0;diag.moveSuspicion=sm.move.suspicion||0}}if(m.ac)diag.ac=m.ac;break}
case'ac':diag.ac=diag.ac||{};diag.ac.total=m.total||diag.ac.total||0;diag.ac.last=m.last||m.type||'';console.warn('[AC blocked]',m.type,m.last||'');break;
case'profileUpdate':myProfile=m.profile||myProfile;drawProfile();if(m.xpGain)msg('+'+m.xpGain+' XP');break;
case'ranking':rankingData=m.ranking||[];if(m.profile)myProfile=m.profile;drawProfile();drawRanking();break;
case'chestState':chestKind=m.kind||'team';chestData=m.items||{};chestGenTier=m.genTier||0;chestGenNext=m.genNext||null;chestGenCurrent=m.genCurrent||'';chestOpen=1;drawChest();scr('chest');try{document.exitPointerLock()}catch(e){}break;
case'lobby':{
 INFO={};m.l.forEach(([id,n,t,d])=>INFO[id]={n,t,d});const mine=m.l.find(q=>q[0]===me.id);if(mine)me.team=mine[2];
 currentMode=m.modeId||currentMode;
 if(m.mapId&&m.mapId!==currentMap)loadMap(m.mapId,true,m.activeChunks);
 const activeTeams=m.activeTeams||[0,1],teamCap=m.teamCap||2,soloMode=!!m.solo,counts=[0,0,0,0];m.l.forEach(q=>counts[q[2]]++);
 $('pl').innerHTML=m.l.map(([id,n,t,d])=>`<p style="color:#${hex(TC[t])}">■ ${n}${id===me.id?' (você)':''}${id===m.host?' ★ anfitrião':''}${d?' · desconectado':''}</p>`).join('');
 $('modePick').innerHTML=(m.modes||[]).map(md=>`<button class="map-card${md.id===currentMode?' active':''}" ${me.id===m.host?'':'disabled'} onclick="send({t:'mode',mode:'${md.id}'})"><b>${md.name}</b><small>${md.description||''}</small></button>`).join('');
 $('teamPick').innerHTML=activeTeams.map(t=>`<button class="team-btn${me.team===t?' active':''}" style="background:#${hex(TC[t])}" onclick="send({t:'team',team:${t}})">${soloMode?'Base ':''}${TN[t]} (${counts[t]}/${teamCap})</button>`).join('');
 $('mapPick').innerHTML=(m.maps||Object.values(MAPS)).map(mp=>`<button class="map-card${mp.id===m.mapId?' active':''}" ${me.id===m.host?'':'disabled'} onclick="send({t:'map',map:'${mp.id}'})">${mp.name}<small>${mp.description||''}</small></button>`).join('');
 $('st').style.display=me.id===m.host?'block':'none';$('wt').textContent=me.id===m.host?(soloMode?`Modo SOLO · cada jogador ocupa uma base diferente · escolha o mapa.`:`Modo ${currentMode.toUpperCase()} · organize Azul x Vermelho e escolha o mapa.`):'Aguardando o anfitrião iniciar.';scr('lobby');hud();break}
case'map':loadMap(m.mapId||'classic',true,m.activeChunks);break;
case'start':HELD_CACHE.clear();setTimeout(preloadHeld,50);currentMode=m.modeId||currentMode;loadMap(m.mapId||currentMap,false,m.activeChunks);started=1;bed=m.bed;syncBedVisuals(worldMeta,bed);matchTime=0;matchPlayers.clear();myMatchStats={kills:0,finalKills:0};clearRespawn();scr(touchMode||document.pointerLockElement?null:'ov');hud();renderScoreboard(true);break;
case's':{if(Number.isInteger(m.seq)){if(m.seq<=lastSnapshotSeq)break;lastSnapshotSeq=m.seq;diag.snapshotSeq=m.seq}syncProjectiles(m.pr||[]);if(m.time!=null)matchTime=m.time;if(m.bed)bed=m.bed;if(m.gen)genState=m.gen;if(m.phase)matchPhase=m.phase;const seen=new Set();m.p.forEach(([id,x,y,z,yw,pt,hp,al,tm,iv,hs,rsw,rar,disc,radmin,out,rt,kills,finalKills,spawnProt])=>{seen.add(id);matchPlayers.set(id,{id,team:tm,alive:!!al,out:!!out,admin:!!radmin,kills:kills||0,finalKills:finalKills||0,rt:rt||0});if(id===me.id){me.hp=hp;me.alive=al;me.out=!!out;me.spawnProtect=!!spawnProt;myMatchStats={kills:kills||0,finalKills:finalKills||0};return}
let r=PL.get(id);if(!r)PL.set(id,r=mkp(id,tm));r.speed=Math.hypot(x-r.tx,z-r.tz);r.lx=r.tx;r.lz=r.tz;r.tx=x;r.ty=y;r.tz=z;r.yaw=yw;r.al=al;r.iv=iv;r.disc=disc;r.m.visible=!radmin;remoteHeld(r,hs||0,tm,rsw||0);syncRemoteArmor(r,rar||0);if(!r.init){r.init=1;r.m.position.set(x,y,z)}});
PL.forEach((r,id)=>{if(!seen.has(id)){sc.remove(r.m);PL.delete(id);matchPlayers.delete(id)}});renderScoreboard();break}
case'bb':m.l.forEach(a=>{if(applyServerBlock(a))BRIDGE_PRED.delete(a[0]+','+a[1]+','+a[2])});unstick();break;
case'placeResult':{const key=m.x+','+m.y+','+m.z,b=BRIDGE_PRED.get(key);if(b&&m.opSeq&&b.opSeq&&m.opSeq!==b.opSeq)break;if(Number.isFinite(m.blockSeq))lastBlockSeq=Math.max(lastBlockSeq,m.blockSeq||0);if(b)diag.placePing=Math.round(performance.now()-b.at);if(PLACEABLE.has(m.k)&&Number.isFinite(m.remaining))inv[m.k]=Math.max(0,Math.floor(m.remaining));if(m.ok){diag.placeAccepted++;if(b)b.acked=true}else{diag.placeRejected++;if(b)rollbackPrediction(key,false);if(m.reason==='stale_op'||m.reason==='occupied'){const n=performance.now();if(n-lastStateSyncAt>800){lastStateSyncAt=n;send({t:'stateSync'})}}}hud();break}
case'breakp':breakDur=m.d;breakAt=performance.now();$('breakBox').style.display='block';break;
case'breakCancel':breaking=null;breakDur=0;miningTool=null;lastHeldSig='';$('breakBox').style.display='none';crackBox.visible=false;refreshHeld();break;
case'drops':syncDrops(m.l);break;
case'tp':{const d=Math.hypot(m.x-pl.x,m.y-pl.y,m.z-pl.z);if(!m.hard&&d<3&&me.alive)serverCorrection={x:m.x,y:m.y,z:m.z,t:.16};else{pl.x=m.x;pl.y=m.y;pl.z=m.z;pl.vy=0;pl.kx=pl.kz=0;serverCorrection=null}break}
case'kb':pl.kx+=m.kx;pl.kz+=m.kz;pl.vy=Math.max(pl.vy,m.vy);sfx('hurt');break;
case'hitok':$('cross').style.transform='scale(1.9)';$('cross').classList.add('hit');setTimeout(()=>{$('cross').style.transform='';$('cross').classList.remove('hit')},85);camShake=Math.max(camShake,m.cr?.10:.055);sfx(m.cr?'crit':'hit');{const r=PL.get(m.id);if(r){r.flashUntil=performance.now()+(m.cr?145:105);r.m.traverse(o=>{if(o.material&&o.material.color){o.userData.baseColor=o.userData.baseColor??o.material.color.getHex();o.material.color.setHex(m.cr?0xfff2a8:0xffffff)}})}}{const c=$('comboHud');if(m.combo>1){c.textContent='COMBO x'+m.combo;c.classList.add('show');comboHudUntil=performance.now()+900}else{c.classList.remove('show');comboHudUntil=0}}break;
case'hitfx':combatBurst(m);break;
case'hurtPulse':if(m.breakCombo){const c=$('comboHud');c.classList.remove('show');c.textContent='';comboHudUntil=0}screenHurt(!!m.cr);break;
case'deathState':setRespawn(!!m.final,m.respawn||0,m.final?'Você foi eliminado.':'');if(m.final){spectator=true;me.out=true;setTimeout(()=>msg('Modo espectador · Q/E troca alvo · F voo livre'),250)}break;
case'eliminated':setRespawn(true,0,m.reason||'Você foi eliminado.');spectator=true;me.out=true;break;
case'respawn':spectator=false;me.out=false;lastRespawnBeep=-1;clearRespawn();break;
case'spawnProtect':me.spawnProtect=!!m.v;break;
case'phase':matchPhase=m.phase||'normal';if(matchPhase==='sudden')msg('☠ MORTE SÚBITA — todas as camas foram destruídas!');break;
case'projSpawn':{const p=m.p;ensureProjectile(p.id,p.k,p.x,p.y,p.z);const g=positionalGain(p.x,p.y,p.z,12),k=p.k==='fireball'||String(p.k).startsWith('tnt')?'fireball':p.k==='arrow'?'arrow':p.k==='pearl'?'pearl':'snowball';if(g>.02){if(k==='arrow')tone(440,.055,'triangle',.025*g,-180);else if(k==='fireball'){tone(85,.16,'sawtooth',.06*g,-45);noise(.12,.035*g,500)}else sfx(k)}break}
case'projHit':{const p=PROJ.get(m.id);if(p){PROJ.delete(m.id);if(m.k==='arrow'&&!m.target){p.m.position.set(m.x,m.y,m.z);p.m.lookAt(m.x-(m.vx||0),m.y-(m.vy||0),m.z-(m.vz||0));setTimeout(()=>releaseProjectileMesh(p.k,p.m),1200)}else releaseProjectileMesh(p.k,p.m)}if(m.k==='arrow')sfx(m.target?'hit':'arrowImpact');break}
case'projectileHit':{$('cross').style.transform='scale(1.75)';$('cross').classList.add('hit');setTimeout(()=>{$('cross').style.transform='';$('cross').classList.remove('hit')},90);camShake=Math.max(camShake,.035);sfx('projectileHit');break}
case'feed':addFeed(m);break;
case'chat':addChat(m);break;
case'adminMode':setAdminMode(m.enabled,m.players||[]);break;
case'anim':{const r=PL.get(m.id);if(r)r.action=performance.now()+(m.k==='mine'?500:320);break}
case'inv':if(m.seq&&m.seq<lastInvSeq)break;lastInvSeq=Math.max(lastInvSeq,m.seq||0);inv=m.i;sw=m.sw;ar=m.ar;up=m.up;tools=m.tools||tools;fxs=m.fx||fxs;trapQueue=m.traps||trapQueue;hud();if(shopOpen)drawShop();if(chestOpen)drawChest();break;
case'stateDigest':{if((m.invSeq||0)>lastInvSeq||(m.blockSeq||0)>lastBlockSeq+1){const n=performance.now();if(n-lastStateSyncAt>1500){lastStateSyncAt=n;send({t:'stateSync'})}}break}
case'stateSync':{if((m.invSeq||0)>=lastInvSeq){lastInvSeq=m.invSeq||lastInvSeq;inv=m.inv||inv;sw=m.sw??sw;ar=m.ar??ar;tools=m.tools||tools;up=m.up||up;fxs=m.fx||fxs;trapQueue=m.traps||trapQueue}if(Array.isArray(m.ed)){(m.ed||[]).forEach(applyServerBlock);flush(999)}lastBlockSeq=Math.max(lastBlockSeq,m.blockSeq||0);hud();diag.resyncs++;break}
case'buyResult':{const el=$('shop');el.classList.remove('purchase-ok','purchase-no');void el.offsetWidth;if(m.ok){el.classList.add('purchase-ok');tone(760,.055,'square',.03,120)}else{el.classList.add('purchase-no');msg(m.text||'Compra não realizada.');sfx('blocked')}setTimeout(()=>el.classList.remove('purchase-ok','purchase-no'),220);break}
case'bed':bed=m.bed;removeBedVisual(m.team);sfx('bed');bedBurst(m.team,m.pos);hud();renderScoreboard(true);break;
case'm':msg(m.s);break;
case'sfx':sfx(m.k);break;
case'sfx3d':{const g=positionalGain(m.x,m.y,m.z,m.r||7);if(g>0){if(String(m.k).startsWith('resource_')||String(m.k).startsWith('pickup_'))resourceSfx(m.k,g);else if(m.k==='place'||m.k==='place_cloth'){leptoksSound('cloth',.72*g,1.03)}else if(m.k==='place_wood'){leptoksSound('wood',.72*g,1.03)}else if(m.k==='place_stone'){leptoksSound('stone',.72*g,1.03)}else if(m.k==='break'||m.k==='break_stone'){leptoksSound('stone',.82*g,.96)}else if(m.k==='break_wood'){leptoksSound('wood',.82*g,.96)}else if(m.k==='break_cloth'){leptoksSound('cloth',.82*g,.96)}else if(m.k==='fireball'){tone(85,.14,'sawtooth',.05*g,-40);noise(.1,.03*g,500)}else sfx(m.k)}break;}
case'fx':fx(m.x,m.y,m.z,m.c);if(m.c===0xff8a2a||m.c===0xff6a00)sfx('fireball');break;
case'err':$('er').textContent=m.s;scr('menu');break;
case'end':{
 over=1;started=0;clearRespawn();clearReconnect();try{document.exitPointerLock()}catch(e){}
 const solo=m.modeId==='solo',win=solo?m.winnerId===me.id:m.winnerTeam===me.team;sfx(win?'victory':'death');$('et').textContent=win?'VITÓRIA!':'DERROTA!';$('et').className=win?'end-win':'end-loss';
 $('endSub').textContent=solo?(m.winnerId>=0?'Vencedor: '+(m.winnerName||'Jogador')+' · Tempo: '+Math.floor((m.time||0)/60)+':'+String(Math.floor((m.time||0)%60)).padStart(2,'0'):'Partida encerrada'):(m.winnerTeam>=0?'Time vencedor: '+TN[m.winnerTeam]+' · Tempo: '+Math.floor((m.time||0)/60)+':'+String(Math.floor((m.time||0)%60)).padStart(2,'0'):'Partida encerrada');
 const mine=m.progress&&m.progress[me.id];if(mine){myProfile=mine.profile||myProfile;drawProfile();$('endSub').textContent+=' · +'+(mine.xpGain||0)+' XP'}rankingData=m.ranking||rankingData;drawRanking();
 const rows=[...(m.stats||[])].sort((a,b)=>b.finalKills-a.finalKills||b.bedsDestroyed-a.bedsDestroyed||b.kills-a.kills);
 html('endStats','<table class="end-table"><thead><tr><th>Jogador</th><th>Time</th><th>Kills</th><th>Final</th><th>Camas</th><th>Mortes</th><th>Recursos</th></tr></thead><tbody>'+rows.map(r=>`<tr><td>${r.name}</td><td>${TN[r.team]}</td><td>${r.kills}</td><td>${r.finalKills}</td><td>${r.bedsDestroyed}</td><td>${r.deaths}</td><td>${r.resourcesCollected}</td></tr>`).join('')+'</tbody></table>');
 scr('end');break
}}}
// entrada
const touchMode=matchMedia('(pointer:coarse)').matches&&Math.min(innerWidth,innerHeight)<900;let mx=0,my=0,mLook=null,mJoy=null,lastWTap=0,doubleSprint=false,bridgeHeld=false,bridgeHoldY=null,lastBridgeAt=0,dragLook=false,lastDragX=0,lastDragY=0;const BRIDGE_PRED=new Map();let mobileCfg=(()=>{try{return Object.assign({sx:.006,sy:.006,size:1,opacity:.78},JSON.parse(localStorage.getItem('bwMobileCfg')||'{}'))}catch(e){return{sx:.006,sy:.006,size:1,opacity:.78}}})();function applyMobileCfg(){document.documentElement.style.setProperty('--mobile-scale',mobileCfg.size);document.documentElement.style.setProperty('--mobile-opacity',mobileCfg.opacity)}function saveMobileCfg(){try{localStorage.setItem('bwMobileCfg',JSON.stringify(mobileCfg))}catch(e){}applyMobileCfg()}applyMobileCfg();
addEventListener('keydown',e=>{if(document.activeElement===$('chatInput')){if(e.code==='Escape'){e.preventDefault();toggleChat(false)}return}if(e.code==='KeyT'||e.code==='Enter'){e.preventDefault();toggleChat(true);return}
if(e.code==='KeyW'&&!e.repeat){const n=performance.now();if(n-lastWTap<=280)doubleSprint=true;lastWTap=n}
K[e.code]=1;if(e.code==='F3'){e.preventDefault();diag.show=!diag.show;updateDiag(performance.now())}if(e.code==='F4'){e.preventDefault();cycleQuality()}if(e.code>='Digit1'&&e.code<='Digit9')pick(+e.code[5]-1);
if(e.code==='KeyL'&&!started&&me.id){e.preventDefault();lobbyExplore?showLobby():exploreLobby();return}if(spectator&&e.code==='KeyF'){specTarget=0;msg('Espectador: voo livre')}if(spectator&&(e.code==='KeyQ'||e.code==='KeyE')){const ids=[...matchPlayers.values()].filter(q=>q.alive&&!q.out&&!q.admin).map(q=>q.id);if(ids.length){let i=ids.indexOf(specTarget);i=(i+(e.code==='KeyE'?1:-1)+ids.length)%ids.length;specTarget=ids[i];msg('Observando '+(INFO[specTarget]?.n||'jogador'))}}
});
addEventListener('keyup',e=>{K[e.code]=0;if(e.code==='KeyW')doubleSprint=false});addEventListener('wheel',e=>pick(cur+(e.deltaY>0?1:-1)));
addEventListener('mousemove',e=>{let dx=0,dy=0;if(document.pointerLockElement){dx=e.movementX;dy=e.movementY}else if(dragLook&&!touchMode&&(started||lobbyExplore)){dx=e.clientX-lastDragX;dy=e.clientY-lastDragY;lastDragX=e.clientX;lastDragY=e.clientY}else return;pl.yaw-=dx*.0023;pl.pitch=Math.max(-1.55,Math.min(1.55,pl.pitch-dy*.0023))});
addEventListener('mouseup',()=>dragLook=false);
function requestGameLock(){if(touchMode||document.pointerLockElement)return;try{const q=cv.requestPointerLock();if(q&&q.catch)q.catch(()=>{})}catch(e){}}
cv.addEventListener('mousedown',e=>{if(!touchMode&&(started||lobbyExplore)){if(!document.pointerLockElement){dragLook=true;lastDragX=e.clientX;lastDragY=e.clientY;requestGameLock()}}});
document.addEventListener('pointerlockerror',()=>{if(started||lobbyExplore)msg('Clique novamente no jogo ou segure e arraste o mouse para olhar.')});
addEventListener('contextmenu',e=>e.preventDefault());
function ray(){
 const d=new THREE.Vector3();cam.getWorldDirection(d);let x=Math.floor(cam.position.x),y=Math.floor(cam.position.y),z=Math.floor(cam.position.z),prev=[x,y,z];
 const sx=d.x>0?1:-1,sy=d.y>0?1:-1,sz=d.z>0?1:-1,adx=Math.abs(1/(d.x||1e-9)),ady=Math.abs(1/(d.y||1e-9)),adz=Math.abs(1/(d.z||1e-9));
 let tx=((d.x>0?x+1:x)-cam.position.x)/(d.x||1e-9),ty=((d.y>0?y+1:y)-cam.position.y)/(d.y||1e-9),tz=((d.z>0?z+1:z)-cam.position.z)/(d.z||1e-9),dist=0;
 for(let n=0;n<20&&dist<=6;n++){if(get(x,y,z))return{h:[x,y,z],p:prev};prev=[x,y,z];if(tx<ty&&tx<tz){x+=sx;dist=tx;tx+=adx}else if(ty<tz){y+=sy;dist=ty;ty+=ady}else{z+=sz;dist=tz;tz+=adz}}
 return null
}
function viewAabbDistance(ox,oy,oz,dx,dy,dz,b,maxDist){
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
const ATTACK_BATCH_MS=20,ATTACK_BATCH_MAX=6;let attackSequence=0,attackFlushTimer=0,pendingAttacks=[],combatNetRttMs=0,combatClockOffsetMs=0,combatClockSynced=false;
function flushAttackBatch(){clearTimeout(attackFlushTimer);attackFlushTimer=0;if(!pendingAttacks.length)return;const attacks=pendingAttacks.splice(0,ATTACK_BATCH_MAX);send({t:'attackBatch',attacks});if(pendingAttacks.length)attackFlushTimer=setTimeout(flushAttackBatch,ATTACK_BATCH_MS)}
function queueMeleeAttack(id){const now=Date.now();pendingAttacks.push({seq:++attackSequence,id,clientTime:now,serverTimeEstimate:combatClockSynced?+(now+combatClockOffsetMs).toFixed(2):NaN,rtt:+combatNetRttMs.toFixed(1),yaw:pl.yaw,pitch:pl.pitch});if(pendingAttacks.length>=ATTACK_BATCH_MAX)flushAttackBatch();else if(!attackFlushTimer)attackFlushTimer=setTimeout(flushAttackBatch,ATTACK_BATCH_MS)}
let breaking=null,breakAt=0,breakDur=0;
function bestToolForBlock(b){const want=BLOCKS[b]?.tool;if(!want||!(tools[want]>0))return null;return want}
function primary(){if(!started||!me.alive)return;audioInit();if(ADMIN.on&&ADMIN.build){const r=ray();if(r)send({t:'adminBreak',x:r.h[0],y:r.h[1],z:r.h[2]});return}
 const chest=chestTarget();if(chest){if(chest.team!==me.team){msg('Esse baú pertence a outro time.');sfx('blocked');return}openChest(chest.kind);return}
 const vendor=vendorTarget();if(vendor){if(vendor.team!==me.team){msg('Este vendedor pertence a outro time.');sfx('blocked');return}openShop();return}
 swing=1;useAnim=1;clk.push(performance.now());while(clk.length>40)clk.shift();const enemy=playerTarget();if(enemy!==null){queueMeleeAttack(enemy);return}if(tg){const b=get(tg.h[0],tg.h[1],tg.h[2]);miningTool=bestToolForBlock(b);lastHeldSig='';refreshHeld();breaking=tg.h.join(',');breakAt=performance.now();breakDur=0;$('breakBox').style.display='none';send({t:'breakStart',x:tg.h[0],y:tg.h[1],z:tg.h[2]})}}
function stopBreak(){if(breaking){breaking=null;send({t:'breakStop'});$('breakBox').style.display='none';crackBox.visible=false}miningTool=null;lastHeldSig='';refreshHeld()}
function beginBow(){if(!started||!me.alive||!inv.bow||inv.arrow<1)return;bowCharging=true;bowChargeAt=performance.now();$('bowCharge').style.display='block';$('bowChargeFill').style.width='0%';$('bowTrajectory').classList.add('show')}
function drawBowTrajectory(){const el=$('bowTrajectory');if(!bowCharging){el.innerHTML='';el.classList.remove('show');return}const ratio=Math.max(.2,Math.min(1,(performance.now()-bowChargeAt)/1200)),speed=22+22*ratio,cy=Math.cos(pl.pitch),vx=-Math.sin(pl.yaw)*cy*speed,vy=Math.sin(pl.pitch)*speed,vz=-Math.cos(pl.yaw)*cy*speed,pts=[];for(let i=1;i<=13;i++){const t=i*.075,x=cam.position.x+vx*t,y=cam.position.y+vy*t-.5*8.2*t*t,z=cam.position.z+vz*t,v=new THREE.Vector3(x,y,z).project(cam);if(v.z<-1||v.z>1)continue;pts.push(`<i style="left:${'${(v.x*.5+.5)*100}'}%;top:${'${(-v.y*.5+.5)*100}'}%;opacity:${'${Math.max(.18,1-i/16)}'}"></i>`)}el.innerHTML=pts.join('')}
function releaseBow(){if(!bowCharging)return;bowCharging=false;const ratio=Math.max(.2,Math.min(1,(performance.now()-bowChargeAt)/1200));$('bowCharge').style.display='none';$('bowTrajectory').classList.remove('show');$('bowTrajectory').innerHTML='';useAnim=1;send({t:'shoot',k:'bow',yaw:pl.yaw,pitch:pl.pitch,charge:ratio,rtt:combatNetRttMs})}
const PLACEABLE=new Set(['wool','planks','endstone','glass','obsidian']);
function availableBlockCount(k){return Math.max(0,Math.floor(inv[k]||0))}
function predictionAt(x,y,z){return BRIDGE_PRED.get(x+','+y+','+z)||null}
function confirmedBlock(x,y,z){if(!get(x,y,z))return false;const b=predictionAt(x,y,z);return !b||!!b.acked}
function confirmedSupport(x,y,z){return [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].some(d=>confirmedBlock(x+d[0],y+d[1],z+d[2]))}
function rollbackPrediction(key,restore=false){const b=BRIDGE_PRED.get(key);if(!b)return;BRIDGE_PRED.delete(key);if(get(b.x,b.y,b.z)&&pf[ix(b.x,b.y,b.z)]){sb(b.x,b.y,b.z,0,0);flush(lowEnd?2:4)}if(restore&&b.reserved){inv[b.k]=(inv[b.k]||0)+1;hud()}}
function bridgeTarget(){
 const k=slotKey(cur);if(!PLACEABLE.has(k)||availableBlockCount(k)<=0||bridgeHoldY==null)return null;
 const speed=Math.hypot(pl.vx||0,pl.vz||0);if(speed<.55)return null;
 const dx=pl.vx/speed,dz=pl.vz/speed,currentY=Math.floor(pl.y-.08)-1;
 if(Math.abs(currentY-bridgeHoldY)>1)return null;
 const px=pl.x+dx*.66,pz=pl.z+dz*.66,y=bridgeHoldY,bx=Math.floor(px),bz=Math.floor(pz),cands=[[bx,bz]];
 if(Math.abs(dx)>.28&&Math.abs(dz)>.28){cands.push([Math.floor(px+Math.sign(dx)*.32),bz],[bx,Math.floor(pz+Math.sign(dz)*.32)])}
 let best=null,bestScore=Infinity;for(const [x,z] of cands){if(!inXZ(x,z)||y<1||y>=H-2||get(x,y,z)||!safePlaceTarget(x,y,z)||!confirmedSupport(x,y,z))continue;const forward=(x+.5-pl.x)*dx+(z+.5-pl.z)*dz;if(forward<-.12||forward>1.65)continue;const lateral=Math.abs((x+.5-pl.x)*(-dz)+(z+.5-pl.z)*dx),score=lateral+Math.abs(forward-.72)*.22;if(score<bestScore){bestScore=score;best={x,y,z,k,auto:1}}}return best;
}
function predictPlace(p){
 if(!p||!PLACEABLE.has(p.k)||availableBlockCount(p.k)<=0||get(p.x,p.y,p.z))return false;
 const blockId=p.k==='wool'?me.team+1:p.k==='planks'?5:p.k==='endstone'?12:p.k==='glass'?7:16,key=p.x+','+p.y+','+p.z;
 inv[p.k]=Math.max(0,(inv[p.k]||0)-1);
 const opSeq=++blockOpSeq;BRIDGE_PRED.set(key,{x:p.x,y:p.y,z:p.z,k:p.k,at:performance.now(),acked:false,reserved:true,auto:!!p.auto,opSeq});
 sb(p.x,p.y,p.z,blockId,1);flush(lowEnd?2:4);hud();
 if(!send({t:'place',k:p.k,x:p.x,y:p.y,z:p.z,auto:p.auto?1:0,opSeq})){rollbackPrediction(key,true);return false}
 return true
}
function clutchTarget(){const k=slotKey(cur);if(!PLACEABLE.has(k)||availableBlockCount(k)<=0)return null;const y=Math.floor(pl.y-.05)-1,cands=[];for(let ox=-1;ox<=1;ox++)for(let oz=-1;oz<=1;oz++){const x=Math.floor(pl.x+ox*.55),z=Math.floor(pl.z+oz*.55);if(!inXZ(x,z)||get(x,y,z)||!safePlaceTarget(x,y,z))continue;const adj=[[1,0,0],[-1,0,0],[0,-1,0],[0,0,1],[0,0,-1]].some(d=>get(x+d[0],y+d[1],z+d[2]));if(adj)cands.push({x,y,z,k,d:Math.hypot(x+.5-pl.x,z+.5-pl.z)})}return cands.sort((a,b)=>a.d-b.d)[0]||null}
function autoBridge(now=performance.now()){
 if(!bridgeHeld||!started||!me.alive||now-lastBridgeAt<95)return;
 const p=bridgeTarget();if(!p)return;
 lastBridgeAt=now;useAnim=1;predictPlace(p);
}
function secondary(){if(!started||!me.alive)return;audioInit();useAnim=1;if(ADMIN.on&&ADMIN.build){const r=ray();if(r){const f=r.f||[0,1,0],x=r.h[0]+f[0],y=r.h[1]+f[1],z=r.h[2]+f[2];send({t:'adminPlace',x,y,z,b:ADMIN.block})}return}const k=slotKey(cur);if(k==='bow')return;if(k==='apple')send({t:'apple'});else if(k==='fireball'||k==='snowball'||['tnt','tntImpulse','tntSlow','tntDamage'].includes(k))send({t:'shoot',k,yaw:pl.yaw,pitch:pl.pitch,rtt:combatNetRttMs});else if(['pearl','speedPotion','jumpPotion','invisPotion','magicMilk','bridgeEgg'].includes(k))send({t:'use',k,yaw:pl.yaw,pitch:pl.pitch,rtt:combatNetRttMs});else if(k==='popupTower'){if(tg&&tg.p){const[x,y,z]=tg.p;send({t:'use',k,x,y,z})}else{msg('Mire no chão para colocar a Pop-up Tower');sfx('blocked')}}else if(PLACEABLE.has(k)){if(availableBlockCount(k)<=0){sfx('blocked');msg('Você não possui mais '+slotName(cur)+'.');return}const p=tg&&tg.p?{x:tg.p[0],y:tg.p[1],z:tg.p[2],k}:clutchTarget();if(!p){sfx('blocked');return}if(!safePlaceTarget(p.x,p.y,p.z)){sfx('blocked');msg('Não é possível colocar um bloco dentro do jogador');return}predictPlace(p)}}
addEventListener('mousedown',e=>{if(!(document.pointerLockElement||touchMode))return;if(e.button===0){if(slotKey(cur)==='bow')beginBow();else primary()}else if(e.button===2){bridgeHeld=PLACEABLE.has(slotKey(cur));bridgeHoldY=bridgeHeld?Math.floor(pl.y-.08)-1:null;lastBridgeAt=performance.now();secondary()}});
addEventListener('mouseup',e=>{if(e.button===0){if(bowCharging)releaseBow();else stopBreak()}if(e.button===2){bridgeHeld=false;bridgeHoldY=null}});
if(touchMode){
 const look=$('look');
 const mobilePrefs=(()=>{try{return Object.assign({haptic:true,left:false,autoSprint:true},JSON.parse(localStorage.getItem('bwMobilePrefs')||'{}'))}catch(e){return{haptic:true,left:false,autoSprint:true}}})();
 const saveMobilePrefs=()=>{try{localStorage.setItem('bwMobilePrefs',JSON.stringify(mobilePrefs))}catch(e){}};
 const haptic=(ms=10)=>{if(mobilePrefs.haptic&&navigator.vibrate)try{navigator.vibrate(ms)}catch(e){}};
 const touchActive=(el,on)=>el&&el.classList.toggle('touch-active',!!on);
 const applyMobileVisualCfg=()=>{document.documentElement.style.setProperty('--mobile-scale',String(Math.max(.8,Math.min(1.35,mobileCfg.size||1))));document.documentElement.style.setProperty('--mobile-opacity',String(Math.max(.35,Math.min(1,mobileCfg.opacity||.78))));document.body.classList.toggle('mobile-left-handed',!!mobilePrefs.left)};
 const mobileStep=dir=>{for(let n=1;n<=SL.length;n++){const i=(cur+dir*n+SL.length)%SL.length,key=slotKey(i),ci=canonicalSlot(i),owned=ci===0||(ci===8?inv.bow>0:(inv[key]||0)>0);if(owned){pick(i);haptic(7);const el=$('bar').children[i];if(el&&el.scrollIntoView)el.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});break}}};
 $('prevItemBtn').ontouchstart=e=>{e.preventDefault();e.stopPropagation();mobileStep(-1)};$('nextItemBtn').ontouchstart=e=>{e.preventDefault();e.stopPropagation();mobileStep(1)};
 $('msx').value=Math.round(mobileCfg.sx*1000);$('msy').value=Math.round(mobileCfg.sy*1000);$('msize').value=Math.round(mobileCfg.size*100);$('mopacity').value=Math.round(mobileCfg.opacity*100);$('mhaptic').checked=!!mobilePrefs.haptic;$('mleft').checked=!!mobilePrefs.left;$('mautosprint').checked=!!mobilePrefs.autoSprint;applyMobileVisualCfg();
 $('mobileSettingsBtn').onclick=e=>{e.stopPropagation();haptic(6);$('mobileSettings').classList.toggle('open')};
 $('msx').oninput=e=>{mobileCfg.sx=+e.target.value/1000;saveMobileCfg()};$('msy').oninput=e=>{mobileCfg.sy=+e.target.value/1000;saveMobileCfg()};$('msize').oninput=e=>{mobileCfg.size=+e.target.value/100;saveMobileCfg();applyMobileVisualCfg()};$('mopacity').oninput=e=>{mobileCfg.opacity=+e.target.value/100;saveMobileCfg();applyMobileVisualCfg()};
 $('mhaptic').onchange=e=>{mobilePrefs.haptic=e.target.checked;saveMobilePrefs();haptic(12)};$('mleft').onchange=e=>{mobilePrefs.left=e.target.checked;saveMobilePrefs();applyMobileVisualCfg();haptic(8)};$('mautosprint').onchange=e=>{mobilePrefs.autoSprint=e.target.checked;saveMobilePrefs();doubleSprint=false;haptic(8)};
 $('mfullscreen').onclick=()=>{haptic(8);const el=document.documentElement;if(!document.fullscreenElement&&el.requestFullscreen)el.requestFullscreen().catch(()=>{});else if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{})};
 $('mobileChatBtn').onclick=e=>{e.stopPropagation();haptic(6);const on=!$('chatForm').classList.contains('mobile-open');$('chatForm').classList.toggle('mobile-open',on);$('chatLog').classList.toggle('mobile-open',on);if(on)setTimeout(()=>$('chatInput').focus(),40);else $('chatInput').blur()};
 document.addEventListener('touchstart',e=>{if(!$('mobileSettings').contains(e.target)&&e.target!==$('mobileSettingsBtn'))$('mobileSettings').classList.remove('open')},{passive:true});
 const held={f:false,b:false,l:false,r:false};
 const syncMove=()=>{let x=(held.r?1:0)-(held.l?1:0),y=(held.f?1:0)-(held.b?1:0);const L=Math.hypot(x,y);if(L>1){x/=L;y/=L}mx=x;my=y;doubleSprint=!!(mobilePrefs.autoSprint&&held.f&&!held.b&&Math.abs(x)<.8)};
 const setHeld=(keys,on)=>{for(const k of keys)held[k]=on;syncMove()};
 const bindMove=(id,keys)=>{const el=$(id);const down=e=>{e.preventDefault();e.stopPropagation();setHeld(keys,true);touchActive(el,true);haptic(5)},up=e=>{if(e){e.preventDefault();e.stopPropagation()}setHeld(keys,false);touchActive(el,false)};el.ontouchstart=down;el.ontouchend=up;el.ontouchcancel=up};
 bindMove('moveForwardBtn',['f']);bindMove('moveForwardLeftBtn',['f','l']);bindMove('moveForwardRightBtn',['f','r']);bindMove('moveLeftBtn',['l']);bindMove('moveRightBtn',['r']);bindMove('moveBackBtn',['b']);
 const resetMove=()=>{held.f=held.b=held.l=held.r=false;mx=my=0;doubleSprint=false;['moveForwardBtn','moveForwardLeftBtn','moveForwardRightBtn','moveLeftBtn','moveRightBtn','moveBackBtn'].forEach(id=>touchActive($(id),false))};
 const jump=$('jumpPadBtn');jump.ontouchstart=e=>{e.preventDefault();e.stopPropagation();touchActive(jump,true);haptic(6);audioInit();if(pl.g){pl.vy=fxs.jump>0?10.5:8.2;pl.g=false;sfx('jump')}};jump.ontouchend=e=>{e.preventDefault();e.stopPropagation();touchActive(jump,false)};jump.ontouchcancel=()=>touchActive(jump,false);
 const tapUseItems=new Set(['apple','fireball','snowball','tnt','tntImpulse','tntSlow','tntDamage','pearl','speedPotion','jumpPotion','invisPotion','magicMilk','bridgeEgg','popupTower']);
 const quickPrimary=()=>{primary();setTimeout(()=>{if(breaking)stopBreak()},45)};
 const screenTapAction=()=>{const k=slotKey(cur);if(PLACEABLE.has(k)||tapUseItems.has(k))secondary();else quickPrimary()};
 let gesture=null;
 const cancelHold=()=>{if(!gesture)return;if(gesture.timer){clearTimeout(gesture.timer);gesture.timer=null}if(gesture.holdBreak)stopBreak();if(gesture.holdPlace){bridgeHeld=false;bridgeHoldY=null}gesture.holdBreak=gesture.holdPlace=false};
 look.addEventListener('touchstart',e=>{e.preventDefault();if(!started||!me.alive||!e.changedTouches.length)return;const t=e.changedTouches[0],k=slotKey(cur);gesture={id:t.identifier,x:t.clientX,y:t.clientY,sx:t.clientX,sy:t.clientY,moved:false,timer:null,holdBreak:false,holdPlace:false,bow:k==='bow'};if(k==='bow'){beginBow();return}gesture.timer=setTimeout(()=>{if(!gesture||gesture.moved)return;const heldKey=slotKey(cur);if(PLACEABLE.has(heldKey)){bridgeHeld=true;bridgeHoldY=Math.floor(pl.y-.08)-1;lastBridgeAt=performance.now();gesture.holdPlace=true;secondary();haptic(8)}else if(!tapUseItems.has(heldKey)){gesture.holdBreak=true;primary();haptic(8)}},190)},{passive:false});
 look.addEventListener('touchmove',e=>{e.preventDefault();const t=[...e.touches].find(t=>gesture&&t.identifier===gesture.id);if(!t)return;const dist=Math.hypot(t.clientX-gesture.sx,t.clientY-gesture.sy);if(dist>10&&!gesture.moved){gesture.moved=true;if(gesture.timer){clearTimeout(gesture.timer);gesture.timer=null}if(!gesture.bow)cancelHold()}const dx=Math.max(-34,Math.min(34,t.clientX-gesture.x)),dy=Math.max(-34,Math.min(34,t.clientY-gesture.y));pl.yaw-=dx*mobileCfg.sx;pl.pitch=Math.max(-1.55,Math.min(1.55,pl.pitch-dy*mobileCfg.sy));gesture.x=t.clientX;gesture.y=t.clientY},{passive:false});
 const finish=e=>{if(!gesture)return;if(e&&![...e.changedTouches].some(t=>t.identifier===gesture.id))return;if(e)e.preventDefault();const g=gesture;if(g.timer)clearTimeout(g.timer);if(g.bow){if(bowCharging)releaseBow()}else if(g.holdBreak){stopBreak()}else if(g.holdPlace){bridgeHeld=false;bridgeHoldY=null}else if(!g.moved){haptic(6);screenTapAction()}gesture=null};
 look.addEventListener('touchend',finish,{passive:false});look.addEventListener('touchcancel',finish,{passive:false});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){resetMove();cancelHold();gesture=null;bridgeHeld=false;bridgeHoldY=null;stopBreak();if(bowCharging)releaseBow()}});
 if(window.visualViewport)visualViewport.addEventListener('resize',()=>{document.documentElement.style.setProperty('--mobile-vh',visualViewport.height+'px')});
}
const size=()=>{R.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()};addEventListener('resize',size);size();
let last=performance.now(),ls=0,acc=0,lodAcc=0,bobPhase=0,bobX=0,bobY=0,targetFov=70,lastRenderAt=0;hud();
function tick(now){requestAnimationFrame(tick);const dt=Math.min((now-last)/1000,.05);last=now;updateDiag(now);updateRespawnUI();if(comboHudUntil&&now>comboHudUntil){comboHudUntil=0;$('comboHud').classList.remove('show')}if(bowCharging)drawBowTrajectory();acc+=dt;lodAcc+=dt;if(lodAcc>(lowEnd?.72:.45)){lodAcc=0;updateChunkLOD()}fxs.speed=Math.max(0,fxs.speed-dt);fxs.jump=Math.max(0,fxs.jump-dt);fxs.invis=Math.max(0,fxs.invis-dt);fxs.slow=Math.max(0,(fxs.slow||0)-dt);fxs.fatigue=Math.max(0,(fxs.fatigue||0)-dt);fxs.blind=Math.max(0,(fxs.blind||0)-dt);fxs.milk=Math.max(0,(fxs.milk||0)-dt);$('blindOverlay').style.opacity=fxs.blind>0?String(Math.min(.82,.38+fxs.blind*.055)):'0';
if(serverCorrection&&me.alive){const a=Math.min(1,dt/Math.max(.001,serverCorrection.t));pl.x+=(serverCorrection.x-pl.x)*a;pl.y+=(serverCorrection.y-pl.y)*a;pl.z+=(serverCorrection.z-pl.z)*a;serverCorrection.t-=dt;if(serverCorrection.t<=0)serverCorrection=null}
if((started||lobbyExplore)&&!over&&(me.alive||spectator)){
const fx_=-Math.sin(pl.yaw),fz=-Math.cos(pl.yaw),rx=Math.cos(pl.yaw),rz=-Math.sin(pl.yaw),mf=((K.KeyW?1:0)-(K.KeyS?1:0))+my,mr=((K.KeyD?1:0)-(K.KeyA?1:0))+mx,l=Math.hypot(mf,mr)||1;
let sneak=false,sprinting=false;
if(ADMIN.on||spectator){const sp=ADMIN.on?10:8.5;if(spectator&&specTarget){const r=PL.get(specTarget);if(r){pl.x=r.m.position.x;pl.y=r.m.position.y+2.2;pl.z=r.m.position.z+4;pl.vx=pl.vy=pl.vz=0}else specTarget=0}else{pl.vx=(fx_*mf+rx*mr)/l*sp;pl.vz=(fz*mf+rz*mr)/l*sp;pl.vy=(K.Space?8:0)-(K.ShiftLeft?8:0);pl.x+=pl.vx*dt;pl.y+=pl.vy*dt;pl.z+=pl.vz*dt}pl.g=false}else{
sneak=!!K.ShiftLeft;if(sneak||mf<=.05)sprintLatch=false;else if((K.ControlLeft||doubleSprint)&&mf>.15)sprintLatch=true;sprinting=sprintLatch&&mf>.15;const baseSp=sneak?1.3:(sprinting?5.7:4.3),sp=baseSp*(fxs.speed>0?1.28:1)*(fxs.slow>0?.55:1),tvx=(fx_*mf+rx*mr)/l*sp,tvz=(fz*mf+rz*mr)/l*sp,accel=pl.g?30:9.5,decel=pl.g?24:7;pl.vx=approach(pl.vx,tvx,(Math.abs(tvx)>Math.abs(pl.vx)?accel:decel)*dt);pl.vz=approach(pl.vz,tvz,(Math.abs(tvz)>Math.abs(pl.vz)?accel:decel)*dt);
if(sneak&&pl.g){const gr=(x,z)=>hit(x,pl.y-.15,z);if(!gr(pl.x+pl.vx*.12,pl.z))pl.vx=0;if(!gr(pl.x,pl.z+pl.vz*.12))pl.vz=0}
if(K.Space&&pl.g){pl.vy=fxs.jump>0?10.5:8.2;pl.g=false;sfx('jump')}step(pl,dt)}
if(!ADMIN.on&&pl.g&&Math.hypot(pl.vx,pl.vz)>.8&&now-lastStep>(sneak?470:sprinting?245:315)){lastStep=now;sfx('step')}
targetFov=(ADMIN.on||spectator)?78:(sprinting&&fxs.speed>0?84:sprinting?80:fxs.speed>0?77:70);
autoBridge(now);
if(now-ls>50){ls=now;send({t:'mv',seq:++moveSeq,x:pl.x,y:pl.y,z:pl.z,yaw:pl.yaw,pitch:pl.pitch,vx:pl.vx,vy:pl.vy,vz:pl.vz,g:pl.g?1:0,sp:sprinting?1:0,sn:sneak?1:0})}}
const lerpA=1-Math.exp(-12*dt);
PL.forEach(r=>{const p=r.m.position;p.x+=(r.tx-p.x)*lerpA;p.y+=(r.ty-p.y)*lerpA;p.z+=(r.tz-p.z)*lerpA;r.m.rotation.y=r.yaw;const rd=Math.hypot(p.x-pl.x,p.z-pl.z),renderRange=lowEnd?48:qualityMode==='medium'?72:(diag.fps<45?68:96);r.m.visible=!!r.al&&!r.iv&&rd<renderRange;if(!r.m.visible)return;
const moving=r.speed>.015,run=r.speed>.22,air=Math.abs(r.ty-p.y)>.18,phase=Math.sin(now/(run?65:95)),amp=moving?(run?.9:.58):0;
r.limbs.ll.rotation.x=air?-.35:phase*amp;r.limbs.rl.rotation.x=air?.35:-phase*amp;
r.limbs.la.rotation.x=air?.55:-phase*amp*.8;r.limbs.ra.rotation.x=air?.55:phase*amp*.8;
if(r.action>now){r.limbs.ra.rotation.x=-1.35+Math.sin(now/45)*.18;r.held.rotation.x=-.7}else r.held.rotation.x=.1;if(moving&&r.al&&now-(r.lastStepSound||0)>(run?280:370)){r.lastStepSound=now;const g=positionalGain(p.x,p.y,p.z,8);if(g>.035)noise(.028,.012*g,700)}if(r.flashUntil&&now>r.flashUntil){r.flashUntil=0;r.m.traverse(o=>{if(o.material&&o.material.color&&o.userData.baseColor!=null)o.material.color.setHex(o.userData.baseColor)})}});
for(let i=PT.length;i--;){const p=PT[i];p.t-=dt;p.vy-=20*dt;p.m.position.x+=p.vx*dt;p.m.position.y+=p.vy*dt;p.m.position.z+=p.vz*dt;if(p.t<=0){p.m.visible=false;PT_POOL.push(p.m);PT.splice(i,1)}}
for(let i=BEDFX.length;i--;){const b=BEDFX[i];b.t-=dt;b.m.material.opacity=Math.max(0,b.t/1.35);if(b.t<=0){sc.remove(b.m);b.m.material.dispose();BEDFX.splice(i,1)}}
BRIDGE_PRED.forEach((b,key)=>{const age=now-b.at;if(!b.acked&&age>650){rollbackPrediction(key,false);if(now-lastStateSyncAt>1200){lastStateSyncAt=now;send({t:'stateSync'})}}else if(b.acked&&age>1800)BRIDGE_PRED.delete(key)});
PROJ.forEach(p=>{const ahead=Math.min(.09,(performance.now()-p.snapAt)/1000),a=Math.min(1,dt*28),x=p.tx+p.vx*ahead,y=p.ty+p.vy*ahead,z=p.tz+p.vz*ahead;p.m.position.x+=(x-p.m.position.x)*a;p.m.position.y+=(y-p.m.position.y)*a;p.m.position.z+=(z-p.m.position.z)*a})
// Drops 3D sao animados exclusivamente por updateDropVisuals(); nao usar material de Sprite aqui.
refreshHeld();swing=Math.max(0,swing-dt*5);useAnim=Math.max(0,useAnim-dt*4);
const speedNow=Math.hypot(pl.vx,pl.vz),movingGround=pl.g&&speedNow>.25,bobStrength=touchMode?.45:1;
if(movingGround)bobPhase+=dt*(7.5+Math.min(4,speedNow*.75));else bobPhase+=dt*2.5;
const bobTargetX=movingGround?Math.cos(bobPhase*.5)*.026*bobStrength:0,bobTargetY=movingGround?Math.abs(Math.sin(bobPhase))*.035*bobStrength:0;
bobX+=(bobTargetX-bobX)*Math.min(1,dt*12);bobY+=(bobTargetY-bobY)*Math.min(1,dt*12);
cam.fov+=(targetFov-cam.fov)*Math.min(1,dt*8);cam.updateProjectionMatrix();
const sa=Math.sin((1-swing)*Math.PI),ua=Math.sin((1-useAnim)*Math.PI),ma=miningTool?Math.sin(now/75)*.32:0;
hand.rotation.z=-sa*.86-ua*.24+ma+(movingGround?Math.sin(bobPhase*.5)*.025:0);
hand.rotation.x=sa*.34+ua*.18+Math.abs(ma)*.18+(movingGround?Math.abs(Math.sin(bobPhase))*.025:0);
hand.rotation.y=sa*.20;
heldRoot.rotation.x=heldViewBase.rx-ua*.28-sa*.10;heldRoot.rotation.z=heldViewBase.rz;heldRoot.position.z=heldViewBase.z+ua*.10-sa*.045;heldRoot.position.x=heldViewBase.x+sa*.045;heldRoot.position.y=heldViewBase.y;hand.position.x=bobX*.35;hand.position.y=-bobY*.5-sa*.025;
if(bowCharging){const br=Math.max(.2,Math.min(1,(now-bowChargeAt)/1200));$('bowChargeFill').style.width=(br*100)+'%';$('bowChargeText').textContent=Math.round(br*100)+'% · '+(br>.82?'FORTE':br>.5?'MÉDIO':'FRACO');heldRoot.position.z=heldViewBase.z-br*.08;heldRoot.rotation.y=heldViewBase.ry-br*.18}
else heldRoot.rotation.y=heldViewBase.ry;if(!swing)hand.rotation.y*=Math.max(0,1-dt*14)
hand.visible=started&&me.alive;
flush(lowEnd?1:2);if(breaking&&breakDur){const a=Math.min(1,(performance.now()-breakAt)/1000/breakDur);$('breakFill').style.width=(a*100)+'%';crackBox.visible=!!tg;crackMat.opacity=.08+a*.34;if(tg)crackBox.position.set(tg.h[0]+.5,tg.h[1]+.5,tg.h[2]+.5);if(a>=1){breaking=null;miningTool=null;lastHeldSig='';$('breakBox').style.display='none';crackBox.visible=false;refreshHeld()}}else crackBox.visible=false;if(acc>.25){acc=0;hud()}
if(!respawnCamera(dt)){const shake=camShake>0?(Math.random()-.5)*camShake:0;camShake=Math.max(0,camShake-dt*.65);cam.position.set(pl.x+bobX+shake,pl.y+(K.ShiftLeft?1.42:1.62)-bobY+shake*.4,pl.z+shake);cam.rotation.set(pl.pitch+Math.sin(bobPhase*.5)*.003*bobStrength+shake*.06,pl.yaw+shake*.04,0);if(spectator&&specTarget){const r=PL.get(specTarget);if(r)cam.lookAt(r.m.position.x,r.m.position.y+1,r.m.position.z)}}
const cf=me.alive&&started?chestTarget():null,vf=me.alive&&started&&!cf?vendorTarget():null;tg=me.alive&&started&&!vf&&!cf?ray():null;sel.visible=!!tg;if(tg)sel.position.set(tg.h[0]+.5,tg.h[1]+.5,tg.h[2]+.5);const enemyAim=me.alive&&started?playerTarget():null;$('cross').classList.toggle('enemy',enemyAim!==null);$('cross').style.filter=(vf||cf)?'drop-shadow(0 0 4px #fff55c)':'drop-shadow(1px 1px 0 #000)';updateCompass();
try{updateGenerators(now);updateDropVisuals(now)}catch(e){}
const targetRenderFps=lowEnd?30:qualityMode==='medium'?45:60;if(now-lastRenderAt>=1000/targetRenderFps-1){lastRenderAt=now;try{R.render(sc,cam)}catch(err){if(!window.__renderErr){window.__renderErr=1;console.error('Render recuperável',err)}}}}
requestAnimationFrame(tick);

try{
 const saved=JSON.parse(sessionStorage.getItem('bwReconnect')||'null');
 if(saved&&saved.room&&saved.token){roomCode=saved.room;reconnectToken=saved.token;if(saved.name)$('nm').value=saved.name;setReconnectBanner('Tentando restaurar a partida...');startReconnect()}
}catch(e){}
