/**
 * Task 18 — Round 2: retest the 16 failures with EXACT payloads the UI sends.
 * Usage: node scripts/test-all-tools-r2.js
 */
const fs = require('fs');

const BASE = 'http://localhost:3000';
const COOKIE = fs.readFileSync('/tmp/sb-cookie.txt', 'utf8').trim();
const results = [];
let step = 0;

async function call(method, url, body, opts = {}) {
  const started = Date.now();
  try {
    const res = await fetch(BASE + url, {
      method,
      headers: { Cookie: COOKIE, ...(body && !opts.form ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? (opts.form ? body : JSON.stringify(body)) : undefined,
      redirect: 'manual',
      signal: AbortSignal.timeout(opts.timeout || 300000),
    });
    const ms = Date.now() - started;
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, ok: res.status >= 200 && res.status < 300, ms, json, text };
  } catch (e) {
    return { status: 0, ok: false, ms: Date.now() - started, json: null, text: String(e.message || e) };
  }
}

function record(tool, workflow, r, check) {
  step += 1;
  const pass = r.ok && (!check || check(r));
  const evidence = r.json ? JSON.stringify(r.json).slice(0, 200) : (r.text || '').slice(0, 200);
  results.push({ step, tool, workflow, pass, status: r.status, ms: r.ms });
  console.log(`${pass ? 'PASS' : 'FAIL'}  [${String(step).padStart(2)}] ${tool} — ${workflow}  (${r.status}, ${r.ms}ms)${pass ? '' : '\n      ↳ ' + evidence}`);
  return r;
}

function summary() {
  const pass = results.filter((r) => r.pass).length;
  const fail = results.filter((r) => !r.pass);
  console.log(`\n${'='.repeat(70)}\nROUND 2: ${pass}/${results.length} passed` + (fail.length ? `\nFAILURES: ${fail.map((f) => `#${f.step} ${f.tool}/${f.workflow} (${f.status})`).join('\n  ')}` : ' — ALL GREEN'));
  process.exit(fail.length ? 1 : 0);
}

(async () => {
  // ── Context: real campaign + lead ids ──────────────────────────
  const campaigns = await call('GET', '/api/campaigns');
  const campaignId = Array.isArray(campaigns.json) && campaigns.json[0] ? campaigns.json[0].id : null;
  console.log(`# context: campaignId = ${campaignId}`);

  const leads = await call('GET', '/api/leads?limit=10');
  const leadArr = Array.isArray(leads.json) ? leads.json : leads.json?.leads || [];
  const leadId = leadArr[0]?.id || null;
  const leadCompany = leadArr[0]?.companyName || 'Acme Corp';
  console.log(`# context: leadId = ${leadId} (${leadCompany}), total visible = ${leadArr.length}`);

  // ── 1. Ask AI: smart-chat with correct payload ─────────────────
  {
    const r = await call('POST', '/api/ai-assistant/smart-chat', {
      messages: [{ role: 'user', content: 'Give me one concrete growth action for my outreach this week.' }],
      currentPage: '/app',
    }, { timeout: 120000 });
    record('Ask AI', 'smart-chat (UI payload)', r, (x) => x.json && (x.json.content || x.json.message || x.json.reply || x.json.text || x.json.data));
  }

  // ── 2. Dashboard: agents list with correct shape ───────────────
  {
    const r = await call('GET', '/api/agents');
    record('Dashboard/Agents', 'agents list {tasks, agentStats}', r, (x) => x.json && Array.isArray(x.json.tasks) && x.json.agentStats);
  }

  // ── 3. ICP Builder: GET list + save + score + delete ───────────
  {
    const list = await call('GET', '/api/icp');
    record('ICP Builder', 'GET profiles', list, (x) => x.json && Array.isArray(x.json.profiles));

    const saved = await call('POST', '/api/icp', {
      action: 'save',
      profile: {
        name: 'Task18 Test ICP',
        industry: 'Dental services',
        companySize: '1-20 employees',
        location: 'Texas, US',
        painPoints: ['missed calls', 'manual scheduling'],
        goals: ['automate front desk'],
        description: 'Created by Task 18 verification run',
      },
    });
    record('ICP Builder', 'save profile', saved, (x) => x.json && x.json.id);
    const icpId = saved.json?.id;

    if (icpId) {
      const scored = await call('POST', '/api/icp', {
        action: 'score',
        icp: { name: 'Task18 Test ICP', industry: 'Dental services' },
        lead: { companyName: leadCompany, industry: 'Dental' },
      }, { timeout: 120000 });
      record('ICP Builder', 'score lead vs ICP', scored, () => true);

      const del = await call('POST', '/api/icp', { action: 'delete', id: icpId });
      record('ICP Builder', 'delete profile', del, () => true);
    }
  }

  // ── 4. Campaigns: pipeline-status-batch via GET ────────────────
  if (campaignId) {
    const r = await call('GET', `/api/campaigns/pipeline-status-batch?campaignIds=${encodeURIComponent(campaignId)}`);
    record('Campaigns', 'pipeline status batch (GET)', r, (x) => x.json && x.json[campaignId] !== undefined);
  }

  // ── 5. Leads: create with required fields + full lifecycle ─────
  let createdLeadId = null;
  if (campaignId) {
    const created = await call('POST', '/api/leads', {
      campaignId,
      companyName: 'Rivera Dental Group',
      website: 'https://riveradental.example.com',
      industry: 'Dental',
      city: 'Austin',
      stateProvince: 'TX',
      country: 'US',
      phoneMain: '+1-512-555-0184',
      generalEmail: 'frontdesk@riveradental.example.com',
      leadSource: 'task18-verification',
    });
    record('Leads', 'create lead (company style)', created, (x) => x.json && x.json.id);
    createdLeadId = created.json?.id || null;

    const target = createdLeadId || leadId;
    if (target) {
      const next = await call('POST', '/api/leads/ai-next-action', {
        leadId: target,
        companyName: 'Rivera Dental Group',
        industry: 'Dental',
        leadScore: 72,
      }, { timeout: 120000 });
      record('Leads', 'AI next action (flat route)', next, (x) => x.json && (x.json.action || x.json.result || x.json.success !== false));

      const li = await call('POST', '/api/lead-intelligence', {
        action: 'predict_conversion',
        leadId: target,
      }, { timeout: 120000 });
      record('Leads', 'lead intelligence predict_conversion', li, () => true);

      const exec = await call('POST', `/api/leads/${target}/execute-action`, {
        actionType: 'research',
        actionTitle: 'Verify company website and services',
        actionDescription: 'Research the company online',
        leadData: { id: target, companyName: 'Rivera Dental Group' },
        stage: 2,
        previousResults: [],
      }, { timeout: 120000 });
      record('Leads', 'execute pipeline action', exec, () => true);

      const enrich = await call('POST', `/api/leads/${target}/live-enrich`, {
        targetTier: 'super_hot',
        phases: [1, 2],
      }, { timeout: 180000 });
      record('Leads', 'live enrichment', enrich, () => true);
    }
    if (createdLeadId) {
      const del = await call('DELETE', `/api/leads/${createdLeadId}`);
      record('Leads', 'delete lead', del, () => true);
    }
  }

  // ── 6. Enrichment: FormData flows ──────────────────────────────
  {
    // Build a small CSV like the UI file-upload flow
    const csv = 'Company Name,Website,Industry,City\nRivera Dental Group,https://riveradental.example.com,Dental,Austin\n';
    const analyzeForm = new FormData();
    analyzeForm.append('file', new Blob([csv], { type: 'text/csv' }), 'task18-leads.csv');
    const an = await call('POST', '/api/enrichment/analyze', analyzeForm, { form: true, timeout: 120000 });
    record('Enrichment', 'analyze CSV (FormData)', an, (x) => x.json && (x.json.profile || x.json.columns || x.json.success !== false));

    if (campaignId) {
      const impForm = new FormData();
      impForm.append('file', new Blob([csv], { type: 'text/csv' }), 'task18-leads.csv');
      impForm.append('campaignId', campaignId);
      const imp = await call('POST', '/api/leads/bulk-import', impForm, { form: true, timeout: 120000 });
      record('Enrichment', 'bulk import CSV (FormData)', imp, (x) => x.json && (x.json.imported !== undefined || x.json.success !== false));

      const be = await call('POST', '/api/leads/bulk-enrich', { campaignId, limit: 2 }, { timeout: 300000 });
      record('Enrichment', 'bulk enrich campaign', be, (x) => x.json && (x.json.enriched !== undefined || x.json.total !== undefined || x.json.success !== false));
    }
  }

  // ── 7. Connectors: create with full UI field set ───────────────
  {
    const created = await call('POST', '/api/connectors', {
      name: 'Task18 Test Webhook',
      connectorKey: 'webhook',
      type: 'webhook',
      provider: 'custom',
      icon: 'Plug',
      color: '#10B981',
      description: 'Task 18 verification connector',
      authType: 'none',
      environment: 'production',
    });
    record('Connectors', 'create connector (UI fields)', created, (x) => x.json && (x.json.id || x.json.connector));
    const cid = created.json?.id || created.json?.connector?.id;
    if (cid) {
      const test = await call('POST', `/api/connectors/${cid}/test`, {});
      record('Connectors', 'test connector', test, () => true);
      const toggle = await call('POST', `/api/connectors/${cid}/toggle`, {});
      record('Connectors', 'toggle connector', toggle, () => true);
      const sync = await call('POST', `/api/connectors/${cid}/sync`, {}, { timeout: 120000 });
      record('Connectors', 'sync connector', sync, () => true);
      const del = await call('DELETE', `/api/connectors/${cid}`);
      record('Connectors', 'delete connector', del, () => true);
    }
  }

  // ── 8. Agents: execute pending task or all ─────────────────────
  {
    const agents = await call('GET', '/api/agents');
    const pending = (agents.json?.tasks || []).filter((t) => t.status === 'pending');
    console.log(`# context: ${pending.length} pending agent task(s)`);
    let r;
    if (pending.length > 0) {
      r = await call('POST', '/api/agents/execute', { mode: 'single', taskId: pending[0].id }, { timeout: 300000 });
      record('Agents', `execute single task (${pending[0].agentName})`, r, () => true);
    } else {
      r = await call('POST', '/api/agents/execute', { mode: 'all' }, { timeout: 300000 });
      record('Agents', 'execute all pending', r, (x) => x.json && (x.json.results || x.json.success !== false));
    }
  }

  // ── 9. AI Workforce: train with long timeout ───────────────────
  {
    const r = await call('POST', '/api/workforce', { action: 'train', slug: 'devops-automator' }, { timeout: 300000 });
    record('AI Workforce', 'train single agent', r, (x) => x.json && (x.json.ok !== undefined || x.json.trained || x.json.success));
  }

  // ── 10. AI Setter: create setter + AI reply ─────────────────────
  {
    const created = await call('POST', '/api/setters', {
      name: 'Task18 Test Setter',
      description: 'Verification setter for dental clinic leads',
      language: 'en',
      channels: ['webchat', 'sms'],
      avatar: '🤖',
    });
    record('AI Setter', 'create setter', created, (x) => x.json && x.json.id);
    const setterId = created.json?.id;
    if (setterId) {
      const reply = await call('POST', '/api/setters/ai-reply', {
        setterId,
        leadName: 'Jordan Rivera',
        leadChannel: 'webchat',
        conversationHistory: [
          { role: 'lead', content: 'Hi, we keep missing calls at our dental office. Can you help?' },
        ],
        userInstruction: 'Qualify this lead and book a demo',
      }, { timeout: 120000 });
      record('AI Setter', 'AI reply (UI payload)', reply, (x) => x.json && (x.json.reply || x.json.message || x.json.content || x.json.success !== false));
      const del = await call('DELETE', `/api/setters/${setterId}`);
      record('AI Setter', 'delete setter', del, () => true);
    }
  }

  summary();
})().catch((e) => { console.error('HARNESS CRASH:', e); process.exit(2); });
