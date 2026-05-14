import { productCatalog, type ProductCatalogItem } from '@/lib/catalog';
import { integrateContent, type ContentIntegratorOutput } from '@/lib/content-integrator';
import { buildPostPath, normalizeTopicPath, slugify } from '@/lib/slug';

export type EditorialSkillId =
  | 'keywords-researcher'
  | 'integrador-conteudo'
  | 'redator'
  | 'cluster-semantico'
  | 'revisor-seo'
  | 'publisher'
  | 'sitemap-updater';

export interface EditorialSkill {
  id: EditorialSkillId;
  nome: string;
  objetivo: string;
  entrada: string[];
  saida: string[];
  criterioAceite: string[];
}

export interface KeywordCandidate {
  termo: string;
  intencao: string;
  volumeMensal?: string;
  fonteVolume?: string;
  dificuldade?: string;
}

export interface EditorialOrchestrationInput {
  tema: string;
  siloPath: string;
  produtoId: string;
  problemaPrincipal: string;
  persona: string;
  jornadaNarrativa: string;
  keywordPrincipal: KeywordCandidate;
  keywordsSecundarias: KeywordCandidate[];
}

export interface EditorialOrchestrationPlan {
  tituloOperacional: string;
  slugSugerido: string;
  postPathSugerido: string;
  produto: ProductCatalogItem;
  integracaoConteudo: ContentIntegratorOutput;
  skills: EditorialSkill[];
  briefMarkdown: string;
}

export const editorialSkills: EditorialSkill[] = [
  {
    id: 'keywords-researcher',
    nome: 'Keywords Researcher',
    objetivo: 'Encontrar palavras-chave de cauda longa relacionadas ao tema, considerando volume real de busca, fonte do dado e intenção de busca.',
    entrada: ['tema', 'silo alvo', 'persona', 'produto ou categoria'],
    saida: ['keyword principal', 'palavras-chave relacionadas obrigatorias', 'volume mensal real', 'fonte do volume', 'intencao de busca'],
    criterioAceite: [
      'Nao estimar volume sem fonte externa declarada.',
      'Priorizar termos de cauda longa com intencao clara.',
      'Separar intencao informacional, comercial e transacional.',
    ],
  },
  {
    id: 'integrador-conteudo',
    nome: 'Integrador de Conteudo',
    objetivo: 'Cruzar palavra-chave, catalogo, medidas do produto e problema resolvido para definir o angulo editorial.',
    entrada: ['keyword aprovada', 'catalogo', 'medidas', 'problemas resolvidos', 'beneficios'],
    saida: ['angulo do artigo', 'produto associado', 'prova de medida', 'beneficio central', 'CTA sugerido'],
    criterioAceite: [
      'Conectar a promessa do artigo a uma dor real do leitor.',
      'Usar medidas do produto somente quando forem relevantes para a busca.',
      'Evitar empurrar produto quando a intencao for puramente informacional.',
    ],
  },
  {
    id: 'redator',
    nome: 'Redator',
    objetivo: 'Escrever o artigo usando storytelling e estruturas persuasivas adequadas a intencao de busca. Quando receber linksInternosObrigatorios do cluster semantico, inserir cada link de forma contextual e natural ao longo do texto.',
    entrada: ['brief integrado', 'jornada narrativa', 'palavras-chave', 'voz da marca', 'linksInternosObrigatorios do cluster semantico (opcional)'],
    saida: ['rascunho em Markdown', 'titulo H1', 'headings H2/H3', 'CTA contextual', 'links internos do cluster inseridos contextualmente'],
    criterioAceite: [
      'Usar uma narrativa principal, nao misturar todas as tecnicas no mesmo texto.',
      'Conduzir o leitor de dor para solucao com clareza.',
      'Manter tom humano, brasileiro e sem exagero promocional.',
      'Quando linksInternosObrigatorios existirem: inserir cada link com href exato e keyword como anchor text, distribuidos ao longo do texto, nunca agrupados no mesmo paragrafo.',
    ],
  },
  {
    id: 'cluster-semantico',
    nome: 'Cluster Semantico',
    objetivo: 'Apos o artigo pilar ser escrito, gerar um cluster de posts de suporte interligados formando um Link Wheel semantico. Cada post de suporte linka para o Pilar e para os demais posts do anel, maximizando a autoridade tematica no Google.',
    entrada: ['keyword principal do pilar', 'siloPath', 'keywords secundarias e contextuais', 'artigo pilar gerado'],
    saida: ['topico do cluster', 'post pilar com keyword e linkaPara', 'lista de posts de suporte com keyword, resumo e linkaPara', 'ordem de publicacao sugerida'],
    criterioAceite: [
      'O cluster so e gerado apos o artigo pilar existir — nunca na pesquisa de keywords.',
      'Cada post de suporte deve linkar para o pilar e para o proximo do anel (fechando o Link Wheel).',
      'Links internos obrigatorios sao injetados automaticamente no LLM ao clicar em Usar como base.',
      'Nao criar cluster com menos de 3 posts de suporte.',
      'Keywords dos posts de suporte devem ser semanticamente relacionadas ao pilar, nunca duplicadas entre si.',
      'O ultimo post de suporte do anel linka de volta para o primeiro, fechando o circuito.',
    ],
  },
  {
    id: 'revisor-seo',
    nome: 'Revisor SEO',
    objetivo: 'Revisar gramatica, escaneabilidade, headings, meta tags, keywords e links internos/externos.',
    entrada: ['rascunho', 'keyword principal', 'keywords secundarias', 'silo do artigo'],
    saida: ['texto revisado', 'meta title', 'meta description', 'checklist SEO', 'links sugeridos'],
    criterioAceite: [
      'Keyword principal deve aparecer naturalmente em H1, introducao e ao longo do texto.',
      'Headings devem refletir a intencao de busca.',
      'Links internos devem priorizar o mesmo silo.',
    ],
  },
  {
    id: 'publisher',
    nome: 'Publisher',
    objetivo: 'Publicar o texto revisado no blog seguindo a estrutura de silos definida.',
    entrada: ['texto revisado pelo Revisor SEO', 'meta tags', 'siloPath', 'slug', 'tags', 'imagem de capa opcional'],
    saida: ['post publicado', 'URL final', 'registro de validacao do silo', 'sitemap revalidado'],
    criterioAceite: [
      'URL deve seguir /blog/silo/subtema/artigo.',
      'Post deve preservar Markdown revisado.',
      'Nao publicar sem conferir silo, slug, resumo, tags e CTA.',
    ],
  },
  {
    id: 'sitemap-updater',
    nome: 'Sitemap Updater',
    objetivo: 'Garantir que home, PDPs (produtos), guia de medidas, pilares de silo e artigos publicados aparecam no sitemap publico com prioridade, lastmod e image extension corretos. Revalida automaticamente a cada mutacao de post (create/update/delete/toggle-publish).',
    entrada: ['posts publicados (DB)', 'catalogo de produtos (lib/catalog)', 'paginas estaticas (guia de medidas, blog index)', 'URL base do site'],
    saida: ['sitemap.xml com Home (1.0), produtos (0.9) com images, guia de medidas (0.85), /blog (0.8), pilares de silo (0.72) e artigos (0.64)', 'lastmod real por entrada', 'revalidacao automatica do /sitemap.xml apos cada mutacao'],
    criterioAceite: [
      'Home, PDPs e guia de medidas devem ter prioridade maior que artigos.',
      'Paginas-pilar de silo devem aparecer antes dos artigos derivados.',
      'Somente posts publicados entram no sitemap publico.',
      'lastmod do /blog usa a data do post mais recente; lastmod de cada pilar de silo usa o post mais recente do silo.',
      'PDPs incluem campo images do sitemap protocol quando o produto tem imagens cadastradas.',
    ],
  },
];

export const storytellingStructures = [
  'Jornada do Cliente',
  'Jornada da Transformacao Antes x Depois',
  'Jornada Pessoal',
  'Estrutura de 3 Atos',
  'Monomito',
  'AIDA',
  'PAS',
  'FAB',
  'Storytelling Empresarial',
  'Cronica',
  'Fabula',
  'Romance/Novela',
];

function formatKeyword(keyword: KeywordCandidate): string {
  const parts = [
    `termo: ${keyword.termo || 'a definir'}`,
    `intencao: ${keyword.intencao || 'a classificar'}`,
  ];

  if (keyword.volumeMensal) parts.push(`volume: ${keyword.volumeMensal}`);
  if (keyword.fonteVolume) parts.push(`fonte: ${keyword.fonteVolume}`);
  if (keyword.dificuldade) parts.push(`dificuldade: ${keyword.dificuldade}`);

  return parts.join(' | ');
}

function listOrFallback(items: string[], fallback: string): string {
  if (items.length === 0) return fallback;
  return items.map((item) => `- ${item}`).join('\n');
}

function formatList(items: string[]): string {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- A definir.';
}

export function buildEditorialOrchestration(input: EditorialOrchestrationInput): EditorialOrchestrationPlan {
  const produto = productCatalog.find((item) => item.id === input.produtoId) ?? productCatalog[0];
  const normalizedSiloPath = normalizeTopicPath(input.siloPath || input.tema);
  const keywordSlug = slugify(input.keywordPrincipal.termo || input.tema);
  const postPathSugerido = buildPostPath(normalizedSiloPath, keywordSlug);
  const tituloOperacional = input.keywordPrincipal.termo
    ? `Artigo para: ${input.keywordPrincipal.termo}`
    : `Artigo para: ${input.tema}`;

  const secondaryKeywords = input.keywordsSecundarias.filter((keyword) => keyword.termo.trim());
  const integracaoConteudo = integrateContent({
    tema: input.tema,
    siloPath: normalizedSiloPath,
    persona: input.persona,
    problemaPrincipal: input.problemaPrincipal,
    produto,
    keywordPrincipal: input.keywordPrincipal,
    keywordsSecundarias: secondaryKeywords,
  });

  const briefMarkdown = `# ${tituloOperacional}

## Entrada do Orquestrador
- Tema: ${input.tema || 'a definir'}
- Silo: /blog/${normalizedSiloPath || 'silo/subtema'}
- Produto: ${produto.nome}
- Persona: ${input.persona || 'a definir'}
- Problema principal: ${input.problemaPrincipal || 'a definir'}
- Estrutura narrativa escolhida: ${input.jornadaNarrativa || 'a definir'}
- Slug sugerido: ${keywordSlug || 'slug-do-artigo'}
- Caminho final sugerido: /blog/${postPathSugerido || 'silo/subtema/artigo'}

## 1. Keywords Researcher
### Objetivo
Buscar palavras-chave de cauda longa relacionadas ao tema com volume real e intencao de busca.

### Keyword principal
- ${formatKeyword(input.keywordPrincipal)}

### Palavras-chave relacionadas obrigatorias
${secondaryKeywords.length ? secondaryKeywords.map((keyword) => `- ${formatKeyword(keyword)}`).join('\n') : '- Aguardando pesquisa com fonte de volume real.'}

### Regra de qualidade
Nao usar volume estimado sem fonte declarada. Fontes possiveis: Google Keyword Planner, Search Console, Semrush, Ahrefs, Ubersuggest ou ferramenta equivalente.

### Regra para o Redator
As palavras-chave relacionadas devem ser citadas naturalmente no texto final. Elas nao substituem a keyword principal; funcionam como termos de apoio semantico obrigatorios.

## 2. Integrador de Conteudo
### Angulo editorial recomendado
${integracaoConteudo.anguloEditorial}

### Tipo de conteudo e funil
- Tipo: ${integracaoConteudo.tipoConteudo}
- Funil: ${integracaoConteudo.funil}

### Cruzamento editorial
- Produto associado: ${integracaoConteudo.produtoAssociado}
- Dor principal conectada: ${integracaoConteudo.dorPrincipal}
- Prova concreta: ${integracaoConteudo.provaConcreta}
- Beneficio central: ${integracaoConteudo.beneficioCentral}
- Objecao principal: ${integracaoConteudo.objecaoPrincipal}
- CTA sugerido: ${integracaoConteudo.ctaSugerido}

### Titulo operacional sugerido
${integracaoConteudo.tituloSugerido}

### Estrutura H2 sugerida para o Redator
${formatList(integracaoConteudo.h2Sugeridos)}

### Termos semanticamente relacionados
${formatList(integracaoConteudo.termosSemanticos)}

### Instrucoes para o Redator
${formatList(integracaoConteudo.instrucoesRedator)}

### Alertas editoriais
${formatList(integracaoConteudo.alertas)}

## 3. Redator
### Direcao de narrativa
Usar ${input.jornadaNarrativa || 'PAS ou Jornada do Cliente'} como estrutura principal.

### Pacote recebido do Integrador
- Keyword principal: ${input.keywordPrincipal.termo || input.tema || 'a definir'}
- Angulo editorial: ${integracaoConteudo.anguloEditorial}
- Dor principal: ${integracaoConteudo.dorPrincipal}
- Prova concreta: ${integracaoConteudo.provaConcreta}
- Beneficio central: ${integracaoConteudo.beneficioCentral}
- Objecao a responder: ${integracaoConteudo.objecaoPrincipal}
- CTA: ${integracaoConteudo.ctaSugerido}
- Titulo sugerido: ${integracaoConteudo.tituloSugerido}

### Palavras-chave que devem aparecer no texto
${secondaryKeywords.length ? secondaryKeywords.map((keyword) => `- ${keyword.termo}`).join('\n') : '- Aguardando lista de caudas longas relacionadas.'}

### Orientacao de texto
${formatList(integracaoConteudo.instrucoesRedator)}

## 3.5. Links internos obrigatorios do cluster semantico
Quando o artigo for parte de um cluster (Link Wheel), o LLM recebe um campo linksInternosObrigatorios com titulo, URL e keyword de cada post relacionado.
Regras:
- Inserir cada link como <a href="URL">keyword</a> contextualmente no texto, nunca em bloco separado.
- Distribuir ao longo do artigo, nunca agrupar dois links no mesmo paragrafo.
- Anchor text deve ser exatamente a keyword fornecida, em minusculas.
- Nao alterar a URL fornecida.

## 4. Cluster Semantico
### Geracao
- O cluster e gerado automaticamente apos o artigo pilar ser escrito pelo Redator.
- Usa gpt-4o-mini (temperatura 0.2, response_format json_object) para sugerir pilar + posts de suporte.
- Cada post de suporte recebe um mapa de links (linkaPara) apontando para o pilar e para os demais posts do anel.

### Uso
- Clicar em "Usar como base" carrega a keyword do post de suporte, busca suas keywords secundarias e injeta linksInternosObrigatorios no proximo artigo gerado pelo Redator.
- Criar um post por vez, na ordem sugerida pelo cluster.

## 5. Revisor SEO
### Checklist
- H1 contem a keyword principal de forma natural.
- Introducao responde rapidamente a intencao da busca.
- H2/H3 organizam escaneabilidade e semantica.
- Keyword principal e secundarias aparecem sem excesso.
- Links internos priorizam o mesmo silo.
- Meta title ate 60 caracteres.
- Meta description ate 155 caracteres.

## 5. Publisher
### Publicacao
- Receber texto revisado pelo Revisor SEO.
- Publicar o artigo na categoria correta do blog.
- Estrutura do silo: ${normalizedSiloPath || 'a definir'}.
- Slug do artigo: ${keywordSlug || 'a definir'}.
- Resumo: derivar da meta description revisada.
- URL final prevista: /blog/${postPathSugerido || 'silo/subtema/artigo'}.
- Revalidar blog, paginas do silo, artigo e sitemap apos a publicacao.

## 6. Sitemap Updater
### Validacao
- Confirmar que o sitemap dinamico inclui /blog, paginas-pilar e artigos publicados.
- Confirmar que apenas conteudo publicado entra como rota indexavel.
- Conferir URL final apos publicacao: /blog/${postPathSugerido || 'silo/subtema/artigo'}.
`;

  return {
    tituloOperacional,
    slugSugerido: keywordSlug,
    postPathSugerido,
    produto,
    integracaoConteudo,
    skills: editorialSkills,
    briefMarkdown,
  };
}

export function buildSkillPrompt(skill: EditorialSkill): string {
  return `Voce e o bot ${skill.nome}.\nObjetivo: ${skill.objetivo}\nEntradas esperadas:\n${listOrFallback(skill.entrada, '- Nenhuma entrada definida.')}\nSaidas obrigatorias:\n${listOrFallback(skill.saida, '- Nenhuma saida definida.')}\nCriterios de aceite:\n${listOrFallback(skill.criterioAceite, '- Sem criterios definidos.')}`;
}
