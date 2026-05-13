import { productCatalog } from '@/lib/catalog';

export const dynamic = 'force-static';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.oculoscalibre.com.br';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function GET() {
  const items = productCatalog.map((product) => {
    const url = product.url.startsWith('http')
      ? product.url
      : `${SITE_URL.replace(/\/$/, '')}${product.url}`;

    const availability = product.stock === 'InStock'
      ? 'in stock'
      : product.stock === 'OutOfStock'
        ? 'out of stock'
        : 'preorder';

    const price = product.price ? `${product.price} BRL` : '349.90 BRL';
    const imageUrl = product.imagemUrl
      ? (product.imagemUrl.startsWith('http') ? product.imagemUrl : `${SITE_URL.replace(/\/$/, '')}${product.imagemUrl}`)
      : `${SITE_URL.replace(/\/$/, '')}/img/calibre-logo.jpeg`;

    // Extrai frontal da lista de medidas para custom_label
    const frontal = product.medidas.find((m) => m.label.toLowerCase().includes('frontal'))?.value ?? '';

    return `    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <g:title>${escapeXml(product.nome)}</g:title>
      <g:description>${escapeXml(product.descricao)}</g:description>
      <g:link>${escapeXml(url)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      <g:price>${escapeXml(price)}</g:price>
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Calibre</g:brand>
      <g:product_type>${escapeXml(product.categoria)}</g:product_type>
      <g:google_product_category>178</g:google_product_category>
      ${frontal ? `<g:custom_label_0>frontal-${escapeXml(frontal)}</g:custom_label_0>` : ''}
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Calibre — Feed de Produtos</title>
    <link>${SITE_URL.replace(/\/$/, '')}</link>
    <description>Óculos de sol para rostos largos — catálogo Calibre</description>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}
