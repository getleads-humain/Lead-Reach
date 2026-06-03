export type BlogCategory = 'All' | 'AI Agents' | 'Lead Generation' | 'Sales Intelligence' | 'Tutorials';

export interface BlogPostSection {
  type: 'h2' | 'h3' | 'paragraph' | 'list' | 'image' | 'quote' | 'callout' | 'code';
  content?: string;
  items?: string[];
  src?: string;
  alt?: string;
  caption?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  date: string;
  readTime: string;
  author: string;
  authorRole: string;
  gradient: string;
  heroImage: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  sections: BlogPostSection[];
}

export type BlogPostMeta = Omit<BlogPost, 'sections'>;

export const CATEGORIES: BlogCategory[] = ['All', 'AI Agents', 'Lead Generation', 'Sales Intelligence', 'Tutorials'];

export const POPULAR_TAGS = [
  'AI Agents', 'Lead Scoring', 'Outreach', 'B2B Sales', 'Multi-Channel',
  'Automation', 'ICP', 'Data Enrichment', 'Pipeline', 'Agent-Reach',
  'Prospecting', 'Personalization', 'Agency', 'Email', 'ROI', 'Forecasting',
  'Startups', 'Discovery', 'Firmographics',
];

export const CATEGORY_COLORS: Record<string, string> = {
  'AI Agents': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Lead Generation': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Sales Intelligence': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Tutorials': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export const BLOG_POSTS_META: BlogPostMeta[] = [
{
    id: '1',
    slug: 'autonomous-ai-agents-revolutionizing-b2b-lead-generation',
    title: 'How Autonomous AI Agents Are Revolutionizing B2B Lead Generation',
    excerpt: 'Discover how multi-agent systems are replacing traditional SDR teams with always-on, intelligent lead research and outreach that scales without limits.',
    category: 'AI Agents',
    date: 'Jan 15, 2026',
    readTime: '8 min read',
    author: 'Sarah Chen',
    authorRole: 'VP of Product',
    gradient: 'from-emerald-500/20 to-cyan-500/20',
    heroImage: '/blog/hero-ai-agents-revolutionizing.png',
    tags: ['AI Agents', 'Lead Generation', 'Automation', 'B2B Sales', 'SDR'],
    seoTitle: 'How Autonomous AI Agents Are Revolutionizing B2B Lead Generation in 2026',
    seoDescription: 'Learn how multi-agent AI systems are replacing traditional SDR teams with always-on, intelligent lead research and outreach. Discover the future of B2B lead generation with autonomous agents.'
  },

{
    id: '2',
    slug: 'complete-guide-multi-channel-lead-research-2026',
    title: 'The Complete Guide to Multi-Channel Lead Research in 2026',
    excerpt: 'Learn why the most successful sales teams research prospects across LinkedIn, GitHub, Twitter, Reddit, and 13+ other channels simultaneously.',
    category: 'Lead Generation',
    date: 'Jan 12, 2026',
    readTime: '12 min read',
    author: 'Marcus Rodriguez',
    authorRole: 'Head of Growth',
    gradient: 'from-violet-500/20 to-pink-500/20',
    heroImage: '/blog/hero-multi-channel-research.png',
    tags: ['Multi-Channel', 'Lead Generation', 'Prospecting', 'Data Enrichment', 'Agent-Reach'],
    seoTitle: 'Multi-Channel Lead Research Guide 2026: 17+ Channels for B2B Prospecting',
    seoDescription: 'Master multi-channel B2B lead research in 2026. Learn how to prospect across LinkedIn, GitHub, Twitter, Reddit, and 13+ other channels simultaneously using AI agents for comprehensive lead intelligence.'
  },

{
    id: '3',
    slug: 'building-ideal-customer-profile-ai-agents-use',
    title: 'Building an Ideal Customer Profile That AI Agents Actually Use',
    excerpt: 'Your ICP is only as good as how well your AI agents can interpret it. Here is how to define criteria that machines and humans both understand.',
    category: 'Lead Generation',
    date: 'Jan 8, 2026',
    readTime: '6 min read',
    author: 'Aisha Patel',
    authorRole: 'CEO',
    gradient: 'from-amber-500/20 to-orange-500/20',
    heroImage: '/blog/hero-icp-builder.png',
    tags: ['ICP', 'AI Agents', 'Lead Generation', 'Prospecting', 'Automation'],
    seoTitle: 'How to Build an ICP That AI Agents Can Actually Use for Lead Generation',
    seoDescription: 'Learn how to create an Ideal Customer Profile that AI agents can interpret and act on effectively. Discover the key criteria, structure, and best practices for machine-readable ICPs.'
  },

{
    id: '4',
    slug: 'agent-reach-ai-agents-internet-access-17-channels',
    title: 'Agent-Reach: How We Give AI Agents Internet Access Across 17+ Channels',
    excerpt: 'A deep technical dive into our Agent-Reach architecture that provides zero-config web reading, semantic search, and social media data access.',
    category: 'AI Agents',
    date: 'Jan 5, 2026',
    readTime: '15 min read',
    author: 'James Kim',
    authorRole: 'CTO',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    heroImage: '/blog/hero-agent-reach.png',
    tags: ['Agent-Reach', 'AI Agents', 'Automation', 'Multi-Channel', 'Data Enrichment'],
    seoTitle: 'Agent-Reach Architecture: How LeadReach AI Agents Access 17+ Internet Channels',
    seoDescription: 'Deep technical dive into Agent-Reach, the architecture that gives LeadReach AI agents zero-config internet access across 17+ channels for web reading, semantic search, and social media data retrieval.'
  },

{
    id: '5',
    slug: 'lead-scoring-age-of-ai-beyond-manual-qualification',
    title: 'Lead Scoring in the Age of AI: Moving Beyond Manual Qualification',
    excerpt: 'Manual lead scoring is dead. Learn how AI-driven qualification uses real-time signals, behavioral patterns, and firmographic matching to prioritize leads.',
    category: 'Sales Intelligence',
    date: 'Dec 28, 2025',
    readTime: '7 min read',
    author: 'Elena Torres',
    authorRole: 'Data Science Lead',
    gradient: 'from-rose-500/20 to-red-500/20',
    heroImage: '/blog/hero-lead-scoring.png',
    tags: ['Lead Scoring', 'AI Agents', 'Sales Intelligence', 'Pipeline', 'Automation'],
    seoTitle: 'AI Lead Scoring: Moving Beyond Manual Qualification in 2026',
    seoDescription: 'Discover how AI-driven lead scoring replaces manual qualification with real-time behavioral signals, firmographic matching, and predictive models. Learn why traditional scoring fails and how AI transforms your pipeline.'
  },

{
    id: '6',
    slug: 'getting-started-with-leadreach-ai-step-by-step-tutorial',
    title: 'Getting Started with LeadReach AI: A Step-by-Step Tutorial',
    excerpt: 'From signup to your first batch of qualified leads. This comprehensive tutorial walks you through setting up your ICP, deploying agents, and reviewing results.',
    category: 'Tutorials',
    date: 'Dec 22, 2025',
    readTime: '10 min read',
    author: 'David Park',
    authorRole: 'Customer Success',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    heroImage: '/blog/hero-getting-started.png',
    tags: ['Tutorials', 'ICP', 'AI Agents', 'Automation', 'Pipeline'],
    seoTitle: 'Getting Started with LeadReach AI: Complete Step-by-Step Tutorial 2026',
    seoDescription: 'Complete step-by-step tutorial for LeadReach AI. Learn how to set up your ICP, deploy AI agents, configure outreach campaigns, and review qualified leads — from signup to results.'
  },

{
    id: '7',
    slug: 'why-personalized-outreach-outperforms-templates-300-percent',
    title: 'Why Personalized Outreach Outperforms Templates by 300%',
    excerpt: 'We analyzed 50,000 outreach messages and found that AI-personalized emails had 3x the reply rate. Here is what makes the difference.',
    category: 'Sales Intelligence',
    date: 'Dec 18, 2025',
    readTime: '9 min read',
    author: 'Sarah Chen',
    authorRole: 'VP of Product',
    gradient: 'from-indigo-500/20 to-violet-500/20',
    heroImage: '/blog/hero-personalized-outreach.png',
    tags: ['Personalization', 'Outreach', 'Sales Intelligence', 'B2B Sales', 'AI Agents'],
    seoTitle: 'Why Personalized Outreach Outperforms Templates by 300% — Data Analysis',
    seoDescription: 'Analysis of 50,000 B2B outreach messages reveals AI-personalized emails achieve 3x higher reply rates than templates. Discover the specific personalization techniques that drive results.'
  },

{
    id: '8',
    slug: 'orchestrator-agent-how-8-ai-agents-work-together',
    title: 'The Orchestrator Agent: How 8 AI Agents Work Together',
    excerpt: 'Behind the scenes of our multi-agent architecture. Learn how the Orchestrator coordinates discovery, enrichment, qualification, and outreach in perfect harmony.',
    category: 'AI Agents',
    date: 'Dec 14, 2025',
    readTime: '11 min read',
    author: 'James Kim',
    authorRole: 'CTO',
    gradient: 'from-purple-500/20 to-fuchsia-500/20',
    heroImage: '/blog/hero-orchestrator.png',
    tags: ['AI Agents', 'Automation', 'Pipeline', 'Agent-Reach', 'Orchestrator'],
    seoTitle: 'The Orchestrator Agent: How LeadReach 8 AI Agents Coordinate Lead Generation',
    seoDescription: 'Deep dive into LeadReach\'s multi-agent architecture. Learn how the Orchestrator Agent coordinates 8 specialized AI agents — discovery, enrichment, qualification, personalization, outreach, and more — for seamless B2B lead generation.'
  },

{
    id: '9',
    slug: 'setting-up-automated-follow-up-sequences-that-convert',
    title: 'Setting Up Automated Follow-Up Sequences That Convert',
    excerpt: 'Most deals are won in the follow-up. Learn how to configure AI-driven sequences that adapt timing, channel, and messaging based on engagement signals.',
    category: 'Tutorials',
    date: 'Dec 10, 2025',
    readTime: '8 min read',
    author: 'David Park',
    authorRole: 'Customer Success',
    gradient: 'from-sky-500/20 to-cyan-500/20',
    heroImage: '/blog/hero-follow-up-sequences.png',
    tags: ['Tutorials', 'Outreach', 'Automation', 'Pipeline', 'Personalization'],
    seoTitle: 'How to Set Up Automated Follow-Up Sequences That Convert — LeadReach Tutorial',
    seoDescription: 'Learn how to configure AI-driven follow-up sequences that adapt timing, channel, and messaging based on engagement signals. Complete tutorial with best practices for B2B follow-up automation.'
  },

{
    id: '10',
    slug: 'data-enrichment-turning-raw-leads-into-actionable-intelligence',
    title: 'Data Enrichment: Turning Raw Leads into Actionable Intelligence',
    excerpt: 'How LeadReach\'s Enrichment Agent takes raw company names and transforms them into rich profiles with firmographics, technographics, funding data, and buying signals.',
    category: 'Lead Generation',
    date: 'Dec 5, 2025',
    readTime: '7 min read',
    author: 'Marcus Rodriguez',
    authorRole: 'Head of Growth',
    gradient: 'from-teal-500/20 to-emerald-500/20',
    heroImage: '/blog/hero-data-enrichment.png',
    tags: ['Data Enrichment', 'Lead Generation', 'AI Agents', 'Firmographics', 'Technographics'],
    seoTitle: 'Data Enrichment: Turning Raw Leads into Actionable Intelligence | LeadReach',
    seoDescription: 'Discover how LeadReach\'s Enrichment Agent transforms raw company names into rich profiles with firmographics, technographics, funding data, key contacts, and buying signals for smarter B2B outreach.'
  },

{
    id: '11',
    slug: 'how-leadreach-ai-helps-sales-agencies-scale-pipeline',
    title: 'How LeadReach AI Helps Sales Agencies Scale Their Pipeline',
    excerpt: 'Sales agencies and outsourced SDR teams face unique challenges: multiple clients, unique ICPs, and the need to scale without adding headcount. Here is how LeadReach makes it possible.',
    category: 'Sales Intelligence',
    date: 'Dec 1, 2025',
    readTime: '9 min read',
    author: 'Aisha Patel',
    authorRole: 'CEO',
    gradient: 'from-rose-500/20 to-pink-500/20',
    heroImage: '/blog/hero-agency-pipeline.png',
    tags: ['B2B Sales', 'Agency', 'Pipeline', 'Automation', 'Multi-Channel'],
    seoTitle: 'How LeadReach AI Helps Sales Agencies Scale Their Pipeline | LeadReach Blog',
    seoDescription: 'Discover how sales agencies and outsourced SDR teams use LeadReach AI to serve multiple clients simultaneously with unique ICPs, automate prospecting, and scale pipeline without adding headcount.'
  },

{
    id: '12',
    slug: 'the-discovery-agent-finding-hidden-gems-across-17-channels',
    title: 'The Discovery Agent: Finding Hidden Gems Across 17+ Channels',
    excerpt: 'A deep dive into how the Discovery Agent works — its search strategies, channel prioritization, and how it identifies leads that traditional tools consistently miss.',
    category: 'AI Agents',
    date: 'Nov 25, 2025',
    readTime: '10 min read',
    author: 'James Kim',
    authorRole: 'CTO',
    gradient: 'from-blue-500/20 to-indigo-500/20',
    heroImage: '/blog/hero-discovery-agent.png',
    tags: ['AI Agents', 'Discovery', 'Multi-Channel', 'Prospecting', 'Agent-Reach'],
    seoTitle: 'The Discovery Agent: Finding Hidden Gems Across 17+ Channels | LeadReach',
    seoDescription: 'Deep dive into how LeadReach\'s Discovery Agent searches 17+ channels simultaneously, prioritizes sources, and identifies B2B leads that traditional prospecting tools consistently miss.'
  },

{
    id: '13',
    slug: 'b2b-sales-automation-without-losing-the-human-touch',
    title: 'B2B Sales Automation Without Losing the Human Touch',
    excerpt: 'How LeadReach automates the tedious parts of sales while preserving genuine human connection in outreach. The balance between scale and personalization.',
    category: 'Lead Generation',
    date: 'Nov 20, 2025',
    readTime: '8 min read',
    author: 'Sarah Chen',
    authorRole: 'VP of Product',
    gradient: 'from-orange-500/20 to-red-500/20',
    heroImage: '/blog/hero-human-touch.png',
    tags: ['Automation', 'Personalization', 'B2B Sales', 'Outreach', 'AI Agents'],
    seoTitle: 'B2B Sales Automation Without Losing the Human Touch | LeadReach Blog',
    seoDescription: 'Learn how LeadReach automates tedious sales tasks while preserving genuine human connection. Discover the balance between scale and personalization in B2B outreach automation.'
  },

{
    id: '14',
    slug: 'how-to-write-cold-emails-that-actually-get-replies-using-ai',
    title: 'How to Write Cold Emails That Actually Get Replies Using AI',
    excerpt: 'The science behind AI-personalized cold emails — what makes them work, template analysis, and how LeadReach\'s Personalization Agent crafts messages that get replies.',
    category: 'Sales Intelligence',
    date: 'Nov 15, 2025',
    readTime: '11 min read',
    author: 'Elena Torres',
    authorRole: 'Data Science Lead',
    gradient: 'from-pink-500/20 to-rose-500/20',
    heroImage: '/blog/hero-cold-emails.png',
    tags: ['Outreach', 'Personalization', 'Email', 'AI', 'B2B Sales'],
    seoTitle: 'How to Write Cold Emails That Actually Get Replies Using AI | LeadReach',
    seoDescription: 'Discover the science behind AI-personalized cold emails that get replies. Learn what makes them work, template analysis, and how LeadReach\'s Personalization Agent crafts high-converting messages.'
  },

{
    id: '15',
    slug: 'building-predictable-pipeline-with-ai-powered-lead-generation',
    title: 'Building a Predictable Pipeline with AI-Powered Lead Generation',
    excerpt: 'How to go from unpredictable pipeline generation to a data-driven, always-on lead engine using LeadReach AI — with pipeline analytics, forecasting, and consistency.',
    category: 'Lead Generation',
    date: 'Nov 10, 2025',
    readTime: '8 min read',
    author: 'Marcus Rodriguez',
    authorRole: 'Head of Growth',
    gradient: 'from-lime-500/20 to-green-500/20',
    heroImage: '/blog/hero-predictable-pipeline.png',
    tags: ['Pipeline', 'Lead Generation', 'Automation', 'B2B Sales', 'Forecasting'],
    seoTitle: 'Building a Predictable Pipeline with AI-Powered Lead Generation | LeadReach',
    seoDescription: 'Learn how to build a predictable, data-driven B2B pipeline using AI-powered lead generation. Discover pipeline analytics, forecasting techniques, and how LeadReach creates always-on lead engines.'
  },

{
    id: '16',
    slug: 'leadreach-ai-for-startups-from-zero-to-pipeline-in-30-days',
    title: 'LeadReach AI for Startups: From Zero to Pipeline in 30 Days',
    excerpt: 'A step-by-step guide for early-stage startups to go from no pipeline to consistent lead flow using LeadReach — covering onboarding, ICP setup, first campaign, and iterating.',
    category: 'Tutorials',
    date: 'Nov 5, 2025',
    readTime: '13 min read',
    author: 'David Park',
    authorRole: 'Customer Success',
    gradient: 'from-yellow-500/20 to-amber-500/20',
    heroImage: '/blog/hero-startups.png',
    tags: ['Tutorials', 'Startups', 'Lead Generation', 'Getting Started', 'Pipeline'],
    seoTitle: 'LeadReach AI for Startups: From Zero to Pipeline in 30 Days | LeadReach Blog',
    seoDescription: 'Step-by-step guide for early-stage startups to build a consistent lead pipeline using LeadReach AI in 30 days. Covers onboarding, ICP setup, first campaign, and iteration strategies.'
  },

{
    id: '17',
    slug: 'the-enrichment-agent-building-complete-company-profiles-automatically',
    title: 'The Enrichment Agent: Building Complete Company Profiles Automatically',
    excerpt: 'How the Enrichment Agent gathers data from 17+ channels to build comprehensive company profiles — technology stacks, funding, hiring, and key contacts.',
    category: 'AI Agents',
    date: 'Oct 28, 2025',
    readTime: '10 min read',
    author: 'James Kim',
    authorRole: 'CTO',
    gradient: 'from-sky-500/20 to-blue-500/20',
    heroImage: '/blog/hero-enrichment-agent.png',
    tags: ['AI Agents', 'Data Enrichment', 'Firmographics', 'Automation'],
    seoTitle: 'The Enrichment Agent: Building Complete Company Profiles Automatically | LeadReach',
    seoDescription: 'Learn how LeadReach\'s Enrichment Agent automatically builds comprehensive company profiles from 17+ channels — gathering technology stacks, funding data, hiring patterns, and key contacts.'
  },

{
    id: '18',
    slug: 'roi-of-ai-lead-generation-framework-for-measuring-impact',
    title: 'ROI of AI Lead Generation: A Framework for Measuring Impact',
    excerpt: 'How to measure the ROI of AI-powered lead generation — cost per lead, time savings, pipeline velocity, conversion rates, and comparing against traditional SDR costs.',
    category: 'Sales Intelligence',
    date: 'Oct 20, 2025',
    readTime: '9 min read',
    author: 'Elena Torres',
    authorRole: 'Data Science Lead',
    gradient: 'from-fuchsia-500/20 to-purple-500/20',
    heroImage: '/blog/hero-roi-framework.png',
    tags: ['ROI', 'Sales Intelligence', 'Analytics', 'Pipeline', 'B2B Sales'],
    seoTitle: 'ROI of AI Lead Generation: A Framework for Measuring Impact | LeadReach',
    seoDescription: 'Learn how to measure the ROI of AI-powered lead generation with a comprehensive framework covering cost per lead, time savings, pipeline velocity, conversion rates, and comparison against traditional SDR costs.'
  }
];
