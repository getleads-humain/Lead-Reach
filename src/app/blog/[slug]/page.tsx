import { getBlogPostBySlug, getRelatedPosts, BLOG_POSTS_META } from '@/lib/blog-registry';
import { CATEGORY_COLORS } from '@/lib/blog-metadata';
import { notFound } from 'next/navigation';
import { BlogPostContent } from './blog-post-content';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(slug, 3);
  const otherPosts = BLOG_POSTS_META.filter((p) => p.id !== post.id).slice(0, 6);

  return (
    <BlogPostContent
      post={post}
      relatedPosts={relatedPosts}
      otherPosts={otherPosts}
      categoryColors={CATEGORY_COLORS}
    />
  );
}
