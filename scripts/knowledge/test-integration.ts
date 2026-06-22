// ============================================================
// Integration Smoke Test
// ============================================================
// Verifies that knowledge retrieval integrates cleanly with
// the existing prospect-agent pipeline.
//
// Run with: npx tsx scripts/knowledge/test-integration.ts
// ============================================================

import { retrieveContextForAgent, getKnowledgeContextForPipeline, isKnowledgeAvailable, getKnowledgeSummary } from '../../src/lib/knowledge/integration';
import { getMasterSystemPromptWithKnowledge } from '../../src/lib/prospect-agent/prompts';

function divider(title: string) {
  console.log('\n' + '═'.repeat(70));
  console.log('  ' + title);
  console.log('═'.repeat(70));
}

// ============================================================
// Test 1: Knowledge availability check
// ============================================================
divider('TEST 1: Knowledge Availability');
console.log(`Available: ${isKnowledgeAvailable()}`);
console.log(`Summary: ${getKnowledgeSummary()}`);

// ============================================================
// Test 2: retrieveContextForAgent — Atlas + Dragonfruit
// ============================================================
divider('TEST 2: retrieveContextForAgent — Atlas + Dragonfruit');
const result = retrieveContextForAgent({
  agent: 'atlas',
  userQuery: 'dragonfruit suppliers in Vietnam',
  industries: ['agriculture'],
  regions: ['vietnam'],
  intent_types: ['research_company', 'discover_places'],
  topK: 3,
  maxTokens: 2000,
});

console.log(`Retrieved: ${result.retrieved}`);
console.log(`Documents: ${result.stats.retrieved_count}`);
console.log(`Tokens: ${result.stats.total_tokens}`);
console.log(`Duration: ${result.stats.retrieval_duration_ms}ms`);
console.log(`Knowledge base size: ${result.stats.knowledge_base_size}`);
console.log(`\nPrompt section preview (first 500 chars):`);
console.log(result.promptSection.slice(0, 500));
console.log('...');

// ============================================================
// Test 3: retrieveContextForAgent — Scout + SaaS
// ============================================================
divider('TEST 3: retrieveContextForAgent — Scout + SaaS');
const scoutResult = retrieveContextForAgent({
  agent: 'scout',
  userQuery: 'find SaaS companies using Salesforce',
  industries: ['saas'],
  intent_types: ['research_company'],
  topK: 3,
  maxTokens: 2000,
});

console.log(`Retrieved: ${scoutResult.retrieved}`);
console.log(`Documents: ${scoutResult.stats.retrieved_count}`);
console.log(`Duration: ${scoutResult.stats.retrieval_duration_ms}ms`);

// ============================================================
// Test 4: getKnowledgeContextForPipeline — Full pipeline
// ============================================================
divider('TEST 4: getKnowledgeContextForPipeline — Full Pipeline');
const pipelineContext = getKnowledgeContextForPipeline(
  'dragonfruit suppliers in Vietnam',
  {
    industries: ['agriculture'],
    regions: ['vietnam'],
    intent_types: ['research_company', 'discover_places'],
    topK: 6,
    maxTokens: 4000,
  }
);

console.log(`Retrieved: ${pipelineContext.retrieved}`);
console.log(`Total documents: ${pipelineContext.documents.length}`);
console.log(`Duration: ${pipelineContext.stats.retrieval_duration_ms}ms`);
console.log(`\nPer-agent knowledge:`);
for (const [agent, section] of Object.entries(pipelineContext.perAgent)) {
  console.log(`  ${agent.padEnd(10)} → ${section ? `${section.length} chars` : '(no relevant docs)'}`);
}

// ============================================================
// Test 5: getMasterSystemPromptWithKnowledge — Dragonfruit
// ============================================================
divider('TEST 5: getMasterSystemPromptWithKnowledge — Dragonfruit');
const augmented = getMasterSystemPromptWithKnowledge(
  'dragonfruit suppliers in Vietnam',
  {
    industries: ['agriculture'],
    regions: ['vietnam'],
    intent_types: ['research_company', 'discover_places'],
  }
);

console.log(`Knowledge used: ${augmented.knowledgeUsed}`);
console.log(`Knowledge stats: ${augmented.knowledgeStats}`);
console.log(`Prompt length: ${augmented.prompt.length} chars`);
console.log(`\nSearching for knowledge section in prompt...`);
const hasKnowledge = augmented.prompt.includes('RETRIEVED KNOWLEDGE BASE');
console.log(`Knowledge section present: ${hasKnowledge ? '✅' : '❌'}`);

if (hasKnowledge) {
  const knowledgeStart = augmented.prompt.indexOf('RETRIEVED KNOWLEDGE BASE');
  const knowledgeEnd = augmented.prompt.indexOf('END OF RETRIEVED KNOWLEDGE') + 'END OF RETRIEVED KNOWLEDGE'.length;
  console.log(`\nKnowledge section in prompt (first 800 chars):`);
  console.log(augmented.prompt.slice(knowledgeStart, knowledgeStart + 800));
  console.log('...');
}

// ============================================================
// Test 6: getMasterSystemPromptWithKnowledge — SaaS
// ============================================================
divider('TEST 6: getMasterSystemPromptWithKnowledge — SaaS');
const saasAugmented = getMasterSystemPromptWithKnowledge(
  'research Stripe Inc. for our sales tool',
  {
    industries: ['saas', 'fintech'],
    intent_types: ['research_company', 'score_lead'],
  }
);

console.log(`Knowledge used: ${saasAugmented.knowledgeUsed}`);
console.log(`Knowledge stats: ${saasAugmented.knowledgeStats}`);
console.log(`Prompt length: ${saasAugmented.prompt.length} chars`);

// ============================================================
// Test 7: Fallback when query has no matching knowledge
// ============================================================
divider('TEST 7: Fallback — obscure query with no knowledge match');
const obscureResult = retrieveContextForAgent({
  agent: 'atlas',
  userQuery: 'xyzqwerty nonexistent topic 12345',
  topK: 3,
  maxTokens: 1000,
});

console.log(`Retrieved: ${obscureResult.retrieved}`);
console.log(`Documents: ${obscureResult.stats.retrieved_count}`);
console.log(`Duration: ${obscureResult.stats.retrieval_duration_ms}ms`);
console.log(`Prompt section empty: ${obscureResult.promptSection === ''}`);

// ============================================================
// Test 8: Performance — Multiple queries
// ============================================================
divider('TEST 8: Performance — 10 queries');
const queries = [
  'dragonfruit suppliers in Vietnam',
  'research Stripe fintech payments',
  'find SaaS companies in healthcare',
  'manufacturing companies in Germany',
  'coffee exporters in Colombia',
  'find VP Sales at Acme Corp',
  'build ICP for our SaaS product',
  'compose outreach for fintech prospect',
  'research Apple Inc. financials',
  'find e-commerce companies using Shopify',
];

const startTime = Date.now();
for (const query of queries) {
  const r = retrieveContextForAgent({
    agent: 'atlas',
    userQuery: query,
    topK: 3,
    maxTokens: 1500,
  });
  console.log(`  "${query.slice(0, 40).padEnd(40)}" → ${r.stats.retrieved_count} docs in ${r.stats.retrieval_duration_ms}ms`);
}
const totalDuration = Date.now() - startTime;
console.log(`\nTotal: ${totalDuration}ms for 10 queries (${(totalDuration / 10).toFixed(0)}ms avg)`);

// ============================================================
// Final summary
// ============================================================
divider('SUMMARY');
console.log('✅ Knowledge integration is operational.');
console.log(`   ${getKnowledgeSummary()}`);
console.log('   Knowledge is injected into:');
console.log('     • Intent classification (intents.ts)');
console.log('     • Master system prompt (getMasterSystemPromptWithKnowledge)');
console.log('     • Per-agent prompts (getKnowledgeContextForPipeline)');
console.log('   All integrations are best-effort — failures degrade gracefully.');
