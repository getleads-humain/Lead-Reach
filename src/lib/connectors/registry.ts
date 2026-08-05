/**
 * Connector Registry — Pre-built connector templates
 * Industry-grade definitions for all supported connector types.
 * Each template provides sensible defaults, required fields, and
 * documentation links for rapid integration setup.
 */

export interface ConnectorTemplate {
  id: string;
  name: string;
  provider: string;
  type: ConnectorType;
  category: string;
  icon: string;
  color: string;
  description: string;
  documentationUrl?: string;
  authType: AuthType;
  defaultEndpoint?: string;
  requiredFields: string[];
  optionalFields: string[];
  defaultScopes?: string[];
  defaultConfig?: Record<string, unknown>;
  popular?: boolean;
  tier: 'free' | 'standard' | 'professional' | 'enterprise';
}

export type ConnectorType = 'crm' | 'communication' | 'data_enrichment' | 'marketing' | 'analytics' | 'storage' | 'database' | 'payment' | 'webhook' | 'custom';
export type AuthType = 'api_key' | 'oauth2' | 'basic_auth' | 'bearer_token' | 'custom' | 'none';
export type ConnectorStatus = 'connected' | 'disconnected' | 'connecting' | 'error' | 'maintenance';
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
export type ConnectorPriority = 'critical' | 'high' | 'normal' | 'low';
export type ConnectorEnvironment = 'production' | 'staging' | 'development' | 'sandbox';
export type ConnectorEventType = 'connect' | 'disconnect' | 'test' | 'sync' | 'error' | 'webhook' | 'config_change' | 'enable' | 'disable' | 'health_check' | 'rate_limit' | 'auth_refresh';
export type EventSeverity = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export const CONNECTOR_TYPE_LABELS: Record<ConnectorType, string> = {
  crm: 'CRM',
  communication: 'Communication',
  data_enrichment: 'Data Enrichment',
  marketing: 'Marketing',
  analytics: 'Analytics',
  storage: 'Storage',
  database: 'Database',
  payment: 'Payment',
  webhook: 'Webhook',
  custom: 'Custom',
};

export const CONNECTOR_TYPE_COLORS: Record<ConnectorType, string> = {
  crm: '#8B5CF6',
  communication: '#06B6D4',
  data_enrichment: '#10B981',
  marketing: '#F59E0B',
  analytics: '#3B82F6',
  storage: '#6366F1',
  database: '#EC4899',
  payment: '#22C55E',
  webhook: '#F97316',
  custom: '#64748B',
};

export const AUTH_TYPE_LABELS: Record<AuthType, string> = {
  api_key: 'API Key',
  oauth2: 'OAuth 2.0',
  basic_auth: 'Basic Auth',
  bearer_token: 'Bearer Token',
  custom: 'Custom',
  none: 'No Auth',
};

export const STATUS_CONFIG: Record<ConnectorStatus, { label: string; color: string; bgColor: string }> = {
  connected: { label: 'Connected', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  disconnected: { label: 'Disconnected', color: 'text-slate-400', bgColor: 'bg-slate-500/10' },
  connecting: { label: 'Connecting', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  error: { label: 'Error', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  maintenance: { label: 'Maintenance', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
};

export const HEALTH_CONFIG: Record<HealthStatus, { label: string; color: string; bgColor: string }> = {
  healthy: { label: 'Healthy', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  degraded: { label: 'Degraded', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  unhealthy: { label: 'Unhealthy', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  unknown: { label: 'Unknown', color: 'text-slate-400', bgColor: 'bg-slate-500/10' },
};

// ── Pre-built Connector Templates ────────────────────────────────

export const CONNECTOR_TEMPLATES: ConnectorTemplate[] = [
  // CRM
  {
    id: 'hubspot-crm',
    name: 'HubSpot CRM',
    provider: 'hubspot',
    type: 'crm',
    category: 'CRM & Sales',
    icon: 'Building2',
    color: '#FF7A59',
    description: 'Sync leads, contacts, and deals with HubSpot CRM. Bi-directional sync with custom field mapping.',
    documentationUrl: 'https://developers.hubspot.com/docs/api/overview',
    authType: 'oauth2',
    defaultEndpoint: 'https://api.hubapi.com',
    requiredFields: ['accessToken'],
    optionalFields: ['refreshToken', 'portalId'],
    defaultScopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write', 'crm.objects.deals.read', 'crm.objects.deals.write'],
    popular: true,
    tier: 'standard',
  },
  {
    id: 'salesforce-crm',
    name: 'Salesforce',
    provider: 'salesforce',
    type: 'crm',
    category: 'CRM & Sales',
    icon: 'Cloud',
    color: '#00A1E0',
    description: 'Enterprise CRM integration with Salesforce. Full REST API support with SOQL queries.',
    documentationUrl: 'https://developer.salesforce.com/docs/api-explorer',
    authType: 'oauth2',
    defaultEndpoint: 'https://login.salesforce.com',
    requiredFields: ['clientId', 'clientSecret', 'username'],
    optionalFields: ['instanceUrl', 'sandbox'],
    defaultScopes: ['api', 'refresh_token', 'offline_access'],
    popular: true,
    tier: 'professional',
  },
  {
    id: 'pipedrive-crm',
    name: 'Pipedrive',
    provider: 'pipedrive',
    type: 'crm',
    category: 'CRM & Sales',
    icon: 'PieChart',
    color: '#2D4057',
    description: 'Connect Pipedrive CRM for pipeline sync and deal management.',
    documentationUrl: 'https://developers.pipedrive.com/docs/api',
    authType: 'api_key',
    defaultEndpoint: 'https://api.pipedrive.com/v1',
    requiredFields: ['apiKey'],
    optionalFields: [],
    tier: 'standard',
  },

  // Communication
  {
    id: 'slack',
    name: 'Slack',
    provider: 'slack',
    type: 'communication',
    category: 'Communication',
    icon: 'Hash',
    color: '#4A154B',
    description: 'Send notifications, post messages, and manage channels via Slack API.',
    documentationUrl: 'https://api.slack.com/docs',
    authType: 'bearer_token',
    defaultEndpoint: 'https://slack.com/api',
    requiredFields: ['botToken'],
    optionalFields: ['webhookUrl', 'defaultChannel'],
    popular: true,
    tier: 'free',
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    provider: 'microsoft-teams',
    type: 'communication',
    category: 'Communication',
    icon: 'MessageSquare',
    color: '#6264A7',
    description: 'Integrate with Microsoft Teams for notifications and messaging.',
    documentationUrl: 'https://learn.microsoft.com/en-us/microsoftteams/platform',
    authType: 'oauth2',
    defaultEndpoint: 'https://graph.microsoft.com/v1.0',
    requiredFields: ['clientId', 'clientSecret', 'tenantId'],
    optionalFields: ['webhookUrl'],
    tier: 'standard',
  },
  {
    id: 'discord',
    name: 'Discord',
    provider: 'discord',
    type: 'communication',
    category: 'Communication',
    icon: 'Gamepad2',
    color: '#5865F2',
    description: 'Post messages and manage channels via Discord bot API.',
    documentationUrl: 'https://discord.com/developers/docs',
    authType: 'bearer_token',
    defaultEndpoint: 'https://discord.com/api/v10',
    requiredFields: ['botToken'],
    optionalFields: ['webhookUrl', 'defaultChannelId'],
    tier: 'free',
  },

  // Data Enrichment
  {
    id: 'apollo',
    name: 'Apollo.io',
    provider: 'apollo',
    type: 'data_enrichment',
    category: 'Data & Intelligence',
    icon: 'Rocket',
    color: '#0D6EFD',
    description: 'Enrich leads with Apollo\'s B2B contact and company data. Search, enrich, and score.',
    documentationUrl: 'https://docs.apollo.io/docs/api',
    authType: 'api_key',
    defaultEndpoint: 'https://app.apollo.io/api/v1',
    requiredFields: ['apiKey'],
    optionalFields: [],
    popular: true,
    tier: 'standard',
  },
  {
    id: 'zoominfo',
    name: 'ZoomInfo',
    provider: 'zoominfo',
    type: 'data_enrichment',
    category: 'Data & Intelligence',
    icon: 'Search',
    color: '#0064FF',
    description: 'Access ZoomInfo\'s comprehensive B2B intelligence database for enrichment.',
    documentationUrl: 'https://api-docs.zoominfo.com/',
    authType: 'basic_auth',
    defaultEndpoint: 'https://api.zoominfo.com/v2',
    requiredFields: ['username', 'password'],
    optionalFields: ['partnerId', 'partnerSource'],
    tier: 'professional',
  },
  {
    id: 'clearbit',
    name: 'Clearbit',
    provider: 'clearbit',
    type: 'data_enrichment',
    category: 'Data & Intelligence',
    icon: 'Globe',
    color: '#2D3748',
    description: 'Enrich companies and contacts with Clearbit\'s real-time data API.',
    documentationUrl: 'https://clearbit.com/docs',
    authType: 'bearer_token',
    defaultEndpoint: 'https://company.clearbit.com/v2',
    requiredFields: ['apiKey'],
    optionalFields: [],
    tier: 'standard',
  },

  // Marketing
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    provider: 'mailchimp',
    type: 'marketing',
    category: 'Marketing & Email',
    icon: 'MailOpen',
    color: '#FFE01B',
    description: 'Sync audiences and automate email campaigns via Mailchimp.',
    documentationUrl: 'https://mailchimp.com/developer/marketing/api/',
    authType: 'api_key',
    defaultEndpoint: 'https://server.api.mailchimp.com/3.0',
    requiredFields: ['apiKey'],
    optionalFields: ['serverPrefix'],
    popular: true,
    tier: 'standard',
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    provider: 'sendgrid',
    type: 'marketing',
    category: 'Marketing & Email',
    icon: 'Send',
    color: '#1A82E2',
    description: 'Transactional and marketing email delivery via SendGrid.',
    documentationUrl: 'https://docs.sendgrid.com/api-reference',
    authType: 'bearer_token',
    defaultEndpoint: 'https://api.sendgrid.com/v3',
    requiredFields: ['apiKey'],
    optionalFields: [],
    tier: 'standard',
  },

  // Analytics
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    provider: 'google-analytics',
    type: 'analytics',
    category: 'Analytics & BI',
    icon: 'BarChart3',
    color: '#E37400',
    description: 'Pull website analytics and conversion data from Google Analytics 4.',
    documentationUrl: 'https://developers.google.com/analytics/devguides/config/admin/v1',
    authType: 'oauth2',
    defaultEndpoint: 'https://analyticsadmin.googleapis.com/v1alpha',
    requiredFields: ['clientId', 'clientSecret'],
    optionalFields: ['propertyId', 'measurementId'],
    tier: 'standard',
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    provider: 'mixpanel',
    type: 'analytics',
    category: 'Analytics & BI',
    icon: 'Activity',
    color: '#6C5CE7',
    description: 'Event analytics and user tracking with Mixpanel.',
    documentationUrl: 'https://developer.mixpanel.com/docs',
    authType: 'api_key',
    defaultEndpoint: 'https://api.mixpanel.com',
    requiredFields: ['apiKey', 'apiSecret'],
    optionalFields: ['projectId'],
    tier: 'standard',
  },

  // Storage
  {
    id: 'aws-s3',
    name: 'AWS S3',
    provider: 'aws-s3',
    type: 'storage',
    category: 'Cloud & Storage',
    icon: 'HardDrive',
    color: '#FF9900',
    description: 'Store and retrieve data from Amazon S3 buckets.',
    documentationUrl: 'https://docs.aws.amazon.com/s3/',
    authType: 'custom',
    defaultEndpoint: 'https://s3.amazonaws.com',
    requiredFields: ['accessKeyId', 'secretAccessKey', 'region'],
    optionalFields: ['bucket', 'prefix'],
    popular: true,
    tier: 'standard',
  },
  {
    id: 'google-cloud-storage',
    name: 'Google Cloud Storage',
    provider: 'google-cloud-storage',
    type: 'storage',
    category: 'Cloud & Storage',
    icon: 'CloudCog',
    color: '#4285F4',
    description: 'Store and retrieve data from Google Cloud Storage buckets.',
    documentationUrl: 'https://cloud.google.com/storage/docs',
    authType: 'custom',
    defaultEndpoint: 'https://storage.googleapis.com',
    requiredFields: ['serviceAccountKey', 'projectId'],
    optionalFields: ['bucket', 'prefix'],
    tier: 'professional',
  },

  // Payment
  {
    id: 'stripe',
    name: 'Stripe',
    provider: 'stripe',
    type: 'payment',
    category: 'Payments & Billing',
    icon: 'CreditCard',
    color: '#635BFF',
    description: 'Process payments, manage subscriptions, and sync billing data via Stripe.',
    documentationUrl: 'https://docs.stripe.com/api',
    authType: 'bearer_token',
    defaultEndpoint: 'https://api.stripe.com/v1',
    requiredFields: ['secretKey'],
    optionalFields: ['webhookSecret', 'publishableKey'],
    popular: true,
    tier: 'standard',
  },

  // Database
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    provider: 'postgresql',
    type: 'database',
    category: 'Databases',
    icon: 'Database',
    color: '#336791',
    description: 'Connect to PostgreSQL databases for read/write operations.',
    documentationUrl: 'https://www.postgresql.org/docs/current/',
    authType: 'basic_auth',
    defaultEndpoint: 'postgresql://localhost:5432',
    requiredFields: ['host', 'port', 'database', 'username', 'password'],
    optionalFields: ['ssl', 'schema'],
    tier: 'professional',
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    provider: 'mongodb',
    type: 'database',
    category: 'Databases',
    icon: 'Database',
    color: '#47A248',
    description: 'Connect to MongoDB for document-based data operations.',
    documentationUrl: 'https://www.mongodb.com/docs/',
    authType: 'custom',
    defaultEndpoint: 'mongodb://localhost:27017',
    requiredFields: ['connectionString'],
    optionalFields: ['database', 'collection'],
    tier: 'professional',
  },

  // Webhook
  {
    id: 'generic-webhook',
    name: 'Custom Webhook',
    provider: 'webhook',
    type: 'webhook',
    category: 'Automation',
    icon: 'Webhook',
    color: '#F97316',
    description: 'Send and receive data via generic HTTP webhooks with custom payloads.',
    authType: 'none',
    requiredFields: [],
    optionalFields: ['url', 'method', 'headers', 'secret'],
    popular: true,
    tier: 'free',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    provider: 'zapier',
    type: 'webhook',
    category: 'Automation',
    icon: 'Zap',
    color: '#FF4A00',
    description: 'Connect to 5000+ apps via Zapier webhooks and automation.',
    documentationUrl: 'https://developer.zapier.com/docs',
    authType: 'bearer_token',
    requiredFields: ['webhookUrl'],
    optionalFields: [],
    popular: true,
    tier: 'standard',
  },

  // Custom
  {
    id: 'custom-rest',
    name: 'Custom REST API',
    provider: 'custom-rest',
    type: 'custom',
    category: 'Custom',
    icon: 'Code',
    color: '#64748B',
    description: 'Connect to any REST API with custom configuration.',
    authType: 'custom',
    requiredFields: ['endpoint'],
    optionalFields: ['headers', 'queryParams'],
    popular: true,
    tier: 'free',
  },
];

export const POPULAR_TEMPLATES = CONNECTOR_TEMPLATES.filter(t => t.popular);
export const TEMPLATES_BY_TYPE = (type: ConnectorType) => CONNECTOR_TEMPLATES.filter(t => t.type === type);
export const TEMPLATE_BY_ID = (id: string) => CONNECTOR_TEMPLATES.find(t => t.id === id);
export const CONNECTOR_CATEGORIES = [...new Set(CONNECTOR_TEMPLATES.map(t => t.category))];
