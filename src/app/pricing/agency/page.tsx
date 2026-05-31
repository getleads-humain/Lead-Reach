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
  Shield,
  Building2,
  Paintbrush,
  HeadphonesIcon,
  Server,
  Settings,
  Users,
  Cpu,
  Bot,
  Globe,
  Layers,
  Lock,
  FileCheck,
} from 'lucide-react';

export default function AgencyPlanPage() {
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
          <Badge className="mb-4 bg-secondary/50 text-muted-foreground border">
            <Building2 className="h-3 w-3 mr-1" />
            Custom Pricing
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
            Agency <span className="text-gradient">Plan</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            For agencies managing multiple brands with white-label capabilities. Agency provides unlimited AI setters, unlimited leads, unlimited sub-accounts, full white-label branding, custom integrations, dedicated support, and custom AI model training — everything you need to offer AI-powered appointment setting as a service.
          </p>
          <div className="flex items-baseline justify-center gap-1 mb-8">
            <span className="text-5xl font-bold text-foreground">Custom</span>
          </div>
          <Button
            size="lg"
            variant="outline"
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/5 hover:text-emerald-400 text-base px-8 h-12"
            onClick={() => window.open('mailto:agency@leadreach.ai?subject=Agency Plan Inquiry')}
          >
            Contact Sales
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Who It's For */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Who is <span className="text-gradient">Agency</span> for?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-emerald-500/10 p-3 w-fit mb-4">
                  <Layers className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Marketing Agencies</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Full-service or specialized marketing agencies that want to add AI-powered appointment setting to their service offerings. White-label the entire platform, set up isolated sub-accounts for each client, and deliver per-client reporting under your own brand. Agency transforms appointment setting from a cost center into a revenue-generating service line with predictable margins and scalable operations.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-emerald-500/10 p-3 w-fit mb-4">
                  <Paintbrush className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">White-Label Resellers</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  SaaS resellers and technology partners who want to offer LeadReach&apos;s AI setter capabilities under their own brand. Full white-label means custom domains, branded login pages, custom email templates, and a completely rebranded interface. Your clients never see the LeadReach name — they interact with your brand at every touchpoint while you leverage our AI infrastructure behind the scenes.',
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-emerald-500/10 p-3 w-fit mb-4">
                  <Building2 className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Multi-Location Businesses</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Franchise operations, multi-location service businesses, and enterprise organizations with geographically distributed teams. Each location operates as a separate sub-account with its own setters, calendars, and analytics, while headquarters maintains visibility across all locations. Centralized configuration ensures brand consistency while allowing local customization for regional markets.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Detailed Features */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Everything included in <span className="text-gradient">Agency</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: <Bot className="h-5 w-5 text-emerald-400" />,
                title: 'Unlimited AI Setters & Leads',
                desc: 'Deploy unlimited AI setters handling unlimited lead conversations across all channels. Whether you manage 5 clients or 500, each client gets dedicated setters configured with their brand voice, qualification rules, and booking calendar. Volume scales automatically — no capacity planning, no per-lead surcharges, no limits on conversations or bookings.',
              },
              {
                icon: <Users className="h-5 w-5 text-emerald-400" />,
                title: 'Unlimited Sub-Accounts',
                desc: 'Create as many isolated sub-accounts as your agency requires. Each sub-account operates independently with its own setters, conversations, leads, qualification rules, and analytics. Client data is completely isolated — no cross-contamination, no privacy concerns. The master account provides a unified dashboard showing aggregate performance across all sub-accounts with drill-down capabilities.',
              },
              {
                icon: <Paintbrush className="h-5 w-5 text-emerald-400" />,
                title: 'White-Label Capabilities',
                desc: 'Remove all LeadReach branding and present the platform as your own. Custom domains, branded login pages, custom color schemes, your logo on every page, and client-facing dashboards that reflect your brand identity. White-label extends to confirmation messages, appointment reminders, and all client-facing communications — every touchpoint carries your brand, not ours.',
              },
              {
                icon: <Globe className="h-5 w-5 text-emerald-400" />,
                title: 'Custom Integrations & API',
                desc: 'Full API access with comprehensive documentation and webhook support for real-time event streaming. Our integration team builds custom connectors to your clients\' tech stacks — whether it is GoHighLevel, HubSpot, Salesforce, Zoho, or proprietary systems. Bi-directional sync ensures data consistency across all platforms. Rate limits are generous enough for high-volume agency operations.',
              },
              {
                icon: <HeadphonesIcon className="h-5 w-5 text-emerald-400" />,
                title: 'Dedicated Customer Success Manager',
                desc: 'Your dedicated CSM provides strategic guidance for growing your agency practice, quarterly business reviews, proactive optimization recommendations, and priority escalation for any issues. They understand your business model and client portfolio, providing tailored advice on setter configuration, qualification optimization, and client onboarding best practices.',
              },
              {
                icon: <Shield className="h-5 w-5 text-emerald-400" />,
                title: 'SLA (99.9%) + 24/7 Support',
                desc: 'A 99.9% uptime SLA ensures your agency operation and all client accounts stay online around the clock. Priority support guarantees 1-hour response time for critical issues (P1) and 4-hour response for standard requests (P2/P3), available 24 hours a day, 7 days a week, 365 days a year. Your clients depend on you, and you can depend on us.',
              },
              {
                icon: <Cpu className="h-5 w-5 text-emerald-400" />,
                title: 'Custom AI Training',
                desc: 'Train setter AI models on your agency\'s proprietary conversation data — successful bookings, objection handling patterns, and client-specific terminology. Custom-trained models produce more authentic conversations that convert at higher rates. Each client sub-account can have its own custom model trained on their specific industry and customer base.',
              },
              {
                icon: <Settings className="h-5 w-5 text-emerald-400" />,
                title: 'Multi-Brand Management & Bulk Operations',
                desc: 'Manage multiple brands from a single dashboard. Clone setter configurations across sub-accounts, deploy updates in bulk, and run cross-client analytics. Bulk operations let you create, update, or pause setters across all sub-accounts with a single action. Template libraries store reusable setter configurations that can be applied to new clients in minutes instead of hours.',
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

        {/* Agency Onboarding */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            How <span className="text-gradient">Agency</span> onboarding works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Agency Discovery', desc: 'We learn about your agency model, client portfolio, tech stack, and growth targets to design the right configuration and pricing structure.' },
              { step: '02', title: 'White-Label Setup', desc: 'Our team configures your white-label environment — custom domain, branding, email templates, and sub-account templates for rapid client onboarding.' },
              { step: '03', title: 'Client Migration', desc: 'We help migrate existing clients from their current tools, configure setters with client-specific rules, and train custom AI models on your conversation data.' },
              { step: '04', title: 'Launch & Scale', desc: 'Go live with your agency-branded platform. Your CSM monitors performance, optimizes setter configurations, and helps you onboard new clients efficiently.' },
            ].map((item, i) => (
              <Card key={i} className="border-border/30 bg-card/80">
                <CardContent className="p-5">
                  <span className="text-3xl font-bold text-emerald-400/20">{item.step}</span>
                  <h3 className="text-sm font-semibold text-foreground mt-1 mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Frequently asked <span className="text-gradient">questions</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {[
              {
                q: 'How does white-labeling work technically?',
                a: 'White-labeling involves mapping a custom domain (e.g., app.youragency.com) to your LeadReach instance. All pages, login screens, dashboards, and client-facing interfaces display your branding — logo, colors, and company name. Email notifications are sent from your domain. Your clients never see LeadReach branding anywhere in their experience.',
              },
              {
                q: 'Can each client have different setter configurations?',
                a: 'Yes. Each sub-account operates independently with its own setter configurations, qualification rules, messaging style, booking calendars, and channel preferences. You can create template configurations for common client types and customize them per client, or build each configuration from scratch. The master account provides tools to manage configurations across all sub-accounts efficiently.',
              },
              {
                q: 'How does Agency pricing work?',
                a: 'Agency pricing is based on the number of active sub-accounts, total conversation volume, and any custom requirements. We offer both fixed monthly pricing for predictable costs and usage-based pricing for agencies with variable volumes. Contact our sales team for a detailed proposal based on your agency size and projected volume.',
              },
              {
                q: 'Can I resell LeadReach at a markup?',
                a: 'Absolutely. That is the core Agency use case. You set your own pricing for clients and bill them directly. The margin between your Agency subscription cost and your client revenue is yours to keep. Many agencies package LeadReach as part of a broader marketing service, generating significant recurring revenue from the AI setter capability alone.',
              },
              {
                q: 'What kind of support do my clients receive?',
                a: 'Your clients interact with your agency for support — they do not contact LeadReach directly. You act as the first line of support for your clients. For technical issues that require our involvement, you escalate through your dedicated CSM. This model ensures you maintain the client relationship while we handle the technical backend.',
              },
              {
                q: 'Can I export data for my clients?',
                a: 'Yes. Full data export is available for every sub-account — conversation logs, qualification data, booking history, lead lists, and analytics. Export formats include CSV, JSON, and PDF. You can also set up automated data exports on a schedule via the API, so your clients receive regular reports without manual effort from your team.',
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
                Ready to build your <span className="text-gradient">agency practice?</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                Let our team design a custom solution for your agency.
              </p>
              <Button
                size="lg"
                variant="outline"
                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/5 hover:text-emerald-400 text-base px-8 h-12"
                onClick={() => window.open('mailto:agency@leadreach.ai?subject=Agency Plan Inquiry')}
              >
                Contact Sales
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
