'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Zap,
  Target,
  Users,
  BarChart3,
  Mail,
  MessageCircle,
  Phone,
  Calendar,
  Bot,
  Globe,
  SplitSquareHorizontal,
  Settings,
  Layers,
  Activity,
  TrendingUp,
} from 'lucide-react';

export default function CloserPlanPage() {
  return (
    <div className="min-h-screen bg-background noise-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/50 glass px-4">
        <div className="flex items-center gap-3">
          <Link href="/pricing">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              All Plans
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <Activity className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
            Closer <span className="text-gradient">Plan</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            For teams and agencies scaling conversational booking and lead nurturing. Closer deploys unlimited AI setters across all channels with advanced qualification, A/B testing, CRM integration, and custom AI tasks — turning every inbound conversation into a booked appointment.
          </p>
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="text-5xl font-bold text-foreground">$297</span>
            <span className="text-lg text-muted-foreground">/month</span>
          </div>
          <p className="text-sm text-emerald-400 mb-8">Or $2,970/year (save 17% — just $248/mo)</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/app">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald text-base px-8 h-12">
                Start 14-Day Free Trial
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-3">No credit card required for trial</p>
        </div>

        {/* Who It's For */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Who is <span className="text-gradient">Closer</span> for?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-emerald-500/10 p-3 w-fit mb-4">
                  <Layers className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Growing Teams</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Teams of 3 to 15 people that need a scalable appointment-setting system. Closer supports unlimited AI setters across all channels with 5 sub-accounts, so each team member or department gets their own booking pipeline. Unified analytics show team-wide performance while individual dashboards track each setter&apos;s conversion rates.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-emerald-500/10 p-3 w-fit mb-4">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">B2C Service Businesses</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  High-volume service businesses — dental practices, med spas, home services, real estate brokerages — that receive significant inbound interest and need to convert it into booked appointments at scale. Closer&apos;s unlimited setters handle concurrent conversations across all channels so no lead waits more than seconds for a response.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-emerald-500/10 p-3 w-fit mb-4">
                  <Settings className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Marketing Agencies</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Agencies that manage lead generation and appointment setting for multiple clients. Closer&apos;s 5 sub-accounts let you isolate client data, configure brand-specific setters, and deliver per-client reporting. GHL CRM integration makes it seamless for agencies already running on the GoHighLevel platform.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Detailed Features */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Everything included in <span className="text-gradient">Closer</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: <Bot className="h-5 w-5 text-emerald-400" />,
                title: 'Unlimited AI Setters',
                desc: 'Deploy as many AI setters as your operation requires. Each setter can be configured with unique qualification rules, messaging style, booking calendar, and channel preferences. Run specialized setters for different services, locations, or lead sources — all operating simultaneously with independent conversation flows and performance metrics.',
              },
              {
                icon: <BarChart3 className="h-5 w-5 text-emerald-400" />,
                title: '10,000+ Leads Per Month',
                desc: 'Closer handles 20x the volume of Setter, processing 10,000+ lead conversations per month. At this volume, Closer becomes the backbone of your appointment-setting operation — qualifying, booking, and nurturing leads at a scale that would require a team of 5 to 10 full-time human setters to match.',
              },
              {
                icon: <MessageCircle className="h-5 w-5 text-emerald-400" />,
                title: 'All Channels (SMS, WhatsApp, IG, FB, Email)',
                desc: 'Meet your leads where they are. Closer operates across all five major B2C channels: SMS for instant communication, WhatsApp for international leads, Instagram DMs for social-sourced leads, Facebook Messenger for ad-driven inquiries, and Email for longer qualification conversations. Each setter can work across multiple channels simultaneously.',
              },
              {
                icon: <Target className="h-5 w-5 text-emerald-400" />,
                title: 'Advanced Qualification & Scoring',
                desc: 'Go beyond basic yes/no qualification. Closer supports multi-step qualification with weighted scoring, conditional branching, and dynamic question paths based on previous answers. Each lead receives a composite qualification score that factors in demographics, intent signals, budget indicators, and timeline — ensuring only the highest-quality leads reach your calendar.',
              },
              {
                icon: <Calendar className="h-5 w-5 text-emerald-400" />,
                title: 'Real-Time Calendar Sync',
                desc: 'Bi-directional calendar synchronization ensures your availability is always accurate across all booking sources. When an appointment is booked, updated, or cancelled in Closer, your calendar reflects the change instantly. Supports Google Calendar, Outlook, Calendly, and GoHighLevel calendars. Timezone-aware booking prevents scheduling conflicts across regions.',
              },
              {
                icon: <Globe className="h-5 w-5 text-emerald-400" />,
                title: '17+ Languages + A/B Testing',
                desc: 'Engage leads in their preferred language. Closer supports 17+ languages with native-quality conversation in each. Automatic language detection routes leads to the appropriate setter. Built-in A/B testing lets you compare messaging variants, qualification flows, and booking strategies to continuously improve conversion rates.',
              },
              {
                icon: <Zap className="h-5 w-5 text-emerald-400" />,
                title: 'GHL CRM Integration + Custom AI Tasks',
                desc: 'Deep integration with GoHighLevel ensures every booked appointment, qualification score, and conversation log syncs to your GHL pipeline in real time. Custom AI tasks extend your setters with automated post-booking actions: sending intake forms, adding CRM tags, triggering workflows, segmenting email lists, and updating pipeline stages — all without manual effort.',
              },
              {
                icon: <Users className="h-5 w-5 text-emerald-400" />,
                title: '5 Sub-Accounts + Priority Support',
                desc: 'Five isolated sub-accounts let you manage multiple clients, departments, or brands with separate data, setters, and reporting. Each sub-account operates independently with its own configuration and analytics. Priority support with 4-hour response time ensures your operation never stalls when you need help.',
              },
            ].map((feature, i) => (
              <Card key={i} className="border-border/30 bg-card/80">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-emerald-500/10 p-2.5 shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Upgrade Path */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Need <span className="text-gradient">white-label</span> or unlimited scale?
          </h2>
          <Card className="border-border/30 bg-card/80 overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-3">Upgrade to Agency for white-label and unlimited everything</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Agency provides unlimited AI setters, unlimited leads, unlimited sub-accounts, white-label capabilities, custom integrations, a dedicated Customer Success Manager, SLA guarantees, and custom AI model training. It is the complete platform for agencies managing multiple brands.
                  </p>
                  <div className="space-y-2">
                    {[
                      'Unlimited setters, leads, and sub-accounts',
                      'White-label with custom branding',
                      'Custom integrations & API access',
                      'Dedicated CSM + SLA (99.9%)',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-center md:text-right shrink-0">
                  <p className="text-sm text-muted-foreground mb-1">Starting at</p>
                  <p className="text-3xl font-bold text-foreground">Custom</p>
                  <Link href="/pricing/agency">
                    <Button className="mt-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-1">
                      Explore Agency
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Frequently asked <span className="text-gradient">questions</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {[
              {
                q: 'How does A/B testing work with AI setters?',
                a: 'You create two messaging variants (A and B) for any part of the setter conversation — greeting, qualification prompts, objection handling, or booking confirmation. The system automatically distributes leads between variants, tracks conversion rates for each, and identifies the statistically significant winner. You can then adopt the winning variant and start a new test to continuously optimize performance.',
              },
              {
                q: 'Can each setter work across multiple channels?',
                a: 'Yes. Each setter can be configured to operate on any combination of channels — SMS, WhatsApp, Instagram, Facebook Messenger, and Email. A single setter can handle leads from all five channels simultaneously, or you can create channel-specific setters for specialized messaging. The conversation flow adapts to each channel\'s format and norms.',
              },
              {
                q: 'What are Custom AI Tasks?',
                a: 'Custom AI Tasks are automated actions that your setters can perform beyond conversation. Examples include: sending intake forms after booking, adding CRM tags based on qualification answers, triggering nurture email sequences for unqualified leads, updating pipeline stages, sending SMS reminders before appointments, and segmenting leads for targeted follow-up campaigns. You define the trigger and the action — the AI executes it automatically.',
              },
              {
                q: 'How do sub-accounts work?',
                a: 'Each sub-account is an isolated environment with its own setters, conversations, leads, and analytics. Sub-accounts are perfect for agencies managing multiple clients or businesses with multiple locations. The primary account holder can view aggregate analytics across all sub-accounts while each sub-account operates independently with its own branding, qualification rules, and booking calendars.',
              },
              {
                q: 'How does the GHL integration work?',
                a: 'Closer integrates natively with GoHighLevel. When a lead is qualified and booked, their contact record is automatically created or updated in GHL with all qualification data, conversation history, and appointment details. Custom AI Tasks can trigger GHL workflows, add tags, move pipeline stages, and send templated messages — creating a fully automated handoff from AI setter to GHL-powered nurture and follow-up.',
              },
              {
                q: 'Can I white-label the booking experience?',
                a: 'Closer includes basic customization of confirmation messages and appointment reminders. For full white-label capabilities — custom domains, branded booking pages, and a completely rebranded interface — upgrade to the Agency plan. Agency lets you remove all LeadReach branding and present the platform under your own brand identity.',
              },
            ].map((faq, i) => (
              <Card key={i} className="border-border/30 bg-card/80">
                <CardContent className="p-5">
                  <h4 className="text-sm font-semibold text-foreground mb-2">{faq.q}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <div className="relative rounded-2xl border border-border/30 bg-card/50 p-8 lg:p-12 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-emerald-500/5 rounded-full blur-[100px]" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Close more deals with <span className="text-gradient">AI setters</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                Start your 14-day free trial today. No credit card required.
              </p>
              <Link href="/app">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald text-base px-8 h-12">
                  Start Free Trial
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
