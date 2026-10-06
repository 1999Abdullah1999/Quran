import {getAyahMeta} from 'quran-meta/hafs';
import fs from 'fs';
const N=6236;
const sFirst=Array(115).fill(0), sLast=Array(115).fill(0);
const rFirst=Array(241).fill(0), rLast=Array(241).fill(0), rStart=Array(241).fill(null);
const jFirst=Array(31).fill(0), jLast=Array(31).fill(0);
for(let id=1;id<=N;id++){
  const m=getAyahMeta(id);
  const p=m.page, s=m.surah, a=m.ayah, r=m.rubAlHizbId, j=m.juz;
  if(!sFirst[s]) sFirst[s]=p; sLast[s]=p;
  if(!rFirst[r]){ rFirst[r]=p; rStart[r]=[s,a]; } rLast[r]=p;
  if(!jFirst[j]) jFirst[j]=p; jLast[j]=p;
}
const out={SS:sFirst.slice(1),SE:sLast.slice(1),RS:rFirst.slice(1),RE:rLast.slice(1),RSA:rStart.slice(1),JS:jFirst.slice(1),JE:jLast.slice(1)};
fs.writeFileSync('quran-data.json',JSON.stringify(out));
// compare with the old arrays in the html
const html=fs.readFileSync('/mnt/user-data/outputs/quran-dashboard.html','utf8');
const get=n=>JSON.parse('['+html.match(new RegExp('var '+n+' = \\[(.*?)\\];'))[1]+']');
const oldSS=get('SS'), oldJS=get('JS_');
let diffS=[],diffJ=[];
oldSS.forEach((v,i)=>{ if(v!==out.SS[i]) diffS.push((i+1)+':old '+v+' new '+out.SS[i]); });
oldJS.forEach((v,i)=>{ if(v!==out.JS[i]) diffJ.push((i+1)+':old '+v+' new '+out.JS[i]); });
console.log('surah start diffs',diffS.length,diffS.join(' | '));
console.log('juz start diffs',diffJ.length,diffJ.join(' | '));
console.log('rub 1..3',out.RS.slice(0,3),out.RE.slice(0,3),'rub240',out.RS[239],out.RE[239]);
console.log('juz starts',out.JS.join(','));
console.log('check rub=8/juz: juz j first rub page == juz first page?', out.JS.every((p,j)=>out.RS[j*8]===p));
console.log('surah 114 last',out.SE[113],'fatiha',out.SS[0],out.SE[0]);
