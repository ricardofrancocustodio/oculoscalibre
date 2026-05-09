import type { ProductCatalogItem } from '@/lib/catalog';
import type { ContentIntegratorOutput } from '@/lib/content-integrator';
import type { KeywordCandidate } from '@/lib/article-orchestrator';
import { slugify } from '@/lib/slug';

export interface ArticleWriterProfile {
  id: string;
  nome: string;
  tamanho: 'curto' | 'medio' | 'longo';
  linguagem: string;
  tecnica: string;
  ritmo: string;
}

export interface ArticleDraft {
  titulo: string;
  resumo: string;
  conteudoMarkdown: string;
  tags: string[];
  perfil: ArticleWriterProfile;
}

export interface ArticleWriterInput {
  tema: string;
  persona: string;
  jornadaNarrativa: string;
  keywordPrincipal: KeywordCandidate;
  keywordsObrigatorias: KeywordCandidate[];
  produto: ProductCatalogItem;
  integracaoConteudo: ContentIntegratorOutput;
  profile: ArticleWriterProfile;
}

export const articleWriterProfiles: ArticleWriterProfile[] = [
  {
    id: 'guia-consultivo-curto',
    nome: 'Guia consultivo curto',
    tamanho: 'curto',
    linguagem: 'direta, educativa e objetiva',
    tecnica: 'PAS',
    ritmo: 'paragrafos curtos e decisoes rapidas',
  },
  {
    id: 'artigo-comparativo-medio',
    nome: 'Artigo comparativo medio',
    tamanho: 'medio',
    linguagem: 'analitica, clara e orientada a criterios de escolha',
    tecnica: 'FAB',
    ritmo: 'explicacao por criterios e exemplos praticos',
  },
  {
    id: 'narrativa-cliente-longa',
    nome: 'Narrativa de cliente longa',
    tamanho: 'longo',
    linguagem: 'humana, empatica e levemente narrativa',
    tecnica: 'Jornada do Cliente',
    ritmo: 'contexto, conflito, avaliacao e decisao',
  },
  {
    id: 'checklist-pratico-curto',
    nome: 'Checklist pratico curto',
    tamanho: 'curto',
    linguagem: 'pratica, escaneavel e segura',
    tecnica: 'Checklist decisorio',
    ritmo: 'listas, passos e respostas objetivas',
  },
  {
    id: 'especialista-seo-medio',
    nome: 'Especialista SEO medio',
    tamanho: 'medio',
    linguagem: 'autoridade acessivel, sem exagero promocional',
    tecnica: 'AIDA',
    ritmo: 'abertura forte, criterios, prova e CTA contextual',
  },
];

function uniqueTerms(keywords: KeywordCandidate[]): string[] {
  return Array.from(new Set(keywords.map((keyword) => keyword.termo.trim()).filter(Boolean)));
}

function sentence(value: string): string {
  const clean = value.trim();
  if (!clean) return '';
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
}

function buildResumen(input: ArticleWriterInput): string {
  const keyword = input.keywordPrincipal.termo || input.tema;
  return sentence(`${keyword}: veja como avaliar medidas, conforto e proporcao antes de escolher um modelo para rosto largo`).slice(0, 280);
}

function buildTagList(input: ArticleWriterInput): string[] {
  return Array.from(new Set([
    'oculos para rosto largo',
    'guia de medidas',
    input.produto.nome.toLowerCase(),
    ...uniqueTerms(input.keywordsObrigatorias).slice(0, 4),
  ])).slice(0, 8);
}

function requiredKeywordsBlock(input: ArticleWriterInput): string {
  const terms = uniqueTerms(input.keywordsObrigatorias);
  if (!terms.length) return '';

  return `\n\n## Termos relacionados que aparecem no texto\n\n${terms.map((term) => `- ${term}`).join('\n')}`;
}

function buildIntro(input: ArticleWriterInput): string {
  const keyword = input.keywordPrincipal.termo || input.tema;
  return `${keyword} e uma busca comum de quem ja percebeu que nem toda armacao fica confortavel ou proporcional em um rosto mais largo. Antes de escolher pelo visual, vale olhar para medidas, encaixe e para a sensacao real de uso.\n\nNeste guia, a ideia e transformar o briefing do integrador em uma decisao mais simples: entender a dor, olhar a prova concreta e saber quando o ${input.produto.nome} faz sentido como referencia.`;
}

function buildPainSection(input: ArticleWriterInput): string {
  return `## O problema por tras da busca\n\n${sentence(input.integracaoConteudo.dorPrincipal)} Para a persona deste artigo, isso aparece na pratica quando o oculos marca as laterais, parece estreito no rosto ou deixa duvida sobre qual medida realmente importa.\n\nA pergunta central nao e apenas qual modelo comprar, mas como reduzir o risco de escolher uma armacao pequena demais.`;
}

function buildCriteriaSection(input: ArticleWriterInput): string {
  return `## Quais criterios observar antes de escolher\n\nA primeira referencia e a prova concreta indicada pelo integrador: ${input.integracaoConteudo.provaConcreta}. Essa informacao ajuda a sair do achismo e comparar o produto com um oculos que a pessoa ja usa.\n\nNa pratica, observe:\n\n- largura frontal para entender a presenca no rosto;\n- largura da lente para avaliar cobertura;\n- ponte para conferir encaixe no nariz;\n- haste para pensar em estabilidade e conforto lateral.`;
}

function buildMandatoryKeywordsSection(input: ArticleWriterInput): string {
  const terms = uniqueTerms(input.keywordsObrigatorias);
  if (!terms.length) return '';

  const naturalMentions = terms.slice(0, 6).map((term) => `- Ao pesquisar por **${term}**, o leitor provavelmente quer reduzir incerteza antes da compra.`).join('\n');

  return `\n\n## Como as buscas relacionadas entram na decisao\n\nAs palavras relacionadas ajudam a cobrir variações reais da mesma intencao. Elas devem aparecer no texto de forma natural, sem repeticao artificial.\n\n${naturalMentions}`;
}

function buildProductSection(input: ArticleWriterInput): string {
  return `## Onde o ${input.produto.nome} entra como referencia\n\nO ${input.produto.nome} nao precisa ser apresentado como promessa universal. Ele entra como exemplo pratico porque conecta a dor do leitor a medidas verificaveis.\n\nO beneficio central a explorar e: ${input.integracaoConteudo.beneficioCentral}. Essa promessa deve ser mantida em linguagem responsavel, sem afirmar encaixe perfeito para todos os rostos.`;
}

function buildObjectionSection(input: ArticleWriterInput): string {
  return `## Objecao que precisa ser respondida\n\n${sentence(input.integracaoConteudo.objecaoPrincipal)}\n\nA resposta editorial deve mostrar que a decisao melhora quando o leitor compara medidas, entende o proprio uso e evita escolher apenas pela foto do produto.`;
}

function buildCtaSection(input: ArticleWriterInput): string {
  return `## Proximo passo\n\nSe a busca faz sentido para o seu caso, o proximo passo e ${input.integracaoConteudo.ctaSugerido}. Compare as medidas, veja se elas conversam com o que voce sente nos oculos atuais e avance apenas quando a escolha parecer coerente para o seu rosto e seu uso.`;
}

function buildShortArticle(input: ArticleWriterInput): string {
  return [
    `# ${input.integracaoConteudo.tituloSugerido}`,
    buildIntro(input),
    buildPainSection(input),
    buildCriteriaSection(input),
    buildProductSection(input),
    buildCtaSection(input),
  ].join('\n\n');
}

function buildMediumArticle(input: ArticleWriterInput): string {
  return [
    `# ${input.integracaoConteudo.tituloSugerido}`,
    buildIntro(input),
    buildPainSection(input),
    buildCriteriaSection(input),
    buildMandatoryKeywordsSection(input).trim(),
    buildProductSection(input),
    buildObjectionSection(input),
    buildCtaSection(input),
  ].filter(Boolean).join('\n\n');
}

function buildLongArticle(input: ArticleWriterInput): string {
  const h2 = input.integracaoConteudo.h2Sugeridos.map((heading) => `## ${heading}\n\n${buildSectionParagraph(heading, input)}`).join('\n\n');

  return [
    `# ${input.integracaoConteudo.tituloSugerido}`,
    buildIntro(input),
    buildPainSection(input),
    h2,
    buildMandatoryKeywordsSection(input).trim(),
    buildProductSection(input),
    buildObjectionSection(input),
    buildCtaSection(input),
  ].filter(Boolean).join('\n\n');
}

function buildSectionParagraph(heading: string, input: ArticleWriterInput): string {
  const lowerHeading = heading.toLowerCase();

  if (lowerHeading.includes('medida') || lowerHeading.includes('frontal') || lowerHeading.includes('lente')) {
    return `Use esta parte para explicar a prova concreta: ${input.integracaoConteudo.provaConcreta}. O objetivo e fazer o leitor comparar medidas, nao decorar numeros.`;
  }

  if (lowerHeading.includes('apert') || lowerHeading.includes('desconforto')) {
    return `Conecte o tema a dor principal: ${input.integracaoConteudo.dorPrincipal}. Mostre como o desconforto aparece no uso comum e como medir reduz incerteza.`;
  }

  if (lowerHeading.includes(input.produto.nome.toLowerCase())) {
    return `Apresente o ${input.produto.nome} como referencia concreta. Reforce ${input.integracaoConteudo.beneficioCentral}, mantendo a linguagem responsavel.`;
  }

  if (lowerHeading.includes('lista') || lowerHeading.includes('proximo')) {
    return `Feche com o CTA indicado: ${input.integracaoConteudo.ctaSugerido}. O texto deve orientar, nao pressionar.`;
  }

  return `Desenvolva este ponto respeitando a busca principal, a persona e a etapa de funil ${input.integracaoConteudo.funil}.`;
}

function buildArticleBody(input: ArticleWriterInput): string {
  if (input.profile.tamanho === 'curto') return buildShortArticle(input);
  if (input.profile.tamanho === 'longo') return buildLongArticle(input);
  return buildMediumArticle(input);
}

export function buildArticleDraft(input: ArticleWriterInput): ArticleDraft {
  const conteudo = `${buildArticleBody(input)}${requiredKeywordsBlock(input)}\n\n---\n\n**Notas do Redator**\n\n- Perfil editorial sorteado: ${input.profile.nome}.\n- Linguagem: ${input.profile.linguagem}.\n- Tecnica principal: ${input.profile.tecnica}.\n- Ritmo: ${input.profile.ritmo}.\n- Briefing respeitado: dor, prova, beneficio, objecao, CTA e palavras-chave obrigatorias.`;

  return {
    titulo: input.integracaoConteudo.tituloSugerido,
    resumo: buildResumen(input),
    conteudoMarkdown: conteudo,
    tags: buildTagList(input),
    perfil: input.profile,
  };
}

export function getRandomArticleWriterProfile(): ArticleWriterProfile {
  const index = Math.floor(Math.random() * articleWriterProfiles.length);
  return articleWriterProfiles[index] ?? articleWriterProfiles[0];
}

export function buildDraftStoragePayload(input: {
  draft: ArticleDraft;
  topicPath: string;
  slugBase: string;
}) {
  return {
    titulo: input.draft.titulo,
    resumo: input.draft.resumo,
    conteudo: input.draft.conteudoMarkdown,
    tags: input.draft.tags.join(', '),
    topicPath: input.topicPath,
    slug: slugify(input.slugBase || input.draft.titulo),
  };
}
