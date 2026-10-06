"""Builds index.html from src/template.html + data/editions.json (run from repo root)."""
import json
d=json.load(open('data/editions.json'))
s=open('src/template.html',encoding='utf-8').read().replace('__DATA__',json.dumps(d,separators=(',',':')))
open('index.html','w',encoding='utf-8').write(s); print(len(s))
