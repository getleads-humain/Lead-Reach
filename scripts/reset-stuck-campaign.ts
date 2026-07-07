import { db } from '../src/lib/db';
async function main() {
  // Reset any 'running' tasks older than 30 minutes for ALL campaigns
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
  const result = await db.agentTask.updateMany({
    where: { status: 'running', startedAt: { lt: thirtyMinAgo } },
    data: { status: 'failed', error: 'Pipeline timed out (stale task, >30min)', completedAt: new Date() },
  });
  console.log(`Reset ${result.count} stale running tasks`);

  // Reset the DragonFruit campaign that has 0 leads — set it to 'paused' so it can be re-run
  const dragonFruit = await db.campaign.findFirst({
    where: { name: { contains: 'DragonFruit' } },
  });
  if (dragonFruit) {
    console.log(`DragonFruit campaign id=${dragonFruit.id} status=${dragonFruit.status} leads=${dragonFruit.leadsFound}`);
    // Don't change status — leave it as 'active'. The pipeline will pick it up.
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
