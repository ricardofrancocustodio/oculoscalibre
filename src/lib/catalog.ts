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
    url: '/',
  },
];

export function getProductById(id: string): ProductCatalogItem | null {
  return productCatalog.find((product) => product.id === id) ?? null;
}
