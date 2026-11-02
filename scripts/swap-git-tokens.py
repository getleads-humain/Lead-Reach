#!/usr/bin/env python3
"""Restructure .env GitHub tokens: GITHUB_TOKEN -> workflow-scoped token
(repo+workflow, can push everything incl. .github/workflows/*), repo-scope
push token kept as GH_PUSH_TOKEN fallback. No values printed."""
import re

path = '/home/z/my-project/.env'
with open(path) as f:
    s = f.read()

m_wf = re.search(r'^GH_WORKFLOW_TOKEN=(.+)$', s, re.M)
m_push = re.search(r'^GITHUB_TOKEN=(.+)$', s, re.M)
if not (m_wf and m_push):
    raise SystemExit('expected tokens missing')
wf, push = m_wf.group(1).strip(), m_push.group(1).strip()

# GITHUB_TOKEN takes the workflow-scoped token; rename GH_WORKFLOW_TOKEN slot
# to GH_PUSH_TOKEN holding the repo-only push token.
s = re.sub(r'^GITHUB_TOKEN=.+$',
           'GITHUB_TOKEN=' + wf, s, count=1, flags=re.M)
s = re.sub(r'^GH_WORKFLOW_TOKEN=.+$',
           'GH_PUSH_TOKEN=' + push, s, count=1, flags=re.M)
s = s.replace('# GitHub sync (Task 16/17 permanent push credentials)',
              '# GitHub sync (Task 17 permanent credentials)\n'
              '# GITHUB_TOKEN: repo+workflow scope — used for ALL git pushes\n'
              '# GH_PUSH_TOKEN: repo-only scope — fallback / API use')

with open(path, 'w') as f:
    f.write(s)
print('env restructured: GITHUB_TOKEN=workflow-scoped, GH_PUSH_TOKEN=repo-only')
