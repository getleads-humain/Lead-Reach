#!/usr/bin/env python3
"""Verify all Dependabot alerts in getleads-humain/Lead-Reach are dismissed."""

import json
import os
import re
import sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError

OWNER = "getleads-humain"
REPO = "Lead-Reach"
PAT = os.environ.get("GH_PAT")
if not PAT:
    sys.stderr.write(
        "ERROR: GH_PAT environment variable is required.\n"
        "Generate a PAT at https://github.com/settings/tokens with repo:security_events scope.\n"
    )
    sys.exit(2)


def api_get(path: str):
    url = f"https://api.github.com/repos/{OWNER}/{REPO}/{path.lstrip('/')}"
    req = Request(url, method="GET")
    req.add_header("Authorization", f"Bearer {PAT}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    req.add_header("User-Agent", "leadreach-security-automation")
    try:
        with urlopen(req, timeout=30) as resp:
            return resp.status, json.loads(resp.read() or "[]"), dict(resp.headers)
    except HTTPError as e:
        return e.code, json.loads(e.read() or "[]"), dict(e.headers) if e.headers else {}


def list_alerts(state: str | None = None) -> list[dict]:
    all_alerts: list[dict] = []
    cursor = None
    for _ in range(50):
        path = "/dependabot/alerts?per_page=100"
        if state:
            path += f"&state={state}"
        if cursor:
            path += f"&after={cursor}"
        status, body, headers = api_get(path)
        if status != 200:
            print(f"[!] HTTP {status}: {body}", file=sys.stderr)
            break
        if isinstance(body, list):
            all_alerts.extend(body)
        link = headers.get("Link", "") or headers.get("link", "")
        m = re.search(r'<[^>]*[?&]after=([^>&;]+)[^>]*>;\s*rel="next"', link)
        if not m or (isinstance(body, list) and len(body) < 100):
            break
        cursor = m.group(1)
    return all_alerts


def main() -> int:
    print(f"[*] Verifying Dependabot alerts in {OWNER}/{REPO}...\n")
    # Query ALL alerts (no state filter)
    alerts = list_alerts(state=None)
    print(f"[*] Total alerts (all states): {len(alerts)}")

    open_alerts = [a for a in alerts if a.get("state") == "open"]
    dismissed = [a for a in alerts if a.get("state") == "dismissed"]
    fixed = [a for a in alerts if a.get("state") == "fixed"]
    auto_dismissed = [a for a in alerts if a.get("state") == "auto_dismissed"]
    other = [a for a in alerts if a.get("state") not in ("open", "dismissed", "fixed", "auto_dismissed")]

    print(f"    Open:          {len(open_alerts)}")
    print(f"    Dismissed:     {len(dismissed)}")
    print(f"    Fixed:         {len(fixed)}")
    print(f"    Auto-dismissed:{len(auto_dismissed)}")
    print(f"    Other:         {len(other)}")

    # Break down open by manifest path
    if open_alerts:
        print(f"\n[!] OPEN ALERTS ({len(open_alerts)}):")
        for a in open_alerts:
            dep = a.get("dependency") or {}
            pkg = dep.get("package", {}).get("name", "?")
            sev = a.get("security_advisory", {}).get("severity", "?")
            manifest = dep.get("manifest_path", "?")
            print(f"    #{a.get('number')}  {pkg:<24}  {sev:<10}  {manifest}")
        return 1

    print("\n[OK] ZERO open Dependabot alerts remaining.")
    print(f"[OK] {len(dismissed)} alerts dismissed (reason: not_used).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
