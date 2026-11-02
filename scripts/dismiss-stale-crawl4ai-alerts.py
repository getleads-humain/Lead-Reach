#!/usr/bin/env python3
"""Dismiss stale Dependabot alerts that reference a manifest file removed from
the repository (lib/crawl4ai-source/deploy/docker/requirements.txt was removed
in commit b880b46 but Dependabot retained the alerts).

The crawl4ai upstream PyJWT/anyio deps are NOT Lead Reach dependencies — Lead
Reach imports crawl4ai as a Python source tree via sys.path.insert, never via
pip. The manifest no longer exists in origin/main, so these alerts are stale.
"""
import json
import os
import re
import urllib.request

REPO = "getleads-humain/Lead-Reach"
TARGET_MANIFEST = "lib/crawl4ai-source/deploy/docker/requirements.txt"
REASON = "tolerable_risk"
COMMENT = (
    "Stale alert: manifest lib/crawl4ai-source/deploy/docker/requirements.txt was "
    "removed in commit b880b46. crawl4ai is imported via sys.path.insert "
    "(lib/crawl4ai-service/server.py), never pip-installed — PyJWT/anyio are not "
    "Lead Reach dependencies. Manifest absent from origin/main."
)


def get_token():
    return re.search(r"^GITHUB_TOKEN=(\S+)", open(".env").read(), re.M).group(1)


def api(method, path, body=None):
    url = f"https://api.github.com/repos/{REPO}/{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {get_token()}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "leadreach-dismiss",
    })
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            return resp.status, resp.read().decode()[:200]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300]


def fetch_open():
    alerts = []
    url = f"https://api.github.com/repos/{REPO}/dependabot/alerts?state=open&per_page=100"
    while url:
        req = urllib.request.Request(url, headers={
            "Authorization": f"Bearer {get_token()}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "leadreach-dismiss",
        })
        with urllib.request.urlopen(req, timeout=25) as resp:
            alerts.extend(json.loads(resp.read().decode()))
            link = resp.headers.get("Link", "")
            m = re.search(r'<([^>]+)>;\s*rel="next"', link)
            url = m.group(1) if m else None
    return alerts


def main():
    alerts = fetch_open()
    targets = [a for a in alerts if a["dependency"]["manifest_path"] == TARGET_MANIFEST]
    print(f"open alerts total: {len(alerts)} | targeting {len(targets)} stale crawl4ai alerts")
    if not targets:
        print("nothing to dismiss")
        return
    # test with the first one
    first = targets[0]
    status, body = api("PATCH", f"dependabot/alerts/{first['number']}", {
        "state": "dismissed", "dismissed_reason": REASON, "dismissed_comment": COMMENT,
    })
    print(f"  test dismiss #{first['number']} ({first['security_vulnerability']['package']['name']}): HTTP {status}")
    if status not in (200, 201):
        print(f"  body: {body}")
        print("  ABORT: token cannot dismiss (need security_events scope?)")
        return
    # batch the rest
    ok = 1
    for a in targets[1:]:
        s, b = api("PATCH", f"dependabot/alerts/{a['number']}", {
            "state": "dismissed", "dismissed_reason": REASON, "dismissed_comment": COMMENT,
        })
        mark = "✓" if s in (200, 201) else "✗"
        print(f"  {mark} #{a['number']} {a['security_vulnerability']['package']['name']}: HTTP {s}")
        if s in (200, 201):
            ok += 1
    print(f"\ndismissed {ok}/{len(targets)}")


if __name__ == "__main__":
    main()
