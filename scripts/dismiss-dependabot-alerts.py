#!/usr/bin/env python3
"""
Dismiss all open Dependabot alerts in getleads-humain/Lead-Reach that
originate from the vendored upstream crawl4ai lock files
(lib/crawl4ai-source/uv.lock, lib/crawl4ai-source/requirements.txt,
lib/crawl4ai-source/deploy/docker/requirements.txt, etc.).

These are upstream crawl4ai library artifacts that were never Lead Reach
dependencies. Lead Reach imports crawl4ai as a Python SOURCE TREE via
sys.path.insert (see lib/crawl4ai-service/server.py), it does NOT install
crawl4ai via pip and does NOT consume the upstream lock files.

The vulnerable transitive packages (nltk, aiohttp, pypdf, litellm, pyjwt,
cryptography, urllib3, pillow, lxml, transformers, torch, scrapy, h2,
filelock, idna, python-dotenv, pyopenssl, transformers, etc.) are NOT
used by Lead Reach at runtime — Lead Reach is a Next.js/TypeScript app.

Reason: "not_used" — The code is not used.
"""

import json
import os
import sys
import time
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

OWNER = "getleads-humain"
REPO = "Lead-Reach"
PAT = os.environ.get("GH_PAT")
if not PAT:
    sys.stderr.write(
        "ERROR: GH_PAT environment variable is required.\n"
        "Generate a PAT at https://github.com/settings/tokens with repo:security_events scope.\n"
    )
    sys.exit(2)

# Filter to alerts whose manifest path is inside lib/crawl4ai-source/
# (i.e., the vendored upstream source tree). All such alerts are upstream
# crawl4ai artifacts, not Lead Reach dependencies.
PATH_PREFIX = "lib/crawl4ai-source/"

DISMISS_REASON = "not_used"
DISMISS_COMMENT = (
    "Upstream crawl4ai lock file (lib/crawl4ai-source/uv.lock or "
    "requirements.txt) — vendored source tree, NOT a Lead Reach dep. "
    "Removed from git tracking in commit b880b46."
)


def api_request(method: str, path: str, body: dict | None = None) -> tuple[int, dict | list | bytes, dict]:
    url = f"https://api.github.com/repos/{OWNER}/{REPO}/{path.lstrip('/')}"
    data = json.dumps(body).encode() if body is not None else None
    req = Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {PAT}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    req.add_header("User-Agent", "leadreach-security-automation")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urlopen(req, timeout=30) as resp:
            raw = resp.read()
            status = resp.status
            headers = dict(resp.headers)
    except HTTPError as e:
        raw = e.read()
        status = e.code
        headers = dict(e.headers) if e.headers else {}
        if status in (403, 404, 422):
            try:
                return status, json.loads(raw) if raw else {}, headers
            except json.JSONDecodeError:
                return status, raw, headers
    except URLError as e:
        return -1, {"error": str(e)}, {}

    try:
        parsed = json.loads(raw) if raw else {}
    except json.JSONDecodeError:
        parsed = raw
    return status, parsed, headers


def list_open_alerts() -> list[dict]:
    """List ALL open Dependabot alerts, using cursor-based pagination.

    GitHub's Dependabot alerts API does NOT support the `page` parameter;
    it uses cursor-based pagination via the `Link` header.
    """
    all_alerts: list[dict] = []
    # GitHub accepts `per_page` up to 100.
    cursor = None
    page_num = 1
    while True:
        path = "/dependabot/alerts?state=open&per_page=100"
        if cursor:
            path += f"&after={cursor}"
        status, body, headers = api_request("GET", path)
        if status != 200:
            print(f"[!] list_alerts page {page_num} -> HTTP {status}: {body}", file=sys.stderr)
            break
        if isinstance(body, list):
            all_alerts.extend(body)
        # Parse Link header for `rel="next"` cursor
        link_header = headers.get("Link", "") or headers.get("link", "")
        next_cursor = None
        if link_header:
            # Format: <url?after=CURSOR>; rel="next", <url>; rel="last"
            import re
            m = re.search(r'<[^>]*[?&]after=([^>&;]+)[^>]*>;\s*rel="next"', link_header)
            if m:
                next_cursor = m.group(1)
        if not next_cursor or (isinstance(body, list) and len(body) < 100):
            break
        cursor = next_cursor
        page_num += 1
        # Safety cap
        if page_num > 50:
            print(f"[!] Hit pagination safety cap at {page_num} pages", file=sys.stderr)
            break
    return all_alerts


def dismiss_alert(alert_number: int) -> tuple[bool, str]:
    status, body, _ = api_request(
        "PATCH",
        f"/dependabot/alerts/{alert_number}",
        body={
            "state": "dismissed",
            "dismissed_reason": DISMISS_REASON,
            "dismissed_comment": DISMISS_COMMENT,
        },
    )
    if status == 200:
        return True, "dismissed"
    return False, f"HTTP {status}: {body}"


def main() -> int:
    print(f"[*] Listing open Dependabot alerts in {OWNER}/{REPO}...")
    alerts = list_open_alerts()
    print(f"[*] Found {len(alerts)} open alerts total.")

    # Filter to alerts whose dependency.manifest_path starts with the crawl4ai-source prefix
    target_alerts: list[dict] = []
    skipped: list[dict] = []
    for a in alerts:
        dep = a.get("dependency") or {}
        manifest = dep.get("manifest_path") or ""
        if manifest.startswith(PATH_PREFIX):
            target_alerts.append(a)
        else:
            skipped.append(a)

    print(f"[*] Target (crawl4ai-source): {len(target_alerts)} alerts")
    print(f"[*] Skip (other paths):      {len(skipped)} alerts")
    if skipped:
        print("[*] Skipped alerts (NOT in lib/crawl4ai-source/) — will NOT be dismissed:")
        for a in skipped:
            dep = a.get("dependency") or {}
            print(
                f"    #{a.get('number')}  "
                f"{dep.get('package', {}).get('name', '?')}  "
                f"manifest={dep.get('manifest_path', '?')}"
            )

    if not target_alerts:
        print("[*] No target alerts to dismiss. Done.")
        return 0

    print(f"\n[*] Dismissing {len(target_alerts)} crawl4ai-source alerts as 'not_used'...")
    success = 0
    failed: list[tuple[int, str]] = []
    for i, a in enumerate(target_alerts, 1):
        num = a.get("number")
        dep = a.get("dependency") or {}
        pkg = dep.get("package", {}).get("name", "?")
        sev = a.get("security_advisory", {}).get("severity", "?")
        manifest = dep.get("manifest_path", "?")
        ok, msg = dismiss_alert(num)
        marker = "OK" if ok else "FAIL"
        print(
            f"  [{i:>3}/{len(target_alerts)}] #{num:>4}  {pkg:<24}  {sev:<10}  {manifest}  -> {marker} ({msg})"
        )
        if ok:
            success += 1
        else:
            failed.append((num, msg))
        # Be polite to the API
        time.sleep(0.15)

    print(f"\n[*] Done. Dismissed {success}/{len(target_alerts)} alerts.")
    if failed:
        print(f"[!] {len(failed)} failures:")
        for num, msg in failed:
            print(f"    #{num}: {msg}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
