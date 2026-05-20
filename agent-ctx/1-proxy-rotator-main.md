# Task 1: Integrate TeaByte/proxy-scraper into the codebase for proxy rotation

## Agent: Main Agent
## Date: 2026-05-20

## Work Log

### 1. Created `/home/z/my-project/src/lib/proxy-rotator.ts`
- Built a comprehensive TypeScript-native proxy scraper/rotator inspired by TeaByte/proxy-scraper
- **Types**: `ProxyEntry`, `FetchViaProxyResult`, `ProxyRotatorStats`
- **ProxyRotator class** with the following methods:
  - `start()` — Initialize with periodic refresh (10-minute interval)
  - `stop()` — Stop periodic refresh
  - `refreshProxies()` — Fetch from all sources, deduplicate, merge with existing pool
  - `validateProxy()` — Test a proxy by making a request to httpbin.org/ip
  - `getNextProxy()` — Round-robin rotation with skip on failed proxies
  - `markProxyFailed()` — Increment fail count, remove if > 3 failures
  - `markProxySuccess()` — Reset fail count, update response time
  - `fetchWithProxy()` — High-level: fetch URL through rotating proxy with auto-retry
  - `getStats()` — Return pool statistics
  - `triggerRefresh()` — Force a proxy pool refresh
- **10 proxy sources** matching TeaByte/proxy-scraper:
  - ProxyScrape API (HTTP/SOCKS4/SOCKS5)
  - TheSpeedX/PROXY-List (HTTP/SOCKS4/SOCKS5)
  - clarketm/proxy-list (HTTP)
  - hookzof/socks5_list (SOCKS5)
  - monosans/proxy-list (HTTP/SOCKS5)
- Uses `curl` via `child_process.exec` for proxied requests (no npm packages needed)
- Lazy validation: proxies are validated on first use, not during refresh
- Fail tracking: proxies that fail 3 times are removed from the pool
- Auto-recovery: if all proxies exceed max fails, fail counts reset
- Exported `proxyRotator` singleton instance
- Exported `USE_PROXY_ROTATION` toggle (env var `USE_PROXY_ROTATION`, defaults to true)

### 2. Wired proxy rotation into `/home/z/my-project/src/lib/agent-reach-bridge.ts`
- Added import: `proxyRotator`, `USE_PROXY_ROTATION` from `@/lib/proxy-rotator`
- **webRead()**: Added optional 3rd parameter `options?: { useProxy?: boolean }`
  - When `useProxy=true` and `USE_PROXY_ROTATION` is enabled, uses `proxyRotator.fetchWithProxy()` instead of direct `fetch()`
  - Fully backward compatible — existing callers work unchanged
- **exaSearch()**: In the Jina Search fallback (Method 3), added proxy rotation support
  - When `USE_PROXY_ROTATION` is true, first tries `proxyRotator.fetchWithProxy()` for Jina Search
  - Falls back to direct fetch if proxy fails (graceful degradation)
  - No changes to z-ai-web-dev-sdk calls (can't proxy SDK internals)
  - No changes to mcporter calls (CLI-based)

### 3. Created `/home/z/my-project/src/app/api/opensrc/route.ts`
- **GET /api/opensrc** — Returns open-source integrations status:
  - `proxy-scraper` (TeaByte/proxy-scraper) — shows proxyCount, aliveProxies, deadProxies, byProtocol, lastRefresh
  - `crawl4ai` (unclecode/crawl4ai) — available
  - `py-lead-generation` (Madi-S/Lead-Generation) — available
  - `agent-reach-toolkit` (local) — active
- **POST /api/opensrc** — Triggers actions:
  - `{ action: "refresh-proxies" }` — Refreshes proxy pool, returns `{ success, proxyCount, sources }`

### 4. Testing Results
- Lint: No errors in new/modified files
- GET /api/opensrc returns 200 with all 4 integrations
- POST /api/opensrc with `refresh-proxies` successfully fetched **19,172 proxies** from all 10 sources
  - Protocol breakdown: 2,982 HTTP, 2,460 SOCKS4, 13,730 SOCKS5
  - All 10 sources returned data successfully
- Server compiles and runs without errors

## Files Created
- `/home/z/my-project/src/lib/proxy-rotator.ts` (new, ~340 lines)
- `/home/z/my-project/src/app/api/opensrc/route.ts` (new, ~80 lines)

## Files Modified
- `/home/z/my-project/src/lib/agent-reach-bridge.ts` (3 edits: import, webRead signature + proxy logic, exaSearch Jina fallback proxy logic)
