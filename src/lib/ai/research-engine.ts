/**
 * Deep Research Engine
 * 
 * The core orchestrator that powers the AI Assistant's deep research mode.
 * When a user asks to "research a company" or provides a URL for deep dive,
 * this engine executes a multi-stage research pipeline:
 * 
 * Stage 1: Website Read — Scrape the target website (Jina Reader / Crawl4AI)
 * Stage 2: Company Search — Deep company data via Exa SDK
 * Stage 3: People Search — Find key contacts and decision makers
 * Stage 4: News & Social — Recent news, social signals, intent data
 * Stage 5: Tech Analysis — Technology stack, digital presence analysis
 * Stage 6: Synthesis — LLM synthesizes all data into structured industry-grade report
 * 
 * Each stage produces structured data that feeds into the next.
 * Progress is reported via a callback for real-time UI updates.
 * The final output is a comprehensive research report with actionable intelligence.
 */

import { webRead, exaSearch, exaSearchDeep, exaSearchCompaniesStructured, exaSearchPeople, exaSearchIntentSignals, exaGetContents, exaFindSimilar, exaCategorySearch } from '../agent-reach-bridge';
import { isExaConfigured } from '../exa-sdk';

// ============================================================
// Types
// ============================================================

export type ResearchStage = 
  | 'intent_analysis'
  | 'website_read'
  | 'company_search'
  | 'people_search'
  | 'news_social'
  | 'tech_analysis'
  | 'intent_signals'
  | 'synthesis'
  | 'complete';

export interface StageProgress {
  stage: ResearchStage;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  detail?: string;
  dataKeys?: string[];
}

export interface ResearchInput {
  query: string;
  urls?: string[];
  companyName?: string;
  industry?: string;
  location?: string;
}

export interface WebsiteReadOutput {
  url: string;
  title: string;
  content: string;
  wordCount: number;
  metadata?: Record<string, string>;
  emails?: string[];
  phones?: string[];
}

export interface CompanySearchOutput {
  companyName: string;
  website?: string;
  industry?: string;
  description?: string;
  location?: string;
  employeeCount?: string;
  revenueEstimate?: string;
  foundingYear?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  source: string;
}

export interface PeopleSearchOutput {
  name: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
  location?: string;
  snippet?: string;
  source: string;
}

export interface NewsSocialOutput {
  title: string;
  url: string;
  snippet: string;
  date?: string;
  source: string;
  category: 'news' | 'social' | 'blog' | 'press';
}

export interface TechAnalysisOutput {
  technologies: string[];
  platform?: string;
  hosting?: string;
  analytics?: string[];
  source: string;
}

export interface IntentSignalOutput {
  type: string;
  description: string;
  source?: string;
  date?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ResearchReport {
  companyName: string;
  website?: string;
  industry?: string;
  location?: string;
  
  // Stage outputs
  websiteRead?: WebsiteReadOutput;
  companyData?: CompanySearchOutput;
  keyContacts: PeopleSearchOutput[];
  newsAndSocial: NewsSocialOutput[];
  techStack?: TechAnalysisOutput;
  intentSignals: IntentSignalOutput[];
  
  // Final synthesis
  executiveSummary: string;
  companyOverview: string;
  keyDecisionMakers: string;
  digitalPresence: string;
  competitiveLandscape: string;
  intentAnalysis: string;
  leadScore: number;
  leadTier: 'hot' | 'warm' | 'cold';
  outreachStrategy: string;
  recommendedActions: string[];
  
  // Metadata
  researchStages: StageProgress[];
  totalDurationMs: number;
  sourcesUsed: string[];
}

export type ProgressCallback = (progress: StageProgress) => void;

// ============================================================
// Intent Detection
// ============================================================

export function detectResearchIntent(query: string): {
  isResearch: boolean;
  urls: string[];
  companyName: string;
  industry: string;
  location: string;
} {
  const lower = query.toLowerCase();
  
  // Extract URLs from query
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\]]+/g;
  const urls = query.match(urlRegex) || [];
  
  // Detect research intent keywords
  const researchKeywords = [
    'research', 'deep dive', 'deep dive into', 'prospect data',
    'company info', 'company research', 'analyze company', 'company analysis',
    'look up', 'find information', 'tell me about', 'investigate',
    'background check', 'due diligence', 'competitive intel',
    'company profile', 'market research', 'lead intelligence',
    'who is', 'what is', 'about ', 'find out about', 'get info on',
    'learn about', 'explore ', 'study ', 'evaluate ',
  ];
  
  // Also detect: "Research <Company>", "Analyze <Company>", or a URL alone
  const hasResearchPrefix = /^(?:research|analyze|analyse|investigate|deep dive|tell me about|look up|find out about|learn about|explore|study|evaluate)\s+/i.test(query.trim());
  
  const isResearch = researchKeywords.some(kw => lower.includes(kw)) || urls.length > 0 || hasResearchPrefix;
  
  // Try to extract company name from URL
  let companyName = '';
  if (urls.length > 0) {
    try {
      const hostname = new URL(urls[0] as string).hostname;
      companyName = hostname
        .replace(/^www\./, '')
        .replace(/\.(com|io|ai|co|dev|tech|app|org|net|xyz|space)/, '')
        .split('.')[0]
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    } catch {}
  }
  
  // If no URL, try to extract company name from query
  if (!companyName) {
    // Patterns like "research Acme Corp" or "deep dive into Notion"
    const patterns = [
      /(?:research|analyze|look up|deep dive into|tell me about|investigate)\s+(?:company\s+)?["']?([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)?)["']?/i,
      /^(?:research|analyze|deep dive)\s+(.+)/i,
    ];
    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match?.[1]) {
        let name = match[1].trim();
        // Remove trailing filler words
        name = name.replace(/\s+(the|company|corp|inc|ltd|to|for|and|into|prospect|data|deep|dive|about|information|details|overview|profile|analysis|research)$/gi, '').trim();
        if (name.length > 0) {
          companyName = name;
        }
        break;
      }
    }
  }
  
  // Extract industry hints
  const industryKeywords: Record<string, string> = {
    'real estate': 'Real Estate',
    'propert': 'Real Estate',
    'fintech': 'FinTech',
    'saas': 'SaaS',
    'healthcare': 'Healthcare',
    'ai ': 'Artificial Intelligence',
    'artificial intelligence': 'Artificial Intelligence',
    'machine learning': 'Machine Learning',
    'ecommerce': 'E-Commerce',
    'e-commerce': 'E-Commerce',
    'marketing': 'Marketing',
    'crypto': 'Cryptocurrency',
    'blockchain': 'Blockchain',
    'cybersecurity': 'Cybersecurity',
    'edtech': 'EdTech',
    'insurtech': 'InsurTech',
  };
  
  let industry = '';
  for (const [keyword, ind] of Object.entries(industryKeywords)) {
    if (lower.includes(keyword)) {
      industry = ind;
      break;
    }
  }
  
  // Extract location hints
  const locationKeywords: Record<string, string> = {
    'dubai': 'Dubai, UAE',
    'uae': 'Dubai, UAE',
    'new york': 'New York, USA',
    'san francisco': 'San Francisco, USA',
    'london': 'London, UK',
    'singapore': 'Singapore',
    'berlin': 'Berlin, Germany',
    'toronto': 'Toronto, Canada',
    'tokyo': 'Tokyo, Japan',
    'sydney': 'Sydney, Australia',
  };
  
  let location = '';
  for (const [keyword, loc] of Object.entries(locationKeywords)) {
    if (lower.includes(keyword)) {
      location = loc;
      break;
    }
  }
  
  return { isResearch, urls, companyName, industry, location };
}

// ============================================================
// Stage Executors
// ============================================================

async function callLLM(systemPrompt: string, userMessage: string): Promise<string> {
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    
    const result = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });
    
    if (!result?.choices?.[0]?.message?.content) {
      throw new Error('LLM returned empty response');
    }
    return result.choices[0].message.content;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ResearchEngine] LLM call failed:', msg);
    throw error;
  }
}

async function executeWebsiteRead(
  urls: string[],
  onProgress: ProgressCallback,
): Promise<WebsiteReadOutput | undefined> {
  if (urls.length === 0) return undefined;
  
  onProgress({
    stage: 'website_read',
    label: 'Reading website content',
    status: 'running',
    detail: `Scraping ${urls[0]} via Jina Reader...`,
  });
  
  try {
    const result = await webRead(urls[0]);
    
    if (!result.success) {
      onProgress({
        stage: 'website_read',
        label: 'Website read',
        status: 'failed',
        detail: result.error || 'Failed to read website',
      });
      return undefined;
    }
    
    // Extract emails and phones from content
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
    const emails = [...new Set(result.data.content.match(emailRegex) || [])];
    const phones = [...new Set(result.data.content.match(phoneRegex) || [])];
    
    // Extract metadata from content
    const metaMatch = result.data.content.match(/(?:^|\n)(?:Title|Description|Keywords|Author):\s*(.+)/gi);
    const metadata: Record<string, string> = {};
    if (metaMatch) {
      for (const line of metaMatch) {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          metadata[key.trim()] = valueParts.join(':').trim();
        }
      }
    }
    
    const output: WebsiteReadOutput = {
      url: result.data.url,
      title: result.data.title,
      content: result.data.content.slice(0, 30000), // Cap for LLM context
      wordCount: result.data.wordCount,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      emails: emails.length > 0 ? emails : undefined,
      phones: phones.length > 0 ? phones : undefined,
    };
    
    onProgress({
      stage: 'website_read',
      label: 'Website read',
      status: 'completed',
      detail: `Read ${output.wordCount} words from ${output.title}`,
      dataKeys: ['title', 'content', 'emails', 'phones'],
    });
    
    return output;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    onProgress({
      stage: 'website_read',
      label: 'Website read',
      status: 'failed',
      detail: msg,
    });
    return undefined;
  }
}

async function executeCompanySearch(
  companyName: string,
  websiteUrl: string | undefined,
  industry: string,
  location: string,
  onProgress: ProgressCallback,
): Promise<CompanySearchOutput | undefined> {
  onProgress({
    stage: 'company_search',
    label: 'Searching company data',
    status: 'running',
    detail: `Deep searching for ${companyName} via Exa...`,
  });
  
  try {
    const searchQuery = companyName 
      ? `${companyName} ${industry || ''} ${location || ''} company overview`
      : `${industry || 'company'} ${location || ''}`;
    
    let companyData: CompanySearchOutput | undefined;
    
    // Primary: Exa deep search with structured output
    if (isExaConfigured()) {
      try {
        const result = await exaSearchCompaniesStructured(searchQuery, 5);
        
        if (result.success && result.data.length > 0) {
          // Use the best result
          const best = result.data[0];
          companyData = {
            companyName: best.title || companyName,
            website: best.url || websiteUrl,
            industry: industry || undefined,
            description: best.snippet || best.summary || undefined,
            source: 'Exa Deep Search',
          };
        }
        
        // If we have a URL, try to get enriched content from Exa /contents
        if (websiteUrl && isExaConfigured()) {
          try {
            const contents = await exaGetContents([websiteUrl], {
              text: { maxCharacters: 15000 },
              highlights: true,
              summary: { query: `${companyName} company overview industry employees revenue location contact` },
            });
            
            if (contents.success && contents.data.length > 0) {
              const c = contents.data[0];
              if (c.summary && companyData) {
                companyData.description = c.summary;
              }
              if (c.text && companyData) {
                // Parse out useful data from the text
                const text = c.text;
                const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                if (emailMatch && !companyData.website?.includes('@')) {
                  // Found an email
                }
              }
            }
          } catch {}
        }
        
        // Also try Exa findSimilar for the website
        if (websiteUrl && isExaConfigured()) {
          try {
            const similar = await exaFindSimilar(websiteUrl, 3);
            // Similar sites give competitive landscape data
          } catch {}
        }
      } catch (e) {
        console.warn('[ResearchEngine] Exa company search failed:', e instanceof Error ? e.message : e);
      }
    }
    
    // Fallback: General web search
    if (!companyData) {
      try {
        const result = await exaSearch(searchQuery, 5);
        if (result.success && result.data.length > 0) {
          const best = result.data[0];
          companyData = {
            companyName: best.title || companyName,
            website: best.url || websiteUrl,
            industry: industry || undefined,
            description: best.snippet || undefined,
            source: result.source || 'Web Search',
          };
        }
      } catch {}
    }
    
    // Last fallback: Use the company name from the query
    if (!companyData) {
      companyData = {
        companyName,
        website: websiteUrl,
        industry: industry || undefined,
        source: 'User Query',
      };
    }
    
    onProgress({
      stage: 'company_search',
      label: 'Company search',
      status: 'completed',
      detail: `Found data for ${companyData.companyName}`,
      dataKeys: ['companyName', 'website', 'industry', 'description'],
    });
    
    return companyData;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    onProgress({
      stage: 'company_search',
      label: 'Company search',
      status: 'failed',
      detail: msg,
    });
    return undefined;
  }
}

async function executePeopleSearch(
  companyName: string,
  industry: string,
  location: string,
  onProgress: ProgressCallback,
): Promise<PeopleSearchOutput[]> {
  onProgress({
    stage: 'people_search',
    label: 'Finding key contacts',
    status: 'running',
    detail: `Searching for decision makers at ${companyName}...`,
  });
  
  const contacts: PeopleSearchOutput[] = [];
  
  try {
    // Primary: Exa people search
    if (isExaConfigured()) {
      try {
        const peopleQuery = `${companyName} CEO founder director VP head ${industry || ''}`;
        const result = await exaSearchPeople(peopleQuery, 8);
        
        if (result.success && result.data.length > 0) {
          for (const person of result.data) {
            // Clean up the snippet - remove raw LinkedIn data patterns
            let cleanSnippet = (person.snippet || person.summary || '')
              .replace(/\[object Object\]/g, '')
              .replace(/###/g, '')
              .replace(/Department:.*?(?:\n|$)/gi, '')
              .replace(/Level:.*?(?:\n|$)/gi, '')
              .slice(0, 300); // Truncate long snippets
            
            contacts.push({
              name: person.title || '',
              title: person.snippet?.split('—')[0]?.split(' at ')[0]?.trim() || undefined,
              company: companyName,
              linkedinUrl: person.url?.includes('linkedin') ? person.url : undefined,
              location: location || undefined,
              snippet: cleanSnippet || undefined,
              source: 'Exa People Search',
            });
          }
        }
      } catch (e) {
        console.warn('[ResearchEngine] Exa people search failed:', e instanceof Error ? e.message : e);
      }
    }
    
    // Fallback: LinkedIn category search
    if (contacts.length < 3) {
      try {
        const linkedInQuery = `${companyName} CEO founder director`;
        const result = await exaCategorySearch(linkedInQuery, 'linkedin profile', 5);
        
        if (result.success && result.data.length > 0) {
          for (const person of result.data) {
            // Avoid duplicates
            if (contacts.some(c => c.linkedinUrl === person.url)) continue;
            
            contacts.push({
              name: person.title || '',
              title: person.snippet?.split(' at ')[0]?.trim() || undefined,
              company: companyName,
              linkedinUrl: person.url,
              snippet: (person.snippet || person.summary || '').replace(/\[object Object\]/g, '').replace(/###/g, '').slice(0, 300) || undefined,
              source: 'LinkedIn Search',
            });
          }
        }
      } catch {}
    }
    
    // Fallback: General web search for "companyName CEO/founder"
    if (contacts.length < 2) {
      try {
        const result = await exaSearch(`${companyName} CEO founder director leadership team`, 5);
        if (result.success && result.data.length > 0) {
          for (const person of result.data) {
            contacts.push({
              name: person.title || '',
              snippet: (person.snippet || '').slice(0, 300) || undefined,
              source: 'Web Search',
            });
          }
        }
      } catch {}
    }
    
    onProgress({
      stage: 'people_search',
      label: 'People search',
      status: 'completed',
      detail: `Found ${contacts.length} key contacts`,
      dataKeys: ['name', 'title', 'linkedinUrl'],
    });
  } catch (error) {
    onProgress({
      stage: 'people_search',
      label: 'People search',
      status: 'failed',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
  
  return contacts;
}

async function executeNewsAndSocial(
  companyName: string,
  onProgress: ProgressCallback,
): Promise<NewsSocialOutput[]> {
  onProgress({
    stage: 'news_social',
    label: 'Gathering news & social signals',
    status: 'running',
    detail: `Searching recent news about ${companyName}...`,
  });
  
  const items: NewsSocialOutput[] = [];
  
  try {
    // Search for recent news
    if (isExaConfigured()) {
      try {
        const newsResult = await exaCategorySearch(
          `${companyName} latest news updates 2024 2025`,
          'news',
          5,
        );
        
        if (newsResult.success && newsResult.data.length > 0) {
          for (const item of newsResult.data) {
            items.push({
              title: item.title || '',
              url: item.url,
              snippet: item.snippet || item.summary || '',
              date: item.publishedDate,
              source: 'Exa News',
              category: 'news',
            });
          }
        }
      } catch {}
    }
    
    // Also do a general search for recent activity
    try {
      const generalResult = await exaSearch(`${companyName} news press release announcement 2024 2025`, 5);
      if (generalResult.success && generalResult.data.length > 0) {
        for (const item of generalResult.data) {
          // Avoid duplicates
          if (items.some(i => i.url === item.url)) continue;
          items.push({
            title: item.title || '',
            url: item.url,
            snippet: item.snippet || '',
            date: item.publishedDate,
            source: 'Web Search',
            category: item.url.includes('twitter') || item.url.includes('reddit') ? 'social' : 'blog',
          });
        }
      }
    } catch {}
    
    onProgress({
      stage: 'news_social',
      label: 'News & social',
      status: 'completed',
      detail: `Found ${items.length} news/social items`,
      dataKeys: ['title', 'snippet', 'date'],
    });
  } catch (error) {
    onProgress({
      stage: 'news_social',
      label: 'News & social',
      status: 'failed',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
  
  return items;
}

async function executeIntentSignals(
  companyName: string,
  industry: string,
  location: string,
  onProgress: ProgressCallback,
): Promise<IntentSignalOutput[]> {
  onProgress({
    stage: 'intent_signals',
    label: 'Detecting intent signals',
    status: 'running',
    detail: `Looking for buying signals for ${companyName}...`,
  });
  
  const signals: IntentSignalOutput[] = [];
  
  try {
    if (isExaConfigured()) {
      try {
        const result = await exaSearchIntentSignals(companyName, industry, location);
        
        if (result.structuredOutput?.content) {
          const content = result.structuredOutput.content as Record<string, unknown>;
          const signalList = content.signals as Array<Record<string, unknown>> | undefined;
          
          if (signalList && Array.isArray(signalList)) {
            for (const s of signalList) {
              signals.push({
                type: (s.type as string) || 'unknown',
                description: (s.description as string) || '',
                source: (s.source as string) || undefined,
                date: (s.date as string) || undefined,
                confidence: (s.overallAssessment as 'high' | 'medium' | 'low') || 'medium',
              });
            }
          }
          
          // Add overall assessment as a signal if available
          if (content.overallAssessment) {
            signals.push({
              type: 'overall_assessment',
              description: `Overall buying intent: ${content.overallAssessment}`,
              confidence: content.overallAssessment as 'high' | 'medium' | 'low',
            });
          }
        }
      } catch {}
    }
    
    // Fallback: General search for hiring/expansion signals
    if (signals.length === 0) {
      try {
        const result = await exaSearch(`${companyName} hiring expanding funding new office 2024 2025`, 3);
        if (result.success && result.data.length > 0) {
          for (const item of result.data) {
            signals.push({
              type: 'web_signal',
              description: item.snippet || item.title || '',
              source: item.url,
              confidence: 'low',
            });
          }
        }
      } catch {}
    }
    
    onProgress({
      stage: 'intent_signals',
      label: 'Intent signals',
      status: 'completed',
      detail: `Detected ${signals.length} signals`,
      dataKeys: ['type', 'description', 'confidence'],
    });
  } catch (error) {
    onProgress({
      stage: 'intent_signals',
      label: 'Intent signals',
      status: 'failed',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
  
  return signals;
}

async function executeTechAnalysis(
  websiteUrl: string | undefined,
  companyName: string,
  onProgress: ProgressCallback,
): Promise<TechAnalysisOutput | undefined> {
  onProgress({
    stage: 'tech_analysis',
    label: 'Analyzing technology stack',
    status: 'running',
    detail: websiteUrl ? `Analyzing tech at ${websiteUrl}...` : `Searching for ${companyName} tech stack...`,
  });
  
  try {
    const technologies: string[] = [];
    let platform = '';
    let hosting = '';
    const analytics: string[] = [];
    
    // Search for tech stack information
    try {
      const result = await exaSearch(`${companyName} technology stack tech stack built with`, 3);
      if (result.success && result.data.length > 0) {
        const snippets = result.data.map(d => d.snippet || '').join(' ');
        
        // Common tech detection patterns
        const techPatterns: Record<string, string[]> = {
          'React': ['react', 'react.js', 'reactjs'],
          'Next.js': ['next.js', 'nextjs'],
          'Vue.js': ['vue', 'vue.js', 'vuejs'],
          'Angular': ['angular'],
          'Node.js': ['node.js', 'nodejs'],
          'Python': ['python', 'django', 'flask'],
          'WordPress': ['wordpress', 'wp-'],
          'Shopify': ['shopify'],
          'AWS': ['aws', 'amazon web services'],
          'Google Cloud': ['gcp', 'google cloud'],
          'Azure': ['azure', 'microsoft azure'],
          'Vercel': ['vercel'],
          'Cloudflare': ['cloudflare'],
          'Tailwind CSS': ['tailwind'],
          'TypeScript': ['typescript'],
          'GraphQL': ['graphql'],
          'PostgreSQL': ['postgresql', 'postgres'],
          'MongoDB': ['mongodb'],
          'Redis': ['redis'],
          'Docker': ['docker'],
          'Kubernetes': ['kubernetes', 'k8s'],
        };
        
        const lowerSnippets = snippets.toLowerCase();
        for (const [tech, patterns] of Object.entries(techPatterns)) {
          if (patterns.some(p => lowerSnippets.includes(p))) {
            technologies.push(tech);
          }
        }
      }
    } catch {}
    
    // Try to detect tech from website content if available
    if (websiteUrl) {
      try {
        const webResult = await webRead(websiteUrl);
        if (webResult.success) {
          const html = webResult.data.content.toLowerCase();
          
          if (html.includes('__next') || html.includes('_next')) technologies.push('Next.js');
          if (html.includes('react') || html.includes('__react')) technologies.push('React');
          if (html.includes('vue') || html.includes('__vue')) technologies.push('Vue.js');
          if (html.includes('angular') || html.includes('ng-')) technologies.push('Angular');
          if (html.includes('shopify')) { platform = 'Shopify'; technologies.push('Shopify'); }
          if (html.includes('wordpress') || html.includes('wp-')) { platform = 'WordPress'; technologies.push('WordPress'); }
          if (html.includes('cloudflare')) hosting = 'Cloudflare';
          if (html.includes('vercel')) hosting = 'Vercel';
          if (html.includes('netlify')) hosting = 'Netlify';
          if (html.includes('google-analytics') || html.includes('gtag')) analytics.push('Google Analytics');
          if (html.includes('facebook pixel') || html.includes('fbq')) analytics.push('Facebook Pixel');
          if (html.includes('hubspot')) analytics.push('HubSpot');
          if (html.includes('intercom')) analytics.push('Intercom');
          if (html.includes('segment')) analytics.push('Segment');
        }
      } catch {}
    }
    
    const output: TechAnalysisOutput = {
      technologies: [...new Set(technologies)],
      platform: platform || undefined,
      hosting: hosting || undefined,
      analytics: analytics.length > 0 ? analytics : undefined,
      source: 'Web Analysis',
    };
    
    onProgress({
      stage: 'tech_analysis',
      label: 'Tech analysis',
      status: 'completed',
      detail: `Detected ${output.technologies.length} technologies`,
      dataKeys: ['technologies', 'platform', 'hosting'],
    });
    
    return output;
  } catch (error) {
    onProgress({
      stage: 'tech_analysis',
      label: 'Tech analysis',
      status: 'failed',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
    return undefined;
  }
}

// ============================================================
// Final Synthesis
// ============================================================

async function executeSynthesis(
  input: ResearchInput,
  websiteData: WebsiteReadOutput | undefined,
  companyData: CompanySearchOutput | undefined,
  contacts: PeopleSearchOutput[],
  newsAndSocial: NewsSocialOutput[],
  techStack: TechAnalysisOutput | undefined,
  intentSignals: IntentSignalOutput[],
  onProgress: ProgressCallback,
): Promise<Pick<ResearchReport, 
  'companyName' | 'website' | 'industry' | 'location' |
  'executiveSummary' | 'companyOverview' | 'keyDecisionMakers' |
  'digitalPresence' | 'competitiveLandscape' | 'intentAnalysis' |
  'leadScore' | 'leadTier' | 'outreachStrategy' | 'recommendedActions'
>> {
  onProgress({
    stage: 'synthesis',
    label: 'Synthesizing research report',
    status: 'running',
    detail: 'AI is analyzing all gathered data to produce your report...',
  });
  
  const companyName = companyData?.companyName || input.companyName || 'Unknown Company';
  const website = companyData?.website || (input.urls?.[0]) || '';
  const industry = companyData?.industry || input.industry || '';
  const location = input.location || '';
  
  // Build context for LLM synthesis
  const contextParts: string[] = [];
  
  if (websiteData) {
    contextParts.push(`## Website Content (${websiteData.title})
URL: ${websiteData.url}
Word Count: ${websiteData.wordCount}
${websiteData.emails?.length ? `Emails Found: ${websiteData.emails.join(', ')}` : ''}
${websiteData.phones?.length ? `Phones Found: ${websiteData.phones.join(', ')}` : ''}
Content Excerpt: ${websiteData.content.slice(0, 5000)}`);
  }
  
  if (companyData) {
    contextParts.push(`## Company Data
Name: ${companyData.companyName}
Website: ${companyData.website || 'N/A'}
Industry: ${companyData.industry || 'N/A'}
Description: ${companyData.description || 'N/A'}
Source: ${companyData.source}`);
  }
  
  if (contacts.length > 0) {
    contextParts.push(`## Key Contacts Found
${contacts.map((c, i) => `${i + 1}. ${c.name}${c.title ? ` — ${c.title}` : ''}${c.linkedinUrl ? ` (LinkedIn: ${c.linkedinUrl})` : ''}${c.snippet ? `\n   ${c.snippet.slice(0, 200)}` : ''}`).join('\n')}`);
  }
  
  if (newsAndSocial.length > 0) {
    contextParts.push(`## Recent News & Social Activity
${newsAndSocial.map((n, i) => `${i + 1}. [${n.category.toUpperCase()}] ${n.title}${n.date ? ` (${n.date})` : ''}\n   ${n.snippet.slice(0, 200)}`).join('\n')}`);
  }
  
  if (techStack && techStack.technologies.length > 0) {
    contextParts.push(`## Technology Stack
Technologies: ${techStack.technologies.join(', ')}
Platform: ${techStack.platform || 'N/A'}
Hosting: ${techStack.hosting || 'N/A'}
Analytics: ${techStack.analytics?.join(', ') || 'N/A'}`);
  }
  
  if (intentSignals.length > 0) {
    contextParts.push(`## Intent Signals
${intentSignals.map((s, i) => `${i + 1. } [${s.confidence.toUpperCase()}] ${s.type}: ${s.description}${s.source ? ` (Source: ${s.source})` : ''}`).join('\n')}`);
  }
  
  const context = contextParts.join('\n\n');
  
  const synthesisPrompt = `You are a senior B2B sales intelligence analyst at a top-tier consulting firm. You specialize in producing comprehensive, actionable company research reports for sales teams.

You have gathered the following research data about a company. Your task is to synthesize ALL of this data into a structured, industry-grade research report that a sales team can immediately use for outreach.

RESEARCH DATA:
${context}

IMPORTANT INSTRUCTIONS:
1. Base EVERY claim on the actual data provided above. Do NOT fabricate or assume information not present in the data.
2. If certain data is missing, explicitly note it as "Not available from research" rather than guessing.
3. Be specific and quantitative wherever possible.
4. Score the lead objectively based on the data quality and fit signals.
5. Provide actionable outreach recommendations with specific talking points.
6. For keyDecisionMakers, write a concise prose analysis — do NOT include raw contact data or [object Object] text. Summarize each contact in 1-2 clean sentences with their name, title, and relevance.
7. All string values must be clean, human-readable text. No raw data dumps, no JSON objects embedded in strings, no markdown artifacts like ### or [object Object].

You MUST respond with a valid JSON object with EXACTLY these fields:
{
  "executiveSummary": "2-3 paragraph executive summary covering who they are, what they do, and why they matter as a prospect",
  "companyOverview": "Detailed company overview: business model, value proposition, market position, size indicators, founding story if known",
  "keyDecisionMakers": "Analysis of key contacts found, their roles, and how to approach them. Include specific talking points for each contact.",
  "digitalPresence": "Analysis of their digital footprint: website quality, technology choices, online visibility, content strategy, SEO indicators",
  "competitiveLandscape": "Competitive position analysis based on available data: market segment, differentiation, competitors visible in research",
  "intentAnalysis": "Analysis of buying signals and intent: hiring patterns, expansion indicators, technology adoption, pain points visible from research",
  "leadScore": <number 1-100>,
  "leadTier": "hot|warm|cold",
  "outreachStrategy": "Specific, personalized outreach strategy with recommended channels, messaging angles, timing, and talking points based on the research",
  "recommendedActions": ["array of 3-5 specific next steps the sales team should take"]
}

Lead Score Guidelines:
- 80-100 (Hot): Strong intent signals, perfect ICP fit, recent expansion/hiring, accessible contacts
- 50-79 (Warm): Good fit, some signals, needs nurturing, limited contacts
- 1-49 (Cold): Weak signals, poor fit, or insufficient data

Respond with ONLY the JSON object, no markdown formatting, no code blocks.`;

  try {
    const llmResponse = await callLLM(synthesisPrompt, `Synthesize research report for: ${companyName}`);
    
    // Parse the JSON response
    let parsed: Record<string, unknown>;
    try {
      // Try to extract JSON from the response
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      // Fallback: use the raw text as the summary
      parsed = {
        executiveSummary: llmResponse.slice(0, 2000),
        companyOverview: 'See executive summary',
        keyDecisionMakers: contacts.length > 0 ? `${contacts.length} contacts found` : 'No contacts found',
        digitalPresence: 'See tech analysis',
        competitiveLandscape: 'Insufficient data for competitive analysis',
        intentAnalysis: intentSignals.length > 0 ? `${intentSignals.length} signals detected` : 'No intent signals detected',
        leadScore: 30,
        leadTier: 'cold',
        outreachStrategy: 'Further research recommended before outreach',
        recommendedActions: ['Enrich company data further', 'Identify direct contact information', 'Monitor for intent signals'],
      };
    }
    
    const score = typeof parsed.leadScore === 'number' ? Math.min(100, Math.max(1, parsed.leadScore)) : 30;
    const tier = ['hot', 'warm', 'cold'].includes(parsed.leadTier as string) 
      ? (parsed.leadTier as 'hot' | 'warm' | 'cold') 
      : (score >= 80 ? 'hot' : score >= 50 ? 'warm' : 'cold');
    
    onProgress({
      stage: 'synthesis',
      label: 'Synthesis',
      status: 'completed',
      detail: `Report generated with lead score ${score}/100 (${tier})`,
    });
    
    return {
      companyName,
      website,
      industry,
      location,
      executiveSummary: (parsed.executiveSummary as string) || 'Research completed',
      companyOverview: (parsed.companyOverview as string) || '',
      keyDecisionMakers: (parsed.keyDecisionMakers as string) || '',
      digitalPresence: (parsed.digitalPresence as string) || '',
      competitiveLandscape: (parsed.competitiveLandscape as string) || '',
      intentAnalysis: (parsed.intentAnalysis as string) || '',
      leadScore: score,
      leadTier: tier,
      outreachStrategy: (parsed.outreachStrategy as string) || '',
      recommendedActions: Array.isArray(parsed.recommendedActions) 
        ? parsed.recommendedActions as string[] 
        : ['Further research recommended'],
    };
  } catch (error) {
    onProgress({
      stage: 'synthesis',
      label: 'Synthesis',
      status: 'failed',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // Return a basic report even if synthesis fails
    return {
      companyName,
      website,
      industry,
      location,
      executiveSummary: `Research completed for ${companyName}. The AI synthesis encountered an issue, but raw research data is available in the sections below.`,
      companyOverview: companyData?.description || 'Company overview not available',
      keyDecisionMakers: contacts.length > 0 ? `${contacts.length} contacts identified` : 'No contacts found in this research',
      digitalPresence: techStack ? `Technologies detected: ${techStack.technologies.join(', ')}` : 'Technology analysis not available',
      competitiveLandscape: 'Competitive analysis not available',
      intentAnalysis: intentSignals.length > 0 ? `${intentSignals.length} intent signals detected` : 'No intent signals detected',
      leadScore: 25,
      leadTier: 'cold',
      outreachStrategy: 'Additional research recommended before initiating outreach',
      recommendedActions: ['Enrich company data further', 'Find direct contacts', 'Monitor for buying signals'],
    };
  }
}

// ============================================================
// Main Research Pipeline
// ============================================================

/**
 * Execute the full deep research pipeline for a given query.
 * Returns a comprehensive ResearchReport with all gathered intelligence.
 */
export async function executeDeepResearch(
  input: ResearchInput,
  onProgress?: ProgressCallback,
): Promise<ResearchReport> {
  const startTime = Date.now();
  const stages: StageProgress[] = [];
  const sourcesUsed: string[] = [];
  
  const reportProgress = (progress: StageProgress) => {
    // Update existing stage or add new
    const existing = stages.findIndex(s => s.stage === progress.stage);
    if (existing >= 0) {
      stages[existing] = progress;
    } else {
      stages.push(progress);
    }
    onProgress?.(progress);
  };
  
  // Stage 0: Intent Analysis (already done by caller, just report)
  reportProgress({
    stage: 'intent_analysis',
    label: 'Analyzing research intent',
    status: 'completed',
    detail: `Target: ${input.companyName || input.query}`,
  });
  
  // Stage 1: Website Read
  const websiteData = await executeWebsiteRead(input.urls || [], reportProgress);
  if (websiteData) {
    sourcesUsed.push('Jina Reader');
    // Update company name from website if we didn't have one
    if (!input.companyName && websiteData.title) {
      input.companyName = websiteData.title.replace(/^Homepage\s*[-|]\s*/i, '').trim();
    }
  }
  
  // Stage 2: Company Search
  const companyData = await executeCompanySearch(
    input.companyName || '',
    input.urls?.[0],
    input.industry || '',
    input.location || '',
    reportProgress,
  );
  if (companyData?.source) sourcesUsed.push(companyData.source);
  
  // Stage 3: People Search
  const contacts = await executePeopleSearch(
    companyData?.companyName || input.companyName || '',
    input.industry || companyData?.industry || '',
    input.location || '',
    reportProgress,
  );
  
  // Stage 4: News & Social
  const newsAndSocial = await executeNewsAndSocial(
    companyData?.companyName || input.companyName || '',
    reportProgress,
  );
  
  // Stage 5: Intent Signals
  const intentSignals = await executeIntentSignals(
    companyData?.companyName || input.companyName || '',
    input.industry || companyData?.industry || '',
    input.location || '',
    reportProgress,
  );
  
  // Stage 6: Tech Analysis
  const techStack = await executeTechAnalysis(
    input.urls?.[0] || companyData?.website,
    companyData?.companyName || input.companyName || '',
    reportProgress,
  );
  if (techStack) sourcesUsed.push('Tech Analysis');
  
  // Stage 7: Synthesis
  const synthesis = await executeSynthesis(
    input,
    websiteData,
    companyData,
    contacts,
    newsAndSocial,
    techStack,
    intentSignals,
    reportProgress,
  );
  
  reportProgress({
    stage: 'complete',
    label: 'Research complete',
    status: 'completed',
    detail: `Full research report generated for ${synthesis.companyName}`,
  });
  
  const totalDurationMs = Date.now() - startTime;
  
  return {
    ...synthesis,
    websiteRead: websiteData,
    companyData,
    keyContacts: contacts,
    newsAndSocial,
    techStack,
    intentSignals,
    researchStages: stages,
    totalDurationMs,
    sourcesUsed: [...new Set(sourcesUsed)],
  };
}

/**
 * Format a ResearchReport into structured markdown for display.
 */
export function formatResearchReport(report: ResearchReport): string {
  const sections: string[] = [];
  
  // Header
  sections.push(`# Deep Dive Research: ${report.companyName}`);
  sections.push('');
  
  // Lead Score Badge
  const tierEmoji = report.leadTier === 'hot' ? '🔴' : report.leadTier === 'warm' ? '🟡' : '🔵';
  sections.push(`**Lead Score: ${report.leadScore}/100** | **Tier: ${tierEmoji} ${report.leadTier.toUpperCase()}**`);
  
  if (report.website) sections.push(`**Website:** ${report.website}`);
  if (report.industry) sections.push(`**Industry:** ${report.industry}`);
  if (report.location) sections.push(`**Location:** ${report.location}`);
  sections.push(`**Research Duration:** ${(report.totalDurationMs / 1000).toFixed(1)}s | **Sources:** ${report.sourcesUsed.join(', ')}`);
  
  sections.push('');
  sections.push('---');
  sections.push('');
  
  // Executive Summary
  sections.push('## Executive Summary');
  sections.push(report.executiveSummary);
  sections.push('');
  
  // Company Overview
  if (report.companyOverview) {
    sections.push('## Company Overview');
    sections.push(report.companyOverview);
    sections.push('');
  }
  
  // Key Decision Makers
  if (report.keyContacts.length > 0 || report.keyDecisionMakers) {
    sections.push('## Key Decision Makers');
    if (report.keyDecisionMakers) {
      sections.push(report.keyDecisionMakers);
    }
    if (report.keyContacts.length > 0) {
      sections.push('');
      for (const contact of report.keyContacts) {
        sections.push(`- **${contact.name}**${contact.title ? ` — ${contact.title}` : ''}${contact.linkedinUrl ? ` [LinkedIn](${contact.linkedinUrl})` : ''}`);
        if (contact.snippet) sections.push(`  ${contact.snippet.slice(0, 200)}`);
      }
    }
    sections.push('');
  }
  
  // Digital Presence
  if (report.digitalPresence || report.techStack) {
    sections.push('## Digital Presence & Technology');
    if (report.digitalPresence) sections.push(report.digitalPresence);
    if (report.techStack && report.techStack.technologies.length > 0) {
      sections.push('');
      sections.push(`**Tech Stack:** ${report.techStack.technologies.join(', ')}`);
      if (report.techStack.platform) sections.push(`**Platform:** ${report.techStack.platform}`);
      if (report.techStack.hosting) sections.push(`**Hosting:** ${report.techStack.hosting}`);
      if (report.techStack.analytics?.length) sections.push(`**Analytics:** ${report.techStack.analytics.join(', ')}`);
    }
    sections.push('');
  }
  
  // Competitive Landscape
  if (report.competitiveLandscape) {
    sections.push('## Competitive Landscape');
    sections.push(report.competitiveLandscape);
    sections.push('');
  }
  
  // Intent Analysis
  if (report.intentAnalysis || report.intentSignals.length > 0) {
    sections.push('## Intent Signals & Buying Indicators');
    if (report.intentAnalysis) sections.push(report.intentAnalysis);
    if (report.intentSignals.length > 0) {
      sections.push('');
      for (const signal of report.intentSignals) {
        const badge = signal.confidence === 'high' ? 'HIGH' : signal.confidence === 'medium' ? 'MED' : 'LOW';
        sections.push(`- **[${badge}]** ${signal.type}: ${signal.description}`);
      }
    }
    sections.push('');
  }
  
  // News & Social
  if (report.newsAndSocial.length > 0) {
    sections.push('## Recent News & Activity');
    for (const item of report.newsAndSocial.slice(0, 5)) {
      const catBadge = item.category.toUpperCase();
      sections.push(`- **[${catBadge}]** [${item.title}](${item.url})${item.date ? ` — ${item.date}` : ''}`);
      if (item.snippet) sections.push(`  ${item.snippet.slice(0, 200)}`);
    }
    sections.push('');
  }
  
  // Contact Info from Website
  if (report.websiteRead?.emails?.length || report.websiteRead?.phones?.length) {
    sections.push('## Direct Contact Information');
    if (report.websiteRead.emails?.length) {
      sections.push(`**Emails:** ${report.websiteRead.emails.join(', ')}`);
    }
    if (report.websiteRead.phones?.length) {
      sections.push(`**Phones:** ${report.websiteRead.phones.join(', ')}`);
    }
    sections.push('');
  }
  
  // Outreach Strategy
  if (report.outreachStrategy) {
    sections.push('## Recommended Outreach Strategy');
    sections.push(report.outreachStrategy);
    sections.push('');
  }
  
  // Recommended Actions
  if (report.recommendedActions.length > 0) {
    sections.push('## Recommended Next Steps');
    for (let i = 0; i < report.recommendedActions.length; i++) {
      sections.push(`${i + 1}. ${report.recommendedActions[i]}`);
    }
    sections.push('');
  }
  
  return sections.join('\n');
}
