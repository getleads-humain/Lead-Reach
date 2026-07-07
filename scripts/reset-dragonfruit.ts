import { db } from '../src/lib/db';

async function main() {
  const campaignId = 'cmqpoj08l0069t5y35m7549j0';

  // 1. Reset any stale 'running' tasks for this campaign
  const reset = await db.agentTask.updateMany({
    where: { campaignId, status: 'running' },
    data: { status: 'failed', error: 'Manual reset — pipeline stalled', completedAt: new Date() },
  });
  console.log(`Reset ${reset.count} stale running tasks`);

  // 2. Delete the 0 leads (there were none anyway)
  const deletedLeads = await db.lead.deleteMany({ where: { campaignId } });
  console.log(`Deleted ${deletedLeads.count} leads`);

  // 3. Reset campaign counters
  await db.campaign.update({
    where: { id: campaignId },
    data: {
      leadsFound: 0,
      leadsQualified: 0,
      leadsContacted: 0,
      leadsResponded: 0,
      status: 'active',
    },
  });
  console.log('Campaign counters reset to 0, status=active');

  // 4. Verify
  const c = await db.campaign.findUnique({ where: { id: campaignId } });
  console.log(`Final state: status=${c?.status} leads=${c?.leadsFound}/${c?.leadsQualified}/${c?.leadsContacted}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
