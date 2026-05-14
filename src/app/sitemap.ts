import type { MetadataRoute } from 'next';
import { getPublishedPosts } from '@/lib/db';
import { productCatalog } from '@/lib/catalog';
import { parsePostPath } from '@/lib/slug';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.oculoscalibre.com.br';

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

  const latestPostDate = posts.reduce<Date>((acc, post) => {
    const ref = new Date(post.updated_at ?? post.published_at ?? post.created_at);
    return ref > acc ? ref : acc;
  }, new Date(0));
  const blogLastModified = latestPostDate.getTime() > 0 ? latestPostDate : now;

  const lastModifiedByTopic = new Map<string, Date>();
  for (const post of posts) {
    const parsed = parsePostPath(post.slug);
    const postDate = new Date(post.updated_at ?? post.published_at ?? post.created_at);
    let currentPath = '';
    for (const segment of parsed.topicSegments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      const existing = lastModifiedByTopic.get(currentPath);
      if (!existing || postDate > existing) {
        lastModifiedByTopic.set(currentPath, postDate);
      }
    }
  }

  return [
    {
      url: absoluteUrl('/'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...productCatalog.map((product) => ({
      url: absoluteUrl(product.url),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
      images: product.imagens?.length
        ? product.imagens.map((img) => absoluteUrl(img))
        : product.imagemUrl
          ? [absoluteUrl(product.imagemUrl)]
          : undefined,
    })),
    {
      url: absoluteUrl('/guia-de-medidas'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: absoluteUrl('/blog'),
      lastModified: blogLastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...topicPaths.map((topicPath) => ({
      url: absoluteUrl(`/blog/${topicPath}`),
      lastModified: lastModifiedByTopic.get(topicPath) ?? blogLastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.72,
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.updated_at ?? post.published_at ?? post.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.64,
    })),
  ];
}
