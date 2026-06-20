// ============================================================
// Data Source Registry — Single Export Point for All Channels
// ============================================================
//
// This module is the central registry for every external data source
// integrated into LeadReach. New data sources are added here, then
// consumed by the prospect-agent orchestrator (Scout, Augment, Judge).
//
// ─── Pattern ──────────────────────────────────────────────────────────
// Each data source module exports:
//   1. A health check: `<name>Health()` — returns { status, ... }
//   2. One or more action functions
//   3. Optional KPI builders / Lead-field mappers
//
// All modules degrade gracefully when their backend is unavailable
// (missing API key, worker down, etc.) — they return empty results,
// not exceptions. This ensures the agent pipeline continues running.
//
// ─── Categories ───────────────────────────────────────────────────────
//  • Place discovery (Overpass)
//  • Company registry (OpenCorporates, SEC EDGAR)
//  • Financial KPIs (yfinance, SEC EDGAR)
//  • News & intent (News Worker / Newspaper3k)
//  • Tech-stack discovery (PublicWWW)
//  • Geospatial utilities (Geocoder / Nominatim)
//
// ─── Agents ───────────────────────────────────────────────────────────
//  • Scout  (Discovery)    → Overpass, PublicWWW
//  • Augment (Enrichment)  → OpenCorporates, yfinance, SEC EDGAR, Geocoder
//  • Judge (Qualification) → News Worker, SEC EDGAR (intent), Geocoder
// ============================================================

// ─── Overpass API (OpenStreetMap) ────────────────────────────────────────
export {
  overpassSearchPlaces,
  overpassGetPlace,
  overpassHealth,
  overpassPlaceToLeadFields,
  type OverpassPlace,
  type OverpassSearchOptions,
  type OverpassSearchResult,
} from './overpass';

// ─── SEC EDGAR ───────────────────────────────────────────────────────────
export {
  edgarGetCikByTicker,
  edgarGetCompanyInfo,
  edgarGetFilings,
  edgarGetInsiderTransactions,
  edgarEnrichCompany,
  edgarHealth,
  computeEdgarKPIs,
  type EdgarCompanyInfo,
  type EdgarFiling,
  type EdgarInsiderTransaction,
  type EdgarEnrichmentResult,
} from './sec-edgar';

// ─── yfinance (Yahoo Finance) ────────────────────────────────────────────
export {
  yfinanceEnrich,
  yfinanceSearchTicker,
  yfinanceHealth,
  type YFinanceQuote,
  type YFinanceProfile,
  type YFinanceFinancials,
  type YFinanceEnrichmentResult,
} from './yfinance';

// ─── OpenCorporates ──────────────────────────────────────────────────────
export {
  ocSearchCompanies,
  ocGetCompany,
  ocEnrichByName,
  ocHealth,
  ocOfficerToPersonLeadFields,
  type OcCompany,
  type OcOfficer,
  type OcFiling,
  type OcSearchResult,
  type OcEnrichmentResult,
} from './opencorporates';

// ─── PublicWWW ───────────────────────────────────────────────────────────
export {
  publicWwwSearch,
  publicWwwDiscoverByTechnology,
  publicWwwHealth,
  type PublicWwwResult,
  type PublicWwwSearchOptions,
  type PublicWwwSearchResult,
  type PublicWwwTechProfile,
} from './publicwww';

// ─── Geocoder ────────────────────────────────────────────────────────────
export {
  geocodeForward,
  geocodeReverse,
  haversineDistance,
  computeDistanceKpi,
  roughTimezoneFromLongitude,
  geocoderHealth,
  type GeocodedAddress,
  type GeocodeOptions,
  type DistanceResult,
} from './geocoder';

// ─── News Worker (Newspaper3k Python sidecar) ────────────────────────────
export {
  newsExtractArticle,
  newsExtractBatch,
  newsSearchIntent,
  newsAnalyzeSentiment,
  newsHealth,
  newsIntentToKPIs,
  type NewsArticle,
  type NewsIntentResult,
  type NewsSentiment,
  type NewsWorkerHealth,
} from './news-worker';

// ─── Local imports for the unified health check ──────────────────────────
//
// The re-exports above make these names available to external consumers,
// but to use them inside this module (in `checkAllDataSources` below),
// we need an explicit local import.

import { overpassHealth } from './overpass';
import { edgarHealth } from './sec-edgar';
import { yfinanceHealth } from './yfinance';
import { ocHealth } from './opencorporates';
import { publicWwwHealth } from './publicwww';
import { geocoderHealth } from './geocoder';
import { newsHealth } from './news-worker';

// ─── Unified Health Check ────────────────────────────────────────────────

export interface DataSourceHealthSummary {
  overpass: { status: 'ok' | 'error'; latencyMs?: number };
  edgar: { status: 'ok' | 'error'; latencyMs?: number };
  yfinance: { status: 'ok' | 'error'; latencyMs?: number };
  opencorporates: { status: 'ok' | 'error' | 'no_token'; apiTokenUsed: boolean; latencyMs?: number };
  publicwww: { status: 'ok' | 'error' | 'no_key'; apiStatus?: { requestsUsed: number; requestsLimit: number; requestsRemaining: number } };
  geocoder: { status: 'ok' | 'error'; latencyMs?: number };
  newsWorker: { status: 'ok' | 'error'; newspaperAvailable?: boolean; spacyAvailable?: boolean };
  timestamp: string;
}

/**
 * Run a health check across ALL data sources in parallel.
 * Returns a unified summary suitable for the /api/data-sources/health endpoint.
 *
 * Each check has a 5-second timeout — a slow/unreachable source doesn't
 * block the others.
 */
export async function checkAllDataSources(): Promise<DataSourceHealthSummary> {
  const safeCall = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await Promise.race([
        fn(),
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ]);
    } catch {
      return fallback;
    }
  };

  const [overpass, edgar, yfinance, opencorporates, publicwww, geocoder, newsWorker] =
    await Promise.all([
      safeCall(overpassHealth, { status: 'error' as const }),
      safeCall(edgarHealth, { status: 'error' as const }),
      safeCall(yfinanceHealth, { status: 'error' as const }),
      safeCall(ocHealth, { status: 'error' as const, apiTokenUsed: false }),
      safeCall(publicWwwHealth, { status: 'error' as const }),
      safeCall(geocoderHealth, { status: 'error' as const }),
      safeCall(newsHealth, { status: 'error' as const }),
    ]);

  return {
    overpass,
    edgar,
    yfinance,
    opencorporates,
    publicwww,
    geocoder,
    newsWorker,
    timestamp: new Date().toISOString(),
  };
}
