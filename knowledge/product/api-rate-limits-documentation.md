---
title: API Rate Limits & Documentation
category: product
grade: B
last_reviewed: 2026-07-10
tags: [product, api, configuration, documentation]
---

# API Rate Limits & Documentation

Comprehensive documentation of LeadReach API rate limits, authentication methods, and integration endpoints. The LeadReach API follows RESTful conventions with JSON request/response formats. Authentication uses OAuth 2.0 with API key fallback for server-to-server integrations. Rate limits are enforced per organization: Standard tier (1,000 requests/hour), Professional tier (5,000 requests/hour), Enterprise tier (20,000 requests/hour), with burst capacity of 2x the hourly limit for 60-second windows. Key API endpoints include: Prospects (CRUD operations on prospect records), Outreach (trigger and manage outreach sequences), Knowledge (query the knowledge base), Agents (configure and monitor agent behavior), Analytics (retrieve pipeline and activity data), and Webhooks (register for real-time event notifications). The API supports pagination (cursor-based, 100 records per page), filtering (by date range, status, segment), and field selection (reduce response payload by specifying needed fields). All API responses include rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset) for client-side throttling. Webhook events fire for: prospect status changes, outreach engagement (open, click, reply), pipeline stage transitions, and agent action completions. The API is versioned (currently v2) with a 12-month deprecation window for breaking changes.

## LeadReach API Architecture Overview

The LeadReach API is built on a microservices architecture that mirrors the 8-agent pipeline structure. Each agent (Atlas, Scout, Forge, Sage, Judge, Bard, Flow, Echo) exposes its own service endpoint cluster, while a unified API gateway provides a single entry point for all requests. The gateway handles authentication, rate limiting, request routing, and response caching before forwarding to the appropriate agent microservice.

The API gateway is implemented as a distributed system across multiple availability zones, ensuring 99.99% uptime SLA for Enterprise tier customers. All requests are load-balanced across gateway instances using a least-connections algorithm, with sticky sessions maintained for websocket connections. The gateway maintains separate rate limit counters per organization, per endpoint category, and per IP address, with the most restrictive limit taking precedence.

Behind the gateway, each agent microservice operates independently with its own compute resources and data stores. Atlas and Scout share a prospect data layer, Forge and Sage share a knowledge graph, while Bard and Flow share outreach infrastructure. This architecture means that rate limits on one agent's endpoints do not consume quota from another agent's endpoints — a request to `/v2/atlas/identify` uses Atlas quota, while a request to `/v2/bard/compose` uses Bard quota, both drawing from the organization's overall hourly allocation.

The API supports two communication patterns: synchronous request-response for real-time operations (prospect lookup, outreach trigger, analytics query) and asynchronous event-driven patterns via webhooks for long-running operations (bulk enrichment, campaign execution, pipeline analysis). For operations that may take longer than 30 seconds, the API returns a 202 Accepted status with a polling URL or fires a webhook upon completion.

## Authentication & Authorization

### OAuth 2.0 Authentication

LeadReach uses OAuth 2.0 as the primary authentication mechanism, supporting the Authorization Code flow (for user-facing applications), Client Credentials flow (for server-to-server integrations), and Refresh Token flow (for long-lived integrations). All OAuth tokens are JWT-formatted and carry the organization ID, user ID, permission scopes, and tier information.

**Authorization Code Flow** (for integrations with user context):
1. Redirect user to `https://auth.leadreach.io/authorize?response_type=code&client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&scope={SCOPES}&state={STATE}`
2. User authenticates and authorizes the application
3. LeadReach redirects to your `redirect_uri` with an authorization `code`
4. Exchange the code for tokens: `POST https://auth.leadreach.io/token` with `grant_type=authorization_code`, `code`, `client_id`, `client_secret`, `redirect_uri`
5. Receive `access_token` (expires in 3600 seconds) and `refresh_token` (expires in 90 days)

**Client Credentials Flow** (for server-to-server):
1. `POST https://auth.leadreach.io/token` with `grant_type=client_credentials`, `client_id`, `client_secret`, `scope={SCOPES}`
2. Receive `access_token` (expires in 3600 seconds, no refresh token)

**Refresh Token Flow**:
1. `POST https://auth.leadreach.io/token` with `grant_type=refresh_token`, `refresh_token`, `client_id`, `client_secret`
2. Receive new `access_token` and `refresh_token` (refresh token rotation enabled)

### API Key Authentication

For simple server-to-server integrations where OAuth overhead is unwarranted, LeadReach supports API key authentication. API keys are generated per organization and can be scoped to specific endpoint categories. API keys are passed via the `X-API-Key` header or as a `api_key` query parameter (header preferred for security).

API keys do not expire but can be revoked at any time through the LeadReach dashboard or admin API. Each organization can create up to 10 API keys (Standard), 25 API keys (Professional), or unlimited API keys (Enterprise). API keys should be stored securely and never exposed in client-side code.

### Permission Scopes

| Scope | Description | Endpoints |
|-------|-------------|-----------|
| `prospects:read` | Read prospect data | GET /v2/prospects/* |
| `prospects:write` | Create and update prospects | POST/PUT/PATCH /v2/prospects/* |
| `outreach:read` | Read outreach sequences and status | GET /v2/outreach/* |
| `outreach:write` | Create and trigger outreach sequences | POST/PUT /v2/outreach/* |
| `knowledge:read` | Query knowledge base | GET /v2/knowledge/* |
| `knowledge:write` | Update knowledge base entries | POST/PUT /v2/knowledge/* |
| `agents:read` | Read agent configurations and status | GET /v2/agents/* |
| `agents:write` | Configure and control agents | POST/PUT/PATCH /v2/agents/* |
| `analytics:read` | Retrieve analytics and reports | GET /v2/analytics/* |
| `webhooks:manage` | Register and manage webhooks | POST/PUT/DELETE /v2/webhooks/* |
| `admin` | Full administrative access | All endpoints |

## Rate Limit Tiers

### Tier Overview

LeadReach enforces rate limits at the organization level based on subscription tier. Rate limits are designed to ensure fair resource allocation, protect system stability, and maintain consistent performance for all customers. Each tier provides a baseline hourly rate with burst capacity for short traffic spikes.

| Tier | Hourly Limit | Burst Limit (60s) | Daily Limit | Concurrent Requests | Batch Size Limit |
|------|-------------|-------------------|-------------|---------------------|-----------------|
| **Standard** | 1,000 | 33 | 20,000 | 5 | 50 |
| **Professional** | 5,000 | 167 | 100,000 | 15 | 200 |
| **Enterprise** | 20,000 | 667 | 400,000 | 50 | 1,000 |
| **Enterprise Plus** | Custom | Custom | Custom | Custom | Custom |

**Burst Capacity**: The burst limit equals the hourly rate divided by 60, multiplied by 2. This means you can make requests at up to 2x your average rate for short periods, as long as your hourly total does not exceed the tier limit. Burst capacity is tracked using a sliding window algorithm with 1-second granularity.

**Daily Limits**: Daily limits reset at 00:00 UTC each day. The daily limit is approximately 20x the hourly limit, providing headroom for uneven traffic patterns throughout the day. If you consistently approach the daily limit, contact your account manager about a tier upgrade.

**Concurrent Requests**: This is the maximum number of in-flight requests at any given time. Requests that would exceed this limit receive a 429 response with `Retry-After` header. Connection timeouts are set at 30 seconds for synchronous endpoints and 5 seconds for health check endpoints.

### Per-Endpoint Category Limits

In addition to the overall organization rate limits, each endpoint category has its own rate limits that are applied independently. This prevents one type of API usage from consuming disproportionate quota and ensures fair access to all API capabilities.

| Endpoint Category | Standard (req/hr) | Professional (req/hr) | Enterprise (req/hr) |
|-------------------|-------------------|----------------------|---------------------|
| **Prospects** | 300 | 1,500 | 6,000 |
| **Outreach** | 200 | 1,000 | 4,000 |
| **Knowledge** | 150 | 750 | 3,000 |
| **Agents** | 100 | 500 | 2,000 |
| **Analytics** | 150 | 750 | 3,000 |
| **Webhooks** | 50 | 250 | 1,000 |
| **Campaigns** | 100 | 500 | 2,000 |
| **Leads** | 300 | 1,500 | 6,000 |

Category limits are deducted from the overall organization limit. For example, a Standard tier customer making 300 prospect requests has consumed 300 of their 1,000 hourly organization requests, and has also exhausted their prospect category limit, even though 700 organization-level requests remain. This ensures that no single API category monopolizes resources.

### Agent-Specific Rate Limits

Each LeadReach agent has specific rate limits tied to its computational requirements. Heavy agents like Sage (analysis) and Forge (enrichment) have lower limits because they require more processing, while lightweight agents like Echo (status) have higher limits.

| Agent | Standard (req/hr) | Professional (req/hr) | Enterprise (req/hr) | Notes |
|-------|-------------------|----------------------|---------------------|--------|
| **Atlas** (Strategic Orchestrator) | 50 | 250 | 1,000 | Pipeline management and coordination |
| **Scout** (Lead Discovery) | 100 | 500 | 2,000 | Prospect identification and scoring |
| **Forge** (Data Enrichment) | 80 | 400 | 1,600 | Data enrichment (computationally intensive) |
| **Sage** (Intelligence Analysis) | 60 | 300 | 1,200 | Deep analysis and insights generation |
| **Judge** (Quality Assessment) | 100 | 500 | 2,000 | Lead quality scoring and validation |
| **Bard** (Content Generation) | 80 | 400 | 1,600 | Personalized content creation |
| **Flow** (Orchestration & Routing) | 100 | 500 | 2,000 | Workflow and routing operations |
| **Echo** (Learning & Feedback) | 150 | 750 | 3,000 | Feedback ingestion and status queries |

## Rate Limit Headers

Every API response includes the following rate limit headers, allowing clients to monitor their usage and implement proactive throttling:

| Header | Type | Description |
|--------|------|-------------|
| `X-RateLimit-Limit` | Integer | The maximum number of requests allowed in the current rate limit window |
| `X-RateLimit-Remaining` | Integer | The number of requests remaining in the current rate limit window |
| `X-RateLimit-Reset` | Integer (Unix timestamp) | The time at which the current rate limit window resets, in UTC epoch seconds |
| `X-RateLimit-Category` | String | The endpoint category being rate limited (e.g., "prospects", "outreach") |
| `X-RateLimit-Category-Limit` | Integer | The maximum requests for the specific category in the current window |
| `X-RateLimit-Category-Remaining` | Integer | The remaining requests for the specific category |
| `Retry-After` | Integer (seconds) | Included only on 429 responses. Seconds until the rate limit resets |

### Header Usage Examples

**Successful request (200 OK):**
```
HTTP/1.1 200 OK
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4998
X-RateLimit-Reset: 1720004400
X-RateLimit-Category: prospects
X-RateLimit-Category-Limit: 1500
X-RateLimit-Category-Remaining: 1499
```

**Rate limited request (429 Too Many Requests):**
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1720004400
X-RateLimit-Category: prospects
X-RateLimit-Category-Limit: 1500
X-RateLimit-Category-Remaining: 0
Retry-After: 847
Content-Type: application/json

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded for category 'prospects'. Limit: 1500 requests/hour. Reset at 2026-07-10T14:00:00Z.",
    "details": {
      "limit": 1500,
      "remaining": 0,
      "reset_at": "2026-07-10T14:00:00Z",
      "retry_after_seconds": 847,
      "tier": "professional",
      "upgrade_url": "https://app.leadreach.io/settings/billing"
    }
  }
}
```

### Client-Side Throttling Implementation

Implement proactive client-side throttling using the rate limit headers to avoid hitting 429 errors. The recommended approach:

```python
import time
import requests

class LeadReachClient:
    def __init__(self, api_key, base_url="https://api.leadreach.io/v2"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({"X-API-Key": api_key})
        self.rate_limit_remaining = float('inf')
        self.rate_limit_reset = 0

    def _update_rate_limits(self, response):
        """Update rate limit tracking from response headers."""
        if "X-RateLimit-Remaining" in response.headers:
            self.rate_limit_remaining = int(response.headers["X-RateLimit-Remaining"])
        if "X-RateLimit-Reset" in response.headers:
            self.rate_limit_reset = int(response.headers["X-RateLimit-Reset"])

    def _throttle_if_needed(self):
        """Proactively throttle if approaching rate limits."""
        if self.rate_limit_remaining < 10:
            now = int(time.time())
            sleep_seconds = max(0, self.rate_limit_reset - now) + 1
            if sleep_seconds > 0:
                print(f"Approaching rate limit. Sleeping {sleep_seconds}s until reset.")
                time.sleep(sleep_seconds)

    def request(self, method, endpoint, **kwargs):
        self._throttle_if_needed()
        url = f"{self.base_url}/{endpoint}"
        response = self.session.request(method, url, **kwargs)
        self._update_rate_limits(response)

        if response.status_code == 429:
            retry_after = int(response.headers.get("Retry-After", 60))
            print(f"Rate limited. Retrying after {retry_after}s.")
            time.sleep(retry_after)
            response = self.session.request(method, url, **kwargs)
            self._update_rate_limits(response)

        return response
```

## Retry Strategies & Error Handling

### HTTP Status Codes

| Status Code | Meaning | Action Required |
|-------------|---------|-----------------|
| `200 OK` | Request succeeded | Process response |
| `201 Created` | Resource created successfully | Process response, note Location header |
| `202 Accepted` | Request accepted for async processing | Poll status URL or wait for webhook |
| `204 No Content` | Request succeeded, no response body | Continue without parsing body |
| `400 Bad Request` | Invalid request format or parameters | Fix request and retry |
| `401 Unauthorized` | Missing or invalid authentication | Check API key/token, re-authenticate |
| `403 Forbidden` | Insufficient permissions | Check scopes, contact admin |
| `404 Not Found` | Resource does not exist | Verify resource ID, check if deleted |
| `409 Conflict` | Resource already exists or state conflict | Resolve conflict, use PATCH instead of PUT |
| `422 Unprocessable Entity` | Valid format but semantic errors | Check field values, review error details |
| `429 Too Many Requests` | Rate limit exceeded | Implement retry with backoff |
| `500 Internal Server Error` | Server error | Retry with exponential backoff |
| `502 Bad Gateway` | Gateway timeout | Retry with exponential backoff |
| `503 Service Unavailable` | Temporary service overload | Retry with exponential backoff |
| `504 Gateway Timeout` | Request timed out | Retry with exponential backoff, consider async |

### Exponential Backoff Strategy

When receiving 429 or 5xx responses, implement exponential backoff with jitter to avoid thundering herd problems. The recommended strategy follows the AWS-style full jitter backoff:

**Algorithm:**
1. Calculate base delay: `min(max_delay, initial_delay * 2^attempt)`
2. Apply jitter: `delay = random(0, base_delay)`
3. For 429 responses, use `max(delay, Retry-After header value)`
4. Maximum of 5 retry attempts per request
5. Total retry time should not exceed 60 seconds

**Recommended Parameters:**

| Parameter | Value | Description |
|-----------|-------|-------------|
| `initial_delay` | 1 second | First retry delay |
| `max_delay` | 32 seconds | Maximum delay between retries |
| `max_retries` | 5 | Maximum retry attempts |
| `jitter` | Full jitter | Random(0, calculated_delay) |
| `total_timeout` | 60 seconds | Maximum total retry time |

**Implementation Example:**

```python
import random
import time

def retry_with_backoff(request_fn, max_retries=5, initial_delay=1, max_delay=32):
    """Execute request with exponential backoff and full jitter."""
    for attempt in range(max_retries + 1):
        try:
            response = request_fn()

            if response.status_code == 429:
                if attempt == max_retries:
                    raise Exception(f"Max retries exceeded. Rate limit still active.")

                retry_after = int(response.headers.get("Retry-After", 0))
                base_delay = min(max_delay, initial_delay * (2 ** attempt))
                jittered_delay = random.uniform(0, base_delay)
                delay = max(jittered_delay, retry_after)

                print(f"Rate limited (attempt {attempt + 1}). Waiting {delay:.1f}s")
                time.sleep(delay)
                continue

            if 500 <= response.status_code <= 504:
                if attempt == max_retries:
                    raise Exception(f"Max retries exceeded. Server error: {response.status_code}")

                base_delay = min(max_delay, initial_delay * (2 ** attempt))
                delay = random.uniform(0, base_delay)

                print(f"Server error {response.status_code} (attempt {attempt + 1}). Waiting {delay:.1f}s")
                time.sleep(delay)
                continue

            return response

        except requests.exceptions.ConnectionError:
            if attempt == max_retries:
                raise
            delay = random.uniform(0, min(max_delay, initial_delay * (2 ** attempt)))
            time.sleep(delay)

    raise Exception("Unexpected retry loop exit")
```

### 429 Error Response Format

All 429 responses follow a consistent JSON structure:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please retry after the specified duration.",
    "details": {
      "limit_type": "organization | category | concurrent",
      "limit": 5000,
      "remaining": 0,
      "reset_at": "2026-07-10T14:00:00Z",
      "retry_after_seconds": 847,
      "current_usage": {
        "organization": { "used": 5000, "limit": 5000 },
        "category": { "prospects": { "used": 1500, "limit": 1500 } }
      },
      "tier": "professional",
      "suggested_actions": [
        "Implement exponential backoff with the Retry-After header",
        "Consider upgrading to Enterprise tier for higher limits",
        "Use batch endpoints to reduce request count",
        "Switch to webhooks for event-driven patterns"
      ]
    }
  }
}
```

## API Endpoints Reference

### Prospects Endpoints

| Method | Endpoint | Description | Category Limit Impact |
|--------|----------|-------------|----------------------|
| `GET` | `/v2/prospects` | List prospects with filtering and pagination | 1 request |
| `GET` | `/v2/prospects/{id}` | Retrieve a single prospect by ID | 1 request |
| `POST` | `/v2/prospects` | Create a new prospect record | 1 request |
| `POST` | `/v2/prospects/batch` | Create up to 200 prospects in bulk | 1 + ceil(count/50) requests |
| `PUT` | `/v2/prospects/{id}` | Update a prospect (full replacement) | 1 request |
| `PATCH` | `/v2/prospects/{id}` | Partially update a prospect | 1 request |
| `DELETE` | `/v2/prospects/{id}` | Delete a prospect | 1 request |
| `POST` | `/v2/prospects/{id}/enrich` | Trigger Forge enrichment for a prospect | 2 requests (enrichment is compute-heavy) |
| `GET` | `/v2/prospects/{id}/timeline` | Get prospect activity timeline | 1 request |
| `POST` | `/v2/prospects/search` | Advanced prospect search with scoring | 2 requests (search involves Scout scoring) |

### Outreach Endpoints

| Method | Endpoint | Description | Category Limit Impact |
|--------|----------|-------------|----------------------|
| `GET` | `/v2/outreach/sequences` | List outreach sequences | 1 request |
| `POST` | `/v2/outreach/sequences` | Create a new outreach sequence | 1 request |
| `GET` | `/v2/outreach/sequences/{id}` | Get sequence details with steps | 1 request |
| `PUT` | `/v2/outreach/sequences/{id}` | Update sequence configuration | 1 request |
| `POST` | `/v2/outreach/sequences/{id}/trigger` | Trigger sequence for one or more prospects | 1 + ceil(prospect_count/100) requests |
| `POST` | `/v2/outreach/sequences/{id}/pause` | Pause a running sequence | 1 request |
| `GET` | `/v2/outreach/sequences/{id}/analytics` | Get sequence performance analytics | 1 request |
| `POST` | `/v2/outreach/emails/compose` | Generate personalized email via Bard | 3 requests (Bard content generation is compute-heavy) |
| `GET` | `/v2/outreach/emails/{id}/status` | Check email delivery and engagement status | 1 request |

### Knowledge Endpoints

| Method | Endpoint | Description | Category Limit Impact |
|--------|----------|-------------|----------------------|
| `GET` | `/v2/knowledge/search` | Search the knowledge base | 1 request |
| `GET` | `/v2/knowledge/articles/{id}` | Retrieve a specific knowledge article | 1 request |
| `POST` | `/v2/knowledge/articles` | Create a knowledge article | 1 request |
| `PUT` | `/v2/knowledge/articles/{id}` | Update a knowledge article | 1 request |
| `DELETE` | `/v2/knowledge/articles/{id}` | Delete a knowledge article | 1 request |
| `POST` | `/v2/knowledge/query` | Natural language query against knowledge base | 2 requests (Sage analysis required) |

### Agent Endpoints

| Method | Endpoint | Description | Category Limit Impact |
|--------|----------|-------------|----------------------|
| `GET` | `/v2/agents` | List all agent configurations and statuses | 1 request |
| `GET` | `/v2/agents/{agent_name}` | Get configuration for a specific agent | 1 request |
| `PUT` | `/v2/agents/{agent_name}/config` | Update agent configuration | 1 request |
| `POST` | `/v2/agents/{agent_name}/action` | Trigger a specific agent action | 2-5 requests (varies by agent and action complexity) |
| `GET` | `/v2/agents/{agent_name}/status` | Check current agent processing status | 1 request |
| `GET` | `/v2/agents/{agent_name}/queue` | View agent's pending action queue | 1 request |
| `POST` | `/v2/agents/pipeline/run` | Trigger the full 8-agent pipeline for a prospect | 8 requests (one per agent) |

### Analytics Endpoints

| Method | Endpoint | Description | Category Limit Impact |
|--------|----------|-------------|----------------------|
| `GET` | `/v2/analytics/pipeline` | Pipeline performance metrics | 1 request |
| `GET` | `/v2/analytics/pipeline/trends` | Pipeline trend data over time | 1 request |
| `GET` | `/v2/analytics/agents` | Agent performance and utilization metrics | 1 request |
| `GET` | `/v2/analytics/outreach` | Outreach engagement and conversion metrics | 1 request |
| `GET` | `/v2/analytics/prospects` | Prospect quality and progression metrics | 1 request |
| `POST` | `/v2/analytics/custom` | Custom analytics query with flexible dimensions | 2 requests |
| `GET` | `/v2/analytics/export` | Export analytics data (CSV/JSON) | 1 request (async, returns 202 with polling URL) |

### Webhook Endpoints

| Method | Endpoint | Description | Category Limit Impact |
|--------|----------|-------------|----------------------|
| `GET` | `/v2/webhooks` | List registered webhooks | 1 request |
| `POST` | `/v2/webhooks` | Register a new webhook | 1 request |
| `PUT` | `/v2/webhooks/{id}` | Update webhook configuration | 1 request |
| `DELETE` | `/v2/webhooks/{id}` | Delete a webhook | 1 request |
| `POST` | `/v2/webhooks/{id}/test` | Send a test event to webhook URL | 1 request |
| `GET` | `/v2/webhooks/{id}/deliveries` | View recent webhook delivery attempts | 1 request |

### Campaign Endpoints

| Method | Endpoint | Description | Category Limit Impact |
|--------|----------|-------------|----------------------|
| `GET` | `/v2/campaigns` | List campaigns | 1 request |
| `POST` | `/v2/campaigns` | Create a new campaign | 1 request |
| `GET` | `/v2/campaigns/{id}` | Get campaign details | 1 request |
| `PUT` | `/v2/campaigns/{id}` | Update campaign configuration | 1 request |
| `POST` | `/v2/campaigns/{id}/launch` | Launch a campaign | 2 requests |
| `POST` | `/v2/campaigns/{id}/pause` | Pause a running campaign | 1 request |
| `GET` | `/v2/campaigns/{id}/performance` | Get campaign performance metrics | 1 request |
| `GET` | `/v2/campaigns/{id}/leads` | Get campaign-associated leads | 1 request |

## Batch vs Single Request Limits

### Batch Request Guidelines

Batch endpoints allow you to perform operations on multiple records in a single API call, reducing the number of requests against your rate limit. However, batch operations have their own size limits and cost multipliers.

| Operation | Batch Endpoint | Max Batch Size | Rate Limit Cost | Processing Time |
|-----------|---------------|----------------|-----------------|-----------------|
| Create Prospects | `POST /v2/prospects/batch` | Standard: 50, Pro: 200, Enterprise: 1,000 | 1 + ceil(count/50) | Synchronous for ≤50, async for >50 |
| Enrich Prospects | `POST /v2/prospects/batch/enrich` | Standard: 25, Pro: 100, Enterprise: 500 | 2 × ceil(count/25) | Always async (202 response) |
| Trigger Outreach | `POST /v2/outreach/sequences/{id}/trigger` | Standard: 50, Pro: 200, Enterprise: 1,000 | 1 + ceil(count/100) | Always async (202 response) |
| Update Prospects | `PATCH /v2/prospects/batch` | Standard: 50, Pro: 200, Enterprise: 1,000 | ceil(count/50) | Synchronous for ≤50, async for >50 |
| Delete Prospects | `DELETE /v2/prospects/batch` | Standard: 50, Pro: 200, Enterprise: 1,000 | ceil(count/50) | Synchronous for ≤50, async for >50 |

### Batch Request Best Practices

1. **Optimal batch size**: Use batches of 50-100 records for the best balance between throughput and error isolation. Larger batches risk losing all records if one record causes an error.

2. **Error handling in batches**: Batch operations return a mixed response — individual record successes and failures are reported separately. Always check the `errors` array in the response:
   ```json
   {
     "data": {
       "succeeded": 47,
       "failed": 3,
       "created_ids": ["prosp_abc123", "prosp_def456", ...]
     },
     "errors": [
       {
         "index": 12,
         "record": { "email": "invalid-email" },
         "code": "VALIDATION_ERROR",
         "message": "Invalid email format"
       }
     ]
   }
   ```

3. **Idempotency**: Use the `X-Idempotency-Key` header for batch operations to prevent duplicate processing on network retries. The key should be a unique identifier (UUID recommended) that you generate for each unique batch request.

4. **Ordering**: Batch operations do not guarantee processing order within a batch. If order matters, use sequential single requests or split into smaller ordered batches.

## Webhook vs Polling Recommendations

### When to Use Webhooks

Webhooks are the recommended pattern for receiving real-time updates about LeadReach events. Use webhooks when:

- You need real-time notification of events (prospect status changes, engagement events, pipeline transitions)
- You want to reduce API polling overhead and rate limit consumption
- You are integrating with other systems that need to react to LeadReach events (CRM sync, Slack notifications, data warehouse updates)
- You are processing async operations (bulk enrichment, campaign execution) that may take minutes to complete

### When to Use Polling

Polling is appropriate when:

- You need to check status on-demand (e.g., checking enrichment status when a user views a record)
- Your integration architecture doesn't support inbound HTTP requests (firewall restrictions, no public endpoint)
- You need historical state and polling allows you to reconstruct the timeline
- You are running batch reconciliation processes that don't require real-time updates

### Available Webhook Events

| Event Category | Event Name | Trigger | Payload |
|----------------|-----------|---------|---------|
| **Prospect** | `prospect.created` | New prospect added to LeadReach | Prospect object |
| **Prospect** | `prospect.updated` | Prospect data changed | Prospect object with changed fields |
| **Prospect** | `prospect.enriched` | Forge enrichment completed | Enriched fields and data sources |
| **Prospect** | `prospect.qualified` | Judge quality score threshold met | Quality score and criteria |
| **Outreach** | `outreach.email.sent` | Email delivered to prospect | Email details and delivery status |
| **Outreach** | `outreach.email.opened` | Prospect opened email | Email details and open timestamp |
| **Outreach** | `outreach.email.clicked` | Prospect clicked link in email | Email details and clicked URL |
| **Outreach** | `outreach.email.replied` | Prospect replied to email | Email details and reply content |
| **Outreach** | `outreach.email.bounced` | Email bounced (hard/soft) | Bounce type and reason |
| **Pipeline** | `pipeline.stage_changed` | Prospect moved to new pipeline stage | Old stage, new stage, agent responsible |
| **Pipeline** | `pipeline.completed` | Full pipeline execution finished | Summary with all agent results |
| **Agent** | `agent.action.completed` | Agent finished a specific action | Agent name, action, result summary |
| **Agent** | `agent.action.failed` | Agent action failed | Agent name, action, error details |
| **Campaign** | `campaign.launched` | Campaign started executing | Campaign details and prospect count |
| **Campaign** | `campaign.completed` | Campaign finished executing | Campaign results summary |
| **Knowledge** | `knowledge.article.updated` | Knowledge base article modified | Article ID and changed fields |

### Webhook Configuration

```json
{
  "url": "https://your-app.com/leadreach/webhook",
  "events": ["prospect.enriched", "outreach.email.replied", "pipeline.stage_changed"],
  "secret": "whsec_your_signing_secret",
  "active": true,
  "metadata": {
    "environment": "production",
    "team": "sales-ops"
  }
}
```

### Webhook Security

All webhook payloads are signed using HMAC-SHA256 with your webhook secret. Always verify the signature before processing:

1. Retrieve the `X-LeadReach-Signature` header from the incoming request
2. Compute HMAC-SHA256 of the raw request body using your webhook secret
3. Compare the computed signature with the header value using constant-time comparison
4. Reject the request if signatures don't match

LeadReach retries failed webhook deliveries up to 5 times with exponential backoff (1s, 5s, 25s, 125s, 625s). A webhook is considered failed if your endpoint returns a non-2xx status or doesn't respond within 10 seconds. After 5 consecutive failures, the webhook is automatically disabled and you'll receive an email notification.

## Monitoring Best Practices

### Rate Limit Monitoring Dashboard

Build a rate limit monitoring dashboard using the response headers from every API call. Track these key metrics:

| Metric | Calculation | Alert Threshold |
|--------|-------------|-----------------|
| **Remaining Quota %** | `X-RateLimit-Remaining / X-RateLimit-Limit × 100` | < 20% — Warning, < 10% — Critical |
| **Quota Burn Rate** | Requests in last 5 minutes × 12 (extrapolated hourly) | > 80% of hourly limit |
| **429 Error Rate** | 429 responses / total responses × 100 | > 1% — Warning, > 5% — Critical |
| **Retry Rate** | Retried requests / total requests × 100 | > 2% — Warning, > 10% — Critical |
| **Average Response Time** | Mean response latency across all endpoints | > 2s — Warning, > 5s — Critical |
| **P99 Response Time** | 99th percentile response latency | > 10s — Warning, > 30s — Critical |

### Proactive Rate Limit Management

1. **Pre-request quota check**: Before making batch requests, check `X-RateLimit-Remaining` from the last response. If remaining quota is less than the batch cost, wait until the reset window.

2. **Distributed quota coordination**: If multiple services share a single LeadReach organization, implement a distributed quota tracker (e.g., Redis) to coordinate rate limit consumption across services.

3. **Priority-based throttling**: Classify API calls by priority (critical, normal, low) and shed low-priority requests first when approaching rate limits. Analytics queries and batch operations are typically lower priority than real-time prospect lookups and outreach triggers.

4. **Traffic shaping**: Spread batch operations across the hour rather than running them all at the top of the hour. Use a token bucket or leaky bucket algorithm to smooth traffic.

5. **Caching**: Cache responses that don't change frequently. Prospect data can be cached for 5-15 minutes (enrichment may change), knowledge base articles for 1 hour, and analytics for 15-30 minutes depending on the use case.

### Monitoring Integration with LeadReach Agents

LeadReach agents can help monitor your own API usage. Configure Echo (Learning & Feedback) to track API usage patterns and surface optimization recommendations:

- **Atlas** can prioritize which prospects to enrich via API based on pipeline impact
- **Sage** can analyze API usage patterns and recommend optimal call scheduling
- **Flow** can queue API operations to smooth traffic and avoid burst patterns
- **Echo** can learn from historical usage patterns and predict when rate limits will be hit

## Rate Limit Calculator

Use the following calculator to estimate your API usage and determine the appropriate tier:

### Step 1: Estimate Monthly API Volume

| Operation | Volume (per month) | Rate Limit Cost | Total Cost |
|-----------|-------------------|-----------------|------------|
| Prospect lookups | _____ | × 1 | _____ |
| Prospect creates | _____ | × 1 | _____ |
| Prospect enrichments (Forge) | _____ | × 2 | _____ |
| Outreach sequence triggers | _____ | × 1 | _____ |
| Bard email compositions | _____ | × 3 | _____ |
| Knowledge base queries | _____ | × 1 | _____ |
| Sage analysis queries | _____ | × 2 | _____ |
| Analytics queries | _____ | × 1 | _____ |
| Webhook management | _____ | × 1 | _____ |
| Pipeline runs (full 8-agent) | _____ | × 8 | _____ |
| **Total monthly requests** | | | **_____** |

### Step 2: Convert to Hourly Rate

```
Peak hourly rate = (Total monthly requests / 22 working days) × Peak multiplier (typically 2-3x)
```

For example: 100,000 monthly requests / 22 days = 4,545/day × 3x peak = 13,636/hour peak → Enterprise tier required

### Step 3: Tier Selection Guide

| If Peak Hourly Rate Is... | Recommended Tier | Rationale |
|--------------------------|------------------|-----------|
| < 1,000 | Standard | Sufficient for small teams with moderate API usage |
| 1,000 - 5,000 | Professional | Supports mid-market teams with regular integrations |
| 5,000 - 20,000 | Enterprise | Required for large teams or heavy automation |
| > 20,000 | Enterprise Plus | Custom limits for high-volume programmatic usage |

### Step 4: Optimization Checklist

Before upgrading tiers, review these optimization opportunities:

- [ ] Replace polling with webhooks where possible (saves 70-90% of polling requests)
- [ ] Use batch endpoints instead of individual requests (saves 50-95% of request count)
- [ ] Implement response caching for frequently accessed, slowly changing data
- [ ] Use field selection (`?fields=id,name,email`) to reduce response size and processing time
- [ ] De-duplicate API calls across your integration landscape
- [ ] Schedule batch operations during off-peak hours
- [ ] Use async endpoints (202 responses) for long-running operations
- [ ] Review and remove unused webhook subscriptions

## Quota Management

### Quota Alerts

Configure quota alerts through the LeadReach dashboard or API to receive notifications before hitting rate limits:

| Alert Type | Default Threshold | Configuration |
|------------|-------------------|---------------|
| **Warning** | 75% of hourly limit consumed | Email + in-app notification |
| **Critical** | 90% of hourly limit consumed | Email + Slack + PagerDuty |
| **Exceeded** | 100% of hourly limit consumed | Email + Slack + PagerDuty (urgent) |
| **Daily Warning** | 75% of daily limit consumed | Email notification |

### Quota Sharing Across Teams

For organizations with multiple teams using the same LeadReach account, implement quota allocation to prevent one team from consuming disproportionate resources:

| Team | Allocated % | Max Hourly Requests | Notes |
|------|-------------|---------------------|-------|
| Sales Development | 40% | 2,000 (Pro tier) | Primary user of prospect and outreach endpoints |
| Marketing Operations | 25% | 1,250 (Pro tier) | Campaign and analytics endpoints |
| Revenue Operations | 20% | 1,000 (Pro tier) | Analytics and pipeline endpoints |
| Data Engineering | 15% | 750 (Pro tier) | Batch operations and data sync |

Contact your account manager to configure team-level quota allocation. The allocation is enforced by the API gateway based on the API key or OAuth token used.

### Burst Quota Management

Burst capacity (2x the hourly rate for 60-second windows) provides flexibility for short traffic spikes. However, sustained burst usage will deplete your hourly quota faster. Monitor burst usage with these guidelines:

- **Acceptable burst patterns**: User-triggered actions (search, enrichment on demand), batch imports during onboarding, campaign launches
- **Problematic burst patterns**: Polling loops with no backoff, unthrottled parallel requests, webhook retry storms

If you consistently use burst capacity, it indicates your traffic pattern needs optimization or your tier needs upgrading. Echo can analyze your burst usage patterns and provide specific recommendations.

## API Versioning & Deprecation

The LeadReach API is currently at version 2 (v2). The versioning policy ensures backward compatibility:

1. **Breaking changes** (removing endpoints, changing response structures, removing fields) require a new major version with a 12-month deprecation window
2. **Non-breaking changes** (adding new fields, new endpoints, new optional parameters) are made within the current version
3. **Deprecation notices** are communicated via email, changelog, and `Deprecation` and `Sunset` HTTP headers on affected endpoints
4. **Migration guides** are published 6 months before the deprecation window closes

Always include the API version in your request URL (`/v2/...`). Requests without a version prefix are routed to the current version but this behavior may change in the future.

## Pagination & Filtering

### Cursor-Based Pagination

All list endpoints support cursor-based pagination for efficient traversal of large result sets:

```
GET /v2/prospects?limit=100&cursor=eyJpZCI6MTIzNDUsImNyZWF0ZWRfYXQiOiIyMDI2LTA3LTAxVDEyOjAwOjAwWiJ9
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | Integer (1-100) | Number of records per page (default: 50, max: 100) |
| `cursor` | String | Opaque cursor from the previous page's response |
| `direction` | String | `next` (default) or `prev` for bidirectional pagination |

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "has_more": true,
    "next_cursor": "eyJpZCI6MTIzNDYsImNyZWF0ZWRfYXQiOiIyMDI2LTA3LTAxVDEyOjAwOjAxWiJ9",
    "prev_cursor": "eyJpZCI6MTIzNDQsImNyZWF0ZWRfYXQiOiIyMDI2LTA3LTAxVDExOjU5OjU5WiJ9",
    "total_count": 15432
  }
}
```

### Filtering

| Parameter | Format | Example |
|-----------|--------|---------|
| `status` | Comma-separated values | `?status=qualified,in_progress` |
| `created_after` | ISO 8601 datetime | `?created_after=2026-06-01T00:00:00Z` |
| `created_before` | ISO 8601 datetime | `?created_before=2026-07-01T00:00:00Z` |
| `min_score` | Integer (0-100) | `?min_score=70` |
| `segment` | String | `?segment=enterprise` |
| `source_agent` | Agent name | `?source_agent=scout` |
| `has_intent` | Boolean | `?has_intent=true` |
| `company_size` | Range | `?company_size=50-500` |
| `industry` | Comma-separated values | `?industry=saas,fintech` |

### Field Selection

Reduce response payload size by selecting only needed fields:
```
GET /v2/prospects?fields=id,name,email,company,score
```

This is especially useful for mobile integrations, bandwidth-constrained environments, and reducing deserialization overhead.

## Common Integration Patterns

### CRM Sync Pattern

The most common integration pattern synchronizes prospect data between LeadReach and a CRM (Salesforce, HubSpot, etc.):

1. Register webhooks for `prospect.created`, `prospect.updated`, `pipeline.stage_changed`, and `outreach.email.replied`
2. On webhook receipt, transform the LeadReach data to CRM format and upsert via CRM API
3. Run a daily reconciliation poll (`GET /v2/prospects?updated_after=<last_sync>`) to catch any missed webhook events
4. Use batch endpoints for initial data migration and periodic full syncs

### Data Warehouse Export Pattern

For analytics and reporting, export LeadReach data to a data warehouse:

1. Schedule daily batch exports using `GET /v2/analytics/export` (returns 202 with polling URL)
2. Poll for completion or register webhook for `agent.action.completed`
3. Download the export file and load into your warehouse
4. For real-time warehouse updates, use webhooks to stream events to a message queue (Kafka, Kinesis) and then to your warehouse

### Custom Application Pattern

For custom applications built on LeadReach:

1. Use OAuth 2.0 Authorization Code flow for user-facing applications
2. Cache frequently accessed data (prospect details, knowledge base) with 5-15 minute TTL
3. Implement optimistic UI updates for actions that may take time (enrichment, outreach composition)
4. Use websockets (available at `/v2/ws`) for real-time updates in interactive applications
5. Pre-compute and cache common query results using Sage analysis scheduling

## Troubleshooting Guide

### Common Issues & Solutions

| Issue | Symptoms | Root Cause | Solution |
|-------|----------|------------|----------|
| Frequent 429 errors | Many rate limit responses, slow performance | Exceeding tier limits | Upgrade tier, implement caching, use webhooks |
| Stale data in responses | Data doesn't match dashboard | Response caching | Add `Cache-Control: no-cache` header or reduce cache TTL |
| Webhook not firing | Missing events | Webhook disabled after failures | Check webhook delivery logs, re-enable if needed |
| 401 on valid API key | Authentication failures | Expired key or wrong scope | Verify key is active, check required scopes |
| 504 on enrichment | Timeout on Forge enrichment | Large enrichment request | Use async endpoint, reduce batch size |
| Duplicate records | Same prospect created multiple times | Missing idempotency key | Use `X-Idempotency-Key` header |
| Missing pagination results | Can't retrieve all records | Cursor reuse after data change | Use fresh cursor, handle page invalidation |

### Support Escalation

If you experience persistent API issues:

1. Check the LeadReach status page: `https://status.leadreach.io`
2. Review API changelog for recent changes: `https://docs.leadreach.io/api/changelog`
3. Contact support via: `api-support@leadreach.io` or in-app chat
4. For Enterprise customers: dedicated API support channel with 1-hour SLA

Include these details in support requests: organization ID, API key (last 4 characters), endpoint, request/response samples (redacted), timestamp, and `X-Request-Id` header value from the response.
