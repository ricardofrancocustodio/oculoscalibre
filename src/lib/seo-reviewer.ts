export type SeoIssueLevel = 'error' | 'warning' | 'info';

export interface SeoIssue {
  level: SeoIssueLevel;
  rule: string;
  message: string;
}

export interface SeoMetrics {
  metaTitleLength: number;
  metaDescriptionLength: number;
  wordCount: number;
  keywordOccurrences: number;
  keywordDensity: number;
  h1Count: number;
  h2Count: number;
  imageCount: number;
  imagesMissingAlt: number;
  internalLinks: number;
  externalLinks: number;
  faqCount: number;
  htmlTableCount: number;
  emDashCount: number;
  measurementsCount: number;
  measurementsDensity: number;
  bannedFlagWords: string[];
  firstSentenceHasNumber: boolean;
  bannedOpeningDetected: string | null;
  deadTriadDetected: boolean;
}

export interface SeoReviewResult {
  score: number;
  issues: SeoIssue[];
  metrics: SeoMetrics;
}

export interface SeoReviewInput {
  titulo: string;
  resumo: string;
  conteudoMd: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywordPrincipal?: string | null;
  keywordsSecundarias?: string[];
  capaUrl?: string | null;
  coverAlt?: string | null;
  siloPath?: string | null;
}

const META_TITLE_MAX = 60;
const META_DESCRIPTION_MIN = 120;
const META_DESCRIPTION_MAX = 160;
const KEYWORD_DENSITY_MIN = 0.5;
const KEYWORD_DENSITY_MAX = 2.0;
const MIN_WORD_COUNT = 300;
const MIN_INTERNAL_LINKS_SAME_SILO = 2;
const MIN_FAQ_QUESTIONS = 4;
const MIN_MEASUREMENTS_PER_200_WORDS = 1;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function effectiveMetaTitle(input: SeoReviewInput): string {
  return (input.metaTitle?.trim() || input.titulo.trim()) ?? '';
}

function effectiveMetaDescription(input: SeoReviewInput): string {
  return (input.metaDescription?.trim() || input.resumo.trim()) ?? '';
}

function countWords(markdown: string): number {
  const stripped = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#>*_~\-]/g, ' ');
  return stripped.split(/\s+/).filter(Boolean).length;
}

function countKeywordOccurrences(markdown: string, keyword: string): number {
  if (!keyword.trim()) return 0;
  const stripped = markdown.replace(/```[\s\S]*?```/g, ' ');
  const normalizedContent = normalize(stripped);
  const normalizedKeyword = normalize(keyword.trim());
  if (!normalizedKeyword) return 0;

  const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = normalizedContent.match(new RegExp(`\\b${escaped}\\b`, 'g'));
  return matches?.length ?? 0;
}

function countHeadings(markdown: string, level: 1 | 2): number {
  const prefix = '#'.repeat(level);
  const regex = new RegExp(`^${prefix}\\s+\\S`, 'gm');
  return markdown.match(regex)?.length ?? 0;
}

function getH1Text(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function getFirstParagraph(markdown: string): string {
  const stripped = markdown
    .replace(/^#.*$/gm, '')
    .replace(/^>.*$/gm, '')
    .trim();
  const firstParagraph = stripped.split(/\n\s*\n/)[0] ?? '';
  return firstParagraph.trim();
}

function findMarkdownImages(markdown: string): Array<{ alt: string; src: string }> {
  const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const result: Array<{ alt: string; src: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    result.push({ alt: match[1], src: match[2] });
  }
  return result;
}

function findMarkdownLinks(markdown: string): Array<{ label: string; href: string }> {
  const regex = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g;
  const result: Array<{ label: string; href: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    result.push({ label: match[1], href: match[2] });
  }
  return result;
}

function isInternalHref(href: string): boolean {
  if (!href) return false;
  if (href.startsWith('/')) return true;
  if (/^https?:\/\//i.test(href)) {
    try {
      const url = new URL(href);
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.oculoscalibre.com.br';
      const siteHost = new URL(siteUrl).host;
      return url.host === siteHost;
    } catch {
      return false;
    }
  }
  return false;
}

function countFaqQuestions(markdown: string): number {
  const faqHeadingRegex = /^##\s+perguntas\s+frequentes\b.*$/im;
  const match = markdown.match(faqHeadingRegex);
  if (!match || match.index === undefined) return 0;

  const tail = markdown.slice(match.index + match[0].length);
  const nextH2Index = tail.search(/^##\s+\S/m);
  const faqBlock = nextH2Index === -1 ? tail : tail.slice(0, nextH2Index);

  const h3Questions = faqBlock.match(/^###\s+.+\?/gm)?.length ?? 0;
  if (h3Questions > 0) return h3Questions;

  const boldQuestions = faqBlock.match(/^\*\*[^*\n]+\?\*\*/gm)?.length ?? 0;
  return boldQuestions;
}

function countHtmlTables(markdown: string): number {
  const stripped = markdown.replace(/```[\s\S]*?```/g, ' ');
  return stripped.match(/<table[\s>]/gi)?.length ?? 0;
}

function countEmDashes(markdown: string): number {
  const stripped = markdown.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ');
  return stripped.match(/—/g)?.length ?? 0;
}

const BANNED_FLAG_WORDS: Array<{ token: string; matcher: RegExp }> = [
  { token: 'crucial', matcher: /\bcruciais?\b/giu },
  { token: 'fundamental', matcher: /\bfundamenta(?:l|is)\b/giu },
  { token: 'vale ressaltar', matcher: /\bvale\s+ressaltar\b/giu },
  { token: 'em suma', matcher: /\bem\s+suma\b/giu },
  { token: 'no mundo atual', matcher: /\bno\s+mundo\s+atual\b/giu },
  { token: 'nos dias de hoje', matcher: /\bnos\s+dias\s+de\s+hoje\b/giu },
  { token: 'robusto', matcher: /\brobust[oa]s?\b/giu },
  { token: 'versátil', matcher: /\bvers[áa]te(?:il|is)\b/giu },
  { token: 'navegar pelo mar', matcher: /\bnavegar\s+(?:por|pelo|nesse|nesse?\s+mar)\b/giu },
  { token: 'dominar', matcher: /\bdomina(?:r|ndo|m)\b/giu },
  { token: 'desvendar', matcher: /\bdesvenda(?:r|ndo|m)\b/giu },
  { token: 'desmistificar', matcher: /\bdesmistifica(?:r|ndo|m)\b/giu },
  { token: 'jornada', matcher: /\bjornadas?\b/giu },
  { token: 'empoderar', matcher: /\bempodera(?:r|ndo|m)\b/giu },
  { token: 'rica experiência', matcher: /\brica\s+experi[êe]ncia\b/giu },
  { token: 'ampla variedade', matcher: /\bampla\s+variedade\b/giu },
  { token: 'verdadeiro divisor', matcher: /\bverdadeiro\s+divisor\b/giu },
  { token: 'experiência única', matcher: /\bexperi[êe]ncia\s+[úu]nica\b/giu },
  { token: 'atender suas necessidades', matcher: /\batender\s+suas\s+necessidades\b/giu },
  { token: 'garantir a melhor', matcher: /\bgarantir\s+a\s+melhor\b/giu },
  { token: 'elevado padrão', matcher: /\belevado\s+padr[ãa]o\b/giu },
];

const BANNED_OPENINGS: Array<{ label: string; matcher: RegExp }> = [
  { label: 'Você já parou pra pensar', matcher: /^voc[êe]\s+j[áa]\s+parou\s+(?:pra|para)\s+pensar/i },
  { label: 'Imagine a situação', matcher: /^imagine\s+(?:a\s+situa[çc][ãa]o|que)/i },
  { label: 'Quando se trata de', matcher: /^quando\s+se\s+trata\s+de/i },
  { label: 'No universo de', matcher: /^no\s+universo\s+(?:de|do|dos|da|das)/i },
  { label: 'Na hora de escolher', matcher: /^na\s+hora\s+de\s+(?:escolher|comprar)/i },
  { label: 'Procurando o óculos ideal', matcher: /^procurando\s+/i },
  { label: 'Você sabia que', matcher: /^voc[êe]\s+sabia\s+que/i },
  { label: 'Se você está aqui', matcher: /^se\s+voc[êe]\s+est[áa]\s+aqui/i },
];

function getFirstBodySentence(markdown: string): string {
  const firstParagraph = getFirstParagraph(markdown);
  if (!firstParagraph) return '';
  const sentenceMatch = firstParagraph.match(/^[^.!?]+[.!?]/);
  return (sentenceMatch ? sentenceMatch[0] : firstParagraph).trim();
}

function detectBannedFlagWords(markdown: string): string[] {
  const stripped = markdown.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ');
  const detected = new Set<string>();
  for (const { token, matcher } of BANNED_FLAG_WORDS) {
    if (matcher.test(stripped)) detected.add(token);
  }
  return [...detected];
}

function detectBannedOpening(firstSentence: string): string | null {
  const normalized = firstSentence.replace(/^[\s*_>"'-]+/, '').trim();
  for (const { label, matcher } of BANNED_OPENINGS) {
    if (matcher.test(normalized)) return label;
  }
  return null;
}

function firstSentenceContainsNumber(firstSentence: string): boolean {
  return /\d/.test(firstSentence);
}

function detectDeadTriad(markdown: string): boolean {
  const stripped = markdown.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ');
  return /\bqualidade,\s*conforto\s*e\s*estilo\b/i.test(stripped);
}

function countMeasurements(markdown: string): number {
  const stripped = markdown.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ');
  const patterns = [
    /\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m)\b/gi,
    /\b\d+(?:[.,]\d+)?\s?(?:g|kg|gramas?|quilos?)\b/gi,
    /R\$\s?\d+(?:[.,]\d+)?/g,
    /\b\d+\s?(?:dia|dias|hora|horas|minuto|minutos|semana|semanas|mes|meses|mês)\b/gi,
  ];

  let total = 0;
  for (const pattern of patterns) {
    total += stripped.match(pattern)?.length ?? 0;
  }
  return total;
}

function isSameSiloHref(href: string, siloPath: string | null | undefined): boolean {
  if (!siloPath) return isInternalHref(href);
  if (!isInternalHref(href)) return false;
  const normalizedSilo = siloPath.replace(/^\/|\/$/g, '').split('/')[0];
  if (!normalizedSilo) return true;
  const path = href.startsWith('/') ? href : new URL(href).pathname;
  return path.startsWith(`/blog/${normalizedSilo}`);
}

export function reviewPostSeo(input: SeoReviewInput): SeoReviewResult {
  const issues: SeoIssue[] = [];
  const conteudoMd = input.conteudoMd ?? '';
  const wordCount = countWords(conteudoMd);

  const metaTitle = effectiveMetaTitle(input);
  const metaDescription = effectiveMetaDescription(input);
  const keyword = (input.keywordPrincipal ?? '').trim();
  const keywordOccurrences = countKeywordOccurrences(conteudoMd, keyword);
  const keywordDensity = wordCount > 0 ? (keywordOccurrences / wordCount) * 100 : 0;

  const h1Count = countHeadings(conteudoMd, 1);
  const h2Count = countHeadings(conteudoMd, 2);
  const h1Text = getH1Text(conteudoMd);
  const firstParagraph = getFirstParagraph(conteudoMd);

  const images = findMarkdownImages(conteudoMd);
  const imagesMissingAlt = images.filter((img) => img.alt.trim().length === 0).length;

  const links = findMarkdownLinks(conteudoMd);
  const internalLinks = links.filter((link) => isInternalHref(link.href)).length;
  const externalLinks = links.length - internalLinks;
  const sameSiloInternalLinks = links.filter((link) => isSameSiloHref(link.href, input.siloPath ?? null)).length;

  const faqCount = countFaqQuestions(conteudoMd);
  const htmlTableCount = countHtmlTables(conteudoMd);
  const emDashCount = countEmDashes(conteudoMd);
  const measurementsCount = countMeasurements(conteudoMd);
  const measurementsDensity = wordCount > 0 ? (measurementsCount / wordCount) * 200 : 0;
  const firstSentence = getFirstBodySentence(conteudoMd);
  const bannedFlagWords = detectBannedFlagWords(conteudoMd);
  const bannedOpeningDetected = detectBannedOpening(firstSentence);
  const firstSentenceHasNumber = firstSentence ? firstSentenceContainsNumber(firstSentence) : false;
  const deadTriadDetected = detectDeadTriad(conteudoMd);

  if (!keyword) {
    issues.push({
      level: 'warning',
      rule: 'keyword.principal',
      message: 'Sem keyword principal definida. Auditoria de densidade e H1 ficou parcial.',
    });
  } else {
    if (h1Text && !normalize(h1Text).includes(normalize(keyword))) {
      issues.push({
        level: 'error',
        rule: 'h1.contains.keyword',
        message: `H1 "${h1Text}" não contém a keyword principal "${keyword}".`,
      });
    }

    if (firstParagraph && !normalize(firstParagraph).includes(normalize(keyword))) {
      issues.push({
        level: 'warning',
        rule: 'intro.contains.keyword',
        message: 'Keyword principal não aparece no primeiro parágrafo. Reposicione naturalmente.',
      });
    }

    if (keywordDensity < KEYWORD_DENSITY_MIN) {
      issues.push({
        level: 'warning',
        rule: 'keyword.density.min',
        message: `Densidade da keyword (${keywordDensity.toFixed(2)}%) abaixo do mínimo recomendado (${KEYWORD_DENSITY_MIN}%).`,
      });
    } else if (keywordDensity > KEYWORD_DENSITY_MAX) {
      issues.push({
        level: 'warning',
        rule: 'keyword.density.max',
        message: `Densidade da keyword (${keywordDensity.toFixed(2)}%) acima do recomendado (${KEYWORD_DENSITY_MAX}%). Risco de keyword stuffing.`,
      });
    }
  }

  if (h1Count !== 1) {
    issues.push({
      level: h1Count === 0 ? 'error' : 'warning',
      rule: 'h1.unique',
      message: h1Count === 0
        ? 'Nenhum H1 encontrado no conteúdo. Adicione um título com "# ".'
        : `Mais de um H1 encontrado (${h1Count}). Mantenha apenas um por página.`,
    });
  }

  if (h2Count < 2) {
    issues.push({
      level: 'warning',
      rule: 'h2.minimum',
      message: `Apenas ${h2Count} H2 detectado${h2Count === 1 ? '' : 's'}. Recomendado pelo menos 2 para escaneabilidade.`,
    });
  }

  if (metaTitle.length === 0) {
    issues.push({ level: 'error', rule: 'meta.title.empty', message: 'Meta title vazio.' });
  } else if (metaTitle.length > META_TITLE_MAX) {
    issues.push({
      level: 'warning',
      rule: 'meta.title.length',
      message: `Meta title tem ${metaTitle.length} caracteres (máx. recomendado ${META_TITLE_MAX}).`,
    });
  }

  if (metaDescription.length === 0) {
    issues.push({ level: 'error', rule: 'meta.description.empty', message: 'Meta description vazia.' });
  } else if (metaDescription.length < META_DESCRIPTION_MIN) {
    issues.push({
      level: 'warning',
      rule: 'meta.description.short',
      message: `Meta description tem ${metaDescription.length} caracteres (recomendado ${META_DESCRIPTION_MIN}–${META_DESCRIPTION_MAX}).`,
    });
  } else if (metaDescription.length > META_DESCRIPTION_MAX) {
    issues.push({
      level: 'warning',
      rule: 'meta.description.long',
      message: `Meta description tem ${metaDescription.length} caracteres (máx. recomendado ${META_DESCRIPTION_MAX}). Será truncada na SERP.`,
    });
  }

  if (input.capaUrl && !(input.coverAlt ?? '').trim()) {
    issues.push({
      level: 'warning',
      rule: 'cover.alt.missing',
      message: 'Capa sem texto alternativo (cover_alt). Importante para acessibilidade e SEO.',
    });
  }

  if (imagesMissingAlt > 0) {
    issues.push({
      level: 'warning',
      rule: 'images.alt.missing',
      message: `${imagesMissingAlt} imagem${imagesMissingAlt === 1 ? '' : 's'} no conteúdo sem texto alternativo.`,
    });
  }

  if (sameSiloInternalLinks < MIN_INTERNAL_LINKS_SAME_SILO) {
    issues.push({
      level: 'warning',
      rule: 'internal.links.same.silo',
      message: `Apenas ${sameSiloInternalLinks} link interno do mesmo silo. Recomendado pelo menos ${MIN_INTERNAL_LINKS_SAME_SILO} para reforçar o cluster temático.`,
    });
  }

  if (wordCount < MIN_WORD_COUNT) {
    issues.push({
      level: 'warning',
      rule: 'content.minimum.length',
      message: `Apenas ${wordCount} palavras. Recomendado mínimo ${MIN_WORD_COUNT} para conteúdo substantivo.`,
    });
  }

  if (faqCount < MIN_FAQ_QUESTIONS) {
    issues.push({
      level: 'warning',
      rule: 'aeo.faq.section.missing',
      message: faqCount === 0
        ? 'Seção "Perguntas frequentes" ausente. Necessária para gerar FAQPage JSON-LD e ser citável por LLMs (ChatGPT, Perplexity, AI Overview).'
        : `Seção "Perguntas frequentes" tem apenas ${faqCount} pergunta${faqCount === 1 ? '' : 's'}. Mínimo recomendado: ${MIN_FAQ_QUESTIONS}.`,
    });
  }

  if (htmlTableCount === 0) {
    issues.push({
      level: 'warning',
      rule: 'aeo.html.table.missing',
      message: 'Sem tabela HTML semântica (<table>). Tabelas HTML são o formato mais extraível por LLMs — inclua pelo menos uma comparando medidas, modelos, materiais ou faixas de cabeça.',
    });
  }

  if (emDashCount > 0) {
    issues.push({
      level: 'error',
      rule: 'aeo.em.dash.forbidden',
      message: `Detectado ${emDashCount} em-dash (—) no texto. Preferência do dono da marca: zero em-dashes. Substituir por vírgula, parênteses ou reestruturar a frase.`,
    });
  }

  if (wordCount >= MIN_WORD_COUNT && measurementsDensity < MIN_MEASUREMENTS_PER_200_WORDS) {
    issues.push({
      level: 'warning',
      rule: 'aeo.measurements.density.min',
      message: `Densidade factual baixa: ${measurementsCount} medida${measurementsCount === 1 ? '' : 's'} (mm/cm/g/R$/dias) em ${wordCount} palavras (${measurementsDensity.toFixed(2)} por 200 palavras). Mínimo recomendado: ${MIN_MEASUREMENTS_PER_200_WORDS} a cada 200 palavras.`,
    });
  }

  if (bannedFlagWords.length > 0) {
    issues.push({
      level: 'warning',
      rule: 'humanization.banned.flag.words',
      message: `Palavra${bannedFlagWords.length === 1 ? '' : 's'}-bandeira de IA detectada${bannedFlagWords.length === 1 ? '' : 's'}: ${bannedFlagWords.map((w) => `"${w}"`).join(', ')}. Substituir por equivalente concreto (com número ou descrição factual).`,
    });
  }

  if (bannedOpeningDetected) {
    issues.push({
      level: 'warning',
      rule: 'humanization.banned.opening',
      message: `Abertura genérica detectada: "${bannedOpeningDetected}". Reescrever a primeira frase como afirmação factual contendo um número (medida, faixa, percentual).`,
    });
  }

  if (firstSentence && !firstSentenceHasNumber) {
    issues.push({
      level: 'warning',
      rule: 'humanization.first.sentence.no.number',
      message: 'Primeira frase do artigo não contém número. Regra: abertura precisa estabelecer autoridade factual com uma medida (mm/cm), faixa, percentual ou valor.',
    });
  }

  if (deadTriadDetected) {
    issues.push({
      level: 'warning',
      rule: 'humanization.dead.triad',
      message: 'Detectada tríade morta "qualidade, conforto e estilo". Substituir por três medidas concretas do produto (148 mm de frontal, 150 mm de haste, 96 g) ou três critérios objetivos com número.',
    });
  }

  const errorCount = issues.filter((issue) => issue.level === 'error').length;
  const warningCount = issues.filter((issue) => issue.level === 'warning').length;
  const score = Math.max(0, Math.min(100, 100 - errorCount * 20 - warningCount * 5));

  return {
    score,
    issues,
    metrics: {
      metaTitleLength: metaTitle.length,
      metaDescriptionLength: metaDescription.length,
      wordCount,
      keywordOccurrences,
      keywordDensity,
      h1Count,
      h2Count,
      imageCount: images.length,
      imagesMissingAlt,
      internalLinks,
      externalLinks,
      faqCount,
      htmlTableCount,
      emDashCount,
      measurementsCount,
      measurementsDensity,
      bannedFlagWords,
      firstSentenceHasNumber,
      bannedOpeningDetected,
      deadTriadDetected,
    },
  };
}

const FIXABLE_RULES = new Set(['meta.title.length', 'meta.description.long', 'h1.contains.keyword', 'h1.unique', 'aeo.em.dash.forbidden']);

function applyAutoCorrections(input: SeoReviewInput, issues: SeoIssue[]): { titulo: string; resumo: string; conteudoMd: string; corrections: string[] } {
  let titulo = input.titulo;
  let resumo = input.resumo;
  let conteudoMd = input.conteudoMd;
  const corrections: string[] = [];

  for (const issue of issues) {
    if (!FIXABLE_RULES.has(issue.rule)) continue;

    if (issue.rule === 'meta.title.length' && titulo.length > META_TITLE_MAX) {
      titulo = titulo.slice(0, 57) + '...';
      corrections.push(`Meta title truncado para ${META_TITLE_MAX} caracteres.`);
    }

    if (issue.rule === 'meta.description.long' && resumo.length > META_DESCRIPTION_MAX) {
      resumo = resumo.slice(0, 157) + '...';
      corrections.push(`Meta description truncada para ${META_DESCRIPTION_MAX} caracteres.`);
    }

    if (issue.rule === 'h1.contains.keyword' && input.keywordPrincipal) {
      const keyword = input.keywordPrincipal.trim();
      const updated = conteudoMd.replace(/^(#\s+)(.+)$/m, (_match, prefix, text: string) => {
        if (!normalize(text).includes(normalize(keyword))) {
          corrections.push('Keyword principal inserida no H1.');
          return `${prefix}${keyword} – ${text}`;
        }
        return `${prefix}${text}`;
      });
      conteudoMd = updated;
    }

    if (issue.rule === 'h1.unique' && !conteudoMd.match(/^#\s+\S/m) && input.keywordPrincipal) {
      conteudoMd = `# ${input.keywordPrincipal.trim()}\n\n${conteudoMd}`;
      corrections.push('H1 adicionado ao início do conteúdo.');
    }

    if (issue.rule === 'aeo.em.dash.forbidden' && conteudoMd.includes('—')) {
      const before = (conteudoMd.match(/—/g) || []).length;
      conteudoMd = conteudoMd
        .replace(/\s+—\s+/g, ', ')
        .replace(/—/g, ',');
      const after = (conteudoMd.match(/—/g) || []).length;
      const removed = before - after;
      if (removed > 0) {
        corrections.push(`${removed} em-dash (—) removido${removed === 1 ? '' : 's'} do texto.`);
      }
    }
  }

  return { titulo, resumo, conteudoMd, corrections };
}

export function reviewAndAutoFix(input: SeoReviewInput): {
  review: SeoReviewResult;
  corrections: string[];
  updated: SeoReviewInput;
} {
  const review = reviewPostSeo(input);
  const fixableIssues = review.issues.filter((issue) => FIXABLE_RULES.has(issue.rule));
  const corrected = applyAutoCorrections(input, fixableIssues);
  return {
    review,
    corrections: corrected.corrections,
    updated: { ...input, titulo: corrected.titulo, resumo: corrected.resumo, conteudoMd: corrected.conteudoMd },
  };
}

export interface SeoLoopIteration {
  iteration: number;
  review: SeoReviewResult;
  corrections: string[];
}

export interface SeoLoopResult {
  status: 'pass' | 'warn' | 'fail';
  finalTitulo: string;
  finalResumo: string;
  finalMarkdown: string;
  history: SeoLoopIteration[];
  iterations: number;
}

const MAX_LOOP_ITERATIONS = 3;

export function runSeoCorrectionsLoop(input: SeoReviewInput): SeoLoopResult {
  let current: SeoReviewInput = { ...input };
  const history: SeoLoopIteration[] = [];

  for (let i = 1; i <= MAX_LOOP_ITERATIONS; i++) {
    const review = reviewPostSeo(current);
    const fixableIssues = review.issues.filter((issue) => FIXABLE_RULES.has(issue.rule));
    const corrected = applyAutoCorrections(current, fixableIssues);

    history.push({ iteration: i, review, corrections: corrected.corrections });

    current = {
      ...current,
      titulo: corrected.titulo,
      resumo: corrected.resumo,
      conteudoMd: corrected.conteudoMd,
    };

    const hasErrors = review.issues.some((issue) => issue.level === 'error');
    const hasWarnings = review.issues.some((issue) => issue.level === 'warning');

    if (!hasErrors && !hasWarnings) {
      return { status: 'pass', finalTitulo: current.titulo, finalResumo: current.resumo, finalMarkdown: current.conteudoMd, history, iterations: i };
    }

    if (!hasErrors && corrected.corrections.length === 0) {
      return { status: 'warn', finalTitulo: current.titulo, finalResumo: current.resumo, finalMarkdown: current.conteudoMd, history, iterations: i };
    }
  }

  const lastReview = reviewPostSeo(current);
  const finalHasErrors = lastReview.issues.some((issue) => issue.level === 'error');
  const status: SeoLoopResult['status'] = finalHasErrors ? 'fail' : 'warn';

  return {
    status,
    finalTitulo: current.titulo,
    finalResumo: current.resumo,
    finalMarkdown: current.conteudoMd,
    history,
    iterations: MAX_LOOP_ITERATIONS,
  };
}
