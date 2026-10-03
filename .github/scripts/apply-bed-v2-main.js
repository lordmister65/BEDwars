const fs=require('fs');
let game=fs.readFileSync('public/game.js','utf8');
let index=fs.readFileSync('public/index.html','utf8');

const oldFn=/function createBedVisual\(team,pos,spawn\)\{[\s\S]*?\n\}\nfunction syncBedVisuals/;
if(!oldFn.test(game)) throw new Error('createBedVisual not found');
const newFn=`function createBedVisual(team,pos,spawn){
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
function syncBedVisuals`;
game=game.replace(oldFn,newFn);

if(!game.includes("if(!b||b>=8&&b<=11)continue;")) throw new Error('voxel bed hide guard missing');

if(index.includes('<script src="/game.js"></script>')){
 index=index.replace('<script src="/game.js"></script>','<script src="/game.js?v=bed-v2-20261003"></script>');
}else if(!index.includes('/game.js?v=bed-v2-20261003')){
 throw new Error('game.js script tag not found');
}

fs.writeFileSync('public/game.js',game);
fs.writeFileSync('public/index.html',index);
console.log('Bed v2 applied and cache-busted');
