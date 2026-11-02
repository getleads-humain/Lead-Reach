#!/usr/bin/env python3
"""Raise requirements.txt version floors above all known-vulnerable lines.

For every `pkg>=X.Y.Z` requirement: iteratively query OSV (api.osv.dev) for
advisories affecting the current floor version, and raise the floor until no
advisory hits it (max 5 rounds). Handles both `fixed` events and
`last_affected` markers (fix = next PyPI release after last_affected).
Preserves extras ([standard]) and inline comments. Sequential output.

Usage: python3 scripts/fix-requirements-floors.py [--dry]
"""
import json
import re
import sys
import urllib.request

REPO = "/home/z/my-project"
FILES = [
    f"{REPO}/mini-services/gmaps-scraper/requirements.txt",
    f"{REPO}/mini-services/scraper-service/requirements.txt",
    f"{REPO}/python-genleads/requirements.txt",
    f"{REPO}/python-workers/news-worker/requirements.txt",
]

OSV_URL = "https://api.osv.dev/v1/query"
PYPI_URL = "https://pypi.org/pypi/{}/json"


def http_json(url, payload=None):
    if payload is None:
        req = urllib.request.Request(url, headers={"User-Agent": "leadreach-sec-script"})
    else:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json", "User-Agent": "leadreach-sec-script"},
            method="POST",
        )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def verkey(v):
    return [int(x) if x.isdigit() else 0 for x in re.split(r"[.\-]", v)]


def parse_pypi_versions(pkg):
    try:
        d = http_json(PYPI_URL.format(pkg))
        out = [v for v, files in d.get("releases", {}).items()
               if files and not all(f.get("yanked") for f in files)]
        return sorted(set(out), key=verkey)
    except Exception as e:
        print(f"    !! PyPI lookup failed: {e}")
        return []


def osv_status(pkg, version):
    """Return (required_min_floors, last_affected_markers, unfixable_ids)."""
    try:
        d = http_json(OSV_URL, {"version": version,
                                "package": {"name": pkg, "ecosystem": "PyPI"}})
    except Exception as e:
        print(f"    !! OSV query failed: {e}")
        return [], [], []
    reqs, lasts, unfixable = [], [], []
    for v in d.get("vulns", []):
        vid = v.get("id", "?")
        for aff in v.get("affected", []):
            if aff.get("package", {}).get("name", "").lower() != pkg.lower():
                continue
            for rng in aff.get("ranges", []):
                if rng.get("type") != "ECOSYSTEM":
                    continue
                events = rng.get("events", [])
                fixed = [e["fixed"] for e in events if "fixed" in e]
                last_aff = [e["last_affected"] for e in events if "last_affected" in e]
                if fixed:
                    reqs.extend(fixed)
                elif last_aff:
                    lasts.extend(last_aff)
                else:
                    unfixable.append(vid)
    return reqs, lasts, unfixable


def next_version_after(versions, boundary):
    for v in versions:
        if verkey(v) > verkey(boundary):
            return v
    return None


def smallest_at_or_above(versions, target):
    for v in versions:
        if verkey(v) >= verkey(target):
            return v
    return None


def raise_floor(pkg, floor, versions):
    """Iteratively raise floor until OSV-clean. Returns (floor, status)."""
    for _ in range(5):
        reqs, lasts, unfix = osv_status(pkg, floor)
        if not reqs and not lasts and not unfix:
            return floor, "clean"
        candidates = []
        for r in reqs:
            c = smallest_at_or_above(versions, r)
            if c:
                candidates.append(c)
        for b in lasts:
            c = next_version_after(versions, b)
            if c:
                candidates.append(c)
        if not candidates:
            return floor, ("UNFIXABLE: " + ",".join(sorted(set(unfix)))) if unfix else "NO-TARGET"
        new_floor = max(candidates, key=verkey)
        if verkey(new_floor) <= verkey(floor):
            return floor, ("UNFIXABLE: " + ",".join(sorted(set(unfix)))) if unfix else "STUCK"
        print(f"    advisory hit at {floor} -> trying {new_floor}")
        floor = new_floor
    return floor, "MAX-ROUNDS"


def process_line(line):
    stripped = line.strip()
    if not stripped or stripped.startswith("#"):
        return line, False, ""
    m = re.match(r"^([A-Za-z0-9_.\-]+)((?:\[[A-Za-z0-9_,\-]+\])?)\s*>=\s*([0-9][A-Za-z0-9.\-]*)\s*(#.*)?$", stripped)
    if not m:
        return line, False, "UNPARSED (left as-is)"
    name, extras, floor, comment = m.group(1), m.group(2) or "", m.group(3), (m.group(4) or "").rstrip()
    pkg = name.lower()
    print(f"  {pkg}{extras} >= {floor}")
    versions = parse_pypi_versions(pkg)
    if not versions:
        return line, False, "no PyPI data"
    new_floor, status = raise_floor(pkg, floor, versions)
    if status != "clean":
        return line, False, f"KEPT {floor} ({status})"
    if verkey(new_floor) == verkey(floor):
        return line, False, "clean"
    new_line = f"{name}{extras}>={new_floor}" + (f"  {comment}" if comment else "")
    return new_line, True, f"RAISED {floor} -> {new_floor}"


def main():
    dry = "--dry" in sys.argv
    for path in FILES:
        print(f"\n=== {path} ===")
        with open(path) as f:
            lines = f.read().splitlines()
        out, raised, notes = [], 0, []
        for line in lines:
            new, ch, note = process_line(line)
            notes.append((ch, note))
            out.append(new)
            raised += 1 if ch else 0
        for ch, note in notes:
            print(f" {'*' if ch else ' '} {note or '-'}")
        if raised and not dry:
            with open(path, "w") as f:
                f.write("\n".join(out) + "\n")
        print(f" -> {raised} line(s) raised{' (dry-run)' if dry else ''}")


if __name__ == "__main__":
    main()
