import type { Post } from '@/lib/db';
import type { ProductCatalogItem } from '@/lib/catalog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.oculoscalibre.com.br';
const SITE_NAME = 'Calibre';

export function absoluteUrl(path: string): string {
  const base = SITE_URL.replace(/\/$/, '');
  if (!path) return base;
  return path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export interface BreadcrumbCrumb {
  name: string;
  href: string;
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${absoluteUrl('/')}#organization`,
    name: SITE_NAME,
    url: absoluteUrl('/'),
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/img/calibre-logo.jpeg'),
    },
    slogan: 'Óculos Calibre. Para quem tem presença de sobra.',
    description:
      'Calibre é a marca brasileira de óculos de sol em acetato premium para rostos largos, com frontal a partir de 150mm. Para quem tem presença de sobra.',
    sameAs: ['https://www.instagram.com/oculos.calibre/'],
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${absoluteUrl('/')}#website`,
    url: absoluteUrl('/'),
    name: SITE_NAME,
    inLanguage: 'pt-BR',
    publisher: { '@id': `${absoluteUrl('/')}#organization` },
  };
}

export function productSchema(product: ProductCatalogItem, options: { price?: string; priceCurrency?: string; availability?: string } = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.nome,
    description: product.descricao,
    category: product.categoria,
    brand: { '@type': 'Brand', name: SITE_NAME },
    additionalProperty: product.medidas.map((medida) => ({
      '@type': 'PropertyValue',
      name: medida.label,
      value: medida.value,
    })),
    url: absoluteUrl(product.url),
    offers: options.price
      ? {
          '@type': 'Offer',
          price: options.price,
          priceCurrency: options.priceCurrency ?? 'BRL',
          availability: options.availability ?? 'https://schema.org/PreOrder',
          url: absoluteUrl(product.url),
          seller: { '@id': `${absoluteUrl('/')}#organization` },
        }
      : undefined,
  };
}

export function faqPageSchema(faqs: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}

export function breadcrumbListSchema(crumbs: BreadcrumbCrumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.href),
    })),
  };
}

export function articleSchema(post: Post) {
  const canonical = post.canonical_url?.trim() || `/blog/${post.slug}`;
  const url = absoluteUrl(canonical);
  const headline = post.meta_title?.trim() || post.titulo;
  const description = post.meta_description?.trim() || post.resumo;
  const ogImage = post.og_image_url?.trim() || post.capa_url;
  const keywordSet = [post.keyword_principal, ...(post.keywords_secundarias ?? []), ...(post.tags ?? [])]
    .map((value) => value?.toString().trim())
    .filter((value): value is string => Boolean(value));
  const keywords = Array.from(new Set(keywordSet));

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline,
    description,
    url,
    image: ogImage ? [ogImage] : undefined,
    author: {
      '@type': 'Person',
      name: post.autor,
    },
    publisher: { '@id': `${absoluteUrl('/')}#organization` },
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.revised_at ?? post.updated_at,
    keywords: keywords.length ? keywords.join(', ') : undefined,
    inLanguage: 'pt-BR',
    isPartOf: { '@id': `${absoluteUrl('/')}#website` },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
      breadcrumb: { '@id': `${url}#breadcrumb` },
    },
  };
}

export function collectionPageSchema(input: {
  url: string;
  name: string;
  description: string;
  itemHrefs: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    url: absoluteUrl(input.url),
    name: input.name,
    description: input.description,
    inLanguage: 'pt-BR',
    isPartOf: { '@id': `${absoluteUrl('/')}#website` },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: input.itemHrefs.map((href, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(href),
      })),
    },
  };
}

export function jsonLdScript(payload: object | object[]): string {
  return JSON.stringify(payload).replace(/</g, '\\u003c');
}
