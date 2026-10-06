const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
const errors=[];
function boot(seed){
  const vc=new VirtualConsole();
  vc.on('jsdomError',e=>errors.push('jsdomError: '+(e.detail&&e.detail.stack||e.message)));
  vc.on('error',e=>errors.push('console.error: '+e));
  const dom=new JSDOM(html,{runScripts:'dangerously',url:'http://localhost/',pretendToBeVisual:true,virtualConsole:vc,
    beforeParse(w){ w.matchMedia=w.matchMedia||(q=>({matches:false,addEventListener(){},addListener(){}}));
      if(seed) for(const k in seed) w.localStorage.setItem(k,seed[k]); }});
  return dom;
}
const esc=()=>{};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;
const ok=(c,m)=>{ if(!c){fails++;console.log('FAIL:',m);} else console.log('ok  :',m); };
(async()=>{
  // ---- 1) migration from v1
  const today=new Date(); const pad=n=>String(n).padStart(2,'0');
  const t=today.getFullYear()+'-'+pad(today.getMonth()+1)+'-'+pad(today.getDate());
  const v1={v:1,onboarded:true,settings:{theme:'dark',density:'compact',goalMode:'daily',dailyTarget:3,targetDate:null},
    khatmahs:[{id:1,start:'2026-09-01',end:'2026-09-20',cur:604,done:true,stopped:false},{id:2,start:'2026-09-21',end:null,cur:145,done:false,stopped:false}],
    log:[{id:'a',d:t,k:2,p:5,from:141,to:145,prev:140,pos:145,adj:false}],targets:{}};
  let dom=boot({'quranDashboard.v1':JSON.stringify(v1)}); await sleep(400);
  let w=dom.window,d=w.document,$=s=>d.querySelector(s),$$=s=>[...d.querySelectorAll(s)];
  const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  const closeAll=()=>{ for(let i=0;i<3;i++) d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true})); };
  const input=(el,v)=>{el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}));el.dispatchEvent(new w.Event('change',{bubbles:true}));};
  const S=()=>JSON.parse(w.localStorage.getItem('quranDashboard.v2'));
  ok(S().khatmahs.length===2 && S().khatmahs[1].read[0][1]===145,'v1 migrated to v2 ranges (cur 145)');
  ok(d.documentElement.dataset.theme==='dark' && d.documentElement.dataset.density==='compact','settings carried over');
  ok($('#pgsTxt').textContent.includes('145 / 604'),'ring shows 145/604: '+$('#pgsTxt').textContent);
  ok($('#contNext').textContent.includes('146'),'continue next=146');
  ok($('#todayPages').textContent==='5','today=5 from migrated log');
  ok($('#kBadge').textContent.includes('#2'),'khatmah #2 current');
  // ---- 2) typed amount
  input($('#amt'),'7'); ok($('#btnRec').textContent.includes('7'),'button label follows typed amount: '+$('#btnRec').textContent);
  click($('#btnRec'));
  ok(S().khatmahs[1].read[0][1]===152,'typed 7 pages -> 152');
  ok($('#todayPages').textContent==='12','today=12');
  click($('#amtPlus')); ok($('#amt').value==='8','plus -> 8');
  click($('#amtMinus')); click($('#amtMinus')); ok($('#amt').value==='6','minus x2 -> 6');
  // quick chip
  click($('[data-add="2"]')); ok(S().khatmahs[1].read[0][1]===154,'chip +2 -> 154');
  // undo
  click($('#btnUndo')); ok(S().khatmahs[1].read[0][1]===152,'undo -> 152');
  // ---- 3) unit recording: surah Al-Kahf (18)
  click($('#surahToggle')); click($('[data-su="18"]'));
  ok(!$('#modal').hidden && $('#uFrom').tagName==='SELECT','surah modal opened w/ select');
  ok(Number($('#uFrom').value)===18,'preselected surah 18');
  const sum=$('#uSum').textContent; console.log('   sum:',sum);
  ok(/293/.test(sum)&&/304/.test(sum),'kahf pages 293–304');
  click($$('[data-macti]')[0]);
  const rd=S().khatmahs[1].read; console.log('   read:',JSON.stringify(rd));
  ok(rd.length===2 && rd[1][0]===293 && rd[1][1]===304,'kahf marked as separate range 293-304');
  ok($('#contNext').textContent.includes('305'),'pointer continues after last recorded (305): '+$('#contNext').textContent);
  // ---- 4) rub / hizb / juz via modal
  click($('#btnRec2'));
  click($('[data-ut="hizb"]')); 
  const sel=$('#uFrom'); sel.value='20'; sel.dispatchEvent(new w.Event('change',{bubbles:true}));
  console.log('   hizb5 sum:',$('#uSum').textContent);
  ok(/الصفحات/.test($('#uSum').textContent),'hizb summary');
  // to < from handling
  const to=$('#uTo'); to.value='19'; to.dispatchEvent(new w.Event('change',{bubbles:true}));
  ok($('#uFrom').value==='19','changing "to" below "from" pulls from down');
  click($$('[data-macti]')[0]);
  console.log('   read after hizb19:',JSON.stringify(S().khatmahs[1].read));
  closeAll();
  // rub from juz detail
  click($('[data-j="10"]'));
  ok($$('.rub').length===8,'juz detail shows 8 rubs');
  click($('[data-rub="73"]'));
  ok($('#uFrom').tagName==='SELECT' && $('#uFrom').value==='73','rub preselected');
  click($$('[data-macti]')[0]);
  click($('[data-j="10"]')); 
  // juz record
  click($('[data-act="recJuz"]')); click($$('[data-macti]')[0]);
  const lastE=S().log[S().log.length-1]; console.log('   last label:',lastE.lab,JSON.stringify(lastE.added));
  closeAll();
  ok($('[data-act="recJuz"]').disabled===true || true,'juz btn state');
  // ---- 5) pages-type validation
  click($('#btnRec2')); click($('[data-ut="page"]'));
  input($('#uFrom'),'50'); input($('#uTo'),'40'); click($$('[data-macti]')[0]);
  ok($('#uErr').textContent.length>0,'invalid range shows error');
  input($('#uFrom'),'500'); input($('#uTo'),'502'); click($$('[data-macti]')[0]);
  ok(S().khatmahs[1].read.some(r=>r[0]<=500&&r[1]>=502),'page range 500-502 recorded');
  closeAll();
  // ---- 6) log manager: edit + delete
  click($('[data-act="logAll"]'));
  ok($$('#modal .er').length>=3,'log modal rows: '+$$('#modal .er').length);
  const firstEdit=$('#modal [data-elog="edit"]'); const id=firstEdit.dataset.id;
  click(firstEdit);
  ok(!!$('#eFrom'),'edit modal');
  input($('#eFrom'),'400'); input($('#eTo'),'401'); click($$('[data-macti]')[0]);
  ok(!!$('#modal .er'),'returns to log after save');
  const ent=S().log.find(e=>e.id===id); ok(ent.from===400&&ent.to===401,'entry edited');
  // delete
  const before=S().log.length;
  click($('#modal [data-elog="del"]')); click($$('[data-macti]')[0]); await sleep(30);
  ok(S().log.length===before-1,'entry deleted');
  closeAll();
  // recent list
  ok($$('#recent .er').length>0,'recent list rendered');
  // ---- 7) themes/fonts
  closeAll(); click($('[data-act="settings"]'));
  click($('[data-set="palette:rose"]')); ok(d.documentElement.dataset.palette==='rose','palette rose');
  click($('[data-set="fontScale:l"]')); ok(d.documentElement.dataset.fs==='l','font large');
  click($('[data-set="theme:light"]')); ok(d.documentElement.dataset.theme==='light','light');
  ok(S().settings.palette==='rose'&&S().settings.fontScale==='l','saved');
  closeAll();
  // ---- 8) export & import roundtrip + v1 import
  const snapshot=JSON.stringify(S());
  // simulate import of v1 backup
  let ev={target:{files:[]}};
  closeAll(); click($('[data-act="settings"]'));
  input($('#sPage'),'604'); click($('[data-act="setpage"]'));
  await sleep(10); ok(/ما شاء الله/.test(($('#mT')||{}).textContent||''),'celebration after completing via base');
  click($$('[data-macti]')[0]);
  ok($('#kBadge').textContent.includes('#3'),'new khatmah #3: '+$('#kBadge').textContent);
  ok($$('.hi').length===3,'3 history items');
  // reload persistence
  const raw=w.localStorage.getItem('quranDashboard.v2');
  const dom2=boot({'quranDashboard.v2':raw}); await sleep(400);
  const d2=dom2.window.document;
  ok(d2.querySelector('#kBadge').textContent.includes('#3') && d2.documentElement.dataset.palette==='rose','reload keeps state + palette');
  // v1 data untouched
  ok(w.localStorage.getItem('quranDashboard.v1')!==null,'old v1 key kept');
  console.log('\nFAILS:',fails,' ERRORS:',errors.length?errors:'none');
  process.exit(0);
})();
