# Link Wheel Automático — Injeção de Links Internos do Cluster no LLM

**Data:** 2026-05-10  
**Commit:** `ffa387e`  
**Status:** Produção (Vercel)

---

## Objetivo

Quando o redator seleciona um post do cluster semântico via "Usar como base", o LLM que gera o artigo recebe automaticamente os links internos obrigatórios para os outros posts do cluster. Isso cria um **link wheel semântico** real — cada artigo linkando contextualmente para os demais, formando um anel de links que beneficia SEO e experiência do leitor.

---

## Arquivos Modificados

### `src/lib/article-writer-llm.ts`

- Adicionado campo opcional `linksInternosObrigatorios` ao `WriterBrief`:
  ```typescript
  linksInternosObrigatorios?: { titulo: string; url: string; keyword: string }[];
  ```
- `buildBriefingPrompt`: nova seção "Links internos obrigatórios do cluster semântico" que instrui o LLM a inserir cada link com a URL exata de forma contextual (sem agrupar no mesmo parágrafo, sem criar seção específica, sem notas de rodapé).

### `src/app/admin/orquestrador/OrchestratorWorkspace.tsx`

- **Estado `clusterLinksParaLlm`**: armazena os links do cluster que serão passados ao LLM.
- **`handleUsarClusterPost(post, allPosts)`**: novo handler acionado pelo botão "Usar como base" em `ClusterPostCard`. Resolve os posts linkados via `post.linkaPara` → filtra `allPosts` → gera URLs com `/blog/${p.siloPath}/${slugify(p.keyword)}`. Também preenche keywords secundárias/contextuais via Keyword Planner sem sobrescrever o cluster existente.
- **`ClusterPostCard.onUsar`**: prop atualizada de `(keyword: string) => void` para `(post: ClusterPost) => void`.
- **`generateWithLlm()`**: passa `linksInternosObrigatorios: clusterLinksParaLlm` ao `generateArticleWithLlmAction` quando há links de cluster.

---

## Fluxo

```
Cluster sugerido pelo LLM
         │
         ▼
  Usuário clica "Usar como base" em um ClusterPostCard
         │
         ▼
  handleUsarClusterPost(post, allPosts)
  ├── Resolve posts linkados via post.linkaPara
  ├── Monta URLs: /blog/{siloPath}/{slugify(keyword)}
  ├── setClusterLinksParaLlm([...links])
  ├── setKeywordPrincipal(post)
  └── Busca keywords secundárias no Keyword Planner
         │
         ▼
  Usuário clica "Gerar com LLM"
         │
         ▼
  generateArticleWithLlmAction({
    ...,
    linksInternosObrigatorios: [{ titulo, url, keyword }]
  })
         │
         ▼
  buildBriefingPrompt injeta seção de links obrigatórios
         │
         ▼
  GPT-4o gera artigo com links contextuais inseridos no corpo
```

---

## Comportamento do LLM

O prompt instrui o modelo a:
1. Inserir **cada link como âncora HTML** com a URL exata fornecida.
2. Posicionar os links **contextualmente** — onde o texto naturalmente mencionar o tema.
3. **Não agrupar** links no mesmo parágrafo.
4. **Não criar** seções, listas ou notas de rodapé para os links.
5. Usar a `keyword` do post como texto-âncora (anchor text).

---

## Decisões Técnicas

- O cluster não é re-sugerido quando o usuário clica "Usar como base" — o cluster permanece visível na UI para o redator consultar enquanto cria os demais posts.
- `clusterLinksParaLlm` é resetado para `[]` em `handlePlannerSearch` (busca manual), garantindo que links de cluster não "vazem" para artigos não relacionados ao cluster.
- A URL é gerada client-side com `slugify` (mesmo utilitário do restante do sistema), sem chamada extra ao servidor.
