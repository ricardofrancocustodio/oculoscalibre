import { getPublishedPosts } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.oculoscalibre.com.br';
const FEED_ID = `${SITE_URL.replace(/\/$/, '')}/blog/feed.xml`;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toAtomDate(dateStr: string | null | undefined): string {
  if (!dateStr) return new Date().toISOString();
  return new Date(dateStr).toISOString();
}

export async function GET() {
  const posts = await getPublishedPosts();
  const recent = posts.slice(0, 20);

  const lastUpdated = recent.length > 0
    ? toAtomDate(recent[0].updated_at)
    : new Date().toISOString();

  const entries = recent.map((post) => {
    const url = `${SITE_URL.replace(/\/$/, '')}/blog/${post.slug}`;
    const title = escapeXml(post.meta_title?.trim() || post.titulo);
    const summary = escapeXml(post.meta_description?.trim() || post.resumo);
    const published = toAtomDate(post.published_at ?? post.created_at);
    const updated = toAtomDate(post.revised_at ?? post.updated_at);

    // Extrai silo (primeiro segmento do slug) como categoria
    const silo = post.slug.split('/')[0] ?? '';
    const categoryTag = silo ? `\n    <category term="${escapeXml(silo)}" />` : '';

    return `  <entry>
    <id>${escapeXml(url)}</id>
    <title>${title}</title>
    <link href="${escapeXml(url)}" />
    <summary>${summary}</summary>
    <published>${published}</published>
    <updated>${updated}</updated>${categoryTag}
    <author><name>Calibre</name></author>
  </entry>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="pt-BR">
  <id>${FEED_ID}</id>
  <title>Calibre — Blog</title>
  <subtitle>Óculos de sol para rostos largos. Conteúdo sobre medidas, fit e estilo.</subtitle>
  <link rel="alternate" type="text/html" href="${SITE_URL.replace(/\/$/, '')}/blog" />
  <link rel="self" type="application/atom+xml" href="${FEED_ID}" />
  <updated>${lastUpdated}</updated>
  <author><name>Calibre</name><uri>${SITE_URL.replace(/\/$/, '')}</uri></author>
  <rights>© ${new Date().getFullYear()} Calibre</rights>
  <generator>Next.js</generator>
${entries}
</feed>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
