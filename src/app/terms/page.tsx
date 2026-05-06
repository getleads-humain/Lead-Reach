'use client';

import React from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Scale, FileText } from 'lucide-react';

const SECTIONS = [
  { id: 'acceptance', title: 'Acceptance of Terms' },
  { id: 'description', title: 'Description of Service' },
  { id: 'user-accounts', title: 'User Accounts' },
  { id: 'acceptable-use', title: 'Acceptable Use' },
  { id: 'intellectual-property', title: 'Intellectual Property' },
  { id: 'payment-billing', title: 'Payment & Billing' },
  { id: 'data-privacy', title: 'Data & Privacy' },
  { id: 'limitation-liability', title: 'Limitation of Liability' },
  { id: 'termination', title: 'Termination' },
  { id: 'governing-law', title: 'Governing Law' },
  { id: 'contact', title: 'Contact' },
];

export default function TermsPage() {
  return (
    <MarketingLayout>
      {/* Header */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              <Scale className="h-3 w-3 mr-1" />
              Legal
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Terms of <span className="text-gradient">Service</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Last updated: January 15, 2026
            </p>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              These Terms of Service govern your use of the LeadReach AI platform. By accessing or using our service, you agree to be bound by these terms.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Sidebar */}
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
              <div id="acceptance" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Acceptance of Terms
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    By accessing or using the LeadReach AI platform (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not access or use the Service.
                  </p>
                  <p>
                    These Terms constitute a legally binding agreement between you (either as an individual or on behalf of an entity) and LeadReach AI Inc. (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). You represent and warrant that you have the legal capacity to enter into these Terms (or, if you are acting on behalf of an entity, that you have the authority to bind that entity to these Terms).
                  </p>
                  <p>
                    We may update these Terms from time to time. We will notify you of any material changes by posting the updated Terms on our website and, for significant changes, by sending you an email notification. Your continued use of the Service after changes become effective constitutes your acceptance of the updated Terms. It is your responsibility to review these Terms periodically.
                  </p>
                  <p>
                    These Terms are in addition to our Privacy Policy, which describes how we collect, use, and protect your personal information. By using the Service, you also agree to our Privacy Policy, which is incorporated by reference into these Terms.
                  </p>
                </div>
              </div>

              {/* Section 2 */}
              <div id="description" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Description of Service
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    LeadReach AI is an agentic lead generation platform that deploys autonomous AI agents to discover, enrich, qualify, and engage leads on your behalf. The Service includes, but is not limited to:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-foreground/90">AI Agent Workforce:</strong> Eight specialized AI agents (Orchestrator, Prospect Discovery, Data Enrichment, Web Research, Lead Qualification, Outreach Composer, Pipeline Manager, and Report Generator) that collaborate autonomously to execute lead generation workflows.</li>
                    <li><strong className="text-foreground/90">Agent-Reach:</strong> A multi-channel research capability that provides AI agents with access to 17+ internet channels, including web reading, semantic search, professional networks, social media, and public databases.</li>
                    <li><strong className="text-foreground/90">Lead Management:</strong> Tools for managing discovered leads, including enrichment data, qualification scores, pipeline stages, and outreach tracking.</li>
                    <li><strong className="text-foreground/90">Analytics & Reporting:</strong> Dashboards and reports providing insights on campaign performance, agent efficiency, channel effectiveness, and pipeline metrics.</li>
                    <li><strong className="text-foreground/90">Integrations:</strong> API access and native integrations with CRM systems, email platforms, and other third-party tools.</li>
                  </ul>
                  <p>
                    We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice. We will make reasonable efforts to notify you of material changes that affect your use of the Service.
                  </p>
                </div>
              </div>

              {/* Section 3 */}
              <div id="user-accounts" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  User Accounts
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    To use the Service, you must create an account. When creating an account, you agree to:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Provide accurate, current, and complete information during registration</li>
                    <li>Maintain and promptly update your account information to keep it accurate, current, and complete</li>
                    <li>Maintain the security and confidentiality of your login credentials</li>
                    <li>Accept responsibility for all activities that occur under your account</li>
                    <li>Notify us immediately of any unauthorized use of your account</li>
                  </ul>
                  <p>
                    You must be at least 18 years of age to create an account and use the Service. If you are using the Service on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.
                  </p>
                  <p>
                    We reserve the right to suspend or terminate your account if any information provided proves to be inaccurate, not current, or incomplete, or if we have reasonable grounds to suspect fraud, abuse, or security concerns.
                  </p>
                </div>
              </div>

              {/* Section 4 */}
              <div id="acceptable-use" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Acceptable Use
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Use the Service to harvest or collect personal information about individuals without their consent or in violation of applicable privacy laws</li>
                    <li>Use the Service for any purpose that is illegal, harmful, fraudulent, deceptive, or violates the rights of others</li>
                    <li>Attempt to gain unauthorized access to any part of the Service, other user accounts, or any systems or networks connected to the Service</li>
                    <li>Interfere with or disrupt the integrity or performance of the Service or the data contained therein</li>
                    <li>Attempt to reverse engineer, decompile, disassemble, or otherwise discover the source code of the Service</li>
                    <li>Use the Service to send spam, unsolicited communications, or messages that violate the CAN-SPAM Act, GDPR, or other applicable regulations</li>
                    <li>Use AI-generated outreach messages to impersonate any person or entity or falsely represent your affiliation with any person or entity</li>
                    <li>Access or use the Service in any way that exceeds the scope of your subscription plan or the usage limits set therein</li>
                    <li>Resell, sublicense, or redistribute the Service or any part thereof without our prior written consent</li>
                    <li>Use the Service in any manner that could damage, disable, overburden, or impair our servers or networks</li>
                  </ul>
                  <p>
                    We reserve the right to investigate and take appropriate action against anyone who, in our sole discretion, violates this provision, including removing offending content, suspending or terminating the accounts of such violators, and reporting violations to law enforcement authorities.
                  </p>
                </div>
              </div>

              {/* Section 5 */}
              <div id="intellectual-property" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Intellectual Property
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of LeadReach AI Inc. and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
                  </p>
                  <p>
                    Our trademarks, service marks, and trade dress may not be used in connection with any product or service without the prior written consent of LeadReach AI Inc. You may not copy, modify, distribute, sell, or lease any part of our Service or included software, nor may you reverse engineer or attempt to extract the source code of that software.
                  </p>
                  <p>
                    <strong className="text-foreground/90">Your Content:</strong> You retain all intellectual property rights in and to your ICP definitions, campaign configurations, outreach templates, and other content you upload or create on the Service (&quot;Your Content&quot;). By using the Service, you grant us a limited, non-exclusive, worldwide, royalty-free license to use, process, and store Your Content solely for the purpose of providing the Service to you.
                  </p>
                  <p>
                    <strong className="text-foreground/90">Lead Data:</strong> Lead data collected by AI agents on your behalf remains your property. We do not claim ownership over lead data and will not use it for purposes other than providing the Service to you, except as required by law or with your explicit consent.
                  </p>
                  <p>
                    <strong className="text-foreground/90">AI-Generated Content:</strong> Outreach messages and other content generated by our AI agents are provided for your use. You are responsible for reviewing, approving, and taking responsibility for any AI-generated content before it is sent to leads. We make no guarantees about the effectiveness or compliance of AI-generated content.
                  </p>
                </div>
              </div>

              {/* Section 6 */}
              <div id="payment-billing" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Payment & Billing
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    Certain features of the Service require a paid subscription. By subscribing to a paid plan, you agree to the following:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-foreground/90">Subscription Fees:</strong> You agree to pay the subscription fees for the plan you select, as described on our pricing page. All fees are quoted in US dollars and are exclusive of applicable taxes unless stated otherwise.</li>
                    <li><strong className="text-foreground/90">Billing Cycle:</strong> Subscriptions are billed on a monthly or annual basis, depending on the plan you select. Your subscription will automatically renew at the end of each billing cycle unless you cancel before the renewal date.</li>
                    <li><strong className="text-foreground/90">Free Trial:</strong> We may offer a free trial period for new subscribers. Free trials are limited to one per organization. At the end of the trial period, your subscription will automatically convert to a paid plan unless you cancel before the trial ends.</li>
                    <li><strong className="text-foreground/90">Price Changes:</strong> We may change our pricing at any time. We will provide at least 30 days&apos; notice before any price increase takes effect. Price increases will apply to your next billing cycle following the notice period.</li>
                    <li><strong className="text-foreground/90">Refunds:</strong> Monthly subscriptions may be cancelled at any time, but no refunds are provided for the current billing period. Annual subscriptions may be refunded on a prorated basis within the first 30 days. After 30 days, annual subscriptions are non-refundable.</li>
                    <li><strong className="text-foreground/90">Payment Method:</strong> You must provide a valid payment method to subscribe to a paid plan. You authorize us to charge your payment method for all fees owed. If a payment fails, we may suspend your access to the Service until payment is received.</li>
                  </ul>
                </div>
              </div>

              {/* Section 7 */}
              <div id="data-privacy" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Data & Privacy
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    Our handling of your personal data and lead data is governed by our Privacy Policy, which is incorporated by reference into these Terms. By using the Service, you consent to the collection and use of information as described in our Privacy Policy.
                  </p>
                  <p>
                    <strong className="text-foreground/90">Data Ownership:</strong> You retain ownership of all data you provide to the Service, including ICP definitions, campaign data, and lead data collected by AI agents on your behalf. We do not claim ownership of your data.
                  </p>
                  <p>
                    <strong className="text-foreground/90">Data Processing:</strong> You acknowledge that our AI agents will process your ICP definitions and other inputs to perform lead generation activities on your behalf. You are responsible for ensuring that your use of the Service complies with applicable data protection laws, including obtaining necessary consents for outreach activities.
                  </p>
                  <p>
                    <strong className="text-foreground/90">Data Security:</strong> We implement industry-standard security measures to protect your data as described in our Privacy Policy. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                  </p>
                  <p>
                    <strong className="text-foreground/90">Data Export:</strong> You may export your data at any time through the platform or our API. Upon account termination, we will make your data available for export for a period of 30 days, after which it will be permanently deleted.
                  </p>
                </div>
              </div>

              {/* Section 8 */}
              <div id="limitation-liability" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Limitation of Liability
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL LEADREACH AI INC., ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Your access to or use of (or inability to access or use) the Service</li>
                    <li>Any conduct or content of any third party on the Service</li>
                    <li>Any content obtained from the Service</li>
                    <li>Unauthorized access, use, or alteration of your transmissions or content</li>
                    <li>Errors, inaccuracies, or incompleteness in lead data or AI-generated content</li>
                    <li>Failure of AI agents to discover, qualify, or engage leads as expected</li>
                  </ul>
                  <p>
                    IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS RELATING TO THE SERVICE EXCEED THE AMOUNT YOU HAVE PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM. THIS LIMITATION APPLIES REGARDLESS OF THE LEGAL THEORY ON WHICH THE CLAIM IS BASED.
                  </p>
                  <p>
                    The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We make no warranties, expressed or implied, and hereby disclaim all warranties, including without limitation, implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will function uninterrupted, secure, or error-free, or that the results obtained through the Service will be accurate or reliable.
                  </p>
                </div>
              </div>

              {/* Section 9 */}
              <div id="termination" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Termination
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including without limitation if you breach these Terms.
                  </p>
                  <p>
                    You may terminate your account at any time by contacting us or using the account settings in the platform. Upon termination:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Your right to use the Service will immediately cease</li>
                    <li>We will make your data available for export for 30 days following termination</li>
                    <li>After the 30-day export period, your data will be permanently deleted in accordance with our data retention policy</li>
                    <li>All outstanding fees owed through the end of your current billing period remain due and payable</li>
                    <li>Provisions of these Terms that by their nature should survive termination shall survive, including without limitation ownership provisions, warranty disclaimers, indemnification clauses, and limitations of liability</li>
                  </ul>
                  <p>
                    We reserve the right to terminate accounts that have been inactive for more than 12 consecutive months, with 30 days&apos; notice provided to the email address on file.
                  </p>
                </div>
              </div>

              {/* Section 10 */}
              <div id="governing-law" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Governing Law
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.
                  </p>
                  <p>
                    Any disputes arising out of or relating to these Terms or the Service shall be resolved through binding arbitration in San Francisco, California, in accordance with the rules of the American Arbitration Association. The arbitrator&apos;s decision shall be final and binding, and judgment may be entered in any court of competent jurisdiction.
                  </p>
                  <p>
                    You agree to waive your right to a jury trial and to participate in class action lawsuits. Any claims must be brought in your individual capacity, not as a plaintiff or class member in any purported class or representative proceeding.
                  </p>
                  <p>
                    If any provision of these Terms is found to be unenforceable or invalid by a court of competent jurisdiction, that provision shall be limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect.
                  </p>
                </div>
              </div>

              {/* Section 11 */}
              <div id="contact" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Contact
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    If you have any questions about these Terms of Service, please contact us:
                  </p>
                  <ul className="list-none space-y-2">
                    <li><strong className="text-foreground/90">Email:</strong> legal@leadreach.ai</li>
                    <li><strong className="text-foreground/90">Mailing Address:</strong> LeadReach AI Inc., 548 Market Street, Suite 36879, San Francisco, CA 94104</li>
                  </ul>
                  <p>
                    For support-related inquiries, please email support@leadreach.ai. For privacy-related inquiries, please email privacy@leadreach.ai.
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
