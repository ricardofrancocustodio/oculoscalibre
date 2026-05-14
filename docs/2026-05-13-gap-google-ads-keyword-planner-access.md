# Keyword Planner — Gap de acesso ao Google Ads API

**Data:** 2026-05-13
**Status:** Fallback mock ativo. Aguardando aprovação de Basic Access.

## Situação atual

- Todas as env vars (`GOOGLE_ADS_CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN`, `CUSTOMER_ID`, `LOGIN_CUSTOMER_ID`, `DEVELOPER_TOKEN`) estão presentes em `.env.local`.
- OAuth funciona: `oauth2.googleapis.com/token` devolve `access_token` válido.
- Chamada `generateKeywordIdeas` retorna **HTTP 403 `DEVELOPER_TOKEN_NOT_APPROVED`** com mensagem:
  > *"The developer token is only approved for use with test accounts. To access non-test accounts, apply for Basic or Standard access."*

Token atual em uso: `XXDIXbKmtQjFpWpF65BTfw` (substituiu `ZTEM8E_keQxZUirvDwhhKw` em 2026-05-13). Os dois retornam o mesmo erro de nível de acesso, apenas com texto ligeiramente diferente.

## Impacto

- `src/lib/google-ads-keyword-planner.ts:198-213` captura o erro e cai pro `searchMockKeywords` (em `src/lib/keyword-planner.ts`).
- O orquestrador continua rodando: o redator recebe sugestões do mock como keywords secundárias e injeta no artigo.
- **Consequência editorial:** as keywords ainda servem pra LLMs/SEs ranquearem os posts (entram como texto/HTML real no artigo publicado), mas:
  - Volumes mensais exibidos no UI são sintéticos, não refletem demanda real.
  - Dificuldade de competição é estimativa, não vem do leilão real do Google.
  - Sugestões são limitadas ao dicionário hardcoded no mock — sem descoberta de cauda longa nova.

## Como resolver

**Caminho recomendado:** aplicar pra **Basic Access** no Google Ads API Center.

1. Logar em [ads.google.com](https://ads.google.com) com a conta MCC dona do `LOGIN_CUSTOMER_ID`.
2. Tools & Settings → Setup → **API Center**.
3. Botão **Apply for access** → preencher formulário (uso pretendido, volume estimado, política de privacidade do produto).
4. Aprovação geralmente em 1–3 dias úteis.

Após aprovação, **nenhuma mudança de código** é necessária — o mesmo `DEVELOPER_TOKEN` passa a ser aceito pelo endpoint `generateKeywordIdeas` em contas reais.

**Caminho alternativo (não recomendado p/ produção):** criar test MCC + test customer e apontar `GOOGLE_ADS_CUSTOMER_ID`/`LOGIN_CUSTOMER_ID` pra ela. Funciona imediatamente mas volumes vêm zerados/sintéticos — mesma qualidade do mock.

## Como validar quando o acesso for liberado

```bash
node --env-file=.env.local scripts/test-keyword-planner.mjs
```

Sucesso esperado: tabela com 5 ideias reais e volumes não-nulos. Erro de 403 com `DEVELOPER_TOKEN_NOT_APPROVED` significa que a aprovação ainda não saiu.
