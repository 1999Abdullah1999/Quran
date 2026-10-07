(function(){
'use strict';

/* ============ بيانات المصحف ============ */
/* الطبعتان: madinah (604 صفحة، من quran-meta) و shamarly (521 صفحة بلا الغلاف، من قاعدة بيانات تطبيق الشمرلي مفتوح المصدر) */
var EDS = __DATA__;
/* ترتيب الطبعات وأسمائها مأخوذ من data/editions.json — إضافة طبعة جديدة = تعديل بيانات فقط */
var ED_ORDER = ['madinah','shamarly'].filter(function(k){ return !!EDS[k]; });
var ED_NAMES = {}, ED_SHORT = {}, MAXP = 1;
ED_ORDER.forEach(function(k){ ED_NAMES[k]=EDS[k].label||k; ED_SHORT[k]=EDS[k].short||k; if(EDS[k].N>MAXP) MAXP=EDS[k].N; });
/* TOTAL = رقم آخر صفحة في المصحف. P0 = رقم أول صفحة فيها نص (الشمرلي: 2 لأن صفحة 1 غلاف).
   PAGES = عدد الصفحات التي تُقاس بها نسبة الإنجاز = TOTAL-P0+1. */
var TOTAL, P0, PAGES, SS, SE, RS, RE, RSA, JS_, JE, ED = 'madinah';
function useEd(e){
  if(!EDS[e]) e = ED_ORDER[0];
  var D=EDS[e]; ED=e; TOTAL=D.N; P0=D.P0||1; PAGES=TOTAL-P0+1;
  SS=D.SS; SE=D.SE; RS=D.RS; RE=D.RE; RSA=D.RSA; JS_=D.JS; JE=D.JE;
  if(typeof UNIT_N!=='undefined') UNIT_N.page=PAGES;
}
/* معلومات أي طبعة بدون تبديل الحالة العامة */
function edInfo(k){ var D=EDS[k]||EDS[ED_ORDER[0]]; var p0=D.P0||1; return { N:D.N, P0:p0, PAGES:D.N-p0+1 }; }
/* نفّذ fn على ختمة بطبعتها هي لا بالطبعة الحالية.
   ده أهم سطر في الملف: بدونه أي عملية على ختمة قديمة من طبعة تانية كانت بتقتطع صفحاتها بصمت. */
function withEd(k,fn){
  var prev=ED;
  if(k && k.ed && k.ed!==prev) useEd(k.ed);
  try { return fn(); } finally { if(ED!==prev) useEd(prev); }
}
useEd(ED_ORDER[0]);
var SN = ["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"];
var JN = ["الم","سيقول","تلك الرسل","لن تنالوا","والمحصنات","لا يحب الله","وإذا سمعوا","ولو أننا","قال الملأ","واعلموا","يعتذرون","وما من دابة","وما أبرئ","ربما","سبحان الذي","قال ألم","اقترب للناس","قد أفلح","وقال الذين","أمن خلق","اتل ما أوحي","ومن يقنت","وما لي","فمن أظلم","إليه يرد","حم","قال فما خطبكم","قد سمع الله","تبارك الذي","عمّ"];
var MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
var DAYS = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
var DAYS_S = ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
var PALETTES = [['emerald','الزمرد','#1b6b5f'],['sky','السماء','#1d6a99'],['indigo','النيلي','#4a56b0'],['violet','العنب','#6b46b0'],['rose','الورد','#a23a5c'],['sand','الرمل','#7d5a2c'],['slate','الحجر','#3f5f78']];

function surahsOn(p){ p=p<P0?P0:(p>TOTAL?TOTAL:p); var r=[]; for(var i=0;i<114;i++){ if(SS[i]<=p && SE[i]>=p) r.push(i); } return r.length?r:[0]; }
function juzAt(p){ for(var j=0;j<30;j++){ if(JE[j]>=p) return j; } return 29; }
function rubAt(p){ for(var r=0;r<240;r++){ if(RE[r]>=p) return r+1; } return 240; }

/* ============ أدوات ============ */
var $ = function(s,r){ return (r||document).querySelector(s); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
var pad = function(n){ return String(n).padStart(2,'0'); };
var ymd = function(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); };
var parse = function(s){ var a=s.split('-').map(Number); return new Date(a[0],a[1]-1,a[2],12); };
var today = function(){ return ymd(new Date()); };
var addDays = function(s,n){ var d=parse(s); d.setDate(d.getDate()+n); return ymd(d); };
var diffDays = function(a,b){ return Math.round((parse(b)-parse(a))/864e5); };
var isYmd = function(s){ return typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(parse(s).getTime()); };
var weekIdx = function(s){ return (parse(s).getDay()+1)%7; };
var fmtDate = function(s){ var d=parse(s); return d.getDate()+' '+MONTHS[d.getMonth()]+' '+d.getFullYear(); };
/* التاريخ الهجري (أم القرى) — يُكتشف دعمه مرة واحدة، ولو المتصفح ما يدعمه يسكت بهدوء.
   يظهر في شارة اليوم فقط، مش داخل خلايا خريطة القراءة (371 خلية) عشان الأداء. */
var HIJRI = (function(){
  try{
    var f = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura',{ day:'numeric', month:'long', year:'numeric' });
    var probe = f.format(new Date(2024,0,1));
    if(typeof probe!=='string' || !probe || probe.indexOf('NaN')>-1) return null;
    return f;
  }catch(e){ return null; }
})();
var hijriOf = function(s){ if(!HIJRI) return ''; try{ return HIJRI.format(parse(s)).replace(/\s+هـ?\s*$/,'')+' هـ'; }catch(e){ return ''; } };
var fmtDay = function(s){ return DAYS[parse(s).getDay()]+'، '+fmtDate(s); };
var fmtShort = function(s){ var d=parse(s); return d.getDate()+'/'+(d.getMonth()+1); };
var clamp = function(v,a,b){ return Math.min(b,Math.max(a,v)); };
var fmt = function(n){ return Number.isInteger(n) ? String(n) : String(Math.round(n*10)/10); };
var uid = function(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,6); };
var pg = function(n){ return n===0?'0 صفحة':n===1?'صفحة واحدة':n===2?'صفحتين':(n>=3&&n<=10)?n+' صفحات':n+' صفحة'; };
var dy = function(n){ return n===1?'يوم واحد':n===2?'يومين':(n>=3&&n<=10)?n+' أيام':n+' يومًا'; };
var pctFloor = function(x){ return x>=1 ? 100 : Math.floor(x*100); };
var norm = function(s){ return String(s).replace(/[ً-ٰٟـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').trim(); };
var SNN = SN.map(norm);
var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var esc = function(s){ return String(s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };

var ICON = {
  gear:'<svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>',
  moon:'<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
  sun:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  x:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  left:'<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  edit:'<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
  trash:'<svg viewBox="0 0 24 24"><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/></svg>',
  star:'<svg viewBox="0 0 64 64"><path d="M18 18H46V46H18Z M51.8 32L32 12.2L12.2 32L32 51.8Z"/></svg>'
};

/* ============ نموذج الصفحات المقروءة ============ */
function bitsOf(read){ var b=new Uint8Array(TOTAL+2); for(var i=0;i<read.length;i++){ var a=read[i][0]<P0?P0:read[i][0], z=read[i][1]>TOTAL?TOTAL:read[i][1]; for(var p=a;p<=z;p++) b[p]=1; } return b; }
function rangesOf(b,p0,tot){ p0=p0||P0; tot=tot||TOTAL; var r=[],s=0; for(var p=p0;p<=tot+1;p++){ if(p<=tot && b[p]){ if(!s) s=p; } else if(s){ r.push([s,p-1]); s=0; } } return r; }
function prefix(b){ var a=new Int16Array(TOTAL+2); for(var p=P0;p<=TOTAL;p++) a[p]=a[p-1]+(b[p]?1:0); return a; }
function rcount(r){ var n=0; for(var i=0;i<r.length;i++) n+=r[i][1]-r[i][0]+1; return n; }
function nextUnread(bits,from){ var p; for(p=from;p<=TOTAL;p++) if(!bits[p]) return p; for(p=P0;p<from&&p<=TOTAL;p++) if(!bits[p]) return p; return 0; }
function applyAdd(k,req){
  var b=bitsOf(k.read), add=[];
  req.forEach(function(r){
    var s=0;
    for(var p=r[0];p<=r[1];p++){
      if(!b[p]){ b[p]=1; if(!s) s=p; } else if(s){ add.push([s,p-1]); s=0; }
    }
    if(s) add.push([s,r[1]]);
  });
  k.read=rangesOf(b); return add;
}
function applyRemove(k,ranges){ var b=bitsOf(k.read); ranges.forEach(function(r){ for(var p=r[0];p<=r[1];p++) b[p]=0; }); k.read=rangesOf(b); }
function rangesText(r){ return r.map(function(x){ return x[0]===x[1]?x[0]:x[0]+'–'+x[1]; }).join('، '); }

/* ============ الحالة والتخزين ============ */
var KEY = 'quranDashboard.v2', KEY1 = 'quranDashboard.v1';
var storageOK = true;
var S;
var ui = { dr:14, per:'w', sf:'all', juz:null, hd:null, surahAll:false, amt:2 };
var C = { bits:null, pre:null, rc:0, ptr:1, ptrFirst:1 };

function newKhatmah(id,start,ed){ return { id:id, start:start, end:null, done:false, stopped:false, read:[], last:0, ed:EDS[ed]?ed:'madinah' }; }
function safeId(x){ x=String(x==null?'':x); return /^[A-Za-z0-9_-]{1,40}$/.test(x) ? x : uid(); }
function defaultState(){
  return {
    v:3, onboarded:false,
    settings:{ edition:'madinah', theme:'auto', palette:'emerald', density:'comfortable', fontScale:'m', goalMode:'daily', dailyTarget:2, targetDate:null, lastAmount:0 },
    khatmahs:[newKhatmah(1,today(),'madinah')],
    log:[], targets:{}
  };
}
function toInt(v,min,max,def){ v=Math.round(Number(v)); return isFinite(v)?Math.min(max,Math.max(min,v)):def; }
function cleanRanges(a){
  if(!Array.isArray(a)) return [];
  var b=new Uint8Array(TOTAL+2);
  a.forEach(function(r){ if(!Array.isArray(r)) return; var x=toInt(r[0],P0,TOTAL,0), y=toInt(r[1],P0,TOTAL,0); if(x&&y&&x<=y) for(var p=x;p<=y;p++) b[p]=1; });
  return rangesOf(b);
}
/* أزح نطاقات الشمرلي من ترقيم v2 (الفاتحة=1) إلى الترقيم المطبوع v3 (الفاتحة=2) */
function shiftRanges(a,sh){ if(!sh||!Array.isArray(a)) return a; return a.map(function(r){ return Array.isArray(r)?[r[0]+sh,r[1]+sh]:r; }); }
function sanitize(raw){
  var o = raw && raw.data ? raw.data : raw;
  if(!o || typeof o!=='object' || !Array.isArray(o.khatmahs) || !o.khatmahs.length) throw new Error('bad');
  var DEF = ED_ORDER[0];
  var v1 = o.v!==2 && o.v!==3 && !o.khatmahs.some(function(k){ return Array.isArray(k.read); });
  /* ترحيل v2 ← v3: في v2 كان ترقيم الشمرلي داخلي (الفاتحة=1، N=521).
     من v3 استعملنا الترقيم المطبوع الحقيقي (الفاتحة=2، N=522) فكل أرقام الشمرلي بتتزحلق +1. */
  var migrate = (o.v!==3);
  var st = defaultState(), s = o.settings||{};
  st.settings.theme = ['auto','light','dark'].indexOf(s.theme)>-1 ? s.theme : 'auto';
  st.settings.palette = PALETTES.some(function(p){ return p[0]===s.palette; }) ? s.palette : 'emerald';
  st.settings.density = s.density==='compact' ? 'compact' : 'comfortable';
  st.settings.fontScale = ['s','m','l'].indexOf(s.fontScale)>-1 ? s.fontScale : 'm';
  st.settings.goalMode = s.goalMode==='date' ? 'date' : 'daily';
  st.settings.dailyTarget = toInt(s.dailyTarget,1,100,2);
  st.settings.targetDate = isYmd(s.targetDate) ? s.targetDate : null;
  st.settings.edition = EDS[s.edition] ? s.edition : DEF;
  st.settings.lastAmount = toInt(s.lastAmount,0,MAXP,0);
  var seen = {};
  st.khatmahs = o.khatmahs.map(function(k){
    var read, last, ed = EDS[k.ed] ? k.ed : DEF;
    useEd(ed);
    var sh = (migrate && ed==='shamarly') ? 1 : 0;
    if(v1){ var cur=toInt(k.cur,0,TOTAL,0); read = cur>0 ? [[P0,cur]] : []; last=cur; }
    else {
      read = cleanRanges(shiftRanges(k.read, sh));
      var rl = toInt(k.last,0,TOTAL,0); last = rl ? Math.min(TOTAL, rl+sh) : 0;
    }
    return { id:toInt(k.id,1,1e6,0), start:isYmd(k.start)?k.start:today(), end:isYmd(k.end)?k.end:null, done:!!k.done, stopped:!!k.stopped, read:read, last:last, ed:ed };
  }).filter(function(k){ if(k.id<1||seen[k.id]) return false; seen[k.id]=1; return true; });
  if(!st.khatmahs.length) throw new Error('bad');
  st.khatmahs.sort(function(a,b){ return a.id-b.id; });
  st.khatmahs.forEach(function(k,i){
    useEd(k.ed);
    k.done = rcount(k.read)===PAGES;
    if(k.done){ k.stopped=false; if(!k.end) k.end=k.start; }
    else if(i<st.khatmahs.length-1){ k.stopped=true; if(!k.end) k.end=k.start; }
    else { k.stopped=false; k.end=null; }
  });
  var edOf = {}; st.khatmahs.forEach(function(k){ edOf[k.id]=k.ed; });
  st.log = (Array.isArray(o.log)?o.log:[]).map(function(e){
    var added, kid = toInt(e.k,1,1e6,0), ked = edOf[kid]||DEF;
    useEd(ked);
    var lsh = (migrate && ked==='shamarly' && !v1) ? 1 : 0;
    if(v1){ var prev=toInt(e.prev,0,TOTAL,0), pos=toInt(e.pos,0,TOTAL,0); added = pos>prev ? [[prev+1,pos]] : []; }
    else added = cleanRanges(shiftRanges(e.added, lsh));
    /* نزحلق أولًا ثم نقصّ على النطاق: لو قصّينا أولًا كانت الصفحة 1 القديمة
       تتحول إلى 2 ثم إلى 3 بدل 2. */
    var from=toInt(e.from,0,TOTAL,0), to=toInt(e.to,0,TOTAL,0);
    if(lsh){ from = from?from+lsh:0; to = to?to+lsh:0; }
    if(from) from=clamp(from,P0,TOTAL); if(to) to=clamp(to,P0,TOTAL);
    if(!from||!to){ from = added.length?added[0][0]:P0; to = added.length?added[added.length-1][1]:P0; }
    return { id:safeId(e.id), d:e.d, k:kid, p:toInt(e.p,0,PAGES,0), from:from, to:to, added:added, adj:!!e.adj, lab:typeof e.lab==='string'?e.lab.slice(0,80).replace(/[<>]/g,''):'' };
  }).filter(function(e){ return isYmd(e.d) && seen[e.k]; });
  st.targets = {};
  if(o.targets && typeof o.targets==='object'){ Object.keys(o.targets).forEach(function(d){ var v=Number(o.targets[d]); if(isYmd(d)&&isFinite(v)&&v>=1) st.targets[d]=Math.min(MAXP,Math.round(v)); }); }
  st.onboarded = o.onboarded!==false;
  useEd(st.khatmahs[st.khatmahs.length-1].ed);
  return st;
}
function testStorage(){ try{ localStorage.setItem('__t','1'); localStorage.removeItem('__t'); return true; }catch(e){ return false; } }
function load(){
  storageOK = testStorage();
  if(storageOK){
    try{ var raw = localStorage.getItem(KEY); if(raw) return sanitize(JSON.parse(raw)); }catch(e){ console.warn('load v2 failed',e); }
    try{ var old = localStorage.getItem(KEY1); if(old){ var st = sanitize(JSON.parse(old)); localStorage.setItem(KEY, JSON.stringify(st)); return st; } }catch(e){ console.warn('migrate v1 failed',e); }
  }
  return defaultState();
}
function save(){
  if(!storageOK) return;
  try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){ storageOK=false; showBanner(); }
}
function showBanner(){
  var b=$('#banner');
  if(storageOK){ b.hidden=true; return; }
  b.hidden=false;
  b.textContent='تعذّر الحفظ التلقائي في هذا المتصفح أو هذه النافذة (مثل المعاينة أو التصفح الخاص). افتح الملف مباشرة في المتصفح، واستخدم «تصدير نسخة احتياطية» لحفظ بياناتك.';
}
var curK = function(){ return S.khatmahs[S.khatmahs.length-1]; };
var kById = function(id){ for(var i=0;i<S.khatmahs.length;i++) if(S.khatmahs[i].id===id) return S.khatmahs[i]; return null; };
function prep(){
  var k=curK(); useEd(k.ed);
  var amt=$('#amt'); if(amt){ amt.min=P0; amt.max=TOTAL; }
  C.bits=bitsOf(k.read); C.pre=prefix(C.bits); C.rc=C.pre[TOTAL];
  /* مؤشران: ptr = أول صفحة فاضية بعد آخر تسجيل (بيلفّ لآخر المصحف)،
     ptrFirst = أول صفحة فاضية من أول المصحف. المستخدم بيختار بينهم. */
  C.ptr = nextUnread(C.bits, clamp((k.last||0)+1,P0,TOTAL)) || P0;
  C.ptrFirst = nextUnread(C.bits, P0) || C.ptr;
}
var cnt = function(a,b){ return C.pre[b]-C.pre[a-1]; };

/* ============ الحسابات ============ */
function derive(){
  var t = today(), k = curK();
  var dm = {}, todayK = 0;
  S.log.forEach(function(e){ dm[e.d]=(dm[e.d]||0)+e.p; if(e.d===t && e.k===k.id) todayK+=e.p; });
  var dates = Object.keys(dm).sort();
  var avg = 0;
  if(dates.length){
    var first = dates[0], ws = first > addDays(t,-29) ? first : addDays(t,-29);
    var days = Math.max(1, diffDays(ws,t)+1), sum = 0;
    dates.forEach(function(d){ if(d>=ws && d<=t) sum += dm[d]; });
    avg = sum/days;
  }
  var good = dates.filter(function(d){ return dm[d]>0; });
  var longest=0, run=0, prev=null;
  good.forEach(function(d){ run = (prev && diffDays(prev,d)===1) ? run+1 : 1; if(run>longest) longest=run; prev=d; });
  var cs=0, x=t; if(!(dm[x]>0)) x=addDays(x,-1);
  while(dm[x]>0){ cs++; x=addDays(x,-1); }
  return { t:t, dm:dm, todayPages:dm[t]||0, todayK:todayK, avg:avg, streak:cs, longest:longest };
}
function goalInfo(D){
  var k=curK(), st=S.settings, rem = k.done ? 0 : PAGES-rcount(k.read), t=D.t;
  var g = { rem:rem, mode:st.goalMode, req:st.dailyTarget, overdue:false, noDate:false };
  if(st.goalMode==='date'){
    if(st.targetDate){
      var left = diffDays(t, st.targetDate)+1;
      if(left>=1){ g.req = Math.max(1, Math.ceil((rem + (k.done?0:D.todayK))/left)); g.left = left; }
      else { g.overdue = true; g.req = Math.max(1, rem); }
    } else g.noDate = true;
  }
  return g;
}
function estimate(D){
  var k=curK();
  if(k.done) return { done:true };
  var rem = PAGES-rcount(k.read);
  if(D.avg<=0) return { none:true, rem:rem };
  var days = Math.ceil(rem/D.avg);
  return { days:days, date:addDays(D.t,days), rem:rem, far: days>3650 };
}

/* ============ وحدات التسجيل: صفحة / سورة / جزء / حزب / ربع ============ */
var UNIT_N = { page:PAGES, surah:114, juz:30, hizb:60, rub:240 };
function unitRange(t,i){
  if(t==='surah') return [SS[i-1],SE[i-1]];
  if(t==='juz') return [JS_[i-1],JE[i-1]];
  if(t==='hizb') return [RS[4*i-4],RE[4*i-1]];
  if(t==='rub') return [RS[i-1],RE[i-1]];
  return [i,i];
}
function unitName(t,i){
  if(t==='surah') return 'سورة '+SN[i-1];
  if(t==='juz') return 'الجزء '+i;
  if(t==='hizb') return 'الحزب '+i;
  if(t==='rub') return 'الربع '+(((i-1)%4)+1)+' من الحزب '+(Math.floor((i-1)/4)+1);
  return 'صفحة '+i;
}
function unitOpt(t,i){
  var r=unitRange(t,i), len=r[1]-r[0]+1, rd=cnt(r[0],r[1]), s=unitName(t,i);
  if(t==='rub') s+=' — '+SN[RSA[i-1][0]-1]+' '+RSA[i-1][1];
  s+=' (ص '+r[0]+(r[1]>r[0]?'–'+r[1]:'')+')';
  if(rd===len) s+=' ✓'; else if(rd>0) s+=' — '+pctFloor(rd/len)+'%';
  return s;
}
function unitAtPage(t,p){
  if(t==='page') return p;
  if(t==='surah'){ for(var i=0;i<114;i++) if(SE[i]>=p) return i+1; return 114; }
  var r=rubAt(p);
  if(t==='rub') return r;
  if(t==='hizb') return Math.ceil(r/4);
  return Math.ceil(r/8);
}

/* ============ عمليات التسجيل ============ */
function fixStart(k){
  var real=S.log.filter(function(e){ return e.k===k.id && !e.adj; }).map(function(e){ return e.d; }).sort();
  if(real.length) k.start=real[0];
}
function recalcK(k){
  withEd(k, function(){
    k.done = rcount(k.read)===PAGES;
    var isCur = k===curK();
    if(k.done){ k.stopped=false; }
    else if(isCur){ k.end=null; k.stopped=false; }
    else { k.stopped=true; if(!k.end) k.end=today(); }
    var le=null; S.log.forEach(function(e){ if(e.k===k.id) le=e; });
    k.last = le ? le.to : 0;
  });
}
function commit(k, req, date, lab, opts){
  opts = opts||{};
  var reqN = rcount(req), wasDone = k.done;
  var add = applyAdd(k, req), n = rcount(add);
  if(!n){ toast('هذه الصفحات مسجّلة سابقًا في هذه الختمة، فلا جديد لتسجيله.'); return false; }
  var from=req[0][0], to=req[req.length-1][1];
  S.log.push({ id:uid(), d:date, k:k.id, p:opts.adj?0:n, from:from, to:to, added:add, adj:!!opts.adj, lab:lab||'' });
  fixStart(k);
  k.last = opts.last || to;
  if(rcount(k.read)===PAGES){ k.done=true; k.end=date; k.stopped=false; }
  var D2=derive(), g=goalInfo(D2);
  if(date===D2.t || !S.targets[date]) S.targets[date]=g.req;
  save(); renderAll();
  if(k.done && !wasDone){ celebrate(k); }
  else toast('تم تسجيل '+pg(n)+(n<reqN?' ('+pg(reqN-n)+' منها مسجّلة سابقًا)':''), { act:'undo', label:'تراجع' });
  return true;
}
function recordNext(n, start){
  var k=curK();
  if(k.done){ toast('الختمة الحالية مكتملة. ابدأ ختمة جديدة أولًا.'); return; }
  n = toInt(n,1,PAGES,0);
  if(!n){ toast('اكتب عدد الصفحات أولًا.'); return; }
  /* نسخة من البتات + تعليم كل صفحة نجمعها: من غير كده اللفة التانية كانت بتجمع
     نفس الصفحات تاني وتنتج نطاقات مكرّرة ورسالة «مسجّلة سابقًا» كاذبة. */
  var b=C.bits.slice(), p=start?clamp(start,P0,TOTAL):C.ptr, pages=[], guard=0;
  while(pages.length<n && guard<PAGES){ if(!b[p]){ b[p]=1; pages.push(p); } p = (p>=TOTAL)?P0:p+1; guard++; }
  if(!pages.length) return;
  var last=pages[pages.length-1], sorted=pages.slice().sort(function(a,b){ return a-b; }), req=[], s=sorted[0], prev=s;
  for(var i=1;i<=sorted.length;i++){
    if(i<sorted.length && sorted[i]===prev+1){ prev=sorted[i]; continue; }
    req.push([s,prev]); if(i<sorted.length){ s=sorted[i]; prev=s; }
  }
  S.settings.lastAmount = n;
  commit(k, req, today(), '', { last:last });
}
function removeEntry(e){
  var k=kById(e.k);
  if(k) withEd(k, function(){ applyRemove(k,e.added); });
  S.log=S.log.filter(function(x){ return x!==e; });
  if(k) withEd(k, function(){ recalcK(k); fixStart(k); });
}
function undoLast(){
  var k=curK(), e=S.log[S.log.length-1];
  if(!e){ toast('لا يوجد تسجيل للتراجع عنه.'); return; }
  if(e.k!==k.id){ toast('آخر تسجيل يخص ختمة سابقة؛ يمكنك حذفه من «التسجيلات».'); return; }
  removeEntry(e); save(); renderAll();
  toast(e.adj ? 'تم التراجع عن ضبط التقدم السابق.' : 'تم التراجع عن تسجيل '+pg(e.p)+'.');
}
function entryById(id){ for(var i=0;i<S.log.length;i++) if(S.log[i].id===id) return S.log[i]; return null; }
function editEntry(e,from,to,date){
  var k=kById(e.k);
  if(!k) return 'لم يُعثر على الختمة المرتبطة بهذا التسجيل.';
  return withEd(k, function(){
    var snap=JSON.stringify(k.read);
    applyRemove(k,e.added);
    var add=applyAdd(k,[[from,to]]), n=rcount(add);
    if(!n){ k.read=JSON.parse(snap); return 'لا توجد صفحات جديدة ضمن هذا النطاق؛ هي مسجّلة في تسجيلات أخرى.'; }
    e.from=from; e.to=to; e.d=date; e.added=add; e.p=n; e.lab='';
    fixStart(k);
    recalcK(k);
    if(k.done && !k.end) k.end=date;
    return '';
  });
}
function setBase(n){
  var k=curK();
  if(k.done){ toast('الختمة مكتملة. ابدأ ختمة جديدة أولًا.'); return false; }
  /* نرفض القيمة الخارجة عن النطاق بدل ما نقصّها بصمت:
     قبل كده كتابة 9999 كانت بتتحول لـ604 وتُكمل الختمة كلها بضغطة غلط. */
  var t=String(n==null?'':n).trim();
  if(!/^\d+$/.test(t)){ toast('اكتب رقم صفحة صحيحًا بين '+P0+' و '+TOTAL+'.'); return false; }
  var v=Number(t);
  if(v<P0||v>TOTAL){ toast('رقم الصفحة في '+ED_NAMES[ED]+' بين '+P0+' و '+TOTAL+'.'); return false; }
  return commit(k,[[P0,v]],today(),'تقدم سابق: من الصفحة '+P0+' إلى '+v,{ adj:true, last:v });
}
function startNew(){
  var k=curK(), t=today();
  if(!k.done){ k.stopped=true; k.end=t; }
  S.khatmahs.push(newKhatmah(k.id+1,t,S.settings.edition));
  save(); renderAll();
  toast('بدأت الختمة رقم '+curK().id+'. بارك الله في وقتك.');
}

/* ============ النوافذ ============ */
var lastFocus=null, lastFallback=null, modalActs=[], dismissCb=null;
/* لو العنصر اللي كان مركَّز عليه اتدمّر (مثلاً قفلنا مودال السجل وفتحنا مودال التعديل)
   نرجّع التركيز لأقرب عنصر ثابت بره المودال بدل ما يضيع على <body>. */
function stableFallback(el){
  var m=$('#modal');
  while(el && el!==document.body){
    if(!(m && m.contains(el)) && (el.id || (el.dataset && el.dataset.act))) return el;
    el=el.parentElement;
  }
  return null;
}
function openModal(o){
  var root=$('#modal');
  if(root.hidden){ lastFocus=document.activeElement; lastFallback=stableFallback(lastFocus); }
  modalActs=o.actions||[]; dismissCb=o.onDismiss||null;
  var acts = modalActs.map(function(a,i){ return '<button type="button" class="btn '+(a.cls||'')+'" data-macti="'+i+'"'+(a.disabled?' disabled':'')+'>'+a.label+'</button>'; }).join('');
  root.innerHTML='<div class="scrim" data-close="1"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="mT" tabindex="-1"><div class="sheet-h"><h2 id="mT">'+o.title+'</h2><button type="button" class="icon-btn" data-close="1" aria-label="إغلاق">'+ICON.x+'</button></div><div class="sheet-b">'+o.body+'</div>'+(acts?'<div class="sheet-f">'+acts+'</div>':'')+'</div>';
  root.hidden=false; document.body.classList.add('lock');
  var sheet=$('.sheet',root);
  var f = $('[data-autofocus]',sheet) || $('input:not([type=checkbox]),select',sheet) || $('[data-macti]',sheet) || sheet;
  try{ f.focus({preventScroll:true}); }catch(e){}
  if(o.onOpen) o.onOpen(sheet);
  return sheet;
}
function closeModal(){
  var root=$('#modal'); if(root.hidden) return;
  root.hidden=true; root.innerHTML=''; document.body.classList.remove('lock');
  var t = (lastFocus && document.contains(lastFocus)) ? lastFocus
        : (lastFallback && document.contains(lastFallback)) ? lastFallback : $('#btnCont');
  lastFocus=null; lastFallback=null;
  if(t && t.focus){ try{ t.focus({preventScroll:true}); }catch(e){} }
}
function dismiss(){ var cb=dismissCb; dismissCb=null; closeModal(); if(cb) cb(); }
function confirmBox(o){
  return new Promise(function(res){
    openModal({
      title:o.title,
      body:'<p>'+o.msg+'</p>'+(o.check?'<label class="chk"><input type="checkbox" id="cchk"><span>'+o.check+'</span></label>':''),
      actions:[
        { label:o.ok, cls:o.danger?'danger':'pri', keep:true, disabled:!!o.check, onClick:function(){ dismissCb=null; closeModal(); res(true); } },
        { label:'إلغاء', keep:true, onClick:function(){ dismissCb=null; closeModal(); res(false); } }
      ],
      onDismiss:function(){ res(false); },
      onOpen:function(sh){ if(o.check){ var c=$('#cchk',sh), b=$('[data-macti="0"]',sh); c.addEventListener('change',function(){ b.disabled=!c.checked; }); } }
    });
  });
}
var toastT;
function toast(msg, action){
  var el=$('#toast');
  el.innerHTML='<span>'+msg+'</span>'+(action?'<button type="button" data-act="'+action.act+'">'+action.label+'</button>':'');
  el.hidden=false; void el.offsetWidth; el.classList.add('show');
  clearTimeout(toastT);
  toastT=setTimeout(function(){ el.classList.remove('show'); setTimeout(function(){ el.hidden=true; },260); }, action?7000:3800);
}

function celebrate(k){
  var end = k.end || today();                       /* حماية: لو end فاضي كان بيعمل TypeError */
  var dur = Math.max(1, diffDays(k.start,end)+1), avg = PAGES/Math.max(1,dur);
  openModal({
    title:'ما شاء الله، أتممت الختمة!',
    body:'<div class="celebrate">'+ICON.star+'<p style="font-size:1.15rem;font-weight:800;margin-top:8px">ختمة رقم '+k.id+' مكتملة</p><p class="sub">المدة: '+dy(dur)+' — بمتوسط '+fmt(Math.round(avg*10)/10)+' صفحة يوميًا</p><p style="font-family:var(--quran);font-size:1.3rem;margin-top:8px">تقبّل الله منك</p></div>',
    actions:[ { label:'بدء ختمة جديدة', cls:'pri', onClick:function(){ startNew(); } }, { label:'لاحقًا', onClick:function(){} } ]
  });
}
function whereText(p){
  var ss=surahsOn(p), s='سورة '+SN[ss[0]];
  if(ss.length>1) s+=' ثم '+SN[ss[1]];
  return s+' — الجزء '+(juzAt(p)+1);
}
function openContinue(){
  var k=curK();
  if(k.done){ celebrate(k); return; }
  var np=C.ptr, nf=C.ptrFirst, alt = (nf!==np);
  var loc=function(x){
    return '<p><b>السورة:</b> '+SN[surahsOn(x)[0]]+'</p><p><b>الجزء:</b> '+(juzAt(x)+1)+' — «'+JN[juzAt(x)]+'»</p><p><b>الربع:</b> '+unitName('rub',rubAt(x))+'</p>';
  };
  var acts=[{ label:'قرأت الصفحة '+np+' (+1)', cls:'pri', onClick:function(){ recordNext(1,np); } }];
  if(alt) acts.push({ label:'اقرأ أول صفحة فاضية ('+nf+') +1', onClick:function(){ recordNext(1,nf); } });
  acts.push({ label:'تسجيل بمقطع', onClick:function(){ openRecord(); } });
  openModal({
    title:'أكمل القراءة',
    body:'<div class="big-loc"><div class="lb">التالي بعد آخر تسجيل</div><div class="n">الصفحة <span class="num">'+np+'</span></div></div>'+loc(np)+
      (alt ? '<div class="big-loc" style="margin-top:12px"><div class="lb">أول صفحة فاضية من أول المصحف</div><div class="n">الصفحة <span class="num">'+nf+'</span></div></div>'+loc(nf)+
             '<p class="sub">فيه صفحات فاضية قبل موضعك الأخير (مثلاً سورة سجّلتها خارج الترتيب). اختار الأنسب لك.</p>'
           : '')+
      '<p class="sub">بعد القراءة سجّل ما قرأته بضغطة واحدة، أو سجّل بالسورة أو الجزء أو الحزب أو الربع.</p>',
    actions:acts
  });
}

/* --- نافذة التسجيل بالمقطع --- */
function openRecord(opts){
  opts=opts||{};
  var k=curK();
  if(k.done){ toast('الختمة الحالية مكتملة. ابدأ ختمة جديدة أولًا.'); return; }
  var D=derive(), g=goalInfo(D);
  var rec={ type:opts.type||'surah', from:0, to:0 };
  function defaults(t){
    if(opts.idx && opts.type===t){ rec.from=rec.to=opts.idx; return; }
    var p=C.ptr||P0;
    if(t==='page'){ rec.from=p; rec.to=clamp(p+Math.max(1,g.req)-1,p,TOTAL); }
    else rec.from=rec.to=unitAtPage(t,p);
  }
  defaults(rec.type);
  var TYPES=[['surah','سورة'],['juz','جزء'],['hizb','حزب'],['rub','ربع'],['page','صفحات']];
  function fieldsHTML(){
    if(rec.type==='page'){
      return '<div class="fld"><span>من الصفحة</span><input class="inp" type="number" inputmode="numeric" min="'+P0+'" max="'+TOTAL+'" id="uFrom" value="'+rec.from+'"></div>'+
             '<div class="fld"><span>إلى الصفحة</span><input class="inp" type="number" inputmode="numeric" min="'+P0+'" max="'+TOTAL+'" id="uTo" value="'+rec.to+'"></div>';
    }
    var n=UNIT_N[rec.type], o1='', o2='';
    for(var i=1;i<=n;i++){
      var t=esc(unitOpt(rec.type,i));
      o1+='<option value="'+i+'"'+(i===rec.from?' selected':'')+'>'+t+'</option>';
      o2+='<option value="'+i+'"'+(i===rec.to?' selected':'')+'>'+t+'</option>';
    }
    return '<label class="fld col"><span>من</span><select class="inp" id="uFrom">'+o1+'</select></label>'+
           '<label class="fld col"><span>إلى</span><select class="inp" id="uTo">'+o2+'</select></label>';
  }
  function pagesOf(){
    if(rec.type==='page') return (rec.from>=P0&&rec.to>=rec.from&&rec.to<=TOTAL) ? [rec.from,rec.to] : null;
    if(!(rec.from>=1&&rec.to>=rec.from)) return null;
    return [unitRange(rec.type,rec.from)[0], unitRange(rec.type,rec.to)[1]];
  }
  function labelOf(){
    if(rec.type==='page') return '';
    return rec.from===rec.to ? unitName(rec.type,rec.from) : 'من '+unitName(rec.type,rec.from)+' إلى '+unitName(rec.type,rec.to);
  }
  function summary(sh){
    var pr=pagesOf(), el=$('#uSum',sh);
    if(!pr){ el.textContent=''; return; }
    var total=pr[1]-pr[0]+1, nw=total-cnt(pr[0],pr[1]);
    el.textContent='الصفحات: من '+pr[0]+' إلى '+pr[1]+' ('+pg(total)+') — الجديد منها: '+pg(nw)+(nw<total?'، والباقي مسجّل سابقًا.':'.');
    $('#uErr',sh).textContent='';
  }
  function bind(sh){
    var f=$('#uFrom',sh), t=$('#uTo',sh);
    var isSel = rec.type!=='page';
    var onF=function(){
      rec.from=parseInt(f.value,10);
      if(isSel && rec.to<rec.from){ rec.to=rec.from; t.value=String(rec.to); }
      summary(sh);
    };
    var onT=function(){
      rec.to=parseInt(t.value,10);
      if(isSel && rec.to<rec.from){ rec.from=rec.to; f.value=String(rec.from); }
      summary(sh);
    };
    f.addEventListener(isSel?'change':'input',onF); t.addEventListener(isSel?'change':'input',onT);
    summary(sh);
  }
  openModal({
    title:'تسجيل القراءة',
    body:'<div class="seg" role="group" aria-label="وحدة التسجيل" id="uType">'+TYPES.map(function(x){ return '<button type="button" data-ut="'+x[0]+'" aria-pressed="'+(x[0]===rec.type)+'">'+x[1]+'</button>'; }).join('')+'</div>'+
      '<div id="uFields">'+fieldsHTML()+'</div>'+
      '<div class="fld"><span>التاريخ</span><input class="inp" type="date" id="uDate" value="'+D.t+'" max="'+D.t+'"></div>'+
      '<p class="note" id="uSum" aria-live="polite"></p><p class="err" id="uErr" role="alert"></p>',
    actions:[
      { label:'تسجيل', cls:'pri', keep:true, onClick:function(sh){ submit(sh); } },
      { label:'إلغاء', onClick:function(){} }
    ],
    onOpen:function(sh){
      bind(sh);
      $$('[data-ut]',sh).forEach(function(b){
        b.addEventListener('click',function(){
          rec.type=b.dataset.ut; defaults(rec.type);
          $$('[data-ut]',sh).forEach(function(x){ x.setAttribute('aria-pressed',String(x===b)); });
          $('#uFields',sh).innerHTML=fieldsHTML(); bind(sh);
        });
      });
      sh.addEventListener('keydown',function(e){ if(e.key==='Enter' && e.target.tagName==='INPUT' && e.target.type!=='date'){ e.preventDefault(); submit(sh); } });
    }
  });
  function submit(sh){
    var pr=pagesOf(), d=$('#uDate',sh).value, err=$('#uErr',sh);
    if(!pr){ err.textContent=rec.type==='page' ? 'أدخل رقمي صفحتين صحيحين بين '+P0+' و '+TOTAL+'، على ألا تتجاوز الأولى الأخيرة.' : 'اختر البداية والنهاية بحيث لا تسبق النهاية البداية.'; return; }
    if(!isYmd(d)){ err.textContent='اختر تاريخًا صحيحًا.'; return; }
    if(d>today()){ err.textContent='لا يمكن اختيار تاريخ في المستقبل.'; return; }
    if(pr[1]-pr[0]+1===cnt(pr[0],pr[1])){ err.textContent='كل صفحات هذا النطاق مسجّلة سابقًا في هذه الختمة.'; return; }
    closeModal();
    commit(curK(),[[pr[0],pr[1]]],d,labelOf());
  }
}

/* --- التسجيلات: عرض وتعديل وحذف --- */
function dayLabel(d){ var t=today(); return d===t?'اليوم':d===addDays(t,-1)?'أمس':fmtDate(d); }
function entryRow(e){
  var k=curK(), title=e.adj ? 'تقدم سابق' : (e.lab || 'من الصفحة '+e.from+' إلى '+e.to);
  var kt = e.k!==k.id ? '<span class="tag s0">ختمة #'+e.k+'</span>' : '';
  var sub = pg(rcount(e.added))+' — ص '+rangesText(e.added)+(e.adj?' (غير محتسبة في قراءة اليوم)':'');
  return '<li class="er"><div class="er-m"><b>'+esc(dayLabel(e.d))+kt+'</b><span>'+esc(title)+'</span><span>'+esc(sub)+'</span></div><div class="er-b">'+
    (e.adj?'':'<button type="button" class="icon-btn sm" data-elog="edit" data-id="'+e.id+'" aria-label="تعديل هذا التسجيل">'+ICON.edit+'</button>')+
    '<button type="button" class="icon-btn sm" data-elog="del" data-id="'+e.id+'" aria-label="حذف هذا التسجيل">'+ICON.trash+'</button></div></li>';
}
function openLog(){
  var items=S.log.slice().reverse(), shown=items.slice(0,200);
  openModal({
    title:'كل التسجيلات',
    body:(items.length?'<ul class="er-list">'+shown.map(entryRow).join('')+'</ul>'+(items.length>shown.length?'<p class="note">يُعرض آخر 200 تسجيل.</p>':''):'<p class="empty">لا توجد تسجيلات بعد.</p>')+
      '<p class="sec-note">حذف تسجيل يُرجع صفحاته إلى «غير مقروءة» في ختمته.</p>',
    actions:[ { label:'إغلاق', cls:'pri', onClick:function(){} } ]
  });
}
function openEdit(e,back){
  var D=derive();
  var ek=kById(e.k), I=edInfo(ek?ek.ed:ED);   /* نطاق الصفحات بتاع طبعة الختمة نفسها مش الطبعة الحالية */
  openModal({
    title:'تعديل التسجيل'+(ek?' — ختمة #'+ek.id+' ('+ED_SHORT[ek.ed]+')':''),
    body:'<div class="fld"><span>من الصفحة</span><input class="inp" type="number" inputmode="numeric" min="'+I.P0+'" max="'+I.N+'" id="eFrom" value="'+e.from+'" data-autofocus></div>'+
      '<div class="fld"><span>إلى الصفحة</span><input class="inp" type="number" inputmode="numeric" min="'+I.P0+'" max="'+I.N+'" id="eTo" value="'+e.to+'"></div>'+
      '<div class="fld"><span>التاريخ</span><input class="inp" type="date" id="eDate" value="'+e.d+'" max="'+D.t+'"></div>'+
      '<p class="err" id="eErr" role="alert"></p>',
    actions:[
      { label:'حفظ التعديل', cls:'pri', keep:true, onClick:function(sh){
          var a=parseInt($('#eFrom',sh).value,10), b=parseInt($('#eTo',sh).value,10), d=$('#eDate',sh).value, er=$('#eErr',sh);
          if(!(a>=I.P0&&b<=I.N&&b>=a)){ er.textContent='أدخل نطاق صفحات صحيحًا بين '+I.P0+' و '+I.N+'.'; return; }
          if(!isYmd(d)||d>today()){ er.textContent='اختر تاريخًا صحيحًا لا يتجاوز اليوم.'; return; }
          var msg=editEntry(e,a,b,d);
          if(msg){ er.textContent=msg; return; }
          save(); closeModal(); renderAll(); toast('تم حفظ التعديل.'); if(back) openLog();
        } },
      { label:'إلغاء', onClick:function(){ if(back) openLog(); } }
    ],
    onDismiss:function(){ if(back) openLog(); }
  });
}
function askDeleteEntry(e,back){
  confirmBox({ title:'حذف التسجيل', msg:'سيُحذف تسجيل «'+esc(e.adj?'تقدم سابق':(e.lab||'ص '+e.from+'–'+e.to))+'» ('+pg(rcount(e.added))+') وتعود صفحاته إلى «غير مقروءة». هل تريد المتابعة؟', ok:'حذف التسجيل', danger:true }).then(function(ok){
    if(ok){ removeEntry(e); save(); renderAll(); toast('تم حذف التسجيل.'); }
    if(back) openLog();
  });
}

/* --- أول تشغيل والإعدادات --- */
function edOptionsHTML(sel){
  return ED_ORDER.map(function(k){ var I=edInfo(k);
    return '<option value="'+k+'"'+(k===sel?' selected':'')+'>'+esc(EDS[k].label)+' — '+I.PAGES+' صفحة ('+I.P0+'–'+I.N+')</option>';
  }).join('');
}
function edButtonsHTML(cur){
  return ED_ORDER.map(function(k){ var I=edInfo(k);
    return '<button type="button" data-ed="'+k+'" aria-pressed="'+(k===cur)+'">'+esc(EDS[k].short)+' ('+I.PAGES+')</button>';
  }).join('');
}
function openOnboarding(){
  openModal({
    title:'مرحبًا بك في رحلتك',
    body:'<p>أين وصلت في قراءتك الحالية؟ اكتب رقم آخر صفحة أتممتها كما هو مطبوع في مصحفك (اتركها 0 إن كنت ستبدأ من البداية). ويمكنك لاحقًا تسجيل أي سورة أو جزء أو حزب أو ربع قرأته.</p>'+
      '<div class="fld"><span>المصحف الذي أقرأ منه</span><select class="inp" id="oEd">'+edOptionsHTML(S.settings.edition)+'</select></div>'+
      '<div class="fld"><span>آخر صفحة قرأتها</span><input class="inp" type="number" inputmode="numeric" min="0" id="oPage" value="0" data-autofocus></div>'+
      '<p class="note" id="oRange"></p>'+
      '<div class="fld"><span>هدفي اليومي (صفحات)</span><input class="inp" type="number" inputmode="numeric" min="1" max="100" id="oGoal" value="'+S.settings.dailyTarget+'"></div>'+
      '<p class="note">يمكنك تغيير هذه القيم لاحقًا من الإعدادات.</p>',
    actions:[
      { label:'ابدأ', cls:'pri', keep:true, onClick:function(sh){
          var ed=$('#oEd',sh).value; if(!EDS[ed]) ed=ED_ORDER[0];
          var I=edInfo(ed);
          var raw=String($('#oPage',sh).value||'').trim();
          var pgv=/^\d+$/.test(raw) ? Number(raw) : 0;
          if(pgv>0 && pgv<I.P0) pgv=I.P0;                 /* صفحة الغلاف مش صفحة قراءة */
          if(pgv>I.N) pgv=I.N;                            /* مسموح تسجّل ختمة مكتملة من الأول */
          var gv=toInt($('#oGoal',sh).value,1,100,2);
          S.settings.edition=ed; if(!curK().read.length){ curK().ed=ed; } useEd(curK().ed);
          S.settings.dailyTarget=gv; S.onboarded=true; save(); dismissCb=null; closeModal();
          if(pgv>0) setBase(pgv); else renderAll();
        } },
      { label:'تخطي', onClick:function(){ S.onboarded=true; save(); } }
    ],
    onOpen:function(sh){
      var sync=function(){ var I=edInfo($('#oEd',sh).value); var ip=$('#oPage',sh);
        ip.max=I.N; ip.placeholder='0 – '+I.N;
        $('#oRange',sh).textContent=EDS[$('#oEd',sh).value].label+': الصفحات من '+I.P0+' إلى '+I.N+' (و'+(I.P0>1?'الصفحة 1 غلاف لا يُسجَّل':'أول صفحة هي الفاتحة')+').';
      };
      $('#oEd',sh).addEventListener('change',sync); sync();
    },
    onDismiss:function(){ S.onboarded=true; save(); }
  });
}
function goalInputsHTML(){
  var s=S.settings;
  var head='<div class="seg" role="group" aria-label="نوع الهدف"><button type="button" data-set="goalMode:daily">هدف يومي</button><button type="button" data-set="goalMode:date">تاريخ للختم</button></div>';
  if(s.goalMode==='date'){
    return head+'<label class="fld"><span>أريد ختم القرآن بحلول</span><input type="date" data-goal="date" value="'+(s.targetDate||'')+'" min="'+today()+'"></label>';
  }
  return head+'<div class="fld"><span>هدفي اليومي</span><span style="display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap"><span class="stepper sm" dir="ltr"><button type="button" class="step" data-act="gstep" data-v="-1" aria-label="إنقاص الهدف اليومي">−</button><input type="number" inputmode="numeric" min="1" max="100" data-goal="daily" value="'+s.dailyTarget+'" aria-label="عدد الصفحات المستهدفة يوميًا"><button type="button" class="step" data-act="gstep" data-v="1" aria-label="زيادة الهدف اليومي">+</button></span><span class="unit">صفحة يوميًا</span></span></div>';
}
function openSettings(){
  var k=curK();
  openModal({
    title:'الإعدادات',
    body:
    '<div class="sec" style="margin-top:0;padding-top:0;border:0"><h3>الهدف</h3><div class="js-goalInputs"></div></div>'+
    '<div class="sec"><h3>المظهر</h3><span class="lbl" style="margin-top:0">الوضع</span><div class="seg" role="group" aria-label="الوضع"><button type="button" data-set="theme:light">فاتح</button><button type="button" data-set="theme:dark">داكن</button><button type="button" data-set="theme:auto">تلقائي</button></div>'+
      '<span class="lbl">اللون</span><div class="pal" role="group" aria-label="لون التطبيق">'+PALETTES.map(function(p){ return '<button type="button" data-set="palette:'+p[0]+'" aria-pressed="false"><i style="background:'+p[2]+'"></i>'+p[1]+'</button>'; }).join('')+'</div>'+
      '<span class="lbl">حجم الخط</span><div class="seg" role="group" aria-label="حجم الخط"><button type="button" data-set="fontScale:s">صغير</button><button type="button" data-set="fontScale:m">متوسط</button><button type="button" data-set="fontScale:l">كبير</button></div>'+
      '<span class="lbl">العرض</span><div class="seg" role="group" aria-label="كثافة العرض"><button type="button" data-set="density:comfortable">مريح</button><button type="button" data-set="density:compact">مضغوط</button></div></div>'+
    '<div class="sec"><h3>المصحف الذي أقرأ منه</h3><p class="sub">عدد الصفحات وحدود السور والأجزاء والأحزاب والأرباع تتبع الطبعة المختارة. أرقام الصفحات هي نفسها المطبوعة في مصحفك.</p><div class="seg" role="group" aria-label="المصحف">'+edButtonsHTML(k.ed)+'</div><p class="note" id="edNote"></p></div>'+
    '<div class="sec"><h3>ما قرأته قبل استخدام التطبيق</h3><p class="sub">اكتب آخر صفحة أتممتها في هذه الختمة، فتُعدّ كل الصفحات من أول المصحف إليها مقروءة.</p><div class="fld" style="margin-top:8px"><span>حتى الصفحة</span><span style="display:inline-flex;gap:8px;align-items:center"><input class="inp" type="number" inputmode="numeric" min="'+P0+'" max="'+TOTAL+'" id="sPage" style="width:96px" placeholder="'+P0+'–'+TOTAL+'" '+(k.done?'disabled':'')+' aria-label="آخر صفحة قرأتها"><button type="button" class="btn" data-act="setpage" '+(k.done?'disabled':'')+'>تسجيل</button></span></div></div>'+
    '<div class="sec"><h3>الختمات</h3><button type="button" class="btn wide" data-act="newk">بدء ختمة جديدة</button></div>'+
    '<div class="sec"><h3>مشاركة التقدم</h3><p class="sub">اعمل رابطًا فيه كل تقدمك وابعته لحد تاني، أو افتحه على جهازك التاني. من غير سيرفر ولا حساب — بس اعرف إن أي حد عنده الرابط يقدر يشوف بياناتك.</p><div class="row-btns"><button type="button" class="btn" data-act="share">شارك تقدمي</button><button type="button" class="btn" data-act="sharein">استيراد من رابط</button></div></div>'+
    '<div class="sec"><h3>النسخ الاحتياطي</h3><p class="sub">بياناتك محفوظة على جهازك فقط. صدّر نسخة احتياطية بين حين وآخر. النسخ القديمة تُستعاد دون مشكلة.</p><div class="row-btns"><button type="button" class="btn" data-act="export">تصدير نسخة احتياطية</button><button type="button" class="btn" data-act="import">استعادة نسخة احتياطية</button></div></div>'+
    '<div class="sec"><h3>إعادة الضبط</h3><button type="button" class="btn danger wide" data-act="reset">إعادة ضبط البيانات</button></div>',
    actions:[ { label:'تم', cls:'pri', onClick:function(){} } ],
    onOpen:function(sh){
      renderGoalInputs(); syncPressed();
      var note=$('#edNote',sh);
      if(note) note.textContent='الختمة الحالية على '+ED_NAMES[k.ed]+'. تغيير الطبعة في منتصف ختمة يحوّل تقدمك بالتقريب بعد موافقتك.';
    }
  });
}

/* ============ النسخ الاحتياطي ============ */
function doExport(){
  var payload = { app:'quran-dashboard', version:3, exportedAt:new Date().toISOString(), edition:S.settings.edition, data:S };
  var blob = new Blob([JSON.stringify(payload,null,2)], { type:'application/json' });
  var url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href=url; a.download='quran-journey-backup-'+today()+'.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ URL.revokeObjectURL(url); }, 4000);
  toast('تم تصدير النسخة الاحتياطية.');
}
function applyImported(st, title, okLabel){
  return confirmBox({ title:title, msg:'سيتم استبدال بياناتك الحالية بالكامل بالبيانات المستوردة ('+st.khatmahs.length+' ختمة، '+st.log.length+' تسجيل). هل تريد المتابعة؟', ok:okLabel||'استعادة' }).then(function(ok){
    if(!ok) return false;
    S=st; ui.amt=S.settings.lastAmount||S.settings.dailyTarget; save(); applyTheme(); ui.juz=null; ui.hd=null; renderAll();
    toast('تمت الاستعادة بنجاح.');
    return true;
  });
}
/* sanitize() بتبدّل متغيرات الطبعة كأثر جانبي — فأي مسار استيراد بيرجّعها لحالتها بعدها */
function trySanitize(obj){
  var keepEd=ED, st=null;
  try{ st=sanitize(obj); }catch(e){ st=null; }
  useEd(keepEd);
  return st;
}
function doImport(file){
  var r=new FileReader();
  r.onload=function(){
    var parsed;
    try{ parsed=JSON.parse(r.result); }catch(e){ toast('الملف غير صالح: تعذّر قراءة JSON.'); return; }
    var st=trySanitize(parsed);
    if(!st){ toast('الملف غير صالح: لم يُتعرَّف على بيانات الرحلة.'); return; }
    applyImported(st,'استعادة نسخة احتياطية','استعادة');
  };
  r.onerror=function(){ toast('تعذّرت قراءة الملف.'); };
  r.readAsText(file);
}

/* =========================================================
   أكواد المشاركة — انقل تقدمك برابط، من غير سيرفر ولا حساب
   ---------------------------------------------------------
   الفكرة: الحالة كلها → JSON مضغوط (deflate-raw لو المتصفح
   بيدعمه، وإلا عادي) → base64url → يتحط في #s=... في الرابط.

   ⚠️ الخصوصية: الكود ده فيه **كل** بياناتك. أي حد عنده الرابط
   يقدر يشوفها. ما تحطّوش في مكان عام.

   مفيش أي طلب شبكة هنا: CompressionStream API محلية في المتصفح.
   ========================================================= */
var SHARE_MAGIC = 'qd3';

function b64u(bytes){
  var s='', CH=0x8000;
  for(var i=0;i<bytes.length;i+=CH) s+=String.fromCharCode.apply(null, bytes.subarray(i,i+CH));
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function unb64u(str){
  str=String(str).replace(/-/g,'+').replace(/_/g,'/');
  while(str.length%4) str+='=';
  var s=atob(str), out=new Uint8Array(s.length);
  for(var i=0;i<s.length;i++) out[i]=s.charCodeAt(i);
  return out;
}
function streamBytes(stream){
  return new Promise(function(res,rej){
    var r=stream.getReader(), chunks=[], total=0;
    (function pump(){
      r.read().then(function(x){
        if(x.done){ var out=new Uint8Array(total), at=0;
          chunks.forEach(function(c){ out.set(c,at); at+=c.length; }); return res(out); }
        chunks.push(new Uint8Array(x.value)); total+=x.value.byteLength; pump();
      }, rej);
    })();
  });
}
/* بنكتب في الـWritableStream بتاع الضغط مباشرة بدل Blob.stream() —
   عشان ما نعتمدش على API مش موجودة في كل البيئات (jsdom مثلًا ما فيهاش Blob.stream). */
function runCodec(Ctor, bytes){
  var cs=new Ctor('deflate-raw');
  var wr=cs.writable.getWriter();
  wr.write(bytes); wr.close();
  return streamBytes(cs.readable);
}
function zipBytes(bytes){
  if(typeof CompressionStream!=='function') return Promise.resolve(null);
  try{
    return runCodec(CompressionStream, bytes)
      .then(function(b){ return (b && b.length < bytes.length) ? b : null; }, function(){ return null; });
  }catch(e){ return Promise.resolve(null); }
}
function unzipBytes(bytes){
  if(typeof DecompressionStream!=='function') return Promise.reject(new Error('no-decompress'));
  return runCodec(DecompressionStream, bytes);
}

/* الحالة → صيغة مضغوطة المفاتيح (أقصر في الرابط). فكّها بيرجع الشكل الكامل
   اللي بيفهمه sanitize() — يعني نفس مسار التحقق بتاع الملف المستورد بالظبط. */
function packState(){
  var st=S.settings;
  return { a:SHARE_MAGIC, e:st.edition,
    g:[st.theme, st.palette, st.density, st.fontScale, st.goalMode, st.dailyTarget, st.targetDate, st.lastAmount],
    k:S.khatmahs.map(function(k){ return [k.id,k.start,k.end,k.done?1:0,k.stopped?1:0,k.ed,k.read,k.last]; }),
    l:S.log.map(function(e){ return [e.id,e.d,e.k,e.p,e.from,e.to,e.added,e.adj?1:0,e.lab]; }),
    t:S.targets, o:S.onboarded?1:0 };
}
function unpackState(c){
  if(!c || c.a!==SHARE_MAGIC || !Array.isArray(c.k) || !c.k.length) throw new Error('bad-share');
  var g=Array.isArray(c.g)?c.g:[];
  return { v:3, onboarded:c.o!==0,
    settings:{ theme:g[0], palette:g[1], density:g[2], fontScale:g[3], goalMode:g[4],
               dailyTarget:g[5], targetDate:g[6], edition:c.e, lastAmount:g[7] },
    khatmahs:c.k.map(function(k){ return { id:k[0], start:k[1], end:k[2], done:!!k[3], stopped:!!k[4], ed:k[5], read:k[6], last:k[7] }; }),
    log:(Array.isArray(c.l)?c.l:[]).map(function(e){ return { id:e[0], d:e[1], k:e[2], p:e[3], from:e[4], to:e[5], added:e[6], adj:!!e[7], lab:e[8] }; }),
    targets:(c.t && typeof c.t==='object')?c.t:{} };
}

function makeShareCode(){
  var json=JSON.stringify(packState());
  var raw=new TextEncoder().encode(json);
  return zipBytes(raw).then(function(z){
    var packed = z ? z : raw;
    return { code:(z?'1':'0')+b64u(packed), jsonBytes:raw.length, bytes:packed.length, zipped:!!z };
  });
}
function extractCode(input){
  var s=String(input==null?'':input).trim().replace(/\s+/g,'');
  if(!s) return null;
  var m=s.match(/[?&#]s=([01][A-Za-z0-9_\-]{8,})/i);
  if(m) return m[1];
  if(/^[01][A-Za-z0-9_\-]{8,}$/.test(s)) return s;
  return null;
}
function decodeShareCode(code){
  var flag=code.charAt(0), bytes;
  try{ bytes=unb64u(code.slice(1)); }catch(e){ return Promise.reject(new Error('bad-base64')); }
  var p = flag==='1' ? unzipBytes(bytes).catch(function(){ throw new Error('bad-zip'); })
                     : Promise.resolve(bytes);
  return p.then(function(b){ return unpackState(JSON.parse(new TextDecoder().decode(b))); });
}
function shareURL(code){
  var base=location.href.split('#')[0];
  return base+(base.indexOf('?')>-1?'&':'#')+'s='+code;
}

function copyText(text, done){
  var ok=false;
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){ done(true); }, function(){ done(fallbackCopy(text)); });
      return;
    }
  }catch(e){}
  done(fallbackCopy(text));
}
function fallbackCopy(text){
  try{
    var ta=document.createElement('textarea');
    ta.value=text; ta.setAttribute('readonly',''); ta.style.position='fixed'; ta.style.top='-1000px';
    document.body.appendChild(ta); ta.select();
    var ok=document.execCommand('copy');
    ta.remove(); return !!ok;
  }catch(e){ return false; }
}

function openShare(){
  openModal({ title:'مشاركة التقدم', body:'<p class="sub">جارٍ تجهيز الرابط…</p>', actions:[] });
  makeShareCode().then(function(r){
    var url=shareURL(r.code);
    var ratio = r.jsonBytes ? Math.round(100 - r.bytes*100/r.jsonBytes) : 0;
    var longWarn = url.length>2000
      ? '<p class="note" style="color:var(--danger)">الرابط طويل ('+url.length+' حرفًا). بعض التطبيقات (زي واتساب) بتقصّ الروابط الطويلة — لو حصل، انسخ <b>الكود وحده</b> من المربع الثاني وابعته.</p>'
      : '<p class="note">طول الرابط '+url.length+' حرفًا — مناسب للمشاركة في أي تطبيق.</p>';
    openModal({
      title:'مشاركة التقدم',
      body:'<p>ابعت الرابط ده لأي حد، أو افتحه على جهازك التاني، وهيقدر يستورد تقدمك كامل. <b>من غير سيرفر ولا حساب</b> — البيانات جوه الرابط نفسه.</p>'+
        '<p class="note" style="color:var(--danger)">⚠️ الرابط يحتوي على <b>كل</b> بياناتك (الختمات والسجل والإعدادات). أي حد عنده الرابط يشوفها. ما تنشرهوش في مكان عام.</p>'+
        '<div class="fld"><span>الرابط كامل</span><input class="inp mono" type="text" id="shUrl" readonly value="'+url.replace(/"/g,'&quot;')+'" dir="ltr" aria-label="رابط المشاركة"></div>'+
        '<div class="row-btns"><button type="button" class="btn pri" data-act="sharecopyurl">نسخ الرابط</button></div>'+
        '<div class="fld" style="margin-top:10px"><span>الكود وحده (لو الرابط اتقصّ)</span><textarea class="inp mono codebox" id="shCode" readonly dir="ltr" rows="4" aria-label="كود المشاركة">'+r.code+'</textarea></div>'+
        '<div class="row-btns"><button type="button" class="btn" data-act="sharecopycode">نسخ الكود</button></div>'+
        '<p class="note">'+(r.zipped?'مضغوط (وفّر '+ratio+'٪): ':'غير مضغوط (المتصفح لا يدعم الضغط): ')+r.jsonBytes+' بايت → '+r.bytes+' بايت → '+r.code.length+' حرفًا.</p>'+
        longWarn+
        '<p class="note">اللي هيتفتح عنده الرابط هيشوف رسالة تسأله لو عايز يستورد التقدم — بياناته هو ما بتتغيّرش من غير موافقته.</p>',
      actions:[ { label:'تم', cls:'pri', onClick:function(){} } ],
      onOpen:function(sh){
        var u=$('#shUrl',sh);
        if(u){ u.addEventListener('focus',function(){ try{ u.select(); }catch(e){} }); }
        var c=$('#shCode',sh);
        if(c){ c.addEventListener('focus',function(){ try{ c.select(); }catch(e){} }); }
      }
    });
  }).catch(function(e){ toast('تعذّر إنشاء رابط المشاركة.'); });
}

function openShareImport(prefill){
  openModal({
    title:'استيراد من رابط أو كود',
    body:'<p>الصق الرابط أو الكود اللي وصلك. هيُطلب منك تأكيد قبل أي تغيير.</p>'+
      '<div class="fld"><span>الرابط أو الكود</span><textarea class="inp mono codebox" id="shIn" dir="ltr" rows="5" placeholder="#s=1eJyLVrJSKs5ILUpVslIKS8wpTgUA…" aria-label="رابط أو كود المشاركة">'+String(prefill||'').replace(/</g,'&lt;')+'</textarea></div>'+
      '<p class="note" id="shInNote"></p>'+
      '<p class="note">تقدر كمان تستورد من ملف نسخة احتياطية من قسم «النسخ الاحتياطي» في الإعدادات.</p>',
    actions:[ { label:'استيراد', cls:'pri', keep:true, onClick:function(sh){
        var code=extractCode($('#shIn',sh).value);
        var note=$('#shInNote',sh);
        if(!code){ note.textContent='ما عرفتش أستخرج كودًا صالحًا. تأكد إنك نسخت الرابط كله أو الكود من أول حرف.'; note.style.color='var(--danger)'; return; }
        note.textContent='جارٍ فكّ الكود…'; note.style.color='';
        decodeShareCode(code).then(function(obj){
          var st=trySanitize(obj);
          if(!st){ note.textContent='الكود فكّ بنجاح لكن البيانات جواه غير صالحة أو ناقصة.'; note.style.color='var(--danger)'; return; }
          dismissCb=null; closeModal();
          applyImported(st,'استيراد تقدم مشترك','استيراد');
        }).catch(function(e){
          note.textContent='الكود تالف أو ناقص (ممكن يكون اتقصّ في رسالة). جرّب تنسخه تاني، أو استخدم ملف النسخة الاحتياطية.';
          note.style.color='var(--danger)';
        });
      } } ],
    onOpen:function(sh){ var t=$('#shIn',sh); if(t && !prefill) t.focus(); }
  });
}

/* لو التطبيق اتفتح ورابط فيه #s=... — اعرض الاستيراد مرة واحدة ونضّف الرابط */
function checkShareInURL(){
  var code=null;
  try{ code=extractCode(location.hash||''); if(!code) code=extractCode(location.search||''); }catch(e){}
  if(!code) return;
  var clean=function(){ try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){} };
  decodeShareCode(code).then(function(obj){
    var st=trySanitize(obj);
    if(!st){ toast('الرابط يحتوي على كود مشاركة تالف — تم تجاهله.'); clean(); return; }
    confirmBox({ title:'تقدم مشترك في الرابط', msg:'الرابط ده فيه تقدم قراءة مشارك ('+st.khatmahs.length+' ختمة، '+st.log.length+' تسجيل). استيراده <b>هيستبدل</b> بياناتك الحالية بالكامل. هل تستورده؟', ok:'استيراد' }).then(function(ok){
      clean();
      if(ok){ S=st; ui.amt=S.settings.lastAmount||S.settings.dailyTarget; save(); applyTheme(); ui.juz=null; ui.hd=null; renderAll(); toast('تم استيراد التقدم المشترك.'); }
    });
  }).catch(function(){ toast('الرابط يحتوي على كود مشاركة تالف — تم تجاهله.'); clean(); });
}
function askReset(){
  confirmBox({ title:'إعادة ضبط البيانات', msg:'سيتم حذف كل بياناتك نهائيًا: القراءة والختمات والإعدادات. لا يمكن التراجع عن ذلك. يُنصح بتصدير نسخة احتياطية أولًا.', ok:'حذف كل البيانات', danger:true, check:'أفهم أن البيانات ستُحذف نهائيًا' }).then(function(ok){
    if(!ok) return;
    S=defaultState(); ui.juz=null; ui.hd=null; ui.amt=S.settings.dailyTarget; save(); applyTheme(); renderAll(); toast('تمت إعادة ضبط البيانات.');
    setTimeout(openOnboarding,300);
  });
}
/* تحويل صفحة من طبعة لطبعة بالاستيفاء داخل الربع نفسه.
   كل الحدود صريحة (من غير اعتماد على TOTAL العام) — كان ترتيب استدعاء خفي قبل كده. */
function mapPage(p,from,to){
  var A=EDS[from], B=EDS[to];
  if(!A||!B) return p;
  var a0=A.P0||1, b0=B.P0||1;
  if(p<a0) p=a0; if(p>A.N) p=A.N;
  var r=0; for(; r<239; r++) if(A.RE[r]>=p) break;
  var a=A.RS[r], b=A.RE[r], f=b>a ? (p-a)/(b-a) : 0;
  return clamp(Math.round(B.RS[r]+clamp(f,0,1)*(B.RE[r]-B.RS[r])), b0, B.N);
}
function mapRanges(rs,from,to){
  var B=EDS[to], b0=B.P0||1;
  var b=new Uint8Array(B.N+2);
  rs.forEach(function(r){ var x=mapPage(r[0],from,to), y=mapPage(r[1],from,to); for(var p=Math.min(x,y);p<=Math.max(x,y);p++) if(p>=b0&&p<=B.N) b[p]=1; });
  return rangesOf(b,b0,B.N);
}
function convertKhatmah(k,to){
  var from=k.ed;
  k.read=mapRanges(k.read,from,to);
  k.last=k.last?mapPage(k.last,from,to):0;
  S.log.forEach(function(e){
    if(e.k!==k.id) return;
    e.added=mapRanges(e.added,from,to);
    e.from=mapPage(e.from,from,to); e.to=mapPage(e.to,from,to); if(e.to<e.from) e.to=e.from;
    e.p=rcount(e.added);
    if(e.adj) e.lab='تقدم سابق (بعد التحويل)';
  });
  k.ed=to;
  /* مهم: لو التحويل أكمل الختمة لازم نضبط end/stopped، وإلا celebrate() كان بيعمل crash */
  withEd(k,function(){
    k.done = rcount(k.read)===PAGES;
    if(k.done){ k.stopped=false; if(!k.end) k.end=today(); }
  });
}
function pickEd(v){
  var k=curK();
  if(!EDS[v] || v===k.ed){ syncPressed(); return; }
  var used = k.read.length>0 || S.log.some(function(e){ return e.k===k.id; });
  if(k.done || !used){
    S.settings.edition=v; if(!used && !k.done){ k.ed=v; }
    save(); renderAll(); syncPressed();
    toast(k.done ? 'ستُستخدم هذه الطبعة في الختمة الجديدة.' : 'تم اختيار '+ED_NAMES[v]+'.'); return;
  }
  confirmBox({ title:'تغيير المصحف', msg:'الختمة الحالية مسجّلة على '+ED_NAMES[k.ed]+'. يمكن تحويل تقدمها إلى '+ED_NAMES[v]+' بالتقريب (بحسب موضع كل صفحة داخل ربعها)، ولن تتطابق الصفحات تمامًا لأن الطبعتين مختلفتان. الختمات السابقة تبقى كما هي. هل تحوّل الختمة الحالية؟', ok:'تحويل تقريبي' }).then(function(ok){
    if(!ok){ syncPressed(); return; }
    convertKhatmah(k,v); S.settings.edition=v; save(); renderAll(); syncPressed();
    if(k.done) celebrate(k);
    else toast('تم التحويل إلى '+ED_NAMES[v]+'. راجع آخر صفحة وصلت إليها.');
  });
}
function askNewKhatmah(){
  var k=curK(), msg;
  if(k.done) msg='ستبدأ الختمة رقم '+(k.id+1)+'. تبقى الختمات السابقة محفوظة في السجل.';
  else msg='الختمة الحالية لم تكتمل ('+pctFloor(rcount(k.read)/PAGES)+'%). سيتم حفظها في السجل كختمة غير مكتملة، ثم تبدأ ختمة جديدة من الصفحة '+P0+'.';
  confirmBox({ title:'بدء ختمة جديدة', msg:msg, ok:'بدء ختمة جديدة' }).then(function(ok){ if(ok){ closeModal(); startNew(); } });
}

/* ============ المظهر ============ */
var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
function isDark(){ var t=S.settings.theme; return t==='dark' || (t==='auto' && mq && mq.matches); }
function patternFor(hex){
  var c=hex.replace('#','%23');
  return 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'64\' height=\'64\' viewBox=\'0 0 64 64\'%3E%3Cg fill=\'none\' stroke=\''+c+'\' stroke-opacity=\'.12\' stroke-width=\'1\'%3E%3Cpath d=\'M18 18H46V46H18Z M51.8 32L32 12.2L12.2 32L32 51.8Z\'/%3E%3Ccircle cx=\'0\' cy=\'0\' r=\'6\'/%3E%3Ccircle cx=\'64\' cy=\'0\' r=\'6\'/%3E%3Ccircle cx=\'0\' cy=\'64\' r=\'6\'/%3E%3Ccircle cx=\'64\' cy=\'64\' r=\'6\'/%3E%3C/g%3E%3C/svg%3E")';
}
function applyTheme(){
  var dark=isDark(), r=document.documentElement, st=S.settings;
  r.dataset.theme = dark?'dark':'light';
  r.dataset.palette = st.palette;
  r.dataset.density = st.density;
  r.dataset.fs = st.fontScale;
  var cs=getComputedStyle(r), acc=(cs.getPropertyValue('--accent')||'').trim(), bg=(cs.getPropertyValue('--bg')||'').trim();
  if(/^#[0-9a-f]{6}$/i.test(acc)) r.style.setProperty('--pattern',patternFor(acc));
  $('#metaTheme').setAttribute('content', /^#/.test(bg)?bg:(dark?'#0c1211':'#edf0ee'));
  $('#btnTheme').innerHTML = dark ? ICON.sun : ICON.moon;
  $('#btnTheme').setAttribute('aria-label', dark ? 'التبديل إلى المظهر الفاتح' : 'التبديل إلى المظهر الداكن');
}

/* ============ العرض ============ */
var D;
var pctShown=0, pctRaf;
function tweenPct(to){
  var el=$('#pct');
  if(reduced){ el.textContent=to+'%'; pctShown=to; return; }
  var from=pctShown, t0=performance.now(), dur=800;
  cancelAnimationFrame(pctRaf);
  var step=function(t){
    var x=Math.min(1,(t-t0)/dur), v=Math.round(from+(to-from)*(1-Math.pow(1-x,3)));
    el.textContent=v+'%';
    if(x<1) pctRaf=requestAnimationFrame(step); else pctShown=to;
  };
  pctRaf=requestAnimationFrame(step);
}
function safe(fn){ try{ fn(); }catch(e){ console.error(fn.name, e); } }

function renderRing(){
  var k=curK(), rc=C.rc, p=PAGES?rc/PAGES:0, Cc=2*Math.PI*78, fg=$('#ringFg');
  fg.style.strokeDasharray=Cc; fg.style.strokeDashoffset=Cc*(1-p);
  var ticks='';
  for(var j=0;j<30;j++){
    var rd=cnt(JS_[j],JE[j]), len=JE[j]-JS_[j]+1, cls=rd===0?'':(rd===len?'d':'p');
    var a=(j*12-90+6)*Math.PI/180, r1=92, r2=cls==='d'?104:cls==='p'?99:97;
    ticks+='<line class="tk '+cls+'" stroke-width="'+(cls==='d'?3.4:cls==='p'?2.6:1.6)+'" x1="'+(110+r1*Math.cos(a)).toFixed(2)+'" y1="'+(110+r1*Math.sin(a)).toFixed(2)+'" x2="'+(110+r2*Math.cos(a)).toFixed(2)+'" y2="'+(110+r2*Math.sin(a)).toFixed(2)+'"/>';
  }
  $('#ticks').innerHTML=ticks;
  var pv = k.done?100:pctFloor(p);
  tweenPct(pv);
  $('#ringSvg').setAttribute('aria-label','تم إنجاز '+pv+'٪ من الختمة، '+rc+' من '+PAGES+' صفحة');
  $('#pgsTxt').innerHTML='<span class="num">'+rc+' / '+PAGES+'</span> صفحة';
  $('#kBadge').textContent='ختمة #'+k.id+(k.done?' — مكتملة':'');
  var cj = k.done?30:juzAt(C.ptr)+1;
  $('#miniStats').innerHTML=
    '<div><dt>صفحات مقروءة</dt><dd class="num">'+rc+'</dd></div>'+
    '<div><dt>صفحات متبقية</dt><dd class="num">'+(PAGES-rc)+'</dd></div>'+
    '<div><dt>الجزء الحالي</dt><dd class="num">'+cj+'</dd></div>'+
    '<div><dt>الإنجاز الكلي</dt><dd class="num">'+(k.done?'100':(p*100).toFixed(1))+'%</dd></div>';
}
function amtLabel(){
  var n=toInt(ui.amt,0,TOTAL,0), b=$('#btnRec');
  b.textContent = n>0 ? 'تسجيل '+pg(n) : 'تسجيل';
}
function renderToday(){
  var k=curK(), g=goalInfo(D), tgt=g.req, n=D.todayPages;
  var hj=hijriOf(D.t);
  $('#todayDate').textContent=fmtDate(D.t)+(hj?' · '+hj:'');
  $('#todayPages').textContent=n;
  $('#todayTarget').textContent=tgt;
  var pc=Math.min(100,Math.round(n/tgt*100));
  $('#todayBar').style.width=pc+'%';
  $('#todayBarBox').setAttribute('aria-valuenow',pc);
  var st=$('#todayStatus');
  if(k.done){ st.className='status'; st.textContent='الختمة مكتملة — ابدأ ختمة جديدة لمتابعة التسجيل.'; }
  else if(n>=tgt){ st.className='status ok'; st.textContent='تم تحقيق الهدف ✓'+(n>tgt?' (زيادة '+pg(n-tgt)+')':''); }
  else { st.className='status'; st.textContent=pc+'% من هدف اليوم — متبقٍ '+pg(tgt-n); }
  var dis=k.done, amt=$('#amt');
  $$('[data-add]').forEach(function(b){ b.disabled=dis; });
  amt.disabled=dis; $('#amtMinus').disabled=dis; $('#amtPlus').disabled=dis; $('#btnRec').disabled=dis; $('#btnRec2').disabled=dis;
  if(document.activeElement!==amt) amt.value=ui.amt;
  amtLabel();
  $('#amtHint').textContent = dis ? '' : 'ستُسجَّل من الصفحة '+C.ptr+' ('+SN[surahsOn(C.ptr)[0]]+')'+(C.ptrFirst!==C.ptr?' — أو اضغط «أكمل القراءة» للتسجيل من الصفحة '+C.ptrFirst:'')+'.';
  var e=S.log[S.log.length-1];
  $('#btnUndo').disabled = !(e && e.k===k.id);
}
function renderContinue(){
  var k=curK(), alt=$('#contAlt');
  $('#contArrow').innerHTML=ICON.left;
  if(k.done){
    $('#contLast').textContent='اكتملت الختمة رقم '+k.id;
    $('#contNext').textContent='ابدأ ختمة جديدة';
    $('#contWhere').textContent='';
    if(alt){ alt.hidden=true; alt.textContent=''; }
    return;
  }
  $('#contLast').textContent = k.last>0 ? 'آخر قراءة: الصفحة '+k.last : 'لم تبدأ هذه الختمة بعد';
  $('#contNext').textContent = 'التالي: الصفحة '+C.ptr;
  $('#contWhere').textContent = whereText(C.ptr);
  /* U1: لما يكون فيه صفحات فاضية قبل موضعك الأخير (سورة سجّلتها خارج الترتيب)
     بنعرض مؤشر تاني لأول صفحة فاضية من أول المصحف، والمستخدم بيختار. */
  if(alt){
    if(C.ptrFirst!==C.ptr){
      alt.hidden=false;
      alt.textContent='أول صفحة فاضية من أول المصحف: '+C.ptrFirst+' — '+whereText(C.ptrFirst);
    } else { alt.hidden=true; alt.textContent=''; }
  }
}
function renderEst(){
  var e=estimate(D), k=curK();
  $('#estRem').textContent = k.done?0:PAGES-C.rc;
  if(e.done){ $('#estDate').textContent='تمّت الختمة'; $('#estSub').textContent='ما شاء الله. ابدأ ختمة جديدة عندما تكون جاهزًا.'; }
  else if(e.none){ $('#estDate').textContent='—'; $('#estSub').textContent='سجّل قراءتك ليُحسب الموعد تلقائيًا.'; }
  else if(e.far){ $('#estDate').textContent='—'; $('#estSub').textContent='الوتيرة الحالية بطيئة جدًا لتقدير موعد قريب.'; }
  else { $('#estDate').textContent=fmtDate(e.date); $('#estSub').textContent='بعد '+dy(e.days)+' — بمتوسط '+fmt(Math.round(D.avg*10)/10)+' صفحة يوميًا.'; }
}
var STT = ['لم يبدأ','قيد القراءة','مكتمل'];
function renderJuz(){
  var k=curK(), html='';
  if(ui.juz===null) ui.juz = k.done?30:juzAt(C.ptr)+1;
  for(var j=0;j<30;j++){
    var len=JE[j]-JS_[j]+1, rd=cnt(JS_[j],JE[j]), pc=rd/len*100, st=rd===0?0:(rd===len?2:1);
    html+='<button type="button" class="juz s'+st+'" data-j="'+(j+1)+'" aria-pressed="'+(ui.juz===j+1)+'" aria-label="الجزء '+(j+1)+': '+STT[st]+'، '+pctFloor(rd/len)+'%"><i class="pie" style="--p:'+pc.toFixed(1)+'"></i><b>'+(j+1)+'</b><span class="jbar"><u style="width:'+pc.toFixed(1)+'%"></u></span></button>';
  }
  $('#juzGrid').innerHTML=html;
  renderJuzDetail();
}
function renderJuzDetail(){
  var j=ui.juz-1, len=JE[j]-JS_[j]+1, rd=cnt(JS_[j],JE[j]), st=rd===0?0:(rd===len?2:1);
  var names=[]; for(var i=0;i<114;i++){ if(SS[i]<=JE[j] && SE[i]>=JS_[j]) names.push(SN[i]); }
  var rubsHTML='';
  for(var h=0;h<2;h++){
    var hz=(j*2+h+1), row='';
    for(var q=0;q<4;q++){
      var r=(hz-1)*4+q+1, a=RS[r-1], b=RE[r-1], l=b-a+1, c=cnt(a,b), s=c===0?0:(c===l?2:1);
      row+='<button type="button" class="rub s'+s+'" data-rub="'+r+'" aria-label="تسجيل '+unitName('rub',r)+': '+STT[s]+'"><span>الربع '+(q+1)+'</span><small>ص '+a+(b>a?'–'+b:'')+(s===2?' ✓':s===1?' '+pctFloor(c/l)+'%':'')+'</small><span class="jbar"><u style="width:'+(c/l*100).toFixed(1)+'%"></u></span></button>';
    }
    rubsHTML+='<div class="hz"><span>الحزب '+hz+'</span><div class="rubrow">'+row+'</div></div>';
  }
  $('#juzDetail').innerHTML=
    '<div class="dt-h"><h3>الجزء '+(j+1)+' <small>«'+JN[j]+'»</small></h3><span class="tag s'+st+'">'+STT[st]+'</span></div>'+
    '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pctFloor(rd/len)+'" aria-label="تقدم الجزء"><i style="width:'+(rd/len*100)+'%"></i></div>'+
    '<dl class="kv"><div><dt>نسبة الإنجاز</dt><dd class="num">'+pctFloor(rd/len)+'%</dd></div><div><dt>الصفحات</dt><dd class="num">'+JS_[j]+' – '+JE[j]+'</dd></div>'+
    '<div><dt>المقروء</dt><dd>'+pg(rd)+'</dd></div><div><dt>المتبقي</dt><dd>'+pg(len-rd)+'</dd></div></dl>'+
    '<p class="sur"><b>السور:</b> '+names.join('، ')+'</p>'+
    '<div class="rubs-t">الأحزاب والأرباع (اضغط على ربع لتسجيله)</div>'+rubsHTML+
    '<button type="button" class="btn pri wide" data-act="recJuz"'+(rd===len||curK().done?' disabled':'')+'>'+(rd===len?'هذا الجزء مكتمل':'تسجيل هذا الجزء')+'</button>';
}
function renderGoalInputs(){
  $$('.js-goalInputs').forEach(function(c){
    var focused = c.contains(document.activeElement);
    if(focused && c.dataset.mode===S.settings.goalMode){
      var di=$('[data-goal="daily"]',c); if(di && document.activeElement!==di) di.value=S.settings.dailyTarget;
      return;
    }
    c.innerHTML=goalInputsHTML(); c.dataset.mode=S.settings.goalMode;
  });
}
function renderGoal(){
  renderGoalInputs();
  var g=goalInfo(D), e=estimate(D), k=curK(), st=S.settings, msg='';
  var rows='<div><dt>المطلوب يوميًا</dt><dd>'+pg(g.req)+'</dd></div><div><dt>متوسطك الحالي</dt><dd>'+(D.avg>0?fmt(Math.round(D.avg*10)/10)+' صفحة/يوم':'—')+'</dd></div>'+
    '<div><dt>المتبقي</dt><dd>'+pg(g.rem)+'</dd></div>';
  if(st.goalMode==='date' && st.targetDate) rows+='<div><dt>التاريخ المستهدف</dt><dd>'+fmtDate(st.targetDate)+'</dd></div>';
  else if(!k.done) rows+='<div><dt>الختم بهدفك</dt><dd>'+fmtDate(addDays(D.t,Math.ceil(g.rem/st.dailyTarget)))+'</dd></div>';
  if(!k.done) rows+='<div class="wide"><dt>الموعد المتوقع بوتيرتك</dt><dd>'+(e.date&&!e.far?fmtDate(e.date):'—')+'</dd></div>';
  $('#goalStats').innerHTML=rows;
  if(k.done) msg='أتممت هذه الختمة. ابدأ ختمة جديدة عندما تكون جاهزًا.';
  else if(g.noDate) msg='اختر تاريخًا مستهدفًا لحساب الوتيرة المطلوبة.';
  else if(g.overdue) msg='مضى التاريخ المستهدف. المتبقي '+pg(g.rem)+'؛ اختر تاريخًا جديدًا إن رغبت.';
  else if(D.avg<=0) msg='سجّل قراءتك لتظهر مقارنة وتيرتك بهدفك.';
  else if(st.goalMode==='daily'){
    var a=Math.round(D.avg*10)/10;
    msg = a>g.req ? 'وتيرتك الحالية ('+fmt(a)+' صفحة يوميًا) أعلى من هدفك ('+g.req+').' : a===g.req ? 'وتيرتك الحالية مطابقة لهدفك اليومي.' : 'وتيرتك الحالية ('+fmt(a)+' صفحة يوميًا) أقل من هدفك ('+g.req+').';
  } else if(e.date){
    var df=diffDays(e.date, st.targetDate);
    msg = df<0 ? 'بوتيرتك الحالية ستُتم الختمة قبل التاريخ المستهدف بـ'+dy(-df)+'.' : df===0 ? 'بوتيرتك الحالية ستُتم الختمة في التاريخ المستهدف.' : 'بوتيرتك الحالية قد تتأخر الختمة '+dy(df)+' عن التاريخ المستهدف؛ المطلوب '+pg(g.req)+' يوميًا.';
  }
  $('#goalMsg').textContent=msg;
}
function renderStreak(){
  $('#stCur').textContent=D.streak; $('#stLong').textContent=D.longest;
  var h='';
  for(var i=6;i>=0;i--){
    var d=addDays(D.t,-i), on=(D.dm[d]||0)>0;
    h+='<div class="dot'+(on?' on':'')+(i===0?' now':'')+'"><i></i><span>'+DAYS_S[parse(d).getDay()]+'<span class="vh">'+(on?': تمت القراءة':': لا قراءة')+'</span></span></div>';
  }
  $('#dots').innerHTML=h;
}
function renderStats(){
  var totalRead=S.khatmahs.reduce(function(a,k){ return a+rcount(k.read); },0), k=curK();
  var done=S.khatmahs.filter(function(x){ return x.done; }).length;
  var items=[
    [totalRead,'صفحة','إجمالي الصفحات المقروءة'],
    [k.done?0:PAGES-C.rc,'صفحة','المتبقي في الختمة الحالية'],
    [fmt(Math.round(D.avg*10)/10),'صفحة','متوسط يومي'],
    [fmt(Math.round(D.avg*70)/10),'صفحة','متوسط أسبوعي'],
    [fmt(Math.round(D.avg*300)/10),'صفحة','متوسط شهري (30 يومًا)'],
    [D.streak,'يوم','الاستمرارية الحالية'],
    [D.longest,'يوم','أطول استمرارية'],
    [done,'','الختمات المكتملة'],
    ['#'+k.id,'','الختمة الحالية']
  ];
  $('#stats').innerHTML=items.map(function(i){ return '<div class="stat"><div class="v">'+i[0]+(i[1]?'<small>'+i[1]+'</small>':'')+'</div><div class="l">'+i[2]+'</div></div>'; }).join('');
}

/* --- الرسوم البيانية --- */
function barChart(w,h,vals,labels,o){
  var n=vals.length, pX=8, top=22, bot=o.two?36:24, plotH=h-top-bot, step=(w-pX*2)/n, bw=Math.min(36,step*.62);
  var max=Math.max(1,Math.max.apply(null,vals),o.target||0), base=top+plotH;
  var y=function(v){ return top+plotH*(1-v/max); };
  var s='<svg class="chart" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+o.aria+'">';
  s+='<line class="axis" x1="'+pX+'" x2="'+(w-pX)+'" y1="'+base+'" y2="'+base+'"/>';
  if(o.target){ s+='<line class="tgt" x1="'+pX+'" x2="'+(w-pX)+'" y1="'+y(o.target).toFixed(1)+'" y2="'+y(o.target).toFixed(1)+'"/><text x="'+pX+'" y="'+(y(o.target)-4).toFixed(1)+'" text-anchor="start">الهدف '+o.target+'</text>'; }
  var every = n>16 ? 5 : 1;
  for(var i=0;i<n;i++){
    var cx=w-pX-step*(i+.5), v=vals[i], yy=y(v);
    var hit = o.target ? v>=o.target : v>0;
    if(v>0) s+='<rect class="bx'+(hit?'':' lo')+'" x="'+(cx-bw/2).toFixed(1)+'" y="'+yy.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+(base-yy).toFixed(1)+'" rx="4"/>';
    if(v>0 && n<=16) s+='<text class="val" x="'+cx.toFixed(1)+'" y="'+(yy-5).toFixed(1)+'" text-anchor="middle">'+fmt(v)+'</text>';
    if(i%every===0 || i===n-1){
      s+='<text x="'+cx.toFixed(1)+'" y="'+(base+15)+'" text-anchor="middle">'+labels[i][0]+'</text>';
      if(labels[i][1]) s+='<text x="'+cx.toFixed(1)+'" y="'+(base+28)+'" text-anchor="middle" style="font-size:10px">'+labels[i][1]+'</text>';
    }
  }
  return s+'</svg>';
}
function chartW(el){ return Math.max(260, Math.floor(el.clientWidth||320)); }
function renderCharts(){
  var el=$('#chartDaily'), w=chartW(el), n=ui.dr, vals=[], labels=[];
  var tgt = S.settings.goalMode==='daily' ? S.settings.dailyTarget : goalInfo(D).req;
  for(var i=n-1;i>=0;i--){ var d=addDays(D.t,-i); vals.push(D.dm[d]||0); var pd=parse(d); labels.push([String(pd.getDate()), n<=7?DAYS_S[pd.getDay()]:'']); }
  var tot=vals.reduce(function(a,b){return a+b;},0);
  el.innerHTML=barChart(w,190,vals,labels,{target:tgt,two:n<=7,aria:'أعمدة القراءة اليومية خلال آخر '+n+' يومًا، المجموع '+tot+' صفحة'});
  var el2=$('#chartPer'), w2=chartW(el2), v2=[], l2=[];
  if(ui.per==='w'){
    var ws0=addDays(D.t,-weekIdx(D.t));
    for(var q=7;q>=0;q--){ var st=addDays(ws0,-7*q), sum=0; for(var r=0;r<7;r++){ sum+=D.dm[addDays(st,r)]||0; } v2.push(sum); l2.push([fmtShort(st),'']); }
    el2.innerHTML=barChart(w2,190,v2,l2,{aria:'الحصيلة الأسبوعية لآخر 8 أسابيع'});
  } else {
    var now=parse(D.t);
    for(var m=5;m>=0;m--){
      var dd=new Date(now.getFullYear(),now.getMonth()-m,1,12), key=dd.getFullYear()+'-'+pad(dd.getMonth()+1), s2=0;
      Object.keys(D.dm).forEach(function(k){ if(k.slice(0,7)===key) s2+=D.dm[k]; });
      v2.push(s2); l2.push([MONTHS[dd.getMonth()],'']);
    }
    el2.innerHTML=barChart(w2,190,v2,l2,{aria:'الحصيلة الشهرية لآخر 6 أشهر'});
  }
  renderOverall();
}
function renderOverall(){
  var el=$('#chartOverall'), w=chartW(el), h=210, k=curK(), t=D.t, rc=C.rc;
  var padR=44, padL=14, top=16, bot=26, pw=w-padR-padL, ph=h-top-bot;
  var entries=S.log.filter(function(e){ return e.k===k.id; }).sort(function(a,b){ return a.d<b.d?-1:a.d>b.d?1:0; });
  var start = entries.length && entries[0].d<k.start ? entries[0].d : k.start;
  if(start>t) start=t;
  var YM=PAGES;                          /* محور الإنجاز بعدد صفحات الطبعة الحالية */
  var pts=[[start,0]], cum=0, order=[], byDay={};
  entries.forEach(function(e){ cum+=rcount(e.added); if(!(e.d in byDay)) order.push(e.d); byDay[e.d]=Math.min(cum,YM); });
  order.forEach(function(d){ pts.push([d,byDay[d]]); });
  if(pts[pts.length-1][0]!==t) pts.push([t,rc]); else pts[pts.length-1][1]=rc;
  var est=estimate(D), endD=t, proj=null;
  if(!k.done && est.date && !est.far && est.days<=730){ endD=est.date; proj=est; }
  var span=Math.max(1,diffDays(start,endD));
  var X=function(d){ return w-padR-(diffDays(start,d)/span)*pw; };
  var Y=function(v){ return top+ph*(1-(YM?v/YM:0)); };
  var s='<svg class="chart" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="مسار تقدم الختمة الحالية: '+rc+' من '+YM+' صفحة">';
  [0,Math.round(YM/4),Math.round(YM/2),Math.round(YM*3/4),YM].forEach(function(v){
    s+='<line class="axis" x1="'+padL+'" x2="'+(w-padR)+'" y1="'+Y(v).toFixed(1)+'" y2="'+Y(v).toFixed(1)+'"/><text x="'+(w-padR+6)+'" y="'+(Y(v)+4).toFixed(1)+'" text-anchor="start">'+v+'</text>';
  });
  var line=pts.map(function(p,i){ return (i?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1); }).join(' ');
  var lp=pts[pts.length-1];
  if(pts.length>1){
    var first=pts[0];
    s+='<path class="ar" d="'+line+' L'+X(lp[0]).toFixed(1)+' '+Y(0).toFixed(1)+' L'+X(first[0]).toFixed(1)+' '+Y(0).toFixed(1)+' Z"/>';
    s+='<path class="ln" d="'+line+'"/>';
  }
  if(proj){
    s+='<line class="pj" x1="'+X(lp[0]).toFixed(1)+'" y1="'+Y(lp[1]).toFixed(1)+'" x2="'+X(endD).toFixed(1)+'" y2="'+Y(YM).toFixed(1)+'"/><circle class="pt pjp" cx="'+X(endD).toFixed(1)+'" cy="'+Y(YM).toFixed(1)+'" r="5"/>';
  }
  s+='<circle class="pt" cx="'+X(lp[0]).toFixed(1)+'" cy="'+Y(lp[1]).toFixed(1)+'" r="5.5"/>';
  s+='<text x="'+(w-padR)+'" y="'+(h-6)+'" text-anchor="end">'+fmtShort(start)+'</text>';
  if(endD!==start) s+='<text x="'+padL+'" y="'+(h-6)+'" text-anchor="start">'+fmtShort(endD)+(proj?' (متوقع)':'')+'</text>';
  el.innerHTML=s+'</svg>';
}

/* --- سجل القراءة (الخريطة الحرارية) --- */
function level(p,t){ if(p<=0) return 0; t=Math.max(1,t); if(p>=t*1.5) return 4; if(p>=t) return 3; if(p>=t/2) return 2; return 1; }
function renderHeat(){
  var box=$('#heat'), W=Math.floor(box.clientWidth||320);
  var cell = W>=520 ? 18 : 14, gap=3, labW=52;
  var avail=Math.max(48,W-labW);
  var weeks = clamp(Math.floor(avail/(cell+gap)), 4, 53);
  /* في الأعمدة الضيقة نصغّر الخلية نفسها بدل ما نسيب الخريطة أوسع من الكارت:
     الحد الأدنى السابق (8 أسابيع × 17px = 136px) كان بيفيض من أي حاوية أضيق من 188px. */
  while(weeks*(cell+gap)-gap > avail && cell>6){ cell--; if(cell<=10) gap=2; }
  var t=D.t, wk0=addDays(t,-weekIdx(t)), startD=addDays(wk0,-(weeks-1)*7);
  if(!ui.hd) ui.hd=t;
  var cells='', months='', lastM=-1, lastCol=-9;
  var trackW=weeks*(cell+gap), lblW=52;   /* أعرض تسمية شهر */
  for(var w=0;w<weeks;w++){
    var ws=addDays(startD,w*7), m=parse(ws).getMonth();
    if(m!==lastM && (w-lastCol>=3)){
      /* الموضع الأصلي right:w*(cell+gap) كان بيطلّع آخر تسمية شهر بره الشريط (~30px)
         فتعمل تمرير أفقي في الصفحة كلها. نقصّ الموضع عند حد الشريط. */
      var rx=Math.max(0,Math.min(w*(cell+gap),trackW-lblW));
      months+='<span style="right:'+rx+'px">'+MONTHS[m]+'</span>'; lastCol=w;
    }
    lastM=m;
    for(var r=0;r<7;r++){
      var d=addDays(ws,r);
      if(d>t){ cells+='<span class="hm fut" aria-hidden="true"></span>'; continue; }
      var p=D.dm[d]||0, tg=S.targets[d]||S.settings.dailyTarget, lv=level(p,tg);
      cells+='<button type="button" class="hm l'+lv+'" data-d="'+d+'" tabindex="'+(d===ui.hd?0:-1)+'" aria-pressed="'+(d===ui.hd)+'" aria-label="'+fmtDay(d)+': '+(p?pg(p):'لا قراءة')+'"></button>';
    }
  }
  var labs=['السبت','','الاثنين','','الأربعاء','','الجمعة'].map(function(x){ return '<span>'+x+'</span>'; }).join('');
  box.innerHTML='<div class="hm-wrap" style="--c:'+cell+'px;--g:'+gap+'px"><div class="hm-labels">'+labs+'</div><div class="hm-main"><div class="hm-months" style="width:'+trackW+'px">'+months+'</div><div class="hm-grid" role="group" aria-label="خريطة القراءة اليومية">'+cells+'</div></div></div>'+
    '<div class="hm-legend"><span><i class="hm l0"></i>لا قراءة</span><span><i class="hm l1"></i>قليل</span><span><i class="hm l2"></i>متوسط</span><span><i class="hm l3"></i>تحقق الهدف (نقطة صغيرة)</span><span><i class="hm l4"></i>فوق الهدف (نقطة كبيرة)</span></div>';
  renderHeatDetail();
}
function renderHeatDetail(){
  var d=ui.hd||D.t, p=D.dm[d]||0, tg=S.targets[d]||S.settings.dailyTarget, ok=p>=tg;
  $('#heatDetail').innerHTML='<div class="dt-h"><h3>'+fmtDay(d)+'</h3><span class="tag '+(p===0?'s0':ok?'s2':'')+'">'+(p===0?'لا قراءة':ok?'تحقق الهدف ✓':'دون الهدف')+'</span></div>'+
    '<dl class="kv"><div><dt>الصفحات المقروءة</dt><dd>'+(p?pg(p):'0')+'</dd></div><div><dt>هدف اليوم</dt><dd>'+pg(tg)+'</dd></div></dl>';
}

/* --- السور --- */
function renderSurah(){
  var q=norm($('#surahQ').value), num=parseInt(q,10), rows=[];
  var cs=surahsOn(C.ptr)[0]||0;
  var filtering = q!=='' || ui.sf!=='all';
  for(var i=0;i<114;i++){
    var len=SE[i]-SS[i]+1, rd=cnt(SS[i],SE[i]), st=rd===0?0:(rd===len?2:1);
    if(q){ if(!(SNN[i].indexOf(q)>-1 || (!isNaN(num) && String(num)===q && num===i+1))) continue; }
    if(ui.sf==='cur' && st!==1) continue;
    if(ui.sf==='done' && st!==2) continue;
    if(!filtering && !ui.surahAll && (i<cs || i>cs+5)) continue;
    var pc = st===2?100:pctFloor(rd/len);
    rows.push('<li><button type="button" class="sr s'+st+'" data-su="'+(i+1)+'" aria-label="تسجيل سورة '+SN[i]+': '+pc+'%"><span class="n">'+(i+1)+'</span><span class="nm">'+SN[i]+'<small>ص '+SS[i]+(SE[i]>SS[i]?'–'+SE[i]:'')+'</small></span><span class="p">'+pc+'%</span><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pc+'" aria-label="تقدم سورة '+SN[i]+'"><i style="width:'+(rd/len*100)+'%"></i></div></button></li>');
  }
  var list=$('#surahList');
  list.innerHTML = rows.length ? rows.join('') : '<li class="empty">لا توجد سور مطابقة.</li>';
  var expanded = filtering || ui.surahAll;
  list.classList.toggle('exp', expanded);
  var tg=$('#surahToggle'); tg.hidden=filtering;
  tg.textContent = ui.surahAll ? 'طي القائمة' : 'عرض جميع السور (114)';
}

/* --- آخر التسجيلات + سجل الختمات --- */
function renderRecent(){
  var items=S.log.slice(-6).reverse();
  $('#recent').innerHTML = items.length ? items.map(entryRow).join('') : '<li class="empty">لا توجد تسجيلات بعد. سجّل قراءتك الأولى من بطاقة «قراءة اليوم».</li>';
}
function renderHistory(){
  var h='';
  S.khatmahs.slice().reverse().forEach(function(k){
    var end = k.end || D.t, dur = Math.max(1, diffDays(k.start,end)+1), rc=rcount(k.read);
    var I=edInfo(k.ed);   /* نسبة الإنجاز بحساب صفحات طبعة الختمة نفسها مش الطبعة الحالية */
    var status = k.done ? '<span class="tag s2">مكتملة ✓</span>' : k.stopped ? '<span class="tag s0">غير مكتملة</span>' : '<span class="tag">جارية</span>';
    var avg = rc/dur;
    h+='<li class="hi"><div class="hi-h"><h3>ختمة #'+k.id+'</h3>'+status+'</div><p>'+fmtDate(k.start)+(k.end?' ← '+fmtDate(k.end):' ← مستمرة')+'</p>'+
      '<dl class="kv"><div><dt>'+(k.done?'المدة':'المدة حتى الآن')+'</dt><dd>'+dy(dur)+'</dd></div><div><dt>المتوسط</dt><dd>'+fmt(Math.round(avg*10)/10)+' صفحة/يوم</dd></div>'+
      (k.done?'':'<div class="wide"><dt>الإنجاز</dt><dd class="num">'+rc+' / '+I.PAGES+' ('+pctFloor(I.PAGES?rc/I.PAGES:0)+'%)</dd></div>')+'</dl></li>';
  });
  $('#hist').innerHTML=h;
}
function syncPressed(){
  $$('[data-set]').forEach(function(b){ var p=b.dataset.set.split(':'); b.setAttribute('aria-pressed', String(S.settings[p[0]]===p[1])); });
  $$('[data-ed]').forEach(function(b){ b.setAttribute('aria-pressed', String(curK().ed===b.dataset.ed)); });
  $$('[data-ui]').forEach(function(b){ var p=b.dataset.ui.split(':'); b.setAttribute('aria-pressed', String(String(ui[p[0]])===p[1])); });
}
function renderAll(){
  prep(); D = derive();
  [renderRing,renderToday,renderContinue,renderEst,renderJuz,renderGoal,renderStreak,renderStats,renderCharts,renderHeat,renderSurah,renderRecent,renderHistory].forEach(safe);
  syncPressed();
  showBanner();
}

/* ============ الأحداث ============ */
function setAmt(v){ ui.amt=clamp(Math.round(Number(v))||1,1,TOTAL); $('#amt').value=ui.amt; amtLabel(); }
var ACT = {
  rec:function(){ var v=parseInt($('#amt').value,10); if(!(v>=1)){ toast('اكتب عدد الصفحات أولًا.'); $('#amt').focus(); return; } setAmt(v); recordNext(ui.amt); },
  rec2:function(){ openRecord(); },
  recJuz:function(){ openRecord({ type:'juz', idx:ui.juz }); },
  amtMinus:function(){ setAmt((parseInt($('#amt').value,10)||1)-1); },
  amtPlus:function(){ setAmt((parseInt($('#amt').value,10)||0)+1); },
  undo:undoLast,
  logAll:openLog,
  cont:openContinue,
  settings:openSettings,
  theme:function(){ S.settings.theme = isDark()?'light':'dark'; save(); applyTheme(); syncPressed(); },
  newk:askNewKhatmah,
  export:doExport,
  import:function(){ $('#fileIn').click(); },
  share:openShare,
  sharein:function(){ openShareImport(); },
  sharecopyurl:function(){ var u=$('#shUrl'); if(u) copyText(u.value,function(ok){ toast(ok?'تم نسخ الرابط.':'تعذّر النسخ — حدّد الرابط وانسخه يدويًا.'); }); },
  sharecopycode:function(){ var c=$('#shCode'); if(c) copyText(c.value,function(ok){ toast(ok?'تم نسخ الكود.':'تعذّر النسخ — حدّد الكود وانسخه يدويًا.'); }); },
  reset:askReset,
  setpage:function(){ var v=$('#sPage'); if(v && setBase(v.value) && !curK().done) closeModal(); },
  surahToggle:function(){ ui.surahAll=!ui.surahAll; renderSurah(); },
  gstep:function(el){
    var v=clamp(S.settings.dailyTarget+Number(el.dataset.v),1,100);
    S.settings.dailyTarget=v; save(); renderAll();
  }
};
document.addEventListener('click',function(e){
  var t=e.target;
  var c=t.closest('[data-close]'); if(c){ dismiss(); return; }
  var mb=t.closest('[data-macti]');
  if(mb){
    var a=modalActs[Number(mb.dataset.macti)];
    if(a){ var sh=mb.closest('.sheet'); if(a.keep){ a.onClick&&a.onClick(sh); } else { dismissCb=null; closeModal(); a.onClick&&a.onClick(); } }
    return;
  }
  var el=t.closest('[data-elog]');
  if(el){
    var en=entryById(el.dataset.id), inModal=!$('#modal').hidden;
    if(!en) return;
    if(el.dataset.elog==='edit'){ if(inModal) closeModal(); openEdit(en,inModal); }
    else { if(inModal) closeModal(); askDeleteEntry(en,inModal); }
    return;
  }
  var ad=t.closest('[data-add]'); if(ad){ recordNext(Number(ad.dataset.add)); return; }
  var su=t.closest('[data-su]'); if(su){ openRecord({ type:'surah', idx:Number(su.dataset.su) }); return; }
  var rb=t.closest('[data-rub]'); if(rb){ openRecord({ type:'rub', idx:Number(rb.dataset.rub) }); return; }
  var ac=t.closest('[data-act]'); if(ac){ var fn=ACT[ac.dataset.act]; if(fn){ if(ac.closest('#toast')) $('#toast').hidden=true; fn(ac); } return; }
  var ed=t.closest('[data-ed]'); if(ed){ pickEd(ed.dataset.ed); return; }
  var st=t.closest('[data-set]');
  if(st){ var p=st.dataset.set.split(':'); S.settings[p[0]]=p[1]; save(); applyTheme(); renderAll(); return; }
  var u=t.closest('[data-ui]');
  if(u){ var q=u.dataset.ui.split(':'); ui[q[0]]=(q[0]==='dr')?Number(q[1]):q[1]; syncPressed(); if(q[0]==='sf') renderSurah(); else renderCharts(); return; }
  var j=t.closest('[data-j]'); if(j){ ui.juz=Number(j.dataset.j); renderJuz(); return; }
  var hd=t.closest('.hm[data-d]'); if(hd){ ui.hd=hd.dataset.d; renderHeat(); var nb=$('.hm[data-d="'+ui.hd+'"]'); if(nb) nb.focus({preventScroll:true}); return; }
});
document.addEventListener('change',function(e){
  var g=e.target.getAttribute && e.target.getAttribute('data-goal');
  if(!g) return;
  if(g==='daily'){ S.settings.dailyTarget=toInt(e.target.value,1,100,S.settings.dailyTarget); e.target.value=S.settings.dailyTarget; }
  else if(g==='date'){ S.settings.targetDate = isYmd(e.target.value) ? e.target.value : null; }
  save(); renderAll();
});
$('#amt').addEventListener('input',function(e){ var v=parseInt(e.target.value,10); ui.amt=v>=1?Math.min(v,TOTAL):0; amtLabel(); });
$('#amt').addEventListener('change',function(e){ var v=parseInt(e.target.value,10); ui.amt=v>=1?Math.min(v,TOTAL):(S.settings.lastAmount||S.settings.dailyTarget); e.target.value=ui.amt; amtLabel(); });
$('#amt').addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); ACT.rec(); } });
$('#amt').addEventListener('focus',function(e){ try{ e.target.select(); }catch(x){} });
document.addEventListener('keydown',function(e){
  var root=$('#modal');
  if(!root.hidden){
    if(e.key==='Escape'){ e.preventDefault(); dismiss(); return; }
    if(e.key==='Tab'){
      var f=$$('button:not([disabled]),input:not([disabled]),select,[tabindex]:not([tabindex="-1"])',$('.sheet',root)).filter(function(x){ return x.offsetParent!==null; });
      if(!f.length) return;
      var first=f[0], last=f[f.length-1];
      if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
    }
    return;
  }
  var h=e.target.closest && e.target.closest('.hm[data-d]');
  if(h){
    var delta = { ArrowUp:-1, ArrowDown:1, ArrowLeft:7, ArrowRight:-7 }[e.key];
    if(delta){
      e.preventDefault();
      var nd=addDays(h.dataset.d,delta);
      if(nd<=D.t){ var nb=$('.hm[data-d="'+nd+'"]'); if(nb){ ui.hd=nd; $$('.hm[data-d]').forEach(function(x){ x.tabIndex=-1; x.setAttribute('aria-pressed','false'); }); nb.tabIndex=0; nb.setAttribute('aria-pressed','true'); nb.focus(); renderHeatDetail(); } }
    }
  }
});
$('#surahQ').addEventListener('input',renderSurah);
$('#fileIn').addEventListener('change',function(e){ var f=e.target.files[0]; e.target.value=''; if(f) doImport(f); });
if(mq){ var mqh=function(){ if(S.settings.theme==='auto') applyTheme(); }; if(mq.addEventListener) mq.addEventListener('change',mqh); else if(mq.addListener) mq.addListener(mqh); }

/* إعادة الرسم عند تغيّر عرض الحاويات نفسها (مش عرض النافذة فقط):
   قبل كده كان أي تغيير في الـgrid/الخط/لوحة المفاتيح على الموبايل ما يعيدش الرسم.
   وما نعيدش الرسم إلا لو القياس اتغيّر فعلًا — عشان ما ندخلش في حلقة رسم لا نهائية. */
var lastW={ heat:0, daily:0, per:0, overall:0 }, rt=null;
function relayout(force){
  var w={ heat:Math.floor(($('#heat')||{clientWidth:0}).clientWidth),
          daily:Math.floor(($('#chartDaily')||{clientWidth:0}).clientWidth),
          per:Math.floor(($('#chartPer')||{clientWidth:0}).clientWidth),
          overall:Math.floor(($('#chartOverall')||{clientWidth:0}).clientWidth) };
  var ch=force||w.heat!==lastW.heat||w.daily!==lastW.daily||w.per!==lastW.per||w.overall!==lastW.overall;
  lastW=w;
  if(ch){ safe(renderCharts); safe(renderHeat); }
  return ch;
}
function scheduleRelayout(){ clearTimeout(rt); rt=setTimeout(function(){ relayout(false); },150); }
if(typeof ResizeObserver==='function'){
  var ro=new ResizeObserver(scheduleRelayout);
  ['#heat','#chartDaily','#chartPer','#chartOverall'].forEach(function(sel){ var el=$(sel); if(el) ro.observe(el); });
} else {
  window.addEventListener('resize',scheduleRelayout);
}
var lastDay=today();
function tick(){ if(today()!==lastDay){ lastDay=today(); ui.hd=null; renderAll(); } }
setInterval(tick,60000);
document.addEventListener('visibilitychange',function(){ if(!document.hidden) tick(); });
window.addEventListener('storage',function(e){ if(e.key===KEY){ if(!$('#modal').hidden) closeModal(); S=load(); applyTheme(); renderAll(); toast('تم تحديث البيانات من تبويب آخر.'); } });

/* ============ التشغيل ============ */
S = load();
ui.amt = S.settings.lastAmount || S.settings.dailyTarget;
applyTheme();
(function initRing(){
  var fg=$('#ringFg'), Cc=2*Math.PI*78;
  fg.style.strokeDasharray=Cc; fg.style.strokeDashoffset=Cc;
  void fg.getBoundingClientRect();
})();
renderAll();
relayout(true);                       /* القياس الأول قد يختلف بعد تطبيق الخطوط/الكثافة */
/* لو الرابط فيه كود مشاركة، هو أولى من شاشة الترحيب */
var HAS_SHARE = /[?&#]s=[01][A-Za-z0-9_\-]{8,}/i.test((location.hash||'')+(location.search||''));
if(!S.onboarded && !HAS_SHARE) setTimeout(openOnboarding,350);
save();
if(HAS_SHARE) setTimeout(checkShareInURL,450);
/* PWA: manifest + service worker للتشغيل دون اتصال والتثبيت على الشاشة الرئيسية.
   بنحقنهم من JavaScript فقط عند العمل عبر http(s) — عشان الملف الواحد لو اتفتح من
   file:// ما يطلبش ملفات مش موجودة ويطلّع أخطاء في الكونسول. */
if(location.protocol.indexOf('http')===0){
  try{
    var ml=document.createElement('link'); ml.rel='manifest'; ml.href='manifest.webmanifest';
    document.head.appendChild(ml);
  }catch(e){}
  if('serviceWorker' in navigator){
    window.addEventListener('load',function(){ navigator.serviceWorker.register('sw.js').catch(function(){}); });
  }
}
})();
