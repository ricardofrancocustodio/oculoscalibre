import type { MetadataRoute } from 'next';
import { getPublishedPosts } from '@/lib/db';
import { parsePostPath } from '@/lib/slug';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oculoscalibre.com.br';

function absoluteUrl(path: string): string {
  const normalizedBase = SITE_URL.replace(/\/$/, '');
  return `${normalizedBase}${path.startsWith('/') ? path : `/${path}`}`;
}

function collectBlogTopicPaths(postSlugs: string[]): string[] {
  const topicPaths = new Set<string>();

  for (const slug of postSlugs) {
    const parsed = parsePostPath(slug);
    let currentPath = '';

    for (const segment of parsed.topicSegments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      topicPaths.add(currentPath);
    }
  }

  return [...topicPaths].sort((left, right) => left.localeCompare(right));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();
  const now = new Date();
  const topicPaths = collectBlogTopicPaths(posts.map((post) => post.slug));

  return [
    {
      url: absoluteUrl('/'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: absoluteUrl('/blog'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...topicPaths.map((topicPath) => ({
      url: absoluteUrl(`/blog/${topicPath}`),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.72,
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.64,
    })),
  ];
}
