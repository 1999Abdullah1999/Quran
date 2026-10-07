#!/usr/bin/env node
/*
 * توليد بيانات «مصحف المدينة النبوية» (604 صفحة) من الحزمة المفتوحة quran-meta.
 *
 *   cd .tools && npm i quran-meta jsdom      # مرة واحدة (مجلد .tools/ متجاهَل في git)
 *   node tools/gen_madinah.mjs               # يطبع تقرير التحقق
 *   node tools/gen_madinah.mjs --write       # يكتب النتيجة في data/editions.json
 *
 * المصدر: https://github.com/quran-center/quran-meta  (رخصة MIT، بلا أي اعتماديات)
 * الحزمة تحتوي ترقيم صفحات المصحف السعودي (حفص عن عاصم، 604 صفحة) لكل آية من الـ6236.
 *
 * ما نحتاجه في التطبيق لكل طبعة:
 *   SS/SE  أول وآخر صفحة لكل سورة من الـ114
 *   RS/RE  أول وآخر صفحة لكل ربع حزب من الـ240
 *   JS/JE  أول وآخر صفحة لكل جزء من الـ30
 *   RSA    الآية [سورة، آية] التي يبدأ عندها كل ربع (للتحويل التقريبي بين الطبعات)
 *   N      رقم آخر صفحة، وP0 رقم أول صفحة فيها نص (المدينة: 1)
 */
import { createHafs } from 'quran-meta';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data', 'editions.json');
const WRITE = process.argv.includes('--write');

const LABEL = 'مصحف المدينة النبوية (السعودي)';
const SHORT = 'المدينة';
const P0 = 1;

const hafs = createHafs();
const meta = hafs.meta;

function fail(msg) {
  console.error('✗ ' + msg);
  process.exit(1);
}

if (meta.numAyahs !== 6236) fail(`عدد الآيات ${meta.numAyahs} وليس 6236 — تغيّر مصدر البيانات`);
if (meta.numPages !== 604) fail(`عدد الصفحات ${meta.numPages} وليس 604 — تغيّر تخطيط المصحف`);
if (meta.numRubAlHizbs !== 240) fail(`عدد الأرباع ${meta.numRubAlHizbs} وليس 240`);

/* ---- المرور على كل آية مرة واحدة ---- */
const SS = new Array(114).fill(0);
const SE = new Array(114).fill(0);
const RS = new Array(240).fill(0);
const RE = new Array(240).fill(0);
const RSA = new Array(240).fill(null);
const JS = new Array(30).fill(0);
const JE = new Array(30).fill(0);

for (let id = 1; id <= meta.numAyahs; id++) {
  const m = hafs.getAyahMeta(id);
  const p = m.page;
  const si = m.surah - 1;
  const ri = m.rubAlHizbId - 1;
  const ji = m.juz - 1;
  if (!SS[si]) SS[si] = p;
  SE[si] = p;
  if (!RS[ri]) { RS[ri] = p; RSA[ri] = [m.surah, m.ayah]; }
  RE[ri] = p;
  if (!JS[ji]) JS[ji] = p;
  JE[ji] = p;
}

/* ---- تحقق بنيوي ---- */
const problems = [];
const nonDec = (a, name) => a.forEach((v, i) => { if (i && v < a[i - 1]) problems.push(`${name} تتناقص عند ${i + 1}: ${a[i - 1]} → ${v}`); });
nonDec(SS, 'SS'); nonDec(SE, 'SE'); nonDec(RS, 'RS'); nonDec(RE, 'RE'); nonDec(JS, 'JS'); nonDec(JE, 'JE');
SS.forEach((v, i) => { if (SE[i] < v) problems.push(`السورة ${i + 1}: النهاية ${SE[i]} قبل البداية ${v}`); });
RS.forEach((v, i) => { if (RE[i] < v) problems.push(`الربع ${i + 1}: النهاية ${RE[i]} قبل البداية ${v}`); });
JS.forEach((v, i) => { if (JE[i] < v) problems.push(`الجزء ${i + 1}: النهاية ${JE[i]} قبل البداية ${v}`); });
if (SS[0] !== P0) problems.push(`الفاتحة تبدأ من ${SS[0]} وليس ${P0}`);
if (SE[113] !== meta.numPages) problems.push(`الناس تنتهي في ${SE[113]} وليس ${meta.numPages}`);
if (JS[0] !== P0) problems.push(`الجزء الأول يبدأ من ${JS[0]}`);
if (JE[29] !== meta.numPages) problems.push(`الجزء الثلاثون ينتهي في ${JE[29]}`);
if (RS[0] !== P0 || RE[239] !== meta.numPages) problems.push(`الأرباع لا تغطي ${P0}..${meta.numPages}`);
JS.forEach((v, j) => { if (RS[j * 8] !== v) problems.push(`بداية الجزء ${j + 1} (${v}) ≠ بداية ربعه الأول (${RS[j * 8]})`); });
RSA.forEach((v, i) => { if (!Array.isArray(v) || v.length !== 2 || v[0] < 1 || v[0] > 114 || v[1] < 1) problems.push(`RSA[${i + 1}] غير صالح: ${JSON.stringify(v)}`); });

/* ---- مراجع مطبوعة معروفة (مصحف المدينة، طبعة مجمع الملك فهد) ---- */
const CANON_JUZ = [1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582];
CANON_JUZ.forEach((v, j) => { if (JS[j] !== v) problems.push(`بداية الجزء ${j + 1}: متوقع ${v} وموجود ${JS[j]}`); });
const ANCHORS = [
  ['الكهف 293–304', SS[17] === 293 && SE[17] === 304],
  ['المسد 603', SS[110] === 603],
  ['الإخلاص والفلق والناس 604', SS[111] === 604 && SS[112] === 604 && SS[113] === 604],
  ['المجادلة = بداية الجزء 28 (542)', SS[57] === 542],
  ['الملك = بداية الجزء 29 (562)', SS[66] === 562],
  ['النبأ = بداية الجزء 30 (582)', SS[77] === 582],
  ['البقرة 2–286 تبدأ صفحة 2', SS[1] === 2],
];
ANCHORS.forEach(([name, good]) => { if (!good) problems.push('مرجع خاطئ: ' + name); });

const edition = { label: LABEL, short: SHORT, N: meta.numPages, P0, SS, SE, RS, RE, RSA, JS, JE };

if (problems.length) {
  problems.forEach(p => console.error('  ✗ ' + p));
  fail(`${problems.length} مشكلة في بيانات المدينة`);
}

/* ---- مقارنة بما هو محفوظ في المستودع ---- */
let prev = null;
try { prev = JSON.parse(fs.readFileSync(DATA, 'utf8')).madinah || null; } catch (e) { prev = null; }

const KEYS = ['SS', 'SE', 'RS', 'RE', 'JS', 'JE', 'RSA'];
const diffs = [];
if (prev) {
  if (prev.N !== edition.N) diffs.push(`N ${prev.N} → ${edition.N}`);
  if (prev.P0 !== edition.P0) diffs.push(`P0 ${prev.P0} → ${edition.P0}`);
  if (prev.label !== edition.label) diffs.push(`label "${prev.label}" → "${edition.label}"`);
  if (prev.short !== edition.short) diffs.push(`short "${prev.short}" → "${edition.short}"`);
  KEYS.forEach(k => {
    const a = JSON.stringify(prev[k] || null);
    const b = JSON.stringify(edition[k]);
    if (a !== b) {
      const pa = prev[k] || [], pb = edition[k];
      const at = pb.map((v, i) => (JSON.stringify(v) !== JSON.stringify(pa[i]) ? i : -1)).filter(i => i >= 0);
      diffs.push(`${k}: ${at.length} موضع مختلف (أولها ${at.length ? at[0] + 1 + ': ' + JSON.stringify(pa[at[0]]) + ' → ' + JSON.stringify(pb[at[0]]) : ''})`);
    }
  });
}

console.log('مصحف المدينة النبوية — من quran-meta ' + meta.riwayaName);
console.log('  الصفحات      : ' + edition.N + ' (أول صفحة نص: ' + edition.P0 + ')');
console.log('  السور        : ' + SS.length + ' — الفاتحة ' + SS[0] + '، الناس تنتهي ' + SE[113]);
console.log('  الأرباع      : ' + RS.length + ' — من ' + RS[0] + ' إلى ' + RE[239]);
console.log('  الأجزاء      : ' + JS.join(','));
console.log('  أصغر ربع     : ' + Math.min(...RE.map((v, i) => v - RS[i] + 1)) + ' صفحة، وأكبره ' + Math.max(...RE.map((v, i) => v - RS[i] + 1)) + ' صفحة');
console.log('  صفحات الأجزاء: مجموعها ' + JS.reduce((a, v, j) => a + (JE[j] - v + 1), 0) + ' (أكبر من 604 لأن صفحات الحدود مشتركة بين جزأين)');

if (!prev) {
  console.log('  ! لا توجد بيانات مدينة محفوظة للمقارنة');
} else if (!diffs.length) {
  console.log('  ✓ مطابق تمامًا لما في data/editions.json');
} else {
  console.log('  ✗ يختلف عن data/editions.json:');
  diffs.forEach(d => console.log('      - ' + d));
}

if (WRITE) {
  if (diffs.length && !process.argv.includes('--force')) {
    fail('لن أكتب فوق بيانات مختلفة بدون --force (راجع الفروق أولًا)');
  }
  const all = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  all.madinah = edition;
  fs.writeFileSync(DATA, JSON.stringify(all, null, 1) + '\n', 'utf8');
  console.log('  ✓ كُتبت data/editions.json — شغّل python3 tools/build.py بعدها');
} else if (diffs.length) {
  process.exitCode = 1;
}
