/**
 * DB health check — verify workforce tables exist and agents are seeded.
 * Run: npx tsx scripts/check-workforce-db.ts
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const agents = await db.workforceAgent.findMany({
    select: {
      id: true, slug: true, name: true, status: true, healthScore: true,
      tasksCompleted: true, tasksFailed: true, _count: { select: { logs: true, tasks: true, documents: true } },
    },
    orderBy: { name: 'asc' },
  });

  console.log(`WorkforceAgent rows: ${agents.length}`);
  for (const a of agents) {
    console.log(`  ${a.slug.padEnd(22)} status=${a.status.padEnd(8)} health=${a.healthScore} done=${a.tasksCompleted} fail=${a.tasksFailed} logs=${a._count.logs} tasks=${a._count.tasks} docs=${a._count.documents}`);
  }

  const logCount = await db.workforceLog.count();
  const taskCount = await db.workforceTask.count();
  const docCount = await db.workforceDocument.count();
  const msgCount = await db.workforceChatMessage.count();
  const trainedDocs = await db.workforceDocument.count({ where: { sourceType: 'web_trained' } });
  console.log(`\nTotals: logs=${logCount} tasks=${taskCount} docs=${docCount} (web_trained=${trainedDocs}) chatMsgs=${msgCount}`);

  const runningTasks = await db.workforceTask.findMany({
    where: { status: 'running' },
    select: { id: true, title: true, startedAt: true },
    take: 5,
  });
  console.log(`\nStuck running tasks: ${runningTasks.length}`);
  for (const t of runningTasks) console.log(`  ${t.id} ${t.title} started=${t.startedAt?.toISOString()}`);

  const recentLogs = await db.workforceLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { createdAt: true, category: true, action: true, description: true, agentId: true },
  });
  console.log('\nRecent logs:');
  for (const l of recentLogs) console.log(`  [${l.createdAt.toISOString()}] ${l.category}/${l.action}: ${l.description.slice(0, 90)}`);
}

main()
  .catch((e) => { console.error('DB CHECK FAILED:', e.message); process.exit(1); })
  .finally(() => db.$disconnect());
