from pathlib import Path


def once(text, old, new, label):
    n=text.count(old)
    if n!=1: raise RuntimeError(f'{label}: expected 1, got {n}')
    return text.replace(old,new,1)

shared=Path('public/shared.js').read_text()
server=Path('server.js').read_text()
game=Path('public/game.js').read_text()

# Move Jungle's eight bases outward so each base, diamond island and ruin has a clean PvP gap.
shared=once(shared,
"const J_BASES=[[0,108],[-76,76],[-108,0],[-76,-76],[0,-108],[76,-76],[108,0],[76,76]],J_EXTRA=[[24,58],[-24,58],[-58,24],[-58,-24],[-24,-58],[24,-58],[58,-24],[58,24]],J_DI=[[-58,59],[59,58],[-59,-58],[58,-59]];",
"const J_BASES=[[0,126],[-89,89],[-126,0],[-89,-89],[0,-126],[89,-89],[126,0],[89,89]],J_EXTRA=[[24,58],[-24,58],[-58,24],[-58,-24],[-24,-58],[24,-58],[58,-24],[58,24]],J_DI=[[-58,59],[59,58],[-59,-58],[58,-59]];",
'jungle spacing')

# Admin tooling can now inspect/place all new bed/wool IDs while testing maps.
server=once(server,"const ADMIN_BLOCK_MIN=1,ADMIN_BLOCK_MAX=34;","const ADMIN_BLOCK_MIN=1,ADMIN_BLOCK_MAX=42;",'admin block max')

# Render functional base objects only for teams used by the selected mode.
game=once(game,
"const teamWoolBlock=t=>(TW&&TW[t])||(t+1),bedTeamFromBlock=b=>(TB||[8,9,10,11]).indexOf(b),isBedBlock=b=>bedTeamFromBlock(b)>=0,isTeamWoolBlock=b=>(TW||[1,2,3,4]).includes(b);",
"const teamWoolBlock=t=>(TW&&TW[t])||(t+1),bedTeamFromBlock=b=>(TB||[8,9,10,11]).indexOf(b),isBedBlock=b=>bedTeamFromBlock(b)>=0,isTeamWoolBlock=b=>(TW||[1,2,3,4]).includes(b),visualTeamActive=t=>currentMode==='solo'||t<2;",
'visual team filter helper')

game=once(game,
"function updateGeneratorIcons(meta){clearGeneratorVisuals();(meta.GEN||[]).forEach(([x,y,z],i)=>{const v=newGenerator(x,y-.02,z,'base',7);v.index=i});(meta.DIGEN||[]).forEach(([x,y,z],i)=>{const v=newGenerator(x,y-.02,z,'dia',5);v.index=i});if(meta.EMGEN){const v=newGenerator(meta.EMGEN[0],meta.EMGEN[1]-.02,meta.EMGEN[2],'em',7);v.index=0}}",
"function updateGeneratorIcons(meta){clearGeneratorVisuals();(meta.GEN||[]).forEach(([x,y,z],i)=>{if(!visualTeamActive(i))return;const v=newGenerator(x,y-.02,z,'base',7);v.index=i});(meta.DIGEN||[]).forEach(([x,y,z],i)=>{const v=newGenerator(x,y-.02,z,'dia',5);v.index=i});if(meta.EMGEN){const v=newGenerator(meta.EMGEN[0],meta.EMGEN[1]-.02,meta.EMGEN[2],'em',7);v.index=0}}",
'generator filter')

game=once(game,
"clearBedVisuals();(meta?.BD||[]).forEach((pos,t)=>{if(!pos)return;if(state&&state[t]===0)return;if(B[ix(pos[0],pos[1],pos[2])]!==((TB&&TB[t])||(8+t)))return;createBedVisual(t,pos,meta.SPAWN?.[t])})",
"clearBedVisuals();(meta?.BD||[]).forEach((pos,t)=>{if(!pos||!visualTeamActive(t))return;if(state&&state[t]===0)return;if(B[ix(pos[0],pos[1],pos[2])]!==((TB&&TB[t])||(8+t)))return;createBedVisual(t,pos,meta.SPAWN?.[t])})",
'bed visual filter')

game=once(game,
"g.SHOP.forEach((pos,team)=>{\n   const holder=new THREE.Group();",
"g.SHOP.forEach((pos,team)=>{\n   if(!visualTeamActive(team))return;const holder=new THREE.Group();",
'vendor filter')

game=once(game,
"function updateChests(meta,lobby=false){clearChests();if(lobby||!meta?.SPAWN)return;meta.SPAWN.forEach((_,team)=>{for(const kind of ['team','ender']){",
"function updateChests(meta,lobby=false){clearChests();if(lobby||!meta?.SPAWN)return;meta.SPAWN.forEach((_,team)=>{if(!visualTeamActive(team))return;for(const kind of ['team','ender']){",
'chest filter')

old_names="const names=['Lã Azul','Lã Vermelha','Lã Verde','Lã Amarela','Madeira','Pedra','Vidro','Cama Azul','Cama Vermelha','Cama Verde','Cama Amarela','End Stone','TNT','Ouro','Diamante','Obsidiana','Bloco Azul','Bloco Vermelho','Bloco Verde','Bloco Amarelo','Pedra Escura','Lava','Luz','Terra','Solo','Terracota Ciano','Grama','Pedra Cinza','Musgo','Madeira Selva','Terracota Rosa','Diamante Brilhante','Esmeralda','Glow'];"
new_names="const names=['Lã Azul','Lã Vermelha','Lã Verde','Lã Amarela','Madeira','Pedra','Vidro','Cama Azul','Cama Vermelha','Cama Verde','Cama Amarela','End Stone','TNT','Ouro','Diamante','Obsidiana','Bloco Azul','Bloco Vermelho','Bloco Verde','Bloco Amarelo','Pedra Escura','Lava','Luz','Terra','Solo','Terracota Ciano','Grama','Pedra Cinza','Musgo','Madeira Selva','Terracota Rosa','Diamante Brilhante','Esmeralda','Glow','Cama Ciano','Cama Branca','Cama Rosa','Cama Roxa','Lã Ciano','Lã Branca','Lã Rosa','Lã Roxa'];"
game=once(game,old_names,new_names,'admin names')

Path('public/shared.js').write_text(shared)
Path('server.js').write_text(server)
Path('public/game.js').write_text(game)
print('Maps V3 FFA8 polish applied')
