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

console.log("Aplicando ALTER COLUMN default e UPDATE em posts.autor (Calibre → @oculoscalibre)...");

await sql.query(`ALTER TABLE posts ALTER COLUMN autor SET DEFAULT '@oculoscalibre'`);
console.log('✓ default da coluna autor agora é @oculoscalibre');

const updated = await sql.query(`UPDATE posts SET autor = '@oculoscalibre' WHERE autor = 'Calibre' RETURNING id`);
console.log(`✓ ${updated.length} post(s) migrado(s) de "Calibre" para "@oculoscalibre"`);

const summary = await sql.query(`SELECT autor, COUNT(*)::int AS total FROM posts GROUP BY autor ORDER BY total DESC`);
console.log('\nDistribuição de autores em posts:');
for (const row of summary) {
  console.log('  -', String(row.autor).padEnd(24), row.total);
}

console.log('\nMigration concluída.');
