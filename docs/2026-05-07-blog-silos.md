# Implementação: Estrutura de Blog em Silos

## Data
07/05/2026

## Descrição
- Criação da área pública `/blog` com visual próprio e foco editorial.
- Implementação de arquitetura de silos com URLs hierárquicas para páginas-pilar, subtemas e artigos.
- Ajuste do admin de posts para separar a trilha do silo do slug do artigo.
- Inclusão de interlinking interno por silo com breadcrumbs, páginas de tema e artigos relacionados.
- Atualização de metadata base da aplicação para refletir a marca Calibre.

## Passos executados
1. Adição de helpers para compor e interpretar caminhos hierárquicos do blog sem alterar o schema atual da tabela `posts`.
2. Criação da camada pública do blog em `/blog` e `/blog/[...slug]`.
3. Implementação de agrupamento por silo, páginas-pilar e links relacionados dentro do mesmo tema.
4. Atualização do formulário do admin para aceitar a estrutura do silo em formato de diretório.
5. Ajuste das revalidações para atualizar home do blog, pilares e artigos afetados após cada alteração.
6. Atualização da documentação estrutural do projeto.

## Próximos passos sugeridos
- Definir um mapa editorial dos primeiros silos prioritários com base em intenção de busca.
- Padronizar descrições e CTA por página-pilar para reforçar SEO e conversão.
- Adicionar sitemap/feed específico do blog quando a base de artigos crescer.

---

_Registro automático de implementação pelo assistente GitHub Copilot._
