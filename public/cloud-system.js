// Optimized client-only cloud layer for BedWars.
// Uses a single InstancedMesh (1 draw call), no collisions, no shadows and no networking.
(()=>{
  'use strict';

  if(typeof THREE==='undefined') return;

  const CLOUDS={
    enabled:true,
    height:72,
    radius:245,
    wrap:285,
    opacity:.38,
    speed:1.15,
    countHigh:11,
    countMedium:8,
    countLow:5,
    seed:73129
  };

  // game.js is loaded immediately before this file. Keep the system isolated if
  // the scene is unavailable for any reason.
  let sceneRef=null;
  try{ sceneRef=sc; }catch(e){ return; }
  if(!sceneRef) return;

  const isLow=()=>{
    try{return !!lowEnd}catch(e){return false}
  };
  const quality=()=>{
    try{return qualityMode||'auto'}catch(e){return'auto'}
  };

  function cloudCount(){
    if(isLow()) return CLOUDS.countLow;
    return quality()==='medium'?CLOUDS.countMedium:CLOUDS.countHigh;
  }

  // Small deterministic RNG so the cloud layout stays stable between frames.
  let seed=CLOUDS.seed>>>0;
  const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};

  // Each cloud is made from a few voxel-like boxes, but all boxes share one
  // InstancedMesh so rendering remains extremely cheap.
  const cloudDefs=[];
  const maxClouds=CLOUDS.countHigh;
  for(let i=0;i<maxClouds;i++){
    const parts=3+Math.floor(rnd()*4);
    const sx=8+rnd()*9;
    const sz=3.8+rnd()*4.5;
    const def={
      x:(rnd()-.5)*CLOUDS.radius*2,
      z:(rnd()-.5)*CLOUDS.radius*2,
      y:CLOUDS.height+rnd()*18,
      speed:.72+rnd()*.72,
      scale:.82+rnd()*.55,
      parts:[]
    };
    for(let p=0;p<parts;p++){
      const u=parts<=1?0:p/(parts-1)-.5;
      def.parts.push({
        x:u*sx*1.12+(rnd()-.5)*2.4,
        y:(rnd()-.5)*1.7,
        z:(rnd()-.5)*sz*.75,
        sx:sx*(.42+rnd()*.32),
        sy:1.35+rnd()*1.45,
        sz:sz*(.52+rnd()*.42)
      });
    }
    cloudDefs.push(def);
  }

  const totalParts=cloudDefs.reduce((n,c)=>n+c.parts.length,0);
  const geometry=new THREE.BoxGeometry(1,1,1);
  const material=new THREE.MeshBasicMaterial({
    color:0xffffff,
    transparent:true,
    opacity:CLOUDS.opacity,
    depthWrite:false,
    depthTest:true,
    fog:true
  });
  material.blending=THREE.NormalBlending;

  const mesh=new THREE.InstancedMesh(geometry,material,totalParts);
  mesh.name='OptimizedCloudLayer';
  mesh.frustumCulled=false;
  mesh.castShadow=false;
  mesh.receiveShadow=false;
  mesh.renderOrder=-2;
  sceneRef.add(mesh);

  const dummy=new THREE.Object3D();
  let lastUpdate=0;
  let lastCount=-1;

  function rebuildMatrices(dt){
    const wanted=cloudCount();
    let idx=0;
    const activeParts=cloudDefs.slice(0,wanted).reduce((n,c)=>n+c.parts.length,0);

    for(let ci=0;ci<wanted;ci++){
      const c=cloudDefs[ci];
      c.x+=CLOUDS.speed*c.speed*dt;
      if(c.x>CLOUDS.wrap)c.x=-CLOUDS.wrap;

      for(const p of c.parts){
        dummy.position.set(c.x+p.x,c.y+p.y,c.z+p.z);
        dummy.scale.set(p.sx*c.scale,p.sy*c.scale,p.sz*c.scale);
        dummy.rotation.set(0,0,0);
        dummy.updateMatrix();
        mesh.setMatrixAt(idx++,dummy.matrix);
      }
    }

    // Hide unused instances below the world instead of reallocating buffers.
    while(idx<totalParts){
      dummy.position.set(0,-10000,0);
      dummy.scale.set(.001,.001,.001);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx++,dummy.matrix);
    }

    mesh.count=totalParts;
    mesh.instanceMatrix.needsUpdate=true;
    lastCount=activeParts;
  }

  // Clouds move slowly, so 12-15 updates/second are visually enough. This
  // avoids doing matrix work every rendered frame, especially on mobile.
  function animate(now){
    requestAnimationFrame(animate);
    if(!CLOUDS.enabled||document.hidden){mesh.visible=false;return}
    mesh.visible=true;
    const interval=isLow()?95:70;
    if(now-lastUpdate<interval)return;
    const dt=Math.min(.15,(now-lastUpdate||interval)/1000);
    lastUpdate=now;
    rebuildMatrices(dt);
  }

  rebuildMatrices(0);
  requestAnimationFrame(animate);

  // Small debugging/config hook without polluting gameplay systems.
  window.BWClouds={
    config:CLOUDS,
    mesh,
    setEnabled(v){CLOUDS.enabled=!!v;mesh.visible=CLOUDS.enabled},
    setOpacity(v){CLOUDS.opacity=Math.max(.05,Math.min(.75,Number(v)||.38));material.opacity=CLOUDS.opacity},
    setSpeed(v){CLOUDS.speed=Math.max(0,Math.min(5,Number(v)||1.15))}
  };
})();
