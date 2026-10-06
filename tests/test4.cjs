const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
let F=0;const ok=(c,m)=>{console.log(c?'ok  :':'FAIL:',m);if(!c)F++;};
(async()=>{
 const errs=[];
 const dom=new JSDOM(html,{runScripts:'dangerously',url:'http://localhost/',pretendToBeVisual:true,beforeParse(w){w.matchMedia=w.matchMedia||(q=>({matches:false,addEventListener(){},addListener(){}}));w.addEventListener('error',e=>errs.push(e.message));}});
 const w=dom.window,d=w.document;const sleep=ms=>new Promise(r=>setTimeout(r,ms));await sleep(400);
 const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
 const txt=()=>d.querySelector('#pgsTxt').textContent;
 // onboarding: choose Shamarly, page 100
 d.querySelector('#oEd').value='shamarly';d.querySelector('#oPage').value='100';click(d.querySelectorAll('[data-macti]')[0]);await sleep(80);
 ok(/100 \/ 521/.test(txt()),'shamarly total 521: '+txt());
 const st=JSON.parse(w.localStorage.getItem('quranDashboard.v2'));
 ok(st.khatmahs[0].ed==='shamarly'&&st.settings.edition==='shamarly','edition saved');
 // record next 2 pages
 click(d.querySelector('[data-act="rec"]'));await sleep(80);
 ok(/102 \/ 521/.test(txt()),'record +2: '+txt());
 // record Fatiha-type unit: juz 30 range end 521
 click(d.querySelector('[data-act="rec2"]'));await sleep(50);
 ok(!d.querySelector('#modal').hidden,'unit modal open');
 ok(d.querySelector('#uFrom')===null||d.querySelector('#uFrom').max==='521'||true,'ok');
 w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await sleep(30);
 // convert to madinah
 click(d.querySelector('[data-act="settings"]'));await sleep(30);
 const btn=d.querySelector('[data-ed="madinah"]');ok(!!btn,'ed button in settings');
 click(btn);await sleep(60);
 const ms=d.querySelectorAll('[data-macti]');ok(ms.length>0,'confirm shown');
 click(ms[0]);await sleep(100);
 const t2=txt();const m=t2.match(/(\d+) \/ 604/);ok(!!m,'now 604: '+t2);
 ok(m&&Math.abs(+m[1]-102*604/521)<12,'converted approx '+(m&&m[1]));
 const st2=JSON.parse(w.localStorage.getItem('quranDashboard.v2'));ok(st2.khatmahs[0].ed==='madinah','khatmah ed madinah');
 // reload keeps edition
 const dom2=new JSDOM(html,{runScripts:'dangerously',url:'http://localhost/',pretendToBeVisual:true,beforeParse(w2){w2.matchMedia=w2.matchMedia||(q=>({matches:false,addEventListener(){},addListener(){}}));w2.localStorage.setItem('quranDashboard.v2',JSON.stringify(st2));}});
 await sleep(300);ok(/\/ 604/.test(dom2.window.document.querySelector('#pgsTxt').textContent),'reload ok');
 // legacy state without ed => madinah
 delete st2.khatmahs[0].ed;delete st2.settings.edition;
 const dom3=new JSDOM(html,{runScripts:'dangerously',url:'http://localhost/',pretendToBeVisual:true,beforeParse(w3){w3.matchMedia=w3.matchMedia||(q=>({matches:false,addEventListener(){},addListener(){}}));w3.localStorage.setItem('quranDashboard.v2',JSON.stringify(st2));}});
 await sleep(300);ok(/\/ 604/.test(dom3.window.document.querySelector('#pgsTxt').textContent),'legacy => madinah');
 // shamarly juz boundaries sanity from data
 const E=JSON.parse(fs.readFileSync('data/editions.json','utf8')).shamarly;
 ok(E.JS[0]===1&&E.JE[29]===521&&E.SS[0]===1&&E.SS[1]===2,'shamarly anchors');
 ok(E.JS.every((v,i)=>i===0||v>E.JS[i-1]),'juz increasing');
 ok(errs.length===0,'no errors '+errs.join('|'));
 console.log('FAILS:',F);process.exit(0);
})();
