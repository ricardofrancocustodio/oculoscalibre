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
  const frontal = product.medidas.find((m) => normalize(m.label).includes('frontal'))?.value ?? '150 mm';

  if (includesAny(term, ['medir', 'medida', 'circunferencia', 'centimetro', '58cm', '59cm', '60cm', '61cm', '62cm'])) {
    return [
      'Por que a circunferencia da cabeca decide o oculos certo',
      'Como medir a circunferencia em casa com fita metrica',
      'Tabela: circunferencia x largura frontal indicada',
      'O que fazer quando sua medida fica no limite entre dois tamanhos',
      'Como entrar na lista de espera apos confirmar a medida',
    ];
  }

  if (includesAny(term, ['aperta', 'lateral', 'tempora', 'temporas', 'machuca', 'pressiona', 'dor de cabeca'])) {
    return [
      'Por que oculos comuns apertam nas temporas de quem tem cabeca grande',
      'Qual largura frontal elimina o aperto lateral',
      'Como comparar seu oculos atual com a medida certa',
      'Quanto tempo de uso causa dor de cabeca em armacao pequena',
      'Como escolher sem risco de aperto novamente',
    ];
  }

  if (includesAny(term, ['ponte', 'nariz', 'encaixa', 'desliza', 'cai', 'ajuste no nariz'])) {
    return [
      'Por que a ponte e a medida mais ignorada na compra de oculos',
      'Qual tamanho de ponte serve em cada tipo de nariz',
      'Como saber se a ponte do seu oculos atual esta correta',
      `Como a ponte do ${product.nome} foi calibrada`,
      'Como evitar que o oculos deslize ou marque o nariz',
    ];
  }

  if (includesAny(term, ['material', 'acetato', 'metal', 'tr90', 'titanio', 'policarbonato', 'nylon'])) {
    return [
      'Por que o material da armacao importa em cabecas grandes',
      'Diferenca entre acetato, metal e TR-90 em peso e flexibilidade',
      'Qual material dura mais em uso diario intenso',
      `Por que o ${product.nome} usa acetato italiano`,
      'Como cuidar do material para durar mais',
    ];
  }

  if (includesAny(term, ['masculino', 'homem', 'homen', 'masculin', 'para homem'])) {
    return [
      'Por que homens com rosto largo encontram menos opcoes de oculos',
      `Qual largura frontal funciona para cabecas masculinas acima de 58 cm`,
      'Estilos de armacao que ficam bem em rosto largo masculino',
      'Como comparar medidas antes de comprar online',
      'Como entrar na lista de espera com seguranca',
    ];
  }

  if (includesAny(term, ['feminino', 'mulher', 'feminina', 'para mulher'])) {
    return [
      'Por que mulheres com rosto largo encontram menos opcoes de oculos',
      'Qual largura frontal funciona para cabecas femininas acima de 57 cm',
      'Estilos que ficam proporcionais em rosto largo feminino',
      'Como comparar medidas antes de comprar online',
      'Como entrar na lista de espera com seguranca',
    ];
  }

  if (includesAny(term, ['formato', 'rosto redondo', 'rosto oval', 'rosto quadrado', 'rosto triangular'])) {
    return [
      'Como o formato do rosto influencia a escolha do oculos',
      'Por que largura frontal importa mais do que "formato de rosto"',
      'Armacoes que equilibram rosto largo em qualquer formato',
      'Como testar proporcao antes de comprar',
      'Proximo passo: medir antes de decidir',
    ];
  }

  if (includesAny(term, ['online', 'comprar', 'preco', 'valor', 'loja', 'onde comprar'])) {
    return [
      'Por que comprar oculos online exige atencao as medidas',
      'Quais medicoes confirmar antes de fechar a compra',
      'Como interpretar ficha tecnica sem errar o tamanho',
      'O que fazer se o oculos nao servir',
      'Como entrar na lista de espera com seguranca',
    ];
  }

  if (includesAny(term, ['haste', 'tempora', 'comprimento', 'dobra'])) {
    return [
      'Por que o comprimento da haste importa em cabecas grandes',
      `Qual tamanho de haste evita pressao atras da orelha`,
      'Como medir a haste do seu oculos atual',
      `Como a haste do ${product.nome} foi dimensionada`,
      'Como escolher sem erro de tamanho de haste',
    ];
  }

  // generic fallback — ainda especifico o suficiente para nao repetir entre posts
  const topicWord = keyword.termo.split(' ').slice(0, 2).join(' ');
  return [
    `Por que a maioria dos oculos nao serve para ${topicWord}`,
    'Quais tres medidas observar antes de escolher',
    `Como comparar frontal (${frontal}), lente, ponte e haste`,
    `Quando o ${product.nome} serve como referencia de medida`,
    'Como confirmar o tamanho certo antes de comprar',
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
