# Estrutura do Projeto — Calibre (Next.js + Firebase)

Este documento descreve a estrutura principal do projeto, destacando os arquivos e pastas mais relevantes para desenvolvimento, build e deploy.

## Raiz do Projeto
- **README.md** — Documentação geral do projeto.
- **package.json** — Dependências, scripts e metadados do projeto.
- **next.config.ts** — Configuração do Next.js (inclui output estático e domínios de imagem).
- **firebase.json** — Configuração do Firebase Hosting (define pasta de deploy, rewrites, etc).
- **.firebaserc** — Referência ao projeto Firebase utilizado.

## Diretórios Importantes
- **/src/app/** — Código principal da aplicação Next.js (App Router). Contém:
  - **page.tsx** — Página principal do produto (landing page premium).
- **/out/** — Build estático gerado pelo Next.js para deploy no Firebase Hosting.
- **/.next/** — Build intermediário do Next.js (não usado no deploy estático).
- **/docs/** — Documentação incremental e técnica do projeto.

## Outros Arquivos Relevantes
- **public/** — (Se existir) Arquivos estáticos públicos (favicons, imagens, etc).
- **tailwind.config.js** — (Se existir) Configuração do Tailwind CSS.
- **tsconfig.json** — (Se existir) Configuração do TypeScript.

## Fluxo de Deploy
1. Build: `npm run build` (gera `/out`)
2. Deploy: `firebase deploy --only hosting`

## Observações
- O projeto utiliza Next.js 14+ com App Router e Tailwind CSS.
- O deploy é feito como site estático (output: export) no Firebase Hosting.
- O domínio customizado é gerenciado via Registro.br.

---

Mantenha este arquivo atualizado conforme a estrutura evoluir.
