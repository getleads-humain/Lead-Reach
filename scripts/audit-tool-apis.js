#!/usr/bin/env node
/**
 * Task 18 audit helper — extract API endpoints used by each sidebar tool view.
 * Usage: node scripts/audit-tool-apis.js
 */
const fs = require('fs');
const path = require('path');

const views = [
  ['Ask AI', 'ai-assistant/ai-assistant-view.tsx'],
  ['Dashboard', 'dashboard/dashboard-view.tsx'],
  ['Prospect Discovery', 'prospect-discovery/prospect-discovery-view.tsx'],
  ['ICP Builder', 'icp/icp-view.tsx'],
  ['Campaigns', 'campaigns/campaigns-view.tsx'],
  ['Leads', 'leads/leads-view.tsx'],
  ['Enrichment', 'data-enrichment/data-enrichment-view.tsx'],
  ['Connectors', 'connectors/connectors-view.tsx'],
  ['Agents', 'agents/agents-view.tsx'],
  ['AI Workforce', 'workforce/workforce-view.tsx'],
  ['Token Registry', 'tokens/token-registry.tsx'],
  ['AI Setter', 'setter/setter-view.tsx'],
  ['Bookings', 'booking/booking-view.tsx'],
  ['Messaging', 'messaging/messaging-view.tsx'],
  ['Outreach', 'outreach/outreach-view.tsx'],
  ['Analytics', 'analytics/analytics-view.tsx'],
  ['Reports', 'reports/reports-view.tsx'],
];

const base = path.join(__dirname, '..', 'src', 'components');
const apiRe = /['"`](\/api\/[a-zA-Z0-9/_.${}-]*?)['"`?]/g;
// Also catch endpoints built dynamically: `/api/x/${id}` — capture prefix
const tmplRe = /['"`](\/api\/[a-zA-Z0-9/_.]+)\/?\$\{/g;

for (const [name, rel] of views) {
  const file = path.join(base, rel);
  if (!fs.existsSync(file)) {
    console.log(`\n### ${name} — MISSING FILE: ${rel}`);
    continue;
  }
  const src = fs.readFileSync(file, 'utf8');
  const found = new Set();
  let m;
  while ((m = apiRe.exec(src))) found.add(m[1]);
  while ((m = tmplRe.exec(src))) found.add(m[1] + '/*id*/');
  console.log(`\n### ${name} (${rel})`);
  console.log([...found].sort().map((e) => '  ' + e).join('\n') || '  (none)');
}
