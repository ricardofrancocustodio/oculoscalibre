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
  suggestPostCluster,
  type ReviewIssueForRevision,
  type WriterBrief,
  type WriterResult,
  type SiloSuggestionInput,
} from '@/lib/article-writer-llm';
import { reviewAndAutoFix, type SeoIssue, type SeoReviewResult } from '@/lib/seo-reviewer';
import type { PostCluster } from './cluster-types';

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

export async function suggestSiloPathAction(input: SiloSuggestionInput): Promise<string> {
  await requireAuth();
  return suggestSiloPath(input);
}

export async function suggestPostClusterAction(
  keyword: string,
  siloPath: string,
  relatedKeywords?: string[],
): Promise<PostCluster> {
  await requireAuth();
  return suggestPostCluster(keyword, siloPath, relatedKeywords);
}

export interface ReviewLoopResult {
  finalMarkdown: string;
  finalTitulo: string;
  finalResumo: string;
  status: 'pass' | 'warn' | 'fail';
  iterations: number;
  finalReview: SeoReviewResult;
  history: Array<{
    iteration: number;
    issues: SeoIssue[];
    deterministicFixes: string[];
    llmUsed: boolean;
    llmInputTokens?: number;
    llmOutputTokens?: number;
    error?: string;
  }>;
}

const REVIEW_MAX_ITERATIONS = 3;

async function runReviewLoopServerSide(input: {
  brief: WriterBrief;
  titulo: string;
  resumo: string;
  conteudoMarkdown: string;
}): Promise<ReviewLoopResult> {
  let currentMd = input.conteudoMarkdown;
  let currentTitulo = input.titulo;
  const history: ReviewLoopResult['history'] = [];
  let lastReview: SeoReviewResult | null = null;

  for (let i = 1; i <= REVIEW_MAX_ITERATIONS; i++) {
    const { review, corrections, updated } = reviewAndAutoFix({
      titulo: currentTitulo,
      resumo: input.resumo,
      conteudoMd: currentMd,
      keywordPrincipal: input.brief.keywordPrincipal,
      keywordsSecundarias: input.brief.keywordsSecundarias,
      siloPath: input.brief.siloPath,
    });

    currentMd = updated.conteudoMd;
    currentTitulo = updated.titulo;
    lastReview = review;

    const hasErrors = review.issues.some((issue) => issue.level === 'error');
    const hasWarnings = review.issues.some((issue) => issue.level === 'warning');

    if (!hasErrors && !hasWarnings) {
      history.push({ iteration: i, issues: review.issues, deterministicFixes: corrections, llmUsed: false });
      return {
        finalMarkdown: currentMd,
        finalTitulo: currentTitulo,
        finalResumo: input.resumo,
        status: 'pass',
        iterations: i,
        finalReview: review,
        history,
      };
    }

    if (i === REVIEW_MAX_ITERATIONS) {
      history.push({ iteration: i, issues: review.issues, deterministicFixes: corrections, llmUsed: false });
      break;
    }

    try {
      const llmResult = await reviseArticleWithLlm({
        brief: input.brief,
        currentMarkdown: currentMd,
        issues: review.issues,
      });
      currentMd = llmResult.conteudoMarkdown;
      const h1Match = currentMd.match(/^#\s+(.+)$/m);
      if (h1Match) currentTitulo = h1Match[1].trim();
      history.push({
        iteration: i,
        issues: review.issues,
        deterministicFixes: corrections,
        llmUsed: true,
        llmInputTokens: llmResult.usage.inputTokens,
        llmOutputTokens: llmResult.usage.outputTokens,
      });
    } catch (error) {
      history.push({
        iteration: i,
        issues: review.issues,
        deterministicFixes: corrections,
        llmUsed: false,
        error: error instanceof Error ? error.message : 'Erro ao chamar IA',
      });
      break;
    }
  }

  const finalReview = lastReview ?? reviewAndAutoFix({
    titulo: currentTitulo,
    resumo: input.resumo,
    conteudoMd: currentMd,
    keywordPrincipal: input.brief.keywordPrincipal,
    keywordsSecundarias: input.brief.keywordsSecundarias,
    siloPath: input.brief.siloPath,
  }).review;
  const finalHasErrors = finalReview.issues.some((issue) => issue.level === 'error');
  const finalHasWarnings = finalReview.issues.some((issue) => issue.level === 'warning');

  return {
    finalMarkdown: currentMd,
    finalTitulo: currentTitulo,
    finalResumo: input.resumo,
    status: finalHasErrors ? 'fail' : finalHasWarnings ? 'warn' : 'pass',
    iterations: history.length,
    finalReview,
    history,
  };
}

export async function reviewArticleLoopAction(input: {
  brief: WriterBrief;
  titulo: string;
  resumo: string;
  conteudoMarkdown: string;
}): Promise<ReviewLoopResult> {
  await requireAuth();
  return runReviewLoopServerSide(input);
}

export interface GeneratedClusterArticle {
  keyword: string;
  tipo: 'pilar' | 'suporte';
  titulo: string;
  conteudoMarkdown: string;
  reviewStatus: 'pass' | 'warn' | 'fail';
  reviewIterations: number;
  reviewIssues: SeoIssue[];
  generationTokens: { input: number; output: number; cacheRead: number };
  reviewTokens: { input: number; output: number };
  siloPath: string;
}

export interface GenerateClusterArticlesInput {
  briefs: Array<{
    brief: WriterBrief;
    tipo: 'pilar' | 'suporte';
    keyword: string;
    resumoBase: string;
  }>;
}

export interface GenerateClusterArticlesResult {
  articles: GeneratedClusterArticle[];
}

export async function generateClusterArticlesAction(
  input: GenerateClusterArticlesInput,
): Promise<GenerateClusterArticlesResult> {
  await requireAuth();

  const articles = await Promise.all(
    input.briefs.map(async ({ brief, tipo, keyword, resumoBase }) => {
      const generation = await generateArticleWithLlm(brief);
      const md = generation.conteudoMarkdown;
      const h1Match = md.match(/^#\s+(.+)$/m);
      const titulo = h1Match ? h1Match[1].trim() : keyword;
      const firstParagraph = md.replace(/^#.*$/gm, '').trim().split(/\n\s*\n/)[0] ?? '';
      const resumo = (resumoBase || firstParagraph.slice(0, 160)).slice(0, 200);

      const review = await runReviewLoopServerSide({
        brief,
        titulo,
        resumo,
        conteudoMarkdown: md,
      });

      const reviewTokenInput = review.history.reduce((acc, h) => acc + (h.llmInputTokens ?? 0), 0);
      const reviewTokenOutput = review.history.reduce((acc, h) => acc + (h.llmOutputTokens ?? 0), 0);

      return {
        keyword,
        tipo,
        titulo: review.finalTitulo,
        conteudoMarkdown: review.finalMarkdown,
        reviewStatus: review.status,
        reviewIterations: review.iterations,
        reviewIssues: review.finalReview.issues,
        generationTokens: {
          input: generation.usage.inputTokens,
          output: generation.usage.outputTokens,
          cacheRead: generation.usage.cacheReadTokens,
        },
        reviewTokens: {
          input: reviewTokenInput,
          output: reviewTokenOutput,
        },
        siloPath: brief.siloPath,
      } as GeneratedClusterArticle;
    }),
  );

  return { articles };
}

export interface ReserveClusterSlugsInput {
  items: Array<{ siloPath: string; keyword: string }>;
}

export interface ReservedClusterSlug {
  keyword: string;
  siloPath: string;
  /** Full slug path saved in DB column posts.slug (ex.: "formatos-de-oculos/rosto-largo/oculos-cabeca-60cm"). */
  finalSlug: string;
  /** Public URL used in cross-link markdown (ex.: "/blog/formatos-de-oculos/rosto-largo/oculos-cabeca-60cm"). */
  finalUrl: string;
  /** True when ensureUniqueSlug had to append a numeric suffix (collision against DB or against another item in the same batch). */
  collisionDetected: boolean;
}

export interface ReserveClusterSlugsResult {
  reservations: ReservedClusterSlug[];
}

export async function reserveClusterSlugsAction(
  input: ReserveClusterSlugsInput,
): Promise<ReserveClusterSlugsResult> {
  await requireAuth();
  await ensurePostsTable();

  const usedInBatch = new Set<string>();
  const reservations: ReservedClusterSlug[] = [];

  for (const item of input.items) {
    const basePath = buildPostPath(normalizeTopicPath(item.siloPath), slugify(item.keyword));
    if (!basePath) {
      throw new Error(`Slug invalido para keyword "${item.keyword}" no silo "${item.siloPath}".`);
    }

    let candidate = basePath;
    let suffix = 1;
    while (true) {
      const dbHit = !usedInBatch.has(candidate)
        ? ((await sql`SELECT id FROM posts WHERE slug = ${candidate} LIMIT 1`) as { id: number }[])
        : [{ id: -1 }];
      if (!usedInBatch.has(candidate) && dbHit.length === 0) break;
      suffix += 1;
      candidate = `${basePath}-${suffix}`;
    }

    usedInBatch.add(candidate);
    reservations.push({
      keyword: item.keyword,
      siloPath: item.siloPath,
      finalSlug: candidate,
      finalUrl: `/blog/${candidate}`,
      collisionDetected: candidate !== basePath,
    });
  }

  return { reservations };
}

export interface ClusterPublishInput {
  posts: PublishOrchestratedPostInput[];
  /** Optional: pass the slugs reserved earlier via reserveClusterSlugsAction. publish aborta com erro claro se algum slug nao bate (ex.: outro operador publicou no intervalo). */
  expectedSlugs?: string[];
}

export interface ClusterPublishResult {
  posts: PublishOrchestratedPostResult[];
}

export async function publishClusterArticlesAction(
  input: ClusterPublishInput,
): Promise<ClusterPublishResult> {
  await requireAuth();
  await ensurePostsTable();

  if (!input.posts.length) {
    throw new Error('Nenhum post no cluster para publicar.');
  }

  const publishedAt = new Date().toISOString();
  const results: PublishOrchestratedPostResult[] = [];

  for (const post of input.posts) {
    const titulo = post.titulo.trim();
    const resumo = post.resumo.trim();
    const conteudo = post.conteudoMarkdown.trim();
    const topicPath = normalizeTopicPath(post.topicPath);
    const articleSlug = slugify(post.slug || titulo);
    const tags = normalizeTags(post.tags);
    const keywordsSecundarias = (post.keywordsSecundarias ?? [])
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 12);

    if (!titulo || !resumo || !conteudo) {
      throw new Error(`Post do cluster sem titulo/resumo/conteudo: "${post.keywordPrincipal ?? post.slug}".`);
    }
    if (!topicPath) {
      throw new Error(`Silo ausente no post do cluster: "${post.keywordPrincipal ?? post.slug}".`);
    }

    const desiredSlug = buildPostPath(topicPath, articleSlug);
    const expected = input.expectedSlugs?.[results.length];
    const slug = await ensureUniqueSlug(desiredSlug);
    if (expected && expected !== slug) {
      throw new Error(
        `Slug reservado "${expected}" foi tomado entre a reserva e a publicacao. Resolvido para "${slug}", mas os links cruzados do cluster apontam para "${expected}". Aborte e gere o cluster novamente.`,
      );
    }

    const rows = (await sql`
      INSERT INTO posts (
        slug, titulo, resumo, conteudo_md, capa_url, tags, autor, publicado, published_at,
        meta_title, meta_description, keyword_principal, keywords_secundarias, cover_alt
      )
      VALUES (
        ${slug}, ${titulo}, ${resumo}, ${conteudo}, ${null}, ${tags}, ${'@oculoscalibre'}, ${true}, ${publishedAt},
        ${nullableString(post.metaTitle)}, ${nullableString(post.metaDescription)},
        ${nullableString(post.keywordPrincipal)}, ${keywordsSecundarias}, ${nullableString(post.coverAlt)}
      )
      RETURNING id, slug
    `) as { id: number; slug: string }[];

    results.push({
      id: rows[0].id,
      slug: rows[0].slug,
      publicUrl: `/blog/${rows[0].slug}`,
      adminUrl: `/admin/posts/${rows[0].id}`,
    });
  }

  revalidatePath('/blog');
  for (const result of results) {
    revalidateBlogHierarchy(result.slug);
  }
  revalidatePath('/sitemap.xml');
  revalidatePath('/blog/feed.xml');

  return { posts: results };
}
