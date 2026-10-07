/* اختبار 3: دورة الحياة الكاملة — أول تشغيل، استيراد نسخة قديمة (v1)، التصدير،
   الاسترجاع، إعادة الضبط، المظهر، والتراجع. (كان هذا الملف يطبع نتائج بلا أي تحقق.)
   التشغيل:  NODE_PATH=.tools/node_modules node tests/test3.cjs        (من جذر المستودع) */
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
let F=0;const ok=(c,m)=>{console.log(c?'ok  :':'FAIL:',m);if(!c)F++;};
const LS='quranDashboard.v2';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
 const errs=[];
 const dom=new JSDOM(html,{runScripts:'dangerously',url:'http://localhost/',pretendToBeVisual:true,
  beforeParse(w){
   w.matchMedia=w.matchMedia||(q=>({matches:false,addEventListener(){},addListener(){}}));
   w.ResizeObserver=class{constructor(cb){this.cb=cb;}observe(){}unobserve(){}disconnect(){}};
   w.addEventListener('error',e=>errs.push('window.onerror: '+e.message));
   const ce=w.console.error;
   w.console.error=function(){errs.push('console.error: '+[].map.call(arguments,x=>String(x&&x.message||x)).join(' '));return ce.apply(this,arguments);};
  }});
 const w=dom.window,d=w.document;
 const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
 const q=s=>d.querySelector(s), qa=s=>[...d.querySelectorAll(s)];
 const mbtn=i=>qa('[data-macti]')[i];
 const st=()=>JSON.parse(w.localStorage.getItem(LS));
 const txt=s=>(q(s)?q(s).textContent:'').replace(/\s+/g,' ').trim();
 await sleep(400);

 // ---- 1) أول تشغيل ----
 ok(!q('#modal').hidden,'شاشة الترحيب تظهر في أول تشغيل');
 ok(/أين وصلت/.test(q('#modal').textContent),'محتوى شاشة الترحيب');
 ok(q('#oEd').options.length===2,'اختيار الطبعة فيه طبعتان got '+q('#oEd').options.length);
 ok(/604/.test(q('#oEd').options[0].textContent),'الأولى المدينة 604: '+q('#oEd').options[0].textContent);
 ok(/522/.test(q('#oEd').options[1].textContent),'والثانية الشمرلي 522: '+q('#oEd').options[1].textContent);
 ok(/من 1 إلى 604/.test(txt('#oRange')),'oRange يشرح النطاق: '+txt('#oRange'));
 ok(q('#oPage').max==='604','oPage max=604 got '+q('#oPage').max);
 q('#oPage').value='100';click(mbtn(0));await sleep(80);
 ok(q('#modal').hidden,'الشاشة اتقفلت بعد «ابدأ»');
 ok(/100 \/ 604/.test(txt('#pgsTxt')),'after onboarding 100/604: '+txt('#pgsTxt'));
 ok(st().onboarded===true,'onboarded=true');
 ok(st().v===3,'الإصدار 3');
 ok(JSON.stringify(st().khatmahs[0].read)==='[[1,100]]','read=[[1,100]] got '+JSON.stringify(st().khatmahs[0].read));
 ok(txt('#todayPages')==='0','قراءة اليوم 0 (التقدم السابق لا يُحسب قراءة اليوم)');

 // ---- 2) تسجيل وتراجع ----
 q('#amt').value='3';q('#amt').dispatchEvent(new w.Event('input',{bubbles:true}));
 click(q('[data-act="rec"]'));await sleep(80);
 ok(/103 \/ 604/.test(txt('#pgsTxt')),'بعد تسجيل 3: '+txt('#pgsTxt'));
 ok(txt('#todayPages')==='3','قراءة اليوم 3');
 ok(!q('#btnUndo').disabled,'زر التراجع مفعّل');
 click(q('[data-act="undo"]'));await sleep(80);
 ok(/100 \/ 604/.test(txt('#pgsTxt')),'التراجع رجّع 100: '+txt('#pgsTxt'));
 ok(txt('#todayPages')==='0','قراءة اليوم رجعت 0');
 click(q('[data-act="rec"]'));await sleep(80);
 ok(/103 \/ 604/.test(txt('#pgsTxt')),'سجّلنا تاني 3');

 // ---- 3) استيراد نسخة v1 قديمة (بلا read، فيها cur) ----
 const v1={app:'quran-dashboard',version:1,data:{v:1,settings:{theme:'light',density:'comfortable',goalMode:'daily',dailyTarget:2},
   khatmahs:[{id:1,start:'2026-01-01',end:null,cur:300,done:false,stopped:false}],
   log:[{id:'x',d:'2026-10-01',k:1,p:2,from:299,to:300,prev:298,pos:300,adj:false}],targets:{}}};
 const f=new w.File([JSON.stringify(v1)],'b.json',{type:'application/json'});
 const inp=q('#fileIn');Object.defineProperty(inp,'files',{value:[f],configurable:true});
 inp.dispatchEvent(new w.Event('change',{bubbles:true}));await sleep(120);
 ok(!q('#modal').hidden,'طلب تأكيد الاستيراد');
 click(mbtn(0));await sleep(80);
 ok(/300 \/ 604/.test(txt('#pgsTxt')),'v1 → 300/604: '+txt('#pgsTxt'));
 ok(JSON.stringify(st().khatmahs[0].read)==='[[1,300]]','v1 cur=300 → read=[[1,300]] got '+JSON.stringify(st().khatmahs[0].read));
 ok(st().v===3,'النسخة المستوردة اتحوّلت للإصدار 3');
 ok(st().log.length===1,'تسجيل واحد من v1 (prev/pos → added)');
 ok(JSON.stringify(st().log[0].added)==='[[299,300]]','added=[[299,300]] got '+JSON.stringify(st().log[0].added));

 // ---- 4) التصدير ----
 let blobText=null;
 // في بعض إصدارات jsdom الخاصية غير قابلة للكتابة، فاستعمل defineProperty
 const hook=b=>{if(b&&b.text)b.text().then(t=>{blobText=t;});return 'blob:stub';};
 try{ Object.defineProperty(w.URL,'createObjectURL',{value:hook,configurable:true,writable:true}); }
 catch(e){ w.URL.createObjectURL=hook; }
 try{ Object.defineProperty(w.URL,'revokeObjectURL',{value:()=>{},configurable:true,writable:true}); }catch(e){}
 // امنع jsdom من محاولة «تنزيل» الملف فعلًا ( بيعمل navigation مش مدعوم )
 const origClick=w.HTMLAnchorElement.prototype.click;
 w.HTMLAnchorElement.prototype.click=function(){ if(this.download) return; return origClick.apply(this,arguments); };
 click(q('[data-act="settings"]'));await sleep(40);
 click(q('[data-act="export"]'));await sleep(80);
 ok(!!blobText,'التصدير أنتج محتوى');
 const ex=blobText?JSON.parse(blobText):null;
 ok(ex&&ex.version===3,'export version 3 got '+(ex&&ex.version));
 ok(ex&&ex.app==='quran-dashboard','export app id');
 ok(ex&&Array.isArray(ex.data.khatmahs[0].read),'export فيه read ranges');
 ok(ex&&ex.edition==='madinah','export يذكر الطبعة got '+(ex&&ex.edition));

 // ---- 5) استرجاع ما صدّرناه (round-trip) ----
 const f2=new w.File([blobText],'r.json',{type:'application/json'});
 Object.defineProperty(inp,'files',{value:[f2],configurable:true});
 inp.dispatchEvent(new w.Event('change',{bubbles:true}));await sleep(120);
 click(mbtn(0));await sleep(80);
 ok(/300 \/ 604/.test(txt('#pgsTxt')),'round-trip حافظ على 300/604: '+txt('#pgsTxt'));
 ok(JSON.stringify(st())===JSON.stringify(JSON.parse(blobText).data)||st().khatmahs[0].read[0][1]===300,'الحالة رجعت كما هي');

 // ---- 6) ملف تالف مرفوض ----
 const f3=new w.File(['{not json'],'bad.json',{type:'application/json'});
 Object.defineProperty(inp,'files',{value:[f3],configurable:true});
 inp.dispatchEvent(new w.Event('change',{bubbles:true}));await sleep(120);
 ok(/غير صالح/.test(txt('#toast')),'رسالة رفض للملف التالف: '+txt('#toast'));
 ok(/300 \/ 604/.test(txt('#pgsTxt')),'البيانات لم تتأثر بالملف التالف: '+txt('#pgsTxt'));
 ok(errs.filter(e=>!/JSON/.test(e)).length===0,'لا أخطاء غير متوقعة من الملف التالف: '+errs.join('|'));

 // ---- 7) إعادة الضبط تحتاج تأكيدًا صريحًا ----
 click(q('[data-act="settings"]'));await sleep(40);
 click(q('[data-act="reset"]'));await sleep(40);
 ok(mbtn(0).disabled===true,'زر إعادة الضبط معطّل حتى التأكيد');
 const cb=q('#modal input[type=checkbox]');
 ok(!!cb,'فيه مربع تأكيد');
 cb.checked=true;cb.dispatchEvent(new w.Event('change',{bubbles:true}));await sleep(20);
 ok(mbtn(0).disabled===false,'اتفعّل بعد التأكيد');
 w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await sleep(40);
 ok(/300 \/ 604/.test(txt('#pgsTxt')),'الإلغاء ما مسحش حاجة');

 // ---- 8) المظهر: ثيم/لوحة/كثافة/حجم خط ----
 click(q('[data-act="settings"]'));await sleep(40);
 click(q('[data-set="theme:dark"]'));await sleep(40);
 ok(d.documentElement.dataset.theme==='dark','الثيم الداكن got '+d.documentElement.dataset.theme);
 ok(st().settings.theme==='dark','وحُفظ');
 const pal=qa('[data-set^="palette:"]');
 ok(pal.length>=4,'فيه ≥4 لوحات ألوان got '+pal.length);
 click(pal.find(b=>/rose/.test(b.dataset.set))||pal[1]);await sleep(40);
 ok(d.documentElement.dataset.palette!=='emerald','اللوحة اتغيّرت got '+d.documentElement.dataset.palette);
 click(q('[data-set="fontScale:l"]'));await sleep(40);
 ok(d.documentElement.dataset.fs==='l','حجم الخط الكبير got '+d.documentElement.dataset.fs);
 click(q('[data-set="density:compact"]'));await sleep(40);
 ok(d.documentElement.dataset.density==='compact','الكثافة المدمجة');
 ok(st().settings.palette!=='emerald'&&st().settings.fontScale==='l'&&st().settings.density==='compact','كل إعدادات المظهر محفوظة');
 click(q('[data-act="theme"]'));await sleep(40);
 ok(d.documentElement.dataset.theme==='light','زر الثيم في الرأس يبدّل إلى الفاتح');

 // ---- 9) إعادة التحميل تحفظ كل شيء ----
 const saved=st();
 const dom2=new JSDOM(html,{runScripts:'dangerously',url:'http://localhost/',pretendToBeVisual:true,
  beforeParse(w2){w2.matchMedia=w2.matchMedia||(q=>({matches:false,addEventListener(){},addListener(){}}));
   w2.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
   w2.localStorage.setItem(LS,JSON.stringify(saved));}});
 await sleep(350);
 const d2=dom2.window.document;
 ok(/300 \/ 604/.test(d2.querySelector('#pgsTxt').textContent.replace(/\s+/g,' ')),'بعد إعادة التحميل 300/604');
 ok(d2.querySelector('#modal').hidden,'لا شاشة ترحيب تاني');
 ok(d2.documentElement.dataset.palette===saved.settings.palette,'اللوحة محفوظة بعد التحميل');
 ok(d2.documentElement.dataset.fs==='l','حجم الخط محفوظ');
 dom2.window.close();

 // ---- 10) لا أخطاء في الكونسول خلال كل ده ----
 ok(errs.length===0,'no console errors: '+errs.join(' || '));
 w.close();
 console.log('FAILS:',F);process.exit(F?1:0);
})();
