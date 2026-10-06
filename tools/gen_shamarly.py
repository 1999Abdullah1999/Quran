import json,sqlite3
d=json.load(open('quran-data.json'))
c=sqlite3.connect('/home/claude/shamarly-src/shamerly.db')
rows=c.execute("select page,sura,ayah,x,y from mushaf where ayah>0 order by sura,ayah").fetchall()
order=[(s,a) for p,s,a,x,y in rows]
end={(s,a):p for p,s,a,x,y in rows}; pos={(s,a):(x,y) for p,s,a,x,y in rows}
prev={order[i]:order[i-1] for i in range(1,len(order))}
T=70
def start(sa,flag=None):
    e=end[sa]
    if sa not in prev: return e
    pe=end[prev[sa]]
    if pe==e: return e
    x,y=pos[prev[sa]]
    if flag is not None and 70<=x<=220: flag.append((sa,x))
    return e if x<T else pe
def nxt(sa): return order[order.index(sa)+1] if sa!=order[-1] else None
fl=[]
firsts=[(s,1) for s in range(1,115)]+[tuple(x) for x in d['RSA']]
def sstart(sa):
    e=end[sa]
    if sa==(1,1): return 2
    if sa==(2,1): return 3
    pe=end[prev[sa]]
    if pe==e: return e
    x,y=pos[prev[sa]]
    return pe if y<=940 else e
st={sa:(sstart(sa) if sa[1]==1 and sa[0]>=1 and sa in set((s,1) for s in range(1,115)) else start(sa,fl)) for sa in set(firsts)}
print('ambiguous',[f for f in fl if f[0] in st])
OFF=1  # printed page = image page - 1 (cover excluded)
def pg(sa): return st[sa]-OFF
SS=[pg((s,1)) for s in range(1,115)]
RS=[pg(tuple(x)) for x in d['RSA']]
ends=lambda starts,last:[starts[i+1] if False else None for i in range(len(starts))]
def endof(sa):
    # page where the ayah before next unit's first ayah ends
    i=order.index(sa); return end[order[i-1]]-OFF
SE=[endof((s+1,1)) for s in range(1,114)]+[end[order[-1]]-OFF]
RE=[endof(tuple(d['RSA'][i+1])) for i in range(239)]+[end[order[-1]]-OFF]
JS=[RS[i*8] for i in range(30)]; JE=[RE[i*8+7] for i in range(30)]
out={'SS':SS,'SE':SE,'RS':RS,'RE':RE,'RSA':d['RSA'],'JS':JS,'JE':JE,'N':end[order[-1]]-OFF}
json.dump(out,open('shamarly-data.json','w'))
print(out['N'],JS,SS[:5],SS[-3:],sep='\n')
assert all(SS[i]<=SE[i] for i in range(114)) and all(RS[i]<=RE[i] for i in range(240))
assert all(RS[i]<=RS[i+1] for i in range(239))
print('rub pages',min(RE[i]-RS[i]+1 for i in range(240)),max(RE[i]-RS[i]+1 for i in range(240)))
