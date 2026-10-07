#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
توليد بيانات «مصحف الشمرلي» (522 صفحة، أول صفحة نص = 2) من قاعدة بيانات المصدر.

    python3 tools/gen_shamarly.py                 # ينزّل المصدر (مرة واحدة) ويقارن بالبيانات المحفوظة
    python3 tools/gen_shamarly.py --write         # يكتب النتيجة في data/editions.json
    python3 tools/gen_shamarly.py --db /path/shamerly.db   # استعمال نسخة محلية
    python3 tools/gen_shamarly.py --report        # يطبع الحالات الحرجة التي تحتاج مراجعة بشرية

المصدر
------
مستودع `Mr-DDDAlKilanny/Shamarly` على GitHub (عام)، الملف `shamerly.db` (~9 ميجابايت).
جدول `mushaf(page, sura, ayah, x, y, ayah_index, ayahtext, tafseer)` فيه 6238 صفًا:
  * 6236 آية + صفّان بـ`ayah=0` علامتا البسملة في الصفحتين 2 و3.
  * المفتاح الأساسي (sura, ayah) — **لا تعتمد على `ayah_index`**: قيمته فارغة للآية (1,1).
  * `page` هي **صفحة نهاية** الآية (تحقّق منه مشروع tibyan لكل الـ6236 آية).
  * `x,y` إحداثيات علامة رقم الآية في صورة الصفحة (886×1377)، والأصل أعلى اليسار.
  * أرقام الصفحات في القاعدة هي **نفسها المطبوعة في المصحف**: 2..522 (الصفحة 1 غلاف).

النتيجة: `N=522`, `P0=2`, أي 521 صفحة تُقاس بها نسبة الإنجاز.

كيف نحسب الصفحات
-----------------
* النهايات (SE/RE/JE) محسوبة **بدقة تامة** من القاعدة: صفحة نهاية آخر آية في الوحدة.
  تحقّق: 114/114 سورة و240/240 ربعًا تطابق القاعدة تمامًا، بلا أي تقدير.
* البدايات (SS/RS) تحتاج تقديرًا، لأن القاعدة لا تقول أين **تبدأ** الآية التي تمتد على
  صفحتين. القاعدة المستعملة (موثّقة أدناه) تُعيد إنتاج كل القيم المحفوظة بلا أي فرق:
    - بداية السورة: لو الآية الأولى تنتهي في نفس صفحة الآية السابقة فالبداية = تلك الصفحة،
      وإلا فالبداية = صفحة السابقة إذا كانت علامة السابقة في أعلى الصفحة (y <= 940)
      — أي ما زال في الصفحة متّسع — وإلا فصفحة النهاية.
      استثناءان ثابتان: الفاتحة تبدأ صفحة 2، والبقرة صفحة 3 (صفحتان مزخرفتان).
    - بداية الربع: نفس المنطق لكن بمعيار أفقي: لو علامة الآية السابقة عند اليسار
      (x <= 104) فالسطر/الصفحة اكتملت والبداية في الصفحة التالية، وإلا ففي صفحة السابقة.
  العتبتان (940 و104) مستخرجتان من البيانات نفسها وتفصلان الحالتين تمامًا:
  كل حالات «بداية في صفحة جديدة» لها x بين 6 و104، وكل حالات «نفس الصفحة» لها x بين
  105 و751. استعمل `--report` لطبع الحالات القريبة من العتبة لمراجعتها بصريًا على المصحف.
"""
from __future__ import annotations

import argparse
import io
import json
import os
import sqlite3
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "editions.json")
CACHE = os.path.join(os.path.expanduser("~"), ".cache", "shamarly", "shamerly.db")

DB_URL = "https://api.github.com/repos/Mr-DDDAlKilanny/Shamarly/contents/shamerly.db"
DB_SHA_URL = "https://api.github.com/repos/Mr-DDDAlKilanny/Shamarly/contents/"

LABEL = "مصحف الشمرلي (المصري)"
SHORT = "الشمرلي"
P0 = 2          # الصفحة 1 غلاف؛ أول صفحة فيها نص هي 2 (الفاتحة)
N = 522         # آخر صفحة

Y_SURAH_ROOM = 940   # علامة الآية السابقة فوق هذا الخط ⇒ ما زال في الصفحة متّسع لبداية السورة
X_RUB_FULL = 104     # علامة الآية السابقة عند أو يسار هذا الخط ⇒ السطر/الصفحة اكتملت
MARGIN = 30          # مدى «الحالات الحرجة» في تقرير --report

errors: list[str] = []


def fail(msg: str) -> None:
    errors.append(msg)


def ensure_db(path: str | None) -> str:
    if path:
        if not os.path.exists(path):
            raise SystemExit(f"✗ الملف غير موجود: {path}")
        return path
    if os.path.exists(CACHE):
        return CACHE
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    print(f"… أنزّل المصدر من GitHub إلى {CACHE}")
    req = urllib.request.Request(DB_URL, headers={"Accept": "application/vnd.github.raw",
                                                  "User-Agent": "quran-dashboard-tools"})
    with urllib.request.urlopen(req, timeout=120) as r, open(CACHE, "wb") as f:
        f.write(r.read())
    print(f"… تم ({os.path.getsize(CACHE):,} بايت)")
    return CACHE


def load_db(path: str):
    con = sqlite3.connect(path)
    rows = con.execute(
        "SELECT page, sura, ayah, x, y FROM mushaf WHERE ayah > 0 ORDER BY sura, ayah"
    ).fetchall()
    con.close()
    if len(rows) != 6236:
        fail(f"عدد الآيات {len(rows)} وليس 6236 — تغيّر مصدر البيانات")
        return None, None, None, None
    end = {(s, a): p for p, s, a, x, y in rows}
    pos = {(s, a): (x, y) for p, s, a, x, y in rows}
    order = [(s, a) for p, s, a, x, y in rows]
    prev = {order[i]: order[i - 1] for i in range(1, len(order))}
    return end, pos, order, prev


# --------------------------------------------------------------------------- #
# البدايات
# --------------------------------------------------------------------------- #
def surah_start(sa, end, pos, prev):
    e = end[sa]
    if sa == (1, 1):
        return 2, "fixed"       # الفاتحة: الصفحة 2 (بعد الغلاف)
    if sa == (2, 1):
        return 3, "fixed"       # البقرة: الصفحة 3 المزخرفة
    if sa not in prev:
        return e, "first"
    pe = end[prev[sa]]
    if pe == e:
        return e, "same"
    x, y = pos[prev[sa]]
    return (pe, "prev") if y <= Y_SURAH_ROOM else (e, "next")


def rub_start(sa, end, pos, prev):
    e = end[sa]
    if sa not in prev:
        return e, "first"
    pe = end[prev[sa]]
    if pe == e:
        return e, "same"
    x, y = pos[prev[sa]]
    return (e, "next") if x <= X_RUB_FULL else (pe, "prev")


def risky(kind, sa, end, pos, prev):
    """هل الحالة قريبة من العتبة بحيث تحتاج مراجعة بشرية؟"""
    if sa not in prev:
        return None
    pe, e = end[prev[sa]], end[sa]
    if pe == e:
        return None
    x, y = pos[prev[sa]]
    if kind == "surah":
        return abs(y - Y_SURAH_ROOM) <= 60
    return abs(x - X_RUB_FULL) <= MARGIN


def build(path: str):
    end, pos, order, prev = load_db(path)
    if end is None:
        return None, []

    if min(end.values()) != P0 or max(end.values()) != N:
        fail(f"نطاق الصفحات في المصدر {min(end.values())}..{max(end.values())} وليس {P0}..{N}")

    last_ayah = {}
    for (s, a) in end:
        if s not in last_ayah or a > last_ayah[s]:
            last_ayah[s] = a

    SS, SE, notes = [], [], []
    for s in range(1, 115):
        v, why = surah_start((s, 1), end, pos, prev)
        SS.append(v)
        SE.append(end[(s, last_ayah[s])])
        if why in ("prev", "next") and risky("surah", (s, 1), end, pos, prev):
            notes.append(("surah", s + 1, (s, 1), pos[prev[(s, 1)]], v, why))

    RS, RE = [], []
    # الأرباع: نشتقّ أول آية في كل ربع من توزيع الأرباع في مصحف المدينة (نفس النص، نفس التقسيم)
    mad = json.load(io.open(DATA, encoding="utf-8")).get("madinah") or {}
    if not mad.get("RSA") or len(mad["RSA"]) != 240:
        fail("لا توجد RSA في بيانات المدينة — شغّل node tools/gen_madinah.mjs --write أولًا")
        return None, notes
    RSA = [list(x) for x in mad['RSA']]

    for i, rsa in enumerate(RSA):
        sa = tuple(rsa)
        if sa not in end:
            fail(f"الربع {i+1}: الآية {rsa} غير موجودة في المصدر")
            return None, notes
        v, why = rub_start(sa, end, pos, prev)
        RS.append(v)
        if i < 239:
            nxt = tuple(RSA[i + 1])
            RE.append(end[prev[nxt]])
        else:
            RE.append(end[(114, last_ayah[114])])
        if why in ("prev", "next") and risky("rub", sa, end, pos, prev):
            notes.append(("rub", i + 1, sa, pos[prev[sa]], v, why))

    JS = [RS[j * 8] for j in range(30)]
    JE = [RE[j * 8 + 7] for j in range(30)]

    ed = {"label": LABEL, "short": SHORT, "N": N, "P0": P0,
          "SS": SS, "SE": SE, "RS": RS, "RE": RE, "RSA": RSA, "JS": JS, "JE": JE}
    return ed, notes


def selfcheck(ed) -> None:
    SS, SE, RS, RE, JS, JE = ed["SS"], ed["SE"], ed["RS"], ed["RE"], ed["JS"], ed["JE"]
    def nd(a, n):
        for i in range(1, len(a)):
            if a[i] < a[i - 1]:
                fail(f"{n} تتناقص عند {i+1}: {a[i-1]} → {a[i]}")
                return
    nd(SS, "SS"); nd(SE, "SE"); nd(RS, "RS"); nd(RE, "RE"); nd(JS, "JS"); nd(JE, "JE")
    for i in range(114):
        if SE[i] < SS[i]: fail(f"السورة {i+1}: النهاية {SE[i]} قبل البداية {SS[i]}")
    for i in range(240):
        if RE[i] < RS[i]: fail(f"الربع {i+1}: النهاية {RE[i]} قبل البداية {RS[i]}")
    for j in range(30):
        if JE[j] < JS[j]: fail(f"الجزء {j+1}: النهاية {JE[j]} قبل البداية {JS[j]}")
        if RS[j * 8] != JS[j]: fail(f"الجزء {j+1} لا يبدأ مع ربعه الأول")
    if not all(JS[i] < JS[i + 1] for i in range(29)):
        fail("بدايات الأجزاء ليست متزايدة تمامًا")
    for i, v in enumerate(SS + SE + RS + RE + JS + JE):
        if not (P0 <= v <= N):
            fail(f"قيمة {v} خارج النطاق {P0}..{N}")
            break

    # مراجع مطبوعة مؤكدة (مصحف الشمرلي، خط الحداد)
    ANC = [("الفاتحة صفحة 2", SS[0], 2), ("البقرة صفحة 3", SS[1], 3),
           ("الناس تنتهي 522", SE[113], 522), ("الكهف 243", SS[17], 243), ("الكهف تنتهي 253", SE[17], 253),
           ("المجادلة = الجزء 28 (459)", SS[57], 459), ("الملك = الجزء 29 (478)", SS[66], 478),
           ("النبأ = الجزء 30 (498)", SS[77], 498),
           ("الجزء 28 يبدأ 459", JS[27], 459), ("الجزء 29 يبدأ 478", JS[28], 478),
           ("الجزء 30 يبدأ 498", JS[29], 498), ("المسد 521", SS[110], 521),
           ("الإخلاص 522", SS[111], 522), ("الجزء الأول يبدأ 2", JS[0], 2),
           ("الجزء الثلاثون ينتهي 522", JE[29], 522)]
    for name, got, want in ANC:
        if got != want:
            fail(f"مرجع مطبوع خاطئ: {name} — الموجود {got} والمتوقع {want}")


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--db", help="مسار نسخة محلية من shamerly.db")
    ap.add_argument("--write", action="store_true", help="اكتب النتيجة في data/editions.json")
    ap.add_argument("--force", action="store_true", help="اكتب حتى لو النتيجة تختلف عن المحفوظ")
    ap.add_argument("--report", action="store_true", help="اطبع الحالات القريبة من العتبات")
    a = ap.parse_args(argv)

    path = ensure_db(a.db)
    ed, notes = build(path)
    if ed is None:
        for e in errors:
            print("  ✗ " + e)
        return 1
    selfcheck(ed)

    all_ed = json.load(io.open(DATA, encoding="utf-8"))
    prev_ed = all_ed.get("shamarly")
    diffs = []
    if prev_ed:
        for k in ("N", "P0", "label", "short"):
            if prev_ed.get(k) != ed[k]:
                diffs.append(f"{k}: {prev_ed.get(k)!r} → {ed[k]!r}")
        for k in ("SS", "SE", "RS", "RE", "JS", "JE", "RSA"):
            pa, pb = prev_ed.get(k) or [], ed[k]
            at = [i for i in range(max(len(pa), len(pb)))
                  if json.dumps(pa[i] if i < len(pa) else None) != json.dumps(pb[i] if i < len(pb) else None)]
            if at:
                first = at[0]
                diffs.append(f"{k}: {len(at)} موضع مختلف (أولها {first+1}: "
                             f"{pa[first] if first < len(pa) else '—'} → {pb[first] if first < len(pb) else '—'})")

    print("مصحف الشمرلي — من shamerly.db")
    print(f"  الصفحات      : {ed['N']} (أول صفحة نص: {ed['P0']}، والصفحة 1 غلاف)")
    print(f"  السور        : {len(ed['SS'])} — الفاتحة {ed['SS'][0]}، البقرة {ed['SS'][1]}، الناس تنتهي {ed['SE'][113]}")
    print(f"  الأرباع      : {len(ed['RS'])} — من {ed['RS'][0]} إلى {ed['RE'][239]}")
    print(f"  الأجزاء      : {','.join(str(x) for x in ed['JS'])}")
    print(f"  أصغر ربع     : {min(ed['RE'][i]-ed['RS'][i]+1 for i in range(240))} صفحة، "
          f"وأكبره {max(ed['RE'][i]-ed['RS'][i]+1 for i in range(240))} صفحة")
    print(f"  صفحات الأجزاء: مجموعها {sum(ed['JE'][j]-ed['JS'][j]+1 for j in range(30))} "
          "(أكبر من 521 لأن صفحات الحدود مشتركة بين جزأين)")

    if a.report or notes:
        print(f"\n  حالات قريبة من العتبة (تحتاج مراجعة بصرية على المصحف المطبوع): {len(notes)}")
        for kind, num, sa, xy, v, why in notes:
            name = "سورة" if kind == "surah" else "ربع"
            print(f"    {name} {num:<4} الآية {sa[0]}:{sa[1]:<4} علامة السابقة (x={xy[0]},y={xy[1]}) → صفحة {v} ({why})")
        if not notes:
            print("    لا شيء — كل الحالات بعيدة عن العتبات.")

    if errors:
        print("\nفشل التحقق:")
        for e in errors:
            print("  ✗ " + e)
        return 1

    if not prev_ed:
        print("  ! لا توجد بيانات شمرلي محفوظة للمقارنة")
    elif not diffs:
        print("  ✓ مطابق تمامًا لما في data/editions.json")
    else:
        print("  ✗ يختلف عن data/editions.json:")
        for d in diffs:
            print("      - " + d)

    if a.write:
        if diffs and not a.force:
            print("\n✗ لن أكتب فوق بيانات مختلفة بدون --force")
            return 1
        all_ed["shamarly"] = ed
        with io.open(DATA, "w", encoding="utf-8", newline="\n") as f:
            f.write(json.dumps(all_ed, ensure_ascii=False, indent=1) + "\n")
        print("  ✓ كُتبت data/editions.json — شغّل python3 tools/build.py بعدها")
    elif diffs:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
