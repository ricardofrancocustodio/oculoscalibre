# Orquestrador editorial — Redator LLM + Revisor SEO integrado

## Data
2026-05-10

## Descrição

Fechou o pipeline do orquestrador editorial: keyword research → integrador → redator (template OU OpenAI real) → revisor SEO executável → publisher direto. Não precisa mais passar pelo PostForm para publicar artigo gerado pelo orquestrador.

## Mudanças

### 1. Redator com LLM real (OpenAI)
- Novo: [src/lib/article-writer-llm.ts](../src/lib/article-writer-llm.ts).
- Modelo default: `gpt-4o` (override via env `OPENAI_ARTICLE_MODEL`).
- System prompt grande com voz da marca, regras SEO obrigatórias e perfis editoriais. OpenAI faz prompt caching automático em prefixos repetidos (~50% off em tokens cacheados).
- Briefing estruturado: tema, keyword principal, keywords secundárias, persona, dor, prova, benefício, objeção, CTA, headings, produto, perfil editorial, silo path.
- Saída: markdown puro (sem cercas, sem prefácio), com 1× H1 contendo keyword principal, 4–6 H2s, alvo 1800–2200 palavras, links internos do mesmo silo, bloco final "## Sobre @oculoscalibre" com link Instagram.
- `max_completion_tokens: 8000` (suficiente para artigos longos com folga).

### 2. Revisor SEO integrado ao fluxo
- Botão "Rodar Revisor SEO" no orquestrador chama [reviewPostSeo](../src/lib/seo-reviewer.ts) localmente (skill já existia desde o Lote C).
- Painel mostra score + métricas (palavras, H1/H2, densidade keyword, meta lengths, alt em imagens, links internos) + lista de issues categorizadas (error/warning/info).
- Issues de nível `error` **bloqueiam** o botão "Publicar agora" — o usuário precisa corrigir e revisar de novo.
- Revisor é re-disparado quando: o markdown é editado, o título é editado ou a keyword principal muda. (O score reseta para `null` e o botão de publicar volta a "Revise antes".)

### 3. Markdown editável inline
- O `<textarea>` do redator deixou de ser readonly.
- Quando o usuário gera com OpenAI, o markdown vira editável com fonte "OpenAI (editável)".
- Botão "Voltar ao template" descarta a versão LLM e volta para o template estático.
- Editar manualmente o markdown invalida o último review SEO (precisa re-rodar).

### 4. Publisher persiste campos SEO
- [publishOrchestratedPost](../src/app/admin/orquestrador/actions.ts) agora insere também `meta_title`, `meta_description`, `keyword_principal`, `keywords_secundarias`, `cover_alt`.
- `autor` corrigido de `'Calibre'` (hardcoded antigo) para `'@oculoscalibre'`.
- `meta_title` é o título efetivo limitado a 60 chars.
- `meta_description` é o resumo do draft.
- `cover_alt` sugerido: `"<keyword> ilustrado pelo <produto>"`.

## Variáveis de ambiente

| Var | Onde | Valor |
|-----|------|-------|
| `OPENAI_API_KEY` | `.env.local` + Vercel (production e preview) | Configurada |
| `OPENAI_ARTICLE_MODEL` | opcional | Default `gpt-4o`. Pode trocar para `gpt-4o-mini` (mais barato), `gpt-5` (se disponível na conta), etc. |

Vercel env vars setadas via CLI:
```sh
vercel env add OPENAI_API_KEY production --value "sk-proj-..." --yes
vercel env add OPENAI_API_KEY preview "" --value "sk-proj-..." --yes
```

## Validação
- `npm run build` ✅ Sem erros TS, sem warnings.
- 17 rotas (mantidas).

## Próximos passos sugeridos

- **Streaming** da geração OpenAI no UI (atualmente espera resposta completa antes de mostrar).
- **Suporte a capa** no orquestrador (hoje publica sem capa via "Publicar agora").
- **Versões A/B** do mesmo briefing (gerar 2 artigos com perfis diferentes lado a lado e escolher).
- **Auto-fix** de issues simples do revisor (ex.: gerar alt para imagens markdown faltantes via prompt curto).
- **Histórico de gerações**: persistir em uma tabela `orchestrator_drafts` para retomar/comparar/auditar custo.
- **Modelo configurável por UI** (não só env var): dropdown de modelos disponíveis.
