export interface ProductCatalogItem {
  id: string;
  nome: string;
  medidaReferencia: string;
  categoria: string;
  descricao: string;
  medidas: Array<{ label: string; value: string }>;
  problemasResolvidos: string[];
  beneficios: string[];
  url: string;
  /** Ex: "349.90" — preencher quando produto estiver à venda */
  price?: string;
  /** Status de estoque */
  stock?: 'InStock' | 'PreOrder' | 'OutOfStock';
  /** Preencher quando houver reviews reais */
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  /** URL da imagem do produto para feeds */
  imagemUrl?: string;
  /** Galeria do produto (caminhos absolutos a partir de /public) */
  imagens?: string[];
  /** Variantes de tamanho (ex: Presence S/M-L/XXL) */
  variantes?: Array<{ tamanho: string; frontal: string; haste: string; lente: string }>;
}

export const productCatalog: ProductCatalogItem[] = [
  {
    id: 'mb-1572s',
    nome: 'MB-1572S',
    medidaReferencia: 'Frontal 150–158 mm',
    categoria: 'Oculos de sol em acetato premium',
    descricao: 'Modelo de oculos de sol com frontal amplo, pensado para quem sente que armacoes comuns ficam pequenas ou apertadas.',
    medidas: [
      { label: 'Frontal total', value: '150.7mm' },
      { label: 'Largura da lente', value: '60mm' },
      { label: 'Altura do frame', value: '50mm' },
      { label: 'Ponte', value: '24mm' },
      { label: 'Comprimento da haste', value: '145mm' },
      { label: 'Peso', value: '40g' },
    ],
    problemasResolvidos: [
      'armacao comum aperta nas temporas',
      'oculos parece pequeno no rosto',
      'dificuldade para encontrar oculos de sol para rosto largo',
      'falta de referencia clara de medidas antes da compra',
    ],
    beneficios: [
      'encaixe mais proporcional em rostos largos',
      'mais conforto por causa do frontal amplo',
      'visual premium em acetato preto',
      'proteção UV400 para uso diario',
    ],
    url: '/produto/mb-1572s',
    price: '449',
    stock: 'PreOrder',
    imagemUrl: '/img/oculos/fotoscalibre/20260505_184758.jpg',
    imagens: [
      '/img/oculos/fotoscalibre/20260505_184758.jpg',
      '/img/oculos/fotoscalibre/fundo branco/20260510_130537-removebg-preview.png',
      '/img/oculos/fotoscalibre/20260505_184805.jpg',
      '/img/oculos/fotoscalibre/20260505_184813.jpg',
      '/img/oculos/fotoscalibre/20260510_130608.jpg',
    ],
  },
  {
    id: 'viking',
    nome: 'Viking ZN3828',
    medidaReferencia: 'Frontal 151mm',
    categoria: 'Oculos de sol estilo mascara',
    descricao: 'Oculos estilo mascara oversized em policarbonato de alta resistencia. Lentes polarizadas UV400 com revestimento espelhado e anti-reflexo.',
    medidas: [
      { label: 'Frontal total', value: '151mm' },
      { label: 'Largura da lente', value: '60mm' },
      { label: 'Ponte', value: '14mm' },
      { label: 'Comprimento da haste', value: '142mm' },
      { label: 'Peso', value: '43g' },
    ],
    problemasResolvidos: [
      'armacao comum aperta nas temporas',
      'falta de estilo mascara para rostos largos',
      'dificuldade de encontrar oculos oversized masculinos',
    ],
    beneficios: [
      'protecao UV400 completa',
      'lentes polarizadas com anti-reflexo e espelho',
      'armacao em policarbonato de alta resistencia',
      'encaixe proporcional para frontais acima de 150mm',
    ],
    url: '/produto/viking',
    stock: 'PreOrder',
    imagemUrl: '/img/oculos/fotoscalibre/fundo branco/viking/1778079940314.png',
    imagens: [
      '/img/oculos/fotoscalibre/fundo branco/viking/1778079940314.png',
      '/img/oculos/fotoscalibre/fundo branco/viking/Gemini_Generated_Image_1cr10z1cr10z1cr1.png',
      '/img/oculos/fotoscalibre/fundo branco/viking/Gemini_Generated_Image_2vnn6j2vnn6j2vnn.png',
      '/img/oculos/fotoscalibre/fundo branco/viking/Gemini_Generated_Image_j3y9ggj3y9ggj3y9.png',
      '/img/oculos/fotoscalibre/fundo branco/viking/Gemini_Generated_Image_pr4llqpr4llqpr4l.png',
    ],
  },
  {
    id: 'presence',
    nome: 'Presence',
    medidaReferencia: 'Frontal 138–158mm (S / M-L / XXL)',
    categoria: 'Oculos de sol retangular',
    descricao: 'Oculos estilo retangulo disponivel em 3 tamanhos: S (138mm), M-L (148mm) e XXL (158mm). O encaixe certo para cada rosto.',
    medidas: [
      { label: 'Frontal (S)',   value: '138mm' },
      { label: 'Frontal (M-L)', value: '148mm' },
      { label: 'Frontal (XXL)', value: '158mm' },
      { label: 'Haste (S)',    value: '135mm' },
      { label: 'Haste (M-L)', value: '136mm' },
      { label: 'Haste (XXL)', value: '150mm' },
      { label: 'Lente (S)',   value: '60×42.5mm' },
      { label: 'Lente (M-L)', value: '64×44mm' },
      { label: 'Lente (XXL)', value: '69×47mm' },
    ],
    problemasResolvidos: [
      'armacao unica nao serve para diferentes tamanhos de rosto',
      'falta de oculos retangular para rostos grandes',
    ],
    beneficios: [
      '3 tamanhos para encaixe preciso',
      'estilo retangulo classico e versatil',
      'protecao UV400',
      'compativel com frontais entre 138mm e 158mm',
    ],
    url: '/produto/presence',
    stock: 'PreOrder',
    imagemUrl: '/img/oculos/fotoscalibre/fundo branco/presence/Gemini_Generated_Image_8x6czt8x6czt8x6c.png',
    imagens: [
      '/img/oculos/fotoscalibre/fundo branco/presence/Gemini_Generated_Image_8x6czt8x6czt8x6c.png',
      '/img/oculos/fotoscalibre/fundo branco/presence/Gemini_Generated_Image_alr1dfalr1dfalr1.png',
      '/img/oculos/fotoscalibre/fundo branco/presence/Gemini_Generated_Image_dlwz1sdlwz1sdlwz.png',
      '/img/oculos/fotoscalibre/fundo branco/presence/Gemini_Generated_Image_vi1ad8vi1ad8vi1a.png',
    ],
    variantes: [
      { tamanho: 'S',   frontal: '138mm', haste: '135mm', lente: '60×42.5mm' },
      { tamanho: 'M-L', frontal: '148mm', haste: '136mm', lente: '64×44mm'   },
      { tamanho: 'XXL', frontal: '158mm', haste: '150mm', lente: '69×47mm'   },
    ],
  },
];

export function getProductById(id: string): ProductCatalogItem | null {
  return productCatalog.find((product) => product.id === id) ?? null;
}
