'use client';

import React from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  ArrowRight,
  Briefcase,
  MapPin,
  Clock,
  Zap,
  Heart,
  Globe,
  GraduationCap,
  DollarSign,
  Users,
  Sparkles,
  Laptop,
  Rocket,
  Coffee,
  Shield,
} from 'lucide-react';

const BENEFITS = [
  {
    icon: Globe,
    title: 'Remote-First',
    description: 'Work from anywhere in the world. We are a distributed team spanning multiple time zones, and we have built our processes around asynchronous collaboration. Whether you prefer a home office, a co-working space, or a beach in Bali, we trust you to do your best work wherever you are most productive.',
  },
  {
    icon: DollarSign,
    title: 'Competitive Compensation',
    description: 'We offer top-of-market salaries benchmarked against your role, experience level, and location. Every team member also receives meaningful equity in the company, ensuring everyone shares in the value we create together. Annual compensation reviews ensure your pay keeps pace with your impact.',
  },
  {
    icon: Heart,
    title: 'Health & Wellness',
    description: 'Comprehensive health, dental, and vision insurance for you and your dependents. We also provide a monthly wellness stipend for gym memberships, meditation apps, or any activity that supports your physical and mental well-being. Mental health days are encouraged, never questioned.',
  },
  {
    icon: GraduationCap,
    title: 'Learning & Development',
    description: 'An annual learning budget of $3,000 for courses, conferences, books, and certifications. We host regular internal tech talks, AI research paper reading groups, and cross-functional knowledge-sharing sessions. Your growth is our investment, and we are committed to helping you develop both personally and professionally.',
  },
  {
    icon: Laptop,
    title: 'Home Office Setup',
    description: 'A $2,500 one-time home office stipend to set up your ideal workspace, plus $500 annually for equipment upgrades. Choose the monitor, keyboard, chair, and accessories that help you do your best work. We also cover monthly internet costs.',
  },
  {
    icon: Clock,
    title: 'Flexible Time Off',
    description: 'We do not track vacation days. Take the time you need to recharge, travel, or handle life events. We ask only that you coordinate with your team and ensure your responsibilities are covered. In addition, we observe company-wide recharge weeks twice a year.',
  },
  {
    icon: Coffee,
    title: 'Team Retreats',
    description: 'Annual company retreats in inspiring locations where the entire team comes together for strategic planning, team bonding, and creative collaboration. Past retreats have included destinations in Napa Valley, Lisbon, and Kyoto. These are fully funded, including travel, accommodation, and activities.',
  },
  {
    icon: Shield,
    title: 'Parental Leave',
    description: '16 weeks of fully paid parental leave for all parents, regardless of gender or family structure. We also provide a $1,000 new-parent stipend and flexible return-to-work arrangements. Building a family should never mean compromising your career, and we are committed to supporting you through every stage of life.',
  },
];

const DEPARTMENTS = ['Engineering', 'Product', 'AI Research', 'Sales', 'Customer Success', 'Marketing'];

interface JobListing {
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
}

const JOB_LISTINGS: JobListing[] = [
  {
    title: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    location: 'Remote (US/EU)',
    type: 'Full-time',
    description: 'Build and scale the core LeadReach AI platform. You will work across our Next.js frontend, Node.js API layer, and Prisma/PostgreSQL database, shipping features that directly impact how our customers discover and engage leads. We are looking for engineers who thrive in fast-paced environments and care deeply about user experience.',
  },
  {
    title: 'ML Engineer — Agent Orchestration',
    department: 'AI Research',
    location: 'Remote (US)',
    type: 'Full-time',
    description: 'Design and implement the next generation of our multi-agent orchestration engine. You will work on LLM-based planning, tool use, and inter-agent communication protocols that power our 8-agent workforce. Experience with LangChain, LlamaIndex, or custom agent frameworks strongly preferred.',
  },
  {
    title: 'Product Designer',
    department: 'Product',
    location: 'Remote (US/EU)',
    type: 'Full-time',
    description: 'Craft intuitive, beautiful interfaces for complex AI-powered workflows. You will own the end-to-end design of features from research and ideation through prototyping, user testing, and implementation. Experience designing for data-heavy dashboards, complex workflows, or AI/ML products is a significant plus.',
  },
  {
    title: 'Enterprise Account Executive',
    department: 'Sales',
    location: 'Remote (US)',
    type: 'Full-time',
    description: 'Drive new business by helping enterprise organizations transform their lead generation with LeadReach AI. You will manage the full sales cycle from prospecting to close, working with VP and C-level stakeholders. Proven track record of closing six-figure SaaS deals required.',
  },
  {
    title: 'Customer Success Manager',
    department: 'Customer Success',
    location: 'Remote (US/EU)',
    type: 'Full-time',
    description: 'Ensure our customers achieve measurable ROI from LeadReach AI. You will onboard new customers, develop success plans, conduct quarterly business reviews, and serve as the voice of the customer internally. Strong analytical skills and experience with B2B SaaS platforms are essential.',
  },
  {
    title: 'Content Marketing Lead',
    department: 'Marketing',
    location: 'Remote (US)',
    type: 'Full-time',
    description: 'Build and execute our content strategy across blog, documentation, case studies, and thought leadership. You will create compelling content that educates our audience about AI-powered lead generation, drives organic traffic, and converts readers into qualified leads. B2B SaaS content marketing experience required.',
  },
  {
    title: 'DevOps / Platform Engineer',
    department: 'Engineering',
    location: 'Remote (US/EU)',
    type: 'Full-time',
    description: 'Own the infrastructure that powers LeadReach AI at scale. You will manage our cloud infrastructure, CI/CD pipelines, monitoring, and incident response. Experience with Kubernetes, Terraform, and running high-availability SaaS platforms at scale is essential. We process millions of daily agent operations, and reliability is non-negotiable.',
  },
];

export default function CareersPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              <Briefcase className="h-3 w-3 mr-1" />
              Careers
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Build the Future of <span className="text-gradient">Autonomous Sales</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Join a team of AI researchers, engineers, and sales innovators who are transforming how businesses discover and engage their ideal customers. We are hiring across engineering, product, research, and go-to-market.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#open-positions">
                <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm">
                  View Open Positions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Link href="/about">
                <Button variant="outline" className="border-border/40 text-muted-foreground hover:text-foreground hover:border-emerald-500/20">
                  Learn About Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why LeadReach */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Why <span className="text-gradient">LeadReach AI</span>?
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              We are not just building another SaaS tool. We are creating an entirely new category of autonomous AI agents for sales. Here is what makes working here unique.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-premium border-border/30 bg-card/50 p-6">
              <div className="rounded-xl bg-emerald-500/10 p-3 w-fit mb-4">
                <Rocket className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-foreground">Category-Defining Product</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Multi-agent AI for lead generation did not exist before us. You will work on technology that is genuinely new, not an incremental improvement on an existing paradigm. Every feature you build has the potential to define how the industry evolves.
              </p>
            </Card>
            <Card className="card-premium border-border/30 bg-card/50 p-6">
              <div className="rounded-xl bg-emerald-500/10 p-3 w-fit mb-4">
                <Users className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-foreground">Direct Customer Impact</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Our customers measure ROI in pipeline generated and deals closed. The features you ship translate directly into revenue for real businesses. There is no ambiguity about whether your work matters, because our customers tell us every day.
              </p>
            </Card>
            <Card className="card-premium border-border/30 bg-card/50 p-6">
              <div className="rounded-xl bg-emerald-500/10 p-3 w-fit mb-4">
                <Sparkles className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-foreground">AI Frontier</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                We operate at the cutting edge of LLM orchestration, autonomous agent planning, and multi-agent collaboration. If you are excited about pushing the boundaries of what AI agents can do in production, this is the place to do it.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 border-t border-border/20 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Benefits & <span className="text-gradient">Perks</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              We invest in our team as much as we invest in our product. Here is what we offer to ensure you can do your best work and live your best life.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <Card key={benefit.title} className="card-premium border-border/30 bg-card/50 p-5">
                  <div className="rounded-lg bg-emerald-500/10 p-2.5 w-fit mb-3">
                    <Icon className="h-4 w-4 text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{benefit.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{benefit.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="open-positions" className="py-16 border-t border-border/20 scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Open <span className="text-gradient">Positions</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              We are looking for passionate people across every discipline. If you do not see a role that fits, reach out anyway. We are always interested in exceptional talent.
            </p>
          </div>
          <div className="space-y-4 max-w-4xl mx-auto">
            {JOB_LISTINGS.map((job) => (
              <Card key={job.title} className="card-premium border-border/30 bg-card/50 p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-foreground">{job.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3 text-emerald-500/60" />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-emerald-500/60" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-emerald-500/60" />
                        {job.type}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{job.description}</p>
                  </div>
                  <a href="mailto:careers@leadreach.ai?subject=Application: " className="shrink-0">
                    <Button className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors" variant="outline" size="sm">
                      Apply
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Hiring Process */}
      <section className="py-16 border-t border-border/20 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Our Hiring <span className="text-gradient">Process</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              We respect your time and aim to make our process transparent, efficient, and respectful. Here is what to expect.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Application Review', desc: 'We review every application personally. No algorithms screening you out. Expect a response within 5 business days.' },
              { step: '02', title: 'Initial Conversation', desc: 'A 30-minute call with the hiring manager to discuss your experience, interests, and what you are looking for. No technical tests.' },
              { step: '03', title: 'Deep Dive', desc: 'A role-specific session where you will work through a realistic scenario relevant to the position. For engineers, this is a practical coding exercise; for others, a case study.' },
              { step: '04', title: 'Final Round', desc: 'Meet the broader team through a few focused conversations. We want to understand how you collaborate, and we want you to understand our culture.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="rounded-full bg-emerald-500/10 border border-emerald-500/20 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-sm font-bold text-emerald-400">{item.step}</span>
                </div>
                <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
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
                Do Not See Your <span className="text-gradient">Role</span>?
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                We are always looking for exceptional people. Send us your resume and tell us how you can contribute to our mission. We will reach out when the right opportunity opens up.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a href="mailto:careers@leadreach.ai">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm">
                    Send Your Resume
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="border-border/50 text-foreground hover:bg-secondary/50">
                    Learn About Our Team
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
