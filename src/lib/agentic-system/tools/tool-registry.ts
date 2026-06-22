/**
 * Agentic Tool Registry
 * =====================
 *
 * A unified facade over LeadReach's existing tool systems:
 *   - src/lib/vellum-core/tool-registry.ts (Vellum tools)
 *   - src/lib/agent-reach-bridge.ts (17-channel Agent Reach tools)
 *   - src/lib/prospect-agent/data-sources/* (data source tools)
 *
 * Every tool the agentic system can invoke is registered here with a
 * consistent schema (name, description, input schema, invoke function).
 * This lets the MoE router and the harness reference tools by name
 * without knowing their underlying implementation.
 */

// ============================================================
// Tool Schema
// ============================================================

export interface ToolSchema {
  name: string;
  description: string;
  category: 'search' | 'crawl' | 'enrich' | 'analyze' | 'compose' | 'persist' | 'report';
  /** JSON-schema-like input description. */
  inputSchema: Record<string, unknown>;
  /** Estimated cost (1=cheap, 10=expensive). Used by MoE router. */
  cost: number;
  /** Whether this tool makes external HTTP calls. */
  external: boolean;
  /** Required env vars / API keys. */
  requiredEnv?: string[];
}

export interface ToolInvocationResult {
  ok: boolean;
  data?: unknown;
  error?: string;
  /** Wall-clock duration in ms. */
  durationMs: number;
}

export type ToolInvokeFn = (input: Record<string, unknown>) => Promise<ToolInvocationResult>;

export interface RegisteredTool {
  schema: ToolSchema;
  invoke: ToolInvokeFn;
}

// ============================================================
// Registry
// ============================================================

const registry = new Map<string, RegisteredTool>();

export function registerTool(schema: ToolSchema, invoke: ToolInvokeFn): void {
  registry.set(schema.name, { schema, invoke });
}

export function getTool(name: string): RegisteredTool | undefined {
  return registry.get(name);
}

export function listTools(): ToolSchema[] {
  return Array.from(registry.values()).map(t => t.schema);
}

export function listToolsByCategory(category: ToolSchema['category']): ToolSchema[] {
  return listTools().filter(t => t.category === category);
}

// ============================================================
// Built-in Tool Definitions
// ============================================================
//
// These wrap the existing tool implementations in LeadReach with a
// consistent schema. They are registered lazily on first use to avoid
// importing heavy modules at app boot.

let toolsRegistered = false;

export async function ensureToolsRegistered(): Promise<void> {
  if (toolsRegistered) return;
  toolsRegistered = true;

  // ── Search tools ──
  registerTool(
    {
      name: 'duckduckgo_search',
      description: 'Search the web via DuckDuckGo HTML scraping. Zero-config.',
      category: 'search',
      inputSchema: { query: 'string', maxResults: 'number' },
      cost: 2,
      external: true,
    },
    async (input) => {
      const start = Date.now();
      try {
        const { directDuckDuckGoSearch } = await import('@/lib/direct-search');
        const result = await directDuckDuckGoSearch(
          String(input.query ?? ''),
          Number(input.maxResults ?? 10),
        );
        return {
          ok: result.success,
          data: result.data,
          error: result.error,
          durationMs: Date.now() - start,
        };
      } catch (err) {
        return { ok: false, error: String(err), durationMs: Date.now() - start };
      }
    },
  );

  registerTool(
    {
      name: 'exa_search',
      description: 'Search the web via Exa API. Higher quality than DuckDuckGo but requires EXA_API_KEY.',
      category: 'search',
      inputSchema: { query: 'string', maxResults: 'number' },
      cost: 3,
      external: true,
      requiredEnv: ['EXA_API_KEY'],
    },
    async (input) => {
      const start = Date.now();
      try {
        const { exaSearch } = await import('@/lib/agent-reach-bridge');
        const result = await exaSearch(String(input.query ?? ''), Number(input.maxResults ?? 25));
        return {
          ok: result.success,
          data: result.data,
          error: result.error,
          durationMs: Date.now() - start,
        };
      } catch (err) {
        return { ok: false, error: String(err), durationMs: Date.now() - start };
      }
    },
  );

  // ── Crawl tools ──
  registerTool(
    {
      name: 'crawl4ai_read',
      description: 'Read a single URL via the crawl4ai service (Python subprocess).',
      category: 'crawl',
      inputSchema: { url: 'string' },
      cost: 5,
      external: true,
    },
    async (input) => {
      const start = Date.now();
      try {
        const { webRead } = await import('@/lib/agent-reach-bridge');
        const result = await webRead(String(input.url ?? ''));
        return {
          ok: result.success,
          data: result.data,
          error: result.error,
          durationMs: Date.now() - start,
        };
      } catch (err) {
        return { ok: false, error: String(err), durationMs: Date.now() - start };
      }
    },
  );

  // ── Enrich tools ──
  registerTool(
    {
      name: 'linkedin_search_companies',
      description: 'Search LinkedIn company pages via the Agent Reach bridge.',
      category: 'enrich',
      inputSchema: { query: 'string' },
      cost: 4,
      external: true,
    },
    async (input) => {
      const start = Date.now();
      try {
        const { linkedInSearchCompanies } = await import('@/lib/agent-reach-bridge');
        const result = await linkedInSearchCompanies(String(input.query ?? ''));
        return {
          ok: result.success,
          data: result.data,
          error: result.error,
          durationMs: Date.now() - start,
        };
      } catch (err) {
        return { ok: false, error: String(err), durationMs: Date.now() - start };
      }
    },
  );

  // ── Persist tools ──
  registerTool(
    {
      name: 'persist_lead',
      description: 'Create or update a Lead row in the database.',
      category: 'persist',
      inputSchema: { campaignId: 'string', lead: 'object' },
      cost: 1,
      external: false,
    },
    async (input) => {
      const start = Date.now();
      try {
        const { db } = await import('@/lib/db');
        const campaignId = String(input.campaignId ?? '');
        const lead = input.lead as Record<string, unknown>;
        if (!campaignId || !lead) {
          return { ok: false, error: 'campaignId and lead required', durationMs: Date.now() - start };
        }
        const created = await db.lead.create({
          data: {
            campaignId,
            companyName: String(lead.companyName ?? 'Unknown'),
            website: lead.website ? String(lead.website) : null,
            stage: 'new',
            leadScore: 0,
            leadTier: 'cold',
            dataCompleteness: 5,
          },
        });
        return { ok: true, data: created, durationMs: Date.now() - start };
      } catch (err) {
        return { ok: false, error: String(err), durationMs: Date.now() - start };
      }
    },
  );

  // ── Report tools ──
  registerTool(
    {
      name: 'generate_summary',
      description: 'Generate a natural-language summary of a pipeline run. Used by Echo.',
      category: 'report',
      inputSchema: { pipelineState: 'object', insights: 'array' },
      cost: 2,
      external: false,
    },
    async (input) => {
      const start = Date.now();
      try {
        const insights = (input.insights as string[]) ?? [];
        const summary = `Pipeline complete. ${insights.length} insights generated:\n` +
          insights.map((s, i) => `${i + 1}. ${s}`).join('\n');
        return { ok: true, data: { summary }, durationMs: Date.now() - start };
      } catch (err) {
        return { ok: false, error: String(err), durationMs: Date.now() - start };
      }
    },
  );
}

// ============================================================
// Convenience: invoke by name
// ============================================================

export async function invokeTool(
  name: string,
  input: Record<string, unknown>,
): Promise<ToolInvocationResult> {
  await ensureToolsRegistered();
  const tool = registry.get(name);
  if (!tool) {
    return { ok: false, error: `Unknown tool: ${name}`, durationMs: 0 };
  }
  return tool.invoke(input);
}
