from pathlib import Path
import re
p=Path('.github/scripts/apply-gameplay-pack.py')
s=p.read_text()
pat=r"new_secondary=r'''[\s\S]*?\ngame=game\[:old_secondary\.start\(\)\]\+new_secondary\+game\[old_secondary\.end\(\):\]"
m=re.search(pat,s)
if not m:
    raise SystemExit('secondary migration block not found')
replacement=r'''new_secondary=r"""function secondary(){if(!started||!me.alive)return;audioInit();useAnim=1;if(ADMIN.on&&ADMIN.build){const r=ray();if(r){const f=r.f||[0,1,0],x=r.h[0]+f[0],y=r.h[1]+f[1],z=r.h[2]+f[2];send({t:'adminPlace',x,y,z,b:ADMIN.block})}return}const k=slotKey(cur);if(k==='bow')return;if(k==='apple')send({t:'apple'});else if(k==='fireball'||k==='snowball'||['tnt','tntImpulse','tntSlow','tntDamage'].includes(k))send({t:'shoot',k,yaw:pl.yaw,pitch:pl.pitch});else if(['pearl','speedPotion','jumpPotion','invisPotion','magicMilk','bridgeEgg'].includes(k))send({t:'use',k,yaw:pl.yaw,pitch:pl.pitch});else if(k==='popupTower'){if(tg&&tg.p){const[x,y,z]=tg.p;send({t:'use',k,x,y,z})}else{msg('Mire no chão para colocar a Pop-up Tower');sfx('blocked')}}else if(PLACEABLE.has(k)&&tg&&tg.p){const[x,y,z]=tg.p;if(!safePlaceTarget(x,y,z)){sfx('blocked');msg('Não é possível colocar um bloco dentro do jogador');return}send({t:'place',k,x,y,z})}}
addEventListener('mousedown'"""
game=game[:old_secondary.start()]+new_secondary+game[old_secondary.end():]'''
p.write_text(s[:m.start()]+replacement+s[m.end():])
print('secondary migration string fixed')
