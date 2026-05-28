/**
 * Tech Stack & Industry Detector
 *
 * Ported from ai-sales-team-claude/scripts/analyze_prospect.py
 * Detects technologies and industries from HTML content/website analysis.
 *
 * Used by:
 * - /api/sales-intelligence/analyze-url
 * - Lead enrichment pipeline (tech stack + industry detection)
 */

// ─────────────────────────────────────────────────────────────
// Tech Stack Detection Signatures
// ─────────────────────────────────────────────────────────────

const TECH_SIGNATURES: Record<string, RegExp[]> = {
  'WordPress': [/wp-content/i, /wp-includes/i, /name="generator".*?WordPress/i],
  'Shopify': [/cdn\.shopify\.com/i, /Shopify\.theme/i],
  'HubSpot': [/hs-scripts\.com/i, /hbspt/i, /hubspot/i],
  'Webflow': [/webflow\.com/i, /Webflow/i],
  'Next.js': [/_next\/static/i, /__NEXT_DATA__/i],
  'React': [/react\.production\.min/i, /react-dom/i],
  'Vue.js': [/vue\.min\.js/i, /vue\.runtime/i],
  'Angular': [/angular\.min\.js/i, /ng-version/i],
  'Gatsby': [/gatsby/i, /___gatsby/i],
  'Squarespace': [/squarespace\.com/i, /static\.squarespace/i],
  'Wix': [/wix\.com/i, /parastorage\.com/i],
  'Google Analytics': [/google-analytics\.com/i, /gtag\/js/i, /googletagmanager/i],
  'Segment': [/cdn\.segment\.com/i, /analytics\.js/i],
  'Intercom': [/intercom/i, /widget\.intercom\.io/i],
  'Drift': [/drift\.com/i, /js\.driftt\.com/i],
  'Stripe': [/js\.stripe\.com/i, /stripe/i],
  'Salesforce': [/force\.com/i, /salesforce/i],
  'Marketo': [/marketo/i, /mkto/i],
  'Pardot': [/pardot/i, /pi\.pd/i],
  'ZoomInfo': [/zoominfo/i],
  'Clearbit': [/clearbit/i, /clearbitjs/i],
  'Mailchimp': [/mailchimp/i, /mcjs/i],
  'Zoho': [/zoho/i, /zohopublic/i],
  'Slack': [/slack\.com/i, /slackbtn/i],
  'Notion': [/notion\.so/i],
  'Figma': [/figma\.com/i],
  'Datadog': [/datadog/i, /ddog/i],
  'New Relic': [/newrelic/i, /nr-data/i],
  'AWS': [/aws/i, /amazonaws/i],
  'Cloudflare': [/cloudflare/i, /cf-beacon/i],
};

export function detectTechStack(html: string, scripts: string[] = []): string[] {
  const combined = html + ' ' + scripts.join(' ');
  const detected: string[] = [];

  for (const [tech, patterns] of Object.entries(TECH_SIGNATURES)) {
    for (const pat of patterns) {
      if (pat.test(combined)) {
        detected.push(tech);
        break;
      }
    }
  }

  return [...new Set(detected)];
}

// ─────────────────────────────────────────────────────────────
// Industry Detection Keywords
// ─────────────────────────────────────────────────────────────

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  'SaaS': ['saas', 'software as a service', 'cloud platform', 'subscription'],
  'Fintech': ['fintech', 'financial technology', 'payments', 'banking'],
  'Healthcare': ['healthcare', 'health tech', 'medical', 'patient', 'clinical'],
  'E-commerce': ['ecommerce', 'e-commerce', 'online store', 'shop', 'retail'],
  'EdTech': ['edtech', 'education', 'learning platform', 'courses'],
  'Cybersecurity': ['security', 'cyber', 'threat', 'vulnerability'],
  'AI/ML': ['artificial intelligence', 'machine learning', 'ai-powered', 'deep learning'],
  'DevTools': ['developer', 'devtools', 'api', 'sdk', 'infrastructure'],
  'MarTech': ['marketing', 'martech', 'analytics', 'campaign', 'automation'],
  'HRTech': ['hr tech', 'human resources', 'recruiting', 'talent'],
  'Real Estate': ['real estate', 'property', 'realtor', 'brokerage', 'listings'],
  'Insurance': ['insurance', 'insurtech', 'claims', 'underwriting', 'policy'],
  'Logistics': ['logistics', 'supply chain', 'shipping', 'freight', 'warehouse'],
  'Construction': ['construction', 'building', 'architecture', 'engineering firm'],
  'Professional Services': ['consulting', 'advisory', 'agency', 'professional services'],
};

export function detectIndustry(text: string): string[] {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    const score = keywords.filter(kw => lower.includes(kw)).length;
    if (score > 0) scores[industry] = score;
  }

  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([industry]) => industry);
}

// ─────────────────────────────────────────────────────────────
// Social Link Extraction
// ─────────────────────────────────────────────────────────────

const SOCIAL_PATTERNS: Record<string, RegExp> = {
  linkedin: /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[\w-]+/gi,
  twitter: /https?:\/\/(?:twitter|x)\.com\/[\w]+/gi,
  facebook: /https?:\/\/(?:www\.)?facebook\.com\/[\w.]+/gi,
  instagram: /https?:\/\/(?:www\.)?instagram\.com\/[\w.]+/gi,
  youtube: /https?:\/\/(?:www\.)?youtube\.com\/(?:c\/|channel\/|@)[\w-]+/gi,
  github: /https?:\/\/(?:www\.)?github\.com\/[\w-]+/gi,
};

export function extractSocialLinks(html: string): Record<string, string[]> {
  const found: Record<string, string[]> = {};
  for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
    const matches = html.match(pattern);
    if (matches) {
      found[platform] = [...new Set(matches)].slice(0, 3);
    }
  }
  return found;
}

// ─────────────────────────────────────────────────────────────
// Contact Info Extraction
// ─────────────────────────────────────────────────────────────

export function extractContactInfo(html: string): { emails: string[]; phones: string[] } {
  const emailPattern = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
  const phonePattern = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

  const emails = (html.match(emailPattern) || [])
    .filter(e => !e.endsWith('.png') && !e.endsWith('.jpg') && !e.endsWith('.svg'))
    .filter((e, i, a) => a.indexOf(e) === i)
    .slice(0, 5);

  const phones = (html.match(phonePattern) || [])
    .filter((p, i, a) => a.indexOf(p) === i)
    .slice(0, 3);

  return { emails, phones };
}

// ─────────────────────────────────────────────────────────────
// Company Size Estimation
// ─────────────────────────────────────────────────────────────

export function estimateCompanySize(html: string): {
  estimatedEmployees?: string;
  locationsMentioned?: string[];
  fundingStage?: string;
} {
  const signals: Record<string, any> = {};

  const empMatch = html.match(/(\d[\d,]*)\+?\s*(?:employees?|team\s*members?|people)/i);
  if (empMatch) signals.estimatedEmployees = empMatch[1].replace(/,/g, '');

  const locPatterns = html.match(/(?:offices?\s*in|locations?\s*in|headquartered\s*in)\s*([A-Z][\w\s,]+)/g);
  if (locPatterns) {
    signals.locationsMentioned = locPatterns.map(l => l.replace(/^(?:offices?\s*in|locations?\s*in|headquartered\s*in)\s*/i, '').trim()).slice(0, 5);
  }

  for (const marker of ['Series A', 'Series B', 'Series C', 'Series D', 'IPO', 'public company']) {
    if (html.toLowerCase().includes(marker.toLowerCase())) {
      signals.fundingStage = marker;
      break;
    }
  }

  return signals;
}
