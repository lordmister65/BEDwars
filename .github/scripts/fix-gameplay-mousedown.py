from pathlib import Path
p=Path('.github/scripts/apply-gameplay-pack.py')
s=p.read_text()
old="addEventListener('mousedown'''\n"
new="addEventListener('mousedown''''\n"
if s.count(old)!=1:
    raise SystemExit(f'expected one mousedown terminator, found {s.count(old)}')
p.write_text(s.replace(old,new,1))
print('fixed mousedown terminator')
