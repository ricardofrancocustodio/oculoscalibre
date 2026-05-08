export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

export interface ParsedPostPath {
  topicPath: string;
  topicSegments: string[];
  articleSlug: string;
  siloSlug: string | null;
  clusterSegments: string[];
  isHierarchical: boolean;
}

export function normalizeTopicPath(input: string): string {
  return input
    .split('/')
    .map((segment) => slugify(segment))
    .filter(Boolean)
    .join('/');
}

export function buildPostPath(topicPath: string, articleSlug: string): string {
  const normalizedTopicPath = normalizeTopicPath(topicPath);
  const normalizedArticleSlug = slugify(articleSlug);

  if (!normalizedArticleSlug) return normalizedTopicPath;
  if (!normalizedTopicPath) return normalizedArticleSlug;

  return `${normalizedTopicPath}/${normalizedArticleSlug}`;
}

export function parsePostPath(input: string): ParsedPostPath {
  const segments = input.split('/').map((segment) => segment.trim()).filter(Boolean);

  if (segments.length <= 1) {
    return {
      topicPath: '',
      topicSegments: [],
      articleSlug: segments[0] ?? '',
      siloSlug: null,
      clusterSegments: [],
      isHierarchical: false,
    };
  }

  const topicSegments = segments.slice(0, -1);

  return {
    topicPath: topicSegments.join('/'),
    topicSegments,
    articleSlug: segments[segments.length - 1],
    siloSlug: topicSegments[0] ?? null,
    clusterSegments: topicSegments.slice(1),
    isHierarchical: true,
  };
}

export function humanizeSlugSegment(segment: string): string {
  return segment
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function readingTimeMinutes(markdown: string): number {
  const words = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#>*_`~\-\[\]\(\)!]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatDateBR(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
