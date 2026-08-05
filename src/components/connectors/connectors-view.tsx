'use client';

/**
 * ConnectorsView — Full Connector Management Dashboard
 * Industry-grade UI for managing, monitoring, and configuring
 * all platform connectors with real-time health tracking.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plug, Plus, Search, Filter, RefreshCw, Activity, CheckCircle2,
  XCircle, AlertTriangle, MoreVertical, Trash2, Power, PowerOff,
  ExternalLink, Clock, Zap, Shield, Globe, Database, Code,
  Building2, Hash, Rocket, Mail, Send, BarChart3, HardDrive,
  CreditCard, Cloud, MessageSquare, Gamepad2, PieChart, Search as SearchIcon,
  Globe as GlobeIcon, Webhook, ArrowRight, Loader2, ChevronDown,
  Settings, Bell, TrendingUp, AlertCircle, Info, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import {
  CONNECTOR_TEMPLATES,
  CONNECTOR_TYPE_LABELS,
  CONNECTOR_TYPE_COLORS,
  AUTH_TYPE_LABELS,
  STATUS_CONFIG,
  HEALTH_CONFIG,
  type ConnectorTemplate,
  type ConnectorType,
  type ConnectorStatus,
  type HealthStatus,
} from '@/lib/connectors/registry';

// ── Types ───────────────────────────────────────────────────────

interface ConnectorData {
  id: string;
  name: string;
  connectorKey: string;
  type: string;
  provider: string;
  version: string;
  description: string | null;
  category: string | null;
  icon: string | null;
  color: string | null;
  documentationUrl: string | null;
  authType: string;
  endpoint: string | null;
  status: string;
  healthStatus: string;
  healthScore: number;
  lastConnectedAt: string | null;
  lastTestedAt: string | null;
  lastError: string | null;
  errorCount: number;
  totalRequests: number;
  successCount: number;
  avgLatencyMs: number;
  enabled: boolean;
  autoReconnect: boolean;
  maxRetries: number;
  rateLimitPerMin: number;
  webhookUrl: string | null;
  environment: string;
  priority: string;
  isManaged: boolean;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { events: number };
}

// ── Icon Mapper ─────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Building2, Hash, Rocket, Mail, Send, BarChart3, HardDrive,
  CreditCard, Cloud, MessageSquare, Gamepad2, PieChart, Search: SearchIcon,
  Globe: GlobeIcon, Webhook, Code, Database, Activity, Shield, Plug,
};

function getIcon(iconName: string | null): React.ElementType {
  if (!iconName) return Plug;
  return ICON_MAP[iconName] || Plug;
}

// ── Status Indicator ────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as ConnectorStatus] || STATUS_CONFIG.disconnected;
  const pulseClass = status === 'connected' ? 'animate-pulse' : status === 'connecting' ? 'animate-pulse' : '';
  return (
    <span className={cn('relative flex h-2.5 w-2.5', pulseClass)}>
      <span className={cn(
        'absolute inline-flex h-full w-full rounded-full opacity-75',
        status === 'connected' ? 'bg-emerald-400' : status === 'error' ? 'bg-red-400' : status === 'connecting' ? 'bg-amber-400' : 'bg-slate-400'
      )} />
      <span className={cn(
        'relative inline-flex rounded-full h-2.5 w-2.5',
        status === 'connected' ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : status === 'connecting' ? 'bg-amber-500' : 'bg-slate-500'
      )} />
    </span>
  );
}

// ── Health Bar ──────────────────────────────────────────────────

function HealthBar({ score, status }: { score: number; status: string }) {
  const healthConfig = HEALTH_CONFIG[status as HealthStatus] || HEALTH_CONFIG.unknown;
  const barColor = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : score > 0 ? 'bg-red-500' : 'bg-slate-500';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-200/50 dark:bg-slate-700/50 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', barColor)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn('text-[10px] font-mono font-medium', healthConfig.color)}>
        {score}
      </span>
    </div>
  );
}

// ── Connector Card ──────────────────────────────────────────────

function ConnectorCard({
  connector,
  onTest,
  onToggle,
  onDelete,
  onSync,
  onSelect,
  isTesting,
}: {
  connector: ConnectorData;
  onTest: (id: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSync: (id: string) => void;
  onSelect: (id: string) => void;
  isTesting: string | null;
}) {
  const Icon = getIcon(connector.icon);
  const statusConfig = STATUS_CONFIG[connector.status as ConnectorStatus] || STATUS_CONFIG.disconnected;
  const healthConfig = HEALTH_CONFIG[connector.healthStatus as HealthStatus] || HEALTH_CONFIG.unknown;
  const typeColor = CONNECTOR_TYPE_COLORS[connector.type as ConnectorType] || '#64748B';
  const isTestingThis = isTesting === connector.id;
  const tags = connector.tags ? JSON.parse(connector.tags) : [];

  return (
    <Card className={cn(
      'group relative transition-all duration-200 border-border/60 hover:border-border cursor-pointer',
      !connector.enabled && 'opacity-60',
    )} onClick={() => onSelect(connector.id)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${connector.color || typeColor}15`, borderColor: `${connector.color || typeColor}30` }}
            >
              <Icon className="h-5 w-5" style={{ color: connector.color || typeColor }} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">{connector.name}</CardTitle>
              <CardDescription className="text-[11px] truncate">
                {connector.provider} · v{connector.version}
              </CardDescription>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTest(connector.id); }} disabled={isTestingThis}>
                {isTestingThis ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Activity className="h-3.5 w-3.5 mr-2" />}
                Test Connection
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSync(connector.id); }} disabled={connector.status !== 'connected'}>
                <RefreshCw className="h-3.5 w-3.5 mr-2" /> Sync Now
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggle(connector.id); }}>
                {connector.enabled ? <PowerOff className="h-3.5 w-3.5 mr-2" /> : <Power className="h-3.5 w-3.5 mr-2" />}
                {connector.enabled ? 'Disable' : 'Enable'}
              </DropdownMenuItem>
              {connector.documentationUrl && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(connector.documentationUrl!, '_blank'); }}>
                  <ExternalLink className="h-3.5 w-3.5 mr-2" /> Documentation
                </DropdownMenuItem>
              )}
              {!connector.isManaged && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(connector.id); }} className="text-red-600 dark:text-red-400">
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Status & Health */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusDot status={connector.status} />
            <span className={cn('text-xs font-medium', statusConfig.color)}>{statusConfig.label}</span>
          </div>
          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4', healthConfig.bgColor, healthConfig.color, 'border-transparent')}>
            {healthConfig.label}
          </Badge>
        </div>

        {/* Health Score Bar */}
        <HealthBar score={connector.healthScore} status={connector.healthStatus} />

        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] text-muted-foreground">Requests</div>
            <div className="text-xs font-semibold">{connector.totalRequests.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">Success</div>
            <div className="text-xs font-semibold text-emerald-500">
              {connector.totalRequests > 0 ? Math.round(connector.successCount / connector.totalRequests * 100) : 0}%
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">Latency</div>
            <div className="text-xs font-semibold">{Math.round(connector.avgLatencyMs)}ms</div>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-[9px] px-1 py-0 h-3.5">{tag}</Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5">+{tags.length - 3}</Badge>
            )}
          </div>
        )}

        {/* Environment & Priority */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="capitalize">{connector.environment}</span>
          <span className={cn(
            'font-medium',
            connector.priority === 'critical' ? 'text-red-500' : connector.priority === 'high' ? 'text-amber-500' : ''
          )}>
            {connector.priority}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Template Card (for Add Connector dialog) ────────────────────

function TemplateCard({ template, onSelect }: { template: ConnectorTemplate; onSelect: (t: ConnectorTemplate) => void }) {
  const Icon = getIcon(template.icon);

  return (
    <button
      onClick={() => onSelect(template)}
      className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:border-border p-3 transition-all text-left w-full group"
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
        style={{ backgroundColor: `${template.color}15` }}
      >
        <Icon className="h-4.5 w-4.5" style={{ color: template.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate group-hover:text-emerald-500 transition-colors">{template.name}</div>
        <div className="text-[11px] text-muted-foreground truncate">{template.description}</div>
      </div>
      {template.popular && (
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] px-1 py-0 h-3.5 shrink-0">
          Popular
        </Badge>
      )}
    </button>
  );
}

// ── Create Connector Form ───────────────────────────────────────

function CreateConnectorForm({
  template,
  onClose,
  onCreated,
}: {
  template: ConnectorTemplate | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState(template?.name || '');
  const [connectorKey, setConnectorKey] = useState(template ? `${template.provider}-${Date.now()}` : '');
  const [endpoint, setEndpoint] = useState(template?.defaultEndpoint || '');
  const [authType, setAuthType] = useState(template?.authType || 'api_key');
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState('');
  const [environment, setEnvironment] = useState('production');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name || !connectorKey) return;
    setIsCreating(true);

    try {
      const secrets: Record<string, string> = {};
      if (apiKey) secrets.apiKey = apiKey;
      if (secretKey) secrets.secretKey = secretKey;
      if (username) secrets.username = username;
      if (password) secrets.password = password;
      if (template?.authType === 'bearer_token' && apiKey) secrets.botToken = apiKey;
      if (template?.id === 'stripe' && secretKey) secrets.secretKey = secretKey;
      if (template?.id === 'stripe' && apiKey) secrets.publishableKey = apiKey;
      if (template?.id === 'hubspot' && apiKey) secrets.accessToken = apiKey;

      const res = await fetch('/api/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          connectorKey,
          type: template?.type || 'custom',
          provider: template?.provider || 'custom',
          icon: template?.icon || 'Plug',
          color: template?.color || '#64748B',
          description: description || template?.description || null,
          category: template?.category || null,
          documentationUrl: template?.documentationUrl || null,
          authType,
          endpoint: endpoint || null,
          secrets: Object.keys(secrets).length > 0 ? secrets : null,
          scopes: template?.defaultScopes || null,
          environment,
        }),
      });

      if (res.ok) {
        onCreated();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create connector');
      }
    } catch (error) {
      alert('Failed to create connector');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Connector" className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Key</label>
          <Input value={connectorKey} onChange={(e) => setConnectorKey(e.target.value.replace(/\s/g, '-'))} placeholder="unique-key" className="h-8 text-sm font-mono" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium">Endpoint</label>
        <Input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://api.example.com" className="h-8 text-sm font-mono" />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium">Auth Type</label>
        <Select value={authType} onValueChange={setAuthType}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(AUTH_TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Auth fields based on type */}
      {(authType === 'api_key' || authType === 'bearer_token') && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium">{authType === 'bearer_token' ? 'Token' : 'API Key'}</label>
          <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" placeholder="Enter API key" className="h-8 text-sm font-mono" />
        </div>
      )}

      {authType === 'basic_auth' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Username</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Password</label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="h-8 text-sm" />
          </div>
        </div>
      )}

      {authType === 'oauth2' && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Access Token</label>
          <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" placeholder="OAuth access token" className="h-8 text-sm font-mono" />
        </div>
      )}

      {template?.id === 'stripe' && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Secret Key</label>
          <Input value={secretKey} onChange={(e) => setSecretKey(e.target.value)} type="password" placeholder="sk_live_..." className="h-8 text-sm font-mono" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Environment</label>
          <Select value={environment} onValueChange={setEnvironment}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="sandbox">Sandbox</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Description</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes" className="h-8 text-sm" />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={handleCreate} disabled={!name || !connectorKey || isCreating} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          {isCreating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
          Create Connector
        </Button>
      </div>
    </div>
  );
}

// ── Connector Detail Panel ──────────────────────────────────────

function ConnectorDetailPanel({
  connectorId,
  onClose,
}: {
  connectorId: string;
  onClose: () => void;
}) {
  const [connector, setConnector] = useState<ConnectorData | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const [detailRes, eventsRes] = await Promise.all([
        fetch(`/api/connectors/${connectorId}`),
        fetch(`/api/connectors/${connectorId}/events?limit=20`),
      ]);
      if (detailRes.ok) {
        const detail = await detailRes.json();
        setConnector(detail);
        setEvents(detail.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch connector detail:', error);
    } finally {
      setLoading(false);
    }
  }, [connectorId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const handleTest = async () => {
    if (!connector) return;
    setTesting(true);
    try {
      const res = await fetch(`/api/connectors/${connector.id}/test`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        await fetchDetail();
      }
    } catch {}
    setTesting(false);
  };

  const handleToggle = async () => {
    if (!connector) return;
    try {
      await fetch(`/api/connectors/${connector.id}/toggle`, { method: 'POST' });
      await fetchDetail();
    } catch {}
  };

  const handleSync = async () => {
    if (!connector) return;
    try {
      await fetch(`/api/connectors/${connector.id}/sync`, { method: 'POST' });
      await fetchDetail();
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!connector) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Connector not found
      </div>
    );
  }

  const Icon = getIcon(connector.icon);
  const statusConfig = STATUS_CONFIG[connector.status as ConnectorStatus] || STATUS_CONFIG.disconnected;
  const healthConfig = HEALTH_CONFIG[connector.healthStatus as HealthStatus] || HEALTH_CONFIG.unknown;
  const typeColor = CONNECTOR_TYPE_COLORS[connector.type as ConnectorType] || '#64748B';
  const successRate = connector.totalRequests > 0 ? Math.round(connector.successCount / connector.totalRequests * 100) : 0;

  const SEVERITY_COLORS: Record<string, string> = {
    info: 'text-blue-500',
    warn: 'text-amber-500',
    error: 'text-red-500',
    critical: 'text-red-600',
    debug: 'text-slate-400',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl border"
            style={{ backgroundColor: `${connector.color || typeColor}15`, borderColor: `${connector.color || typeColor}30` }}
          >
            <Icon className="h-7 w-7" style={{ color: connector.color || typeColor }} />
          </div>
          <div>
            <h2 className="text-lg font-bold">{connector.name}</h2>
            <p className="text-sm text-muted-foreground">{connector.provider} · v{connector.version} · {connector.environment}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <StatusDot status={connector.status} />
            <div className={cn('text-xs font-medium mt-2', statusConfig.color)}>{statusConfig.label}</div>
            <div className="text-[10px] text-muted-foreground">Status</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold" style={{ color: connector.healthScore >= 80 ? '#10B981' : connector.healthScore >= 50 ? '#F59E0B' : '#EF4444' }}>
              {connector.healthScore}
            </div>
            <div className={cn('text-xs font-medium', healthConfig.color)}>{healthConfig.label}</div>
            <div className="text-[10px] text-muted-foreground">Health</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-emerald-500">{successRate}%</div>
            <div className="text-xs font-medium text-muted-foreground">{connector.successCount}/{connector.totalRequests}</div>
            <div className="text-[10px] text-muted-foreground">Success</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold">{Math.round(connector.avgLatencyMs)}ms</div>
            <div className="text-xs font-medium text-muted-foreground">avg</div>
            <div className="text-[10px] text-muted-foreground">Latency</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleTest} disabled={testing} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          {testing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Activity className="h-3.5 w-3.5 mr-1.5" />}
          Test Connection
        </Button>
        <Button size="sm" variant="outline" onClick={handleSync} disabled={connector.status !== 'connected'}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Sync
        </Button>
        <Button size="sm" variant="outline" onClick={handleToggle}>
          {connector.enabled ? <PowerOff className="h-3.5 w-3.5 mr-1.5" /> : <Power className="h-3.5 w-3.5 mr-1.5" />}
          {connector.enabled ? 'Disable' : 'Enable'}
        </Button>
      </div>

      {/* Configuration */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Auth Type</div>
            <div className="font-medium">{AUTH_TYPE_LABELS[connector.authType as keyof typeof AUTH_TYPE_LABELS] || connector.authType}</div>
            <div className="text-muted-foreground">Endpoint</div>
            <div className="font-mono text-xs truncate">{connector.endpoint || '—'}</div>
            <div className="text-muted-foreground">Rate Limit</div>
            <div className="font-medium">{connector.rateLimitPerMin}/min</div>
            <div className="text-muted-foreground">Timeout</div>
            <div className="font-medium">{connector.timeoutMs}ms</div>
            <div className="text-muted-foreground">Auto-Reconnect</div>
            <div className="font-medium">{connector.autoReconnect ? 'Yes' : 'No'}</div>
            <div className="text-muted-foreground">Max Retries</div>
            <div className="font-medium">{connector.maxRetries}</div>
          </div>
          {connector.webhookUrl && (
            <div className="grid grid-cols-2 gap-2 text-sm pt-1 border-t border-border/30">
              <div className="text-muted-foreground">Webhook URL</div>
              <div className="font-mono text-xs truncate">{connector.webhookUrl}</div>
            </div>
          )}
          {connector.lastError && (
            <div className="mt-2 p-2 rounded-md bg-red-500/5 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3 w-3 inline mr-1" /> Last Error: {connector.lastError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Log */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No events yet</p>
            ) : events.map((event: any) => (
              <div key={event.id} className="flex items-start gap-2 text-xs">
                <span className={cn('mt-0.5 shrink-0', SEVERITY_COLORS[event.severity] || 'text-slate-400')}>
                  {event.severity === 'error' || event.severity === 'critical' ? <XCircle className="h-3 w-3" /> :
                   event.severity === 'warn' ? <AlertTriangle className="h-3 w-3" /> :
                   <Info className="h-3 w-3" />}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground mr-1.5 font-mono">
                    {new Date(event.createdAt).toLocaleTimeString()}
                  </span>
                  <span>{event.message}</span>
                </div>
                {event.durationMs != null && (
                  <span className="text-muted-foreground font-mono shrink-0">{event.durationMs}ms</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Connectors View ────────────────────────────────────────

export function ConnectorsView() {
  const [connectors, setConnectors] = useState<ConnectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ConnectorTemplate | null>(null);
  const [showRegistry, setShowRegistry] = useState(false);
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
  const [healthOverview, setHealthOverview] = useState<any>(null);

  // Fetch connectors
  const fetchConnectors = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const [connectorsRes, healthRes] = await Promise.all([
        fetch(`/api/connectors?${params}`),
        fetch('/api/connectors?overview=true'),
      ]);

      if (connectorsRes.ok) {
        const data = await connectorsRes.json();
        setConnectors(data.connectors);
      }
      if (healthRes.ok) {
        setHealthOverview(await healthRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch connectors:', error);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter]);

  useEffect(() => { fetchConnectors(); }, [fetchConnectors]);

  // Test connection
  const handleTest = async (id: string) => {
    setIsTesting(id);
    try {
      const res = await fetch(`/api/connectors/${id}/test`, { method: 'POST' });
      if (res.ok) await fetchConnectors();
    } catch {}
    setIsTesting(null);
  };

  // Toggle connector
  const handleToggle = async (id: string) => {
    try {
      const res = await fetch(`/api/connectors/${id}/toggle`, { method: 'POST' });
      if (res.ok) await fetchConnectors();
    } catch {}
  };

  // Delete connector
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this connector? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/connectors/${id}`, { method: 'DELETE' });
      if (res.ok) await fetchConnectors();
    } catch {}
  };

  // Sync connector
  const handleSync = async (id: string) => {
    try {
      await fetch(`/api/connectors/${id}/sync`, { method: 'POST' });
      await fetchConnectors();
    } catch {}
  };

  // Select connector for detail view
  const handleSelect = (id: string) => setSelectedConnectorId(id);

  // Test all connectors
  const handleTestAll = async () => {
    const enabledConnectors = connectors.filter(c => c.enabled);
    for (const c of enabledConnectors) {
      await handleTest(c.id);
    }
  };

  // Template selection from registry
  const handleTemplateSelect = (template: ConnectorTemplate) => {
    setSelectedTemplate(template);
    setShowRegistry(false);
    setShowAddDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <Plug className="h-6 w-6 inline mr-2 text-emerald-500" />
            Connectors
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage integrations, monitor health, and control connections across your platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleTestAll} disabled={connectors.filter(c => c.enabled).length === 0}>
            <Activity className="h-3.5 w-3.5 mr-1.5" /> Test All
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchConnectors()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowRegistry(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Connector
          </Button>
        </div>
      </div>

      {/* Health Overview Stats */}
      {healthOverview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Total', value: healthOverview.total, icon: Plug, color: 'text-slate-500' },
            { label: 'Connected', value: healthOverview.connected, icon: CheckCircle2, color: 'text-emerald-500' },
            { label: 'Healthy', value: healthOverview.healthy, icon: Shield, color: 'text-emerald-500' },
            { label: 'Degraded', value: healthOverview.degraded, icon: AlertTriangle, color: 'text-amber-500' },
            { label: 'Unhealthy', value: healthOverview.unhealthy, icon: XCircle, color: 'text-red-500' },
            { label: 'Errors', value: healthOverview.errors, icon: AlertCircle, color: 'text-red-500' },
            { label: 'Avg Health', value: healthOverview.avgHealthScore, icon: TrendingUp, color: healthOverview.avgHealthScore >= 80 ? 'text-emerald-500' : healthOverview.avgHealthScore >= 50 ? 'text-amber-500' : 'text-red-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="border-border/50">
              <CardContent className="p-3 flex items-center gap-2.5">
                <Icon className={cn('h-4 w-4 shrink-0', color)} />
                <div>
                  <div className={cn('text-lg font-bold leading-none', color)}>{value}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search connectors..."
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(CONNECTOR_TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="connected">Connected</SelectItem>
            <SelectItem value="disconnected">Disconnected</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Connector Grid */}
        <div className={cn('flex-1', selectedConnectorId ? 'max-w-[60%]' : '')}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
          ) : connectors.length === 0 ? (
            <Card className="border-dashed border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 mb-4">
                  <Plug className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Connectors Yet</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  Add your first connector to integrate with external services like CRM, communication, data enrichment, and more.
                </p>
                <Button onClick={() => setShowRegistry(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  <Plus className="h-4 w-4 mr-2" /> Browse Connector Library
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {connectors.map((connector) => (
                <ConnectorCard
                  key={connector.id}
                  connector={connector}
                  onTest={handleTest}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onSync={handleSync}
                  onSelect={handleSelect}
                  isTesting={isTesting}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedConnectorId && (
          <div className="w-[40%] min-w-[320px] sticky top-0 self-start">
            <Card className="border-border/50">
              <CardContent className="p-5">
                <ConnectorDetailPanel
                  connectorId={selectedConnectorId}
                  onClose={() => setSelectedConnectorId(null)}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Registry / Add Connector Dialog */}
      <Dialog open={showRegistry} onOpenChange={setShowRegistry}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-500" />
              Connector Library
            </DialogTitle>
            <DialogDescription>
              Browse and select from {CONNECTOR_TEMPLATES.length} pre-built connector templates
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="popular" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="popular" className="flex-1">Popular</TabsTrigger>
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              {(['CRM & Sales', 'Communication', 'Data & Intelligence', 'Marketing & Email', 'Analytics & BI', 'Automation'] as string[]).map(cat => (
                <TabsTrigger key={cat} value={cat} className="flex-1 hidden lg:block text-[11px]">{cat.split(' ')[0]}</TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="popular" className="mt-3 space-y-2">
              {CONNECTOR_TEMPLATES.filter(t => t.popular).map(template => (
                <TemplateCard key={template.id} template={template} onSelect={handleTemplateSelect} />
              ))}
            </TabsContent>

            <TabsContent value="all" className="mt-3 space-y-2">
              {CONNECTOR_TEMPLATES.map(template => (
                <TemplateCard key={template.id} template={template} onSelect={handleTemplateSelect} />
              ))}
            </TabsContent>

            {(['CRM & Sales', 'Communication', 'Data & Intelligence', 'Marketing & Email', 'Analytics & BI', 'Automation'] as string[]).map(cat => (
              <TabsContent key={cat} value={cat} className="mt-3 space-y-2">
                {CONNECTOR_TEMPLATES.filter(t => t.category === cat).map(template => (
                  <TemplateCard key={template.id} template={template} onSelect={handleTemplateSelect} />
                ))}
                {CONNECTOR_TEMPLATES.filter(t => t.category === cat).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No connectors in this category</p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Create Connector Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-500" />
              {selectedTemplate ? `Add ${selectedTemplate.name}` : 'Add Custom Connector'}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate ? selectedTemplate.description : 'Configure a custom connector with your own settings'}
            </DialogDescription>
          </DialogHeader>
          <CreateConnectorForm
            template={selectedTemplate}
            onClose={() => { setShowAddDialog(false); setSelectedTemplate(null); }}
            onCreated={() => { fetchConnectors(); setSelectedTemplate(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
