import type { DocContent } from './types';

export const apiReferenceDocs: DocContent[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // 1. Authentication & API Keys
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'api-auth',
    title: 'Authentication & API Keys',
    description: 'Authenticate every LeadReach API request with a scoped Bearer token. Create, rotate, and revoke API keys for live and sandbox environments.',
    category: 'API Reference',
    readTime: '7 min read',
    lastUpdated: '2024-11-15',
    blocks: [
      {
        type: 'paragraph',
        content: 'Every request to the LeadReach REST API must be authenticated with a Bearer token issued from the API Keys console inside your workspace settings. Tokens follow the format lr_live_xxx for production traffic and lr_test_xxx for sandbox traffic against the staging base URL https://api.staging.leadreach.ai/v1/. Bearer tokens are long-lived credentials bound to a single workspace and a configurable scope set, transmitted on every request using the standard Authorization header. Keys do not expire automatically, but they must be rotated at least every 90 days to comply with the LeadReach security baseline and SOC 2 Type II control CC6.1.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Authentication Model',
      },
      {
        type: 'paragraph',
        content: 'LeadReach uses the OAuth 2.0 Bearer Token scheme (RFC 6750) for all API authentication. The token is transmitted via the Authorization header using the literal prefix "Bearer" followed by a single space and the API key value. No HMAC signing of request bodies is required for REST endpoints, and there is no challenge-response handshake. Tokens are stateless on the server side, meaning revocation may take up to 60 seconds to propagate across all edge nodes due to the global cache layer in front of the API gateway. Requests with missing, malformed, or revoked tokens receive a 401 Unauthorized response with the error code authentication_required.',
      },
      {
        type: 'paragraph',
        content: 'All API keys are scoped to a specific workspace. A workspace represents a single tenant boundary within LeadReach and isolates leads, campaigns, agents, billing, and audit logs. Keys cannot be used to access resources outside of their owning workspace, and cross-workspace requests return 403 Forbidden with the error code cross_tenant_forbidden. If you operate multiple workspaces for different business units, generate separate keys per workspace and store them in distinct secret manager entries to avoid accidental cross-environment leakage.',
      },
      {
        type: 'code',
        language: 'bash',
        caption: 'Authenticated request with Bearer token',
        code: `curl https://api.leadreach.ai/v1/leads?limit=5 \\
  -H "Authorization: Bearer lr_live_4f9c2a8e7b1d6034ab12cd56ef9087ab" \\
  -H "Content-Type: application/json" \\
  -H "X-Request-Id: req_8f3a2b1c9d4e7f06"`,
      },
      {
        type: 'paragraph',
        content: 'When the token is valid and the requested scopes are sufficient, the API responds with 2xx status codes and the requested resource. When the token is valid but lacks the required scope, the API returns 403 Forbidden with error code insufficient_scope. The response body includes a list of missing scopes in the details.scopes_required field so that you can programmatically identify which scopes need to be added to the key before retrying the request.',
      },
      {
        type: 'code',
        language: 'json',
        caption: 'Error response for a missing scope',
        code: `{
  "error": {
    "code": "insufficient_scope",
    "message": "The provided token does not have the required scopes for this operation.",
    "details": {
      "scopes_required": ["leads:write"],
      "scopes_present": ["leads:read"],
      "request_id": "req_8f3a2b1c9d4e7f06"
    }
  }
}`,
      },
      {
        type: 'heading',
        level: 2,
        content: 'Live vs Test Environments',
      },
      {
        type: 'paragraph',
        content: 'LeadReach exposes two physically separated environments. The live environment at https://api.leadreach.ai/v1/ processes production traffic and counts against your billing plan quotas. The sandbox environment at https://api.staging.leadreach.ai/v1/ is fully isolated and seeded with synthetic test data, but it shares the same API surface, schema, and rate limits as production. Sandbox keys (lr_test_xxx) cannot be used against the live endpoint, and live keys (lr_live_xxx) cannot be used against the sandbox endpoint; both cases return 401 with environment_mismatch.',
      },
      {
        type: 'paragraph',
        content: 'The sandbox environment is reset every Sunday at 03:00 UTC. All leads, campaigns, webhooks, and event history are wiped and replaced with a fresh synthetic dataset. If you need to retain test data across resets, export it via the bulk export endpoint before the scheduled wipe window. The sandbox is intended for integration testing, library development, and onboarding new engineers; it is not rated for load testing or benchmarking.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'API Key Scopes',
      },
      {
        type: 'paragraph',
        content: 'Each API key is provisioned with a fixed set of scopes that determine which endpoints it can call. Scopes are granular read/write pairs per resource type. When creating a key in the dashboard, select only the minimum scope set required for the calling application to follow the principle of least privilege. Scopes are immutable once a key is created; to change scopes, revoke the existing key and provision a new one.',
      },
      {
        type: 'table',
        caption: 'Available API key scopes',
        headers: ['Scope', 'Resource', 'Access Level', 'Example Endpoints'],
        rows: [
          ['leads:read', 'Leads', 'Read-only', 'GET /v1/leads, GET /v1/leads/{id}'],
          ['leads:write', 'Leads', 'Read-write', 'POST /v1/leads, PATCH /v1/leads/{id}, POST /v1/leads/bulk'],
          ['campaigns:read', 'Campaigns', 'Read-only', 'GET /v1/campaigns, GET /v1/campaigns/{id}/stats'],
          ['campaigns:write', 'Campaigns', 'Read-write', 'POST /v1/campaigns, POST /v1/campaigns/{id}/start'],
          ['agents:read', 'AI Agents', 'Read-only', 'GET /v1/agents, GET /v1/agents/{id}/runs'],
          ['agents:write', 'AI Agents', 'Read-write', 'POST /v1/agents/{id}/invoke, PATCH /v1/agents/{id}'],
          ['webhooks:manage', 'Webhooks', 'Admin', 'POST /v1/webhooks, DELETE /v1/webhooks/{id}'],
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'Key Lifecycle & Rotation',
      },
      {
        type: 'paragraph',
        content: 'Keys do not have an automatic expiry, but LeadReach enforces a 90-day rotation policy at the workspace level. The dashboard surfaces a "Rotation Due" badge on any key older than 80 days, and the management API returns a rotation_due_at timestamp on each key object. Rotation is a non-disruptive operation: provision a new key with the same scopes, deploy it to your services, verify traffic is flowing on the new key, and then revoke the old key. Both keys remain valid simultaneously during the transition window, which typically lasts 24 to 72 hours.',
      },
      {
        type: 'steps',
        items: [
          'Open the API Keys console under Workspace Settings and click "Create Key".',
          'Name the key with a descriptive label such as "billing-service-prod" so that audit logs are self-documenting.',
          'Select the minimum required scopes; defaults to read-only across all resources.',
          'Choose the environment (live or sandbox); this cannot be changed after creation.',
          'Copy the displayed token immediately. The full token value is only shown once and is never retrievable afterward.',
          'Store the token in your secret manager (AWS Secrets Manager, HashiCorp Vault, Doppler, or equivalent) under a workspace-namespaced path.',
          'Deploy the key to your services, monitor error rates for 30 minutes, and only then revoke the previous key.',
        ],
      },
      {
        type: 'paragraph',
        content: 'Revocation is immediate at the API gateway level but can take up to 60 seconds to propagate to all read replicas globally. During this window, requests using the revoked key may still succeed against edge caches. For security incidents requiring immediate total revocation, use the "Revoke All Keys" emergency action in the dashboard, which invalidates every key in the workspace within 5 seconds and triggers an alert to the workspace owner and security contact.',
      },
      {
        type: 'callout',
        variant: 'warning',
        content: 'Never embed API keys in client-side code, mobile applications, or browser bundles. Live keys (lr_live_xxx) issued to public-facing clients will be treated as a security incident and the workspace may be suspended. Use server-side proxies or short-lived OAuth exchange tokens for any client-facing integration.',
      },
      {
        type: 'list',
        items: [
          'Rotate keys at least every 90 days; the dashboard and API surface rotation_due_at for visibility.',
          'Use distinct keys per environment and per service; never reuse a single key across production, staging, and CI.',
          'Grant only the minimum scopes required; new services should start with read-only scopes and escalate only when needed.',
          'Tag every key with a service label so audit logs and abuse detection can correlate traffic to a calling service.',
          'Monitor key usage via GET /v1/api_keys/{id}/usage; unexpected spikes or unfamiliar geo patterns warrant immediate rotation.',
          'Never log the full token value; mask it as lr_live_xxx...last4 in application logs.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'Request Identification',
      },
      {
        type: 'paragraph',
        content: 'Every authenticated request should include an X-Request-Id header containing a client-generated UUIDv4. The API gateway echoes this value back in the response headers and embeds it in all log entries, audit records, and webhook delivery metadata for the request. When X-Request-Id is omitted, the gateway generates one but cross-system tracing becomes unreliable. For retries of idempotent operations, send the same X-Request-Id so support engineers can collapse the requests into a single logical transaction during incident triage.',
      },
      {
        type: 'table',
        caption: 'Standard request headers',
        headers: ['Header', 'Required', 'Format', 'Description'],
        rows: [
          ['Authorization', 'Yes', 'Bearer lr_live_xxx', 'Workspace-scoped Bearer token.'],
          ['Content-Type', 'Yes (write)', 'application/json', 'Required for any request with a JSON body.'],
          ['X-Request-Id', 'Recommended', 'UUIDv4 string', 'Client-generated request identifier for tracing.'],
          ['Idempotency-Key', 'Optional', 'String, max 255 chars', 'Required for safe retries of POST /v1/leads and POST /v1/campaigns.'],
          ['LeadReach-Version', 'Optional', 'YYYY-MM-DD', 'Pins the API version; defaults to the workspace default version.'],
        ],
      },
      {
        type: 'paragraph',
        content: 'API versioning is date-pinned. The current GA version is 2024-11-15 and is the default for all new workspaces. Breaking changes are released under new version dates, and the previous version remains supported for at least 12 months after the new version becomes GA. Clients can pin to a specific version by sending the LeadReach-Version header on every request, or by setting the workspace default version in the dashboard. Version pinning is recommended for production integrations to ensure stable behavior across releases.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Service Account Keys & Automation',
      },
      {
        type: 'paragraph',
        content: 'Service accounts are API keys provisioned specifically for automated workloads such as ETL pipelines, CI/CD workflows, scheduled data syncs, and integration platforms. Unlike human-issued keys, service account keys are tagged with a service_label that surfaces in audit logs and is used by LeadReach anomaly detection to baseline expected traffic patterns. The dashboard surfaces service account keys in a separate tab under API Keys > Service Accounts, with the ability to filter by label, last-used timestamp, and associated integration. Service account keys should always be provisioned with the minimum scope set required for the workload; for example, a nightly CRM sync job typically requires only leads:read and leads:write, not campaigns:write or webhooks:manage. Provisioning a service account key with broader scopes than necessary increases the blast radius of a credential leak and complicates incident response.',
      },
      {
        type: 'paragraph',
        content: 'Workloads that run on schedules should always include a startup health check that calls GET /v1/ping with the provisioned key to verify validity before beginning the workload. A failed ping is a strong signal that the key has been revoked, the workspace has been suspended, or the LeadReach API is experiencing an outage; in all three cases, the workload should abort rather than emit noisy 401 errors that may trigger false-positive alerts. For workloads that run for more than one hour, include a periodic health check every 30 minutes to detect mid-run key revocation. The X-Request-Id header should be set to a deterministic value derived from the workload run id so that all requests in a single run can be collapsed during incident triage. Service account keys older than 80 days should be rotated during a planned maintenance window using the dual-key rotation pattern described earlier in this document.',
      },
      {
        type: 'list',
        items: [
          'Tag every service account key with a service label such as nightly-crm-sync for audit clarity.',
          'Provision only the minimum scopes required; escalate only when the workload explicitly needs more.',
          'Implement a startup health check via GET /v1/ping before beginning any scheduled workload.',
          'Use deterministic X-Request-Id values derived from the workload run id for end-to-end tracing.',
          'Monitor key usage via GET /v1/api_keys/{id}/usage; unexpected spikes warrant immediate rotation.',
          'Rotate service account keys at least every 90 days using the dual-key rotation pattern.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'Audit Log Integration',
      },
      {
        type: 'paragraph',
        content: 'LeadReach audit logs retain every authentication event for 7 years per the SOC 2 retention policy. Each event captures the calling API key id, the request IP, the user agent, the requested scope set, the response status code, and the X-Request-Id header value for end-to-end tracing. Audit events are accessible via the GET /v1/audit_logs endpoint with the workspace_admin scope, and are typically consumed by SIEM integrations such as Splunk, Sumo Logic, or Datadog for compliance evidence collection. The audit endpoint supports filtering by API key id, event type, and time window, with cursor-based pagination for large result sets. For workspaces subject to additional regulatory requirements (HIPAA, PCI DSS, FedRAMP), audit logs can be streamed to a customer-owned S3 bucket via the audit log export integration, which pushes events in JSON Lines format every 60 seconds with ed25519 signatures for tamper evidence. The dashboard surfaces an audit log retention widget under Workspace Settings > Compliance, showing the current retention window, the size of the retained log, and the date of the oldest event still available for query.',
      },
      {
        type: 'divider',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Rate Limits & Quotas
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'api-limits',
    title: 'Rate Limits & Quotas',
    description: 'Understand rate limit tiers, response headers, burst allowances, and how to handle 429 responses with exponential backoff.',
    category: 'API Reference',
    readTime: '6 min read',
    lastUpdated: '2024-11-15',
    blocks: [
      {
        type: 'paragraph',
        content: 'LeadReach enforces per-workspace rate limits on every API endpoint to protect platform stability and ensure fair resource allocation across tenants. Limits are expressed in requests per minute (rpm) and are applied independently to read and write traffic within each workspace. When a workspace exceeds its limit, subsequent requests return 429 Too Many Requests with a Retry-After header indicating the number of seconds until the quota resets. The limit tier is determined by the workspace plan and can be upgraded at any time from the billing console.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Rate Limit Tiers',
      },
      {
        type: 'paragraph',
        content: 'Each workspace is assigned to one of three tiers: Starter, Professional, or Enterprise. The tier determines the sustained requests-per-minute allowance and the burst multiplier applied to short traffic spikes. Burst allowance is implemented as a token bucket where the bucket capacity equals 2x the sustained rpm and refills continuously at the sustained rate. This means a workspace can briefly sustain up to twice its nominal rpm for periods under 30 seconds without receiving 429 responses, but sustained traffic above the rpm will eventually exhaust the bucket and trigger throttling.',
      },
      {
        type: 'table',
        caption: 'Rate limit tiers and burst allowance',
        headers: ['Plan Tier', 'Sustained RPM', 'Burst Capacity', 'Webhook Delivery', 'Bulk Endpoint Batch'],
        rows: [
          ['Starter', '100 rpm', '200 rpm burst', 'Up to 1,000 deliveries/min', '50 leads per request'],
          ['Professional', '500 rpm', '1,000 rpm burst', 'Up to 5,000 deliveries/min', '50 leads per request'],
          ['Enterprise', '2,000 rpm', '4,000 rpm burst', 'Up to 20,000 deliveries/min', '50 leads per request (custom) '],
        ],
      },
      {
        type: 'paragraph',
        content: 'Rate limits are applied uniformly across all endpoints within a workspace, but write operations (POST, PATCH, DELETE) consume 5x the budget of read operations (GET) due to higher database load. For example, a Professional workspace with 500 sustained rpm can issue up to 100 write requests or 500 read requests per minute, or any linear combination thereof. The bulk lead creation endpoint POST /v1/leads/bulk counts as a single request against the rate limit regardless of batch size, so it is strongly preferred over individual POST /v1/leads calls for high-volume ingestion.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Rate Limit Headers',
      },
      {
        type: 'paragraph',
        content: 'Every API response includes three rate limit headers that allow clients to actively manage their consumption and implement client-side throttling. These headers are present on all 2xx, 4xx, and 5xx responses so that you can monitor your budget even when requests fail. The headers reflect the state of the workspace as observed by the API gateway at the moment the response was generated, and they are updated atomically as part of the response cycle.',
      },
      {
        type: 'table',
        caption: 'Rate limit response headers',
        headers: ['Header', 'Type', 'Description'],
        rows: [
          ['X-RateLimit-Limit', 'integer', 'Sustained rpm allowance for the current tier.'],
          ['X-RateLimit-Remaining', 'integer', 'Remaining requests in the current minute window.'],
          ['X-RateLimit-Reset', 'integer (epoch)', 'Unix timestamp at which the current window resets.'],
          ['X-RateLimit-Burst-Remaining', 'integer', 'Remaining burst budget; only present when burst is being consumed.'],
          ['Retry-After', 'integer (seconds)', 'Present only on 429 responses; seconds until retry is permitted.'],
        ],
      },
      {
        type: 'paragraph',
        content: 'When X-RateLimit-Remaining drops below 10% of the limit, the response also includes a X-RateLimit-Warning header with the value approaching_limit. This is purely informational and does not affect request handling, but it can be used as a signal to start shedding non-critical traffic. Clients that respect the warning header proactively rarely encounter 429 responses in practice.',
      },
      {
        type: 'code',
        language: 'bash',
        caption: 'Inspect rate limit headers from a curl response',
        code: `curl -i https://api.leadreach.ai/v1/leads?limit=10 \\
  -H "Authorization: Bearer lr_live_4f9c2a8e7b1d6034ab12cd56ef9087ab"

HTTP/2 200
content-type: application/json
x-ratelimit-limit: 500
x-ratelimit-remaining: 487
x-ratelimit-reset: 1731701460
x-ratelimit-burst-remaining: 1000
x-request-id: req_8f3a2b1c9d4e7f06`,
      },
      {
        type: 'heading',
        level: 2,
        content: 'Handling 429 Too Many Requests',
      },
      {
        type: 'paragraph',
        content: 'When the rate limit is exceeded, the API returns 429 with a JSON body containing the error code rate_limit_exceeded and a details.retry_after field indicating the number of seconds until the quota resets. The Retry-After header carries the same value for clients that prefer header-based parsing. The 429 response is idempotent-safe: retrying the original request after the indicated delay will succeed if no other rate-limiting condition applies.',
      },
      {
        type: 'code',
        language: 'json',
        caption: '429 Too Many Requests response body',
        code: `{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Rate limit exceeded. Retry after the indicated delay.",
    "details": {
      "retry_after": 14,
      "limit": 500,
      "remaining": 0,
      "reset_at": "2024-11-15T14:24:00Z",
      "request_id": "req_8f3a2b1c9d4e7f06"
    }
  }
}`,
      },
      {
        type: 'paragraph',
        content: 'The recommended client strategy is exponential backoff with full jitter. On each 429, read the Retry-After header and wait at least that many seconds before retrying. If Retry-After is absent or zero, fall back to a base delay of 1 second doubled on each subsequent 429 up to a maximum of 60 seconds, with a random jitter of up to 25% to avoid synchronizing retries across workers. Cap total retries at 5 attempts per request and surface a terminal error to the caller after that point so that the failure is observable in your own monitoring.',
      },
      {
        type: 'steps',
        items: [
          'Capture the Retry-After header value from the 429 response.',
          'If absent, derive delay as min(60, 2 ^ attempt) seconds.',
          'Apply random jitter of up to 25% of the delay value.',
          'Sleep for the computed duration without holding any blocking connection.',
          'Retry the original request with the same Idempotency-Key if the operation is idempotent.',
          'After 5 consecutive 429 responses, surface a terminal rate_limit_exhausted error to the caller.',
          'Emit a metric event to your observability stack with workspace ID, endpoint, and attempt count for trend analysis.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        content: 'For high-volume workloads, prefer the bulk endpoints (POST /v1/leads/bulk, POST /v1/campaigns/{id}/bulk_pause) over individual calls. A single bulk request counts as one rate-limit unit but can carry 50 operations, effectively multiplying your throughput by 50x without exceeding the per-minute cap.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Concurrency Limits',
      },
      {
        type: 'paragraph',
        content: 'In addition to requests-per-minute limits, LeadReach enforces a concurrent in-flight request cap per workspace. The default is 50 concurrent requests for Starter, 200 for Professional, and 1,000 for Enterprise. Requests that would exceed the concurrency cap return 429 with the error code concurrent_request_limit_exceeded and a Retry-After typically set to 1 second. This limit protects the API gateway and downstream database connections from being saturated by a single misbehaving client.',
      },
      {
        type: 'paragraph',
        content: 'Concurrency throttling is most commonly triggered by parallel bulk ingestion jobs that issue many simultaneous POST /v1/leads requests. If you observe frequent concurrent_request_limit_exceeded errors, either batch your requests via POST /v1/leads/bulk or cap your worker pool size to stay below the workspace concurrency limit. The X-Concurrency-Remaining header on every response shows how many concurrent slots remain available.',
      },
      {
        type: 'list',
        items: [
          'Starter: 100 sustained rpm, 200 burst, 50 concurrent in-flight requests.',
          'Professional: 500 sustained rpm, 1,000 burst, 200 concurrent in-flight requests.',
          'Enterprise: 2,000 sustained rpm, 4,000 burst, 1,000 concurrent in-flight requests.',
          'Bulk endpoints count as a single rate-limit unit regardless of batch size.',
          'Write operations consume 5x the rate budget of read operations.',
          'Webhook delivery rates are governed by a separate inbound quota per workspace.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'Quota vs Rate Limit',
      },
      {
        type: 'paragraph',
        content: 'Rate limits are short-term throttles measured in requests per minute. Quotas are long-term resource caps measured in stored records or processed events per billing cycle. LeadReach applies quotas to lead storage (number of active leads retained), webhook deliveries (number of outbound event deliveries per month), and AI agent invocations (number of agent runs per month). Hitting a quota does not return 429; instead, the relevant endpoint returns 402 Payment Required with a code such as lead_quota_exceeded and the dashboard surfaces an upgrade prompt. Quotas reset on the first day of each calendar month at 00:00 UTC.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Operational Guidance for High-Volume Clients',
      },
      {
        type: 'paragraph',
        content: 'Workspaces that consistently approach their rate limit should consider three complementary strategies: increasing batch sizes, introducing client-side throttling, and partitioning traffic across multiple API keys. The bulk endpoints (POST /v1/leads/bulk, POST /v1/campaigns/{id}/bulk_pause) accept up to 50 items per request and count as a single rate-limit unit, providing an immediate 50x throughput improvement over single-item endpoints. For workspaces that cannot restructure their ingestion pipeline to use bulk endpoints, client-side throttling via a token bucket implementation (such as the gobucket library for Go or the rate-limiter-flexible package for Node.js) smooths traffic and avoids burst-driven 429 responses. Partitioning traffic across multiple API keys is supported at the workspace level but discouraged operationally; the recommended pattern is to provision a single key with the highest tier required and to use bulk endpoints for throughput rather than parallelism.',
      },
      {
        type: 'paragraph',
        content: 'Monitoring rate limit consumption should be a first-class concern for any integration that issues more than 100 requests per minute. LeadReach exposes X-RateLimit-Remaining on every response; exporters should scrape this value into a time-series database and alert when the rolling 5-minute average drops below 20% of the limit. The dashboard surfaces per-key consumption charts under Workspace Settings > API Keys > Usage, with the ability to filter by endpoint, status code, and time window. Enterprise workspaces can stream consumption metrics directly to Datadog, New Relic, or Prometheus via the metrics export integration, which pushes per-minute snapshots every 60 seconds. Setting alerts on concurrent_request_limit_exceeded rate above 10 per minute provides early warning of worker pool mis-sizing before it impacts throughput.',
      },
      {
        type: 'table',
        caption: 'Recommended thresholds for rate limit monitoring',
        headers: ['Metric', 'Warning Threshold', 'Critical Threshold', 'Action'],
        rows: [
          ['X-RateLimit-Remaining (5-min avg)', 'Below 20% of limit', 'Below 5% of limit', 'Shed non-critical traffic; consider plan upgrade.'],
          ['429 responses per minute', 'Above 5', 'Above 20', 'Investigate burst pattern; add client-side throttling.'],
          ['concurrent_request_limit_exceeded', 'Any occurrence', 'Above 10 per minute', 'Reduce worker pool size; review parallel pattern.'],
          ['P99 request latency', 'Above 2 seconds', 'Above 5 seconds', 'Likely downstream saturation; contact support.'],
        ],
      },
      {
        type: 'paragraph',
        content: 'When a workspace consistently operates within 10% of its rate limit ceiling for more than 14 consecutive days, the LeadReach success team proactively reaches out to discuss a tier upgrade or architectural review. This outreach is intended as a consultative touchpoint rather than a sales motion; common outcomes include migrating to bulk endpoints, decoupling batch jobs to off-peak hours, or moving to a higher tier. Workspaces that prefer to opt out of proactive outreach can disable the notification in Workspace Settings > Notifications > Proactive Success Contact. For workspaces on the Enterprise tier with sustained traffic well below the limit ceiling, LeadReach offers committed-use discounts via annual contracts; contact sales for details.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Capacity Planning & Tier Upgrades',
      },
      {
        type: 'paragraph',
        content: 'For workspaces that consistently exceed the sustained rate limit despite using bulk endpoints and client-side throttling, LeadReach offers a dedicated capacity planning engagement through the Enterprise success team. The engagement includes a 2-week traffic analysis, a recommended architectural pattern (bulk endpoint migration, regional traffic partitioning, or read replica offloading), and a load test plan to validate the new architecture under expected peak load. The output is a written capacity plan with a tier recommendation and a 12-month growth projection. Workspaces with seasonal traffic spikes (e.g., retail holiday peaks, fiscal year-end CRM syncs, quarterly board reporting cycles) should plan capacity 60 days in advance of the expected spike to allow time for tier upgrades or architectural changes. The dashboard surfaces a 30-day forecast of expected consumption based on historical trends, with a confidence band that narrows as the spike date approaches; forecasts showing sustained operation above 80% of the current tier ceiling should trigger proactive engagement with the success team. Enterprise customers can also request custom rate limit ceilings for short-duration events such as product launches or marketing campaigns; these temporary ceilings are provisioned for 7-day windows and require executive approval. Tier upgrades take effect immediately upon invoice payment and propagate to all API gateway nodes within 60 seconds; tier downgrades require a 30-day cool-down period to ensure the workspace is genuinely operating below the lower tier ceiling. Customers on the Starter and Professional tiers can self-serve tier upgrades via the billing console; Enterprise tier changes require a contract amendment and coordination with the assigned account team.',
      },
      {
        type: 'divider',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Lead Endpoints
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'api-leads',
    title: 'Lead Endpoints',
    description: 'Create, list, enrich, score, and update lead records via the /v1/leads resource with full filtering, pagination, and bulk operations.',
    category: 'API Reference',
    readTime: '11 min read',
    lastUpdated: '2024-11-15',
    blocks: [
      {
        type: 'paragraph',
        content: 'The /v1/leads resource is the primary interface for managing lead records in LeadReach. A lead represents a single prospective customer identified by contact information, firmographic attributes, behavioral signals, and an AI-computed quality score. All lead endpoints require the leads:read scope for read operations and leads:write for write operations. Lead records are immutable across most fields once enriched, with the exception of stage, tier, and custom attributes which can be updated freely by integrations.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Lead Object Schema',
      },
      {
        type: 'paragraph',
        content: 'Every lead record is represented as a JSON object with a stable set of top-level fields. The id field is a ULID generated server-side and is the canonical identifier for the lead across all endpoints. The score field is a float between 0 and 100 computed by the LeadReach scoring engine and refreshed every time the lead is enriched or stage-changed. The stage field tracks the lead position in the default funnel (new, contacted, qualified, opportunity, won, lost) and is the primary driver of campaign routing decisions.',
      },
      {
        type: 'table',
        caption: 'Lead object fields',
        headers: ['Field', 'Type', 'Required', 'Description'],
        rows: [
          ['id', 'string (ULID)', 'Server-set', 'Globally unique lead identifier.'],
          ['email', 'string (email)', 'On create', 'Primary contact email; lowercase normalized.'],
          ['first_name', 'string', 'No', 'Lead first name; can be enriched.'],
          ['last_name', 'string', 'No', 'Lead last name; can be enriched.'],
          ['company', 'string', 'No', 'Company name; can be enriched.'],
          ['title', 'string', 'No', 'Job title; can be enriched.'],
          ['stage', 'enum', 'No', 'Funnel stage; defaults to "new".'],
          ['tier', 'enum', 'No', 'Quality tier: S, A, B, C, D.'],
          ['score', 'float', 'Server-set', 'Quality score 0-100 computed by AI engine.'],
          ['source_channel', 'string', 'No', 'Acquisition source (organic, paid, referral, outbound).'],
          ['campaign_id', 'string (ULID)', 'No', 'Campaign that owns this lead, if any.'],
          ['custom_attributes', 'object', 'No', 'Free-form key/value attributes (max 50 keys).'],
          ['created_at', 'ISO 8601', 'Server-set', 'Record creation timestamp.'],
          ['updated_at', 'ISO 8601', 'Server-set', 'Last modification timestamp.'],
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'List Leads (GET /v1/leads)',
      },
      {
        type: 'paragraph',
        content: 'The list endpoint returns a paginated collection of lead records sorted by created_at descending by default. Cursor-based pagination is used instead of offset to ensure stable iteration over a changing dataset; the cursor encodes the position of the last item in the previous page and the same sort order is applied to subsequent requests. Filters can be combined using AND semantics across multiple query parameters; OR semantics require multiple API calls or use of the POST /v1/leads/search endpoint (currently in beta).',
      },
      {
        type: 'paragraph',
        content: 'The endpoint accepts up to 10 filter parameters. score_min and score_max can be combined to slice leads within a quality band (e.g., score_min=70 and score_max=85 returns leads scoring 70 to 85 inclusive). The stage filter accepts a comma-separated list of stages to include. The limit parameter controls page size and must be between 1 and 100, defaulting to 25. Responses include a has_more boolean and a next_cursor string that, when present, is used as the cursor query parameter on the next request.',
      },
      {
        type: 'code',
        language: 'bash',
        caption: 'List leads filtered by campaign and score range',
        code: `curl "https://api.leadreach.ai/v1/leads?campaign_id=01HZX4W7N8X9P3M2K1QJ5R6VT8&score_min=70&stage=qualified,opportunity&limit=25&cursor=eyJpZCI6IjAxSFpY" \\
  -H "Authorization: Bearer lr_live_4f9c2a8e7b1d6034ab12cd56ef9087ab" \\
  -H "X-Request-Id: req_8f3a2b1c9d4e7f06"`,
      },
      {
        type: 'code',
        language: 'json',
        caption: 'Paginated list response',
        code: `{
  "object": "list",
  "url": "/v1/leads",
  "has_more": true,
  "next_cursor": "eyJpZCI6IjAxSFpYNEo3TjhYOVQzTTJLMVFKNVI2VlQ4Iiwic2NvcmUiOjcyLjF9",
  "data": [
    {
      "id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",
      "email": "jordan.lee@northstar.io",
      "first_name": "Jordan",
      "last_name": "Lee",
      "company": "Northstar Analytics",
      "title": "VP of Engineering",
      "stage": "qualified",
      "tier": "A",
      "score": 87.4,
      "source_channel": "outbound",
      "campaign_id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",
      "custom_attributes": { "icp_fit": "high", "persona": "decision_maker" },
      "created_at": "2024-11-12T09:14:22Z",
      "updated_at": "2024-11-15T08:02:11Z"
    }
  ]
}`,
      },
      {
        type: 'heading',
        level: 2,
        content: 'Create Lead (POST /v1/leads)',
      },
      {
        type: 'paragraph',
        content: 'Creating a lead requires at least the email field; all other top-level fields are optional and can be enriched later via POST /v1/leads/{id}/enrich. The endpoint is idempotent when called with an Idempotency-Key header: repeating the same request within 24 hours returns the originally created lead record rather than creating a duplicate. Email is treated as the natural unique key within a workspace; creating a lead with an email that already exists in the workspace returns 409 Conflict with the existing lead reference in details.existing_lead_id, unless the Idempotency-Key matches a previous successful create, in which case the original lead is returned.',
      },
      {
        type: 'code',
        language: 'bash',
        caption: 'Create a new lead with idempotency key',
        code: `curl -X POST https://api.leadreach.ai/v1/leads \\
  -H "Authorization: Bearer lr_live_4f9c2a8e7b1d6034ab12cd56ef9087ab" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: idem_a4b8c1d2e3f4g5h6i7j8k9l0m1n2o3p4" \\
  -H "X-Request-Id: req_8f3a2b1c9d4e7f06" \\
  -d '{
    "email": "jordan.lee@northstar.io",
    "first_name": "Jordan",
    "last_name": "Lee",
    "company": "Northstar Analytics",
    "title": "VP of Engineering",
    "source_channel": "outbound",
    "campaign_id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",
    "custom_attributes": {
      "icp_fit": "high",
      "persona": "decision_maker"
    }
  }'`,
      },
      {
        type: 'code',
        language: 'json',
        caption: '201 Created response with full lead record',
        code: `{
  "id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",
  "email": "jordan.lee@northstar.io",
  "first_name": "Jordan",
  "last_name": "Lee",
  "company": "Northstar Analytics",
  "title": "VP of Engineering",
  "stage": "new",
  "tier": null,
  "score": null,
  "source_channel": "outbound",
  "campaign_id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",
  "custom_attributes": {
    "icp_fit": "high",
    "persona": "decision_maker"
  },
  "created_at": "2024-11-15T08:02:11Z",
  "updated_at": "2024-11-15T08:02:11Z"
}`,
      },
      {
        type: 'heading',
        level: 2,
        content: 'Retrieve, Update, and Delete',
      },
      {
        type: 'paragraph',
        content: 'Single-lead operations use GET, PATCH, and DELETE on the /v1/leads/{id} resource. GET returns the full lead record or 404 when the id does not exist within the calling workspace. PATCH accepts a partial update and applies field-level merging; fields omitted from the request body are left untouched. DELETE is a soft delete by default; the lead is marked as archived and excluded from list responses, but the record is retained for 30 days for audit purposes before permanent deletion. Hard delete is available via DELETE with the query parameter hard=true, which requires the leads:write scope and a confirmation token in the X-Confirm-Delete header.',
      },
      {
        type: 'paragraph',
        content: 'The PATCH endpoint accepts any combination of writable lead fields. To move a lead through the funnel, update the stage field; this triggers a stage_change audit event and fires the lead.stage_changed webhook event. To reassign a lead to a different campaign, update campaign_id; this requires the new campaign to be in a state that accepts new members (started or paused, not completed or draft). Custom attributes can be partially updated using the custom_attributes field with a merge semantic, or fully replaced using the custom_attributes_replace field with a replace semantic.',
      },
      {
        type: 'code',
        language: 'bash',
        caption: 'PATCH lead to advance stage and update custom attributes',
        code: `curl -X PATCH https://api.leadreach.ai/v1/leads/01HZX4W7N8X9P3M2K1QJ5R6VT8 \\
  -H "Authorization: Bearer lr_live_4f9c2a8e7b1d6034ab12cd56ef9087ab" \\
  -H "Content-Type: application/json" \\
  -H "X-Request-Id: req_8f3a2b1c9d4e7f06" \\
  -d '{
    "stage": "opportunity",
    "custom_attributes": {
      "budget_confirmed": true,
      "next_step": "schedule_demo"
    }
  }'`,
      },
      {
        type: 'heading',
        level: 2,
        content: 'Enrich and Score',
      },
      {
        type: 'paragraph',
        content: 'The POST /v1/leads/{id}/enrich endpoint triggers the LeadReach enrichment pipeline for a single lead. Enrichment pulls firmographic data (company size, industry, revenue band, technographic stack), contact verification (email validity, phone discovery, social profiles), and intent signals (web traffic, content engagement, hiring trends). The response is returned synchronously with the enriched record, but enrichment can take up to 30 seconds for leads with sparse input data. For bulk enrichment, prefer the POST /v1/leads/bulk endpoint with action=enrich which processes up to 50 leads in a single call.',
      },
      {
        type: 'paragraph',
        content: 'The POST /v1/leads/{id}/score endpoint runs the AI scoring engine against the current lead record. Scoring is deterministic given the same input attributes and the same model version; the model_version field in the response identifies the scoring model used. Scores above 80 trigger automatic S-tier assignment and notify the assigned account executive if the lead is associated with a campaign. Scores below 30 may trigger automatic disqualification depending on the campaign routing rules. Scoring is automatically run as part of enrichment, so manually invoking the score endpoint is only necessary when the lead was updated without enrichment.',
      },
      {
        type: 'callout',
        variant: 'info',
        content: 'Enrichment and scoring are billed as separate AI agent invocations on the Enterprise plan. Starter and Professional plans include up to 1,000 enrichments and 5,000 scorings per month. Exceeding the included quota returns 402 Payment Required with code enrichment_quota_exceeded or scoring_quota_exceeded rather than 429, since the limit is monthly, not per-minute.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Bulk Lead Operations',
      },
      {
        type: 'paragraph',
        content: 'The POST /v1/leads/bulk endpoint accepts up to 50 lead operations in a single request and processes them in parallel. Each item in the input array is treated as an independent create-or-update keyed by email: if a lead with the given email already exists, it is updated; otherwise a new lead is created. The response returns an array of per-item results with status, id, and any per-item error fields, allowing partial success. The bulk endpoint counts as a single rate-limit unit regardless of batch size, making it the preferred ingestion path for high-volume CRM syncs.',
      },
      {
        type: 'code',
        language: 'bash',
        caption: 'Bulk create up to 50 leads in a single request',
        code: `curl -X POST https://api.leadreach.ai/v1/leads/bulk \\
  -H "Authorization: Bearer lr_live_4f9c2a8e7b1d6034ab12cd56ef9087ab" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: idem_bulk_2024_11_15_run_003" \\
  -H "X-Request-Id: req_8f3a2b1c9d4e7f06" \\
  -d '{
    "action": "upsert",
    "campaign_id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",
    "leads": [
      { "email": "a.patel@brightwave.co", "first_name": "Aanya", "last_name": "Patel", "company": "Brightwave" },
      { "email": "m.rivera@finchlabs.dev", "first_name": "Mateo", "last_name": "Rivera", "company": "Finch Labs" },
      { "email": "s.chen@verdant.com", "first_name": "Sofia", "last_name": "Chen", "company": "Verdant" }
    ]
  }'`,
      },
      {
        type: 'code',
        language: 'json',
        caption: 'Bulk response with per-item results',
        code: `{
  "object": "bulk_result",
  "total": 3,
  "succeeded": 3,
  "failed": 0,
  "results": [
    { "index": 0, "status": "created", "id": "01HZX4W7N8X9P3M2K1QJ5R6VT8" },
    { "index": 1, "status": "updated", "id": "01HZY8K2L4M6N8P0Q1R3S5T7U9" },
    { "index": 2, "status": "created", "id": "01HJ12AB34CD56EF78GH90IJ" }
  ]
}`,
      },
      {
        type: 'list',
        items: [
          'GET /v1/leads — list with filters and cursor pagination.',
          'POST /v1/leads — create single lead; idempotent with Idempotency-Key.',
          'GET /v1/leads/{id} — retrieve single lead by ULID.',
          'PATCH /v1/leads/{id} — partial update; triggers stage_change webhook when stage changes.',
          'DELETE /v1/leads/{id} — soft delete by default; hard delete with hard=true.',
          'POST /v1/leads/{id}/enrich — trigger enrichment pipeline; returns enriched record.',
          'POST /v1/leads/{id}/score — run AI scoring; returns updated score and tier.',
          'POST /v1/leads/bulk — upsert up to 50 leads in a single request.',
        ],
      },
      {
        type: 'steps',
        items: [
          'Identify the lead source channel and campaign context before creating the lead record.',
          'Call POST /v1/leads with the email field and any known contact attributes; include an Idempotency-Key for safe retries.',
          'Capture the returned lead id; this ULID is the canonical identifier for all subsequent operations.',
          'Trigger enrichment via POST /v1/leads/{id}/enrich to populate firmographic and intent data.',
          'Verify the lead.score field is populated; if not, call POST /v1/leads/{id}/score explicitly.',
          'Update the stage via PATCH /v1/leads/{id} when the lead advances through the funnel.',
          'Subscribe to lead.stage_changed and lead.score_updated webhooks to mirror state in downstream systems.',
          'For high-volume ingestion, prefer POST /v1/leads/bulk with action=upsert to batch up to 50 leads per request.',
        ],
      },
      {
        type: 'paragraph',
        content: 'All write operations on leads emit audit log entries with the calling API key id, request IP, and full before/after field diffs. Audit entries are retained for 7 years per the LeadReach data retention policy RET-LEAD-002 and are accessible via the GET /v1/leads/{id}/audit endpoint with the leads:read scope. The audit trail is essential for SOC 2 evidence collection and for post-incident root cause analysis when leads are accidentally modified or deleted by misconfigured integrations.',
      },
      {
        type: 'paragraph',
        content: 'LeadReach supports a per-lead locking mechanism for integrations that need to coordinate concurrent updates from multiple writers. Acquiring a lock via POST /v1/leads/{id}/lock returns a lease token that must be presented on subsequent PATCH calls within the lock window; locks expire automatically after 60 seconds if not renewed. This pattern is useful for CRM integrations that need to atomically transition a lead through multiple stages without race conditions from concurrent automation. Locks are advisory; they do not block other writers that do not present a lease token, but they enable detecting and reporting concurrent modification attempts via the lead.lock_conflict webhook event.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Lead Deduplication Across Sources',
      },
      {
        type: 'paragraph',
        content: 'LeadReach applies automatic deduplication within a workspace based on the email field, normalized to lowercase and stripped of plus-addressing (e.g., user+tag@domain.com collapses to user@domain.com). This normalization ensures that leads created via different channels (organic signup, paid form, outbound import) do not create duplicate records. For workspaces that need to preserve the original email format for compliance reasons, the deduplication behavior can be disabled via the workspace settings, but this is strongly discouraged as it leads to fragmented lead history and inflated billing. When deduplication is disabled, the POST /v1/leads endpoint will return a duplicate_lead warning in the response metadata, and integrations are responsible for reconciling duplicate records via GET /v1/leads?email=... lookups before creating a new lead.',
      },
      {
        type: 'divider',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Campaign Endpoints
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'api-campaigns',
    title: 'Campaign Endpoints',
    description: 'Create, configure, start, pause, and analyze outbound campaigns via the /v1/campaigns resource with full stats and lead assignment.',
    category: 'API Reference',
    readTime: '10 min read',
    lastUpdated: '2024-11-15',
    blocks: [
      {
        type: 'paragraph',
        content: 'The /v1/campaigns resource manages outbound campaigns that orchestrate AI agents, outreach sequences, and lead routing across a workspace. A campaign is the top-level container for outreach activity; it owns a population of leads, references one or more AI agents that handle messaging and qualification, and tracks performance metrics throughout its lifecycle. Campaign endpoints require campaigns:read for read operations and campaigns:write for write operations including start, pause, and patch.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Campaign Object Schema',
      },
      {
        type: 'paragraph',
        content: 'A campaign record includes a stable identifier, a human-readable name, a status field tracking the lifecycle state, and configuration fields that drive agent behavior. The status field transitions through draft, scheduled, started, paused, completed, and archived; transitions are gated by validation rules enforced server-side. The agents field is an array of agent IDs assigned to the campaign, each with a role (outbound, qualifier, nurturer, scheduler) that determines how the agent participates in the campaign workflow.',
      },
      {
        type: 'table',
        caption: 'Campaign object fields',
        headers: ['Field', 'Type', 'Required', 'Description'],
        rows: [
          ['id', 'string (ULID)', 'Server-set', 'Globally unique campaign identifier.'],
          ['name', 'string', 'Yes', 'Human-readable name (max 120 chars).'],
          ['status', 'enum', 'Server-set', 'Lifecycle state (draft, scheduled, started, paused, completed, archived).'],
          ['channel', 'enum', 'Yes', 'Primary outreach channel (email, linkedin, multi).'],
          ['agents', 'array of objects', 'No', 'Agent assignments with role and weight.'],
          ['audience_filter', 'object', 'No', 'Lead filter criteria for auto-assignment.'],
          ['daily_cap', 'integer', 'No', 'Max new leads processed per day.'],
          ['messaging_strategy', 'enum', 'No', 'AI strategy: personalization depth (light, balanced, deep).'],
          ['start_at', 'ISO 8601', 'No', 'Scheduled start time; ignored if status is already started.'],
          ['end_at', 'ISO 8601', 'No', 'Optional end time; campaign auto-pauses at this time.'],
          ['created_at', 'ISO 8601', 'Server-set', 'Record creation timestamp.'],
          ['updated_at', 'ISO 8601', 'Server-set', 'Last modification timestamp.'],
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'List Campaigns (GET /v1/campaigns)',
      },
      {
        type: 'paragraph',
        content: 'The list endpoint returns campaigns in the calling workspace sorted by updated_at descending. Filters include status, channel, and updated_since (ISO 8601 timestamp). Pagination follows the same cursor-based scheme as leads: the response includes has_more and next_cursor fields, and subsequent requests pass cursor as a query parameter. The default page size is 25 and the maximum is 100; values outside this range are clamped and a 400 validation error is never raised solely for oversized limit values.',
      },
      {
        type: 'code',
        language: 'bash',
        caption: 'List active campaigns with status filter',
        code: `curl "https://api.leadreach.ai/v1/campaigns?status=started,paused&limit=25" \\
  -H "Authorization: Bearer lr_live_4f9c2a8e7b1d6034ab12cd56ef9087ab" \\
  -H "X-Request-Id: req_8f3a2b1c9d4e7f06"`,
      },
      {
        type: 'code',
        language: 'json',
        caption: 'Paginated campaign list response',
        code: `{
  "object": "list",
  "url": "/v1/campaigns",
  "has_more": false,
  "next_cursor": null,
  "data": [
    {
      "id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",
      "name": "Q4 Enterprise Outbound - SaaS",
      "status": "started",
      "channel": "email",
      "agents": [
        { "agent_id": "01HABCD12EFG34HIJ56KLM7890", "role": "outbound", "weight": 1.0 },
        { "agent_id": "01HABCD12EFG34HIJ56KLM7891", "role": "qualifier", "weight": 0.6 }
      ],
      "daily_cap": 200,
      "messaging_strategy": "balanced",
      "start_at": "2024-11-01T08:00:00Z",
      "end_at": "2024-12-31T23:59:59Z",
      "created_at": "2024-10-28T14:32:01Z",
      "updated_at": "2024-11-15T07:11:48Z"
    }
  ]
}`,
      },
      {
        type: 'heading',
        level: 2,
        content: 'Create Campaign (POST /v1/campaigns)',
      },
      {
        type: 'paragraph',
        content: 'Creating a campaign requires name and channel at minimum. The campaign is created in the draft status; transitioning to started requires the agents array to be non-empty and the messaging_strategy to be set. The POST endpoint supports the Idempotency-Key header with the same semantics as leads: a repeated request with the same key within 24 hours returns the originally created campaign rather than creating a duplicate. The name field is not uniqueness-constrained; multiple campaigns in the same workspace can share a name, but the dashboard surfaces a warning when this occurs.',
      },
      {
        type: 'paragraph',
        content: 'When audience_filter is provided, the campaign auto-assigns leads matching the filter criteria on start. The filter object accepts the same field names and operators as the GET /v1/leads endpoint (campaign_id excluded), enabling segmentation by score range, stage, source_channel, or any custom attribute. Auto-assignment runs continuously while the campaign is in the started status; new leads matching the filter are added within 60 seconds of their creation. Manual lead assignment via PATCH /v1/leads/{id} with campaign_id set to this campaign id also works and bypasses the filter entirely.',
      },
      {
        type: 'code',
        language: 'bash',
        caption: 'Create a new campaign with audience filter and agent assignment',
        code: `curl -X POST https://api.leadreach.ai/v1/campaigns \\
  -H "Authorization: Bearer lr_live_4f9c2a8e7b1d6034ab12cd56ef9087ab" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: idem_campaign_q4_ent_001" \\
  -H "X-Request-Id: req_8f3a2b1c9d4e7f06" \\
  -d '{
    "name": "Q4 Enterprise Outbound - SaaS",
    "channel": "email",
    "agents": [
      { "agent_id": "01HABCD12EFG34HIJ56KLM7890", "role": "outbound", "weight": 1.0 },
      { "agent_id": "01HABCD12EFG34HIJ56KLM7891", "role": "qualifier", "weight": 0.6 }
    ],
    "audience_filter": {
      "score_min": 70,
      "tier": ["S", "A"],
      "source_channel": "outbound"
    },
    "daily_cap": 200,
    "messaging_strategy": "balanced",
    "start_at": "2024-11-01T08:00:00Z",
    "end_at": "2024-12-31T23:59:59Z"
  }'`,
      },
      {
        type: 'code',
        language: 'json',
        caption: '201 Created response',
        code: `{
  "id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",
  "name": "Q4 Enterprise Outbound - SaaS",
  "status": "draft",
  "channel": "email",
  "agents": [
    { "agent_id": "01HABCD12EFG34HIJ56KLM7890", "role": "outbound", "weight": 1.0 },
    { "agent_id": "01HABCD12EFG34HIJ56KLM7891", "role": "qualifier", "weight": 0.6 }
  ],
  "audience_filter": {
    "score_min": 70,
    "tier": ["S", "A"],
    "source_channel": "outbound"
  },
  "daily_cap": 200,
  "messaging_strategy": "balanced",
  "start_at": "2024-11-01T08:00:00Z",
  "end_at": "2024-12-31T23:59:59Z",
  "created_at": "2024-10-28T14:32:01Z",
  "updated_at": "2024-10-28T14:32:01Z"
}`,
      },
      {
        type: 'heading',
        level: 2,
        content: 'Lifecycle Transitions',
      },
      {
        type: 'paragraph',
        content: 'Campaigns move through a finite state machine controlled by the dedicated start and pause endpoints rather than by directly patching the status field. POST /v1/campaigns/{id}/start validates that the campaign is in draft or paused status and has at least one agent assigned, then transitions to started. POST /v1/campaigns/{id}/pause transitions from started to paused; ongoing in-flight outreach is completed but no new outreach is initiated until the campaign is resumed via start. Campaigns cannot be deleted; they are archived via PATCH with status=archived, which retains the record for audit but excludes it from list responses by default.',
      },
      {
        type: 'paragraph',
        content: 'Both lifecycle endpoints accept an optional reason field in the request body, which is recorded in the audit log alongside the actor (API key id) and timestamp. This is useful for surfacing human-readable context in the dashboard activity feed and during incident review. The endpoints are idempotent: starting an already-started campaign returns 200 with the current state rather than 409, and pausing an already-paused campaign behaves the same way. This design simplifies retry logic in client integrations.',
      },
      {
        type: 'code',
        language: 'bash',
        caption: 'Start a campaign with a reason annotation',
        code: `curl -X POST https://api.leadreach.ai/v1/campaigns/01HZX4W7N8X9P3M2K1QJ5R6VT8/start \\
  -H "Authorization: Bearer lr_live_4f9c2a8e7b1d6034ab12cd56ef9087ab" \\
  -H "Content-Type: application/json" \\
  -H "X-Request-Id: req_8f3a2b1c9d4e7f06" \\
  -d '{
    "reason": "Sales kickoff complete; ready to begin outreach."
  }'`,
      },
      {
        type: 'heading',
        level: 2,
        content: 'Campaign Leads & Stats',
      },
      {
        type: 'paragraph',
        content: 'The GET /v1/campaigns/{id}/leads endpoint returns the population of leads currently assigned to the campaign, with the same pagination and filter semantics as GET /v1/leads. This endpoint is useful for building campaign-specific views in downstream CRMs or for exporting lead lists for handoff to sales. The endpoint accepts an additional stage filter to slice by funnel position; for example, stage=qualified,opportunity returns only leads that have been qualified by the campaign agents.',
      },
      {
        type: 'paragraph',
        content: 'The GET /v1/campaigns/{id}/stats endpoint returns aggregated performance metrics for the campaign. The default time window is the entire campaign duration; passing start and end query parameters (ISO 8601 timestamps) restricts aggregation to a specific window. Metrics include leads_assigned, leads_qualified, leads_converted, messages_sent, open_rate, reply_rate, meeting_booked, and pipeline_generated. The response is computed lazily and cached for 5 minutes; high-traffic dashboards should poll this endpoint no more frequently than every 5 minutes to avoid spurious load.',
      },
      {
        type: 'code',
        language: 'bash',
        caption: 'Fetch campaign performance stats',
        code: `curl "https://api.leadreach.ai/v1/campaigns/01HZX4W7N8X9P3M2K1QJ5R6VT8/stats?start=2024-11-01T00:00:00Z&end=2024-11-15T23:59:59Z" \\
  -H "Authorization: Bearer lr_live_4f9c2a8e7b1d6034ab12cd56ef9087ab" \\
  -H "X-Request-Id: req_8f3a2b1c9d4e7f06"`,
      },
      {
        type: 'code',
        language: 'json',
        caption: 'Campaign stats response',
        code: `{
  "campaign_id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",
  "window": {
    "start": "2024-11-01T00:00:00Z",
    "end": "2024-11-15T23:59:59Z"
  },
  "metrics": {
    "leads_assigned": 412,
    "leads_qualified": 87,
    "leads_converted": 14,
    "messages_sent": 1284,
    "open_rate": 0.583,
    "reply_rate": 0.142,
    "meeting_booked": 21,
    "pipeline_generated_usd": 184500
  },
  "computed_at": "2024-11-15T08:14:22Z",
  "cache_expires_at": "2024-11-15T08:19:22Z"
}`,
      },
      {
        type: 'callout',
        variant: 'tip',
        content: 'When pausing a campaign for a planned sales review, include a reason field and an expected_resume_at field. The dashboard will surface the planned resume time on the campaign card, reducing operational confusion among team members monitoring active campaigns.',
      },
      {
        type: 'list',
        items: [
          'GET /v1/campaigns — list campaigns with status and channel filters.',
          'POST /v1/campaigns — create new campaign in draft status; idempotent with Idempotency-Key.',
          'GET /v1/campaigns/{id} — retrieve single campaign.',
          'PATCH /v1/campaigns/{id} — update configuration; status transitions use dedicated endpoints.',
          'POST /v1/campaigns/{id}/start — transition from draft or paused to started.',
          'POST /v1/campaigns/{id}/pause — transition from started to paused; in-flight outreach completes.',
          'GET /v1/campaigns/{id}/leads — list leads assigned to the campaign.',
          'GET /v1/campaigns/{id}/stats — aggregated performance metrics with optional time window.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'Validation & Error Handling',
      },
      {
        type: 'paragraph',
        content: 'Campaign creation and update operations validate against a strict schema. Missing required fields return 400 with code validation_failed and a details.errors array listing per-field violations. Transitioning a campaign via start or pause when the current status does not permit the transition returns 409 with code invalid_state_transition. The valid transitions are draft to started, scheduled to started (auto-triggered at start_at), started to paused, paused to started, started to completed (auto-triggered at end_at), and any status to archived.',
      },
      {
        type: 'paragraph',
        content: 'The daily_cap field cannot be set to a value below 10 or above the workspace daily outreach quota, which is 1,000 for Starter, 5,000 for Professional, and 50,000 for Enterprise. The messaging_strategy field affects token consumption per outreach: light consumes 1 unit, balanced consumes 3 units, and deep consumes 8 units. Workspaces should plan their AI token budget accordingly; deep strategy at high daily_cap values can exhaust the monthly AI budget within hours.',
      },
      {
        type: 'steps',
        items: [
          'Define the campaign audience by selecting an ICP filter (score range, tier, source channel).',
          'Choose the AI agents that will handle outbound messaging and lead qualification.',
          'Call POST /v1/campaigns with name, channel, agents, audience_filter, and messaging_strategy.',
          'Capture the returned campaign id; this ULID is the canonical identifier for lifecycle operations.',
          'Optionally schedule the campaign by setting start_at and end_at in the create request.',
          'Validate the configuration via GET /v1/campaigns/{id} before transitioning out of draft.',
          'Start the campaign via POST /v1/campaigns/{id}/start; include a reason for the audit log.',
          'Monitor delivery stats via GET /v1/campaigns/{id}/stats every 5 minutes during execution.',
          'Pause the campaign via POST /v1/campaigns/{id}/pause when adjustments are needed; resume via start.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'Campaign Analytics Deep Dive',
      },
      {
        type: 'paragraph',
        content: 'The GET /v1/campaigns/{id}/stats endpoint exposes a comprehensive set of performance metrics, but several derived metrics require client-side computation for full visibility. Cost per qualified lead is computed as campaign_monthly_cost divided by leads_qualified, where campaign_monthly_cost is available via the billing API. Reply sentiment trend is computed by averaging the sentiment_score field across outreach.replied webhook events over the time window; values trending toward 1.0 indicate improving buying intent while values trending toward -1.0 indicate objections accumulating. Conversion velocity is computed as leads_converted divided by days_in_window and is a leading indicator of whether the campaign will hit its end-of-quarter target; a velocity below 0.5 leads per day typically warrants intervention before the end_at deadline approaches.',
      },
      {
        type: 'paragraph',
        content: 'For executive reporting, LeadReach recommends exporting campaign stats to a BI tool such as Looker, Tableau, or Mode via the bulk export endpoint GET /v1/campaigns/export?format=csv. The export includes per-day metric snapshots for every campaign in the workspace, allowing trend analysis across cohorts and time periods. The export endpoint accepts start and end parameters to scope the time range; exports spanning more than 90 days are paginated into multiple files delivered to the configured export destination (S3 bucket, GCS bucket, or SFTP endpoint). For real-time dashboards, poll GET /v1/campaigns/{id}/stats no more frequently than every 5 minutes to respect the 5-minute response cache and avoid spurious load.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Campaign Templates & Cloning',
      },
      {
        type: 'paragraph',
        content: 'LeadReach supports campaign templates via the POST /v1/campaigns/{id}/clone endpoint, which creates a new campaign in draft status with the configuration copied from the source campaign. Templates are useful for recurring campaign types (e.g., quarterly outbound to a new ICP) where the agent assignments, messaging strategy, and audience filter are stable but the audience itself changes. Cloned campaigns include all configuration fields except for start_at and end_at, which must be set explicitly on the clone to prevent accidental immediate starts. The cloned campaign is in draft status; verify the configuration and adjust the audience filter before starting. Cloning does not copy leads from the source campaign; new leads are auto-assigned based on the cloned audience filter once the campaign transitions to started.',
      },
      {
        type: 'divider',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Webhook Configuration
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'api-webhooks',
    title: 'Webhook Configuration',
    description: 'Subscribe to real-time events via the /v1/webhooks resource. Configure endpoints, manage secrets, and verify HMAC signatures.',
    category: 'API Reference',
    readTime: '8 min read',
    lastUpdated: '2024-11-15',
    blocks: [
      {
        type: 'paragraph',
        content: 'Webhooks are the primary mechanism for receiving real-time notifications from LeadReach when leads, campaigns, and outreach activities change state. The webhook system is configured via the /v1/webhooks resource, which exposes full CRUD operations for webhook subscriptions. Each subscription binds a set of event types to a single HTTPS endpoint URL within a workspace, and LeadReach delivers an HTTP POST to the configured URL each time a matching event fires. The webhook secret, used for HMAC signature verification, is generated at subscription creation time and can be rotated on demand.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Webhook Subscription Object',
      },
      {
        type: 'paragraph',
        content: 'A webhook subscription record contains the endpoint URL, the list of event types subscribed, the active status flag, and the secret used for HMAC signing. The secret is only fully visible at creation time and on rotation; on subsequent reads, only a fingerprint (first 8 characters) is returned to allow correlation without exposing the value. Each subscription has a unique id that can be used to update, pause, or delete the subscription without affecting other subscriptions in the workspace.',
      },
      {
        type: 'table',
        caption: 'Webhook subscription fields',
        headers: ['Field', 'Type', 'Required', 'Description'],
        rows: [
          ['id', 'string (ULID)', 'Server-set', 'Unique subscription identifier.'],
          ['url', 'string (https URL)', 'Yes', 'Endpoint receiving POST deliveries; HTTPS required.'],
          ['events', 'array of strings', 'Yes', 'Event type filters; "*" subscribes to all events.'],
          ['active', 'boolean', 'No', 'Defaults to true; set to false to pause deliveries.'],
          ['description', 'string', 'No', 'Free-form label for the subscription (max 200 chars).'],
          ['secret_fingerprint', 'string', 'Server-set', 'First 8 chars of the secret for correlation.'],
          ['metadata', 'object', 'No', 'Free-form metadata; returned in delivery headers.'],
          ['created_at', 'ISO 8601', 'Server-set', 'Record creation timestamp.'],
          ['updated_at', 'ISO 8601', 'Server-set', 'Last modification timestamp.'],
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'Create Subscription (POST /v1/webhooks)',
      },
      {
        type: 'paragraph',
        content: 'Creating a webhook subscription requires the webhooks:manage scope on the calling API key. The url must be a valid HTTPS URL with a publicly routable hostname or a private integration endpoint registered with LeadReach Connect. The events array accepts the wildcard "*" which subscribes to all current and future event types, or any explicit combination of event type strings. The secret for HMAC signing is auto-generated server-side using a cryptographically secure random source and returned once in the response body; the dashboard does not display it again.',
      },
      {
        type: 'paragraph',
        content: 'After creation, LeadReach sends a verification ping to the configured URL. The ping is a POST request with the body {"event": "webhook.verify", "data": {"subscription_id": "...", "challenge": "..."}} and expects a 2xx response within 10 seconds. The challenge token in the body must be echoed back in a X-LeadReach-Verify-Token response header to confirm ownership of the endpoint. The subscription remains in a pending_verification state for up to 24 hours; if the verification ping is not successfully completed, the subscription is auto-deactivated and the events field is set to an empty array.',
      },
      {
        type: 'code',
        language: 'bash',
        caption: 'Create a webhook subscription for lead lifecycle events',
        code: `curl -X POST https://api.leadreach.ai/v1/webhooks \\
  -H "Authorization: Bearer lr_live_4f9c2a8e7b1d6034ab12cd56ef9087ab" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: idem_webhook_crm_sync_v2" \\
  -H "X-Request-Id: req_8f3a2b1c9d4e7f06" \\
  -d '{
    "url": "https://hooks.crm.example.com/leadreach/v1",
    "events": ["lead.created", "lead.qualified", "lead.stage_changed", "outreach.replied"],
    "active": true,
    "description": "CRM sync - leads and replies",
    "metadata": {
      "environment": "production",
      "owner": "revenue-ops"
    }
  }'`,
      },
      {
        type: 'code',
        language: 'json',
        caption: '201 Created response with secret (shown only at creation time)',
        code: `{
  "id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",
  "url": "https://hooks.crm.example.com/leadreach/v1",
  "events": ["lead.created", "lead.qualified", "lead.stage_changed", "outreach.replied"],
  "active": true,
  "status": "pending_verification",
  "description": "CRM sync - leads and replies",
  "secret": "whsec_••••••••••••••••••••••••••••••••",
  "secret_fingerprint": "whsec_••••••••",
  "metadata": {
    "environment": "production",
    "owner": "revenue-ops"
  },
  "created_at": "2024-11-15T08:02:11Z",
  "updated_at": "2024-11-15T08:02:11Z"
}`,
      },
      {
        type: 'heading',
        level: 2,
        content: 'Listing and Inspecting Subscriptions',
      },
      {
        type: 'paragraph',
        content: 'The GET /v1/webhooks endpoint lists all subscriptions in the calling workspace with cursor pagination. The endpoint accepts an active query parameter (true or false) to filter by status, and an event query parameter to filter by subscriptions that include a specific event type. Each returned subscription includes the secret_fingerprint but never the full secret value; if the secret has been lost, the only recovery path is to rotate via POST /v1/webhooks/{id}/rotate-secret, which generates a new secret and returns it once in the response body.',
      },
      {
        type: 'paragraph',
        content: 'GET /v1/webhooks/{id} retrieves a single subscription by ULID. The endpoint returns 404 with code not_found if the id does not exist within the calling workspace. PATCH /v1/webhooks/{id} updates the url, events, active, or description fields; the secret cannot be patched directly, only rotated via the dedicated endpoint. Updating the url field triggers a new verification ping; the subscription remains in pending_verification status until the new URL is verified, but events continue to be delivered to the previous URL during this window to avoid message loss.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'HMAC Signature Verification',
      },
      {
        type: 'paragraph',
        content: 'Every webhook delivery includes an X-LeadReach-Signature header containing a t parameter (timestamp) and a v1 parameter (HMAC-SHA256 signature), formatted as t=1731652331,v1=4f9c2a8e7b1d.... The signature is computed as HMAC-SHA256 using the subscription secret over the string concatenation of the timestamp, a literal period, and the raw request body. Receivers must verify the signature before processing the payload to prevent forged deliveries from malicious actors who may have discovered the endpoint URL but not the secret.',
      },
      {
        type: 'code',
        language: 'bash',
        caption: 'Verify the HMAC signature (Node.js example)',
        code: `import crypto from 'crypto';

function verifyLeadReachSignature(rawBody, signatureHeader, secret) {
  const params = new URLSearchParams(signatureHeader);
  const timestamp = params.get('t');
  const signature = params.get('v1');
  if (!timestamp || !signature) return false;

  const fiveMinutes = 5 * 60 * 1000;
  if (Math.abs(Date.now() - parseInt(timestamp, 10) * 1000) > fiveMinutes) {
    return false;
  }

  const payload = \`\${timestamp}.\${rawBody}\`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}`,
      },
      {
        type: 'callout',
        variant: 'warning',
        content: 'Always enforce a 5-minute freshness window on the timestamp parameter before accepting the delivery. Without a freshness check, an attacker who captures a single delivery can replay it indefinitely. The freshness check combined with HMAC verification provides defense against both forgery and replay attacks.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Pause, Resume, and Delete',
      },
      {
        type: 'paragraph',
        content: 'Subscriptions can be paused by setting active=false via PATCH /v1/webhooks/{id}. Pausing retains the subscription configuration but stops event delivery immediately; pending deliveries in flight are completed but no new deliveries are attempted. Pausing is preferred over deletion when the destination endpoint is undergoing planned maintenance or when debugging a downstream issue. Resumed subscriptions begin receiving events for new occurrences only; missed events during the paused window are not backfilled.',
      },
      {
        type: 'paragraph',
        content: 'DELETE /v1/webhooks/{id} permanently removes the subscription. The operation is irreversible; to resume deliveries, a new subscription must be created with a fresh secret. Deletion does not require confirmation tokens; if you need a soft-delete workflow, use the active=false pause path instead. After deletion, the id cannot be reused; new subscriptions always receive a freshly generated ULID.',
      },
      {
        type: 'steps',
        items: [
          'Provision an HTTPS endpoint on your receiving service capable of accepting POST requests.',
          'Call POST /v1/webhooks with the URL, event list, and an optional description.',
          'Store the returned secret value (whsec_xxx) in your secret manager immediately; it is not retrievable later.',
          'Implement signature verification in your endpoint handler using the stored secret.',
          'Respond to the verification ping within 10 seconds with X-LeadReach-Verify-Token echoing the challenge value.',
          'Confirm subscription status transitions from pending_verification to active via GET /v1/webhooks/{id}.',
          'Subscribe to a low-volume event (e.g., campaign.started) for initial smoke testing before enabling high-volume events.',
        ],
      },
      {
        type: 'list',
        items: [
          'POST /v1/webhooks — create subscription with URL, events, and metadata; secret returned once.',
          'GET /v1/webhooks — list subscriptions in the calling workspace.',
          'GET /v1/webhooks/{id} — retrieve a single subscription by ULID.',
          'PATCH /v1/webhooks/{id} — update URL, events, active, or description.',
          'POST /v1/webhooks/{id}/rotate-secret — generate a new secret; old secret immediately invalidated.',
          'DELETE /v1/webhooks/{id} — permanently remove the subscription.',
          'GET /v1/webhooks/{id}/deliveries — list recent delivery attempts for debugging.',
        ],
      },
      {
        type: 'paragraph',
        content: 'The GET /v1/webhooks/{id}/deliveries endpoint is invaluable for debugging integration issues. It returns the last 100 delivery attempts with timestamps, HTTP status codes returned by the endpoint, request and response body sizes, and retry attempt numbers. Delivery records are retained for 30 days and are not paginated; older records can be retrieved from the workspace audit log if needed for compliance purposes. The endpoint is read-only and does not consume webhook delivery quota.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Webhook Health Monitoring',
      },
      {
        type: 'paragraph',
        content: 'LeadReach exposes three core health metrics for every webhook subscription: delivery_success_rate (percentage of deliveries that received a 2xx on the first attempt), delivery_retry_rate (percentage requiring at least one retry), and dlq_depth (current dead-letter queue size). These metrics are surfaced on the dashboard per subscription, with the ability to filter by event type and time window. Enterprise workspaces can export these metrics to Datadog, New Relic, or Prometheus via the metrics export integration, which pushes per-minute snapshots every 60 seconds. Setting alerts on delivery_success_rate below 95% for 5 minutes and dlq_depth above 50 provides early warning of receiver-side incidents before they impact business workflows dependent on the webhook integration.',
      },
      {
        type: 'paragraph',
        content: 'When a delivery failure alert fires, the standard triage workflow begins with fetching failed deliveries via GET /v1/webhooks/{id}/deliveries?status=failed, inspecting the http_status and error_message fields to identify the root cause, and confirming the receiver-side issue has been resolved before redelivering. The redelivery endpoint POST /v1/webhooks/{id}/deliveries/{event_id}/redeliver accepts a single event id; for bulk redelivery, the POST /v1/webhooks/{id}/redeliver-batch endpoint accepts up to 100 event ids in a single request. After redelivery, poll GET /v1/webhooks/{id}/deliveries?status=delivered to confirm successful processing. Subscriptions that consistently fail more than 5% of deliveries over a 1-hour window should be paused pending root-cause analysis; continuing to deliver into a broken endpoint wastes delivery budget and inflates DLQ depth unnecessarily.',
      },
      {
        type: 'table',
        caption: 'Webhook health monitoring metrics and thresholds',
        headers: ['Metric', 'Healthy Range', 'Warning Threshold', 'Critical Threshold'],
        rows: [
          ['delivery_success_rate', '99% to 100%', '95% to 99%', 'Below 95%'],
          ['delivery_retry_rate', '0% to 1%', '1% to 5%', 'Above 5%'],
          ['dlq_depth', '0 events', '1 to 50 events', 'Above 50 events'],
          ['P99 delivery latency', 'Below 500ms', '500ms to 2s', 'Above 2s'],
          ['Verification time', 'Below 10s', '10s to 30s', 'Above 30s'],
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'Subscription Rotation & Secret Management',
      },
      {
        type: 'paragraph',
        content: 'Webhook subscription secrets should be rotated at least every 90 days following the same dual-key pattern used for API keys. The rotation workflow begins by calling POST /v1/webhooks/{id}/rotate-secret, which generates a new secret and immediately invalidates the old one; deliveries in flight at the moment of rotation use the old secret, but new deliveries use the new secret within 60 seconds of propagation. Receivers must therefore accept deliveries signed with either the old or new secret during the propagation window, which is best implemented by storing both secrets in a list and trying each one during signature verification. After 60 seconds, remove the old secret from the list. The dashboard surfaces a Rotation Due badge on any subscription whose secret is older than 80 days, and the management API returns a rotation_due_at timestamp on each subscription object. Subscriptions that miss rotation by more than 14 days are flagged in the weekly security digest email sent to the workspace owner and security contact. For workspaces subject to PCI DSS or HIPAA compliance requirements, secret rotation can be automated via the management API using a scheduled job in your CI/CD pipeline; the job should run weekly, identify subscriptions with rotation_due_at within the next 7 days, rotate them, and update the secret in the receiver secret manager atomically. For multi-environment deployments (dev, staging, prod), provision separate subscriptions per environment with separate secrets; this isolates blast radius if a secret is leaked and simplifies the rotation workflow since each environment secrets can be rotated independently on different schedules. All secret rotation events are recorded in the audit log with the actor, timestamp, and subscription id, providing a complete trail for compliance evidence collection.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Subscription Limits & Multi-Tenant Patterns',
      },
      {
        type: 'paragraph',
        content: 'Each workspace supports up to 500 webhook subscriptions. This limit is intended to cover the typical multi-tenant, multi-environment, and multi-event-type patterns without exceeding the management burden of a single workspace. Workspaces that require more than 500 subscriptions should contact support to discuss a custom limit; this typically involves an architectural review to ensure the higher subscription count is justified rather than a misconfiguration such as provisioning one subscription per lead. For multi-tenant SaaS integrations where each tenant needs an isolated subscription, consider partitioning tenants across multiple workspaces; LeadReach supports workspace-to-workspace federation via the cross-workspace events API, which allows a single receiver to subscribe to events across multiple workspaces with per-tenant routing metadata.',
      },
      {
        type: 'divider',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Error Codes & Handling
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'api-errors',
    title: 'Error Codes & Handling',
    description: 'Understand the LeadReach error envelope, HTTP status code semantics, and best practices for handling 4xx and 5xx responses with retries.',
    category: 'API Reference',
    readTime: '7 min read',
    lastUpdated: '2024-11-15',
    blocks: [
      {
        type: 'paragraph',
        content: 'LeadReach uses a consistent error envelope across all API responses with non-2xx status codes. The envelope exposes a machine-readable code field for branching client logic, a human-readable message field for surfacing in logs and UIs, and an optional details object carrying structured context such as field-level validation errors or required scopes. The envelope is identical regardless of the underlying cause (authentication, validation, rate limiting, server error), simplifying client error-handling code.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Error Envelope Schema',
      },
      {
        type: 'paragraph',
        content: 'Every error response is a JSON object with a single top-level error field. The error object contains code (string snake_case identifier), message (human-readable English description), and details (object with arbitrary nested fields). A request_id field is always present in details, matching the X-Request-Id header for end-to-end tracing. Some error codes carry additional fields in details such as scopes_required, retry_after, or field_path, which can be programmatically consumed by client integrations.',
      },
      {
        type: 'code',
        language: 'json',
        caption: 'Canonical error envelope structure',
        code: `{
  "error": {
    "code": "validation_failed",
    "message": "Request body failed validation.",
    "details": {
      "request_id": "req_8f3a2b1c9d4e7f06",
      "errors": [
        {
          "field": "email",
          "code": "invalid_format",
          "message": "Email must be a valid RFC 5322 address."
        }
      ]
    }
  }
}`,
      },
      {
        type: 'heading',
        level: 2,
        content: 'Sample Error Request',
      },
      {
        type: 'paragraph',
        content: 'The following curl request triggers a 401 Unauthorized response by omitting the Authorization header. Inspecting the response body illustrates the error envelope in a real-world context: the code field is the machine-readable identifier, the message field is human-readable, and the details.request_id field is the same value echoed in the X-Request-Id response header for end-to-end tracing. This same envelope shape is used for all 4xx and 5xx responses regardless of the underlying cause, simplifying client error-handling code.',
      },
      {
        type: 'code',
        language: 'bash',
        caption: 'Request and response illustrating a 401 authentication_required error',
        code: `curl -i https://api.leadreach.ai/v1/leads?limit=1

HTTP/2 401
content-type: application/json
x-request-id: req_8f3a2b1c9d4e7f06

{
  "error": {
    "code": "authentication_required",
    "message": "Missing or invalid Authorization header.",
    "details": {
      "request_id": "req_8f3a2b1c9d4e7f06",
      "documentation_url": "https://docs.leadreach.ai/api-reference/api-auth"
    }
  }
}`,
      },
      {
        type: 'heading',
        level: 2,
        content: 'HTTP Status Code Semantics',
      },
      {
        type: 'paragraph',
        content: 'LeadReach follows standard HTTP status code conventions. 200 OK indicates a successful read or PATCH response. 201 Created indicates a successful POST that created a new resource. 202 Accepted indicates an asynchronous operation has been queued. 204 No Content indicates a successful DELETE or a PATCH that returns no body. 4xx codes indicate client errors; the request should not be retried without modification. 5xx codes indicate server errors and are generally safe to retry with exponential backoff.',
      },
      {
        type: 'table',
        caption: 'HTTP status code reference',
        headers: ['Status', 'Meaning', 'Retryable', 'Common Cause'],
        rows: [
          ['200', 'OK', 'n/a', 'Successful read or partial update.'],
          ['201', 'Created', 'n/a', 'Successful POST creating a new resource.'],
          ['202', 'Accepted', 'n/a', 'Asynchronous operation queued.'],
          ['204', 'No Content', 'n/a', 'Successful DELETE or empty PATCH.'],
          ['400', 'Bad Request', 'No', 'Malformed JSON or validation failure.'],
          ['401', 'Unauthorized', 'No', 'Missing or invalid Authorization header.'],
          ['403', 'Forbidden', 'No', 'Valid token but insufficient scope or cross-tenant access.'],
          ['404', 'Not Found', 'No', 'Resource does not exist in the calling workspace.'],
          ['409', 'Conflict', 'No', 'Idempotency conflict or duplicate resource.'],
          ['422', 'Unprocessable Entity', 'No', 'Semantic validation failure (e.g., invalid state transition).'],
          ['429', 'Too Many Requests', 'Yes (with delay)', 'Rate limit or concurrency cap exceeded.'],
          ['500', 'Internal Server Error', 'Yes', 'Unexpected server-side failure.'],
          ['502', 'Bad Gateway', 'Yes', 'Upstream service unreachable.'],
          ['503', 'Service Unavailable', 'Yes', 'Transient outage or maintenance.'],
          ['504', 'Gateway Timeout', 'Yes', 'Upstream service did not respond within deadline.'],
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'Common Error Codes',
      },
      {
        type: 'paragraph',
        content: 'The error code field is the canonical identifier for branching client logic. Codes are stable across API versions; new codes may be added but existing codes are never renamed or removed without a major version bump. The table below lists the most frequently encountered codes; the full list is available in the API changelog and is also discoverable via GET /v1/errors (an introspection endpoint useful for client library generation).',
      },
      {
        type: 'table',
        caption: 'Most common error codes',
        headers: ['Code', 'HTTP Status', 'Meaning', 'Recommended Handling'],
        rows: [
          ['authentication_required', '401', 'Missing or malformed Authorization header.', 'Refresh API key and retry once.'],
          ['invalid_token', '401', 'Token signature is invalid or has been revoked.', 'Rotate the key and update client config.'],
          ['insufficient_scope', '403', 'Token lacks the scopes required for the endpoint.', 'Provision a new key with the missing scopes.'],
          ['cross_tenant_forbidden', '403', 'Resource id is outside the calling workspace.', 'Verify the resource id and workspace context.'],
          ['not_found', '404', 'Requested resource does not exist.', 'Do not retry; surface to caller.'],
          ['validation_failed', '400', 'Request body failed schema validation.', 'Inspect details.errors array and surface per-field messages.'],
          ['invalid_state_transition', '409', 'Requested state change is not permitted from current state.', 'Refresh resource state and retry only if appropriate.'],
          ['idempotency_conflict', '409', 'Idempotency-Key reused with different payload.', 'Use a new key or replay the original payload exactly.'],
          ['rate_limit_exceeded', '429', 'Per-minute rate limit exceeded.', 'Wait Retry-After seconds and retry.'],
          ['concurrent_request_limit_exceeded', '429', 'Concurrent in-flight request cap exceeded.', 'Reduce worker pool size and retry.'],
          ['lead_quota_exceeded', '402', 'Workspace monthly lead quota reached.', 'Upgrade plan or wait for next month reset.'],
          ['internal_server_error', '500', 'Unhandled server-side exception.', 'Retry with exponential backoff.'],
          ['service_unavailable', '503', 'Transient outage or scheduled maintenance.', 'Retry with exponential backoff; check status page.'],
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'Idempotency Conflicts',
      },
      {
        type: 'paragraph',
        content: 'Idempotency-Key reuse is the most common source of 409 responses for write endpoints. Each idempotency key is bound to the request payload hash; reusing the same key with a different payload within 24 hours returns 409 with code idempotency_conflict and details.original_request_id pointing to the first request that established the key. To resolve, either generate a fresh key or replay the original payload byte-for-byte, in which case the original response is returned rather than a 409. This semantic enables safe client retries after network interruptions.',
      },
      {
        type: 'paragraph',
        content: 'Idempotency keys are retained for 24 hours after the most recent use; a key not used for 24 hours is eligible for reuse, though LeadReach recommends treating keys as one-shot for clarity. Keys must be between 16 and 255 characters and may contain alphanumeric characters, hyphens, and underscores. Keys containing other characters return 400 with code invalid_idempotency_key. The key namespace is per-workspace; the same key can be reused across different workspaces without conflict.',
      },
      {
        type: 'callout',
        variant: 'info',
        content: 'When implementing client-side retries, always pair the Idempotency-Key with the original request payload. If the original request succeeded but the response was lost due to network failure, retrying with the same key and payload returns the original successful response rather than creating a duplicate resource. This is the cornerstone of safe retry behavior for write operations.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Retry Strategy for 5xx Responses',
      },
      {
        type: 'paragraph',
        content: 'Server-side errors (5xx) are generally safe to retry. The recommended strategy is exponential backoff with full jitter, capped at 60 seconds per attempt and 5 attempts total. On each retry, send the same X-Request-Id and Idempotency-Key so that the failed requests can be collapsed into a single logical transaction during incident review. Avoid retrying 5xx responses that include details.not_retryable=true, which is set when the underlying error is known to be deterministic on retry (e.g., a downstream service returned a permanent 4xx wrapped as 502).',
      },
      {
        type: 'code',
        language: 'bash',
        caption: 'Sample 503 response body with retry guidance',
        code: `{
  "error": {
    "code": "service_unavailable",
    "message": "The LeadReach API is temporarily unavailable. Please retry.",
    "details": {
      "request_id": "req_8f3a2b1c9d4e7f06",
      "retry_after": 5,
      "retryable": true,
      "incident_id": "INC-2024-11-15-003"
    }
  }
}`,
      },
      {
        type: 'paragraph',
        content: 'The retryable field in details indicates whether the operation is safe to retry. For 5xx responses where the underlying operation is non-idempotent (e.g., a POST without an Idempotency-Key), LeadReach sets retryable=false to prevent the client from accidentally creating duplicate side effects. In these cases, the client should refresh the resource state via GET before deciding whether to retry the write operation.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Validation Error Details',
      },
      {
        type: 'paragraph',
        content: 'Validation failures return 400 with code validation_failed and a details.errors array listing per-field violations. Each entry in the errors array contains field (dot-separated path), code (machine-readable), and message (human-readable). This structure allows client integrations to surface per-field errors directly in form UIs without parsing the message string. The endpoint also returns details.error_count to enable quick threshold checks ("if more than 5 validation errors, abort the batch").',
      },
      {
        type: 'list',
        items: [
          'Always inspect the error.code field rather than parsing the message string for branching logic.',
          'Capture details.request_id in logs alongside the X-Request-Id header for cross-system tracing.',
          'For 429 responses, honor the Retry-After header value before retrying.',
          'For 5xx responses, retry up to 5 times with exponential backoff and full jitter.',
          'For 4xx responses, do not retry without modifying the request.',
          'Surface details.errors[].message directly in form UIs when present.',
          'Subscribe to status.leadreach.ai for real-time incident notifications affecting 5xx rates.',
        ],
      },
      {
        type: 'steps',
        items: [
          'Inspect the HTTP status code to classify the failure as client (4xx) or server (5xx) error.',
          'Parse the error.code field from the response body to determine the machine-readable failure reason.',
          'Capture details.request_id in your logs for end-to-end tracing during incident triage.',
          'For 4xx responses, surface the per-field validation errors from details.errors array in form UIs.',
          'For 401 responses, refresh the API key from your secret manager and retry once.',
          'For 403 responses with code insufficient_scope, provision a new key with the missing scopes.',
          'For 429 responses, honor the Retry-After header value before retrying the request.',
          'For 5xx responses, retry up to 5 times with exponential backoff and full jitter.',
          'For 5xx responses with details.retryable=false, do not retry; investigate the root cause.',
          'Surface terminal failures to the caller and emit a metric event for trend analysis.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'Observability & Incident Response',
      },
      {
        type: 'paragraph',
        content: 'Every API response, including errors, includes a request_id field that propagates through LeadReach internal logging, metrics, and audit systems. Capturing this identifier in your application logs alongside the X-Request-Id header enables end-to-end tracing during incident triage; when reporting an issue to LeadReach support, including the request_id reduces mean time to resolution by approximately 60 percent based on internal support analytics. For production integrations, instrument your API client to emit a metric event on every non-2xx response with the request_id, error code, HTTP status, and endpoint as labels. Aggregating these metrics by error code over rolling 5-minute windows surfaces trends that single-error inspection would miss, such as a gradual increase in 429 responses indicating approaching rate limit exhaustion.',
      },
      {
        type: 'paragraph',
        content: 'During a LeadReach platform incident, the status page at status.leadreach.ai is the authoritative source of truth and is updated within 5 minutes of incident declaration. The status page exposes a JSON API at status.leadreach.ai/api/v2/status.json that can be polled every 60 seconds for automated alerting; subscribing to the status page webhook integration delivers incident notifications directly to your incident response tool (PagerDuty, Opsgenie, and similar) without polling. During an active incident affecting your workspace, suppress non-critical retry logic to avoid amplifying load on the recovering platform; resume normal retry behavior only after the status page reflects all-green. Post-incident, LeadReach publishes a post-mortem within 5 business days at status.leadreach.ai/incidents/{id} describing root cause, customer impact, and remediation steps.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Client Library Patterns',
      },
      {
        type: 'paragraph',
        content: 'Official LeadReach client libraries for Python, Node.js, Go, and Ruby ship with built-in error handling that follows the recommendations in this document: exponential backoff with full jitter for 5xx responses, immediate failure for 4xx responses (with the exception of 429), idempotency key generation for write operations, and structured logging of the request_id field on every response. The libraries also expose a hooks API that allows application code to attach custom logic before request dispatch, after response receipt, and on error events; this is the recommended extension point for application-specific concerns like custom metrics emission or circuit breaker integration. For workloads that cannot use the official libraries, LeadReach publishes an OpenAPI specification at docs.leadreach.ai/openapi.json that can be used to generate client bindings in any language with OpenAPI tooling. The generated clients will not include the built-in retry logic, so custom retry logic must be implemented following the patterns documented here. The OpenAPI specification is versioned in lockstep with the REST API; consumers should regenerate bindings whenever the API version is bumped to pick up new endpoints, fields, and error codes.',
      },
      {
        type: 'divider',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Webhook Events — Available Event Types
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'webhook-events',
    title: 'Available Event Types',
    description: 'Reference of every event type LeadReach emits, grouped by resource category, including payload field summaries and trigger conditions.',
    category: 'API Reference',
    readTime: '8 min read',
    lastUpdated: '2024-11-15',
    blocks: [
      {
        type: 'paragraph',
        content: 'LeadReach emits webhook events for every meaningful state change across leads, campaigns, and outreach activities. Events are categorized by the resource they describe: lead.* events fire when leads are created, enriched, scored, qualified, or stage-changed; campaign.* events fire when campaigns transition lifecycle states; outreach.* events fire when individual outreach messages are sent, opened, clicked, or replied to. Each event type has a stable, versioned schema documented in the payload schemas reference.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Event Naming Convention',
      },
      {
        type: 'paragraph',
        content: 'Event types follow the pattern resource.action in snake_case. The resource segment is always singular (lead, not leads) and the action segment is always past tense for completed events (created, enriched, qualified) or present tense for state changes (stage_changed). Event types are immutable once published; breaking schema changes are released under new event type suffixes (e.g., lead.created.v2) and the original event continues to fire alongside the new one for at least 12 months to allow migration.',
      },
      {
        type: 'paragraph',
        content: 'Subscriptions can be filtered by event type at the moment of creation; an events array containing one or more type strings limits deliveries to matching events only. The wildcard "*" subscribes to all current and future event types, which is convenient for development but is not recommended for production since it increases delivery volume and exposes the receiver to schema changes from new event types. Production subscriptions should always enumerate the specific event types they handle.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Lead Lifecycle Events',
      },
      {
        type: 'paragraph',
        content: 'Lead events fire whenever a lead record is created or undergoes a meaningful state change. The lead.created event fires on POST /v1/leads and on bulk upserts that result in new records. The lead.enriched event fires when enrichment completes, whether triggered manually via POST /v1/leads/{id}/enrich or automatically by campaign routing rules. The lead.qualified event fires when the AI scoring engine determines a lead meets the qualification threshold configured for the workspace; this typically coincides with a stage transition to qualified, but the event can also fire independently when qualification is detected before the stage is updated.',
      },
      {
        type: 'paragraph',
        content: 'The lead.score_updated event fires whenever the score field changes by more than 0.5 points; smaller deltas are silently absorbed to avoid noisy delivery. The lead.stage_changed event fires on every PATCH that changes the stage field, regardless of who initiated the change (API, dashboard, or agent). This event is particularly important for CRM integrations that mirror LeadReach funnel stage in their own pipeline stages.',
      },
      {
        type: 'table',
        caption: 'Lead lifecycle event types',
        headers: ['Event Type', 'Trigger', 'Key Payload Fields'],
        rows: [
          ['lead.created', 'New lead record created.', 'lead.id, lead.email, lead.campaign_id, source'],
          ['lead.enriched', 'Enrichment pipeline completed.', 'lead.id, enriched_fields[], data_freshness'],
          ['lead.qualified', 'AI engine flagged the lead as qualified.', 'lead.id, lead.score, qualifying_factors[]'],
          ['lead.score_updated', 'Lead score changed by > 0.5 points.', 'lead.id, previous_score, new_score'],
          ['lead.stage_changed', 'Lead stage transitioned.', 'lead.id, previous_stage, new_stage, actor'],
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'Campaign Lifecycle Events',
      },
      {
        type: 'paragraph',
        content: 'Campaign events fire on lifecycle transitions only; routine configuration changes (PATCH to daily_cap or messaging_strategy) do not emit events to avoid delivery volume inflation. The campaign.started event fires on POST /v1/campaigns/{id}/start and on the automatic scheduled start when start_at is reached. The campaign.completed event fires when the campaign transitions to completed, either via end_at auto-trigger or via an explicit PATCH with status=completed.',
      },
      {
        type: 'paragraph',
        content: 'The campaign.paused event fires on POST /v1/campaigns/{id}/pause. There is no separate campaign.resumed event; resuming a paused campaign fires campaign.started again, with the metadata.is_resume flag set to true. This design simplifies subscription filtering for receivers that only care about the active state. Both campaign events include the actor field in the metadata block, identifying whether the transition was triggered by API call, dashboard user, scheduled trigger, or system automation.',
      },
      {
        type: 'table',
        caption: 'Campaign lifecycle event types',
        headers: ['Event Type', 'Trigger', 'Key Payload Fields'],
        rows: [
          ['campaign.started', 'Campaign transitioned to started status.', 'campaign.id, actor, is_resume'],
          ['campaign.paused', 'Campaign transitioned to paused status.', 'campaign.id, actor, reason'],
          ['campaign.completed', 'Campaign transitioned to completed status.', 'campaign.id, actor, final_metrics{}'],
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'Outreach Activity Events',
      },
      {
        type: 'paragraph',
        content: 'Outreach events fire on individual message interactions during campaign execution. The outreach.sent event fires when an AI agent composes and dispatches a message; the payload includes the agent id, channel, lead id, and message id for end-to-end tracing. The outreach.opened event fires when a tracking pixel is loaded or when an email client renders the message; LeadReach deduplicates opens within a 30-minute window per recipient to avoid noisy delivery.',
      },
      {
        type: 'paragraph',
        content: 'The outreach.clicked event fires when a recipient clicks any tracked link in the message; the payload includes the link URL and a click_index for messages with multiple links. The outreach.replied event fires when a reply is detected via inbound email parsing; the payload includes the reply body (truncated to 4KB) and a sentiment score computed by the AI engine. All outreach events include the campaign_id and lead_id in the top-level metadata block for routing in CRM integrations.',
      },
      {
        type: 'table',
        caption: 'Outreach activity event types',
        headers: ['Event Type', 'Trigger', 'Key Payload Fields'],
        rows: [
          ['outreach.sent', 'AI agent dispatched an outreach message.', 'message.id, lead.id, campaign.id, channel, agent.id'],
          ['outreach.opened', 'Recipient opened the message (tracking pixel).', 'message.id, lead.id, opened_at, client_info'],
          ['outreach.clicked', 'Recipient clicked a tracked link.', 'message.id, lead.id, link.url, click_index'],
          ['outreach.replied', 'Recipient replied to the message.', 'message.id, lead.id, reply.body, sentiment_score'],
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'Sample Subscription Request',
      },
      {
        type: 'paragraph',
        content: 'The following curl request creates a webhook subscription filtered to the lead.created and lead.stage_changed event types. The events array restricts deliveries to only matching events, which keeps the receiving endpoint focused on the lifecycle transitions relevant to the integration. The Idempotency-Key header ensures that retrying the request with the same key returns the originally created subscription rather than creating a duplicate. After successful creation, LeadReach sends a verification ping to the configured URL to confirm ownership before activating the subscription.',
      },
      {
        type: 'code',
        language: 'bash',
        caption: 'Create a subscription filtered to specific event types',
        code: `curl -X POST https://api.leadreach.ai/v1/webhooks \\
  -H "Authorization: Bearer lr_live_4f9c2a8e7b1d6034ab12cd56ef9087ab" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: idem_webhook_lead_lifecycle_v1" \\
  -H "X-Request-Id: req_8f3a2b1c9d4e7f06" \\
  -d '{
    "url": "https://hooks.crm.example.com/leadreach/lifecycle",
    "events": ["lead.created", "lead.stage_changed"],
    "description": "Lead lifecycle sync - CRM"
  }'`,
      },
      {
        type: 'heading',
        level: 2,
        content: 'Sample Event Delivery',
      },
      {
        type: 'paragraph',
        content: 'When a lead is created after the subscription is active, LeadReach delivers a POST request to the configured URL with a JSON body conforming to the event schema documented in the payload schemas reference. The following example shows a lead.created delivery; the top-level envelope carries stable routing fields while the data block carries the resource-specific payload. The signature is computed by HMAC-SHA256 over the timestamp concatenated with the raw body and is validated on the receiver side before any business logic processes the payload.',
      },
      {
        type: 'code',
        language: 'json',
        caption: 'Sample lead.created event delivery body',
        code: `{\n  "id": "evt_01HZX4W7N8X9P3M2K1QJ5R6VT8",\n  "type": "lead.created",\n  "api_version": "2024-11-15",\n  "created_at": "2024-11-15T08:02:11Z",\n  "data": {\n    "lead": {\n      "id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",\n      "email": "jordan.lee@northstar.io",\n      "first_name": "Jordan",\n      "last_name": "Lee",\n      "company": "Northstar Analytics",\n      "stage": "new",\n      "source_channel": "outbound",\n      "campaign_id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",\n      "created_at": "2024-11-15T08:02:11Z"\n    },\n    "source": "api"\n  },\n  "metadata": {\n    "subscription_id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",\n    "delivery_attempt": 1,\n    "workspace_id": "ws_01HZX4W7N8X9P3M2K1QJ5R6VT8"\n  }\n}`,
      },
      {
        type: 'heading',
        level: 2,
        content: 'Event Versioning & Compatibility',
      },
      {
        type: 'paragraph',
        content: 'Event schemas are versioned independently from the REST API version. The current event schema version is 2024-11-15 and is included in every delivery as the api_version field in the top-level envelope. LeadReach guarantees backward compatibility within a schema version: fields may be added but never removed or renamed within a version. Breaking changes are released under a new version string and announced at least 90 days in advance via the API changelog and a dedicated email to the workspace owner.',
      },
      {
        type: 'paragraph',
        content: 'Subscriptions can pin to a specific schema version by including the api_version field at subscription creation time. If omitted, the subscription defaults to the workspace default version, which is the latest GA version. Pinning is recommended for production integrations that depend on stable field names; the dashboard surfaces a migration banner 60 days before a pinned version is scheduled for deprecation.',
      },
      {
        type: 'callout',
        variant: 'tip',
        content: 'For development, create a subscription with the wildcard "*" event filter and a temporary HTTPS endpoint (e.g., webhook.site or a local tunnel via ngrok). This lets you observe the full set of events your workspace produces and decide which subset you actually need before promoting the subscription to production.',
      },
      {
        type: 'list',
        items: [
          'lead.created — fired on every new lead, including bulk upserts that create new records.',
          'lead.enriched — fired when enrichment completes; payload lists enriched fields and data freshness.',
          'lead.qualified — fired when the AI scoring engine crosses the qualification threshold.',
          'lead.score_updated — fired on score deltas greater than 0.5 points.',
          'lead.stage_changed — fired on every stage transition regardless of actor.',
          'campaign.started — fired on start and scheduled start; is_resume flag distinguishes the two.',
          'campaign.paused — fired on pause; reason field optional.',
          'campaign.completed — fired on completion; payload includes final aggregated metrics.',
          'outreach.sent — fired when a message is composed and dispatched by an AI agent.',
          'outreach.opened — fired on message open, deduplicated per 30-minute window.',
          'outreach.clicked — fired per tracked link click; includes link URL.',
          'outreach.replied — fired on inbound reply; payload includes reply body and sentiment score.',
        ],
      },
      {
        type: 'steps',
        items: [
          'Identify the event types your integration requires; enumerate them explicitly rather than using the wildcard "*".',
          'Provision an HTTPS endpoint on your receiving service with a valid public-CA certificate.',
          'Call POST /v1/webhooks with the URL, events array, and an optional description.',
          'Store the returned secret value in your secret manager immediately; it is not retrievable later.',
          'Implement HMAC signature verification using the stored secret before any business logic processes the payload.',
          'Complete the verification ping by echoing the challenge token in the X-LeadReach-Verify-Token response header.',
          'Confirm the subscription status transitions from pending_verification to active via GET /v1/webhooks/{id}.',
          'Subscribe to a low-volume event (e.g., campaign.started) for initial smoke testing before enabling high-volume events.',
        ],
      },
      {
        type: 'paragraph',
        content: 'Event delivery order is not strictly guaranteed within a single resource. For example, lead.created and lead.score_updated may arrive in either order if the scoring pipeline completes before the creation delivery is dispatched. Receivers must tolerate out-of-order arrival and use the event timestamp field for state reconciliation rather than the arrival order. For tight ordering requirements, LeadReach recommends polling GET /v1/leads/{id} after processing a batch of events to reconcile state authoritatively.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Event Filtering Patterns',
      },
      {
        type: 'paragraph',
        content: 'Beyond static event type filters, LeadReach supports payload-based filtering via the filter field on the subscription object. Filters are expressed as a JSON object with field paths as keys and acceptable values as arrays; for example, a filter that restricts deliveries to events where the lead is associated with a specific campaign would use the data.lead.campaign_id field path. Filters support equality, in, and prefix matching; complex boolean logic is not supported and should be implemented on the receiver side. Filtering at the subscription level reduces delivery volume and receiver-side processing cost, but it also means that events outside the filter are silently dropped with no audit trail in the receiver; for compliance-sensitive workloads, prefer broad filters with receiver-side deduplication over tight subscription-level filters.',
      },
      {
        type: 'paragraph',
        content: 'A common pattern for multi-tenant integrations is to provision a single webhook subscription with the wildcard event filter and route deliveries to a dispatcher service that fans out to per-tenant queues based on the metadata.workspace_id field. This pattern reduces the number of subscriptions to manage and centralizes signature verification, but it requires the dispatcher to be highly available since a single point of failure affects every tenant. For workloads where per-tenant isolation is required (e.g., SOC 2 evidence collection, regulatory data residency), provision a separate subscription per tenant with the workspace_id filter set explicitly; LeadReach supports up to 500 subscriptions per workspace.',
      },
      {
        type: 'divider',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 8. Webhook Setup & Verification
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'webhook-setup',
    title: 'Webhook Setup & Verification',
    description: 'Step-by-step guide to provisioning a webhook endpoint, completing the verification handshake, and validating HMAC signatures on incoming deliveries.',
    category: 'API Reference',
    readTime: '9 min read',
    lastUpdated: '2024-11-15',
    blocks: [
      {
        type: 'paragraph',
        content: 'Webhook setup in LeadReach follows a three-phase handshake: subscription creation, endpoint verification, and signature validation on subsequent deliveries. Each phase must be completed correctly to ensure that the receiving endpoint receives and trusts event deliveries. This guide walks through each phase with concrete code examples and explains the rationale behind the design choices, including the verification challenge, the HMAC signing scheme, and the timestamp freshness check that prevents replay attacks.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Phase 1: Provision an HTTPS Endpoint',
      },
      {
        type: 'paragraph',
        content: 'Before creating a subscription, you must provision an HTTPS endpoint on your receiving service capable of accepting POST requests with JSON bodies up to 256KB. The endpoint must respond with a 2xx status code within 10 seconds for routine deliveries and within 30 seconds for the initial verification ping. The endpoint URL must use HTTPS with a valid certificate signed by a public CA; self-signed certificates are rejected by the LeadReach delivery worker. The hostname must be publicly routable, or registered as a private integration via LeadReach Connect for internal endpoints.',
      },
      {
        type: 'paragraph',
        content: 'The endpoint must tolerate duplicate deliveries and treat each delivery as idempotent based on the event id field in the payload. LeadReach uses an at-least-once delivery semantic, meaning the same event may arrive more than once in failure scenarios such as network blips or receiver-side timeouts. Receivers that mutate state on event delivery must key their deduplication on event id and tolerate receiving the same event id multiple times within a 24-hour window.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Phase 2: Subscription Creation & Verification Ping',
      },
      {
        type: 'paragraph',
        content: 'Creating the subscription via POST /v1/webhooks triggers an immediate verification ping to the configured URL. The ping is a standard webhook delivery with event type webhook.verify and a challenge token in the data block. Your endpoint must respond with a 2xx status code and include the X-LeadReach-Verify-Token response header echoing the challenge value. This proves that you control the endpoint URL and have not configured a third-party URL to receive LeadReach deliveries.',
      },
      {
        type: 'code',
        language: 'bash',
        caption: 'Verification ping request body sent by LeadReach',
        code: `POST /leadreach/v1 HTTP/1.1
Host: hooks.crm.example.com
Content-Type: application/json
X-LeadReach-Signature: t=1731652331,v1=4f9c2a8e7b1d6034ab12cd56ef9087ab1234567890abcdef
X-LeadReach-Event: webhook.verify

{
  "id": "evt_01HZX4W7N8X9P3M2K1QJ5R6VT8",
  "type": "webhook.verify",
  "api_version": "2024-11-15",
  "created_at": "2024-11-15T08:02:11Z",
  "data": {
    "subscription_id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",
    "challenge": "vrf_8f3a2b1c9d4e7f06a1b2c3d4e5f6a7b8"
  }
}`,
      },
      {
        type: 'code',
        language: 'bash',
        caption: 'Verification response expected by LeadReach',
        code: `HTTP/1.1 200 OK
Content-Type: application/json
X-LeadReach-Verify-Token: vrf_8f3a2b1c9d4e7f06a1b2c3d4e5f6a7b8

{
  "received": true
}`,
      },
      {
        type: 'paragraph',
        content: 'If the verification ping fails (non-2xx status, missing or mismatched verify token, or timeout), the subscription remains in the pending_verification status for up to 24 hours. LeadReach re-attempts verification every 5 minutes during this window. After 24 hours without successful verification, the subscription is automatically deactivated and the events array is set to an empty array; the subscription record itself is retained so the secret can be inspected later if needed. To retry verification after deactivation, PATCH the subscription with a fresh events array.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Phase 3: HMAC Signature Validation',
      },
      {
        type: 'paragraph',
        content: 'Every webhook delivery includes the X-LeadReach-Signature header containing two parameters: t (Unix timestamp at the moment of dispatch) and v1 (HMAC-SHA256 signature). The signature is computed as HMAC-SHA256 over the string t.raw_body where raw_body is the exact byte sequence of the request body. Receivers must compute the same HMAC using their stored subscription secret and compare it to the v1 value using a constant-time comparison to prevent timing side-channel attacks.',
      },
      {
        type: 'paragraph',
        content: 'Signature verification must happen before any business logic processes the payload. If the signature does not match, the receiver must respond with 400 Bad Request and discard the payload; responding 2xx to an unverified delivery would acknowledge an attacker-crafted payload and could mask a brute-force attack on the secret. The freshness check on the t parameter prevents replay of legitimate captured deliveries; LeadReach recommends rejecting deliveries with timestamps older than 5 minutes.',
      },
      {
        type: 'code',
        language: 'bash',
        caption: 'Signature verification in Python (Flask example)',
        code: `import hmac
import hashlib
import time
from flask import request, abort

def verify_leadreach_signature():
    signature_header = request.headers.get("X-LeadReach-Signature", "")
    params = dict(p.split("=", 1) for p in signature_header.split(","))
    timestamp = params.get("t")
    signature = params.get("v1")
    if not timestamp or not signature:
        abort(400)

    if abs(time.time() - int(timestamp)) > 300:
        abort(400)

    raw_body = request.get_data(as_text=True)
    payload = f"{timestamp}.{raw_body}"
    secret = current_app.config["LEADREACH_WEBHOOK_SECRET"]
    expected = hmac.new(
        secret.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(signature, expected):
        abort(400)`,
      },
      {
        type: 'steps',
        items: [
          'Provision an HTTPS endpoint on your receiving service with a valid public-CA certificate.',
          'Implement the request handler to read the raw body once and cache it for signature verification.',
          'Parse the X-LeadReach-Signature header into the t (timestamp) and v1 (signature) parameters.',
          'Reject the request immediately if the timestamp is older than 5 minutes.',
          'Compute HMAC-SHA256 over t.raw_body using the stored subscription secret.',
          'Compare the computed HMAC to v1 using a constant-time comparison function.',
          'If the signature matches, process the event idempotently and respond 2xx.',
          'If the signature does not match, respond 400 and log the failure for security review.',
          'For the webhook.verify event, also echo the challenge in the X-LeadReach-Verify-Token response header.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'Idempotency & Deduplication',
      },
      {
        type: 'paragraph',
        content: 'Each webhook delivery includes an event id field in the top-level payload envelope. This id is unique per event occurrence; retries of the same event share the same id. Receivers must implement deduplication keyed on event id, typically via a 24-hour TTL cache (Redis, DynamoDB, or a database table with a uniqueness constraint). If a delivery with a known event id arrives again, the receiver should respond 2xx without re-processing the payload; this prevents duplicate side effects such as double-billing or duplicate CRM activity log entries.',
      },
      {
        type: 'callout',
        variant: 'warning',
        content: 'Failure to deduplicate on event id is the single most common cause of integration bugs with LeadReach webhooks. Under retry scenarios, the same event can arrive 3 to 5 times within an hour. Without deduplication, downstream systems may receive duplicate activity records, duplicate notifications, or duplicate billing entries. Always treat webhook handlers as idempotent consumers keyed on event id.',
      },
      {
        type: 'heading',
      level: 2,
        content: 'Response Conventions',
      },
      {
        type: 'paragraph',
        content: 'LeadReach considers any 2xx response as a successful delivery. 3xx redirects are followed up to 3 hops; the final status code determines the outcome. 4xx and 5xx responses are treated as delivery failures and trigger the retry schedule described in the retry logic reference. The response body is ignored; LeadReach only inspects the status code. Receivers should respond as quickly as possible after signature verification, ideally within 1 second, even if background processing of the event takes longer. Long-running processing should be queued for asynchronous execution after the 2xx response is sent.',
      },
      {
        type: 'paragraph',
        content: 'Returning a non-2xx status code is the correct way to signal that the receiver could not process the delivery and that a retry is desired. Returning 2xx and silently discarding the payload is considered an anti-pattern because it prevents LeadReach from scheduling retries; if the discard was due to a transient receiver-side issue (e.g., database temporarily unreachable), the event is permanently lost from the receiver perspective and must be backfilled via the REST API.',
      },
      {
        type: 'table',
        caption: 'HTTP response status code conventions for webhook receivers',
        headers: ['Status Class', 'Meaning', 'LeadReach Behavior', 'Recommended Use'],
        rows: [
          ['2xx', 'Success', 'No retry; event marked delivered.', 'Use after successful processing or successful deduplication.'],
          ['3xx', 'Redirection', 'Followed up to 3 hops; final status decides.', 'Avoid; redirects complicate delivery tracking.'],
          ['4xx', 'Client error', 'Triggers retry schedule.', 'Use to signal transient receiver-side issues like DB unreachable.'],
          ['5xx', 'Server error', 'Triggers retry schedule.', 'Use to signal receiver crashed or unable to handle the delivery.'],
          ['Timeout', 'No response in 10s', 'Triggers retry schedule.', 'Avoid; long-running work should be queued asynchronously.'],
        ],
      },
      {
        type: 'list',
        items: [
          'Respond 2xx within 10 seconds for routine deliveries; within 30 seconds for the verification ping.',
          'Respond 4xx or 5xx to trigger the retry schedule for transient receiver-side issues.',
          'Never respond 2xx and silently discard the payload; either process or fail visibly.',
          'Cache the raw request body for HMAC verification before parsing the JSON envelope.',
          'Deduplicate on event id within a 24-hour window to handle retry deliveries safely.',
          'Echo the challenge value in X-LeadReach-Verify-Token for webhook.verify events only.',
          'Tolerate out-of-order deliveries; reconcile state via REST API for authoritative reads.',
        ],
      },
      {
        type: 'paragraph',
        content: 'For testing the verification flow without provisioning a public endpoint, LeadReach provides a sandbox mode in the dashboard that simulates the verification ping locally. The sandbox sends the ping to your localhost via a tunnel established by the LeadReach CLI, allowing you to debug the verification handshake in real time. Once verification succeeds in sandbox, the same endpoint configuration can be promoted to production by updating the URL via PATCH /v1/webhooks/{id}.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Production Hardening',
      },
      {
        type: 'paragraph',
        content: 'Webhook receivers in production should implement several hardening measures beyond the basic signature verification flow. First, instrument every delivery with structured logging that includes the event id, event type, subscription id, signature verification result, processing duration, and response status code. This logging is essential for incident triage and for measuring receiver-side performance over time. Second, implement a circuit breaker that opens when the receiver experiences sustained failures (e.g., 100 consecutive 5xx responses) to prevent cascading failures; when the breaker is open, respond with 503 immediately to trigger the retry schedule without invoking downstream processing. Third, provision a dedicated queue (SQS, Pub/Sub, Kafka) between the webhook receiver and the downstream processor to decouple ingestion from processing, enabling the receiver to respond 2xx within milliseconds even when processing takes minutes.',
      },
      {
        type: 'paragraph',
        content: 'For multi-region deployments, LeadReach always delivers from the region closest to the subscription URL; no special configuration is required for geo-distributed receivers. The delivery worker respects DNS TTL when resolving the subscription hostname, so changes to A records propagate within the TTL window. For blue-green deployments, update the subscription URL via PATCH /v1/webhooks/{id} and verify the new endpoint via the verification ping before redirecting production traffic; the previous URL continues to receive deliveries until the new URL is verified, ensuring zero-downtime cutover. For canary deployments, provision a second subscription pointing to the canary endpoint with a small events array (e.g., a single event type) to validate the new endpoint under low traffic before promoting it to full production.',
      },
      {
        type: 'list',
        items: [
          'Instrument every delivery with structured logging including event id, type, and processing duration.',
          'Implement a circuit breaker that opens after sustained failures to prevent cascading issues.',
          'Provision a dedicated queue between the receiver and downstream processor for decoupling.',
          'Update subscription URL via PATCH for blue-green deployments; previous URL stays active until verification completes.',
          'Use a separate subscription with a small events array for canary deployments before promotion.',
          'Monitor delivery_success_rate, dlq_depth, and P99 delivery latency as core health metrics.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'Endpoint Reliability Requirements',
      },
      {
        type: 'paragraph',
        content: 'Production webhook endpoints must meet several reliability requirements to ensure consistent delivery processing. The endpoint should be deployed across at least two availability zones to tolerate zone-level outages, with a load balancer that health-checks each instance and removes failing instances from rotation. The endpoint should have a target P99 response time below 500 milliseconds for signature verification and event dispatch, with long-running processing offloaded to a background queue to avoid approaching the 10-second delivery timeout. The endpoint should be sized to handle 2x the expected peak delivery rate to absorb bursts; for subscriptions with high event volume (e.g., outreach.sent during active campaigns), provision at least 4 receiver instances behind the load balancer. Endpoint TLS certificates should be renewed automatically via ACME (e.g., Let us Encrypt, AWS Certificate Manager) with at least 30 days of validity remaining at all times; expired certificates cause delivery failures that may go undetected for hours if monitoring is not in place. The dashboard surfaces a TLS Certificate Health widget that shows days-until-expiry for each subscription URL, with warning email sent to the workspace owner at 14 days and 7 days before expiry. For endpoints behind CDNs (e.g., Cloudflare, Fastly), ensure the CDN does not cache POST requests; most CDNs do not cache POSTs by default, but misconfigured cache rules can cause delivery failures that are difficult to diagnose.',
      },
      {
        type: 'divider',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 9. Webhook Payloads
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'webhook-payloads',
    title: 'Payload Schemas',
    description: 'Complete reference for the webhook delivery envelope and per-event payload schemas, including field types, sample values, and descriptions.',
    category: 'API Reference',
    readTime: '9 min read',
    lastUpdated: '2024-11-15',
    blocks: [
      {
        type: 'paragraph',
        content: 'Every webhook delivery from LeadReach uses a common envelope wrapping the event-specific payload. The envelope provides stable, versioned fields for routing and deduplication, while the data block carries the resource-specific payload that varies by event type. This document defines the envelope schema in full and provides complete payload schemas for each event type with field-level documentation, types, and sample values.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Common Envelope Schema',
      },
      {
        type: 'paragraph',
        content: 'The envelope is identical across all event types. The id field is a string prefixed with evt_ followed by a ULID; it is unique per event occurrence and is the canonical deduplication key. The type field carries the event type string (e.g., lead.created). The api_version field identifies the schema version, currently 2024-11-15. The created_at field is the ISO 8601 timestamp at which the underlying state change occurred, not the dispatch time; receivers should use this for state reconciliation rather than the arrival time.',
      },
      {
        type: 'table',
        caption: 'Common envelope fields',
        headers: ['Field', 'Type', 'Description'],
        rows: [
          ['id', 'string', 'Unique event identifier (evt_<ULID>). Deduplication key.'],
          ['type', 'string', 'Event type in resource.action format.'],
          ['api_version', 'string (date)', 'Schema version (YYYY-MM-DD).'],
          ['created_at', 'ISO 8601 string', 'Timestamp of the underlying state change.'],
          ['data', 'object', 'Event-specific payload; schema varies by type.'],
          ['metadata', 'object', 'Routing metadata: subscription_id, delivery_attempt, workspace_id.'],
        ],
      },
      {
        type: 'code',
        language: 'json',
        caption: 'Envelope structure common to all event types',
        code: `{
  "id": "evt_01HZX4W7N8X9P3M2K1QJ5R6VT8",
  "type": "lead.created",
  "api_version": "2024-11-15",
  "created_at": "2024-11-15T08:02:11Z",
  "data": {
    "lead": { "id": "01HZX4W7N8X9P3M2K1QJ5R6VT8", "email": "jordan.lee@northstar.io" }
  },
  "metadata": {
    "subscription_id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",
    "delivery_attempt": 1,
    "workspace_id": "ws_01HZX4W7N8X9P3M2K1QJ5R6VT8"
  }
}`,
      },
      {
        type: 'heading',
        level: 2,
        content: 'lead.created Payload',
      },
      {
        type: 'paragraph',
        content: 'Fires immediately after a lead record is created via POST /v1/leads or a bulk upsert that creates a new record. The payload includes the full lead object as it existed immediately after creation; subsequent updates via PATCH will fire lead.stage_changed or lead.score_updated events rather than a new lead.created. The source field in the data block indicates the origination channel (api, dashboard, agent, bulk_upsert, inbound_email) for routing in audit-trail integrations.',
      },
      {
        type: 'code',
        language: 'json',
        caption: 'lead.created payload',
        code: `{
  "id": "evt_01HZX4W7N8X9P3M2K1QJ5R6VT8",
  "type": "lead.created",
  "api_version": "2024-11-15",
  "created_at": "2024-11-15T08:02:11Z",
  "data": {
    "lead": {
      "id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",
      "email": "jordan.lee@northstar.io",
      "first_name": "Jordan",
      "last_name": "Lee",
      "company": "Northstar Analytics",
      "title": "VP of Engineering",
      "stage": "new",
      "tier": null,
      "score": null,
      "source_channel": "outbound",
      "campaign_id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",
      "custom_attributes": { "icp_fit": "high", "persona": "decision_maker" },
      "created_at": "2024-11-15T08:02:11Z"
    },
    "source": "api"
  },
  "metadata": {
    "subscription_id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",
    "delivery_attempt": 1,
    "workspace_id": "ws_01HZX4W7N8X9P3M2K1QJ5R6VT8"
  }
}`,
      },
      {
        type: 'heading',
        level: 2,
        content: 'lead.stage_changed Payload',
      },
      {
        type: 'paragraph',
        content: 'Fires on every PATCH that changes the stage field. The payload includes the previous_stage and new_stage fields for atomic state transition logging, and the actor field identifies who initiated the change. The actor object includes type (api, dashboard_user, agent, system) and id (the API key id, dashboard user id, or agent id) so audit integrations can attribute every stage transition. The campaign_id field is included when the lead is associated with a campaign at the time of transition.',
      },
      {
        type: 'code',
        language: 'json',
        caption: 'lead.stage_changed payload',
        code: `{
  "id": "evt_01HZX4W7N8X9P3M2K1QJ5R6VT8",
  "type": "lead.stage_changed",
  "api_version": "2024-11-15",
  "created_at": "2024-11-15T08:14:22Z",
  "data": {
    "lead": {
      "id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",
      "email": "jordan.lee@northstar.io",
      "campaign_id": "01HZX4W7N8X9P3M2K1QJ5R6VT8"
    },
    "previous_stage": "qualified",
    "new_stage": "opportunity",
    "actor": {
      "type": "agent",
      "id": "01HABCD12EFG34HIJ56KLM7891"
    }
  },
  "metadata": {
    "subscription_id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",
    "delivery_attempt": 1,
    "workspace_id": "ws_01HZX4W7N8X9P3M2K1QJ5R6VT8"
  }
}`,
      },
      {
        type: 'heading',
        level: 2,
        content: 'outreach.replied Payload',
      },
      {
        type: 'paragraph',
        content: 'Fires when a recipient reply is detected via inbound email parsing. The payload includes the original message id, the lead id, the campaign id, and the reply body (truncated to 4KB). The sentiment_score field is a float in the range -1.0 to 1.0 computed by the LeadReach sentiment engine; positive scores indicate buying interest, negative scores indicate disinterest or objections, and near-zero scores are typically logistical replies (e.g., scheduling confirmations).',
      },
      {
        type: 'code',
        language: 'json',
        caption: 'outreach.replied payload',
        code: `{
  "id": "evt_01HZX4W7N8X9P3M2K1QJ5R6VT8",
  "type": "outreach.replied",
  "api_version": "2024-11-15",
  "created_at": "2024-11-15T10:42:18Z",
  "data": {
    "message": {
      "id": "msg_01HZX4W7N8X9P3M2K1QJ5R6VT8",
      "campaign_id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",
      "agent_id": "01HABCD12EFG34HIJ56KLM7890",
      "channel": "email"
    },
    "lead": {
      "id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",
      "email": "jordan.lee@northstar.io"
    },
    "reply": {
      "body": "Hi Jordan, thanks for reaching out. We are actively evaluating vendors in this space and would love to schedule a call next Tuesday at 2pm PT.",
      "received_at": "2024-11-15T10:42:15Z"
    },
    "sentiment_score": 0.78
  },
  "metadata": {
    "subscription_id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",
    "delivery_attempt": 1,
    "workspace_id": "ws_01HZX4W7N8X9P3M2K1QJ5R6VT8"
  }
}`,
      },
      {
        type: 'heading',
        level: 2,
        content: 'campaign.completed Payload',
      },
      {
        type: 'paragraph',
        content: 'Fires when a campaign transitions to completed status. The payload includes the campaign_id, the actor that triggered the transition (auto-trigger via end_at, dashboard user, or system automation), and a final_metrics object summarizing the campaign performance. The final_metrics object is computed at completion time and is the authoritative snapshot; subsequent reads from GET /v1/campaigns/{id}/stats may differ slightly if late-arriving events adjust the metrics after completion.',
      },
      {
        type: 'code',
        language: 'json',
        caption: 'campaign.completed payload',
        code: `{
  "id": "evt_01HZX4W7N8X9P3M2K1QJ5R6VT8",
  "type": "campaign.completed",
  "api_version": "2024-11-15",
  "created_at": "2024-12-31T23:59:59Z",
  "data": {
    "campaign": {
      "id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",
      "name": "Q4 Enterprise Outbound - SaaS"
    },
    "actor": {
      "type": "system",
      "id": "scheduler_end_at"
    },
    "final_metrics": {
      "leads_assigned": 412,
      "leads_qualified": 87,
      "leads_converted": 14,
      "messages_sent": 1284,
      "open_rate": 0.583,
      "reply_rate": 0.142,
      "meeting_booked": 21,
      "pipeline_generated_usd": 184500
    }
  },
  "metadata": {
    "subscription_id": "01HZX4W7N8X9P3M2K1QJ5R6VT8",
    "delivery_attempt": 1,
    "workspace_id": "ws_01HZX4W7N8X9P3M2K1QJ5R6VT8"
  }
}`,
      },
      {
        type: 'heading',
        level: 2,
        content: 'Field Type Reference',
      },
      {
        type: 'paragraph',
        content: 'Payload field types follow standard JSON conventions with a few LeadReach-specific clarifications. ULID fields are 26-character strings of uppercase alphanumeric characters. ISO 8601 timestamps are always in UTC with the Z suffix, never with explicit offsets, to simplify parsing across language runtimes. Float fields are emitted with up to 4 decimal places; values that would round to fewer decimals are emitted with trailing zeros to ensure deterministic parsing. Enum fields accept only the documented values; unknown enum values should be tolerated by forward-compatible receivers to allow new enum additions without breaking integrations.',
      },
      {
        type: 'table',
        caption: 'Common field types across all payloads',
        headers: ['Type', 'Format', 'Example', 'Notes'],
        rows: [
          ['string', 'JSON string', 'jordan.lee@northstar.io', 'UTF-8 encoded; max length 1024 unless noted.'],
          ['ULID', '26-char uppercase alnum', '01HZX4W7N8X9P3M2K1QJ5R6VT8', 'Crockford base32; sortable.'],
          ['ISO 8601', 'YYYY-MM-DDTHH:MM:SSZ', '2024-11-15T08:02:11Z', 'Always UTC; never with offset.'],
          ['integer', 'JSON number, no decimals', '412', '64-bit signed integer range.'],
          ['float', 'JSON number, up to 4 decimals', '87.4500', 'Trailing zeros preserved.'],
          ['boolean', 'JSON boolean', 'true', 'Always lowercase per JSON spec.'],
          ['enum', 'JSON string from fixed set', 'qualified', 'Forward-compatible; tolerate unknown values.'],
          ['object', 'JSON object', '{}', 'Schema documented per payload.'],
          ['array', 'JSON array', '[]', 'Element type documented per payload.'],
        ],
      },
      {
        type: 'callout',
        variant: 'info',
        content: 'All timestamps in LeadReach payloads are emitted in UTC with the Z suffix. Receivers in non-UTC timezones should convert to local time only at the presentation layer; storing timestamps in local time in your database is a common source of bugs around daylight saving transitions.',
      },
      {
        type: 'list',
        items: [
          'id (string): event identifier; deduplication key, format evt_<ULID>.',
          'type (string): event type in resource.action snake_case format.',
          'api_version (string): schema version date for compatibility checks.',
          'created_at (ISO 8601): timestamp of the underlying state change.',
          'data (object): event-specific payload; schema varies by type.',
          'metadata (object): routing metadata including subscription_id and delivery_attempt.',
          'lead.id (ULID): canonical lead identifier in lead.* events.',
          'message.id (string): canonical message identifier in outreach.* events.',
          'campaign.id (ULID): canonical campaign identifier in campaign.* events.',
          'actor (object): attribution object with type and id fields for audit.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'Common Payload Patterns',
      },
      {
        type: 'paragraph',
        content: 'Several payload patterns recur across event types and are worth understanding as a receiver implementer. The actor object appears in every event that involves a state change initiated by a user, agent, or system; it includes a type field (api, dashboard_user, agent, system, scheduled_trigger) and an id field that uniquely identifies the actor within its type. Receivers that maintain audit trails should persist the actor object verbatim rather than joining it against the LeadReach users API, since actor IDs may reference automated workloads that do not have a corresponding user record. The metadata object on every envelope includes subscription_id, delivery_attempt, and workspace_id; the delivery_attempt field increments with each retry and is useful for receivers that maintain a delivery log to correlate retries with the original event.',
      },
      {
        type: 'paragraph',
        content: 'Events that include a previous_state and new_state pair (such as lead.stage_changed and lead.score_updated) emit the previous value atomically with the new value, enabling receivers to compute deltas without an additional API call. This pattern is critical for CRM integrations that need to log every state transition in an activity feed; without the previous_state field, the receiver would need to fetch the current state before applying the update, introducing a race window during which the state could change again. The data.lead object on lead events always includes the full lead record at the moment of the event, not a partial diff; this design choice prioritizes receiver simplicity over payload size, since most receivers need the full lead context for routing decisions.',
      },
      {
        type: 'table',
        caption: 'Recurring payload patterns across event types',
        headers: ['Pattern', 'Events', 'Purpose'],
        rows: [
          ['actor object', 'lead.stage_changed, campaign.*, outreach.*', 'Attribution of state change to a user, agent, or system.'],
          ['previous_state / new_state', 'lead.stage_changed, lead.score_updated', 'Atomic delta computation without extra API call.'],
          ['full lead object', 'lead.created, lead.enriched, lead.qualified', 'Complete lead context for routing decisions.'],
          ['final_metrics block', 'campaign.completed', 'Authoritative snapshot of campaign performance.'],
          ['metadata.delivery_attempt', 'all events on retry', 'Correlate retries with the original event id.'],
        ],
      },
      {
        type: 'paragraph',
        content: 'For events with large payloads (such as outreach.replied where the reply body can be up to 4KB), LeadReach applies a 256KB total envelope size cap. Events that would exceed this cap have their data block truncated with a data_truncated boolean flag set to true and a data_truncation_reason field explaining what was removed. Receivers that need the full untruncated payload can fetch it via GET /v1/events/{event_id}/payload, which returns the complete original payload without truncation. This pattern is rare in practice but is essential for compliance-sensitive workloads that must retain full reply content for regulatory reasons.',
      },
      {
        type: 'paragraph',
        content: 'Payload schemas are versioned via the api_version field at the envelope level. Within a schema version, LeadReach guarantees that no field will be removed or renamed; new optional fields may be added without bumping the version. Receivers should tolerate unknown fields gracefully (most JSON parsers do this by default) to allow forward-compatible schema evolution. If a receiver requires strict schema validation, it should validate against the documented fields only and reject deliveries where required fields are missing, not where unexpected fields are present.',
      },
      {
        type: 'steps',
        items: [
          'Read the raw request body once and cache it; the body is needed for HMAC signature verification.',
          'Parse the X-LeadReach-Signature header to extract the t (timestamp) and v1 (signature) parameters.',
          'Verify the timestamp is within 5 minutes of the current time to prevent replay attacks.',
          'Compute HMAC-SHA256 over the string timestamp.raw_body using the subscription secret.',
          'Compare the computed HMAC to the v1 parameter using a constant-time comparison function.',
          'Parse the JSON envelope and extract the type field to determine which handler to dispatch to.',
          'Extract the event id field and check the deduplication cache; skip processing if already seen.',
          'Dispatch the data block to the type-specific handler and respond 2xx within 10 seconds.',
          'Queue any long-running processing for asynchronous execution after the 2xx response is sent.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'Payload Size Optimization',
      },
      {
        type: 'paragraph',
        content: 'LeadReach payloads are designed to be self-contained: each event delivery includes enough context for the receiver to make routing decisions without an additional API call. This design prioritizes receiver simplicity over payload size, but it does mean that high-volume subscriptions can consume significant bandwidth. For workspaces with bandwidth constraints (e.g., receiver endpoints in regions with expensive egress), the API supports a compact envelope format triggered by including the Accept: application/vnd.leadreach.v1+compact header on the subscription URL configuration. The compact format omits the metadata block and includes only the data block; receivers that need routing metadata must accept the loss of subscription_id and delivery_attempt context. Compact format reduces payload size by approximately 20% on average, with larger savings on lead events that include the full lead object. For workloads that need even smaller payloads, LeadReach offers a field projection feature via the fields query parameter on the subscription object; for example, fields=data.lead.id,data.lead.email restricts the data block to only the id and email fields of the lead object, reducing payload size by up to 80% on events with large custom_attributes payloads. Field projection is incompatible with receivers that depend on the full lead object for routing; test thoroughly before enabling in production.',
      },
      {
        type: 'divider',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 10. Webhook Retries & Delivery Guarantees
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'webhook-retries',
    title: 'Retry Logic & Delivery Guarantees',
    description: 'Understand at-least-once delivery semantics, the 3-attempt retry schedule with exponential backoff, dead-letter handling, and how to monitor delivery health.',
    category: 'API Reference',
    readTime: '8 min read',
    lastUpdated: '2024-11-15',
    blocks: [
      {
        type: 'paragraph',
        content: 'LeadReach webhooks use an at-least-once delivery semantic combined with a bounded retry schedule and a dead-letter queue for permanently failed deliveries. This combination provides strong reliability guarantees for integrations that implement idempotent receivers: every event will eventually be delivered at least once, but receivers must tolerate duplicate deliveries in failure scenarios. This document explains the retry schedule, the failure handling paths, and the monitoring tools available for debugging delivery issues.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Delivery Semantic',
      },
      {
        type: 'paragraph',
        content: 'LeadReach does not provide exactly-once delivery. At-least-once is the strongest practical guarantee for HTTP-based webhooks because the network can fail in either direction: the receiver may process the event successfully but the 2xx response may be lost in transit, in which case LeadReach cannot distinguish success from failure and will retry. Receivers that require exactly-once semantics must implement application-level deduplication keyed on the event id field, typically via a 24-hour TTL cache backed by Redis, DynamoDB, or a database uniqueness constraint.',
      },
      {
        type: 'paragraph',
        content: 'In practice, duplicate deliveries are rare during normal operation (under 0.1% of deliveries) but become more frequent during receiver-side incidents (network blips, database unavailability, slow handlers). The 24-hour deduplication window is sized to cover the maximum retry schedule, ensuring that the same event id cannot appear in two non-overlapping windows. Receivers should log every duplicate delivery at INFO level with the event id and the original processing timestamp for audit purposes.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Retry Schedule',
      },
      {
        type: 'paragraph',
        content: 'When a delivery fails (non-2xx response, timeout, or network error), LeadReach schedules up to 3 retry attempts with exponential backoff. The retry intervals are fixed at 1 minute, 5 minutes, and 30 minutes from the original delivery attempt, regardless of the failure cause. After the 3rd retry fails, the event is moved to the dead-letter queue and the subscription is marked as degraded; the dashboard surfaces a delivery health warning and an email is sent to the workspace owner if the failure rate exceeds 20% over a 1-hour window.',
      },
      {
        type: 'table',
        caption: 'Retry schedule for failed deliveries',
        headers: ['Attempt', 'Delay From Original', 'Total Elapsed', 'Description'],
        rows: [
          ['1 (initial)', '0 minutes', '0 min', 'Initial delivery attempt on event occurrence.'],
          ['2 (retry 1)', '1 minute', '1 min', 'First retry after non-2xx or timeout.'],
          ['3 (retry 2)', '5 minutes', '6 min', 'Second retry; backoff increasing.'],
          ['4 (retry 3)', '30 minutes', '36 min', 'Final retry; failure moves event to DLQ.'],
        ],
      },
      {
        type: 'paragraph',
        content: 'The retry schedule is not configurable per subscription; it is fixed at the platform level to ensure consistent delivery behavior across all workspaces. The total time from the original delivery attempt to DLQ placement is approximately 36 minutes, which is short enough to allow timely recovery for receiver-side incidents but long enough to absorb typical transient failures (network blips, brief database unavailability, rolling deploys). If your integration requires a longer retry window, implement a reconciliation job that polls the REST API for events that may have been missed.',
      },
      {
        type: 'callout',
        variant: 'warning',
        content: 'A subscription that fails 100 consecutive deliveries is automatically disabled to protect LeadReach delivery infrastructure from runaway backpressure. Disabled subscriptions retain their configuration and secret but stop receiving new events. To re-enable, PATCH the subscription with active=true after fixing the receiver-side issue; missed events during the disabled window must be backfilled via the REST API.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Failure Detection',
      },
      {
        type: 'paragraph',
        content: 'A delivery is considered failed when any of the following conditions are met: the HTTP response status code is 4xx or 5xx, the connection times out after 10 seconds for routine deliveries (30 seconds for the verification ping), the TLS handshake fails, the response body cannot be parsed, or the receiver closes the connection before sending a complete response. LeadReach does not differentiate between 4xx and 5xx response codes for retry purposes; both trigger the retry schedule uniformly. This design intentionally favors delivery reliability over conservative retry behavior.',
      },
      {
        type: 'paragraph',
        content: 'Receivers should be aware that responding 4xx to signal a transient receiver-side issue (e.g., database temporarily unavailable) will trigger retries, which is the desired behavior. However, responding 4xx to signal a permanent issue (e.g., malformed payload that will never be processable) will still trigger 3 retries before the event is moved to DLQ, wasting delivery budget. For permanent failures, LeadReach recommends responding 2xx and logging the failure for manual review, since the event is unprocessable regardless of retry count.',
      },
      {
        type: 'code',
        language: 'bash',
        caption: 'Inspect a failed delivery via the deliveries endpoint',
        code: `curl "https://api.leadreach.ai/v1/webhooks/01HZX4W7N8X9P3M2K1QJ5R6VT8/deliveries?status=failed&limit=20" \\
  -H "Authorization: Bearer lr_live_4f9c2a8e7b1d6034ab12cd56ef9087ab" \\
  -H "X-Request-Id: req_8f3a2b1c9d4e7f06"`,
      },
      {
        type: 'code',
        language: 'json',
        caption: 'Delivery history response with retry attempts',
        code: `{
  "object": "list",
  "has_more": false,
  "data": [
    {
      "event_id": "evt_01HZX4W7N8X9P3M2K1QJ5R6VT8",
      "event_type": "lead.created",
      "attempt": 3,
      "status": "failed",
      "http_status": 500,
      "dispatched_at": "2024-11-15T08:38:11Z",
      "response_time_ms": 124,
      "error_message": "Upstream returned 500 Internal Server Error",
      "next_action": "dlq"
    }
  ]
}`,
      },
      {
        type: 'heading',
      level: 2,
        content: 'Dead-Letter Queue',
      },
      {
        type: 'paragraph',
        content: 'Events that exhaust all 3 retry attempts are moved to the per-subscription dead-letter queue (DLQ). DLQ entries are retained for 7 days, during which they can be manually redelivered via POST /v1/webhooks/{id}/deliveries/{event_id}/redeliver. After 7 days, DLQ entries are permanently deleted to control storage costs. The DLQ is per-subscription; one failing subscription does not affect deliveries on other subscriptions in the same workspace.',
      },
      {
        type: 'paragraph',
        content: 'The DLQ endpoint GET /v1/webhooks/{id}/dlq lists the dead-lettered events with their original payload, failure reasons, and timestamps. Redelivery via POST creates a fresh delivery attempt that follows the standard retry schedule if it fails again. Redelivery is idempotent: redelivering an event that is already in DLQ does not create a duplicate DLQ entry. Receivers should monitor DLQ size via the dashboard metric and trigger alerts when the queue depth exceeds 50 events, which typically indicates a sustained receiver-side issue.',
      },
      {
        type: 'steps',
        items: [
          'Subscribe to delivery health alerts in the dashboard; configure email or Slack webhook for delivery failures.',
          'When a delivery failure alert fires, fetch the failed deliveries via GET /v1/webhooks/{id}/deliveries?status=failed.',
          'Inspect the http_status and error_message fields to identify the receiver-side root cause.',
          'Fix the receiver-side issue (deploy a code fix, restore database availability, etc.).',
          'Redeliver failed events via POST /v1/webhooks/{id}/deliveries/{event_id}/redeliver.',
          'Confirm successful processing by polling GET /v1/webhooks/{id}/deliveries?status=delivered for the same event ids.',
          'For events that have already moved to the DLQ, use GET /v1/webhooks/{id}/dlq and POST redelivery as needed.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'Delivery Monitoring',
      },
      {
        type: 'paragraph',
        content: 'LeadReach exposes three metrics for monitoring webhook delivery health on the dashboard and via the metrics API. delivery_success_rate is the percentage of deliveries that received a 2xx response on the first attempt, measured over a rolling 1-hour window. delivery_retry_rate is the percentage of deliveries that required at least one retry. dlq_depth is the current count of events in the dead-letter queue. Healthy subscriptions maintain a delivery_success_rate above 99% and a dlq_depth of zero; deviations from these baselines indicate receiver-side issues that warrant investigation.',
      },
      {
        type: 'paragraph',
        content: 'For production integrations, LeadReach recommends exporting these metrics to your observability stack via the GET /v1/webhooks/{id}/metrics endpoint, which returns a time series suitable for ingestion into Prometheus, Datadog, or equivalent. Setting alerts on delivery_success_rate below 95% for 5 minutes and dlq_depth above 50 provides early warning of receiver-side incidents before they impact business workflows dependent on the webhook integration.',
      },
      {
        type: 'list',
        items: [
          'At-least-once delivery: receivers must deduplicate on event id within a 24-hour window.',
          'Up to 3 retries with exponential backoff: 1 minute, 5 minutes, 30 minutes.',
          'Total time from initial attempt to DLQ placement: approximately 36 minutes.',
          'Dead-letter queue retained for 7 days; redeliver via POST endpoint.',
          'Subscriptions that fail 100 consecutive deliveries are auto-disabled.',
          'Delivery health metrics: delivery_success_rate, delivery_retry_rate, dlq_depth.',
          'Alert when delivery_success_rate drops below 95% for 5 minutes or dlq_depth exceeds 50.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        content: 'For mission-critical integrations, implement a reconciliation job that runs every 15 minutes and polls GET /v1/leads?updated_since=<last_poll> to backfill any missed webhook deliveries. This catches events lost due to subscription auto-disablement, DLQ overflow, or receiver-side incidents that exceeded the retry window. The reconciliation job should be idempotent and tolerant of events already processed via webhook.',
      },
      {
        type: 'paragraph',
        content: 'LeadReach publishes delivery health status at status.leadreach.ai, including per-region delivery latency, success rates, and active incidents. Subscribe to the status page RSS feed or webhook integration to receive real-time notifications when platform-wide delivery issues occur. During a platform incident, the status page is the authoritative source of truth and is updated more frequently than the in-app dashboard to avoid circular dependencies on the very system being monitored.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Reconciliation Job Patterns',
      },
      {
        type: 'paragraph',
        content: 'For mission-critical integrations where webhook delivery is the primary data source, a reconciliation job that polls the REST API on a fixed schedule provides a safety net against missed deliveries. The recommended pattern is to run the job every 15 minutes, fetch all resources updated since the last successful run via GET /v1/leads?updated_since=<last_poll>, and reconcile each resource against the receiver-side state. The job should be idempotent: for each resource, check whether the latest state has already been processed via the resource updated_at timestamp; if so, skip. This pattern catches events lost due to subscription auto-disablement, DLQ overflow, or receiver-side incidents that exceeded the 36-minute retry window.',
      },
      {
        type: 'paragraph',
        content: 'The reconciliation job must handle three edge cases explicitly. First, the updated_since filter is inclusive of the boundary timestamp, so the job may receive the same resource twice across consecutive runs; the idempotency check on updated_at handles this naturally. Second, the REST API may return resources that were also delivered via webhook during the same window; the reconciliation job must treat the webhook delivery as authoritative and the REST API response as a fallback, not the other way around. Third, the reconciliation job should track its own execution history (last successful run timestamp, last processed resource updated_at) in a durable store so that restarts do not lose progress; a lost execution history forces a full backfill from the beginning of the retention window.',
      },
      {
        type: 'list',
        items: [
          'Run the reconciliation job every 15 minutes using GET /v1/leads?updated_since=<last_poll>.',
          'Track last successful run timestamp and last processed updated_at in a durable store.',
          'Treat webhook delivery as authoritative; REST API response as fallback for missed events.',
          'Implement idempotency on updated_at to handle the inclusive boundary of updated_since.',
          'For full backfill scenarios, use GET /v1/leads with cursor pagination rather than updated_since.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'Scaling Webhook Receivers',
      },
      {
        type: 'paragraph',
        content: 'As webhook delivery volume grows, receivers must scale horizontally to handle the increased load. The recommended pattern is to provision a stateless receiver tier behind a load balancer, with each instance capable of handling any delivery independently. The stateless design is enabled by the at-least-once delivery semantic combined with event-id-based deduplication: any instance can process any delivery, and duplicate processing is safe because the deduplication layer catches it. For stateful processing, push deliveries to a queue (Kafka, Kinesis, Pub/Sub) and process them asynchronously with a separate worker tier; this decouples ingestion from processing and allows the worker tier to scale independently based on processing latency rather than delivery rate. The queue should be provisioned with at least 7 days of retention to handle receiver-side incidents that require reprocessing. For very high-volume subscriptions (above 1,000 deliveries per second), consider partitioning the subscription by event type into multiple subscriptions, each pointing to a separate receiver endpoint; this allows each receiver tier to scale independently based on its event type volume. The dashboard surfaces a Delivery Volume Forecast widget that projects expected delivery rate over the next 30 days based on historical trends; receivers should be provisioned to handle 2x the forecast peak to absorb bursts. For workspaces with strict SLOs on webhook processing latency, instrument the receiver with histograms of end-to-end processing time (delivery dispatch to 2xx response) and alert when P99 exceeds 1 second; sustained P99 above 5 seconds typically indicates that the receiver is under-provisioned or that downstream processing is the bottleneck.',
      },
      {
        type: 'divider',
      },
    ],
  },
];
