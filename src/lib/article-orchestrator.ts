import { productCatalog, type ProductCatalogItem } from '@/lib/catalog';
import { integrateContent, type ContentIntegratorOutput } from '@/lib/content-integrator';
import { buildPostPath, normalizeTopicPath, slugify } from '@/lib/slug';

export type EditorialSkillId =
  | 'keywords-researcher'
  | 'integrador-conteudo'
  | 'redator'
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
    objetivo: 'Escrever o artigo usando storytelling e estruturas persuasivas adequadas a intencao de busca.',
    entrada: ['brief integrado', 'jornada narrativa', 'palavras-chave', 'voz da marca'],
    saida: ['rascunho em Markdown', 'titulo H1', 'headings H2/H3', 'CTA contextual'],
    criterioAceite: [
      'Usar uma narrativa principal, nao misturar todas as tecnicas no mesmo texto.',
      'Conduzir o leitor de dor para solucao com clareza.',
      'Manter tom humano, brasileiro e sem exagero promocional.',
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
    objetivo: 'Garantir que paginas do blog, pilares, subtemas e artigos publicados aparecam no sitemap.',
    entrada: ['posts publicados', 'paginas de silo', 'URL base do site'],
    saida: ['sitemap atualizado', 'rotas indexaveis', 'prioridades por tipo de pagina'],
    criterioAceite: [
      'Home e landing devem ter prioridade maior que artigos.',
      'Paginas-pilar devem aparecer antes dos artigos derivados.',
      'Somente posts publicados entram no sitemap publico.',
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

## 4. Revisor SEO
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
