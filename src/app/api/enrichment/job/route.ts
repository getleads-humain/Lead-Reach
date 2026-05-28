import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Lazy-load LLM utilities to avoid Turbopack compilation crash
// caused by eagerly importing z-ai-web-dev-sdk at module level
async function callLLM(options: {
  systemPrompt: string;
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  retriesPerModel?: number;
  useFallback?: boolean;
}) {
  const mod = await import('@/lib/llm');
  return mod.callLLM(options);
}

async function callLLMForJSON<T>(
  systemPrompt: string,
  userMessage: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    retriesPerModel?: number;
    useFallback?: boolean;
  }
) {
  const mod = await import('@/lib/llm');
  return mod.callLLMForJSON<T>(systemPrompt, userMessage, options);
}

// Allow long-running enrichment tasks
export const maxDuration = 300; // 5 minutes

// ============================================================
// Types
// ============================================================

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface EnrichmentPlan {
  newColumns: string[];
  strategy: string;
  searchQueries: string[];
}

interface CSVRow {
  [key: string]: string;
}

// ============================================================
// GET — List all enrichment jobs or get a specific job
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('id');

    if (jobId) {
      // Get specific job
      const job = await db.enrichmentJob.findUnique({ where: { id: jobId } });
      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      // Explicitly construct response — Prisma objects have non-serializable internals
      // Use JSON.parse/stringify for safe serialization
      const safeJob = JSON.parse(JSON.stringify({
        id: job.id,
        fileName: job.fileName,
        originalData: JSON.parse(job.originalData),
        enrichedData: JSON.parse(job.enrichedData),
        headers: JSON.parse(job.headers),
        enrichedHeaders: JSON.parse(job.enrichedHeaders),
        instructions: job.instructions,
        status: job.status,
        totalRows: job.totalRows,
        processedRows: job.processedRows,
        currentRow: job.currentRow,
        errorMessage: job.errorMessage,
        chatHistory: JSON.parse(job.chatHistory),
        enrichmentPlan: job.enrichmentPlan ? JSON.parse(job.enrichmentPlan) : null,
        fileSize: job.fileSize,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      }));
      return NextResponse.json(safeJob);
    }

    // List all jobs (most recent first)
    const jobs = await db.enrichmentJob.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        status: true,
        totalRows: true,
        processedRows: true,
        currentRow: true,
        instructions: true,
        createdAt: true,
        updatedAt: true,
        fileSize: true,
      },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('[EnrichmentJob GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

// ============================================================
// POST — Create job, start enrichment, send chat message
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create':
        return await handleCreate(body);
      case 'enrich':
        return await handleEnrich(body);
      case 'process-row':
        return await handleProcessRow(body);
      case 'chat':
        return await handleChat(body);
      case 'pause':
        return await handlePause(body);
      case 'resume':
        return await handleResume(body);
      case 'delete':
        return await handleDelete(body);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[EnrichmentJob POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

// ============================================================
// CREATE — Upload CSV and create a new enrichment job
// ============================================================

async function handleCreate(body: {
  fileName: string;
  csvData: CSVRow[];
  headers: string[];
  fileSize?: number;
}) {
  const { fileName, csvData, headers, fileSize = 0 } = body;

  if (!fileName || !csvData || !headers) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const job = await db.enrichmentJob.create({
    data: {
      fileName,
      originalData: JSON.stringify(csvData),
      enrichedData: JSON.stringify(csvData), // Start with original data
      headers: JSON.stringify(headers),
      enrichedHeaders: JSON.stringify(headers), // Start with original headers
      totalRows: csvData.length,
      fileSize,
      chatHistory: JSON.stringify([
        {
          role: 'system',
          content: `CSV file "${fileName}" uploaded with ${csvData.length} rows and ${headers.length} columns: ${headers.join(', ')}. Ready for enrichment instructions.`,
          timestamp: new Date().toISOString(),
        },
      ]),
    },
  });

  return NextResponse.json({
    id: job.id,
    status: job.status,
    totalRows: job.totalRows,
    fileName: job.fileName,
  });
}

// ============================================================
// ENRICH — Start AI enrichment with user instructions
// ============================================================

async function handleEnrich(body: { jobId: string; instructions: string }) {
  const { jobId, instructions } = body;

  const job = await db.enrichmentJob.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Update instructions and status
  const chatHistory: ChatMessage[] = JSON.parse(job.chatHistory);
  chatHistory.push({
    role: 'user',
    content: instructions,
    timestamp: new Date().toISOString(),
  });

  await db.enrichmentJob.update({
    where: { id: jobId },
    data: {
      instructions,
      status: 'analyzing',
      chatHistory: JSON.stringify(chatHistory),
    },
  });

  // Generate enrichment plan using LLM
  const originalData: CSVRow[] = JSON.parse(job.originalData);
  const headers: string[] = JSON.parse(job.headers);
  const sampleRows = originalData.slice(0, 5);

  const plan = await generateEnrichmentPlan(headers, sampleRows, instructions);

  if (!plan) {
    await db.enrichmentJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        errorMessage: 'Failed to generate enrichment plan. Please try again with different instructions.',
        chatHistory: JSON.stringify([
          ...chatHistory,
          {
            role: 'assistant',
            content: 'I had trouble understanding your request. Could you be more specific about what data you\'d like me to find? For example: "Find the company name, phone number, and industry for each email address."',
            timestamp: new Date().toISOString(),
          },
        ]),
      },
    });
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
  }

  // Update job with enrichment plan
  const enrichedHeaders = [...headers, ...plan.newColumns.filter(c => !headers.includes(c))];

  const updatedChat: ChatMessage[] = [
    ...chatHistory,
    {
      role: 'assistant',
      content: `I'll enrich your data by finding: ${plan.newColumns.join(', ')}. ${plan.strategy}. Processing ${originalData.length} rows now...`,
      timestamp: new Date().toISOString(),
    },
  ];

  await db.enrichmentJob.update({
    where: { id: jobId },
    data: {
      enrichmentPlan: JSON.stringify(plan),
      enrichedHeaders: JSON.stringify(enrichedHeaders),
      chatHistory: JSON.stringify(updatedChat),
      status: 'enriching',
      currentRow: 0,
    },
  });

  // Note: Row-by-row processing is driven by the frontend via process-row action
  // This avoids background process crashes in the dev server

  return NextResponse.json({
    id: jobId,
    status: 'enriching',
    plan: { newColumns: plan.newColumns, strategy: plan.strategy },
  });
}

// ============================================================
// PROCESS-ROW — Process a single row (called by frontend polling)
// ============================================================

async function handleProcessRow(body: { jobId: string }) {
  const { jobId } = body;

  const job = await db.enrichmentJob.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (job.status !== 'enriching') {
    return NextResponse.json({
      status: job.status,
      processedRows: job.processedRows,
      totalRows: job.totalRows,
      message: job.status === 'completed' ? 'Job already completed' : `Job is ${job.status}`,
    });
  }

  const plan: EnrichmentPlan | null = job.enrichmentPlan ? JSON.parse(job.enrichmentPlan) : null;
  if (!plan) {
    return NextResponse.json({ error: 'No enrichment plan' }, { status: 400 });
  }

  const originalData: CSVRow[] = JSON.parse(job.originalData);
  const enrichedData: CSVRow[] = JSON.parse(job.enrichedData);
  const headers: string[] = JSON.parse(job.headers);
  const rowIndex = job.processedRows;

  if (rowIndex >= originalData.length) {
    // All rows done — mark complete
    const finalChat: ChatMessage[] = JSON.parse(job.chatHistory);
    finalChat.push({
      role: 'assistant',
      content: `Enrichment complete! I've processed all ${originalData.length} rows and added ${plan.newColumns.length} new columns: ${plan.newColumns.join(', ')}. You can review the enriched data in the table or download it as CSV.`,
      timestamp: new Date().toISOString(),
    });
    await db.enrichmentJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        processedRows: originalData.length,
        currentRow: originalData.length,
        chatHistory: JSON.stringify(finalChat),
      },
    });
    return NextResponse.json({
      status: 'completed',
      processedRows: originalData.length,
      totalRows: originalData.length,
      newRow: null,
    });
  }

  // Enrich this row
  try {
    const newFields = await enrichSingleRow(
      originalData[rowIndex],
      headers,
      plan.newColumns,
      job.instructions || '',
      plan.searchQueries
    );

    const enrichedRow = { ...enrichedData[rowIndex], ...newFields };
    enrichedData[rowIndex] = enrichedRow;

    await db.enrichmentJob.update({
      where: { id: jobId },
      data: {
        enrichedData: JSON.stringify(enrichedData),
        processedRows: rowIndex + 1,
        currentRow: rowIndex + 1,
      },
    });

    return NextResponse.json({
      status: 'enriching',
      processedRows: rowIndex + 1,
      totalRows: originalData.length,
      rowIndex,
      newRow: enrichedRow,
    });
  } catch (err) {
    // Row failed — still advance progress but mark as empty
    await db.enrichmentJob.update({
      where: { id: jobId },
      data: {
        processedRows: rowIndex + 1,
        currentRow: rowIndex + 1,
      },
    });

    return NextResponse.json({
      status: 'enriching',
      processedRows: rowIndex + 1,
      totalRows: originalData.length,
      rowIndex,
      newRow: null,
      error: `Row ${rowIndex + 1} enrichment failed`,
    });
  }
}

// ============================================================
// CHAT — Send a chat message during enrichment
// ============================================================

async function handleChat(body: { jobId: string; message: string }) {
  const { jobId, message } = body;

  const job = await db.enrichmentJob.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const chatHistory: ChatMessage[] = JSON.parse(job.chatHistory);

  // Add user message
  chatHistory.push({
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
  });

  // Generate AI response based on context
  const originalData: CSVRow[] = JSON.parse(job.originalData);
  const enrichedData: CSVRow[] = JSON.parse(job.enrichedData);
  const enrichedHeaders: string[] = JSON.parse(job.enrichedHeaders);

  const contextPrompt = `You are an AI data enrichment assistant. The user has uploaded a CSV file "${job.fileName}" with ${job.totalRows} rows.

Current status: ${job.status} (${job.processedRows}/${job.totalRows} rows processed)
Original columns: ${JSON.parse(job.headers).join(', ')}
Current enriched columns: ${enrichedHeaders.join(', ')}
User instructions: ${job.instructions || 'None yet'}

Sample original data (first 3 rows):
${JSON.stringify(originalData.slice(0, 3), null, 2)}

Sample enriched data (first 3 rows):
${JSON.stringify(enrichedData.slice(0, 3), null, 2)}

Respond helpfully. If the user wants to change the enrichment strategy, suggest what to do. If they ask about the data, analyze it. If they want to add more columns, explain how. Keep responses concise and actionable.`;

  const aiResponse = await callLLM({
    systemPrompt: contextPrompt,
    userMessage: message,
    temperature: 0.5,
    maxTokens: 1000,
  });

  chatHistory.push({
    role: 'assistant',
    content: aiResponse || 'I\'m having trouble processing your request. Please try again.',
    timestamp: new Date().toISOString(),
  });

  await db.enrichmentJob.update({
    where: { id: jobId },
    data: { chatHistory: JSON.stringify(chatHistory) },
  });

  return NextResponse.json({
    chatHistory,
    currentStatus: job.status,
    progress: job.totalRows > 0 ? Math.round((job.processedRows / job.totalRows) * 100) : 0,
  });
}

// ============================================================
// PAUSE / RESUME / DELETE
// ============================================================

async function handlePause(body: { jobId: string }) {
  const { jobId } = body;
  await db.enrichmentJob.update({
    where: { id: jobId },
    data: { status: 'paused' },
  });
  return NextResponse.json({ id: jobId, status: 'paused' });
}

async function handleResume(body: { jobId: string }) {
  const { jobId } = body;
  const job = await db.enrichmentJob.findUnique({ where: { id: jobId } });
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  if (job.status !== 'paused') {
    return NextResponse.json({ error: 'Job is not paused' }, { status: 400 });
  }

  const plan: EnrichmentPlan | null = job.enrichmentPlan ? JSON.parse(job.enrichmentPlan) : null;
  if (!plan) {
    return NextResponse.json({ error: 'No enrichment plan found' }, { status: 400 });
  }

  await db.enrichmentJob.update({
    where: { id: jobId },
    data: { status: 'enriching' },
  });

  // Frontend will drive processing via process-row action

  return NextResponse.json({ id: jobId, status: 'enriching' });
}

async function handleDelete(body: { jobId: string }) {
  const { jobId } = body;
  await db.enrichmentJob.delete({ where: { id: jobId } });
  return NextResponse.json({ id: jobId, deleted: true });
}

// ============================================================
// AI: Generate Enrichment Plan
// ============================================================

async function generateEnrichmentPlan(
  headers: string[],
  sampleRows: CSVRow[],
  instructions: string
): Promise<EnrichmentPlan | null> {
  const planResult = await callLLMForJSON<EnrichmentPlan>(
    `You are a data enrichment strategist. Given a CSV file's headers and sample data, along with the user's instructions, create a concrete enrichment plan.

Return a JSON object with:
- "newColumns": array of NEW column names to add (e.g., ["Full Name", "Phone Number", "Company", "Industry", "Location"])
- "strategy": a brief description of the enrichment approach
- "searchQueries": array of search query templates using {column_name} placeholders

Rules:
- Only add columns that don't already exist
- Column names should be human-readable (e.g., "Full Name" not "full_name")
- Search queries should leverage existing data (e.g., "email {email} company info" if email column exists)
- Be practical: focus on data that can realistically be found via web search`,
    `CSV Headers: ${headers.join(', ')}

Sample data (first ${sampleRows.length} rows):
${JSON.stringify(sampleRows, null, 2)}

User instructions: ${instructions}`,
    { temperature: 0.3, maxTokens: 2000 }
  );

  return planResult;
}

// ============================================================
// AI: Enrich a single row
// ============================================================

async function enrichSingleRow(
  row: CSVRow,
  originalHeaders: string[],
  newColumns: string[],
  instructions: string,
  searchQueries: string[]
): Promise<Record<string, string>> {
  // Build search context from existing row data
  const rowContext = originalHeaders
    .map(h => `${h}: ${row[h] || 'N/A'}`)
    .join(', ');

  // Perform web search for this row's data
  let searchResults = '';
  try {
    const zai = await (await import('z-ai-web-dev-sdk')).default.create();

    // Execute up to 2 search queries for this row
    for (const queryTemplate of searchQueries.slice(0, 2)) {
      try {
        const query = queryTemplate.replace(/\{(\w+)\}/g, (_, col) => row[col] || '');
        if (query.trim().length < 3) continue;

        const results = await zai.functions.invoke('web_search', {
          query: query.slice(0, 200),
          num: 5,
        });

        if (Array.isArray(results) && results.length > 0) {
          searchResults += results
            .slice(0, 3)
            .map((r: { name?: string; snippet?: string; url?: string }) =>
              `${r.name || ''}: ${r.snippet || ''}`
            )
            .join('\n');
          searchResults += '\n';
        }
      } catch {
        // Search query failed, continue with remaining queries
      }
    }
  } catch {
    // Web search unavailable
  }

  // Use LLM to extract enrichment data
  const enrichedData = await callLLMForJSON<Record<string, string>>(
    `You are a data enrichment specialist. Given existing row data and web search results, fill in the requested new columns with REAL, FACTUAL information.

Rules:
- Only include data you are confident about from the search results
- Use empty string "" for fields where no reliable data was found
- Be factual — do NOT make up or guess data
- Format phone numbers consistently (e.g., "+1-555-123-4567")
- Format locations as "City, State, Country"
- Return a JSON object with ONLY the new column names as keys`,
    `Existing row data: ${rowContext}

Web search results:
${searchResults || 'No search results available'}

New columns to fill: ${newColumns.join(', ')}

User's enrichment request: ${instructions}

Return a JSON object with these keys: ${JSON.stringify(newColumns)}`,
    { temperature: 0.2, maxTokens: 1500 }
  );

  return enrichedData || {};
}

// ============================================================
// Background: Process rows one by one
// ============================================================

async function enrichRowsInBackground(
  jobId: string,
  plan: EnrichmentPlan,
  instructions: string
) {
  console.log(`[Enrichment BG] Starting for job ${jobId}`);

  const job = await db.enrichmentJob.findUnique({ where: { id: jobId } });
  if (!job || (job.status !== 'enriching' && job.status !== 'analyzing')) {
    console.log(`[Enrichment BG] Job ${jobId} not in enriching state, aborting`);
    return;
  }

  const originalData: CSVRow[] = JSON.parse(job.originalData);
  const enrichedData: CSVRow[] = JSON.parse(job.enrichedData);
  const enrichedHeaders: string[] = JSON.parse(job.enrichedHeaders);
  const headers: string[] = JSON.parse(job.headers);

  // Start from where we left off
  let startRow = job.processedRows;

  for (let i = startRow; i < originalData.length; i++) {
    // Check if job was paused or deleted
    const currentJob = await db.enrichmentJob.findUnique({ where: { id: jobId } });
    if (!currentJob || currentJob.status === 'paused' || currentJob.status === 'failed') {
      console.log(`[Enrichment BG] Job ${jobId} stopped at row ${i}, status: ${currentJob?.status}`);
      return;
    }

    try {
      // Enrich this row
      const newFields = await enrichSingleRow(
        originalData[i],
        headers,
        plan.newColumns,
        instructions,
        plan.searchQueries
      );

      // Merge new data into enriched row
      const enrichedRow = { ...enrichedData[i], ...newFields };
      enrichedData[i] = enrichedRow;

      // Update progress in DB
      await db.enrichmentJob.update({
        where: { id: jobId },
        data: {
          enrichedData: JSON.stringify(enrichedData),
          processedRows: i + 1,
          currentRow: i + 1,
          status: 'enriching',
        },
      });

      console.log(`[Enrichment BG] Job ${jobId}: Row ${i + 1}/${originalData.length} done`);
    } catch (err) {
      console.error(`[Enrichment BG] Row ${i} failed:`, err);
      // Continue with next row — don't fail the whole job
    }
  }

  // Mark job as complete
  const finalChat: ChatMessage[] = JSON.parse(job.chatHistory);
  finalChat.push({
    role: 'assistant',
    content: `Enrichment complete! I've processed all ${originalData.length} rows and added ${plan.newColumns.length} new columns: ${plan.newColumns.join(', ')}. You can review the enriched data in the table or download it as CSV.`,
    timestamp: new Date().toISOString(),
  });

  await db.enrichmentJob.update({
    where: { id: jobId },
    data: {
      status: 'completed',
      processedRows: originalData.length,
      currentRow: originalData.length,
      chatHistory: JSON.stringify(finalChat),
    },
  });

  console.log(`[Enrichment BG] Job ${jobId} completed!`);
}
