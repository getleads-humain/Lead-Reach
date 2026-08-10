/**
 * Seed script for the 14 AI Workforce Agents (The Autonomous Enterprise)
 * Run with: npx tsx scripts/seed-workforce.ts
 *
 * Imports agent definitions from src/lib/workforce/definitions.ts
 * and seeds them into the database via the workforce engine.
 */

import { ALL_WORKFORCE_AGENTS } from '../src/lib/workforce/definitions';
import { createWorkforceAgentFromDefinition } from '../src/lib/workforce/engine';

async function main() {
  console.log('🌱 Seeding The Autonomous Enterprise Workforce...\n');

  const results: Array<{ slug: string; id: string }> = [];

  for (const def of ALL_WORKFORCE_AGENTS) {
    try {
      const agent = await createWorkforceAgentFromDefinition(def);
      console.log(`  ✅ ${def.avatar} ${def.name} (${agent.id})`);
      results.push({ slug: def.slug, id: agent.id });
    } catch (err) {
      console.error(`  ❌ Failed to seed ${def.name}:`, err);
    }
  }

  console.log(`\n✨ ${results.length} autonomous enterprise agents ready for duty.`);
  console.log('\nCategories:');
  console.log('  01. Executive Suite & Master Control (2 agents)');
  console.log('  02. Growth, Marketing & Client Acquisition (4 agents)');
  console.log('  03. Technology, Infrastructure & Engineering (5 agents)');
  console.log('  04. Operations, Finance & Risk Management (3 agents)');
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
