# Revisão SEO — Lote C (bots SEO executáveis + auditoria)

## Data
2026-05-09

## Descrição

Fechamento da revisão SEO. Lote C entrega:

- **Migration** com 9 novos campos em `posts` para suportar SEO editorial sério.
- **Skill `seo-reviewer` executável** (`src/lib/seo-reviewer.ts`) — não é mais um bot só descritivo.
- **Detector de canibalização** (`getKeywordCannibalization` em `src/lib/db.ts`).
- **Página `/admin/seo-audit`** que pontua todos os posts e destaca grupos de canibalização.
- **PostForm com seção SEO** (meta_title/description, keyword_principal/secundarias, canonical_url, og_image_url, cover_alt, noindex).
- **`article-writer` reforçado** com bio do autor, lembrete sobre alt text e propagação de keyword principal/cover_alt sugerido para o draft do PostForm.

## Migration

Documentada em [docs/migrations/2026-05-09-posts-campos-seo.md](migrations/2026-05-09-posts-campos-seo.md).

> **Você precisa rodar o SQL no Neon SQL Editor** para garantir paridade entre branches preview/prod. O `ensurePostsTable()` também aplica os ALTERs idempotentemente em runtime, mas migration manual é prática mais segura.

## Passos executados

### 1. `src/lib/db.ts`
- `ensurePostsTable()` agora roda `ALTER TABLE posts ADD COLUMN IF NOT EXISTS ...` para os 9 campos novos (idempotente).
- Interface `Post` estendida com os 9 campos (todos nullable / com default).
- `idx_posts_keyword_principal` partial index acelera o detector.
- Nova função `getKeywordCannibalization()` que retorna grupos de posts compartilhando a mesma `keyword_principal` (case-insensitive).

### 2. `src/lib/seo-reviewer.ts` (novo)
Skill pura, sem efeitos colaterais. Recebe um `SeoReviewInput` e retorna `{ score, issues, metrics }`.

Validações implementadas:
- **H1 único** com keyword principal natural (errors).
- **Keyword no primeiro parágrafo** (warning).
- **Densidade da keyword** entre 0,5–2,0% (warning fora da faixa).
- **Meta title** ≤ 60 chars (error se vazio, warning se > 60).
- **Meta description** entre 120–160 chars (warning fora; error se vazia).
- **H2** ≥ 2 (warning).
- **Alt text** em todas as imagens markdown (warning).
- **Cover alt** preenchido quando há `capa_url` (warning).
- **Links internos do mesmo silo** ≥ 2 (warning).
- **Word count** ≥ 300 (warning).

Score: `100 - errors*20 - warnings*5`, clamped 0–100.

### 3. `src/app/admin/seo-audit/page.tsx` (novo)
- Lista todos os posts (publicados e rascunhos) ordenados pelo menor score.
- Mostra até 4 issues inline por post.
- Painel separado destacando grupos de canibalização (mesma keyword principal compartilhada por > 1 post).
- Linka cada post para `/admin/posts/[id]` para correção rápida.
- Verde ≥ 80, amarelo 60–79, vermelho < 60.

### 4. `src/app/admin/posts/PostForm.tsx`
- Novo `<fieldset>` "SEO & metadados" antes da capa, com:
  - Meta title (contador 0/60).
  - Keyword principal.
  - Meta description (contador 0/160, recomendado 120–160).
  - Keywords secundárias (cauda longa, separadas por vírgula).
  - Canonical URL (opcional).
  - OG image URL (sobrescreve a capa).
  - Cover alt (acessibilidade + SEO).
  - Toggle `noindex`.
- `StoredOrchestratorDraft` ampliado com `metaTitle`, `metaDescription`, `keywordPrincipal`, `keywordsSecundarias`, `coverAlt` para auto-preencher quando o draft vem do orquestrador.

### 5. `src/app/admin/posts/actions.ts`
- Helpers `parseKeywords`, `nullableTrim`, `readSeoFields`.
- `createPost` insere os 8 campos SEO + 0 de `revised_at` (que é null no momento da criação).
- `updatePost` atualiza os 8 campos. `revised_at = now()` quando o post permanecia publicado e foi re-salvo (sinal de freshness na re-publicação).

### 6. `src/app/admin/posts/[id]/page.tsx`
Passa os 8 campos SEO existentes do post para o `PostForm` via `initial`.

### 7. `src/lib/article-writer.ts`
- Novo `buildAuthorBioBlock(authorName)` — bloco "## Sobre {autor}" no rodapé do markdown gerado.
- Novo `buildSeoReminderBlock` — quote-block lembrando o redator de inserir alt text usando a keyword.
- Novos helpers `buildSuggestedCoverAlt(input)` e `buildSuggestedMetaDescription(input)`.
- `DraftStoragePayload` exportado e estendido com `metaTitle`, `metaDescription`, `keywordPrincipal`, `keywordsSecundarias`, `coverAlt`.
- `buildDraftStoragePayload` aceita `writerInput` opcional e popula esses campos.

### 8. `src/app/admin/orquestrador/OrchestratorWorkspace.tsx`
`prepareDraftInPostEditor` agora passa o `writerInput` completo, então a draft persistida no localStorage chega no PostForm já com sugestões de meta description, keyword principal e cover alt.

### 9. `src/app/admin/page.tsx`
Adicionado link "Auditoria SEO" no nav do dashboard.

## Validação

- `npm run build` ✅ Compila em 7.5s, TypeScript em 5.3s, sem erros nem warnings.
- Nova rota `/admin/seo-audit` (dynamic).
- 17 rotas no total.

## Critérios atendidos da request original

Cobertura cumulativa dos lotes A + B + C frente às recomendações do usuário:

### Básico

| Recomendação | Status |
|--------------|--------|
| Pesquisa de palavras-chave | ⚠️ Mock no `keyword-planner.ts` (planner real fica fora do escopo SEO). |
| Posicionamento (H1, H2, URL, primeiro parágrafo) | ✅ `seo-reviewer` valida; orquestrador insere; URL hierárquica via silo. |
| Alt text de imagens | ✅ Validado pelo bot; `cover_alt` no schema; lembrete editorial no markdown gerado. |
| E-E-A-T | ⚠️ Bio padrão "Calibre" inserida; bio detalhada por autor depende de input do usuário. |
| Meta description 150–160 | ✅ Validado 120–160; sugestão automática no orquestrador. |
| Performance / Core Web Vitals | ✅ next/image; LCP priority na capa; static prerender da home. |
| Responsividade | ✅ Mantida (Tailwind + media queries no CSS-in-JS). |
| Backlinks / Linkagem interna | ✅ Validação de ≥ 2 links do mesmo silo no `seo-reviewer`. |
| Google Search Console / Analytics | ⏳ Tokens dependem de input do usuário. |

### Avançado

| Recomendação | Status |
|--------------|--------|
| Topic Clusters / Pillar Pages | ✅ Já existe na arquitetura; agora também emite `CollectionPage` schema. |
| Sinais E-E-A-T (bio, fontes) | ⚠️ Bio padrão; fontes/citações ficam a critério do redator humano. |
| Otimização para Intent | ✅ `keyword.intencao` declarada no orquestrador; `seo-reviewer` audita H1/intro. |
| Crawl Budget | ✅ `robots.ts` bloqueia /admin e /api; sitemap dinâmico. |
| Core Web Vitals | ✅ Prerender estático home + next/image + dateModified visível. |
| JavaScript SEO | ✅ Server-rendered (RSC). |
| Schema Markup | ✅ Organization, WebSite, Product, FAQPage, Article, BreadcrumbList, CollectionPage. |
| Otimização para SGE/IA | ✅ FAQPage + Article com `keywords` + dados estruturados claros. |
| Canibalização | ✅ Detector + página de auditoria. |
| Atualização de conteúdo histórico | ✅ `revised_at` + "Atualizado em" visível + `dateModified` no schema. |

## Parâmetros pendentes (cumulativo)

Lista atualizada para preenchimento futuro:

| Parâmetro | Onde aplicar | Status |
|-----------|--------------|--------|
| `public/og-default.jpg` (1200×630) | layout `metadata.openGraph.images` | ⏳ |
| `public/logo.png` (240×240+) | `organizationSchema().logo.url` | ⏳ |
| `public/favicon.ico` real | layout `metadata.icons.icon` | ⏳ |
| Token Google Search Console | `metadata.verification.google` no layout | ⏳ |
| Token Bing Webmaster | `metadata.verification.other['msvalidate.01']` | ⏳ |
| Handle Twitter/X | `metadata.twitter.creator` e `site` | ⏳ |
| Bio detalhada por autor (ex.: foto, função, anos de experiência) | tabela `autores` futura ou JSONB em `posts` | ⏳ |
| `Organization.sameAs` (Instagram, LinkedIn, etc) | `organizationSchema().sameAs` | ⏳ |
| Slogan/descrição final da marca | `organizationSchema().description` | ⏳ |
| Domínio próprio final | env `NEXT_PUBLIC_SITE_URL` na Vercel | ⏳ |
| Poster do vídeo hero | extrair frame e atribuir `<video poster>` no `LandingClient` | ⏳ |
| Migrar Google Fonts da landing para `next/font` | `LandingClient` (CWV win médio) | ⏳ |
| Keyword Planner real (Google Ads / Semrush / Ahrefs) | substituir mock em `keyword-planner.ts` | ⏳ |

## Próximos passos sugeridos (futuros)

- **Tabela `autores`** com bio rica + foto, ligada a `posts.autor_id`. Permite popular `Article.author` com `Person` completo (com URL, image, jobTitle, sameAs).
- **Skill `internal-linker`**: sugere links internos do mesmo silo automaticamente baseado em keywords secundárias.
- **Webhook do GSC** para puxar ranking real de cada keyword e exibir no admin/seo-audit.
- **A/B testing de meta titles** via Vercel Edge Middleware para descobrir variações de maior CTR.
