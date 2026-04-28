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
