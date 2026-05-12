import 'server-only';
import OpenAI from 'openai';
import type { ProductCatalogItem } from '@/lib/catalog';
import type { ClusterPost, PostCluster } from '@/app/admin/orquestrador/cluster-types';

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
  keywordsContextuais?: string[];
  licoesRevisor?: string[];
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
  linksInternosObrigatorios?: { titulo: string; url: string; keyword: string }[];
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
- **Keywords de contexto (usar como variações semânticas e sinônimos; não é obrigatório citar literalmente, mas enriquecem a semântica):** ${brief.keywordsContextuais?.length ? brief.keywordsContextuais.map((k) => `"${k}"`).join(', ') : '(nenhuma)'}
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

${brief.linksInternosObrigatorios?.length ? `## Links internos obrigatórios do cluster semântico\n\nEste artigo faz parte de um Link Wheel. Você DEVE inserir estes links no corpo do artigo de forma contextual e natural. Use a URL exatamente como indicada — são as URLs definitivas dos outros posts do cluster:\n\n${brief.linksInternosObrigatorios.map((l) => `- **[${l.titulo}](${l.url})** — âncora sugerida: "${l.keyword}"`).join('\n')}\n\nRegras:\n- Cada link deve aparecer em um parágrafo onde o assunto é relevante — nunca em lista solta.\n- O texto âncora pode ser adaptado, mas a URL é fixa.\n- Não agrupe todos os links no mesmo parágrafo.\n` : ''}
${brief.licoesRevisor?.length ? `## Lições do Revisor SEO (erros encontrados em artigos anteriores — NÃO repita)\n\n${brief.licoesRevisor.map((l, i) => `${i + 1}. ${l}`).join('\n')}\n` : ''}## Perfil editorial sorteado

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

export interface ReviewIssueForRevision {
  level: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
}

export interface ReviseInput {
  brief: WriterBrief;
  currentMarkdown: string;
  issues: ReviewIssueForRevision[];
}

function buildRevisionPrompt({ brief, currentMarkdown, issues }: ReviseInput): string {
  const issueList = issues
    .map((issue, index) => `${index + 1}. [${issue.level.toUpperCase()}] (${issue.rule}) ${issue.message}`)
    .join('\n');

  return `Você gerou o artigo Markdown abaixo a partir de um briefing editorial. O Revisor SEO automatizado identificou as issues listadas. Sua tarefa: corrigir CADA issue sem reescrever o artigo do zero. Preserve a estrutura, o tom, os parágrafos e as seções que NÃO estão sendo mencionados nas issues.

## Briefing original (resumo)

- **Keyword principal:** "${brief.keywordPrincipal}"
- **Keywords secundárias:** ${brief.keywordsSecundarias.length ? brief.keywordsSecundarias.map((k) => `"${k}"`).join(', ') : '(nenhuma)'}
- **Silo do artigo:** \`/blog/${brief.siloPath}/\` — qualquer link interno deve apontar para esse silo, com slugs em kebab-case plausíveis (ex.: \`/blog/${brief.siloPath}/medidas-de-frontal\`).
- **Produto:** ${brief.produto.nome}

## Artigo atual

${currentMarkdown}

## Issues do Revisor SEO a corrigir

${issueList}

## Diretrizes de correção por tipo de issue

- **\`keyword.density.min\`** (densidade abaixo de 0,5%): aumente menções naturais da keyword principal e suas variações morfológicas (singular/plural, forma curta/longa). Não force — incorpore em frases que fazem sentido editorial.
- **\`keyword.density.max\`** (densidade acima de 2%): substitua algumas menções por sinônimos (frame, armação, modelo, óculos, frontal amplo).
- **\`h1.contains.keyword\`** ou **\`intro.contains.keyword\`**: reescreva o H1 ou o primeiro parágrafo para conter a keyword principal naturalmente.
- **\`h1.unique\`**: garanta exatamente um H1 ("# ") no início.
- **\`h2.minimum\`**: adicione H2s coerentes com o tema.
- **\`meta.title.length\`** (título > 60 chars): encurte o H1 mantendo a keyword principal e o sentido.
- **\`meta.description.short\`** ou **\`meta.description.long\`**: ajuste a abertura do artigo (primeiro parágrafo) para que tenha entre 120 e 160 caracteres ao ser usada como meta description.
- **\`internal.links.same.silo\`** (poucos links internos): adicione 2 ou mais links Markdown apontando para subtemas plausíveis dentro de \`/blog/${brief.siloPath}/\` — use slugs em kebab-case coerentes com o tema (ex.: \`[critérios de medida](/blog/${brief.siloPath}/criterios-de-medida)\`, \`[guia de têmpora](/blog/${brief.siloPath}/medida-de-tempora)\`).
- **\`images.alt.missing\`**: para cada imagem Markdown \`![](url)\` sem alt, adicione um alt descritivo que mencione naturalmente a keyword ou o tema.
- **\`content.minimum.length\`**: amplie seções sem inflar — adicione exemplos concretos, não enchimento.
- **Demais regras**: corrija de forma direta, mantendo o restante do artigo intacto.

## Restrições de saída

- Saída APENAS em Markdown puro, completo, do início ao fim. Sem prefácio ("Aqui está o artigo corrigido"), sem cercas \`\`\`markdown.
- Comece com "# " (H1).
- Mantenha o bloco final "## Sobre @oculoscalibre" com o link \`[instagram.com/oculos.calibre](https://www.instagram.com/oculos.calibre/)\`.
- Não comente as correções — apenas devolva o artigo revisado.`;
}

export async function reviseArticleWithLlm(input: ReviseInput): Promise<WriterResult> {
  const client = getClient();
  const userPrompt = buildRevisionPrompt(input);

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

const SILO_SYSTEM_PROMPT = `Você é um arquiteto de silos de conteúdo SEO para um blog de óculos de sol para rostos largos.

Silos disponíveis:
- formatos-de-oculos/rosto-largo — geral sobre formatos de rosto e óculos proporcional
- formatos-de-oculos/rosto-largo/masculino — óculos masculinos para rosto largo
- formatos-de-oculos/rosto-largo/feminino — óculos femininos para rosto largo
- guias/como-escolher-oculos — guias de decisão, comparação e escolha
- medidas-e-ajuste/como-medir-rosto — conteúdo técnico sobre medidas e ajuste
- cuidados-e-manutencao — conservação e cuidados com a armação
- tendencias-e-estilo — moda, tendências e estilo

Você receberá: keyword principal, e opcionalmente o título e o resumo do artigo já gerado.
Use todo o contexto disponível para classificar com precisão.
Responda APENAS com o caminho do silo mais adequado.
Sem explicação. Sem pontuação. Apenas o caminho (ex: formatos-de-oculos/rosto-largo).`;

export interface SiloSuggestionInput {
  keyword: string;
  titulo?: string;
  resumo?: string;
}

export async function suggestSiloPath(input: SiloSuggestionInput): Promise<string> {
  const client = getClient();

  const parts: string[] = [`Keyword: ${input.keyword}`];
  if (input.titulo) parts.push(`Título do artigo: ${input.titulo}`);
  if (input.resumo) parts.push(`Resumo do artigo: ${input.resumo.slice(0, 300)}`);

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_completion_tokens: 60,
    temperature: 0,
    messages: [
      { role: 'system', content: SILO_SYSTEM_PROMPT },
      { role: 'user', content: parts.join('\n') },
    ],
  });

  const suggestion = (response.choices[0]?.message?.content ?? '').trim().replace(/[^a-z0-9/-]/g, '');
  if (suggestion.length > 3 && /^[a-z0-9/-]+$/.test(suggestion)) {
    return suggestion;
  }
  return 'formatos-de-oculos/rosto-largo';
}

const CLUSTER_SYSTEM_PROMPT = `Você é um estrategista de conteúdo SEO especializado em silos semânticos para um blog de óculos de sol para rostos largos.

Dado uma keyword principal, sugira uma bateria de posts formando um cluster semântico coeso com:
- 1 Página Pilar: artigo amplo que cobre o tema central do cluster
- 3 a 5 Posts de Suporte: artigos específicos que aprofundam facetas distintas da keyword principal

Regras de vinculação (Link Wheel):
- A Página Pilar linka para TODOS os Posts de Suporte
- Cada Post de Suporte linka para: (1) a keyword do Pilar e (2) a keyword do próximo Post de Suporte em ordem circular (o último linka de volta para o primeiro, fechando o anel)
- Nenhum post linka para si mesmo

No campo "linkaPara" liste APENAS as keywords dos posts que ele deve linkar internamente (não URLs, apenas as keywords conforme definidas neste cluster).

Retorne APENAS JSON válido com esta estrutura:
{
  "topico": "tema abrangente do cluster",
  "pilar": {
    "titulo": "título H1 do artigo pilar",
    "keyword": "keyword principal do pilar",
    "intencao": "informacional",
    "resumo": "1 frase descrevendo o conteúdo do pilar",
    "siloPath": "caminho do silo sem /blog/ e sem slug final",
    "tipo": "pilar",
    "linkaPara": ["keyword suporte 1", "keyword suporte 2", "..."]
  },
  "suportes": [
    {
      "titulo": "título H1 do artigo de suporte",
      "keyword": "keyword do suporte",
      "intencao": "informacional",
      "resumo": "1 frase descrevendo o conteúdo",
      "siloPath": "caminho do silo",
      "tipo": "suporte",
      "linkaPara": ["keyword do pilar", "keyword do próximo suporte (anel)"]
    }
  ]
}`;

export type { ClusterPost, PostCluster } from '@/app/admin/orquestrador/cluster-types';

export async function suggestPostCluster(
  keyword: string,
  siloPath: string,
  relatedKeywords?: string[],
): Promise<PostCluster> {
  const client = getClient();

  const parts: string[] = [`Keyword principal: ${keyword}`, `Silo atual: ${siloPath}`];
  if (relatedKeywords?.length) {
    parts.push(`Keywords relacionadas disponíveis (use como inspiração para os posts de suporte): ${relatedKeywords.slice(0, 10).join(', ')}`);
  }

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_completion_tokens: 1200,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: CLUSTER_SYSTEM_PROMPT },
      { role: 'user', content: parts.join('\n') },
    ],
  });

  const text = (response.choices[0]?.message?.content ?? '').trim();
  const parsed = JSON.parse(text) as Partial<PostCluster>;
  if (!parsed.topico || !parsed.pilar || !Array.isArray(parsed.suportes)) {
    throw new Error('Resposta do cluster incompleta. Tente novamente.');
  }
  return parsed as PostCluster;
}
