'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Code2, Key, Zap, Database, Bot, BarChart3, Webhook, FileText, Copy, CheckCircle2 } from 'lucide-react';

const API_ENDPOINTS = [
  {
    category: 'Authentication',
    icon: Key,
    endpoints: [
      { method: 'POST', path: '/v1/auth/token', description: 'Generate an API access token using your client ID and secret.' },
      { method: 'POST', path: '/v1/auth/token/refresh', description: 'Refresh an expired access token without re-authenticating.' },
      { method: 'DELETE', path: '/v1/auth/token/{token_id}', description: 'Revoke a specific API token.' },
    ],
  },
  {
    category: 'ICP Management',
    icon: Database,
    endpoints: [
      { method: 'GET', path: '/v1/icps', description: 'List all Ideal Customer Profiles for your account.' },
      { method: 'POST', path: '/v1/icps', description: 'Create a new ICP definition with target criteria.' },
      { method: 'GET', path: '/v1/icps/{icp_id}', description: 'Retrieve a specific ICP by its unique identifier.' },
      { method: 'PATCH', path: '/v1/icps/{icp_id}', description: 'Update an existing ICP\'s criteria or configuration.' },
      { method: 'DELETE', path: '/v1/icps/{icp_id}', description: 'Delete an ICP and stop all associated agent operations.' },
    ],
  },
  {
    category: 'Agent Operations',
    icon: Bot,
    endpoints: [
      { method: 'GET', path: '/v1/agents', description: 'List all AI agents and their current status.' },
      { method: 'POST', path: '/v1/agents/{agent_type}/deploy', description: 'Deploy a specific agent type with optional configuration.' },
      { method: 'POST', path: '/v1/agents/{agent_id}/pause', description: 'Pause a running agent temporarily.' },
      { method: 'POST', path: '/v1/agents/{agent_id}/resume', description: 'Resume a paused agent.' },
      { method: 'GET', path: '/v1/agents/{agent_id}/logs', description: 'Retrieve execution logs for a specific agent.' },
    ],
  },
  {
    category: 'Leads',
    icon: Database,
    endpoints: [
      { method: 'GET', path: '/v1/leads', description: 'List leads with filtering, sorting, and pagination.' },
      { method: 'GET', path: '/v1/leads/{lead_id}', description: 'Retrieve a lead\'s full enriched profile.' },
      { method: 'POST', path: '/v1/leads/{lead_id}/score', description: 'Trigger re-scoring for a specific lead.' },
      { method: 'PATCH', path: '/v1/leads/{lead_id}/status', description: 'Update a lead\'s pipeline status.' },
      { method: 'POST', path: '/v1/leads/export', description: 'Export leads in CSV or JSON format.' },
    ],
  },
  {
    category: 'Outreach',
    icon: Webhook,
    endpoints: [
      { method: 'POST', path: '/v1/outreach/generate', description: 'Generate personalized outreach messages for leads.' },
      { method: 'GET', path: '/v1/outreach/templates', description: 'List available outreach templates.' },
      { method: 'POST', path: '/v1/outreach/send', description: 'Send an outreach message through a connected channel.' },
      { method: 'GET', path: '/v1/outreach/{message_id}/tracking', description: 'Get tracking data for a sent message (opens, clicks, replies).' },
    ],
  },
  {
    category: 'Analytics',
    icon: BarChart3,
    endpoints: [
      { method: 'GET', path: '/v1/analytics/pipeline', description: 'Retrieve pipeline metrics and conversion data.' },
      { method: 'GET', path: '/v1/analytics/agents', description: 'Get agent performance metrics and activity summaries.' },
      { method: 'GET', path: '/v1/analytics/campaigns', description: 'Retrieve campaign-level analytics and ROI calculations.' },
      { method: 'POST', path: '/v1/analytics/reports', description: 'Generate a custom report with specified dimensions and metrics.' },
    ],
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-500/10 text-emerald-400',
  POST: 'bg-blue-500/10 text-blue-400',
  PATCH: 'bg-amber-500/10 text-amber-400',
  DELETE: 'bg-red-500/10 text-red-400',
};

const CODE_EXAMPLES = {
  python: `import leadreach

client = leadreach.Client(api_key="lr_sk_...")

# Create an ICP
icp = client.icps.create(
    name="SaaS Decision Makers",
    criteria={
        "industry": ["SaaS", "Cloud Computing"],
        "company_size": "50-500",
        "roles": ["VP Sales", "Head of Growth"],
        "locations": ["US", "UK", "DE"]
    }
)

# Deploy the Prospect Discovery agent
agent = client.agents.deploy(
    agent_type="prospect_discovery",
    icp_id=icp.id,
    channels=["linkedin", "github", "web"]
)

# List discovered leads
leads = client.leads.list(
    icp_id=icp.id,
    min_score=70,
    status="qualified"
)

for lead in leads.data:
    print(f"{lead.name} - {lead.company} (Score: {lead.score})")`,

  node: `import LeadReach from 'leadreach-sdk';

const client = new LeadReach({ apiKey: 'lr_sk_...' });

// Create an ICP
const icp = await client.icps.create({
  name: 'SaaS Decision Makers',
  criteria: {
    industry: ['SaaS', 'Cloud Computing'],
    company_size: '50-500',
    roles: ['VP Sales', 'Head of Growth'],
    locations: ['US', 'UK', 'DE']
  }
});

// Deploy the Prospect Discovery agent
const agent = await client.agents.deploy({
  agent_type: 'prospect_discovery',
  icp_id: icp.id,
  channels: ['linkedin', 'github', 'web']
});

// List discovered leads
const leads = await client.leads.list({
  icp_id: icp.id,
  min_score: 70,
  status: 'qualified'
});

leads.data.forEach(lead => {
  console.log(\`\${lead.name} - \${lead.company} (Score: \${lead.score})\`);
});`,

  curl: `# Create an ICP
curl -X POST https://api.leadreach.ai/v1/icps \\
  -H "Authorization: Bearer lr_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "SaaS Decision Makers",
    "criteria": {
      "industry": ["SaaS", "Cloud Computing"],
      "company_size": "50-500",
      "roles": ["VP Sales", "Head of Growth"],
      "locations": ["US", "UK", "DE"]
    }
  }'

# Deploy the Prospect Discovery agent
curl -X POST https://api.leadreach.ai/v1/agents/prospect_discovery/deploy \\
  -H "Authorization: Bearer lr_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "icp_id": "icp_abc123",
    "channels": ["linkedin", "github", "web"]
  }'

# List discovered leads
curl -G https://api.leadreach.ai/v1/leads \\
  -H "Authorization: Bearer lr_sk_..." \\
  -d "icp_id=icp_abc123" \\
  -d "min_score=70" \\
  -d "status=qualified"`,
};

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState<'python' | 'node' | 'curl'>('python');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_EXAMPLES[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MarketingLayout>
      {/* Header */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              <Code2 className="h-3 w-3 mr-1" />
              API Reference
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              LeadReach <span className="text-gradient">API</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Full programmatic access to the LeadReach platform. Define ICPs, deploy agents, retrieve leads, and manage outreach — all through a RESTful API.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Start Code */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Quick <span className="text-gradient">Start</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Get up and running in minutes with our official SDKs for Python and Node.js, or use the REST API directly with cURL.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              {(['python', 'node', 'curl'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === tab
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                >
                  {tab === 'node' ? 'Node.js' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
              <button
                onClick={handleCopy}
                className="ml-auto p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title="Copy code"
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <div className="rounded-xl border border-border/30 bg-[#0d1117] p-6 overflow-x-auto">
              <pre className="text-sm text-gray-300 leading-relaxed">
                <code>{CODE_EXAMPLES[activeTab]}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Authentication Overview */}
      <section className="py-16 lg:py-20 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Key className="h-5 w-5 text-emerald-400" />
              Authentication
            </h2>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                All API requests require authentication via a Bearer token in the Authorization header. Generate your API key from the LeadReach dashboard under Settings &gt; API Keys. Keys are prefixed with <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-xs">lr_sk_</code> for secret keys and <code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">lr_pk_</code> for public keys.
              </p>
              <p>
                Secret keys have full access to all API endpoints. Public keys are restricted to read-only operations and are intended for client-side usage. Rotate your keys regularly and never expose secret keys in client-side code.
              </p>
              <div className="rounded-lg border border-border/30 bg-card/50 p-4 mt-4">
                <p className="text-xs text-muted-foreground mb-2">Example Authorization Header</p>
                <code className="text-sm text-emerald-400">Authorization: Bearer lr_sk_your_api_key_here</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Endpoints */}
      <section className="py-16 lg:py-20 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Endpoint <span className="text-gradient">Reference</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Complete list of available API endpoints organized by category. Click on an endpoint for detailed request and response schemas.
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-8">
            {API_ENDPOINTS.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.category}>
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon className="h-5 w-5 text-emerald-400" />
                    {group.category}
                  </h3>
                  <div className="space-y-2">
                    {group.endpoints.map((endpoint) => (
                      <div
                        key={endpoint.path}
                        className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/50 p-3 hover:border-emerald-500/20 transition-colors"
                      >
                        <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${METHOD_COLORS[endpoint.method]}`}>
                          {endpoint.method}
                        </span>
                        <code className="text-sm text-foreground font-mono">{endpoint.path}</code>
                        <span className="hidden sm:inline text-xs text-muted-foreground ml-auto">{endpoint.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SDKs & Tools CTA */}
      <section className="py-16 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border border-border/30 bg-card/50 p-8 lg:p-12 text-center overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-emerald-500/5 rounded-full blur-[80px]" />
            <div className="relative">
              <FileText className="h-8 w-8 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Need More <span className="text-gradient">Details</span>?
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Full request schemas, response examples, error codes, and rate limit details are available in the comprehensive documentation.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/docs">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm">
                    Full Documentation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href="https://github.com/getleads-humain/Lead-Reach" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="border-border/50 text-foreground hover:bg-secondary/50">
                    SDKs on GitHub
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
