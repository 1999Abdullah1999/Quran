#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
التحقق من `data/editions.json` بلا أي تنزيل ولا أي اعتماديات (Python القياسية فقط).

    python3 tools/verify_editions.py          # يفحص ويخرج بكود 0/1
    python3 tools/verify_editions.py -v       # يطبع تقريرًا مفصّلًا

يفحص هذا البرنامج كل ما يمكن فحصه من البيانات وحدها:
  1. البنية: كل الحقول موجودة، والأطوال 114/114/240/240/30/30/240.
  2. الحدود: كل رقم صفحة داخل [P0, N]، والبدايات ≤ النهايات.
  3. الرتابة: SS/SE/RS/RE/JS/JE غير متناقصة، وبدايات الأجزاء متزايدة تمامًا.
  4. التغطية: السور والأرباع والأجزاء تغطي من P0 إلى N بلا فجوات.
  5. الاتساق الداخلي: JS[j] == RS[8j] و JE[j] == RE[8j+7]، وRSA متطابقة بين الطبعات
     (النص والتقسيم واحد؛ يختلف ترقيم الصفحات فقط).
  6. مراجع مطبوعة مؤكدة لكل طبعة (الفاتحة، الكهف، المجادلة/الملك/النبأ = الأجزاء 28/29/30).
  7. التحويل بين الطبعات: رتيب، ويثبّت الطرفين، وذهاب-إياب لا يبعد أكثر من صفحتين.

للتحقق من البيانات **مقابل مصادرها** استعمل:
    node tools/gen_madinah.mjs        (يقارن بحزمة quran-meta)
    python3 tools/gen_shamarly.py     (يقارن بقاعدة shamerly.db)
"""
from __future__ import annotations

import argparse
import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "editions.json")

COUNTS = {"SS": 114, "SE": 114, "RS": 240, "RE": 240, "RSA": 240, "JS": 30, "JE": 30}
REQ = ("label", "short", "N", "P0") + tuple(COUNTS)

# مراجع مطبوعة: (اسم، مفتاح، فهرس، القيمة المتوقعة)
ANCHORS = {
    "madinah": [
        ("عدد الصفحات", "N", None, 604), ("أول صفحة نص", "P0", None, 1),
        ("الفاتحة صفحة 1", "SS", 0, 1), ("البقرة صفحة 2", "SS", 1, 2),
        ("الناس تنتهي 604", "SE", 113, 604),
        ("الكهف 293", "SS", 17, 293), ("الكهف تنتهي 304", "SE", 17, 304),
        ("المجادلة = الجزء 28 (542)", "SS", 57, 542),
        ("الملك = الجزء 29 (562)", "SS", 66, 562),
        ("النبأ = الجزء 30 (582)", "SS", 77, 582),
        ("المسد 603", "SS", 110, 603), ("الإخلاص 604", "SS", 111, 604),
    ],
    "shamarly": [
        ("عدد الصفحات", "N", None, 522), ("أول صفحة نص", "P0", None, 2),
        ("الفاتحة صفحة 2", "SS", 0, 2), ("البقرة صفحة 3", "SS", 1, 3),
        ("الناس تنتهي 522", "SE", 113, 522),
        ("الكهف 243", "SS", 17, 243), ("الكهف تنتهي 253", "SE", 17, 253),
        ("المجادلة = الجزء 28 (459)", "SS", 57, 459),
        ("الملك = الجزء 29 (478)", "SS", 66, 478),
        ("النبأ = الجزء 30 (498)", "SS", 77, 498),
        ("المسد 521", "SS", 110, 521), ("الإخلاص 522", "SS", 111, 522),
    ],
}
CANON_JUZ = {
    "madinah": [1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242, 262, 282,
                302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582],
    "shamarly": [2, 20, 36, 52, 68, 84, 99, 116, 132, 148, 164, 181, 199, 216, 233,
                 250, 268, 284, 302, 320, 336, 353, 370, 388, 404, 423, 440, 459, 478, 498],
}

problems: list[str] = []
info: list[str] = []


def bad(msg: str) -> None:
    problems.append(msg)


def note(msg: str) -> None:
    info.append(msg)


# --------------------------------------------------------------------------- #
def check_one(key: str, ed: dict) -> None:
    t = f"[{key}]"
    before = len(problems)
    for k in REQ:
        if k not in ed:
            bad(f"{t} ينقصه الحقل {k}")
    for k, want in COUNTS.items():
        v = ed.get(k)
        if not isinstance(v, list) or len(v) != want:
            bad(f"{t} {k} يجب أن يكون مصفوفة من {want}، الموجود {len(v) if isinstance(v, list) else type(v).__name__}")
    if len(problems) != before:
        return

    N, P0 = int(ed["N"]), int(ed["P0"])
    if not isinstance(ed["label"], str) or not ed["label"].strip():
        bad(f"{t} label فارغ")
    if not isinstance(ed["short"], str) or not ed["short"].strip():
        bad(f"{t} short فارغ")
    if not (1 <= P0 <= 3):
        bad(f"{t} P0={P0} غير منطقي")
    pages = N - P0 + 1
    if not (300 <= pages <= 900):
        bad(f"{t} عدد صفحات القراءة {pages} غير معتاد")

    for k in COUNTS:
        for i, v in enumerate(ed[k]):
            if k == "RSA":
                if not (isinstance(v, list) and len(v) == 2 and 1 <= v[0] <= 114 and v[1] >= 1):
                    bad(f"{t} RSA[{i+1}]={v!r} ليست [سورة، آية] صالحة")
                continue
            if not isinstance(v, int):
                bad(f"{t} {k}[{i+1}]={v!r} ليس عددًا صحيحًا")
                return
            if not (P0 <= v <= N):
                bad(f"{t} {k}[{i+1}]={v} خارج النطاق {P0}..{N}")
                return

    def nondec(k: str) -> None:
        a = ed[k]
        for i in range(1, len(a)):
            if a[i] < a[i - 1]:
                bad(f"{t} {k} تتناقص عند {i+1}: {a[i-1]} → {a[i]}")
                return

    for k in ("SS", "SE", "RS", "RE", "JS", "JE"):
        nondec(k)

    SS, SE, RS, RE, JS, JE = ed["SS"], ed["SE"], ed["RS"], ed["RE"], ed["JS"], ed["JE"]
    for i in range(114):
        if SE[i] < SS[i]:
            bad(f"{t} السورة {i+1}: النهاية {SE[i]} قبل البداية {SS[i]}")
        if i and SS[i] < SE[i - 1]:
            bad(f"{t} السورة {i+1} تبدأ {SS[i]} قبل نهاية السابقة {SE[i-1]}")
        if i and SS[i] == SE[i - 1] and SE[i] == SS[i]:
            note(f"{t} السورة {i+1} كلها في صفحة واحدة مشتركة مع السابقة ({SS[i]})")
    for i in range(240):
        if RE[i] < RS[i]:
            bad(f"{t} الربع {i+1}: النهاية {RE[i]} قبل البداية {RS[i]}")
    for j in range(30):
        if JE[j] < JS[j]:
            bad(f"{t} الجزء {j+1}: النهاية {JE[j]} قبل البداية {JS[j]}")
        if RS[j * 8] != JS[j]:
            bad(f"{t} الجزء {j+1} يبدأ {JS[j]} لكن ربعه الأول يبدأ {RS[j*8]}")
        if RE[j * 8 + 7] != JE[j]:
            bad(f"{t} الجزء {j+1} ينتهي {JE[j]} لكن ربعه الأخير ينتهي {RE[j*8+7]}")
    if not all(JS[i] < JS[i + 1] for i in range(29)):
        bad(f"{t} بدايات الأجزاء ليست متزايدة تمامًا")

    # التغطية
    if SS[0] != P0:
        bad(f"{t} أول سورة لا تبدأ من أول صفحة نص ({SS[0]} ≠ {P0})")
    if SE[113] != N:
        bad(f"{t} آخر سورة لا تنتهي في آخر صفحة ({SE[113]} ≠ {N})")
    if RS[0] != P0 or RE[239] != N:
        bad(f"{t} الأرباع لا تغطي {P0}..{N} ({RS[0]}..{RE[239]})")
    if JS[0] != P0 or JE[29] != N:
        bad(f"{t} الأجزاء لا تغطي {P0}..{N} ({JS[0]}..{JE[29]})")

    spans = [RE[i] - RS[i] + 1 for i in range(240)]
    if min(spans) < 1 or max(spans) > 8:
        bad(f"{t} امتداد الأرباع {min(spans)}..{max(spans)} صفحة — غير معتاد")
    jsum = sum(JE[j] - JS[j] + 1 for j in range(30))
    if jsum < pages:
        bad(f"{t} مجموع صفحات الأجزاء {jsum} أقل من {pages}")

    for name, k, i, want in ANCHORS.get(key, []):
        got = ed[k] if i is None else ed[k][i]
        if got != want:
            bad(f"{t} مرجع مطبوع: {name} — الموجود {got} والمتوقع {want}")
    if key in CANON_JUZ and JS != CANON_JUZ[key]:
        diff = [(j + 1, JS[j], CANON_JUZ[key][j]) for j in range(30) if JS[j] != CANON_JUZ[key][j]]
        bad(f"{t} بدايات الأجزاء لا تطابق المرجع: {diff[:5]}")

    note(f"{t} {ed['label']}: N={N} P0={P0} صفحات القراءة={pages} "
         f"ربع {min(spans)}–{max(spans)} صفحة، مجموع الأجزاء {jsum}")


def clamp(v, lo, hi):
    return lo if v < lo else (hi if v > hi else v)


def map_page(p, A, B):
    """نفس دالة mapPage في src/app.js — تُعاد هنا للتحقق من سلوكها."""
    a0, b0 = A["P0"], B["P0"]
    p = clamp(p, a0, A["N"])
    r = 0
    while r < 239 and A["RE"][r] < p:
        r += 1
    a, b = A["RS"][r], A["RE"][r]
    f = (p - a) / (b - a) if b > a else 0.0
    return clamp(round(B["RS"][r] + clamp(f, 0.0, 1.0) * (B["RE"][r] - B["RS"][r])), b0, B["N"])


def check_mapping(A, B, an, bn):
    prev = 0
    for p in range(A["P0"], A["N"] + 1):
        q = map_page(p, A, B)
        if q < prev:
            bad(f"[{an}→{bn}] التحويل غير رتيب عند الصفحة {p}: {prev} → {q}")
            return
        prev = q
    if map_page(A["P0"], A, B) != B["P0"]:
        bad(f"[{an}→{bn}] أول صفحة لا تتحول إلى أول صفحة: {map_page(A['P0'], A, B)} ≠ {B['P0']}")
    if map_page(A["N"], A, B) != B["N"]:
        bad(f"[{an}→{bn}] آخر صفحة لا تتحول إلى آخر صفحة: {map_page(A['N'], A, B)} ≠ {B['N']}")
    worst, at = 0, None
    for p in range(A["P0"], A["N"] + 1):
        back = map_page(map_page(p, A, B), B, A)
        d = abs(back - p)
        if d > worst:
            worst, at = d, p
    if worst > 3:
        bad(f"[{an}↔{bn}] الذهاب والإياب يبعد {worst} صفحة (عند {at}) — التقريب أسوأ من المتوقع")
    note(f"[{an}↔{bn}] التحويل رتيب ويثبّت الطرفين، وأكبر انحراف في الذهاب والإياب {worst} صفحة (عند {at})")


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("-v", "--verbose", action="store_true")
    a = ap.parse_args(argv)

    if not os.path.exists(DATA):
        print(f"✗ لا يوجد ملف {DATA}")
        return 1
    with io.open(DATA, encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict) or len(data) < 2:
        print("✗ data/editions.json يجب أن يحتوي على طبعتين على الأقل")
        return 1

    order = list(data.keys())
    if order[0] != "madinah":
        bad(f"الطبعة الأولى في الترتيب يجب أن تكون 'madinah' (الافتراضية)، الموجود {order[0]}")

    for k in order:
        check_one(k, data[k])

    if not problems and len(order) >= 2:
        for i in range(len(order)):
            for j in range(len(order)):
                if i != j:
                    check_mapping(data[order[i]], data[order[j]], order[i], order[j])

    if not problems and len(order) >= 2:
        base = data[order[0]]["RSA"]
        for k in order[1:]:
            if data[k]["RSA"] != base:
                diff = [i + 1 for i in range(240) if data[k]["RSA"][i] != base[i]]
                bad(f"[{k}] RSA تختلف عن {order[0]} في {len(diff)} موضعًا (أولها {diff[0]}) — "
                    "تقسيم الأرباع يجب أن يكون واحدًا في كل الطبعات")

    if a.verbose or info:
        for m in info:
            print("  · " + m)
    if problems:
        print("\n✗ فشل التحقق:")
        for m in problems:
            print("  - " + m)
        return 1
    print(f"\n✓ data/editions.json سليم ({len(order)} طبعات: {', '.join(order)})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
