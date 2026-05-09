import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

function readDatabaseUrl() {
  const envFile = readFileSync('.env.local', 'utf-8');
  for (const rawLine of envFile.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (!line.startsWith('DATABASE_URL=')) continue;
    let value = line.slice('DATABASE_URL='.length).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    return value;
  }
  throw new Error('DATABASE_URL não encontrado em .env.local');
}

const databaseUrl = readDatabaseUrl();
const sql = neon(databaseUrl);

const statements = [
  ['add meta_title', `ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_title TEXT`],
  ['add meta_description', `ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_description TEXT`],
  ['add keyword_principal', `ALTER TABLE posts ADD COLUMN IF NOT EXISTS keyword_principal TEXT`],
  ['add keywords_secundarias', `ALTER TABLE posts ADD COLUMN IF NOT EXISTS keywords_secundarias TEXT[] NOT NULL DEFAULT '{}'`],
  ['add canonical_url', `ALTER TABLE posts ADD COLUMN IF NOT EXISTS canonical_url TEXT`],
  ['add og_image_url', `ALTER TABLE posts ADD COLUMN IF NOT EXISTS og_image_url TEXT`],
  ['add cover_alt', `ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_alt TEXT`],
  ['add noindex', `ALTER TABLE posts ADD COLUMN IF NOT EXISTS noindex BOOLEAN NOT NULL DEFAULT false`],
  ['add revised_at', `ALTER TABLE posts ADD COLUMN IF NOT EXISTS revised_at TIMESTAMPTZ`],
  ['create idx_posts_keyword_principal', `CREATE INDEX IF NOT EXISTS idx_posts_keyword_principal ON posts(keyword_principal) WHERE keyword_principal IS NOT NULL`],
];

console.log('Conectando ao Neon e aplicando 10 statements idempotentes em posts...');

for (const [label, statement] of statements) {
  await sql.query(statement);
  console.log('✓', label);
}

const verification = await sql.query(`
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_name = 'posts'
    AND column_name IN ('meta_title','meta_description','keyword_principal','keywords_secundarias','canonical_url','og_image_url','cover_alt','noindex','revised_at')
  ORDER BY column_name
`);

console.log('\nColunas confirmadas:');
for (const row of verification) {
  console.log('  -', row.column_name.padEnd(22), row.data_type.padEnd(18), 'nullable=' + row.is_nullable, 'default=' + (row.column_default ?? 'null'));
}

const indexCheck = await sql.query(`SELECT indexname FROM pg_indexes WHERE tablename = 'posts' AND indexname = 'idx_posts_keyword_principal'`);
console.log('\nÍndice idx_posts_keyword_principal:', indexCheck.length > 0 ? 'OK' : 'AUSENTE');

console.log('\nMigration aplicada com sucesso.');
