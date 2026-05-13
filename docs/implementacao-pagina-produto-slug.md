# Implementação: Página de Produto `/produto/[slug]`

## Resumo
Rota dinâmica de produto inspirada em e-commerce premium (Ray-Ban / Amazon),
gerada estaticamente via `generateStaticParams` para cada item do
`productCatalog` (`mb-1572s`, `viking`, `presence`).

## Arquivos

### Criados
- `src/app/produto/[slug]/page.tsx` — Server Component
  - `generateStaticParams` itera `productCatalog`
  - `generateMetadata` define title/description/OG/canonical
  - Monta `related[]` (excluindo o produto atual)
  - Injeta JSON-LD: `productSchema` + `breadcrumbListSchema` + `faqPageSchema`
  - Renderiza `<ProductPage />`

- `src/app/produto/[slug]/ProductPage.tsx` — Client Component (~900 linhas)
  - `<ProductGallery>`: thumbs verticais no desktop, horizontais no mobile,
    `flex-direction: column-reverse` (thumbs abaixo da imagem no mobile)
  - `<FitCalculator>`: usuário insere cm/mm da cabeça → resultado ok/tight/small
    com base no frontal do produto (`raw < 100 ? raw*10 : raw`, ideal = mm*0.25)
  - `<FAQItem>`: accordion com rotação 0→45° no toggle
  - `<ReserveModal>`: POST `/api/leads` com `produto: product.nome`,
    bloqueia scroll, ESC para fechar
  - Sticky bar mobile (price + CTA) abaixo de 720px
  - Trust badges, breadcrumb, CTA band lima, footer

### Atualizados
- `src/lib/catalog.ts`
  - Novo campo `imagens?: string[]` na interface `ProductCatalogItem`
  - URLs atualizadas para `/produto/{id}`
  - Galerias populadas (6 fotos MB-1572S, 5 Viking, 4 Presence)
  - `stock: 'PreOrder'` em todos; `price: '449'` somente no MB-1572S

- `src/app/sitemap.ts`
  - Importa `productCatalog` e adiciona uma entry por produto com `priority: 0.9`

- `src/app/_landing/LandingClient.tsx`
  - Card do catálogo: imagem e título viram `<a href="/produto/{id}">`
  - Novo CTA primário lima "Ver produto" + CTA secundário "Entrar na lista"
  - Novo estilo `.btn-catalog-secondary` (outline muted)

## Schema.org gerado por página
- `Product` com `additionalProperty[]` (uma entrada por medida),
  `offers` quando há `price`, `availability` derivado de `stock`
- `BreadcrumbList`: Início › Catálogo › Nome
- `FAQPage`: 4 perguntas frequentes

## SEO
- `canonical` absoluto
- `openGraph` + `twitter` com imagem do produto
- Title pattern: `{Nome} — Frontal {min}–{max}mm | Calibre`

## Validação
- `npx next build`: ✓ build sem erros
- 3 páginas pré-renderizadas (SSG): `/produto/mb-1572s`, `/produto/viking`, `/produto/presence`
- Deploy Vercel: https://oculoscalibre.vercel.app
