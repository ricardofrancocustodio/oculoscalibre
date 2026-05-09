import type { ArticleDraft } from '@/lib/article-writer';
import { buildPostPath, normalizeTopicPath, slugify } from '@/lib/slug';

export interface PublisherPackage {
  titulo: string;
  resumo: string;
  conteudoMarkdown: string;
  tags: string[];
  topicPath: string;
  slug: string;
  postPath: string;
  publicUrl: string;
  checklist: string[];
  warnings: string[];
}

export interface PublisherInput {
  draft: ArticleDraft;
  topicPath: string;
  slugBase: string;
}

function normalizeTags(tags: string[]): string[] {
  return Array.from(new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))).slice(0, 12);
}

export function buildPublisherPackage(input: PublisherInput): PublisherPackage {
  const topicPath = normalizeTopicPath(input.topicPath);
  const slug = slugify(input.slugBase || input.draft.titulo);
  const postPath = buildPostPath(topicPath, slug);
  const warnings: string[] = [];

  if (!topicPath) warnings.push('Definir a estrutura do silo antes de publicar.');
  if (!slug) warnings.push('Definir um slug valido para o artigo.');
  if (!input.draft.conteudoMarkdown.trim()) warnings.push('Conteudo revisado vazio.');
  if (!input.draft.resumo.trim()) warnings.push('Resumo/meta description vazio.');

  return {
    titulo: input.draft.titulo,
    resumo: input.draft.resumo,
    conteudoMarkdown: input.draft.conteudoMarkdown,
    tags: normalizeTags(input.draft.tags),
    topicPath,
    slug,
    postPath,
    publicUrl: postPath ? `/blog/${postPath}` : '/blog/silo/artigo',
    checklist: [
      'Silo normalizado em estrutura hierarquica.',
      'Slug do artigo composto dentro da categoria correta.',
      'Texto revisado pronto para gravacao em Markdown.',
      'Resumo preparado para listagem e meta description.',
      'Tags limitadas e normalizadas para o admin.',
      'Publicacao revalida blog, artigo, paginas do silo e sitemap.',
    ],
    warnings,
  };
}
