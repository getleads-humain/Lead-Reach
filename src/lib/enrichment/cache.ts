/**
 * Enrichment Cache — LeadReach
 * ==================================================
 *
 * Inspired by Relevance AI's llmcache.com pattern.
 * Caches LLM enrichment results to:
 *   1. Avoid redundant API calls for the same lead+capability
 *   2. Reduce cost and latency for repeated enrichments
 *   3. Enable instant results when re-viewing previously enriched leads
 *
 * Cache entries are keyed by: leadId + capabilityType + dataHash
 * TTL: 24 hours for standard entries, 1 hour for real-time data
 */

import { db } from '@/lib/db';

// ============================================================
// Types
// ============================================================

interface CacheEntry {
  key: string;
  leadId: string;
  capability: string;
  result: unknown;
  modelUsed: string;
  createdAt: number;
  expiresAt: number;
  hitCount: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
}

// ============================================================
// In-memory cache with persistence
// ============================================================

const CACHE_TTL_STANDARD = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_TTL_REALTIME = 60 * 60 * 1000;       // 1 hour
const MAX_CACHE_SIZE = 2000;

const memoryCache = new Map<string, CacheEntry>();
let stats = { hits: 0, misses: 0, evictions: 0 };

// ============================================================
// Key generation
// ============================================================

/**
 * Generate a deterministic cache key from lead data and capability.
 * Uses a hash of relevant lead fields to detect data changes.
 */
export function generateCacheKey(
  leadId: string,
  capability: string,
  leadData?: Record<string, unknown>,
): string {
  // Include key lead fields in the hash so cache invalidates when data changes
  const hashFields = [
    leadId,
    capability,
    leadData?.companyName || '',
    leadData?.industry || '',
    leadData?.employeeCount || '',
    leadData?.revenueEstimate || '',
    leadData?.country || '',
    leadData?.leadScore || '',
    leadData?.stage || '',
  ];
  const raw = hashFields.join('|');
  // Simple hash
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `${capability}:${leadId}:${Math.abs(hash).toString(36)}`;
}

// ============================================================
// Core operations
// ============================================================

/**
 * Get a cached enrichment result if it exists and hasn't expired.
 */
export function getCachedResult(key: string): CacheEntry | null {
  const entry = memoryCache.get(key);
  if (!entry) {
    stats.misses++;
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    stats.misses++;
    return null;
  }

  entry.hitCount++;
  stats.hits++;
  return entry;
}

/**
 * Store an enrichment result in the cache.
 */
export function setCachedResult(
  key: string,
  leadId: string,
  capability: string,
  result: unknown,
  modelUsed: string = 'glm-4.7-flash',
  ttl: 'standard' | 'realtime' = 'standard',
): void {
  // Evict old entries if cache is full
  if (memoryCache.size >= MAX_CACHE_SIZE) {
    evictOldest();
  }

  const now = Date.now();
  const entry: CacheEntry = {
    key,
    leadId,
    capability,
    result,
    modelUsed,
    createdAt: now,
    expiresAt: now + (ttl === 'realtime' ? CACHE_TTL_REALTIME : CACHE_TTL_STANDARD),
    hitCount: 0,
  };

  memoryCache.set(key, entry);
}

/**
 * Check if a capability has been recently cached for a lead.
 */
export function isCapabilityCached(
  leadId: string,
  capability: string,
  leadData?: Record<string, unknown>,
): boolean {
  const key = generateCacheKey(leadId, capability, leadData);
  return getCachedResult(key) !== null;
}

/**
 * Get a cached capability result, returning null if not found.
 */
export function getCapabilityResult<T = unknown>(
  leadId: string,
  capability: string,
  leadData?: Record<string, unknown>,
): T | null {
  const key = generateCacheKey(leadId, capability, leadData);
  const entry = getCachedResult(key);
  return entry ? (entry.result as T) : null;
}

/**
 * Cache a capability result with automatic key generation.
 */
export function cacheCapabilityResult(
  leadId: string,
  capability: string,
  result: unknown,
  leadData?: Record<string, unknown>,
  modelUsed: string = 'glm-4.7-flash',
): void {
  const key = generateCacheKey(leadId, capability, leadData);
  setCachedResult(key, leadId, capability, result, modelUsed);
}

/**
 * Invalidate all cache entries for a specific lead.
 */
export function invalidateLeadCache(leadId: string): number {
  let invalidated = 0;
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.leadId === leadId) {
      memoryCache.delete(key);
      invalidated++;
    }
  }
  return invalidated;
}

/**
 * Invalidate cache entries for a specific capability on a lead.
 */
export function invalidateCapability(leadId: string, capability: string): boolean {
  let deleted = false;
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.leadId === leadId && entry.capability === capability) {
      memoryCache.delete(key);
      deleted = true;
    }
  }
  return deleted;
}

// ============================================================
// Persistence to lead notes (for cross-session cache)
// ============================================================

const CACHE_MARKER = '__enrichment_cache__';

interface PersistedCacheEntry {
  capability: string;
  result: unknown;
  cachedAt: string;
  modelUsed: string;
}

/**
 * Load enrichment cache from a lead's notes field.
 * This enables cache persistence across server restarts.
 */
export function loadCacheFromNotes(notes: string | null): Map<string, PersistedCacheEntry> {
  const cache = new Map<string, PersistedCacheEntry>();
  if (!notes) return cache;

  try {
    const idx = notes.indexOf(CACHE_MARKER);
    if (idx === -1) return cache;

    const jsonStart = notes.indexOf('{', idx);
    const jsonEnd = notes.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) return cache;

    const slice = notes.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(slice);

    if (parsed && typeof parsed === 'object' && parsed.entries) {
      for (const [key, value] of Object.entries(parsed.entries as Record<string, PersistedCacheEntry>)) {
        // Only load entries that haven't expired (24h)
        const cachedAt = new Date(value.cachedAt).getTime();
        if (Date.now() - cachedAt < CACHE_TTL_STANDARD) {
          cache.set(key, value);
        }
      }
    }
  } catch {
    // Invalid cache format, ignore
  }

  return cache;
}

/**
 * Build a notes string with the enrichment cache embedded.
 */
export function buildNotesWithCache(
  existingNotes: string | null,
  cacheEntries: Map<string, PersistedCacheEntry>,
): string {
  let cleanNotes = (existingNotes || '').trim();
  const markerIdx = cleanNotes.indexOf(CACHE_MARKER);
  if (markerIdx !== -1) {
    cleanNotes = cleanNotes.slice(0, markerIdx).trim();
  }

  if (cacheEntries.size === 0) return cleanNotes;

  const cacheObj = {
    version: 1,
    entries: Object.fromEntries(cacheEntries),
  };

  const block = `\n\n${CACHE_MARKER}\n${JSON.stringify(cacheObj)}\n`;
  return (cleanNotes + block).trim();
}

// ============================================================
// Cache eviction
// ============================================================

function evictOldest(): void {
  let oldestKey: string | null = null;
  let oldestTime = Infinity;

  for (const [key, entry] of memoryCache.entries()) {
    if (entry.createdAt < oldestTime) {
      oldestTime = entry.createdAt;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    memoryCache.delete(oldestKey);
    stats.evictions++;
  }
}

// ============================================================
// Stats
// ============================================================

export function getCacheStats(): CacheStats {
  return {
    hits: stats.hits,
    misses: stats.misses,
    evictions: stats.evictions,
    size: memoryCache.size,
  };
}

export function resetCacheStats(): void {
  stats = { hits: 0, misses: 0, evictions: 0 };
}
