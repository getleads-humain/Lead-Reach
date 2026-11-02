// ============================================================
// Single Dataset API — Get, Update, Search
// ============================================================
// GET    /api/datasets/[id]         — Get dataset with full details
// GET    /api/datasets/[id]?action=data   — Get full dataset rows
// GET    /api/datasets/[id]?action=search — Semantic search across embeddings
// POST   /api/datasets/[id]         — Actions: reprofile, revalidate, ai-analyze
// DELETE /api/datasets/[id]         — Delete dataset
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const dataset = await db.dataset.findUnique({
      where: { id },
      include: {
        columns: { orderBy: { index: 'asc' } },
        _count: { select: { embeddings: true } },
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    // Full data request
    if (action === 'data') {
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('pageSize') || '50');
      const sampleData: Record<string, unknown>[] = JSON.parse(dataset.sampleData);
      const start = (page - 1) * pageSize;
      const paginatedData = sampleData.slice(start, start + pageSize);

      return NextResponse.json({
        id: dataset.id,
        headers: JSON.parse(dataset.headers),
        rows: paginatedData,
        totalRows: dataset.rowCount,
        page,
        pageSize,
        totalPages: Math.ceil(dataset.rowCount / pageSize),
      });
    }

    // Semantic search across embeddings
    if (action === 'search') {
      const query = searchParams.get('q');
      if (!query) {
        return NextResponse.json({ error: 'Search query required' }, { status: 400 });
      }

      const { embedQuery, cosineSimilarity } = await import('@/lib/knowledge/embeddings');
      const queryVector = await embedQuery(query);

      if (!queryVector) {
        // Fallback to text search
        const embeddings = await db.datasetEmbedding.findMany({
          where: { datasetId: id },
        });
        const results = embeddings
          .filter(e => e.content.toLowerCase().includes(query.toLowerCase()))
          .map(e => ({
            chunkIndex: e.chunkIndex,
            content: e.content,
            rowRange: JSON.parse(e.rowRange || '{}'),
            score: 0.5,
          }));
        return NextResponse.json({ results, method: 'text_fallback' });
      }

      // Vector similarity search
      const embeddings = await db.datasetEmbedding.findMany({
        where: { datasetId: id },
      });

      const results = embeddings
        .map(e => {
          const vector: number[] = JSON.parse(e.embedding);
          const score = cosineSimilarity(queryVector, vector);
          return {
            chunkIndex: e.chunkIndex,
            content: e.content,
            rowRange: JSON.parse(e.rowRange || '{}'),
            score,
          };
        })
        .filter(r => r.score > 0.3)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      return NextResponse.json({ results, method: 'semantic' });
    }

    // Default: return full dataset info
    const safeDataset = JSON.parse(JSON.stringify(dataset));
    return NextResponse.json({ dataset: safeDataset });
  } catch (error) {
    console.error('[Dataset GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch dataset' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'ai-analyze':
        return await handleAIAnalyze(id);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Dataset POST] Error:', error);
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.dataset.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('[Dataset DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete dataset' }, { status: 500 });
  }
}

// ============================================================
// AI Analysis — Generate insights about the dataset
// ============================================================

async function handleAIAnalyze(datasetId: string) {
  const dataset = await db.dataset.findUnique({
    where: { id: datasetId },
    include: { columns: true },
  });

  if (!dataset) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
  }

  // Lazy-load LLM

  const headers: string[] = JSON.parse(dataset.headers);
  const sampleRows: Record<string, unknown>[] = JSON.parse(dataset.sampleData).slice(0, 5);
  const profile = JSON.parse(dataset.dataProfile);
  const validation = JSON.parse(dataset.validationResults);

  const analysisPrompt = `You are a data analyst AI for a B2B lead generation platform called LeadReach. Analyze this dataset and provide insights.

Dataset: "${dataset.fileName}" (${dataset.rowCount} rows, ${dataset.columnCount} columns)
File type: ${dataset.fileType}

Columns: ${headers.join(', ')}

Column profiles:
${profile.columns.map((c: { name: string; dataType: string; nullPercent: number; uniqueCount: number; semanticType?: string; topValues?: { value: string; count: number }[] }) =>
  `- ${c.name} (${c.dataType}): ${c.nullPercent}% null, ${c.uniqueCount} unique${c.semanticType ? `, semantic: ${c.semanticType}` : ''}${c.topValues ? `, top: ${c.topValues.slice(3).map((v: { value: string }) => v.value).join(', ')}` : ''}`
).join('\n')}

Sample data (first 5 rows):
${JSON.stringify(sampleRows, null, 2)}

Quality score: ${dataset.qualityScore}/100
Platform value score: ${dataset.valueScore}/100
Platform fit: ${JSON.stringify(validation.platformFit)}

Provide a JSON object with:
1. "summary": A 2-3 sentence natural language summary of this dataset
2. "insights": Array of 3-5 insight objects, each with "title" (short), "description" (1-2 sentences), and "type" (one of: pattern, anomaly, opportunity, recommendation, risk)
3. "platformRecommendations": Array of 2-3 specific recommendations for how this data could be used on our lead generation platform`;

  try {
    const { callLLMForJSON } = await import('@/lib/llm');
    const analysis = await callLLMForJSON<{
      summary: string;
      insights: Array<{ title: string; description: string; type: string }>;
      platformRecommendations: string[];
    }>(
      'You are a data analyst. Always respond with valid JSON.',
      analysisPrompt,
      { temperature: 0.3, maxTokens: 2000 }
    );

    if (analysis) {
      await db.dataset.update({
        where: { id: datasetId },
        data: {
          aiSummary: analysis.summary,
          aiInsights: JSON.stringify(analysis.insights),
        },
      });
    }

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error('[AI Analyze] LLM failed:', err);
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
  }
}
