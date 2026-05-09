# Revisão SEO — Pós-migration (Lote A+B+C aplicado em prod)

## Data
2026-05-09

## Descrição

Aplicada a migration do Lote C no Neon prod e fechado o loop com 3 melhorias técnicas que dependiam dos campos novos:

- **Migration aplicada no Neon prod** via `scripts/run-seo-migration.mjs` (10 statements idempotentes, todos validados via `information_schema.columns`).
- **Fonts da landing migradas para `next/font`** (Bebas Neue + DM Sans). `@import` removido; agora servidas self-hosted com `display: swap`.
- **`revised_at` como sinal de freshness primário** (com fallback para `updated_at`).
- **Post respeita `noindex`, `canonical_url`, `og_image_url`, `meta_title`, `meta_description`, `cover_alt` no metadata e no `Article` JSON-LD**.

## Passos executados

### 1. Migration aplicada
Script `scripts/run-seo-migration.mjs` lê `DATABASE_URL` do `.env.local`, conecta ao Neon e roda os 10 statements. Verifica via `information_schema.columns` que as 9 colunas estão presentes com defaults corretos e que `idx_posts_keyword_principal` existe.

Saída validada:
```
✓ add meta_title
✓ add meta_description
✓ add keyword_principal
✓ add keywords_secundarias
✓ add canonical_url
✓ add og_image_url
✓ add cover_alt
✓ add noindex
✓ add revised_at
✓ create idx_posts_keyword_principal

Colunas confirmadas:
  - canonical_url          text                     nullable=YES default=null
  - cover_alt              text                     nullable=YES default=null
  - keyword_principal      text                     nullable=YES default=null
  - keywords_secundarias   ARRAY                    nullable=NO  default='{}'::text[]
  - meta_description       text                     nullable=YES default=null
  - meta_title             text                     nullable=YES default=null
  - noindex                boolean                  nullable=NO  default=false
  - og_image_url           text                     nullable=YES default=null
  - revised_at             timestamp with time zone nullable=YES default=null

Índice idx_posts_keyword_principal: OK
```

### 2. `src/app/layout.tsx` — fonts via `next/font`
- Importadas `Bebas_Neue` (weight 400) e `DM_Sans` (weights 300/400/500/600/700) de `next/font/google`.
- Variables CSS expostas no `<html>`: `--font-bebas`, `--font-dm`.
- Self-hosted, `display: swap`, sem custo de DNS para fontes externas.

### 3. `src/app/_landing/LandingClient.tsx`
- Removido `@import url('https://fonts.googleapis.com/css2?...')` do `<style>` inline.
- Substituídas todas as ocorrências:
  - `font-family: 'Bebas Neue', sans-serif;` → `font-family: var(--font-bebas), sans-serif;` (12 lugares)
  - `font-family: 'DM Sans', sans-serif;` → `font-family: var(--font-dm), sans-serif;` (1 lugar)

### 4. `src/app/blog/[...slug]/page.tsx`
- `wasUpdated` agora compara `revised_at ?? updated_at` com `published_at + 60s` para decidir se mostra "Atualizado em".
- `generateMetadata` do post:
  - `canonical_url` (quando preenchido) sobrescreve o canonical default.
  - `og_image_url` sobrescreve `capa_url` para OG/Twitter.
  - `meta_title` e `meta_description` sobrescrevem `titulo`/`resumo`.
  - `cover_alt` é usado no `images.alt` do OG.
  - `noindex = true` retorna `robots: { index: false, follow: false }`.
  - `modifiedTime` usa `revised_at ?? updated_at`.

### 5. `src/lib/json-ld.ts` — `articleSchema(post)`
- Removido o parâmetro `breadcrumbs` (nunca foi usado no payload).
- Aplica os mesmos overrides do metadata (canonical, headline, description, image).
- `keywords` agora compõe `keyword_principal + keywords_secundarias + tags` deduplicadas.
- `dateModified` usa `revised_at ?? updated_at`.

### Validação
- `npm run build` ✅ Compila em 6.7s, TypeScript em 5.3s, sem erros nem warnings.
- `/` mantém prerender estático.

## Arquivos alterados/criados

**Novos:**
- `scripts/run-seo-migration.mjs`
- `docs/2026-05-09-revisao-seo-pos-migration.md`

**Alterados:**
- `src/app/layout.tsx` — Bebas Neue + DM Sans via next/font.
- `src/app/_landing/LandingClient.tsx` — `@import` removido, font-family via variables.
- `src/app/blog/[...slug]/page.tsx` — overrides SEO no metadata + freshness.
- `src/lib/json-ld.ts` — `articleSchema` consome todos os campos do schema novo.

## Backlog atualizado (parâmetros pendentes — só o que continua bloqueando)

Os itens técnicos da revisão SEO estão entregues. Restam apenas inputs de conteúdo/marca:

| Parâmetro | Onde aplicar | Bloqueio |
|-----------|--------------|----------|
| `public/og-default.jpg` (1200×630) | layout `metadata.openGraph.images` | imagem real |
| `public/logo.png` (240×240+) | `organizationSchema().logo.url` | logo SVG/PNG |
| `public/favicon.ico` real | layout `metadata.icons.icon` | favicon real |
| Token Google Search Console | `metadata.verification.google` | login GSC |
| Token Bing Webmaster | `metadata.verification.other['msvalidate.01']` | login Bing |
| Handle Twitter/X | `metadata.twitter.creator` e `site` | conta @ Twitter |
| Bio detalhada por autor (foto, função, anos) | tabela `autores` futura ou JSONB em `posts` | conteúdo de marca |
| `Organization.sameAs` (Instagram, LinkedIn) | `organizationSchema().sameAs` | URLs sociais |
| Slogan/descrição final da marca | `organizationSchema().description` | copy final |
| Domínio próprio final | env `NEXT_PUBLIC_SITE_URL` na Vercel | DNS do domínio |
| Poster do vídeo hero | `<video poster>` em `LandingClient` | frame ou imagem |
| Keyword Planner real (Google Ads / Semrush / Ahrefs) | substituir mock em `keyword-planner.ts` | conta + token |
