/**
 * LeadReach — Environment Variable Validation & Security
 * ========================================================
 * Centralized, secure environment variable management.
 *
 * WHY THIS EXISTS:
 * - Prevents runtime crashes from missing env vars (the #1 preview error)
 * - Validates values at startup, not at random call sites
 * - Never exposes secret values in error messages or client bundles
 * - Provides a single source of truth for all config checks
 *
 * SECURITY PRINCIPLES:
 * - NEXT_PUBLIC_ vars are safe for browser (inlined by Next.js at build time)
 * - Server-only vars (SUPABASE_SERVICE_ROLE_KEY, etc.) are NEVER exposed client-side
 * - Placeholder detection rejects "your-project", "placeholder", etc.
 * - All checks are idempotent and side-effect-free
 */

// ─── Types ────────────────────────────────────────────────────────────────

interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  placeholders: string[];
}

interface SupabaseConfig {
  url: string | undefined;
  anonKey: string | undefined;
  serviceRoleKey: string | undefined;
  isConfigured: boolean;
  isFullyConfigured: boolean; // includes service role key
}

// ─── Internal Helpers ─────────────────────────────────────────────────────

const PLACEHOLDER_PATTERNS = [
  'placeholder',
  'your-project',
  'your-',
  'xxx',
  'change-me',
  'insert_',
  'example',
  'test-key',
  'dummy',
];

/**
 * Check if a value looks like a placeholder rather than a real credential.
 * Returns true if the value appears to be a real (non-placeholder) value.
 */
function isRealValue(value: string | undefined): value is string {
  if (!value || value.trim() === '') return false;
  const lower = value.toLowerCase();
  return !PLACEHOLDER_PATTERNS.some((pattern) => lower.includes(pattern));
}

/**
 * Safely read a server-only env var. This function should NEVER be called
 * from client-side code. It uses process.env directly (not NEXT_PUBLIC_)
 * which Next.js excludes from the client bundle.
 */
function getServerVar(name: string): string | undefined {
  if (typeof window !== 'undefined') {
    // Client-side: this should never happen for server-only vars
    console.warn(`[LeadReach Env] Attempted to read server-only var "${name}" on client`);
    return undefined;
  }
  return process.env[name];
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Check if Supabase browser client can be initialized.
 * This is safe to call from both client and server code.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return isRealValue(url) && isRealValue(key);
}

/**
 * Check if Supabase service role is available (server-only).
 * Returns false on client-side (service key is never exposed to browser).
 */
export function isSupabaseServiceConfigured(): boolean {
  if (typeof window !== 'undefined') return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = getServerVar('SUPABASE_SERVICE_ROLE_KEY');
  return isRealValue(url) && isRealValue(key) && isRealValue(serviceKey);
}

/**
 * Get the full Supabase configuration status.
 * Safe to call from client-side (serviceRoleKey will be undefined).
 */
export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = typeof window === 'undefined'
    ? getServerVar('SUPABASE_SERVICE_ROLE_KEY')
    : undefined;

  const urlValid = isRealValue(url);
  const keyValid = isRealValue(anonKey);
  const serviceKeyValid = isRealValue(serviceRoleKey);

  return {
    url: urlValid ? url : undefined,
    anonKey: keyValid ? anonKey : undefined,
    serviceRoleKey: serviceKeyValid ? serviceRoleKey : undefined,
    isConfigured: urlValid && keyValid,
    isFullyConfigured: urlValid && keyValid && serviceKeyValid,
  };
}

/**
 * Validate all required environment variables and return a detailed report.
 * Useful for startup diagnostics and health checks.
 * NEVER exposes actual values — only reports which are missing/placeholder.
 */
export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];
  const placeholders: string[] = [];

  // Browser-accessible vars (NEXT_PUBLIC_)
  const browserVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_APP_URL',
  ] as const;

  for (const name of browserVars) {
    const value = process.env[name];
    if (!value || value.trim() === '') {
      missing.push(name);
    } else if (!isRealValue(value)) {
      placeholders.push(name);
    }
  }

  // Server-only vars — only check on server side
  if (typeof window === 'undefined') {
    const serverVars = [
      'SUPABASE_SERVICE_ROLE_KEY',
    ] as const;

    for (const name of serverVars) {
      const value = process.env[name];
      if (!value || value.trim() === '') {
        missing.push(name);
      } else if (!isRealValue(value)) {
        placeholders.push(name);
      }
    }

    // Optional-but-recommended server vars — surface as placeholder if set
    // to a non-real value (so misconfigurations are visible) but NEVER as
    // missing (so the app still boots without them).
    const optionalServerVars = [
      'EXA_API_KEY',
      'ZHIPU_API_KEY',
    ] as const;

    for (const name of optionalServerVars) {
      const value = process.env[name];
      if (value && value.trim() !== '' && !isRealValue(value)) {
        placeholders.push(name);
      }
    }
  }

  return {
    valid: missing.length === 0 && placeholders.length === 0,
    missing,
    placeholders,
  };
}

/**
 * Log environment status at startup (server-side only).
 * Masks values for security — never prints actual credentials.
 */
export function logEnvStatus(): void {
  if (typeof window !== 'undefined') return;

  const config = getSupabaseConfig();
  const validation = validateEnv();

  if (config.isConfigured) {
    // Only log the domain, not the full URL with any embedded tokens
    try {
      const hostname = config.url ? new URL(config.url).hostname : 'unknown';
      console.log(`[LeadReach] Supabase configured: ${hostname}`);
    } catch {
      console.log('[LeadReach] Supabase configured: (URL parse error)');
    }
  } else {
    console.warn('[LeadReach] Supabase NOT configured — auth features disabled');
    console.warn('[LeadReach] Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  }

  if (!config.isFullyConfigured && typeof window === 'undefined') {
    console.warn('[LeadReach] SUPABASE_SERVICE_ROLE_KEY not set — admin API features disabled');
  }

  if (isExaConfigured()) {
    console.log('[LeadReach] Exa Search configured — semantic web search available for all agents');
  } else {
    console.warn('[LeadReach] EXA_API_KEY not set — Exa semantic search disabled (falling back to DuckDuckGo/Jina)');
  }

  if (!validation.valid) {
    if (validation.missing.length > 0) {
      console.warn(`[LeadReach] Missing env vars: ${validation.missing.join(', ')}`);
    }
    if (validation.placeholders.length > 0) {
      console.warn(`[LeadReach] Placeholder env vars: ${validation.placeholders.join(', ')}`);
    }
  }
}

/**
 * Check if Exa Search is configured (server-only).
 * When true, exaSearch() in agent-reach-bridge.ts will call the real Exa API
 * as the primary search backend (zero-config — no other setup needed).
 */
export function isExaConfigured(): boolean {
  if (typeof window !== 'undefined') return false;
  return isRealValue(getServerVar('EXA_API_KEY'));
}

/**
 * Get the Exa API key (server-only). Returns undefined on client or when
 * not configured.
 */
export function getExaApiKey(): string | undefined {
  if (typeof window !== 'undefined') return undefined;
  const key = getServerVar('EXA_API_KEY');
  return isRealValue(key) ? key : undefined;
}

/**
 * Check if knowledge-base semantic embeddings are enabled (server-only).
 * When true, the knowledge index will pre-compute Z.AI embedding-3 vectors
 * for every chunk and use hybrid BM25 + cosine similarity retrieval.
 */
export function isKnowledgeEmbeddingsEnabled(): boolean {
  if (typeof window !== 'undefined') return false;
  return process.env.USE_KNOWLEDGE_EMBEDDINGS === 'true';
}
