/* Export the trained workforce state to scripts/workforce-snapshot.json
 * (same shape the db_audit ops job writes). git-committed → survives
 * container rollbacks; restored at boot by ensureWorkforceBootstrapped().
 * Usage: node scripts/export-workforce-snapshot.js
 */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function main() {
  const agents = await db.workforceAgent.findMany({
    select: { slug: true, status: true, healthScore: true, tasksCompleted: true, tasksFailed: true, successRate: true },
  });
  const docs = await db.workforceDocument.findMany({
    select: { agent: { select: { slug: true } }, title: true, category: true, content: true, tags: true, sourceType: true },
  });
  const logs = await db.workforceLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: { agent: { select: { slug: true } }, logDate: true, level: true, category: true, action: true, description: true, details: true },
  });

  const snapshot = {
    version: 1,
    exportedAt: new Date().toISOString(),
    agents,
    documents: docs.map((d) => ({
      agentSlug: d.agent.slug,
      title: d.title,
      category: d.category,
      content: d.content,
      tags: d.tags,
      sourceType: d.sourceType,
    })),
    logs: logs.map((l) => ({
      agentSlug: l.agent.slug,
      logDate: l.logDate.toISOString(),
      level: l.level,
      category: l.category,
      action: l.action,
      description: l.description,
      details: l.details,
    })),
  };

  const snapPath = path.join(__dirname, 'workforce-snapshot.json');
  fs.writeFileSync(snapPath, JSON.stringify(snapshot));
  console.log(`snapshot written: ${agents.length} agents, ${docs.length} docs, ${logs.length} logs → ${snapPath} (${(fs.statSync(snapPath).size / 1024).toFixed(0)} KB)`);
  process.exit(0);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
