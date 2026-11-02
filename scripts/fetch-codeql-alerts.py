#!/usr/bin/env python3
"""Fetch all open CodeQL code-scanning alerts with full locations (file, line,
message) via the GitHub API and dump them to JSON for systematic fixing."""
import json
import os
import urllib.request

REPO = 'getleads-humain/Lead-Reach'

token = None
with open('/home/z/my-project/.env') as f:
    for line in f:
        if line.startswith('GITHUB_TOKEN='):
            token = line.split('=', 1)[1].strip()
            break
if not token:
    raise SystemExit('GITHUB_TOKEN not found in .env')

def api(url):
    req = urllib.request.Request(url, headers={
        'Authorization': f'token {token}',
        'Accept': 'application/vnd.github+json',
    })
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())

alerts = []
page = 1
while True:
    data = api(f'https://api.github.com/repos/{REPO}/code-scanning/alerts?state=open&per_page=100&page={page}')
    if not data:
        break
    alerts.extend(data)
    if len(data) < 100:
        break
    page += 1

out = []
for a in alerts:
    loc = a.get('most_recent_instance') or {}
    out.append({
        'number': a['number'],
        'rule': a['rule']['id'],
        'severity': a['rule'].get('security_severity_level') or a['rule'].get('severity'),
        'msg': a['rule'].get('description', '')[:200],
        'file': loc.get('location', {}).get('path'),
        'line': loc.get('location', {}).get('start_line'),
        'state': a['state'],
    })

with open('/tmp/codeql-alerts.json', 'w') as f:
    json.dump(out, f, indent=1)

print(f'{len(out)} open alerts')
for a in sorted(out, key=lambda x: x['number']):
    sev = a['severity'] or '?'
    print(f"#{a['number']:>3} [{sev:8}] {a['rule'][:40]:40} {a['file']}:{a['line']}")
