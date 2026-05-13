# AEO/GEO — Sinais para Agentes de IA (Calibre)

> Data: 2026-05-12
> Status: Implementado e deployado

---

## Contexto

A jornada do cliente está colapsando via agentes (ChatGPT Shopping, Perplexity, Google AI Mode). O site precisa convencer o agente, não só o humano. Calibre é caso de uso ideal: nicho específico ("óculos para cabeça grande"), query exatamente do tipo "me ache óculos que sirvam em cabeça de 60cm".

Os 5 sinais que agentes avaliam: Schema markup, clareza de conteúdo, compatibilidade com feeds, reputação distribuída, frescor de conteúdo.

---

## O que já existia (não alterado)

| Elemento | Arquivo |
|---|---|
| JSON-LD Product (additionalProperty com medidas em mm) | `src/lib/json-ld.ts` |
| JSON-LD Organization + WebSite (global) | `src/app/layout.tsx` |
| JSON-LD Article (datePublished, dateModified, keywords) | `src/lib/json-ld.ts` |
| JSON-LD FAQPage | `src/lib/json-ld.ts` |
| JSON-LD BreadcrumbList + CollectionPage | `src/lib/json-ld.ts` |
| robots.ts wildcard allow | `src/app/robots.ts` |
| Sitemap dinâmico hierárquico | `src/app/sitemap.ts` |
| Blog silo com pillar pages automáticas | `src/app/blog/[...slug]/page.tsx` |

---

## Implementações desta sessão

### 1. `llms.txt`

**Arquivo:** `src/app/llms.txt/route.ts`

GET handler estático retornando `text/plain` com:
- Nome da marca, URL, proposta de valor
- Modelo MB-1572S com medidas reais (frontal 150.7mm, largura lente 60mm, ponte 24mm, hastes 145mm, peso 40g)
- Compatibilidade: cabeças 57–62cm
- Tabela de circunferência × frontal × recomendação
- Links principais (home, blog, guia-de-medidas, Instagram)
- Declaração explícita de permissão para crawlers de IA

Rota: `/llms.txt`
Cache: `public, max-age=86400, stale-while-revalidate=604800`

---

### 2. AI bots explícitos no `robots.ts`

**Arquivo:** `src/app/robots.ts`

Adicionadas entradas explícitas além do wildcard:
- `GPTBot` — ChatGPT
- `PerplexityBot` — Perplexity
- `ClaudeBot` — Claude/Anthropic
- `Anthropic-AI` — Anthropic crawler
- `Google-Extended` — Google AI Mode
- `OAI-SearchBot` — OpenAI search
- `cohere-ai` — Cohere

Todos com `allow: '/'`. O wildcard já permitia implicitamente, mas a declaração explícita é sinal de cooperação para indexação.

---

### 3. RSS/Atom feed do blog

**Arquivo:** `src/app/blog/feed.xml/route.ts`

Remove o `revalidatePath('/blog/feed.xml')` órfão que existia nos server actions.

Atom XML com últimos 20 posts publicados:
- `id`, `title`, `link`, `summary`, `published`, `updated`, `category` (silo path)
- `Content-Type: application/atom+xml`
- Cache: `public, max-age=3600`

Rota: `/blog/feed.xml`

---

### 4. Página "Guia de Medidas"

**Arquivo:** `src/app/guia-de-medidas/page.tsx`

Ativo AEO mais importante do nicho. Tabela HTML semântica real (não imagem) que agentes conseguem ler e usar para responder "o MB-1572S serve em cabeça de 60cm?".

**Estrutura:**
1. Breadcrumb (Home › Guia de Medidas)
2. H1: "Como escolher óculos para cabeça grande: guia de medidas"
3. Seção: Como medir — passo a passo em `<ol>`
4. Seção: `<table>` semântica — circunferência da cabeça × frontal necessário × recomendação:
   - até 56cm → 130–140mm → óculos padrão
   - 57–58cm → 140–148mm → oversized leve
   - 59–60cm → 148–152mm → **Calibre MB-1572S**
   - 61–62cm → 152–158mm → **Calibre MB-1572S**
   - acima de 62cm → 158mm+ → consultar
5. CTA para produto
6. FAQ em `<dl>` com 6 perguntas

**Schemas injetados:**
- `BreadcrumbList` (Home > Guia de Medidas)
- `FAQPage` com 6 Q&A sobre medidas, frontal, MB-1572S

**Metadata:** meta title, description, OG, canonical `/guia-de-medidas`

**Link no footer:** adicionado em `src/app/_landing/LandingClient.tsx`

Rota: `/guia-de-medidas`

---

### 5. `price` + `AggregateRating` no schema de produto

**Arquivos:** `src/lib/catalog.ts` + `src/lib/json-ld.ts`

Adicionado ao tipo `ProductCatalogItem`:
```typescript
price?: string;          // "349.90"
stock?: 'InStock' | 'PreOrder' | 'OutOfStock';
aggregateRating?: { ratingValue: number; reviewCount: number };
imagemUrl?: string;      // para feeds
```

`productSchema()` atualizado:
- Usa `product.price` como fallback quando `options.price` não é passado
- Deriva `availability` a partir de `product.stock` (InStock/OutOfStock/PreOrder)
- Injeta `aggregateRating` no schema quando presente no catalog

Preencher `price`, `stock` e `aggregateRating` no catalog quando produto for ao ar e reviews chegarem.

---

### 6. Google Merchant Center feed

**Arquivo:** `src/app/api/feed/google-merchant.xml/route.ts`

RSS XML com todos os produtos do catalog. Campos:
- Obrigatórios GMC: `g:id`, `g:title`, `g:description`, `g:link`, `g:image_link`, `g:price`, `g:availability`, `g:condition`, `g:brand`
- Opcionais: `g:product_type`, `g:google_product_category` (178 = Eyewear), `g:custom_label_0` (frontal em mm)

Cache: `public, max-age=86400` (estático, dados do catalog)

Rota: `/api/feed/google-merchant.xml`

Base para futuros protocolos ACP/AP2 quando consolidarem.

---

## O que foi deliberadamente excluído

| Item | Motivo |
|---|---|
| ACP/AP2 checkout API | Protocolos instáveis; implementação especulativa cara para o porte atual |
| `dateModified` visível na UI de produto | Homepage é client component — requererá refactor separado |
| Hreflang multilíngue | Site é pt-BR only |
| Sitemap de imagens | Baixo impacto para o nicho atual |
| Review pages individuais | Aguardar reviews reais |

---

## Verificação pós-deploy

```
GET /llms.txt                          → text/plain com medidas do produto
GET /robots.txt                        → entradas GPTBot, PerplexityBot, ClaudeBot
GET /blog/feed.xml                     → Atom XML válido com posts publicados
GET /guia-de-medidas                   → página com tabela + FAQ schema
GET /api/feed/google-merchant.xml      → RSS XML com campos GMC
```

Google Rich Results Test em `/guia-de-medidas` deve mostrar FAQPage válida.
