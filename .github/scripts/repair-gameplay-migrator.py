from pathlib import Path
p=Path('.github/scripts/apply-gameplay-pack.py')
s=p.read_text()
start=s.index("index=once(index,\n\"<div class=\\\"ov\\\" id=\\\"ranking\\\"")
end=s.index("index=re.sub",start)
replacement=r'''old_rank_html = ''' + "'''" + r'''<div class="ov" id="ranking"><div class="meta-panel ranking-panel"><h1>RANKING</h1><div id="rankingBody"></div><button onclick="scr('lobby')">Voltar</button></div></div>
<div id="compassHud"></div>''' + "'''" + r'''
new_rank_html = ''' + "'''" + r'''<div class="ov" id="ranking"><div class="meta-panel ranking-panel"><h1>RANKING</h1><div id="rankingBody"></div><button onclick="scr('lobby')">Voltar</button></div></div>
<div class="ov" id="hotbarEditor"><div class="meta-panel hotbar-editor-panel"><h1>EDITOR DA HOTBAR</h1><p>Selecione um slot e depois outro para trocar de posição. Os 9 primeiros respondem às teclas 1–9.</p><div id="hotbarEditorGrid"></div><div class="meta-actions"><button onclick="resetHotbarEditor()">Restaurar padrão</button><button onclick="scr('lobby')">Concluir</button></div></div></div>
<div id="blindOverlay"></div><div id="compassHud"></div>''' + "'''" + r'''
index=once(index,old_rank_html,new_rank_html,'hotbar editor overlay')
'''
s=s[:start]+replacement+s[end:]
p.write_text(s)
print('Gameplay migrator repaired')
