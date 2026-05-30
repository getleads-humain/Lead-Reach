'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  HelpCircle,
  ArrowRight,
  MessageSquare,
  Mail,
  Clock,
  Headphones,
  BookOpen,
  Zap,
  Shield,
  CheckCircle2,
  Phone,
  FileText,
  ExternalLink,
} from 'lucide-react';

const SUPPORT_CHANNELS = [
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Get real-time help from our support team directly within the platform. Available Monday through Friday, 8 AM to 8 PM ET. Average response time is under 3 minutes during business hours.',
    action: 'Start Chat',
    href: '/app',
    availability: 'Mon-Fri, 8 AM - 8 PM ET',
    responseTime: '< 3 minutes',
  },
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Send us a detailed message at support@leadreach.ai and our team will investigate your issue thoroughly. We provide comprehensive responses with step-by-step solutions and follow up until your issue is fully resolved.',
    action: 'Send Email',
    href: 'mailto:support@leadreach.ai',
    availability: '24/7 (responses within business hours)',
    responseTime: '< 4 hours',
  },
  {
    icon: Phone,
    title: 'Priority Phone Support',
    description: 'Professional and Enterprise plan customers receive dedicated phone support with a direct line to your account team. Schedule calls for strategic discussions, onboarding assistance, or urgent technical issues.',
    action: 'Schedule Call',
    href: '/contact',
    availability: 'Mon-Fri, 9 AM - 6 PM ET',
    responseTime: 'Immediate',
  },
];

const KNOWLEDGE_BASE = [
  {
    icon: BookOpen,
    title: 'Platform Documentation',
    description: 'Comprehensive guides covering every feature, agent configuration, and workflow. From initial setup to advanced API integrations, our documentation provides detailed walkthroughs with screenshots and examples.',
    link: '/docs',
    linkText: 'Browse Documentation',
  },
  {
    icon: HelpCircle,
    title: 'Frequently Asked Questions',
    description: 'Quick answers to the most common questions about LeadReach AI, including pricing, agent capabilities, data security, integrations, and account management. Organized by category for easy navigation.',
    link: '/faq',
    linkText: 'View FAQ',
  },
  {
    icon: Zap,
    title: 'Quick Start Tutorials',
    description: 'Step-by-step video and written tutorials to help you get the most out of LeadReach AI. Learn how to define your ICP, deploy agents, manage campaigns, and optimize your lead generation pipeline for maximum ROI.',
    link: '/docs',
    linkText: 'Start Learning',
  },
  {
    icon: Shield,
    title: 'Security & Compliance',
    description: 'Detailed information about our security practices, data handling policies, compliance certifications, and privacy controls. We are committed to transparency about how we protect your data and your leads\' information.',
    link: '/privacy',
    linkText: 'Security Overview',
  },
];

const TICKET_STATUSES = [
  { label: 'Critical', description: 'Platform outage or data loss. 1-hour response SLA for Enterprise, 4-hour for Professional.', color: 'text-red-400' },
  { label: 'High', description: 'Major feature unavailable or significantly impaired. 4-hour response SLA for Enterprise, 8-hour for Professional.', color: 'text-orange-400' },
  { label: 'Medium', description: 'Feature partially impaired or workaround available. 8-hour response SLA for Enterprise, 24-hour for Professional.', color: 'text-yellow-400' },
  { label: 'Low', description: 'General question, feature request, or minor issue. 24-hour response SLA for Enterprise, 48-hour for Professional.', color: 'text-emerald-400' },
];

export default function SupportPage() {
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
              Our dedicated support team is here to ensure you get the most out of LeadReach AI. Whether you need technical assistance, strategic guidance, or have a question about your account, we are ready to help.
            </p>
          </div>
        </div>
      </section>

      {/* Support Channels */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-foreground mb-8">Support Channels</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SUPPORT_CHANNELS.map((channel) => {
              const Icon = channel.icon;
              return (
                <Card key={channel.title} className="card-premium border-border/30 bg-card/50 p-6">
                  <div className="rounded-xl bg-emerald-500/10 p-3 w-fit mb-4">
                    <Icon className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{channel.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{channel.description}</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 text-emerald-500/60" />
                      {channel.availability}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3 text-emerald-500/60" />
                      Response time: {channel.responseTime}
                    </div>
                  </div>
                  <Link href={channel.href}>
                    <Button className="mt-4 w-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors" variant="outline">
                      {channel.action}
                      <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Knowledge Base */}
      <section className="py-16 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-foreground mb-2">Self-Service Resources</h2>
          <p className="text-sm text-muted-foreground mb-8">Find answers quickly with our comprehensive knowledge base and documentation.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {KNOWLEDGE_BASE.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="card-premium border-border/30 bg-card/50 p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-emerald-500/10 p-3 shrink-0">
                      <Icon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                      <Link href={item.link} className="mt-3 inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                        {item.linkText}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* SLA & Ticket Priority */}
      <section className="py-16 border-t border-border/20 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* SLA Overview */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Service Level Agreement</h2>
              <p className="text-sm text-muted-foreground mb-6">
                We commit to the following response time guarantees based on your plan tier and issue severity. Our SLA applies to all support channels during business hours.
              </p>
              <div className="space-y-4">
                {TICKET_STATUSES.map((status) => (
                  <div key={status.label} className="flex items-start gap-3 p-4 rounded-xl border border-border/30 bg-card/50">
                    <div className={`font-bold text-sm ${status.color} shrink-0 w-20`}>{status.label}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{status.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan Support Tiers */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Support by Plan</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Every LeadReach AI customer receives dedicated support. Higher-tier plans include faster response times, priority escalation, and additional support channels.
              </p>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border/30 bg-card/50">
                  <h3 className="text-sm font-bold text-foreground mb-2">Launchpad (Free) Plan</h3>
                  <ul className="space-y-2">
                    {[
                      'Email support with 72-hour response SLA',
                      'Access to documentation and FAQ',
                      'Community forum access',
                      'Standard ticket priority',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500/60 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl border border-border/30 bg-card/50">
                  <h3 className="text-sm font-bold text-foreground mb-2">Scout Plan</h3>
                  <ul className="space-y-2">
                    {[
                      'Email support with 48-hour response SLA',
                      'Access to documentation and FAQ',
                      'Community forum access',
                      'Standard ticket priority',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500/60 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <h3 className="text-sm font-bold text-foreground mb-2">Professional Plan</h3>
                  <ul className="space-y-2">
                    {[
                      'Live chat support with < 3 min response',
                      'Email support with 8-hour response SLA',
                      'Priority ticket escalation',
                      'Onboarding assistance call',
                      'Full documentation & API reference access',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
                  <h3 className="text-sm font-bold text-amber-400 mb-2">Founders' Pass (Lifetime)</h3>
                  <ul className="space-y-2">
                    {[
                      'Live chat support with < 3 min response',
                      'Email support with 8-hour response SLA',
                      'Priority ticket escalation — forever',
                      'Full documentation & API reference access',
                      'All future support enhancements included',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                  <h3 className="text-sm font-bold text-emerald-400 mb-2">Enterprise Plan</h3>
                  <ul className="space-y-2">
                    {[
                      'Dedicated account manager',
                      'Priority phone support (Mon-Fri, 9-6 ET)',
                      '1-hour critical issue response SLA',
                      'Custom onboarding & training program',
                      'Quarterly business reviews',
                      'Direct Slack channel with engineering',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Status & Escalation */}
      <section className="py-16 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="card-premium border-border/30 bg-card/50 p-6 text-center">
              <div className="rounded-full bg-emerald-500/10 w-14 h-14 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-foreground">System Status</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                All systems operational. Our platform maintains 99.9% uptime with redundant infrastructure across multiple availability zones. Visit our status page for real-time updates.
              </p>
            </Card>

            <Card className="card-premium border-border/30 bg-card/50 p-6 text-center">
              <div className="rounded-full bg-emerald-500/10 w-14 h-14 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Planned Maintenance</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We schedule maintenance windows during off-peak hours and provide at least 48 hours advance notice. All maintenance updates are communicated via email and our status page.
              </p>
            </Card>

            <Card className="card-premium border-border/30 bg-card/50 p-6 text-center">
              <div className="rounded-full bg-emerald-500/10 w-14 h-14 flex items-center justify-center mx-auto mb-4">
                <Headphones className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Escalation Path</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                If your issue requires escalation, our tiered support model ensures it reaches the right team quickly. L1 support handles general inquiries, L2 handles technical issues, and L3 involves engineering directly.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border border-border/30 bg-card/50 p-8 lg:p-12 text-center overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-emerald-500/5 rounded-full blur-[80px]" />
            <div className="relative">
              <MessageSquare className="h-8 w-8 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Cannot find what you are <span className="text-gradient">looking for</span>?
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Our support team is standing by to help. Reach out through any of our support channels and we will get back to you as quickly as possible.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/contact">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm">
                    Contact Us
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href="mailto:support@leadreach.ai">
                  <Button size="lg" variant="outline" className="border-border/50 text-foreground hover:bg-secondary/50">
                    <Mail className="mr-2 h-4 w-4" />
                    Email Support
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
