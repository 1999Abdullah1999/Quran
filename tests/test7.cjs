// يمنع عودة خلل التمرير الأفقي: لا عناصر تُزاح خارج الشاشة بقيم ضخمة (في RTL تمدّ عرض الصفحة).
const fs=require('fs');let F=0;
for(const f of ['src/app.js','src/index.html','src/styles.css']){
  const t=fs.readFileSync(f,'utf8');
  const bad=t.match(/(left|right|inset-inline-start)\s*:\s*-\d{4,}px/g);
  console.log(bad?'FAIL:':'ok  :',f,bad?bad.join(','):'no huge off-screen offsets');
  if(bad)F++;
}
console.log('FAILS:',F);process.exit(F?1:0);
