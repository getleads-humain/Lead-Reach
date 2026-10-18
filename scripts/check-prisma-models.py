#!/usr/bin/env python3
"""Compare db.<model> usages in src/ against models defined in prisma/schema.prisma."""
import re, os, subprocess, collections

schema = open('/home/z/my-project/prisma/schema.prisma').read()
defined = set(m.lower() for m in re.findall(r'^model\s+(\w+)', schema, re.M))

usage = collections.Counter()
files = collections.defaultdict(set)
for root, dirs, fnames in os.walk('/home/z/my-project/src'):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.next')]
    for fn in fnames:
        if not fn.endswith(('.ts', '.tsx')):
            continue
        p = os.path.join(root, fn)
        try:
            src = open(p, encoding='utf-8', errors='ignore').read()
        except Exception:
            continue
        for m in re.finditer(r'\bdb\.(\w+)\.', src):
            model = m.group(1)
            usage[model] += 1
            files[model].add(os.path.relpath(p, '/home/z/my-project'))

missing = {m: (c, sorted(files[m])) for m, c in usage.items() if m.lower() not in defined}
print("DEFINED MODELS (%d):" % len(defined))
print("MISSING MODELS USED IN CODE:")
for m, (c, fs) in sorted(missing.items(), key=lambda x: -x[1][0]):
    print(f"  {m}  ({c} refs) in:")
    for f in fs[:6]:
        print(f"     - {f}")
if not missing:
    print("  NONE — all models present")
