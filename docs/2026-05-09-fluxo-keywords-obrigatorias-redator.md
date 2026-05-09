# Implementação: Fluxo de Keywords Obrigatórias para o Redator

## Data
09/05/2026

## Descrição
- Ajuste do fluxo do Keywords Researcher para remover a escolha manual entre palavra-chave principal e secundária em cada resultado.
- A palavra-chave digitada na busca passa a ser a keyword principal do artigo.
- As caudas longas retornadas pela pesquisa passam a alimentar automaticamente a lista de palavras-chave relacionadas obrigatórias para o Redator.

## Passos executados
1. Removidos os botões `Principal` e `Secundária` da tabela de resultados do Keyword Researcher.
2. Atualizado o comportamento da busca para aplicar o termo pesquisado como keyword principal.
3. Atualizado o comportamento da busca para transformar os resultados relacionados em palavras-chave obrigatórias no briefing.
4. Ajustado o briefing do orquestrador para explicitar que os termos relacionados devem aparecer naturalmente no texto final.
5. Atualizada a seção do Redator para receber a lista de palavras-chave obrigatórias junto com o pacote do Integrador de Conteúdo.

## Próximos passos sugeridos
- Adicionar seleção por checkbox caso seja necessário remover termos irrelevantes antes de enviar ao briefing.
- Criar uma visualização separada do pacote final que será enviado ao Redator.
- Permitir ajuste manual de intenção e prioridade das palavras-chave relacionadas.

---

_Registro automático de implementação pelo assistente GitHub Copilot._
