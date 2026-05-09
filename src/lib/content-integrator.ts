import type { ProductCatalogItem } from '@/lib/catalog';

export interface ContentIntegratorKeyword {
  termo: string;
  intencao: string;
  volumeMensal?: string;
  fonteVolume?: string;
  dificuldade?: string;
}

export interface ContentIntegratorInput {
  tema: string;
  siloPath: string;
  persona: string;
  problemaPrincipal: string;
  produto: ProductCatalogItem;
  keywordPrincipal: ContentIntegratorKeyword;
  keywordsSecundarias: ContentIntegratorKeyword[];
}

export interface ContentIntegratorOutput {
  anguloEditorial: string;
  tipoConteudo: string;
  funil: 'descoberta' | 'consideracao' | 'compra' | 'pos-compra';
  dorPrincipal: string;
  produtoAssociado: string;
  provaConcreta: string;
  beneficioCentral: string;
  objecaoPrincipal: string;
  ctaSugerido: string;
  tituloSugerido: string;
  h2Sugeridos: string[];
  termosSemanticos: string[];
  instrucoesRedator: string[];
  alertas: string[];
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function includesAny(value: string, terms: string[]): boolean {
  const normalizedValue = normalize(value);
  return terms.some((term) => normalizedValue.includes(normalize(term)));
}

function findMeasure(product: ProductCatalogItem, label: string): string {
  return product.medidas.find((measure) => normalize(measure.label).includes(normalize(label)))?.value ?? 'medida a confirmar';
}

function classifyIntent(keyword: ContentIntegratorKeyword): ContentIntegratorKeyword['intencao'] {
  const term = normalize(keyword.termo);
  const declaredIntent = normalize(keyword.intencao);

  if (declaredIntent) return keyword.intencao;
  if (includesAny(term, ['comprar', 'preco', 'valor', 'loja', 'disponibilidade'])) return 'transacional';
  if (includesAny(term, ['melhor', 'melhores', 'modelo', 'marca', 'masculino', 'feminino'])) return 'comercial';
  if (includesAny(term, ['calibre', 'mb-1572s'])) return 'navegacional';
  return 'informacional';
}

function classifyFunnel(keyword: ContentIntegratorKeyword): ContentIntegratorOutput['funil'] {
  const term = normalize(keyword.termo);
  const intent = normalize(classifyIntent(keyword));

  if (includesAny(term, ['ajustar', 'consertar', 'apertando depois', 'como ajustar'])) return 'pos-compra';
  if (intent.includes('transacional') || includesAny(term, ['comprar', 'preco', 'loja', 'disponibilidade'])) return 'compra';
  if (intent.includes('comercial') || includesAny(term, ['melhor', 'modelo', 'marca', 'vs', 'comparar'])) return 'consideracao';
  return 'descoberta';
}

function inferContentType(funil: ContentIntegratorOutput['funil'], keyword: ContentIntegratorKeyword): string {
  const term = normalize(keyword.termo);

  if (funil === 'compra') return 'pagina comercial ou artigo de fundo de funil';
  if (includesAny(term, ['como', 'medir', 'tamanho', '150mm', '60mm'])) return 'guia de medidas';
  if (includesAny(term, ['vs', 'comparar', 'melhores', 'marca'])) return 'artigo comparativo';
  if (includesAny(term, ['aperta', 'machuca', 'nao aperta', 'temporas', 'lateral'])) return 'artigo educativo de dor e solucao';
  return 'artigo SEO consultivo';
}

function inferPrimaryPain(input: ContentIntegratorInput): string {
  const term = normalize(input.keywordPrincipal.termo);

  if (includesAny(term, ['aperta', 'lateral', 'tempora', 'temporas', 'cabeca grande'])) {
    return 'armacoes comuns pressionam as laterais do rosto e causam desconforto';
  }

  if (includesAny(term, ['medir', 'medida', 'tamanho', '150mm', '60mm'])) {
    return 'a pessoa nao sabe interpretar medidas antes de comprar um oculos';
  }

  if (includesAny(term, ['redondo', 'grande', 'proporcional', 'bonito', 'afina'])) {
    return 'a pessoa quer um oculos que fique proporcional e nao aumente a sensacao de rosto largo';
  }

  return input.problemaPrincipal || input.produto.problemasResolvidos[0] || 'dificuldade para escolher um oculos proporcional';
}

function inferProof(input: ContentIntegratorInput): string {
  const term = normalize(input.keywordPrincipal.termo);
  const frontal = findMeasure(input.produto, 'Frontal');
  const lens = findMeasure(input.produto, 'Largura da lente');
  const height = findMeasure(input.produto, 'Altura');
  const bridge = findMeasure(input.produto, 'Ponte');
  const temple = findMeasure(input.produto, 'haste');

  if (includesAny(term, ['aperta', 'lateral', 'tempora', 'temporas'])) {
    return `frontal total de ${frontal} e haste de ${temple}`;
  }

  if (includesAny(term, ['nariz', 'ponte', 'encaixe'])) {
    return `ponte de ${bridge}, frontal total de ${frontal} e lente de ${lens}`;
  }

  if (includesAny(term, ['60mm', 'lente', 'cobertura'])) {
    return `largura de lente de ${lens} e altura de frame de ${height}`;
  }

  return `frontal total de ${frontal} e largura de lente de ${lens}`;
}

function inferBenefit(input: ContentIntegratorInput): string {
  const term = normalize(input.keywordPrincipal.termo);

  if (includesAny(term, ['aperta', 'lateral', 'tempora', 'temporas', 'conforto'])) {
    return 'reduzir a sensacao de aperto lateral e melhorar o conforto percebido';
  }

  if (includesAny(term, ['redondo', 'grande', 'proporcional', 'bonito'])) {
    return 'ajudar o leitor a buscar mais harmonia visual e proporcao no rosto';
  }

  if (includesAny(term, ['medir', 'medida', 'tamanho', '150mm', '60mm'])) {
    return 'comparar medidas antes da compra e diminuir o risco de escolher uma armacao pequena';
  }

  return input.produto.beneficios[0] || 'escolher um oculos mais proporcional para rosto largo';
}

function inferObjection(keyword: ContentIntegratorKeyword): string {
  const term = normalize(keyword.termo);

  if (includesAny(term, ['comprar', 'online', 'servir'])) return 'como saber se o oculos vai servir antes de comprar online?';
  if (includesAny(term, ['grande', 'bonito', 'redondo', 'afina'])) return 'como saber se um oculos amplo nao vai ficar exagerado?';
  if (includesAny(term, ['medir', 'tamanho', '150mm', '60mm'])) return 'como interpretar medidas tecnicas sem se confundir?';
  return 'como confiar que uma armacao mais larga vai ficar proporcional e confortavel?';
}

function inferCta(funil: ContentIntegratorOutput['funil'], keyword: ContentIntegratorKeyword, product: ProductCatalogItem): string {
  const term = normalize(keyword.termo);

  if (funil === 'compra') return `entrar na lista de espera do ${product.nome}`;
  if (includesAny(term, ['medir', 'medida', 'tamanho', '150mm', '60mm'])) return `comparar suas medidas com o ${product.nome}`;
  if (includesAny(term, ['calibre', 'mb-1572s'])) return `ver a ficha tecnica do ${product.nome}`;
  return `conhecer as medidas do ${product.nome}`;
}

function buildTitle(keyword: ContentIntegratorKeyword): string {
  const term = keyword.termo.trim() || 'oculos para rosto largo';
  return `${term.charAt(0).toUpperCase()}${term.slice(1)}: como escolher um modelo proporcional`;
}

function buildHeadings(keyword: ContentIntegratorKeyword, product: ProductCatalogItem): string[] {
  const term = normalize(keyword.termo);

  if (includesAny(term, ['medir', 'medida', 'tamanho', '150mm', '60mm'])) {
    return [
      'Por que medidas importam na escolha do oculos',
      'Como interpretar frontal, lente, ponte e haste',
      `Como comparar suas medidas com o ${product.nome}`,
      'Erros comuns ao comprar oculos largo online',
      'Quando entrar na lista de espera',
    ];
  }

  if (includesAny(term, ['aperta', 'lateral', 'tempora', 'temporas', 'machuca'])) {
    return [
      'Por que alguns oculos apertam nas laterais',
      'Quais medidas observar para reduzir desconforto',
      `Como o ${product.nome} usa frontal amplo como referencia`,
      'Como comparar com seu oculos atual',
      'Proximo passo para escolher com mais seguranca',
    ];
  }

  return [
    'Por que oculos comuns podem parecer pequenos em rosto largo',
    'Quais medidas observar antes de escolher',
    'Como comparar frontal, lente, ponte e haste',
    `Quando o ${product.nome} faz sentido como referencia`,
    'Como seguir para a lista de espera',
  ];
}

function inferSemanticTerms(input: ContentIntegratorInput): string[] {
  const fixedTerms = [
    'rosto largo',
    'largura frontal',
    'frontal 150mm',
    'lente 60mm',
    'armacao proporcional',
    'conforto nas temporas',
  ];

  const secondaryTerms = input.keywordsSecundarias
    .map((keyword) => keyword.termo.trim())
    .filter(Boolean)
    .slice(0, 5);

  return Array.from(new Set([...secondaryTerms, ...fixedTerms]));
}

export function integrateContent(input: ContentIntegratorInput): ContentIntegratorOutput {
  const keyword = input.keywordPrincipal.termo ? input.keywordPrincipal : { ...input.keywordPrincipal, termo: input.tema };
  const funil = classifyFunnel(keyword);
  const tipoConteudo = inferContentType(funil, keyword);
  const dorPrincipal = inferPrimaryPain({ ...input, keywordPrincipal: keyword });
  const provaConcreta = inferProof({ ...input, keywordPrincipal: keyword });
  const beneficioCentral = inferBenefit({ ...input, keywordPrincipal: keyword });
  const ctaSugerido = inferCta(funil, keyword, input.produto);

  return {
    anguloEditorial: `Mostrar como ${keyword.termo} pode ser avaliado com criterios de medida, conforto e proporcao antes da escolha do produto.`,
    tipoConteudo,
    funil,
    dorPrincipal,
    produtoAssociado: input.produto.nome,
    provaConcreta,
    beneficioCentral,
    objecaoPrincipal: inferObjection(keyword),
    ctaSugerido,
    tituloSugerido: buildTitle(keyword),
    h2Sugeridos: buildHeadings(keyword, input.produto),
    termosSemanticos: inferSemanticTerms(input),
    instrucoesRedator: [
      'Abrir com uma situacao concreta da persona antes de apresentar o produto.',
      'Traduzir medidas tecnicas em consequencias praticas para conforto, proporcao e decisao de compra.',
      `Usar o ${input.produto.nome} como exemplo pratico, nao como promessa universal.`,
      'Responder a objecao principal antes do CTA.',
    ],
    alertas: [
      'Nao prometer encaixe perfeito para todos os rostos.',
      'Nao inventar preco, estoque, desconto ou prazo.',
      'Nao usar volume de busca como prova de qualidade do produto.',
    ],
  };
}
