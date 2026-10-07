/* اختبار 4: طبعات المصحف — الشمرلي بترقيمه المطبوع (الفاتحة صفحة 2، آخر صفحة 522)،
   والتحويل بين الطبعات، وحفظ الطبعة، وسلوك البيانات القديمة.
   التشغيل:  NODE_PATH=.tools/node_modules node tests/test4.cjs        (من جذر المستودع) */
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
let F=0;const ok=(c,m)=>{console.log(c?'ok  :':'FAIL:',m);if(!c)F++;};
const LS='quranDashboard.v2';
const boot=(store)=>{
  const errs=[];
  const dom=new JSDOM(html,{runScripts:'dangerously',url:'http://localhost/',pretendToBeVisual:true,
    beforeParse(w){
      w.matchMedia=w.matchMedia||(q=>({matches:false,addEventListener(){},addListener(){}}));
      w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
      if(store)w.localStorage.setItem(LS,JSON.stringify(store));
      w.addEventListener('error',e=>errs.push(e.message));
    }});
  return {dom,w:dom.window,d:dom.window.document,errs};
};
(async()=>{
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const {w,d,errs}=boot(null);await sleep(400);
 const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
 const txt=()=>d.querySelector('#pgsTxt').textContent.replace(/\s+/g,' ');
 const num=()=>+((txt().match(/(\d+)\s*\/\s*(\d+)/)||[])[1]||0);
 const den=()=>+((txt().match(/(\d+)\s*\/\s*(\d+)/)||[])[2]||0);

 // ---- 1) onboarding على الشمرلي: آخر صفحة مقروءة = 101 (أي الصفحات 2..101 = 100 صفحة) ----
 d.querySelector('#oEd').value='shamarly';
 d.querySelector('#oEd').dispatchEvent(new w.Event('change',{bubbles:true}));await sleep(20);
 d.querySelector('#oPage').value='101';
 ok(d.querySelector('#oPage').max==='522','oPage max = 522 (آخر صفحة مطبوعة) got '+d.querySelector('#oPage').max);
 click(d.querySelectorAll('[data-macti]')[0]);await sleep(80);
 ok(num()===100&&den()===521,'shamarly 100 / 521 صفحة → '+txt());

 const st=JSON.parse(w.localStorage.getItem(LS));
 ok(st.khatmahs[0].ed==='shamarly'&&st.settings.edition==='shamarly','edition saved');
 ok(JSON.stringify(st.khatmahs[0].read)==='[[2,101]]','read يبدأ من صفحة 2 لا 1: '+JSON.stringify(st.khatmahs[0].read));
 ok(st.khatmahs[0].last===101,'last = 101');
 ok(st.v===3,'حالة الإصدار v=3 got '+st.v);

 // ---- 2) مؤشر «التالي» = 102، وتسجيل صفحتين ----
 ok(/102/.test(d.querySelector('#contNext').textContent),'التالي الصفحة 102: '+d.querySelector('#contNext').textContent.trim());
 ok(d.querySelector('#contAlt').hidden,'لا مؤشر بديل ما دام الترتيب متصلًا');
 ok(/2 – 522/.test(d.querySelector('#amtHint').textContent)||/الصفحة 102/.test(d.querySelector('#amtHint').textContent),'amtHint: '+d.querySelector('#amtHint').textContent);
 click(d.querySelector('[data-act="rec"]'));await sleep(80);
 ok(num()===102&&den()===521,'record +2 → 102 / 521: '+txt());

 // ---- 3) مداخل التسجيل تحترم نطاق الطبعة (2..522) وترفض ما خارجه ----
 click(d.querySelector('[data-act="rec2"]'));await sleep(50);
 ok(!d.querySelector('#modal').hidden,'unit modal open');
 click(d.querySelector('[data-ut="page"]'));await sleep(30);
 const uf=d.querySelector('#uFrom');
 ok(!!uf,'uFrom موجود بعد اختيار نوع «صفحات»');
 ok(!!uf&&uf.min==='2'&&uf.max==='522','uFrom min=2 max=522 got '+(uf?uf.min+'..'+uf.max:'—'));
 ok(!!uf&&uf.value==='104','uFrom مبدئيًا = المؤشر 104 (بعد تسجيل 102–103) got '+(uf?uf.value:'—'));
 w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await sleep(30);

 // ---- 4) setBase يرفض القيمة الخارجة عن النطاق بدل قصّها بصمت ----
 click(d.querySelector('[data-act="settings"]'));await sleep(30);
 const sp=d.querySelector('#sPage');
 ok(sp.min==='2'&&sp.max==='522','sPage min=2 max=522 got '+sp.min+'..'+sp.max);
 sp.value='9999';click(d.querySelector('[data-act="setpage"]'));await sleep(50);
 ok(num()===102,'9999 مرفوض — التقدم لم يتغير: '+txt());
 ok(!d.querySelector('#toast').hidden&&/522/.test(d.querySelector('#toast').textContent),'رسالة رفض تذكر الحد 522: '+d.querySelector('#toast').textContent.trim());
 w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await sleep(30);

 // ---- 5) التحويل إلى المدينة ----
 click(d.querySelector('[data-act="settings"]'));await sleep(30);
 const btn=d.querySelector('[data-ed="madinah"]');ok(!!btn,'ed button in settings');
 ok(!!d.querySelector('[data-ed="shamarly"][aria-pressed="true"]'),'زر الشمرلي مضغوط');
 click(btn);await sleep(60);
 const ms=d.querySelectorAll('[data-macti]');ok(ms.length>0,'confirm shown');
 click(ms[0]);await sleep(120);
 const m2=txt().match(/(\d+)\s*\/\s*604/);ok(!!m2,'now 604: '+txt());
 ok(m2&&Math.abs(+m2[1]-102*604/521)<12,'converted approx '+(m2&&m2[1]));
 const st2=JSON.parse(w.localStorage.getItem(LS));
 ok(st2.khatmahs[0].ed==='madinah','khatmah ed madinah');
 ok(st2.khatmahs[0].read.every(r=>r[0]>=1&&r[1]<=604),'read داخل نطاق المدينة: '+JSON.stringify(st2.khatmahs[0].read));

 // ---- 6) إعادة التحميل تحفظ الطبعة، والبيانات القديمة بلا ed ترجع للمدينة ----
 const r2=boot(st2);await sleep(300);
 ok(/\/\s*604/.test(r2.d.querySelector('#pgsTxt').textContent),'reload ok');
 r2.w.close();
 const legacy=JSON.parse(JSON.stringify(st2));
 delete legacy.khatmahs[0].ed;delete legacy.settings.edition;
 const r3=boot(legacy);await sleep(300);
 ok(/\/\s*604/.test(r3.d.querySelector('#pgsTxt').textContent),'legacy => madinah');
 r3.w.close();

 // ---- 7) ترحيل حالة v2 (ترقيم الشمرلي القديم) إلى v3: كل الصفحات +1 ----
 const v2={v:2,khatmahs:[{id:1,start:'2026-01-01',end:null,done:false,stopped:false,read:[[1,100]],last:100,ed:'shamarly'}],
   log:[{id:'a1',d:'2026-01-01',k:1,p:100,from:1,to:100,added:[[1,100]],adj:true,lab:''}],targets:{},settings:{edition:'shamarly'},onboarded:true};
 const r4=boot(v2);await sleep(300);
 const st4=JSON.parse(r4.w.localStorage.getItem(LS));
 ok(JSON.stringify(st4.khatmahs[0].read)==='[[2,101]]','v2→v3 read: [[1,100]] → [[2,101]] got '+JSON.stringify(st4.khatmahs[0].read));
 ok(st4.khatmahs[0].last===101,'v2→v3 last: 100 → 101 got '+st4.khatmahs[0].last);
 ok(st4.log[0].from===2&&st4.log[0].to===101,'v2→v3 log from/to: '+st4.log[0].from+'..'+st4.log[0].to);
 ok(st4.v===3,'v2→v3 الإصدار صار 3');
 const t4=r4.d.querySelector('#pgsTxt').textContent.replace(/\s+/g,' ');
 ok(/100\s*\/\s*521/.test(t4),'same progress after migration 100/521: '+t4);
 r4.w.close();

 // ---- 8) بيانات الشمرلي نفسها: نفس اختبارات القبول المستعملة في مشروع tibyan ----
 const E=JSON.parse(fs.readFileSync('data/editions.json','utf8')).shamarly;
 ok(E.N===522,'shamarly N = 522 got '+E.N);
 ok(E.P0===2,'shamarly P0 = 2 got '+E.P0);
 const pages=[];for(let p=E.P0;p<=E.N;p++)pages.push(p);
 ok(pages[0]===2&&pages[pages.length-1]===522,'أول صفحة 2 وآخر صفحة 522');
 ok(E.JS.length===30&&E.JE.length===30,'30 جزءًا');
 ok(E.RS.length===240&&E.RE.length===240,'240 ربعًا (60 حزبًا)');
 ok(E.SS[0]===2&&E.SE[0]===2,'الفاتحة صفحة 2 got '+E.SS[0]+'..'+E.SE[0]);
 ok(E.SS[1]===3,'البقرة تبدأ صفحة 3 got '+E.SS[1]);
 ok(E.SE[113]===522,'الناس تنتهي صفحة 522 got '+E.SE[113]);
 ok(E.JS[0]===2&&E.JE[29]===522,'الجزء الأول من 2 والثلاثون إلى 522');
 ok(E.JS.every((v,i)=>i===0||v>E.JS[i-1]),'بدايات الأجزاء متزايدة تمامًا');
 ok(E.RS.every((v,i)=>i===0||v>=E.RS[i-1]),'بدايات الأرباع غير متناقصة');
 ok((E.SS[17]===243&&E.SE[17]===253),'الكهف 243–253 got '+E.SS[17]+'..'+E.SE[17]);
 ok(E.JS[27]===459&&E.JS[28]===478&&E.JS[29]===498,'juz28=459 juz29=478 juz30=498 got '+E.JS[27]+','+E.JS[28]+','+E.JS[29]);
 ok(E.SS.every((v,i)=>v<=E.SE[i]),'كل سورة: البداية ≤ النهاية');
 ok(E.JS.every((v,i)=>v<=E.JE[i]),'كل جزء: البداية ≤ النهاية');
 ok(E.RS.every((v,i)=>v<=E.RE[i]),'كل ربع: البداية ≤ النهاية');

 const M=JSON.parse(fs.readFileSync('data/editions.json','utf8')).madinah;
 ok(M.N===604&&M.P0===1,'madinah N=604 P0=1');
 ok(M.SS[0]===1&&M.SE[113]===604&&M.JS[0]===1&&M.JE[29]===604,'madinah anchors');
 ok(M.SS[17]===293&&M.SE[17]===304,'madinah الكهف 293–304');

 ok(errs.length===0,'no errors '+errs.join('|'));
 w.close();
 console.log('FAILS:',F);process.exit(F?1:0);
})();
