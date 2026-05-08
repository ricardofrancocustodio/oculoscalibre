import type { Post } from '@/lib/db';
import { formatDateBR, humanizeSlugSegment, parsePostPath, readingTimeMinutes } from '@/lib/slug';

export interface BlogBreadcrumb {
  label: string;
  href: string;
}

export interface BlogPostView extends Post {
  href: string;
  topicPath: string;
  topicSegments: string[];
  topicHref: string | null;
  siloSlug: string | null;
  siloLabel: string;
  topicLabel: string | null;
  clusterSegments: string[];
  breadcrumbs: BlogBreadcrumb[];
  readingTime: number;
  publishedLabel: string | null;
}

export interface BlogClusterSummary {
  topicPath: string;
  label: string;
  href: string;
  count: number;
}

export interface BlogSiloSummary {
  siloSlug: string;
  siloLabel: string;
  href: string;
  totalPosts: number;
  totalClusters: number;
  latestPost: BlogPostView | null;
  posts: BlogPostView[];
  clusters: BlogClusterSummary[];
}

function postTimestamp(post: Pick<Post, 'published_at' | 'created_at'>): number {
  return new Date(post.published_at ?? post.created_at).getTime();
}

function sortPostsDescending<T extends Pick<Post, 'published_at' | 'created_at'>>(posts: T[]): T[] {
  return [...posts].sort((left, right) => postTimestamp(right) - postTimestamp(left));
}

export function getPostHref(slug: string): string {
  return `/blog/${slug}`;
}

export function getTopicHref(topicPath: string): string {
  return `/blog/${topicPath}`;
}

export function toBlogPostView(post: Post): BlogPostView {
  const parsed = parsePostPath(post.slug);
  const breadcrumbs = parsed.topicSegments.map((segment, index) => {
    const topicPath = parsed.topicSegments.slice(0, index + 1).join('/');

    return {
      label: humanizeSlugSegment(segment),
      href: getTopicHref(topicPath),
    };
  });

  return {
    ...post,
    href: getPostHref(post.slug),
    topicPath: parsed.topicPath,
    topicSegments: parsed.topicSegments,
    topicHref: parsed.topicPath ? getTopicHref(parsed.topicPath) : null,
    siloSlug: parsed.siloSlug,
    siloLabel: parsed.siloSlug ? humanizeSlugSegment(parsed.siloSlug) : 'Artigos',
    topicLabel: parsed.topicPath ? humanizeSlugSegment(parsed.topicSegments[parsed.topicSegments.length - 1]) : null,
    clusterSegments: parsed.clusterSegments,
    breadcrumbs,
    readingTime: readingTimeMinutes(post.conteudo_md),
    publishedLabel: post.published_at ? formatDateBR(post.published_at) : null,
  };
}

export function filterPostsForTopic(posts: Post[], topicPath: string): BlogPostView[] {
  const normalizedTopicPath = topicPath.trim().replace(/^\/|\/$/g, '');

  return sortPostsDescending(posts)
    .map(toBlogPostView)
    .filter((post) => post.topicPath === normalizedTopicPath || post.topicPath.startsWith(`${normalizedTopicPath}/`));
}

export function listSilos(posts: Post[]): BlogSiloSummary[] {
  const grouped = new Map<string, BlogPostView[]>();

  for (const post of sortPostsDescending(posts).map(toBlogPostView)) {
    if (!post.siloSlug) continue;
    const current = grouped.get(post.siloSlug) ?? [];
    current.push(post);
    grouped.set(post.siloSlug, current);
  }

  return [...grouped.entries()]
    .map(([siloSlug, siloPosts]) => {
      const uniqueClusters = new Map<string, BlogClusterSummary>();

      for (const post of siloPosts) {
        if (!post.topicPath || post.topicPath === siloSlug) continue;
        if (uniqueClusters.has(post.topicPath)) continue;

        uniqueClusters.set(post.topicPath, {
          topicPath: post.topicPath,
          label: post.breadcrumbs[post.breadcrumbs.length - 1]?.label ?? humanizeSlugSegment(post.topicPath),
          href: getTopicHref(post.topicPath),
          count: siloPosts.filter((candidate) => candidate.topicPath === post.topicPath).length,
        });
      }

      return {
        siloSlug,
        siloLabel: humanizeSlugSegment(siloSlug),
        href: getTopicHref(siloSlug),
        totalPosts: siloPosts.length,
        totalClusters: uniqueClusters.size,
        latestPost: siloPosts[0] ?? null,
        posts: siloPosts,
        clusters: [...uniqueClusters.values()].sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
      };
    })
    .sort((left, right) => right.totalPosts - left.totalPosts || left.siloLabel.localeCompare(right.siloLabel));
}

export function getFlatPosts(posts: Post[]): BlogPostView[] {
  return sortPostsDescending(posts)
    .map(toBlogPostView)
    .filter((post) => !post.siloSlug);
}

export function getRelatedPosts(posts: Post[], currentSlug: string, max = 3): BlogPostView[] {
  const current = toBlogPostView(posts.find((post) => post.slug === currentSlug) ?? (() => {
    throw new Error('Post atual não encontrado para montar relacionados.');
  })());

  const candidates = posts
    .filter((post) => post.slug !== currentSlug)
    .map(toBlogPostView)
    .filter((post) => current.siloSlug && post.siloSlug === current.siloSlug);

  const sameTopic = candidates.filter((post) => post.topicPath === current.topicPath);
  const sameSilo = candidates.filter((post) => post.topicPath !== current.topicPath);

  return [...sameTopic, ...sameSilo].slice(0, max);
}
