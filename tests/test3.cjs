const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
(async()=>{
 const dom=new JSDOM(html,{runScripts:'dangerously',url:'http://localhost/',pretendToBeVisual:true,beforeParse(w){w.matchMedia=w.matchMedia||(q=>({matches:false,addEventListener(){},addListener(){}}));}});
 const w=dom.window,d=w.document; const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(400);
 const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
 // onboarding present on fresh start
 console.log('onboarding:',!d.querySelector('#modal').hidden);
 d.querySelector('#oPage').value='100'; click(d.querySelectorAll('[data-macti]')[0]);
 console.log('after onboarding:',d.querySelector('#pgsTxt').textContent,'| today pages',d.querySelector('#todayPages').textContent);
 // v1 backup import through FileReader
 const v1={app:'quran-dashboard',version:1,data:{v:1,settings:{theme:'light',density:'comfortable',goalMode:'daily',dailyTarget:2},khatmahs:[{id:1,start:'2026-01-01',end:null,cur:300,done:false,stopped:false}],log:[{id:'x',d:'2026-10-01',k:1,p:2,from:299,to:300,prev:298,pos:300,adj:false}],targets:{}}};
 const f=new w.File([JSON.stringify(v1)],'b.json',{type:'application/json'});
 const inp=d.querySelector('#fileIn'); Object.defineProperty(inp,'files',{value:[f]}); inp.dispatchEvent(new w.Event('change',{bubbles:true}));
 await sleep(100); click(d.querySelectorAll('[data-macti]')[0]); await sleep(50);
 console.log('after v1 import:',d.querySelector('#pgsTxt').textContent);
 // export content
 let blobText=null; w.URL.createObjectURL=b=>{ b.text&&b.text().then(t=>blobText=t); return 'blob:x'; };
 click(d.querySelector('[data-act="settings"]')); click(d.querySelector('[data-act="export"]')); await sleep(50);
 const ex=blobText?JSON.parse(blobText):null; console.log('export version',ex&&ex.version,'has read ranges',ex&&ex.data.khatmahs[0].read.length);
 // reset needs checkbox
 click(d.querySelector('[data-act="reset"]')); const b0=d.querySelectorAll('[data-macti]')[0]; console.log('reset button disabled until checked:',b0.disabled);
 process.exit(0);
})();
