import { neon } from '@neondatabase/serverless';

let _client: ReturnType<typeof neon> | undefined;

function getClient() {
  if (!_client) _client = neon(process.env.DATABASE_URL!);
  return _client;
}

export const sql = (strings: TemplateStringsArray, ...values: unknown[]) =>
  getClient()(strings, ...values);

let tableReady = false;
let statsTableReady = false;
let postsTableReady = false;

export async function ensureLeadsTable() {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id         SERIAL PRIMARY KEY,
      nome       TEXT        NOT NULL,
      email      TEXT        NOT NULL,
      whatsapp   TEXT        NOT NULL,
      medida     TEXT,
      produto    TEXT        NOT NULL DEFAULT 'MB-1572S',
      origem     TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  tableReady = true;
}

export async function ensureStatsTable() {
  if (statsTableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS page_views (
      id         SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  statsTableReady = true;
}

export async function ensurePostsTable() {
  if (postsTableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id            SERIAL PRIMARY KEY,
      slug          TEXT        UNIQUE NOT NULL,
      titulo        TEXT        NOT NULL,
      resumo        TEXT        NOT NULL,
      conteudo_md   TEXT        NOT NULL,
      capa_url      TEXT,
      tags          TEXT[]      NOT NULL DEFAULT '{}',
      autor         TEXT        NOT NULL DEFAULT '@oculoscalibre',
      publicado     BOOLEAN     NOT NULL DEFAULT false,
      published_at  TIMESTAMPTZ,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_posts_publicado ON posts(publicado, published_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)`;

  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_title TEXT`;
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_description TEXT`;
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS keyword_principal TEXT`;
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS keywords_secundarias TEXT[] NOT NULL DEFAULT '{}'`;
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS canonical_url TEXT`;
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS og_image_url TEXT`;
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_alt TEXT`;
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS noindex BOOLEAN NOT NULL DEFAULT false`;
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS revised_at TIMESTAMPTZ`;
  await sql`ALTER TABLE posts ALTER COLUMN autor SET DEFAULT '@oculoscalibre'`;
  await sql`CREATE INDEX IF NOT EXISTS idx_posts_keyword_principal ON posts(keyword_principal) WHERE keyword_principal IS NOT NULL`;

  postsTableReady = true;
}

export interface Post {
  id: number;
  slug: string;
  titulo: string;
  resumo: string;
  conteudo_md: string;
  capa_url: string | null;
  tags: string[];
  autor: string;
  publicado: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  meta_title: string | null;
  meta_description: string | null;
  keyword_principal: string | null;
  keywords_secundarias: string[];
  canonical_url: string | null;
  og_image_url: string | null;
  cover_alt: string | null;
  noindex: boolean;
  revised_at: string | null;
}

export async function getAllPostsAdmin(): Promise<Post[]> {
  await ensurePostsTable();
  const rows = await sql`SELECT * FROM posts ORDER BY created_at DESC`;
  return rows as Post[];
}

export async function getPublishedPosts(): Promise<Post[]> {
  await ensurePostsTable();
  const rows = await sql`
    SELECT * FROM posts
    WHERE publicado = true
    ORDER BY published_at DESC NULLS LAST, created_at DESC
  `;
  return rows as Post[];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  await ensurePostsTable();
  const rows = await sql`SELECT * FROM posts WHERE slug = ${slug} LIMIT 1` as Post[];
  return rows[0] ?? null;
}

export async function getPostById(id: number): Promise<Post | null> {
  await ensurePostsTable();
  const rows = await sql`SELECT * FROM posts WHERE id = ${id} LIMIT 1` as Post[];
  return rows[0] ?? null;
}

export interface KeywordCannibalizationGroup {
  keyword: string;
  posts: Array<Pick<Post, 'id' | 'slug' | 'titulo' | 'publicado' | 'published_at'>>;
}

export async function getKeywordCannibalization(): Promise<KeywordCannibalizationGroup[]> {
  await ensurePostsTable();
  const rows = (await sql`
    SELECT keyword_principal AS keyword, id, slug, titulo, publicado, published_at
    FROM posts
    WHERE keyword_principal IS NOT NULL AND keyword_principal <> ''
    ORDER BY keyword_principal, published_at DESC NULLS LAST
  `) as Array<{
    keyword: string;
    id: number;
    slug: string;
    titulo: string;
    publicado: boolean;
    published_at: string | null;
  }>;

  const grouped = new Map<string, KeywordCannibalizationGroup>();
  for (const row of rows) {
    const key = row.keyword.trim().toLowerCase();
    if (!key) continue;
    const current = grouped.get(key) ?? { keyword: row.keyword, posts: [] };
    current.posts.push({ id: row.id, slug: row.slug, titulo: row.titulo, publicado: row.publicado, published_at: row.published_at });
    grouped.set(key, current);
  }

  return [...grouped.values()].filter((group) => group.posts.length > 1);
}
