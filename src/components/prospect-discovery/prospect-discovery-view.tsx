'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Telescope,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  Globe,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  ExternalLink,
  Plus,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Zap,
  Users,
  BarChart3,
  Briefcase,
  Calendar,
  DollarSign,
  FileText,
  Star,
  RefreshCw,
  Target,
  Brain,
  MessageSquare,
  Send,
  Lightbulb,
  TrendingUp,
  Shield,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { safeFetchJSON } from '@/lib/utils';
import type {
  AgentPersona,
  AgentMessage,
  AgentThinking,
  AgentAction,
  ProspectResult,
  ICPResult,
  OutreachResult,
  MarketResult,
  ScoreResult,
  ConversationContext,
  SuggestedAction,
  InsightItem,
  NavigationSuggestion,
  ViewType,
} from '@/lib/prospect-agent/types';
import { PERSONA_META } from '@/lib/prospect-agent/types';

// ============================================================
// Icon mapping for dynamic icon rendering
// ============================================================

const ICON_MAP: Record<string, React.ElementType> = {
  Plus, Star, Mail, Search, Building2, Target, User, Globe,
  Telescope, Sparkles, Zap, Users, BarChart3, Briefcase,
  TrendingUp, AlertCircle, Send, Lightbulb, ArrowRight,
};

// ============================================================
// Safe timestamp formatter — handles both Date objects and
// ISO strings that arrive via JSON serialization
// ============================================================

function safeFormatTime(timestamp: Date | string | number | undefined | null): string {
  try {
    if (!timestamp) return '';
    const d = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString();
  } catch {
    return '';
  }
}

// ============================================================
// Helper Components
// ============================================================

function PersonaBadge({ persona, size = 'sm' }: { persona: AgentPersona; size?: 'sm' | 'lg' }) {
  const meta = PERSONA_META[persona];
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  };
  const colorClass = colorMap[meta.color] || colorMap.emerald;
  const sizeClass = size === 'lg' ? 'text-xs px-2.5 py-1' : 'text-[9px] px-1.5 py-0.5';

  return (
    <Badge variant="outline" className={`${colorClass} ${sizeClass} font-medium gap-1`}>
      <span>{meta.emoji}</span>
      <span>{meta.name}</span>
    </Badge>
  );
}

function ThinkingIndicator({ thinking }: { thinking: AgentThinking }) {
  const [expanded, setExpanded] = useState(false);
  const meta = PERSONA_META[thinking.persona];

  return (
    <div className="rounded-lg border border-border/30 bg-secondary/10 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-[10px] font-medium text-violet-400">Agent Thinking</span>
          <PersonaBadge persona={thinking.persona} />
          <span className="text-[9px] text-muted-foreground/50">
            {Math.round(thinking.confidence * 100)}% confidence
          </span>
        </div>
        {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-3 py-2 space-y-2 border-t border-border/20">
          <p className="text-[10px] text-muted-foreground/70">{thinking.reasoning}</p>
          <div className="space-y-1">
            {thinking.plan.map((step, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-violet-400/50" />
                <span className="text-[9px] text-muted-foreground/60">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionStepIndicator({ action }: { action: AgentAction }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-secondary/20 text-xs">
      {action.status === 'running' && <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />}
      {action.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
      {action.status === 'failed' && <AlertCircle className="h-3.5 w-3.5 text-red-400" />}
      {action.status === 'pending' && <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30" />}
      <span className={`font-medium ${
        action.status === 'running' ? 'text-cyan-400' :
        action.status === 'completed' ? 'text-emerald-400' :
        'text-muted-foreground'
      }`}>
        {action.label}
      </span>
      <span className="text-muted-foreground/60 text-[10px] flex-1 truncate">{action.message}</span>
    </div>
  );
}

function DataField({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value: string | null | undefined; href?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground/60 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{label}</span>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="block text-xs text-cyan-400 hover:text-cyan-300 truncate">
            {value} <ExternalLink className="h-2.5 w-2.5 inline" />
          </a>
        ) : (
          <p className="text-xs text-foreground/90 break-words">{value}</p>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, defaultOpen = true }: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-border/30 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2 bg-secondary/20 hover:bg-secondary/30 transition-colors">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground/80">{title}</span>
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && <div className="px-3 py-2 space-y-0.5">{children}</div>}
    </div>
  );
}

function TagList({ items, color = 'cyan' }: { items: string[]; color?: string }) {
  if (!items || items.length === 0) return null;
  const colorMap: Record<string, string> = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  };
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <Badge key={i} variant="outline" className={`text-[9px] ${colorMap[color] || colorMap.cyan}`}>
          {item}
        </Badge>
      ))}
    </div>
  );
}

function SuggestedActionButtons({ actions, onAction }: { actions: SuggestedAction[]; onAction: (prompt: string) => void }) {
  if (!actions || actions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {actions.map((action, i) => {
        const Icon = ICON_MAP[action.icon] || Sparkles;
        return (
          <Button
            key={i}
            variant="outline"
            size="sm"
            className="text-[10px] h-7 gap-1.5 border-border/40 hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400 transition-colors"
            onClick={() => onAction(action.prompt)}
          >
            <Icon className="h-3 w-3" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}

// ============================================================
// Prospect Data Card
// ============================================================

function ProspectDataCard({
  prospect,
  messageId,
  converted,
  leadId,
  onConvert,
  onViewLeads,
}: {
  prospect: ProspectResult;
  messageId: string;
  converted?: boolean;
  leadId?: string;
  onConvert: (msgId: string, p: ProspectResult) => void;
  onViewLeads: () => void;
}) {
  const completenessColor = (pct: number) => {
    if (pct >= 70) return 'text-emerald-400';
    if (pct >= 40) return 'text-amber-400';
    return 'text-red-400';
  };
  const completenessBarColor = (pct: number) => {
    if (pct >= 70) return '[&>div]:bg-emerald-400';
    if (pct >= 40) return '[&>div]:bg-amber-400';
    return '[&>div]:bg-red-400';
  };

  return (
    <Card className="border-border/30 ml-9">
      <CardContent className="p-4 space-y-3">
        {prospect.companyName && (
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-base font-bold text-foreground/90">{prospect.companyName}</h4>
              {prospect.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{prospect.description}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <Progress value={prospect.dataCompleteness} className={`h-1.5 w-16 bg-secondary/40 ${completenessBarColor(prospect.dataCompleteness)}`} />
              <span className={`text-xs font-bold ${completenessColor(prospect.dataCompleteness)}`}>{prospect.dataCompleteness}%</span>
            </div>
          </div>
        )}

        {prospect.personName && !prospect.companyName && (
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-base font-bold text-foreground/90">{prospect.personName}</h4>
              {prospect.personTitle && <p className="text-xs text-cyan-400">{prospect.personTitle}</p>}
              {prospect.personBio && <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{prospect.personBio}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <Progress value={prospect.dataCompleteness} className={`h-1.5 w-16 bg-secondary/40 ${completenessBarColor(prospect.dataCompleteness)}`} />
              <span className={`text-xs font-bold ${completenessColor(prospect.dataCompleteness)}`}>{prospect.dataCompleteness}%</span>
            </div>
          </div>
        )}

        {prospect.personName && prospect.companyName && (
          <div className="rounded-md bg-cyan-500/5 border border-cyan-500/10 p-2.5">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xs font-medium text-cyan-400">Key Person</span>
            </div>
            <p className="text-xs font-medium text-foreground/90">{prospect.personName}</p>
            {prospect.personTitle && <p className="text-[10px] text-muted-foreground">{prospect.personTitle}</p>}
            {prospect.personEmail && <p className="text-[10px] text-cyan-400">{prospect.personEmail}</p>}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <SectionCard title="Contact Information" icon={Mail}>
            <DataField icon={Mail} label="Email" value={prospect.generalEmail} href={prospect.generalEmail ? `mailto:${prospect.generalEmail}` : null} />
            <DataField icon={Mail} label="Support" value={prospect.supportEmail} href={prospect.supportEmail ? `mailto:${prospect.supportEmail}` : null} />
            <DataField icon={Phone} label="Phone" value={prospect.phoneMain} href={prospect.phoneMain ? `tel:${prospect.phoneMain}` : null} />
            <DataField icon={Globe} label="Website" value={prospect.website} href={prospect.website} />
          </SectionCard>
          <SectionCard title="Location" icon={MapPin}>
            <DataField icon={MapPin} label="Address" value={prospect.hqAddress} />
            <DataField icon={MapPin} label="City" value={prospect.city} />
            <DataField icon={MapPin} label="State" value={prospect.stateProvince} />
            <DataField icon={MapPin} label="Country" value={prospect.country} />
          </SectionCard>
          <SectionCard title="Firmographics" icon={BarChart3}>
            <DataField icon={Users} label="Employees" value={prospect.employeeCount} />
            <DataField icon={DollarSign} label="Revenue" value={prospect.revenueEstimate} />
            <DataField icon={Calendar} label="Founded" value={prospect.foundingYear} />
            <DataField icon={Building2} label="Industry" value={prospect.industry} />
          </SectionCard>
          <SectionCard title="Key People" icon={Users}>
            <DataField icon={Star} label="CEO" value={prospect.ceoName} />
            <DataField icon={Mail} label="CEO Email" value={prospect.ceoEmail} href={prospect.ceoEmail ? `mailto:${prospect.ceoEmail}` : null} />
            <DataField icon={User} label="Key Contact" value={prospect.keyContactName ? `${prospect.keyContactName}${prospect.keyContactTitle ? ` (${prospect.keyContactTitle})` : ''}` : null} />
            <DataField icon={Mail} label="Contact Email" value={prospect.keyContactEmail} href={prospect.keyContactEmail ? `mailto:${prospect.keyContactEmail}` : null} />
          </SectionCard>
          <SectionCard title="Digital Presence" icon={Globe}>
            <DataField icon={Linkedin} label="LinkedIn" value={prospect.linkedinUrl} href={prospect.linkedinUrl} />
            <DataField icon={Twitter} label="Twitter/X" value={prospect.twitterHandle} />
            <DataField icon={Globe} label="Facebook" value={prospect.facebookPage} href={prospect.facebookPage} />
          </SectionCard>
          <SectionCard title="Products & Services" icon={FileText} defaultOpen={(prospect.productsServices?.length || 0) > 0}>
            <TagList items={prospect.productsServices || []} color="emerald" />
            {prospect.techStack?.length > 0 && (
              <div className="mt-2">
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Tech Stack</span>
                <TagList items={prospect.techStack} color="violet" />
              </div>
            )}
            <DataField icon={DollarSign} label="Funding" value={prospect.fundingInfo} />
          </SectionCard>
        </div>

        {prospect.boardMembers?.length > 0 && (
          <SectionCard title="Board Members & Leadership" icon={Users} defaultOpen={false}>
            <TagList items={prospect.boardMembers} color="amber" />
          </SectionCard>
        )}

        {prospect.recentNews?.length > 0 && (
          <SectionCard title="Recent News & Activity" icon={FileText} defaultOpen={false}>
            {prospect.recentNews.map((news, i) => (
              <div key={i} className="flex items-start gap-2 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <p className="text-xs text-muted-foreground">{news}</p>
              </div>
            ))}
          </SectionCard>
        )}

        {/* Domain-Specific Intelligence Section */}
        {prospect.detectedDomain && prospect.detectedDomain !== 'general' && (
          <div className="rounded-md bg-violet-500/5 border border-violet-500/15 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-violet-400">
                {prospect.domainLabel || 'Domain Intelligence'} — 4-Phase Pipeline Active
              </span>
            </div>
            {prospect.domainData && prospect.domainData.length > 0 ? (
              <div className="space-y-2">
                {prospect.domainData.map((record, idx) => (
                  <div key={idx} className="rounded bg-background/50 border border-border/20 p-2 space-y-1.5">
                    {/* Render record name/title */}
                    {(record.vc_firm_name || record.pe_firm_name || record.fund_name || record.company_name || record.entity_name || record.firm_name || record.contractor_name || record.manager_name) && (
                      <h5 className="text-xs font-bold text-foreground/90">
                        {String(record.vc_firm_name || record.pe_firm_name || record.fund_name || record.company_name || record.entity_name || record.firm_name || record.contractor_name || record.manager_name || `Record ${idx + 1}`)}
                      </h5>
                    )}
                    {/* Render key fields in a compact grid */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      {Object.entries(record).filter(([k, v]) => v !== null && v !== undefined && k !== 'sources' && k !== 'limited_partners' && k !== 'stages_contact_matrix' && k !== 'kpis' && typeof v !== 'object').slice(0, 8).map(([key, val]) => (
                        <div key={key} className="flex flex-col">
                          <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">{key.replace(/_/g, ' ')}</span>
                          <span className="text-[11px] text-foreground/80 truncate">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                    {/* Render KPIs if present */}
                    {record.kpis && typeof record.kpis === 'object' && (
                      <div className="grid grid-cols-3 gap-x-3 gap-y-1 mt-1 pt-1 border-t border-border/10">
                        {Object.entries(record.kpis as Record<string, unknown>).filter(([, v]) => v !== null && v !== undefined).map(([key, val]) => (
                          <div key={key} className="flex flex-col">
                            <span className="text-[9px] text-emerald-400/60 uppercase tracking-wider">{key.replace(/_/g, ' ')}</span>
                            <span className="text-[11px] text-emerald-300/90">{typeof val === 'number' ? val.toLocaleString() : String(val)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Render Contact Stage Matrix if present */}
                    {record.stages_contact_matrix && typeof record.stages_contact_matrix === 'object' && (
                      <div className="mt-1 pt-1 border-t border-border/10 space-y-1">
                        <span className="text-[9px] text-cyan-400/60 uppercase tracking-wider">Contact Stage Matrix</span>
                        {Object.entries(record.stages_contact_matrix as Record<string, unknown>).map(([stage, details]) => (
                          <div key={stage} className="rounded bg-background/30 p-1.5">
                            <span className="text-[9px] font-semibold text-cyan-400 uppercase">{stage.replace(/_/g, ' ')}</span>
                            {details && typeof details === 'object' && (
                              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-0.5">
                                {Object.entries(details as Record<string, unknown>).filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => (
                                  <div key={k} className="flex items-center gap-1">
                                    <span className="text-[8px] text-muted-foreground/50">{k.replace(/_/g, ' ')}:</span>
                                    <span className="text-[10px] text-foreground/70 truncate">{String(v)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Render Limited Partners if present */}
                    {record.limited_partners && Array.isArray(record.limited_partners) && record.limited_partners.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-border/10 space-y-1">
                        <span className="text-[9px] text-amber-400/60 uppercase tracking-wider">Limited Partners ({record.limited_partners.length})</span>
                        {record.limited_partners.map((lp: unknown, lpIdx: number) => (
                          <div key={lpIdx} className="rounded bg-background/30 p-1.5">
                            {lp && typeof lp === 'object' && (
                              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                                {Object.entries(lp as Record<string, unknown>).filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => (
                                  <div key={k} className="flex items-center gap-1">
                                    <span className="text-[8px] text-muted-foreground/50">{k.replace(/_/g, ' ')}:</span>
                                    <span className="text-[10px] text-foreground/70 truncate">{typeof v === 'number' ? v.toLocaleString() : String(v)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">Domain-specific research completed. Structured records available in API response.</p>
            )}
          </div>
        )}

        {prospect.sources?.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[9px] text-muted-foreground/50">Sources:</span>
            {prospect.sources.slice(0, 5).map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="text-[9px] text-cyan-400/70 hover:text-cyan-400 truncate max-w-[150px]">
                {src.replace(/^https?:\/\//, '').split('/')[0]}
              </a>
            ))}
            {prospect.sources.length > 5 && <span className="text-[9px] text-muted-foreground/50">+{prospect.sources.length - 5} more</span>}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          {converted ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Added to Leads</span>
              <Button variant="ghost" size="sm" className="text-[10px] text-muted-foreground hover:text-foreground gap-1 h-6" onClick={onViewLeads}>
                View in Leads <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button onClick={() => onConvert(messageId, prospect)} className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all text-xs h-8">
              <Plus className="h-3.5 w-3.5" />Add to Leads
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// ICP Data Card
// ============================================================

function ICPDataCard({ icp }: { icp: ICPResult }) {
  return (
    <Card className="border-amber-500/20 ml-9">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-amber-400" />
          <h4 className="text-sm font-bold text-foreground/90">{icp.name}</h4>
        </div>
        {icp.description && <p className="text-xs text-muted-foreground">{icp.description}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {icp.firmographic.industries.length > 0 && (
            <SectionCard title="Industries" icon={Briefcase}>
              <TagList items={icp.firmographic.industries} color="emerald" />
            </SectionCard>
          )}
          {icp.firmographic.companySizes.length > 0 && (
            <SectionCard title="Company Sizes" icon={Users}>
              <TagList items={icp.firmographic.companySizes} color="cyan" />
            </SectionCard>
          )}
          {icp.firmographic.locations.length > 0 && (
            <SectionCard title="Locations" icon={MapPin}>
              <TagList items={icp.firmographic.locations} color="violet" />
            </SectionCard>
          )}
          {icp.technographic.requiredTech.length > 0 && (
            <SectionCard title="Required Tech" icon={Zap}>
              <TagList items={icp.technographic.requiredTech} color="amber" />
            </SectionCard>
          )}
          {icp.psychographic.challenges.length > 0 && (
            <SectionCard title="Challenges" icon={AlertCircle}>
              <TagList items={icp.psychographic.challenges} color="rose" />
            </SectionCard>
          )}
          {icp.behavioral.buyingSignals.length > 0 && (
            <SectionCard title="Buying Signals" icon={TrendingUp}>
              <TagList items={icp.behavioral.buyingSignals} color="emerald" />
            </SectionCard>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Market Analysis Card
// ============================================================

function MarketDataCard({ market }: { market: MarketResult }) {
  return (
    <Card className="border-violet-500/20 ml-9">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-violet-400" />
          <h4 className="text-sm font-bold text-foreground/90">Market Analysis: {market.query}</h4>
        </div>
        {market.summary && <p className="text-xs text-muted-foreground">{market.summary}</p>}
        {market.keyFindings.length > 0 && (
          <SectionCard title="Key Findings" icon={Lightbulb}>
            {market.keyFindings.map((f, i) => (
              <div key={i} className="flex items-start gap-2 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                <p className="text-xs text-foreground/80">{f}</p>
              </div>
            ))}
          </SectionCard>
        )}
        {market.competitors.length > 0 && (
          <SectionCard title="Competitors" icon={Shield} defaultOpen={false}>
            {market.competitors.map((c, i) => (
              <div key={i} className="py-1.5 border-b border-border/20 last:border-0">
                <p className="text-xs font-medium text-foreground/90">{c.name}</p>
                {c.description && <p className="text-[10px] text-muted-foreground">{c.description}</p>}
                {c.strengths.length > 0 && <TagList items={c.strengths} color="emerald" />}
              </div>
            ))}
          </SectionCard>
        )}
        {market.trends.length > 0 && (
          <SectionCard title="Trends" icon={TrendingUp} defaultOpen={false}>
            {market.trends.map((t, i) => (
              <div key={i} className="flex items-start gap-2 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <p className="text-xs text-foreground/80">{t}</p>
              </div>
            ))}
          </SectionCard>
        )}
        {market.opportunities.length > 0 && (
          <SectionCard title="Opportunities" icon={Lightbulb} defaultOpen={false}>
            {market.opportunities.map((o, i) => (
              <div key={i} className="flex items-start gap-2 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <p className="text-xs text-foreground/80">{o}</p>
              </div>
            ))}
          </SectionCard>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Score Data Card
// ============================================================

function ScoreDataCard({ score }: { score: ScoreResult }) {
  const tierColor: Record<string, string> = { ideal: 'text-emerald-400', strong: 'text-cyan-400', moderate: 'text-amber-400', weak: 'text-orange-400', poor: 'text-red-400' };
  return (
    <Card className="border-rose-500/20 ml-9">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-rose-400" />
            <h4 className="text-sm font-bold text-foreground/90">Lead Score</h4>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${tierColor[score.tier] || 'text-foreground'}`}>{score.overallScore}</span>
            <Badge variant="outline" className={`text-[9px] ${tierColor[score.tier]}`}>{score.tier}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(score.dimensions).map(([key, dim]) => (
            <div key={key} className="rounded-lg border border-border/30 p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-muted-foreground capitalize">{key}</span>
                <span className="text-xs font-medium text-foreground/80">{dim.score}</span>
              </div>
              <Progress value={dim.score} className="h-1 bg-secondary/40 [&>div]:bg-violet-400" />
              <p className="text-[9px] text-muted-foreground/60 mt-1 line-clamp-2">{dim.reasoning}</p>
            </div>
          ))}
        </div>
        {score.recommendation && (
          <div className="rounded-lg bg-secondary/20 p-2.5">
            <p className="text-xs text-foreground/80">{score.recommendation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Outreach Data Card
// ============================================================

function OutreachDataCard({ outreach }: { outreach: OutreachResult }) {
  return (
    <Card className="border-sky-500/20 ml-9">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-sky-400" />
          <h4 className="text-sm font-bold text-foreground/90 capitalize">{outreach.channel} Outreach</h4>
          <Badge variant="outline" className="text-[9px] border-sky-500/20 text-sky-400">{outreach.tone}</Badge>
        </div>
        {outreach.subject && (
          <div>
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Subject</span>
            <p className="text-sm font-medium text-foreground/90">{outreach.subject}</p>
          </div>
        )}
        <div>
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Message</span>
          <div className="rounded-lg bg-secondary/20 p-3 mt-1">
            <p className="text-xs text-foreground/80 whitespace-pre-wrap">{outreach.body}</p>
          </div>
        </div>
        {outreach.personalizationHooks?.length > 0 && (
          <div>
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Personalization Hooks</span>
            <TagList items={outreach.personalizationHooks} color="sky" />
          </div>
        )}
        <div>
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Call to Action</span>
          <p className="text-xs text-foreground/80">{outreach.cta}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Insights Panel
// ============================================================

function InsightsPanel({ insights }: { insights: InsightItem[] }) {
  if (!insights || insights.length === 0) return null;
  
  const typeConfig: Record<string, { color: string; bg: string; border: string }> = {
    opportunity: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    alignment: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    risk: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    action: { color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
    gap: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  };

  return (
    <div className="ml-9 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Actionable Insights</span>
      </div>
      {insights.map((insight) => {
        const config = typeConfig[insight.type] || typeConfig.opportunity;
        const InsightIcon = ICON_MAP[insight.icon] || Lightbulb;
        return (
          <div key={insight.id} className={`rounded-lg border ${config.border} ${config.bg} p-2.5 flex items-start gap-2.5`}>
            <InsightIcon className={`h-4 w-4 ${config.color} mt-0.5 shrink-0`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${config.color}`}>{insight.title}</span>
                {insight.relatedDimension && (
                  <Badge variant="outline" className="text-[8px] h-4 px-1 border-border/30 text-muted-foreground/50">
                    {insight.relatedDimension}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{insight.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Navigation Buttons
// ============================================================

function NavigationButtons({ suggestions, onNavigate }: { suggestions: NavigationSuggestion[]; onNavigate: (view: ViewType) => void }) {
  if (!suggestions || suggestions.length === 0) return null;
  
  return (
    <div className="ml-9 flex flex-wrap gap-2 mt-2">
      {suggestions.map((suggestion, i) => {
        const NavIcon = ICON_MAP[suggestion.icon] || ArrowRight;
        return (
          <Button
            key={i}
            variant="outline"
            size="sm"
            className="text-[10px] h-7 gap-1.5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30 transition-all"
            onClick={() => onNavigate(suggestion.targetView)}
            title={suggestion.reason}
          >
            <NavIcon className="h-3 w-3" />
            {suggestion.label}
            <ArrowRight className="h-2.5 w-2.5 ml-0.5" />
          </Button>
        );
      })}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function ProspectDiscoveryView() {
  const { setActiveView } = useAppStore();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [context, setContext] = useState<ConversationContext>({
    recentProspects: [],
    activeICP: null,
    lastIntent: null,
    lastPersona: null,
    userPreferences: {},
  });
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([]);
  const [showThinking, setShowThinking] = useState(true);
  const [saveNotification, setSaveNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [aiHealth, setAiHealth] = useState<'healthy' | 'degraded' | 'down' | 'checking' | 'unknown'>('unknown');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check AI health on mount
  useEffect(() => {
    const checkHealth = async () => {
      setAiHealth('checking');
      try {
        const res = await fetch('/api/prospect-discovery/health');
        if (res.ok) {
          const data = await res.json();
          setAiHealth(data.overall || 'unknown');
        } else {
          setAiHealth('unknown');
        }
      } catch {
        setAiHealth('unknown');
      }
    };
    checkHealth();
    // Re-check every 2 minutes
    const interval = setInterval(checkHealth, 120_000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSearching]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-hide notification
  useEffect(() => {
    if (saveNotification) {
      const t = setTimeout(() => setSaveNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [saveNotification]);

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const text = (messageText || query).trim();
    if (!text || isSearching) return;
    setQuery('');

    // Add user message
    const userMsg: AgentMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsSearching(true);

    // Create a placeholder agent message that will be updated in real-time via SSE
    const agentMsgId = `agent-${Date.now()}`;
    const liveAgentMsg: AgentMessage = {
      id: agentMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      persona: 'scout',
      thinking: undefined,
      actions: [],
      prospectData: undefined,
    };
    setMessages(prev => [...prev, liveAgentMsg]);

    // Helper: merge partial prospect data into the live agent message
    const mergeProspectData = (existing: ProspectResult | undefined, partial: Partial<ProspectResult> | undefined): ProspectResult | undefined => {
      if (!partial) return existing;
      if (!existing) return partial as ProspectResult;
      const merged = { ...existing };
      for (const [key, value] of Object.entries(partial)) {
        if (value !== null && value !== undefined && value !== '') {
          const existingVal = (merged as Record<string, unknown>)[key];
          if (existingVal === null || existingVal === undefined || existingVal === '' ||
              (Array.isArray(existingVal) && (existingVal as unknown[]).length === 0)) {
            (merged as Record<string, unknown>)[key] = value;
          }
        }
      }
      return merged;
    };

    try {
      // Try SSE streaming first for real-time progress
      const response = await fetch('/api/prospect-discovery/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Stream failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEventType = '';
      // Track live step data for the real-time progress panel
      const liveSteps: AgentAction[] = [];
      let liveProspect: ProspectResult | undefined;
      let liveInsights: InsightItem[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            let data: any;
            try { data = JSON.parse(line.slice(6)); } catch { continue; }

            // Update the live agent message based on event type
            if (currentEventType === 'thinking' && data) {
              setMessages(prev => prev.map(m =>
                m.id === agentMsgId ? { ...m, persona: data.persona || 'scout', thinking: data } : m
              ));
            } else if (currentEventType === 'step_start' && data) {
              liveSteps.push({ type: data.label || 'research', label: data.label || 'Research', status: 'running', message: data.message || 'Starting...' });
              setMessages(prev => prev.map(m =>
                m.id === agentMsgId ? { ...m, actions: [...liveSteps] } : m
              ));
            } else if (currentEventType === 'step_progress' && data) {
              const stepIdx = data.stepIndex ?? (liveSteps.length - 1);
              if (liveSteps[stepIdx]) {
                liveSteps[stepIdx] = { ...liveSteps[stepIdx], message: data.message || liveSteps[stepIdx].message };
                setMessages(prev => prev.map(m =>
                  m.id === agentMsgId ? { ...m, actions: [...liveSteps] } : m
                ));
              }
            } else if (currentEventType === 'step_complete' && data) {
              const stepIdx = data.stepIndex ?? (liveSteps.length - 1);
              if (liveSteps[stepIdx]) {
                liveSteps[stepIdx] = { ...liveSteps[stepIdx], status: data.status || 'completed', message: data.message || liveSteps[stepIdx].message };
              }
              // Merge partial data if provided
              if (data.partialData) {
                liveProspect = mergeProspectData(liveProspect, data.partialData);
              }
              setMessages(prev => prev.map(m =>
                m.id === agentMsgId ? { ...m, actions: [...liveSteps], prospectData: liveProspect } : m
              ));
            } else if (currentEventType === 'data_update' && data) {
              liveProspect = mergeProspectData(liveProspect, data.prospect);
              setMessages(prev => prev.map(m =>
                m.id === agentMsgId ? { ...m, prospectData: liveProspect } : m
              ));
            } else if (currentEventType === 'insight' && data?.insight) {
              liveInsights = [...liveInsights, data.insight];
              setMessages(prev => prev.map(m =>
                m.id === agentMsgId ? { ...m, insights: liveInsights.length > 0 ? liveInsights : undefined } : m
              ));
            } else if (currentEventType === 'error' && data) {
              // Don't show error immediately — the 'done' event will follow with a proper message
              // Just log it for debugging
              console.warn('[ProspectDiscovery] SSE error event:', data.message);
            } else if (currentEventType === 'done' && data) {
              // Final message — replace the live message with the complete one
              const finalMsg = data.message as AgentMessage;
              if (finalMsg) {
                // Preserve the converted/leadId state if the user already clicked "Add to Leads" during streaming
                setMessages(prev => prev.map(m => {
                  if (m.id !== agentMsgId) return m;
                  return {
                    ...finalMsg,
                    id: agentMsgId, // Keep the same ID so React doesn't duplicate
                    converted: m.converted,
                    leadId: m.leadId,
                  };
                }));
              }
              if (data.updatedContext) setContext(data.updatedContext);
              if (data.suggestedActions) setSuggestedActions(data.suggestedActions);
            }
          }
          // Reset event type after processing data line
          if (!line.startsWith('event: ') && !line.startsWith('data: ') && !line.startsWith(': ')) {
            currentEventType = '';
          }
        }
      }
    } catch (streamError) {
      // SSE streaming failed — fall back to the blocking chat API
      console.warn('[ProspectDiscovery] SSE stream failed, falling back to chat API:', streamError instanceof Error ? streamError.message : 'Unknown');

      // Remove the placeholder and try the chat API
      setMessages(prev => prev.filter(m => m.id !== agentMsgId));

      try {
        const result = await safeFetchJSON<{
          success: boolean;
          message: AgentMessage;
          updatedContext: ConversationContext;
          suggestedActions: SuggestedAction[];
          error?: string;
          retryable?: boolean;
        }>('/api/prospect-discovery/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            conversationHistory: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
            context,
          }),
        });

        if (result.success && result.message) {
          setMessages(prev => [...prev, result.message]);
          setContext(result.updatedContext);
          setSuggestedActions(result.suggestedActions || []);
        } else {
          const errorMsg: AgentMessage = {
            id: `error-${Date.now()}`,
            role: 'system',
            content: result.error || 'The agent encountered an error. Please try again.',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMsg]);
        }
      } catch (chatError) {
        // Both stream and chat API failed — show a more helpful message
        const errorMsg: AgentMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: "I'm having trouble connecting to the AI service right now. This could be due to:\n\n• **High traffic** — the AI service may be temporarily overloaded\n• **Complex query** — your request may need more processing time\n\n**Try these suggestions:**\n• Rephrase with a simpler query like \"Research Stripe\"\n• Try again in a few seconds\n• Ask a specific question like \"Tell me about [company name]\"",
          timestamp: new Date(),
          persona: 'navigator',
          thinking: {
            persona: 'navigator',
            intent: 'converse',
            reasoning: 'Both stream and chat API failed',
            plan: ['Error recovery'],
            confidence: 0.3,
          },
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    }

    setIsSearching(false);
    inputRef.current?.focus();
  }, [query, isSearching, messages, context]);

  const handleConvertToLead = async (messageId: string, prospect: ProspectResult) => {
    try {
      const result = await safeFetchJSON<{ success: boolean; leadId: string; campaignId: string; message: string; error?: string }>('/api/prospect-discovery/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect }),
      });

      if (result.success) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, converted: true, leadId: result.leadId } : m));
        setSaveNotification({ type: 'success', message: 'Prospect converted to lead successfully!' });
      } else if (result.error === 'Lead already exists') {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, converted: true, leadId: result.leadId } : m));
        setSaveNotification({ type: 'success', message: 'Lead already exists in your pipeline.' });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setSaveNotification({ type: 'error', message: `Failed to convert: ${msg}` });
    }
  };

  const handleSuggestedAction = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleNavigate = useCallback((view: ViewType) => {
    setActiveView(view);
  }, [setActiveView]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Telescope className="h-6 w-6 text-emerald-400" />
            Prospect Discovery
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your AI agent researches companies, people, markets & composes outreach — all in one conversation
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* AI Health Indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/20" title={`AI System Status: ${aiHealth}`}>
            {aiHealth === 'checking' && <Loader2 className="h-3 w-3 animate-spin text-amber-400" />}
            {aiHealth === 'healthy' && <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />}
            {aiHealth === 'degraded' && <div className="h-2 w-2 rounded-full bg-amber-400" />}
            {aiHealth === 'down' && <div className="h-2 w-2 rounded-full bg-red-400" />}
            {aiHealth === 'unknown' && <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />}
            <span className={`text-[9px] font-medium ${
              aiHealth === 'healthy' ? 'text-emerald-400' :
              aiHealth === 'degraded' ? 'text-amber-400' :
              aiHealth === 'down' ? 'text-red-400' :
              'text-muted-foreground/50'
            }`}>
              {aiHealth === 'checking' ? 'Checking AI...' :
               aiHealth === 'healthy' ? 'AI Online' :
               aiHealth === 'degraded' ? 'AI Degraded' :
               aiHealth === 'down' ? 'AI Offline' : 'AI Status Unknown'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`text-[10px] gap-1 ${showThinking ? 'text-violet-400' : 'text-muted-foreground'}`}
            onClick={() => setShowThinking(!showThinking)}
          >
            <Brain className="h-3.5 w-3.5" />
            Thinking Mode
          </Button>
        </div>
      </div>

      {/* Notification Toast */}
      {saveNotification && (
        <div className={`mb-2 rounded-lg px-3 py-2 text-xs font-medium ${saveNotification.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {saveNotification.message}
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 min-h-0 rounded-xl border border-border/30 bg-card/50 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
          <div className="p-4 space-y-4">
            {/* Empty State */}
            {messages.length === 0 && !isSearching && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="relative mb-5">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-emerald-500/20">
                    <Telescope className="h-10 w-10 text-emerald-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground/90 mb-2">Your AI Agent is Ready</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md mb-5">
                  I can research companies, find people, analyze markets, build ICPs, score leads, and compose outreach — all through natural conversation.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl w-full">
                  {[
                    { emoji: '🔍', label: 'Research a Company', example: 'Tell me about Stripe', color: 'emerald' },
                    { emoji: '🐕', label: 'Find a Person', example: 'Find Patrick Collison', color: 'cyan' },
                    { emoji: '📊', label: 'Analyze a Market', example: 'SaaS market trends in 2026', color: 'violet' },
                    { emoji: '🏗️', label: 'Build an ICP', example: 'Build an ICP for B2B SaaS', color: 'amber' },
                    { emoji: '⚖️', label: 'Score a Lead', example: 'Is Stripe a good lead for us?', color: 'rose' },
                    { emoji: '✍️', label: 'Compose Outreach', example: 'Write an email to Stripe', color: 'sky' },
                    { emoji: '🧠', label: 'Competitive Analysis', example: 'HubSpot vs Salesforce', color: 'indigo' },
                    { emoji: '🔗', label: 'Analyze a Website', example: 'https://stripe.com', color: 'emerald' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleSendMessage(item.example)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border/30 bg-secondary/10 hover:bg-secondary/20 transition-colors cursor-pointer text-left"
                    >
                      <span className="text-lg">{item.emoji}</span>
                      <span className="text-[10px] font-medium text-foreground/70">{item.label}</span>
                      <span className="text-[8px] text-muted-foreground/60 text-center">{item.example}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message List */}
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-3">
                {/* User Message */}
                {msg.role === 'user' && (
                  <div className="flex justify-end">
                    <div className="max-w-md rounded-2xl rounded-br-md bg-emerald-500/15 border border-emerald-500/20 px-4 py-2.5">
                      <p className="text-sm text-foreground/90">{msg.content}</p>
                      <p className="text-[9px] text-muted-foreground/50 mt-1">{safeFormatTime(msg.timestamp)}</p>
                    </div>
                  </div>
                )}

                {/* System Error */}
                {msg.role === 'system' && (
                  <div className="flex justify-center">
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 max-w-md">
                      <p className="text-xs text-red-400">{msg.content}</p>
                    </div>
                  </div>
                )}

                {/* Agent Response */}
                {msg.role === 'assistant' && (
                  <div className="flex justify-start">
                    <div className="max-w-3xl w-full space-y-3">
                      {/* Agent Header */}
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-emerald-500/20">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                        </div>
                        <div className="flex items-center gap-2">
                          <PersonaBadge persona={msg.persona || 'navigator'} size="lg" />
                          <span className="text-[9px] text-muted-foreground/50">
                            {safeFormatTime(msg.timestamp)}
                          </span>
                        </div>
                      </div>

                      {/* Thinking Indicator */}
                      {showThinking && msg.thinking && (
                        <div className="ml-9">
                          <ThinkingIndicator thinking={msg.thinking} />
                        </div>
                      )}

                      {/* Discovery Progress Panel — shown during streaming or with steps */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="ml-9 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Search className="h-3.5 w-3.5 text-cyan-400" />
                            <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                              {isSearching && msg.id === messages[messages.length - 1]?.id ? 'Discovery in Progress' : 'Discovery Steps'}
                            </span>
                            {msg.prospectData && (
                              <span className={`text-[9px] font-bold ml-auto ${
                                msg.prospectData.dataCompleteness >= 70 ? 'text-emerald-400' :
                                msg.prospectData.dataCompleteness >= 40 ? 'text-amber-400' : 'text-red-400'
                              }`}>
                                {msg.prospectData.dataCompleteness}% complete
                              </span>
                            )}
                          </div>
                          {msg.actions.map((action, i) => (
                            <ActionStepIndicator key={i} action={action} />
                          ))}
                        </div>
                      )}

                      {/* Conversational Response */}
                      {msg.content && (
                        <div className="ml-9 rounded-2xl rounded-bl-md bg-secondary/20 border border-border/30 px-4 py-3">
                          <p className="text-sm text-foreground/85 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </div>
                      )}

                      {/* Streaming loading indicator — when still searching but no content yet */}
                      {isSearching && msg.id === messages[messages.length - 1]?.id && !msg.content && (!msg.prospectData || !msg.prospectData.companyName) && (
                        <div className="ml-9 flex items-center gap-2 text-muted-foreground/50">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span className="text-xs">Agent is working...</span>
                        </div>
                      )}

                      {/* Prospect Data Card */}
                      {msg.prospectData && (
                        <ProspectDataCard
                          prospect={msg.prospectData}
                          messageId={msg.id}
                          converted={msg.converted}
                          leadId={msg.leadId}
                          onConvert={handleConvertToLead}
                          onViewLeads={() => setActiveView('leads')}
                        />
                      )}

                      {/* ICP Data Card */}
                      {msg.icpData && <ICPDataCard icp={msg.icpData} />}

                      {/* Market Data Card */}
                      {msg.marketData && <MarketDataCard market={msg.marketData} />}

                      {/* Score Data Card */}
                      {msg.scoreData && <ScoreDataCard score={msg.scoreData} />}

                      {/* Outreach Data Card */}
                      {msg.outreachData && <OutreachDataCard outreach={msg.outreachData} />}

                      {/* Insights Panel */}
                      {msg.insights && msg.insights.length > 0 && (
                        <InsightsPanel insights={msg.insights} />
                      )}

                      {/* Navigation Suggestions */}
                      {msg.navigation && msg.navigation.length > 0 && (
                        <NavigationButtons suggestions={msg.navigation} onNavigate={handleNavigate} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Searching State */}
            {isSearching && (
              <div className="flex justify-start">
                <div className="max-w-md space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-emerald-500/20">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                    </div>
                    <span className="text-xs font-medium text-foreground/80">Agent is working...</span>
                  </div>
                  <div className="rounded-2xl rounded-bl-md bg-secondary/20 border border-border/30 px-4 py-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
                      <span className="text-xs text-violet-400 font-medium">AI agent is processing your request</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
                        <span className="text-xs text-muted-foreground">Classifying intent & selecting specialist...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin text-violet-400" style={{ animationDelay: '0.5s' }} />
                        <span className="text-xs text-muted-foreground">Searching multiple channels in parallel...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin text-amber-400" style={{ animationDelay: '1s' }} />
                        <span className="text-xs text-muted-foreground">Generating intelligent response...</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground/50 mt-3">This may take 30-90 seconds for complete research</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Suggested Actions Bar */}
        {suggestedActions.length > 0 && !isSearching && (
          <div className="border-t border-border/20 px-4 py-2 bg-card/60">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-[9px] text-muted-foreground/50 shrink-0">Next:</span>
              {suggestedActions.map((action, i) => {
                const Icon = ICON_MAP[action.icon] || Sparkles;
                return (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    className="text-[10px] h-6 gap-1 text-muted-foreground hover:text-emerald-400 shrink-0"
                    onClick={() => handleSuggestedAction(action.prompt)}
                  >
                    <Icon className="h-3 w-3" />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="border-t border-border/30 p-3 bg-card/80">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <MessageSquare className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                ref={inputRef}
                placeholder="Ask anything — research companies, find people, analyze markets, build ICPs..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSearching}
                className="pl-10 pr-4 bg-secondary/20 border-border/40 focus:border-emerald-500/30 h-11 text-sm"
              />
            </div>
            <Button
              onClick={() => handleSendMessage()}
              disabled={!query.trim() || isSearching}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all h-11 px-6"
            >
              {isSearching ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Working...</>
              ) : (
                <><Send className="h-4 w-4" />Send</>
              )}
            </Button>
          </div>
          <p className="text-[9px] text-muted-foreground/40 mt-1.5 text-center">
            Powered by 7 specialist AI agents — Scout, Hound, Analyst, Architect, Judge, Scribe & Navigator
          </p>
        </div>
      </div>
    </div>
  );
}
