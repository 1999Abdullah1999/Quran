/* اختبار 5: العيوب التي أُصلحت في هذه الدورة — اختبارات حراسة تمنع رجوعها.
   P0-1 فقدان بيانات بين الطبعات · P1-1 تكرار الصفحات في recordNext ·
   P1-2 setBase يقصّ بدل ما يرفض · P1-4 celebrate بعد التحويل ·
   P1-5 حقن HTML عبر نسخة احتياطية مستوردة · U1 مؤشران للقراءة.
   التشغيل:  NODE_PATH=.tools/node_modules node tests/test5.cjs        (من جذر المستودع) */
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
let F=0;const ok=(c,m)=>{console.log(c?'ok  :':'FAIL:',m);if(!c)F++;};
const LS='quranDashboard.v2';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function boot(store){
  const errs=[];
  const dom=new JSDOM(html,{runScripts:'dangerously',url:'http://localhost/',pretendToBeVisual:true,
    beforeParse(w){
      w.matchMedia=w.matchMedia||(q=>({matches:false,addEventListener(){},addListener(){}}));
      w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
      if(store)w.localStorage.setItem(LS,JSON.stringify(store));
      w.addEventListener('error',e=>errs.push('window.onerror: '+e.message));
      const ce=w.console.error;w.console.error=function(){errs.push('console.error: '+[].map.call(arguments,x=>String(x&&x.message||x)).join(' '));return ce.apply(this,arguments);};
    }});
  const w=dom.window,d=w.document;
  return {dom,w,d,errs,
    click:el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true})),
    esc:()=>d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true})),
    st:()=>JSON.parse(w.localStorage.getItem(LS)),
    q:s=>d.querySelector(s), qa:s=>[...d.querySelectorAll(s)],
    modalBtn:i=>d.querySelectorAll('[data-macti]')[i]};
}
/* حالة جاهزة: ختمتان على طبعتين مختلفتين.
   الختمة الحالية هي الأخيرة (الشمرلي) — وده بالظبط ظرف العطل P0-1:
   أي عملية على ختمة المدينة كانت بتستعمل حدود الشمرلي. */
function state(one){
  const log=[{id:'e1',d:'2026-01-01',k:1,p:300,from:1,to:300,added:[[1,300]],adj:false,lab:''}];
  if(!one) log.push({id:'e2',d:'2026-02-01',k:1,p:304,from:301,to:604,added:[[301,604]],adj:false,lab:''});
  log.push({id:'e3',d:'2026-03-01',k:2,p:19,from:2,to:20,added:[[2,20]],adj:true,lab:''});
  return {v:3,onboarded:true,
    khatmahs:[
      {id:1,start:'2026-01-01',end:'2026-02-01',done:false,stopped:true,ed:'madinah',
       read:one?[[1,300]]:[[1,300],[301,604]],last:one?300:604},
      {id:2,start:'2026-03-01',end:null,done:false,stopped:false,ed:'shamarly',
       read:[[2,20]],last:20}
    ],
    log:log,targets:{},settings:{edition:'shamarly',dailyTarget:2}};
}

(async()=>{
 // ============ P0-1: حذف تسجيل من ختمة على طبعة أخرى لا يُتلف بياناتها ============
 {
  const A=boot(state());await sleep(350);
  // افتح «التسجيلات» واحذف التسجيل e1 التابع للختمة #1 (مدينة 604)
  A.click(A.q('[data-act="logAll"]'));await sleep(60);
  let rows=A.qa('[data-elog="edit"]');ok(rows.length>=3,'السجل يعرض التسجيلات: '+rows.length);
  const del=A.q('[data-id="e1"][data-elog="del"]')||A.qa('[data-elog="del"]').find(b=>b.dataset.id==='e1');
  ok(!!del,'وجدنا زر حذف التسجيل e1');
  A.click(del);await sleep(60);
  const mb=A.qa('[data-macti]');ok(mb.length>0,'تأكيد الحذف ظهر');A.click(mb[mb.length-1]&&mb[0]);await sleep(80);
  const s1=A.st();const k1=s1.khatmahs.find(k=>k.id===1);
  ok(JSON.stringify(k1.read)==='[[301,604]]','بعد حذف e1: ختمة المدينة تحتفظ بـ[[301,604]] got '+JSON.stringify(k1.read));
  ok(k1.read.flat().every(p=>p>=1&&p<=604),'لا صفحات خارج نطاق المدينة');
  // والختمة الحالية (الشمرلي) لم تُمَس
  const k2=s1.khatmahs.find(k=>k.id===2);
  ok(JSON.stringify(k2.read)==='[[2,20]]','ختمة الشمرلي سليمة got '+JSON.stringify(k2.read));
  ok(A.errs.length===0,'P0-1 no errors '+A.errs.join('|'));
  A.w.close();
 }

 // ============ P0-1 (وجه ثانٍ): تعديل تسجيل من طبعة أخرى ============
 {
  const B=boot(state(true));await sleep(350);
  B.click(B.q('[data-act="logAll"]'));await sleep(60);
  const ed=B.q('[data-id="e1"][data-elog="edit"]');ok(!!ed,'وجدنا زر تعديل e1');
  B.click(ed);await sleep(80);
  const f=B.q('#eFrom'),t=B.q('#eTo');
  ok(f.max==='604','مودال التعديل يستعمل نطاق طبعة الختمة (604) مش الطبعة الحالية got '+f.max);
  ok(f.min==='1','min=1 للمدينة got '+f.min);
  f.value='500';t.value='604';
  const acts=B.qa('[data-macti]');B.click(acts[0]);await sleep(100);
  const s=B.st();const k=s.khatmahs.find(x=>x.id===1);
  ok(JSON.stringify(k.read)==='[[500,604]]','المدى 500–604 حُفظ فعلًا (كان بيترفض لأن max=521) got '+JSON.stringify(k.read));
  ok(s.log.find(e=>e.id==='e1').from===500&&s.log.find(e=>e.id==='e1').to===604,'التسجيل نفسه اتحدّث');
  ok(B.errs.length===0,'P0-1b no errors '+B.errs.join('|'));
  B.w.close();
 }

 // ============ P1-1: recordNext لا يكرّر الصفحات عند لفّ المصحف ============
 {
  const s=state();
  s.khatmahs=[{id:1,start:'2026-01-01',end:null,done:false,stopped:false,ed:'madinah',read:[[1,602]],last:602}];
  s.log=[{id:'e1',d:'2026-01-01',k:1,p:602,from:1,to:602,added:[[1,602]],adj:true,lab:''}];
  s.settings.edition='madinah';
  const C=boot(s);await sleep(350);
  ok(/602\s*\/\s*604/.test(C.q('#pgsTxt').textContent.replace(/\s+/g,' ')),'البداية 602/604 got '+C.q('#pgsTxt').textContent.replace(/\s+/g,' '));
  C.q('#amt').value='5';C.q('#amt').dispatchEvent(new C.w.Event('input',{bubbles:true}));
  C.click(C.q('[data-act="rec"]'));await sleep(120);
  const st=C.st();const k=st.khatmahs[0];
  ok(JSON.stringify(k.read)==='[[1,604]]','طلب 5 صفحات والمتاح 2 → تُسجَّل 603 و604 مرة واحدة فقط got '+JSON.stringify(k.read));
  ok(k.done===true,'الختمة اكتملت');
  const last=st.log[st.log.length-1];
  ok(JSON.stringify(last.added)==='[[603,604]]','التسجيل الأخير added=[[603,604]] got '+JSON.stringify(last.added));
  ok(last.p===2,'p=2 got '+last.p);
  ok(!/مسجّلة سابقًا/.test(C.q('#toast').textContent)||/صفحتين/.test(C.q('#toast').textContent),'الرسالة لا تدّعي كذبًا: '+C.q('#toast').textContent.trim());
  ok(C.errs.length===0,'P1-1 no errors '+C.errs.join('|'));
  C.w.close();
 }

 // ============ P1-2: setBase يرفض ما خرج عن النطاق بدل ما يكمل الختمة ============
 {
  const D=boot(null);await sleep(350);
  // تجاوز شاشة الترحيب
  D.q('#oEd').value='madinah';D.q('#oPage').value='0';D.click(D.modalBtn(0));await sleep(80);
  D.click(D.q('[data-act="settings"]'));await sleep(40);
  const sp=D.q('#sPage');sp.value='9999';D.click(D.q('[data-act="setpage"]'));await sleep(60);
  ok(/604/.test(D.q('#toast').textContent),'رفض 9999 برسالة تذكر الحد got '+D.q('#toast').textContent.trim());
  ok(!/مكتملة/.test(D.q('#kBadge').textContent),'الختمة لم تكتمل بضغطة غلط: '+D.q('#kBadge').textContent);
  ok(D.st().khatmahs[0].read.length===0,'لم يُسجَّل شيء got '+JSON.stringify(D.st().khatmahs[0].read));
  sp.value='abc';D.click(D.q('[data-act="setpage"]'));await sleep(40);
  ok(D.st().khatmahs[0].read.length===0,'النص غير الرقمي مرفوض');
  sp.value='10';D.click(D.q('[data-act="setpage"]'));await sleep(60);
  ok(JSON.stringify(D.st().khatmahs[0].read)==='[[1,10]]','القيمة الصحيحة تُسجَّل got '+JSON.stringify(D.st().khatmahs[0].read));
  ok(D.errs.length===0,'P1-2 no errors '+D.errs.join('|'));
  D.w.close();
 }

 // ============ P1-5: معرّف تسجيل مستورد لا يُحقن كـHTML ============
 {
  const evil=state();
  evil.log[0].id='"><img src=x onerror="window.__pwned=1"><span data-x="';
  const E=boot(evil);await sleep(400);
  ok(E.w.__pwned===undefined,'لم يعمل أي onerror من نسخة مستوردة');
  ok(E.q('img[src="x"]')===null,'لا يوجد <img src=x> محقون في الصفحة');
  E.click(E.q('[data-act="logAll"]'));await sleep(60);
  ok(E.q('img[src="x"]')===null,'ولا داخل مودال السجل');
  ok(E.w.__pwned===undefined,'ولا بعد فتح السجل');
  const st=E.st();
  ok(/^[A-Za-z0-9_-]{1,40}$/.test(st.log[0].id),'المعرّف عُقّم إلى صيغة آمنة got '+JSON.stringify(st.log[0].id));
  ok(E.errs.length===0,'P1-5 no errors '+E.errs.join('|'));
  E.w.close();
 }

 // ============ P1-4: تحويل ختمة شبه مكتملة إلى طبعة أصغر لا يُسقط التطبيق ============
 {
  // ختمة مدينة جارية (603 من 604) نحوّلها للشمرلي:
  // العطل القديم كان convertKhatmah بيضبط k.done من غير k.end/k.stopped،
  // فلو التحويل أكمل الختمة كان celebrate() بيعمل TypeError على diffDays(start,null).
  const s={v:3,onboarded:true,
    khatmahs:[{id:1,start:'2026-01-01',end:null,done:false,stopped:false,ed:'madinah',read:[[1,603]],last:603}],
    log:[{id:'e1',d:'2026-01-01',k:1,p:603,from:1,to:603,added:[[1,603]],adj:true,lab:''}],
    targets:{},settings:{edition:'madinah',dailyTarget:2}};
  const G=boot(s);await sleep(350);
  ok(/603\s*\/\s*604/.test(G.q('#pgsTxt').textContent.replace(/\s+/g,' ')),'603/604 قبل التحويل got '+G.q('#pgsTxt').textContent.replace(/\s+/g,' '));
  G.click(G.q('[data-act="settings"]'));await sleep(40);
  G.click(G.q('[data-ed="shamarly"]'));await sleep(60);
  const mb=G.qa('[data-macti]');ok(mb.length>0,'تأكيد التحويل ظهر');
  G.click(mb[0]);await sleep(150);
  const k=G.st().khatmahs[0];
  ok(k.ed==='shamarly','التحويل تم');
  ok(JSON.stringify(k.read)==='[[2,521]]','603 مدينة ← 2..521 شمرلي (نسبيًا) got '+JSON.stringify(k.read));
  const cnt=k.read.reduce((a,r)=>a+(r[1]-r[0]+1),0);
  ok(k.done===(cnt===521),'done متناسقة مع عدد الصفحات got done='+k.done+' cnt='+cnt);
  ok(k.done?!!k.end:true,'لو اكتملت فـend مضبوط got '+k.end);
  ok(k.done?k.stopped===false:true,'لو اكتملت فـstopped=false');
  ok(k.last>=2&&k.last<=522,'last داخل نطاق الشمرلي got '+k.last);
  ok(G.st().log[0].from>=2&&G.st().log[0].to<=522,'التسجيل اتحوّل لنطاق الشمرلي got '+G.st().log[0].from+'..'+G.st().log[0].to);
  // وبعد التحويل: «أكمل القراءة» يشتغل من غير crash
  G.click(G.q('[data-act="cont"]'));await sleep(80);
  ok(!G.q('#modal').hidden,'مودال «أكمل القراءة» فتح بعد التحويل');
  ok(G.errs.length===0,'P1-4 no errors (بما فيها celebrate) '+G.errs.join('|'));
  G.w.close();

  // ---- P1-4 (وجه ثانٍ): ختمة مكتملة — تغيير الطبعة ما يحوّلهاش وما يكسرش حاجة ----
  const s2={v:3,onboarded:true,
    khatmahs:[{id:1,start:'2026-01-01',end:'2026-02-01',done:true,stopped:false,ed:'madinah',read:[[1,604]],last:604}],
    log:[{id:'e1',d:'2026-01-01',k:1,p:604,from:1,to:604,added:[[1,604]],adj:true,lab:''}],
    targets:{},settings:{edition:'madinah',dailyTarget:2}};
  const G2=boot(s2);await sleep(350);
  G2.click(G2.q('[data-act="cont"]'));await sleep(80);
  ok(/أتممت الختمة/.test(G2.q('#mT').textContent),'celebrate فتح من غير end فاضي: '+G2.q('#mT').textContent);
  ok(G2.errs.length===0,'celebrate no errors '+G2.errs.join('|'));
  G2.esc();await sleep(40);
  G2.click(G2.q('[data-act="settings"]'));await sleep(40);
  G2.click(G2.q('[data-ed="shamarly"]'));await sleep(80);
  const k2=G2.st().khatmahs[0];
  ok(k2.ed==='madinah'&&JSON.stringify(k2.read)==='[[1,604]]','الختمة المكتملة لم تُحوَّل (تبقى كما هي) got '+JSON.stringify(k2.read));
  ok(G2.st().settings.edition==='shamarly','لكن الطبعة الافتراضية اتغيّرت للختمة الجديدة');
  ok(G2.errs.length===0,'done-khatmah edition switch no errors '+G2.errs.join('|'));
  G2.w.close();
 }

 // ============ U1: مؤشران — التالي بعد آخر تسجيل، وأول صفحة فاضية من أول المصحف ======
 {
  const s=state();
  s.khatmahs=[{id:1,start:'2026-01-01',end:null,done:false,stopped:false,ed:'madinah',read:[[1,145],[293,304]],last:304}];
  s.log=[{id:'e1',d:'2026-01-01',k:1,p:145,from:1,to:145,added:[[1,145]],adj:true,lab:''},
         {id:'e2',d:'2026-01-02',k:1,p:12,from:293,to:304,added:[[293,304]],adj:false,lab:''}];
  s.settings.edition='madinah';
  const H=boot(s);await sleep(350);
  ok(/305/.test(H.q('#contNext').textContent),'المؤشر الأول = 305 (بعد آخر تسجيل): '+H.q('#contNext').textContent.trim());
  ok(H.q('#contAlt').hidden===false,'المؤشر البديل ظاهر لأن فيه صفحات فاضية قبله');
  ok(/146/.test(H.q('#contAlt').textContent),'المؤشر البديل = 146 (أول صفحة فاضية) got '+H.q('#contAlt').textContent.trim());
  // التسجيل من المؤشر البديل
  H.click(H.q('#btnCont'));await sleep(60);
  const acts=H.qa('[data-macti]').map(b=>b.textContent.trim());
  ok(acts.some(a=>/305/.test(a)),'زر للتسجيل من 305: '+acts.join(' | '));
  ok(acts.some(a=>/146/.test(a)),'وزر للتسجيل من 146: '+acts.join(' | '));
  const alt=H.qa('[data-macti]').find(b=>/146/.test(b.textContent));ok(!!alt,'الزر موجود');
  if(!alt){console.log('FAILS:',F+1);process.exit(1);}
  H.click(alt);await sleep(120);
  const k=H.st().khatmahs[0];
  ok(k.read.some(r=>r[0]<=146&&r[1]>=146),'سُجّلت الصفحة 146 got '+JSON.stringify(k.read));
  ok(k.read.some(r=>r[0]===1&&r[1]>=145),'التقدم السابق 1–145 لم يُمَس got '+JSON.stringify(k.read));
  ok(k.read.some(r=>r[0]===293&&r[1]===304),'وسورة الكهف 293–304 ما زالت مسجّلة');
  ok(k.last===146||k.last===304,'last اتحدّث got '+k.last);
  ok(H.errs.length===0,'U1 no errors '+H.errs.join('|'));
  H.w.close();
 }

 // ============ سلامة عامة: كل مُعرِّف يستعمله JS موجود في HTML ============
 {
  const I=boot(null);await sleep(400);
  const ids=new Set(I.qa('[id]').map(e=>e.id));
  const js=fs.readFileSync('src/app.js','utf8');
  const used=new Set([...js.matchAll(/\$\('#([A-Za-z][\w-]*)'\)/g)].map(m=>m[1]));
  // عناصر تُنشأ ديناميكيًا داخل المودالات
  const dynamic=new Set(['oEd','oPage','oGoal','oRange','eFrom','eTo','eDate','sPage','edNote','uFrom','uTo','uType','mT']);
  const missing=[...used].filter(x=>!ids.has(x)&&!dynamic.has(x));
  ok(missing.length===0,'لا مُعرِّفات مفقودة: '+missing.join(','));
  ok(I.errs.length===0,'no console errors at boot: '+I.errs.join('|'));
  I.w.close();
 }

 console.log('FAILS:',F);process.exit(F?1:0);
})();
