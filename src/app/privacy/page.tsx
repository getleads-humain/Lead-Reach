'use client';

import React from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, FileText } from 'lucide-react';

const SECTIONS = [
  { id: 'information-we-collect', title: 'Information We Collect' },
  { id: 'how-we-use', title: 'How We Use Your Information' },
  { id: 'data-storage-security', title: 'Data Storage & Security' },
  { id: 'third-party-services', title: 'Third-Party Services' },
  { id: 'cookies-tracking', title: 'Cookies & Tracking' },
  { id: 'your-rights', title: 'Your Rights' },
  { id: 'data-retention', title: 'Data Retention' },
  { id: 'contact-us', title: 'Contact Us' },
];

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      {/* Header */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              <Shield className="h-3 w-3 mr-1" />
              Legal
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Privacy <span className="text-gradient">Policy</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Last updated: January 15, 2026
            </p>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              At LeadReach AI, we take your privacy seriously. This policy describes how we collect, use, store, and protect your information when you use our platform.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Sidebar - Table of Contents */}
            <div className="lg:col-span-1">
              <nav className="sticky top-24 space-y-1">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Table of Contents</h3>
                {SECTIONS.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block text-xs text-muted-foreground hover:text-emerald-400 transition-colors py-1.5 border-l-2 border-border/30 hover:border-emerald-500/50 pl-3"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 prose-invert max-w-none">
              {/* Section 1 */}
              <div id="information-we-collect" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Information We Collect
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    We collect information that you provide directly to us, information collected automatically when you use our platform, and information from third-party sources.
                  </p>
                  <h3 className="text-base font-semibold text-foreground mt-6">Information You Provide</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-foreground/90">Account Information:</strong> When you create an account, we collect your name, email address, company name, job title, and password. This information is necessary to provide our services and create your personalized workspace.</li>
                    <li><strong className="text-foreground/90">ICP Definitions:</strong> When you define your Ideal Customer Profile, we store your target industry, company size, location, technology preferences, and other criteria used by our AI agents to find and qualify leads.</li>
                    <li><strong className="text-foreground/90">Campaign Data:</strong> Information about your lead generation campaigns, including campaign names, target criteria, and outreach preferences is stored to enable our AI agents to operate on your behalf.</li>
                    <li><strong className="text-foreground/90">Communication Data:</strong> When you contact our support team, we collect the content of your messages and any information you share during those interactions.</li>
                    <li><strong className="text-foreground/90">Payment Information:</strong> When you subscribe to a paid plan, we collect billing information through our payment processor. We do not store credit card numbers on our servers.</li>
                  </ul>
                  <h3 className="text-base font-semibold text-foreground mt-6">Information Collected Automatically</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-foreground/90">Usage Data:</strong> We automatically collect information about how you interact with our platform, including pages visited, features used, time spent, and navigation patterns. This helps us improve the user experience and optimize our AI agents.</li>
                    <li><strong className="text-foreground/90">Device Information:</strong> We collect information about the device you use to access our platform, including device type, operating system, browser type, and IP address.</li>
                    <li><strong className="text-foreground/90">Log Data:</strong> Our servers automatically record log data when you access our platform, including your IP address, access times, and the pages or API endpoints you requested.</li>
                  </ul>
                  <h3 className="text-base font-semibold text-foreground mt-6">Lead Data Collected by AI Agents</h3>
                  <p>
                    Our AI agents collect publicly available information about potential leads on your behalf. This includes data from professional networks, company websites, social media platforms, and public databases. All lead data collected is subject to the same privacy and security protections as your other data. We only collect information from authorized sources and comply with each platform&apos;s terms of service.
                  </p>
                </div>
              </div>

              {/* Section 2 */}
              <div id="how-we-use" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  How We Use Your Information
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>We use the information we collect to provide, maintain, and improve our platform and services. Specifically, we use your information to:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Provide and operate the LeadReach AI platform, including deploying and coordinating AI agents on your behalf</li>
                    <li>Process your ICP definitions and configure AI agents to discover and qualify leads matching your criteria</li>
                    <li>Generate personalized outreach messages and manage your lead pipeline</li>
                    <li>Communicate with you about your account, campaigns, and platform updates</li>
                    <li>Process payments and manage your subscription</li>
                    <li>Analyze platform usage to improve our services, optimize AI agent performance, and develop new features</li>
                    <li>Detect, prevent, and address technical issues, fraud, or security threats</li>
                    <li>Comply with legal obligations and enforce our terms of service</li>
                  </ul>
                  <p>
                    We do not sell your personal information to third parties. We do not use your lead data to train our AI models without explicit consent. Your data remains yours.
                  </p>
                </div>
              </div>

              {/* Section 3 */}
              <div id="data-storage-security" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Data Storage & Security
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    We implement industry-standard security measures to protect your data. Your trust is the foundation of our business, and we take every precaution to safeguard your information.
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-foreground/90">Encryption:</strong> All data is encrypted at rest using AES-256 encryption and in transit using TLS 1.3. Database backups are also encrypted.</li>
                    <li><strong className="text-foreground/90">Infrastructure:</strong> Our platform runs on SOC 2 Type II certified cloud infrastructure with regular security audits and penetration testing.</li>
                    <li><strong className="text-foreground/90">Access Controls:</strong> We implement strict role-based access controls. Only authorized personnel have access to production systems, and all access is logged and audited.</li>
                    <li><strong className="text-foreground/90">AI Agent Isolation:</strong> AI agents process data in isolated, secure environments. Each customer&apos;s agent workload runs in a separate container with no cross-tenant data access.</li>
                    <li><strong className="text-foreground/90">Incident Response:</strong> We maintain a comprehensive incident response plan and will notify affected users within 72 hours of a confirmed data breach, as required by applicable regulations.</li>
                    <li><strong className="text-foreground/90">Regular Audits:</strong> We conduct regular security assessments, vulnerability scans, and third-party penetration tests to identify and address potential weaknesses.</li>
                  </ul>
                  <p>
                    While we strive to protect your data, no system is completely secure. We encourage you to use strong passwords, enable two-factor authentication, and contact us immediately if you suspect unauthorized access to your account.
                  </p>
                </div>
              </div>

              {/* Section 4 */}
              <div id="third-party-services" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Third-Party Services
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    LeadReach AI integrates with and uses several third-party services to provide our platform functionality. These services have their own privacy policies, and we encourage you to review them.
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-foreground/90">Cloud Infrastructure:</strong> We use SOC 2 Type II certified cloud providers to host our platform and store data.</li>
                    <li><strong className="text-foreground/90">Payment Processing:</strong> We use a PCI-compliant payment processor to handle billing. We do not store credit card information on our servers.</li>
                    <li><strong className="text-foreground/90">Research Channels:</strong> Our AI agents access third-party platforms (LinkedIn, GitHub, Twitter/X, etc.) to research leads. We comply with each platform&apos;s terms of service and API usage policies.</li>
                    <li><strong className="text-foreground/90">CRM Integrations:</strong> When you connect your CRM (Salesforce, HubSpot, Pipedrive), we exchange data through their official APIs with your explicit authorization.</li>
                    <li><strong className="text-foreground/90">Analytics:</strong> We use analytics tools to understand how users interact with our platform, which helps us improve the experience.</li>
                  </ul>
                  <p>
                    We do not share your personal information or lead data with third parties for their own marketing purposes. Third-party service providers are contractually obligated to process data only as directed by us and in compliance with applicable privacy laws.
                  </p>
                </div>
              </div>

              {/* Section 5 */}
              <div id="cookies-tracking" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Cookies & Tracking
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    We use cookies and similar tracking technologies to provide, secure, and improve our platform. You can manage your cookie preferences through your browser settings.
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-foreground/90">Essential Cookies:</strong> Required for the platform to function properly, including authentication, session management, and security features. These cannot be disabled.</li>
                    <li><strong className="text-foreground/90">Analytics Cookies:</strong> Help us understand how users interact with our platform so we can improve the experience. These are optional and can be disabled.</li>
                    <li><strong className="text-foreground/90">Functional Cookies:</strong> Remember your preferences and settings to provide a personalized experience. These are optional and can be disabled.</li>
                  </ul>
                  <p>
                    We do not use advertising cookies or sell data to advertising networks. Our use of tracking technologies is limited to providing and improving our service.
                  </p>
                </div>
              </div>

              {/* Section 6 */}
              <div id="your-rights" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Your Rights
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    Depending on your jurisdiction, you may have the following rights regarding your personal data:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-foreground/90">Access:</strong> You have the right to request a copy of the personal data we hold about you.</li>
                    <li><strong className="text-foreground/90">Rectification:</strong> You can request correction of any inaccurate or incomplete personal data.</li>
                    <li><strong className="text-foreground/90">Deletion:</strong> You can request deletion of your personal data, subject to certain legal exceptions (such as data we are required to retain for legal or accounting purposes).</li>
                    <li><strong className="text-foreground/90">Data Portability:</strong> You can request a machine-readable copy of your data for transfer to another service.</li>
                    <li><strong className="text-foreground/90">Restriction:</strong> You can request that we restrict the processing of your data in certain circumstances.</li>
                    <li><strong className="text-foreground/90">Objection:</strong> You can object to our processing of your data for specific purposes, such as direct marketing.</li>
                    <li><strong className="text-foreground/90">Withdraw Consent:</strong> Where processing is based on your consent, you can withdraw that consent at any time without affecting the lawfulness of processing before withdrawal.</li>
                  </ul>
                  <p>
                    To exercise any of these rights, please contact us at privacy@leadreach.ai. We will respond to your request within 30 days. We do not charge a fee for processing data subject requests unless the request is manifestly unfounded or excessive.
                  </p>
                </div>
              </div>

              {/* Section 7 */}
              <div id="data-retention" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Data Retention
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    We retain your data only for as long as necessary to provide our services and comply with legal obligations. Our retention policies are as follows:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-foreground/90">Account Data:</strong> We retain your account information for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law.</li>
                    <li><strong className="text-foreground/90">Lead Data:</strong> Lead data collected by AI agents is retained for the duration of your subscription. Upon subscription termination, lead data is available for export for 30 days and then deleted.</li>
                    <li><strong className="text-foreground/90">Campaign Data:</strong> Campaign configurations and results are retained for the duration of your subscription and for 90 days after termination for reporting purposes.</li>
                    <li><strong className="text-foreground/90">Usage Logs:</strong> Usage and log data are retained for 12 months for security and analytics purposes, then anonymized or deleted.</li>
                    <li><strong className="text-foreground/90">Payment Records:</strong> We retain payment records for the period required by tax and financial regulations (typically 7 years).</li>
                  </ul>
                </div>
              </div>

              {/* Section 8 */}
              <div id="contact-us" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Contact Us
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    If you have any questions about this Privacy Policy or our data practices, please contact us:
                  </p>
                  <ul className="list-none space-y-2">
                    <li><strong className="text-foreground/90">Email:</strong> privacy@leadreach.ai</li>
                    <li><strong className="text-foreground/90">Data Protection Officer:</strong> dpo@leadreach.ai</li>
                    <li><strong className="text-foreground/90">Mailing Address:</strong> LeadReach AI Inc., 548 Market Street, Suite 36879, San Francisco, CA 94104</li>
                  </ul>
                  <p>
                    If you are a resident of the European Economic Area (EEA) or the United Kingdom, you have the right to lodge a complaint with your local data protection authority if you believe our processing of your personal data violates applicable law.
                  </p>
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on our website and, for significant changes, by sending you an email notification. Your continued use of our platform after changes become effective constitutes your acceptance of the updated policy.
                  </p>
                </div>
              </div>

              {/* Back to Home */}
              <div className="pt-8 border-t border-border/20">
                <Link href="/">
                  <Button variant="outline" className="border-border/40 text-muted-foreground hover:text-foreground hover:border-emerald-500/20">
                    <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                    Back to Home
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
