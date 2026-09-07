/**
 * Platform Tokenizer
 * ===================
 * Scans the entire codebase and creates PlatformToken records for every
 * trackable entity: API routes, components, pages, Prisma models, workforce
 * agents, blog posts, FAQ items, lib modules, and business concepts.
 *
 * Each token gets a unique tokenKey (e.g., "api:campaigns:stream") that
 * can be referenced, tracked, audited, and updated across all future changes.
 *
 * Categories:
 *   api        — API route handlers
 *   component  — React components
 *   page       — App router pages
 *   model      — Prisma data models
 *   agent      — AI workforce agents
 *   feature    — Platform features (campaigns, leads, enrichment, etc.)
 *   blog       — Blog posts
 *   faq        — FAQ items
 *   lib        — Library modules
 *   asset      — Public assets
 *   business   — Business concepts (pricing plans, personas, etc.)
 *   config     — Configuration files
 */

import { db } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';

// ── Token creation helper with audit trail ────────────────────────────

async function createOrUpdateToken(params: {
  tokenKey: string;
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  filePath?: string;
  route?: string;
  prismaModel?: string;
  tags?: string[];
  businessValue?: string;
  owner?: string;
  priority?: string;
}): Promise<void> {
  const existing = await db.platformToken.findUnique({
    where: { tokenKey: params.tokenKey },
  });

  if (existing) {
    // Update if any field changed
    const updates: Record<string, unknown> = {};
    if (existing.name !== params.name) updates.name = params.name;
    if (existing.description !== params.description && params.description) updates.description = params.description;
    if (existing.filePath !== params.filePath && params.filePath) updates.filePath = params.filePath;
    if (existing.route !== params.route && params.route) updates.route = params.route;
    if (existing.businessValue !== params.businessValue && params.businessValue) updates.businessValue = params.businessValue;
    if (existing.owner !== params.owner && params.owner) updates.owner = params.owner;
    updates.lastScannedAt = new Date();

    if (Object.keys(updates).length > 1) { // more than just lastScannedAt
      updates.version = { increment: 1 };
      const updated = await db.platformToken.update({
        where: { tokenKey: params.tokenKey },
        data: updates,
      });

      // Create audit entry
      await db.platformTokenAudit.create({
        data: {
          tokenId: updated.id,
          action: 'updated',
          description: `Token updated during scan: ${Object.keys(updates).filter(k => k !== 'lastScannedAt' && k !== 'version').join(', ')}`,
          changedBy: 'tokenizer',
          version: updated.version,
        },
      });
    } else {
      // Just update scan timestamp
      await db.platformToken.update({
        where: { tokenKey: params.tokenKey },
        data: { lastScannedAt: new Date() },
      });
    }
  } else {
    // Create new token
    const token = await db.platformToken.create({
      data: {
        tokenKey: params.tokenKey,
        name: params.name,
        category: params.category,
        subcategory: params.subcategory || null,
        description: params.description || null,
        filePath: params.filePath || null,
        route: params.route || null,
        prismaModel: params.prismaModel || null,
        tags: params.tags ? JSON.stringify(params.tags) : null,
        businessValue: params.businessValue || null,
        owner: params.owner || null,
        priority: params.priority || 'normal',
        lastScannedAt: new Date(),
      },
    });

    // Create audit entry
    await db.platformTokenAudit.create({
      data: {
        tokenId: token.id,
        action: 'created',
        description: `Token created: ${params.category}/${params.tokenKey}`,
        changedBy: 'tokenizer',
        version: 1,
      },
    });
  }
}

// ── Scanner functions ────────────────────────────────────────────────

const SRC_DIR = path.join(process.cwd(), 'src');

function scanApiRoutes(): Array<{ tokenKey: string; name: string; route: string; filePath: string; subcategory: string }> {
  const apiDir = path.join(SRC_DIR, 'app', 'api');
  const routes: Array<{ tokenKey: string; name: string; route: string; filePath: string; subcategory: string }> = [];

  function walk(dir: string, prefix: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, `${prefix}/${entry.name}`);
      } else if (entry.name === 'route.ts') {
        const route = prefix || '/';
        const parts = route.split('/').filter(Boolean);
        const subcategory = parts[0] || 'root';
        const tokenKey = `api:${parts.join(':') || 'root'}`;
        const name = parts.length > 0 ? parts.map(p => p.replace(/^\[|\]$/g, '')).join(' / ') : 'Root API';
        routes.push({
          tokenKey,
          name: `${name} API`,
          route: `/api${route}`,
          filePath: fullPath,
          subcategory,
        });
      }
    }
  }

  if (fs.existsSync(apiDir)) {
    walk(apiDir, '');
  }

  return routes;
}

function scanComponents(): Array<{ tokenKey: string; name: string; filePath: string; subcategory: string }> {
  const compDir = path.join(SRC_DIR, 'components');
  const components: Array<{ tokenKey: string; name: string; filePath: string; subcategory: string }> = [];

  function walk(dir: string, prefix: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, prefix ? `${prefix}/${entry.name}` : entry.name);
      } else if (entry.name.endsWith('.tsx') && !entry.name.startsWith('_')) {
        const componentName = entry.name.replace('.tsx', '');
        const subcategory = prefix.split('/')[0] || 'root';
        const tokenKey = `component:${prefix ? prefix.replace(/\//g, ':') + ':' : ''}${componentName}`;
        components.push({
          tokenKey,
          name: componentName,
          filePath: fullPath,
          subcategory,
        });
      }
    }
  }

  if (fs.existsSync(compDir)) {
    walk(compDir, '');
  }

  return components;
}

function scanPages(): Array<{ tokenKey: string; name: string; route: string; filePath: string; subcategory: string }> {
  const appDir = path.join(SRC_DIR, 'app');
  const pages: Array<{ tokenKey: string; name: string; route: string; filePath: string; subcategory: string }> = [];

  function walk(dir: string, prefix: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('_') && entry.name !== 'api') {
        walk(fullPath, `${prefix}/${entry.name}`);
      } else if (entry.name === 'page.tsx') {
        const route = prefix || '/';
        const parts = route.split('/').filter(Boolean);
        const subcategory = parts[0] || 'root';
        const tokenKey = `page:${parts.join(':') || 'root'}`;
        const name = parts.length > 0 ? parts.join(' / ') : 'Home';
        pages.push({
          tokenKey,
          name: `${name} Page`,
          route,
          filePath: fullPath,
          subcategory,
        });
      }
    }
  }

  if (fs.existsSync(appDir)) {
    walk(appDir, '');
  }

  return pages;
}

function scanPrismaModels(): Array<{ tokenKey: string; name: string; prismaModel: string }> {
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  if (!fs.existsSync(schemaPath)) return [];

  const content = fs.readFileSync(schemaPath, 'utf-8');
  const modelMatches = content.matchAll(/^model\s+(\w+)\s*\{/gm);
  const models: Array<{ tokenKey: string; name: string; prismaModel: string }> = [];

  for (const match of modelMatches) {
    const modelName = match[1];
    models.push({
      tokenKey: `model:${modelName.toLowerCase()}`,
      name: `${modelName} Model`,
      prismaModel: modelName,
    });
  }

  return models;
}

function scanLibModules(): Array<{ tokenKey: string; name: string; filePath: string; subcategory: string }> {
  const libDir = path.join(SRC_DIR, 'lib');
  const modules: Array<{ tokenKey: string; name: string; filePath: string; subcategory: string }> = [];

  function walk(dir: string, prefix: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, prefix ? `${prefix}/${entry.name}` : entry.name);
      } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
        const moduleName = entry.name.replace('.ts', '');
        const subcategory = prefix.split('/')[0] || 'root';
        const tokenKey = `lib:${prefix ? prefix.replace(/\//g, ':') + ':' : ''}${moduleName}`;
        modules.push({
          tokenKey,
          name: moduleName,
          filePath: fullPath,
          subcategory,
        });
      }
    }
  }

  if (fs.existsSync(libDir)) {
    walk(libDir, '');
  }

  return modules;
}

function getBusinessTokens(): Array<{
  tokenKey: string; name: string; category: string; subcategory: string;
  description: string; businessValue: string; owner: string; priority: string;
}> {
  return [
    // ── Business: Company Identity ──
    { tokenKey: 'business:company:leadreach-ai', name: 'LeadReach AI Corp', category: 'business', subcategory: 'company', description: 'The business entity — LeadReach AI Corporation', businessValue: 'Core business', owner: 'prometheus-ceo', priority: 'critical' },
    { tokenKey: 'business:product:platform', name: 'LeadReach Platform', category: 'business', subcategory: 'product', description: 'The agentic B2B lead generation platform', businessValue: 'Core product', owner: 'prometheus-ceo', priority: 'critical' },

    // ── Business: Pricing Plans ──
    { tokenKey: 'business:plan:launchpad', name: 'Launchpad Plan (Free)', category: 'business', subcategory: 'pricing', description: 'Free forever plan — 2 agents, 100 leads/month', businessValue: 'Entry point for new users', owner: 'cfo-ledger', priority: 'high' },
    { tokenKey: 'business:plan:scout', name: 'Scout Plan ($29/mo)', category: 'business', subcategory: 'pricing', description: '4 agents, 500 leads, 5 channels', businessValue: 'Entry paid tier', owner: 'cfo-ledger', priority: 'high' },
    { tokenKey: 'business:plan:setter', name: 'Setter Plan ($99/mo)', category: 'business', subcategory: 'pricing', description: '6 agents, 2000 leads, 10 channels', businessValue: 'Growth tier', owner: 'cfo-ledger', priority: 'high' },
    { tokenKey: 'business:plan:closer', name: 'Closer Plan ($299/mo)', category: 'business', subcategory: 'pricing', description: '8 agents, 5000 leads, 15 channels', businessValue: 'Mid-market tier', owner: 'cfo-ledger', priority: 'high' },
    { tokenKey: 'business:plan:command', name: 'Command Plan ($599/mo)', category: 'business', subcategory: 'pricing', description: '14 agents, 15000 leads, all channels, API', businessValue: 'Premium tier', owner: 'cfo-ledger', priority: 'high' },
    { tokenKey: 'business:plan:enterprise', name: 'Enterprise Plan (Custom)', category: 'business', subcategory: 'pricing', description: 'Unlimited leads, dedicated infra, SSO, custom SLAs', businessValue: 'Enterprise tier', owner: 'cfo-ledger', priority: 'high' },
    { tokenKey: 'business:plan:founders-pass', name: 'Founders Pass ($2497 lifetime)', category: 'business', subcategory: 'pricing', description: 'Lifetime Command-tier access, one-time payment', businessValue: 'Early adopter incentive', owner: 'cfo-ledger', priority: 'high' },

    // ── Business: Platform Features ──
    { tokenKey: 'feature:campaigns', name: 'Campaigns', category: 'feature', subcategory: 'core', description: 'Multi-pass lead discovery pipeline', businessValue: 'Primary lead generation engine', owner: 'kronos-orchestrator', priority: 'critical' },
    { tokenKey: 'feature:leads', name: 'Leads', category: 'feature', subcategory: 'core', description: 'Lead management with 60+ fields, scoring, tiers', businessValue: 'Core data asset', owner: 'sales-engine', priority: 'critical' },
    { tokenKey: 'feature:ai-workforce', name: 'AI Workforce', category: 'feature', subcategory: 'core', description: '14 AI agents across 4 departments', businessValue: 'Differentiation', owner: 'prometheus-ceo', priority: 'critical' },
    { tokenKey: 'feature:data-enrichment', name: 'Data Enrichment', category: 'feature', subcategory: 'core', description: 'CSV import, AI pipeline, field coverage, visualization', businessValue: 'Data quality', owner: 'feature-developer', priority: 'high' },
    { tokenKey: 'feature:prospect-discovery', name: 'Prospect Discovery', category: 'feature', subcategory: 'core', description: '8-agent orchestrator for real-time company research', businessValue: 'Research capability', owner: 'kronos-orchestrator', priority: 'high' },
    { tokenKey: 'feature:dashboard', name: 'Dashboard', category: 'feature', subcategory: 'core', description: 'Unified metrics via /api/dashboard/stats', businessValue: 'Visibility', owner: 'prometheus-ceo', priority: 'high' },
    { tokenKey: 'feature:smart-autofill', name: 'Smart Auto-Fill', category: 'feature', subcategory: 'enrichment', description: 'One-click 60+ field enrichment with LLM + web research', businessValue: 'Lead quality', owner: 'feature-developer', priority: 'high' },
    { tokenKey: 'feature:office-chat', name: 'Office Chat', category: 'feature', subcategory: 'workforce', description: 'Real-time inter-agent communication', businessValue: 'Transparency', owner: 'kronos-orchestrator', priority: 'normal' },
    { tokenKey: 'feature:work-log', name: 'Work Log', category: 'feature', subcategory: 'workforce', description: 'Time-based activity tracking (Year→Month→Day→Hour)', businessValue: 'Auditability', owner: 'synthetic-hr', priority: 'normal' },
    { tokenKey: 'feature:247-generator', name: '24/7 Activity Generator', category: 'feature', subcategory: 'workforce', description: 'Background activity generator for continuous agent activity', businessValue: 'Always-on appearance', owner: 'kronos-orchestrator', priority: 'normal' },
    { tokenKey: 'feature:workforce-bridge', name: 'Workforce Bridge', category: 'feature', subcategory: 'workforce', description: 'Connects campaign events to AI workforce agents', businessValue: 'Integration', owner: 'kronos-orchestrator', priority: 'high' },

    // ── Business: Tech Stack ──
    { tokenKey: 'business:tech:nextjs-16', name: 'Next.js 16', category: 'business', subcategory: 'tech-stack', description: 'App Router, server components, API routes', businessValue: 'Frontend framework', owner: 'core-architect', priority: 'critical' },
    { tokenKey: 'business:tech:react-19', name: 'React 19', category: 'business', subcategory: 'tech-stack', description: 'UI library with concurrent features', businessValue: 'UI framework', owner: 'core-architect', priority: 'critical' },
    { tokenKey: 'business:tech:prisma', name: 'Prisma ORM', category: 'business', subcategory: 'tech-stack', description: 'Type-safe database ORM (PostgreSQL/SQLite)', businessValue: 'Data layer', owner: 'core-architect', priority: 'critical' },
    { tokenKey: 'business:tech:tailwind-v4', name: 'Tailwind CSS v4', category: 'business', subcategory: 'tech-stack', description: 'OKLCH colors, utility-first CSS', businessValue: 'Styling', owner: 'core-architect', priority: 'high' },
    { tokenKey: 'business:tech:z-ai-sdk', name: 'z-ai-web-dev-sdk', category: 'business', subcategory: 'tech-stack', description: 'LLM, web search, page reader, vision, TTS, ASR', businessValue: 'AI capabilities', owner: 'core-architect', priority: 'critical' },
    { tokenKey: 'business:tech:supabase', name: 'Supabase', category: 'business', subcategory: 'tech-stack', description: 'Auth, database, realtime', businessValue: 'Authentication', owner: 'cyber-guardian', priority: 'critical' },

    // ── Business: Compliance ──
    { tokenKey: 'business:compliance:soc2', name: 'SOC 2 Type II', category: 'business', subcategory: 'compliance', description: 'Annual security audit certification', businessValue: 'Enterprise sales enabler', owner: 'compliance-legal', priority: 'high' },
    { tokenKey: 'business:compliance:gdpr', name: 'GDPR Compliance', category: 'business', subcategory: 'compliance', description: 'EU data protection regulation compliance', businessValue: 'EU market access', owner: 'compliance-legal', priority: 'high' },
    { tokenKey: 'business:compliance:ccpa', name: 'CCPA Compliance', category: 'business', subcategory: 'compliance', description: 'California Consumer Privacy Act compliance', businessValue: 'CA market access', owner: 'compliance-legal', priority: 'high' },
  ];
}

// ── Main tokenizer function ──────────────────────────────────────────

export async function tokenizeCodebase(): Promise<{
  apiRoutes: number;
  components: number;
  pages: number;
  models: number;
  libModules: number;
  agents: number;
  blogPosts: number;
  faqItems: number;
  businessTokens: number;
  total: number;
}> {
  let total = 0;
  const counts = { apiRoutes: 0, components: 0, pages: 0, models: 0, libModules: 0, agents: 0, blogPosts: 0, faqItems: 0, businessTokens: 0 };

  // ── API Routes ──
  const apiRoutes = scanApiRoutes();
  for (const route of apiRoutes) {
    await createOrUpdateToken({
      tokenKey: route.tokenKey,
      name: route.name,
      category: 'api',
      subcategory: route.subcategory,
      description: `API endpoint at ${route.route}`,
      filePath: route.filePath,
      route: route.route,
      tags: ['api', route.subcategory],
      owner: 'core-architect',
      priority: 'high',
    });
    total++; counts.apiRoutes++;
  }

  // ── Components ──
  const components = scanComponents();
  for (const comp of components) {
    await createOrUpdateToken({
      tokenKey: comp.tokenKey,
      name: comp.name,
      category: 'component',
      subcategory: comp.subcategory,
      description: `React component: ${comp.name}`,
      filePath: comp.filePath,
      tags: ['component', comp.subcategory],
      owner: 'feature-developer',
      priority: 'normal',
    });
    total++; counts.components++;
  }

  // ── Pages ──
  const pages = scanPages();
  for (const page of pages) {
    await createOrUpdateToken({
      tokenKey: page.tokenKey,
      name: page.name,
      category: 'page',
      subcategory: page.subcategory,
      description: `Page at ${page.route}`,
      filePath: page.filePath,
      route: page.route,
      tags: ['page', page.subcategory],
      owner: 'feature-developer',
      priority: 'normal',
    });
    total++; counts.pages++;
  }

  // ── Prisma Models ──
  const models = scanPrismaModels();
  for (const model of models) {
    await createOrUpdateToken({
      tokenKey: model.tokenKey,
      name: model.name,
      category: 'model',
      subcategory: 'data',
      description: `Prisma data model: ${model.prismaModel}`,
      prismaModel: model.prismaModel,
      tags: ['model', 'prisma', 'data'],
      owner: 'core-architect',
      priority: 'critical',
    });
    total++; counts.models++;
  }

  // ── Lib Modules ──
  const libModules = scanLibModules();
  for (const mod of libModules) {
    await createOrUpdateToken({
      tokenKey: mod.tokenKey,
      name: mod.name,
      category: 'lib',
      subcategory: mod.subcategory,
      description: `Library module: ${mod.name}`,
      filePath: mod.filePath,
      tags: ['lib', mod.subcategory],
      owner: 'core-architect',
      priority: 'normal',
    });
    total++; counts.libModules++;
  }

  // ── Workforce Agents ──
  const agents = await db.workforceAgent.findMany({ select: { id: true, name: true, slug: true, department: true, role: true } });
  for (const agent of agents) {
    await createOrUpdateToken({
      tokenKey: `agent:${agent.slug}`,
      name: agent.name,
      category: 'agent',
      subcategory: agent.department.toLowerCase(),
      description: `AI Workforce Agent: ${agent.name} (${agent.role})`,
      tags: ['agent', agent.department.toLowerCase(), agent.slug],
      businessValue: `${agent.department} department agent`,
      owner: 'synthetic-hr',
      priority: 'critical',
    });
    total++; counts.agents++;
  }

  // ── Blog Posts ──
  const { BLOG_POSTS_META } = await import('@/lib/blog-metadata');
  for (const post of BLOG_POSTS_META) {
    await createOrUpdateToken({
      tokenKey: `blog:${post.slug}`,
      name: post.title,
      category: 'blog',
      subcategory: post.category.toLowerCase().replace(/\s+/g, '-'),
      description: post.excerpt,
      route: `/blog/${post.slug}`,
      tags: ['blog', ...post.tags],
      businessValue: 'Content marketing',
      owner: 'content-architect',
      priority: 'low',
    });
    total++; counts.blogPosts++;
  }

  // ── FAQ Items ──
  const { FAQ_ITEMS } = await import('@/lib/faq/faq-data-v2');
  for (const faq of FAQ_ITEMS) {
    await createOrUpdateToken({
      tokenKey: `faq:${faq.id}`,
      name: faq.question,
      category: 'faq',
      subcategory: faq.category.toLowerCase().replace(/\s+/g, '-'),
      description: faq.answer.slice(0, 200),
      tags: ['faq', faq.category.toLowerCase()],
      businessValue: 'Customer self-service',
      owner: 'content-architect',
      priority: 'low',
    });
    total++; counts.faqItems++;
  }

  // ── Business Tokens ──
  const businessTokens = getBusinessTokens();
  for (const bt of businessTokens) {
    await createOrUpdateToken({
      tokenKey: bt.tokenKey,
      name: bt.name,
      category: bt.category,
      subcategory: bt.subcategory,
      description: bt.description,
      businessValue: bt.businessValue,
      owner: bt.owner,
      priority: bt.priority,
      tags: [bt.category, bt.subcategory],
    });
    total++; counts.businessTokens++;
  }

  return { ...counts, total };
}
