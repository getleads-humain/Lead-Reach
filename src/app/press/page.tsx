'use client';

import React from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Newspaper, Download, ExternalLink, Mic, FileText, Award } from 'lucide-react';

const PRESS_MENTIONS = [
  {
    publication: 'TechCrunch',
    title: 'LeadReach AI Launches Multi-Agent System for Autonomous B2B Lead Generation',
    date: 'March 2025',
    excerpt: 'The startup\'s eight-agent architecture promises to automate the entire prospecting pipeline, from discovery to personalized outreach, reducing the time sales teams spend on manual research by up to 60 percent.',
  },
  {
    publication: 'VentureBeat',
    title: 'Why Multi-Agent AI Systems Are the Next Frontier in Sales Technology',
    date: 'January 2025',
    excerpt: 'LeadReach AI\'s approach of deploying specialized agents that coordinate with each other represents a fundamental shift from single-purpose automation tools to truly autonomous sales workflows.',
  },
  {
    publication: 'Forbes',
    title: 'The Rise of Agentic AI: How Startups Are Building AI That Acts, Not Just Answers',
    date: 'November 2024',
    excerpt: 'Companies like LeadReach AI are pioneering a new category of AI products where the system does not just respond to prompts but takes initiative, makes decisions within guardrails, and executes multi-step plans autonomously.',
  },
  {
    publication: 'SaaStr',
    title: 'From ICP to Pipeline: How AI Agents Are Replacing the SDR Workflow',
    date: 'September 2024',
    excerpt: 'LeadReach AI\'s end-to-end agent pipeline covers every step from defining an Ideal Customer Profile to delivering qualified leads with personalized outreach drafts ready for human review.',
  },
];

const PRESS_RESOURCES = [
  { icon: Download, title: 'Brand Kit', description: 'Logos, color palette, typography guidelines, and approved brand assets in multiple formats (SVG, PNG, EPS).', link: '#' },
  { icon: FileText, title: 'Press Kit', description: 'Company overview, fact sheet, executive bios, product screenshots, and approved press images for media use.', link: '#' },
  { icon: Mic, title: 'Media Inquiries', description: 'For interview requests, expert commentary, and press partnerships, contact our communications team.', link: 'mailto:press@leadreach.ai' },
];

const AWARDS = [
  { icon: Award, title: 'Top 50 AI Startups 2025', org: 'AI Breakthrough Awards' },
  { icon: Award, title: 'Best Sales Innovation', org: 'SaaStr Annual 2024' },
  { icon: Award, title: 'Rising Star in Agentic AI', org: 'Gartner Cool Vendor' },
];

export default function PressPage() {
  return (
    <MarketingLayout>
      {/* Header */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              <Newspaper className="h-3 w-3 mr-1" />
              Press
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              LeadReach AI in the <span className="text-gradient">News</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Press coverage, media resources, and company milestones. For media inquiries, reach out to our communications team at press@leadreach.ai.
            </p>
          </div>
        </div>
      </section>

      {/* Awards */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Awards & <span className="text-gradient">Recognition</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {AWARDS.map((award) => {
              const Icon = award.icon;
              return (
                <div
                  key={award.title}
                  className="rounded-xl border border-border/30 bg-card/50 p-6 text-center hover:border-emerald-500/20 transition-colors"
                >
                  <Icon className="h-6 w-6 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-foreground mb-1">{award.title}</h3>
                  <p className="text-xs text-muted-foreground">{award.org}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Press Mentions */}
      <section className="py-16 lg:py-20 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Press <span className="text-gradient">Coverage</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              What leading publications are saying about LeadReach AI and the future of agentic sales technology.
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            {PRESS_MENTIONS.map((mention) => (
              <div
                key={mention.title}
                className="rounded-xl border border-border/30 bg-card/50 p-6 hover:border-emerald-500/20 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-emerald-400">{mention.publication}</span>
                  <span className="text-xs text-muted-foreground">{mention.date}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{mention.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{mention.excerpt}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press Resources */}
      <section className="py-16 lg:py-20 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Press <span className="text-gradient">Resources</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Downloadable assets and contact information for media professionals.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PRESS_RESOURCES.map((resource) => {
              const Icon = resource.icon;
              return (
                <a
                  key={resource.title}
                  href={resource.link}
                  className="rounded-xl border border-border/30 bg-card/50 p-6 text-center hover:border-emerald-500/20 transition-colors block"
                >
                  <Icon className="h-6 w-6 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-foreground mb-2">{resource.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{resource.description}</p>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border border-border/30 bg-card/50 p-8 lg:p-12 text-center overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-emerald-500/5 rounded-full blur-[80px]" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Media <span className="text-gradient">Inquiries</span>
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                For interviews, expert commentary, or partnership opportunities, our communications team is ready to assist.
              </p>
              <div className="mt-6">
                <a href="mailto:press@leadreach.ai">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm">
                    Contact Press Team
                    <ArrowRight className="ml-2 h-4 w-4" />
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
