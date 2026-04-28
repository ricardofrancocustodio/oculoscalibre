import { sql, ensureLeadsTable } from '@/lib/db';

export async function GET() {
  await ensureLeadsTable();
  const rows = await sql`SELECT COUNT(*)::int AS count FROM leads` as { count: number }[];
  return Response.json({ count: rows[0].count });
}
