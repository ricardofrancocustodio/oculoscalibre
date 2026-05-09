import { productCatalog } from '@/lib/catalog';
import { faqPageSchema, jsonLdScript, productSchema } from '@/lib/json-ld';
import { faqs, PRICE } from './_landing/data';
import { LandingClient } from './_landing/LandingClient';

export default function HomePage() {
  const product = productCatalog.find((item) => item.id === 'mb-1572s') ?? productCatalog[0];

  const homeSchema = [
    productSchema(product, {
      price: PRICE,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/PreOrder',
    }),
    faqPageSchema(faqs),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(homeSchema) }}
      />
      <LandingClient />
    </>
  );
}
