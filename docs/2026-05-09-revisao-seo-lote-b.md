# Revisão SEO — Lote B (Schema.org + Performance)

## Data
2026-05-09

## Descrição

Sequência do Lote A. Implementa:
- **Schema.org JSON-LD** em todas as páginas-chave (Organization, WebSite, Product, FAQPage, Article, BreadcrumbList, CollectionPage).
- **Refator `page.tsx`** em server component + `<LandingClient />` para conseguir injetar Product+FAQPage schema sem remover a interatividade da landing. Como bônus, a home virou prerender estático (`○ Static`), ganhando TTFB.
- **`next/image`** substituindo `<img>` cru na capa do post e na pré-visualização do admin. `next.config.ts` ganhou hostname `*.public.blob.vercel-storage.com` (Vercel Blob).
- **`dateModified` visível**: posts com `updated_at > published_at + 1min` exibem "Atualizado em DD de mês de YYYY" no rodapé do meta, alimentando o sinal de freshness do Google.

Sem migration. Sem mudança visual além das otimizações de imagem.

## Passos executados

### 1. `src/lib/json-ld.ts` — novo
Helpers tipados que geram payload Schema.org:
- `organizationSchema()` — usa `/logo.png` como ImageObject e fixa `@id` para refs cruzadas.
- `websiteSchema()` — `inLanguage: pt-BR`, publisher referenciando `Organization`.
- `productSchema(product, { price, priceCurrency, availability })` — converte `productCatalog` em `Product` com `additionalProperty` derivada das medidas e `Offer` opcional.
- `faqPageSchema(faqs)` — `FAQPage` para SGE/IA.
- `breadcrumbListSchema(crumbs)` — itens absolutos.
- `articleSchema(post, breadcrumbs)` — `headline`, `description`, `image`, `author`, `publisher`, `datePublished`, `dateModified`, `keywords`, `inLanguage`, `mainEntityOfPage` com referência ao breadcrumb.
- `collectionPageSchema({ url, name, description, itemHrefs })` — pillar/subtema com `ItemList`.
- `jsonLdScript(payload)` — serializa com escape `<` → `<` para inserção segura via `dangerouslySetInnerHTML`.

### 2. `src/app/layout.tsx`
Injeta `<script type="application/ld+json">` com `[Organization, WebSite]` no `<body>`. Visível em todas as rotas.

### 3. `src/app/blog/[...slug]/page.tsx`
- **PostPage**: monta breadcrumbs absolutos (Blog → silos → título) e injeta `[Article, BreadcrumbList]`. Capa migrada para `<Image fill priority>` com `aspectRatio: 16/9`. Adiciona `Atualizado em DD de mês de YYYY` no meta-row quando `updated_at > published_at + 60s`.
- **TopicPage** (pillar/subtema): injeta `[CollectionPage, BreadcrumbList]` com `itemListElement` apontando para os artigos do silo.

### 4. `src/app/page.tsx` — refatorado em server component
- Movido o componente client para `src/app/_landing/LandingClient.tsx`.
- Constantes compartilhadas (`faqs`, `specs`, `VAGAS_TOTAIS`, `PRICE`, `PRICE_OLD`) extraídas para `src/app/_landing/data.ts` — usadas tanto pelo client quanto pelo server.
- `page.tsx` agora server: monta `[Product (com Offer PreOrder R$ 449), FAQPage]` e renderiza `<LandingClient />`.
- Resultado: `/` virou `○ Static` no build (prerender estático antes do hidrate).

### 5. `next.config.ts`
Adicionado `*.public.blob.vercel-storage.com` aos `remotePatterns` para que `next/image` aceite capas hospedadas no Vercel Blob.

### 6. `src/app/admin/posts/PostForm.tsx`
Trocado `<img>` da capa atual por `<Image width={240} height={126} unoptimized>`. `unoptimized` evita custo desnecessário no admin (preview rápido, não indexável).

### Validação
- `npm run build` ✅ Compila em 42s, TypeScript em 68s, sem erros nem warnings.
- `/` → `○ (Static)` (prerender). Ganho de TTFB.
- Demais rotas mantidas como `ƒ (Dynamic)`.
- Total de rotas: 16 (1 nova: nenhuma; 1 movida internamente).

## Arquivos alterados/criados

**Novos:**
- `src/lib/json-ld.ts`
- `src/app/_landing/data.ts`
- `src/app/_landing/LandingClient.tsx`

**Alterados:**
- `src/app/layout.tsx` — JSON-LD `[Organization, WebSite]`.
- `src/app/page.tsx` — reescrito como server component.
- `src/app/blog/[...slug]/page.tsx` — JSON-LD em PostPage e TopicPage; `next/image` na capa; "Atualizado em".
- `src/app/admin/posts/PostForm.tsx` — `next/image` com `unoptimized`.
- `next.config.ts` — hostname Vercel Blob.

## O que foi pulado nesta fase (decisão consciente)

| Item | Motivo |
|------|--------|
| **Migrar Google Fonts (Bebas Neue, DM Sans) para `next/font`** | Mexer no CSS-in-JS de ~700 linhas tem risco médio para ganho marginal de CWV. Backlog. |
| **Adicionar `poster` ao vídeo hero** | Precisa de imagem dedicada (frame extraído). Aguarda input do usuário ou pipeline. Backlog. |
| **Substituir Unsplash placeholders na landing por imagens reais** | Conteúdo de produto, fora do escopo SEO. |
| **`Organization.logo` apontando para `/logo.png`** | Arquivo precisa ser fornecido. Rastreado em parâmetros pendentes. |

## Parâmetros pendentes (atualizado)

Cumulativo do Lote A + Lote B:

| Parâmetro | Onde aplicar | Status |
|-----------|--------------|--------|
| `public/og-default.jpg` (1200×630) | layout `metadata.openGraph.images` | ⏳ |
| `public/logo.png` (240×240+) | `organizationSchema().logo.url` | ⏳ |
| `public/favicon.ico` real | layout `metadata.icons.icon` | ⏳ |
| Token Google Search Console | `metadata.verification.google` | ⏳ |
| Token Bing Webmaster | `metadata.verification.other['msvalidate.01']` | ⏳ |
| Handle Twitter/X | `metadata.twitter.creator` e `site` | ⏳ |
| Bio do autor padrão "Calibre" | `articleSchema().author` (estender helper) | ⏳ |
| `Organization.sameAs` (Instagram, LinkedIn, etc) | `organizationSchema().sameAs` | ⏳ |
| Slogan/descrição curta da marca | `organizationSchema().description` (atualizar) | ⏳ |
| Domínio próprio final | env `NEXT_PUBLIC_SITE_URL` na Vercel | ⏳ |
| Poster do vídeo hero | extrair frame e atribuir `<video poster>` | ⏳ |

## Próximo passo (Lote C — bots SEO executáveis)

- Migration: `posts` ganha `meta_title`, `meta_description`, `keyword_principal`, `keywords_secundarias`, `canonical_url`, `og_image_url`, `cover_alt`, `noindex`, `revised_at`.
- Skill `seo-reviewer` em `src/lib/seo-reviewer.ts`: valida H1 contém keyword, densidade 0,5–2%, meta_title ≤ 60, meta_description ≤ 160, alt em imagens markdown, ≥ 2 links internos do mesmo silo.
- Skill `cannibalization-detector`: alerta quando >1 post mira a mesma `keyword_principal`.
- Atualizar `article-writer` com regras E-E-A-T: keyword no H1, alt baseado em keyword, bio do autor no rodapé.
- Página `/admin/seo-audit` listando posts com red flags.
