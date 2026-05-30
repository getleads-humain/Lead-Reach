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
  Lock,
  HeadphonesIcon,
  Server,
  Settings,
  Users,
  Cpu,
  Paintbrush,
  FileCheck,
  Clock,
  Globe,
} from 'lucide-react';

export default function EnterprisePlanPage() {
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
            Enterprise <span className="text-gradient">Plan</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            For organizations that demand unlimited scale, custom AI model training, white-label capabilities, and dedicated support with SLA guarantees. Enterprise is tailored to your exact requirements — from custom integrations to on-premise deployment.
          </p>
          <div className="flex items-baseline justify-center gap-1 mb-8">
            <span className="text-5xl font-bold text-foreground">Custom</span>
          </div>
          <Button
            size="lg"
            variant="outline"
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/5 hover:text-emerald-400 text-base px-8 h-12"
            onClick={() => window.open('mailto:enterprise@leadreach.ai?subject=Enterprise Plan Inquiry')}
          >
            Contact Sales
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Who It's For */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Who is <span className="text-gradient">Enterprise</span> for?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-emerald-500/10 p-3 w-fit mb-4">
                  <Building2 className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Large Organizations</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Companies with 50+ sales representatives who need an outbound platform that scales across teams, regions, and product lines. Enterprise provides the governance, security, and performance guarantees required by large organizations with complex compliance requirements and multi-tier approval processes.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-emerald-500/10 p-3 w-fit mb-4">
                  <Paintbrush className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Agencies & Resellers</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Marketing agencies, sales outsourcing firms, and channel partners who need white-label capabilities to offer AI-powered lead generation under their own brand. Enterprise includes full white-label with custom domains, branded dashboards, and client-level isolation so each customer sees only their own data.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-emerald-500/10 p-3 w-fit mb-4">
                  <Lock className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Regulated Industries</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Organizations in healthcare, finance, government, and other regulated sectors that require on-premise deployment options, SOC 2 compliance, data residency controls, and custom security configurations. Enterprise provides the flexibility to meet even the most stringent regulatory requirements without compromising on AI capability.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Detailed Features */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Everything included in <span className="text-gradient">Enterprise</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: <Cpu className="h-5 w-5 text-emerald-400" />,
                title: 'Unlimited AI Agents & Leads',
                desc: 'Deploy as many AI agents as your operation requires with zero lead volume caps. Whether you need 10 agents targeting 5 markets or 50 agents running 100 campaigns simultaneously, Enterprise scales without limits. Custom agent configurations can be tailored to specific business units, products, or regional markets with independent ICP profiles and outreach strategies.',
              },
              {
                icon: <Globe className="h-5 w-5 text-emerald-400" />,
                title: 'Custom Channels & Data Sources',
                desc: 'Beyond the standard 17+ channels, Enterprise lets you define custom data sources specific to your industry. Integrate proprietary databases, industry-specific directories, government registries, patent offices, and internal data lakes. Our team builds and maintains custom connectors so your AI agents always have access to the most relevant and comprehensive data available.',
              },
              {
                icon: <Settings className="h-5 w-5 text-emerald-400" />,
                title: 'Custom AI Model Training',
                desc: 'Train LeadReach\'s AI models on your own historical data — past wins, lost deals, customer feedback, and competitive intelligence. The custom-trained models learn your specific qualification criteria, messaging patterns, and conversion signals to deliver leads and compose outreach that mirrors your best-performing sales representatives. Continuous learning ensures the models improve over time.',
              },
              {
                icon: <Users className="h-5 w-5 text-emerald-400" />,
                title: 'Unlimited Seats & Advanced Workflow Orchestration',
                desc: 'Add unlimited team members across departments, regions, and business units. Advanced workflow orchestration lets you define multi-stage, multi-team processes with conditional logic, approval gates, and automated handoffs. Create workflows that route leads to the right team, trigger nurture sequences for unqualified prospects, and escalate hot opportunities instantly.',
              },
              {
                icon: <Paintbrush className="h-5 w-5 text-emerald-400" />,
                title: 'White-Label Capabilities',
                desc: 'Rebrand the entire LeadReach platform as your own. Custom domains, branded login pages, custom email templates with your branding, and client-facing dashboards with your logo and color scheme. Each sub-account or client sees a fully branded experience with no mention of LeadReach. Ideal for agencies offering lead generation as a service under their own brand.',
              },
              {
                icon: <HeadphonesIcon className="h-5 w-5 text-emerald-400" />,
                title: 'Dedicated Customer Success Manager + SLA (99.9%)',
                desc: 'Your dedicated CSM provides strategic guidance, quarterly business reviews, and proactive optimization recommendations. The 99.9% uptime SLA ensures your outbound operation never stops. Priority support guarantees a 1-hour response time for critical issues and 4-hour response for standard requests, 24/7/365. Onboarding includes a dedicated implementation engineer and custom training for your team.',
              },
              {
                icon: <FileCheck className="h-5 w-5 text-emerald-400" />,
                title: 'Custom Integrations & API',
                desc: 'Full API access with comprehensive documentation, SDKs in popular languages, and webhook support for real-time event streaming. Our integration team builds custom connectors to your existing tech stack — whether it is a proprietary CRM, custom ERP, data warehouse, or marketing automation platform. Bi-directional sync ensures data consistency across all systems.',
              },
              {
                icon: <Server className="h-5 w-5 text-emerald-400" />,
                title: 'On-Premise Deployment Option',
                desc: 'For organizations with strict data residency or security requirements, Enterprise offers on-premise deployment. Run LeadReach within your own infrastructure, behind your firewall, with complete control over data storage, access, and retention. Our team handles deployment, updates, and maintenance so you get the benefits of a SaaS product with the security of on-premise hosting.',
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

        {/* Enterprise Process */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            How <span className="text-gradient">Enterprise</span> onboarding works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Discovery Call', desc: 'We learn about your business, sales process, tech stack, compliance requirements, and goals to design the right configuration.' },
              { step: '02', title: 'Custom Proposal', desc: 'You receive a detailed proposal with pricing, implementation timeline, SLA terms, and a custom feature roadmap tailored to your needs.' },
              { step: '03', title: 'Implementation', desc: 'A dedicated implementation engineer configures your environment, builds custom integrations, trains AI models on your data, and sets up workflows.' },
              { step: '04', title: 'Launch & Optimize', desc: 'Go live with full support. Your CSM monitors performance, provides optimization recommendations, and ensures you hit your pipeline targets.' },
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
                q: 'How is Enterprise pricing determined?',
                a: 'Enterprise pricing is based on your specific requirements — number of users, data volume, custom integrations, SLA terms, and deployment model. We provide a detailed proposal after a discovery call that outlines exactly what you need and what it will cost. There are no hidden fees or surprise charges.',
              },
              {
                q: 'What SLA guarantees do you offer?',
                a: 'Our standard Enterprise SLA guarantees 99.9% uptime with scheduled maintenance windows. We offer 1-hour response time for critical issues (P1) and 4-hour response for standard requests (P2/P3), available 24/7/365. Custom SLA terms with higher guarantees are available for organizations with stricter requirements.',
              },
              {
                q: 'Can I deploy LeadReach on my own infrastructure?',
                a: 'Yes. Enterprise offers on-premise deployment within your own cloud environment (AWS, Azure, GCP) or physical data center. This gives you complete control over data residency, access policies, and security configurations while still receiving automatic updates and maintenance from our team.',
              },
              {
                q: 'How does custom AI model training work?',
                a: 'You provide historical data from your CRM — won/lost deal records, call transcripts, email exchanges, and customer feedback. Our data science team trains custom models that learn your specific qualification patterns, messaging preferences, and conversion signals. The model improves continuously as you use the platform, with quarterly retraining cycles.',
              },
              {
                q: 'What security certifications do you have?',
                a: 'LeadReach is SOC 2 Type II compliant and GDPR/CCPA ready. Enterprise customers receive our full security documentation, penetration test results, and compliance certifications. We also support custom security reviews, vendor risk assessments, and contractual data processing agreements tailored to your requirements.',
              },
              {
                q: 'How long does implementation take?',
                a: 'Standard Enterprise implementation takes 2 to 4 weeks, including environment setup, custom integrations, AI model training, and team onboarding. Complex deployments with extensive custom integrations or on-premise requirements may take 4 to 8 weeks. A dedicated implementation engineer guides you through every step.',
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
                Ready to go <span className="text-gradient">Enterprise?</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                Let our team design a custom solution for your organization.
              </p>
              <Button
                size="lg"
                variant="outline"
                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/5 hover:text-emerald-400 text-base px-8 h-12"
                onClick={() => window.open('mailto:enterprise@leadreach.ai?subject=Enterprise Plan Inquiry')}
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
