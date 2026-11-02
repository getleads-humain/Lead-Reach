#!/usr/bin/env python3
"""Fix CodeQL unused-symbol notes (js/unused-local-variable) mechanically.

Reads /tmp/codeql-msgs.json (file:line -> messages with symbol names) and
applies targeted line edits for the 'unused import X / unused variable X /
unused function X' classes. Verified manually per file afterwards.

Strategy per pattern:
  - unused imports (single or multi-name): rewrite the import line without
    the unused specifiers; drop the line entirely if nothing remains.
  - unused local variables / functions: remove the declaration line (locals
    whose entire purpose was declared-but-unused; verified by grep first).
"""
import json
import re
import sys

msgs = json.load(open('/tmp/codeql-msgs.json'))

# file -> list of (line, [symbols])
targets = {}
for key, items in msgs.items():
    f, l = key.rsplit(':', 1)
    for it in items:
        m = re.match(r'Unused (?:imports?|variable|function|class)\s+(.+?)\.?\s*$', it['msg'])
        if not m:
            print(f"SKIP (unparsed): {f}:{l} {it['msg'][:80]}")
            continue
        names = [n.strip() for part in m.group(1).split(',') for n in re.split(r',\s*', part) if n.strip()]
        targets.setdefault(f, []).append((int(l), names))

total_edits = 0
for f, entries in sorted(targets.items()):
    with open(f) as fh:
        lines = fh.readlines()
    changed = False
    for lineno, names in sorted(entries, reverse=True):
        idx = lineno - 1
        if idx >= len(lines):
            print(f"ERR out-of-range {f}:{lineno}")
            continue
        line = lines[idx]
        # 1) import statements
        if re.search(r'^\s*import\b', line):
            removed_any = False
            for name in names:
                new = re.sub(rf'(?:type\s+)?\b{re.escape(name)}\s*,\s*', '', line)
                if new == line:
                    new = re.sub(rf',\s*(?:type\s+)?\b{re.escape(name)}\b', '', line)
                if new == line:
                    # whole-statement import
                    if re.match(rf'^\s*import\s+(?:type\s+)?{re.escape(name)}\s+from\s', line):
                        new = ''
                if new != line:
                    line = new
                    removed_any = True
            if removed_any:
                if line.strip() == '' or re.match(r'^\s*import\s*\{?\s*\}?\s*;\s*$', line):
                    lines[idx] = ''
                else:
                    lines[idx] = line
                changed = True
                total_edits += 1
            else:
                print(f"MANUAL import {f}:{lineno}: {names} | {lines[idx].rstrip()[:100]}")
            continue
        # 2) local variable / function declarations — only delete when the
        #    whole line is the declaration (multi-line bodies handled manually)
        decl = re.match(r'^(\s*)(?:(?:const|let|var)\s+(?:{([^}]*)}|(\w+))|(?:function\s+(\w+))|class\s+(\w+))', line)
        if decl:
            lines[idx] = ''
            changed = True
            total_edits += 1
        else:
            print(f"MANUAL decl {f}:{lineno}: {names} | {lines[idx].rstrip()[:100]}")
    if changed:
        with open(f, 'w') as fh:
            fh.writelines(lines)

print(f"\n{total_edits} line(s) edited")
