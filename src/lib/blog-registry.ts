import { BLOG_POSTS_META, type BlogPost, type BlogPostMeta, type BlogPostSection } from '@/lib/blog-metadata';

/**
 * Dynamic import map for blog post sections.
 * Each post's content is loaded on-demand only when that specific post is requested.
 * This dramatically reduces initial memory footprint — only ~19KB of metadata loads at startup
 * instead of the full ~200KB of all post content.
 */
const postImporters: Record<string, () => Promise<{ sections: BlogPostSection[] }>> = {
  'autonomous-ai-agents-revolutionizing-b2b-lead-generation': () =>
    import('@/lib/blog-posts/autonomous-ai-agents-revolutionizing-b2b-lead-generation'),
  'complete-guide-multi-channel-lead-research-2026': () =>
    import('@/lib/blog-posts/complete-guide-multi-channel-lead-research-2026'),
  'building-ideal-customer-profile-ai-agents-use': () =>
    import('@/lib/blog-posts/building-ideal-customer-profile-ai-agents-use'),
  'agent-reach-ai-agents-internet-access-17-channels': () =>
    import('@/lib/blog-posts/agent-reach-ai-agents-internet-access-17-channels'),
  'lead-scoring-age-of-ai-beyond-manual-qualification': () =>
    import('@/lib/blog-posts/lead-scoring-age-of-ai-beyond-manual-qualification'),
  'getting-started-with-leadreach-ai-step-by-step-tutorial': () =>
    import('@/lib/blog-posts/getting-started-with-leadreach-ai-step-by-step-tutorial'),
  'why-personalized-outreach-outperforms-templates-300-percent': () =>
    import('@/lib/blog-posts/why-personalized-outreach-outperforms-templates-300-percent'),
  'orchestrator-agent-how-8-ai-agents-work-together': () =>
    import('@/lib/blog-posts/orchestrator-agent-how-8-ai-agents-work-together'),
  'setting-up-automated-follow-up-sequences-that-convert': () =>
    import('@/lib/blog-posts/setting-up-automated-follow-up-sequences-that-convert'),
  'data-enrichment-turning-raw-leads-into-actionable-intelligence': () =>
    import('@/lib/blog-posts/data-enrichment-turning-raw-leads-into-actionable-intelligence'),
  'how-leadreach-ai-helps-sales-agencies-scale-pipeline': () =>
    import('@/lib/blog-posts/how-leadreach-ai-helps-sales-agencies-scale-pipeline'),
  'the-discovery-agent-finding-hidden-gems-across-17-channels': () =>
    import('@/lib/blog-posts/the-discovery-agent-finding-hidden-gems-across-17-channels'),
  'b2b-sales-automation-without-losing-the-human-touch': () =>
    import('@/lib/blog-posts/b2b-sales-automation-without-losing-the-human-touch'),
  'how-to-write-cold-emails-that-actually-get-replies-using-ai': () =>
    import('@/lib/blog-posts/how-to-write-cold-emails-that-actually-get-replies-using-ai'),
  'building-predictable-pipeline-with-ai-powered-lead-generation': () =>
    import('@/lib/blog-posts/building-predictable-pipeline-with-ai-powered-lead-generation'),
  'leadreach-ai-for-startups-from-zero-to-pipeline-in-30-days': () =>
    import('@/lib/blog-posts/leadreach-ai-for-startups-from-zero-to-pipeline-in-30-days'),
  'the-enrichment-agent-building-complete-company-profiles-automatically': () =>
    import('@/lib/blog-posts/the-enrichment-agent-building-complete-company-profiles-automatically'),
  'roi-of-ai-lead-generation-framework-for-measuring-impact': () =>
    import('@/lib/blog-posts/roi-of-ai-lead-generation-framework-for-measuring-impact'),
};

/**
 * Cache for loaded sections to avoid re-importing the same module.
 * Once a post's content is loaded, it stays in memory for subsequent requests.
 */
const sectionsCache = new Map<string, BlogPostSection[]>();

/**
 * Get a full blog post (metadata + sections) by slug.
 * Uses dynamic imports to load only the requested post's content.
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const meta = BLOG_POSTS_META.find((post) => post.slug === slug);
  if (!meta) return null;

  // Check cache first
  if (sectionsCache.has(slug)) {
    return { ...meta, sections: sectionsCache.get(slug)! };
  }

  // Dynamic import — only loads this specific post's content
  const importer = postImporters[slug];
  if (!importer) return null;

  try {
    const module = await importer();
    sectionsCache.set(slug, module.sections);
    return { ...meta, sections: module.sections };
  } catch (error) {
    console.error(`[LeadReach] Failed to load blog post content for slug: ${slug}`, error);
    return null;
  }
}

/**
 * Get related posts for a given slug (same category, excluding current).
 * Returns only metadata (no sections loaded).
 */
export async function getRelatedPosts(
  slug: string,
  count: number = 3
): Promise<BlogPostMeta[]> {
  const meta = BLOG_POSTS_META.find((post) => post.slug === slug);
  if (!meta) return [];

  return BLOG_POSTS_META.filter(
    (post) => post.slug !== slug && post.category === meta.category
  ).slice(0, count);
}

/**
 * Get all unique slugs for static generation.
 */
export function getAllBlogSlugs(): string[] {
  return BLOG_POSTS_META.map((post) => post.slug);
}

/**
 * Synchronous accessor for blog post metadata.
 * Useful for components that only need metadata (no content).
 */
export function getBlogPostMetaBySlug(slug: string): BlogPostMeta | undefined {
  return BLOG_POSTS_META.find((post) => post.slug === slug);
}

// Re-export for convenience
export { BLOG_POSTS_META, CATEGORY_COLORS, CATEGORIES, POPULAR_TAGS } from '@/lib/blog-metadata';
export type { BlogCategory, BlogPostSection, BlogPost, BlogPostMeta } from '@/lib/blog-metadata';
