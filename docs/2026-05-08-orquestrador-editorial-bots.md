# Implementação: Orquestrador Editorial de Bots

## Data
08/05/2026

## Descrição
- Estruturação de um orquestrador editorial para geração de artigos com seis skills: Keywords Researcher, Integrador de Conteúdo, Redator, Revisor SEO, Publisher e Sitemap Updater.
- Criação de uma tela protegida em `/admin/orquestrador` para montar briefing editorial com tema, silo, produto, persona, problema, narrativa e palavras-chave.
- Inclusão de contratos de entrada, saída e critérios de aceite para cada bot.
- Criação de catálogo editorial inicial do produto MB-1572S para o integrador cruzar medidas, dores e benefícios.
- Criação de sitemap dinâmico para expor landing, blog, páginas-pilar, subtemas e posts publicados.

## Passos executados
1. Criado o módulo `src/lib/article-orchestrator.ts` com definição das seis skills, estruturas narrativas e geração de briefing em Markdown.
2. Criado o módulo `src/lib/catalog.ts` com dados editoriais e medidas do MB-1572S.
3. Criada a área `/admin/orquestrador` com formulário operacional e preview do briefing dos bots.
4. Implementado o `src/lib/keyword-planner.ts` com motor de busca simulado (mock) para fallback local.
5. Integrada a busca do Google Ads Keyword Planner na Skill 1 (Keywords Researcher) via rota server-side protegida, permitindo preenchimento automático de volume, fonte e intenção.
6. Criado o cliente server-only `src/lib/google-ads-keyword-planner.ts` para obter access token via refresh token e consultar `generateKeywordIdeas`.
7. Criada a rota `/api/admin/keyword-planner` para manter credenciais fora do navegador e validar o cookie do admin antes da consulta.
8. Atualizada a navegação do admin para acessar o orquestrador a partir do dashboard e da área de posts.
9. Criado `src/app/sitemap.ts` para organizar rotas indexáveis do site e do blog.
10. Atualizada a documentação estrutural do projeto.

## Variáveis de ambiente do Google Ads
- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_CLIENT_SECRET`
- `GOOGLE_ADS_REFRESH_TOKEN`
- `GOOGLE_ADS_CUSTOMER_ID`
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID`

Opcionais:
- `GOOGLE_ADS_API_VERSION` — padrão `v19`.
- `GOOGLE_ADS_LANGUAGE_RESOURCE` — padrão `languageConstants/1014` (português).
- `GOOGLE_ADS_GEO_TARGET_RESOURCE` — padrão `geoTargetConstants/2076` (Brasil).

As credenciais devem ficar apenas no servidor (`.env.local` em desenvolvimento e Environment Variables na Vercel). Se a API falhar ou não retornar sugestões, o orquestrador exibe fallback local identificado como `Mock Keyword Planner`.

## Próximos passos sugeridos
- Configurar as mesmas variáveis do Google Ads na Vercel antes do deploy de produção com consulta real.
- Validar no admin se a fonte exibida no dropdown é `Google Ads Keyword Planner` e não `Fallback local`.
- Persistir briefings gerados em banco quando houver necessidade de histórico editorial.
- Criar uma ação de Publisher para transformar o briefing aprovado em rascunho automaticamente.
- Enriquecer o catálogo conforme novos produtos forem adicionados.

---

_Registro automático de implementação pelo assistente GitHub Copilot._
