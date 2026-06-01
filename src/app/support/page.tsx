'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Headphones, MessageSquare, Mail, BookOpen, Zap, Clock, CheckCircle2 } from 'lucide-react';

const SUPPORT_CHANNELS = [
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Chat with our support team in real time. Available for Professional and Enterprise plan subscribers with priority queue access. Starter plan users can access live chat during business hours.',
    availability: '24/7 for Pro & Enterprise',
    action: 'Start Chat',
  },
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Send us a detailed description of your issue and our team will respond with a thorough resolution. Email support is available for all plan levels including free trial users.',
    availability: 'Response within 24 hours',
    action: 'Email Us',
  },
  {
    icon: BookOpen,
    title: 'Documentation',
    description: 'Browse our comprehensive documentation covering every feature, integration, and configuration option. Most common questions are answered in our docs with step-by-step guides and screenshots.',
    availability: 'Always available',
    action: 'Browse Docs',
    href: '/docs',
  },
];

const COMMON_ISSUES = [
  {
    question: 'My AI agents are not discovering any leads',
    answer: 'This usually means your ICP definition is too narrow. Try broadening your target criteria — for example, expanding the company size range or adding alternative industries. Also check that your research channels are properly configured in Settings. If the issue persists, our support team can review your ICP and suggest optimizations.',
  },
  {
    question: 'Lead enrichment data seems incomplete',
    answer: 'Enrichment data depends on the availability of public information for each lead. Some leads have limited digital footprints. Our agents always attempt multiple sources, but if key fields are missing, it typically means that data is not publicly available. You can enable additional research channels to improve coverage.',
  },
  {
    question: 'How do I connect my CRM?',
    answer: 'Navigate to Settings > Integrations and select your CRM (Salesforce, HubSpot, or Pipedrive). Follow the OAuth flow to authorize the connection. Once connected, you can configure bidirectional sync settings. Visit the Integrations section of our documentation for detailed setup guides.',
  },
  {
    question: 'Outreach messages are not being generated',
    answer: 'Ensure the Outreach Composer agent is activated in your agent settings. Then check that your leads have sufficient enrichment data — the agent needs company context and role information to personalize messages. Finally, verify that your outreach templates and sending preferences are configured in the Outreach section.',
  },
  {
    question: 'I am seeing a "rate limit" error',
    answer: 'Rate limits depend on your plan tier. Starter plans have lower limits for API calls and agent operations. If you are consistently hitting limits, consider upgrading your plan or adjusting your agent schedules to distribute the load more evenly across the day. Enterprise plans have significantly higher or custom limits.',
  },
];

const SUPPORT_TIERS = [
  {
    plan: 'Free Trial',
    email: true,
    chat: 'Business hours',
    priority: false,
    responseTime: '48 hours',
  },
  {
    plan: 'Starter',
    email: true,
    chat: 'Business hours',
    priority: false,
    responseTime: '24 hours',
  },
  {
    plan: 'Professional',
    email: true,
    chat: '24/7',
    priority: true,
    responseTime: '4 hours',
  },
  {
    plan: 'Enterprise',
    email: true,
    chat: '24/7',
    priority: true,
    responseTime: '1 hour',
  },
];

export default function SupportPage() {
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  return (
    <MarketingLayout>
      {/* Header */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              <Headphones className="h-3 w-3 mr-1" />
              Support
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              How Can We <span className="text-gradient">Help</span>?
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Our support team is here to ensure you get the most out of LeadReach AI. Choose your preferred channel below and we will get you sorted.
            </p>
          </div>
        </div>
      </section>

      {/* Support Channels */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SUPPORT_CHANNELS.map((channel) => {
              const Icon = channel.icon;
              return (
                <div
                  key={channel.title}
                  className="rounded-xl border border-border/30 bg-card/50 p-6 hover:border-emerald-500/20 transition-colors flex flex-col"
                >
                  <div className="rounded-lg bg-emerald-500/10 p-2.5 w-fit mb-4">
                    <Icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{channel.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{channel.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {channel.availability}
                  </div>
                  <div className="mt-3">
                    {channel.href ? (
                      <Link href={channel.href}>
                        <Button size="sm" variant="outline" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 w-full">
                          {channel.action}
                        </Button>
                      </Link>
                    ) : (
                      <Button size="sm" variant="outline" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 w-full">
                        {channel.action}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Common Issues */}
      <section className="py-16 lg:py-20 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Common <span className="text-gradient">Issues</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Quick answers to the questions we hear most often. If your issue is not listed here, please reach out through one of our support channels.
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {COMMON_ISSUES.map((issue, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/30 bg-card/50 overflow-hidden hover:border-emerald-500/20 transition-colors"
              >
                <button
                  className="w-full flex items-center justify-between p-5 text-left"
                  onClick={() => setExpandedIssue(expandedIssue === i ? null : i)}
                >
                  <span className="text-sm font-semibold text-foreground pr-4">{issue.question}</span>
                  <ArrowRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${expandedIssue === i ? 'rotate-90' : ''}`} />
                </button>
                {expandedIssue === i && (
                  <div className="px-5 pb-5 border-t border-border/20 pt-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{issue.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Tiers */}
      <section className="py-16 lg:py-20 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Support <span className="text-gradient">Tiers</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Every plan includes access to our support team. Higher tiers receive faster response times and priority routing.
            </p>
          </div>
          <div className="max-w-3xl mx-auto overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-foreground uppercase tracking-wider">Plan</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-foreground uppercase tracking-wider">Email</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-foreground uppercase tracking-wider">Chat</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-foreground uppercase tracking-wider">Priority</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-foreground uppercase tracking-wider">Response</th>
                </tr>
              </thead>
              <tbody>
                {SUPPORT_TIERS.map((tier) => (
                  <tr key={tier.plan} className="border-b border-border/20">
                    <td className="py-3 px-4 font-medium text-foreground">{tier.plan}</td>
                    <td className="py-3 px-4 text-center">{tier.email ? <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" /> : '—'}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{tier.chat}</td>
                    <td className="py-3 px-4 text-center">{tier.priority ? <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" /> : '—'}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{tier.responseTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border border-border/30 bg-card/50 p-8 lg:p-12 text-center overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-emerald-500/5 rounded-full blur-[80px]" />
            <div className="relative">
              <Zap className="h-8 w-8 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Still Need <span className="text-gradient">Help</span>?
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Our support team is standing by. Reach out via live chat or email and we will resolve your issue as quickly as possible.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/contact">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm">
                    Contact Support
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button size="lg" variant="outline" className="border-border/50 text-foreground hover:bg-secondary/50">
                    Browse Documentation
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
