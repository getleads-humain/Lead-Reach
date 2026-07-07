// ============================================================
// Datasets API — Upload & List
// ============================================================
// POST /api/datasets — Upload a file (multipart/form-data)
// GET  /api/datasets — List all datasets for the user
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseFile, profileData, validateDataset, recommendCharts, detectFormat } from '@/lib/data-parser';
import { createHash } from 'crypto';

export const maxDuration = 300; // 5 minutes for large files

// ============================================================
// GET — List all datasets
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const datasets = await db.dataset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        rowCount: true,
        columnCount: true,
        headers: true,
        qualityScore: true,
        valueScore: true,
        status: true,
        embeddingStatus: true,
        embeddingCount: true,
        aiSummary: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { columns: true, embeddings: true },
        },
      },
    });

    return NextResponse.json({ datasets });
  } catch (error) {
    console.error('[Datasets GET] Error:', error);
    return NextResponse.json({ error: 'Failed to list datasets' }, { status: 500 });
  }
}

// ============================================================
// POST — Upload & process a dataset file
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (max 50MB)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
    }

    // Detect format
    const fileType = detectFormat(file.name, file.type);

    // Parse the file
    const parsed = await parseFile(file, file.name, { maxRows: 50000 });

    if (parsed.rows.length === 0) {
      return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
    }

    // Compute file hash for deduplication
    const buffer = await file.arrayBuffer();
    const fileHash = createHash('sha256').update(Buffer.from(buffer)).digest('hex');

    // Check for existing dataset with same hash + user
    if (userId) {
      const existing = await db.dataset.findFirst({
        where: { userId, fileHash },
      });
      if (existing) {
        return NextResponse.json({
          id: existing.id,
          status: 'duplicate',
          message: 'This file has already been uploaded',
          existingId: existing.id,
        });
      }
    }

    // Create dataset record
    const dataset = await db.dataset.create({
      data: {
        userId: userId || null,
        fileName: file.name,
        fileType,
        fileSize: file.size,
        fileHash,
        rowCount: parsed.rowCount,
        columnCount: parsed.columnCount,
        headers: JSON.stringify(parsed.headers),
        sampleData: JSON.stringify(parsed.rows.slice(0, 100)),
        status: 'profiling',
      },
    });

    // Profile the data
    const profile = profileData(parsed.headers, parsed.rows);

    // Validate the data
    const validation = validateDataset(parsed.headers, parsed.rows, profile);

    // Generate chart recommendations
    const charts = recommendCharts(profile);

    // Update dataset with profile + validation + charts
    await db.dataset.update({
      where: { id: dataset.id },
      data: {
        dataProfile: JSON.stringify(profile),
        qualityScore: validation.score,
        valueScore: validation.platformValueScore,
        validationResults: JSON.stringify(validation),
        chartConfigs: JSON.stringify(charts),
        platformFit: JSON.stringify(validation.platformFit),
        status: 'ready',
      },
    });

    // Create column records
    for (const col of profile.columns) {
      await db.datasetColumn.create({
        data: {
          datasetId: dataset.id,
          name: col.name,
          index: parsed.headers.indexOf(col.name),
          dataType: col.dataType,
          nullable: col.nullCount > 0,
          nullCount: col.nullCount,
          uniqueCount: col.uniqueCount,
          sampleValues: JSON.stringify(col.sampleValues.slice(0, 20)),
          statistics: JSON.stringify({
            min: col.min,
            max: col.max,
            mean: col.mean,
            median: col.median,
            stdDev: col.stdDev,
            sum: col.sum,
            percentiles: col.percentiles,
            topValues: col.topValues,
          }),
          semanticType: col.semanticType || null,
        },
      });
    }

    // Generate embeddings asynchronously (fire and forget)
    generateEmbeddingsAsync(dataset.id, parsed.headers, parsed.rows).catch(err => {
      console.error(`[Datasets] Embedding generation failed for ${dataset.id}:`, err);
    });

    // Return the created dataset
    const result = await db.dataset.findUnique({
      where: { id: dataset.id },
      include: { columns: true },
    });

    return NextResponse.json({
      dataset: JSON.parse(JSON.stringify(result)),
      profile,
      validation,
      charts,
    });
  } catch (error) {
    console.error('[Datasets POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE — Delete a dataset
// ============================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Dataset ID required' }, { status: 400 });
    }

    await db.dataset.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('[Datasets DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete dataset' }, { status: 500 });
  }
}

// ============================================================
// Background: Generate embeddings for dataset
// ============================================================

async function generateEmbeddingsAsync(
  datasetId: string,
  headers: string[],
  rows: Record<string, unknown>[]
) {
  try {
    await db.dataset.update({
      where: { id: datasetId },
      data: { embeddingStatus: 'processing' },
    });

    // Dynamic import to avoid module-level crash
    const { embedText } = await import('@/lib/knowledge/embeddings');

    const CHUNK_SIZE = 10; // rows per chunk
    let chunkIndex = 0;
    let totalEmbeddings = 0;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      // Serialize chunk to text for embedding
      const content = JSON.stringify({
        columns: headers,
        rows: chunk,
      });

      const vector = await embedText(content.slice(0, 6000), `dataset-${datasetId}-chunk-${chunkIndex}`);

      if (vector) {
        await db.datasetEmbedding.create({
          data: {
            datasetId,
            chunkIndex,
            content: content.slice(0, 2000), // Store truncated content
            rowRange: JSON.stringify({ start: i, end: Math.min(i + CHUNK_SIZE, rows.length) }),
            embedding: JSON.stringify(vector),
            tokenCount: Math.ceil(content.length / 4),
          },
        });
        totalEmbeddings++;
      }

      chunkIndex++;
    }

    await db.dataset.update({
      where: { id: datasetId },
      data: {
        embeddingStatus: 'completed',
        embeddingCount: totalEmbeddings,
      },
    });
  } catch (err) {
    console.error(`[Embeddings] Failed for dataset ${datasetId}:`, err);
    await db.dataset.update({
      where: { id: datasetId },
      data: { embeddingStatus: 'failed' },
    }).catch(() => {});
  }
}
