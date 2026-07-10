---
title: API Rate Limits & Documentation
category: product
grade: B
last_reviewed: 2026-07-10
tags: [product, api, configuration, documentation]
---

# API Rate Limits & Documentation

Comprehensive documentation of LeadReach API rate limits, authentication methods, and integration endpoints. The LeadReach API follows RESTful conventions with JSON request/response formats. Authentication uses OAuth 2.0 with API key fallback for server-to-server integrations. Rate limits are enforced per organization: Standard tier (1,000 requests/hour), Professional tier (5,000 requests/hour), Enterprise tier (20,000 requests/hour), with burst capacity of 2x the hourly limit for 60-second windows. Key API endpoints include: Prospects (CRUD operations on prospect records), Outreach (trigger and manage outreach sequences), Knowledge (query the knowledge base), Agents (configure and monitor agent behavior), Analytics (retrieve pipeline and activity data), and Webhooks (register for real-time event notifications). The API supports pagination (cursor-based, 100 records per page), filtering (by date range, status, segment), and field selection (reduce response payload by specifying needed fields). All API responses include rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset) for client-side throttling. Webhook events fire for: prospect status changes, outreach engagement (open, click, reply), pipeline stage transitions, and agent action completions. The API is versioned (currently v2) with a 12-month deprecation window for breaking changes.

