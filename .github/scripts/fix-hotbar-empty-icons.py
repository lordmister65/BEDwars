from pathlib import Path

style=Path('public/style.css').read_text()
index=Path('public/index.html').read_text()

old=".s.empty i,.s.empty .hotbar-icon,.s.empty b,.s.empty .slot-label{opacity:0!important}"
new=".s.empty i,.s.empty b,.s.empty .slot-label{opacity:0!important}\n.s.empty .hotbar-icon{opacity:.22!important}"
if old not in style:
    raise SystemExit('hotbar empty selector not found')
style=style.replace(old,new,1)

style += """

/* Hotbar custom icons visibility fix */
.s.empty.has-icon .hotbar-icon{opacity:.22!important}
.s.empty.has-icon:hover .hotbar-icon{opacity:.34!important}
.s.has-icon:not(.empty) .hotbar-icon{opacity:1!important}
"""

index=index.replace('/style.css?v=hotbar-assets-v1-20261012','/style.css?v=hotbar-assets-v1-1-20261012')
Path('public/style.css').write_text(style)
Path('public/index.html').write_text(index)
print('hotbar empty icon visibility fixed')
