'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { safeFetchJSON } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

interface ResearchStep {
  step: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
}

interface ProspectData {
  queryType: string;
  query: string;
  companyName: string | null;
  legalName: string | null;
  website: string | null;
  industry: string | null;
  subIndustry: string | null;
  description: string | null;
  hqAddress: string | null;
  city: string | null;
  stateProvince: string | null;
  country: string | null;
  postalCode: string | null;
  phoneMain: string | null;
  generalEmail: string | null;
  supportEmail: string | null;
  ceoName: string | null;
  ceoEmail: string | null;
  keyContactName: string | null;
  keyContactTitle: string | null;
  keyContactEmail: string | null;
  employeeCount: string | null;
  revenueEstimate: string | null;
  foundingYear: string | null;
  ownershipType: string | null;
  linkedinUrl: string | null;
  twitterHandle: string | null;
  facebookPage: string | null;
  techStack: string[];
  boardMembers: string[];
  recentNews: string[];
  productsServices: string[];
  partners: string[];
  fundingInfo: string | null;
  personName: string | null;
  personTitle: string | null;
  personCompany: string | null;
  personEmail: string | null;
  personPhone: string | null;
  personLinkedin: string | null;
  personBio: string | null;
  sources: string[];
  dataCompleteness: number;
}

interface SearchResult {
  success: boolean;
  query: string;
  queryType: string;
  prospect: ProspectData;
  steps: ResearchStep[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  result?: SearchResult;
  converted?: boolean;
  leadId?: string;
}

// ============================================================
// Helper Components
// ============================================================

function StepIndicator({ step }: { step: ResearchStep }) {
  const iconMap: Record<string, string> = {
    'classify': 'Identifying',
    'web-search': 'Searching',
    'web-read': 'Reading',
    'llm-extract': 'Analyzing',
    'linkedin-search': 'LinkedIn',
    'deep-research': 'Deep Dive',
    'news-research': 'News',
    'twitter-search': 'Twitter/X',
    'company-research': 'Company',
    'retry': 'Auto-Retry',
  };

  const label = iconMap[step.step] || step.step;

  return (
    <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-secondary/20 text-xs">
      {step.status === 'running' && (
        <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
      )}
      {step.status === 'completed' && (
        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
      )}
      {step.status === 'failed' && (
        <AlertCircle className="h-3 w-3 text-red-400" />
      )}
      {step.status === 'pending' && (
        <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />
      )}
      <span className={step.status === 'running' ? 'text-cyan-400 font-medium' : step.status === 'completed' ? 'text-emerald-400' : step.status === 'failed' ? 'text-red-400' : 'text-muted-foreground'}>
        {label}
      </span>
      <span className="text-muted-foreground/70 ml-1">{step.message}</span>
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
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-secondary/20 hover:bg-secondary/30 transition-colors"
      >
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

// ============================================================
// Main Component
// ============================================================

export function ProspectDiscoveryView() {
  const { setActiveView, setSelectedCampaignId } = useAppStore();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentSteps, setCurrentSteps] = useState<ResearchStep[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentSteps]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleSearch = async () => {
    if (!query.trim() || isSearching) return;

    const userQuery = query.trim();
    setQuery('');

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userQuery,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsSearching(true);
    setCurrentSteps([]);

    const MAX_ATTEMPTS = 2; // 1 initial + 1 auto-retry

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        // Call the search API - this is a long-running request (up to 5 min)
        // Add a 5-minute timeout since the research pipeline can take a while
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300_000); // 5 minutes

        const result = await safeFetchJSON<SearchResult>('/api/prospect-discovery/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: userQuery }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        setCurrentSteps(result.steps || []);

        // Add assistant message with results
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.success
            ? `Found comprehensive data for "${result.query}" (${result.queryType}). Data completeness: ${result.prospect.dataCompleteness}%`
            : `Could not find sufficient data for "${result.query}". Try a more specific query.`,
          timestamp: new Date(),
          result: result.success ? result : undefined,
        };
        setMessages(prev => [...prev, assistantMsg]);
        break; // Success — exit retry loop

      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        const isRetryable = msg.includes('502') || msg.includes('503') || msg.includes('Server error') || msg.includes('gateway');

        if (isRetryable && attempt < MAX_ATTEMPTS - 1) {
          // Show "Retrying..." message
          setCurrentSteps([{ step: 'retry', status: 'running', message: 'Server temporarily busy — automatically retrying...' }]);
          await new Promise(r => setTimeout(r, 5000)); // Wait 5 seconds
          continue; // Retry
        }

        // Non-retryable error or all retries exhausted
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'system',
          content: isRetryable
            ? 'The AI service is temporarily overloaded. Please wait a few seconds and try again.'
            : `Research failed: ${msg}. Please try again.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
        break;
      }
    }

    setIsSearching(false);
    setCurrentSteps([]);
    inputRef.current?.focus();
  };

  const handleConvertToLead = async (messageId: string, prospect: ProspectData) => {
    try {
      const result = await safeFetchJSON<{ success: boolean; leadId: string; campaignId: string; message: string }>('/api/prospect-discovery/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect }),
      });

      if (result.success) {
        setMessages(prev => prev.map(m =>
          m.id === messageId
            ? { ...m, converted: true, leadId: result.leadId }
            : m
        ));
      }
    } catch (error) {
      console.error('Error converting to lead:', error);
    }
  };

  // Retry a failed search
  const handleRetry = (originalQuery: string) => {
    setQuery(originalQuery);
    setTimeout(() => handleSearch(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const queryTypeIcon = (type: string) => {
    switch (type) {
      case 'company': return <Building2 className="h-4 w-4 text-emerald-400" />;
      case 'person': return <User className="h-4 w-4 text-cyan-400" />;
      case 'url': return <Globe className="h-4 w-4 text-violet-400" />;
      default: return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

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
            Search by company name, website URL, or person name — our AI will research everything
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-h-0 rounded-xl border border-border/30 bg-card/50 overflow-hidden flex flex-col">
        {/* Messages */}
        <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
          <div className="p-4 space-y-4">
            {messages.length === 0 && !isSearching && (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="relative mb-6">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-emerald-500/20">
                    <Telescope className="h-10 w-10 text-emerald-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground/90 mb-2">Discover Your Next Prospect</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                  Enter a company name, website URL, or person name below. Our AI agents will research the web, 
                  LinkedIn, news, and social media to build a complete profile.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg w-full">
                  {[
                    { icon: Building2, label: 'Company Name', example: 'Farm to Cafeteria Canada', color: 'emerald' },
                    { icon: Globe, label: 'Website URL', example: 'https://farmtocafeteriacanada.ca', color: 'violet' },
                    { icon: User, label: 'Person Name', example: 'Suhail Nanji', color: 'cyan' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => setQuery(item.example)}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border/30 bg-secondary/10 hover:bg-secondary/20 transition-colors cursor-pointer"
                    >
                      <item.icon className={`h-5 w-5 text-${item.color}-400`} />
                      <span className="text-[10px] font-medium text-foreground/70">{item.label}</span>
                      <span className="text-[9px] text-muted-foreground text-center">{item.example}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message List */}
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-3">
                {/* User Query Bubble */}
                {msg.role === 'user' && (
                  <div className="flex justify-end">
                    <div className="max-w-md rounded-2xl rounded-br-md bg-emerald-500/15 border border-emerald-500/20 px-4 py-2.5">
                      <p className="text-sm text-foreground/90">{msg.content}</p>
                      <p className="text-[9px] text-muted-foreground/50 mt-1">{msg.timestamp.toLocaleTimeString()}</p>
                    </div>
                  </div>
                )}

                {/* System Error */}
                {msg.role === 'system' && (
                  <div className="flex justify-center">
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 max-w-md">
                      <p className="text-xs text-red-400">{msg.content}</p>
                      {/* Find the user query that preceded this error */}
                      {(() => {
                        const msgIndex = messages.indexOf(msg);
                        const prevUserMsg = messages.slice(0, msgIndex).reverse().find(m => m.role === 'user');
                        if (prevUserMsg) {
                          return (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[10px] text-red-300 hover:text-red-200 hover:bg-red-500/10 gap-1 h-6 mt-2"
                              onClick={() => handleRetry(prevUserMsg.content)}
                            >
                              <RefreshCw className="h-3 w-3" />
                              Retry search
                            </Button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}

                {/* Assistant Result */}
                {msg.role === 'assistant' && msg.result && (
                  <div className="flex justify-start">
                    <div className="max-w-3xl w-full space-y-3">
                      {/* Status Header */}
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-emerald-500/20">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                        </div>
                        <div>
                          <span className="text-xs font-medium text-foreground/80">Prospect Discovery AI</span>
                          <div className="flex items-center gap-2">
                            {queryTypeIcon(msg.result.queryType)}
                            <Badge variant="outline" className="text-[9px] border-border/30">
                              {msg.result.queryType}
                            </Badge>
                            <span className={`text-xs font-semibold ${completenessColor(msg.result.prospect.dataCompleteness)}`}>
                              {msg.result.prospect.dataCompleteness}% complete
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Research Steps */}
                      <div className="space-y-1 ml-9">
                        {(msg.result.steps || []).map((step, i) => (
                          <StepIndicator key={i} step={step} />
                        ))}
                      </div>

                      {/* Main Data Card */}
                      <Card className="border-border/30 ml-9">
                        <CardContent className="p-4 space-y-3">
                          {/* Company / Person Header */}
                          {msg.result.prospect.companyName && (
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-base font-bold text-foreground/90">{msg.result.prospect.companyName}</h4>
                                {msg.result.prospect.legalName && msg.result.prospect.legalName !== msg.result.prospect.companyName && (
                                  <p className="text-[10px] text-muted-foreground">Legal: {msg.result.prospect.legalName}</p>
                                )}
                                {msg.result.prospect.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{msg.result.prospect.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-3">
                                <Progress value={msg.result.prospect.dataCompleteness} className={`h-1.5 w-16 bg-secondary/40 ${completenessBarColor(msg.result.prospect.dataCompleteness)}`} />
                                <span className={`text-xs font-bold ${completenessColor(msg.result.prospect.dataCompleteness)}`}>
                                  {msg.result.prospect.dataCompleteness}%
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Person Header (if person query) */}
                          {msg.result.prospect.personName && !msg.result.prospect.companyName && (
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-base font-bold text-foreground/90">{msg.result.prospect.personName}</h4>
                                {msg.result.prospect.personTitle && (
                                  <p className="text-xs text-cyan-400">{msg.result.prospect.personTitle}</p>
                                )}
                                {msg.result.prospect.personBio && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{msg.result.prospect.personBio}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-3">
                                <Progress value={msg.result.prospect.dataCompleteness} className={`h-1.5 w-16 bg-secondary/40 ${completenessBarColor(msg.result.prospect.dataCompleteness)}`} />
                                <span className={`text-xs font-bold ${completenessColor(msg.result.prospect.dataCompleteness)}`}>
                                  {msg.result.prospect.dataCompleteness}%
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Person associated with company */}
                          {msg.result.prospect.personName && msg.result.prospect.companyName && (
                            <div className="rounded-md bg-cyan-500/5 border border-cyan-500/10 p-2.5">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="h-3.5 w-3.5 text-cyan-400" />
                                <span className="text-xs font-medium text-cyan-400">Key Person</span>
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs font-medium text-foreground/90">{msg.result.prospect.personName}</p>
                                {msg.result.prospect.personTitle && <p className="text-[10px] text-muted-foreground">{msg.result.prospect.personTitle}</p>}
                                {msg.result.prospect.personEmail && <p className="text-[10px] text-cyan-400">{msg.result.prospect.personEmail}</p>}
                                {msg.result.prospect.personPhone && <p className="text-[10px] text-muted-foreground">{msg.result.prospect.personPhone}</p>}
                              </div>
                            </div>
                          )}

                          {/* Data Sections Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {/* Contact Info */}
                            <SectionCard title="Contact Information" icon={Mail}>
                              <DataField icon={Mail} label="General Email" value={msg.result.prospect.generalEmail} href={msg.result.prospect.generalEmail ? `mailto:${msg.result.prospect.generalEmail}` : null} />
                              <DataField icon={Mail} label="Support Email" value={msg.result.prospect.supportEmail} href={msg.result.prospect.supportEmail ? `mailto:${msg.result.prospect.supportEmail}` : null} />
                              <DataField icon={Phone} label="Phone" value={msg.result.prospect.phoneMain} href={msg.result.prospect.phoneMain ? `tel:${msg.result.prospect.phoneMain}` : null} />
                              <DataField icon={Globe} label="Website" value={msg.result.prospect.website} href={msg.result.prospect.website} />
                            </SectionCard>

                            {/* Location */}
                            <SectionCard title="Location" icon={MapPin}>
                              <DataField icon={MapPin} label="Address" value={msg.result.prospect.hqAddress} />
                              <DataField icon={MapPin} label="City" value={msg.result.prospect.city} />
                              <DataField icon={MapPin} label="State/Province" value={msg.result.prospect.stateProvince} />
                              <DataField icon={MapPin} label="Country" value={msg.result.prospect.country} />
                            </SectionCard>

                            {/* Firmographics */}
                            <SectionCard title="Firmographics" icon={BarChart3}>
                              <DataField icon={Users} label="Employees" value={msg.result.prospect.employeeCount} />
                              <DataField icon={DollarSign} label="Revenue" value={msg.result.prospect.revenueEstimate} />
                              <DataField icon={Calendar} label="Founded" value={msg.result.prospect.foundingYear} />
                              <DataField icon={Building2} label="Ownership" value={msg.result.prospect.ownershipType} />
                              <DataField icon={Briefcase} label="Industry" value={msg.result.prospect.industry} />
                              <DataField icon={Briefcase} label="Sub-Industry" value={msg.result.prospect.subIndustry} />
                            </SectionCard>

                            {/* Key People */}
                            <SectionCard title="Key People" icon={Users}>
                              <DataField icon={Star} label="CEO" value={msg.result.prospect.ceoName} />
                              <DataField icon={Mail} label="CEO Email" value={msg.result.prospect.ceoEmail} href={msg.result.prospect.ceoEmail ? `mailto:${msg.result.prospect.ceoEmail}` : null} />
                              <DataField icon={User} label="Key Contact" value={msg.result.prospect.keyContactName ? `${msg.result.prospect.keyContactName}${msg.result.prospect.keyContactTitle ? ` (${msg.result.prospect.keyContactTitle})` : ''}` : null} />
                              <DataField icon={Mail} label="Contact Email" value={msg.result.prospect.keyContactEmail} href={msg.result.prospect.keyContactEmail ? `mailto:${msg.result.prospect.keyContactEmail}` : null} />
                            </SectionCard>

                            {/* Digital Presence */}
                            <SectionCard title="Digital Presence" icon={Globe}>
                              <DataField icon={Linkedin} label="LinkedIn" value={msg.result.prospect.linkedinUrl} href={msg.result.prospect.linkedinUrl} />
                              <DataField icon={Twitter} label="Twitter/X" value={msg.result.prospect.twitterHandle} />
                              <DataField icon={Globe} label="Facebook" value={msg.result.prospect.facebookPage} href={msg.result.prospect.facebookPage} />
                              {msg.result.prospect.personLinkedin && (
                                <DataField icon={Linkedin} label="Person LinkedIn" value={msg.result.prospect.personLinkedin} href={msg.result.prospect.personLinkedin} />
                              )}
                            </SectionCard>

                            {/* Products & Services */}
                            <SectionCard title="Products & Services" icon={FileText} defaultOpen={msg.result.prospect.productsServices.length > 0}>
                              <TagList items={msg.result.prospect.productsServices || []} color="emerald" />
                              {msg.result.prospect.techStack && msg.result.prospect.techStack.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Tech Stack</span>
                                  <TagList items={msg.result.prospect.techStack} color="violet" />
                                </div>
                              )}
                              {msg.result.prospect.fundingInfo && (
                                <DataField icon={DollarSign} label="Funding" value={msg.result.prospect.fundingInfo} />
                              )}
                            </SectionCard>
                          </div>

                          {/* Board Members */}
                          {msg.result.prospect.boardMembers && msg.result.prospect.boardMembers.length > 0 && (
                            <SectionCard title="Board Members & Leadership" icon={Users} defaultOpen={false}>
                              <TagList items={msg.result.prospect.boardMembers} color="amber" />
                            </SectionCard>
                          )}

                          {/* Recent News */}
                          {msg.result.prospect.recentNews && msg.result.prospect.recentNews.length > 0 && (
                            <SectionCard title="Recent News & Activity" icon={FileText} defaultOpen={false}>
                              {msg.result.prospect.recentNews.map((news, i) => (
                                <div key={i} className="flex items-start gap-2 py-1">
                                  <div className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                  <p className="text-xs text-muted-foreground">{news}</p>
                                </div>
                              ))}
                            </SectionCard>
                          )}

                          {/* Sources */}
                          {msg.result.prospect.sources && msg.result.prospect.sources.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[9px] text-muted-foreground/50">Sources:</span>
                              {msg.result.prospect.sources.slice(0, 5).map((src, i) => (
                                <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="text-[9px] text-cyan-400/70 hover:text-cyan-400 truncate max-w-[150px]">
                                  {src.replace(/^https?:\/\//, '').split('/')[0]}
                                </a>
                              ))}
                              {msg.result.prospect.sources.length > 5 && (
                                <span className="text-[9px] text-muted-foreground/50">+{msg.result.prospect.sources.length - 5} more</span>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-2">
                            {msg.converted ? (
                              <div className="flex items-center gap-2 text-emerald-400">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs font-medium">Added to Leads</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-[10px] text-muted-foreground hover:text-foreground gap-1 h-6"
                                  onClick={() => {
                                    setActiveView('leads');
                                  }}
                                >
                                  View in Leads <ArrowRight className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                onClick={() => handleConvertToLead(msg.id, msg.result!.prospect)}
                                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all text-xs h-8"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add to Leads
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Assistant text-only message */}
                {msg.role === 'assistant' && !msg.result && (
                  <div className="flex justify-start">
                    <div className="max-w-md rounded-2xl rounded-bl-md bg-secondary/20 border border-border/30 px-4 py-2.5">
                      <p className="text-sm text-foreground/80">{msg.content}</p>
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
                    <span className="text-xs font-medium text-foreground/80">Researching...</span>
                  </div>
                  <div className="rounded-2xl rounded-bl-md bg-secondary/20 border border-border/30 px-4 py-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                      <span className="text-xs text-emerald-400 font-medium">AI agents are researching your query</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
                        <span className="text-xs text-muted-foreground">Searching web, LinkedIn, social media...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin text-violet-400" style={{ animationDelay: '0.5s' }} />
                        <span className="text-xs text-muted-foreground">Extracting data with AI...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin text-amber-400" style={{ animationDelay: '1s' }} />
                        <span className="text-xs text-muted-foreground">Building comprehensive profile...</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground/50 mt-3">This may take 30-60 seconds for complete research</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Bar */}
        <div className="border-t border-border/30 p-3 bg-card/80">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                ref={inputRef}
                placeholder="Enter company name, website URL, or person name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSearching}
                className="pl-10 pr-4 bg-secondary/20 border-border/40 focus:border-emerald-500/30 h-11 text-sm"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={!query.trim() || isSearching}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all h-11 px-6"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Researching...
                </>
              ) : (
                <>
                  <Telescope className="h-4 w-4" />
                  Discover
                </>
              )}
            </Button>
          </div>
          <p className="text-[9px] text-muted-foreground/40 mt-1.5 text-center">
            Our AI agents search the web, LinkedIn, news, and social media to build complete prospect profiles
          </p>
        </div>
      </div>
    </div>
  );
}
