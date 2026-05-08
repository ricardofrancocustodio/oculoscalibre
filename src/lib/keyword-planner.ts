export interface KeywordSuggestion {
  termo: string;
  volumeMensal: string;
  dificuldade: string;
  intencao: 'informacional' | 'comercial' | 'transacional' | 'navegacional';
  fonte: string;
}

const MOCK_KEYWORDS: KeywordSuggestion[] = [
  { termo: 'oculos de sol para rosto largo', volumeMensal: '1.2k', dificuldade: 'Media', intencao: 'comercial', fonte: 'Mock Keyword Planner' },
  { termo: 'oculos de sol masculino para rosto largo', volumeMensal: '800', dificuldade: 'Baixa', intencao: 'comercial', fonte: 'Mock Keyword Planner' },
  { termo: 'oculos de sol feminino para rosto largo', volumeMensal: '950', dificuldade: 'Baixa', intencao: 'comercial', fonte: 'Mock Keyword Planner' },
  { termo: 'como medir o rosto para oculos', volumeMensal: '2.5k', dificuldade: 'Alta', intencao: 'informacional', fonte: 'Mock Keyword Planner' },
  { termo: 'melhores marcas de oculos para rosto grande', volumeMensal: '450', dificuldade: 'Media', intencao: 'comercial', fonte: 'Mock Keyword Planner' },
  { termo: 'oculos de grau para rosto largo', volumeMensal: '1.1k', dificuldade: 'Media', intencao: 'comercial', fonte: 'Mock Keyword Planner' },
  { termo: 'armacao de acetato premium', volumeMensal: '300', dificuldade: 'Baixa', intencao: 'transacional', fonte: 'Mock Keyword Planner' },
  { termo: 'oculos que nao apertam na tempora', volumeMensal: '150', dificuldade: 'Muito Baixa', intencao: 'informacional', fonte: 'Mock Keyword Planner' },
  { termo: 'medidas de oculos de sol', volumeMensal: '5.4k', dificuldade: 'Alta', intencao: 'informacional', fonte: 'Mock Keyword Planner' },
  { termo: 'oculos aviador para rosto largo', volumeMensal: '200', dificuldade: 'Baixa', intencao: 'comercial', fonte: 'Mock Keyword Planner' },
  { termo: 'oculos quadrado para rosto redondo', volumeMensal: '3.2k', dificuldade: 'Media', intencao: 'informacional', fonte: 'Mock Keyword Planner' },
  { termo: 'tamanho de oculos 60mm', volumeMensal: '120', dificuldade: 'Baixa', intencao: 'transacional', fonte: 'Mock Keyword Planner' },
];

export function searchMockKeywords(query: string): KeywordSuggestion[] {
  if (!query) return [];
  const normalizedQuery = query.toLowerCase().trim();

  return MOCK_KEYWORDS
    .filter(kw => kw.termo.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => {
      const aStarts = a.termo.toLowerCase().startsWith(normalizedQuery);
      const bStarts = b.termo.toLowerCase().startsWith(normalizedQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });
}

export const searchKeywords = searchMockKeywords;
