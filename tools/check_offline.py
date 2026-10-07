#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
يتأكد أن `index.html` **ملف واحد مستقل تمامًا**: لا خطوط ولا مكتبات ولا صور ولا
طلبات شبكة من أي نوع. كل ما يُسمح به هو `data:` URIs (وهي جزء من الملف نفسه).

    python3 tools/check_offline.py            # يفحص index.html
    python3 tools/check_offline.py src/index.html src/styles.css src/app.js
"""
from __future__ import annotations

import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# أسماء نطاقات مسموح ظهورها كنص فقط (xmlns، معرّفات) لا كطلبات
TEXT_ONLY = ("www.w3.org/2000/svg", "www.w3.org/1999/xhtml", "schema.org")


def scan(path: str) -> list[str]:
    with io.open(path, encoding="utf-8") as f:
        s = f.read()
    bad: list[str] = []

    # 1) src / href / action / poster / data
    for m in re.finditer(r'(?:src|href|action|poster|data)\s*=\s*(?:"([^"]*)"|\'([^\']*)\')', s):
        u = m.group(1) or m.group(2) or ""
        if not u or u.startswith(("#", "data:", "mailto:", "javascript:void")):
            continue
        if u.startswith(("http://", "https://", "//")):
            if any(t in u for t in TEXT_ONLY):
                continue
            bad.append(f"{path}: وسم يشير إلى {u}")
        elif re.match(r'^[\w./-]+\.(css|js|mjs|woff2?|ttf|otf|png|jpe?g|gif|webp)$', u):
            # ملفات src/ هي مصدر التطوير ومن الطبيعي أن تشير لبعضها؛
            # القاعدة دي على الناتج النهائي index.html بس.
            if os.sep + "src" + os.sep not in path:
                bad.append(f"{path}: مرجع لملف خارجي {u} — المفروض يكون مضمّنًا في الملف الواحد")

    # 2) @import و url() في CSS
    for m in re.finditer(r'@import\s+[^;]+;', s):
        bad.append(f"{path}: @import — {m.group(0)[:80]}")
    for m in re.finditer(r'url\(\s*(?:"|\')?([^)"\']+)', s):
        u = m.group(1).strip()
        if u.startswith("data:"):
            continue
        if any(t in u for t in TEXT_ONLY):
            continue
        bad.append(f"{path}: url() خارجي — {u[:80]}")

    # 3) fetch / XHR / WebSocket / importScripts / EventSource في JS
    for pat, name in ((r'\bfetch\s*\(', "fetch"), (r'new\s+XMLHttpRequest', "XMLHttpRequest"),
                      (r'new\s+WebSocket', "WebSocket"), (r'\bimportScripts\s*\(', "importScripts"),
                      (r'new\s+EventSource', "EventSource"), (r'navigator\.sendBeacon', "sendBeacon")):
        for m in re.finditer(pat, s):
            line = s.count("\n", 0, m.start()) + 1
            bad.append(f"{path}:{line}: استعمال {name} — التطبيق يجب ألا يطلب الشبكة")

    # 4) روابط <link> و<script src> في ناتج البناء
    if os.path.basename(path) == "index.html" and path.endswith(os.path.join(ROOT, "index.html")):
        if re.search(r'<link[^>]+rel\s*=\s*"stylesheet"', s):
            bad.append(f"{path}: <link rel=stylesheet> — الـCSS يجب أن يكون مضمّنًا")
        if re.search(r'<script[^>]+\bsrc\s*=', s):
            bad.append(f"{path}: <script src> — الـJS يجب أن يكون مضمّنًا")
        if "__DATA__" in s:
            bad.append(f"{path}: ما زالت العلامة __DATA__ موجودة (البناء لم يستبدلها)")

    return bad


def main(argv: list[str]) -> int:
    targets = argv or [os.path.join(ROOT, "index.html")]
    allbad: list[str] = []
    for t in targets:
        p = t if os.path.isabs(t) else os.path.join(ROOT, t)
        if not os.path.exists(p):
            allbad.append(f"{t}: الملف غير موجود")
            continue
        allbad += scan(p)
    if allbad:
        print("✗ التطبيق ليس مستقلًا تمامًا:")
        for b in allbad:
            print("  - " + b)
        return 1
    print(f"✓ لا موارد خارجية في {len(targets)} ملف — التطبيق يعمل دون اتصال ومن file://")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
