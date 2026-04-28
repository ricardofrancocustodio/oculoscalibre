import { sql, ensureStatsTable } from '@/lib/db';

export async function POST() {
  await ensureStatsTable();
  await sql`INSERT INTO page_views DEFAULT VALUES`;
  return Response.json({ success: true });
}
