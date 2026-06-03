/**
 * @deprecated This file is kept for backward compatibility.
 * Import from @/lib/blog-metadata for types and metadata,
 * or from @/lib/blog-registry for async data access with lazy-loading.
 */

// Re-export types
export type { BlogCategory, BlogPostSection, BlogPost } from '@/lib/blog-metadata';
export type { BlogPostMeta } from '@/lib/blog-metadata';

// Re-export constants
export { CATEGORIES, POPULAR_TAGS, CATEGORY_COLORS, BLOG_POSTS_META } from '@/lib/blog-metadata';

// Re-export async functions (signatures changed - now async)
export { getBlogPostBySlug, getRelatedPosts, getAllBlogSlugs } from '@/lib/blog-registry';

/**
 * @deprecated Use BLOG_POSTS_META from @/lib/blog-metadata for listing pages,
 * or getBlogPostBySlug() from @/lib/blog-registry for detail pages.
 * 
 * BLOG_POSTS is no longer available as a synchronous export because
 * post sections are now lazy-loaded to reduce webpack memory usage.
 * To get all posts with sections, use getAllBlogPosts():
 */
export async function getAllBlogPosts() {
  const { BLOG_POSTS_META } = await import('@/lib/blog-metadata');
  const posts = await Promise.all(
    BLOG_POSTS_META.map(async (meta) => {
      const loader = (await import('@/lib/blog-registry')).getBlogPostBySlug;
      const post = await loader(meta.slug);
      return post!;
    })
  );
  return posts;
}
