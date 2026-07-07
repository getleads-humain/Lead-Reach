import { db } from '../src/lib/db';
async function main() {
  const campaigns = await db.campaign.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { _count: { select: { leads: true } } } });
  console.log('Total campaigns:', campaigns.length);
  for (const c of campaigns) {
    console.log(`- ${c.id} | ${c.name} | status=${c.status} | leads=${c.leadsFound}/${c.leadsQualified}/${c.leadsContacted} | _count.leads=${c._count.leads}`);
  }
  const leadCount = await db.lead.count();
  console.log('Total leads:', leadCount);
  const taskCount = await db.agentTask.count();
  console.log('Total tasks:', taskCount);
  const runningTasks = await db.agentTask.findMany({ where: { status: 'running' }, take: 5 });
  console.log('Running tasks:', runningTasks.length);
  for (const t of runningTasks) {
    console.log(`  - ${t.agentName} for ${t.campaignId} started=${t.startedAt?.toISOString()} progress=${t.progress}`);
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
