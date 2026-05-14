import { productCatalog } from '@/lib/catalog';
import { faqPageSchema, jsonLdScript, productSchema } from '@/lib/json-ld';
import { getPublishedPosts } from '@/lib/db';
import { faqs, PRICE } from './_landing/data';
import { LandingClient } from './_landing/LandingClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const product = productCatalog.find((item) => item.id === 'mb-1572s') ?? productCatalog[0];

  const homeSchema = [
    productSchema(product, {
      price: PRICE,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/PreOrder',
    }),
    faqPageSchema(faqs),
  ];

  const allPosts = await getPublishedPosts();
  const recentPosts = allPosts.slice(0, 3).map((p) => ({
    slug: p.slug,
    titulo: p.titulo,
    resumo: p.resumo,
    published_at: p.published_at,
    created_at: p.created_at,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(homeSchema) }}
      />
      <LandingClient recentPosts={recentPosts} />
    </>
  );
}
