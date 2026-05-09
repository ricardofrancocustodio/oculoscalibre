# Estrutura do Projeto — Calibre

Este documento descreve a estrutura atual do projeto, com foco nas áreas públicas do site, no painel admin e no blog em arquitetura de silos.

## Raiz do projeto
- `package.json` — scripts e dependências da aplicação Next.js.
- `next.config.ts` — configuração principal do Next.js.
- `eslint.config.mjs` — lint do projeto.
- `postcss.config.mjs` — integração do Tailwind CSS v4.
- `AGENTS.md` / `CLAUDE.md` — instruções operacionais do repositório.
- `firebase.json` — legado da hospedagem anterior. O deploy atual é feito na Vercel.

## Código da aplicação
- `/src/app/layout.tsx` — layout raiz, fontes globais e metadata base.
- `/src/app/globals.css` — estilos globais, utilitários responsivos e tipografia do blog.
- `/src/app/page.tsx` — landing page principal do MB-1572S.

## Blog público
- `/src/app/blog/page.tsx` — home do blog com visão dos silos, artigos recentes e conteúdos legados.
- `/src/app/blog/[...slug]/page.tsx` — resolve páginas-pilar, subtemas e artigos publicados em URLs hierárquicas.
- `/src/app/blog/_components.tsx` — casca visual compartilhada do blog, cards e layout responsivo.

## Admin
- `/src/app/admin/page.tsx` — dashboard de leads e estatísticas.
- `/src/app/admin/actions.ts` — login/logout do admin.
- `/src/app/admin/login/page.tsx` — tela de autenticação.
- `/src/app/admin/posts/page.tsx` — listagem de posts.
- `/src/app/admin/posts/novo/page.tsx` — criação de post.
- `/src/app/admin/posts/[id]/page.tsx` — edição de post.
- `/src/app/admin/posts/PostForm.tsx` — formulário com suporte à estrutura do silo e slug do artigo.
- `/src/app/admin/posts/actions.ts` — create/update/delete/publish com revalidação das páginas do blog.
- `/src/app/admin/posts/MarkdownPreview.tsx` — preview do conteúdo em Markdown.
- `/src/app/admin/orquestrador/page.tsx` — cockpit do orquestrador editorial de artigos.
- `/src/app/admin/orquestrador/OrchestratorWorkspace.tsx` — interface client-side para montar o briefing dos bots.
- `/src/app/admin/orquestrador/actions.ts` — server action autenticada para publicar artigos gerados pelo Publisher.

## APIs
- `/src/app/api/leads/route.ts` — cria lead e dispara e-mails via Resend.
- `/src/app/api/leads/count/route.ts` — total de leads para o contador público.
- `/src/app/api/track/route.ts` — registra page views.
- `/src/app/api/admin/keyword-planner/route.ts` — rota protegida que consulta o Google Ads Keyword Planner para o orquestrador editorial.

## Camada de dados e utilitários
- `/src/lib/db.ts` — cliente Neon, criação idempotente de tabelas e queries de posts/leads.
- `/src/lib/blog.ts` — transformação de posts em dados de navegação por silo, breadcrumbs e relacionados.
- `/src/lib/article-orchestrator.ts` — contratos das skills editoriais e geração de briefing operacional.
- `/src/lib/article-writer.ts` — gera rascunhos Markdown do Redator com perfis editoriais variáveis a partir do briefing integrado.
- `/src/lib/article-publisher.ts` — valida o pacote de publicação, normaliza silo/slug/tags e prepara a URL final do artigo.
- `/src/lib/content-integrator.ts` — cruza keyword, intenção, produto, medidas, dor e CTA para gerar o pacote editorial enviado ao Redator.
- `/src/lib/catalog.ts` — catálogo editorial dos produtos usados pelo integrador de conteúdo.
- `/src/lib/google-ads-keyword-planner.ts` — cliente server-only da Google Ads API para busca real de ideias de palavras-chave.
- `/src/lib/keyword-planner.ts` — fallback local do Keyword Planner quando a API real falha ou não retorna sugestões.
- `/src/lib/slug.ts` — slugify, parsing e composição de caminhos hierárquicos do blog.
- `/src/lib/markdown.tsx` — renderização sanitizada de Markdown.
- `/src/app/sitemap.ts` — sitemap dinâmico com landing, blog, páginas-pilar e posts publicados.

## Assets e documentação
- `/public` — arquivos públicos estáticos.
- `/docs` — histórico incremental das implementações e documentos de apoio.

## Fluxo de publicação do blog
1. Criar ou editar um post em `/admin/posts`.
2. Informar a trilha do silo em formato hierárquico, por exemplo: `formatos-de-oculos/armacoes-retangulares`.
3. Informar o slug do artigo.
4. Publicar o conteúdo para gerar URLs como `/blog/formatos-de-oculos/armacoes-retangulares/como-escolher`.
5. O blog passa a expor:
   - home do blog em `/blog`
   - página-pilar por silo em `/blog/<silo>`
   - páginas intermediárias de subtema em `/blog/<silo>/<subtema>`
   - artigo final em `/blog/<silo>/<subtema>/<artigo>`

## Build e deploy
1. Build local: `npm run build`
2. Deploy de produção: `npx vercel --prod`

Mantenha este documento atualizado sempre que houver nova rota, novo módulo ou alteração estrutural relevante.
