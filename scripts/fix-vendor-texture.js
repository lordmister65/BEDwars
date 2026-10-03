const fs=require('fs');
const p='public/game.js';
let s=fs.readFileSync(p,'utf8');
const old=`const vendorAtlas=new THREE.TextureLoader().load('/assets/vendor_blue_atlas.png');
vendorAtlas.magFilter=vendorAtlas.minFilter=THREE.NearestFilter;vendorAtlas.generateMipmaps=false;
function vendorFace(row,col){
  const t=vendorAtlas.clone();t.needsUpdate=true;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;
  t.repeat.set(1/6,1/6);t.offset.set(col/6,1-(row+1)/6);
  return new THREE.MeshBasicMaterial({map:t,side:THREE.FrontSide});
}`;
const neu=`const vendorFaceBindings=[];
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
}`;
if(!s.includes(old))throw new Error('vendor texture block not found');
s=s.replace(old,neu);
fs.writeFileSync(p,s);
console.log('vendor texture loading fixed');
