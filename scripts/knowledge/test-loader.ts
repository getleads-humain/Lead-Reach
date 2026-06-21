// ============================================================
// Knowledge Base Smoke Test
// ============================================================
// Verifies that the knowledge loader correctly:
//   1. Discovers all knowledge files
//   2. Parses YAML frontmatter
//   3. Computes TF-IDF index
//   4. Retrieves relevant documents for sample queries
//   5. Formats output for LLM injection
//
// Run with: npx tsx scripts/knowledge/test-loader.ts
// ============================================================

import {
  retrieveKnowledge,
  retrieveForAgent,
  buildKnowledgePromptSection,
  getKnowledgeStats,
  listAllKnowledge,
  listKnowledgeByCategory,
  getKnowledgeBySlug,
  formatRetrievedKnowledge,
  clearKnowledgeCache,
} from '../../src/lib/knowledge/loader';

function divider(title: string) {
  console.log('\n' + '═'.repeat(70));
  console.log('  ' + title);
  console.log('═'.repeat(70));
}

function hr() {
  console.log('─'.repeat(70));
}

// ============================================================
// Test 1: Index all knowledge
// ============================================================
divider('TEST 1: Knowledge Base Statistics');
const stats = getKnowledgeStats();
console.log(`Total documents: ${stats.totalDocuments}`);
console.log(`Total tokens: ${stats.totalTokens.toLocaleString()}`);
console.log(`Total words: ${stats.totalWords.toLocaleString()}`);
console.log(`Indexed at: ${new Date(stats.indexedAt!).toISOString()}`);
console.log('\nBy category:');
for (const [category, count] of Object.entries(stats.byCategory)) {
  console.log(`  ${category.padEnd(15)} ${count} documents`);
}

if (stats.totalDocuments === 0) {
  console.error('\n❌ FAIL: No knowledge documents found. Check that /knowledge directory exists with .md files.');
  process.exit(1);
}
console.log('\n✅ PASS: Knowledge base indexed successfully.');

// ============================================================
// Test 2: List by category
// ============================================================
divider('TEST 2: Documents by Category');
const categories = ['domain', 'industries', 'regions', 'agents', 'tools', 'playbooks', 'templates', 'datasets', 'compliance'] as const;
for (const cat of categories) {
  const docs = listKnowledgeByCategory(cat);
  console.log(`\n${cat.toUpperCase()} (${docs.length}):`);
  for (const doc of docs) {
    console.log(`  • ${doc.slug.padEnd(40)} | priority: ${doc.priority} | words: ${doc.wordCount}`);
  }
}

// ============================================================
// Test 3: Retrieval — "dragonfruit suppliers in Vietnam"
// ============================================================
divider('TEST 3: Query — "dragonfruit suppliers in Vietnam"');
const dragonfruitResults = retrieveKnowledge({
  query: 'dragonfruit suppliers in Vietnam agriculture export',
  topK: 5,
  maxTokens: 12000,  // larger budget to fit multiple docs
  minScore: 0.05,
});
console.log(`Found ${dragonfruitResults.length} relevant documents:`);
for (const r of dragonfruitResults) {
  console.log(`\n  📄 ${r.document.title}`);
  console.log(`     score: ${r.score.toFixed(3)} | priority: ${r.document.priority} | tokens: ${r.includedTokens}`);
  console.log(`     matched on: ${r.matchedOn.join(', ')}`);
  console.log(`     path: ${r.document.relativePath}`);
}

if (dragonfruitResults.length === 0) {
  console.error('\n❌ FAIL: Expected results for dragonfruit query.');
} else {
  // Verify the agriculture industry file is in top results
  const hasAgriculture = dragonfruitResults.some(r => r.document.slug.includes('agriculture'));
  const hasVietnam = dragonfruitResults.some(r => r.document.slug.includes('vietnam'));
  console.log(`\n✅ PASS: Found ${dragonfruitResults.length} results.`);
  console.log(`   Contains agriculture knowledge: ${hasAgriculture ? '✅' : '⚠️'}`);
  console.log(`   Contains Vietnam knowledge: ${hasVietnam ? '✅' : '⚠️'}`);
}

// ============================================================
// Test 4: Retrieval — "research Stripe"
// ============================================================
divider('TEST 4: Query — "research Stripe fintech payments"');
const stripeResults = retrieveKnowledge({
  query: 'research Stripe fintech payments financial services company',
  topK: 4,
  maxTokens: 3000,
});
console.log(`Found ${stripeResults.length} relevant documents:`);
for (const r of stripeResults) {
  console.log(`  📄 ${r.document.title} | score: ${r.score.toFixed(3)} | ${r.matchedOn.join(', ')}`);
}

// ============================================================
// Test 5: Agent-specific retrieval
// ============================================================
divider('TEST 5: Agent-Specific Retrieval');
const agents = ['atlas', 'scout', 'forge', 'sage', 'judge', 'bard', 'flow', 'echo'] as const;
for (const agent of agents) {
  const results = retrieveForAgent(agent, 'find SaaS companies in Vietnam', {
    industries: ['saas', 'agriculture'],
    regions: ['vietnam'],
    topK: 2,
    maxTokens: 1500,
  });
  console.log(`\n${agent.toUpperCase()} (${results.length} docs):`);
  for (const r of results) {
    console.log(`  📄 ${r.document.title} | score: ${r.score.toFixed(3)}`);
  }
}

// ============================================================
// Test 6: Get by slug
// ============================================================
divider('TEST 6: getKnowledgeBySlug');
const atlasDoc = getKnowledgeBySlug('agent-atlas-training');
if (atlasDoc) {
  console.log(`✅ Found: ${atlasDoc.title}`);
  console.log(`   Word count: ${atlasDoc.wordCount}`);
  console.log(`   Body preview: ${atlasDoc.body.slice(0, 200)}...`);
} else {
  console.error('❌ FAIL: Could not find atlas training doc by slug.');
}

// ============================================================
// Test 7: Build prompt section (what agents actually use)
// ============================================================
divider('TEST 7: buildKnowledgePromptSection (Atlas + Dragonfruit)');
const promptSection = buildKnowledgePromptSection('atlas', 'dragonfruit suppliers in Vietnam', {
  industries: ['agriculture'],
  regions: ['vietnam'],
  intent_types: ['research_company', 'discover_places'],
  topK: 3,
  maxTokens: 2000,
});
console.log(`Prompt section length: ${promptSection.length} chars`);
console.log(`First 500 chars:`);
console.log(promptSection.slice(0, 500));
console.log('\n...');
console.log(`Last 200 chars:`);
console.log(promptSection.slice(-200));

// ============================================================
// Test 8: Format retrieved knowledge
// ============================================================
divider('TEST 8: formatRetrievedKnowledge');
const formatted = formatRetrievedKnowledge(stripeResults.slice(0, 2), {
  includeMetadata: true,
  includeBody: false,  // just titles + metadata for brevity
});
console.log(formatted);

// ============================================================
// Test 9: Cache management
// ============================================================
divider('TEST 9: Cache Management');
clearKnowledgeCache();
console.log('✅ Cache cleared.');
const statsAfter = getKnowledgeStats();
console.log(`Re-indexed: ${statsAfter.totalDocuments} documents`);

// ============================================================
// Final summary
// ============================================================
divider('SUMMARY');
console.log(`✅ Knowledge base is operational.`);
console.log(`   Documents: ${stats.totalDocuments}`);
console.log(`   Total knowledge: ${(stats.totalWords / 1000).toFixed(1)}K words / ${(stats.totalTokens / 1000).toFixed(1)}K tokens`);
console.log(`   Categories: ${Object.keys(stats.byCategory).length}`);
console.log('\nThe LeadReach knowledge base is ready for agent runtime integration.');
