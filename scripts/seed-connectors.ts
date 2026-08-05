/**
 * Seed sample connectors for demo/development
 */
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding connectors...');

  const connectors = [
    {
      name: 'HubSpot CRM — Production',
      connectorKey: 'hubspot-crm-prod',
      type: 'crm',
      provider: 'hubspot',
      version: '1.0.0',
      description: 'Primary CRM integration for bi-directional lead sync',
      category: 'CRM & Sales',
      icon: 'Building2',
      color: '#FF7A59',
      documentationUrl: 'https://developers.hubspot.com/docs/api/overview',
      authType: 'oauth2',
      endpoint: 'https://api.hubapi.com',
      status: 'connected',
      healthStatus: 'healthy',
      healthScore: 92,
      lastConnectedAt: new Date(),
      lastTestedAt: new Date(),
      totalRequests: 1247,
      successCount: 1198,
      avgLatencyMs: 142,
      enabled: true,
      autoReconnect: true,
      maxRetries: 3,
      rateLimitPerMin: 100,
      timeoutMs: 30000,
      environment: 'production',
      priority: 'critical',
      isManaged: false,
    },
    {
      name: 'Slack Notifications',
      connectorKey: 'slack-notifications',
      type: 'communication',
      provider: 'slack',
      version: '1.0.0',
      description: 'Push lead notifications and alerts to Slack channels',
      category: 'Communication',
      icon: 'Hash',
      color: '#4A154B',
      authType: 'bearer_token',
      endpoint: 'https://slack.com/api',
      status: 'connected',
      healthStatus: 'healthy',
      healthScore: 88,
      lastConnectedAt: new Date(),
      lastTestedAt: new Date(),
      totalRequests: 532,
      successCount: 530,
      avgLatencyMs: 89,
      enabled: true,
      autoReconnect: true,
      environment: 'production',
      priority: 'high',
      isManaged: false,
    },
    {
      name: 'Stripe Payments',
      connectorKey: 'stripe-payments',
      type: 'payment',
      provider: 'stripe',
      version: '1.0.0',
      description: 'Payment processing and subscription management',
      category: 'Payments & Billing',
      icon: 'CreditCard',
      color: '#635BFF',
      documentationUrl: 'https://docs.stripe.com/api',
      authType: 'bearer_token',
      endpoint: 'https://api.stripe.com/v1',
      status: 'connected',
      healthStatus: 'healthy',
      healthScore: 95,
      lastConnectedAt: new Date(),
      lastTestedAt: new Date(),
      totalRequests: 2841,
      successCount: 2839,
      avgLatencyMs: 67,
      enabled: true,
      autoReconnect: true,
      environment: 'production',
      priority: 'critical',
      isManaged: true,
    },
    {
      name: 'Apollo Data Enrichment',
      connectorKey: 'apollo-enrichment',
      type: 'data_enrichment',
      provider: 'apollo',
      version: '1.0.0',
      description: 'B2B contact and company data enrichment',
      category: 'Data & Intelligence',
      icon: 'Rocket',
      color: '#0D6EFD',
      authType: 'api_key',
      endpoint: 'https://app.apollo.io/api/v1',
      status: 'connected',
      healthStatus: 'degraded',
      healthScore: 62,
      lastConnectedAt: new Date(Date.now() - 3600000),
      lastTestedAt: new Date(Date.now() - 3600000),
      totalRequests: 456,
      successCount: 398,
      avgLatencyMs: 890,
      enabled: true,
      environment: 'production',
      priority: 'high',
      isManaged: false,
    },
    {
      name: 'SendGrid Transactional',
      connectorKey: 'sendgrid-transactional',
      type: 'marketing',
      provider: 'sendgrid',
      version: '1.0.0',
      description: 'Transactional email delivery for outreach sequences',
      category: 'Marketing & Email',
      icon: 'Send',
      color: '#1A82E2',
      authType: 'bearer_token',
      endpoint: 'https://api.sendgrid.com/v3',
      status: 'connected',
      healthStatus: 'healthy',
      healthScore: 84,
      lastConnectedAt: new Date(),
      lastTestedAt: new Date(),
      totalRequests: 1873,
      successCount: 1851,
      avgLatencyMs: 124,
      enabled: true,
      environment: 'production',
      priority: 'normal',
      isManaged: false,
    },
    {
      name: 'Custom Webhook — Pipeline',
      connectorKey: 'webhook-pipeline',
      type: 'webhook',
      provider: 'webhook',
      version: '1.0.0',
      description: 'Inbound webhook for pipeline trigger events',
      category: 'Automation',
      icon: 'Webhook',
      color: '#F97316',
      authType: 'none',
      status: 'disconnected',
      healthStatus: 'unknown',
      healthScore: 0,
      enabled: true,
      environment: 'staging',
      priority: 'normal',
      isManaged: false,
    },
    {
      name: 'Salesforce (Sandbox)',
      connectorKey: 'salesforce-sandbox',
      type: 'crm',
      provider: 'salesforce',
      version: '1.0.0',
      description: 'Sandbox environment for Salesforce integration testing',
      category: 'CRM & Sales',
      icon: 'Cloud',
      color: '#00A1E0',
      authType: 'oauth2',
      endpoint: 'https://test.salesforce.com',
      status: 'error',
      healthStatus: 'unhealthy',
      healthScore: 15,
      lastError: 'OAuth token expired — re-authentication required',
      errorCount: 5,
      totalRequests: 89,
      successCount: 72,
      enabled: false,
      environment: 'sandbox',
      priority: 'normal',
      isManaged: false,
    },
  ];

  for (const data of connectors) {
    const connector = await db.connector.create({ data });
    console.log(`  ✓ Created: ${data.name} (${connector.id})`);

    // Create initial events
    if (data.status === 'connected') {
      await db.connectorEvent.create({
        data: {
          connectorId: connector.id,
          eventType: 'connect',
          severity: 'info',
          message: `Connector "${data.name}" connected successfully`,
          source: 'system',
        },
      });
    }
    if (data.status === 'error') {
      await db.connectorEvent.create({
        data: {
          connectorId: connector.id,
          eventType: 'error',
          severity: 'error',
          message: data.lastError || 'Connection failed',
          source: 'system',
        },
      });
    }
  }

  console.log(`\n✅ Seeded ${connectors.length} connectors with events`);
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
