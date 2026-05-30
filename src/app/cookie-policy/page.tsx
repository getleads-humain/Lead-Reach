'use client';

import React from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Cookie, FileText } from 'lucide-react';

const SECTIONS = [
  { id: 'what-are-cookies', title: 'What Are Cookies' },
  { id: 'essential-cookies', title: 'Essential Cookies' },
  { id: 'analytics-cookies', title: 'Analytics Cookies' },
  { id: 'functional-cookies', title: 'Functional Cookies' },
  { id: 'third-party-cookies', title: 'Third-Party Cookies' },
  { id: 'managing-cookies', title: 'Managing Your Cookie Preferences' },
  { id: 'cookie-duration', title: 'Cookie Duration' },
  { id: 'changes', title: 'Changes to This Policy' },
];

export default function CookiePolicyPage() {
  return (
    <MarketingLayout>
      {/* Header */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              <Cookie className="h-3 w-3 mr-1" />
              Legal
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Cookie <span className="text-gradient">Policy</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Last updated: January 15, 2026
            </p>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              This Cookie Policy explains how LeadReach AI uses cookies and similar tracking technologies when you visit and interact with our platform. By continuing to use our platform, you consent to the use of cookies as described in this policy.
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
              {/* What Are Cookies */}
              <div id="what-are-cookies" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  What Are Cookies
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when you visit a website. They are widely used to make websites work more efficiently, to provide reporting information, and to enable certain functionality. Cookies allow a website to recognize your device and remember information about your visit, such as your preferred language and other settings.
                  </p>
                  <p>
                    In addition to cookies, we may also use similar technologies such as web beacons (also known as pixel tags or clear GIFs), local storage, and session storage. These technologies function similarly to cookies and help us understand how you interact with our platform, measure the effectiveness of our content, and improve your experience.
                  </p>
                  <p>
                    We categorize the cookies we use into four types: Essential, Analytics, Functional, and Third-Party. Each category serves a specific purpose, and we describe each in detail below. We do not use advertising cookies, and we never sell data collected through cookies to advertising networks or data brokers.
                  </p>
                </div>
              </div>

              {/* Essential Cookies */}
              <div id="essential-cookies" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Essential Cookies
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    Essential cookies are strictly necessary for the operation of our platform. They enable core functionality such as page navigation, secure authentication, and access to protected areas of the platform. You cannot opt out of these cookies as the platform cannot function properly without them.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-border/30 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-card/50">
                          <th className="text-left py-2 px-3 text-xs font-semibold text-foreground">Cookie</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-foreground">Purpose</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-foreground">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border/20">
                          <td className="py-2 px-3 font-mono text-xs text-emerald-400">lr_session</td>
                          <td className="py-2 px-3 text-muted-foreground">Maintains your authenticated session</td>
                          <td className="py-2 px-3 text-muted-foreground">Session</td>
                        </tr>
                        <tr className="border-t border-border/20">
                          <td className="py-2 px-3 font-mono text-xs text-emerald-400">lr_csrf</td>
                          <td className="py-2 px-3 text-muted-foreground">Prevents cross-site request forgery attacks</td>
                          <td className="py-2 px-3 text-muted-foreground">Session</td>
                        </tr>
                        <tr className="border-t border-border/20">
                          <td className="py-2 px-3 font-mono text-xs text-emerald-400">lr_token</td>
                          <td className="py-2 px-3 text-muted-foreground">Stores your authentication token securely</td>
                          <td className="py-2 px-3 text-muted-foreground">7 days</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div id="analytics-cookies" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Analytics Cookies
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    Analytics cookies help us understand how visitors interact with our platform by collecting and reporting information anonymously. These cookies allow us to count visits, identify which pages are most and least visited, understand how users navigate between pages, and measure the performance of our content. All analytics data is aggregated and anonymized — we cannot identify individual users through these cookies.
                  </p>
                  <p>
                    Analytics cookies are optional. You can choose to disable them, and the platform will continue to function normally. However, disabling these cookies means we will have less information to improve the platform experience.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-border/30 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-card/50">
                          <th className="text-left py-2 px-3 text-xs font-semibold text-foreground">Cookie</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-foreground">Purpose</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-foreground">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border/20">
                          <td className="py-2 px-3 font-mono text-xs text-blue-400">lr_anon_id</td>
                          <td className="py-2 px-3 text-muted-foreground">Anonymous visitor identifier for analytics</td>
                          <td className="py-2 px-3 text-muted-foreground">13 months</td>
                        </tr>
                        <tr className="border-t border-border/20">
                          <td className="py-2 px-3 font-mono text-xs text-blue-400">lr_page_view</td>
                          <td className="py-2 px-3 text-muted-foreground">Tracks page views for content optimization</td>
                          <td className="py-2 px-3 text-muted-foreground">30 minutes</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Functional Cookies */}
              <div id="functional-cookies" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Functional Cookies
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    Functional cookies enable the platform to remember choices you make (such as your preferred theme, notification settings, or dashboard layout) and provide enhanced, personalized features. These cookies are optional — if you choose to disable them, some features may not work as expected, but the core functionality of the platform will remain available.
                  </p>
                  <p>
                    We use functional cookies to remember your theme preference (dark mode or light mode), your preferred dashboard layout and widget configuration, your notification and alert preferences, and the collapsed or expanded state of sidebar navigation and help panels. These preferences persist across sessions so you do not have to reconfigure the platform each time you visit.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-border/30 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-card/50">
                          <th className="text-left py-2 px-3 text-xs font-semibold text-foreground">Cookie</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-foreground">Purpose</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-foreground">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border/20">
                          <td className="py-2 px-3 font-mono text-xs text-amber-400">lr_prefs</td>
                          <td className="py-2 px-3 text-muted-foreground">Stores your UI and feature preferences</td>
                          <td className="py-2 px-3 text-muted-foreground">1 year</td>
                        </tr>
                        <tr className="border-t border-border/20">
                          <td className="py-2 px-3 font-mono text-xs text-amber-400">lr_theme</td>
                          <td className="py-2 px-3 text-muted-foreground">Remembers your dark/light mode preference</td>
                          <td className="py-2 px-3 text-muted-foreground">1 year</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Third-Party Cookies */}
              <div id="third-party-cookies" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Third-Party Cookies
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    Some cookies are placed by third-party services that appear on our pages. We carefully vet all third-party services to ensure they meet our privacy and security standards. We do not allow advertising networks or data brokers to set cookies on our platform.
                  </p>
                  <p>
                    Third-party cookies on our platform are limited to essential service integrations such as our payment processor (which sets cookies necessary for secure payment transactions), and our CRM integration partners (Salesforce, HubSpot, Pipedrive) which may set cookies when you configure their connections. Each third-party service has its own cookie and privacy policy, and we encourage you to review them.
                  </p>
                  <p>
                    We do not use third-party analytics cookies. All analytics are collected and processed in-house using first-party cookies, ensuring your browsing data stays within our control and is not shared with external analytics providers.
                  </p>
                </div>
              </div>

              {/* Managing Cookies */}
              <div id="managing-cookies" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Managing Your Cookie Preferences
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    You can manage your cookie preferences in several ways. Most web browsers allow you to control cookies through their settings. You can typically find these settings in the &quot;Options&quot; or &quot;Preferences&quot; menu of your browser. You can set your browser to refuse all cookies, accept only certain cookies, or alert you when a cookie is being set.
                  </p>
                  <p>
                    Please note that if you disable essential cookies, certain features of the platform may not function properly. Essential cookies are required for authentication, session management, and security features, and cannot be disabled without impacting your ability to use the platform.
                  </p>
                  <p>
                    For analytics and functional cookies, you can adjust your preferences at any time through the cookie consent banner that appears when you first visit our platform, or through your account settings. Your preferences will be saved and applied to future visits.
                  </p>
                </div>
              </div>

              {/* Cookie Duration */}
              <div id="cookie-duration" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Cookie Duration
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    Cookies have different lifespans depending on their purpose. Session cookies are temporary and are automatically deleted when you close your browser. Persistent cookies remain on your device for a set period or until you manually delete them. We strive to use the shortest practical duration for each cookie.
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-foreground/90">Session cookies:</strong> These expire when you close your browser. They are used for authentication and security purposes.</li>
                    <li><strong className="text-foreground/90">Short-term cookies (up to 7 days):</strong> Used for authentication tokens and temporary preferences.</li>
                    <li><strong className="text-foreground/90">Medium-term cookies (up to 30 days):</strong> Used for page view analytics and recent activity tracking.</li>
                    <li><strong className="text-foreground/90">Long-term cookies (up to 13 months):</strong> Used for preferences and anonymous analytics identifiers, which is the maximum duration permitted under GDPR guidelines.</li>
                  </ul>
                </div>
              </div>

              {/* Changes */}
              <div id="changes" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Changes to This Policy
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    We may update this Cookie Policy from time to time to reflect changes in our practices or for operational, legal, or regulatory reasons. When we make material changes, we will notify you by posting the updated policy on our website with a revised &quot;Last updated&quot; date. For significant changes that affect your cookie preferences, we may also display a new cookie consent banner.
                  </p>
                  <p>
                    We encourage you to review this policy periodically to stay informed about how we use cookies. Your continued use of the platform after any changes constitutes your acceptance of the updated policy. If you have any questions about this Cookie Policy, please contact us at privacy@leadreach.ai.
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
