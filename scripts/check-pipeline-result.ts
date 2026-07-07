import { db } from '../src/lib/db';

async function main() {
  const campaigns = await db.campaign.findMany({
    include: { _count: { select: { leads: true } } },
    orderBy: { createdAt: 'desc' },
  });
  console.log('=== ALL CAMPAIGNS ===');
  for (const c of campaigns) {
    console.log(
      `- ${c.id} | "${c.name}" | status=${c.status} | leads=${c.leadsFound}/${c.leadsQualified}/${c.leadsContacted} | _count.leads=${c._count.leads}`,
    );
  }

  // Check tasks for all campaigns
  console.log('\n=== TASKS PER CAMPAIGN ===');
  for (const c of campaigns) {
    const tasks = await db.agentTask.findMany({
      where: { campaignId: c.id },
      orderBy: { createdAt: 'asc' },
      select: { agentName: true, status: true, progress: true, error: true },
    });
    console.log(`\nCampaign: ${c.name} (${tasks.length} tasks)`);
    for (const t of tasks) {
      console.log(
        `  - ${t.agentName} | ${t.status} | progress=${t.progress} | error=${t.error?.slice(0, 80) || 'none'}`,
      );
    }
  }

  // Sample leads from the most recent campaign
  const recent = campaigns[0];
  if (recent) {
    const leads = await db.lead.findMany({
      where: { campaignId: recent.id },
      take: 8,
      select: {
        companyName: true,
        stage: true,
        leadTier: true,
        leadScore: true,
        industry: true,
        city: true,
        country: true,
        website: true,
      },
    });
    console.log(`\n=== SAMPLE LEADS FROM "${recent.name}" (${leads.length}) ===`);
    for (const l of leads) {
      console.log(
        `  - ${l.companyName} | ${l.stage} | ${l.leadTier} | score=${l.leadScore} | ${l.industry} | ${l.city}, ${l.country} | ${l.website || 'no-website'}`,
      );
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
