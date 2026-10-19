/* Requeue in-flight workforce tasks (e.g. after server restart) and print counts */
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const stuck = await db.workforceTask.findMany({
    where: { status: 'running' },
    select: { id: true, title: true },
  });
  for (const t of stuck) {
    await db.workforceTask.update({
      where: { id: t.id },
      data: { status: 'pending', startedAt: null, error: 'Server restart during training — auto-resumed' },
    });
  }
  console.log('requeued', stuck.length, 'in-flight task(s)');

  const [agents, tasks, logs, docs, chats] = await Promise.all([
    db.workforceAgent.count(),
    db.workforceTask.count(),
    db.workforceLog.count(),
    db.workforceDocument.count(),
    db.workforceChatMessage.count(),
  ]);
  console.log('agents', agents, '| tasks', tasks, '| logs', logs, '| docs', docs, '| chats', chats);
  process.exit(0);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
