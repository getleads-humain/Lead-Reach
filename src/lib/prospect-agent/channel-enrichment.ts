// ============================================================
// Channel Enrichment — Data Source Integration Layer
// ============================================================
//
// This module orchestrates the 7 new data source channels
// (Overpass, SEC EDGAR, yfinance, OpenCorporates, PublicWWW,
// Geocoder, News Worker) and merges their results into a
// ProspectResult object.
//
// Called by the orchestrator's `forge` phase (enrichment) for
// company research, and by the `judge` phase for news intent.
//
// All channel calls are wrapped in Promise.allSettled so a
// failure in one channel never blocks the others.
// ============================================================

import type { ProspectResult } from './types';
import type { AgentAction } from './types';
import {
  ocEnrichByName,
  yfinanceEnrich,
  yfinanceSearchTicker,
  edgarEnrichCompany,
  edgarGetCikByTicker,
  newsSearchIntent,
  newsIntentToKPIs,
  geocodeForward,
  haversineDistance,
  publicWwwSearch,
  overpassSearchPlaces,
  type OcEnrichmentResult,
  type YFinanceEnrichmentResult,
  type EdgarEnrichmentResult,
  type NewsIntentResult,
} from './data-sources';

// ─── Types ───────────────────────────────────────────────────────────────

export interface ChannelEnrichmentResult {
  /** Updated prospect with merged fields from data sources */
  prospect: ProspectResult;
  /** Agent-visible actions for the UI timeline */
  steps: AgentAction[];
  /** Raw results per channel — for debugging & API exposure */
  channelResults: {
    openCorporates?: OcEnrichmentResult;
    yfinance?: YFinanceEnrichmentResult;
    edgar?: EdgarEnrichmentResult;
    news?: NewsIntentResult;
    publicWww?: { url: string; success: boolean; resultCount: number };
    overpass?: { success: boolean; placeCount: number };
    geocoder?: { success: boolean; lat?: number; lon?: number };
  };
  /** Aggregated customKpis JSON object for Lead storage */
  customKpis: Record<string, number | string | boolean | null>;
  /** Person-type leads extracted from registry (officers, directors) */
  personLeads: Array<Record<string, unknown>>;
  /** Errors collected per channel (non-fatal) */
  errors: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Detect if a company name looks like a stock ticker (1-5 uppercase letters
 * optionally followed by a suffix like '.L' or '-USD').
 */
function looksLikeTicker(name: string): boolean {
  return /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/.test(name.trim());
}

/**
 * Try to extract a ticker symbol from a company name. Handles common cases
 * like "Apple (AAPL)" or "Microsoft MSFT".
 */
function extractTicker(companyName: string): string | null {
  // Explicit ticker in parens or quotes
  const match = companyName.match(/\(([A-Z]{1,5}(?:\.[A-Z]{1,2})?)\)/);
  if (match) return match[1];

  // Trailing all-caps word
  const trailing = companyName.match(/\s([A-Z]{2,5})$/);
  if (trailing && !['LLC', 'INC', 'CORP', 'LTD', 'CO', 'PLC'].includes(trailing[1])) {
    return trailing[1];
  }

  return null;
}

// ─── Main Entry Point ────────────────────────────────────────────────────

/**
 * Enrich a prospect using all available data source channels.
 *
 * Strategy:
 *   1. Run OpenCorporates + yfinance + EDGAR + News in parallel (4 calls)
 *   2. After step 1, if we have an address, geocode it for lat/lng
 *   3. After step 1, if we have a website, optionally query PublicWWW
 *      for tech-stack fingerprints (only if website is present + 60s elapsed
 *      since last PublicWWW call)
 *   4. Merge results into the prospect object + build customKpis JSON
 *
 * @param prospect The prospect to enrich (mutated copy returned)
 * @param opts     Optional progress callback for UI updates
 */
export async function executeChannelEnrichment(
  prospect: ProspectResult,
  opts?: {
    onProgress?: (label: string, message: string, status?: 'running' | 'completed' | 'failed') => void;
    skipPublicWww?: boolean;  // PublicWWW has a 60s rate limit — caller can opt out
    skipNews?: boolean;       // News worker may be down — caller can opt out
    targetLat?: number;       // For distance-to-target KPI
    targetLon?: number;
  },
): Promise<ChannelEnrichmentResult> {
  const _opts = opts || {};
  const steps: AgentAction[] = [];
  const errors: string[] = [];
  const customKpis: Record<string, number | string | boolean | null> = {};
  const channelResults: ChannelEnrichmentResult['channelResults'] = {};
  const personLeads: Array<Record<string, unknown>> = [];

  const companyName = prospect.companyName || prospect.personName || '';
  if (!companyName) {
    return {
      prospect,
      steps,
      channelResults,
      customKpis,
      personLeads,
      errors: ['No company name to enrich'],
    };
  }

  // ── Step 1: Parallel channel queries ──────────────────────────────────
  steps.push({
    type: 'research_company',
    label: 'Multi-Source Enrichment',
    status: 'running',
    message: `Querying OpenCorporates, yfinance, SEC EDGAR, News Worker in parallel for "${companyName}"...`,
  });
  const stepIdx = steps.length - 1;
  opts?.onProgress?.('Multi-Source Enrichment', steps[stepIdx].message || '', 'running');

  // Detect ticker
  const ticker = looksLikeTicker(companyName)
    ? companyName.trim()
    : extractTicker(companyName);

  const parallelPromises: Promise<void>[] = [];

  // 1a. OpenCorporates
  parallelPromises.push(
    ocEnrichByName(companyName).then(oc => {
      channelResults.openCorporates = oc;
      if (oc.success && oc.company) {
        // Merge verified registry fields
        if (oc.company.name && !prospect.legalName) {
          prospect.legalName = oc.company.name;
        }
        if (oc.company.incorporationDate) {
          prospect.foundingYear = new Date(oc.company.incorporationDate).getFullYear().toString();
        }
        if (oc.company.registeredAddressInFull && !prospect.hqAddress) {
          prospect.hqAddress = oc.company.registeredAddressInFull;
        }
        if (oc.company.registeredAddress.locality && !prospect.city) {
          prospect.city = oc.company.registeredAddress.locality;
        }
        if (oc.company.registeredAddress.country && !prospect.country) {
          prospect.country = oc.company.registeredAddress.country;
        }
        if (oc.company.status) {
          customKpis.oc_status = oc.company.status;
          customKpis.oc_jurisdiction = oc.company.jurisdictionCode;
        }
        // Convert officers into person leads
        for (const officer of oc.officers) {
          if (!officer.endDate && /director|ceo|cfo|cto|president|officer/i.test(officer.position)) {
            personLeads.push({
              personFullName: officer.name,
              jobTitle: officer.position,
              currentCompany: oc.company.name,
              leadType: 'person',
              source: 'opencorporates',
              customKpis: JSON.stringify({
                officer_start_date: officer.startDate,
                registry_jurisdiction: oc.company.jurisdictionCode,
              }),
            });
          }
        }
        Object.assign(customKpis, oc.customKpis);
      }
    }).catch(e => { errors.push(`OpenCorporates: ${e instanceof Error ? e.message : e}`); })
  );

  // 1b. yfinance — only if we have a ticker or it's a likely public company
  if (ticker) {
    parallelPromises.push(
      yfinanceEnrich(ticker).then(yf => {
        channelResults.yfinance = yf;
        if (yf.success) {
          if (yf.quote?.longName && !prospect.description) {
            prospect.description = yf.quote.longName;
          }
          if (yf.profile?.sector) prospect.industry = yf.profile.sector;
          if (yf.profile?.fullTimeEmployees) {
            prospect.employeeCount = String(yf.profile.fullTimeEmployees);
          }
          if (yf.financials?.totalRevenue) {
            prospect.revenueEstimate = `$${Math.round(yf.financials.totalRevenue / 1e9)}B`;
          }
          if (yf.profile?.website && !prospect.website) {
            prospect.website = yf.profile.website;
          }
          Object.assign(customKpis, yf.customKpis);
        }
      }).catch(e => { errors.push(`yfinance: ${e instanceof Error ? e.message : e}`); })
    );
  } else {
    // Try to discover a ticker via Yahoo Finance search (non-blocking)
    parallelPromises.push(
      yfinanceSearchTicker(companyName).then(matches => {
        if (matches.length > 0) {
          const topMatch = matches[0];
          customKpis.yf_detected_ticker = topMatch.ticker;
          customKpis.yf_detected_exchange = topMatch.exchange;
          // Don't auto-enrich here — caller can decide to follow up
        }
      }).catch(() => { /* non-critical */ })
    );
  }

  // 1c. SEC EDGAR — try ticker first, fall back to nothing if not a US public company
  if (ticker) {
    parallelPromises.push(
      edgarEnrichCompany(ticker).then(ed => {
        channelResults.edgar = ed;
        if (ed.success) {
          if (ed.company?.sicDescription && !prospect.industry) {
            prospect.industry = ed.company.sicDescription;
          }
          if (ed.company?.addresses.business.city && !prospect.city) {
            prospect.city = ed.company.addresses.business.city;
          }
          if (ed.company?.addresses.business.stateOrCountry && !prospect.stateProvince) {
            prospect.stateProvince = ed.company.addresses.business.stateOrCountry;
          }
          Object.assign(customKpis, ed.customKpis);
        }
      }).catch(e => { errors.push(`SEC EDGAR: ${e instanceof Error ? e.message : e}`); })
    );
  }

  // 1d. News Worker — for intent signals (skip if opted out)
  if (!_opts.skipNews) {
    parallelPromises.push(
      newsSearchIntent(companyName, { daysBack: 30, maxArticles: 5 }).then(news => {
        channelResults.news = news;
        if (news.success) {
          Object.assign(customKpis, newsIntentToKPIs(news));
          // Boost intent score based on positive signals
          const positiveSignals = Object.entries(news.intentSignals)
            .filter(([k]) => !['layoffs', 'bankruptcy', 'fired', 'furlough'].includes(k))
            .reduce((sum, [, v]) => sum + v, 0);
          customKpis.news_positive_intent_signals = positiveSignals;
        }
      }).catch(e => { errors.push(`News Worker: ${e instanceof Error ? e.message : e}`); })
    );
  }

  // Await all parallel calls
  await Promise.allSettled(parallelPromises);

  steps[stepIdx] = {
    ...steps[stepIdx],
    status: 'completed',
    message: `Enrichment complete — OpenCorporates:${channelResults.openCorporates?.success ? '✓' : '✗'} ` +
             `yfinance:${channelResults.yfinance?.success ? '✓' : '✗'} ` +
             `EDGAR:${channelResults.edgar?.success ? '✓' : '✗'} ` +
             `News:${channelResults.news?.success ? '✓' : '✗'}`,
  };
  opts?.onProgress?.('Multi-Source Enrichment', steps[stepIdx].message || '', 'completed');

  // ── Step 2: Geocode address (if we have one) ─────────────────────────
  const addressParts = [
    prospect.hqAddress,
    prospect.city,
    prospect.stateProvince,
    prospect.country,
  ].filter(Boolean);
  const fullAddress = addressParts.join(', ');

  if (fullAddress && (prospect.latitude == null || prospect.longitude == null)) {
    try {
      const geoResults = await geocodeForward(fullAddress, { limit: 1 });
      if (geoResults.length > 0) {
        const geo = geoResults[0];
        prospect.latitude = geo.latitude;
        prospect.longitude = geo.longitude;
        channelResults.geocoder = { success: true, lat: geo.latitude, lon: geo.longitude };

        // Distance-to-target KPI
        if (typeof _opts.targetLat === 'number' && typeof _opts.targetLon === 'number') {
          const d = haversineDistance(geo.latitude, geo.longitude, _opts.targetLat, _opts.targetLon);
          customKpis.distance_to_target_km = Math.round(d.kilometers * 10) / 10;
          customKpis.distance_to_target_mi = Math.round(d.miles * 10) / 10;
        }

        if (geo.countryCode && !prospect.country) {
          prospect.country = geo.countryCode;
        }
      }
    } catch (e) {
      errors.push(`Geocoder: ${e instanceof Error ? e.message : e}`);
      channelResults.geocoder = { success: false };
    }
  }

  // ── Step 3: PublicWWW tech-stack discovery (if website is known) ─────
  if (!_opts.skipPublicWww && prospect.website) {
    try {
      // Extract domain from website URL
      const url = new URL(prospect.website.startsWith('http') ? prospect.website : `https://${prospect.website}`);
      const domain = url.hostname.replace(/^www\./, '');

      // Use a generic "find sites with this domain" query — this is a quick
      // way to confirm the site exists in PublicWWW's index and learn its rank.
      const pwResult = await publicWwwSearch({
        query: `"${domain}"`,
        limit: 5,
      });
      channelResults.publicWww = {
        url: prospect.website,
        success: pwResult.success,
        resultCount: pwResult.count,
      };
      if (pwResult.success && pwResult.results.length > 0) {
        customKpis.pw_global_rank = pwResult.results[0].rank;
        customKpis.pw_appearances = pwResult.count;
      }
    } catch (e) {
      errors.push(`PublicWWW: ${e instanceof Error ? e.message : e}`);
      channelResults.publicWww = { url: prospect.website, success: false, resultCount: 0 };
    }
  }

  // ── Step 4: Attach customKpis to prospect ────────────────────────────
  // Store as JSON string on the prospect for later Lead persistence.
  if (Object.keys(customKpis).length > 0) {
    prospect.customKpis = JSON.stringify(customKpis);
    prospect.dataCompleteness = Math.min(100, prospect.dataCompleteness + 10);
  }

  return {
    prospect,
    steps,
    channelResults,
    customKpis,
    personLeads,
    errors,
  };
}

/**
 * Lighter-weight news-only enrichment for the Judge phase.
 * Used to refresh intent signals at scoring time.
 */
export async function refreshNewsIntent(
  companyName: string,
): Promise<{ intent: NewsIntentResult | null; kpis: Record<string, number | string | boolean> }> {
  try {
    const intent = await newsSearchIntent(companyName, { daysBack: 14, maxArticles: 3 });
    if (!intent.success) return { intent: null, kpis: {} };
    return { intent, kpis: newsIntentToKPIs(intent) };
  } catch {
    return { intent: null, kpis: {} };
  }
}

/**
 * Discover place-based leads (POIs) within a bounding box or radius.
 * Used by the Scout agent when the user query mentions a location
 * ("find all cafes in Berlin").
 */
export async function discoverPlaces(
  query: {
    category?: string;
    subcategory?: string;
    bbox?: [number, number, number, number];
    around?: { lat: number; lon: number; radiusKm: number };
    limit?: number;
  },
): Promise<{ places: Array<Record<string, unknown>>; success: boolean; error?: string }> {
  try {
    const result = await overpassSearchPlaces(query);
    return {
      success: result.success,
      places: result.places.map(p => ({
        osmId: p.osmId,
        name: p.name,
        category: p.category,
        subcategory: p.subcategory,
        latitude: p.latitude,
        longitude: p.longitude,
        phone: p.phone,
        email: p.email,
        website: p.website,
        address: p.address,
        placeType: p.subcategory,
        leadType: 'place',
        source: 'overpass',
      })),
    };
  } catch (e) {
    return {
      success: false,
      places: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
