# Implementação: Integração Real com Google Ads Keyword Planner

## Data
08/05/2026

## Descrição
- Substituição do acesso direto ao mock do Keyword Planner no client por uma rota server-side protegida.
- Criação de cliente server-only para consultar a Google Ads API via `generateKeywordIdeas`.
- Uso das credenciais `GOOGLE_ADS_*` do ambiente local/produção sem expor tokens no navegador.
- Manutenção de fallback local identificado como `Mock Keyword Planner` quando a API falha, não retorna dados ou está sem configuração.

## Passos executados
1. Verificada a presença das variáveis `GOOGLE_ADS_*` no `.env.local` sem expor valores.
2. Atualizado `src/lib/keyword-planner.ts` para explicitar que os dados locais são fallback mock.
3. Criado `src/lib/google-ads-keyword-planner.ts` com OAuth refresh token, chamada ao Google Ads e normalização do retorno.
4. Criada a rota protegida `src/app/api/admin/keyword-planner/route.ts` com validação do cookie de admin.
5. Atualizado `src/app/admin/orquestrador/OrchestratorWorkspace.tsx` para consultar a rota server-side via `fetch`.
6. Atualizado `.env.local.example` com variáveis obrigatórias e opcionais da Google Ads API.
7. Atualizada a documentação estrutural do projeto.

## Próximos passos sugeridos
- Configurar as mesmas variáveis `GOOGLE_ADS_*` nas Environment Variables da Vercel antes de depender da busca real em produção.
- Validar no admin se o dropdown mostra `Fonte: Google Ads Keyword Planner`; se mostrar `Fallback local`, conferir permissão do Developer Token, Customer ID e Refresh Token.
- Considerar debounce no campo de busca se o uso ficar frequente, para reduzir chamadas à API.

---

_Registro automático de implementação pelo assistente GitHub Copilot._
