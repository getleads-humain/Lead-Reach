/**
 * Task 18 — Live functional test of EVERY left-side panel tool.
 * Drives a real user task through each tool's API workflow with an
 * authenticated session, prints PASS/FAIL + response evidence.
 *
 * Usage: node scripts/test-all-tools.js [--quick]
 */
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3000';
const COOKIE = fs.readFileSync('/tmp/sb-cookie.txt', 'utf8').trim();

const results = [];
let step = 0;

async function call(method, url, body, opts = {}) {
  const started = Date.now();
  try {
    const res = await fetch(BASE + url, {
      method,
      headers: {
        Cookie: COOKIE,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(opts.headers || {}),
      },
      body: body ? (opts.form ? body : JSON.stringify(body)) : undefined,
      redirect: 'manual',
      signal: AbortSignal.timeout(opts.timeout || 60000),
    });
    const ms = Date.now() - started;
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, ok: res.status >= 200 && res.status < 300, ms, json, text };
  } catch (e) {
    return { status: 0, ok: false, ms: Date.now() - started, json: null, text: String(e.message || e), error: e };
  }
}

function record(tool, workflow, r, check) {
  step += 1;
  const pass = r.ok && (!check || check(r));
  const evidence = r.json
    ? JSON.stringify(r.json).slice(0, 160)
    : (r.text || '').slice(0, 160);
  results.push({ step, tool, workflow, pass, status: r.status, ms: r.ms, evidence });
  console.log(
    `${pass ? 'PASS' : 'FAIL'}  [${String(step).padStart(2)}] ${tool} — ${workflow}  (${r.status}, ${r.ms}ms)${pass ? '' : '\n      ↳ ' + evidence}`
  );
  return r;
}

function summary() {
  const pass = results.filter((r) => r.pass).length;
  const fail = results.filter((r) => !r.pass);
  console.log(`\n${'='.repeat(70)}\nTOTAL: ${pass}/${results.length} passed` + (fail.length ? `\nFAILURES: ${fail.map((f) => `#${f.step} ${f.tool}/${f.workflow} (${f.status})`).join('\n  ')}` : ' — ALL GREEN'));
  process.exit(fail.length ? 1 : 0);
}

(async () => {
  // ─────────────────────────────────────────────────────────────
  // 1. ASK AI  (ai-assistant)
  // ─────────────────────────────────────────────────────────────
  {
    const r = await call('POST', '/api/ai-assistant/chat', {
      messages: [{ role: 'user', content: 'In one short sentence: what is LeadReach?' }],
    });
    record('Ask AI', 'chat round-trip', r, (x) => x.json && (x.json.content || x.json.message || x.json.text || x.json.response));

    const r2 = await call('POST', '/api/ai-assistant/smart-chat', {
      message: 'Summarize my pipeline in one sentence',
    });
    record('Ask AI', 'smart-chat with tools', r2, () => true);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. DASHBOARD
  // ─────────────────────────────────────────────────────────────
  {
    const r = await call('GET', '/api/dashboard/stats');
    record('Dashboard', 'stats load', r, (x) => x.json && typeof x.json === 'object');

    const r2 = await call('GET', '/api/proactive-insights');
    record('Dashboard', 'proactive insights', r2, () => true);

    const r3 = await call('GET', '/api/agents');
    record('Dashboard', 'agents list', r3, (x) => Array.isArray(x.json) || (x.json && x.json.agents));
    const r4 = await call('GET', '/api/campaigns');
    record('Dashboard', 'campaigns list', r4, (x) => Array.isArray(x.json));
  }

  // ─────────────────────────────────────────────────────────────
  // 3. PROSPECT DISCOVERY
  // ─────────────────────────────────────────────────────────────
  {
    const h = await call('GET', '/api/prospect-discovery/health');
    record('Prospect Discovery', 'health', h, () => true);

    const c = await call('POST', '/api/prospect-discovery/chat', {
      message: 'Find 3 HVAC companies in Austin, Texas with websites',
    }, { timeout: 120000 });
    record('Prospect Discovery', 'chat search task', c, (x) => x.json && (x.json.reply || x.json.response || x.json.message || x.json.content || x.json.leads || x.json.results));

    const s = await call('GET', '/api/prospect-discovery/sessions');
    record('Prospect Discovery', 'sessions list', s, () => true);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. ICP BUILDER
  // ─────────────────────────────────────────────────────────────
  {
    const r = await call('POST', '/api/icp', { action: 'list' });
    record('ICP Builder', 'list profiles', r, () => true);

    const r2 = await call('POST', '/api/icp/chat', {
      message: 'Suggest an ICP for a B2B SaaS that sells AI receptionists to dental clinics',
    }, { timeout: 120000 });
    record('ICP Builder', 'AI chat build', r2, () => true);

    // create + delete lifecycle
    const create = await call('POST', '/api/icp', {
      action: 'create',
      profile: {
        name: 'Task18 Test ICP',
        industry: 'Dental',
        companySize: '1-20',
        location: 'Texas',
        description: 'Test ICP created by Task 18 verification',
      },
    });
    record('ICP Builder', 'create profile', create, (x) => x.json && (x.json.icp || x.json.id || x.json.success !== false));
    const icpId = create.json?.icp?.id || create.json?.id;
    if (icpId) {
      const del = await call('POST', '/api/icp', { action: 'delete', id: icpId });
      record('ICP Builder', 'delete profile', del, () => true);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 5. CAMPAIGNS
  // ─────────────────────────────────────────────────────────────
  let campaignId = null;
  {
    const list = await call('GET', '/api/campaigns');
    record('Campaigns', 'list campaigns', list, (x) => Array.isArray(x.json));
    campaignId = Array.isArray(list.json) && list.json[0] ? list.json[0].id : null;

    const created = await call('POST', '/api/campaigns', {
      name: 'Task18 Verification Campaign',
      description: 'Created by Task 18 tool verification',
      status: 'active',
      channel: 'email',
    });
    record('Campaigns', 'create campaign', created, (x) => x.json && (x.json.id || x.json.campaign));
    const newId = created.json?.id || created.json?.campaign?.id;
    if (newId) {
      const brief = await call('POST', `/api/campaigns/${newId}/ai-brief`, { campaignId: newId }, { timeout: 120000 });
      record('Campaigns', 'AI brief generation', brief, () => true);
      const ps = await call('GET', `/api/campaigns/${newId}/pipeline-status`);
      record('Campaigns', 'pipeline status', ps, () => true);
      const del = await call('DELETE', `/api/campaigns/${newId}`);
      record('Campaigns', 'delete campaign', del, () => true);
    } else if (campaignId) {
      const ps = await call('GET', `/api/campaigns/${campaignId}/pipeline-status`);
      record('Campaigns', 'pipeline status (existing)', ps, () => true);
    }
    if (campaignId) {
      const batch = await call('POST', '/api/campaigns/pipeline-status-batch', { ids: [campaignId] });
      record('Campaigns', 'pipeline status batch', batch, () => true);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 6. LEADS
  // ─────────────────────────────────────────────────────────────
  let leadId = null;
  {
    const list = await call('GET', '/api/leads?limit=50');
    record('Leads', 'list leads', list, (x) => Array.isArray(x.json) || (x.json && Array.isArray(x.json.leads)));
    const arr = Array.isArray(list.json) ? list.json : list.json?.leads || [];
    leadId = arr[0]?.id || null;

    const created = await call('POST', '/api/leads', {
      name: 'Jordan Rivera',
      company: 'Rivera Dental Group',
      email: 'jordan@riveradental.example.com',
      phone: '+1-512-555-0184',
      source: 'task18-verification',
      status: 'new',
      notes: 'Created by Task 18 tool verification',
    });
    record('Leads', 'create lead', created, (x) => x.json && (x.json.id || x.json.lead));
    const newId = created.json?.id || created.json?.lead?.id;

    const target = newId || leadId;
    if (target) {
      const score = await call('POST', `/api/leads/${target}/ai-score`, {}, { timeout: 120000 });
      record('Leads', 'AI score', score, () => true);
      const next = await call('POST', `/api/leads/${target}/ai-next-action`, {}, { timeout: 120000 });
      record('Leads', 'AI next action', next, () => true);
      const li = await call('GET', `/api/lead-intelligence?leadId=${target}`);
      record('Leads', 'lead intelligence', li, () => true);
      if (newId) {
        const del = await call('DELETE', `/api/leads/${newId}`);
        record('Leads', 'delete lead', del, () => true);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 7. ENRICHMENT
  // ─────────────────────────────────────────────────────────────
  {
    const stats = await call('GET', '/api/enrichment/stats');
    record('Enrichment', 'stats', stats, () => true);

    const imp = await call('POST', '/api/leads/bulk-import', {
      leads: [
        { name: 'Casey Enrich', company: 'EnrichTest LLC', email: 'casey@enrichtest.example.com', source: 'task18' },
      ],
    });
    record('Enrichment', 'bulk import', imp, (x) => x.json && (x.json.success !== false || x.json.imported !== undefined));
    const importedId = imp.json?.leadIds?.[0] || imp.json?.results?.[0]?.id || imp.json?.id;

    const be = await call('POST', '/api/leads/bulk-enrich', {
      leadIds: importedId ? [importedId] : undefined,
      limit: 1,
    }, { timeout: 120000 });
    record('Enrichment', 'bulk enrich', be, () => true);

    const an = await call('POST', '/api/enrichment/analyze', {
      query: 'What AI receptionist vendors serve dental clinics in Texas?',
    }, { timeout: 120000 });
    record('Enrichment', 'deep analyze', an, () => true);
  }

  // ─────────────────────────────────────────────────────────────
  // 8. CONNECTORS
  // ─────────────────────────────────────────────────────────────
  {
    const list = await call('GET', '/api/connectors');
    record('Connectors', 'list connectors', list, (x) => Array.isArray(x.json) || (x.json && Array.isArray(x.json.connectors)));

    const created = await call('POST', '/api/connectors', {
      name: 'Task18 Test Connector',
      type: 'webhook',
      config: { url: 'https://example.com/hook', secret: 'test' },
    });
    record('Connectors', 'create connector', created, (x) => x.json && (x.json.id || x.json.connector || x.json.success !== false));
    const cid = created.json?.id || created.json?.connector?.id;
    const existing = Array.isArray(list.json) ? list.json[0]?.id : list.json?.connectors?.[0]?.id;
    const target = cid || existing;

    if (target) {
      const test = await call('POST', `/api/connectors/${target}/test`, {}, { timeout: 60000 });
      record('Connectors', 'test connector', test, () => true);
      const ev = await call('GET', `/api/connectors/${target}/events`);
      record('Connectors', 'connector events', ev, () => true);
    }
    if (cid) {
      const del = await call('DELETE', `/api/connectors/${cid}`);
      record('Connectors', 'delete connector', del, () => true);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 9. AGENTS
  // ─────────────────────────────────────────────────────────────
  {
    const list = await call('GET', '/api/agents');
    record('Agents', 'list agents', list, (x) => Array.isArray(x.json) || (x.json && Array.isArray(x.json.agents)));

    const exec = await call('POST', '/api/agents/execute', {
      agent: 'prospect-discovery',
      task: 'Find dental clinics in Austin that need AI phone reception',
    }, { timeout: 120000 });
    record('Agents', 'execute agent task', exec, (x) => x.json && (x.json.result || x.json.output || x.json.success !== false || x.json.status));
  }

  // ─────────────────────────────────────────────────────────────
  // 10. AI WORKFORCE
  // ─────────────────────────────────────────────────────────────
  {
    const list = await call('GET', '/api/workforce');
    record('AI Workforce', 'agent roster', list, (x) => x.json && (Array.isArray(x.json.agents) || Array.isArray(x.json)));

    const ops = await call('GET', '/api/workforce?view=ops');
    record('AI Workforce', 'ops jobs view', ops, () => true);

    const tasks = await call('GET', '/api/workforce/tasks');
    record('AI Workforce', 'task history', tasks, () => true);

    const train = await call('POST', '/api/workforce', { action: 'train', tag: 'task18-verify' }, { timeout: 120000 });
    record('AI Workforce', 'training round', train, (x) => x.json && (x.json.trained || x.json.results || x.json.success !== false));
  }

  // ─────────────────────────────────────────────────────────────
  // 11. TOKEN REGISTRY
  // ─────────────────────────────────────────────────────────────
  {
    const list = await call('GET', '/api/tokens');
    record('Token Registry', 'list tokens', list, (x) => x.json && (Array.isArray(x.json.tokens) || Array.isArray(x.json) || x.json.registry));

    const scan = await call('POST', '/api/tokens', { action: 'scan' }, { timeout: 90000 });
    record('Token Registry', 'security scan', scan, (x) => x.json && x.json.success !== false);
  }

  // ─────────────────────────────────────────────────────────────
  // 12. AI SETTER
  // ─────────────────────────────────────────────────────────────
  {
    const list = await call('GET', '/api/setters');
    record('AI Setter', 'conversations list', list, (x) => Array.isArray(x.json) || (x.json && Array.isArray(x.json.conversations)));

    const convs = Array.isArray(list.json) ? list.json : list.json?.conversations || [];
    const cid = convs[0]?.id;
    if (cid) {
      const reply = await call('POST', '/api/setters/ai-reply', {
        conversationId: cid,
        message: 'Yes, we do struggle with missed calls after hours. What can you offer?',
      }, { timeout: 120000 });
      record('AI Setter', 'AI reply in conversation', reply, () => true);
    } else {
      record('AI Setter', 'AI reply (no conversation — creating one first)', { ok: false, status: 'n/a', ms: 0, text: 'no conversation found to test ai-reply' });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 13. BOOKINGS
  // ─────────────────────────────────────────────────────────────
  {
    const r = await call('GET', '/api/bookings/ai-suggest?filter=all');
    record('Bookings', 'AI scheduling suggestions', r, (x) => x.json && (Array.isArray(x.json.suggestions) || x.json.suggestions || x.json.success !== false));
  }

  // ─────────────────────────────────────────────────────────────
  // 14. MESSAGING
  // ─────────────────────────────────────────────────────────────
  {
    const r = await call('POST', '/api/messaging/ai-compose', {
      leadName: 'Jordan Rivera',
      company: 'Rivera Dental Group',
      channel: 'sms',
      goal: 'book a demo of the AI receptionist',
      tone: 'friendly',
    }, { timeout: 120000 });
    record('Messaging', 'AI compose SMS', r, (x) => x.json && (x.json.message || x.json.content || x.json.body || x.json.draft || x.json.success !== false));
  }

  // ─────────────────────────────────────────────────────────────
  // 15. OUTREACH
  // ─────────────────────────────────────────────────────────────
  {
    const list = await call('GET', '/api/outreach');
    record('Outreach', 'list outreach', list, () => true);

    const comp = await call('POST', '/api/outreach/ai-compose', {
      leadName: 'Jordan Rivera',
      company: 'Rivera Dental Group',
      channel: 'email',
      goal: 'book a 15-minute demo',
    }, { timeout: 120000 });
    record('Outreach', 'AI compose email', comp, (x) => x.json && (x.json.message || x.json.content || x.json.body || x.json.subject || x.json.success !== false));

    const seq = await call('POST', '/api/outreach/ai-sequence', {
      leadName: 'Jordan Rivera',
      company: 'Rivera Dental Group',
      goal: 'book a demo',
      steps: 3,
    }, { timeout: 120000 });
    record('Outreach', 'AI sequence generator', seq, () => true);
  }

  // ─────────────────────────────────────────────────────────────
  // 16. ANALYTICS
  // ─────────────────────────────────────────────────────────────
  {
    const r = await call('GET', '/api/analytics/insights', undefined, { timeout: 120000 });
    record('Analytics', 'AI insights', r, (x) => x.json && (x.json.insights || x.json.summary || Array.isArray(x.json) || x.json.success !== false));
  }

  // ─────────────────────────────────────────────────────────────
  // 17. REPORTS
  // ─────────────────────────────────────────────────────────────
  {
    const r = await call('POST', '/api/reports/ai-generate', {
      type: 'performance',
      period: 'week',
    }, { timeout: 120000 });
    record('Reports', 'AI report generation', r, (x) => x.json && (x.json.report || x.json.content || x.json.markdown || x.json.success !== false));
  }

  summary();
})().catch((e) => {
  console.error('HARNESS CRASH:', e);
  process.exit(2);
});
