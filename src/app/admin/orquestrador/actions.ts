'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { sql, ensurePostsTable } from '@/lib/db';
import { buildPostPath, normalizeTopicPath, parsePostPath, slugify } from '@/lib/slug';
import {
  generateArticleWithLlm,
  reviseArticleWithLlm,
  suggestSiloPath,
  type ReviewIssueForRevision,
  type WriterBrief,
  type WriterResult,
} from '@/lib/article-writer-llm';

export interface PublishOrchestratedPostInput {
  titulo: string;
  resumo: string;
  conteudoMarkdown: string;
  tags: string[];
  topicPath: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  keywordPrincipal?: string;
  keywordsSecundarias?: string[];
  coverAlt?: string;
}

export interface PublishOrchestratedPostResult {
  id: number;
  slug: string;
  publicUrl: string;
  adminUrl: string;
}

async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token || token !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login');
  }
}

function normalizeTags(tags: string[]): string[] {
  return Array.from(new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))).slice(0, 12);
}

function nullableString(value?: string): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed : null;
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let candidate = base || 'post';
  let nextIndex = 1;

  while (true) {
    const rows = (await sql`SELECT id FROM posts WHERE slug = ${candidate} LIMIT 1`) as { id: number }[];
    if (rows.length === 0) return candidate;
    nextIndex += 1;
    candidate = `${base}-${nextIndex}`;
  }
}

function revalidateBlogHierarchy(postPath: string) {
  revalidatePath('/blog');

  if (!postPath) return;

  revalidatePath(`/blog/${postPath}`);

  const parsed = parsePostPath(postPath);
  if (!parsed.topicSegments.length) return;

  let currentPath = '';
  for (const segment of parsed.topicSegments) {
    currentPath = currentPath ? `${currentPath}/${segment}` : segment;
    revalidatePath(`/blog/${currentPath}`);
  }
}

export async function publishOrchestratedPost(input: PublishOrchestratedPostInput): Promise<PublishOrchestratedPostResult> {
  await requireAuth();
  await ensurePostsTable();

  const titulo = input.titulo.trim();
  const resumo = input.resumo.trim();
  const conteudo = input.conteudoMarkdown.trim();
  const topicPath = normalizeTopicPath(input.topicPath);
  const articleSlug = slugify(input.slug || titulo);
  const tags = normalizeTags(input.tags);
  const keywordsSecundarias = (input.keywordsSecundarias ?? [])
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 12);

  if (!titulo || !resumo || !conteudo) {
    throw new Error('Titulo, resumo e conteudo revisado sao obrigatorios para publicar.');
  }

  if (!topicPath) {
    throw new Error('A estrutura do silo e obrigatoria para publicar na categoria correta.');
  }

  const slug = await ensureUniqueSlug(buildPostPath(topicPath, articleSlug));
  const publishedAt = new Date().toISOString();

  const rows = (await sql`
    INSERT INTO posts (
      slug, titulo, resumo, conteudo_md, capa_url, tags, autor, publicado, published_at,
      meta_title, meta_description, keyword_principal, keywords_secundarias, cover_alt
    )
    VALUES (
      ${slug}, ${titulo}, ${resumo}, ${conteudo}, ${null}, ${tags}, ${'@oculoscalibre'}, ${true}, ${publishedAt},
      ${nullableString(input.metaTitle)}, ${nullableString(input.metaDescription)},
      ${nullableString(input.keywordPrincipal)}, ${keywordsSecundarias}, ${nullableString(input.coverAlt)}
    )
    RETURNING id, slug
  `) as { id: number; slug: string }[];

  revalidateBlogHierarchy(rows[0].slug);
  revalidatePath('/sitemap.xml');
  revalidatePath('/blog/feed.xml');

  return {
    id: rows[0].id,
    slug: rows[0].slug,
    publicUrl: `/blog/${rows[0].slug}`,
    adminUrl: `/admin/posts/${rows[0].id}`,
  };
}

export async function generateArticleWithLlmAction(brief: WriterBrief): Promise<WriterResult> {
  await requireAuth();
  return generateArticleWithLlm(brief);
}

export async function reviseArticleWithLlmAction(input: {
  brief: WriterBrief;
  currentMarkdown: string;
  issues: ReviewIssueForRevision[];
}): Promise<WriterResult> {
  await requireAuth();
  return reviseArticleWithLlm(input);
}

export async function suggestSiloPathAction(keyword: string): Promise<string> {
  await requireAuth();
  return suggestSiloPath(keyword);
}
