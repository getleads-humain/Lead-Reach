'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CreditCard,
  Zap,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Star,
  Crown,
  Sparkles,
  TrendingUp,
  DollarSign,
  Play,
  Pause,
  RotateCcw,
  BarChart3,
  Shield,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Activity,
  Receipt,
  Eye,
  Infinity,
  XCircle,
  Plus,
  FileText,
  Clock,
} from 'lucide-react';
import { safeFetchJSON } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

interface BillingPlan {
  id: string;
  name: string;
  displayName: string;
  clientType: string;
  billingCycle: string;
  basePrice: number;
  annualPrice: number;
  setupFee: number;
  pricePerApiCall: number;
  pricePerToken: number;
  pricePerLead: number;
  pricePerEnrichment: number;
  billingThreshold: number;
  includedApiCalls: number;
  includedLeads: number;
  includedEnrichments: number;
  includedTokens: number;
  maxCampaigns: number;
  maxSetters: number;
  maxTeamMembers: number;
  features: string[];
  grade: string;
  description: string;
  highlight: boolean;
  badge: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface Subscription {
  id: string;
  planId: string;
  clientType: string;
  clientName: string | null;
  clientEmail: string | null;
  status: string;
  billingCycle: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  restartedAt: string | null;
  proRatedCharge: number;
  apiCallsUsed: number;
  tokensUsed: number;
  leadsProcessed: number;
  enrichmentsProcessed: number;
  currentSpend: number;
  totalBilled: number;
  totalPaid: number;
  apiKey: string | null;
  apiEnabled: boolean;
  createdAt: string;
  plan: BillingPlan;
  billingEvents?: BillingEvent[];
}

interface BillingEvent {
  id: string;
  eventType: string;
  amount: number;
  currency: string;
  description: string | null;
  metadata: string | null;
  units: number;
  unitPrice: number;
  runningTotal: number;
  createdAt: string;
  subscription?: { plan: BillingPlan };
}

interface DashboardStats {
  totalB2B: number;
  totalB2C: number;
  activeSubscriptions: number;
  mrr: number;
  consumptionSpend: number;
  recentEvents: BillingEvent[];
  planDistribution: { planId: string; _count: number }[];
}

type TabView = 'pricing' | 'dashboard' | 'subscriptions';

// ============================================================
// Helpers
// ============================================================

const fmt = (n: number) => n === -1 ? 'Unlimited' : n.toLocaleString();
const fmtPrice = (n: number) => n === 0 ? 'Free' : `$${n.toFixed(2)}`;
const fmtUSD = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const GRADE_STYLES: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  standard: { border: 'border-border/40', bg: 'bg-card/50', text: 'text-foreground', glow: '' },
  professional: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', text: 'text-emerald-400', glow: 'shadow-emerald-500/5' },
  enterprise: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', text: 'text-amber-400', glow: 'shadow-amber-500/5' },
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  past_due: 'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  pending_restart: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  expired: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const EVENT_ICONS: Record<string, React.ElementType> = {
  subscription_created: CheckCircle2,
  subscription_cancelled: XCircle,
  subscription_restarted: RotateCcw,
  payment_processed: DollarSign,
  payment_failed: AlertCircle,
  threshold_debit: CreditCard,
  api_call: Activity,
  token_usage: Zap,
  lead_processed: Users,
  enrichment_processed: Building2,
  plan_upgrade: TrendingUp,
  plan_downgrade: ArrowRight,
};

// ============================================================
// Feature Label Map
// ============================================================

const FEATURE_LABELS: Record<string, string> = {
  'prospect-discovery': 'Prospect Discovery',
  'icp-builder': 'ICP Builder',
  'lead-scoring': 'Lead Scoring',
  'email-outreach': 'Email Outreach',
  'linkedin-outreach': 'LinkedIn Outreach',
  'phone-outreach': 'Phone Outreach',
  'basic-enrichment': 'Basic Enrichment',
  'full-enrichment': 'Full Enrichment',
  'ai-setter': 'AI Setter',
  'market-analysis': 'Market Analysis',
  'competitive-intel': 'Competitive Intel',
  'reports': 'Reports & Analytics',
  'custom-agents': 'Custom Agents',
  'api-access': 'API Access',
  'priority-support': 'Priority Support',
  'dedicated-csm': 'Dedicated CSM',
  'sso': 'SSO / SAML',
  'audit-logs': 'Audit Logs',
};

// ============================================================
// Pricing Card
// ============================================================

function PricingCard({ plan, onSelect }: { plan: BillingPlan; onSelect: (plan: BillingPlan) => void }) {
  const style = GRADE_STYLES[plan.grade] || GRADE_STYLES.standard;
  const isB2B = plan.clientType === 'b2b';
  const isConsumption = plan.billingCycle === 'consumption';

  return (
    <Card className={`relative flex flex-col ${style.border} ${style.glow} transition-all duration-300 hover:scale-[1.02] ${plan.highlight ? `ring-1 ring-emerald-500/30 ${style.bg}` : ''}`}>
      {plan.badge && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <Badge className={`text-[9px] font-bold px-3 py-0.5 ${plan.grade === 'enterprise' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
            {plan.badge}
          </Badge>
        </div>
      )}
      <CardContent className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isB2B ? 'bg-emerald-500/10' : 'bg-violet-500/10'}`}>
            {isB2B ? <Building2 className="h-4 w-4 text-emerald-400" /> : <Users className="h-4 w-4 text-violet-400" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">{plan.displayName}</h3>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{isB2B ? 'Enterprise' : 'Consumer'}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-1 mb-3 line-clamp-2 min-h-[2rem]">{plan.description}</p>

        {/* Price */}
        <div className="mb-4">
          {isConsumption ? (
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">{plan.basePrice > 0 ? `$${plan.basePrice}` : 'Pay per use'}</span>
                {plan.basePrice > 0 && <span className="text-xs text-muted-foreground">/mo base</span>}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">API Call</span>
                  <span className="text-foreground/80 font-medium">{fmtPrice(plan.pricePerApiCall)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Per Lead</span>
                  <span className="text-foreground/80 font-medium">{fmtPrice(plan.pricePerLead)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Enrichment</span>
                  <span className="text-foreground/80 font-medium">{fmtPrice(plan.pricePerEnrichment)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">1K Tokens</span>
                  <span className="text-foreground/80 font-medium">{fmtPrice(plan.pricePerToken)}</span>
                </div>
              </div>
              <div className="rounded-md bg-violet-500/10 border border-violet-500/20 px-2 py-1 mt-1">
                <span className="text-[9px] text-violet-400">Auto-debits at ${plan.billingThreshold} threshold</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">${plan.basePrice}</span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
              {plan.annualPrice > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">${plan.annualPrice.toLocaleString()}/yr</span>
                  <Badge variant="outline" className="text-[8px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    Save {Math.round((1 - plan.annualPrice / (plan.basePrice * 12)) * 100)}%
                  </Badge>
                </div>
              )}
              {plan.setupFee > 0 && (
                <span className="text-[10px] text-muted-foreground">+${plan.setupFee} setup</span>
              )}
            </div>
          )}
        </div>

        {/* Limits */}
        <div className="grid grid-cols-2 gap-1.5 mb-4">
          <div className="rounded-md bg-secondary/20 px-2 py-1.5">
            <span className="text-[9px] text-muted-foreground block">API Calls</span>
            <span className="text-xs font-bold text-foreground/80">{fmt(plan.includedApiCalls)}/mo</span>
          </div>
          <div className="rounded-md bg-secondary/20 px-2 py-1.5">
            <span className="text-[9px] text-muted-foreground block">Leads</span>
            <span className="text-xs font-bold text-foreground/80">{fmt(plan.includedLeads)}/mo</span>
          </div>
          <div className="rounded-md bg-secondary/20 px-2 py-1.5">
            <span className="text-[9px] text-muted-foreground block">Enrichments</span>
            <span className="text-xs font-bold text-foreground/80">{fmt(plan.includedEnrichments)}/mo</span>
          </div>
          <div className="rounded-md bg-secondary/20 px-2 py-1.5">
            <span className="text-[9px] text-muted-foreground block">Setters</span>
            <span className="text-xs font-bold text-foreground/80">{fmt(plan.maxSetters)}</span>
          </div>
        </div>

        {/* Features */}
        <div className="flex-1 mb-4">
          <div className="space-y-1">
            {plan.features.slice(0, 6).map((f, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                <span className="text-[10px] text-foreground/70">{FEATURE_LABELS[f] || f}</span>
              </div>
            ))}
            {plan.features.length > 6 && (
              <span className="text-[9px] text-muted-foreground">+{plan.features.length - 6} more features</span>
            )}
          </div>
        </div>

        {/* CTA */}
        <Button
          className={`w-full font-semibold gap-2 text-xs ${
            plan.highlight
              ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
              : 'bg-secondary/30 hover:bg-secondary/50 text-foreground border border-border/30'
          }`}
          onClick={() => onSelect(plan)}
        >
          {isConsumption ? <Zap className="h-3.5 w-3.5" /> : <CreditCard className="h-3.5 w-3.5" />}
          {isConsumption ? 'Start Free' : `Subscribe ${plan.basePrice > 0 ? `$${plan.basePrice}/mo` : ''}`}
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Subscription Card
// ============================================================

function SubscriptionCard({ sub, onAction }: { sub: Subscription; onAction: (action: string, id: string) => void }) {
  const isB2B = sub.clientType === 'b2b';
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-border/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isB2B ? 'bg-emerald-500/10' : 'bg-violet-500/10'}`}>
              {isB2B ? <Building2 className="h-5 w-5 text-emerald-400" /> : <Users className="h-5 w-5 text-violet-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-foreground">{sub.plan?.displayName || 'Unknown Plan'}</h4>
                <Badge variant="outline" className={`text-[8px] ${STATUS_STYLES[sub.status] || STATUS_STYLES.active}`}>{sub.status}</Badge>
                {sub.cancelAtPeriodEnd && (
                  <Badge variant="outline" className="text-[8px] bg-amber-500/10 text-amber-400 border-amber-500/20">Cancelling</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] text-muted-foreground">{isB2B ? 'B2B Enterprise' : 'B2C Consumer'} &middot; {sub.billingCycle}</span>
                {sub.clientName && <span className="text-[10px] text-muted-foreground">{sub.clientName}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isB2B && sub.status === 'active' && !sub.cancelAtPeriodEnd && (
              <Button variant="outline" size="sm" className="text-[10px] h-7 gap-1 border-amber-500/20 text-amber-400 hover:bg-amber-500/10" onClick={() => onAction('stop', sub.id)}>
                <Pause className="h-3 w-3" /> Stop
              </Button>
            )}
            {isB2B && (sub.cancelAtPeriodEnd || sub.status === 'cancelled') && (
              <Button variant="outline" size="sm" className="text-[10px] h-7 gap-1 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10" onClick={() => onAction('restart', sub.id)}>
                <RotateCcw className="h-3 w-3" /> Restart
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-muted-foreground h-7" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border/20 space-y-3">
            {/* Usage / Spend */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {isB2B ? (
                <>
                  <div className="rounded-lg bg-secondary/20 p-2">
                    <span className="text-[9px] text-muted-foreground block">Total Billed</span>
                    <span className="text-sm font-bold text-foreground">{fmtUSD(sub.totalBilled)}</span>
                  </div>
                  <div className="rounded-lg bg-secondary/20 p-2">
                    <span className="text-[9px] text-muted-foreground block">Total Paid</span>
                    <span className="text-sm font-bold text-emerald-400">{fmtUSD(sub.totalPaid)}</span>
                  </div>
                  <div className="rounded-lg bg-secondary/20 p-2">
                    <span className="text-[9px] text-muted-foreground block">Period End</span>
                    <span className="text-xs font-medium text-foreground/80">{sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="rounded-lg bg-secondary/20 p-2">
                    <span className="text-[9px] text-muted-foreground block">API Key</span>
                    <span className="text-[10px] font-mono text-foreground/60">{sub.apiKey ? `${sub.apiKey.slice(0, 12)}...` : 'None'}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-lg bg-secondary/20 p-2">
                    <span className="text-[9px] text-muted-foreground block">Current Spend</span>
                    <span className="text-sm font-bold text-violet-400">{fmtUSD(sub.currentSpend)}</span>
                    {sub.plan && sub.plan.billingThreshold > 0 && (
                      <Progress value={(sub.currentSpend / sub.plan.billingThreshold) * 100} className="h-1 mt-1 bg-secondary/40 [&>div]:bg-violet-400" />
                    )}
                  </div>
                  <div className="rounded-lg bg-secondary/20 p-2">
                    <span className="text-[9px] text-muted-foreground block">API Calls</span>
                    <span className="text-sm font-bold text-foreground">{sub.apiCallsUsed.toLocaleString()}</span>
                  </div>
                  <div className="rounded-lg bg-secondary/20 p-2">
                    <span className="text-[9px] text-muted-foreground block">Leads</span>
                    <span className="text-sm font-bold text-foreground">{sub.leadsProcessed.toLocaleString()}</span>
                  </div>
                  <div className="rounded-lg bg-secondary/20 p-2">
                    <span className="text-[9px] text-muted-foreground block">Enrichments</span>
                    <span className="text-sm font-bold text-foreground">{sub.enrichmentsProcessed.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            {/* Recent Events */}
            {sub.billingEvents && sub.billingEvents.length > 0 && (
              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Recent Events</span>
                <div className="space-y-1 mt-1">
                  {sub.billingEvents.slice(0, 5).map((evt) => {
                    const EvtIcon = EVENT_ICONS[evt.eventType] || FileText;
                    return (
                      <div key={evt.id} className="flex items-center gap-2 py-1 px-2 rounded bg-secondary/10">
                        <EvtIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-[10px] text-foreground/70 flex-1 truncate">{evt.description || evt.eventType}</span>
                        {evt.amount > 0 && <span className="text-[10px] font-medium text-foreground/80">{fmtUSD(evt.amount)}</span>}
                        <span className="text-[9px] text-muted-foreground/50">{new Date(evt.createdAt).toLocaleDateString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Operational Logic Matrix Display
// ============================================================

function LogicMatrixView() {
  return (
    <Card className="border-border/30">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-amber-400" />
          <h3 className="text-sm font-bold text-foreground">Operational Logic Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Client Type</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Billing Mechanism</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">System Action on User Event</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">GIFT City Ledger Impact</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/10">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-emerald-400" />
                    <div>
                      <span className="font-bold text-foreground block">B2B</span>
                      <span className="text-[9px] text-muted-foreground">Enterprise</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-foreground/80">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="h-3 w-3 text-emerald-400" />
                    <span className="font-medium">Recurring Fixed Cycle</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Monthly / Annual</span>
                </td>
                <td className="py-3 px-3">
                  <div className="space-y-2">
                    <div className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Pause className="h-3 w-3 text-amber-400" />
                        <span className="font-medium text-amber-400">Stop Command</span>
                      </div>
                      <span className="text-[10px] text-foreground/70">Flags subscription to cancel at the end of the paid period</span>
                    </div>
                    <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <RotateCcw className="h-3 w-3 text-emerald-400" />
                        <span className="font-medium text-emerald-400">Restart Command</span>
                      </div>
                      <span className="text-[10px] text-foreground/70">Instantly charges pro-rated amount and reactivates API keys</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-foreground/80">Predictable, recurring revenue streams with deferred income tracking</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-violet-400" />
                    <div>
                      <span className="font-bold text-foreground block">B2C</span>
                      <span className="text-[9px] text-muted-foreground">Consumer</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-foreground/80">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="h-3 w-3 text-violet-400" />
                    <span className="font-medium">Consumption / Pay-as-you-go</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Per action / token / operation</span>
                </td>
                <td className="py-3 px-3">
                  <div className="space-y-2">
                    <div className="rounded-md bg-violet-500/10 border border-violet-500/20 px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Activity className="h-3 w-3 text-violet-400" />
                        <span className="font-medium text-violet-400">API Trigger Event</span>
                      </div>
                      <span className="text-[10px] text-foreground/70">Counts actions, tokens, or operations processed by HumAIn Spark</span>
                    </div>
                    <div className="rounded-md bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <CreditCard className="h-3 w-3 text-cyan-400" />
                        <span className="font-medium text-cyan-400">Billing Event</span>
                      </div>
                      <span className="text-[10px] text-foreground/70">Debits the user&apos;s payment method automatically at preset data thresholds</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-foreground/80">Variable, high-volume micro-transactions grouped into a single ledger</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main Billing View
// ============================================================

export function BillingView() {
  const [activeTab, setActiveTab] = useState<TabView>('pricing');
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Seed plans first
      await safeFetchJSON('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      });

      const [plansRes, subsRes, statsRes] = await Promise.all([
        safeFetchJSON<{ plans: BillingPlan[] }>('/api/billing?type=plans'),
        safeFetchJSON<{ subscriptions: Subscription[] }>('/api/billing?type=subscriptions'),
        safeFetchJSON<DashboardStats>('/api/billing?type=dashboard'),
      ]);

      if (plansRes.plans) setPlans(plansRes.plans);
      if (subsRes.subscriptions) setSubscriptions(subsRes.subscriptions);
      if (statsRes) setStats(statsRes);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // Handle plan subscription
  const handleSubscribe = async (plan: BillingPlan) => {
    setActionLoading(plan.name);
    try {
      const result = await safeFetchJSON<{ subscription: Record<string, unknown>; apiKey: string }>('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          planName: plan.name,
          billingCycle: plan.billingCycle === 'annual' ? 'annual' : 'monthly',
        }),
      });
      if (result.apiKey) {
        setNotification({ type: 'success', message: `Subscribed to ${plan.displayName}! API Key: ${result.apiKey.slice(0, 16)}...` });
        loadData();
      }
    } catch (error) {
      setNotification({ type: 'error', message: `Failed to subscribe: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle subscription actions
  const handleSubAction = async (action: string, subscriptionId: string) => {
    setActionLoading(`${action}-${subscriptionId}`);
    try {
      const result = await safeFetchJSON<{ success: boolean; message: string }>('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, subscriptionId }),
      });
      setNotification({ type: result.success !== false ? 'success' : 'error', message: result.message || `${action} processed` });
      loadData();
    } catch (error) {
      setNotification({ type: 'error', message: `Action failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setActionLoading(null);
    }
  };

  const b2bPlans = plans.filter((p) => p.clientType === 'b2b');
  const b2cPlans = plans.filter((p) => p.clientType === 'b2c');

  const tabs: { key: TabView; label: string; icon: React.ElementType }[] = [
    { key: 'pricing', label: 'Plans & Pricing', icon: CreditCard },
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { key: 'subscriptions', label: 'Subscriptions', icon: Receipt },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-emerald-400" />
            HumAIn Spark Billing
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Industry-graded pricing with dual-track billing: recurring for B2B, consumption for B2C
          </p>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-2 rounded-lg px-3 py-2 text-xs font-medium ${
          notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-border/20 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/20'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            </div>
          ) : (
            <>
              {/* ═══ PRICING TAB ═══ */}
              {activeTab === 'pricing' && (
                <div className="space-y-8">
                  {/* Operational Logic Matrix */}
                  <LogicMatrixView />

                  {/* B2B Plans */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-foreground">B2B Enterprise — Recurring Fixed Cycle</h3>
                      <Badge variant="outline" className="text-[8px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Monthly / Annual</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {b2bPlans.map((plan) => (
                        <PricingCard key={plan.id} plan={plan} onSelect={handleSubscribe} />
                      ))}
                    </div>
                  </div>

                  {/* B2C Plans */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-violet-400" />
                      <h3 className="text-sm font-bold text-foreground">B2C Consumer — Consumption / Pay-as-you-go</h3>
                      <Badge variant="outline" className="text-[8px] bg-violet-500/10 text-violet-400 border-violet-500/20">Auto-debit at thresholds</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                      {b2cPlans.map((plan) => (
                        <PricingCard key={plan.id} plan={plan} onSelect={handleSubscribe} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ DASHBOARD TAB ═══ */}
              {activeTab === 'dashboard' && stats && (
                <div className="space-y-4">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <Card className="border-border/30">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-[10px] text-muted-foreground">B2B Clients</span>
                        </div>
                        <span className="text-xl font-bold text-foreground">{stats.totalB2B}</span>
                      </CardContent>
                    </Card>
                    <Card className="border-border/30">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="h-3.5 w-3.5 text-violet-400" />
                          <span className="text-[10px] text-muted-foreground">B2C Users</span>
                        </div>
                        <span className="text-xl font-bold text-foreground">{stats.totalB2C}</span>
                      </CardContent>
                    </Card>
                    <Card className="border-border/30">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="h-3.5 w-3.5 text-cyan-400" />
                          <span className="text-[10px] text-muted-foreground">Active</span>
                        </div>
                        <span className="text-xl font-bold text-foreground">{stats.activeSubscriptions}</span>
                      </CardContent>
                    </Card>
                    <Card className="border-border/30">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-[10px] text-muted-foreground">B2B MRR</span>
                        </div>
                        <span className="text-xl font-bold text-emerald-400">{fmtUSD(stats.mrr)}</span>
                      </CardContent>
                    </Card>
                    <Card className="border-border/30">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="h-3.5 w-3.5 text-violet-400" />
                          <span className="text-[10px] text-muted-foreground">B2C Spend</span>
                        </div>
                        <span className="text-xl font-bold text-violet-400">{fmtUSD(stats.consumptionSpend)}</span>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Events */}
                  <Card className="border-border/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Receipt className="h-4 w-4 text-foreground/70" />
                        <h4 className="text-sm font-bold text-foreground">Recent Billing Events</h4>
                      </div>
                      {stats.recentEvents && stats.recentEvents.length > 0 ? (
                        <div className="space-y-1.5">
                          {stats.recentEvents.map((evt) => {
                            const EvtIcon = EVENT_ICONS[evt.eventType] || FileText;
                            return (
                              <div key={evt.id} className="flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg bg-secondary/10">
                                <EvtIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-xs text-foreground/70 flex-1 truncate">{evt.description || evt.eventType}</span>
                                {evt.amount > 0 && <span className="text-xs font-bold text-foreground">{fmtUSD(evt.amount)}</span>}
                                <span className="text-[10px] text-muted-foreground/50">{new Date(evt.createdAt).toLocaleString()}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-4">No billing events yet. Subscribe to a plan to get started.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ═══ SUBSCRIPTIONS TAB ═══ */}
              {activeTab === 'subscriptions' && (
                <div className="space-y-3">
                  {subscriptions.length > 0 ? (
                    <>
                      {/* B2B Subs */}
                      {subscriptions.some((s) => s.clientType === 'b2b') && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-4 w-4 text-emerald-400" />
                            <h4 className="text-xs font-bold text-foreground">B2B Enterprise Subscriptions</h4>
                          </div>
                          <div className="space-y-2">
                            {subscriptions.filter((s) => s.clientType === 'b2b').map((sub) => (
                              <SubscriptionCard key={sub.id} sub={sub} onAction={handleSubAction} />
                            ))}
                          </div>
                        </div>
                      )}
                      {/* B2C Subs */}
                      {subscriptions.some((s) => s.clientType === 'b2c') && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-violet-400" />
                            <h4 className="text-xs font-bold text-foreground">B2C Consumer Subscriptions</h4>
                          </div>
                          <div className="space-y-2">
                            {subscriptions.filter((s) => s.clientType === 'b2c').map((sub) => (
                              <SubscriptionCard key={sub.id} sub={sub} onAction={handleSubAction} />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="h-16 w-16 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-3">
                        <CreditCard className="h-8 w-8 text-emerald-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground/90 mb-1">No Subscriptions Yet</h3>
                      <p className="text-xs text-muted-foreground text-center max-w-md">
                        Choose a plan from the Pricing tab to create your first subscription and start using HumAIn Spark.
                      </p>
                      <Button className="mt-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 text-xs" onClick={() => setActiveTab('pricing')}>
                        <Sparkles className="h-3.5 w-3.5" /> View Plans
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
