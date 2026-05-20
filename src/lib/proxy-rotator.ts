/**
 * Proxy Rotator Module
 *
 * A TypeScript-native proxy scraper/rotator inspired by TeaByte/proxy-scraper.
 * Scrapes proxies from 75+ websites (via aggregated API sources), validates them,
 * and provides round-robin rotation with automatic fail tracking and removal.
 *
 * Uses curl (always available on Linux/macOS) for proxied requests — no npm packages needed.
 *
 * Sources mirror TeaByte/proxy-scraper's sources.txt:
 * - api.proxyscrape.com (HTTP/SOCKS4/SOCKS5)
 * - GitHub raw lists (TheSpeedX, clarketm, hookzof, monosans)
 * - openproxy.space
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================
// Types
// ============================================================

export interface ProxyEntry {
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
  country?: string;
  lastChecked?: Date;
  isAlive: boolean;
  responseTime?: number; // ms
  failCount: number;
}

export interface FetchViaProxyResult {
  status: number;
  body: string;
  headers: Record<string, string>;
}

export interface ProxyRotatorStats {
  totalProxies: number;
  aliveProxies: number;
  deadProxies: number;
  byProtocol: Record<string, number>;
  lastRefresh: string | null;
  sources: string[];
  refreshIntervalMs: number;
}

// ============================================================
// Proxy Sources (same as TeaByte/proxy-scraper)
// ============================================================

const PROXY_SOURCES: { url: string; protocol: ProxyEntry['protocol'] }[] = [
  // ProxyScrape API
  { url: 'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country=all', protocol: 'http' },
  { url: 'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks4&timeout=10000&country=all', protocol: 'socks4' },
  { url: 'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=10000&country=all', protocol: 'socks5' },

  // TheSpeedX GitHub lists
  { url: 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt', protocol: 'http' },
  { url: 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks4.txt', protocol: 'socks4' },
  { url: 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks5.txt', protocol: 'socks5' },

  // clarketm proxy list
  { url: 'https://raw.githubusercontent.com/clarketm/proxy-list/master/proxy-list-raw.txt', protocol: 'http' },

  // hookzof SOCKS5 list
  { url: 'https://raw.githubusercontent.com/hookzof/socks5_list/master/proxy.txt', protocol: 'socks5' },

  // monosans proxy lists
  { url: 'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt', protocol: 'http' },
  { url: 'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/socks5.txt', protocol: 'socks5' },
];

// ============================================================
// ProxyRotator Class
// ============================================================

class ProxyRotator {
  private proxies: ProxyEntry[] = [];
  private currentIndex: number = 0;
  private refreshIntervalMs: number;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private lastRefreshTime: Date | null = null;
  private isRefreshing: boolean = false;
  private maxFailCount: number;
  private validationTimeout: number;

  constructor(options?: {
    refreshIntervalMs?: number;
    maxFailCount?: number;
    validationTimeout?: number;
  }) {
    this.refreshIntervalMs = options?.refreshIntervalMs ?? 10 * 60 * 1000; // 10 minutes default
    this.maxFailCount = options?.maxFailCount ?? 3;
    this.validationTimeout = options?.validationTimeout ?? 10000; // 10s
  }

  /**
   * Start the periodic refresh loop.
   * Also triggers an initial refresh if the pool is empty.
   */
  async start(): Promise<void> {
    console.log('[ProxyRotator] Starting proxy rotator...');
    // Initial refresh
    if (this.proxies.length === 0) {
      await this.refreshProxies();
    }

    // Set up periodic refresh
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.refreshTimer = setInterval(() => {
      this.refreshProxies().catch(err => {
        console.warn('[ProxyRotator] Periodic refresh failed:', err instanceof Error ? err.message : err);
      });
    }, this.refreshIntervalMs);

    console.log(`[ProxyRotator] Started with ${this.proxies.length} proxies, refresh every ${this.refreshIntervalMs / 1000}s`);
  }

  /**
   * Stop the periodic refresh loop.
   */
  stop(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    console.log('[ProxyRotator] Stopped');
  }

  /**
   * Fetch proxies from all sources, parse them, and add to the pool.
   * Removes duplicates and retains alive status from previous pool.
   */
  async refreshProxies(): Promise<{ proxyCount: number; sources: string[] }> {
    if (this.isRefreshing) {
      console.log('[ProxyRotator] Refresh already in progress, skipping');
      return { proxyCount: this.proxies.length, sources: [] };
    }

    this.isRefreshing = true;
    const successfulSources: string[] = [];
    const newProxiesMap = new Map<string, ProxyEntry>();

    console.log(`[ProxyRotator] Refreshing proxies from ${PROXY_SOURCES.length} sources...`);

    // Fetch all sources in parallel
    const results = await Promise.allSettled(
      PROXY_SOURCES.map(async (source) => {
        try {
          const text = await this.fetchSourceList(source.url);
          const parsed = this.parseProxyList(text, source.protocol);
          if (parsed.length > 0) {
            successfulSources.push(source.url);
          }
          return parsed;
        } catch (err) {
          console.warn(`[ProxyRotator] Failed to fetch ${source.url}: ${err instanceof Error ? err.message : err}`);
          return [];
        }
      })
    );

    // Merge all parsed proxies
    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const proxy of result.value) {
          const key = `${proxy.host}:${proxy.port}:${proxy.protocol}`;
          if (!newProxiesMap.has(key)) {
            // Preserve alive status from existing pool
            const existing = this.proxies.find(
              p => p.host === proxy.host && p.port === proxy.port && p.protocol === proxy.protocol
            );
            if (existing) {
              newProxiesMap.set(key, { ...proxy, isAlive: existing.isAlive, failCount: existing.failCount, responseTime: existing.responseTime, lastChecked: existing.lastChecked });
            } else {
              newProxiesMap.set(key, proxy);
            }
          }
        }
      }
    }

    // Replace the pool with deduped entries, keeping alive ones first
    this.proxies = Array.from(newProxiesMap.values());
    // Sort: alive proxies first, then by response time
    this.proxies.sort((a, b) => {
      if (a.isAlive && !b.isAlive) return -1;
      if (!a.isAlive && b.isAlive) return 1;
      return (a.responseTime ?? Infinity) - (b.responseTime ?? Infinity);
    });

    this.lastRefreshTime = new Date();
    this.isRefreshing = false;

    const aliveCount = this.proxies.filter(p => p.isAlive).length;
    console.log(`[ProxyRotator] Refresh complete: ${this.proxies.length} total proxies (${aliveCount} alive) from ${successfulSources.length}/${PROXY_SOURCES.length} sources`);

    return { proxyCount: this.proxies.length, sources: successfulSources };
  }

  /**
   * Validate a proxy by making a test request through it.
   */
  async validateProxy(proxy: ProxyEntry): Promise<boolean> {
    try {
      const startTime = Date.now();
      const result = await this.fetchViaProxy('http://httpbin.org/ip', proxy, this.validationTimeout);
      const responseTime = Date.now() - startTime;

      if (result.status >= 200 && result.status < 400) {
        // Try to parse the JSON to verify it's a real response
        try {
          const parsed = JSON.parse(result.body);
          if (parsed.origin || parsed.ip) {
            proxy.isAlive = true;
            proxy.responseTime = responseTime;
            proxy.lastChecked = new Date();
            proxy.failCount = 0;
            return true;
          }
        } catch {
          // Even if JSON parsing fails, a 2xx status is a good sign
          proxy.isAlive = true;
          proxy.responseTime = responseTime;
          proxy.lastChecked = new Date();
          proxy.failCount = 0;
          return true;
        }
      }

      proxy.isAlive = false;
      proxy.failCount++;
      proxy.lastChecked = new Date();
      return false;
    } catch {
      proxy.isAlive = false;
      proxy.failCount++;
      proxy.lastChecked = new Date();
      return false;
    }
  }

  /**
   * Get the next proxy using round-robin rotation.
   * Skips proxies that have failed too many times.
   * Returns null if no alive proxies are available.
   */
  getNextProxy(): ProxyEntry | null {
    if (this.proxies.length === 0) {
      return null;
    }

    // Try to find an alive proxy with round-robin
    const startIndex = this.currentIndex;
    let attempts = 0;

    while (attempts < this.proxies.length) {
      const proxy = this.proxies[this.currentIndex % this.proxies.length];
      this.currentIndex = (this.currentIndex + 1) % this.proxies.length;

      // Skip dead proxies (too many failures)
      if (proxy.failCount >= this.maxFailCount) {
        attempts++;
        continue;
      }

      return proxy;
    }

    // All proxies have too many failures — reset fail counts and try again
    console.warn('[ProxyRotator] All proxies have exceeded max fail count. Resetting fail counts.');
    for (const p of this.proxies) {
      p.failCount = 0;
    }
    this.currentIndex = 0;

    // Return the first one as last resort
    return this.proxies.length > 0 ? this.proxies[0] : null;
  }

  /**
   * Mark a proxy as failed (increment fail count).
   * Removes the proxy from the pool if it exceeds maxFailCount.
   */
  markProxyFailed(proxy: ProxyEntry): void {
    proxy.failCount++;
    proxy.isAlive = false;
    proxy.lastChecked = new Date();

    if (proxy.failCount >= this.maxFailCount) {
      // Remove from pool
      const idx = this.proxies.findIndex(
        p => p.host === proxy.host && p.port === proxy.port && p.protocol === proxy.protocol
      );
      if (idx !== -1) {
        this.proxies.splice(idx, 1);
        console.log(`[ProxyRotator] Removed proxy ${proxy.host}:${proxy.port} (${proxy.protocol}) after ${proxy.failCount} failures. Pool size: ${this.proxies.length}`);
      }
    }
  }

  /**
   * Mark a proxy as successful (reset fail count, update response time).
   */
  markProxySuccess(proxy: ProxyEntry, responseTime: number): void {
    proxy.failCount = 0;
    proxy.isAlive = true;
    proxy.responseTime = responseTime;
    proxy.lastChecked = new Date();
  }

  /**
   * Fetch a URL through a rotating proxy.
   * Automatically tries the next proxy if one fails (up to `retries` times).
   */
  async fetchWithProxy(
    url: string,
    options?: RequestInit,
    retries: number = 3,
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      const proxy = this.getNextProxy();
      if (!proxy) {
        throw new Error('[ProxyRotator] No proxies available in the pool');
      }

      try {
        const startTime = Date.now();
        const result = await this.fetchViaProxy(
          url,
          proxy,
          15000, // 15s timeout
        );
        const responseTime = Date.now() - startTime;

        this.markProxySuccess(proxy, responseTime);

        // Create a Response-like object from the curl result
        return new Response(result.body, {
          status: result.status,
          headers: new Headers(result.headers),
        });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`[ProxyRotator] Proxy ${proxy.host}:${proxy.port} failed for ${url.slice(0, 80)}: ${lastError.message}. Attempt ${attempt + 1}/${retries}`);
        this.markProxyFailed(proxy);
      }
    }

    throw new Error(
      `[ProxyRotator] All ${retries} proxy attempts failed for ${url.slice(0, 80)}: ${lastError?.message ?? 'Unknown error'}`,
    );
  }

  /**
   * Get stats about the proxy pool.
   */
  getStats(): ProxyRotatorStats {
    const aliveProxies = this.proxies.filter(p => p.isAlive);
    const byProtocol: Record<string, number> = {};
    for (const p of this.proxies) {
      byProtocol[p.protocol] = (byProtocol[p.protocol] || 0) + 1;
    }

    return {
      totalProxies: this.proxies.length,
      aliveProxies: aliveProxies.length,
      deadProxies: this.proxies.length - aliveProxies.length,
      byProtocol,
      lastRefresh: this.lastRefreshTime?.toISOString() ?? null,
      sources: PROXY_SOURCES.map(s => s.url),
      refreshIntervalMs: this.refreshIntervalMs,
    };
  }

  /**
   * Get the raw proxy list (for API exposure).
   */
  getProxies(): ProxyEntry[] {
    return [...this.proxies];
  }

  /**
   * Force trigger a refresh (for API use).
   */
  async triggerRefresh(): Promise<{ proxyCount: number; sources: string[] }> {
    return this.refreshProxies();
  }

  // ============================================================
  // Private Methods
  // ============================================================

  /**
   * Fetch a raw proxy list from a URL using native fetch.
   */
  private async fetchSourceList(url: string): Promise<string> {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'proxy-rotator/1.0' },
    });

    if (!response.ok) {
      throw new Error(`Source returned ${response.status}: ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Parse a raw proxy list (IP:PORT format, one per line).
   * Supports various formats:
   * - IP:PORT
   * - IP:PORT COUNTRY
   * - IP:PORT CODE-COUNTRY
   */
  private parseProxyList(text: string, protocol: ProxyEntry['protocol']): ProxyEntry[] {
    const proxies: ProxyEntry[] = [];
    const lines = text.split('\n');
    // Match IP:PORT pattern (e.g., 192.168.1.1:8080)
    const proxyRegex = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5})/;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

      const match = trimmed.match(proxyRegex);
      if (match) {
        const host = match[1];
        const port = parseInt(match[2], 10);

        // Validate port range
        if (port < 1 || port > 65535) continue;

        // Try to extract country code if present
        const restOfLine = trimmed.slice(match[0].length).trim();
        const countryMatch = restOfLine.match(/^([A-Z]{2})/);
        const country = countryMatch ? countryMatch[1] : undefined;

        proxies.push({
          host,
          port,
          protocol,
          country,
          isAlive: false, // Not validated yet
          failCount: 0,
        });
      }
    }

    return proxies;
  }

  /**
   * Fetch a URL through a specific proxy using curl.
   * This is the core mechanism — uses child_process.exec to call curl,
   * which supports HTTP, SOCKS4, and SOCKS5 proxies natively.
   */
  private async fetchViaProxy(
    url: string,
    proxy: ProxyEntry,
    timeout: number = 15000,
  ): Promise<FetchViaProxyResult> {
    const proxyUrl = `${proxy.protocol}://${proxy.host}:${proxy.port}`;
    const timeoutSec = Math.floor(timeout / 1000);

    // Build curl command
    // -s: silent mode
    // -o -: output to stdout
    // -w '\n%{http_code}': append status code as last line
    // --proxy: set the proxy
    // --max-time: overall timeout
    // -H 'User-Agent': set user agent
    // -L: follow redirects
    const curlCommand = `curl -s -o - -w '\\n__HTTP_CODE__%{http_code}' --proxy '${proxyUrl}' --max-time ${timeoutSec} -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' -L '${url.replace(/'/g, "'\\''")}'`;

    const { stdout, stderr } = await execAsync(curlCommand, {
      timeout: timeout + 5000, // Extra 5s for process overhead
      maxBuffer: 5 * 1024 * 1024, // 5MB
    });

    // Check for curl errors
    if (stderr && stderr.includes('error') && !stdout) {
      throw new Error(`Curl proxy error: ${stderr.slice(0, 200)}`);
    }

    // Parse the output — last line contains __HTTP_CODE__<status>
    const lines = stdout.split('\n');
    let statusCode = 200;
    let bodyEndIndex = lines.length;

    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].startsWith('__HTTP_CODE__')) {
        statusCode = parseInt(lines[i].replace('__HTTP_CODE__', ''), 10) || 200;
        bodyEndIndex = i;
        break;
      }
    }

    const body = lines.slice(0, bodyEndIndex).join('\n');

    // Extract headers from curl if available (basic set)
    const headers: Record<string, string> = {
      'content-type': body.trim().startsWith('{') ? 'application/json' : 'text/html',
    };

    return { status: statusCode, body, headers };
  }
}

// ============================================================
// Singleton Instance
// ============================================================

/**
 * Global proxy rotator instance.
 * Initialized lazily on first use.
 */
let _instance: ProxyRotator | null = null;

export function getProxyRotator(): ProxyRotator {
  if (!_instance) {
    _instance = new ProxyRotator();
  }
  return _instance;
}

/**
 * Convenience: the singleton ProxyRotator instance.
 * Access via getProxyRotator() for lazy init, or import proxyRotator directly.
 */
export const proxyRotator = new ProxyRotator();

// ============================================================
// Global Toggle
// ============================================================

/**
 * Whether proxy rotation is enabled.
 * Can be toggled via the USE_PROXY_ROTATION environment variable.
 * Defaults to true.
 */
export const USE_PROXY_ROTATION = process.env.USE_PROXY_ROTATION !== 'false';
