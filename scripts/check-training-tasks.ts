import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const ts = await db.workforceTask.findMany({
    where: { taskType: 'training' },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: { title: true, status: true, startedAt: true, error: true, completedAt: true },
  });
  for (const t of ts) {
    console.log(t.status.padEnd(10), t.title.slice(0, 52), '| err:', (t.error || '-').slice(0, 70));
  }
}

main()
  .catch((e) => { console.error('FAIL:', e.message); process.exit(1); })
  .finally(() => db.$disconnect());
