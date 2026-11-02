#!/usr/bin/env python3
"""Fetch ALL Dependabot alerts (any state) from GitHub and summarize.

Usage: python3 scripts/fetch-dependabot-alerts.py [--state open]
Writes raw JSON to /tmp/dependabot-alerts-all.json for downstream analysis.
Never prints the token.
"""
import json
import os
import subprocess
import sys
import urllib.request

REPO = "getleads-humain/Lead-Reach"


def get_token():
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line.startswith("GITHUB_TOKEN="):
                return line.split("=", 1)[1].strip()
    raise SystemExit("GITHUB_TOKEN not found in .env")


def fetch_page(token, state, page):
    url = (
        f"https://api.github.com/repos/{REPO}/dependabot/alerts"
        f"?state={state}&per_page=100&page={page}"
    )
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "leadreach-audit-script",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def main():
    state = "open"
    if "--state" in sys.argv:
        state = sys.argv[sys.argv.index("--state") + 1]
    token = get_token()
    alerts = []
    page = 1
    while True:
        batch = fetch_page(token, state, page)
        if not batch:
            break
        alerts.extend(batch)
        if len(batch) < 100:
            break
        page += 1
        if page > 10:
            break

    out = f"/tmp/dependabot-alerts-{state}.json"
    with open(out, "w") as f:
        json.dump(alerts, f)

    sev = {}
    manifests = {}
    pkgs = {}
    no_fix = []
    for a in alerts:
        s = a["security_vulnerability"]["severity"].lower()
        sev[s] = sev.get(s, 0) + 1
        mp = a["dependency"]["manifest_path"]
        manifests[mp] = manifests.get(mp, 0) + 1
        name = a["security_vulnerability"]["package"]["name"]
        key = (mp, name)
        pkgs[key] = pkgs.get(key, 0) + 1
        fpv = a["security_vulnerability"].get("first_patched_version")
        if fpv is None:
            no_fix.append(f"{mp} :: {name} ({s})")

    print(f"STATE={state} TOTAL={len(alerts)}")
    print("BY_SEVERITY:", json.dumps(sev, sort_keys=True))
    print("BY_MANIFEST:", json.dumps(manifests, sort_keys=True))
    print("UNIQUE (manifest,package):", len(pkgs))
    print("--- PACKAGES (sorted by count) ---")
    for (mp, name), cnt in sorted(pkgs.items(), key=lambda kv: -kv[1]):
        print(f"{cnt:4d}  {mp}  {name}")
    if no_fix:
        print("--- NO PATCHED VERSION AVAILABLE ---")
        for x in sorted(set(no_fix)):
            print("  ", x)
    print("RAW:", out)


if __name__ == "__main__":
    main()
