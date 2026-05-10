export type SeoIssueLevel = 'error' | 'warning' | 'info';

export interface SeoIssue {
  level: SeoIssueLevel;
  rule: string;
  message: string;
}

export interface SeoMetrics {
  metaTitleLength: number;
  metaDescriptionLength: number;
  wordCount: number;
  keywordOccurrences: number;
  keywordDensity: number;
  h1Count: number;
  h2Count: number;
  imageCount: number;
  imagesMissingAlt: number;
  internalLinks: number;
  externalLinks: number;
}

export interface SeoReviewResult {
  score: number;
  issues: SeoIssue[];
  metrics: SeoMetrics;
}

export interface SeoReviewInput {
  titulo: string;
  resumo: string;
  conteudoMd: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywordPrincipal?: string | null;
  keywordsSecundarias?: string[];
  capaUrl?: string | null;
  coverAlt?: string | null;
  siloPath?: string | null;
}

const META_TITLE_MAX = 60;
const META_DESCRIPTION_MIN = 120;
const META_DESCRIPTION_MAX = 160;
const KEYWORD_DENSITY_MIN = 0.5;
const KEYWORD_DENSITY_MAX = 2.0;
const MIN_WORD_COUNT = 300;
const MIN_INTERNAL_LINKS_SAME_SILO = 2;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function effectiveMetaTitle(input: SeoReviewInput): string {
  return (input.metaTitle?.trim() || input.titulo.trim()) ?? '';
}

function effectiveMetaDescription(input: SeoReviewInput): string {
  return (input.metaDescription?.trim() || input.resumo.trim()) ?? '';
}

function countWords(markdown: string): number {
  const stripped = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#>*_~\-]/g, ' ');
  return stripped.split(/\s+/).filter(Boolean).length;
}

function countKeywordOccurrences(markdown: string, keyword: string): number {
  if (!keyword.trim()) return 0;
  const stripped = markdown.replace(/```[\s\S]*?```/g, ' ');
  const normalizedContent = normalize(stripped);
  const normalizedKeyword = normalize(keyword.trim());
  if (!normalizedKeyword) return 0;

  const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = normalizedContent.match(new RegExp(`\\b${escaped}\\b`, 'g'));
  return matches?.length ?? 0;
}

function countHeadings(markdown: string, level: 1 | 2): number {
  const prefix = '#'.repeat(level);
  const regex = new RegExp(`^${prefix}\\s+\\S`, 'gm');
  return markdown.match(regex)?.length ?? 0;
}

function getH1Text(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function getFirstParagraph(markdown: string): string {
  const stripped = markdown
    .replace(/^#.*$/gm, '')
    .replace(/^>.*$/gm, '')
    .trim();
  const firstParagraph = stripped.split(/\n\s*\n/)[0] ?? '';
  return firstParagraph.trim();
}

function findMarkdownImages(markdown: string): Array<{ alt: string; src: string }> {
  const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const result: Array<{ alt: string; src: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    result.push({ alt: match[1], src: match[2] });
  }
  return result;
}

function findMarkdownLinks(markdown: string): Array<{ label: string; href: string }> {
  const regex = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g;
  const result: Array<{ label: string; href: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    result.push({ label: match[1], href: match[2] });
  }
  return result;
}

function isInternalHref(href: string): boolean {
  if (!href) return false;
  if (href.startsWith('/')) return true;
  if (/^https?:\/\//i.test(href)) {
    try {
      const url = new URL(href);
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://oculoscalibre.com.br';
      const siteHost = new URL(siteUrl).host;
      return url.host === siteHost;
    } catch {
      return false;
    }
  }
  return false;
}

function isSameSiloHref(href: string, siloPath: string | null | undefined): boolean {
  if (!siloPath) return isInternalHref(href);
  if (!isInternalHref(href)) return false;
  const normalizedSilo = siloPath.replace(/^\/|\/$/g, '').split('/')[0];
  if (!normalizedSilo) return true;
  const path = href.startsWith('/') ? href : new URL(href).pathname;
  return path.startsWith(`/blog/${normalizedSilo}`);
}

export function reviewPostSeo(input: SeoReviewInput): SeoReviewResult {
  const issues: SeoIssue[] = [];
  const conteudoMd = input.conteudoMd ?? '';
  const wordCount = countWords(conteudoMd);

  const metaTitle = effectiveMetaTitle(input);
  const metaDescription = effectiveMetaDescription(input);
  const keyword = (input.keywordPrincipal ?? '').trim();
  const keywordOccurrences = countKeywordOccurrences(conteudoMd, keyword);
  const keywordDensity = wordCount > 0 ? (keywordOccurrences / wordCount) * 100 : 0;

  const h1Count = countHeadings(conteudoMd, 1);
  const h2Count = countHeadings(conteudoMd, 2);
  const h1Text = getH1Text(conteudoMd);
  const firstParagraph = getFirstParagraph(conteudoMd);

  const images = findMarkdownImages(conteudoMd);
  const imagesMissingAlt = images.filter((img) => img.alt.trim().length === 0).length;

  const links = findMarkdownLinks(conteudoMd);
  const internalLinks = links.filter((link) => isInternalHref(link.href)).length;
  const externalLinks = links.length - internalLinks;
  const sameSiloInternalLinks = links.filter((link) => isSameSiloHref(link.href, input.siloPath ?? null)).length;

  if (!keyword) {
    issues.push({
      level: 'warning',
      rule: 'keyword.principal',
      message: 'Sem keyword principal definida. Auditoria de densidade e H1 ficou parcial.',
    });
  } else {
    if (h1Text && !normalize(h1Text).includes(normalize(keyword))) {
      issues.push({
        level: 'error',
        rule: 'h1.contains.keyword',
        message: `H1 "${h1Text}" não contém a keyword principal "${keyword}".`,
      });
    }

    if (firstParagraph && !normalize(firstParagraph).includes(normalize(keyword))) {
      issues.push({
        level: 'warning',
        rule: 'intro.contains.keyword',
        message: 'Keyword principal não aparece no primeiro parágrafo. Reposicione naturalmente.',
      });
    }

    if (keywordDensity < KEYWORD_DENSITY_MIN) {
      issues.push({
        level: 'warning',
        rule: 'keyword.density.min',
        message: `Densidade da keyword (${keywordDensity.toFixed(2)}%) abaixo do mínimo recomendado (${KEYWORD_DENSITY_MIN}%).`,
      });
    } else if (keywordDensity > KEYWORD_DENSITY_MAX) {
      issues.push({
        level: 'warning',
        rule: 'keyword.density.max',
        message: `Densidade da keyword (${keywordDensity.toFixed(2)}%) acima do recomendado (${KEYWORD_DENSITY_MAX}%). Risco de keyword stuffing.`,
      });
    }
  }

  if (h1Count !== 1) {
    issues.push({
      level: h1Count === 0 ? 'error' : 'warning',
      rule: 'h1.unique',
      message: h1Count === 0
        ? 'Nenhum H1 encontrado no conteúdo. Adicione um título com "# ".'
        : `Mais de um H1 encontrado (${h1Count}). Mantenha apenas um por página.`,
    });
  }

  if (h2Count < 2) {
    issues.push({
      level: 'warning',
      rule: 'h2.minimum',
      message: `Apenas ${h2Count} H2 detectado${h2Count === 1 ? '' : 's'}. Recomendado pelo menos 2 para escaneabilidade.`,
    });
  }

  if (metaTitle.length === 0) {
    issues.push({ level: 'error', rule: 'meta.title.empty', message: 'Meta title vazio.' });
  } else if (metaTitle.length > META_TITLE_MAX) {
    issues.push({
      level: 'warning',
      rule: 'meta.title.length',
      message: `Meta title tem ${metaTitle.length} caracteres (máx. recomendado ${META_TITLE_MAX}).`,
    });
  }

  if (metaDescription.length === 0) {
    issues.push({ level: 'error', rule: 'meta.description.empty', message: 'Meta description vazia.' });
  } else if (metaDescription.length < META_DESCRIPTION_MIN) {
    issues.push({
      level: 'warning',
      rule: 'meta.description.short',
      message: `Meta description tem ${metaDescription.length} caracteres (recomendado ${META_DESCRIPTION_MIN}–${META_DESCRIPTION_MAX}).`,
    });
  } else if (metaDescription.length > META_DESCRIPTION_MAX) {
    issues.push({
      level: 'warning',
      rule: 'meta.description.long',
      message: `Meta description tem ${metaDescription.length} caracteres (máx. recomendado ${META_DESCRIPTION_MAX}). Será truncada na SERP.`,
    });
  }

  if (input.capaUrl && !(input.coverAlt ?? '').trim()) {
    issues.push({
      level: 'warning',
      rule: 'cover.alt.missing',
      message: 'Capa sem texto alternativo (cover_alt). Importante para acessibilidade e SEO.',
    });
  }

  if (imagesMissingAlt > 0) {
    issues.push({
      level: 'warning',
      rule: 'images.alt.missing',
      message: `${imagesMissingAlt} imagem${imagesMissingAlt === 1 ? '' : 's'} no conteúdo sem texto alternativo.`,
    });
  }

  if (sameSiloInternalLinks < MIN_INTERNAL_LINKS_SAME_SILO) {
    issues.push({
      level: 'warning',
      rule: 'internal.links.same.silo',
      message: `Apenas ${sameSiloInternalLinks} link interno do mesmo silo. Recomendado pelo menos ${MIN_INTERNAL_LINKS_SAME_SILO} para reforçar o cluster temático.`,
    });
  }

  if (wordCount < MIN_WORD_COUNT) {
    issues.push({
      level: 'warning',
      rule: 'content.minimum.length',
      message: `Apenas ${wordCount} palavras. Recomendado mínimo ${MIN_WORD_COUNT} para conteúdo substantivo.`,
    });
  }

  const errorCount = issues.filter((issue) => issue.level === 'error').length;
  const warningCount = issues.filter((issue) => issue.level === 'warning').length;
  const score = Math.max(0, Math.min(100, 100 - errorCount * 20 - warningCount * 5));

  return {
    score,
    issues,
    metrics: {
      metaTitleLength: metaTitle.length,
      metaDescriptionLength: metaDescription.length,
      wordCount,
      keywordOccurrences,
      keywordDensity,
      h1Count,
      h2Count,
      imageCount: images.length,
      imagesMissingAlt,
      internalLinks,
      externalLinks,
    },
  };
}
