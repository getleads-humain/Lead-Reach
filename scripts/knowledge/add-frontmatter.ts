/**
 * Batch-update knowledge docs:
 * 1. Add `last_reviewed` frontmatter (current date) if missing
 * 2. Add `grade` frontmatter if missing (default: B)
 * 3. Add cross-reference links ("See also" section) at the bottom of each doc
 *
 * Run: npx tsx scripts/knowledge/add-frontmatter.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const KNOWLEDGE_DIR = path.join(process.cwd(), 'knowledge');
const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// Cross-reference map: category -> related categories
const CATEGORY_CROSS_REFS: Record<string, string[]> = {
  industry: ['domain/b2b-lead-generation-core-theory', 'domain/icp-design-scoring-methodology', 'domain/lead-qualification-frameworks'],
  region: ['domain/data-enrichment-methodology', 'compliance/global-regulations'],
  playbook: ['domain/outreach-methodology-cold-email-sequences', 'domain/trigger-events-detection-timing'],
  domain: ['playbooks/icp-discovery', 'playbooks/outbound-cold-email', 'agents/atlas'],
  agent: ['tools/data-sources-catalog', 'product/agent-pipeline-architecture'],
  tool: ['agents/atlas', 'product/agent-pipeline-architecture'],
  methodology: ['domain/b2b-lead-generation-core-theory', 'domain/lead-qualification-frameworks'],
  integration: ['product/leadreach-platform-overview', 'product/onboarding-quickstart'],
  'case-study': ['industries/saas-b2b', 'domain/b2b-lead-generation-core-theory'],
  product: ['agents/atlas', 'product/agent-pipeline-architecture'],
  compliance: ['regions/eu-gdpr', 'regions/united-states'],
  dataset: ['agents/atlas', 'tools/data-sources-catalog'],
  template: ['agents/bard', 'agents/forge'],
};

// Specific doc cross-references (doc basename -> related docs)
const DOC_CROSS_REFS: Record<string, string[]> = {
  // Agent docs reference their tool counterparts
  'agents/atlas': ['agents/scout', 'domain/b2b-lead-generation-core-theory', 'product/agent-pipeline-architecture'],
  'agents/scout': ['agents/atlas', 'domain/icp-design-scoring-methodology', 'tools/scout'],
  'agents/forge': ['agents/judge', 'domain/data-enrichment-methodology', 'tools/forge'],
  'agents/sage': ['agents/scout', 'domain/trigger-events-detection-timing', 'tools/sage'],
  'agents/judge': ['agents/forge', 'domain/lead-qualification-frameworks', 'tools/judge'],
  'agents/bard': ['agents/flow', 'domain/outreach-methodology-cold-email-sequences', 'tools/bard'],
  'agents/flow': ['agents/bard', 'product/agent-pipeline-architecture', 'tools/flow'],
  'agents/echo': ['agents/flow', 'product/agent-pipeline-architecture', 'tools/echo'],
  // Tool docs cross-reference their agent
  'tools/atlas': ['agents/atlas', 'product/agent-pipeline-architecture'],
  'tools/scout': ['agents/scout', 'tools/data-sources-catalog'],
  'tools/forge': ['agents/forge', 'tools/data-sources-catalog'],
  'tools/sage': ['agents/sage', 'tools/data-sources-catalog'],
  'tools/judge': ['agents/judge', 'domain/lead-qualification-frameworks'],
  'tools/bard': ['agents/bard', 'domain/outreach-methodology-cold-email-sequences'],
  'tools/flow': ['agents/flow', 'product/agent-pipeline-architecture'],
  'tools/echo': ['agents/echo', 'product/release-notes'],
  'tools/data-sources-catalog': ['agents/scout', 'agents/sage', 'domain/data-enrichment-methodology'],
  // Industry docs cross-reference related regions and domains
  'industries/saas-b2b': ['domain/b2b-lead-generation-core-theory', 'domain/icp-design-scoring-methodology', 'regions/united-states'],
  'industries/fintech': ['industries/financial-services', 'compliance/global-regulations', 'regions/eu-gdpr'],
  'industries/healthtech': ['industries/healthcare-life-sciences', 'compliance/global-regulations'],
  'industries/cybersecurity': ['domain/data-enrichment-methodology', 'industries/dev-tools'],
  'industries/ai-infrastructure': ['industries/dev-tools', 'industries/saas-b2b'],
  'industries/dev-tools': ['industries/saas-b2b', 'industries/ai-infrastructure'],
  'industries/ecommerce-dtc': ['industries/ecommerce-retail', 'domain/b2b-lead-generation-core-theory'],
  'industries/ecommerce-retail': ['industries/ecommerce-dtc', 'domain/data-enrichment-methodology'],
  // Region docs cross-reference compliance
  'regions/eu-gdpr': ['regions/european-union', 'compliance/global-regulations'],
  'regions/united-states': ['regions/us', 'compliance/global-regulations'],
  'regions/united-kingdom': ['regions/uk', 'compliance/global-regulations'],
  'regions/dach': ['regions/european-union', 'regions/eu-gdpr'],
  'regions/china': ['regions/india', 'regions/vietnam'],
  'regions/india': ['regions/china', 'regions/middle-east-north-africa'],
  // Domain docs cross-reference playbooks
  'domain/b2b-lead-generation-core-theory': ['domain/icp-design-scoring-methodology', 'playbooks/icp-discovery'],
  'domain/icp-design-scoring-methodology': ['domain/b2b-lead-generation-core-theory', 'domain/lead-qualification-frameworks'],
  'domain/lead-qualification-frameworks': ['domain/icp-design-scoring-methodology', 'playbooks/inbound-lead-routing'],
  'domain/data-enrichment-methodology': ['agents/forge', 'domain/b2b-lead-generation-core-theory'],
  'domain/outreach-methodology-cold-email-sequences': ['agents/bard', 'playbooks/outbound-cold-email'],
  'domain/trigger-events-detection-timing': ['agents/sage', 'playbooks/research-specific-company'],
  // Playbooks cross-reference domain
  'playbooks/icp-discovery': ['domain/icp-design-scoring-methodology', 'playbooks/research-specific-company'],
  'playbooks/outbound-cold-email': ['domain/outreach-methodology-cold-email-sequences', 'agents/bard'],
  'playbooks/multi-threaded-selling': ['domain/b2b-lead-generation-core-theory', 'playbooks/outbound-cold-email'],
  'playbooks/inbound-lead-routing': ['domain/lead-qualification-frameworks', 'agents/judge'],
  'playbooks/churn-recovery': ['domain/b2b-lead-generation-core-theory', 'playbooks/inbound-lead-routing'],
  'playbooks/find-suppliers-in-country': ['domain/data-enrichment-methodology', 'playbooks/research-specific-company'],
  'playbooks/research-specific-company': ['agents/sage', 'domain/trigger-events-detection-timing'],
  // Product docs
  'product/leadreach-platform-overview': ['product/agent-pipeline-architecture', 'product/onboarding-quickstart'],
  'product/agent-pipeline-architecture': ['agents/atlas', 'product/leadreach-platform-overview'],
  'product/onboarding-quickstart': ['product/leadreach-platform-overview', 'product/pricing-packaging-guide'],
  'product/pricing-packaging-guide': ['product/leadreach-platform-overview', 'product/onboarding-quickstart'],
  'product/data-security-privacy': ['compliance/global-regulations', 'regions/eu-gdpr'],
  'product/release-notes': ['product/leadreach-platform-overview', 'product/agent-pipeline-architecture'],
};

// Skip these files (not actual knowledge content)
const SKIP_FILES = new Set(['README.md', 'CONTRIBUTING.md', 'MANIFEST.json']);
const SKIP_DIRS = new Set(['_reports']);

function walkDir(dir: string, baseDir: string = dir): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...walkDir(abs, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      if (SKIP_FILES.has(entry.name) && dir === baseDir) continue;
      out.push(abs);
    }
  }
  return out;
}

function processFile(absPath: string): { updated: boolean; changes: string[] } {
  const changes: string[] = [];
  let content = fs.readFileSync(absPath, 'utf-8');
  const relPath = path.relative(KNOWLEDGE_DIR, absPath).split(path.sep).join('/');

  // Parse existing frontmatter
  let frontmatter: Record<string, string> = {};
  let body = content;
  let fmStart = -1;
  let fmEnd = -1;

  if (content.startsWith('---')) {
    fmEnd = content.indexOf('\n---', 3);
    if (fmEnd !== -1) {
      fmStart = 0;
      const yamlBlock = content.slice(3, fmEnd).trim();
      body = content.slice(fmEnd + 4).trim();
      for (const line of yamlBlock.split('\n')) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;
        const key = line.slice(0, colonIdx).trim();
        const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
        frontmatter[key] = value;
      }
    }
  }

  // Add last_reviewed if missing
  if (!frontmatter.last_reviewed) {
    frontmatter.last_reviewed = TODAY;
    changes.push(`added last_reviewed: ${TODAY}`);
  }

  // Add grade if missing
  if (!frontmatter.grade) {
    frontmatter.grade = 'B';
    changes.push('added grade: B');
  }

  // Build cross-references
  const crossRefs = DOC_CROSS_REFS[relPath] || [];
  // Also add category-level cross-refs if doc-specific ones aren't enough
  if (crossRefs.length === 0) {
    const category = relPath.split('/')[0];
    const catKey = category === 'industries' ? 'industry' : category;
    crossRefs.push(...(CATEGORY_CROSS_REFS[catKey] || []).slice(0, 2));
  }

  // Add "See also" section if cross-references exist and not already present
  if (crossRefs.length > 0 && !body.includes('## See Also') && !body.includes('## See also')) {
    const seeAlsoLines = crossRefs
      .filter(ref => {
        // Only reference docs that actually exist
        const refAbs = path.join(KNOWLEDGE_DIR, ref + '.md');
        return fs.existsSync(refAbs);
      })
      .map(ref => `- [${ref.split('/').pop()}](../${ref}.md)`)
      .join('\n');
    if (seeAlsoLines) {
      body = body.trimEnd() + '\n\n## See Also\n\n' + seeAlsoLines + '\n';
      changes.push(`added ${crossRefs.length} cross-references`);
    }
  }

  // Reconstruct the file with updated frontmatter
  if (changes.length > 0) {
    const fmLines = Object.entries(frontmatter)
      .map(([k, v]) => {
        if (v.includes(' ') || v.includes(':')) return `${k}: "${v}"`;
        return `${k}: ${v}`;
      })
      .join('\n');
    const newContent = `---\n${fmLines}\n---\n\n${body}\n`;
    fs.writeFileSync(absPath, newContent, 'utf-8');
  }

  return { updated: changes.length > 0, changes };
}

// Main
const files = walkDir(KNOWLEDGE_DIR);
let updated = 0;
let skipped = 0;

for (const file of files) {
  const rel = path.relative(KNOWLEDGE_DIR, file);
  const result = processFile(file);
  if (result.updated) {
    updated++;
    console.log(`✓ ${rel}: ${result.changes.join(', ')}`);
  } else {
    skipped++;
  }
}

console.log(`\nDone: ${updated} updated, ${skipped} unchanged, ${files.length} total`);
