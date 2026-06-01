'use client';

import React from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Cookie, FileText, Shield } from 'lucide-react';

const SECTIONS = [
  { id: 'what-are-cookies', title: 'What Are Cookies' },
  { id: 'how-we-use-cookies', title: 'How We Use Cookies' },
  { id: 'types-of-cookies', title: 'Types of Cookies We Use' },
  { id: 'third-party-cookies', title: 'Third-Party Cookies' },
  { id: 'managing-cookies', title: 'Managing Cookie Preferences' },
  { id: 'cookies-and-ai-agents', title: 'Cookies & AI Agent Operations' },
  { id: 'cookie-duration', title: 'Cookie Duration' },
  { id: 'updates-to-policy', title: 'Updates to This Policy' },
  { id: 'contact', title: 'Contact Us' },
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
              This Cookie Policy explains how LeadReach AI uses cookies and similar tracking technologies when you visit and interact with our platform. It should be read alongside our Privacy Policy, which provides more detail on how we handle your personal data.
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
              <div id="what-are-cookies" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  What Are Cookies
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when you visit a website. They are widely used to make websites work more efficiently, to provide a better browsing experience, and to supply information to the owners of the site. Cookies allow websites to recognize your device and remember information about your visit, such as your preferred language and other settings.
                  </p>
                  <p>
                    In addition to cookies, we also use similar tracking technologies such as web beacons (also known as pixel tags or clear GIFs), local storage, and session storage. These technologies work in similar ways to cookies, storing small amounts of data on your device to help us improve our services and your experience.
                  </p>
                  <p>
                    Cookies can be &quot;first-party&quot; (set by us directly) or &quot;third-party&quot; (set by our trusted partners and service providers). They can also be &quot;session&quot; cookies (which are deleted when you close your browser) or &quot;persistent&quot; cookies (which remain on your device for a set period or until you manually delete them).
                  </p>
                </div>
              </div>

              {/* Section 2 */}
              <div id="how-we-use-cookies" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  How We Use Cookies
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    LeadReach AI uses cookies and similar technologies for several important purposes. We take a minimal and purposeful approach to cookies, collecting only what is necessary to provide, secure, and improve our platform.
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-foreground/90">Authentication &amp; Security:</strong> Cookies are essential for maintaining your logged-in session, verifying your identity, and protecting against cross-site request forgery (CSRF) and other security threats. Without these cookies, you would need to log in every time you navigate to a new page.</li>
                    <li><strong className="text-foreground/90">Platform Functionality:</strong> Cookies store your preferences such as your selected dashboard view, table column configurations, filter settings, and notification preferences. This ensures a consistent and personalized experience each time you use the platform.</li>
                    <li><strong className="text-foreground/90">Performance &amp; Analytics:</strong> We use analytics cookies to understand how users interact with our platform, which features are most used, where users encounter friction, and how we can improve the overall experience. This data is aggregated and anonymized.</li>
                    <li><strong className="text-foreground/90">AI Agent Session Management:</strong> When AI agents are processing tasks on your behalf, session cookies help maintain the connection between your dashboard and the agent workload, enabling real-time status updates and progress tracking.</li>
                  </ul>
                  <p>
                    We do not use cookies for advertising purposes. We do not sell data collected through cookies to third parties, and we do not allow third-party advertising networks to track you across our platform.
                  </p>
                </div>
              </div>

              {/* Section 3 */}
              <div id="types-of-cookies" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Types of Cookies We Use
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>We categorize the cookies we use into four types based on their purpose and necessity:</p>

                  <h3 className="text-base font-semibold text-foreground mt-6">Essential Cookies</h3>
                  <p>
                    These cookies are strictly necessary for the operation of our platform. They enable core functionality such as authentication, security, and page navigation. You cannot opt out of essential cookies as the platform cannot function properly without them.
                  </p>
                  <div className="rounded-xl border border-border/30 bg-card/50 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/30">
                          <th className="text-left p-3 text-foreground font-semibold">Cookie Name</th>
                          <th className="text-left p-3 text-foreground font-semibold">Purpose</th>
                          <th className="text-left p-3 text-foreground font-semibold">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/20">
                          <td className="p-3 font-mono text-emerald-400">sb-*</td>
                          <td className="p-3">Supabase authentication session token</td>
                          <td className="p-3">Session</td>
                        </tr>
                        <tr className="border-b border-border/20">
                          <td className="p-3 font-mono text-emerald-400">csrf_token</td>
                          <td className="p-3">Cross-site request forgery protection</td>
                          <td className="p-3">Session</td>
                        </tr>
                        <tr className="border-b border-border/20">
                          <td className="p-3 font-mono text-emerald-400">lr_session</td>
                          <td className="p-3">User session identifier for API requests</td>
                          <td className="p-3">24 hours</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-emerald-400">lr_prefs</td>
                          <td className="p-3">Dashboard preferences and UI state</td>
                          <td className="p-3">1 year</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h3 className="text-base font-semibold text-foreground mt-6">Analytics Cookies</h3>
                  <p>
                    These cookies help us understand how visitors interact with our platform by collecting information about pages visited, time spent, navigation patterns, and any errors encountered. This data is aggregated and anonymized. Analytics cookies are optional and can be disabled without affecting core platform functionality.
                  </p>

                  <h3 className="text-base font-semibold text-foreground mt-6">Functional Cookies</h3>
                  <p>
                    These cookies enable enhanced functionality and personalization. They remember your choices (such as your preferred dashboard layout, table column selections, or notification settings) and provide customized features. Functional cookies are optional and can be disabled, though some personalization features may not work as expected.
                  </p>

                  <h3 className="text-base font-semibold text-foreground mt-6">Targeting / Advertising Cookies</h3>
                  <p>
                    LeadReach AI does not use targeting or advertising cookies. We do not participate in cross-site tracking, retargeting, or personalized advertising. We believe your data and your browsing activity should remain private, and we have designed our cookie practices to reflect this commitment.
                  </p>
                </div>
              </div>

              {/* Section 4 */}
              <div id="third-party-cookies" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Third-Party Cookies
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    Some cookies on our platform are set by third-party services that we use to operate and improve LeadReach AI. These third parties have their own privacy and cookie policies, which we encourage you to review.
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-foreground/90">Supabase:</strong> Our authentication and database provider sets essential cookies for session management and security. These are required for the platform to function.</li>
                    <li><strong className="text-foreground/90">Stripe:</strong> Our payment processor may set cookies when you access billing or subscription management pages. These are essential for processing payments securely.</li>
                    <li><strong className="text-foreground/90">Analytics Providers:</strong> We may use privacy-focused analytics services that set cookies to collect aggregated usage data. These cookies are optional and can be disabled.</li>
                  </ul>
                  <p>
                    We carefully vet all third-party services to ensure they meet our standards for data privacy and security. We do not allow third parties to use cookies on our platform for their own advertising or tracking purposes.
                  </p>
                </div>
              </div>

              {/* Section 5 */}
              <div id="managing-cookies" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Managing Cookie Preferences
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences in several ways:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-foreground/90">Browser Settings:</strong> Most web browsers allow you to control cookies through their settings. You can set your browser to refuse all cookies, accept only certain cookies, or alert you when a cookie is being set. The Help section of your browser should provide guidance on how to manage cookies.</li>
                    <li><strong className="text-foreground/90">Cookie Consent Banner:</strong> When you first visit our platform, a cookie consent banner allows you to accept or reject non-essential cookies (analytics and functional). You can change your preferences at any time.</li>
                    <li><strong className="text-foreground/90">Platform Settings:</strong> Within your LeadReach AI account settings, you can manage your data and privacy preferences, including cookie settings for analytics and functional cookies.</li>
                    <li><strong className="text-foreground/90">Opt-Out Links:</strong> For analytics services, we provide opt-out links that allow you to exclude your browsing data from analytics collection.</li>
                  </ul>
                  <p>
                    Please note that disabling essential cookies may affect the functionality of our platform. If you disable session cookies, you may be unable to log in or maintain your session. If you disable preference cookies, your dashboard layout and settings will not persist between visits.
                  </p>
                </div>
              </div>

              {/* Section 6 */}
              <div id="cookies-and-ai-agents" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Cookies &amp; AI Agent Operations
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    LeadReach AI operates autonomous AI agents that research leads across the internet on your behalf. It is important to understand the distinction between cookies used on our platform and the technologies used by our AI agents during their research operations.
                  </p>
                  <p>
                    Our AI agents access publicly available information through authorized channels and APIs. When agents access third-party websites for research purposes, they do not store cookies on your device or use your browser cookies. Agent operations run in secure, isolated server-side environments that are completely separate from your browser session.
                  </p>
                  <p>
                    On the LeadReach AI platform itself, session cookies are used to maintain the connection between your browser and the agent workload. This enables real-time status updates, progress notifications, and the ability to monitor and control agent activity from your dashboard. These session cookies are classified as essential and cannot be disabled while using the agent monitoring features.
                  </p>
                </div>
              </div>

              {/* Section 7 */}
              <div id="cookie-duration" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Cookie Duration
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    The duration for which cookies remain on your device varies depending on their type and purpose:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-foreground/90">Session Cookies:</strong> These are temporary cookies that exist only while you are actively using the platform. They are automatically deleted when you close your browser or when your session expires after a period of inactivity (typically 24 hours for security purposes).</li>
                    <li><strong className="text-foreground/90">Persistent Cookies:</strong> These remain on your device for a specified period or until you manually delete them. Our persistent cookies typically have a maximum lifespan of one year, after which they expire automatically. We review cookie durations regularly to ensure they remain appropriate for their purpose.</li>
                    <li><strong className="text-foreground/90">Authentication Cookies:</strong> Authentication tokens are stored as persistent cookies with a maximum duration of 30 days. Each time you log in, the cookie is refreshed. If you remain inactive for more than 30 days, the authentication cookie expires and you will be required to log in again for security purposes.</li>
                  </ul>
                </div>
              </div>

              {/* Section 8 */}
              <div id="updates-to-policy" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Updates to This Policy
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our data practices. When we make changes, we will update the &quot;Last updated&quot; date at the top of this page and, for significant changes, provide additional notice through a prominent banner on our website or via email.
                  </p>
                  <p>
                    We encourage you to review this Cookie Policy periodically to stay informed about how we use cookies. Your continued use of our platform after any changes to this Cookie Policy constitutes your acceptance of the updated practices.
                  </p>
                  <p>
                    If we introduce new categories of cookies or change how existing cookies are used, we will provide clear notice and, where required by law, obtain your consent before implementing the changes.
                  </p>
                </div>
              </div>

              {/* Section 9 */}
              <div id="contact" className="mb-12 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Contact Us
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    If you have any questions about our use of cookies or this Cookie Policy, please contact us:
                  </p>
                  <ul className="list-none space-y-2">
                    <li><strong className="text-foreground/90">Email:</strong> privacy@leadreach.ai</li>
                    <li><strong className="text-foreground/90">Data Protection Officer:</strong> dpo@leadreach.ai</li>
                    <li><strong className="text-foreground/90">Mailing Address:</strong> LeadReach AI Inc., 548 Market Street, Suite 36879, San Francisco, CA 94104</li>
                  </ul>
                  <p>
                    For more information about how we handle your personal data, please see our{' '}
                    <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300 transition-colors">Privacy Policy</Link>
                    {' '}and{' '}
                    <Link href="/terms" className="text-emerald-400 hover:text-emerald-300 transition-colors">Terms of Service</Link>.
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
