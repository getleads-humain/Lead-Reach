#!/usr/bin/env python3
"""Analyze /tmp/audit.json (npm audit --json output) into an actionable plan.

Groups vulnerabilities by package, shows: severity, direct/transitive, whether
a fix is available, fixed versions, and which paths bring the package in.
"""
import json
from collections import defaultdict

d = json.load(open("/tmp/audit.json"))
vulns = d.get("vulnerabilities", {})

# Build the dependency tree of names for path classification
rows = []
for name, v in vulns.items():
    fix = v.get("fixAvailable")
    if isinstance(fix, dict):
        fix_desc = f"{fix['name']}@{fix['version']} (isSemVerMajor={fix.get('isSemVerMajor')})"
    else:
        fix_desc = str(fix)
    via = v.get("via", [])
    advisories = [x for x in via if isinstance(x, dict)]
    effects = sorted(v.get("effects", []))
    severity = v["severity"]
    direct = v.get("isDirect", False)
    rows.append({
        "name": name,
        "severity": severity,
        "range": v.get("range"),
        "direct": direct,
        "effects": effects,
        "nodes": len(v.get("nodes", [])),
        "fix": fix_desc,
        "advisories": [(a.get("severity"), a.get("title", "")[:60], a.get("url", "")) for a in advisories],
    })

sev_rank = {"critical": 0, "high": 1, "moderate": 2, "low": 3}
rows.sort(key=lambda r: (sev_rank.get(r["severity"], 9), not r["direct"], r["name"]))

print(f"{'PKG':38} {'SEV':9} {'DIR':3} {'NODES':5} FIX")
print("=" * 130)
for r in rows:
    print(f"{r['name']:38} {r['severity']:9} {'Y' if r['direct'] else '-':3} {r['nodes']:<5} {r['fix']}")
    for a in r["advisories"]:
        print(f"     - [{a[0]}] {a[1]}  {a[2]}")

print()
print("=== SUMMARY ===")
cnt = defaultdict(int)
for r in rows:
    cnt[r["severity"]] += 1
print(dict(cnt))
direct_fixable = [r["name"] for r in rows if r["direct"]]
print("direct deps affected:", direct_fixable)
no_fix = [r["name"] for r in rows if r["fix"] == "None"]
print("NO FIX AVAILABLE:", no_fix)
