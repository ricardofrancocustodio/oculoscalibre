# AEO Checklist — Calibre Blog

Cada post precisa servir dois leitores: o humano (que compra) e o agente de IA (que recomenda). Este checklist garante os dois.

## Por que AEO importa pra Calibre

Em 2026, queries shopping no Brasil estão sendo respondidas diretamente por:
- Google AI Overview (visível na imagem da SERP do Ricardo)
- ChatGPT Shopping
- Perplexity Shopping
- Gemini
- Claude (via web search)

Esses sistemas extraem trechos curtos e factuais. Posts genéricos, com prosa longa e poucos números, são invisíveis pra eles. Posts densos em fatos, com tabelas e schema, são citados.

A vantagem competitiva do Calibre é que **ninguém no nicho brasileiro está fazendo AEO direito**. SERP atual mostra Univisão, Ótica Store, Trendhim — todos com conteúdo genérico de "formato de rosto". A vaga de autoridade do nicho está aberta.

## Estrutura obrigatória de todo post

### 1. Resposta direta nos primeiros 100 palavras

A primeira coisa que aparece no corpo do texto deve responder, em até 100 palavras, a pergunta do título. Sem preâmbulo, sem história da marca, sem "neste post você vai aprender".

LLMs frequentemente citam apenas o primeiro parágrafo de uma página como resposta. Se esse parágrafo é genérico, você perdeu a citação.

**Exemplo bom (para post "Óculos para cabeça 60cm — quais servem"):**
> "Pra circunferência de cabeça de 60 cm, procure armações com largura frontal entre 145 mm e 150 mm e hastes a partir de 145 mm. Abaixo de 145 mm de frontal, o óculos aperta as têmporas; acima de 150 mm, sobra nas laterais. Esta faixa cobre cerca de 70% dos homens adultos brasileiros e é o ponto de partida ao comprar online."

### 2. Hierarquia de headings limpa

- 1 H1 (o título)
- H2 pra cada seção principal
- H3 pra subseções
- Nunca pular nível (H1 direto pra H3)
- Headings devem ser **perguntas ou afirmações concretas**, não palavras soltas

**Bom:** "Qual largura frontal serve em cabeça de 60cm?"
**Ruim:** "Largura frontal"

### 3. Densidade factual

Cada 200 palavras de texto deve ter pelo menos:
- 2 medidas em mm ou cm
- 1 referência a preço, prazo ou unidade concreta
- 1 comparação explícita (entre modelos, materiais, faixas de tamanho)

Posts sem essa densidade são "blog post genérico de e-commerce" e não rankeiam nem são citados.

### 4. Pelo menos uma tabela HTML semântica

Tabelas em HTML (`<table>`, `<thead>`, `<tbody>`) são o formato mais facilmente extraível por LLMs. Use sempre que comparar:

- Circunferência de cabeça × largura frontal recomendada
- Modelo × medidas × preço
- Material × peso × durabilidade
- Calibre × concorrente em atributos específicos

Nunca substitua tabela por imagem. Imagem é invisível pra crawler de texto.

### 5. Seção "Perguntas frequentes" com 4–8 Q&As

Toda página termina com H2 "Perguntas frequentes" seguido de 4 a 8 pares pergunta/resposta. Estes vão direto pro FAQPage JSON-LD.

Critérios das perguntas:
- Devem ser perguntas reais que o público faz (use o "People also ask" do Google como base — o Ricardo mostrou as queries: "como saber tamanho ideal de óculos", "qual melhor formato pra rosto gordinho", "óculos recomendados pra rosto grande")
- Resposta entre 40 e 80 palavras
- Cada resposta deve conter pelo menos uma medida ou número
- Não repetir literalmente conteúdo do corpo, mas pode reforçar pontos

### 6. Schema markup gerado junto com o post

Todo post entrega, no fim, dois blocos JSON-LD prontos pra colar:

**FAQPage** — gerado a partir da seção de perguntas frequentes do próprio post. Template em `assets/faqpage-schema-template.json`.

**Article** — com `headline`, `datePublished`, `dateModified`, `author` (Óculos Calibre), `image` (placeholder), `wordCount`, `inLanguage` (pt-BR), `mainEntityOfPage`.

### 7. Links internos

- Mínimo 2 links internos por post.
- Pelo menos 1 link pra uma PDP (página de produto) em oculoscalibre.com.br.
- Pelo menos 1 link pra outro post do blog ou pra "Guia de Medidas" (página pilar).
- Anchor text descritivo e com palavra-chave. Nunca "clique aqui".

### 8. Frescor visível

- Linha "Atualizado em [data]" visível abaixo do título.
- `dateModified` no schema Article reflete a data.
- Plano implícito: revisar e datar de novo a cada trimestre.

## Sinalizações pra agentes de IA

### llms.txt e robots.txt

Estes não são parte do post em si, mas todo post deve assumir que o site:

- Tem `/llms.txt` na raiz com resumo da marca, categorias, política de preço/entrega
- Permite explicitamente em `robots.txt`: GPTBot, PerplexityBot, ClaudeBot, Google-Extended, CCBot

Se o site ainda não tem isso, mencione no fim da entrega como nota pro Ricardo.

### Linguagem agent-friendly

- Use afirmações em frases curtas e auto-contidas. Cada frase deveria poder ser citada isoladamente sem perder sentido.
- Evite anáforas vagas ("isso", "aquilo", "esse problema") quando elas dependem de contexto a 3 parágrafos atrás. LLM extrai trechos curtos; trecho com referência perdida é descartado.
- Repita o substantivo principal ("óculos Calibre", "armação Calibre") em vez de pronome em momentos-chave. Não é deselegante; é citável.

## Anti-padrões a evitar

- **Wall of text.** Parágrafo de 8+ frases. Quebre.
- **Storytelling intro.** "Há cinco anos, Ricardo procurava óculos..." Pra blog Calibre, isso vai pra "Sobre a marca", não pro topo de cada post.
- **Frases-clichê de e-commerce.** "Encontre o par perfeito", "qualidade que você merece", "estilo único". Cortar todas.
- **Listas de adjetivos sem medida.** "Confortável, leve, durável e estiloso" não diz nada. "98 g, acetato CR-39, hastes flexíveis a 30° de abertura" diz.
- **Conclusão genérica.** Conclusões tipo "esperamos que este artigo tenha sido útil". Cortar. Se precisar fechar, feche com próximo passo concreto: "Veja a tabela de medidas Calibre" + link.

## Métrica de qualidade rápida

Antes de entregar, conte:
- Medidas no texto (mm/cm/g/R$): mínimo 8 num post de 1.200 palavras.
- Tabelas: mínimo 1.
- FAQs no fim: mínimo 4.
- Links internos: mínimo 2.
- Em dashes (—): zero.

Se algum item falhar, reescreva antes de entregar.
