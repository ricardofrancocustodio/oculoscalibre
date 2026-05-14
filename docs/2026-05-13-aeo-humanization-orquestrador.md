# Integração AEO + Humanização no orquestrador

**Data:** 2026-05-13
**Escopo:** Aplicar as regras do skill `calibre-blog-content` (em `docs/files/`) dentro do pipeline automatizado do orquestrador, para que cada artigo gerado siga as exigências de AEO (Answer Engine Optimization) e humanização sem depender do operador humano.

## Contexto

Antes desta integração, dois sistemas conviviam separados:

1. **Skill `calibre-blog-content`** (em `docs/files/` e replicado em `.claude/skills/calibre-blog-content/`) — disparado quando o Claude no chat escreve um post. Carrega regras de AEO, voz, templates e humanização.
2. **Orquestrador do projeto** (`src/app/admin/orquestrador/`) — pipeline automatizado: keywords-researcher → integrador → redator → cluster semântico → revisor SEO → publisher. Os prompts do redator e revisor não conheciam as regras do skill.

O efeito: pedir um post no chat seguia o skill, mas gerar via orquestrador produzia artigo sem FAQ, sem tabela HTML, com em-dashes e com palavras-bandeira de IA ("crucial", "fundamental", "jornada", etc.).

Esta entrega injeta as regras do skill nos prompts dos bots e adiciona validações deterministas no revisor, fechando o gap.

## Mudanças aplicadas

### 1. Redator — `src/lib/article-writer-llm.ts`

Expandido o `SYSTEM_PROMPT` com:

- **Vocabulário consistente do nicho** (tabela: "circunferência da cabeça" não "tamanho", "largura frontal" não "tamanho do óculos", evitar "cabeçudo"/"macrocéfalo").
- **Regras AEO obrigatórias**: primeiros 80–100 palavras respondem direto ao H1, densidade factual ≥ 1 medida a cada 200 palavras, ≥ 1 tabela HTML semântica `<table>`, seção `## Perguntas frequentes` com 4–8 H3 ao final, zero em-dashes, headings como perguntas/afirmações concretas (não palavras soltas), linguagem agent-friendly (frases curtas auto-contidas, repetir substantivo principal).
- **5 templates canônicos** selecionáveis pela intent da keyword: medida específica, comparativo, listicle, pillar, resposta única. O perfil editorial (PAS/FAB/AIDA/Jornada/Checklist) é usado como técnica retórica DENTRO do template, não em substituição.
- **Bloco "Humanização"** com: 21 palavras-bandeira banidas (crucial, fundamental, vale ressaltar, em suma, robusto, versátil, jornada, dominar, desvendar, transformar, no mundo atual, rica experiência, ampla variedade, etc.), 8 aberturas banidas ("Você já parou pra pensar...", "Quando se trata de...", etc.), regra absoluta da primeira frase conter um número, 6 marcadores de humano dos quais ≥ 3 devem aparecer (experiência primária, opinião com risco, números contraintuitivos, concessão honesta, ritmo irregular, aside ocasional), placeholder `[INSERIR EXPERIÊNCIA RICARDO]` em até 2 pontos.
- **Métrica de qualidade ampliada** no autocheck final do prompt.

Também expandido o `buildRevisionPrompt` com guidance específico de correção para cada novo `rule` ID, para que o loop de revisão LLM saiba como consertar cada falha detectada.

### 2. Revisor SEO — `src/lib/seo-reviewer.ts`

Adicionados detectores deterministas e 8 novas validações:

| Rule ID | Nível | Detector |
|---|---|---|
| `aeo.faq.section.missing` | warning | conta H3 (ou `**Pergunta?**`) dentro do bloco `## Perguntas frequentes`; mínimo 4. |
| `aeo.html.table.missing` | warning | regex por `<table` no markdown. |
| `aeo.em.dash.forbidden` | **error** | conta caractere `—`; também tem **auto-fix determinístico** (substitui por vírgula) — só esta regra entra em `FIXABLE_RULES`. |
| `aeo.measurements.density.min` | warning | regex por mm/cm/g/kg/R$/dias; meta ≥ 1 a cada 200 palavras. |
| `humanization.banned.flag.words` | warning | regex por 21 palavras/bigramas banidos. |
| `humanization.banned.opening` | warning | regex pelas 8 aberturas banidas na primeira frase do corpo. |
| `humanization.first.sentence.no.number` | warning | verifica se a primeira frase do primeiro parágrafo contém dígito. |
| `humanization.dead.triad` | warning | regex por "qualidade, conforto e estilo". |

`SeoMetrics` ganhou os campos: `faqCount`, `htmlTableCount`, `emDashCount`, `measurementsCount`, `measurementsDensity`, `bannedFlagWords`, `firstSentenceHasNumber`, `bannedOpeningDetected`, `deadTriadDetected`. Disponíveis no admin para análise por artigo.

### 3. Publisher / Blog page — `src/lib/blog.ts` + `src/app/blog/[...slug]/page.tsx`

- `src/lib/blog.ts`: nova função `extractFaqsFromMarkdown(md)` extrai pares Q&A do bloco `## Perguntas frequentes`. Suporta dois formatos: `### Pergunta?` + parágrafo (preferido) e `**Pergunta?**` + parágrafo (fallback).
- `src/app/blog/[...slug]/page.tsx`: ao renderizar um post, extrai FAQs e injeta `faqPageSchema(faqs)` no array de JSON-LD da página, junto com `articleSchema` e `breadcrumbListSchema`. Só injeta se houver ≥ 2 perguntas (evita schema inválido).
- `src/lib/json-ld.ts`: `faqPageSchema` agora inclui `inLanguage: 'pt-BR'`.

## Resumo dos novos `rule` IDs (para grep futuro)

```
aeo.faq.section.missing
aeo.html.table.missing
aeo.em.dash.forbidden          (error, auto-fix)
aeo.measurements.density.min
humanization.banned.flag.words
humanization.banned.opening
humanization.first.sentence.no.number
humanization.dead.triad
```

## Como testar manualmente

1. Abrir `/admin/orquestrador`, preencher um briefing e gerar um artigo via LLM.
2. Verificar no painel do Revisor SEO se as novas regras aparecem (devem aparecer poucas ou nenhuma se o redator seguiu o prompt).
3. Inserir manualmente uma palavra como "crucial" ou um em-dash no markdown → revisor deve detectar.
4. Publicar o post e abrir a URL final → no `<head>` deve haver um JSON-LD do tipo `FAQPage` (além do `Article` e `BreadcrumbList` já existentes).

## Caveats / não feito nesta entrega

- ~~**Sitemap updater** continua pendente (já estava no roadmap).~~ **Resolvido em 2026-05-13** — ver seção "Sitemap updater — entrega" abaixo.
- **Build do Next.js 16** (`npm run build`) ~~está falhando~~ **resolvido em 2026-05-13** — ver seção "Bug do build Next.js 16 — env var vazada" abaixo.
- A regra de "≥ 3 dos 6 marcadores de humano" só pode ser validada subjetivamente — não há detector determinista; é responsabilidade do redator no momento da geração.
- A regra de "ritmo irregular de frases" também é subjetiva — poderia futuramente virar uma checagem de variância no comprimento das frases, mas hoje é só prompt-side.

## Quick wins adicionais (mesma entrega)

- **`wordCount` no Article JSON-LD**: `articleSchema()` em [src/lib/json-ld.ts](src/lib/json-ld.ts) agora calcula `wordCount` a partir de `post.conteudo_md` (nova helper interna `countMarkdownWords`).
- **"Atualizado em" sempre visível**: removido o gating `wasUpdated` em [src/app/blog/[...slug]/page.tsx](src/app/blog/[...slug]/page.tsx). Agora aparece em todo post (usa `revised_at ?? updated_at ?? published_at`).
- **Cluster com 5 suportes fixos (= 6 posts totais)**: `CLUSTER_SYSTEM_PROMPT` em [src/lib/article-writer-llm.ts](src/lib/article-writer-llm.ts) agora pede exatamente 5 suportes em vez de "3 a 5".

## Modo rápido — 1 botão gera + revisa + publica cluster inteiro

Adicionado um painel "Modo rápido" no topo do orquestrador que faz tudo automaticamente: keyword → 6 artigos publicados com Link Wheel completo.

### Fluxo (orquestrado client-side, 5 fases visíveis)

1. **Buscando keywords secundárias** — chama `/api/admin/keyword-planner` com a seed; ranqueia por score; separa as 4 obrigatórias e as 10 contextuais.
2. **Detectando silo** — `suggestSiloPathAction(keyword)`.
3. **Montando cluster (pilar + 5 suportes)** — `suggestPostClusterAction()` retorna a estrutura com keywords, títulos sugeridos, intent e `linkaPara` de cada post.
4. **Gerando + revisando 6 artigos em paralelo** — `generateClusterArticlesAction(briefs)` (ver abaixo).
5. **Publicando os 6 posts** — `publishClusterArticlesAction(posts)`.

Cada fase aparece com status `○ pending` → `⏳ running` → `✓ done` (ou `✗ error` com motivo). Resultado final: lista de 6 URLs publicadas, marcando o pilar com `★`.

### Pré-cálculo de URLs para o Link Wheel

Antes de gerar os artigos, o cliente computa um `Map<keyword, url>` com `/blog/${siloPath}/${slugify(keyword)}` para cada um dos 6 posts. Esse mapa é usado pra resolver `linkaPara` (cada post sabe quais outros do anel deve linkar) em `linksInternosObrigatorios`, que vai no `WriterBrief`. Assim o redator escreve os links cruzados já apontando pras URLs definitivas, antes mesmo dos posts existirem no DB.

### Server actions novas — [src/app/admin/orquestrador/actions.ts](src/app/admin/orquestrador/actions.ts)

| Action | O que faz |
|---|---|
| `reviewArticleLoopAction(input)` | Loop de até 3 iterações de revisão SEO/AEO server-side: `reviewAndAutoFix` deterministico → `reviseArticleWithLlm` se issues restarem → repete. Retorna `{ finalMarkdown, finalTitulo, status, iterations, history }`. Refatoração do que antes vivia client-side em `runSeoReviewLoop`. |
| `generateClusterArticlesAction({ briefs })` | Recebe N briefs (no caso do quick mode, sempre 6), gera todos os artigos em **paralelo** via `Promise.all`, e roda o loop de revisão completo em cada um. Retorna `articles: GeneratedClusterArticle[]` com markdown final, título, status da revisão, issues restantes e tokens consumidos por fase. |
| `publishClusterArticlesAction({ posts })` | Insere os N posts no DB em sequência (cada um com `ensureUniqueSlug`), revalida `/blog`, hierarquia de silos, sitemap e feed RSS. Falha em qualquer post aborta com mensagem específica. |

### UI — [src/app/admin/orquestrador/OrchestratorWorkspace.tsx](src/app/admin/orquestrador/OrchestratorWorkspace.tsx)

- Novo painel destacado no topo (gradient verde-limão) com input + botão "Criar 6 artigos" + display de fases + lista de URLs publicadas.
- Fluxo manual existente (Passos 01–04, cluster, revisor, publisher) **encapsulado em `<details>`** colapsável "Modo manual — passo a passo (avançado)". O operador pode usar o quick mode por padrão e abrir o manual quando precisar editar entre passos.
- `runQuickClusterFlow(seed)` é a função client-side que orquestra as 5 fases, atualizando state per-phase.

### Configuração de timeout — [src/app/admin/orquestrador/page.tsx](src/app/admin/orquestrador/page.tsx)

Adicionado `export const maxDuration = 300` (5 minutos). O fluxo completo executa 6 gerações + até 18 revisões LLM em paralelo; tempo de parede tipicamente entre 90 s e 4 min. Vercel Pro é necessário pra esse limite (Hobby tem teto de 10 s).

## Slug conflict no quick mode — entrega

Antes: o quick mode pré-computava URLs como `/blog/${siloPath}/${slugify(keyword)}` no cliente e embedava esses links no markdown gerado pelo LLM. Se um desses slugs já existisse no DB, `ensureUniqueSlug` no publish appendava `-2` → URL final ficava diferente do que estava no markdown → Link Wheel quebrado.

Mais sutil ainda: se duas keywords distintas do cluster slugificassem pra mesma string (ex.: "óculos cabeça grande" e "oculos cabeca grande" — diacríticos removidos batendo), uma sobrescreveria a outra na publicação.

### Nova fase "Reservando slugs" no fluxo

Adicionada entre cluster generation e article generation:

1. Cliente coleta `{ siloPath, keyword }` dos 6 cluster posts.
2. Chama nova action `reserveClusterSlugsAction(items)`.
3. Server-side, para cada item: `slugify(keyword)` → `buildPostPath(silo, slug)` → verifica conflito vs **DB** *e* vs **outros itens já alocados nesta mesma batch** (`usedInBatch` Set). Appenda `-2`, `-3`, etc., até achar livre.
4. Retorna `{ keyword, siloPath, finalSlug, finalUrl, collisionDetected }` para cada post.
5. Cliente reconstrói `urlByKeyword` Map usando `reserved.finalUrl` (não mais o `slugify(keyword)` direto).
6. Artigos são gerados com cross-links apontando para as URLs definitivas.

### Verificação no publish

`publishClusterArticlesAction` recebe `expectedSlugs: string[]` (lista paralela aos posts). Para cada post:

1. Calcula `desiredSlug = buildPostPath(topicPath, articleSlug)`.
2. Chama `ensureUniqueSlug(desiredSlug)` (defensive — outro operador pode ter publicado nesse intervalo).
3. Se o slug final divergir do `expectedSlug`, **aborta com erro claro**: "Slug reservado X foi tomado entre a reserva e a publicação. Resolvido para Y, mas os links cruzados do cluster apontam para X. Aborte e gere o cluster novamente."

Sem aborto, posts já publicados antes do erro ficam no DB (limitação separada — ver "Rollback transacional", ainda pendente).

### UX

Nova fase "Reservando slugs únicos pro Link Wheel" aparece no painel de progresso. Quando há colisões resolvidas, o `detail` mostra: `"6 slugs reservados (3 colisões resolvidas com sufixo)"`. Sem colisões: `"6 slugs reservados sem colisões"`. Operador vê imediatamente se a keyword seed está em conflito antes mesmo de chamar o OpenAI.

### Arquivos alterados

- [src/app/admin/orquestrador/actions.ts](src/app/admin/orquestrador/actions.ts) — `reserveClusterSlugsAction` + `ReservedClusterSlug`/`ReserveClusterSlugsResult` types; `publishClusterArticlesAction` ganhou `expectedSlugs` opcional.
- [src/app/admin/orquestrador/OrchestratorWorkspace.tsx](src/app/admin/orquestrador/OrchestratorWorkspace.tsx) — `QuickPhase` ganhou `'reserve'`; `runQuickClusterFlow` chama a action entre cluster e generate, constrói `urlByKeyword` a partir das reservas, e passa `expectedSlugs` no publish.

### Cenários cobertos

| Cenário | Antes | Agora |
|---|---|---|
| Cluster fresco, sem conflitos | ✓ funciona | ✓ funciona, detail mostra "sem colisões" |
| Mesma seed rodada 2× | ✗ links quebrados | ✓ segunda execução pega `-2`, links batem |
| Duas keywords do cluster slugificam igual (acentos) | ✗ uma sobrescreve a outra | ✓ segunda pega `-2` |
| Race condition publish vs publish concorrente | ✗ silencioso | ✓ aborta com erro descritivo |

## Bug do build Next.js 16 — env var vazada

`npm run build` falhava com `TypeError: generate is not a function` em todo ambiente. Investigação revelou:

**Causa raiz:** a variável de ambiente `__NEXT_PRIVATE_STANDALONE_CONFIG` estava setada no shell do usuário (Windows) com um blob JSON de configuração de outro projeto (`C:\Users\tomas\OneDrive\Desktop\CodeGPT\codegpt-nextjs`). Provável origem: extensão CodeGPT do VS Code (também havia `__NEXT_PRIVATE_ORIGIN=http://localhost:54112`).

Quando o Next.js inicia o build, [`loadConfig`](node_modules/next/dist/server/config.js) verifica essa env var ANTES de procurar `next.config.ts/mjs/js`. Se setada, ele faz `JSON.parse` e retorna o config direto — pulando completamente o arquivo do projeto. Como funções não serializam pra JSON, `generateBuildId` virava `undefined`, causando o `TypeError: generate is not a function` no [`getBuildId`](node_modules/next/dist/build/index.js).

**Sintomas:**
- O erro mostrava `at ignore-listed frames` (Next.js filtra frames internos no stack).
- `next.config.ts` parecia não estar sendo carregado (testes com `throw` no topo confirmaram).
- `tsc --noEmit` e ESLint passavam normalmente — não era erro de código do projeto.

**Diagnóstico:** patch em `node_modules/next/dist/build/generate-build-id.js` revelou `typeof generate: undefined`. Patch adicional em `loadConfig` mostrou `configOrigin: 'next.config.js'` (origem default) mesmo com `next.config.ts` presente. Listagem do env confirmou a variável vazada.

**Fix imediato:** `unset __NEXT_PRIVATE_STANDALONE_CONFIG __NEXT_PRIVATE_ORIGIN` antes de rodar `npm run build`. Build passa imediatamente.

**Fix permanente aplicado em 2026-05-13:** scripts do `package.json` agora usam `cross-env` para neutralizar as vars antes de cada invocação do `next`:

```json
"scripts": {
  "dev": "cross-env __NEXT_PRIVATE_STANDALONE_CONFIG= __NEXT_PRIVATE_ORIGIN= next dev",
  "build": "cross-env __NEXT_PRIVATE_STANDALONE_CONFIG= __NEXT_PRIVATE_ORIGIN= next build",
  "start": "cross-env __NEXT_PRIVATE_STANDALONE_CONFIG= __NEXT_PRIVATE_ORIGIN= PORT=3001 next start"
}
```

Notas da implementação:
- `cross-env@10.1.0` (versão atual) **não suporta** mais o flag `-u` para unset. A solução é setar a var para string vazia (`VAR=`), porque o Next.js usa `if (process.env.__NEXT_PRIVATE_STANDALONE_CONFIG)` — string vazia é falsy e o caminho de standalone é pulado.
- `cross-env` foi adicionado como devDependency. Atenção: o `npm config get omit` do usuário retornava `dev`, então `npm install --save-dev` "instalava" sem gravar no disco. **Use `npm install --include=dev --save-dev <pacote>`** ao adicionar dev dependencies neste ambiente, ou ajuste o `npm config set omit ""` para destravar isso globalmente.
- O `start` script também unificou o hack `set PORT=3001 &&` (Windows-only) usando `cross-env PORT=3001`, que funciona em qualquer plataforma.
- Validação: rodei `npm run build` com `export __NEXT_PRIVATE_STANDALONE_CONFIG=...` setado no shell (simulando o leak da extensão) e o build passou.

A fonte do leak continua sendo a extensão **CodeGPT** do VS Code (`__NEXT_PRIVATE_ORIGIN=http://localhost:54112` confirma). Os scripts agora estão imunes mesmo com a extensão ativa.

## Sitemap updater — entrega

O bot `sitemap-updater` (último passo do pipeline do orquestrador) era o item pendente. A revalidação automática já existia em todas as mutações de post, mas o conteúdo do `/sitemap.xml` estava incompleto e usava `lastModified = now()` em quase tudo (mentindo pro Google sobre frequência de update).

### Mudanças em [src/app/sitemap.ts](src/app/sitemap.ts)

1. **3 PDPs adicionadas** (`/produto/mb-1572s`, `/produto/viking`, `/produto/presence`) com prioridade `0.9`, acima do blog. Inclui `images: [...]` (sitemap protocol image extension) listando todas as fotos do produto via `productCatalog[i].imagens` — bom para Google Shopping / Imagens.
2. **`/guia-de-medidas` adicionada** com prioridade `0.85` (pilar de conversão, vem antes do blog).
3. **`lastModified` reais por entrada:**
   - `/blog` → data do post mais recente publicado (não mais `now()`).
   - Cada pilar de silo `/blog/{siloPath}` → data do post mais recente daquele silo (mapa pré-computado `lastModifiedByTopic`).
   - Cada post → `updated_at ?? published_at ?? created_at` (fallback chain).
4. **Ordem da hierarquia respeitada:** Home (1.0) → PDPs (0.9) → Guia (0.85) → /blog (0.8) → silos (0.72) → posts (0.64). Critério de aceite "pilares antes dos artigos derivados" garantido.

### Revalidação (já existia, agora documentada)

Todas as mutações de post em [src/app/admin/posts/actions.ts](src/app/admin/posts/actions.ts) e [src/app/admin/orquestrador/actions.ts](src/app/admin/orquestrador/actions.ts) já chamavam `revalidatePath('/sitemap.xml')`:

- `createPost` (admin manual) ✓
- `updatePost` (admin manual) ✓
- `deletePost` (admin manual) ✓
- `togglePublish` (admin manual) ✓
- `publishOrchestratedPost` (orquestrador, single post) ✓
- `publishClusterArticlesAction` (quick mode, 6 posts em batch) ✓

Toda mudança de estado de publicação (criação, edição, despublicação, exclusão) força recompilação do `/sitemap.xml` na próxima request — sem cache stale para Google/Bing.

### Contrato do bot atualizado

[src/lib/article-orchestrator.ts](src/lib/article-orchestrator.ts) — o `editorialSkills[id='sitemap-updater']` ganhou objetivo, entradas, saídas e critérios de aceite alinhados ao que o sitemap.ts realmente faz hoje. Refletido automaticamente no card do bot dentro do painel "Bots do orquestrador (avançado)" da tela do orquestrador.

### Limitações conhecidas do quick mode

- ~~**Conflito de slug**: se `ensureUniqueSlug` precisar appendar `-2` (porque post com slug igual já existe), o link interno cruzado escrito no markdown não bate com a URL final. Risco baixo pra cluster fresco; alto se rodar o quick mode duas vezes com mesma seed.~~ **Resolvido em 2026-05-13** — ver "Slug conflict no quick mode — entrega" abaixo.
- **Tudo-ou-nada na publicação**: se o post 4 falhar ao inserir, posts 1–3 já estão publicados e os 5–6 não saem. Não há rollback transacional. Operador precisa limpar manualmente em caso de erro parcial.
- **Sem checkpoint**: se a geração falhar no meio (e.g., OpenAI 429), perde-se todo o trabalho. Sem retry automático nem persistência de drafts intermediários.
- **Produto fixo**: o cluster inteiro usa o produto selecionado no painel manual (ou o primeiro do catálogo). Não há seleção de produto por post de suporte.
- **Custo por execução**: ~$0,60–$1,20 em chamadas OpenAI (6 gerações + revisões), dependendo de quantas iterações de LLM são necessárias por artigo.

## Arquivos modificados

- `src/lib/article-writer-llm.ts`
- `src/lib/seo-reviewer.ts`
- `src/lib/blog.ts`
- `src/lib/json-ld.ts`
- `src/app/blog/[...slug]/page.tsx`
- `.claude/skills/calibre-blog-content/` (skill instalado/sincronizado, espelha `docs/files/`)
