#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
بناء `index.html` (ملف واحد مستقل) من المصادر في `src/` + `data/editions.json`.

    python3 tools/build.py            # يبني ويكتب الملفات
    python3 tools/build.py --check    # يبني في الذاكرة ويقارن بالملف الموجود (لـCI)

الملفات الناتجة:
    index.html            كل الـHTML والـCSS والـJS والبيانات في ملف واحد
    manifest.webmanifest  بيانات التثبيت كتطبيق (PWA)
    sw.js                 service worker للتشغيل دون اتصال
    icons/icon.svg        أيقونة التطبيق (SVG فقط — لا ملفات ثنائية في المستودع)

لا تعدّل `index.html` يدويًا أبدًا: هو ناتج بناء ويُستبدل بالكامل في كل مرة.
"""
from __future__ import annotations

import hashlib
import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_HTML = os.path.join(ROOT, "src", "index.html")
SRC_CSS = os.path.join(ROOT, "src", "styles.css")
SRC_JS = os.path.join(ROOT, "src", "app.js")
SRC_DATA = os.path.join(ROOT, "data", "editions.json")

OUT_HTML = os.path.join(ROOT, "index.html")
OUT_MANIFEST = os.path.join(ROOT, "manifest.webmanifest")
OUT_SW = os.path.join(ROOT, "sw.js")
OUT_ICON = os.path.join(ROOT, "icons", "icon.svg")

APP_NAME = "رحلتي مع القرآن"
APP_SHORT = "رحلتي"
THEME_COLOR = "#edf0ee"
BG_COLOR = "#edf0ee"

errors: list[str] = []
warnings: list[str] = []


def fail(msg: str) -> None:
    errors.append(msg)


def warn(msg: str) -> None:
    warnings.append(msg)


def read(path: str) -> str:
    with io.open(path, encoding="utf-8") as f:
        return f.read()


def write(path: str, text: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with io.open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


# --------------------------------------------------------------------------- #
# التحقق من بيانات الطبعات
# --------------------------------------------------------------------------- #
REQ_KEYS = ("label", "short", "N", "P0", "SS", "SE", "RS", "RE", "JS", "JE")
COUNTS = {"SS": 114, "SE": 114, "RS": 240, "RE": 240, "JS": 30, "JE": 30}


def validate(data: dict) -> None:
    if not isinstance(data, dict) or not data:
        fail("editions.json ليس قاموسًا أو فارغ")
        return
    if "madinah" not in data:
        fail("لا توجد طبعة 'madinah' (الطبعة الافتراضية الأولى في الترتيب)")
    if "shamarly" not in data:
        warn("لا توجد طبعة 'shamarly'")

    for key, ed in data.items():
        tag = f"[{key}]"
        missing = [k for k in REQ_KEYS if k not in ed]
        if missing:
            fail(f"{tag} ينقصه الحقول: {', '.join(missing)}")
            continue
        n, p0 = int(ed["N"]), int(ed["P0"])
        if not (1 <= p0 <= 3):
            fail(f"{tag} P0={p0} غير منطقي (1 = الفاتحة في أول صفحة، 2 = أول صفحة غلاف)")
        if n < 100:
            fail(f"{tag} N={n} صغير جدًا")
        pages = n - p0 + 1
        if not (300 <= pages <= 900):
            warn(f"{tag} عدد صفحات القراءة {pages} خارج النطاق المعتاد للمصاحف")

        for k, want in COUNTS.items():
            arr = ed[k]
            if not isinstance(arr, list) or len(arr) != want:
                fail(f"{tag} {k} يجب أن يكون مصفوفة من {want} عنصرًا، الموجود {len(arr) if isinstance(arr, list) else type(arr).__name__}")

        def monotonic(name: str, lo: int, hi: int) -> list[int]:
            arr = ed[name]
            out = []
            for i, v in enumerate(arr):
                if not isinstance(v, int) or not (lo <= v <= hi):
                    fail(f"{tag} {name}[{i}]={v!r} خارج النطاق {lo}..{hi}")
                    return out
                out.append(v)
            for i in range(1, len(out)):
                if out[i] < out[i - 1]:
                    fail(f"{tag} {name} ليست غير-متناقصة عند {i}: {out[i-1]} → {out[i]}")
                    break
            return out

        ss = monotonic("SS", p0, n)
        se = monotonic("SE", p0, n)
        rs = monotonic("RS", p0, n)
        re_ = monotonic("RE", p0, n)
        js = monotonic("JS", p0, n)
        je = monotonic("JE", p0, n)
        if len(ss) != 114 or len(se) != 114:
            continue

        if ss[0] != p0:
            fail(f"{tag} الفاتحة يجب أن تبدأ من الصفحة {p0}، الموجود {ss[0]}")
        if se[113] != n:
            fail(f"{tag} الناس يجب أن تنتهي في الصفحة {n}، الموجود {se[113]}")
        for i in range(114):
            if se[i] < ss[i]:
                fail(f"{tag} السورة {i+1}: النهاية {se[i]} قبل البداية {ss[i]}")
            if i and ss[i] < se[i - 1]:
                fail(f"{tag} السورة {i+1} تبدأ {ss[i]} قبل نهاية السابقة {se[i-1]}")
        for i in range(240):
            if re_[i] < rs[i]:
                fail(f"{tag} الربع {i+1}: النهاية {re_[i]} قبل البداية {rs[i]}")
        for i in range(30):
            if je[i] < js[i]:
                fail(f"{tag} الجزء {i+1}: النهاية {je[i]} قبل البداية {js[i]}")
        if js[0] != p0:
            fail(f"{tag} الجزء الأول يجب أن يبدأ من الصفحة {p0}، الموجود {js[0]}")
        if je[29] != n:
            fail(f"{tag} الجزء الثلاثون يجب أن ينتهي في الصفحة {n}، الموجود {je[29]}")
        if rs[0] != p0 or re_[239] != n:
            fail(f"{tag} الأرباع يجب أن تغطي من {p0} إلى {n}، الموجود {rs[0]}..{re_[239]}")

        if not ed["label"].strip() or not ed["short"].strip():
            fail(f"{tag} label/short فارغان")

    # حدود معروفة من المصاحف المطبوعة
    anchors = {
        "madinah": {"N": 604, "P0": 1, "kahf": (293, 304), "juz28": 542, "juz29": 562, "juz30": 582},
        "shamarly": {"N": 522, "P0": 2, "kahf": (243, 253), "juz28": 459, "juz29": 478, "juz30": 498},
    }
    for key, a in anchors.items():
        if key not in data:
            continue
        ed = data[key]
        tag = f"[{key}]"
        if int(ed["N"]) != a["N"] or int(ed["P0"]) != a["P0"]:
            fail(f"{tag} متوقع N={a['N']} P0={a['P0']}، الموجود N={ed['N']} P0={ed['P0']}")
            continue
        if (ed["SS"][17], ed["SE"][17]) != tuple(a["kahf"]):
            fail(f"{tag} الكهف متوقع {a['kahf']}، الموجود {(ed['SS'][17], ed['SE'][17])}")
        for j, want in (("juz28", a["juz28"]), ("juz29", a["juz29"]), ("juz30", a["juz30"])):
            got = ed["JS"][int(j[-2:]) - 1]
            if got != want:
                fail(f"{tag} {j} متوقع صفحة {want}، الموجود {got}")


# --------------------------------------------------------------------------- #
# نواتج PWA
# --------------------------------------------------------------------------- #
ICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="رحلتي مع القرآن">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1f8a76"/>
      <stop offset="1" stop-color="#12564c"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <path d="M144 144h224v224H144z M414.4 256 256 97.6 97.6 256 256 414.4z"
        fill="none" stroke="#f2fbf8" stroke-width="22" stroke-linejoin="round"/>
  <circle cx="256" cy="256" r="34" fill="#f2fbf8"/>
</svg>
"""


def manifest_json(version: str) -> str:
    return json.dumps(
        {
            "name": APP_NAME,
            "short_name": APP_SHORT,
            "description": "لوحة متابعة شخصية لقراءة القرآن وختماته — تعمل دون اتصال وبياناتك تبقى في متصفحك.",
            "lang": "ar",
            "dir": "rtl",
            "start_url": ".",
            "scope": ".",
            "display": "standalone",
            "orientation": "portrait-primary",
            "background_color": BG_COLOR,
            "theme_color": THEME_COLOR,
            "categories": ["books", "utilities"],
            "version": version,
            "icons": [
                {"src": "icons/icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any"},
                {"src": "icons/icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "maskable"},
            ],
        },
        ensure_ascii=False,
        indent=2,
    ) + "\n"


def sw_js(version: str) -> str:
    # ملاحظة: القائمة relative عشان يشتغل على أي مسار (Vercel، GitHub Pages، مجلد محلي).
    return """/* service worker — ناتج بناء، لا تعدّله يدويًا (المصدر: tools/build.py) */
var CACHE = 'quran-rt-' + %r;
var SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon.svg'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* كل شيء من الكاش أولًا: التطبيق بلا أي طلب شبكة بعد أول تحميل. */
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
        return res;
      }).catch(function () { return caches.match('./index.html'); });
    })
  );
});
""" % version


# --------------------------------------------------------------------------- #
# البناء
# --------------------------------------------------------------------------- #
def build() -> dict[str, str]:
    html = read(SRC_HTML)
    css = read(SRC_CSS)
    js = read(SRC_JS)
    with io.open(SRC_DATA, encoding="utf-8") as f:
        data = json.load(f)

    validate(data)

    if "__DATA__" not in js:
        fail("src/app.js لا يحتوي على العلامة __DATA__")
    if "</script" in js.lower():
        fail("src/app.js يحتوي على </script — يكسر الحقن داخل وسم <script>")
    if "</style" in css.lower():
        fail("src/styles.css يحتوي على </style — يكسر الحقن داخل وسم <style>")

    payload = json.dumps(data, separators=(",", ":"), ensure_ascii=False)
    if "</" in payload:
        # لا يحدث مع هذه البيانات، لكن الحقن الآمن يستحق سطرًا واحدًا
        payload = payload.replace("</", "<\\/")
    js = js.replace("__DATA__", payload, 1)
    if "__DATA__" in js:
        fail("لم يُستبدل __DATA__ بالكامل")

    link = '<link rel="stylesheet" href="styles.css">'
    script = '<script src="app.js"></script>'
    if link not in html:
        fail(f"src/index.html لا يحتوي على {link}")
    if script not in html:
        fail(f"src/index.html لا يحتوي على {script}")

    out = html.replace(link, "<style>\n" + css.rstrip("\n") + "\n</style>", 1)
    out = out.replace(script, "<script>\n" + js.rstrip("\n") + "\n</script>", 1)

    if "styles.css" in out or "app.js" in out:
        fail("بقيت إشارة إلى ملف خارجي بعد الحقن")

    version = hashlib.sha1((out + payload).encode("utf-8")).hexdigest()[:12]
    return {
        "index.html": out,
        "manifest.webmanifest": manifest_json(version),
        "sw.js": sw_js(version),
        "icons/icon.svg": ICON_SVG,
        "_version": version,
    }


def main(argv: list[str]) -> int:
    check = "--check" in argv
    files = build()
    version = files.pop("_version")

    if errors:
        print("فشل البناء:")
        for e in errors:
            print("  ✗ " + e)
        return 1

    if check:
        dirty = []
        for name, content in files.items():
            path = os.path.join(ROOT, name)
            if not os.path.exists(path):
                dirty.append(name + " (مفقود)")
            elif read(path) != content:
                dirty.append(name + " (مختلف)")
        if dirty:
            print("الملفات المبنية غير محدّثة: " + ", ".join(dirty))
            print("شغّل: python3 tools/build.py")
            return 1
        print(f"✓ الملفات المبنية محدّثة ({version})")
    else:
        for name, content in files.items():
            write(os.path.join(ROOT, name), content)
            print(f"  ✓ {name:<22} {len(content.encode('utf-8')):>8,} بايت")
        print(f"✓ تم البناء — النسخة {version}")

    for w in warnings:
        print("  ! " + w)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
