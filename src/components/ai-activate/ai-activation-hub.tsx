'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles, Brain, Mail, MessageSquare, Users, Target, BarChart3,
  TrendingUp, Zap, Settings as SettingsIcon, DollarSign, Calendar,
  Briefcase, Filter, ArrowRight, Loader2, CheckCircle2, Lightbulb,
} from 'lucide-react';
import { AIActivateButton } from '@/components/ai-activate/ai-activate-button';

const AI_CAPABILITIES = [
  {
    category: 'Leads',
    icon: Users,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    capabilities: [
      { action: 'lead.score', label: 'Score Lead', description: 'AI-powered lead scoring 0-100 with tier (A/B/C/D), reasoning, signals, and next best action.' },
      { action: 'lead.enrich', label: 'Enrich Lead', description: 'Infer BANT attributes (Budget, Authority, Need, Timeline) from available context.' },
      { action: 'lead.next-action', label: 'Recommend Next Action', description: 'Get the single highest-leverage next action for any lead.' },
    ],
  },
  {
    category: 'Email',
    icon: Mail,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    capabilities: [
      { action: 'email.compose', label: 'Compose Email', description: 'Generate personalized B2B emails (cold outreach, follow-up, proposal, etc.).' },
      { action: 'email.reply', label: 'Draft Reply', description: 'Detect intent and draft thoughtful replies that advance the conversation.' },
      { action: 'email.optimize-subject', label: 'Optimize Subject Line', description: 'Improve subject lines for higher open rates.' },
    ],
  },
  {
    category: 'Messaging',
    icon: MessageSquare,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    capabilities: [
      { action: 'messaging.suggest-reply', label: 'Suggest Reply', description: 'Real-time reply suggestions for live conversations across any channel.' },
      { action: 'messaging.summarize', label: 'Summarize Conversation', description: 'Auto-summarize long conversations into key points + action items.' },
    ],
  },
  {
    category: 'Setters',
    icon: HeadsetIcon,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    capabilities: [
      { action: 'setter.coach', label: 'Coach Call', description: 'AI analysis of call transcripts: strengths, improvements, objection handling.' },
      { action: 'setter.qualifying-rules', label: 'Generate Qualifying Rules', description: 'Design BANT qualification frameworks for any product.' },
    ],
  },
  {
    category: 'Campaigns',
    icon: Target,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    capabilities: [
      { action: 'campaign.generate', label: 'Generate Campaign', description: 'Design full multi-touch campaigns with sequence, messaging, and KPIs.' },
      { action: 'campaign.optimize', label: 'Optimize Campaign', description: 'Diagnose performance issues and recommend concrete fixes.' },
    ],
  },
  {
    category: 'Reports',
    icon: BarChart3,
    color: 'text-rose-500',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    capabilities: [
      { action: 'report.summary', label: 'Executive Summary', description: 'Turn raw report data into executive-ready narrative + insights.' },
    ],
  },
  {
    category: 'Analytics',
    icon: TrendingUp,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    capabilities: [
      { action: 'analytics.annotate', label: 'Annotate Metrics', description: 'Translate raw metrics into business-readable insights + anomalies.' },
      { action: 'analytics.forecast', label: 'Forecast Revenue', description: 'Generate honest, calibrated revenue forecasts with assumptions.' },
    ],
  },
  {
    category: 'Outreach',
    icon: Zap,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    capabilities: [
      { action: 'outreach.sequence', label: 'Generate Sequence', description: 'Multi-touch outreach cadences personalized per lead.' },
    ],
  },
  {
    category: 'ABM',
    icon: Briefcase,
    color: 'text-pink-500',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    capabilities: [
      { action: 'abm.score', label: 'Score Account', description: 'Account-level fit + intent scoring for ABM targeting.' },
    ],
  },
  {
    category: 'Bookings',
    icon: Calendar,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    capabilities: [
      { action: 'booking.brief', label: 'Meeting Brief', description: 'Generate 2-minute prep briefs for any meeting type.' },
    ],
  },
  {
    category: 'Pipeline',
    icon: TrendingUp,
    color: 'text-teal-500',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    capabilities: [
      { action: 'pipeline.analyze', label: 'Analyze Deal', description: 'Deal health scoring + win probability + coaching tips.' },
    ],
  },
  {
    category: 'ICP',
    icon: Filter,
    color: 'text-violet-500',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    capabilities: [
      { action: 'icp.refine', label: 'Refine ICP', description: 'Use customer data to refine your ideal customer profile.' },
    ],
  },
  {
    category: 'Settings',
    icon: SettingsIcon,
    color: 'text-slate-500',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    capabilities: [
      { action: 'settings.recommend', label: 'Optimize Settings', description: 'RevOps-style recommendations for configuration improvements.' },
    ],
  },
  {
    category: 'Billing',
    icon: DollarSign,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    capabilities: [
      { action: 'billing.analyze', label: 'Analyze Usage', description: 'Plan optimization + cost-saving recommendations.' },
    ],
  },
];

// Lucide icon missing in some builds — define locally
function HeadsetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a9 9 0 0 1 18 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

// ============================================================
// Live demo payloads (so user can test each capability immediately)
// ============================================================

const DEMO_PAYLOADS: Record<string, unknown> = {
  'lead.score': {
    name: 'Sarah Johnson', company: 'Acme Corp', title: 'VP Sales',
    industry: 'B2B SaaS', stage: 'engaged', responseCount: 3,
    lastContactDate: '2026-06-15',
    notes: 'Asked about enterprise pricing and integration with Salesforce',
  },
  'lead.enrich': {
    name: 'Mike Chen', company: 'TechStartup', title: 'CTO',
    website: 'techstartup.io', notes: 'Recently raised Series A',
  },
  'lead.next-action': {
    name: 'Emma Wilson', company: 'Growth Co', title: 'Head of Marketing',
    stage: 'contacted', responseCount: 0, lastContactDate: '2026-06-10',
  },
  'email.compose': {
    recipientName: 'David Park', recipientCompany: 'InnovateLabs',
    recipientTitle: 'VP Operations', senderName: 'Alex Rivera',
    senderCompany: 'LeadReach', emailType: 'cold_outreach',
    goal: 'Book a 30-min discovery call', tone: 'professional',
    keyPoints: ['Cut prospecting time 60%', 'Built-in B2B data enrichment'],
  },
  'email.reply': {
    receivedEmail: 'Hi Alex, thanks for reaching out. We just signed with a competitor last quarter but I\'m open to reconnecting in Q4. Can you send me some case studies?',
    context: { recipientName: 'Lisa', senderName: 'Alex', senderCompany: 'LeadReach' },
  },
  'email.optimize-subject': {
    subject: 'Quick question about your sales process',
    audience: 'VP Sales at B2B SaaS companies',
  },
  'messaging.suggest-reply': {
    conversation: [
      { role: 'lead', text: 'Hey, saw your demo. We\'re interested.', timestamp: '2026-06-18T10:00:00Z' },
      { role: 'rep', text: 'Great! What\'s your team size?', timestamp: '2026-06-18T10:02:00Z' },
      { role: 'lead', text: 'About 50 reps. What\'s pricing look like?', timestamp: '2026-06-18T10:05:00Z' },
    ],
    channel: 'whatsapp',
  },
  'messaging.summarize': {
    conversation: [
      { role: 'lead', text: 'We\'re struggling with lead quality.', timestamp: '2026-06-18T09:00:00Z' },
      { role: 'rep', text: 'Tell me more — what\'s happening?', timestamp: '2026-06-18T09:02:00Z' },
      { role: 'lead', text: '50% bounce rate, SDRs wasting hours.', timestamp: '2026-06-18T09:04:00Z' },
      { role: 'rep', text: 'We can fix that with our enrichment.', timestamp: '2026-06-18T09:06:00Z' },
      { role: 'lead', text: 'Pricing? We have 50 SDRs.', timestamp: '2026-06-18T09:08:00Z' },
    ],
  },
  'setter.coach': {
    setterName: 'Jamie',
    callTranscript: `Rep: Hi, this is Jamie from LeadReach. Am I speaking with the right person?
Lead: Yes, this is Mark.
Rep: Great! Mark, I see you're at Acme Corp. How many sales reps do you have?
Lead: About 30.
Rep: Awesome. We help teams like yours prospect better. Want to see a demo?
Lead: Sure, but how much does it cost?
Rep: It depends. Let me just show you the product first.
Lead: OK, send me a calendar link.
Rep: Will do. Thanks!`,
  },
  'setter.qualifying-rules': {
    productContext: 'LeadReach is a B2B lead generation platform with AI agents. Target customers: sales teams of 10-100 reps at B2B SaaS companies in North America. ACV: $24k. Key differentiators: AI-powered prospecting, multi-channel outreach, integrated enrichment.',
  },
  'campaign.generate': {
    name: 'Q3 Enterprise Push',
    audience: 'VP Sales at 200-1000 employee B2B SaaS companies',
    product: 'LeadReach AI Platform',
    goal: 'Generate 50 qualified meetings in Q3',
    channel: 'multi-channel',
    budget: '$50k',
  },
  'campaign.optimize': {
    performance: { sent: 5000, opens: 1500, clicks: 300, replies: 30, meetings: 5 },
  },
  'report.summary': {
    data: {
      period: 'Q2 2026', totalLeads: 1240, qualifiedLeads: 412, meetingsBooked: 87,
      dealsWon: 23, revenue: 184000, topSources: ['LinkedIn', 'Cold Email', 'Referrals'],
      conversionRate: 0.07, previousQuarter: { totalLeads: 980, revenue: 142000 },
    },
    reportType: 'quarterly sales',
  },
  'analytics.annotate': {
    metrics: { leadsGenerated: 412, qualifiedRate: 0.33, replyRate: 0.28, meetingRate: 0.21, conversionRate: 0.07 },
    period: 'June 2026', comparison: 'mom',
    previousMetrics: { leadsGenerated: 380, qualifiedRate: 0.30, replyRate: 0.32, meetingRate: 0.18, conversionRate: 0.06 },
    goals: { leadsGenerated: 500, qualifiedRate: 0.40, replyRate: 0.30 },
  },
  'analytics.forecast': {
    historicalData: [
      { period: 'Q3 2025', revenue: 120000, deals: 18 },
      { period: 'Q4 2025', revenue: 142000, deals: 21 },
      { period: 'Q1 2026', revenue: 168000, deals: 25 },
      { period: 'Q2 2026', revenue: 184000, deals: 23 },
    ],
    quarters: 2,
  },
  'outreach.sequence': {
    lead: { name: 'Sarah Johnson', company: 'Acme Corp', title: 'VP Sales', industry: 'B2B SaaS' },
    goal: 'Book discovery call',
    channels: ['email', 'linkedin', 'phone'],
  },
  'abm.score': {
    account: {
      name: 'Acme Corp', industry: 'B2B SaaS', size: 'mid-market', revenue: '$50M',
      techStack: ['Salesforce', 'HubSpot', 'Gong'], recentNews: 'Raised Series C, expanding sales team',
      currentVendor: 'Outreach.io',
    },
  },
  'booking.brief': {
    lead: { name: 'Sarah Johnson', company: 'Acme Corp', title: 'VP Sales', industry: 'B2B SaaS' },
    meetingType: 'discovery call',
    previousConversations: '2 emails exchanged. She asked about enterprise pricing and Salesforce integration.',
  },
  'settings.recommend': {
    currentSettings: {
      aiScoringEnabled: false, autoEnrichLeads: false, sequenceCadence: 'aggressive',
      replyTime: '24 hours', territories: 'single', teamSize: 8,
    },
  },
  'billing.analyze': {
    usage: { plan: 'Growth', seats: 12, apiCalls: 45000, leadsUsed: 8000, leadsLimit: 10000, aiCreditsUsed: 9500, aiCreditsLimit: 10000 },
  },
  'pipeline.analyze': {
    deal: {
      name: 'Acme Corp - Enterprise', value: 84000, stage: 'negotiation',
      age: 67, lastActivity: '2 weeks ago', nextStep: 'Send revised proposal',
      competitors: ['Outreach', 'SalesLoft'], decisionMakers: ['VP Sales', 'CRO'],
    },
  },
  'icp.refine': {
    currentICP: { industry: 'B2B SaaS', size: '50-500', titles: ['VP Sales', 'Head of Sales'] },
    customerData: { totalCustomers: 142, topCustomers: ['Acme', 'GrowthCo', 'TechStart'], churnedCustomers: ['SmallCo', 'StartupX'], averageACV: 24000 },
  },
};

// ============================================================
// Main page
// ============================================================

export function AIActivationHub() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', ...AI_CAPABILITIES.map(c => c.category)];

  const filtered = AI_CAPABILITIES
    .filter(c => activeCategory === 'All' || c.category === activeCategory)
    .map(c => ({
      ...c,
      capabilities: c.capabilities.filter(cap =>
        cap.label.toLowerCase().includes(search.toLowerCase()) ||
        cap.description.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(c => c.capabilities.length > 0);

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-2">
              <Brain className="h-6 w-6 text-white" />
            </div>
            AI Activation Hub
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Every AI capability on LeadReach, in one place. {AI_CAPABILITIES.reduce((acc, c) => acc + c.capabilities.length, 0)} features across {AI_CAPABILITIES.length} domains.
            Try any feature with a realistic demo payload — no setup required.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          Powered by GLM-4.6
        </Badge>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search AI capabilities…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Capability grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(category => (
          <Card key={category.category} className={`${category.borderColor} border-2`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`rounded-md ${category.bgColor} p-2`}>
                  <category.icon className={`h-5 w-5 ${category.color}`} />
                </div>
                <div>
                  <CardTitle className="text-base">{category.category}</CardTitle>
                  <CardDescription className="text-xs">
                    {category.capabilities.length} AI feature{category.capabilities.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {category.capabilities.map(cap => (
                <div key={cap.action} className="border-t pt-3 first:border-t-0 first:pt-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{cap.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{cap.description}</p>
                    </div>
                  </div>
                  <AIActivateButton
                    action={cap.action}
                    payload={DEMO_PAYLOADS[cap.action] || {}}
                    label="Try it"
                    size="sm"
                    variant="outline"
                    className="w-full"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No AI features match your search.
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Brain className="h-6 w-6 text-purple-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold">All AI features are live</h3>
              <p className="text-sm text-muted-foreground mt-1">
                These AI capabilities are also accessible programmatically via <code className="text-xs bg-white px-1.5 py-0.5 rounded border">POST /api/ai-activate</code>.
                Use the <code className="text-xs bg-white px-1.5 py-0.5 rounded border">useAIActivate</code> hook in any component to invoke them inline.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button variant="outline" size="sm" asChild>
                  <a href="/api/ai-activate" target="_blank" rel="noreferrer" className="gap-1">
                    View API docs
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
