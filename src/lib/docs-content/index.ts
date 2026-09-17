/**
 * Documentation content aggregator.
 *
 * Exports:
 *   - DOC_SECTIONS: the 13 cards visible on /docs (3 Getting Started, 6 AI Agents,
 *     2 API Reference, 2 Integrations)
 *   - DOC_CONTENT_MAP: a record keyed by anchor slug → DocContent object.
 *     When the user clicks any clickable entity inside any card, the docs page
 *     looks up the slug in this map and renders the full-length print-ready content
 *     in a slide-over panel.
 *
 * Total: 55 unique DocContent objects across all 4 tabs.
 */

export * from './types';

import type { DocContent, DocSectionCard } from './types';
import { gettingStartedDocs } from './getting-started';
import { aiAgentsDocsPart1 } from './ai-agents-part1';
import { aiAgentsDocsPart2 } from './ai-agents-part2';
import { apiReferenceDocs } from './api-reference';
import { integrationsDocs } from './integrations';

export const aiAgentsDocs: DocContent[] = [...aiAgentsDocsPart1, ...aiAgentsDocsPart2];

export const ALL_DOCS: DocContent[] = [
  ...gettingStartedDocs,
  ...aiAgentsDocs,
  ...apiReferenceDocs,
  ...integrationsDocs,
];

// Build a slug → DocContent lookup map for O(1) access from the UI.
export const DOC_CONTENT_MAP: Record<string, DocContent> = ALL_DOCS.reduce(
  (acc, doc) => {
    acc[doc.slug] = doc;
    return acc;
  },
  {} as Record<string, DocContent>,
);

// The 13 cards shown on the /docs page. The `icon` field is a lucide icon name
// (string) that the page maps to a component.
export const DOC_SECTIONS: DocSectionCard[] = [
  // ── Getting Started ───────────────────────────────────────────────────
  {
    title: 'Quick Start Guide',
    description:
      'Get up and running with LeadReach AI in under 10 minutes. From account creation to your first qualified leads, this guide walks you through every step of the initial setup process.',
    icon: 'Rocket',
    category: 'Getting Started',
    items: [
      { label: 'Creating Your Account', href: '#creating-account' },
      { label: 'Defining Your ICP', href: '#defining-icp' },
      { label: 'Deploying Your First Agent', href: '#deploying-agent' },
      { label: 'Reviewing Discovered Leads', href: '#reviewing-leads' },
    ],
  },
  {
    title: 'Ideal Customer Profile Builder',
    description:
      'The ICP Builder is the foundation of your lead generation strategy. Learn how to create precise, multi-dimensional customer profiles that guide your AI agents to discover the most relevant prospects for your business.',
    icon: 'Target',
    category: 'Getting Started',
    items: [
      { label: 'Industry & Vertical Targeting', href: '#icp-industry' },
      { label: 'Company Size & Revenue Filters', href: '#icp-company-size' },
      { label: 'Technology Stack Signals', href: '#icp-tech-stack' },
      { label: 'Geographic & Language Preferences', href: '#icp-geography' },
      { label: 'Growth & Intent Signals', href: '#icp-intent' },
    ],
  },
  {
    title: 'Campaign Management',
    description:
      'Create, configure, and manage lead generation campaigns. Understand how campaigns orchestrate multiple AI agents and channels to deliver a continuous pipeline of qualified leads.',
    icon: 'Workflow',
    category: 'Getting Started',
    items: [
      { label: 'Creating a New Campaign', href: '#campaign-create' },
      { label: 'Channel Configuration', href: '#campaign-channels' },
      { label: 'Pipeline Stage Definitions', href: '#campaign-pipeline' },
      { label: 'Approval Workflows', href: '#campaign-approvals' },
    ],
  },

  // ── AI Agents ──────────────────────────────────────────────────────────
  {
    title: 'Orchestrator Agent',
    description:
      'The Orchestrator is the central brain of your AI workforce. It coordinates all other agents, assigns tasks based on priority, manages dependencies between workflow stages, and ensures seamless collaboration across the entire lead generation pipeline.',
    icon: 'Bot',
    category: 'AI Agents',
    items: [
      { label: 'How Orchestration Works', href: '#orchestrator-overview' },
      { label: 'Task Assignment & Priority', href: '#orchestrator-tasks' },
      { label: 'Error Recovery & Retry Logic', href: '#orchestrator-recovery' },
      { label: 'Custom Workflow Configuration', href: '#orchestrator-workflows' },
    ],
  },
  {
    title: 'Prospect Discovery Agent',
    description:
      'The Prospect Discovery Agent searches across 17+ channels to find potential leads matching your ICP. It leverages web reading, semantic search, professional networks, social platforms, and public databases to build a comprehensive prospect universe.',
    icon: 'Search',
    category: 'AI Agents',
    items: [
      { label: 'Supported Research Channels', href: '#discovery-channels' },
      { label: 'Search Strategy & Filtering', href: '#discovery-strategy' },
      { label: 'Channel Authentication Setup', href: '#discovery-auth' },
      { label: 'Rate Limits & Quotas', href: '#discovery-limits' },
    ],
  },
  {
    title: 'Data Enrichment Agent',
    description:
      'The Data Enrichment Agent takes raw prospect data and transforms it into rich, actionable profiles. It appends company details, technology stacks, funding information, social profiles, and key decision-maker contacts to every discovered lead.',
    icon: 'Database',
    category: 'AI Agents',
    items: [
      { label: 'Enrichment Data Points', href: '#enrichment-data' },
      { label: 'Data Sources & Accuracy', href: '#enrichment-sources' },
      { label: 'Real-Time vs. Batch Enrichment', href: '#enrichment-modes' },
      { label: 'Handling Incomplete Data', href: '#enrichment-incomplete' },
    ],
  },
  {
    title: 'Lead Qualification Agent',
    description:
      'The Lead Qualification Agent scores and ranks every discovered lead based on how well they match your ICP criteria. It uses a weighted scoring model that considers firmographic fit, technology signals, engagement indicators, and growth patterns.',
    icon: 'Users',
    category: 'AI Agents',
    items: [
      { label: 'Scoring Methodology', href: '#qualification-scoring' },
      { label: 'Weight Configuration', href: '#qualification-weights' },
      { label: 'Score Thresholds & Stages', href: '#qualification-thresholds' },
      { label: 'Automated Disqualification Rules', href: '#qualification-disqualify' },
    ],
  },
  {
    title: 'Outreach Composer Agent',
    description:
      'The Outreach Composer Agent crafts highly personalized outreach messages using enriched lead data. Each message references specific details about the prospect, their company, and their recent activities to create genuinely relevant communication at scale.',
    icon: 'MessageSquare',
    category: 'AI Agents',
    items: [
      { label: 'Personalization Engine', href: '#outreach-personalization' },
      { label: 'Message Templates & Variables', href: '#outreach-templates' },
      { label: 'A/B Testing Outreach', href: '#outreach-ab-testing' },
      { label: 'Compliance & CAN-SPAM', href: '#outreach-compliance' },
    ],
  },
  {
    title: 'Analytics & Reporting Agent',
    description:
      'The Analytics & Reporting Agent generates comprehensive dashboards and reports covering campaign performance, channel effectiveness, pipeline velocity, agent efficiency, and ROI metrics to help you continuously optimize your lead generation strategy.',
    icon: 'BarChart3',
    category: 'AI Agents',
    items: [
      { label: 'Dashboard Overview', href: '#analytics-dashboard' },
      { label: 'Campaign Performance Metrics', href: '#analytics-campaign' },
      { label: 'Channel Attribution', href: '#analytics-attribution' },
      { label: 'Custom Reports & Export', href: '#analytics-reports' },
    ],
  },

  // ── API Reference ──────────────────────────────────────────────────────
  {
    title: 'REST API',
    description:
      'Full programmatic access to every feature of the LeadReach AI platform. Create ICPs, deploy agents, retrieve leads, trigger outreach, and manage campaigns via our RESTful API. Available on Professional and Enterprise plans with comprehensive documentation and SDKs.',
    icon: 'Code2',
    category: 'API Reference',
    items: [
      { label: 'Authentication & API Keys', href: '#api-auth' },
      { label: 'Rate Limits & Quotas', href: '#api-limits' },
      { label: 'Lead Endpoints', href: '#api-leads' },
      { label: 'Campaign Endpoints', href: '#api-campaigns' },
      { label: 'Webhook Configuration', href: '#api-webhooks' },
      { label: 'Error Codes & Handling', href: '#api-errors' },
    ],
  },
  {
    title: 'Webhook Events',
    description:
      'Subscribe to real-time events from LeadReach AI and trigger actions in your own systems. Receive notifications when leads are discovered, qualified, enriched, or when outreach messages are sent, opened, or replied to.',
    icon: 'Webhook',
    category: 'API Reference',
    items: [
      { label: 'Available Event Types', href: '#webhook-events' },
      { label: 'Webhook Setup & Verification', href: '#webhook-setup' },
      { label: 'Payload Schemas', href: '#webhook-payloads' },
      { label: 'Retry Logic & Delivery Guarantees', href: '#webhook-retries' },
    ],
  },

  // ── Integrations ───────────────────────────────────────────────────────
  {
    title: 'CRM Integrations',
    description:
      'Connect LeadReach AI with your existing CRM to sync leads, enrichment data, and outreach activities bidirectionally in real-time. Native integrations available for Salesforce, HubSpot, and Pipedrive with custom API support for any system.',
    icon: 'Plug',
    category: 'Integrations',
    items: [
      { label: 'Salesforce Integration', href: '#integration-salesforce' },
      { label: 'HubSpot Integration', href: '#integration-hubspot' },
      { label: 'Pipedrive Integration', href: '#integration-pipedrive' },
      { label: 'Custom CRM via API', href: '#integration-custom' },
    ],
  },
  {
    title: 'Email & Outreach Integrations',
    description:
      'Send AI-crafted outreach messages through your preferred email platform. Connect Gmail, Outlook, or custom SMTP servers, and manage sequences through popular outreach tools like Outreach.io, Salesloft, and Lemlist.',
    icon: 'Settings',
    category: 'Integrations',
    items: [
      { label: 'Gmail / Google Workspace', href: '#integration-gmail' },
      { label: 'Outlook / Microsoft 365', href: '#integration-outlook' },
      { label: 'Custom SMTP Configuration', href: '#integration-smtp' },
      { label: 'Outreach.io & Salesloft', href: '#integration-outreach-tools' },
    ],
  },
];
