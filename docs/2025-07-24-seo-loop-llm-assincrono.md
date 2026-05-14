# SEO Loop LLM Assíncrono no Orquestrador

**Data:** 2025-07-24  
**Commit:** `8a77765`

## Descrição

Substituição do loop de revisão SEO síncrono/determinístico por um loop assíncrono que chama o LLM (Redator) entre iterações para corrigir os issues que as correções automáticas não resolvem.

## Passos executados

1. **`src/lib/seo-reviewer.ts`**: adicionada a função `reviewAndAutoFix` — single-pass que combina `reviewPostSeo` + `applyAutoCorrections` e retorna `{ review, corrections, updated }`.
2. **`src/app/admin/orquestrador/OrchestratorWorkspace.tsx`**:
   - Definida interface `SeoIterationRecord` antes do componente.
   - Estado antigo (`seoReview`, `seoLoopResult`) substituído por: `seoRunning`, `seoPhase`, `seoStatus` (`'pass'|'warn'|'fail'|null`), `seoHistory` (`SeoIterationRecord[]`).
   - Função `runSeoLoop` (síncrona) substituída por `runSeoReviewLoop` (assíncrona, máx 3 iterações):
     - Iteração = revisão determinística (`reviewAndAutoFix`) + se ainda houver erros/warnings e não for última iteração, chama `reviseArticleWithLlmAction` para corrigir via IA.
     - Loop para na primeira iteração sem issues ou ao atingir MAX=3.
   - Botão "Revisar SEO" sempre visível, desabilitado durante execução.
   - UI de histórico: cada iteração como `<details>` com score, issues, correções automáticas e tokens de IA.
   - Badge de status final: verde (pass) / amarelo (warn) / vermelho (fail).
   - Publicação bloqueada enquanto `!seoStatus` ou `seoStatus === 'fail'`.

## Comportamento

```
loop (máx 3 iterações):
  1. Revisão determinística → aplica correções automáticas
  2. Se sem issues → seoStatus = 'pass', para
  3. Se última iteração → seoStatus = 'fail'|'warn', para
  4. Senão → chama LLM para corrigir → próxima iteração
```

## Próximos passos sugeridos

- Permitir configurar MAX iterações via painel admin.
- Exibir diff das alterações entre iterações.
- Persistir histórico SEO junto com o rascunho no localStorage.
