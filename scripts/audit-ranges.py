#!/usr/bin/env python3
"""Extract exact vulnerable ranges + fix targets from /tmp/audit.json."""
import json

d = json.load(open("/tmp/audit.json"))
vulns = d.get("vulnerabilities", {})

interesting = [
    "js-yaml", "minimatch", "postcss", "nanoid", "source-map-js",
    "brace-expansion", "browserslist", "deepmerge-ts", "baseline-browser-mapping",
    "next", "next-auth", "dompurify", "zod", "prisma", "@prisma/config",
    "sharp", "xlsx", "eslint", "@mdxeditor/editor", "typescript-eslint",
]
print("=== EXACT RANGES AND FIX TARGETS ===")
for name in interesting:
    v = vulns.get(name)
    if not v:
        print(f"\n[{name}] not flagged")
        continue
    print(f"\n[{name}] sev={v['severity']} direct={v.get('isDirect')} range={v.get('range')}")
    fix = v.get("fixAvailable")
    print(f"  fixAvailable: {fix}")
    for x in v.get("via", []):
        if isinstance(x, dict):
            print(f"  ADV: {x.get('title','')[:70]} | vulnerable_range: {x.get('range')}")
        else:
            print(f"  VIA: {x}")
    if v.get("effects"):
        print(f"  effects(children): {v['effects']}")

print("\n=== ALL FLAGGED PACKAGE NAMES ===")
print(sorted(vulns.keys()))
