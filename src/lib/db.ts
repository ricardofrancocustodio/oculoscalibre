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
      autor         TEXT        NOT NULL DEFAULT 'Calibre',
      publicado     BOOLEAN     NOT NULL DEFAULT false,
      published_at  TIMESTAMPTZ,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_posts_publicado ON posts(publicado, published_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)`;
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
