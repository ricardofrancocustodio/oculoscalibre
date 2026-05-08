import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { searchKeywordPlanner } from '@/lib/google-ads-keyword-planner';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token || token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.trim() ?? '';

  if (query.length < 2) {
    return NextResponse.json({ suggestions: [], source: 'mock' });
  }

  const result = await searchKeywordPlanner(query);
  return NextResponse.json(result);
}
