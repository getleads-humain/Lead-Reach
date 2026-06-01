'use client';

import React from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Briefcase, MapPin, Clock, Zap, Users, Globe, GraduationCap, Heart } from 'lucide-react';

const PERKS = [
  { icon: Globe, title: 'Remote-First', description: 'Work from anywhere in the world. Our team spans six countries across multiple time zones, and we have built a culture that thrives in distributed environments with asynchronous communication and flexible schedules.' },
  { icon: GraduationCap, title: 'Learning Budget', description: 'Every team member receives an annual learning budget for conferences, courses, books, and certifications. We believe continuous growth is essential in the fast-evolving AI landscape.' },
  { icon: Heart, title: 'Health & Wellness', description: 'Comprehensive health, dental, and vision insurance plus a monthly wellness stipend for gym memberships, meditation apps, or whatever supports your physical and mental well-being.' },
  { icon: Zap, title: 'Cutting-Edge Tech', description: 'Work with the latest in AI, multi-agent architectures, and large language models. You will be at the frontier of applied AI, building systems that push what autonomous agents can achieve.' },
];

type Department = 'Engineering' | 'Product' | 'Sales' | 'Design';

interface JobListing {
  title: string;
  department: Department;
  location: string;
  type: string;
  description: string;
}

const JOB_LISTINGS: JobListing[] = [
  {
    title: 'Senior AI Agent Engineer',
    department: 'Engineering',
    location: 'Remote (Worldwide)',
    type: 'Full-time',
    description: 'Design and implement the next generation of our multi-agent architecture. You will work on agent orchestration, tool use, reasoning chains, and coordination protocols that power LeadReach\'s autonomous lead generation system. Requires deep experience with LLMs, prompt engineering, and production AI systems.',
  },
  {
    title: 'Full-Stack Engineer',
    department: 'Engineering',
    location: 'Remote (Worldwide)',
    type: 'Full-time',
    description: 'Build and maintain the LeadReach platform, from our Next.js frontend to our API routes and Prisma-backed data layer. You will own end-to-end features, collaborate closely with AI engineers, and ensure our users have a seamless experience managing their AI agents and lead pipelines.',
  },
  {
    title: 'Product Manager — AI Agents',
    department: 'Product',
    location: 'Remote (US / EU)',
    type: 'Full-time',
    description: 'Define the roadmap for our AI agent capabilities. You will synthesize customer feedback, competitive analysis, and technical possibilities into clear product specifications, working daily with engineering to ship features that make our agents smarter, faster, and more reliable.',
  },
  {
    title: 'Sales Development Representative',
    department: 'Sales',
    location: 'Remote (US)',
    type: 'Full-time',
    description: 'Be the first point of contact for prospective customers. You will qualify inbound leads, run discovery calls, and build pipeline for our Account Executives. Dogfood our own product to find and engage prospects — practice what we preach.',
  },
  {
    title: 'UX / Product Designer',
    department: 'Design',
    location: 'Remote (Worldwide)',
    type: 'Full-time',
    description: 'Design intuitive interfaces for complex AI-driven workflows. You will translate multi-agent system outputs into clear, actionable dashboards and interaction patterns that empower sales professionals without overwhelming them. Experience with data-heavy or AI-powered products is a plus.',
  },
];

const DEPARTMENT_COLORS: Record<Department, string> = {
  'Engineering': 'border-blue-500/20 text-blue-400',
  'Product': 'border-purple-500/20 text-purple-400',
  'Sales': 'border-amber-500/20 text-amber-400',
  'Design': 'border-pink-500/20 text-pink-400',
};

export default function CareersPage() {
  return (
    <MarketingLayout>
      {/* Header */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              <Briefcase className="h-3 w-3 mr-1" />
              Careers
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Build the Future of <span className="text-gradient">AI Sales</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Join a distributed team of AI researchers, engineers, and builders who are transforming how businesses discover and engage their ideal customers with autonomous AI agents.
            </p>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Why <span className="text-gradient">LeadReach</span>?
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              We invest in our people because great products are built by great teams. Here is what you can expect when you join us.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PERKS.map((perk) => {
              const Icon = perk.icon;
              return (
                <div
                  key={perk.title}
                  className="rounded-xl border border-border/30 bg-card/50 p-6 hover:border-emerald-500/20 transition-colors"
                >
                  <div className="rounded-lg bg-emerald-500/10 p-2.5 w-fit mb-4">
                    <Icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{perk.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{perk.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 lg:py-20 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Open <span className="text-gradient">Positions</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              We are always looking for talented individuals who are passionate about AI, sales technology, and building products that make a real difference.
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {JOB_LISTINGS.map((job) => (
              <div
                key={job.title}
                className="rounded-xl border border-border/30 bg-card/50 p-6 hover:border-emerald-500/20 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      <Badge variant="outline" className={`text-xs ${DEPARTMENT_COLORS[job.department]}`}>
                        {job.department}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {job.location}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {job.type}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 shrink-0">
                    Apply <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{job.description}</p>
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
              <Users className="h-8 w-8 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Do Not See Your <span className="text-gradient">Role</span>?
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                We are always interested in hearing from exceptional people. Send us your resume and tell us how you can contribute to the LeadReach mission.
              </p>
              <div className="mt-6">
                <a href="mailto:careers@leadreach.ai">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm">
                    Send Your Resume
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
