'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  HelpCircle,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Shield,
  Zap,
  CreditCard,
  Plug,
} from 'lucide-react';

type FAQCategory = 'General' | 'Agents & AI' | 'Pricing' | 'Security' | 'Integration';

interface FAQItem {
  question: string;
  answer: string;
  category: FAQCategory;
}

const CATEGORY_ICONS: Record<FAQCategory, React.ElementType> = {
  'General': HelpCircle,
  'Agents & AI': Zap,
  'Pricing': CreditCard,
  'Security': Shield,
  'Integration': Plug,
};

const FAQ_ITEMS: FAQItem[] = [
  // General
  {
    question: 'What is LeadReach AI?',
    answer: 'LeadReach AI is an agentic lead generation platform that deploys 8 specialized AI agents to autonomously discover, enrich, qualify, and engage leads across 17+ channels. Instead of manual prospecting, our AI workforce runs 24/7 to fill your pipeline with qualified leads.',
    category: 'General',
  },
  {
    question: 'How is LeadReach AI different from traditional lead generation tools?',
    answer: 'Traditional tools require you to manually search, filter, and reach out to prospects. LeadReach AI uses autonomous AI agents that coordinate with each other to handle the entire workflow — from researching prospects across multiple channels to crafting personalized outreach messages. It is like having an entire SDR team that never sleeps.',
    category: 'General',
  },
  {
    question: 'Do I need technical expertise to use LeadReach AI?',
    answer: 'Not at all. LeadReach AI is designed for sales professionals, not developers. You simply define your Ideal Customer Profile (ICP), and the AI agents handle everything else. Our intuitive dashboard gives you full visibility and control without requiring any coding or configuration.',
    category: 'General',
  },
  {
    question: 'What kind of results can I expect?',
    answer: 'Results vary by industry and ICP definition, but our customers typically see a 5-10x increase in qualified leads discovered per week, 3x improvement in outreach reply rates due to personalization, and 60% reduction in time spent on manual prospecting. Most teams see their first qualified leads within 24 hours of setup.',
    category: 'General',
  },
  {
    question: 'Is there a free trial available?',
    answer: 'Yes! We offer a 14-day free trial on all plans with full access to all features. No credit card required to start. You can explore the platform, deploy AI agents, and see results before committing to a paid plan.',
    category: 'General',
  },
  // Agents & AI
  {
    question: 'How do the AI agents work?',
    answer: 'LeadReach AI uses a multi-agent architecture with 8 specialized agents: Orchestrator (coordinates workflows), Prospect Discovery (finds leads), Data Enrichment (enriches profiles), Web Research (deep company research), Lead Qualification (scores leads), Outreach Composer (crafts messages), Pipeline Manager (manages stages), and Report Generator (analytics). The Orchestrator agent coordinates all others, assigning tasks and ensuring seamless collaboration.',
    category: 'Agents & AI',
  },
  {
    question: 'What channels do the AI agents research?',
    answer: 'Our agents research across 17+ channels including the open web (via Jina Reader), semantic search (Exa), LinkedIn, Twitter/X, YouTube, GitHub, Reddit, RSS feeds, WeChat Articles, Weibo, V2EX, Xueqiu, and more. New channels are added regularly. Some channels require API keys or authentication setup, while others work with zero configuration.',
    category: 'Agents & AI',
  },
  {
    question: 'Can I customize which agents are active?',
    answer: 'Yes. While the full power comes from all 8 agents working together, you can activate or deactivate individual agents based on your needs. For example, if you only need research and enrichment without outreach, you can disable the Outreach Composer and Pipeline Manager agents.',
    category: 'Agents & AI',
  },
  {
    question: 'How is lead scoring done?',
    answer: 'The Lead Qualification agent scores leads based on your defined Ideal Customer Profile criteria including industry match, company size, location, technology stack, growth signals, and digital presence. It uses a weighted scoring model that you can customize, and scores update in real-time as new enrichment data becomes available.',
    category: 'Agents & AI',
  },
  {
    question: 'How does the Outreach Composer personalize messages?',
    answer: 'The Outreach Composer analyzes each lead\'s enriched profile — including their company context, role, recent activities, and digital footprint — to craft genuinely personalized messages. It references specific details like recent company news, shared connections, or technology choices, making each message feel hand-written rather than template-generated.',
    category: 'Agents & AI',
  },
  {
    question: 'Can AI agents make decisions autonomously?',
    answer: 'Yes, within the guardrails you define. Agents can autonomously decide which channels to research, how to prioritize leads, and when to send follow-ups. However, you retain full control — you can set approval workflows for outreach messages, define scoring thresholds, and configure escalation rules for high-value leads.',
    category: 'Agents & AI',
  },
  // Pricing
  {
    question: 'What is included in the free trial?',
    answer: 'The 14-day free trial includes full access to all 8 AI agents, 500 leads per month, access to all 17+ research channels, data enrichment, lead scoring, outreach composition, pipeline management, and analytics. No credit card is required, and you can downgrade or cancel anytime.',
    category: 'Pricing',
  },
  {
    question: 'Can I switch plans at any time?',
    answer: 'Absolutely. You can upgrade or downgrade your plan at any time. When upgrading, you get immediate access to additional features and capacity. When downgrading, the change takes effect at the start of your next billing cycle. Prorated credits are applied automatically.',
    category: 'Pricing',
  },
  {
    question: 'What happens when I exceed my monthly lead limit?',
    answer: 'If you approach your monthly lead limit, we will notify you so you can either upgrade your plan or wait for the next cycle. You will never be charged overage fees without explicit consent. Enterprise plans offer unlimited leads with fair-use policies.',
    category: 'Pricing',
  },
  {
    question: 'Do you offer discounts for annual billing?',
    answer: 'Yes, we offer a 20% discount when you choose annual billing. This applies to all plans including Starter and Professional tiers. Enterprise customers can also negotiate custom terms based on volume and commitment length.',
    category: 'Pricing',
  },
  // Security
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We take data security very seriously. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Our infrastructure runs on SOC 2 Type II certified cloud providers. We do not share your data with third parties, and our AI agents process data in isolated, secure environments.',
    category: 'Security',
  },
  {
    question: 'Where is my data stored?',
    answer: 'Your data is stored in secure, encrypted databases hosted on SOC 2 Type II certified infrastructure. Data residency options are available for Enterprise customers who require specific geographic locations. You retain full ownership of all your data at all times.',
    category: 'Security',
  },
  {
    question: 'Do you comply with GDPR and CCPA?',
    answer: 'Yes. LeadReach AI is fully compliant with GDPR, CCPA, and other major data privacy regulations. We provide data export and deletion capabilities, honor opt-out requests, and maintain detailed audit logs. Our legal team regularly reviews our compliance posture as regulations evolve.',
    category: 'Security',
  },
  {
    question: 'How do you handle lead data obtained from public sources?',
    answer: 'We only collect publicly available information and data from authorized sources. Our research agents comply with each platform\'s terms of service and robots.txt directives. We maintain a strict data governance policy that respects privacy preferences and do-not-contact lists. All enriched data includes source attribution.',
    category: 'Security',
  },
  // Integration
  {
    question: 'Can I integrate with my existing CRM?',
    answer: 'Yes. LeadReach AI integrates natively with Salesforce, HubSpot, and Pipedrive. We also offer a REST API and webhooks that let you connect to any CRM or custom system. Leads, enrichment data, and outreach activities can be synced bidirectionally in real-time.',
    category: 'Integration',
  },
  {
    question: 'What about email and outreach tool integrations?',
    answer: 'We integrate with popular email platforms including Gmail, Outlook, and custom SMTP servers. Outreach sequences can also be managed through tools like Outreach.io, Salesloft, and Lemlist via our API. The Outreach Composer agent works seamlessly with all these platforms.',
    category: 'Integration',
  },
  {
    question: 'Is there an API available?',
    answer: 'Yes, our REST API is available on Professional and Enterprise plans. The API provides full programmatic access to all platform features — from defining ICPs and deploying agents to retrieving leads and triggering outreach. Comprehensive documentation and SDKs for Python and Node.js are available.',
    category: 'Integration',
  },
];

const CATEGORIES: FAQCategory[] = ['General', 'Agents & AI', 'Pricing', 'Security', 'Integration'];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<FAQCategory>('General');

  const filteredItems = FAQ_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <MarketingLayout>
      {/* Header */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              <HelpCircle className="h-3 w-3 mr-1" />
              FAQ
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Everything you need to know about LeadReach AI. Can not find the answer you are looking for? Reach out to our support team.
            </p>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="py-8 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              return (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                  className={
                    activeCategory === cat
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-1.5'
                      : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-emerald-500/20 gap-1.5'
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat}
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Accordion type="single" collapsible className="space-y-3">
            {filteredItems.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-border/30 rounded-xl bg-card/50 px-5 data-[state=open]:border-emerald-500/20 transition-colors"
              >
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline hover:text-emerald-400 transition-colors py-5">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
                Still have <span className="text-gradient">questions</span>?
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Our team is here to help. Start a free trial and experience the platform firsthand, or reach out to our support team for personalized answers.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/app">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-border/50 text-foreground hover:bg-secondary/50">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
