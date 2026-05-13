'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { put } from '@vercel/blob';
import { sql, ensurePostsTable } from '@/lib/db';
import { buildPostPath, normalizeTopicPath, parsePostPath, slugify } from '@/lib/slug';

async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token || token !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login');
  }
}

function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

function parseKeywords(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function nullableTrim(value: FormDataEntryValue | null): string | null {
  const trimmed = String(value ?? '').trim();
  return trimmed ? trimmed : null;
}

interface SeoFields {
  meta_title: string | null;
  meta_description: string | null;
  keyword_principal: string | null;
  keywords_secundarias: string[];
  canonical_url: string | null;
  og_image_url: string | null;
  cover_alt: string | null;
  noindex: boolean;
}

function readSeoFields(formData: FormData): SeoFields {
  return {
    meta_title: nullableTrim(formData.get('meta_title')),
    meta_description: nullableTrim(formData.get('meta_description')),
    keyword_principal: nullableTrim(formData.get('keyword_principal')),
    keywords_secundarias: parseKeywords(formData.get('keywords_secundarias') as string | null),
    canonical_url: nullableTrim(formData.get('canonical_url')),
    og_image_url: nullableTrim(formData.get('og_image_url')),
    cover_alt: nullableTrim(formData.get('cover_alt')),
    noindex: formData.get('noindex') === 'on',
  };
}

async function uploadCapaIfPresent(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const key = `blog/capa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const blob = await put(key, file, {
    access: 'public',
    addRandomSuffix: false,
    contentType: file.type || undefined,
  });
  return blob.url;
}

async function ensureUniqueSlug(base: string, ignoreId?: number): Promise<string> {
  let candidate = base || 'post';
  let n = 1;
  while (true) {
    const rows = ignoreId
      ? (await sql`SELECT id FROM posts WHERE slug = ${candidate} AND id <> ${ignoreId} LIMIT 1`) as { id: number }[]
      : (await sql`SELECT id FROM posts WHERE slug = ${candidate} LIMIT 1`) as { id: number }[];
    if (rows.length === 0) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
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

export async function createPost(formData: FormData) {
  await requireAuth();
  await ensurePostsTable();

  const titulo = String(formData.get('titulo') || '').trim();
  const resumo = String(formData.get('resumo') || '').trim();
  const conteudo = String(formData.get('conteudo_md') || '').trim();
  const tags = parseTags(formData.get('tags') as string | null);
  const autor = String(formData.get('autor') || '@oculoscalibre').trim() || '@oculoscalibre';
  const topicPath = normalizeTopicPath(String(formData.get('topic_path') || ''));
  const articleSlug = slugify(String(formData.get('slug') || titulo));
  const action = String(formData.get('action') || 'rascunho');
  const capaFile = formData.get('capa') as File | null;

  if (!titulo || !resumo || !conteudo) {
    throw new Error('Preencha título, resumo e conteúdo.');
  }

  if (!topicPath) {
    throw new Error('Preencha a estrutura do silo para publicar o post no blog.');
  }

  const slug = await ensureUniqueSlug(buildPostPath(topicPath, articleSlug));
  const capaUrl = await uploadCapaIfPresent(capaFile);
  const publicado = action === 'publicar';
  const publishedAt = publicado ? new Date().toISOString() : null;
  const seo = readSeoFields(formData);

  const rows = (await sql`
    INSERT INTO posts (
      slug, titulo, resumo, conteudo_md, capa_url, tags, autor, publicado, published_at,
      meta_title, meta_description, keyword_principal, keywords_secundarias,
      canonical_url, og_image_url, cover_alt, noindex
    )
    VALUES (
      ${slug}, ${titulo}, ${resumo}, ${conteudo}, ${capaUrl}, ${tags}, ${autor}, ${publicado}, ${publishedAt},
      ${seo.meta_title}, ${seo.meta_description}, ${seo.keyword_principal}, ${seo.keywords_secundarias},
      ${seo.canonical_url}, ${seo.og_image_url}, ${seo.cover_alt}, ${seo.noindex}
    )
    RETURNING id, slug
  `) as { id: number; slug: string }[];

  revalidateBlogHierarchy(rows[0].slug);
  revalidatePath('/sitemap.xml');
  revalidatePath('/blog/feed.xml');

  redirect(`/admin/posts/${rows[0].id}?ok=criado`);
}

export async function updatePost(id: number, formData: FormData) {
  await requireAuth();
  await ensurePostsTable();

  const existing = (await sql`SELECT * FROM posts WHERE id = ${id} LIMIT 1`) as {
    id: number;
    slug: string;
    capa_url: string | null;
    publicado: boolean;
    published_at: string | null;
  }[];
  if (existing.length === 0) {
    throw new Error('Post não encontrado.');
  }
  const prev = existing[0];

  const titulo = String(formData.get('titulo') || '').trim();
  const resumo = String(formData.get('resumo') || '').trim();
  const conteudo = String(formData.get('conteudo_md') || '').trim();
  const tags = parseTags(formData.get('tags') as string | null);
  const autor = String(formData.get('autor') || '@oculoscalibre').trim() || '@oculoscalibre';
  const prevParsed = parsePostPath(prev.slug);
  const topicPathInput = normalizeTopicPath(String(formData.get('topic_path') || ''));
  const topicPath = topicPathInput || prevParsed.topicPath;
  const slugInput = slugify(String(formData.get('slug') || titulo));
  const action = String(formData.get('action') || 'salvar');
  const capaFile = formData.get('capa') as File | null;
  const removerCapa = formData.get('remover_capa') === 'on';

  if (!titulo || !resumo || !conteudo) {
    throw new Error('Preencha título, resumo e conteúdo.');
  }

  const desiredSlug = buildPostPath(topicPath, slugInput);
  const slug = desiredSlug && desiredSlug !== prev.slug
    ? await ensureUniqueSlug(desiredSlug, id)
    : prev.slug;

  let capaUrl: string | null = prev.capa_url;
  if (removerCapa) capaUrl = null;
  const novaCapa = await uploadCapaIfPresent(capaFile);
  if (novaCapa) capaUrl = novaCapa;

  let publicado = prev.publicado;
  let publishedAt = prev.published_at;
  if (action === 'publicar' && !prev.publicado) {
    publicado = true;
    publishedAt = new Date().toISOString();
  } else if (action === 'despublicar' && prev.publicado) {
    publicado = false;
  }

  const seo = readSeoFields(formData);

  await sql`
    UPDATE posts SET
      slug = ${slug},
      titulo = ${titulo},
      resumo = ${resumo},
      conteudo_md = ${conteudo},
      capa_url = ${capaUrl},
      tags = ${tags},
      autor = ${autor},
      publicado = ${publicado},
      published_at = ${publishedAt},
      meta_title = ${seo.meta_title},
      meta_description = ${seo.meta_description},
      keyword_principal = ${seo.keyword_principal},
      keywords_secundarias = ${seo.keywords_secundarias},
      canonical_url = ${seo.canonical_url},
      og_image_url = ${seo.og_image_url},
      cover_alt = ${seo.cover_alt},
      noindex = ${seo.noindex},
      revised_at = CASE WHEN publicado = true AND ${publicado}::boolean = true THEN now() ELSE revised_at END,
      updated_at = now()
    WHERE id = ${id}
  `;

  revalidateBlogHierarchy(prev.slug);
  if (slug !== prev.slug) revalidateBlogHierarchy(slug);
  revalidatePath('/sitemap.xml');
  revalidatePath('/blog/feed.xml');

  redirect(`/admin/posts/${id}?ok=salvo`);
}

export async function deletePost(formData: FormData) {
  await requireAuth();
  await ensurePostsTable();
  const id = Number(formData.get('id'));
  if (!Number.isFinite(id) || id <= 0) return;

  const rows = (await sql`SELECT slug FROM posts WHERE id = ${id} LIMIT 1`) as { slug: string }[];
  await sql`DELETE FROM posts WHERE id = ${id}`;

  if (rows[0]?.slug) revalidateBlogHierarchy(rows[0].slug);
  revalidatePath('/sitemap.xml');
  revalidatePath('/blog/feed.xml');

  redirect('/admin/posts?ok=excluido');
}

export async function uploadInlineImage(formData: FormData): Promise<{ url: string }> {
  await requireAuth();
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) throw new Error('Arquivo inválido.');
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const key = `blog/inline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const blob = await put(key, file, {
    access: 'public',
    addRandomSuffix: false,
    contentType: file.type || undefined,
  });
  return { url: blob.url };
}

export async function togglePublish(formData: FormData) {
  await requireAuth();
  await ensurePostsTable();
  const id = Number(formData.get('id'));
  if (!Number.isFinite(id) || id <= 0) return;

  const rows = (await sql`SELECT slug, publicado FROM posts WHERE id = ${id} LIMIT 1`) as {
    slug: string;
    publicado: boolean;
  }[];
  if (rows.length === 0) return;

  const novoEstado = !rows[0].publicado;
  const publishedAt = novoEstado ? new Date().toISOString() : null;

  if (novoEstado) {
    await sql`UPDATE posts SET publicado = true, published_at = ${publishedAt}, updated_at = now() WHERE id = ${id}`;
  } else {
    await sql`UPDATE posts SET publicado = false, updated_at = now() WHERE id = ${id}`;
  }

  revalidateBlogHierarchy(rows[0].slug);
  revalidatePath('/sitemap.xml');
  revalidatePath('/blog/feed.xml');

  redirect('/admin/posts');
}
