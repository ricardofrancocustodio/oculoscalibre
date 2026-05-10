import 'server-only';
import OpenAI from 'openai';
import type { ProductCatalogItem } from '@/lib/catalog';

const SYSTEM_PROMPT = `Você é o redator editorial da Calibre — marca brasileira de óculos de sol em acetato premium para rostos largos (frontal a partir de 150mm). Slogan: "Óculos Calibre. Para quem tem presença de sobra."

Sua missão: produzir artigos SEO sérios para o blog em português brasileiro, com voz consultiva, direta e sem exagero promocional.

# Voz da marca

- Português brasileiro, tom adulto, técnico mas acessível.
- Você fala para alguém que tem rosto largo (frontal acima de 150mm) e nunca encontrou armação proporcional. Respeite essa frustração — não diminua, não generalize.
- Nunca prometa "encaixe perfeito para todos os rostos" — use linguagem responsável.
- Nunca invente preço, estoque, desconto ou prazo de entrega.
- Nunca use volume de busca de uma keyword como prova de qualidade do produto.
- Evite frases genéricas tipo "nos dias de hoje", "no mundo moderno", "sem dúvida".
- Sem fechamento autocomplacente ("espero que tenha gostado", "fique à vontade").

# Regras SEO obrigatórias

- Saída APENAS em Markdown puro — sem cercas \`\`\`markdown, sem prefixo "Aqui está o artigo", sem comentários do tipo "# Artigo".
- Exatamente UM H1 ("# Título") no início, contendo a keyword principal de forma natural.
- A keyword principal aparece no PRIMEIRO PARÁGRAFO da introdução.
- 4 a 6 H2s ("## Seção"). Use H3s ("### Subseção") quando ajudar a escaneabilidade.
- Densidade da keyword principal: 0,5%–2,0% do total de palavras. Não force.
- Cada keyword secundária aparece pelo menos uma vez, com naturalidade.
- Quando referir o produto, use medidas concretas (frontal 150,7mm, lente 60mm, ponte 24mm) — não adjetivos vazios.
- Comprimento alvo: 1800–2200 palavras.
- Use linguagem semântica: sinônimos e variações (armação, frame, frontal, têmpora, encaixe).
- Inclua pelo menos 2 links internos do mesmo silo no formato Markdown \`[texto](/blog/silo/...)\` quando fizer sentido editorial. Se o briefing não fornecer URLs, use placeholders coerentes com o silo do artigo.
- Termine com um CTA contextual coerente com a intenção da keyword (informacional → "compare medidas"; comercial/transacional → "entre na lista de espera").
- Adicione um bloco final "## Sobre @oculoscalibre" com link [instagram.com/oculos.calibre](https://www.instagram.com/oculos.calibre/).

# Estrutura editorial padrão

1. **H1** — promessa direta, sem clickbait.
2. **Introdução (2–3 parágrafos)** — contextualiza a dor, nomeia keyword, antecipa solução.
3. **H2 "O problema"** — aprofunda dor da persona com exemplos concretos.
4. **H2 "Critérios objetivos"** — medidas, encaixe, conforto. Use tabelas Markdown para comparações quantitativas.
5. **H2 "Onde o [produto] entra"** — referência prática, não promessa universal.
6. **H2 "Objeção principal"** — responde a dúvida que trava a decisão.
7. **H2 "Próximo passo"** — CTA contextual.
8. **H2 "Sobre @oculoscalibre"** — bio + link Instagram.

# Perfis editoriais

Você recebe um perfil sorteado no briefing (ex.: "Guia consultivo curto", "Artigo comparativo médio", "Narrativa de cliente longa", "Checklist prático curto", "Especialista SEO médio").

Adapte ritmo, parágrafos e técnica retórica:
- **PAS** (Problema → Agitação → Solução) — para dores concretas.
- **FAB** (Feature → Advantage → Benefit) — para artigos comparativos.
- **AIDA** — para abertura forte com prova e CTA.
- **Jornada do Cliente** — narrativa em 3 atos para conteúdos longos.
- **Checklist decisório** — listas, passos e respostas objetivas.

Mas NUNCA misture várias técnicas no mesmo artigo. Escolha uma.

# Anti-padrões

- Listas com mais de 7 itens (escaneabilidade prejudicada — quebre em sub-seções).
- Repetir a keyword principal mais de 2× no mesmo parágrafo.
- Inventar dados estatísticos sem fonte declarada.
- Generalizar de "rosto largo" para "qualquer rosto" — perde diferenciação.
- Tom promocional excessivo ("o melhor", "incrível", "revolucionário").

# Formato de saída

Markdown puro. Sem JSON wrapper. Sem cercas de código englobando o artigo todo. Sem cabeçalho do tipo "Aqui está o artigo solicitado:". O artigo COMEÇA no primeiro caractere com "# ".`;

export interface WriterBrief {
  tema: string;
  keywordPrincipal: string;
  keywordsSecundarias: string[];
  persona: string;
  problemaPrincipal: string;
  provaConcreta: string;
  beneficioCentral: string;
  objecaoPrincipal: string;
  ctaSugerido: string;
  tituloSugerido: string;
  h2Sugeridos: string[];
  produto: ProductCatalogItem;
  perfilEditorial: { nome: string; tamanho: string; tecnica: string; ritmo: string };
  siloPath: string;
}

export interface WriterResult {
  conteudoMarkdown: string;
  modelo: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
  };
}

function buildBriefingPrompt(brief: WriterBrief): string {
  const medidas = brief.produto.medidas
    .map((m) => `${m.label}: ${m.value}`)
    .join('; ');

  return `Escreva um artigo SEO completo seguindo o briefing abaixo. Saída APENAS em Markdown puro.

## Briefing operacional

- **Tema:** ${brief.tema}
- **Keyword principal (foco):** "${brief.keywordPrincipal}"
- **Keywords secundárias (citar pelo menos 1× cada, com naturalidade):** ${brief.keywordsSecundarias.length ? brief.keywordsSecundarias.map((k) => `"${k}"`).join(', ') : '(nenhuma fornecida)'}
- **Persona:** ${brief.persona}
- **Problema principal (dor):** ${brief.problemaPrincipal}
- **Prova concreta a usar:** ${brief.provaConcreta}
- **Benefício central:** ${brief.beneficioCentral}
- **Objeção a responder:** ${brief.objecaoPrincipal}
- **CTA sugerido:** ${brief.ctaSugerido}
- **Título operacional sugerido (pode refinar):** ${brief.tituloSugerido}

## Estrutura H2 sugerida (pode ajustar)

${brief.h2Sugeridos.length ? brief.h2Sugeridos.map((h) => `- ${h}`).join('\n') : '- (definir conforme briefing)'}

## Produto a referenciar

- **Nome:** ${brief.produto.nome}
- **Categoria:** ${brief.produto.categoria}
- **Descrição:** ${brief.produto.descricao}
- **Medidas:** ${medidas}

## Silo do artigo

\`/blog/${brief.siloPath}/...\` — quando criar links internos no conteúdo, prefira URLs deste mesmo silo para reforçar o cluster temático.

## Perfil editorial sorteado

- **Perfil:** ${brief.perfilEditorial.nome}
- **Tamanho:** ${brief.perfilEditorial.tamanho}
- **Técnica retórica:** ${brief.perfilEditorial.tecnica}
- **Ritmo:** ${brief.perfilEditorial.ritmo}

## Restrições finais

- Comprimento alvo: 1800–2200 palavras.
- Saída pura em Markdown — comece o output com "# " (o título). Sem cercas \`\`\`, sem comentários antes/depois.
- Bloco final obrigatório: "## Sobre @oculoscalibre" com link para https://www.instagram.com/oculos.calibre/.`;
}

let _client: OpenAI | undefined;
function getClient(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY ausente. Configure em .env.local e na Vercel.');
    }
    _client = new OpenAI();
  }
  return _client;
}

const DEFAULT_MODEL = process.env.OPENAI_ARTICLE_MODEL?.trim() || 'gpt-4o';

export async function generateArticleWithLlm(brief: WriterBrief): Promise<WriterResult> {
  const client = getClient();
  const userPrompt = buildBriefingPrompt(brief);

  const response = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    max_completion_tokens: 8000,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });

  const text = (response.choices[0]?.message?.content ?? '').trim();
  const cachedTokens = (response.usage as unknown as { prompt_tokens_details?: { cached_tokens?: number } } | undefined)
    ?.prompt_tokens_details?.cached_tokens ?? 0;

  return {
    conteudoMarkdown: text,
    modelo: response.model || DEFAULT_MODEL,
    usage: {
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
      cacheReadTokens: cachedTokens,
    },
  };
}
