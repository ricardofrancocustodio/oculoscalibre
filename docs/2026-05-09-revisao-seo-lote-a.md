# Revisão SEO — Lote A (Fundamentos)

## Data
2026-05-09

## Descrição

Auditoria SEO completa do projeto e implementação do **Lote A — Fundamentos**: metadata por página, Open Graph, Twitter Cards, canonical, robots.txt e bloqueio de indexação no admin. Sem migration de banco. Sem mudança visual. Risco: baixo. Impacto: muito alto.

A URL canônica adotada nesta fase é `https://oculoscalibre.vercel.app` (definida via env var `NEXT_PUBLIC_SITE_URL` com fallback). Quando migrar para domínio próprio, basta atualizar a env var na Vercel.

## Diagnóstico SEO completo (referência)

### O que já estava bom
- `sitemap.ts` dinâmico cobrindo home, /blog, pillar pages, subtemas e posts publicados.
- Arquitetura de silos `/blog/silo/subtema/artigo` (topic clusters + pillar pages — recomendação avançada já entregue).
- Interlinking interno: breadcrumbs, relacionados do mesmo silo, child topics.
- Server-rendered (RSC) — nada de problema de JS SEO.
- Conceito do bot `revisor-seo` no orquestrador editorial.
- HTML `lang="pt-BR"`.

### Gaps mapeados (ordenados por impacto)

| # | Gap | Lote |
|---|-----|------|
| 1 | `layout.tsx` sem `metadataBase`, OG, Twitter, canonical, robots, viewport, themeColor | A ✅ |
| 2 | `/blog` sem metadata própria | A ✅ |
| 3 | `/blog/[...slug]` (post + topic) sem `generateMetadata` — todos os posts compartilhavam o título do root | A ✅ |
| 4 | Sem `robots.ts` — `/admin/*` indexável e sem referência ao sitemap | A ✅ |
| 5 | `/admin/*` sem `noindex` no metadata | A ✅ |
| 6 | Sem JSON-LD (Article, BreadcrumbList, FAQPage, Organization, Product) | B |
| 7 | `<img>` cru em capas e markdown (Core Web Vitals: LCP/CLS) | B |
| 8 | Banco `posts` sem `meta_title`, `meta_description`, `keyword_principal`, `keywords_secundarias`, `canonical_url`, `og_image_url`, `cover_alt`, `noindex`, `revised_at` | C |
| 9 | Bot `revisor-seo` apenas descritivo, sem skill executável (validação H1/keyword/densidade/meta length/alt/links internos) | C |
| 10 | `article-writer` não força keyword principal em H1/intro/alt; gera template genérico | C |
| 11 | Landing `page.tsx` é `'use client'` no root → não pode exportar metadata específica (mitigado via `title.default` do root layout, mas idealmente o page deveria ser refatorado em server + client component) | B |
| 12 | Sem campo `alt` dedicado para capa do post; sem detector de canibalização | C |
| 13 | Sem bio do autor (`autor` é apenas TEXT) → E-E-A-T fraco | C |
| 14 | `updated_at` existe mas não aparece na UI ("dateModified" perdido) | B |
| 15 | Vídeo hero sem `poster` (LCP) | B |
| 16 | Landing importa Google Fonts via `@import` em CSS-in-JS (anti-pattern para CWV; deveria usar `next/font`) | B |

## Passos executados (Lote A)

### 1. `src/app/layout.tsx` — metadata global
- Adicionado `metadataBase` apontando para `process.env.NEXT_PUBLIC_SITE_URL || 'https://oculoscalibre.vercel.app'`.
- `title.default` define o título da home (`/`), e `title.template = '%s | Calibre'` formata títulos das subpáginas.
- Description detalhada, keywords, authors, creator, publisher.
- Open Graph completo (`type: 'website'`, `locale: 'pt_BR'`, `siteName`, imagem 1200×630).
- Twitter Card `summary_large_image`.
- `robots` permitindo indexação geral com `googleBot.max-image-preview: large`, `max-snippet: -1`, `max-video-preview: -1`.
- `alternates.canonical = '/'`.
- `formatDetection` desativando link automático de email/telefone.
- `category: 'shopping'`.
- Novo export `viewport`: `themeColor: '#0A0A0A'` e `colorScheme: 'dark'` (alinhado ao tema da landing).

### 2. `src/app/blog/page.tsx` — metadata da home do blog
- `title`, `description`, `alternates.canonical = '/blog'`.
- OG e Twitter dedicados explicando que esta é a entrada para os silos.

### 3. `src/app/blog/[...slug]/page.tsx` — `generateMetadata` dinâmico
- Se a rota for um **post publicado**: usa `titulo`, `resumo`, `capa_url` como OG image, `published_at`/`updated_at` como `publishedTime`/`modifiedTime`, `autor` como author e `tags` como tags.
- Se a rota for uma **pillar page ou subtema**: humaniza o último segmento, conta artigos do tópico e gera title/description próprios. Distingue `pillar page` (1 segmento) de `subtema` (n+1 segmentos).
- Se nada existe: retorna `noindex` (defensivo).
- Canonical sempre apontando para o caminho do recurso.

### 4. `src/app/robots.ts` — novo arquivo
- Permite tudo em `/`.
- Bloqueia `/admin`, `/admin/`, `/api/`.
- Aponta `sitemap: <SITE_URL>/sitemap.xml`.
- Define `host` para evitar conteúdo duplicado entre www/non-www.

### 5. `src/app/admin/layout.tsx` — novo arquivo
- Adiciona `noindex`, `nofollow`, `nocache`, `noimageindex` para todo o subtree do admin via Metadata API.
- `title.template = '%s · Admin Calibre'` para páginas internas do admin.

### Validação
- `npm run build` ✅ Compila em 6.8s, TypeScript em 5.5s, sem erros nem warnings.
- `/robots.txt` e `/sitemap.xml` aparecem como rotas estáticas.

## Arquivos alterados

- `src/app/layout.tsx` — reescrito com metadata expandido.
- `src/app/blog/page.tsx` — adicionado `metadata`.
- `src/app/blog/[...slug]/page.tsx` — adicionado `generateMetadata`.
- `src/app/robots.ts` — novo.
- `src/app/admin/layout.tsx` — novo.

## Parâmetros pendentes (preencher em momento oportuno)

Estes itens precisam de input do usuário para serem ajustados no código. Estão **rastreados aqui** para resgate futuro:

| Parâmetro | Onde aplicar | Status |
|-----------|--------------|--------|
| **Imagem Open Graph default** (1200×630, JPG) | `public/og-default.jpg` — já referenciado no layout | ⏳ pendente |
| **Favicon real** | `public/favicon.ico` (substituir o placeholder do Next.js se houver) | ⏳ a confirmar |
| **URL canônica final** (domínio próprio) | env var `NEXT_PUBLIC_SITE_URL` na Vercel | ⏳ pendente |
| **Token Google Search Console** (`google-site-verification`) | adicionar em `metadata.verification.google` no layout | ⏳ pendente |
| **Token Bing Webmaster** | `metadata.verification.other['msvalidate.01']` | ⏳ pendente |
| **Handle do Twitter/X** | `metadata.twitter.creator` e `site` no layout | ⏳ pendente |
| **Bio do autor padrão "Calibre"** (1-2 linhas) | será usado em JSON-LD `Article.author` (Lote B) | ⏳ pendente |
| **Logo SVG/PNG da marca** (240×240+) | usar em JSON-LD `Organization.logo` (Lote B) | ⏳ pendente |
| **Slogan/descrição curta da marca** | usar em `Organization.description` (Lote B) | ⏳ pendente |

## Próximos passos sugeridos

### Lote B — Schema.org + Performance
- JSON-LD `Organization` no layout raiz.
- JSON-LD `Product` + `FAQPage` na landing.
- JSON-LD `Article` + `BreadcrumbList` em cada post.
- JSON-LD `CollectionPage`/`ItemList` em pillar pages.
- Substituir `<img>` por `next/image` na capa do post e no admin.
- Adicionar `poster` ao vídeo hero (extrair frame ou usar imagem dedicada).
- Migrar Google Fonts da landing para `next/font` (CWV: elimina `@import` bloqueante).
- Mostrar "atualizado em" nos posts quando `updated_at > published_at`.
- Refatorar `src/app/page.tsx` em `page.tsx` (server, com metadata) + `LandingClient.tsx` (client) para conseguir metadata específica da home (Product schema).

### Lote C — Bots SEO executáveis (depende de migration)
- Migration: novos campos em `posts` (meta_title, meta_description, keyword_principal, keywords_secundarias, canonical_url, og_image_url, cover_alt, noindex, revised_at).
- Skill executável `seo-reviewer` em `src/lib/seo-reviewer.ts`: valida H1 contém keyword, densidade 0,5–2%, meta_title ≤ 60, meta_description ≤ 160, alt em todas as imagens markdown, ≥ 2 links internos do mesmo silo.
- Skill `cannibalization-detector`: alerta quando mais de um post mira a mesma `keyword_principal`.
- Atualizar `article-writer` para receber regras E-E-A-T: keyword no H1, alt baseado em keyword, bio do autor no rodapé do markdown.
- Página `/admin/seo-audit` listando posts publicados com red flags.

### Pulado nesta sessão
- **Migration SQL**: não houve mudança em `db.ts`. ✓ Pulado conforme regra.
- **Deploy**: não foi solicitado pelo usuário; aguardando aprovação para `npx vercel --prod`.
