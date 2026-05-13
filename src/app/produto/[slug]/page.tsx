import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { productCatalog, getProductById } from '@/lib/catalog';
import {
  absoluteUrl,
  breadcrumbListSchema,
  faqPageSchema,
  jsonLdScript,
  productSchema,
} from '@/lib/json-ld';
import ProductPage from './ProductPage';

const SITE_NAME = 'Calibre';

export async function generateStaticParams() {
  return productCatalog.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductById(slug);
  if (!product) {
    return { title: 'Produto não encontrado | Calibre' };
  }

  const title = `${product.nome} — ${product.medidaReferencia} | ${SITE_NAME}`;
  const description = `${product.descricao} ${product.medidaReferencia}.`;
  const url = absoluteUrl(`/produto/${product.id}`);
  const image = product.imagemUrl ? absoluteUrl(product.imagemUrl) : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      locale: 'pt_BR',
      siteName: SITE_NAME,
      ...(image ? { images: [{ url: image, width: 1200, height: 1200, alt: product.nome }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProdutoSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductById(slug);
  if (!product) notFound();

  const related = productCatalog
    .filter((p) => p.id !== product.id)
    .slice(0, 2)
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      url: p.url,
      frontal: p.medidaReferencia.replace('Frontal ', ''),
      imagem: p.imagemUrl ?? '/img/calibre-logo.jpeg',
      tag: p.categoria,
    }));

  const faqs = [
    {
      q: `O ${product.nome} cabe em cabeça grande?`,
      a: `Sim. O ${product.nome} foi pensado para rostos largos — ${product.medidaReferencia.toLowerCase()}, contra os 138–145mm dos modelos de mercado.`,
    },
    {
      q: 'Como funciona a lista de espera?',
      a: 'Você reserva gratuitamente sem cobrança. Quando o estoque chegar, avisamos por e-mail e WhatsApp na ordem da fila — você decide se quer fechar a compra.',
    },
    {
      q: 'Vocês entregam para todo o Brasil?',
      a: 'Sim, frete grátis para todo o território nacional. Trocas e devoluções em até 30 dias após o recebimento.',
    },
    {
      q: 'Posso usar como óculos de grau?',
      a: 'Sim, a armação aceita lentes de grau. Recomendamos levar a um óptico de confiança para a montagem.',
    },
  ];

  const schemas = [
    productSchema(product),
    breadcrumbListSchema([
      { name: 'Início', href: '/' },
      { name: 'Catálogo', href: '/#catalogo' },
      { name: product.nome, href: `/produto/${product.id}` },
    ]),
    faqPageSchema(faqs),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(schemas) }}
      />
      <ProductPage product={product} related={related} />
    </>
  );
}
