#!/usr/bin/env node
/**
 * Task 18 — Scan for findUnique calls whose where-fields are NOT unique
 * in the Prisma schema (latent PrismaClientValidationError bugs).
 */
const fs = require('fs');
const path = require('path');

const schema = fs.readFileSync(path.join(__dirname, '..', 'prisma', 'schema.prisma'), 'utf8');

// Parse models: name -> { uniqueFields: Set, idField }
const models = {};
let current = null;
for (const line of schema.split('\n')) {
  const m = line.match(/^model\s+(\w+)\s*\{/);
  if (m) { current = m[1]; models[current] = { unique: new Set() }; continue; }
  if (current && line.trim() === '}') { current = null; continue; }
  if (!current) continue;
  const f = line.match(/^\s*(\w+)\s+\w+/);
  if (f && /@unique|@id/.test(line)) models[current].unique.add(f[1]);
  const composite = line.match(/@@unique\(\[([^\]]+)\]/);
  if (composite) composite[1].split(',').map(s => s.trim()).forEach(s => models[current].unique.add(s));
}

// Walk src/app/api for findUnique where fields
function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (e.name.endsWith('.ts')) files.push(p);
  }
  return files;
}

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
const libDir = path.join(__dirname, '..', 'src', 'lib');
const files = [...walk(apiDir), ...walk(libDir)];
const issues = [];
const re = /\.\s*findUnique\s*\(\s*\{\s*where\s*:\s*\{([^}]*)\}/g;

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = re.exec(src))) {
    const whereFields = m[1].split(',').map(s => s.trim().split(/[:\s]/)[0]).filter(Boolean);
    // Determine model: look back for db.<model>.findUnique
    const before = src.slice(Math.max(0, m.index - 200), m.index);
    const mm = before.match(/db\.(\w+)\s*$/);
    if (!mm) continue;
    const model = mm[1][0].toUpperCase() + mm[1].slice(1);
    const info = models[model];
    if (!info) continue;
    const bad = whereFields.filter(f => !info.unique.has(f));
    if (bad.length) {
      issues.push(`${path.relative(process.cwd(), file)}: db.${model}.findUnique({ where: { ${whereFields.join(', ')} } }) — NON-UNIQUE field(s): ${bad.join(', ')} (unique: ${[...info.unique].join(', ') || 'none'})`);
    }
  }
}
console.log(issues.length ? issues.join('\n') : 'No findUnique-on-non-unique issues found.');
console.log(`\n(${Object.keys(models).length} models parsed)`);
