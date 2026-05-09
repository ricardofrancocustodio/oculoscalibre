# Implementação: Tabela de Cauda Longa no Keyword Researcher

## Data
09/05/2026

## Descrição
- Substituição do dropdown de sugestões do Keyword Researcher por uma tabela fixa de palavras-chave de cauda longa relacionadas.
- Separação visual entre resultados de pesquisa e campos já aplicados ao briefing editorial.
- Manutenção das mesmas informações exibidas anteriormente: termo, volume mensal, dificuldade, intenção e fonte.

## Passos executados
1. Transformado o campo de busca em formulário com botão `Buscar`.
2. Criada tabela de resultados com colunas para cauda longa, volume, dificuldade, intenção, fonte e ações.
3. Mantidas ações para aplicar cada sugestão como keyword principal ou secundária.
4. Ajustado o comportamento para manter a tabela visível após aplicar uma sugestão, evitando confusão entre pesquisa e preenchimento do briefing.
5. Preservado o aviso de fallback quando o Developer Token ainda não possui Basic ou Standard Access.

## Próximos passos sugeridos
- Adicionar filtro por intenção de busca quando houver mais sugestões retornadas pela API real.
- Permitir selecionar múltiplas caudas longas e aplicar em lote nas keywords secundárias.
- Quando o Google aprovar o Developer Token, validar a tabela com dados reais do Keyword Planner.

---

_Registro automático de implementação pelo assistente GitHub Copilot._
