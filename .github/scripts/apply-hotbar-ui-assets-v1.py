from pathlib import Path
import re


def once(text, old, new, label):
    n=text.count(old)
    if n!=1:
        raise RuntimeError(f'{label}: expected 1 match, got {n}')
    return text.replace(old,new,1)

game=Path('public/game.js').read_text()
style=Path('public/style.css').read_text()
index=Path('public/index.html').read_text()

old="const TNT_TYPES=[['tnt','Explosiva',0xd7352f],['tntImpulse','Impulso',0xe8f4ff],['tntSlow','Lentidão',0x4f9dff],['tntDamage','Dano',0xff3154]];"
new=old+"""
const HOTBAR_ASSET_BASE='/assets/ui/hotbar/';
const HOTBAR_ICONS={
 sword:'espada.png',wool:'la.png',planks:'madeira.png',endstone:'the-end.png',glass:'vidro.png',obsidian:'obsidian.png',
 apple:'maca-dourada.png',bow:'arco.png',fireball:'boladefogo.png',snowball:'boladeneve.png',pearl:'perola.png',
 tnt:'tnt.png',tntImpulse:'tnt-branca.png',tntSlow:'tnt-azul.png',tntDamage:'tnt-rosa.png'
};
const HOTBAR_WOOL_FILTER=['none','hue-rotate(135deg) saturate(1.35)','hue-rotate(260deg) saturate(1.15)','hue-rotate(205deg) saturate(1.25) brightness(1.16)','hue-rotate(320deg) saturate(1.08)','grayscale(1) brightness(2.15)','hue-rotate(105deg) saturate(1.25) brightness(1.15)','hue-rotate(50deg) saturate(1.18)'];
function hotbarIcon(canonical,key){const k=canonical===0?'sword':key,file=HOTBAR_ICONS[k];return file?HOTBAR_ASSET_BASE+file+'?v=1':''}
function hotbarIconFilter(canonical,key){return key==='wool'?(HOTBAR_WOOL_FILTER[me.team]||'none'):'none'}
"""
game=once(game,old,new,'hotbar asset map')

old=""" const label=slotName(i),clr=ci===1?(TC[me.team]||SC[ci]):ci===6?(activeTnt()[2]||0xd7352f):SC[ci];
 return `<div class=\"s${i===cur?' on':''}${owned?'':' empty'}${reveal?' reveal':''}\" title=\"${owned?label:''}\" onclick=\"pick(${i})\"><i style=\"background:${typeof clr==='number'?'#'+hex(clr):clr}\"></i><em>${i<9?i+1:''}</em><b>${owned?q:''}</b><span class=\"slot-label\">${ci===6&&owned?activeTnt()[1]:''}</span></div>`"""
new=""" const label=slotName(i),clr=ci===1?(TC[me.team]||SC[ci]):ci===6?(activeTnt()[2]||0xd7352f):SC[ci],icon=hotbarIcon(ci,key),iconFilter=hotbarIconFilter(ci,key);
 return `<div class=\"s${i===cur?' on':''}${owned?'':' empty'}${reveal?' reveal':''}${icon?' has-icon':''}\" title=\"${owned?label:''}\" onclick=\"pick(${i})\"><i style=\"background:${typeof clr==='number'?'#'+hex(clr):clr}\"></i>${icon?`<img class=\"hotbar-icon\" src=\"${icon}\" alt=\"\" draggable=\"false\" style=\"--hotbar-icon-filter:${iconFilter}\">`:''}<em>${i<9?i+1:''}</em><b>${owned?q:''}</b><span class=\"slot-label\">${ci===6&&owned?activeTnt()[1]:''}</span></div>`"""
game=once(game,old,new,'hotbar renderer')

style=once(style,
".s i{position:absolute;left:8px;right:8px;top:8px;bottom:8px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.22)}",
""".s i{position:absolute;left:8px;right:8px;top:8px;bottom:8px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.22)}
.s.has-icon i{opacity:.13;left:5px;right:5px;top:5px;bottom:5px}
.s .hotbar-icon{position:absolute;z-index:1;left:3px;top:3px;width:38px;height:38px;object-fit:contain;image-rendering:pixelated;image-rendering:crisp-edges;pointer-events:none;user-select:none;filter:var(--hotbar-icon-filter,none) drop-shadow(1px 2px 0 rgba(0,0,0,.58));transform:translateZ(0)}
.s.on .hotbar-icon{transform:scale(1.06);transform-origin:center}
.s b,.s em,.s .slot-label{z-index:3}""",
'hotbar icon CSS')
style=once(style,
".s.empty i,.s.empty b,.s.empty .slot-label{opacity:0!important}",
".s.empty i,.s.empty .hotbar-icon,.s.empty b,.s.empty .slot-label{opacity:0!important}",
'empty icon state')
style += """

/* Custom hotbar assets v1 */
@media (pointer:coarse),(max-width:800px){
  .s .hotbar-icon{left:3px;top:3px;width:32px;height:32px}
  .s.has-icon i{left:4px;right:4px;top:4px;bottom:4px}
}
"""

index=re.sub(r'/style\.css\?v=[^"\']+','/style.css?v=hotbar-assets-v1-20261012',index,count=1)
index=re.sub(r'/game\.js\?v=[^"\']+','/game.js?v=hotbar-assets-v1-20261012',index,count=1)

Path('public/game.js').write_text(game)
Path('public/style.css').write_text(style)
Path('public/index.html').write_text(index)
print('Hotbar UI assets v1 integrated')
