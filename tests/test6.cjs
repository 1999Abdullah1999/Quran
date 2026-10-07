/* اختبار 6: أكواد المشاركة — انقل التقدم برابط من غير سيرفر.
   يغطي: توليد الكود، الشكل الآمن، round-trip كامل، كشف #s= في الرابط وتنظيفه،
   الرفض الآمن للكود التالف، مسار اللصق اليدوي، ومسار الضغط (CompressionStream).
   التشغيل:  node tests/test6.cjs        (من جذر المستودع) */
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
let F=0;const ok=(c,m)=>{console.log(c?'ok  :':'FAIL:',m);if(!c)F++;};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function boot(opts){
  opts=opts||{};
  const errs=[];
  const dom=new JSDOM(html,{runScripts:'dangerously',
    url:opts.url||'http://localhost/',pretendToBeVisual:true,
    beforeParse(w){
      w.matchMedia=w.matchMedia||(q=>({matches:false,addEventListener(){},addListener(){}}));
      w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
      if(opts.compress){
        // jsdom ما بيوفرش CompressionStream؛ نحقن بتاعة Node عشان نجرّب مسار الضغط
        const sw=require('stream/web');
        w.CompressionStream=sw.CompressionStream||globalThis.CompressionStream;
        w.DecompressionStream=sw.DecompressionStream||globalThis.DecompressionStream;
      } else {
        // تأكد إن مسار «بلا ضغط» هو اللي شغّال
        try{ delete w.CompressionStream; }catch(e){}
        w.CompressionStream=undefined; w.DecompressionStream=undefined;
      }
      if(opts.store)w.localStorage.setItem('quranDashboard.v2',JSON.stringify(opts.store));
      if(opts.noClipboard)Object.defineProperty(w.navigator,'clipboard',{value:undefined,configurable:true});
      w.addEventListener('error',e=>errs.push('window.onerror: '+e.message));
      const ce=w.console.error;
      w.console.error=function(){errs.push('console.error: '+[].map.call(arguments,x=>String(x&&x.message||x)).join(' '));return ce.apply(this,arguments);};
    }});
  const w=dom.window,d=w.document;
  return {dom,w,d,errs,
    click:el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true})),
    q:s=>d.querySelector(s), qa:s=>[...d.querySelectorAll(s)],
    mb:i=>d.querySelectorAll('[data-macti]')[i],
    st:()=>JSON.parse(w.localStorage.getItem('quranDashboard.v2')),
    txt:s=>(d.querySelector(s)?d.querySelector(s).textContent:'').replace(/\s+/g,' ').trim(),
    modalOpen:()=>!d.querySelector('#modal').hidden,
    title:()=>(d.querySelector('#mT')||{}).textContent||''};
}

(async()=>{
 // ============ أ) جهّز حالة غنية في نسخة A ============
 const A=boot({});await sleep(400);
 A.q('#oPage').value='120';A.click(A.mb(0));await sleep(80);
 A.q('#amt').value='5';A.q('#amt').dispatchEvent(new A.w.Event('input',{bubbles:true}));
 A.click(A.q('[data-act="rec"]'));await sleep(80);
 A.click(A.q('[data-act="rec2"]'));await sleep(60);           // تسجيل بمقطع (سورة)
 A.click(A.mb(0));await sleep(80);
 A.click(A.q('[data-act="settings"]'));await sleep(40);
 A.click(A.q('[data-set="palette:rose"]'));await sleep(30);
 A.click(A.q('[data-set="theme:dark"]'));await sleep(30);
 A.click(A.q('[data-set="fontScale:l"]'));await sleep(30);
 const stA=A.st();
 ok(stA.khatmahs.length>=1,'فيه ختمة');
 ok(stA.log.length>=2,'فيه ≥2 تسجيل got '+stA.log.length);
 ok(stA.settings.palette==='rose'&&stA.settings.theme==='dark','الإعدادات اتغيّرت');
 const pagesA=stA.khatmahs.reduce((a,k)=>a+k.read.reduce((x,r)=>x+(r[1]-r[0]+1),0),0);
 ok(pagesA>0,'فيه صفحات مقروءة: '+pagesA);

 // ============ ب) توليد كود المشاركة ============
 A.click(A.q('[data-act="share"]'));await sleep(150);
 ok(A.modalOpen(),'مودال المشاركة فتح');
 ok(/مشاركة التقدم/.test(A.title()),'عنوان المودال: '+A.title());
 const code=A.q('#shCode'), url=A.q('#shUrl');
 ok(!!code&&!!url,'#shCode و#shUrl موجودين');
 const C=code?code.value:'';
 ok(/^[01][A-Za-z0-9_-]{8,}$/.test(C),'الكود base64url صالح بطول '+C.length+' ويبدأ بـ'+C.charAt(0));
 ok(C.charAt(0)==='0','بلا CompressionStream الكود غير مضغوط (بادئة 0) got '+C.charAt(0));
 ok(!/[+/=]/.test(C),'مفيش محارف +/= تكسر الرابط');
 ok(!/</.test(C)&&!/>/.test(C),'مفيش < > في الكود');
 ok(!!url&&url.value.indexOf('#s='+C)>0,'الرابط فيه #s=<الكود>');
 ok(url.value.indexOf('http://localhost/')===0,'الرابط مطلق وصحيح: '+url.value.slice(0,40)+'…');
 ok(/كل.*بياناتك|بياناتك/.test(A.q('#modal').textContent),'تحذير الخصوصية موجود');
 ok(/بايت →/.test(A.q('#modal').textContent),'إحصاء الحجم معروض');
 ok(C.length<url.value.length,'الكود أقصر من الرابط الكامل');

 // ============ ج) round-trip: افتح الرابط في نسخة جديدة ============
 const B=boot({url:'http://localhost/index.html#s='+encodeURIComponent(C)});await sleep(600);
 ok(B.modalOpen(),'فتح الرابط عرض مودال');
 ok(/تقدم مشترك في الرابط/.test(B.title()),'العنوان: تقدم مشترك في الرابط — got '+B.title());
 ok(/هيستبدل|ستبدل|سيستبدل|استبدل/.test(B.q('#modal').textContent),'فيه تحذير إن البيانات هتتستبدل');
 ok(!B.st()||B.st().khatmahs[0].read.length===0,'قبل الموافقة: البيانات المشتركة لسه ما دخلتش (التطبيق بيحفظ حالته الفاضية عند الإقلاع)');
 B.click(B.mb(0));await sleep(150);                            // «استيراد»
 const stB=B.st();
 ok(!!stB,'الحالة اتحفظت بعد الموافقة');
 ok(stB.khatmahs.length===stA.khatmahs.length,'عدد الختمات '+stB.khatmahs.length);
 ok(JSON.stringify(stB.khatmahs[0].read)===JSON.stringify(stA.khatmahs[0].read),'نفس الصفحات: '+JSON.stringify(stB.khatmahs[0].read));
 ok(stB.log.length===stA.log.length,'نفس عدد التسجيلات '+stB.log.length);
 ok(JSON.stringify(stB.log.map(e=>e.added))===JSON.stringify(stA.log.map(e=>e.added)),'نفس added');
 ok(stB.settings.palette===stA.settings.palette&&stB.settings.theme===stA.settings.theme,'نفس الإعدادات');
 ok(stB.khatmahs[0].ed===stA.khatmahs[0].ed,'نفس الطبعة');
 ok(B.d.documentElement.dataset.palette==='rose','اللوحة اتطبّقت على الواجهة');
 ok(B.d.documentElement.dataset.theme==='dark','والثيم كمان');
 ok(/\/ 604/.test(B.txt('#pgsTxt')),'الحلقة بتعرض نفس التقدم: '+B.txt('#pgsTxt'));
 ok(B.w.location.hash==='','الرابط اتنضّف بعد الاستيراد (ما يسألش تاني) got "'+B.w.location.hash+'"');
 ok(B.errs.length===0,'round-trip no errors '+B.errs.join('|'));
 B.w.close();

 // ============ د) رفض الاستيراد ما يغيّرش حاجة ============
 const Cj=boot({url:'http://localhost/#s='+C});await sleep(600);
 ok(/تقدم مشترك/.test(Cj.title()),'المودال ظهر تاني');
 Cj.click(Cj.mb(1));await sleep(120);                          // «إلغاء»
 ok(!Cj.st()||Cj.st().khatmahs[0].read.length===0,'الإلغاء ما حفظش البيانات المشتركة');
 ok(!/rose/.test(Cj.d.documentElement.dataset.palette),'واللوحة ما اتغيّرتش');
 Cj.w.close();

 // ============ هـ) كود تالف ============
 const bad='1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
 const D1=boot({url:'http://localhost/#s='+bad});await sleep(500);
 ok(!D1.modalOpen()||!/تقدم مشترك/.test(D1.title()),'الكود التالف ما بيفتحش مودال استيراد');
 ok(/تالف/.test(D1.txt('#toast'))||D1.txt('#toast')==='','رسالة «كود تالف» أو تجاهل صامت: "'+D1.txt('#toast')+'"');
 ok(D1.w.location.hash==='','الرابط التالف اتنضّف برضه');
 ok(D1.errs.length===0,'الكود التالف ما سبّبش أخطاء: '+D1.errs.join('|'));
 D1.w.close();

 const D2=boot({url:'http://localhost/#s=0@@@@not-base64'});await sleep(450);
 ok(D2.errs.length===0,'محارف غير صالحة في الكود ما بتوقّعش التطبيق: '+D2.errs.join('|'));
 D2.w.close();

 // ============ و) اللصق اليدوي من الإعدادات ============
 const E=boot({});await sleep(400);
 E.q('#oPage').value='0';E.click(E.mb(0));await sleep(80);
 ok(E.st().khatmahs[0].read.length===0,'نسخة فاضية قبل الاستيراد');
 E.click(E.q('[data-act="settings"]'));await sleep(40);
 ok(!!E.q('[data-act="sharein"]'),'زر «استيراد من رابط» موجود في الإعدادات');
 E.click(E.q('[data-act="sharein"]'));await sleep(60);
 ok(/استيراد من رابط أو كود/.test(E.title()),'المودال فتح: '+E.title());
 // 1) حقل فاضي
 E.click(E.mb(0));await sleep(60);
 ok(/ما عرفتش/.test(E.txt('#shInNote')),'الحقل الفاضي مرفوض برسالة');
 ok(E.modalOpen(),'والمودال فضل مفتوح');
 // 2) كلام فارغ
 E.q('#shIn').value='hello world';E.click(E.mb(0));await sleep(60);
 ok(/ما عرفتش/.test(E.txt('#shInNote')),'نص مش كود مرفوض');
 // 3) كود تالف
 E.q('#shIn').value='1zzzzzzzzzzzzzzzz';E.click(E.mb(0));await sleep(120);
 ok(/تالف|ناقص/.test(E.txt('#shInNote')),'كود تالف مرفوض برسالة: '+E.txt('#shInNote'));
 ok(E.modalOpen(),'والمودال فضل مفتوح');
 // 4) الرابط الكامل الصحيح
 E.q('#shIn').value='http://localhost/index.html#s='+C;E.click(E.mb(0));await sleep(150);
 ok(!E.modalOpen()||!/استيراد من رابط/.test(E.title()),'الرابط الصالح اتقبل وفتح التأكيد');
 ok(/استبدال|ستبدل/.test(E.q('#modal').textContent),'فيه تأكيد قبل التطبيق');
 E.click(E.mb(0));await sleep(150);
 const stE=E.st();
 ok(stE.khatmahs[0].read.length>0,'الاستيراد نجح: '+JSON.stringify(stE.khatmahs[0].read));
 ok(JSON.stringify(stE.khatmahs[0].read)===JSON.stringify(stA.khatmahs[0].read),'ونفس بيانات A بالظبط');
 ok(stE.settings.palette==='rose','والإعدادات جت معاه');
 // 5) الكود وحده (من غير رابط)
 const E2=boot({store:E.st()});await sleep(350);
 E2.click(E2.q('[data-act="settings"]'));await sleep(40);
 E2.click(E2.q('[data-act="sharein"]'));await sleep(60);
 E2.q('#shIn').value='  '+C+'  ';E2.click(E2.mb(0));await sleep(150);
 E2.click(E2.mb(0));await sleep(150);
 ok(JSON.stringify(E2.st().khatmahs[0].read)===JSON.stringify(stA.khatmahs[0].read),'الكود وحده (مع مسافات) اشتغل');
 ok(E.errs.length===0&&E2.errs.length===0,'manual paste no errors '+E.errs.concat(E2.errs).join('|'));
 E.w.close();E2.w.close();

 // ============ ز) النسخ ============
 const G=boot({noClipboard:true});await sleep(400);
 G.q('#oPage').value='10';G.click(G.mb(0));await sleep(80);
 G.click(G.q('[data-act="settings"]'));await sleep(40);
 G.click(G.q('[data-act="share"]'));await sleep(150);
 let copied=null;
 G.d.execCommand=function(cmd){ if(cmd==='copy'){ const el=G.d.activeElement; copied=el&&el.value?el.value.slice(0,12):'x'; return true; } return false; };
 G.click(G.q('[data-act="sharecopycode"]'));await sleep(80);
 ok(/تم نسخ|تعذّر النسخ/.test(G.txt('#toast')),'زر النسخ بيرد برسالة: "'+G.txt('#toast')+'"');
 ok(G.errs.length===0,'copy path no errors '+G.errs.join('|'));
 G.w.close();

 // ============ ح) مسار الضغط (CompressionStream) ============
 const H=boot({compress:true});await sleep(400);
 H.q('#oPage').value='300';H.click(H.mb(0));await sleep(100);
 H.click(H.q('[data-act="settings"]'));await sleep(40);
 H.click(H.q('[data-act="share"]'));await sleep(300);
 const ch=H.q('#shCode')?H.q('#shCode').value:'';
 ok(!!ch,'كود اتولّد في مسار الضغط');
 if(ch.charAt(0)==='1'){
   ok(/^1[A-Za-z0-9_-]{8,}$/.test(ch),'كود مضغوط صالح');
   ok(ch.length<C.length,'المضغوط أقصر من غير المضغوط ('+ch.length+' < '+C.length+')');
   ok(/مضغوط/.test(H.q('#modal').textContent),'الرسالة بتقول «مضغوط»');
   const I=boot({url:'http://localhost/#s='+ch,compress:true});await sleep(600);
   ok(/تقدم مشترك/.test(I.title()),'الكود المضغوط اتعرف عليه');
   I.click(I.mb(0));await sleep(150);
   ok(I.st().khatmahs[0].last===300,'round-trip مضغوط: last=300 got '+I.st().khatmahs[0].last);
   ok(JSON.stringify(I.st().khatmahs[0].read)==='[[1,300]]','read=[[1,300]] got '+JSON.stringify(I.st().khatmahs[0].read));
   ok(I.errs.length===0,'compressed round-trip no errors '+I.errs.join('|'));
   I.w.close();
   // ونسخة بلا فكّ ضغط ترفض بأدب بدل ما تنهار
   const J=boot({url:'http://localhost/#s='+ch});await sleep(500);
   ok(J.errs.length===0,'نسخة لا تدعم فك الضغط ما بتقعش: '+J.errs.join('|'));
   J.w.close();
 } else {
   ok(true,'المتصفح ما وفرش CompressionStream — اتستخدم المسار العادي (مقبول)');
 }
 H.w.close();

 // ============ ط) الاستقلال: مفيش أي طلب شبكة في كود المشاركة ============
 const js=fs.readFileSync('src/app.js','utf8');
 const seg=js.slice(js.indexOf('أكواد المشاركة'), js.indexOf('function openShare'));
 ok(!/\bfetch\s*\(/.test(seg),'كود المشاركة ما فيهوش fetch');
 ok(!/XMLHttpRequest|WebSocket|sendBeacon/.test(seg),'ولا أي API شبكة تانية');
 ok(/CompressionStream/.test(seg),'بيستخدم CompressionStream المحلي (مش سيرفر)');

 A.w.close();
 console.log('FAILS:',F);process.exit(F?1:0);
})();
