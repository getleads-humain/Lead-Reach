#!/usr/bin/env node
/**
 * Task 18 — Cross-check: every /api/... path referenced in UI components/hooks
 * must resolve to an existing route handler (route.ts).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const dirs = ['src/components', 'src/hooks', 'src/lib'].map((d) => path.join(ROOT, d));

const found = new Set();
const RE = /['"`](\/api\/[a-zA-Z0-9\/_.-]*(?:\$\{[^}]+\}[a-zA-Z0-9\/_.-]*)*)['"`?]/g;

function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(e.name)) {
      const src = fs.readFileSync(p, 'utf8');
      let m;
      while ((m = RE.exec(src))) {
        found.add({ raw: m[1], file: path.relative(ROOT, p) });
      }
    }
  }
}
dirs.forEach(walk);

/** Convert an API path with template vars into candidate route dirs. */
function candidates(apiPath) {
  // strip query, trailing slash
  let p = apiPath.split('?')[0].replace(/\/+$/, '');
  const parts = p.split('/').filter(Boolean); // ['api','campaigns','${id}','ai-brief']
  const out = [];
  function build(i, cur) {
    if (i >= parts.length) { out.push(cur); return; }
    const seg = parts[i];
    if (seg.startsWith('${')) {
      // dynamic segment — could be [id] subdir at this level
      const dyn = fs.existsSync(path.join(ROOT, 'src/app', cur, '[id]')) ? '[id]' : null;
      // or the route ends here with the id as a param of a parent [id] route
      if (dyn) build(i + 1, `${cur}/${dyn}`);
      // also try treating dynamic seg as the leaf: parent route with [id]
      out.push(cur); // route may be parent/[id]/route.ts handling further segments? no
    } else {
      build(i + 1, `${cur}/${seg}`);
    }
  }
  build(0, 'src/app');
  return out;
}

const missing = [];
const list = [...found];
for (const { raw, file } of list) {
  const cands = candidates(raw);
  const ok = cands.some((c) => fs.existsSync(path.join(ROOT, c, 'route.ts')));
  if (!ok) missing.push({ raw, file, tried: cands });
}

if (missing.length === 0) {
  console.log(`All ${list.length} API path references resolve to route handlers. ✓`);
} else {
  console.log(`MISSING ROUTES (${missing.length} of ${list.length} refs):\n`);
  for (const m of missing) console.log(`  ${m.raw}\n     used in: ${m.file}`);
}
