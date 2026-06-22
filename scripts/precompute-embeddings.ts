#!/usr/bin/env npx tsx
/**
 * precompute-embeddings.ts
 * ========================
 * CLI entry point for pre-computing knowledge base embeddings.
 *
 * Walks the knowledge base, batches chunk contents through the Z.AI
 * embedding-3 API, and persists the results to .knowledge-embeddings.cache.json
 * for fast hybrid (BM25 + semantic) retrieval at query time.
 *
 * Usage:
 *   npx tsx scripts/precompute-embeddings.ts
 *
 * Requirements:
 *   - USE_KNOWLEDGE_EMBEDDINGS=true in .env
 *   - ZHIPU_API_KEY set in .env
 *
 * Output:
 *   - Writes JSON cache to .knowledge-embeddings.cache.json
 *   - Prints progress + summary to stdout
 *   - Exit code 0 on success, 1 on failure
 */

import 'dotenv/config';
import { getKnowledgeIndex } from '../src/lib/knowledge';

async function main() {
  console.log('[knowledge] Pre-computing embeddings for knowledge base...\n');

  if (process.env.USE_KNOWLEDGE_EMBEDDINGS !== 'true') {
    console.error('[knowledge] USE_KNOWLEDGE_EMBEDDINGS is not "true" — set it in .env to enable.');
    console.error('[knowledge] Aborting.');
    process.exit(1);
  }
  if (!process.env.ZHIPU_API_KEY) {
    console.error('[knowledge] ZHIPU_API_KEY is not set — required for embedding-3 API.');
    console.error('[knowledge] Aborting.');
    process.exit(1);
  }

  const index = getKnowledgeIndex();
  index.load(true);
  const before = index.embeddingsCoverage();
  console.log(`[knowledge] Index loaded: ${before.total} chunks, ${before.cached} already cached\n`);

  try {
    const result = await index.precomputeEmbeddings();
    console.log('\n============================================================');
    console.log('  KNOWLEDGE BASE EMBEDDINGS PRE-COMPUTE COMPLETE');
    console.log('============================================================\n');
    console.log(`  Total chunks:     ${result.total}`);
    console.log(`  Generated now:    ${result.generated}`);
    console.log(`  Already cached:   ${result.cached - result.generated}`);
    console.log(`  Total cached:     ${result.cached}`);
    console.log(`  Failed:           ${result.failed}`);
    console.log('\n  Cache file: .knowledge-embeddings.cache.json');
    console.log('============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('[knowledge] FAILED to pre-compute embeddings:', err);
    process.exit(1);
  }
}

void main();
