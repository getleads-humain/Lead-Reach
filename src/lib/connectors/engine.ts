/**
 * Connector Engine — Core lifecycle, health monitoring, and connection testing
 * Manages the full connector lifecycle: create → test → connect → monitor → reconnect
 */

import { db } from '@/lib/db';
import type { ConnectorStatus, HealthStatus, ConnectorEventType, EventSeverity } from './registry';

// ── Health Score Calculation ────────────────────────────────────

export function calculateHealthScore(params: {
  status: ConnectorStatus;
  healthStatus: HealthStatus;
  errorCount: number;
  totalRequests: number;
  successCount: number;
  avgLatencyMs: number;
  enabled: boolean;
  lastConnectedAt: Date | null;
}): number {
  if (!params.enabled) return 0;
  if (params.status === 'error') return Math.max(0, 30 - params.errorCount * 5);
  if (params.status === 'disconnected') return 10;
  if (params.status === 'maintenance') return 25;

  let score = 50; // Base score for being in a non-error state

  // Success rate component (0-30 points)
  if (params.totalRequests > 0) {
    const successRate = params.successCount / params.totalRequests;
    score += successRate * 30;
  } else {
    score += 15; // Neutral if no requests yet
  }

  // Error penalty (0-20 points deducted)
  score -= Math.min(20, params.errorCount * 4);

  // Latency component (0-20 points)
  if (params.avgLatencyMs <= 100) score += 20;
  else if (params.avgLatencyMs <= 500) score += 15;
  else if (params.avgLatencyMs <= 1000) score += 10;
  else if (params.avgLatencyMs <= 3000) score += 5;
  else score += 0;

  // Freshness bonus (0-10 points)
  if (params.lastConnectedAt) {
    const hoursSinceConnection = (Date.now() - new Date(params.lastConnectedAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceConnection < 1) score += 10;
    else if (hoursSinceConnection < 24) score += 7;
    else if (hoursSinceConnection < 72) score += 3;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function deriveHealthStatus(score: number): HealthStatus {
  if (score >= 80) return 'healthy';
  if (score >= 50) return 'degraded';
  if (score > 0) return 'unhealthy';
  return 'unknown';
}

// ── Connection Testing ──────────────────────────────────────────

export interface TestResult {
  success: boolean;
  latencyMs: number;
  statusCode?: number;
  message: string;
  details?: Record<string, unknown>;
}

export async function testConnectorConnection(connector: {
  id: string;
  provider: string;
  authType: string;
  endpoint: string | null;
  secrets: string | null;
  config: string | null;
  headers: string | null;
}): Promise<TestResult> {
  const start = Date.now();

  try {
    // Parse secrets and config
    const secrets = connector.secrets ? JSON.parse(connector.secrets) : {};
    const config = connector.config ? JSON.parse(connector.config) : {};
    const headers = connector.headers ? JSON.parse(connector.headers) : {};

    // Provider-specific test logic
    switch (connector.provider) {
      case 'stripe': {
        const apiKey = secrets.secretKey || secrets.apiKey;
        if (!apiKey) return { success: false, latencyMs: Date.now() - start, message: 'Missing API key' };
        const res = await fetch('https://api.stripe.com/v1/balance', {
          headers: { 'Authorization': `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(10000),
        });
        return {
          success: res.ok,
          latencyMs: Date.now() - start,
          statusCode: res.status,
          message: res.ok ? 'Stripe connection verified' : `Stripe returned ${res.status}`,
        };
      }

      case 'hubspot': {
        const token = secrets.accessToken || secrets.apiKey;
        if (!token) return { success: false, latencyMs: Date.now() - start, message: 'Missing access token' };
        const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: AbortSignal.timeout(10000),
        });
        return {
          success: res.ok,
          latencyMs: Date.now() - start,
          statusCode: res.status,
          message: res.ok ? 'HubSpot connection verified' : `HubSpot returned ${res.status}`,
        };
      }

      case 'slack': {
        const token = secrets.botToken || secrets.apiKey;
        if (!token) return { success: false, latencyMs: Date.now() - start, message: 'Missing bot token' };
        const res = await fetch('https://slack.com/api/auth.test', {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: AbortSignal.timeout(10000),
        });
        const data = await res.json() as { ok: boolean; error?: string };
        return {
          success: data.ok === true,
          latencyMs: Date.now() - start,
          statusCode: res.status,
          message: data.ok ? 'Slack connection verified' : `Slack error: ${data.error || 'unknown'}`,
        };
      }

      case 'sendgrid': {
        const apiKey = secrets.apiKey;
        if (!apiKey) return { success: false, latencyMs: Date.now() - start, message: 'Missing API key' };
        const res = await fetch('https://api.sendgrid.com/v3/user/profile', {
          headers: { 'Authorization': `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(10000),
        });
        return {
          success: res.ok,
          latencyMs: Date.now() - start,
          statusCode: res.status,
          message: res.ok ? 'SendGrid connection verified' : `SendGrid returned ${res.status}`,
        };
      }

      case 'clearbit': {
        const apiKey = secrets.apiKey;
        if (!apiKey) return { success: false, latencyMs: Date.now() - start, message: 'Missing API key' };
        const res = await fetch('https://company.clearbit.com/v2/companies/find?domain=stripe.com', {
          headers: { 'Authorization': `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(10000),
        });
        return {
          success: res.ok,
          latencyMs: Date.now() - start,
          statusCode: res.status,
          message: res.ok ? 'Clearbit connection verified' : `Clearbit returned ${res.status}`,
        };
      }

      default: {
        // Generic endpoint test for custom/unrecognized connectors
        if (connector.endpoint) {
          const authHeaders: Record<string, string> = { ...headers };
          if (connector.authType === 'bearer_token' && secrets.apiKey) {
            authHeaders['Authorization'] = `Bearer ${secrets.apiKey}`;
          } else if (connector.authType === 'api_key' && secrets.apiKey) {
            authHeaders['X-API-Key'] = secrets.apiKey;
          } else if (connector.authType === 'basic_auth' && secrets.username && secrets.password) {
            authHeaders['Authorization'] = `Basic ${Buffer.from(`${secrets.username}:${secrets.password}`).toString('base64')}`;
          }
          const res = await fetch(connector.endpoint, {
            method: 'HEAD',
            headers: authHeaders,
            signal: AbortSignal.timeout(10000),
          }).catch(() => null);
          if (res) {
            return {
              success: res.ok || res.status < 500,
              latencyMs: Date.now() - start,
              statusCode: res.status,
              message: res.ok ? 'Endpoint reachable' : `Endpoint returned ${res.status}`,
            };
          }
        }
        // No endpoint to test — mark as unverifiable but not failed
        return {
          success: true,
          latencyMs: Date.now() - start,
          message: 'No test endpoint available — connector saved with unverified status',
        };
      }
    }
  } catch (error) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ── Event Logging ───────────────────────────────────────────────

export async function logConnectorEvent(params: {
  connectorId: string;
  eventType: ConnectorEventType;
  severity?: EventSeverity;
  message: string;
  details?: Record<string, unknown>;
  errorCode?: string;
  source?: string;
  requestId?: string;
  durationMs?: number;
  statusCode?: number;
}) {
  try {
    await db.connectorEvent.create({
      data: {
        connectorId: params.connectorId,
        eventType: params.eventType,
        severity: params.severity || 'info',
        message: params.message,
        details: params.details ? JSON.stringify(params.details) : null,
        errorCode: params.errorCode || null,
        source: params.source || 'system',
        requestId: params.requestId || null,
        durationMs: params.durationMs || null,
        statusCode: params.statusCode || null,
      },
    });
  } catch (error) {
    console.error('[ConnectorEngine] Failed to log event:', error);
  }
}

// ── Health Check Runner ─────────────────────────────────────────

export async function runHealthCheck(connectorId: string): Promise<{
  healthScore: number;
  healthStatus: HealthStatus;
  testResult?: TestResult;
}> {
  const connector = await db.connector.findUnique({ where: { id: connectorId } });
  if (!connector) throw new Error('Connector not found');

  // Run connection test if connected
  let testResult: TestResult | undefined;
  if (connector.enabled && connector.status === 'connected') {
    testResult = await testConnectorConnection(connector);
  }

  // Calculate health score
  const healthScore = calculateHealthScore({
    status: connector.status as ConnectorStatus,
    healthStatus: connector.healthStatus as HealthStatus,
    errorCount: connector.errorCount,
    totalRequests: connector.totalRequests,
    successCount: connector.successCount,
    avgLatencyMs: connector.avgLatencyMs,
    enabled: connector.enabled,
    lastConnectedAt: connector.lastConnectedAt,
  });

  const healthStatus = deriveHealthStatus(healthScore);

  // Update connector
  await db.connector.update({
    where: { id: connectorId },
    data: {
      healthScore,
      healthStatus,
      lastTestedAt: new Date(),
      ...(testResult && {
        avgLatencyMs: testResult.latencyMs > 0
          ? (connector.avgLatencyMs * 0.7 + testResult.latencyMs * 0.3) // Exponential moving average
          : connector.avgLatencyMs,
        totalRequests: connector.totalRequests + 1,
        successCount: connector.successCount + (testResult.success ? 1 : 0),
        errorCount: testResult.success ? 0 : connector.errorCount + 1,
        lastError: testResult.success ? null : testResult.message,
      }),
    },
  });

  await logConnectorEvent({
    connectorId,
    eventType: 'health_check',
    severity: healthScore >= 80 ? 'info' : healthScore >= 50 ? 'warn' : 'error',
    message: `Health check: ${healthStatus} (score: ${healthScore})`,
    details: { healthScore, healthStatus, testResult: testResult ? { success: testResult.success, latencyMs: testResult.latencyMs } : null },
    durationMs: testResult?.latencyMs,
  });

  return { healthScore, healthStatus, testResult };
}

// ── Aggregate Health ────────────────────────────────────────────

export async function getConnectorsHealthOverview() {
  const connectors = await db.connector.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      provider: true,
      status: true,
      healthStatus: true,
      healthScore: true,
      enabled: true,
      lastConnectedAt: true,
      lastError: true,
      errorCount: true,
      totalRequests: true,
    },
  });

  const total = connectors.length;
  const connected = connectors.filter(c => c.status === 'connected').length;
  const healthy = connectors.filter(c => c.healthStatus === 'healthy').length;
  const degraded = connectors.filter(c => c.healthStatus === 'degraded').length;
  const unhealthy = connectors.filter(c => c.healthStatus === 'unhealthy').length;
  const errors = connectors.filter(c => c.status === 'error').length;
  const enabled = connectors.filter(c => c.enabled).length;
  const avgHealthScore = total > 0
    ? connectors.reduce((sum, c) => sum + c.healthScore, 0) / total
    : 0;

  return {
    total,
    connected,
    healthy,
    degraded,
    unhealthy,
    errors,
    enabled,
    disabled: total - enabled,
    avgHealthScore: Math.round(avgHealthScore),
    byType: Object.fromEntries(
      [...new Set(connectors.map(c => c.type))].map(type => [
        type,
        connectors.filter(c => c.type === type).length,
      ])
    ),
    connectors,
  };
}
